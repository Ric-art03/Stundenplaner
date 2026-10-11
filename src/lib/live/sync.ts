import { saveRun, updateRunNote } from '@/lib/actions/live'
import { flushPending, type SaveRunResult } from './store'

/**
 * Trägt die Notiz an einer schon gespeicherten Durchführung nach — in der
 * Form, die das Nachreichen versteht.
 */
async function saveNote(runId: string, note: string): Promise<SaveRunResult> {
  const result = await updateRunNote(runId, note)
  if (result.ok) return { ok: true }
  // Vorübergehend (nicht angemeldet, Datenbank nicht erreichbar): später noch
  // einmal. Alles andere — die Durchführung gibt es nicht mehr — ist endgültig.
  return { ok: false, permanent: !result.transient, error: result.error }
}

/**
 * Der eine Weg, auf dem wartende Durchführungen an den Server gehen — von
 * überall gleich: nach „Stunde beenden", aus dem Hinweis in der Kopfzeile,
 * beim Start einer zweiten Stunde, vor dem Abmelden.
 */
export function syncPending(userId: string): Promise<void> {
  return flushPending(userId, saveRun, saveNote)
}
