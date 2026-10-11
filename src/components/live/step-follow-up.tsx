'use client'

import * as React from 'react'
import Link from 'next/link'
import { Clock, Loader2, NotebookPen, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { ExerciseUsageWarning } from '@/components/exercises/exercise-usage-warning'
import { useToast } from '@/hooks/use-toast'
import { deleteExercise } from '@/lib/actions/exercises'
import {
  adoptExerciseDuration,
  appendExerciseNote,
  getFollowUpExercise,
  type FollowUpExercise,
  type FollowUpTarget,
} from '@/lib/actions/live'
import { formatClock, roundToMinutes } from '@/lib/live/clock'
import type { AdoptedNoteTarget, RunStepRecord } from '@/lib/live/types'

const NOTE_MAX = 2000
const DURATION_MAX = 300

export interface FollowUpChange {
  note?: AdoptedNoteTarget
  duration?: number
  deleted?: boolean
}

interface StepFollowUpProps {
  runId: string
  step: RunStepRecord
  /** Wohin „Übung bearbeiten“ nach Speichern oder Abbrechen zurückführt. */
  returnTo: string
  /** Gesetzt = die Wege sind gerade nicht bedienbar; der Text sagt, warum. */
  disabledReason: string | null
  onChanged: (position: number, change: FollowUpChange) => void
}

/** Lädt den heutigen Stand der Übung, sobald ein Dialog aufgeht. */
function useCurrentExercise(target: FollowUpTarget, open: boolean) {
  const [state, setState] = React.useState<
    { status: 'loading' } | { status: 'error' } | { status: 'ready'; exercise: FollowUpExercise }
  >({ status: 'loading' })
  const { runId, position, exerciseId, variantId } = target
  // Jeder neue Wert lädt den Stand der Übung neu — nach dem Hinweis, dass sie
  // inzwischen geändert wurde.
  const [attempt, setAttempt] = React.useState(0)
  const reload = React.useCallback(() => setAttempt((value) => value + 1), [])

  React.useEffect(() => {
    if (!open) return
    let cancelled = false
    setState({ status: 'loading' })
    getFollowUpExercise({ runId, position, exerciseId, variantId })
      .then((exercise) => {
        if (cancelled) return
        setState(exercise ? { status: 'ready', exercise } : { status: 'error' })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [open, runId, position, exerciseId, variantId, attempt])

  return { state, reload }
}

function LoadState({ status }: { status: 'loading' | 'error' }) {
  return status === 'loading' ? (
    <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      Übung wird geladen …
    </p>
  ) : (
    <p className="py-6 text-sm text-destructive">
      Die Übung konnte nicht geladen werden. Versuch es später an der gespeicherten Durchführung
      noch einmal.
    </p>
  )
}

function joinNote(existing: string, sentence: string): string {
  const base = existing.trimEnd()
  const added = sentence.trim()
  if (!added) return base
  return base ? `${base}\n${added}` : added
}

function NoteDialog({
  target,
  stepName,
  open,
  onOpenChange,
  onDone,
}: {
  target: FollowUpTarget
  stepName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (field: AdoptedNoteTarget) => void
}) {
  const { toast } = useToast()
  const { state: current, reload } = useCurrentExercise(target, open)
  const [field, setField] = React.useState<AdoptedNoteTarget>('work')
  const [sentence, setSentence] = React.useState('')
  // Hat der Nutzer die Vorschau von Hand geändert, gilt sein Text — sie wird
  // dann nicht mehr aus Feld und Satz zusammengesetzt.
  const [edited, setEdited] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setField('work')
      setSentence('')
      setEdited(null)
    }
  }, [open])

  const existing =
    current.status === 'ready'
      ? field === 'work'
        ? current.exercise.workNotes
        : current.exercise.notes
      : ''
  const preview = edited ?? joinNote(existing, sentence)
  const tooLong = preview.length > NOTE_MAX
  const unchanged = preview.trim() === existing.trim()

  async function confirm() {
    if (current.status !== 'ready') return
    setSaving(true)
    try {
      const result = await appendExerciseNote(target, field, preview.trim(), current.exercise.updatedAt)
      if (!result.ok) {
        // Die Eingabe bleibt stehen, die Übung ist unverändert.
        toast({ variant: 'destructive', title: 'Nicht übernommen', description: result.error })
        // Inzwischen geändert: die Vorschau wird aus dem neuen Stand und dem
        // Satz neu zusammengesetzt, statt den alten Text zu überschreiben.
        if (result.stale) {
          setEdited(null)
          reload()
        }
        return
      }
      toast({ title: 'Notiz übernommen' })
      onDone(field)
      onOpenChange(false)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Nicht übernommen',
        description: 'Keine Verbindung. Deine Eingabe steht noch da.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Notiz anhängen</DialogTitle>
          <DialogDescription>
            Ein Satz zu „{stepName}“. Er wird ans Ende gesetzt, der bisherige Text bleibt stehen.
          </DialogDescription>
        </DialogHeader>

        {current.status !== 'ready' ? (
          <LoadState status={current.status} />
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={field}
              onValueChange={(value) => {
                setField(value as AdoptedNoteTarget)
                setEdited(null)
              }}
              className="gap-2"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="work" id="notiz-ziel-arbeit" className="mt-1" />
                <Label htmlFor="notiz-ziel-arbeit" className="font-normal leading-snug">
                  <span className="font-medium">Arbeitsnotiz</span> — steht im Stundenverlauf und im
                  Live-Modus
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="personal" id="notiz-ziel-anmerkung" className="mt-1" />
                <Label htmlFor="notiz-ziel-anmerkung" className="font-normal leading-snug">
                  <span className="font-medium">Anmerkungen</span> — persönliche Tipps, erscheinen
                  nie im Plan
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor="notiz-satz">Dein Satz</Label>
              <Input
                id="notiz-satz"
                value={sentence}
                onChange={(event) => {
                  setSentence(event.target.value)
                  setEdited(null)
                }}
                placeholder="z. B. Mit 2 Bällen besser"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notiz-vorschau">So steht es danach da</Label>
              <Textarea
                id="notiz-vorschau"
                value={preview}
                onChange={(event) => setEdited(event.target.value)}
                rows={5}
                aria-invalid={tooLong}
                className="text-sm"
              />
              <p className={tooLong ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
                {tooLong
                  ? `Zu lang: ${preview.length.toLocaleString('de-DE')} von ${NOTE_MAX.toLocaleString('de-DE')} Zeichen. Kürze den Text, dann lässt er sich übernehmen.`
                  : 'Du kannst den Text hier noch ändern.'}
              </p>
            </div>

            {field === 'work' && (
              <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                Erscheint ab sofort in allen Einheiten mit dieser Übung.
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button
            onClick={confirm}
            disabled={current.status !== 'ready' || unchanged || tooLong || saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DurationDialog({
  target,
  step,
  open,
  onOpenChange,
  onDone,
}: {
  target: FollowUpTarget
  step: RunStepRecord
  open: boolean
  onOpenChange: (open: boolean) => void
  onDone: (minutes: number) => void
}) {
  const { toast } = useToast()
  const { state: current, reload } = useCurrentExercise(target, open)
  const suggestion = roundToMinutes(step.actualSeconds)
  const [value, setValue] = React.useState(String(suggestion))
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) setValue(String(suggestion))
  }, [open, suggestion])

  const minutes = Number(value)
  const valid = Number.isInteger(minutes) && minutes >= 1 && minutes <= DURATION_MAX

  async function confirm() {
    if (current.status !== 'ready' || !valid) return
    setSaving(true)
    try {
      const result = await adoptExerciseDuration(target, minutes, current.exercise.updatedAt)
      if (!result.ok) {
        toast({ variant: 'destructive', title: 'Nicht übernommen', description: result.error })
        if (result.stale) reload()
        return
      }
      toast({ title: `Dauer übernommen: ${minutes} Min` })
      onDone(minutes)
      onOpenChange(false)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Nicht übernommen',
        description: 'Keine Verbindung. Deine Eingabe steht noch da.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dauer übernehmen</DialogTitle>
          <DialogDescription>
            „{step.name}“{step.variantTitle ? ` · ${step.variantTitle} — gilt für diese Variante` : ''}
          </DialogDescription>
        </DialogHeader>

        {current.status !== 'ready' ? (
          <LoadState status={current.status} />
        ) : (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-md border px-3 py-2">
                <dt className="text-xs text-muted-foreground">Bisher geschätzt</dt>
                <dd className="text-2xl font-semibold tabular-nums">
                  {current.exercise.duration} Min
                </dd>
              </div>
              <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2">
                <dt className="text-xs text-muted-foreground">
                  Tatsächlich ({formatClock(step.actualSeconds * 1000)})
                </dt>
                <dd className="text-2xl font-semibold tabular-nums">{suggestion} Min</dd>
              </div>
            </dl>

            <div className="space-y-1.5">
              <Label htmlFor="dauer-neu">Neue geschätzte Dauer (Minuten)</Label>
              <Input
                id="dauer-neu"
                type="number"
                inputMode="numeric"
                min={1}
                max={DURATION_MAX}
                value={value}
                onChange={(event) => setValue(event.target.value)}
                aria-invalid={!valid}
                className="w-28"
              />
              {!valid && (
                <p className="text-xs text-destructive">
                  Eine ganze Zahl zwischen 1 und {DURATION_MAX}.
                </p>
              )}
            </div>

            <p className="rounded-md border px-3 py-2 text-sm text-muted-foreground">
              Die neue Dauer gilt für künftige Einheiten.
              {current.exercise.otherUnitCount > 0 &&
                ' In bestehenden Einheiten bleibt die geplante Dauer stehen — dort änderst du sie über „Bearbeiten“.'}
            </p>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={confirm} disabled={current.status !== 'ready' || !valid || saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Übernehmen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Die vier Wege der Nachbereitung an einem Schritt: Notiz anhängen, Dauer
 * übernehmen, Übung bearbeiten, Übung löschen. Alle freiwillig, und keiner
 * ändert etwas ohne ausdrückliche Bestätigung.
 */
export function StepFollowUp({ runId, step, returnTo, disabledReason, onChanged }: StepFollowUpProps) {
  const { toast } = useToast()
  const [dialog, setDialog] = React.useState<'note' | 'duration' | 'delete' | null>(null)
  const [deleting, setDeleting] = React.useState(false)

  if (step.kind !== 'exercise' || !step.exerciseId) return null

  const exerciseId = step.exerciseId
  const target: FollowUpTarget = {
    runId,
    position: step.position,
    exerciseId,
    variantId: step.variantId,
  }
  const disabled = disabledReason !== null
  const editHref = `/exercises/${exerciseId}/edit?zurueck=${encodeURIComponent(returnTo)}`

  async function confirmDelete() {
    setDeleting(true)
    try {
      const result = await deleteExercise(exerciseId)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Übung gelöscht' })
      onChanged(step.position, { deleted: true })
      setDialog(null)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
    }
  }

  const buttonClass = 'min-h-11 justify-start px-2 text-xs sm:min-h-9'

  return (
    <div className="mt-2">
      <div className="grid grid-cols-2 gap-1 sm:flex sm:flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className={buttonClass}
          disabled={disabled}
          onClick={() => setDialog('note')}
        >
          <NotebookPen className="mr-1.5 h-3.5 w-3.5" />
          Notiz anhängen
        </Button>
        {/* An einem ausgelassenen Schritt gibt es keine tatsächliche Dauer. */}
        {step.status === 'done' && (
          <Button
            variant="ghost"
            size="sm"
            className={buttonClass}
            disabled={disabled}
            onClick={() => setDialog('duration')}
          >
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Dauer übernehmen
          </Button>
        )}
        {disabled ? (
          <Button variant="ghost" size="sm" className={buttonClass} disabled>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Übung bearbeiten
          </Button>
        ) : (
          <Button variant="ghost" size="sm" className={buttonClass} asChild>
            <Link href={editHref}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Übung bearbeiten
            </Link>
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className={`${buttonClass} text-destructive hover:text-destructive`}
          disabled={disabled}
          onClick={() => setDialog('delete')}
        >
          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
          Übung löschen
        </Button>
      </div>

      <NoteDialog
        target={target}
        stepName={step.name}
        open={dialog === 'note'}
        onOpenChange={(open) => setDialog(open ? 'note' : null)}
        onDone={(field) => onChanged(step.position, { note: field })}
      />
      <DurationDialog
        target={target}
        step={step}
        open={dialog === 'duration'}
        onOpenChange={(open) => setDialog(open ? 'duration' : null)}
        onDone={(minutes) => onChanged(step.position, { duration: minutes })}
      />
      <AlertDialog open={dialog === 'delete'} onOpenChange={(open) => setDialog(open ? 'delete' : null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Übung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du „{step.name}“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
              werden. Diese Durchführung nennt die Übung weiter beim Namen.
              <ExerciseUsageWarning exerciseId={exerciseId} active={dialog === 'delete'} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void confirmDelete()
              }}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              Endgültig löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
