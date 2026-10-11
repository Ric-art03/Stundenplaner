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
 * Legt die Seite und alles ab, was sie zum Anzeigen braucht.
 *
 * Die Seite stößt das an, sobald das Bereitschaftsbild offen ist. Der Baustein
 * verlässt sich dabei NICHT darauf, die Seite zu „besitzen": in den Live-Modus
 * kommt man aus der App heraus, ohne dass die Seite neu lädt — sie gehört ihm
 * dann nicht, und von ihren Anfragen bekommt er nichts mit (BUG-23). Deshalb
 * holt er alles selbst.
 *
 * Welche Bausteine die Seite braucht, liest er aus der Seite selbst: dort
 * stehen sie alle drin. Was die Seite zusätzlich als geladen meldet, kommt
 * dazu — aber nur als zweite Quelle, denn die Liste des Browsers ist begrenzt
 * und kann nach langer Benutzung der App unvollständig sein.
 *
 * Was aus einer früheren Auslieferung übrig ist, fliegt raus.
 */
function staticUrlsIn(html) {
  const found = new Set()
  // In Anführungszeichen (auch maskierten) stehende Pfade unter /_next/static/.
  for (const match of html.matchAll(/\/_next\/static\/[^"'\\\s<>)]+/g)) {
    found.add(new URL(match[0], self.location.origin).href)
  }
  return found
}

self.addEventListener('message', (event) => {
  const data = event.data
  if (!data || data.type !== 'live-ablegen') return

  event.waitUntil(
    (async () => {
      let ok = true
      try {
        const cache = await caches.open(CACHE)
        const pageUrl = new URL(PAGE, self.location.origin).href

        // Immer frisch: die Seite bestimmt, welche Bausteine gebraucht werden.
        const page = await fetch(pageUrl, { credentials: 'same-origin', cache: 'no-store' })
        if (!page.ok) throw new Error(`${page.status} ${pageUrl}`)
        const html = await page.clone().text()

        const wanted = staticUrlsIn(html)
        for (const url of Array.isArray(data.urls) ? data.urls : []) {
          const absolute = new URL(url, self.location.origin)
          if (absolute.origin === self.location.origin && absolute.pathname.startsWith('/_next/static/')) {
            wanted.add(absolute.href)
          }
        }

        const known = await cache.keys()
        await Promise.all(
          known
            .filter((request) => request.url !== pageUrl && !wanted.has(request.url))
            .map((request) => cache.delete(request))
        )

        // Fehlt ein Baustein, den nur die Seite gemeldet hat (etwa von einer
        // anderen Seite der App), ist das kein Grund zu scheitern. Fehlt einer,
        // der in der Seite steht, schon.
        const required = staticUrlsIn(html)
        await Promise.all(
          [...wanted].map(async (url) => {
            if (await cache.match(url)) return
            try {
              const response = await fetch(url, { credentials: 'same-origin' })
              if (!response.ok) throw new Error(`${response.status} ${url}`)
              await cache.put(url, response)
            } catch (error) {
              if (required.has(url)) throw error
            }
          })
        )

        // Zuletzt die Seite: sie liegt erst da, wenn ihre Bausteine da sind.
        await cache.put(pageUrl, page)
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
