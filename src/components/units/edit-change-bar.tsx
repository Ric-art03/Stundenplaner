'use client'

import { Check, Loader2, Save, Undo2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EditChangeBarProps {
  changeCount: number
  dirty: boolean
  canUndo: boolean
  saving: boolean
  onUndo: () => void
  onDiscard: () => void
  onSave: () => void
  /** Den Bearbeiten-Modus ohne offene Änderungen verlassen. */
  onDone: () => void
}

/**
 * Die Leiste im Bearbeiten-Modus. Klebt oben, damit sie im langen Plan erreichbar
 * bleibt — der Nutzer soll nicht erst nach oben scrollen müssen, um zu speichern.
 *
 * Der Hauptknopf ist der einzige Ausgang aus dem Modus: ohne Änderungen heißt er
 * „Fertig" und verlässt ihn, mit Änderungen „Speichern" — und verlässt ihn nach
 * dem Speichern. Zwei Knöpfe nebeneinander führten bei offenen Änderungen über
 * eine Nachfrage zum selben Ziel.
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
  onDone,
}: EditChangeBarProps) {
  return (
    <div
      className="sticky top-16 z-30 -mx-4 flex flex-wrap items-center gap-2 border-y bg-background/95 px-4 py-2 backdrop-blur sm:mx-0 sm:rounded-lg sm:border"
      role="region"
      aria-label="Offene Änderungen"
    >
      <p className="w-full text-sm sm:w-auto" role="status">
        {changeCount === 0
          ? 'Keine Änderungen'
          : `${changeCount} ${changeCount === 1 ? 'offene Änderung' : 'offene Änderungen'}`}
      </p>

      <div className="flex w-full items-center justify-end gap-2 sm:ml-auto sm:w-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo || saving}
        >
          <Undo2 className="mr-2 hidden h-4 w-4 sm:inline" />
          Rückgängig
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          disabled={!dirty || saving}
        >
          <X className="mr-2 hidden h-4 w-4 sm:inline" />
          Verwerfen
        </Button>
        {dirty ? (
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 hidden h-4 w-4 sm:inline" />
            )}
            Speichern
          </Button>
        ) : (
          <Button size="sm" onClick={onDone}>
            <Check className="mr-2 hidden h-4 w-4 sm:inline" />
            Fertig
          </Button>
        )}
      </div>
    </div>
  )
}
