import type {
  LivePlan,
  LiveRun,
  LiveSession,
  RunRecord,
  RunStepRecord,
  StepProgress,
} from './types'

/**
 * Der Verlauf einer Stunde als reine Umformungen: alter Verlauf und „jetzt"
 * hinein, neuer Verlauf heraus. Kein Bildschirm, keine Uhr, kein Speicher —
 * deshalb ohne Warten prüfbar.
 */

/**
 * Ein Schritt, der kürzer offen war, gilt als ausgelassen statt als gemacht:
 * so zählt mehrfaches schnelles Tippen auf „Weiter" keine Übungen ab, die nie
 * stattfanden.
 */
export const MIN_DONE_MS = 2000

export function createRun(plan: LivePlan): LiveRun {
  return {
    phase: 'ready',
    startedAt: null,
    endedAt: null,
    current: 0,
    enteredAt: null,
    pausedAt: null,
    pausedMs: 0,
    steps: plan.steps.map(() => ({ elapsedMs: 0, status: 'open' })),
  }
}

/** „Los geht's" — erst jetzt läuft die Zeit. */
export function startRun(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'ready' || run.steps.length === 0) return run
  return { ...run, phase: 'running', startedAt: now, enteredAt: now }
}

/** In der Pause steht die Zeit: dann gilt ihr Beginn als „jetzt". */
function effectiveNow(run: LiveRun, now: number): number {
  return run.pausedAt ?? now
}

/**
 * Die Zeit seit dem Betreten des aktuellen Schritts. Springt die Uhr des
 * Geräts zurück, wird daraus nie eine negative Zeit.
 */
export function sinceEntered(run: LiveRun, now: number): number {
  if (run.phase !== 'running' || run.enteredAt === null) return 0
  return Math.max(0, effectiveNow(run, now) - run.enteredAt)
}

/** Schreibt die laufende Zeit des aktuellen Schritts fest. */
function settle(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'running') return run
  const at = effectiveNow(run, now)
  const steps = run.steps.map((step, index) =>
    index === run.current ? { ...step, elapsedMs: step.elapsedMs + sinceEntered(run, now) } : step
  )
  return { ...run, steps, enteredAt: at }
}

function closed(step: StepProgress, skipped: boolean): StepProgress {
  const done = !skipped && step.elapsedMs >= MIN_DONE_MS
  return { ...step, status: done ? 'done' : 'skipped' }
}

function finish(run: LiveRun, now: number): LiveRun {
  // Schritte hinter dem aktuellen, die schon einmal liefen (über „Zurück"
  // verlassen), gelten als gemacht; alles nie Betretene als ausgelassen.
  const steps = run.steps.map((step, index) =>
    index > run.current && step.status === 'open' ? closed(step, false) : step
  )
  return { ...run, steps, phase: 'ended', endedAt: effectiveNow(run, now), enteredAt: null }
}

function leaveCurrent(run: LiveRun, now: number, skipped: boolean): LiveRun {
  if (run.phase !== 'running') return run
  const settled = settle(run, now)
  const steps = settled.steps.map((step, index) =>
    index === settled.current ? closed(step, skipped) : step
  )
  const next = { ...settled, steps }

  if (settled.current >= steps.length - 1) return finish(next, now)

  // Der nächste Schritt ist wieder offen — auch wenn er über „Zurück" schon
  // einmal abgeschlossen war. Seine Zeit läuft dort weiter, wo sie stand.
  const target = settled.current + 1
  return {
    ...next,
    current: target,
    steps: steps.map((step, index) => (index === target ? { ...step, status: 'open' } : step)),
  }
}

/** „Weiter" — vor Ablauf der Zeit gilt der Schritt als früher beendet, nicht als ausgelassen. */
export function nextStep(run: LiveRun, now: number): LiveRun {
  return leaveCurrent(run, now, false)
}

/** „Auslassen" — der Schritt wird nicht gemacht. */
export function skipStep(run: LiveRun, now: number): LiveRun {
  return leaveCurrent(run, now, true)
}

