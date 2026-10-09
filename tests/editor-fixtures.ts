import type { SupabaseClient } from '@supabase/supabase-js'
import { FIXTURE_GROUP_NAME } from './fixtures'

/**
 * Testdaten für den Einheiten-Editor (PROJ-7).
 *
 * Der Editor wird an **fertig aufgebauten Einheiten** geprüft, nicht an
 * frisch generierten: so steht in jedem Test genau der Plan da, den er
 * braucht, und der Generator — der Entwürfe kontoweit ersetzt — kommt den
 * nebenläufig laufenden PROJ-6-Tests nicht in die Quere.
 *
 * Drei Dinge halten die Tests voneinander fern, obwohl sie sich ein Testkonto
 * teilen:
 *   - eine **eigene Gruppe** je Browser-Projekt,
 *   - **eigene Phasen** je Browser-Projekt, die es sonst nirgends gibt — die
 *     Übungen hier landen dadurch weder im Pool der PROJ-6-Tests noch in dem
 *     des jeweils anderen Projekts,
 *   - eine **eigene Einheit je Test**.
 */

/** Markierung an den Übungen. Zugleich ihre Arbeitsnotiz — sie wird in der Stunde angezeigt. */
export const EDITOR_MARKER = 'E2E-Testdaten (PROJ-7)'

/**
 * Kurzname des Browser-Projekts für Namen und Phasen. Bewusst zwei Wörter, von
 * denen keines im anderen steckt: „editor" ist ein Teil von „editor mobil",
 * und ein Textgriff nach dem einen träfe sonst auch das andere.
 */
function tag(project: string): string {
  return /mobil/i.test(project) ? 'Handy' : 'Rechner'
}

export interface EditorFixtures {
  groupId: string
  /**
   * Die Phase, deren Übungen im Segment passen. Je Projekt eine eigene: die
   * Kandidatenliste des Editors enthält **alle** Übungen des Kontos, und bei
   * gemeinsamer Phase würfelte ein Projekt die Übungen des anderen.
   */
  phase: string
  /** Eine zweite Phase — ihre Übungen sind im Segment „unpassend: Phase". */
  otherPhase: string
  /** Kennungen der Übungen nach Kurzname. */
  exercises: Record<'alpha' | 'beta' | 'gamma' | 'delta' | 'schwer', string>
  /** Namen der Übungen, wie sie auf der Seite stehen. */
  names: Record<'alpha' | 'beta' | 'gamma' | 'delta' | 'schwer', string>
  variants: { ball: string; zuZweit: string }
}

function marker(project: string): string {
  return `${EDITOR_MARKER} ${project}`
}

function groupName(project: string): string {
  // Beginnt mit dem Namen der Testgruppe — das zentrale Aufräumen erfasst sie mit.
  return `${FIXTURE_GROUP_NAME} Editor ${project}`
}

/**
 * Führt eine Abfrage aus und wirft, wenn sie scheitert oder nichts liefert.
 * Der Dienst-Client ist nicht typisiert — die Zeilen kommen deshalb lose heraus.
 */
type Loose = any

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

/** Räumt alles weg, was `seedEditor` für dieses Projekt angelegt hat. */
export async function cleanupEditor(
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
  await admin.from('exercises').delete().eq('user_id', userId).like('work_notes', `${marker(project)}%`)
  await admin.from('groups').delete().eq('user_id', userId).eq('name', groupName(project))
}

/**
 * Eine Gruppe ohne Halle und fünf Übungen:
 *
 *   - Alpha, Beta, Gamma — passen in die Editorphase. Alpha trägt Material,
 *     eine Organisationsform und zwei Varianten.
 *   - Delta — gehört zur Nebenphase, ist im Segment also „unpassend: Phase".
 *   - Schwer — Editorphase, aber Schwierigkeit „Schwer": „unpassend: Schwierigkeit".
 */
