'use client'

import { Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Group } from '@/lib/types/group'

interface GroupHintsProps {
  group: Group
}

/**
 * Erscheint nur, wenn am Gruppenprofil etwas fehlt, das der Generator braucht.
 * Bei einem gut gepflegten Profil bleibt der Bereich leer.
 */
export function GroupHints({ group }: GroupHintsProps) {
  const hints: string[] = []

  if (group.sports.length === 1) {
    hints.push(
      'Deine Gruppe ist nur mit einer Sportart getaggt. Der Generator findet dadurch weniger passende Übungen. Ergänze im Gruppenprofil alle Sportarten, die in irgendeiner Phase deiner Stunde vorkommen könnten — zum Beispiel „Allgemeinsport" oder „Kinderspiele" für das Aufwärmen.'
    )
  }

  if (!group.venue) {
    hints.push(
      'Ohne zugewiesene Halle kann der Generator nicht prüfen, ob das benötigte Material vorhanden ist. Es werden Übungen unabhängig vom Material vorgeschlagen.'
    )
  }

  if (!group.participants) {
    hints.push(
      'Ohne Teilnehmerzahl kann der Generator Material, das „pro Teilnehmer" benötigt wird, nicht gegen den Hallenbestand prüfen — und auch keine Übungen ausschließen, die für zu viele oder zu wenige Teilnehmer ausgelegt sind.'
    )
  }

  if (hints.length === 0) return null

  return (
    <div className="space-y-2">
      {hints.map((hint) => (
        <Alert key={hint}>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">{hint}</AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
