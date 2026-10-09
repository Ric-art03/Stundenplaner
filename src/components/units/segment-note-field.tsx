'use client'

import * as React from 'react'
import { StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkNoteField } from '@/components/exercises/work-note'

interface SegmentNoteFieldProps {
  segmentId: string
  notes: string
  onChange: (notes: string) => void
}

/**
 * Die Arbeitsnotiz einer Phase im Bearbeiten-Modus. Der Ort für alles, was
 * keine Übung ist — Organisatorisches, Hinweise an sich selbst, der Grund,
 * warum ein Abschnitt frei bleibt.
 *
 * Ohne Arbeitsnotiz steht erst ein Knopf da und kein leeres Feld: ein Segment
 * ohne ist der Normalfall, und drei leere Felder übereinander würden den Plan
 * zuwachsen lassen.
 */
export function SegmentNoteField({ segmentId, notes, onChange }: SegmentNoteFieldProps) {
  const [open, setOpen] = React.useState(notes !== '')

  // Eine Arbeitsnotiz, die über „Rückgängig" zurückkommt, soll das Feld wieder öffnen.
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
        Arbeitsnotiz hinzufügen
      </Button>
    )
  }

  return (
    <WorkNoteField
      id={`arbeitsnotiz-${segmentId}`}
      scope="segment"
      value={notes}
      onChange={onChange}
      placeholder="Organisatorisches, Hinweise an dich selbst …"
    />
  )
}
