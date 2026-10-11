/*
 * Der Offline-Baustein des Live-Modus (PROJ-14).
 *
 * Er wirkt NUR auf den Live-Bildschirm (`/live`) — alle anderen Seiten merken
 * nichts von ihm. Er hält bereit, was der Bildschirm zum Anzeigen braucht, und
 * sonst nichts: keine Daten, die liegen in der Stundenakte im Speicher des
 * Browsers.
 *
 * Ohne ihn zeigt ein Neuladen in einer Halle ohne Empfang die Fehlerseite des
 * Browsers — und Handys laden Seiten von sich aus neu, etwa nach einem Anruf.
 *
 * - Die Seite selbst: mit Netz immer die aktuelle Fassung, die abgelegte nur
 *   als Rückfall. Eine neue Auslieferung kommt also an, sobald das Gerät
 *   wieder Verbindung hat.
 * - Die Bausteine der Seite (`/_next/static/`): tragen ihren Inhalt im Namen
 *   und ändern sich nie — abgelegt genügt.
 */

const CACHE = 'stundenplaner-live-v1'
const PAGE = '/live'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys()
      await Promise.all(
        names
          .filter((name) => name.startsWith('stundenplaner-live-') && name !== CACHE)
          .map((name) => caches.delete(name))
      )
      await self.clients.claim()
    })()
  )
})

/*
 * Die Seite nennt, was sie geladen hat. Beim ersten Öffnen war der Baustein
 * noch nicht da und hat nichts davon mitbekommen — deshalb legt er es jetzt
 * eigens ab. Was aus einer früheren Auslieferung übrig ist, fliegt raus.
 */
self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'live-ablegen' || !Array.isArray(data.urls)) return

  event.waitUntil(
    (async () => {
      let ok = true
      try {
        const cache = await caches.open(CACHE)
        const wanted = new Set(
          [PAGE, ...data.urls].map((url) => new URL(url, self.location.origin).href)
        )

        const known = await cache.keys()
        await Promise.all(
          known.filter((request) => !wanted.has(request.url)).map((request) => cache.delete(request))
        )

        await Promise.all(
          [...wanted].map(async (url) => {
            if (await cache.match(url)) return
            const response = await fetch(url, { credentials: 'same-origin' })
            if (!response.ok) throw new Error(`${response.status} ${url}`)
            await cache.put(url, response)
          })
        )
      } catch {
        ok = false
      }
      event.source?.postMessage({ type: 'live-abgelegt', ok })
    })()
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    if (url.pathname !== PAGE) return
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        try {
          const response = await fetch(request)
          if (response.ok) await cache.put(PAGE, response.clone())
          return response
        } catch {
          const stored = await cache.match(PAGE)
          if (stored) return stored
          throw new Error('offline')
        }
      })()
    )
    return
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE)
        const stored = await cache.match(request.url)
        if (stored) return stored
        const response = await fetch(request)
        if (response.ok) await cache.put(request.url, response.clone())
        return response
      })()
    )
  }
})
