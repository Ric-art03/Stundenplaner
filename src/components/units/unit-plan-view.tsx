'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  Clock,
  Info,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Users,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useStoredFlag } from '@/hooks/use-stored-flag'
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { WorkNote } from '@/components/exercises/work-note'
import { UnitItemCard } from './unit-item-card'
import { GapNotice } from './gap-notice'
import { PlannedGap } from './planned-gap'
import { UnitActionsMenu } from './unit-actions-menu'
import { UnitNameDialog } from './unit-name-dialog'
import { UnitItemControls } from './unit-item-controls'
import { SegmentFillStatus } from './segment-fill-status'
import { SegmentNoteField } from './segment-note-field'
import { EditChangeBar } from './edit-change-bar'
import { SaveChangesPrompt, type OverfillNotice } from './save-changes-prompt'
import { DiscardChangesDialog } from './discard-changes-dialog'
import { ExercisePickerDialog } from './exercise-picker-dialog'
import type {
  QuickCreateDefaults,
  QuickCreateInput,
  QuickCreateResult,
} from './quick-create-exercise-form'
import { regenerateUnit, relaxSegment } from '@/lib/actions/units'
import {
  applyChange,
  canUndo as historyCanUndo,
  changeCount as historyChangeCount,
  discardChanges,
  isDirty,
  startHistory,
  undoChange,
  type DraftHistory,
} from '@/lib/units/draft-history'
import {
  declareAllOpenGaps,
  declarePlannedGap,
  exclusionsFor,
  gapState,
  insertItem,
  moveItem,
  openGaps,
  removeItem,
  reopenGap,
  rerollItem,
  segmentBalance,
  setItemDuration,
  setItemExercise,
  setSegmentNotes,
  usedExerciseIds,
  type DraftSegment,
  type SegmentFrame,
  type UnitDraft,
} from '@/lib/units/draft'
import {
  describeExhaustion,
  drawCandidate,
  placementFrom,
  type EditorCandidate,
} from '@/lib/units/editor-pool'
import { candidateKey } from '@/lib/units/candidates'
import type { Unit, UnitSegment } from '@/lib/types/unit'

/**
 * Was der Editor vom Server braucht — die Seite gibt die drei Server Actions
 * mit. Fehlt der Vertrag (etwa in einem Test der reinen Oberfläche), arbeiten
 * weiter alle Operationen, die ohne Server auskommen: Entfernen, Umsortieren,
 * Plandauer, Arbeitsnotiz, geplante Lücke, Rückgängig, Verwerfen.
 */
export interface UnitEditorActions {
  /** Die Kandidatenliste eines Segments. Wird einmal je Segment geladen. */
  loadPool: (segmentId: string) => Promise<EditorCandidate[]>
  savePlan: (
    draft: UnitDraft,
    options: { expectedUpdatedAt: string; force: boolean; name?: string }
  ) => Promise<{ error?: string; stale?: boolean }>
  quickCreate: (
    segmentId: string,
    input: QuickCreateInput
  ) => Promise<QuickCreateResult>
}

interface UnitPlanViewProps {
  unit: Unit
  singleSportGroup: boolean
  /** Altersgruppen der Gruppe — die Vorbelegung, die „Schnell anlegen" anzeigt. */
  groupAgeGroups?: string[]
  editorActions?: UnitEditorActions
}

/** Welcher Platz oder welche Stelle den Auswahldialog geöffnet hat. */
interface PickerTarget {
  segmentId: string
  /** gesetzt beim Tauschen und Nachbesetzen */
  itemKey?: string
  /** gesetzt beim Einfügen an einer bestimmten Stelle */
  atIndex?: number
}

const POOL_ERROR = 'Die Übungen konnten nicht geladen werden.'

