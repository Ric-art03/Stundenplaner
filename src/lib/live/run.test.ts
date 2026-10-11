import { describe, expect, it } from 'vitest'
import {
  buildRunRecord,
  createRun,
  endForgottenRun,
  endRun,
  nextStep,
  pauseRun,
  previousStep,
  resumeRun,
  skipStep,
  startRun,
} from './run'
import { formatClock, isForgotten, overallClock, roundToMinutes, stepClock, standingLabel } from './clock'
import { MIN, planOf } from './test-helpers'
import type { LiveSession } from './types'

const T0 = 1_000_000_000_000

function started(...minutes: number[]) {
  const plan = planOf(...minutes)
  return { plan, run: startRun(createRun(plan), T0) }
}

describe('Start', () => {
  it('lässt vor „Los geht\'s" keine Zeit laufen', () => {
    const plan = planOf(8, 5)
    const run = createRun(plan)

    expect(run.phase).toBe('ready')
    expect(stepClock(run, plan, T0 + 10 * MIN).remainingMs).toBe(8 * MIN)
  })

  it('startet eine Stunde ohne Schritte nicht', () => {
    const plan = planOf()
    expect(startRun(createRun(plan), T0).phase).toBe('ready')
  })
})

describe('Restzeit', () => {
  it('zeigt 5:00, wenn ein Schritt mit 8 Minuten seit 3 Minuten läuft', () => {
    const { plan, run } = started(8)
    const clock = stepClock(run, plan, T0 + 3 * MIN)

    expect(formatClock(clock.remainingMs)).toBe('5:00')
    expect(clock.expired).toBe(false)
  })

  it('bleibt bei null stehen und zählt als „über" hoch', () => {
    const { plan, run } = started(8, 5)
    const clock = stepClock(run, plan, T0 + 9 * MIN + 20_000)

    expect(clock.remainingMs).toBe(0)
    expect(clock.expired).toBe(true)
    expect(formatClock(clock.overMs)).toBe('1:20')
    // Nichts schaltet von selbst weiter.
    expect(run.current).toBe(0)
  })

  it('wird nie größer als die Plandauer, wenn die Uhr des Geräts zurückspringt', () => {
    const { plan, run } = started(8)
    expect(stepClock(run, plan, T0 - 30 * MIN).remainingMs).toBe(8 * MIN)
  })

  it('rechnet nach zwei Minuten Sperre einfach neu', () => {
    const { plan, run } = started(8)
    const before = stepClock(run, plan, T0 + 1 * MIN).remainingMs
    const after = stepClock(run, plan, T0 + 3 * MIN).remainingMs

    expect(before - after).toBe(2 * MIN)
  })
})

