'use client'

import * as React from 'react'

/**
 * - `pending` — wird gerade eingerichtet
 * - `ready` — der Live-Bildschirm öffnet sich auch ohne Netz wieder
 * - `unavailable` — auf diesem Gerät oder in diesem Fenster nicht möglich
 * - `off` — in der Entwicklung bewusst abgeschaltet
 */
export type OfflineStatus = 'pending' | 'ready' | 'unavailable' | 'off'

/**
 * Richtet den Offline-Baustein ein (`public/live-sw.js`) — begrenzt auf
 * `/live`, damit die übrige App davon unberührt bleibt.
 *
 * Nur im Produktionsbuild: in der Entwicklung ändern sich die Bausteine der
 * Seite bei jedem Speichern, ein abgelegter Stand wäre sofort veraltet.
 */
export function useLiveOffline(): OfflineStatus {
  const [status, setStatus] = React.useState<OfflineStatus>('pending')

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      setStatus('off')
      return
    }
    if (!('serviceWorker' in navigator)) {
      setStatus('unavailable')
      return
    }

    let cancelled = false

    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'live-abgelegt' || cancelled) return
      setStatus(event.data.ok ? 'ready' : 'unavailable')
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    ;(async () => {
      try {
        await navigator.serviceWorker.register('/live-sw.js', { scope: '/live' })
        const registration = await navigator.serviceWorker.ready
        // Was diese Seite geladen hat — der Baustein war beim ersten Öffnen
        // noch nicht da und legt es jetzt eigens ab.
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => name.includes('/_next/static/'))
        registration.active?.postMessage({ type: 'live-ablegen', urls })
      } catch {
        if (!cancelled) setStatus('unavailable')
      }
    })()

    return () => {
      cancelled = true
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  return status
}
