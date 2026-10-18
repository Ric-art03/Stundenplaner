import type { Page } from '@playwright/test'
import type { SupabaseClient } from '@supabase/supabase-js'
import { FIXTURE_GROUP_NAME } from './fixtures'

/**
 * Testdaten und Helfer für den Live-Modus (PROJ-14).
 *
 * Wie beim Editor wird an **fertig aufgebauten, gespeicherten Einheiten**
 * geprüft, und jedes Browser-Projekt hat seine eigene Gruppe, seine eigene
 * Phase und seine eigenen Übungen. Die Übungen heißen „L14 …" — über den Namen
 * wird aufgeräumt, weil mehrere Tests die Arbeitsnotiz gerade ändern.
 */

type Loose = any

export function tag(project: string): string {
  return /mobil/i.test(project) ? 'Handy' : 'Rechner'
}

function groupName(project: string): string {
  // Beginnt mit dem Namen der Testgruppe — das zentrale Aufräumen erfasst sie mit.
  return `${FIXTURE_GROUP_NAME} Live ${tag(project)}`
}

function prefix(project: string): string {
  return `L14 ${tag(project)}`
}

async function must(
  what: string,
  request: PromiseLike<{ data: unknown; error: { message: string } | null }>
): Promise<Loose> {
  const { data, error } = await request
  if (error || data === null || data === undefined) {
    throw new Error(`${what}: ${error?.message ?? 'keine Daten'}`)
  }
  return data
}

export interface LiveFixtures {
  project: string
  groupId: string
  groupName: string
  /** Eine Phase, die es sonst nirgends gibt — hält die Übungen aus fremden Pools heraus. */
  phase: string
  /** Hütchen 4, Ball 1 je Teilnehmer, Kreis, Musik mit Link, eine Variante. */
  kreis: string
  kreisVariante: string
  /** Bank 2, Hütchen 6, zwei Mannschaften. */
  matte: string
  /** Kein Material, Kreis. */
  ruhe: string
  names: { kreis: string; matte: string; ruhe: string }
}

export const KREIS_NOTE = 'Bälle vorher aufpumpen.'
export const KREIS_DESCRIPTION = 'Die Kinder stehen im Kreis und fangen sich gegenseitig.'
export const VARIANT_TITLE = 'Mit zwei Fängern'
export const VARIANT_DESCRIPTION = 'Zwei Kinder fangen gleichzeitig.'
export const MATTE_DESCRIPTION = 'Zwei Mannschaften ziehen Matten durch die Halle.'
export const MUSIC_LINK = 'https://example.com/ein/langer/pfad/zum/lied?nr=1'

export async function cleanupLive(
  admin: SupabaseClient,
  userId: string,
  project: string
): Promise<void> {
  const { data: groups } = await admin
    .from('groups')
    .select('id')
    .eq('user_id', userId)
    .eq('name', groupName(project))

  for (const group of groups ?? []) {
    await admin.from('units').delete().eq('user_id', userId).eq('group_id', group.id)
  }
  await admin.from('exercises').delete().eq('user_id', userId).like('name', `${prefix(project)}%`)
  await admin.from('groups').delete().eq('user_id', userId).eq('name', groupName(project))
}

interface ExerciseInput {
  name: string
  description?: string
  workNotes?: string | null
  notes?: string | null
  duration?: number
  organizationForms?: string[]
  musicRequired?: boolean
  musicLink?: string | null
  materials?: { name: string; quantity: number; mode: 'insgesamt' | 'pro Teilnehmer' }[]
}

/** Legt eine Übung an, deren Name mit dem Präfix des Projekts beginnt. */
export async function makeExercise(
  admin: SupabaseClient,
  userId: string,
  fx: Pick<LiveFixtures, 'project' | 'phase'>,
  input: ExerciseInput
): Promise<{ id: string; name: string }> {
  const name = `${prefix(fx.project)} ${input.name}`
  const row = await must(
    'Übung anlegen',
    admin
      .from('exercises')
      .insert({
        user_id: userId,
        name,
        description: input.description ?? 'Testübung für den Live-Modus.',
        work_notes: input.workNotes ?? null,
        notes: input.notes ?? null,
        sports: ['Turnen'],
        age_groups: ['Kinder (4–6)'],
        phases: [fx.phase],
        difficulty: 'Mittel',
        organization_forms: input.organizationForms ?? [],
        duration: input.duration ?? 8,
        participants_min: null,
        participants_max: null,
        music_required: input.musicRequired ?? false,
        music_link: input.musicLink ?? null,
      })
      .select('id')
      .single()
  )

  if (input.materials?.length) {
    await must(
      'Material anlegen',
      admin
        .from('exercise_materials')
        .insert(
          input.materials.map((material, index) => ({
            exercise_id: row.id,
            ...material,
            sort_order: index,
          }))
        )
        .select('id')
    )
  }

  return { id: row.id as string, name }
}

