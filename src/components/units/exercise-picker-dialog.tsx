'use client'

import * as React from 'react'
import { Check, ChevronDown, Loader2, Plus, RotateCw, TriangleAlert } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ExerciseFactsRow } from '@/components/exercises/exercise-facts-row'
import {
  QuickCreateExerciseForm,
  type QuickCreateDefaults,
  type QuickCreateInput,
  type QuickCreateResult,
} from './quick-create-exercise-form'
import {
  failureLabel,
  groupForPicker,
  keyOf,
  passes,
  type EditorCandidate,
  type PickerEntry,
} from '@/lib/units/editor-pool'

interface ExercisePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  segmentName: string
  /** null, solange die Liste dieses Segments nicht geladen ist. */
  pool: EditorCandidate[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
  /** Der Kandidat, der derzeit im Platz steht — als gewählt erkennbar. */
  currentKey: string | null
  /** Übungen, die in dieser Einheit schon stehen — nur ein Hinweis, keine Sperre. */
  usedExerciseIds: Set<string>
  quickCreateDefaults: QuickCreateDefaults
  onPick: (candidate: EditorCandidate) => void
  onQuickCreate: (input: QuickCreateInput) => Promise<QuickCreateResult>
}

/**
 * Der Auswahldialog: oben die passenden Übungen mit ihrer Anzahl im Titel,
 * darunter aufklappbar die übrigen — jede mit der Begründung, woran sie
 * scheitert.
 *
 * **Eine Zeile je Übung.** Grundübung und Varianten stehen zusammen; die Zeile
 * gilt als passend, sobald eine ihrer Formen passt. Über „Varianten (n)" lässt
 * sich jede Form einzeln einsetzen.
 *
 * Eine unpassende Übung wird ohne zweite Bestätigung eingesetzt: der
 * Übungsleiter behält das letzte Wort über seine eigene Erfahrung. Die
 * Begründung steht da, um zu erklären, nicht um zu bremsen.
 */
