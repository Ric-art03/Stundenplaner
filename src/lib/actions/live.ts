'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import { getUnit } from '@/lib/actions/units'
import { getGroup } from '@/lib/actions/groups'
import {
  FOLLOW_UP_STALE,
  followUpError,
  runPayload,
  runRecord,
  saveRunFailure,
} from '@/lib/live/records'
import { buildLivePlan, coverImagePath, enrichLivePlan } from '@/lib/live/steps'
import type { SaveRunResult } from '@/lib/live/store'
import type { AdoptedNoteTarget, LivePlan, RunRecord } from '@/lib/live/types'
import {
  adoptDurationSchema,
  appendNoteSchema,
  followUpTargetSchema,
  runNoteSchema,
  runRecordSchema,
} from '@/lib/validations/live'

/**
 * Die Server-Stellen des Live-Modus (PROJ-14).
 *
 * Der Live-Bildschirm selbst spricht nach dem Start nicht mit dem Server. Was
 * hier steht, ist der Rand: einmal alles für die Stunde holen, am Ende die
 * Durchführung ablegen, und die Nachbereitung.
 *
 * Alles prüft die Anmeldung. Die Eigentumsprüfung liegt zusätzlich in der
 * Datenbank — in den Richtlinien der beiden Tabellen und in den drei
 * Funktionen `save_unit_run`, `append_exercise_note`, `adopt_exercise_duration`.
 */

type StepRow = Database['public']['Tables']['unit_run_steps']['Row']
type RunRow = Database['public']['Tables']['unit_runs']['Row']

/** So viele Durchführungen zeigt die Liste an der Einheit höchstens. */
const RUN_LIST_LIMIT = 50

async function getAuthUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

export type LoadLivePlanResult =
  | { ok: true; userId: string; plan: LivePlan }
  | { ok: false; error: string }

/** Holt einmal alles, was die Stunde braucht. Danach arbeitet das Gerät allein. */
export async function loadLivePlan(unitId: string): Promise<LoadLivePlanResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const unit = await getUnit(unitId)
  if (!unit) return { ok: false, error: 'Die Einheit wurde nicht gefunden.' }
  // Ein Entwurf kann vom nächsten Generatorlauf ersetzt werden, während die
  // Stunde läuft — gestartet wird nur, was gespeichert ist.
  if (!unit.saved) return { ok: false, error: 'Speichere die Einheit, bevor du sie startest.' }

  const items = unit.segments.flatMap((segment) => segment.items)
  const exerciseIds = unique(
    items.map((item) => item.exerciseId).filter((id): id is string => id !== null)
  )
  const variantIds = unique(
    items.map((item) => item.variantId).filter((id): id is string => id !== null)
  )

  // `getUnit` dient der Leseansicht und bringt zweierlei nicht mit, was die
  // Halle braucht: die Beschreibung der **Variante** und das Titelbild.
  const [group, variantRes, imageRes] = await Promise.all([
    getGroup(unit.groupId),
    variantIds.length > 0
      ? supabase.from('exercise_variants').select('id, description').in('id', variantIds)
      : Promise.resolve({ data: [] }),
    exerciseIds.length > 0
      ? supabase
          .from('exercises')
          .select('id, images')
          .eq('user_id', user.id)
          .in('id', exerciseIds)
      : Promise.resolve({ data: [] }),
  ])

  const variantDescriptions = new Map(
    ((variantRes.data ?? []) as { id: string; description: string }[]).map((row) => [
      row.id,
      row.description,
    ])
  )
  const coverImages = new Map<string, string>()
  for (const row of (imageRes.data ?? []) as { id: string; images: Json | null }[]) {
    const path = coverImagePath(row.images)
    if (path) coverImages.set(row.id, path)
  }

  const plan = enrichLivePlan(
    buildLivePlan(unit, {
      venueName: group?.venue?.name ?? null,
      participants: group?.participants ?? null,
    }),
    { variantDescriptions, coverImages }
  )

  if (plan.steps.length === 0) {
    return { ok: false, error: 'Diese Einheit hat keinen Schritt, der sich durchführen ließe.' }
  }

  return { ok: true, userId: user.id, plan }
}

/**
 * Legt eine Durchführung ab — in einem Zug, und dieselbe Kennung nie zweimal:
 * kommt sie erneut an, antwortet die Datenbank wieder mit „ok" und legt nichts
 * doppelt an.
 */
