/**
 * Das Signal beim Ablauf der Zeit: ein kurzer Ton, und wo das Gerät es kann,
 * eine Vibration.
 *
 * Der Ton wird **im Gerät erzeugt** — keine Datei, nichts zu laden, geht damit
 * auch ohne Netz. Handys lassen Töne erst nach einer Berührung zu:
 * `unlockSignal` gehört deshalb in den Tipp auf „Los geht's".
 *
 * Blockiert der Browser den Ton, bleibt es still — ohne Fehlermeldung. Der
 * Ablauf ist ohnehin sichtbar.
 */

type AudioContextClass = typeof AudioContext

let context: AudioContext | null = null

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (context) return context
  const Implementation: AudioContextClass | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextClass }).webkitAudioContext
  if (!Implementation) return null
  try {
    context = new Implementation()
  } catch {
    context = null
  }
  return context
}

/** Aus einer Berührung heraus aufrufen — schaltet den Ton für später frei. */
export function unlockSignal() {
  const audio = audioContext()
  if (audio?.state === 'suspended') void audio.resume().catch(() => {})
}

function beep(audio: AudioContext, startAt: number) {
  const oscillator = audio.createOscillator()
  const gain = audio.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = 880
  // Weich ein- und ausblenden, sonst knackt es.
  gain.gain.setValueAtTime(0.0001, startAt)
  gain.gain.exponentialRampToValueAtTime(0.4, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.3)
  oscillator.connect(gain).connect(audio.destination)
  oscillator.start(startAt)
  oscillator.stop(startAt + 0.32)
}

export function playSignal() {
  try {
    const audio = audioContext()
    if (audio && audio.state === 'running') {
      beep(audio, audio.currentTime)
      beep(audio, audio.currentTime + 0.4)
    }
  } catch {
    // Kein Ton — der Ablauf bleibt sichtbar.
  }
  try {
    // Das iPhone kann aus dem Browser nicht vibrieren; das bleibt ohne Meldung.
    navigator.vibrate?.([200, 100, 200])
  } catch {
    // Nichts zu tun.
  }
}