export function ExercisePickerDialog({
  open,
  onOpenChange,
  segmentName,
  pool,
  loading,
  error,
  onRetry,
  currentKey,
  usedExerciseIds,
  quickCreateDefaults,
  onPick,
  onQuickCreate,
}: ExercisePickerDialogProps) {
  const [search, setSearch] = React.useState('')
  const [showOthers, setShowOthers] = React.useState(false)
  const [creating, setCreating] = React.useState(false)

  // Jedes Öffnen beginnt frisch — ein Suchbegriff von letztem Mal würde die
  // Liste scheinbar leer aussehen lassen.
  React.useEffect(() => {
    if (open) {
      setSearch('')
      setShowOthers(false)
      setCreating(false)
    }
  }, [open])

  const { fitting, others } = React.useMemo(
    () => groupForPicker(pool ?? [], search),
    [pool, search]
  )

  const empty = pool !== null && pool.length === 0
  const noHits = pool !== null && pool.length > 0 && fitting.length === 0 && others.length === 0

  function pick(candidate: EditorCandidate) {
    onPick(candidate)
    onOpenChange(false)
  }

  const renderEntry = (entry: PickerEntry) => (
    <PickerRow
      key={entry.exerciseId}
      entry={entry}
      currentKey={currentKey}
      alreadyUsed={usedExerciseIds.has(entry.exerciseId)}
      onPick={pick}
    />
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1 border-b p-4">
          <DialogTitle>
            {creating ? 'Übung schnell anlegen' : `Übung für „${segmentName}"`}
          </DialogTitle>
          <DialogDescription>
            {creating
              ? 'Name, Dauer und eine kurze Beschreibung genügen — der Rest kommt aus dem Abschnitt.'
              : 'Passende Übungen zuerst. Du kannst auch eine unpassende wählen.'}
          </DialogDescription>
        </DialogHeader>

        {creating ? (
          <div className="overflow-y-auto p-4">
            <QuickCreateExerciseForm
              initialName={search}
              defaults={quickCreateDefaults}
              onCreate={onQuickCreate}
              onUseExisting={pick}
              onCancel={() => setCreating(false)}
            />
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Übungen werden geladen …
          </div>
        ) : error ? (
          <div className="space-y-3 p-4">
            <Alert variant="destructive">
              <TriangleAlert className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RotateCw className="mr-2 h-4 w-4" />
              Erneut versuchen
            </Button>
          </div>
        ) : empty ? (
          <div className="space-y-3 p-6 text-center">
            <p className="text-sm font-medium">Du hast noch keine Übungen angelegt</p>
            <p className="text-xs text-muted-foreground">
              Der Generator und der Editor schöpfen aus deiner eigenen Übungsdatenbank.
              Lege hier gleich die erste an — sie bleibt dir für die nächsten Stunden
              erhalten.
            </p>
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Übung schnell anlegen
            </Button>
          </div>
        ) : (
          <Command shouldFilter={false} className="flex-1 overflow-hidden">
            <CommandInput
              placeholder="Übung oder Variante suchen …"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList className="max-h-none flex-1 overflow-y-auto">
              {noHits && (
                <CommandEmpty className="space-y-3 py-6 text-center">
                  <p className="text-sm">Keine Übung gefunden.</p>
                  <Button size="sm" onClick={() => setCreating(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Übung fehlt? Schnell anlegen
                  </Button>
                </CommandEmpty>
              )}

              {fitting.length > 0 && (
                <CommandGroup heading={`Passend (${fitting.length})`}>
                  {fitting.map(renderEntry)}
                </CommandGroup>
              )}

              {others.length > 0 && (
                <div className="border-t">
                  <Collapsible open={showOthers} onOpenChange={setShowOthers}>
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-muted-foreground"
                      >
                        <ChevronDown
                          className={`mr-2 h-3.5 w-3.5 transition-transform ${
                            showOthers ? 'rotate-180' : ''
                          }`}
                        />
                        Auch unpassende anzeigen ({others.length})
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CommandGroup>{others.map(renderEntry)}</CommandGroup>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              )}

              {!noHits && (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-xs text-muted-foreground"
                    onClick={() => setCreating(true)}
                  >
                    <Plus className="mr-2 h-3.5 w-3.5" />
                    Übung fehlt? Schnell anlegen
                  </Button>
                </div>
              )}
            </CommandList>
          </Command>
        )}
      </DialogContent>
    </Dialog>
  )
}

function PickerRow({
  entry,
  currentKey,
  alreadyUsed,
  onPick,
}: {
  entry: PickerEntry
  currentKey: string | null
  alreadyUsed: boolean
  onPick: (candidate: EditorCandidate) => void
}) {
  const { preferred, forms } = entry
  const base = forms[0]
  const current = forms.find((form) => keyOf(form) === currentKey)
  const note = (form: EditorCandidate) =>
    passes(form) ? undefined : `passt nicht: ${failureLabel(form)}`

  return (
    <div className="border-b last:border-b-0">
      {/* Ein Klick auf die Zeile setzt die Form ein, die sie nennt: die
          Grundübung, wenn sie passt, sonst die erste passende Variante. */}
      <CommandItem
        value={entry.exerciseId}
        onSelect={() => onPick(preferred)}
        className="items-start gap-2"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5">
            {current && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
            <span className="truncate text-sm font-medium">{entry.name}</span>
            {base.needsCompletion && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                noch zu ergänzen
              </Badge>
            )}
            <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
              {preferred.duration} Min
            </span>
          </div>

          {preferred.variantTitle && (
            <p className="text-xs text-muted-foreground">
              Eingesetzt wird die Variante: {preferred.variantTitle}
              {entry.fits && ' — die Grundübung passt hier nicht'}
            </p>
          )}

          {!entry.fits && (
            <p className="text-xs text-amber-600 dark:text-amber-500">
              passt nicht: {failureLabel(base)}
            </p>
          )}
          {alreadyUsed && !current && (
            <p className="text-xs text-muted-foreground">
              Steht in dieser Einheit schon — einsetzen ist trotzdem möglich.
            </p>
          )}
        </div>
      </CommandItem>

      {/* Außerhalb der klickbaren Zeile: „Varianten (n)" klappt auf, ohne die
          Übung einzusetzen. */}
      <ExerciseFactsRow
        className="px-2 pb-2"
        materials={preferred.materials.map((material) => ({ name: material.name }))}
        organizationForms={preferred.organizationForms}
        variants={forms
          .filter((form) => form.variantId !== null)
          .map((form) => ({
            id: form.variantId as string,
            title: form.variantTitle ?? 'Variante',
            note: note(form),
          }))}
        currentVariantId={current ? current.variantId : undefined}
        baseNote={note(base)}
        onSelect={(variantId) => {
          const form = forms.find((candidate) => candidate.variantId === variantId)
          if (form) onPick(form)
        }}
      />
    </div>
  )
}