export async function saveRun(record: RunRecord): Promise<SaveRunResult> {
  const { supabase, user } = await getAuthUser()
  // Nicht endgültig: nach erneuter Anmeldung wird nachgereicht.
  if (!user) return { ok: false, permanent: false, error: 'Nicht angemeldet.' }

  const parsed = runRecordSchema.safeParse(record)
  if (!parsed.success) {
    return {
      ok: false,
      permanent: true,
      error: 'Die Durchführung ist unvollständig oder beschädigt.',
    }
  }

  const { data, error } = await supabase.rpc('save_unit_run', {
    p_run: runPayload(parsed.data) as unknown as Json,
  })

  if (error) return { ok: false, ...saveRunFailure(error.message) }
  if (data !== 'ok') return { ok: false, ...saveRunFailure('') }
  return { ok: true }
}

/** Die Durchführungen einer Einheit, neueste zuerst. */
export async function getRunsForUnit(unitId: string): Promise<RunRecord[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const [unitRes, runRes] = await Promise.all([
    supabase.from('units').select('name').eq('id', unitId).eq('user_id', user.id).maybeSingle(),
    supabase
      .from('unit_runs')
      .select('*')
      .eq('unit_id', unitId)
      .eq('user_id', user.id)
      .order('started_at', { ascending: false })
      .limit(RUN_LIST_LIMIT),
  ])

  const runs = (runRes.data ?? []) as RunRow[]
  const unitName = unitRes.data?.name
  if (unitName === undefined || runs.length === 0) return []

  const { data: stepRows } = await supabase
    .from('unit_run_steps')
    .select('*')
    .in(
      'run_id',
      runs.map((run) => run.id)
    )
    .order('position')

  const stepsByRun = new Map<string, StepRow[]>()
  for (const step of (stepRows ?? []) as StepRow[]) {
    const list = stepsByRun.get(step.run_id) ?? []
    list.push(step)
    stepsByRun.set(step.run_id, list)
  }

  return runs.map((run) => runRecord(run, stepsByRun.get(run.id) ?? [], unitName))
}

export type LiveActionResult =
  | { ok: true }
  /** `stale` = die Übung wurde inzwischen geändert; nichts wurde überschrieben. */
  | { ok: false; error: string; stale?: boolean }

/** Ändert die Notiz „Wie lief's?" an einer gespeicherten Durchführung. */
export async function updateRunNote(runId: string, note: string): Promise<LiveActionResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const parsed = runNoteSchema.safeParse(note)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Notiz.' }
  }

  // Eine geleerte Notiz verschwindet, statt als leerer Text stehen zu bleiben.
  const { data, error } = await supabase
    .from('unit_runs')
    .update({ note: parsed.data.trim() || null })
    .eq('id', runId)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { ok: false, error: 'Die Notiz konnte nicht gespeichert werden.' }
  // Ein Update, das keine Zeile trifft, ist kein Erfolg (vgl. BUG-16).
  if (!data || data.length === 0) {
    return { ok: false, error: 'Diese Durchführung gibt es nicht mehr.' }
  }
  return { ok: true }
}

export async function deleteRun(runId: string): Promise<LiveActionResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const { data, error } = await supabase
    .from('unit_runs')
    .delete()
    .eq('id', runId)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { ok: false, error: 'Die Durchführung konnte nicht gelöscht werden.' }
  if (!data || data.length === 0) {
    return { ok: false, error: 'Diese Durchführung gibt es nicht mehr.' }
  }
  return { ok: true }
}

/** Der heutige Stand einer Übung, soweit die Nachbereitung ihn braucht. */
export interface FollowUpExercise {
  workNotes: string
  notes: string
  /** Die geschätzte Dauer — bei einer Variante deren eigene, sonst die der Übung. */
  duration: number
  /** Der Änderungsstempel; damit erkennt der Server, ob dazwischen geändert wurde. */
  updatedAt: string
  /** In wie vielen **anderen** gespeicherten Einheiten die Übung steht. */
  otherUnitCount: number
}

/**
 * Welcher Schritt gemeint ist. Welche Übung dahinter steht, liest der Server
 * am Schritt selbst — `exerciseId` und `variantId` reisen nur mit, damit die
 * Oberfläche sie nicht zweimal vorhalten muss.
 */
export interface FollowUpTarget {
  runId: string
  position: number
  exerciseId: string
  variantId: string | null
}

/**
 * Lädt den **heutigen** Stand der Übung hinter einem Schritt — nicht den vom
 * Start der Stunde. Die Vorschau der Nachbereitung zeigt damit, was wirklich
 * entsteht.
 */
