import { beforeEach, describe, expect, it, vi } from 'vitest'
import { endRun, nextStep, startRun } from './run'
import {
  dropPending,
  flushPending,
  openSession,
  queueRun,
  readPending,
  readSession,
  runningSession,
  setPendingNote,
  subscribe,
  updateSession,
  writeSession,
  type SaveRunResult,
} from './store'
import { MIN, planOf } from './test-helpers'
import type { LiveSession } from './types'

const USER = 'nutzer-1'
const T0 = 1_000_000_000_000

/** Eine Stunde, die gelaufen und beendet ist. */
function endedSession(userId = USER): LiveSession {
  const session = openSession(userId, planOf(5, 5))
  let run = startRun(session.run, T0)
  run = nextStep(run, T0 + 5 * MIN)
  run = endRun(run, T0 + 9 * MIN)
  const ended = { ...session, run }
  writeSession(ended)
  return ended
}

/**
 * Ein Speicher wie der des Browsers. Die Testumgebung bringt hier keinen mit —
 * und die Ablage soll gegen genau die Schnittstelle laufen, die sie benutzt.
 */
function memoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

Object.defineProperty(window, 'localStorage', { configurable: true, value: memoryStorage() })

beforeEach(() => {
  window.localStorage.clear()
})

describe('Stundenakte', () => {
  it('legt eine neue Akte im Zustand „bereit" an, mit einer UUID als Kennung', () => {
    const session = openSession(USER, planOf(8, 5))

    expect(session.run.phase).toBe('ready')
    expect(session.runId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(readSession()).toEqual(session)
  })

  it('übersteht ein „Neuladen": gelesen wird, was auf dem Gerät liegt', () => {
    const session = openSession(USER, planOf(8))
    const raw = window.localStorage.getItem('stundenplaner:live:akte')

    expect(JSON.parse(raw ?? 'null')).toEqual(session)
  })

  it('liefert dieselbe Referenz, solange sich nichts geändert hat', () => {
    openSession(USER, planOf(8))
    expect(readSession()).toBe(readSession())
  })

  it('verwirft eine Akte in unbekannter Fassung und beschädigte Daten', () => {
    window.localStorage.setItem('stundenplaner:live:akte', JSON.stringify({ version: 99 }))
    expect(readSession()).toBeNull()

    window.localStorage.setItem('stundenplaner:live:akte', '{kein json')
    expect(readSession()).toBeNull()
  })

  it('wendet Änderungen auf den Stand an, der jetzt auf dem Gerät liegt', () => {
    openSession(USER, planOf(8))
    // Ein anderer Tab hat inzwischen geschrieben.
    const other = { ...readSession()!, noteDraft: 'aus dem anderen Tab' }
    window.localStorage.setItem('stundenplaner:live:akte', JSON.stringify(other))

    updateSession((session) => ({ ...session, adopted: { 0: { duration: 11 } } }))

    expect(readSession()?.noteDraft).toBe('aus dem anderen Tab')
    expect(readSession()?.adopted).toEqual({ 0: { duration: 11 } })
  })

  it('zählt nur eine wirklich laufende Stunde als laufend, und nur für das eigene Konto', () => {
    const session = openSession(USER, planOf(8))
    expect(runningSession(USER)).toBeNull()

    writeSession({ ...session, run: startRun(session.run, T0) })
    expect(runningSession(USER)?.runId).toBe(session.runId)
    expect(runningSession('anderes-konto')).toBeNull()
    expect(runningSession(null)?.runId).toBe(session.runId)

    endedSession()
    expect(runningSession(USER)).toBeNull()
  })

  it('meldet Änderungen an alle, die zuhören, und hört nach dem Abmelden auf', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    openSession(USER, planOf(8))
    expect(listener).toHaveBeenCalled()

    listener.mockClear()
    unsubscribe()
    writeSession(null)
    expect(listener).not.toHaveBeenCalled()
  })
})

