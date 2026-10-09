'use client'

import { Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlannedGapProps {
  minutes: number
  /** Nur im Bearbeiten-Modus gesetzt. */
  onInsert?: () => void
  /**
   * Nur im Bearbeiten-Modus und nur, wenn der Nutzer die Lücke selbst erklärt
   * hat — ein im Generator frei gelassenes Segment lässt sich hier nicht öffnen.
   */
  onReopen?: () => void
}

/**
 * Eine **geplante** Lücke: ruhig, ohne Warnfarbe, mit ihrer Minutenangabe —
 * wie die „— Lücke —" eines im Generator frei gelassenen Segments. Der
 * Gegensatz zum gelben Hinweis einer offenen Lücke ist der ganze Zweck.
 */
export function PlannedGap({ minutes, onInsert, onReopen }: PlannedGapProps) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed p-3 text-center">
      <p className="text-sm text-muted-foreground">
        — Geplante Lücke · <span className="tabular-nums">{minutes}</span> Min —
      </p>

      {(onInsert || onReopen) && (
        <div className="flex flex-col justify-center gap-2 sm:flex-row">
          {onInsert && (
            <Button type="button" size="sm" onClick={onInsert}>
              <Plus className="mr-2 h-4 w-4" />
              Übung einfügen
            </Button>
          )}
          {onReopen && (
            <Button type="button" variant="ghost" size="sm" onClick={onReopen}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Wieder öffnen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
