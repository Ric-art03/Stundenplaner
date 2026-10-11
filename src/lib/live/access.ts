import type { LiveSession, PendingRun } from './types'

/** So lange bleibt die Zusammenfassung einer beendeten Stunde ohne Anmeldung stehen. */
export const ENDED_VISIBLE_MS = 12 * 60 * 60 * 1000

/**
 * - `show` — die Akte gehört auf diesen Bildschirm
 * - `hide` — sie gehört einem anderen Konto; nicht zeigen, aber liegen lassen
 * - `clear` — sie hat hier nichts mehr zu suchen und wird vom Gerät genommen
 */
export type SessionAccess = 'show' | 'hide' | 'clear'

/**
 * Wer die Stundenakte auf diesem Gerät sehen darf.
 *
 * `/live` verlangt keine Anmeldung vom Server — eine laufende Stunde muss in
 * einer Halle ohne Empfang und mit abgelaufener Sitzung bedienbar bleiben.
 * Daraus darf aber nicht folgen, dass jede Akte für jeden zu sehen ist, der
 * das Gerät in die Hand nimmt (BUG-24):
 *
 * - Ein **anderes angemeldetes Konto** sieht sie nie.
 * - **Ohne Anmeldung** bleibt eine **laufende** Stunde bedienbar.
 * - Eine **beendete** bleibt ohne Anmeldung nur stehen, solange ihre
 *   Durchführung **noch auf dem Gerät wartet** und nicht älter als zwölf
 *   Stunden ist — das ist der Fall „Halle ohne Netz, Sitzung inzwischen
 *   abgelaufen", in dem der Nutzer seine Zusammenfassung noch braucht. Ist die
 *   Durchführung gespeichert, gibt es ohne Anmeldung an ihr nichts mehr zu tun.
 * - Ein offen gelassenes **Bereitschaftsbild** ohne Anmeldung ist nichts wert:
 *   starten ließe sich die Stunde ohnehin nur angemeldet.
 *
 * `knownUserId`: das Konto, das dieses Gerät zuletzt kannte; `null` = keines.
 */
export function sessionAccess(
  session: LiveSession,
  knownUserId: string | null,
  pending: PendingRun[],
  now: number
): SessionAccess {
  if (knownUserId !== null) return knownUserId === session.userId ? 'show' : 'hide'

  const { run } = session
  if (run.phase === 'running') return 'show'
  if (run.phase === 'ready') return 'clear'

  const waiting = pending.some((entry) => entry.record.id === session.runId && !entry.failure)
  const fresh = run.endedAt !== null && now - run.endedAt <= ENDED_VISIBLE_MS
  return waiting && fresh ? 'show' : 'clear'
}
