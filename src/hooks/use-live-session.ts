'use client'

import * as React from 'react'
import { readPending, readSession, subscribe } from '@/lib/live/store'
import type { LiveSession, PendingRun } from '@/lib/live/types'

const NO_PENDING: PendingRun[] = []

/**
 * Die Stundenakte, wie sie gerade auf dem Gerät liegt. Ändert ein anderer Tab
 * sie, zeichnet dieser neu — beide lesen dieselbe Akte, eine eigene Abstimmung
 * gibt es nicht.
 *
 * Auf dem Server und beim ersten Zeichnen im Browser ist die Akte unbekannt
 * (`undefined`): beide Seiten müssen mit demselben Stand beginnen.
 */
export function useLiveSession(): LiveSession | null | undefined {
  return React.useSyncExternalStore<LiveSession | null | undefined>(
    subscribe,
    readSession,
    () => undefined
  )
}

/** Die Durchführungen, die noch nicht in der Datenbank sind. */
export function usePendingRuns(): PendingRun[] {
  return React.useSyncExternalStore(subscribe, readPending, () => NO_PENDING)
}

/** „Jetzt", einmal pro Sekunde neu — nur solange `active` gilt. */
export function useNow(active: boolean): number {
  const [now, setNow] = React.useState(() => Date.now())

  React.useEffect(() => {
    if (!active) return
    setNow(Date.now())
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    // Ein schlafender Tab bekommt keine Takte — beim Aufwachen sofort neu rechnen.
    function onVisible() {
      if (document.visibilityState === 'visible') setNow(Date.now())
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])

  return now
}

/** Ob der Browser gerade Verbindung meldet. */
export function useOnline(): boolean {
  return React.useSyncExternalStore(
    (listener) => {
      window.addEventListener('online', listener)
      window.addEventListener('offline', listener)
      return () => {
        window.removeEventListener('online', listener)
        window.removeEventListener('offline', listener)
      }
    },
    () => navigator.onLine,
    () => true
  )
}
