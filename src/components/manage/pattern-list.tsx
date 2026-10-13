'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LayoutList, Loader2, MoreVertical, Pencil, Sparkles, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import { deletePattern, renamePattern } from '@/lib/actions/patterns'
import {
  PATTERN_NAME_MAX,
  findPatternByName,
  patternNameError,
  sortPatterns,
  type UnitPattern,
} from '@/lib/units/patterns'

interface PatternListProps {
  patterns: UnitPattern[]
}

export function PatternList({ patterns: initialPatterns }: PatternListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [patterns, setPatterns] = React.useState(initialPatterns)
  const [renameTarget, setRenameTarget] = React.useState<UnitPattern | null>(null)
  const [renameValue, setRenameValue] = React.useState('')
  const [renameError, setRenameError] = React.useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<UnitPattern | null>(null)
  const [busy, setBusy] = React.useState(false)

  // Frische Daten vom Server (nach einem Auffrischen) lösen den lokalen Stand ab.
  React.useEffect(() => setPatterns(initialPatterns), [initialPatterns])

  function openRename(pattern: UnitPattern) {
    setRenameTarget(pattern)
    setRenameValue(pattern.name)
    setRenameError(null)
  }

  /** Ein Eintrag, den es nicht mehr gibt: sagen und die Liste auffrischen. */
  function handleGone(message: string) {
    toast({ variant: 'destructive', title: message })
    setRenameTarget(null)
    setDeleteTarget(null)
    router.refresh()
  }

  async function handleRename(event: React.FormEvent) {
    event.preventDefault()
    if (!renameTarget) return

    const formError = patternNameError(renameValue)
    if (formError) return setRenameError(formError)
    if (findPatternByName(patterns, renameValue, renameTarget.id)) {
      return setRenameError(`Ein Stundenmuster „${renameValue.trim()}“ gibt es schon.`)
    }

    setBusy(true)
    try {
      const result = await renamePattern(renameTarget.id, renameValue)
      if ('error' in result) {
        if (result.gone) return handleGone(result.error)
        return setRenameError(result.error)
      }
      setPatterns((prev) =>
        sortPatterns(prev.map((p) => (p.id === renameTarget.id ? { ...p, name: result.name } : p)))
      )
      toast({ title: `Umbenannt in „${result.name}“` })
      setRenameTarget(null)
    } catch {
      setRenameError('Keine Verbindung — es wurde nichts geändert.')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setBusy(true)
    try {
      const result = await deletePattern(deleteTarget.id)
      if ('error' in result) {
        if (result.gone) return handleGone(result.error)
        toast({ variant: 'destructive', title: 'Nicht gelöscht', description: result.error })
        return
      }
      setPatterns((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      toast({ title: `Stundenmuster „${deleteTarget.name}“ gelöscht` })
      setDeleteTarget(null)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Nicht gelöscht',
        description: 'Keine Verbindung — es wurde nichts geändert.',
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Ein Stundenmuster ist ein Zeitverlauf, den du im Generator unter einem Namen abgelegt
        hast. Du kannst es dort auf jede Gruppe setzen — die Minuten werden auf deren
        Einheitsdauer umgerechnet. Den Aufbau änderst du im Generator: Muster laden, anpassen,
        „Stundenmuster speichern“ und überschreiben.
      </p>

      {patterns.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mb-4 inline-block rounded-full bg-muted p-4">
            <LayoutList className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mb-2 text-xl font-semibold">Noch kein Stundenmuster</h2>
          <p className="mx-auto mb-6 max-w-md text-muted-foreground">
            Hat sich der Aufbau einer Stunde bewährt, musst du ihn nicht jede Woche neu
            zusammenziehen: Richte im Generator unter „Individuell“ den Zeitverlauf ein und wähle
            „Stundenmuster speichern“.
          </p>
          <Button asChild>
            <Link href="/units/new">
              <Sparkles className="mr-2 h-4 w-4" />
              Zum Generator
            </Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {patterns.map((pattern) => (
            <li key={pattern.id} className="flex items-start justify-between gap-2 rounded-lg border p-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="break-words font-medium">{pattern.name}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                    {pattern.totalMinutes} Min
                  </span>
                </div>
                <ol className="flex flex-wrap gap-1" aria-label="Aufbau">
                  {pattern.segments.map((segment, index) => (
                    <li
                      key={index}
                      className={`rounded-md px-2 py-0.5 text-xs ${
                        segment.fillMode === 'empty'
                          ? 'border border-dashed text-muted-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      }`}
                    >
                      {segment.name} · {segment.minutes} Min
                      {segment.fillMode === 'empty' && ' · frei'}
                    </li>
                  ))}
                </ol>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={`Aktionen für ${pattern.name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => openRename(pattern)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Umbenennen
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setDeleteTarget(pattern)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!renameTarget} onOpenChange={(open) => !open && !busy && setRenameTarget(null)}>
        <DialogContent>
          <form onSubmit={handleRename} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Stundenmuster umbenennen</DialogTitle>
              <DialogDescription>
                Der Aufbau bleibt, wie er ist. Der neue Name gilt auch in der Auswahl des
                Generators.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="pattern-rename">Name</Label>
              <Input
                id="pattern-rename"
                value={renameValue}
                onChange={(e) => {
                  setRenameValue(e.target.value)
                  setRenameError(null)
                }}
                maxLength={PATTERN_NAME_MAX + 20}
                aria-invalid={!!renameError}
                aria-describedby={renameError ? 'pattern-rename-error' : undefined}
                autoFocus
              />
              {renameError && (
                <p id="pattern-rename-error" className="text-sm text-destructive">
                  {renameError}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRenameTarget(null)} disabled={busy}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Umbenennen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && !busy && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stundenmuster „{deleteTarget?.name}“ löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Es steht danach nicht mehr in der Auswahl des Generators. Einheiten, die mit dem
              Muster entstanden sind, bleiben, wie sie sind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <Button variant="destructive" onClick={handleDelete} disabled={busy}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Löschen
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
