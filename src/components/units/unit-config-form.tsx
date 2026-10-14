'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { LayoutList, Loader2, Plus, RotateCcw, Save, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { GroupHints } from './group-hints'
import { SegmentTimeline } from './segment-timeline'
import { SegmentEditor } from './segment-editor'
import { generateUnit } from '@/lib/actions/units'
import { unitConfigSchema } from '@/lib/validations/unit'
import { DIFFICULTY_LEVELS, ORGANIZATION_FORMS, PHASES, SPORTS } from '@/lib/types/exercise'
import type { DifficultyLevel } from '@/lib/types/exercise'
import {
  addSegment,
  buildClassicSegments,
  removeSegment,
  setSegmentMinutes,
  sumMinutes,
} from '@/lib/units/timeline'
import type { EditorState, SegmentConfig, UnitMode } from '@/lib/types/unit'
import type { Group } from '@/lib/types/group'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ManageLink } from '@/components/manage/manage-link'
import { manageHref } from '@/lib/manage/tabs'
import { SavePatternDialog } from './save-pattern-dialog'
import {
  applyPattern,
  patternOptionLabel,
  patternTooLongMessage,
  sortPatterns,
  toPatternSegments,
  type PatternTarget,
  type UnitPattern,
} from '@/lib/units/patterns'

const ALL_DIFFICULTIES = [...DIFFICULTY_LEVELS] as DifficultyLevel[]

/** Der dritte Weg ist ein Bedienstand der Maske — gespeichert wird er als „Individuell". */
type FormMode = UnitMode | 'pattern'

type PendingReplace =
  | { kind: 'pattern'; id: string }
  | { kind: 'group'; groupId: string }
  | null

interface UnitConfigFormProps {
  groups: Group[]
  /** Die Stundenmuster des Nutzers, alphabetisch. */
  patterns?: UnitPattern[]
  customPhases: string[]
  customSports: string[]
  customOrganizationForms?: string[]
  initialGroupId?: string
  /**
   * Konfiguration einer bestehenden Einheit, wenn der Nutzer über „Zurück zum
   * Generator" kommt — mit dem Bedienstand, den er damals verlassen hat.
   */
  initialSegments?: SegmentConfig[]
  initialEditorState?: EditorState
  /**
   * „Im Generator öffnen" aus der Verwaltung: das Muster ist vorgewählt und
   * wird angewendet, sobald eine Gruppe gewählt ist.
   */
  initialPatternId?: string
  /** Das Muster aus der Adresse gibt es nicht mehr. */
  patternMissing?: boolean
}

const NO_PATTERNS: UnitPattern[] = []

