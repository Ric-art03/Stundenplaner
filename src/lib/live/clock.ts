import { sinceEntered } from './run'
import type { LivePlan, LiveRun } from './types'

/**
 * Die Uhr: jede Anzeige ist eine Rechnung aus dem Verlauf und „jetzt". Hier
 * läuft nichts mit — man gibt einen Verlauf und einen Zeitpunkt hinein und
 * liest das Ergebnis.
 */

const MINUTE = 60_000

/** Was ein Schritt bisher lief, den laufenden Anteil eingerechnet. */
export function stepElapsedMs(run: LiveRun, index: number, now: number): number {
  const stored = run.steps[index]?.elapsedMs ?? 0
  return index === run.current ? stored + sinceEntered(run, now) : stored
}

export interface StepClock {
  /** Nie negativ und nie größer als die Plandauer. */
  remainingMs: number
  /** Über der Zeit: zählt ab null hoch. */
  overMs: number
  expired: boolean
}

export function stepClock(run: LiveRun, plan: LivePlan, now: number): StepClock {
  const plannedMs = (plan.steps[run.current]?.plannedMinutes ?? 0) * MINUTE
  const elapsed = stepElapsedMs(run, run.current, now)
  const remaining = plannedMs - elapsed
  return {
    remainingMs: Math.min(plannedMs, Math.max(0, remaining)),
    overMs: Math.max(0, -remaining),
    expired: remaining <= 0,
  }
}

export type Standing = 'on-plan' | 'behind' | 'ahead'

export interface OverallClock {
  /** Was laut Plan noch zu laufen hat. */
  remainingMs: number
  standing: Standing
  /** Ganze Minuten Abweichung; 0 bei „im Plan". */
  minutes: number
}

/**
 * Der Gesamtstand: wo die Stunde enden wird, verglichen mit dem Plan.
 *
 * Gerechnet wird, was schon verstrichen ist, plus was laut Plan noch aussteht —
 * gegen die geplante Gesamtdauer. Ein überzogener Schritt schiebt nach hinten;
 * ein früher beendeter oder ausgelassener gewinnt seine restliche Planzeit.
 * Pausen zählen nicht mit, weil sie in keinem Schritt stecken.
 *
 * Abweichungen unter einer Minute gelten als „im Plan".
 */
export function overallClock(run: LiveRun, plan: LivePlan, now: number): OverallClock {
  let elapsed = 0
  let outstanding = 0

  plan.steps.forEach((step, index) => {
    const stepElapsed = stepElapsedMs(run, index, now)
    elapsed += stepElapsed
    // Nur was noch offen ist, steht aus: der aktuelle Schritt und die, die
    // danach kommen. Abgeschlossenes und Ausgelassenes ist erledigt.
    if (index >= run.current && run.steps[index]?.status === 'open') {
      outstanding += Math.max(0, step.plannedMinutes * MINUTE - stepElapsed)
    }
  })

  const deviation = elapsed + outstanding - plan.totalMinutes * MINUTE
  const minutes = Math.floor(Math.abs(deviation) / MINUTE)

  return {
    remainingMs: outstanding,
    standing: minutes === 0 ? 'on-plan' : deviation > 0 ? 'behind' : 'ahead',
    minutes,
  }
}

/**
 * Eine vergessene Stunde: seit dem Start ist mehr als das Doppelte der
 * geplanten Gesamtdauer vergangen. Sie wird nicht still weitergezählt, sondern
 * zur Entscheidung vorgelegt.
 */
export function isForgotten(run: LiveRun, plan: LivePlan, now: number): boolean {
  if (run.phase !== 'running' || run.startedAt === null) return false
  return now - run.startedAt > 2 * plan.totalMinutes * MINUTE
}

/** „5:00", „12:07" — ab einer Stunde „1:02:07". */
export function formatClock(ms: number): string {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
    : `${minutes}:${seconds}`
}

/** Auf ganze Minuten gerundet, mindestens die Mindestdauer. */
export function roundToMinutes(seconds: number, minimum = 1): number {
  return Math.max(minimum, Math.round(seconds / 60))
}

/** „34 Min" aus Millisekunden, aufgerundet — „0 Min" erst, wenn nichts mehr aussteht. */
export function minutesLeft(ms: number): number {
  return Math.ceil(Math.max(0, ms) / MINUTE)
}

export function standingLabel(clock: OverallClock): string {
  if (clock.standing === 'on-plan') return 'im Plan'
  return clock.standing === 'behind'
    ? `${clock.minutes} Min hinter Plan`
    : `${clock.minutes} Min voraus`
}
