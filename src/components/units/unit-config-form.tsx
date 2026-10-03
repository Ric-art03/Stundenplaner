'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, RotateCcw, Sparkles } from 'lucide-react'
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
import { DIFFICULTY_LEVELS, PHASES, SPORTS } from '@/lib/types/exercise'
import type { DifficultyLevel } from '@/lib/types/exercise'
import {
  addSegment,
  buildClassicSegments,
  removeSegment,
  setSegmentMinutes,
  sumMinutes,
} from '@/lib/units/timeline'
import type { SegmentConfig, UnitMode } from '@/lib/types/unit'
import type { Group } from '@/lib/types/group'

const ALL_DIFFICULTIES = [...DIFFICULTY_LEVELS] as DifficultyLevel[]

interface UnitConfigFormProps {
  groups: Group[]
  customPhases: string[]
  customSports: string[]
  initialGroupId?: string
}

export function UnitConfigForm({
  groups,
  customPhases,
  customSports,
  initialGroupId,
}: UnitConfigFormProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [groupId, setGroupId] = React.useState(initialGroupId ?? '')
  const [mode, setMode] = React.useState<UnitMode>('standard')
  const [classicSegments, setClassicSegments] = React.useState<SegmentConfig[]>([])
  // Bleibt über den Wechsel zu „Standard" hinweg erhalten, damit der
  // Bearbeitungsstand beim Zurückschalten nicht verloren ist.
  const [customSegments, setCustomSegments] = React.useState<SegmentConfig[] | null>(null)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
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
      return
    }
    setClassicSegments(buildClassicSegments(group.unitDuration, group.sports, ALL_DIFFICULTIES))
    setCustomSegments(null)
    setMode('standard')
    setSelectedId(null)
  }, [group?.id, group?.unitDuration])

  const segments = mode === 'custom' ? (customSegments ?? classicSegments) : classicSegments

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

  function handleModeChange(next: UnitMode) {
    setMode(next)
    if (next === 'custom') {
      const base = customSegments ?? classicSegments
      if (!customSegments) setCustomSegments(base)
      setSelectedId(base[0]?.id ?? null)
    }
  }

  /** Bearbeitungen landen immer im individuellen Stand, nie in der Standardvorlage. */
  function applySegments(next: SegmentConfig[]) {
    setCustomSegments(next)
  }

  function resetToStandard() {
    if (!group) return
    const fresh = buildClassicSegments(group.unitDuration, group.sports, ALL_DIFFICULTIES)
    setCustomSegments(fresh)
    setSelectedId(fresh[0]?.id ?? null)
    toast({ title: 'Auf Standard zurückgesetzt' })
  }

  function handleAddSegment() {
    if (!group) return
    const next = addSegment(segments, 'Hauptteil', group.sports, ALL_DIFFICULTIES)
    if (next.length === segments.length) {
      toast({
        variant: 'destructive',
        title: 'Kein Platz für ein weiteres Segment',
        description:
          'Kein Segment kann noch Minuten abgeben. Verlängere die Einheitsdauer im Gruppenprofil.',
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

    const config = { groupId: group.id, totalMinutes, segments }
    const parsed = unitConfigSchema.safeParse(config)

    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Die Konfiguration ist unvollständig.')
      return
    }

    setSubmitting(true)
    try {
      const result = await generateUnit(config)
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
        <Select value={groupId} onValueChange={setGroupId}>
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
              onValueChange={(value) => handleModeChange(value as UnitMode)}
              className="gap-3"
            >
              <ChoiceRow
                id="mode-standard"
                value="standard"
                title="Standard"
                description={`Volle ${totalMinutes} Minuten werden mit Übungen ausgefüllt — klassische Verteilung 20 / 60 / 20 auf Aufwärmen, Hauptteil und Cool-Down.`}
              />
              <ChoiceRow
                id="mode-custom"
                value="custom"
                title="Individuell"
                description="Eigene Phasen, eigene Längen, eigene Reihenfolge — und Abschnitte, die bewusst frei bleiben können."
              />
            </RadioGroup>
          </section>

          {/* Zeitverlauf */}
          {mode === 'custom' && segments.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Label className="text-base font-semibold">Zeitverlauf</Label>
                  <p className="text-xs text-muted-foreground">
                    Grenzen ziehen zum Verteilen, Segmente seitwärts ziehen zum Umsortieren.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={resetToStandard}
                  className="shrink-0"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Auf Standard zurücksetzen
                </Button>
              </div>

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

              <Button type="button" variant="outline" size="sm" onClick={handleAddSegment}>
                <Plus className="mr-2 h-4 w-4" />
                Segment hinzufügen
              </Button>
            </section>
          )}

          {minutesMismatch && (
            <Alert variant="destructive">
              <AlertDescription>
                Die Segmente ergeben {sumMinutes(segments)} Minuten, die Einheit hat aber{' '}
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
        </>
      )}
    </form>
  )
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