describe('Weiter, Zurück, Auslassen', () => {
  it('beendet den Schritt vor Ablauf als gemacht, mit seiner tatsächlichen Dauer', () => {
    const { run } = started(8, 5)
    const next = nextStep(run, T0 + 3 * MIN)

    expect(next.current).toBe(1)
    expect(next.steps[0]).toEqual({ elapsedMs: 3 * MIN, status: 'done' })
    expect(next.steps[1].status).toBe('open')
  })

  it('hält einen ausgelassenen Schritt als ausgelassen fest', () => {
    const { run } = started(8, 5)
    const next = skipStep(run, T0 + 1 * MIN)

    expect(next.current).toBe(1)
    expect(next.steps[0].status).toBe('skipped')
  })

  it('lässt nach „Zurück" die Zeit dort weiterlaufen, wo sie stand', () => {
    const { plan, run } = started(8, 5)
    const second = nextStep(run, T0 + 3 * MIN)
    const back = previousStep(second, T0 + 4 * MIN)

    expect(back.current).toBe(0)
    // Drei Minuten waren gelaufen, eine weitere läuft seit dem Zurückkehren.
    expect(formatClock(stepClock(back, plan, T0 + 5 * MIN).remainingMs)).toBe('4:00')
    // Die Minute im zweiten Schritt bleibt ihm.
    expect(back.steps[1].elapsedMs).toBe(1 * MIN)
  })

  it('macht aus einem ausgelassenen Schritt einen gemachten, wenn er über „Zurück" beendet wird', () => {
    const { run } = started(8, 5)
    const skipped = skipStep(run, T0 + 1 * MIN)
    const back = previousStep(skipped, T0 + 2 * MIN)
    const done = nextStep(back, T0 + 6 * MIN)

    expect(done.steps[0]).toEqual({ elapsedMs: 5 * MIN, status: 'done' })
  })

  it('geht am ersten Schritt nicht zurück', () => {
    const { run } = started(8, 5)
    expect(previousStep(run, T0 + MIN)).toBe(run)
  })

  it('zählt einen unter zwei Sekunden offenen Schritt als ausgelassen', () => {
    const { run } = started(8, 5, 5)
    const first = nextStep(run, T0 + 3 * MIN)
    const second = nextStep(first, T0 + 3 * MIN + 500)

    expect(second.current).toBe(2)
    expect(second.steps[1].status).toBe('skipped')
  })

  it('beendet die Stunde nach dem letzten Schritt', () => {
    const { run } = started(8)
    const ended = nextStep(run, T0 + 8 * MIN)

    expect(ended.phase).toBe('ended')
    expect(ended.endedAt).toBe(T0 + 8 * MIN)
  })
})

describe('Pause', () => {
  it('hält Restzeit und Gesamtstand an', () => {
    const { plan, run } = started(8, 5)
    const paused = pauseRun(run, T0 + 2 * MIN)

    expect(stepClock(paused, plan, T0 + 2 * MIN).remainingMs).toBe(6 * MIN)
    expect(stepClock(paused, plan, T0 + 6 * MIN).remainingMs).toBe(6 * MIN)
    expect(overallClock(paused, plan, T0 + 6 * MIN).remainingMs).toBe(11 * MIN)
  })

  it('läuft nach vier Minuten Pause dort weiter, wo sie stand', () => {
    const { plan, run } = started(8, 5)
    const resumed = resumeRun(pauseRun(run, T0 + 2 * MIN), T0 + 6 * MIN)

    expect(resumed.pausedMs).toBe(4 * MIN)
    expect(stepClock(resumed, plan, T0 + 6 * MIN).remainingMs).toBe(6 * MIN)
    expect(stepClock(resumed, plan, T0 + 7 * MIN).remainingMs).toBe(5 * MIN)
    expect(overallClock(resumed, plan, T0 + 7 * MIN).standing).toBe('on-plan')
  })

  it('rechnet einen Schritt, der in der Pause verlassen wird, ohne die Pause', () => {
    const { run } = started(8, 5)
    const next = nextStep(pauseRun(run, T0 + 2 * MIN), T0 + 9 * MIN)

    expect(next.steps[0].elapsedMs).toBe(2 * MIN)
  })
})

describe('Gesamtstand', () => {
  it('meldet „4 Min hinter Plan", wenn 24 statt 20 Minuten vergangen sind', () => {
    const { plan, run } = started(20, 10)
    const next = nextStep(run, T0 + 24 * MIN)

    expect(standingLabel(overallClock(next, plan, T0 + 24 * MIN))).toBe('4 Min hinter Plan')
  })

  it('nennt eine Abweichung unter einer Minute „im Plan"', () => {
    const { plan, run } = started(20, 10)
    const next = nextStep(run, T0 + 20 * MIN + 50_000)

    expect(standingLabel(overallClock(next, plan, T0 + 20 * MIN + 50_000))).toBe('im Plan')
  })

  it('verschiebt sich um 6 Minuten zugunsten des Nutzers, wenn ein Schritt mit 6 Minuten ausgelassen wird', () => {
    const { plan, run } = started(10, 6, 10)
    const second = nextStep(run, T0 + 10 * MIN)
    const before = overallClock(second, plan, T0 + 10 * MIN)
    const skipped = skipStep(second, T0 + 10 * MIN)
    const after = overallClock(skipped, plan, T0 + 10 * MIN)

    expect(before.standing).toBe('on-plan')
    expect(standingLabel(after)).toBe('6 Min voraus')
  })

  it('wächst nicht, solange der laufende Schritt in seiner Zeit bleibt', () => {
    const { plan, run } = started(10, 10)
    expect(overallClock(run, plan, T0 + 9 * MIN).standing).toBe('on-plan')
    expect(standingLabel(overallClock(run, plan, T0 + 13 * MIN))).toBe('3 Min hinter Plan')
  })

  it('zählt die verbleibenden Minuten der Stunde', () => {
    const { plan, run } = started(10, 10)
    expect(overallClock(run, plan, T0 + 4 * MIN).remainingMs).toBe(16 * MIN)
  })
})