describe('Warteliste', () => {
  it('stellt eine beendete Stunde mit der Kennung der Akte ein — dieselbe nie zweimal', () => {
    const session = endedSession()
    queueRun(session)
    queueRun(session)

    const pending = readPending()
    expect(pending).toHaveLength(1)
    expect(pending[0].record.id).toBe(session.runId)
    expect(pending[0].userId).toBe(USER)
    expect(pending[0].failure).toBeNull()
    expect(pending[0].record.steps.map((step) => step.status)).toEqual(['done', 'done'])
  })

  it('trägt die Notiz an einer wartenden Durchführung nach und sagt, ob es eine gab', () => {
    const session = endedSession()
    queueRun(session)

    expect(setPendingNote(session.runId, 'Lief gut')).toBe(true)
    expect(readPending()[0].record.note).toBe('Lief gut')
    expect(setPendingNote('unbekannt', 'x')).toBe(false)
  })

  it('reicht nach und räumt auf, was gespeichert ist', async () => {
    const session = endedSession()
    queueRun(session)
    const save = vi.fn(async (): Promise<SaveRunResult> => ({ ok: true }))

    await flushPending(USER, save)

    expect(save).toHaveBeenCalledTimes(1)
    expect(readPending()).toHaveLength(0)
  })

  it('lässt liegen, was ohne Netz nicht hinausgeht, und versucht es beim nächsten Mal wieder', async () => {
    queueRun(endedSession())
    const offline = vi.fn(async (): Promise<SaveRunResult> => {
      throw new Error('kein Netz')
    })

    await flushPending(USER, offline)
    expect(readPending()).toHaveLength(1)
    expect(readPending()[0].failure).toBeNull()

    await flushPending(USER, async () => ({ ok: true }))
    expect(readPending()).toHaveLength(0)
  })

  it('lässt nach einem vorübergehenden Fehler liegen, ohne ihn endgültig zu nennen', async () => {
    queueRun(endedSession())
    await flushPending(USER, async () => ({ ok: false, permanent: false, error: 'Nicht angemeldet.' }))

    expect(readPending()[0].failure).toBeNull()
  })

  it('hält einen endgültigen Fehler mit seinem Grund fest und versucht es nicht still weiter', async () => {
    queueRun(endedSession())
    const gone: SaveRunResult = { ok: false, permanent: true, error: 'Die Einheit gibt es nicht mehr.' }
    await flushPending(USER, async () => gone)

    expect(readPending()[0].failure).toBe('Die Einheit gibt es nicht mehr.')

    const save = vi.fn(async (): Promise<SaveRunResult> => ({ ok: true }))
    await flushPending(USER, save)
    expect(save).not.toHaveBeenCalled()

    dropPending(readPending()[0].record.id)
    expect(readPending()).toHaveLength(0)
  })

  it('reicht nur die Durchführungen des eigenen Kontos nach', async () => {
    queueRun(endedSession('anderes-konto'))
    const save = vi.fn(async (): Promise<SaveRunResult> => ({ ok: true }))

    await flushPending(USER, save)

    expect(save).not.toHaveBeenCalled()
    expect(readPending()).toHaveLength(1)
  })

  it('startet keinen zweiten Versuch, solange einer läuft', async () => {
    queueRun(endedSession())
    let release: (value: SaveRunResult) => void = () => {}
    const save = vi.fn(
      () => new Promise<SaveRunResult>((resolve) => (release = resolve))
    )

    const first = flushPending(USER, save)
    const second = flushPending(USER, save)
    release({ ok: true })
    await Promise.all([first, second])

    expect(save).toHaveBeenCalledTimes(1)
  })

  // BUG-22 (QA 2026-10-11): die Notiz geht in diesem Fall verloren. `it.fails`
  // hält die Suite grün, solange der Fehler besteht — und wird rot, sobald er
  // behoben ist; dann gehört `.fails` hier weg.
  it.fails('verliert eine Notiz nicht, die nachgetragen wird, während das Speichern unterwegs ist', async () => {
    const session = endedSession()
    queueRun(session)
    const sent: string[] = []
    let release: (value: SaveRunResult) => void = () => {}

    const flushing = flushPending(USER, (record) => {
      sent.push(record.note)
      return new Promise<SaveRunResult>((resolve) => (release = resolve))
    })

    // „Fertig", während die Antwort noch aussteht: die Notiz geht an die
    // wartende Durchführung — die aber schon ohne sie abgeschickt ist.
    expect(setPendingNote(session.runId, 'Schnell getippt')).toBe(true)
    release({ ok: true })
    await flushing

    // Entweder liegt die Durchführung mit der Notiz noch in der Warteliste,
    // oder die Notiz ist auf anderem Weg hinausgegangen. Verloren sein darf
    // sie nicht.
    const stillWaiting = readPending().some((entry) => entry.record.note === 'Schnell getippt')
    expect(stillWaiting || sent.includes('Schnell getippt')).toBe(true)
  })
})
