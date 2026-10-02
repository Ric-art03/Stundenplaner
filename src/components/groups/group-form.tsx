'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { MultiSelect } from '@/components/exercises/multi-select'
import { ScheduleInput } from './schedule-input'
import { VenueDialog } from './venue-dialog'
import { groupSchema } from '@/lib/validations/group'
import {
  SPORTS, AGE_GROUPS,
  EMPTY_GROUP_FORM,
  type GroupFormData, type GroupSchedule, type Venue, type VenueFormData,
} from '@/lib/types/group'

interface GroupFormProps {
  initialData?: GroupFormData
  groupId?: string
  venues: Venue[]
  customCategories: Record<string, string[]>
  onSave: (data: GroupFormData) => Promise<{ id?: string; success?: boolean; error?: string }>
  onCreateVenue: (data: VenueFormData) => Promise<{ id?: string; error?: string }>
  onUpdateVenue?: (id: string, data: VenueFormData) => Promise<{ success?: boolean; error?: string }>
}

export function GroupForm({
  initialData,
  groupId,
  venues: initialVenues,
  customCategories,
  onSave,
  onCreateVenue,
  onUpdateVenue,
}: GroupFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const isEdit = !!groupId

  const [form, setForm] = React.useState<GroupFormData>(initialData ?? EMPTY_GROUP_FORM)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [scheduleErrors, setScheduleErrors] = React.useState<Record<number, { weekday?: string; startTime?: string; endTime?: string; date?: string }>>({})
  const [saving, setSaving] = React.useState(false)
  const [venueDialogOpen, setVenueDialogOpen] = React.useState(false)
  const [editVenueTarget, setEditVenueTarget] = React.useState<Venue | null>(null)
  const [venues, setVenues] = React.useState<Venue[]>(initialVenues)

  const sportsOptions = React.useMemo(() => {
    const customs = customCategories.sport ?? []
    return [...SPORTS, ...customs.filter((c) => !(SPORTS as readonly string[]).includes(c))]
  }, [customCategories])

  const ageOptions = React.useMemo(() => {
    const customs = customCategories.age_group ?? []
    return [...AGE_GROUPS, ...customs.filter((c) => !(AGE_GROUPS as readonly string[]).includes(c))]
  }, [customCategories])

  function updateField<K extends keyof GroupFormData>(field: K, value: GroupFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleCreateVenue(data: VenueFormData) {
    const result = await onCreateVenue(data)
    if (result.id) {
      const newVenue: Venue = {
        id: result.id,
        userId: '',
        name: data.name,
        notes: data.notes || null,
        materials: data.materials,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setVenues((prev) => [...prev, newVenue])
      updateField('venueId', result.id)
    }
    return result
  }

  async function handleUpdateVenue(data: VenueFormData) {
    if (!editVenueTarget || !onUpdateVenue) return { error: 'Nicht verfügbar' }
    const result = await onUpdateVenue(editVenueTarget.id, data)
    if (!result.error) {
      setVenues((prev) =>
        prev.map((v) =>
          v.id === editVenueTarget.id
            ? { ...v, name: data.name, notes: data.notes || null, materials: data.materials }
            : v
        )
      )
    }
    return result
  }

  const selectedVenue = form.venueId ? venues.find((v) => v.id === form.venueId) : null

  async function handleSave() {
    const result = groupSchema.safeParse(form)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      const schedErrors: Record<number, { weekday?: string; startTime?: string; endTime?: string; date?: string }> = {}
      for (const issue of result.error.issues) {
        const path = issue.path
        if (path[0] === 'schedules' && typeof path[1] === 'number') {
          const idx = path[1]
          if (!schedErrors[idx]) schedErrors[idx] = {}
          const field = path[2] as 'weekday' | 'startTime' | 'endTime' | 'date' | undefined
          if (field) {
            (schedErrors[idx] as Record<string, string>)[field] = issue.message
          } else {
            schedErrors[idx].endTime = issue.message
          }
        } else {
          const key = path[0]?.toString() ?? 'form'
          if (!fieldErrors[key]) fieldErrors[key] = issue.message
        }
      }
      setErrors(fieldErrors)
      setScheduleErrors(schedErrors)
      return
    }

    setErrors({})
    setScheduleErrors({})
    setSaving(true)

    try {
      const res = await onSave(form)
      if (res.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: res.error })
        return
      }
      toast({ title: isEdit ? 'Gruppe aktualisiert' : 'Gruppe erstellt' })
      const targetId = res.id ?? groupId
      router.push(targetId ? `/groups/${targetId}` : '/groups')
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Speichern fehlgeschlagen.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href={isEdit ? `/groups/${groupId}` : '/groups'}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {isEdit ? 'Zurück zur Gruppe' : 'Alle Gruppen'}
        </Link>
      </Button>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="group-name">Name *</Label>
        <Input
          id="group-name"
          value={form.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="z.B. Kinderturnen"
          maxLength={100}
          className={errors.name ? 'border-destructive' : ''}
        />
        {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
      </div>

      {/* Sportart */}
      <div className="space-y-2">
        <Label>Sportart *</Label>
        <MultiSelect
          options={sportsOptions}
          selected={form.sports}
          onChange={(v) => updateField('sports', v)}
          placeholder="Sportarten auswählen..."
          allowCustom
          customLabel="Eigene Sportart hinzufügen"
          error={errors.sports}
        />
      </div>

      {/* Altersgruppe */}
      <div className="space-y-2">
        <Label>Altersgruppe *</Label>
        <MultiSelect
          options={ageOptions}
          selected={form.ageGroups}
          onChange={(v) => updateField('ageGroups', v)}
          placeholder="Altersgruppen auswählen..."
          allowCustom
          customLabel="Eigene Altersgruppe hinzufügen"
          error={errors.ageGroups}
        />
      </div>

      {/* Teilnehmerzahl */}
      <div className="space-y-2">
        <Label>Teilnehmerzahl</Label>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Min</label>
            <Input
              type="number"
              min={1}
              value={form.participantsMin ?? ''}
              onChange={(e) => updateField('participantsMin', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="z.B. 8"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-muted-foreground mb-1 block">Max</label>
            <Input
              type="number"
              min={1}
              value={form.participantsMax ?? ''}
              onChange={(e) => updateField('participantsMax', e.target.value ? parseInt(e.target.value) : null)}
              placeholder="z.B. 20"
              className={errors.participantsMax ? 'border-destructive' : ''}
            />
          </div>
        </div>
        {errors.participantsMax && <p className="text-sm text-destructive">{errors.participantsMax}</p>}
      </div>

      {/* Einheitsdauer */}
      <div className="space-y-2">
        <Label htmlFor="unit-duration">Einheitsdauer (Minuten) *</Label>
        <Input
          id="unit-duration"
          type="number"
          min={5}
          max={300}
          value={form.unitDuration || ''}
          onChange={(e) => {
            const v = e.target.valueAsNumber
            updateField('unitDuration', Number.isNaN(v) ? 0 : v)
          }}
          className={errors.unitDuration ? 'border-destructive' : ''}
        />
        {errors.unitDuration && <p className="text-sm text-destructive">{errors.unitDuration}</p>}
      </div>

      {/* Trainingszeiten */}
      <div className="space-y-2">
        <Label>Trainingszeiten</Label>
        <ScheduleInput
          schedules={form.schedules}
          onChange={(s: GroupSchedule[]) => updateField('schedules', s)}
          errors={scheduleErrors}
        />
      </div>

      {/* Halle/Ort */}
      <div className="space-y-2">
        <Label>Halle / Ort</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              value={form.venueId ?? 'none'}
              onValueChange={(v) => updateField('venueId', v === 'none' ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Halle auswählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Keine Halle</SelectItem>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>{venue.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedVenue && onUpdateVenue && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setEditVenueTarget(selectedVenue)}
              title="Halle bearbeiten"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={() => setVenueDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Neue Halle
          </Button>
        </div>
      </div>

      {/* Save / Cancel */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Wird gespeichert...' : isEdit ? 'Änderungen speichern' : 'Gruppe erstellen'}
        </Button>
        <Button variant="outline" asChild>
          <Link href={isEdit ? `/groups/${groupId}` : '/groups'}>Abbrechen</Link>
        </Button>
      </div>

      <VenueDialog
        open={venueDialogOpen}
        onOpenChange={setVenueDialogOpen}
        onSave={handleCreateVenue}
        customMaterials={customCategories.material ?? []}
      />

      {onUpdateVenue && (
        <VenueDialog
          open={!!editVenueTarget}
          onOpenChange={(open) => !open && setEditVenueTarget(null)}
          venue={editVenueTarget}
          onSave={handleUpdateVenue}
          customMaterials={customCategories.material ?? []}
        />
      )}
    </div>
  )
}
