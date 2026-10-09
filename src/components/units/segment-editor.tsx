'use client'

import * as React from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MultiSelect } from '@/components/exercises/multi-select'
import { WorkNoteField } from '@/components/exercises/work-note'
import { resolvePrimarySport } from '@/lib/units/timeline'
import { PhaseSelect } from './phase-select'
import { DIFFICULTY_LEVELS } from '@/lib/types/exercise'
import type { DifficultyLevel } from '@/lib/types/exercise'
import type { SegmentConfig } from '@/lib/types/unit'

interface SegmentEditorProps {
  segment: SegmentConfig
  count: number
  totalMinutes: number
  phaseOptions: string[]
  sportOptions: string[]
  organizationFormOptions: string[]
  onChange: (segment: SegmentConfig) => void
  onMinutesChange: (minutes: number) => void
  onRemove: () => void
}

export function SegmentEditor({
  segment,
  count,
  totalMinutes,
  phaseOptions,
  sportOptions,
  organizationFormOptions,
  onChange,
  onMinutesChange,
  onRemove,
}: SegmentEditorProps) {
  // Lokaler Entwurf, damit das Umverteilen der Minuten nicht bei jedem
  // Tastendruck passiert, sondern erst beim Verlassen des Feldes.
  const [draft, setDraft] = React.useState(String(segment.minutes))

  React.useEffect(() => {
    setDraft(String(segment.minutes))
  }, [segment.minutes])

  function commitMinutes() {
    const parsed = Number.parseInt(draft, 10)
    if (Number.isNaN(parsed)) {
      setDraft(String(segment.minutes))
      return
    }
    onMinutesChange(parsed)
  }

  const filling = segment.fillMode === 'generate'

  return (
    <div className="space-y-4 pt-1">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Phase</Label>
          <PhaseSelect
            options={phaseOptions}
            value={segment.name}
            onChange={(name) => onChange({ ...segment, name })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`minutes-${segment.id}`}>Dauer (Minuten)</Label>
          <Input
            id={`minutes-${segment.id}`}
            type="number"
            inputMode="numeric"
            min={1}
            max={totalMinutes}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitMinutes}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitMinutes()
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Die übrigen Phasen werden angepasst, damit die Einheit {totalMinutes} Minuten bleibt.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
        <div className="space-y-0.5">
          <Label htmlFor={`fill-${segment.id}`} className="cursor-pointer">
            {filling ? 'Wird gefüllt' : 'Bleibt frei'}
          </Label>
          <p className="text-xs text-muted-foreground">
            {filling
              ? 'Der Generator sucht Übungen für diese Phase.'
              : 'Diese Phase bleibt als Lücke leer — du füllst sie selbst.'}
          </p>
        </div>
        <Switch
          id={`fill-${segment.id}`}
          checked={filling}
          onCheckedChange={(checked) =>
            onChange({ ...segment, fillMode: checked ? 'generate' : 'empty' })
          }
        />
      </div>

      {filling && (
        <>
          <div className="space-y-2">
            <Label>Sportart(en)</Label>
            <MultiSelect
              options={sportOptions}
              selected={segment.sports}
              onChange={(sports) =>
                onChange({
                  ...segment,
                  sports,
                  // Eine abgewählte oder allein übrig gebliebene Sportart kann
                  // keine Hauptsportart mehr sein.
                  primarySport: resolvePrimarySport(sports, segment.primarySport),
                })
              }
              placeholder="Sportart auswählen"
              error={segment.sports.length === 0 ? 'Mindestens eine Sportart auswählen' : undefined}
            />
            <p className="text-xs text-muted-foreground">
              Die Sportarten deiner Gruppe stehen oben und sind vorausgewählt. Der Generator
              wechselt zwischen den ausgewählten Sportarten ab.
            </p>
          </div>

          {segment.sports.length > 1 && (
            <div className="space-y-2">
              <Label htmlFor={`primary-${segment.id}`}>Hauptsportart in dieser Phase</Label>
              <Select
                value={segment.primarySport ?? 'none'}
                onValueChange={(value) =>
                  onChange({ ...segment, primarySport: value === 'none' ? null : value })
                }
              >
                <SelectTrigger id={`primary-${segment.id}`}>
                  <SelectValue placeholder="Keine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine — alle gleichwertig</SelectItem>
                  {segment.sports.map((sport) => (
                    <SelectItem key={sport} value={sport}>
                      {sport}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Wird in dieser Phase doppelt gewichtet — etwa jede zweite Übung stammt daraus.
                Vorbelegt mit der Hauptsportart deiner Gruppe, hier aber frei änderbar.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Schwierigkeitsgrad</Label>
            <MultiSelect
              options={DIFFICULTY_LEVELS}
              selected={segment.difficulties}
              onChange={(difficulties) =>
                onChange({ ...segment, difficulties: difficulties as DifficultyLevel[] })
              }
              placeholder="Schwierigkeitsgrad auswählen"
              error={
                segment.difficulties.length === 0
                  ? 'Mindestens einen Schwierigkeitsgrad auswählen'
                  : undefined
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Organisationsform(en)</Label>
            <MultiSelect
              options={organizationFormOptions}
              selected={segment.organizationForms}
              onChange={(organizationForms) => onChange({ ...segment, organizationForms })}
              placeholder="Egal — keine Einschränkung"
            />
            <p className="text-xs text-muted-foreground">
              Leer heißt: jede Organisationsform ist recht. Wählst du etwas aus, kommen nur
              Übungen in Frage, die so laufen — Übungen ohne Angabe fallen dann heraus. Beim
              Lockern wird diese Vorgabe als Erstes freigegeben.
            </p>
          </div>
        </>
      )}

      <WorkNoteField
        id={`notes-${segment.id}`}
        scope="segment"
        value={segment.notes}
        onChange={(notes) => onChange({ ...segment, notes })}
        placeholder={
          filling
            ? 'Hinweise für dich zu diesem Abschnitt'
            : 'Was hast du hier vor? z.B. „Wettkampfspiel", „Besprechung", „Material umbauen"'
        }
      />

      <Separator />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive"
          onClick={onRemove}
          disabled={count <= 1}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Phase entfernen
        </Button>
      </div>
    </div>
  )
}
