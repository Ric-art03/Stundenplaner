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
import { Separator } from '@/components/ui/separator'
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
import { useUnsavedChanges } from '@/hooks/use-unsaved-changes'
import { UnitItemCard } from './unit-item-card'
import { GapNotice } from './gap-notice'
import { UnitActionsMenu } from './unit-actions-menu'
import { UnitNameDialog } from './unit-name-dialog'
import { UnitItemControls } from './unit-item-controls'
import { SegmentFillStatus } from './segment-fill-status'
import { SegmentNoteField } from './segment-note-field'
import { EditChangeBar } from './edit-change-bar'
import { SaveChangesPrompt, type SegmentMismatch } from './save-changes-prompt'
import { DiscardChangesDialog } from './discard-changes-dialog'
import { ExercisePickerDialog } from './exercise-picker-dialog'
import { VariantSwitchDialog } from './variant-switch-dialog'
import type {
  QuickCreateDefaults,
  QuickCreateInput,
  QuickCreateResult,
} from './quick-create-exercise-form'
import { regenerateUnit, relaxSegment, saveUnit } from '@/lib/actions/units'
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
  exclusionsFor,
  insertItem,
  moveItem,
  removeItem,
  rerollItem,
  segmentBalance,
  setItemDuration,
  setItemExercise,
  setSegmentNotes,
  usedExerciseIds,
  type DraftSegment,
  type UnitDraft,
} from '@/lib/units/draft'
import {
  drawCandidate,
  keyOf,
  placementFrom,
  variantsOf,
  type EditorCandidate,
} from '@/lib/units/editor-pool'
import { candidateKey } from '@/lib/units/candidates'
import type { Unit, UnitSegment } from '@/lib/types/unit'

