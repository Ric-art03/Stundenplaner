'use client'

import * as React from 'react'
import { getUnitNamesForGroup } from '@/lib/actions/units'

interface GroupUnitsWarningProps {
  groupId: string
  /** Erst beim Öffnen des Dialogs nachladen — nicht schon beim Rendern der Liste. */
  active: boolean
}

/** Wie viele Namen genannt werden, bevor zusammengefasst wird. */
const SHOWN = 5

/**
 * Nennt beim Löschen einer Gruppe die Einheiten, die dabei mit verschwinden.
 *
 * Eine Gruppe zu löschen nimmt über die Löschweitergabe alle ihre Einheiten
 * samt Segmenten und Einträgen mit. Ohne diesen Hinweis verliert der Nutzer
 * seine Stundenplanung, während der Dialog nur von einem Gruppenprofil spricht.
 */
export function GroupUnitsWarning({ groupId, active }: GroupUnitsWarningProps) {
  const [names, setNames] = React.useState<string[] | null>(null)

  React.useEffect(() => {
    if (!active) {
      setNames(null)
      return
    }

    let cancelled = false
    getUnitNamesForGroup(groupId)
      .then((result) => {
        if (!cancelled) setNames(result)
      })
      .catch(() => {
        if (!cancelled) setNames([])
      })

    return () => {
      cancelled = true
    }
  }, [groupId, active])

  if (!names || names.length === 0) return null

  const shown = names.slice(0, SHOWN)
  const rest = names.length - shown.length

  return (
    <span className="mt-3 block text-foreground">
      <strong className="font-medium">
        {names.length === 1
          ? 'Dabei wird auch 1 gespeicherte Einheit gelöscht:'
          : `Dabei werden auch ${names.length} gespeicherte Einheiten gelöscht:`}
      </strong>{' '}
      {shown.join(', ')}
      {rest > 0 && ` und ${rest} weitere`}. Deine Übungen bleiben erhalten — die
      Einheiten verweisen nur auf sie.
    </span>
  )
}