/**
 * „Zurück" — öffnet den vorigen Schritt wieder. Seine Zeit läuft dort weiter,
 * wo sie stand; ein ausgelassener Schritt gilt danach wieder als gemacht,
 * sobald er mit „Weiter" beendet wird.
 */
export function previousStep(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'running' || run.current === 0) return run
  const settled = settle(run, now)
  const target = settled.current - 1
  return {
    ...settled,
    current: target,
    steps: settled.steps.map((step, index) =>
      index === target ? { ...step, status: 'open' } : step
    ),
  }
}

export function pauseRun(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'running' || run.pausedAt !== null) return run
  return { ...run, pausedAt: now }
}

export function resumeRun(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'running' || run.pausedAt === null) return run
  const paused = Math.max(0, now - run.pausedAt)
  return {
    ...run,
    pausedAt: null,
    pausedMs: run.pausedMs + paused,
    // Die Pause zählt nicht mit: der Schritt wurde um ihre Länge später betreten.
    enteredAt: run.enteredAt === null ? null : run.enteredAt + paused,
  }
}

/** „Stunde beenden" — jederzeit. Übrige Schritte gelten als ausgelassen. */
export function endRun(run: LiveRun, now: number): LiveRun {
  if (run.phase !== 'running') return run
  const settled = settle(run, now)
  const steps = settled.steps.map((step, index) =>
    index === settled.current ? closed(step, false) : step
  )
  return finish({ ...settled, steps }, now)
}

/**
 * Eine vergessene Stunde festhalten. Der Schritt, der die ganze Zeit offen
 * stand, zählt mit **höchstens seiner Plandauer** — sonst stünde eine Übung
 * mit Stunden im Protokoll, und „Dauer übernehmen" schlüge Unsinn vor.
 */
export function endForgottenRun(run: LiveRun, plan: LivePlan, now: number): LiveRun {
  if (run.phase !== 'running') return run
  const settled = settle(run, now)
  const plannedMs = (plan.steps[settled.current]?.plannedMinutes ?? 0) * 60_000
  const steps = settled.steps.map((step, index) =>
    index === settled.current
      ? closed({ ...step, elapsedMs: Math.min(step.elapsedMs, plannedMs) }, false)
      : step
  )
  return finish({ ...settled, steps }, now)
}

/** Die tatsächliche Dauer ohne Pausen: die Summe dessen, was die Schritte liefen. */
export function activeMs(run: LiveRun, now: number): number {
  return run.steps.reduce((sum, step) => sum + step.elapsedMs, 0) + sinceEntered(run, now)
}

/** Die beendete Stunde in der Form, in der sie gespeichert und gezeigt wird. */
export function buildRunRecord(session: LiveSession): RunRecord {
  const { plan, run } = session
  const startedAt = run.startedAt ?? 0
  const endedAt = run.endedAt ?? startedAt

  const steps: RunStepRecord[] = plan.steps.map((step, index) => {
    const progress = run.steps[index]
    const adopted = session.adopted[index]
    return {
      position: index,
      kind: step.kind,
      phase: step.phase,
      name: step.name,
      variantTitle: step.variantTitle,
      plannedMinutes: step.plannedMinutes,
      actualSeconds: Math.round((progress?.elapsedMs ?? 0) / 1000),
      status: progress?.status === 'done' ? 'done' : 'skipped',
      exerciseId: step.exerciseId,
      variantId: step.variantId,
      adoptedNote: adopted?.note ?? null,
      adoptedDuration: adopted?.duration ?? null,
    }
  })

  return {
    id: session.runId,
    unitId: plan.unitId,
    unitName: plan.unitName,
    startedAt: new Date(startedAt).toISOString(),
    endedAt: new Date(endedAt).toISOString(),
    plannedMinutes: plan.totalMinutes,
    actualSeconds: steps.reduce((sum, step) => sum + step.actualSeconds, 0),
    pausedSeconds: Math.round(run.pausedMs / 1000),
    note: session.noteDraft.trim(),
    steps,
  }
}
