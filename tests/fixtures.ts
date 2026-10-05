import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Testdaten für die E2E-Tests.
 *
 * Angelegt wird über den Dienstschlüssel statt durch die Oberfläche: Den
 * Übungs-Wizard für jede Vorbedingung durchzuklicken macht Tests langsam und
 * lässt sie an Stellen scheitern, die sie gar nicht prüfen wollen. Geprüft
 * wird durch die Oberfläche, aufgebaut wird daneben.
 *
 * Alles hängt am Testkonto, nie an den echten Daten des Entwicklers.
 */

const MARKER = 'E2E-Testdaten (PROJ-6)'

/** Eigenes Konto, damit Tests nie die echten Daten des Entwicklers anfassen. */
export const TEST_EMAIL = 'humpert263+test1@gmail.com'

/** Ablage des Sitzungszustands aus der Anmeldung. */
export const STORAGE_STATE = path.join(__dirname, '.auth', 'user.json')

export function env(name: string): string {
  const file = readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const match = file.match(new RegExp(`^${name}=(.+)$`, 'm'))
  if (!match) throw new Error(`${name} fehlt in .env.local`)
  return match[1].trim()
}

export function adminClient(): SupabaseClient {
  return createClient(env('NEXT_PUBLIC_SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  })
}

export async function testUserId(admin: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await admin.auth.admin.listUsers()
  if (error) throw new Error(error.message)
  const user = data.users.find((u) => u.email === email)
  if (!user) throw new Error(`Testnutzer ${email} existiert nicht`)
  return user.id
}

export interface Fixtures {
  groupId: string
  groupName: string
}

/**
 * Eine Gruppe ohne Halle (damit das Material-Kriterium entfällt) und je zwei
 * Übungen pro Phase — genug, damit der Generator alle drei Segmente einer
 * Standard-Einheit lückenlos füllen kann.
 */
export async function seed(admin: SupabaseClient, userId: string): Promise<Fixtures> {
  await cleanup(admin, userId)

  const groupName = `E2E Testgruppe ${Date.now()}`
  const { data: group, error: groupError } = await admin
    .from('groups')
    .insert({
      user_id: userId,
      name: groupName,
      sports: ['Turnen', 'Tanzen'],
      age_groups: ['Kinder (4–6)'],
      participants: 12,
      unit_duration: 60,
      venue_id: null,
    })
    .select('id')
    .single()

  if (groupError || !group) throw new Error(`Gruppe anlegen: ${groupError?.message}`)

  const phases: [string, number][] = [
    ['Aufwärmen', 12],
    ['Hauptteil', 18],
    ['Cool-Down', 12],
  ]

  const exercises = phases.flatMap(([phase, duration]) =>
    ['Turnen', 'Tanzen'].map((sport) => ({
      user_id: userId,
      name: `E2E ${phase} ${sport}`,
      description: `Testübung für ${phase}.`,
      work_notes: MARKER,
      sports: [sport],
      age_groups: ['Kinder (4–6)'],
      phases: [phase],
      difficulty: 'Mittel',
      organization_forms: ['Freie Verteilung (ganze Halle)'],
      duration,
      participants_min: null,
      participants_max: null,
      music_required: false,
    }))
  )

  const { error: exerciseError } = await admin.from('exercises').insert(exercises)
  if (exerciseError) throw new Error(`Übungen anlegen: ${exerciseError.message}`)

  return { groupId: group.id, groupName }
}

/** Entfernt alles, was `seed` angelegt hat — auch nach einem Abbruch. */
export async function cleanup(admin: SupabaseClient, userId: string): Promise<void> {
  // Einheiten zuerst: Sie verweisen auf Gruppe und Übungen.
  await admin.from('units').delete().eq('user_id', userId)
  await admin.from('exercises').delete().eq('user_id', userId).eq('work_notes', MARKER)
  await admin.from('groups').delete().eq('user_id', userId).like('name', 'E2E Testgruppe%')
}
