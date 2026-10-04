'use client'

import * as React from 'react'
import { getUnitNamesUsingExercise } from '@/lib/actions/units'

interface ExerciseUsageWarningProps {
  exerciseId: string | null
  /** Erst beim Öffnen des Dialogs nachladen — nicht schon beim Rendern der Liste. */
  active: boolean
}

/**
 * Nennt beim Löschen die Einheiten, in denen die Übung vorkommt. Ohne die
 * konkreten Namen bleibt die Warnung abstrakt und der Nutzer kann nicht
 * abschätzen, was er anrichtet.
 */
export function ExerciseUsageWarning({ exerciseId, active }: ExerciseUsageWarningProps) {
  const [names, setNames] = React.useState<string[] | null>(null)

  React.useEffect(() => {
    if (!active || !exerciseId) {
      setNames(null)
      return
    }

    let cancelled = false
    getUnitNamesUsingExercise(exerciseId)
      .then((result) => {
        if (!cancelled) setNames(result)
      })
      .catch(() => {
        if (!cancelled) setNames([])
      })

    return () => {
      cancelled = true
    }
  }, [exerciseId, active])

  if (!names || names.length === 0) return null

  return (
    <span className="mt-3 block text-foreground">
      <strong className="font-medium">
        Diese Übung wird in {names.length}{' '}
        {names.length === 1 ? 'Einheit' : 'Einheiten'} verwendet:
      </strong>{' '}
      {names.join(', ')}. Dort bleibt an ihrer Stelle ein Platzhalter stehen, den du
      nachbesetzen kannst — die Einheiten werden nicht kürzer.
    </span>
  )
}