export async function getFollowUpExercise(
  target: FollowUpTarget
): Promise<FollowUpExercise | null> {
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const parsed = followUpTargetSchema.safeParse(target)
  if (!parsed.success) return null

  // Die Richtlinie lässt nur Schritte eigener Durchführungen durch.
  const { data: step } = await supabase
    .from('unit_run_steps')
    .select('exercise_id, variant_id, run_id')
    .eq('run_id', parsed.data.runId)
    .eq('position', parsed.data.position)
    .maybeSingle()

  if (!step?.exercise_id) return null

  const [exerciseRes, variantRes, runRes, itemRes] = await Promise.all([
    supabase
      .from('exercises')
      .select('work_notes, notes, duration, updated_at')
      .eq('id', step.exercise_id)
      .eq('user_id', user.id)
      .maybeSingle(),
    step.variant_id
      ? supabase
          .from('exercise_variants')
          .select('duration')
          .eq('id', step.variant_id)
          .eq('exercise_id', step.exercise_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from('unit_runs').select('unit_id').eq('id', step.run_id).maybeSingle(),
    supabase.from('unit_items').select('segment_id').eq('exercise_id', step.exercise_id),
  ])

  const exercise = exerciseRes.data
  if (!exercise) return null

  // In wie vielen anderen gespeicherten Einheiten steht die Übung? Entwürfe
  // zählen nicht, die Einheit dieser Durchführung auch nicht.
  let otherUnitCount = 0
  const segmentIds = unique(
    ((itemRes.data ?? []) as { segment_id: string }[]).map((row) => row.segment_id)
  )
  if (segmentIds.length > 0) {
    const { data: segmentRows } = await supabase
      .from('unit_segments')
      .select('unit_id')
      .in('id', segmentIds)
    const unitIds = unique(
      ((segmentRows ?? []) as { unit_id: string }[]).map((row) => row.unit_id)
    ).filter((id) => id !== runRes.data?.unit_id)

    if (unitIds.length > 0) {
      const { count } = await supabase
        .from('units')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('saved', true)
        .in('id', unitIds)
      otherUnitCount = count ?? 0
    }
  }

  return {
    workNotes: exercise.work_notes ?? '',
    notes: exercise.notes ?? '',
    // Eine Variante ohne eigene Dauer läuft mit der der Übung.
    duration: variantRes.data?.duration ?? exercise.duration,
    updatedAt: exercise.updated_at,
    otherUnitCount,
  }
}

/**
 * Setzt den Text eines der beiden Notizfelder der Übung — und im selben Zug
 * den Vermerk am Schritt. Wurde die Übung seit `updatedAt` geändert, wird
 * nicht überschrieben.
 */
export async function appendExerciseNote(
  target: FollowUpTarget,
  field: AdoptedNoteTarget,
  text: string,
  updatedAt: string
): Promise<LiveActionResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const parsedTarget = followUpTargetSchema.safeParse(target)
  const parsed = appendNoteSchema.safeParse({ field, text, updatedAt })
  if (!parsedTarget.success) return { ok: false, error: 'Ungültige Anfrage.' }
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Notiz.' }
  }

  const { data, error } = await supabase.rpc('append_exercise_note', {
    p_run_id: parsedTarget.data.runId,
    p_position: parsedTarget.data.position,
    p_field: parsed.data.field,
    p_text: parsed.data.text,
    p_expected_updated_at: parsed.data.updatedAt,
  })

  if (error) return { ok: false, error: followUpError(error.message) }
  if (data === 'stale') return { ok: false, error: FOLLOW_UP_STALE, stale: true }
  if (data !== 'ok') return { ok: false, error: followUpError('') }
  return { ok: true }
}

/**
 * Übernimmt die tatsächliche Dauer als neue geschätzte Dauer — der Variante,
 * wenn der Schritt als Variante lief, sonst der Übung. Bestehende Einheiten
 * behalten ihre Plandauer.
 */
export async function adoptExerciseDuration(
  target: FollowUpTarget,
  minutes: number,
  updatedAt: string
): Promise<LiveActionResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const parsedTarget = followUpTargetSchema.safeParse(target)
  const parsed = adoptDurationSchema.safeParse({ minutes, updatedAt })
  if (!parsedTarget.success) return { ok: false, error: 'Ungültige Anfrage.' }
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Dauer.' }
  }

  const { data, error } = await supabase.rpc('adopt_exercise_duration', {
    p_run_id: parsedTarget.data.runId,
    p_position: parsedTarget.data.position,
    p_minutes: parsed.data.minutes,
    p_expected_updated_at: parsed.data.updatedAt,
  })

  if (error) return { ok: false, error: followUpError(error.message) }
  if (data === 'stale') return { ok: false, error: FOLLOW_UP_STALE, stale: true }
  if (data !== 'ok') return { ok: false, error: followUpError('') }
  return { ok: true }
}
