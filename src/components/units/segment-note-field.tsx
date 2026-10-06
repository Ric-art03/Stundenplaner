'use client'

import * as React from 'react'
import { StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SegmentNoteFieldProps {
  segmentId: string
  segmentName: string
  notes: string
  onChange: (notes: string) => void
}

const MAX_LENGTH = 2000

/**
 * Die Notiz eines Segments im Bearbeiten-Modus. Der Ort für alles, was keine
 * Übung ist — Organisatorisches, Hinweise an sich selbst, der Grund, warum ein
 * Abschnitt frei bleibt.
 *
 * Ohne Notiz steht erst ein Knopf da und kein leeres Feld: ein Segment ohne
 * Notiz ist der Normalfall, und drei leere Felder übereinander würden den Plan
 * zuwachsen lassen.
 */
export function SegmentNoteField({
  segmentId,
  segmentName,
  notes,
  onChange,
}: SegmentNoteFieldProps) {
  const [open, setOpen] = React.useState(notes !== '')
  const fieldId = `notiz-${segmentId}`

  // Eine Notiz, die über „Rückgängig" zurückkommt, soll das Feld wieder öffnen.
  React.useEffect(() => {
    if (notes !== '') setOpen(true)
  }, [notes])

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <StickyNote className="mr-2 h-3.5 w-3.5" />
        Notiz hinzufügen
      </Button>
    )
  }

  return (
    <div className="space-y-1">
      <Label htmlFor={fieldId} className="sr-only">
        Notiz zum Abschnitt {segmentName}
      </Label>
      <Textarea
        id={fieldId}
        value={notes}
        onChange={(event) => onChange(event.target.value.slice(0, MAX_LENGTH))}
        placeholder="Organisatorisches, Hinweise an dich selbst …"
        rows={2}
        className="text-sm"
      />
    </div>
  )
}
