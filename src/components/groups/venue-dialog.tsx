'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { venueSchema } from '@/lib/validations/group'
import { VenueMaterialInput } from './venue-material-input'
import type { VenueFormData, VenueMaterial, Venue } from '@/lib/types/group'
import { EMPTY_VENUE_FORM } from '@/lib/types/group'

interface VenueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  venue?: Venue | null
  onSave: (data: VenueFormData) => Promise<{ id?: string; error?: string }>
  customMaterials?: string[]
}

export function VenueDialog({ open, onOpenChange, venue, onSave, customMaterials = [] }: VenueDialogProps) {
  const { toast } = useToast()
  const [saving, setSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [form, setForm] = React.useState<VenueFormData>(EMPTY_VENUE_FORM)

  React.useEffect(() => {
    if (open) {
      if (venue) {
        setForm({
          name: venue.name,
          notes: venue.notes ?? '',
          materials: venue.materials.map((m) => ({ name: m.name, quantity: m.quantity })),
        })
      } else {
        setForm(EMPTY_VENUE_FORM)
      }
      setErrors({})
    }
  }, [open, venue])

  function updateField<K extends keyof VenueFormData>(field: K, value: VenueFormData[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  async function handleSave() {
    const cleanedForm = {
      ...form,
      materials: form.materials.filter((m) => m.name.trim() !== ''),
    }
    const result = venueSchema.safeParse(cleanedForm)
    if (!result.success) {
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString() ?? 'form'
        if (!fieldErrors[key]) fieldErrors[key] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setSaving(true)
    try {
      const res = await onSave(cleanedForm)
      if (res.error) {
        if (res.error.includes('existiert bereits')) {
          setErrors({ name: res.error })
        } else {
          toast({ variant: 'destructive', title: 'Fehler', description: res.error })
        }
        return
      }
      onOpenChange(false)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Speichern fehlgeschlagen.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{venue ? 'Halle bearbeiten' : 'Neue Halle anlegen'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="venue-name">Name *</Label>
            <Input
              id="venue-name"
              value={form.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="z.B. Turnhalle Grundschule Mitte"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label>Verfügbares Material</Label>
            <VenueMaterialInput
              materials={form.materials}
              onChange={(m: VenueMaterial[]) => updateField('materials', m)}
              customMaterials={customMaterials}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="venue-notes">Besonderheiten</Label>
            <Textarea
              id="venue-notes"
              value={form.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="z.B. kleiner Nebenraum vorhanden, kein Schwingboden..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Abbrechen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Wird gespeichert...' : 'Speichern'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
