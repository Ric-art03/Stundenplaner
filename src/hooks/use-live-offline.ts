'use client'

import * as React from 'react'

/**
 * - `pending` — wird gerade eingerichtet
 * - `ready` — der Live-Bildschirm öffnet sich auch ohne Netz wieder
 * - `unavailable` — auf diesem Gerät oder in diesem Fenster nicht möglich
 * - `off` — in der Entwicklung bewusst abgeschaltet
 */
export type OfflineStatus = 'pending' | 'ready' | 'unavailable' | 'off'

/** Länger darf das Ablegen nicht dauern, ohne dass der Nutzer davon erfährt. */
const TIMEOUT_MS = 20_000

/**
 * Wartet, bis der Baustein aktiv ist — **am Baustein selbst**, nicht über
 * `navigator.serviceWorker.ready`.
 *
 * `ready` erfüllt sich nur für eine Seite, die *innerhalb* des Bereichs des
 * Bausteins geladen wurde. In den Live-Modus kommt man aber aus der App heraus,
 * ohne dass die Seite neu lädt: geladen wurde sie etwa unter `/units/…`, also
 * außerhalb von `/live`. `ready` bliebe dann für immer offen, und die Ablage
 * leer — genau das war BUG-23.
 */
function activeWorker(registration: ServiceWorkerRegistration): Promise<ServiceWorker | null> {
  if (registration.active) return Promise.resolve(registration.active)

  const worker = registration.installing ?? registration.waiting
  if (!worker) return Promise.resolve(null)

  return new Promise((resolve) => {
    function check() {
      if (worker!.state === 'activated') {
        worker!.removeEventListener('statechange', check)
        resolve(worker)
      } else if (worker!.state === 'redundant') {
        worker!.removeEventListener('statechange', check)
        resolve(null)
      }
    }
    worker.addEventListener('statechange', check)
    check()
  })
}

/**
 * Richtet den Offline-Baustein ein (`public/live-sw.js`) — begrenzt auf
 * `/live`, damit die übrige App davon unberührt bleibt.
 *
 * Nur im Produktionsbuild: in der Entwicklung ändern sich die Bausteine der
 * Seite bei jedem Speichern, ein abgelegter Stand wäre sofort veraltet.
 *
 * Meldet der Baustein nicht in angemessener Zeit, dass alles abgelegt ist,
 * gilt das als „nicht möglich" — lieber ein Hinweis zu viel als ein Nutzer, der
 * sich in der Halle auf etwas verlässt, das nicht da ist.
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
    let settled = false

    function settle(next: OfflineStatus) {
      if (cancelled || settled) return
      settled = true
      setStatus(next)
    }

    function onMessage(event: MessageEvent) {
      if (event.data?.type !== 'live-abgelegt') return
      settle(event.data.ok ? 'ready' : 'unavailable')
    }
    navigator.serviceWorker.addEventListener('message', onMessage)

    const timeout = window.setTimeout(() => settle('unavailable'), TIMEOUT_MS)

    ;(async () => {
      try {
        const registration = await navigator.serviceWorker.register('/live-sw.js', {
          scope: '/live',
        })
        const worker = await activeWorker(registration)
        if (!worker) {
          settle('unavailable')
          return
        }
        // Was diese Seite geladen hat. Der Baustein sucht sich die Bausteine der
        // Seite zusätzlich selbst heraus — diese Liste ist nur die zweite Quelle.
        const urls = performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .filter((name) => name.includes('/_next/static/'))
        worker.postMessage({ type: 'live-ablegen', urls })
      } catch {
        settle('unavailable')
      }
    })()

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
      navigator.serviceWorker.removeEventListener('message', onMessage)
    }
  }, [])

  return status
}