describe('Stunde beenden', () => {
  it('lässt bei vorzeitigem Ende die übrigen Schritte als ausgelassen gelten', () => {
    const { run } = started(5, 5, 5, 5)
    const ended = endRun(run, T0 + 4 * MIN)

    expect(ended.phase).toBe('ended')
    expect(ended.steps.map((item) => item.status)).toEqual(['done', 'skipped', 'skipped', 'skipped'])
  })

  it('lässt einen über „Zurück" verlassenen Schritt als gemacht gelten', () => {
    const { run } = started(5, 5)
    const second = nextStep(run, T0 + 5 * MIN)
    const back = previousStep(second, T0 + 8 * MIN)
    const ended = endRun(back, T0 + 9 * MIN)

    expect(ended.steps.map((item) => item.status)).toEqual(['done', 'done'])
  })
})

describe('Vergessene Stunde', () => {
  it('gilt ab mehr als der doppelten Plandauer als vergessen', () => {
    const { plan, run } = started(30, 30)

    expect(isForgotten(run, plan, T0 + 120 * MIN)).toBe(false)
    expect(isForgotten(run, plan, T0 + 121 * MIN)).toBe(true)
  })

  it('zählt den offen gebliebenen Schritt mit höchstens seiner Plandauer', () => {
    const { plan, run } = started(30, 30)
    const second = nextStep(run, T0 + 28 * MIN)
    const ended = endForgottenRun(second, plan, T0 + 300 * MIN)

    expect(ended.phase).toBe('ended')
    expect(ended.steps[1]).toEqual({ elapsedMs: 30 * MIN, status: 'done' })
  })
})

describe('Durchführung', () => {
  it('hält je Schritt Status und Dauern fest, ohne Pausen', () => {
    const { plan, run } = started(8, 6, 5)
    let state = nextStep(run, T0 + 10 * MIN + 40_000)
    state = pauseRun(state, T0 + 11 * MIN)
    state = resumeRun(state, T0 + 15 * MIN)
    state = skipStep(state, T0 + 15 * MIN)
    state = nextStep(state, T0 + 20 * MIN)

    const session: LiveSession = {
      version: 1,
      runId: 'lauf-1',
      userId: 'nutzer-1',
      plan,
      run: state,
      noteDraft: '  Lief gut.  ',
      adopted: { 0: { duration: 11 } },
    }
    const record = buildRunRecord(session)

    expect(record.id).toBe('lauf-1')
    expect(record.note).toBe('Lief gut.')
    expect(record.plannedMinutes).toBe(19)
    expect(record.pausedSeconds).toBe(240)
    expect(record.steps.map((item) => item.status)).toEqual(['done', 'skipped', 'done'])
    expect(record.steps[0].actualSeconds).toBe(640)
    expect(record.steps[0].adoptedDuration).toBe(11)
    expect(record.actualSeconds).toBe(640 + 20 + 300)
  })

  it('schlägt für 10:40 elf Minuten vor und nie weniger als die Mindestdauer', () => {
    expect(roundToMinutes(640)).toBe(11)
    expect(roundToMinutes(12)).toBe(1)
  })
})
