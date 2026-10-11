'use server'

import { createClient } from '@/lib/supabase/server'
import { getUnit } from '@/lib/actions/units'
import { getGroup } from '@/lib/actions/groups'
import { buildLivePlan } from '@/lib/live/steps'
import type { SaveRunResult } from '@/lib/live/store'
import type { AdoptedNoteTarget, LivePlan, RunRecord } from '@/lib/live/types'

/**
 * Die Server-Stellen des Live-Modus (PROJ-14).
 *
 * Der Live-Bildschirm selbst spricht nach dem Start nicht mit dem Server. Was
 * hier steht, ist der Rand: einmal alles für die Stunde holen, am Ende die
 * Durchführung ablegen, und die Nachbereitung.
 *
 * **Stand `/frontend`:** nur `loadLivePlan` ist angeschlossen — sie liest über
 * die vorhandenen Wege. Alles, was neue Tabellen braucht, ist als Vertrag
 * angelegt und meldet „noch nicht angeschlossen“; `/backend` füllt es.
 */

const NOT_CONNECTED = 'Das Speichern von Durchführungen wird mit dem nächsten Schritt angeschlossen.'

export type LoadLivePlanResult =
  | { ok: true; userId: string; plan: LivePlan }
  | { ok: false; error: string }

/** Holt einmal alles, was die Stunde braucht. Danach arbeitet das Gerät allein. */
export async function loadLivePlan(unitId: string): Promise<LoadLivePlanResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Nicht angemeldet.' }

  const unit = await getUnit(unitId)
  if (!unit) return { ok: false, error: 'Die Einheit wurde nicht gefunden.' }
  // Ein Entwurf kann vom nächsten Generatorlauf ersetzt werden, während die
  // Stunde läuft — gestartet wird nur, was gespeichert ist.
  if (!unit.saved) return { ok: false, error: 'Speichere die Einheit, bevor du sie startest.' }

  const group = await getGroup(unit.groupId)
  const plan = buildLivePlan(unit, {
    venueName: group?.venue?.name ?? null,
    participants: group?.participants ?? null,
  })

  if (plan.steps.length === 0) {
    return { ok: false, error: 'Diese Einheit hat keinen Schritt, der sich durchführen ließe.' }
  }

  return { ok: true, userId: user.id, plan }
}

/** Legt eine Durchführung ab — in einem Zug, und dieselbe Kennung nie zweimal. */
export async function saveRun(record: RunRecord): Promise<SaveRunResult> {
  void record
  return { ok: false, permanent: false, error: NOT_CONNECTED }
}

export async function getRunsForUnit(unitId: string): Promise<RunRecord[]> {
  void unitId
  return []
}

export type LiveActionResult = { ok: true } | { ok: false; error: string }

export async function updateRunNote(runId: string, note: string): Promise<LiveActionResult> {
  void runId
  void note
  return { ok: false, error: NOT_CONNECTED }
}

export async function deleteRun(runId: string): Promise<LiveActionResult> {
  void runId
  return { ok: false, error: NOT_CONNECTED }
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

export interface FollowUpTarget {
  runId: string
  position: number
  exerciseId: string
  variantId: string | null
}

export async function getFollowUpExercise(
  target: FollowUpTarget
): Promise<FollowUpExercise | null> {
  void target
  return null
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
  void target
  void field
  void text
  void updatedAt
  return { ok: false, error: NOT_CONNECTED }
}

export async function adoptExerciseDuration(
  target: FollowUpTarget,
  minutes: number,
  updatedAt: string
): Promise<LiveActionResult> {
  void target
  void minutes
  void updatedAt
  return { ok: false, error: NOT_CONNECTED }
}
