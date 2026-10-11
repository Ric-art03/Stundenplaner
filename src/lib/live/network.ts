/**
 * Ob der Server der App gerade erreichbar ist — wirklich nachgefragt, nicht
 * nur dem Browser geglaubt.
 *
 * `navigator.onLine` sagt nur, ob das Gerät *irgendein* Netz hat. Ein
 * Hallen-WLAN ohne Internet gilt dem Browser als „online". Ein Seitenwechsel
 * dorthin endete dann auf der Fehlerseite des Browsers (BUG-25).
 *
 * Gefragt wird nach der Datei des Offline-Bausteins: sie liegt immer aus, ist
 * klein, und der Baustein selbst fasst die Anfrage nicht an.
 */
export async function serverReachable(timeoutMs = 4000): Promise<boolean> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return false

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch('/live-sw.js', {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    })
    return response.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