export async function makeVariant(
  admin: SupabaseClient,
  exerciseId: string,
  title: string,
  description: string
): Promise<string> {
  const row = await must(
    'Variante anlegen',
    admin
      .from('exercise_variants')
      .insert({ exercise_id: exerciseId, title, description, sort_order: 0 })
      .select('id')
      .single()
  )
  return row.id as string
}

export async function seedLive(
  admin: SupabaseClient,
  userId: string,
  project: string
): Promise<LiveFixtures> {
  await cleanupLive(admin, userId, project)

  const group = await must(
    'Gruppe anlegen',
    admin
      .from('groups')
      .insert({
        user_id: userId,
        name: groupName(project),
        sports: ['Turnen'],
        age_groups: ['Kinder (4–6)'],
        participants: 12,
        unit_duration: 60,
        venue_id: null,
      })
      .select('id')
      .single()
  )

  const base = { project, phase: `E2E-Livephase ${tag(project)}` }

  const kreis = await makeExercise(admin, userId, base, {
    name: 'Kreisfangen',
    description: KREIS_DESCRIPTION,
    workNotes: KREIS_NOTE,
    organizationForms: ['Kreis'],
    musicRequired: true,
    musicLink: MUSIC_LINK,
    materials: [
      { name: 'Hütchen', quantity: 4, mode: 'insgesamt' },
      { name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' },
    ],
  })
  const kreisVariante = await makeVariant(admin, kreis.id, VARIANT_TITLE, VARIANT_DESCRIPTION)

  const matte = await makeExercise(admin, userId, base, {
    name: 'Mattenrutschen',
    description: MATTE_DESCRIPTION,
    organizationForms: ['Zwei Mannschaften (gemeinsames Spielfeld)'],
    materials: [
      { name: 'Bank', quantity: 2, mode: 'insgesamt' },
      { name: 'Hütchen', quantity: 6, mode: 'insgesamt' },
    ],
  })

  const ruhe = await makeExercise(admin, userId, base, {
    name: 'Ruhekreis',
    organizationForms: ['Kreis'],
  })

  return {
    project,
    groupId: group.id as string,
    groupName: groupName(project),
    phase: base.phase,
    kreis: kreis.id,
    kreisVariante,
    matte: matte.id,
    ruhe: ruhe.id,
    names: { kreis: kreis.name, matte: matte.name, ruhe: ruhe.name },
  }
}

// ---- Die Stundenakte im Browser ----

const AKTE = 'stundenplaner:live:akte'
const WARTELISTE = 'stundenplaner:live:warteliste'
const GEAENDERT = 'stundenplaner:live:geaendert'

export async function akte(page: Page): Promise<Loose | null> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? 'null'), AKTE)
}

export async function warteliste(page: Page): Promise<Loose[]> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '[]'), WARTELISTE)
}

/**
 * Lässt Zeit vergehen, ohne zu warten: alle festgehaltenen Zeitpunkte rücken
 * um `ms` zurück. Für die App ist das dasselbe wie ein gesperrtes Handy — sie
 * rechnet beim nächsten Hinsehen aus den Zeitpunkten neu.
 */
export async function elapse(page: Page, ms: number): Promise<void> {
  await page.evaluate(
    ({ key, event, ms }) => {
      const session = JSON.parse(localStorage.getItem(key) ?? 'null')
      if (!session) throw new Error('Keine Stundenakte auf dem Gerät')
      for (const field of ['startedAt', 'enteredAt', 'pausedAt']) {
        if (session.run[field] !== null) session.run[field] -= ms
      }
      localStorage.setItem(key, JSON.stringify(session))
      window.dispatchEvent(new Event(event))
    },
    { key: AKTE, event: GEAENDERT, ms }
  )
}

/** Ändert die Akte von Hand — etwa um ein fremdes Konto nachzustellen. */
export async function patchAkte(page: Page, patch: Record<string, unknown>): Promise<void> {
  await page.evaluate(
    ({ key, event, patch }) => {
      const session = JSON.parse(localStorage.getItem(key) ?? 'null')
      localStorage.setItem(key, JSON.stringify({ ...session, ...patch }))
      window.dispatchEvent(new Event(event))
    },
    { key: AKTE, event: GEAENDERT, patch }
  )
}

export const MIN = 60_000
