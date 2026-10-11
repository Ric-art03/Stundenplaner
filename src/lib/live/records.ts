import type { Database } from '@/lib/database.types'
import type {
  AdoptedNote,
  AdoptedNoteTarget,
  LiveStepKind,
  RunRecord,
  RunStepRecord,
} from './types'

type RunRow = Database['public']['Tables']['unit_runs']['Row']
type StepRow = Database['public']['Tables']['unit_run_steps']['Row']

/**
 * Was die Datenbank-Funktion `save_unit_run` erwartet. Die Vermerke der
 * Nachbereitung reisen nicht mit: sie entstehen erst an der gespeicherten
 * Durchführung. Die Position ist die Stelle in der Liste.
 */
export function runPayload(record: {
  id: string
  unitId: string
  startedAt: string
  endedAt: string
  plannedMinutes: number
  actualSeconds: number
  pausedSeconds: number
  note: string
  steps: {
    kind: string
    phase: string
    name: string
    variantTitle: string | null
    plannedMinutes: number
    actualSeconds: number
    status: string
    exerciseId: string | null
    variantId: string | null
  }[]
}) {
  return {
    id: record.id,
    unitId: record.unitId,
    startedAt: record.startedAt,
    endedAt: record.endedAt,
    plannedMinutes: record.plannedMinutes,
    actualSeconds: record.actualSeconds,
    pausedSeconds: record.pausedSeconds,
    note: record.note,
    steps: record.steps.map((step) => ({
      kind: step.kind,
      phase: step.phase,
      name: step.name,
      variantTitle: step.variantTitle,
      plannedMinutes: step.plannedMinutes,
      actualSeconds: step.actualSeconds,
      status: step.status,
      exerciseId: step.exerciseId,
      variantId: step.variantId,
    })),
  }
}

/**
 * Der Vermerk zählt mit: dasselbe Feld ein zweites Mal ändert ihn nicht, das
 * andere Feld macht aus ihm „beides". Dieselbe Regel führt die Datenbank in
 * `update_exercise_notes`.
 */
export function addAdoptedNote(
  known: AdoptedNote | null | undefined,
  field: AdoptedNoteTarget
): AdoptedNote {
  return !known || known === field ? field : 'both'
}

/** „Arbeitsnotiz", „Anmerkungen" oder „Arbeitsnotiz, Anmerkungen". */
export function adoptedNoteLabel(note: AdoptedNote): string {
  if (note === 'both') return 'Arbeitsnotiz, Anmerkungen'
  return note === 'work' ? 'Arbeitsnotiz' : 'Anmerkungen'
}

function stepRecord(row: StepRow): RunStepRecord {
  return {
    position: row.position,
    kind: row.kind as LiveStepKind,
    phase: row.phase,
    name: row.name,
    variantTitle: row.variant_title,
    plannedMinutes: row.planned_minutes,
    actualSeconds: row.actual_seconds,
    status: row.status === 'done' ? 'done' : 'skipped',
    exerciseId: row.exercise_id,
    variantId: row.variant_id,
    adoptedNote: row.adopted_note as AdoptedNote | null,
    adoptedDuration: row.adopted_duration,
  }
}

/** Eine gespeicherte Durchführung in der Form, die die Zusammenfassung zeigt. */
export function runRecord(row: RunRow, steps: StepRow[], unitName: string): RunRecord {
  return {
    id: row.id,
    unitId: row.unit_id,
    unitName,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    plannedMinutes: row.planned_minutes,
    actualSeconds: row.actual_seconds,
    pausedSeconds: row.paused_seconds,
    note: row.note ?? '',
    steps: [...steps].sort((a, b) => a.position - b.position).map(stepRecord),
  }
}

export type RunFailure = { permanent: boolean; error: string }

/**
 * Übersetzt die Meldung der Datenbank. `permanent` heißt: erneutes Senden hilft
 * nicht — die App bietet dann „Verwerfen" an, statt endlos still weiter zu
 * probieren.
 */
export function saveRunFailure(message: string): RunFailure {
  if (message.includes('unit_not_found')) {
    return {
      permanent: true,
      error: 'Die Einheit gibt es nicht mehr. Die Durchführung lässt sich nicht mehr zuordnen.',
    }
  }
  if (message.includes('run_conflict') || message.includes('invalid_run')) {
    return { permanent: true, error: 'Die Durchführung ist unvollständig oder beschädigt.' }
  }
  if (message.includes('not_authenticated')) {
    return { permanent: false, error: 'Nicht angemeldet.' }
  }
  return { permanent: false, error: 'Speichern fehlgeschlagen. Es wird erneut versucht.' }
}

/** Die Meldungen der beiden Nachbereitungs-Funktionen, in Worten für den Nutzer. */
export function followUpError(message: string): string {
  if (message.includes('exercise_gone')) return 'Diese Übung gibt es nicht mehr.'
  if (message.includes('variant_gone')) {
    return 'Diese Variante gibt es nicht mehr — ihre Dauer lässt sich nicht mehr übernehmen.'
  }
  if (message.includes('step_not_found')) return 'Diese Durchführung gibt es nicht mehr.'
  if (message.includes('step_skipped')) {
    return 'Der Schritt wurde ausgelassen — es gibt keine tatsächliche Dauer.'
  }
  if (message.includes('invalid_note')) return 'Eine Notiz ist länger als 2.000 Zeichen.'
  if (message.includes('invalid_duration')) return 'Die Dauer muss zwischen 1 und 300 Minuten liegen.'
  if (message.includes('not_authenticated')) return 'Nicht angemeldet.'
  return 'Übernehmen fehlgeschlagen, bitte erneut versuchen. Deine Eingabe steht noch da.'
}

export const FOLLOW_UP_STALE =
  'Die Übung wurde inzwischen anderswo geändert, deshalb wurde nichts überschrieben. Dein Text steht noch da — sieh ihn dir an und bestätige noch einmal, wenn er so gelten soll.'
