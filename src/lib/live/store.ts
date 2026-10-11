import { buildRunRecord, createRun } from './run'
import type { LivePlan, LiveSession, PendingRun, RunRecord } from './types'

/**
 * Die Stundenakte auf dem Gerät.
 *
 * Sie liegt im Speicher des Browsers: klein, sofort lesbar, und der Browser
 * sagt anderen Tabs von selbst Bescheid, wenn sich etwas ändert. Es gibt
 * **eine** Akte je Gerät — sie trägt das Konto, zu dem sie gehört.
 *
 * Ohne Zugriff auf den Speicher (privates Fenster) lebt die Akte nur in dieser
 * Seite: die Stunde läuft, übersteht aber kein Neuladen. Das Bereitschaftsbild
 * warnt davor.
 */

const SESSION_KEY = 'stundenplaner:live:akte'
const PENDING_KEY = 'stundenplaner:live:warteliste'
const CHANGE_EVENT = 'stundenplaner:live:geaendert'

/** Rückfall, wenn der Speicher des Browsers nicht benutzbar ist. */
const memory = new Map<string, string>()
let storageWorks: boolean | null = null

export function storageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  if (storageWorks !== null) return storageWorks
  try {
    const probe = 'stundenplaner:live:probe'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    storageWorks = true
  } catch {
    storageWorks = false
  }
  return storageWorks
}

function readRaw(key: string): string | null {
  if (typeof window === 'undefined') return null
  if (!storageAvailable()) return memory.get(key) ?? null
  try {
    return window.localStorage.getItem(key)
  } catch {
    return memory.get(key) ?? null
  }
}

function writeRaw(key: string, value: string | null) {
  if (typeof window === 'undefined') return
  if (value === null) memory.delete(key)
  else memory.set(key, value)

  if (storageAvailable()) {
    try {
      if (value === null) window.localStorage.removeItem(key)
      else window.localStorage.setItem(key, value)
    } catch {
      // Speicher voll oder gesperrt — die Akte lebt dann nur in dieser Seite.
    }
  }
  // Das `storage`-Ereignis des Browsers erreicht nur die *anderen* Tabs.
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function parse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

// `useSyncExternalStore` verlangt dieselbe Referenz, solange sich nichts
// geändert hat — sonst zeichnet React endlos neu.
const cache = new Map<string, { raw: string | null; value: unknown }>()

function readCached<T>(key: string): T | null {
  const raw = readRaw(key)
  const known = cache.get(key)
  if (known && known.raw === raw) return known.value as T | null
  const value = parse<T>(raw)
  cache.set(key, { raw, value })
  return value
}

export function readSession(): LiveSession | null {
  const session = readCached<LiveSession>(SESSION_KEY)
  return session?.version === 1 ? session : null
}

export function writeSession(session: LiveSession | null) {
  writeRaw(SESSION_KEY, session ? JSON.stringify(session) : null)
}

const EMPTY_PENDING: PendingRun[] = []

export function readPending(): PendingRun[] {
  return readCached<PendingRun[]>(PENDING_KEY) ?? EMPTY_PENDING
}

function writePending(pending: PendingRun[]) {
  writeRaw(PENDING_KEY, pending.length > 0 ? JSON.stringify(pending) : null)
}

/** Meldet Änderungen aus diesem Tab, aus anderen Tabs und beim Zurückkehren. */
export function subscribe(listener: () => void): () => void {
  function onVisible() {
    if (document.visibilityState === 'visible') listener()
  }
  window.addEventListener('storage', listener)
  window.addEventListener(CHANGE_EVENT, listener)
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.removeEventListener('storage', listener)
    window.removeEventListener(CHANGE_EVENT, listener)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

function newRunId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  // Ältere Browser: dieselbe Gestalt von Hand. Die Datenbank nimmt als
  // Kennung nur eine UUID an.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

/** Legt die Akte für eine neue Stunde an — im Zustand „bereit", die Uhr läuft noch nicht. */
export function openSession(userId: string, plan: LivePlan): LiveSession {
  const session: LiveSession = {
    version: 1,
    runId: newRunId(),
    userId,
    plan,
    run: createRun(plan),
    noteDraft: '',
    adopted: {},
  }
  writeSession(session)
  return session
}

/** Wendet eine Änderung auf die Akte an, wie sie **jetzt** auf dem Gerät liegt. */
export function updateSession(change: (session: LiveSession) => LiveSession) {
  const session = readSession()
  if (session) writeSession(change(session))
}

/** Eine Stunde, die wirklich läuft — „bereit" und „beendet" zählen nicht. */
export function runningSession(userId: string | null): LiveSession | null {
  const session = readSession()
  if (!session || session.run.phase !== 'running') return null
  if (userId && session.userId !== userId) return null
  return session
}

/**
 * Stellt die beendete Stunde in die Warteliste. Die Kennung der Durchführung
 * ist die der Akte — kommt sie zweimal an, erkennt die Datenbank sie wieder.
 */
export function queueRun(session: LiveSession) {
  const record = buildRunRecord(session)
  const others = readPending().filter((entry) => entry.record.id !== record.id)
  writePending([...others, { userId: session.userId, record, failure: null }])
}

/** Trägt die Notiz „Wie lief's?" an einer noch wartenden Durchführung nach. */
export function setPendingNote(runId: string, note: string): boolean {
  const pending = readPending()
  if (!pending.some((entry) => entry.record.id === runId)) return false
  writePending(
    pending.map((entry) =>
      entry.record.id === runId ? { ...entry, record: { ...entry.record, note } } : entry
    )
  )
  return true
}

export function dropPending(runId: string) {
  writePending(readPending().filter((entry) => entry.record.id !== runId))
}

export type SaveRunResult =
  | { ok: true }
  /** `permanent` = erneutes Senden hilft nicht (Einheit gelöscht, fremdes Konto). */
  | { ok: false; permanent: boolean; error: string }

let flushing: Promise<void> | null = null

/**
 * Reicht wartende Durchführungen nach. Läuft schon ein Versuch, wird auf ihn
 * gewartet statt ein zweiter gestartet — doppelt gesendet wäre zwar harmlos,
 * aber unnötig.
 */
export function flushPending(
  userId: string,
  save: (record: RunRecord) => Promise<SaveRunResult>
): Promise<void> {
  if (flushing) return flushing

  flushing = (async () => {
    const waiting = readPending().filter((entry) => entry.userId === userId && !entry.failure)
    for (const entry of waiting) {
      let result: SaveRunResult
      try {
        result = await save(entry.record)
      } catch {
        // Kein Netz: bleibt liegen, der nächste Anlass versucht es wieder.
        continue
      }
      if (result.ok) dropPending(entry.record.id)
      else if (result.permanent) {
        writePending(
          readPending().map((item) =>
            item.record.id === entry.record.id ? { ...item, failure: result.error } : item
          )
        )
      }
    }
  })().finally(() => {
    flushing = null
  })

  return flushing
}