export function UnitPlanView({
  unit,
  singleSportGroup,
  groupAgeGroups = [],
  editorActions,
}: UnitPlanViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [naming, setNaming] = React.useState(false)

  // ---- Bearbeiten-Modus ----
  const [editing, setEditing] = React.useState(false)
  const [history, setHistory] = React.useState<DraftHistory>(() => startHistory(unit))
  const [saving, setSaving] = React.useState(false)
  const [quickCreated, setQuickCreated] = React.useState<string[]>([])

  // Die Arbeitsfassung folgt der geladenen Einheit **nur außerhalb** des
  // Bearbeiten-Modus. Früher wurde sie bei jedem Nachladen der Seitendaten neu
  // aufgesetzt — egal aus welchem Anlass, und damit gingen offene Änderungen
  // ohne Nachfrage verloren. Jetzt entsteht sie beim Betreten des Modus aus dem
  // gespeicherten Stand und wird erst nach dem Verlassen wieder nachgezogen.
  React.useEffect(() => {
    if (!editing) setHistory(startHistory(unit))
  }, [unit, editing])

  const draft = history.present
  const dirty = isDirty(history)

  // ---- Leseansicht: Arbeitsnotizen der Übungen ----
  const [showWorkNotes, setShowWorkNotes] = useStoredFlag(
    'stundenplaner:arbeitsnotizen-anzeigen',
    true
  )
  const hasWorkNotes = unit.segments.some((segment) =>
    segment.items.some((item) => Boolean(item.exercise?.workNotes))
  )

  // ---- Kandidatenlisten, einmal je Segment ----
  const [pools, setPools] = React.useState<Record<string, EditorCandidate[]>>({})
  const [poolLoading, setPoolLoading] = React.useState<string | null>(null)
  const [poolError, setPoolError] = React.useState<string | null>(null)
  const [rolling, setRolling] = React.useState<string | null>(null)

  // ---- Dialoge ----
  const [picker, setPicker] = React.useState<PickerTarget | null>(null)
  const [prompt, setPrompt] = React.useState<
    { mode: 'leave' | 'confirm'; proceed?: () => void } | null
  >(null)
  const [discardOpen, setDiscardOpen] = React.useState(false)
  const [staleOpen, setStaleOpen] = React.useState(false)
  const pendingName = React.useRef<string | undefined>(undefined)
  /**
   * Die Fassung, die gerade gespeichert werden soll, wenn sie von der
   * Arbeitsfassung abweicht — nach „Alle als geplant übernehmen" in der
   * Leseansicht. Sie überdauert den Umweg über den Namensdialog.
   */
  const pendingDraft = React.useRef<UnitDraft | null>(null)

  function change(apply: (current: UnitDraft) => UnitDraft) {
    setHistory((current) => applyChange(current, apply))
  }

  function missingBackend() {
    toast({
      title: 'Nicht verfügbar',
      description:
        'Übungsauswahl, Auswürfeln und Speichern sind an dieser Stelle nicht angeschlossen.',
    })
  }

  /**
   * Lädt die Liste eines Segments, falls sie noch nicht da ist.
   *
   * `announce` meldet einen Ladefehler an Ort und Stelle. Der Auswahldialog
   * zeigt ihn selbst; beim Auswürfeln und beim Wählen einer Variante ist kein
   * Dialog offen, und ohne Meldung sähe der Fehler aus wie ein Knopf, der
   * nichts tut.
   */
  async function ensurePool(
    segmentId: string,
    { announce = false }: { announce?: boolean } = {}
  ): Promise<EditorCandidate[] | null> {
    if (pools[segmentId]) return pools[segmentId]
    if (!editorActions) {
      missingBackend()
      return null
    }

    setPoolLoading(segmentId)
    setPoolError(null)
    try {
      const loaded = await editorActions.loadPool(segmentId)
      setPools((current) => ({ ...current, [segmentId]: loaded }))
      return loaded
    } catch {
      setPoolError(POOL_ERROR)
      if (announce) {
        toast({
          variant: 'destructive',
          title: 'Fehler',
          description: `${POOL_ERROR} Bitte versuche es erneut.`,
        })
      }
      return null
    } finally {
      setPoolLoading(null)
    }
  }

  // ---- Die Operationen ----

  /**
   * Auswürfeln endet in genau einem von drei Ausgängen, und jeder ist zu sehen:
   * eine andere Übung im Platz, die Begründung des erschöpften Vorrats oder
   * eine Fehlermeldung. Solange es läuft, zeigt es die Karte selbst, und an den
   * übrigen Karten ist „Neu auswürfeln" ausgegraut.
   */
  async function reroll(segment: UnitSegment, itemKey: string) {
    if (rolling !== null) return

    setRolling(itemKey)
    try {
      const pool = await ensurePool(segment.id, { announce: true })
      if (!pool) return

      const exclusions = exclusionsFor(draft, segment.id, itemKey)
      // Dieselbe Gewichtung wie im Generator: die Hauptsportart der Phase
      // zählt doppelt, kürzlich Verwendetes kommt zuletzt.
      const drawn = drawCandidate(pool, exclusions, Math.random, {
        sports: segment.sports,
        primarySport: segment.primarySport,
      })
      if (!drawn) {
        // Jede Ursache einzeln und mit Anzahl — aus dem Stand **jetzt**, nicht
        // aus der Begründung, die der Generator beim Erzeugen hinterlegt hat.
        toast({
          variant: 'destructive',
          title: 'Keine weitere passende Übung',
          description: describeExhaustion(pool, exclusions, segment.name),
        })
        return
      }

      change((current) => rerollItem(current, segment.id, itemKey, placementFrom(drawn)))
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Auswürfeln fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setRolling(null)
    }
  }

  async function openPicker(target: PickerTarget) {
    setPicker(target)
    await ensurePool(target.segmentId)
  }

  /**
   * Eine Form aus „Varianten (n)" auf der Karte wählen; `null` stellt die
   * Grundübung wieder her. Material, Dauer und Organisationsform der Form
   * kommen aus der Kandidatenliste des Segments — dort sind Varianten eigene
   * Kandidaten, es gibt also keinen zweiten Ladeweg.
   */
  async function selectVariant(
    segmentId: string,
    itemKey: string,
    exerciseId: string,
    variantId: string | null
  ) {
    const pool = await ensurePool(segmentId, { announce: true })
    if (!pool) return

    const form = pool.find(
      (candidate) => candidate.exerciseId === exerciseId && candidate.variantId === variantId
    )
    if (!form) {
      toast({
        variant: 'destructive',
        title: 'Nicht mehr vorhanden',
        description:
          'Diese Form der Übung gibt es nicht mehr. Lade die Seite neu, um den aktuellen Stand zu sehen.',
      })
      return
    }

    change((current) => setItemExercise(current, segmentId, itemKey, placementFrom(form)))
  }

  function placeFromPicker(candidate: EditorCandidate) {
    if (!picker) return
    const { segmentId, itemKey, atIndex } = picker

    if (itemKey) {
      change((current) => setItemExercise(current, segmentId, itemKey, placementFrom(candidate)))
    } else {
      change((current) => insertItem(current, segmentId, placementFrom(candidate), atIndex))
    }
  }

  async function quickCreate(input: QuickCreateInput): Promise<QuickCreateResult> {
    if (!picker || !editorActions) {
      missingBackend()
      return { error: 'Noch nicht angeschlossen.' }
    }

    const result = await editorActions.quickCreate(picker.segmentId, input)

    if (result.created) {
      // Die neue Übung reiht sich in die gemerkte Liste ein und ist damit sofort
      // ein Kandidat — ohne die Liste neu zu laden.
      const created = result.created
      setPools((current) => ({
        ...current,
        [picker.segmentId]: [...(current[picker.segmentId] ?? []), created],
      }))
      setQuickCreated((current) => [...current, created.name])
      placeFromPicker(created)
      setPicker(null)
    }

    return result
  }

  // ---- Verlassen, Speichern, Verwerfen ----

  /** Der Rahmen, den die Arbeitsfassung bewusst nicht trägt. */
  const frames: SegmentFrame[] = React.useMemo(
    () =>
      unit.segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        minutes: segment.minutes,
        fillMode: segment.fillMode,
      })),
    [unit.segments]
  )

  /**
   * Offene Lücken sperren das Speichern: in einer gespeicherten Einheit steht
   * kein gelbes Warnfeld. Jede freie Minute ist gefüllt oder als geplant
   * erklärt.
   */
  const gaps = React.useMemo(() => openGaps(draft, frames), [draft, frames])

  /** Überfüllte Segmente werden genannt, sperren aber nicht. */
  const overfills: OverfillNotice[] = React.useMemo(
    () =>
      frames.flatMap((frame) => {
        const segment = draft.segments.find((entry) => entry.id === frame.id)
        if (!segment) return []
        const { over } = segmentBalance(segment, frame.minutes)
        return over > 0 ? [{ name: frame.name, over }] : []
      }),
    [draft, frames]
  )

  useUnsavedChanges(editing && dirty, (proceed) => {
    setPrompt({ mode: 'leave', proceed })
  })

  /** Der eine Einstieg ins Speichern — aus dem Bearbeiten-Modus und aus der Leseansicht. */
  function requestSave() {
    pendingDraft.current = null
    if (gaps.length > 0 || overfills.length > 0) {
      setPrompt({ mode: 'confirm' })
      return
    }
    void savePlan()
  }

  /** „Alle als geplant übernehmen und speichern". */
  function acceptGapsAndSave() {
    const next = declareAllOpenGaps(draft, frames)
    // Im Bearbeiten-Modus ist das eine Änderung wie jede andere. In der
    // Leseansicht gibt es keine Arbeitsfassung, die sie tragen könnte — bräche
    // der Nutzer danach ab, stünde eine Erklärung im Raum, die er nicht sieht.
    if (editing) setHistory((current) => applyChange(current, () => next))
    pendingDraft.current = next
    void savePlan(false, undefined, next)
  }

  async function savePlan(force = false, name?: string, toSave: UnitDraft = draft) {
    if (!editorActions) {
      missingBackend()
      return
    }

    // Ein Entwurf bekommt beim Speichern erst seinen Namen. Der Namensdialog
    // ruft danach wieder hierher — Name und Änderungen gehen in einem Zug.
    if (!unit.saved && name === undefined) {
      setPrompt(null)
      setNaming(true)
      return
    }

    setSaving(true)
    try {
      const result = await editorActions.savePlan(toSave, {
        expectedUpdatedAt: unit.updatedAt,
        force,
        name,
      })

      if (result.stale) {
        setPrompt(null)
        setNaming(false)
        // Für „Trotzdem überschreiben": Name und Fassung sollen nicht ein
        // zweites Mal abgefragt werden.
        pendingName.current = name
        pendingDraft.current = toSave
        setStaleOpen(true)
        return
      }
      if (result.error) {
        // Die Einheit bleibt, wie sie ist, die Änderungen bleiben stehen.
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }

      const wasDraft = !unit.saved
      pendingDraft.current = null
      setPrompt(null)
      setNaming(false)
      setQuickCreated([])
      // Speichern beendet das Bearbeiten — es gibt keinen zweiten Knopf dafür.
      setEditing(false)
      toast({ title: wasDraft ? 'Einheit gespeichert' : 'Änderungen gespeichert' })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Speichern fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setSaving(false)
    }
  }

  function discard() {
    setHistory((current) => discardChanges(current))
    setQuickCreated([])
    setDiscardOpen(false)
  }

  function discardAndLeave() {
    const proceed = prompt?.proceed
    discard()
    setPrompt(null)
    if (proceed) proceed()
    else setEditing(false)
  }

  // ---- Die bisherigen Aktionen ----

  async function regenerate() {
    setBusy('regenerate')
    try {
      const result = await regenerateUnit(unit.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      if (result.unitId && result.unitId !== unit.id) {
        toast({
          title: 'Neuer Vorschlag erstellt',
          description: 'Die gespeicherte Einheit bleibt unverändert.',
        })
        router.push(`/units/${result.unitId}`)
        return
      }
      toast({ title: 'Neu generiert' })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Generieren fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setBusy(null)
    }
  }

  /** Lockern wirkt nur in dem Segment, in dem der Nutzer geklickt hat. Nur in
   *  der Leseansicht — es lädt die Einheit neu. */
  async function relax(segmentId: string) {
    setBusy(segmentId)
    try {
      const result = await relaxSegment(segmentId)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Erneuter Versuch fehlgeschlagen.',
      })
    } finally {
      setBusy(null)
    }
  }

  const pickerSegment = picker
    ? unit.segments.find((segment) => segment.id === picker.segmentId)
    : null
  const pickerDraftSegment = picker
    ? draft.segments.find((segment) => segment.id === picker.segmentId)
    : null
  const pickerItem =
    picker?.itemKey && pickerDraftSegment
      ? pickerDraftSegment.items.find((item) => item.key === picker.itemKey)
      : null

  const quickCreateDefaults: QuickCreateDefaults = {
    sports: pickerSegment?.sports ?? [],
    phase: pickerSegment?.name ?? '',
    difficulty: pickerSegment?.difficulties[0] ?? 'Mittel',
    ageGroups: groupAgeGroups,
    organizationForms:
      pickerSegment?.organizationForms.length === 1 ? pickerSegment.organizationForms : [],
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Kopf */}
      <div className="space-y-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/units/new?from=${unit.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Generator
            </Link>
          </Button>
          <div className="flex items-start justify-between gap-2">
            <h1 className="min-w-0 text-2xl font-bold">{unit.name}</h1>
            <UnitActionsMenu
              unitId={unit.id}
              unitName={unit.name}
              redirectAfterDelete="/units"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {unit.totalMinutes} Minuten
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {unit.groupName}
            </span>
            {unit.manuallyEdited && <span>· manuell bearbeitet</span>}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {/* Bearbeiten steht für Entwürfe genauso zur Verfügung wie für
              gespeicherte Einheiten. */}
          {/* Im Bearbeiten-Modus führt der Hauptknopf der Leiste wieder hinaus. */}
          {!editing && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditing(true)}
              disabled={busy !== null || saving}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Button>
          )}

          {/* Im Bearbeiten-Modus sagt die Leiste, was offen ist, und ihr Hauptknopf
              speichert. „Gespeichert" stünde dort neben ungespeicherten Änderungen. */}
          {editing ? null : unit.saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Gespeichert
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={requestSave}
              disabled={busy !== null || saving}
            >
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Einheit speichern
            </Button>
          )}

          {/* Neu generieren würde offene Änderungen ohne Nachfrage überschreiben. */}
          {editing ? null : unit.manuallyEdited && !unit.saved ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={busy !== null || saving}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Neu generieren
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Änderungen überschreiben?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deine Änderungen an dieser Einheit werden überschrieben. Die
                    Zeitstrahl-Konfiguration bleibt erhalten — du bekommst nur eine andere
                    Übungsauswahl.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={regenerate}>Neu generieren</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={regenerate}
              disabled={busy !== null || saving}
            >
              {busy === 'regenerate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Neu generieren
            </Button>
          )}
        </div>

        {!unit.saved && !editing && (
          <p className="text-xs text-muted-foreground">
            {gaps.length > 0 ? (
              <>
                <span className="font-medium text-foreground">Mit offenen Lücken:</span>{' '}
                {gaps.length === 1
                  ? `Die Phase „${gaps[0].name}" ist nicht voll.`
                  : `Diese Phasen sind nicht voll: ${gaps
                      .map((gap) => `„${gap.name}"`)
                      .join(', ')}.`}{' '}
                Vor dem Speichern füllst du sie über &bdquo;Bearbeiten&ldquo; — oder lässt
                sie bewusst als geplante Lücke stehen.
              </>
            ) : (
              <>
                Noch nicht gespeichert — diese Einheit erscheint erst in deinen Übersichten,
                wenn du sie speicherst. Ein neuer Durchlauf im Generator ersetzt sie.
              </>
            )}
          </p>
        )}

        {/* Ein Schalter für alle Einträge zugleich. Nur in der Leseansicht: im
            Bearbeiten-Modus geht es um den Aufbau des Plans. */}
        {!editing && hasWorkNotes && (
          <div className="flex items-center gap-2">
            <Switch
              id="arbeitsnotizen-anzeigen"
              checked={showWorkNotes}
              onCheckedChange={setShowWorkNotes}
            />
            <Label htmlFor="arbeitsnotizen-anzeigen" className="cursor-pointer text-sm font-normal">
              Arbeitsnotizen anzeigen
            </Label>
          </div>
        )}
      </div>

      {editing && (
        <EditChangeBar
          changeCount={historyChangeCount(history)}
          dirty={dirty}
          canUndo={historyCanUndo(history)}
          saving={saving}
          onUndo={() => setHistory((current) => undoChange(current))}
          onDiscard={() => setDiscardOpen(true)}
          onSave={requestSave}
          onDone={() => setEditing(false)}
        />
      )}

      <UnitNameDialog
        open={naming}
        onOpenChange={(open) => {
          setNaming(open)
          if (!open) pendingDraft.current = null
        }}
        title="Einheit speichern"
        description="Unter diesem Namen findest du die Einheit später wieder. Der Vorschlag aus Gruppe und Datum lässt sich überschreiben."
        confirmLabel="Speichern"
        initialName={unit.name}
        busy={saving}
        onConfirm={(name) => savePlan(false, name, pendingDraft.current ?? draft)}
      />

      {!unit.saved && unit.relaxedNote && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">{unit.relaxedNote}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Stundenverlauf */}
      <div className="space-y-6">
        {unit.segments.map((segment) => {
          const draftSegment = draft.segments.find((entry) => entry.id === segment.id)

          return (
            <SegmentBlock
              key={segment.id}
              segment={segment}
              draftSegment={draftSegment}
              editing={editing}
              showWorkNotes={showWorkNotes}
              singleSportGroup={singleSportGroup}
              relaxing={busy === segment.id}
              rollingKey={rolling}
              onRelax={() => relax(segment.id)}
              onNotesChange={(notes) =>
                change((current) => setSegmentNotes(current, segment.id, notes))
              }
              onDurationChange={(itemKey, minutes) =>
                change((current) => setItemDuration(current, segment.id, itemKey, minutes))
              }
              onMove={(itemKey, direction) =>
                change((current) => moveItem(current, segment.id, itemKey, direction))
              }
              onRemove={(itemKey) =>
                change((current) => removeItem(current, segment.id, itemKey))
              }
              onReroll={(itemKey) => void reroll(segment, itemKey)}
              onChoose={(itemKey) => void openPicker({ segmentId: segment.id, itemKey })}
              onSelectVariant={(itemKey, exerciseId, variantId) =>
                void selectVariant(segment.id, itemKey, exerciseId, variantId)
              }
              onInsert={() => void openPicker({ segmentId: segment.id })}
              onDeclarePlanned={() =>
                change((current) => declarePlannedGap(current, segment.id, segment.minutes))
              }
              onReopenGap={() => change((current) => reopenGap(current, segment.id))}
            />
          )
        })}
      </div>

      {/* Dialoge */}
      <ExercisePickerDialog
        open={picker !== null}
        onOpenChange={(open) => {
          if (!open) setPicker(null)
        }}
        segmentName={pickerSegment?.name ?? ''}
        pool={picker ? pools[picker.segmentId] ?? null : null}
        loading={poolLoading !== null && poolLoading === picker?.segmentId}
        error={poolError}
        onRetry={() => {
          if (picker) void ensurePool(picker.segmentId)
        }}
        currentKey={
          pickerItem?.exerciseId
            ? candidateKey(pickerItem.exerciseId, pickerItem.variantId)
            : null
        }
        usedExerciseIds={new Set(usedExerciseIds(draft))}
        quickCreateDefaults={quickCreateDefaults}
        onPick={placeFromPicker}
        onQuickCreate={quickCreate}
      />

      <SaveChangesPrompt
        open={prompt !== null}
        onOpenChange={(open) => {
          if (!open) setPrompt(null)
        }}
        mode={prompt?.mode ?? 'leave'}
        openGaps={gaps}
        overfills={overfills}
        quickCreated={quickCreated}
        saving={saving}
        onSave={() => void savePlan()}
        onAcceptGapsAndSave={acceptGapsAndSave}
        onDiscard={discardAndLeave}
        onEdit={
          editing
            ? undefined
            : () => {
                setPrompt(null)
                setEditing(true)
              }
        }
      />

      <DiscardChangesDialog
        open={discardOpen}
        onOpenChange={setDiscardOpen}
        changeCount={historyChangeCount(history)}
        quickCreated={quickCreated}
        onConfirm={discard}
      />

      {/* Zwischenzeitlich anderswo geändert */}
      <AlertDialog open={staleOpen} onOpenChange={setStaleOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anderswo geändert</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Einheit wurde zwischenzeitlich an einer anderen Stelle geändert — etwa
              in einem zweiten Tab. Lädst du neu, sind deine Änderungen hier verloren.
              Überschreibst du, gehen die anderen Änderungen verloren.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setStaleOpen(false)
                pendingDraft.current = null
                // Die Arbeitsfassung folgt der Einheit nur außerhalb des
                // Bearbeiten-Modus — „Neu laden" verlässt ihn deshalb, die
                // Änderungen sind laut Dialog ohnehin verloren.
                setQuickCreated([])
                setEditing(false)
                router.refresh()
              }}
            >
              Neu laden
            </Button>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                setStaleOpen(false)
                void savePlan(true, pendingName.current, pendingDraft.current ?? draft)
              }}
            >
              Trotzdem überschreiben
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

interface SegmentBlockProps {
  segment: UnitSegment
  draftSegment: DraftSegment | undefined
  editing: boolean
  showWorkNotes: boolean
  singleSportGroup: boolean
  relaxing: boolean
  rollingKey: string | null
  onRelax: () => void
  onNotesChange: (notes: string) => void
  onDurationChange: (itemKey: string, minutes: number) => void
  onMove: (itemKey: string, direction: 'up' | 'down') => void
  onRemove: (itemKey: string) => void
  onReroll: (itemKey: string) => void
  onChoose: (itemKey: string) => void
  onSelectVariant: (itemKey: string, exerciseId: string, variantId: string | null) => void
  onInsert: () => void
  onDeclarePlanned: () => void
  onReopenGap: () => void
}

function SegmentBlock({
  segment,
  draftSegment,
  editing,
  showWorkNotes,
  singleSportGroup,
  relaxing,
  rollingKey,
  onRelax,
  onNotesChange,
  onDurationChange,
  onMove,
  onRemove,
  onReroll,
  onChoose,
  onSelectVariant,
  onInsert,
  onDeclarePlanned,
  onReopenGap,
}: SegmentBlockProps) {
  // Im Bearbeiten-Modus zeigt die Arbeitsfassung den Stand, in der Leseansicht
  // die geladene Einheit.
  const inDraft = editing && draftSegment !== undefined
  const items = inDraft ? draftSegment.items : segment.items
  const notes = inDraft ? draftSegment.notes : segment.notes
  const plannedGapMinutes = inDraft ? draftSegment.plannedGapMinutes : segment.plannedGapMinutes
  const filledMinutes = items.reduce((sum, item) => sum + item.plannedDuration, 0)
  const freeMinutes = Math.max(0, segment.minutes - filledMinutes)

  /** Die eine Regel: keine Lücke, offen (gelb, sperrt) oder geplant (ruhig). */
  const gap = gapState(freeMinutes, plannedGapMinutes, segment.fillMode)

  /**
   * Ein bewusst frei gelassener Abschnitt zeigt seinen Inhalt, sobald er einen
   * hat. Die Einstellung „frei lassen" bleibt — sie hält fest, was im Generator
   * gewählt wurde, und „Zurück zum Generator" braucht sie unverändert.
   */
  const showAsEmpty = segment.fillMode === 'empty' && items.length === 0

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {segment.fillMode === 'empty' ? `${segment.name} · frei` : segment.name}
        </h2>
        {inDraft ? (
          <SegmentFillStatus balance={segmentBalance(draftSegment, segment.minutes)} />
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {segment.minutes} Min
          </span>
        )}
      </div>

      {inDraft ? (
        <SegmentNoteField segmentId={segment.id} notes={notes} onChange={onNotesChange} />
      ) : (
        notes && <WorkNote text={notes} />
      )}

      {showAsEmpty && !editing ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          — Lücke —
          <p className="mt-1 text-xs">
            {notes ? 'Du füllst diesen Abschnitt selbst.' : 'Bewusst frei gelassen.'}
          </p>
        </div>
      ) : (
        // Der Abstand zwischen den Einträgen ist die Trennung: Karte und
        // Bedienzeile stehen in einem Rahmen, der nächste Eintrag beginnt danach.
        <div className={editing ? 'space-y-3' : 'space-y-2'}>
          {items.map((item, index) => {
            const itemKey = 'key' in item ? item.key : item.id
            const exercise = item.exercise

            return (
              <UnitItemCard
                key={itemKey}
                item={item}
                rolling={rollingKey === itemKey}
                showWorkNotes={!editing && showWorkNotes}
                onSelectVariant={
                  editing && exercise
                    ? (variantId) => onSelectVariant(itemKey, exercise.id, variantId)
                    : undefined
                }
                refill={
                  editing && exercise === null
                    ? {
                        rolling: rollingKey === itemKey,
                        onReroll: () => onReroll(itemKey),
                        onChoose: () => onChoose(itemKey),
                      }
                    : undefined
                }
              >
                {editing && exercise !== null && (
                  <UnitItemControls
                    itemKey={itemKey}
                    plannedDuration={item.plannedDuration}
                    estimatedDuration={exercise.estimatedDuration}
                    position={index + 1}
                    total={items.length}
                    rolling={rollingKey === itemKey}
                    rollBlocked={rollingKey !== null && rollingKey !== itemKey}
                    onDurationChange={(minutes) => onDurationChange(itemKey, minutes)}
                    onMoveUp={() => onMove(itemKey, 'up')}
                    onMoveDown={() => onMove(itemKey, 'down')}
                    onReroll={() => onReroll(itemKey)}
                    onChoose={() => onChoose(itemKey)}
                    onRemove={() => onRemove(itemKey)}
                  />
                )}
              </UnitItemCard>
            )
          })}

          {gap === 'open' && (
            <GapNotice
              segmentMinutes={segment.minutes}
              filledMinutes={filledMinutes}
              reason={segment.gapReason}
              detail={segment.gapDetail}
              singleSportGroup={singleSportGroup}
              relaxing={relaxing}
              // Lockern lädt die Einheit neu — im Bearbeiten-Modus füllt oder
              // erklärt der Nutzer die Lücke selbst.
              onRelax={editing ? undefined : onRelax}
              onInsert={editing ? onInsert : undefined}
              onDeclarePlanned={editing ? onDeclarePlanned : undefined}
            />
          )}

          {gap === 'planned' && (
            <PlannedGap
              minutes={freeMinutes}
              onInsert={editing ? onInsert : undefined}
              // Ein im Generator frei gelassenes Segment ist dort geplant
              // worden; hier gibt es nichts wieder zu öffnen.
              onReopen={editing && segment.fillMode === 'generate' ? onReopenGap : undefined}
            />
          )}

          {/* Je Segment nur ein Knopf „Übung einfügen": steht eine Lücke da,
              trägt sie ihn. */}
          {editing && gap === 'none' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={onInsert}
            >
              <Plus className="mr-2 h-4 w-4" />
              Übung einfügen
            </Button>
          )}
        </div>
      )}
    </section>
  )
}
