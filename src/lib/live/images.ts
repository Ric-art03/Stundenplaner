import { createClient } from '@/lib/supabase/client'
import type { LivePlan } from './types'

/**
 * Die Titelbilder der Stunde, auf dem Gerät abgelegt.
 *
 * Die Adressen, unter denen die App Bilder holt, gelten nur eine Stunde — und
 * eine Stunde kann länger dauern, in einer Halle ohne Empfang. Deshalb wird
 * beim Start das **Bild selbst** geholt und in der Ablage des Browsers
 * gehalten, nicht seine Adresse.
 *
 * Geht das nicht (privates Fenster, kein Platz), fehlt in der Halle das Bild —
 * die Stunde läuft trotzdem. Kein Weg hier meldet einen Fehler.
 */

const CACHE = 'stundenplaner-live-bilder'
const BUCKET = 'exercise-images'

function cacheKey(path: string): string {
  return `/__live-bild/${encodeURIComponent(path)}`
}

function available(): boolean {
  return typeof window !== 'undefined' && 'caches' in window
}

async function download(path: string): Promise<Response | null> {
  let url = path
  if (!path.startsWith('http')) {
    const { data } = await createClient().storage.from(BUCKET).createSignedUrl(path, 60 * 60)
    if (!data?.signedUrl) return null
    url = data.signedUrl
  }
  const response = await fetch(url)
  return response.ok ? response : null
}

/**
 * Legt die Titelbilder des Plans ab und räumt die einer früheren Stunde weg.
 * Läuft auf dem Bereitschaftsbild — dort ist immer Netz da.
 */
export async function storePlanImages(plan: LivePlan): Promise<void> {
  if (!available()) return

  const paths = Array.from(
    // Eine Akte aus einer älteren Fassung der App kennt die Liste noch nicht.
    new Set(plan.steps.flatMap((step) => step.imagePaths ?? []))
  )

  try {
    const cache = await caches.open(CACHE)
    const wanted = new Set(paths.map((path) => new URL(cacheKey(path), location.origin).href))

    const known = await cache.keys()
    await Promise.all(
      known.filter((request) => !wanted.has(request.url)).map((request) => cache.delete(request))
    )

    await Promise.all(
      paths.map(async (path) => {
        try {
          if (await cache.match(cacheKey(path))) return
          const response = await download(path)
          if (response) await cache.put(cacheKey(path), response)
        } catch {
          // Dieses eine Bild fehlt dann in der Halle.
        }
      })
    )
  } catch {
    // Keine Ablage — die Stunde läuft ohne Bilder.
  }
}

/**
 * Das abgelegte Bild als Adresse, die nur in dieser Seite gilt. Liegt es nicht
 * auf dem Gerät, wird es einmal aus dem Netz versucht.
 */
export async function loadStoredImage(path: string): Promise<string | null> {
  try {
    if (available()) {
      const cache = await caches.open(CACHE)
      const stored = await cache.match(cacheKey(path))
      if (stored) return URL.createObjectURL(await stored.blob())
    }
    const response = await download(path)
    return response ? URL.createObjectURL(await response.blob()) : null
  } catch {
    return null
  }
}
