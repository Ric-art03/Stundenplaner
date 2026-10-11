'use client'

import * as React from 'react'
import Link from 'next/link'
import { Clock, Loader2, NotebookPen, Pencil } from 'lucide-react'
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
import { useToast } from '@/hooks/use-toast'
import {
  adoptExerciseDuration,
  getFollowUpExercise,
  saveExerciseNotes,
  type FollowUpExercise,
  type FollowUpTarget,
} from '@/lib/actions/live'
import { formatClock, roundToMinutes } from '@/lib/live/clock'
import type { AdoptedNoteTarget, RunStepRecord } from '@/lib/live/types'

const NOTE_MAX = 2000
const DURATION_MAX = 300

export interface FollowUpChange {
  /** Die Notizfelder, die geändert wurden. */
  notes?: AdoptedNoteTarget[]
  duration?: number
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

const FIELD_LABEL: Record<AdoptedNoteTarget, string> = {
  work: 'Arbeitsnotiz',
  personal: 'Anmerkungen',
}

/**
 * Die beiden Notizen der Übung, direkt änderbar: oben wird gewählt, welche zu
 * sehen ist, darunter steht ihr heutiger Text. Beide lassen sich in einem
 * Arbeitsschritt ändern — umschalten verwirft nichts —, und eine Bestätigung
 * speichert, was sich geändert hat.
 */
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
  onDone: (fields: AdoptedNoteTarget[]) => void
}) {
  const { toast } = useToast()
  const { state: current, reload } = useCurrentExercise(target, open)
  const [field, setField] = React.useState<AdoptedNoteTarget>('work')
  // Der Text je Feld, sobald der Nutzer ihn angefasst hat. `null` = unberührt,
  // dann gilt der heutige Stand der Übung.
  const [drafts, setDrafts] = React.useState<Record<AdoptedNoteTarget, string | null>>({
    work: null,
    personal: null,
  })
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (open) {
      setField('work')
      setDrafts({ work: null, personal: null })
    }
  }, [open])

  const existing: Record<AdoptedNoteTarget, string> =
    current.status === 'ready'
      ? { work: current.exercise.workNotes, personal: current.exercise.notes }
      : { work: '', personal: '' }

  const text = drafts[field] ?? existing[field]
  const changed = (['work', 'personal'] as const).filter(
    (key) => drafts[key] !== null && drafts[key]!.trim() !== existing[key].trim()
  )
  const tooLong = (['work', 'personal'] as const).filter(
    (key) => (drafts[key] ?? existing[key]).trim().length > NOTE_MAX
  )

  async function confirm() {
    if (current.status !== 'ready' || changed.length === 0) return
    setSaving(true)
    try {
      const result = await saveExerciseNotes(
        target,
        {
          ...(changed.includes('work') ? { work: drafts.work!.trim() } : {}),
          ...(changed.includes('personal') ? { personal: drafts.personal!.trim() } : {}),
        },
        current.exercise.updatedAt
      )
      if (!result.ok) {
        // Die Eingabe bleibt stehen, die Übung ist unverändert.
        toast({ variant: 'destructive', title: 'Nicht übernommen', description: result.error })
        // Inzwischen anderswo geändert: den neuen Stand holen, damit die
        // nächste Bestätigung gilt. Was hier getippt wurde, bleibt.
        if (result.stale) reload()
        return
      }
      toast({
        title:
          changed.length === 2
            ? 'Arbeitsnotiz und Anmerkungen übernommen'
            : `${FIELD_LABEL[changed[0]]} übernommen`,
      })
      onDone(changed)
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
          <DialogTitle>Notizen der Übung</DialogTitle>
          <DialogDescription>
            „{stepName}“ — ergänze oder ändere, was du aus der Stunde mitnimmst. Du kannst beide
            Notizen nacheinander bearbeiten und dann gemeinsam übernehmen.
          </DialogDescription>
        </DialogHeader>

        {current.status !== 'ready' ? (
          <LoadState status={current.status} />
        ) : (
          <div className="space-y-4">
            <RadioGroup
              value={field}
              onValueChange={(value) => setField(value as AdoptedNoteTarget)}
              className="gap-2"
            >
              <div className="flex items-start gap-2">
                <RadioGroupItem value="work" id="notiz-ziel-arbeit" className="mt-1" />
                <Label htmlFor="notiz-ziel-arbeit" className="font-normal leading-snug">
                  <span className="font-medium">Arbeitsnotiz</span> — steht im Stundenverlauf und im
                  Live-Modus
                  {changed.includes('work') && (
                    <span className="font-medium text-primary"> · geändert</span>
                  )}
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <RadioGroupItem value="personal" id="notiz-ziel-anmerkung" className="mt-1" />
                <Label htmlFor="notiz-ziel-anmerkung" className="font-normal leading-snug">
                  <span className="font-medium">Anmerkungen</span> — persönliche Tipps, erscheinen
                  nie im Plan
                  {changed.includes('personal') && (
                    <span className="font-medium text-primary"> · geändert</span>
                  )}
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-1.5">
              <Label htmlFor="notiz-text">{FIELD_LABEL[field]}</Label>
              <Textarea
                // Der `key` setzt beim Umschalten die Schreibmarke neu ans Ende.
                key={field}
                id="notiz-text"
                value={text}
                onChange={(event) =>
                  setDrafts((known) => ({ ...known, [field]: event.target.value }))
                }
                onFocus={(event) => {
                  const end = event.target.value.length
                  event.target.setSelectionRange(end, end)
                }}
                rows={6}
                aria-invalid={tooLong.includes(field)}
                placeholder={
                  field === 'work' ? 'z. B. Mit 2 Bällen besser' : 'z. B. Kam bei den Kleinen gut an'
                }
                className="text-sm"
                autoFocus
              />
              <p
                className={
                  tooLong.includes(field)
                    ? 'text-xs text-destructive'
                    : 'text-xs text-muted-foreground'
                }
              >
                {tooLong.includes(field)
                  ? `Zu lang: ${text.trim().length.toLocaleString('de-DE')} von ${NOTE_MAX.toLocaleString('de-DE')} Zeichen. Kürze den Text, dann lässt er sich übernehmen.`
                  : `${text.length.toLocaleString('de-DE')}/${NOTE_MAX.toLocaleString('de-DE')}`}
              </p>
            </div>

            {field === 'work' && (
              <p className="rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
                Erscheint ab sofort in allen Einheiten mit dieser Übung.
              </p>
            )}
            {/* Der Fehler im gerade verdeckten Feld soll nicht unsichtbar sperren. */}
            {tooLong.some((key) => key !== field) && (
              <p className="text-sm text-destructive">
                {FIELD_LABEL[tooLong.find((key) => key !== field)!]} ist zu lang — schalte um und
                kürze den Text.
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
            disabled={
              current.status !== 'ready' || changed.length === 0 || tooLong.length > 0 || saving
            }
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
 * Die Wege der Nachbereitung an einem Schritt: Notiz anhängen, Dauer
 * übernehmen, Übung bearbeiten. Alle freiwillig, und keiner ändert etwas ohne
 * ausdrückliche Bestätigung.
 *
 * „Übung löschen" stand hier zuerst mit dabei und ist auf Wunsch des Nutzers
 * wieder entfernt: gelöscht wird im Übungsordner, nicht aus einer
 * Durchführung heraus.
 */
export function StepFollowUp({ runId, step, returnTo, disabledReason, onChanged }: StepFollowUpProps) {
  const [dialog, setDialog] = React.useState<'note' | 'duration' | null>(null)

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
      </div>

      <NoteDialog
        target={target}
        stepName={step.name}
        open={dialog === 'note'}
        onOpenChange={(open) => setDialog(open ? 'note' : null)}
        onDone={(fields) => onChanged(step.position, { notes: fields })}
      />
      <DurationDialog
        target={target}
        step={step}
        open={dialog === 'duration'}
        onOpenChange={(open) => setDialog(open ? 'duration' : null)}
        onDone={(minutes) => onChanged(step.position, { duration: minutes })}
      />
    </div>
  )
}
