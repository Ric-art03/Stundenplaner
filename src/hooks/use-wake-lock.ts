'use client'

import * as React from 'react'

/**
 * - `checking` — die Anfrage läuft noch
 * - `held` — der Bildschirm bleibt an
 * - `unsupported` — das Gerät kennt das Wachhalten nicht
 * - `denied` — das Gerät verweigert es gerade (typisch: Energiesparmodus)
 */
export type WakeLockStatus = 'checking' | 'held' | 'unsupported' | 'denied'

/**
 * Hält den Bildschirm wach, solange `active` gilt.
 *
 * Die App **probiert** es, statt vom Gerät oder vom Akkustand auf die Antwort
 * zu schließen: wann Geräte ablehnen, ist nur ungefähr dokumentiert. Jedes
 * Gerät gibt das Wachhalten ab, sobald die Seite nicht mehr sichtbar ist —
 * beim Zurückkehren wird es von selbst neu angefordert.
 */
export function useWakeLock(active: boolean): { status: WakeLockStatus; retry: () => void } {
  const [status, setStatus] = React.useState<WakeLockStatus>('checking')
  // Jeder neue Wert fordert das Wachhalten neu an: „Erneut prüfen" und der
  // Fall, dass das Gerät es bei sichtbarer Seite entzieht.
  const [attempt, setAttempt] = React.useState(0)

  React.useEffect(() => {
    if (!active) return

    if (!('wakeLock' in navigator)) {
      setStatus('unsupported')
      return
    }

    let stopped = false
    let sentinel: WakeLockSentinel | null = null

    async function request() {
      // Eine verdeckte Seite bekommt es nie; das ist keine Ablehnung des Geräts.
      if (stopped || sentinel || document.visibilityState !== 'visible') return
      try {
        const lock = await navigator.wakeLock.request('screen')
        if (stopped) {
          void lock.release()
          return
        }
        sentinel = lock
        setStatus('held')
        lock.addEventListener('release', () => {
          sentinel = null
          // Verdeckt = der gewöhnliche Fall, beim Zurückkehren holen wir es
          // wieder. Sichtbar verloren = das Gerät hat es entzogen.
          if (!stopped && document.visibilityState === 'visible') {
            setAttempt((value) => value + 1)
          }
        })
      } catch {
        if (!stopped) setStatus('denied')
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') void request()
    }

    void request()
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      stopped = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release()
      sentinel = null
    }
  }, [active, attempt])

  const retry = React.useCallback(() => {
    setStatus('checking')
    setAttempt((value) => value + 1)
  }, [])

  return { status, retry }
}