export function UnitConfigForm({
  groups,
  patterns: initialPatterns = NO_PATTERNS,
  customPhases,
  customSports,
  customOrganizationForms = [],
  initialGroupId,
  initialSegments,
  initialEditorState,
  initialPatternId,
  patternMissing = false,
}: UnitConfigFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [groupId, setGroupId] = React.useState(initialGroupId ?? '')
  const [mode, setMode] = React.useState<FormMode>(
    initialSegments
      ? (initialEditorState?.mode ?? 'custom')
      : initialPatternId
        ? 'pattern'
        : 'standard'
  )
  const [patterns, setPatterns] = React.useState(initialPatterns)
  // Das Muster, aus dem der Zeitverlauf stammt. Der Verweis hält denselben
  // Wert für den Effekt beim Gruppenwechsel bereit.
  const [patternId, setPatternId] = React.useState<string | null>(initialPatternId ?? null)
  const patternIdRef = React.useRef<string | null>(initialPatternId ?? null)
  const patternsRef = React.useRef(initialPatterns)
  /**
   * Das gewählte Muster passt nicht zur Gruppe (mehr Segmente als Minuten).
   * Es bleibt gewählt, damit eine andere Gruppe es übernehmen kann — aber ohne
   * Zeitverlauf, damit nichts anderes als dieses Muster generiert wird.
   */
  const [blocked, setBlocked] = React.useState<{ segmentCount: number; totalMinutes: number } | null>(
    null
  )
  /** Die ursprüngliche Dauer, wenn das geladene Muster umgerechnet wurde. */
  const [convertedFrom, setConvertedFrom] = React.useState<number | null>(null)
  // Von Hand verändert seit Standard bzw. dem zuletzt geladenen Muster. Ein
  // über „Zurück zum Generator" mitgebrachter Stand gilt als verändert.
  const [touched, setTouched] = React.useState(!!initialSegments)
  const [pendingReplace, setPendingReplace] = React.useState<PendingReplace>(null)
  const [saveOpen, setSaveOpen] = React.useState(false)
  // Phasen, die in diesem Formular neu eingetippt wurden — nur sie kommen
  // beim Generieren in die eigenen Kategorien.
  const typedPhases = React.useRef(new Set<string>())
  const [classicSegments, setClassicSegments] = React.useState<SegmentConfig[]>([])
  // Bleibt über den Wechsel zu „Standard" hinweg erhalten, damit der
  // Bearbeitungsstand beim Zurückschalten nicht verloren ist.
  const [customSegments, setCustomSegments] = React.useState<SegmentConfig[] | null>(
    initialSegments ?? null
  )
  // Die zuletzt wirksame Gruppe. Entscheidend ist der **Wechsel**, nicht wie
  // oft der Effekt läuft: React führt Effekte im Entwicklungsmodus doppelt aus,
  // und jedes Neurendern mit frischen Server-Daten erzeugt ein neues
  // `group`-Objekt. Ein Einmal-Schalter wäre dabei nach dem ersten Lauf
  // verbraucht und würde den mitgebrachten Stand beim zweiten verwerfen.
  // Nur ein mitgebrachter Stand gilt als schon angewendet; sonst läuft die
  // Gruppe wie ein frischer Wechsel durch, damit ein vorgewähltes Muster greift.
  const lastGroupId = React.useRef<string | null>(
    initialSegments ? (initialGroupId ?? null) : null
  )
  const [selectedId, setSelectedId] = React.useState<string | null>(
    // Der Einstellbereich, der beim Verlassen offen war — über die Position,
    // weil die Kennungen im Formular bei jedem Laden neu vergeben werden.
    initialSegments && initialEditorState?.expandedPosition != null
      ? (initialSegments[initialEditorState.expandedPosition]?.id ?? null)
      : null
  )
  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)

  const group = groups.find((g) => g.id === groupId) ?? null
  const totalMinutes = group?.unitDuration ?? 0

  // Beim Gruppenwechsel alles zurücksetzen — Einheitsdauer und Sportarten
  // der neuen Gruppe sind andere, ein alter Bearbeitungsstand passt nicht mehr.
  React.useEffect(() => {
    if (!group) {
      setClassicSegments([])
      setCustomSegments(null)
      setSelectedId(null)
      lastGroupId.current = null
      return
    }

    // Die Standardvorlage gehört immer zur aktuellen Gruppe.
    setClassicSegments(
      buildClassicSegments(group.unitDuration, group.sports, ALL_DIFFICULTIES, group.primarySport)
    )

    // Dieselbe Gruppe wie zuvor: nichts verwerfen. Das deckt den Lauf beim
    // Mounten mit, womit ein über „Zurück zum Generator" mitgebrachter Stand
    // erhalten bleibt — auch wenn der Effekt mehrfach läuft.
    if (lastGroupId.current === group.id) return

    lastGroupId.current = group.id
    setSelectedId(null)
    setTouched(false)

    // Ein geladenes Stundenmuster bleibt gewählt und wird für die neue Gruppe
    // frisch angewendet — mit deren Dauer und deren Sportarten.
    const pattern = patternsRef.current.find((p) => p.id === patternIdRef.current)
    if (pattern) {
      const result = applyPattern(pattern, patternTarget(group))
      if (result.ok) {
        setCustomSegments(result.segments)
        setConvertedFrom(result.convertedFrom)
        setBlocked(null)
        return
      }
      toast({
        variant: 'destructive',
        title: 'Stundenmuster passt nicht zu dieser Gruppe',
        description: patternTooLongMessage(result.segmentCount, result.totalMinutes),
      })
      // Gewählt bleiben — eine andere Gruppe kann es übernehmen.
      setBlocked({ segmentCount: result.segmentCount, totalMinutes: result.totalMinutes })
      setCustomSegments(null)
      setConvertedFrom(null)
      setMode('pattern')
      return
    }

    patternIdRef.current = null
    setPatternId(null)
    setBlocked(null)
    setConvertedFrom(null)
    setCustomSegments(null)
    setMode('standard')
  }, [group, toast])

  // Aus der Verwaltung mit einem Muster gekommen, das es nicht mehr gibt.
  const missingNoticed = React.useRef(false)
  React.useEffect(() => {
    if (!patternMissing || missingNoticed.current) return
    missingNoticed.current = true
    toast({
      title: 'Dieses Stundenmuster gibt es nicht mehr',
      description: 'Es wurde inzwischen gelöscht. Der Generator steht auf „Standard“.',
    })
  }, [patternMissing, toast])

  // Frische Liste vom Server, etwa nach einem Abstecher in die Verwaltung.
  React.useEffect(() => {
    setPatterns(initialPatterns)
    patternsRef.current = initialPatterns
  }, [initialPatterns])

  const loadedPattern = patterns.find((p) => p.id === patternId) ?? null
  const showTimeline =
    mode === 'custom' || (mode === 'pattern' && patternId !== null && blocked === null)
  const segments = mode === 'standard' ? classicSegments : (customSegments ?? classicSegments)

  function selectPattern(id: string | null) {
    patternIdRef.current = id
    setPatternId(id)
  }

  function loadPattern(id: string) {
    const pattern = patterns.find((p) => p.id === id)
    if (!pattern || !group) return

    const result = applyPattern(pattern, patternTarget(group))
    if (!result.ok) {
      toast({
        variant: 'destructive',
        title: 'Stundenmuster passt nicht zu dieser Gruppe',
        description: patternTooLongMessage(result.segmentCount, result.totalMinutes),
      })
      return
    }

    setCustomSegments(result.segments)
    selectPattern(id)
    setBlocked(null)
    setConvertedFrom(result.convertedFrom)
    setTouched(false)
    setSelectedId(null)
    setFormError(null)
  }

  /** Lädt ein Muster — fragt vorher, wenn dabei Handarbeit verloren ginge. */
  function requestPattern(id: string) {
    if (touched) setPendingReplace({ kind: 'pattern', id })
    else loadPattern(id)
  }

  function handleGroupChange(next: string) {
    if (next === groupId) return
    if (patternId && touched) setPendingReplace({ kind: 'group', groupId: next })
    else setGroupId(next)
  }

  function confirmReplace() {
    if (!pendingReplace) return
    if (pendingReplace.kind === 'pattern') loadPattern(pendingReplace.id)
    else setGroupId(pendingReplace.groupId)
    setPendingReplace(null)
  }

  function handlePatternSaved(saved: UnitPattern) {
    const next = sortPatterns([...patterns.filter((p) => p.id !== saved.id), saved])
    setPatterns(next)
    patternsRef.current = next
    selectPattern(saved.id)
    setTouched(false)
    setConvertedFrom(null)
    toast({
      title: `Stundenmuster „${saved.name}" gespeichert`,
      description: 'Es steht jetzt in der Auswahl des Generators und in der Verwaltung.',
    })
  }

  const phaseOptions = React.useMemo(
    () => [...PHASES, ...customPhases.filter((p) => !PHASES.includes(p as never))],
    [customPhases]
  )

  // Die Sportarten der Gruppe stehen oben in der Liste.
  const sportOptions = React.useMemo(() => {
    if (!group) return [...SPORTS]
    const rest = [...SPORTS, ...customSports].filter((s) => !group.sports.includes(s))
    return [...group.sports, ...Array.from(new Set(rest))]
  }, [group, customSports])

  function handleModeChange(next: FormMode) {
    setMode(next)
    setFormError(null)
    // Ein unpassendes Muster bleibt nur gewählt, solange der Weg „Stundenmuster" offen ist.
    if (blocked && next !== 'pattern') {
      selectPattern(null)
      setBlocked(null)
    }
    if (next === 'custom') {
      const base = customSegments ?? classicSegments
      if (!customSegments) setCustomSegments(base)
      setSelectedId(base[0]?.id ?? null)
    }
  }

  // Dieselbe Auswahl wie im Übungs-Wizard: die vordefinierten und die eigenen.
  const organizationFormOptions = React.useMemo(
    () => Array.from(new Set([...ORGANIZATION_FORMS, ...customOrganizationForms])),
    [customOrganizationForms]
  )

  /** Bearbeitungen landen immer im individuellen Stand, nie in der Standardvorlage. */
  function applySegments(next: SegmentConfig[]) {
    setCustomSegments(next)
    setTouched(true)
  }

  function resetToStandard() {
    if (!group) return
    const fresh = buildClassicSegments(
      group.unitDuration,
      group.sports,
      ALL_DIFFICULTIES,
      group.primarySport
    )
    setCustomSegments(fresh)
    setSelectedId(fresh[0]?.id ?? null)
    selectPattern(null)
    setConvertedFrom(null)
    setTouched(false)
    // Ohne gewähltes Muster zeigt der Weg „Stundenmuster" keinen Zeitverlauf.
    if (mode === 'pattern') setMode('custom')
    toast({ title: 'Auf Standard zurückgesetzt' })
  }

  function handleAddSegment() {
    if (!group) return
    const next = addSegment(
      segments,
      'Hauptteil',
      group.sports,
      ALL_DIFFICULTIES,
      group.primarySport
    )
    if (next.length === segments.length) {
      toast({
        variant: 'destructive',
        title: 'Kein Platz für eine weitere Phase',
        description:
          'Keine Phase kann noch Minuten abgeben. Verlängere die Einheitsdauer im Gruppenprofil.',
      })
      return
    }
    applySegments(next)
    setSelectedId(next[next.length - 1].id)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!group) {
      setFormError('Bitte wähle zuerst eine Gruppe aus.')
      return
    }

    if (mode === 'pattern' && !patternId) {
      setFormError('Bitte wähle ein Stundenmuster aus — oder nimm „Standard" oder „Individuell".')
      return
    }

    if (mode === 'pattern' && blocked) {
      setFormError(patternTooLongMessage(blocked.segmentCount, blocked.totalMinutes))
      return
    }

    const expandedIndex = selectedId
      ? segments.findIndex((segment) => segment.id === selectedId)
      : -1

    const config = {
      groupId: group.id,
      totalMinutes,
      segments,
      editorState: {
        // Die Einheit merkt sich ihren Zeitverlauf, nicht ihr Muster: aus
        // „Stundenmuster" wird beim Zurückkommen „Individuell".
        mode: (mode === 'standard' ? 'standard' : 'custom') as UnitMode,
        // findIndex liefert -1, wenn das Segment zwischenzeitlich entfernt
        // wurde — das wäre keine gültige Position.
        expandedPosition: expandedIndex >= 0 ? expandedIndex : null,
      },
    }
    const parsed = unitConfigSchema.safeParse(config)

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Die Konfiguration ist unvollständig.')
      return
    }

    setSubmitting(true)
    try {
      const result = await generateUnit(config, [...typedPhases.current])
      if (result.error || !result.unitId) {
        setFormError(result.error ?? 'Generieren fehlgeschlagen, bitte erneut versuchen.')
        return
      }
      router.push(`/units/${result.unitId}`)
    } catch {
      setFormError('Generieren fehlgeschlagen, bitte erneut versuchen.')
    } finally {
      setSubmitting(false)
    }
  }

  const minutesMismatch = group ? sumMinutes(segments) !== totalMinutes : false

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* 1. Gruppe */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">1. Für welche Gruppe?</h2>
          <p className="text-xs text-muted-foreground">
            Der Generator richtet die Einheit nach diesem Profil aus.
          </p>
        </div>
        <Select value={groupId} onValueChange={handleGroupChange}>
          <SelectTrigger aria-label="Gruppe">
            <SelectValue placeholder="Gruppe auswählen" />
          </SelectTrigger>
          <SelectContent>
            {groups.map((g) => (
              <SelectItem key={g.id} value={g.id}>
                {g.name} · {g.unitDuration} Min
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {group && <GroupHints group={group} />}
      </section>

      {group && (
        <>
          <Separator />

          {/* 2. Aufbau */}
          <section className="space-y-3">
            <div>
              <h2 className="text-base font-semibold">2. Wie soll die Einheit aufgebaut sein?</h2>
              <p className="text-xs text-muted-foreground">
                Standard genügt für die meisten Stunden — ein Klick und fertig.
              </p>
            </div>
            <RadioGroup
              value={mode}
              onValueChange={(value) => handleModeChange(value as FormMode)}
              className="gap-3"
            >
              <ChoiceRow
                id="mode-standard"
                value="standard"
                title="Standard"
                description={`Volle ${totalMinutes} Minuten werden mit Übungen ausgefüllt — klassische Verteilung 20 / 60 / 20 auf Aufwärmen, Hauptteil und Cool-Down.`}
              />
              <div className="space-y-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                <div className="flex items-start gap-3">
                  <RadioGroupItem
                    value="pattern"
                    id="mode-pattern"
                    className="mt-0.5"
                    disabled={patterns.length === 0}
                  />
                  <div className="space-y-0.5">
                    <Label
                      htmlFor="mode-pattern"
                      className={`text-sm font-medium ${
                        patterns.length === 0 ? 'text-muted-foreground' : 'cursor-pointer'
                      }`}
                    >
                      Stundenmuster
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {patterns.length === 0
                        ? 'Du hast noch kein Stundenmuster. So entsteht eines: unter „Individuell" den Zeitverlauf einrichten und „Stundenmuster speichern" wählen.'
                        : `Ein Aufbau, den du abgelegt hast — auf die ${totalMinutes} Minuten dieser Gruppe umgerechnet und weiter anpassbar.`}
                    </p>
                  </div>
                </div>
                {mode === 'pattern' && patterns.length > 0 && (
                  <div className="space-y-2 pl-7">
                    <Select value={patternId ?? ''} onValueChange={requestPattern}>
                      <SelectTrigger aria-label="Stundenmuster">
                        <SelectValue placeholder="Stundenmuster auswählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {patterns.map((pattern) => (
                          <SelectItem key={pattern.id} value={pattern.id}>
                            {patternOptionLabel(pattern)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {blocked && (
                      <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">
                        {patternTooLongMessage(blocked.segmentCount, blocked.totalMinutes)}
                      </p>
                    )}
                    <ManageLink href={manageHref('patterns')}>Stundenmuster verwalten</ManageLink>
                  </div>
                )}
              </div>
              <ChoiceRow
                id="mode-custom"
                value="custom"
                title="Individuell"
                description="Eigene Phasen, eigene Längen, eigene Reihenfolge — und Abschnitte, die bewusst frei bleiben können."
              />
            </RadioGroup>
          </section>

          {/* Zeitverlauf */}
          {showTimeline && segments.length > 0 && (
            <section className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Zeitverlauf</Label>
                <p className="text-xs text-muted-foreground">
                  Grenzen ziehen zum Verteilen, Phasen seitwärts ziehen zum Umsortieren.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={resetToStandard}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Auf Standard zurücksetzen
                </Button>
                {patterns.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <LayoutList className="mr-2 h-4 w-4" />
                        Auf Stundenmuster setzen
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
                      {patterns.map((pattern) => (
                        <DropdownMenuItem key={pattern.id} onSelect={() => requestPattern(pattern.id)}>
                          {patternOptionLabel(pattern)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSaveOpen(true)}
                  disabled={minutesMismatch}
                >
                  <Save className="mr-2 h-4 w-4" />
                  Stundenmuster speichern
                </Button>
              </div>
              {minutesMismatch && (
                <p className="text-xs text-muted-foreground">
                  „Stundenmuster speichern“ geht erst, wenn die Phasen zusammen {totalMinutes}{' '}
                  Minuten ergeben.
                </p>
              )}

              {loadedPattern && convertedFrom !== null && (
                <p className="rounded-md bg-muted px-3 py-2 text-sm" role="status">
                  Muster von {convertedFrom} auf {totalMinutes} Minuten umgerechnet.
                </p>
              )}

              <SegmentTimeline
                segments={segments}
                totalMinutes={totalMinutes}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onChange={applySegments}
              />

              <Accordion
                type="single"
                collapsible
                value={selectedId ?? undefined}
                onValueChange={(value) => setSelectedId(value || null)}
                className="divide-y rounded-lg border"
              >
                {segments.map((segment) => (
                  <AccordionItem key={segment.id} value={segment.id} className="border-b-0 px-3">
                    <AccordionTrigger className="hover:no-underline">
                      <span className="flex flex-1 items-center justify-between gap-3 pr-2 text-left">
                        <span className="truncate text-base font-semibold">
                          {segment.name}
                          {segment.fillMode === 'empty' && (
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              frei
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                          {segment.minutes} Min
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <SegmentEditor
                        segment={segment}
                        count={segments.length}
                        totalMinutes={totalMinutes}
                        phaseOptions={phaseOptions}
                        sportOptions={sportOptions}
                        organizationFormOptions={organizationFormOptions}
                        onPhaseCreated={(name) => typedPhases.current.add(name)}
                        onChange={(updated) =>
                          applySegments(
                            segments.map((s) => (s.id === updated.id ? updated : s))
                          )
                        }
                        onMinutesChange={(minutes) =>
                          applySegments(
                            setSegmentMinutes(segments, segment.id, minutes, totalMinutes)
                          )
                        }
                        onRemove={() => {
                          applySegments(removeSegment(segments, segment.id))
                          setSelectedId(null)
                        }}
                      />
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="outline" size="sm" onClick={handleAddSegment}>
                  <Plus className="mr-2 h-4 w-4" />
                  Phase hinzufügen
                </Button>
                {/* Ein Link für alle Segmente statt einer an jeder Phase. */}
                <ManageLink href={manageHref('categories')}>Kategorien verwalten</ManageLink>
              </div>
            </section>
          )}

          {minutesMismatch && (
            <Alert variant="destructive">
              <AlertDescription>
                Die Phasen ergeben {sumMinutes(segments)} Minuten, die Einheit hat aber{' '}
                {totalMinutes} Minuten.
              </AlertDescription>
            </Alert>
          )}

          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="submit" disabled={submitting} className="sm:w-auto">
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              {submitting ? 'Wird generiert…' : 'Einheit generieren'}
            </Button>
            <p className="text-xs text-muted-foreground">
              {mode === 'standard'
                ? 'Standardeinstellung — ein Klick genügt.'
                : 'Deine Einstellungen werden mit der Einheit gespeichert.'}
            </p>
          </div>

          <SavePatternDialog
            open={saveOpen}
            onOpenChange={setSaveOpen}
            patterns={patterns}
            loadedPattern={loadedPattern}
            totalMinutes={totalMinutes}
            getSegments={() => toPatternSegments(segments, group)}
            onSaved={handlePatternSaved}
          />

          <AlertDialog
            open={pendingReplace !== null}
            onOpenChange={(open) => !open && setPendingReplace(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Bisherigen Zeitverlauf ersetzen?</AlertDialogTitle>
                <AlertDialogDescription>
                  {pendingReplace?.kind === 'group'
                    ? 'Das Stundenmuster wird für die neue Gruppe frisch angewendet. Was du am Zeitverlauf von Hand geändert hast, geht dabei verloren.'
                    : 'Das Stundenmuster ersetzt den Zeitverlauf. Was du von Hand geändert hast, geht dabei verloren.'}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={confirmReplace}>Ersetzen</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </form>
  )
}

function patternTarget(group: Group): PatternTarget {
  return {
    totalMinutes: group.unitDuration,
    sports: group.sports,
    primarySport: group.primarySport,
  }
}

function ChoiceRow({
  id,
  value,
  title,
  description,
}: {
  id: string
  value: string
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <RadioGroupItem value={value} id={id} className="mt-0.5" />
      <div className="space-y-0.5">
        <Label htmlFor={id} className="cursor-pointer text-sm font-medium">
          {title}
        </Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