export async function seedEditor(
  admin: SupabaseClient,
  userId: string,
  project: string
): Promise<EditorFixtures> {
  await cleanupEditor(admin, userId, project)

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

  const suffix = tag(project)
  const phase = `E2E-Editorphase ${suffix}`
  const otherPhase = `E2E-Nebenphase ${suffix}`
  const names = {
    alpha: `E7 Alpha ${suffix}`,
    beta: `E7 Beta ${suffix}`,
    gamma: `E7 Gamma ${suffix}`,
    delta: `E7 Delta ${suffix}`,
    schwer: `E7 Schwer ${suffix}`,
  }

  const base = {
    user_id: userId,
    description: 'Testübung für den Editor.',
    work_notes: marker(project),
    sports: ['Turnen'],
    age_groups: ['Kinder (4–6)'],
    difficulty: 'Mittel',
    organization_forms: [] as string[],
    duration: 5,
    participants_min: null,
    participants_max: null,
    music_required: false,
  }

  const rows = await must(
    'Übungen anlegen',
    admin
      .from('exercises')
      .insert([
        { ...base, name: names.alpha, phases: [phase], organization_forms: ['Kleingruppen'] },
        { ...base, name: names.beta, phases: [phase] },
        { ...base, name: names.gamma, phases: [phase] },
        { ...base, name: names.delta, phases: [otherPhase] },
        { ...base, name: names.schwer, phases: [phase], difficulty: 'Schwer' },
      ])
      .select('id, name')
  )

  const idOf = (name: string) => {
    const row = rows.find((entry: { name: string }) => entry.name === name)
    if (!row) throw new Error(`Übung ${name} fehlt nach dem Anlegen`)
    return row.id as string
  }

  const exercises = {
    alpha: idOf(names.alpha),
    beta: idOf(names.beta),
    gamma: idOf(names.gamma),
    delta: idOf(names.delta),
    schwer: idOf(names.schwer),
  }

  await must(
    'Material anlegen',
    admin
      .from('exercise_materials')
      .insert({ exercise_id: exercises.alpha, name: 'Hütchen', quantity: 4, mode: 'insgesamt' })
      .select('id')
  )

  const variantRows = await must(
    'Varianten anlegen',
    admin
      .from('exercise_variants')
      .insert([
        {
          exercise_id: exercises.alpha,
          title: 'Mit Ball',
          description: 'Wie die Grundübung, mit Ball.',
          materials: [{ name: 'Bälle', quantity: 6, mode: 'insgesamt' }],
          sort_order: 0,
        },
        {
          exercise_id: exercises.alpha,
          title: 'Zu zweit',
          description: 'Wie die Grundübung, in Paaren.',
          organization_forms: ['Zu zweit / Paare'],
          sort_order: 1,
        },
      ])
      .select('id, title')
  )

  const variantId = (title: string) => {
    const row = variantRows.find((entry: { title: string }) => entry.title === title)
    if (!row) throw new Error(`Variante ${title} fehlt nach dem Anlegen`)
    return row.id as string
  }

  return {
    groupId: group.id as string,
    phase,
    otherPhase,
    exercises,
    names,
    variants: { ball: variantId('Mit Ball'), zuZweit: variantId('Zu zweit') },
  }
}

export interface SegmentLayout {
  /** Vorgabe: die Phase der mitgegebenen Testdaten. */
  name?: string
  minutes: number
  fillMode?: 'generate' | 'empty'
  plannedGapMinutes?: number
  organizationForms?: string[]
  notes?: string
  items: { exerciseId: string; variantId?: string; minutes: number }[]
}

export interface BuiltUnit {
  id: string
  name: string
  segmentIds: string[]
}

let counter = 0

/**
 * Baut eine Einheit mit genau dem gewünschten Plan. Gespeichert, sofern nicht
 * anders verlangt: gespeicherte Einheiten lässt der Generator der
 * nebenläufigen PROJ-6-Tests in Ruhe, Entwürfe ersetzt er kontoweit.
 */
export async function buildUnit(
  admin: SupabaseClient,
  userId: string,
  fixtures: Pick<EditorFixtures, 'groupId' | 'phase'>,
  segments: SegmentLayout[],
  options: { saved?: boolean } = {}
): Promise<BuiltUnit> {
  counter += 1
  const name = `E7 Einheit ${Date.now()}-${counter}`

  const unit = await must(
    'Einheit anlegen',
    admin
      .from('units')
      .insert({
        user_id: userId,
        group_id: fixtures.groupId,
        name,
        total_minutes: segments.reduce((sum, segment) => sum + segment.minutes, 0),
        seed: 1,
        saved: options.saved ?? true,
        editor_state: { mode: 'custom', expandedPosition: null },
      })
      .select('id')
      .single()
  )

  const segmentIds: string[] = []

  for (const [position, segment] of segments.entries()) {
    const row = await must(
      'Segment anlegen',
      admin
        .from('unit_segments')
        .insert({
          unit_id: unit.id,
          name: segment.name ?? fixtures.phase,
          minutes: segment.minutes,
          fill_mode: segment.fillMode ?? 'generate',
          sports: ['Turnen'],
          primary_sport: null,
          difficulties: ['Mittel'],
          organization_forms: segment.organizationForms ?? [],
          planned_gap_minutes: segment.plannedGapMinutes ?? 0,
          notes: segment.notes ?? null,
          position,
        })
        .select('id')
        .single()
    )
    segmentIds.push(row.id as string)

    if (segment.items.length > 0) {
      await must(
        'Einträge anlegen',
        admin
          .from('unit_items')
          .insert(
            segment.items.map((item, index) => ({
              segment_id: row.id,
              exercise_id: item.exerciseId,
              variant_id: item.variantId ?? null,
              planned_duration: item.minutes,
              position: index,
            }))
          )
          .select('id')
      )
    }
  }

  return { id: unit.id as string, name, segmentIds }
}
