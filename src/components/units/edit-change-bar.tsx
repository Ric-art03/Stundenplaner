'use client'

import { Loader2, Save, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditChangeBarProps {
  changeCount: number
  dirty: boolean
  canUndo: boolean
  saving: boolean
  onUndo: () => void
  onDiscard: () => void
  onSave: () => void
}

/**
 * Die Leiste im Bearbeiten-Modus. Klebt oben, damit sie im langen Plan erreichbar
 * bleibt — der Nutzer soll nicht erst nach oben scrollen müssen, um zu speichern.
 *
 * Die drei Anzeigen kommen alle aus demselben Verlauf und können deshalb nicht
 * auseinanderlaufen: die Anzahl ist die Länge der Rückgängig-Kette, „Rückgängig"
 * ist aus, wenn sie leer ist, und gespeichert werden kann nur, was sich vom
 * Ausgangszustand unterscheidet.
 */
export function EditChangeBar({
  changeCount,
  dirty,
  canUndo,
  saving,
  onUndo,
  onDiscard,
  onSave,
}: EditChangeBarProps) {
  return (
    <div
      className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-2 border-y bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border"
      role="region"
      aria-label="Offene Änderungen"
    >
      <p className="text-sm" role="status">
        {changeCount === 0
          ? 'Keine Änderungen'
          : `${changeCount} ${changeCount === 1 ? 'offene Änderung' : 'offene Änderungen'}`}
      </p>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo || saving}
        >
          <Undo2 className="mr-2 h-4 w-4" />
          Rückgängig
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={!dirty || saving}
        >
          <X className="mr-2 h-4 w-4" />
          Verwerfen
        </Button>
        <Button size="sm" onClick={onSave} disabled={!dirty || saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>
    </div>
  )
}
