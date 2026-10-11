import { describe, expect, it } from 'vitest'
import { ENDED_VISIBLE_MS, sessionAccess } from './access'
import { buildRunRecord, createRun, endRun, startRun } from './run'
import { MIN, planOf } from './test-helpers'
import type { LiveSession, PendingRun } from './types'

const OWNER = 'nutzer-1'
const T0 = 1_000_000_000_000

function session(phase: 'ready' | 'running' | 'ended'): LiveSession {
  const plan = planOf(5, 5)
  let run = createRun(plan)
  if (phase !== 'ready') run = startRun(run, T0)
  if (phase === 'ended') run = endRun(run, T0 + 9 * MIN)
  return { version: 1, runId: 'lauf-1', userId: OWNER, plan, run, noteDraft: '', adopted: {} }
}

function waiting(of: LiveSession, failure: string | null = null): PendingRun[] {
  return [{ userId: of.userId, record: buildRunRecord(of), failure }]
}

const END = T0 + 9 * MIN

describe('Wer die Stundenakte sehen darf', () => {
  it('zeigt sie dem Konto, dem sie gehört — in jedem Zustand', () => {
    for (const phase of ['ready', 'running', 'ended'] as const) {
      expect(sessionAccess(session(phase), OWNER, [], END)).toBe('show')
    }
  })

  it('verbirgt sie vor einem anderen angemeldeten Konto, ohne sie zu löschen', () => {
    for (const phase of ['ready', 'running', 'ended'] as const) {
      expect(sessionAccess(session(phase), 'anderes-konto', [], END)).toBe('hide')
    }
  })

  it('lässt eine laufende Stunde ohne Anmeldung bedienbar — Sitzung abgelaufen, Halle ohne Netz', () => {
    expect(sessionAccess(session('running'), null, [], T0 + 30 * MIN)).toBe('show')
  })

  it('nimmt ein offen gelassenes Bereitschaftsbild ohne Anmeldung vom Gerät', () => {
    expect(sessionAccess(session('ready'), null, [], T0)).toBe('clear')
  })

  it('nimmt eine beendete und schon gespeicherte Stunde ohne Anmeldung vom Gerät', () => {
    expect(sessionAccess(session('ended'), null, [], END + MIN)).toBe('clear')
  })

  it('lässt eine beendete Stunde ohne Anmeldung stehen, solange ihre Durchführung noch auf dem Gerät wartet', () => {
    const ended = session('ended')
    expect(sessionAccess(ended, null, waiting(ended), END + MIN)).toBe('show')
  })

  it('… aber nicht länger als zwölf Stunden', () => {
    const ended = session('ended')
    expect(sessionAccess(ended, null, waiting(ended), END + ENDED_VISIBLE_MS)).toBe('show')
    expect(sessionAccess(ended, null, waiting(ended), END + ENDED_VISIBLE_MS + 1)).toBe('clear')
  })

  it('… und nicht, wenn das Nachreichen endgültig gescheitert ist oder eine andere Durchführung wartet', () => {
    const ended = session('ended')
    expect(sessionAccess(ended, null, waiting(ended, 'Die Einheit gibt es nicht mehr.'), END + MIN)).toBe('clear')

    const other = { ...ended, runId: 'lauf-2' }
    expect(sessionAccess(ended, null, waiting(other), END + MIN)).toBe('clear')
  })
})