/**
 * Was der Editor vom Server braucht. Kommt im Backend-Schritt dazu; bis dahin
 * arbeiten alle Operationen, die ohne Server auskommen — Entfernen,
 * Umsortieren, Plandauer, Notiz, Rückgängig, Verwerfen.
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

export function UnitPlanView({ unit, singleSportGroup, editorActions }: UnitPlanViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)
  const [naming, setNaming] = React.useState(false)

  // ---- Bearbeiten-Modus ----
  const [editing, setEditing] = React.useState(false)
  const [history, setHistory] = React.useState<DraftHistory>(() => startHistory(unit))
  const [saving, setSaving] = React.useState(false)
  const [quickCreated, setQuickCreated] = React.useState<string[]>([])

  // Nach dem Speichern lädt die Seite die Einheit neu: der gespeicherte Stand
  // ist dann der neue Ausgangszustand, und „Rückgängig" beginnt leer.
  React.useEffect(() => {
    setHistory(startHistory(unit))
  }, [unit])

  const draft = history.present
  const dirty = isDirty(history)

  // ---- Kandidatenlisten, einmal je Segment ----
  const [pools, setPools] = React.useState<Record<string, EditorCandidate[]>>({})
  const [poolLoading, setPoolLoading] = React.useState<string | null>(null)
  const [poolError, setPoolError] = React.useState<string | null>(null)
  const [rolling, setRolling] = React.useState<string | null>(null)

  // ---- Dialoge ----
  const [picker, setPicker] = React.useState<PickerTarget | null>(null)
  const [variantTarget, setVariantTarget] = React.useState<
    { segmentId: string; itemKey: string } | null
  >(null)
  const [prompt, setPrompt] = React.useState<
    { mode: 'leave' | 'confirm'; proceed?: () => void } | null
  >(null)
  const [discardOpen, setDiscardOpen] = React.useState(false)

  function change(apply: (current: UnitDraft) => UnitDraft) {
    setHistory((current) => applyChange(current, apply))
  }

  function missingBackend() {
    toast({
      title: 'Noch nicht angeschlossen',
      description:
        'Übungsauswahl, Auswürfeln und Speichern kommen mit dem Backend-Schritt. Entfernen, Umsortieren, Plandauer und Notizen funktionieren schon.',
    })
  }

  /** Lädt die Liste eines Segments, falls sie noch nicht da ist. */
  async function ensurePool(segmentId: string): Promise<EditorCandidate[] | null> {
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
      setPoolError('Die Übungen konnten nicht geladen werden.')
      return null
    } finally {
      setPoolLoading(null)
    }
  }

  // ---- Die Operationen ----

  async function reroll(segment: UnitSegment, itemKey: string) {
    // Edge Case 13: der zweite Klick wird ignoriert, solange der erste läuft.
    if (rolling !== null) return

    setRolling(itemKey)
    try {
      const pool = await ensurePool(segment.id)
      if (!pool) return

      const drawn = drawCandidate(pool, exclusionsFor(draft, segment.id, itemKey))
      if (!drawn) {
        toast({
          variant: 'destructive',
          title: 'Keine weitere passende Übung',
          description:
            segment.gapReason ??
            `Alle passenden Übungen der Phase „${segment.name}" stehen in dieser Einheit schon.`,
        })
        return
      }

      change((current) => rerollItem(current, segment.id, itemKey, placementFrom(drawn)))
    } finally {
      setRolling(null)
    }
  }

  async function openPicker(target: PickerTarget) {
    setPicker(target)
    await ensurePool(target.segmentId)
  }

  async function openVariants(segmentId: string, itemKey: string) {
    const pool = await ensurePool(segmentId)
    if (!pool) return
    setVariantTarget({ segmentId, itemKey })
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

  /** Segmente, die nicht aufgehen — namentlich, für den Speichern-Dialog. */
  const mismatches: SegmentMismatch[] = React.useMemo(() => {
    return unit.segments
      .map((segment) => {
        const draftSegment = draft.segments.find((entry) => entry.id === segment.id)
        if (!draftSegment) return null
        // Ein bewusst frei gelassener und leerer Abschnitt ist Absicht, keine
        // Abweichung. Sobald er Übungen trägt, wird sein Stand ausgewiesen.
        if (segment.fillMode === 'empty' && draftSegment.items.length === 0) return null

        const balance = segmentBalance(draftSegment, segment.minutes)
        if (balance.free === 0 && balance.over === 0) return null
        return { name: segment.name, free: balance.free, over: balance.over }
      })
      .filter((entry): entry is SegmentMismatch => entry !== null)
  }, [unit.segments, draft])

  useUnsavedChanges(editing && dirty, (proceed) => {
    setPrompt({ mode: 'leave', proceed })
  })

  function requestSave() {
    if (mismatches.length > 0) {
      setPrompt({ mode: 'confirm' })
      return
    }
    void savePlan()
  }

  async function savePlan(force = false) {
    if (!editorActions) {
      missingBackend()
      return
    }

    // Ein Entwurf bekommt beim Speichern erst seinen Namen.
    if (!unit.saved) {
      setPrompt(null)
      setNaming(true)
      return
    }

    setSaving(true)
    try {
      const result = await editorActions.savePlan(draft, {
        expectedUpdatedAt: unit.updatedAt,
        force,
      })

      if (result.stale) {
        setPrompt(null)
        setStaleOpen(true)
        return
      }
      if (result.error) {
        // Die Einheit bleibt im Bearbeiten-Modus, die Änderungen bleiben stehen.
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }

      setPrompt(null)
      setQuickCreated([])
      // Speichern beendet das Bearbeiten — es gibt keinen zweiten Knopf dafür.
      setEditing(false)
      toast({ title: 'Änderungen gespeichert' })
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

  const [staleOpen, setStaleOpen] = React.useState(false)

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

  /** Lockern wirkt nur in dem Segment, in dem der Nutzer geklickt hat. */
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

  async function save(name: string) {
    setBusy('save')
    try {
      const result = await saveUnit(unit.id, name)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      setNaming(false)
      toast({ title: 'Einheit gespeichert' })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Speichern fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setBusy(null)
    }
  }

  /**
   * Lücken sperren das Speichern **nicht mehr**. Die Sperre existierte, weil der
   * Nutzer keine Handhabe hatte — mit dem Bearbeiten-Modus hat er eine, und der
   * Hinweis verweist dorthin statt in den Generator zurück.
   */
  const gapSegmentNames = unit.segments
    .filter(
      (segment) =>
        segment.fillMode === 'generate' &&
        segment.items.reduce((sum, item) => sum + item.plannedDuration, 0) < segment.minutes
    )
    .map((segment) => segment.name)
  const hasGaps = gapSegmentNames.length > 0

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

  const variantDraftItem = variantTarget
    ? draft.segments
        .find((segment) => segment.id === variantTarget.segmentId)
        ?.items.find((item) => item.key === variantTarget.itemKey)
    : null

  const quickCreateDefaults: QuickCreateDefaults = {
    sports: pickerSegment?.sports ?? [],
    phase: pickerSegment?.name ?? '',
    difficulty: pickerSegment?.difficulties[0] ?? 'Mittel',
    ageGroups: [],
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
              disabled={busy !== null}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Button>
          )}

          {/* Im Bearbeiten-Modus sagt die Leiste, was offen ist, und ihr Hauptknopf
              speichert. „Gespeichert" stünde dort neben ungespeicherten Änderungen,
              und „Einheit speichern" würde den Entwurf ohne sie sichern. */}
          {editing ? null : unit.saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Gespeichert
            </span>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setNaming(true)}
              disabled={busy !== null}
            >
              {busy === 'save' ? (
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
                <Button variant="outline" size="sm" disabled={busy !== null}>
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
            <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
              {busy === 'regenerate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Neu generieren
            </Button>
          )}
        </div>

        {!unit.saved && (
          <p className="text-xs text-muted-foreground">
            {hasGaps ? (
              <>
                <span className="font-medium text-foreground">Mit Lücken:</span>{' '}
                {gapSegmentNames.length === 1
                  ? `Das Segment „${gapSegmentNames[0]}" ist nicht voll.`
                  : `Diese Segmente sind nicht voll: ${gapSegmentNames
                      .map((name) => `„${name}"`)
                      .join(', ')}.`}{' '}
                Du kannst trotzdem speichern — oder die Lücken über
                &bdquo;Bearbeiten&ldquo; selbst füllen.
              </>
            ) : (
              <>
                Noch nicht gespeichert — diese Einheit erscheint erst in deinen Übersichten,
                wenn du sie speicherst. Ein neuer Durchlauf im Generator ersetzt sie.
              </>
            )}
          </p>
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
        onOpenChange={setNaming}
        title="Einheit speichern"
        description="Unter diesem Namen findest du die Einheit später wieder. Der Vorschlag aus Gruppe und Datum lässt sich überschreiben."
        confirmLabel="Speichern"
        initialName={unit.name}
        busy={busy === 'save'}
        onConfirm={save}
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
              onSwitchVariant={(itemKey) => void openVariants(segment.id, itemKey)}
              onInsert={() => void openPicker({ segmentId: segment.id })}
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

      <VariantSwitchDialog
        open={variantTarget !== null}
        onOpenChange={(open) => {
          if (!open) setVariantTarget(null)
        }}
        variants={
          variantTarget && variantDraftItem?.exerciseId
            ? variantsOf(pools[variantTarget.segmentId] ?? [], variantDraftItem.exerciseId)
            : []
        }
        currentKey={
          variantDraftItem?.exerciseId
            ? candidateKey(variantDraftItem.exerciseId, variantDraftItem.variantId)
            : null
        }
        onPick={(candidate) => {
          if (!variantTarget) return
          change((current) =>
            setItemExercise(
              current,
              variantTarget.segmentId,
              variantTarget.itemKey,
              placementFrom(candidate)
            )
          )
        }}
      />

      <SaveChangesPrompt
        open={prompt !== null}
        onOpenChange={(open) => {
          if (!open) setPrompt(null)
        }}
        mode={prompt?.mode ?? 'leave'}
        mismatches={mismatches}
        quickCreated={quickCreated}
        saving={saving}
        onSave={() => void savePlan()}
        onDiscard={discardAndLeave}
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
            <Button variant="outline" onClick={() => router.refresh()}>
              Neu laden
            </Button>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                setStaleOpen(false)
                void savePlan(true)
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
  onSwitchVariant: (itemKey: string) => void
  onInsert: () => void
}

function SegmentBlock({
  segment,
  draftSegment,
  editing,
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
  onSwitchVariant,
  onInsert,
}: SegmentBlockProps) {
  // Im Bearbeiten-Modus zeigt die Arbeitsfassung den Stand, in der Leseansicht
  // die geladene Einheit.
  const items = editing && draftSegment ? draftSegment.items : segment.items
  const notes = editing && draftSegment ? draftSegment.notes : segment.notes
  const filledMinutes = items.reduce((sum, item) => sum + item.plannedDuration, 0)
  const hasGap = segment.fillMode === 'generate' && filledMinutes < segment.minutes

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
        {editing && draftSegment ? (
          <SegmentFillStatus balance={segmentBalance(draftSegment, segment.minutes)} />
        ) : (
          <span className="text-xs text-muted-foreground tabular-nums">
            {segment.minutes} Min
          </span>
        )}
      </div>

      {editing && draftSegment ? (
        <SegmentNoteField
          segmentId={segment.id}
          segmentName={segment.name}
          notes={notes}
          onChange={onNotesChange}
        />
      ) : (
        notes && (
          <p className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-wrap">{notes}</p>
        )
      )}

      {showAsEmpty && !editing ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          — Lücke —
          <p className="mt-1 text-xs">
            {notes ? 'Du füllst diesen Abschnitt selbst.' : 'Bewusst frei gelassen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item, index) => {
            const itemKey = 'key' in item ? item.key : item.id

            return (
              <div key={itemKey}>
                <UnitItemCard
                  item={item}
                  refill={
                    editing && item.exercise === null
                      ? {
                          rolling: rollingKey === itemKey,
                          onReroll: () => onReroll(itemKey),
                          onChoose: () => onChoose(itemKey),
                        }
                      : undefined
                  }
                />
                {editing && item.exercise !== null && (
                  <UnitItemControls
                    itemKey={itemKey}
                    plannedDuration={item.plannedDuration}
                    estimatedDuration={item.exercise.estimatedDuration}
                    position={index + 1}
                    total={items.length}
                    hasVariants={item.exercise.variantCount > 0}
                    rolling={rollingKey === itemKey}
                    onDurationChange={(minutes) => onDurationChange(itemKey, minutes)}
                    onMoveUp={() => onMove(itemKey, 'up')}
                    onMoveDown={() => onMove(itemKey, 'down')}
                    onReroll={() => onReroll(itemKey)}
                    onChoose={() => onChoose(itemKey)}
                    onSwitchVariant={() => onSwitchVariant(itemKey)}
                    onRemove={() => onRemove(itemKey)}
                  />
                )}
              </div>
            )
          })}

          {showAsEmpty && editing && (
            <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
              Dieser Abschnitt ist zum Selberfüllen vorgesehen.
            </p>
          )}

          {hasGap && (
            <GapNotice
              segmentMinutes={segment.minutes}
              filledMinutes={filledMinutes}
              reason={segment.gapReason}
              detail={segment.gapDetail}
              singleSportGroup={singleSportGroup}
              relaxing={relaxing}
              onRelax={onRelax}
              onInsert={editing ? onInsert : undefined}
            />
          )}

          {editing && (
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
