'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Loader2, MoreVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import {
  createCategory,
  deleteCategory,
  getCategoryUsages,
  renameCategory,
} from '@/lib/actions/categories'
import {
  CATEGORY_LABELS,
  CATEGORY_TYPES,
  USAGE_HEADINGS,
  USAGE_KINDS,
  categoryAnchor,
  categoryNameError,
  categoryNameMax,
  conflictMessage,
  findNameConflict,
  sortCategories,
  totalUsage,
  usageSummary,
  type CategoryType,
  type CategoryUsages,
  type CustomCategory,
  type NameConflict,
} from '@/lib/manage/categories'

const NO_CONNECTION = 'Keine Verbindung — es wurde nichts geändert.'

type UsageState = 'loading' | CategoryUsages | null

type DialogState =
  | { kind: 'create'; type: CategoryType }
  | { kind: 'usages'; category: CustomCategory }
  | { kind: 'rename'; category: CustomCategory }
  | { kind: 'delete'; category: CustomCategory }
  | null

interface CategoryManagerProps {
  categories: CustomCategory[]
}

export function CategoryManager({ categories: initialCategories }: CategoryManagerProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = React.useState(initialCategories)
  const [dialog, setDialog] = React.useState<DialogState>(null)
  const [busy, setBusy] = React.useState(false)
  const [name, setName] = React.useState('')
  const [fieldError, setFieldError] = React.useState<string | null>(null)
  /** Gesetzt, sobald der neue Name einem vorhandenen Begriff gleicht und nachgefragt wird. */
  const [mergeWith, setMergeWith] = React.useState<NameConflict | null>(null)
  const [usages, setUsages] = React.useState<UsageState>(null)

  React.useEffect(() => setCategories(initialCategories), [initialCategories])

  const target = dialog && dialog.kind !== 'create' ? dialog.category : null
  const targetId = target?.id ?? null
  const needsUsages = dialog?.kind === 'usages' || dialog?.kind === 'delete' || dialog?.kind === 'rename'

  // Die Namen der betroffenen Einträge werden erst geholt, wenn ein Dialog sie braucht.
  React.useEffect(() => {
    if (!targetId || !needsUsages) return
    let cancelled = false
    setUsages('loading')
    getCategoryUsages(targetId)
      .then((result) => !cancelled && setUsages(result))
      .catch(() => !cancelled && setUsages(null))
    return () => {
      cancelled = true
    }
  }, [targetId, needsUsages])

  function open(next: DialogState) {
    setDialog(next)
    setName(next && next.kind === 'rename' ? next.category.name : '')
    setFieldError(null)
    setMergeWith(null)
  }

  function close() {
    if (busy) return
    setDialog(null)
  }

  function namesOf(type: CategoryType): string[] {
    return categories.filter((c) => c.type === type).map((c) => c.name)
  }

  function handleGone(message: string) {
    toast({ variant: 'destructive', title: message })
    setDialog(null)
    router.refresh()
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    if (dialog?.kind !== 'create') return
    const type = dialog.type

    const formError = categoryNameError(type, name)
    if (formError) return setFieldError(formError)
    const conflict = findNameConflict(type, name, namesOf(type))
    if (conflict) return setFieldError(conflictMessage(conflict))

    setBusy(true)
    try {
      const result = await createCategory(type, name)
      if ('error' in result) return setFieldError(result.error)
      setCategories((prev) => sortCategories([...prev, result.category]))
      toast({
        title: `„${result.category.name}“ angelegt`,
        description: `Steht ab sofort in jeder Auswahl für ${CATEGORY_LABELS[type].plural}.`,
      })
      setDialog(null)
    } catch {
      setFieldError(NO_CONNECTION)
    } finally {
      setBusy(false)
    }
  }

  async function handleRename(event: React.FormEvent) {
    event.preventDefault()
    if (dialog?.kind !== 'rename') return
    const category = dialog.category

    const formError = categoryNameError(category.type, name)
    if (formError) return setFieldError(formError)
    if (name.trim() === category.name) return setDialog(null)

    // Erst nachfragen, dann zusammenführen — der Schritt ist nicht umkehrbar.
    const conflict = findNameConflict(category.type, name, namesOf(category.type), category.name)
    if (conflict && !mergeWith) return setMergeWith(conflict)

    setBusy(true)
    try {
      const result = await renameCategory(category.id, name, !!mergeWith)
      if ('conflict' in result) return setMergeWith(result.conflict)
      if ('error' in result) {
        if (result.gone) return handleGone(result.error)
        setMergeWith(null)
        return setFieldError(result.error)
      }

      const entries =
        result.affected === 1 ? '1 Eintrag ist mitgezogen.' : `${result.affected} Einträge sind mitgezogen.`
      toast({
        title: result.merged
          ? `„${category.name}“ mit „${result.name}“ zusammengeführt`
          : `„${category.name}“ heißt jetzt „${result.name}“`,
        description: result.affected === 0 ? 'Der Begriff wurde nirgends verwendet.' : entries,
      })
      setDialog(null)
      // Zahlen und Liste kommen frisch vom Server — nach einem Zusammenführen
      // ändern sich auch die Zahlen des verbliebenen Begriffs.
      router.refresh()
    } catch {
      setMergeWith(null)
      setFieldError(NO_CONNECTION)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (dialog?.kind !== 'delete') return
    const category = dialog.category
    setBusy(true)
    try {
      const result = await deleteCategory(category.id)
      if ('error' in result) {
        if (result.gone) return handleGone(result.error)
        toast({ variant: 'destructive', title: 'Nicht gelöscht', description: result.error })
        return
      }
      setCategories((prev) => prev.filter((c) => c.id !== category.id))
      toast({
        title: `„${category.name}“ aus den Auswahllisten entfernt`,
        description: 'Wo der Begriff schon stand, bleibt er stehen.',
      })
      setDialog(null)
    } catch {
      toast({ variant: 'destructive', title: 'Nicht gelöscht', description: NO_CONNECTION })
    } finally {
      setBusy(false)
    }
  }

  const used = target?.usage ? totalUsage(target.usage) > 0 : false

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Hier stehen die Begriffe, die du selbst eingetippt hast — beim Anlegen einer Übung, einer
        Gruppe, einer Halle oder einer Phase im Generator. Sie erscheinen danach in jeder
        Auswahlliste ihrer Art. Die mitgelieferten Begriffe der App sind fest und stehen deshalb
        nicht hier.
      </p>

      {CATEGORY_TYPES.map((type) => {
        const entries = categories.filter((c) => c.type === type)
        const labels = CATEGORY_LABELS[type]
        return (
          <section key={type} id={categoryAnchor(type)} className="scroll-mt-24 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{labels.plural}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => open({ kind: 'create', type })}
                aria-label={`${labels.singular} anlegen`}
              >
                <Plus className="mr-2 h-4 w-4" />
                Anlegen
              </Button>
            </div>

            {entries.length === 0 ? (
              <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                In dieser Art hast du noch nichts Eigenes angelegt.
              </p>
            ) : (
              <ul className="divide-y rounded-lg border">
                {entries.map((category) => {
                  const summary = category.usage ? usageSummary(category.usage) : null
                  return (
                    <li key={category.id} className="flex items-center justify-between gap-2 px-4 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="break-words font-medium">{category.name}</p>
                        {summary !== null &&
                          (summary === '' ? (
                            <Badge variant="outline" className="mt-0.5 font-normal text-muted-foreground">
                              unbenutzt
                            </Badge>
                          ) : (
                            <p className="text-xs text-muted-foreground">{summary}</p>
                          ))}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="shrink-0"
                            aria-label={`Aktionen für ${category.name}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => open({ kind: 'usages', category })}>
                            <Eye className="mr-2 h-4 w-4" />
                            Verwendungen ansehen
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => open({ kind: 'rename', category })}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Umbenennen
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => open({ kind: 'delete', category })}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}

      {/* Anlegen */}
      <Dialog open={dialog?.kind === 'create'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent>
          {dialog?.kind === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <DialogHeader>
                <DialogTitle>{CATEGORY_LABELS[dialog.type].singular} anlegen</DialogTitle>
                <DialogDescription>
                  Der Begriff steht danach in jeder Auswahl für{' '}
                  {CATEGORY_LABELS[dialog.type].plural} bereit.
                </DialogDescription>
              </DialogHeader>
              <NameField
                id="category-create"
                value={name}
                max={categoryNameMax(dialog.type)}
                error={fieldError}
                onChange={(value) => {
                  setName(value)
                  setFieldError(null)
                }}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={close} disabled={busy}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Anlegen
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Verwendungen ansehen */}
      <Dialog open={dialog?.kind === 'usages'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Wo „{target?.name}“ steht</DialogTitle>
            <DialogDescription>
              {target?.usage && !used
                ? 'Dieser Begriff wird nirgends verwendet.'
                : 'Die Einträge, die diesen Begriff tragen.'}
            </DialogDescription>
          </DialogHeader>
          <UsageList usages={usages} />
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Umbenennen und Zusammenführen */}
      <Dialog open={dialog?.kind === 'rename'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent>
          {dialog?.kind === 'rename' && (
            <form onSubmit={handleRename} className="space-y-4">
              {mergeWith ? (
                <>
                  <DialogHeader>
                    <DialogTitle>„{mergeWith.name}“ gibt es schon. Zusammenführen?</DialogTitle>
                    <DialogDescription>
                      Überall, wo bisher „{dialog.category.name}“ steht, steht danach „
                      {mergeWith.name}“
                      {mergeWith.kind === 'predefined' ? ' — ein mitgelieferter Begriff' : ''}. „
                      {dialog.category.name}“ verschwindet aus der Verwaltung und den
                      Auswahllisten. Das lässt sich nicht rückgängig machen.
                    </DialogDescription>
                  </DialogHeader>
                  <UsageList usages={usages} />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMergeWith(null)}
                      disabled={busy}
                    >
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={busy}>
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Zusammenführen
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>
                      {CATEGORY_LABELS[dialog.category.type].singular} umbenennen
                    </DialogTitle>
                    <DialogDescription>
                      Der neue Name gilt überall, wo der Begriff steht — in Übungen, Gruppen,
                      Hallen, Einheiten und Stundenmustern.
                      {dialog.category.usage &&
                        (used
                          ? ` Betroffen: ${usageSummary(dialog.category.usage)}.`
                          : ' Der Begriff wird bisher nirgends verwendet.')}
                    </DialogDescription>
                  </DialogHeader>
                  <NameField
                    id="category-rename"
                    value={name}
                    max={categoryNameMax(dialog.category.type)}
                    error={fieldError}
                    onChange={(value) => {
                      setName(value)
                      setFieldError(null)
                    }}
                  />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={close} disabled={busy}>
                      Abbrechen
                    </Button>
                    <Button type="submit" disabled={busy}>
                      {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Umbenennen
                    </Button>
                  </DialogFooter>
                </>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Löschen */}
      <Dialog open={dialog?.kind === 'delete'} onOpenChange={(isOpen) => !isOpen && close()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>„{target?.name}“ löschen?</DialogTitle>
            <DialogDescription>
              {target?.usage && !used
                ? 'Der Begriff wird nirgends verwendet und verschwindet aus den Auswahllisten.'
                : 'Der Begriff verschwindet nur aus den Auswahllisten. Wo er schon steht, bleibt er stehen — an deinen Übungen, Gruppen, Hallen, Einheiten und Stundenmustern ändert sich nichts.'}
            </DialogDescription>
          </DialogHeader>
          {!(target?.usage && !used) && <UsageList usages={usages} />}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={close} disabled={busy}>
              Abbrechen
            </Button>
            {!(target?.usage && !used) && target && (
              <Button
                variant="outline"
                onClick={() => open({ kind: 'rename', category: target })}
                disabled={busy}
              >
                Stattdessen umbenennen
              </Button>
            )}
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function NameField({
  id,
  value,
  max,
  error,
  onChange,
}: {
  id: string
  value: string
  max: number
  error: string | null
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Name</Label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        // Etwas Luft über der Grenze, damit die Meldung sie nennen kann,
        // statt dass das Feld stumm abschneidet.
        maxLength={max + 20}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoFocus
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

/** Die betroffenen Einträge mit Namen, nach Sorte gegliedert. */
function UsageList({ usages }: { usages: UsageState }) {
  if (usages === 'loading') {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verwendungen werden geladen…
      </p>
    )
  }
  if (usages === null) {
    return (
      <p className="text-sm text-muted-foreground">
        Die betroffenen Einträge lassen sich gerade nicht auflisten.
      </p>
    )
  }

  const kinds = USAGE_KINDS.filter((kind) => usages[kind].length > 0)
  if (kinds.length === 0) return null

  return (
    <div className="max-h-56 space-y-3 overflow-y-auto rounded-md border p-3 text-sm">
      {kinds.map((kind) => (
        <div key={kind}>
          <p className="font-medium">
            {USAGE_HEADINGS[kind]} ({usages[kind].length})
          </p>
          <ul className="list-inside list-disc text-muted-foreground">
            {usages[kind].map((entry, index) => (
              <li key={index} className="break-words">
                {entry}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
