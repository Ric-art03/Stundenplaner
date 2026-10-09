'use server'

import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import {
  savePlanOptionsSchema,
  unitConfigSchema,
  unitDraftSchema,
} from '@/lib/validations/unit'
import { quickCreateSchema } from '@/lib/validations/exercise'
import { PHASES } from '@/lib/types/exercise'
import type {
  DifficultyLevel,
  ExerciseMaterial,
  ExerciseVariant,
} from '@/lib/types/exercise'
import type {
  EditorState,
  Unit,
  UnitConfig,
  UnitMode,
  UnitItem,
  UnitSegment,
  UnitSummary,
  SegmentConfig,
  SegmentFillMode,
} from '@/lib/types/unit'
import {
  buildCandidates,
  candidateKey,
  type Candidate,
} from '@/lib/units/candidates'
import {
  generateUnitPlan,
  planSegment,
  type GeneratedUnit,
  type GapDetail,
  type GeneratorGroup,
} from '@/lib/units/generator'
import {
  buildEditorPool,
  type EditorCandidate,
  type EditorSource,
} from '@/lib/units/editor-pool'
import type { UnitDraft } from '@/lib/units/draft'
import type {
  QuickCreateInput,
  QuickCreateResult,
} from '@/components/units/quick-create-exercise-form'
import { getGroup } from './groups'

type SupabaseClient = Awaited<ReturnType<typeof createClient>>
type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type MaterialRow = Database['public']['Tables']['exercise_materials']['Row']
type VariantRow = Database['public']['Tables']['exercise_variants']['Row']
type UnitRow = Database['public']['Tables']['units']['Row']
type SegmentRow = Database['public']['Tables']['unit_segments']['Row']
type ItemRow = Database['public']['Tables']['unit_items']['Row']

const GENERIC_ERROR = 'Generieren fehlgeschlagen, bitte erneut versuchen.'
const UNIT_GONE =
  'Diese Einheit existiert nicht mehr. Sie wurde inzwischen gelöscht oder durch einen neuen Vorschlag ersetzt.'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values))
}

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const k = String(item[key])
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}

// ---- Kandidatenpool ----

function mapMaterial(row: MaterialRow): ExerciseMaterial {
  return { id: row.id, name: row.name, quantity: row.quantity, mode: row.mode as ExerciseMaterial['mode'] }
}

function mapVariant(row: VariantRow): ExerciseVariant {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    materials: (row.materials as unknown as ExerciseVariant['materials']) ?? [],
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
    duration: row.duration,
    ageGroups: (row.age_groups as string[]) ?? [],
    organizationForms: (row.organization_forms as string[]) ?? [],
  }
}

/**
 * Lädt alle Übungen des Nutzers mit Material und Varianten. Bewusst
 * serverseitig: der gesamte Pool darf nicht in den Browser wandern — das wäre
 * langsam und gäbe Daten unnötig heraus.
 *
 * Ohne `strict` wird ein Lesefehler zu einer leeren Liste — der Generator
 * meldet dann eine Lücke. Der Editor braucht den Unterschied: ein Lesefehler
 * darf im Auswahldialog nicht wie „du hast noch keine Übungen" aussehen.
 */
async function loadCandidateSources(
  supabase: SupabaseClient,
  userId: string,
  exerciseIds?: string[],
  options: { strict?: boolean } = {}
): Promise<EditorSource[]> {
  let query = supabase
    .from('exercises')
    .select(
      'id, name, phases, sports, difficulty, age_groups, organization_forms, duration, participants_min, participants_max, music_required, music_link, needs_completion'
    )
    .eq('user_id', userId)

  if (exerciseIds) {
    if (exerciseIds.length === 0) return []
    query = query.in('id', exerciseIds)
  }

  const { data, error } = await query
  if (error || !data) {
    if (options.strict) throw new Error('exercises')
    return []
  }

  const rows = data as unknown as ExerciseRow[]
  if (rows.length === 0) return []

  const ids = rows.map((row) => row.id)
  const [materialsRes, variantsRes] = await Promise.all([
    supabase.from('exercise_materials').select('*').in('exercise_id', ids).order('sort_order'),
    supabase.from('exercise_variants').select('*').in('exercise_id', ids).order('sort_order'),
  ])

  if (options.strict && (materialsRes.error || variantsRes.error)) throw new Error('exercises')

  const materialsByExercise = groupBy((materialsRes.data ?? []) as MaterialRow[], 'exercise_id')
  const variantsByExercise = groupBy((variantsRes.data ?? []) as VariantRow[], 'exercise_id')

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    phases: (row.phases as string[]) ?? [],
    sports: (row.sports as string[]) ?? [],
    difficulty: row.difficulty as DifficultyLevel,
    ageGroups: (row.age_groups as string[]) ?? [],
    organizationForms: (row.organization_forms as string[]) ?? [],
    duration: row.duration,
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
    materials: (materialsByExercise[row.id] ?? []).map(mapMaterial),
    variants: (variantsByExercise[row.id] ?? []).map(mapVariant),
    musicRequired: row.music_required,
    musicLink: row.music_link,
    needsCompletion: row.needs_completion,
  }))
}

/**
 * Die Übungen der letzten zwei Einheiten dieser Gruppe. Eine eigene Abfrage
 * auf `exercise_usages` statt alle Einheiten mit Segmenten und Einträgen
 * durchzusuchen. Beim Neu-Generieren bleibt die Einheit selbst außen vor —
 * sonst würde sie sich ihre eigene Auswahl verbieten.
 */
async function loadRecentExerciseIds(
  supabase: SupabaseClient,
  groupId: string,
  excludeUnitId?: string
): Promise<string[]> {
  let unitQuery = supabase
    .from('units')
    .select('id')
    .eq('group_id', groupId)
    // Entwürfe zählen nicht: Was der Nutzer verworfen hat, soll die
    // Abwechslung der nächsten echten Einheit nicht einschränken.
    .eq('saved', true)
    .order('created_at', { ascending: false })
    .limit(2)

  if (excludeUnitId) unitQuery = unitQuery.neq('id', excludeUnitId)

  const { data: unitRows } = await unitQuery
  const unitIds = (unitRows ?? []).map((row) => row.id)
  if (unitIds.length === 0) return []

  const { data: usageRows } = await supabase
    .from('exercise_usages')
    .select('exercise_id')
    .in('unit_id', unitIds)

  return unique((usageRows ?? []).map((row) => row.exercise_id))
}

/** Der Generator-Zuschnitt eines Gruppenprofils. */
function toGeneratorGroup(group: Awaited<ReturnType<typeof getGroup>>): GeneratorGroup {
  return {
    ageGroups: group?.ageGroups ?? [],
    participants: group?.participants ?? null,
    // null = keine Halle zugewiesen → Material wird nicht geprüft.
    venueMaterials: group?.venue
      ? group.venue.materials.map((m) => ({ name: m.name, quantity: m.quantity }))
      : null,
  }
}

// ---- Name der Einheit ----

/**
 * „Gruppenname – 4. Okt. 2026", bei mehreren Einheiten am selben Tag mit
 * angehängtem Zähler, damit die Liste unterscheidbar bleibt.
 */
async function buildUnitName(
  supabase: SupabaseClient,
  groupId: string,
  groupName: string
): Promise<string> {
  const base = `${groupName} – ${format(new Date(), 'd. MMM yyyy', { locale: de })}`

  const { data } = await supabase.from('units').select('name').eq('group_id', groupId)
  const taken = new Set((data ?? []).map((row) => row.name))

  if (!taken.has(base)) return base

  let counter = 2
  while (taken.has(`${base} (${counter})`)) counter += 1
  return `${base} (${counter})`
}

/**
 * Eine im Zeitverlauf frisch angelegte eigene Phase existiert bisher nur im
 * Formular. Damit sie beim nächsten Mal zur Auswahl steht, landet sie beim
 * Generieren in den eigenen Kategorien — gleiches Muster wie bei Übungen
 * und Gruppen.
 */
async function saveCustomPhases(
  supabase: SupabaseClient,
  userId: string,
  segments: SegmentConfig[]
) {
  const customs = unique(
    segments
      .map((segment) => segment.name.trim())
      .filter((name) => name !== '' && !(PHASES as readonly string[]).includes(name))
  ).map((name) => ({ user_id: userId, category_type: 'phase', name }))

  if (customs.length === 0) return

  await supabase
    .from('custom_categories')
    .upsert(customs, { onConflict: 'user_id,category_type,name', ignoreDuplicates: true })
}

// ---- Schreiben ----

/**
 * Schreibt Segmente, Einträge und Verwendungsnachweise einer fertig
 * berechneten Einheit. Wirft bei jedem Fehlschlag, damit der Aufrufer
 * aufräumen kann — eine halb gespeicherte Einheit darf nicht zurückbleiben.
 */
async function writeUnitContents(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  groupId: string,
  plan: GeneratedUnit
): Promise<void> {
  const segmentRows = plan.segments.map((entry) => ({
    unit_id: unitId,
    name: entry.segment.name,
    minutes: entry.segment.minutes,
    fill_mode: entry.segment.fillMode,
    sports: entry.segment.sports as unknown as Json,
    primary_sport: entry.segment.primarySport,
    difficulties: entry.segment.difficulties as unknown as Json,
    notes: entry.segment.notes || null,
    gap_reason: entry.gapReason,
    gap_detail: (entry.gapDetail ?? null) as unknown as Json,
    position: entry.position,
  }))

  const { data: insertedSegments, error: segmentError } = await supabase
    .from('unit_segments')
    .insert(segmentRows)
    .select('id, position')

  if (segmentError || !insertedSegments) throw new Error('segments')

  const segmentIdByPosition = new Map(
    (insertedSegments as { id: string; position: number }[]).map((row) => [row.position, row.id])
  )

  const itemRows = plan.segments.flatMap((entry) => {
    const segmentId = segmentIdByPosition.get(entry.position)
    if (!segmentId) return []
    return entry.items.map((item) => ({
      segment_id: segmentId,
      exercise_id: item.exerciseId,
      variant_id: item.variantId,
      planned_duration: item.plannedDuration,
      position: item.position,
    }))
  })

  if (itemRows.length > 0) {
    const { error } = await supabase.from('unit_items').insert(itemRows)
    if (error) throw new Error('items')
  }

  const usedExerciseIds = unique(itemRows.map((row) => row.exercise_id))
  if (usedExerciseIds.length > 0) {
    const { error } = await supabase.from('exercise_usages').insert(
      usedExerciseIds.map((exerciseId) => ({
        user_id: userId,
        exercise_id: exerciseId,
        group_id: groupId,
        unit_id: unitId,
      }))
    )
    if (error) throw new Error('usages')
  }
}

// ---- Generieren ----

function newSeed(): number {
  return Math.floor(Math.random() * 2147483647)
}

export async function generateUnit(
  config: UnitConfig
): Promise<{ unitId?: string; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = unitConfigSchema.safeParse(config)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Die Konfiguration ist unvollständig.' }
  }

  // Die Gruppenzugehörigkeit wird serverseitig geprüft — es genügt nicht,
  // dass die Kennung aus einem Formularfeld kommt.
  const group = await getGroup(config.groupId)
  if (!group) return { error: 'Diese Gruppe gehört nicht zu deinem Konto.' }

  if (config.totalMinutes !== group.unitDuration) {
    return {
      error: `Die Einheitsdauer der Gruppe liegt bei ${group.unitDuration} Minuten. Lade die Seite neu und versuche es erneut.`,
    }
  }

  // Pro Nutzer existiert höchstens ein Entwurf. Ein neuer Vorschlag ersetzt
  // den vorigen, damit sich verworfene Einheiten nicht ansammeln.
  await supabase.from('units').delete().eq('user_id', user.id).eq('saved', false)

  const [sources, recentExerciseIds, name] = await Promise.all([
    loadCandidateSources(supabase, user.id),
    loadRecentExerciseIds(supabase, group.id),
    buildUnitName(supabase, group.id, group.name),
  ])

  const seed = newSeed()
  const plan = generateUnitPlan({
    group: toGeneratorGroup(group),
    segments: config.segments,
    candidates: buildCandidates(sources),
    recentExerciseIds,
    seed,
    relax: false,
  })

  const { data: unitRow, error: unitError } = await supabase
    .from('units')
    .insert({
      user_id: user.id,
      group_id: group.id,
      name,
      total_minutes: config.totalMinutes,
      seed,
      relaxed_note: plan.relaxedNote,
      editor_state: config.editorState as unknown as Json,
      saved: false,
    })
    .select('id')
    .single()

  if (unitError || !unitRow) return { error: GENERIC_ERROR }

  try {
    await writeUnitContents(supabase, user.id, unitRow.id, group.id, plan)
  } catch {
    // Die abhängigen Datensätze verschwinden über die Löschweitergabe mit.
    await supabase.from('units').delete().eq('id', unitRow.id).eq('user_id', user.id)
    return { error: GENERIC_ERROR }
  }

  await saveCustomPhases(supabase, user.id, config.segments)

  return { unitId: unitRow.id }
}

/**
 * Überschreibt denselben Datensatz: die Konfiguration des Zeitverlaufs bleibt
 * erhalten, nur die Übungsauswahl ist eine andere. Dafür genügt ein neuer
 * Zufalls-Startwert.
 */
/**
 * Neu generieren mit derselben Konfiguration.
 *
 * Bei einem **Entwurf** wird der Inhalt an Ort und Stelle ersetzt. Bei einer
 * bereits **gespeicherten** Einheit entsteht stattdessen ein neuer Entwurf
 * daneben; die gespeicherte Fassung bleibt unangetastet, bis der Nutzer den
 * neuen Vorschlag seinerseits speichert.
 */
export async function regenerateUnit(
  unitId: string
): Promise<{ success?: boolean; unitId?: string; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data: unitRow, error: unitError } = await supabase
    .from('units')
    .select('*')
    .eq('id', unitId)
    .eq('user_id', user.id)
    .single()

  if (unitError || !unitRow) return { error: 'Diese Einheit gehört nicht zu deinem Konto.' }

  const unit = unitRow as UnitRow

  const group = await getGroup(unit.group_id)
  if (!group) return { error: 'Die Gruppe dieser Einheit existiert nicht mehr.' }

  const { data: segmentRows } = await supabase
    .from('unit_segments')
    .select('*')
    .eq('unit_id', unit.id)
    .order('position')

  const segments = ((segmentRows ?? []) as SegmentRow[]).map(segmentRowToConfig)
  if (segments.length === 0) return { error: GENERIC_ERROR }

  const [sources, recentExerciseIds] = await Promise.all([
    loadCandidateSources(supabase, user.id),
    loadRecentExerciseIds(supabase, group.id, unit.id),
  ])

  const seed = newSeed()
  const plan = generateUnitPlan({
    group: toGeneratorGroup(group),
    segments,
    candidates: buildCandidates(sources),
    recentExerciseIds,
    seed,
    // Lockern passiert pro Segment über relaxSegment, nicht beim Neu-Generieren.
    relax: false,
  })

  // Eine bereits gespeicherte Einheit wird nicht angefasst: Der neue Vorschlag
  // entsteht als Entwurf daneben. Erst „Einheit speichern" legt ihn als eigene
  // Einheit ab — die alte bleibt unverändert im Ordner.
  if (unit.saved) {
    await supabase.from('units').delete().eq('user_id', user.id).eq('saved', false)

    const { data: draftRow, error: draftError } = await supabase
      .from('units')
      .insert({
        user_id: user.id,
        group_id: group.id,
        name: await buildUnitName(supabase, group.id, group.name),
        total_minutes: unit.total_minutes,
        seed,
        relaxed_note: plan.relaxedNote,
        editor_state: unit.editor_state,
        saved: false,
      })
      .select('id')
      .single()

    if (draftError || !draftRow) return { error: GENERIC_ERROR }

    try {
      await writeUnitContents(supabase, user.id, draftRow.id, group.id, plan)
    } catch {
      await supabase.from('units').delete().eq('id', draftRow.id).eq('user_id', user.id)
      return { error: GENERIC_ERROR }
    }

    return { success: true, unitId: draftRow.id }
  }

  // Ein Entwurf wird an Ort und Stelle ersetzt — da ist nichts zu bewahren.
  // Erst wenn der neue Plan vollständig im Speicher steht, wird der alte
  // Inhalt ersetzt. Die Segmente nehmen ihre Einträge über die
  // Löschweitergabe mit.
  await Promise.all([
    supabase.from('unit_segments').delete().eq('unit_id', unit.id),
    supabase.from('exercise_usages').delete().eq('unit_id', unit.id),
  ])

  try {
    await writeUnitContents(supabase, user.id, unit.id, group.id, plan)
  } catch {
    return { error: GENERIC_ERROR }
  }

  const { error } = await supabase
    .from('units')
    .update({ seed, relaxed_note: plan.relaxedNote, manually_edited: false })
    .eq('id', unit.id)
    .eq('user_id', user.id)

  if (error) return { error: GENERIC_ERROR }

  return { success: true }
}

/**
 * Der Bedienstand aus der Datenbank, abgesichert gegen Altbestand: Einheiten
 * aus der Zeit vor dieser Spalte tragen nichts und öffnen den Generator mit
 * dem Zeitverlauf, so wie es vorher auch war.
 */
function readEditorState(raw: Json | null): EditorState {
  const value = raw as { mode?: unknown; expandedPosition?: unknown } | null
  const mode: UnitMode = value?.mode === 'standard' ? 'standard' : 'custom'
  const position =
    typeof value?.expandedPosition === 'number' ? value.expandedPosition : null
  return { mode, expandedPosition: position }
}

/** Gemeinsame Namensprüfung für Umbenennen und Speichern. */
function checkUnitName(name: string): { name: string } | { error: string } {
  const trimmed = name.trim()
  if (trimmed.length === 0) return { error: 'Bitte gib einen Namen ein.' }
  if (trimmed.length > 200) return { error: 'Maximal 200 Zeichen.' }
  return { name: trimmed }
}

/** Nutzer vergeben eigene Namen, sobald der automatische nicht mehr passt. */
export async function renameUnit(
  unitId: string,
  name: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const checked = checkUnitName(name)
  if ('error' in checked) return { error: checked.error }

  const { data, error } = await supabase
    .from('units')
    .update({ name: checked.name })
    .eq('id', unitId)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { error: 'Einheit konnte nicht umbenannt werden.' }
  // Ein Update, das keine Zeile trifft, ist in Supabase kein Fehler (BUG-16).
  if (!data || data.length === 0) return { error: UNIT_GONE }
  return { success: true }
}

/**
 * Löscht eine Einheit. Segmente, Einträge und Verwendungsnachweise
 * verschwinden über die Löschweitergabe mit; die Übungen selbst bleiben
 * unberührt, weil die Einheit sie nur verweist.
 */
export async function deleteUnit(
  unitId: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase
    .from('units')
    .delete()
    .eq('id', unitId)
    .eq('user_id', user.id)

  if (error) return { error: 'Einheit konnte nicht gelöscht werden.' }
  return { success: true }
}

/**
 * Nimmt den Entwurf in die Übersichten auf. Bis hierhin war die Einheit nur
 * ein Vorschlag, den der Nutzer auch verwerfen kann, indem er einfach neu
 * generiert.
 */
export async function saveUnit(
  unitId: string,
  name: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  // Name und Ablage in einem Schritt: Der Nutzer benennt die Einheit genau
  // dann, wenn sie in den Ordner wandert — dort braucht er sie wiederzufinden.
  const checked = checkUnitName(name)
  if ('error' in checked) return { error: checked.error }

  const { data, error } = await supabase
    .from('units')
    .update({ name: checked.name, saved: true })
    .eq('id', unitId)
    .eq('user_id', user.id)
    .select('id, group_id')

  if (error) return { error: 'Einheit konnte nicht gespeichert werden.' }

  // Ein Update, das keine Zeile trifft, ist in Supabase kein Fehler — der
  // Entwurf kann inzwischen von einem zweiten Generieren ersetzt worden sein.
  // Ohne diese Prüfung stünde „Einheit gespeichert" da, und geschrieben wäre
  // nichts (BUG-16).
  const saved = (data ?? [])[0]
  if (!saved) return { error: UNIT_GONE }

  // Die Verwendungsnachweise entstehen beim Speichern neu: ihr Zeitpunkt ist
  // dann der des Speicherns, nicht der des Generierens (BUG-6).
  await rewriteUsages(supabase, user.id, saved.id, saved.group_id)

  return { success: true }
}

/**
 * Lockert die Kriterien **nur für dieses eine Segment** und füllt es neu.
 * Alle übrigen Segmente bleiben unangetastet — auch solche, die ebenfalls eine
 * Lücke haben. Der Nutzer entscheidet pro Segment, wo er nachgeben will.
 */
export async function relaxSegment(
  segmentId: string
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data: segmentData, error: segmentError } = await supabase
    .from('unit_segments')
    .select('*')
    .eq('id', segmentId)
    .single()

  if (segmentError || !segmentData) return { error: 'Segment nicht gefunden.' }
  const segmentRow = segmentData as SegmentRow

  // Zugehörigkeit über die Einheit prüfen — die Segment-Kennung allein ist
  // kein Eigentumsnachweis.
  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .select('*')
    .eq('id', segmentRow.unit_id)
    .eq('user_id', user.id)
    .single()

  if (unitError || !unitData) return { error: 'Diese Einheit gehört nicht zu deinem Konto.' }
  const unit = unitData as UnitRow

  const group = await getGroup(unit.group_id)
  if (!group) return { error: 'Die Gruppe dieser Einheit existiert nicht mehr.' }

  // Alle übrigen Segmente laden, um zu wissen, welche Übungen in dieser
  // Einheit schon vergeben sind — Dopplungen bleiben auch hier ausgeschlossen.
  const { data: allSegments } = await supabase
    .from('unit_segments')
    .select('id, position')
    .eq('unit_id', unit.id)
    .order('position')

  const otherSegmentIds = ((allSegments ?? []) as { id: string; position: number }[])
    .filter((row) => row.id !== segmentId)
    .map((row) => row.id)

  const blockedExerciseIds = otherSegmentIds.length > 0
    ? unique(
        (((await supabase
          .from('unit_items')
          .select('exercise_id')
          .in('segment_id', otherSegmentIds)).data ?? []) as { exercise_id: string | null }[])
          .map((row) => row.exercise_id)
          .filter((id): id is string => id != null)
      )
    : []

  const [sources, recentExerciseIds] = await Promise.all([
    loadCandidateSources(supabase, user.id),
    loadRecentExerciseIds(supabase, group.id, unit.id),
  ])

  const plan = planSegment({
    segment: segmentRowToConfig(segmentRow),
    segmentIndex: segmentRow.position,
    group: toGeneratorGroup(group),
    candidates: buildCandidates(sources),
    recentExerciseIds,
    blockedExerciseIds,
    seed: newSeed(),
    relax: true,
  })

  // Nur die Einträge dieses Segments werden ersetzt.
  await supabase.from('unit_items').delete().eq('segment_id', segmentId)

  if (plan.items.length > 0) {
    const { error } = await supabase.from('unit_items').insert(
      plan.items.map((item) => ({
        segment_id: segmentId,
        exercise_id: item.exerciseId,
        variant_id: item.variantId,
        planned_duration: item.plannedDuration,
        position: item.position,
      }))
    )
    if (error) return { error: GENERIC_ERROR }
  }

  await supabase
    .from('unit_segments')
    .update({
      gap_reason: plan.gapReason,
      gap_detail: (plan.gapDetail ?? null) as unknown as Json,
    })
    .eq('id', segmentId)

  await rewriteUsages(supabase, user.id, unit.id, group.id)

  // Den Lockerungshinweis der Einheit auf diesem Segment fortschreiben, ohne
  // die Hinweise der anderen Segmente zu verlieren. Die Sätze beginnen jeweils
  // mit dem Segmentnamen in Anführungszeichen und enden auf einem Punkt.
  const otherNotes = (unit.relaxed_note ?? '')
    .split(/(?<=\.)\s+(?=„)/)
    .map((part) => part.trim())
    .filter((part) => part !== '' && !part.startsWith(`„${segmentRow.name}":`))

  const notes = plan.relaxNote ? [...otherNotes, plan.relaxNote] : otherNotes

  await supabase
    .from('units')
    .update({ relaxed_note: notes.length > 0 ? notes.join(' ') : null })
    .eq('id', unit.id)
    .eq('user_id', user.id)

  return { success: true }
}

/** Verwendungsnachweise einer Einheit aus ihrem aktuellen Inhalt neu aufbauen. */
async function rewriteUsages(
  supabase: SupabaseClient,
  userId: string,
  unitId: string,
  groupId: string
): Promise<void> {
  const { data: segmentRows } = await supabase
    .from('unit_segments')
    .select('id')
    .eq('unit_id', unitId)

  const segmentIds = ((segmentRows ?? []) as { id: string }[]).map((row) => row.id)

  const exerciseIds = segmentIds.length > 0
    ? unique(
        (((await supabase
          .from('unit_items')
          .select('exercise_id')
          .in('segment_id', segmentIds)).data ?? []) as { exercise_id: string | null }[])
          .map((row) => row.exercise_id)
          .filter((id): id is string => id != null)
      )
    : []

  await supabase.from('exercise_usages').delete().eq('unit_id', unitId)

  if (exerciseIds.length > 0) {
    await supabase.from('exercise_usages').insert(
      exerciseIds.map((exerciseId) => ({
        user_id: userId,
        exercise_id: exerciseId,
        group_id: groupId,
        unit_id: unitId,
      }))
    )
  }
}

// ---- Editor (PROJ-7) ----

/**
 * Segment, Einheit und Gruppe zu einer Segment-Kennung — mit Eigentumsprüfung
 * über die Einheit. Die Segment-Kennung allein ist kein Eigentumsnachweis.
 */
async function loadSegmentContext(
  supabase: SupabaseClient,
  userId: string,
  segmentId: string
): Promise<
  | { segment: SegmentRow; unit: UnitRow; group: NonNullable<Awaited<ReturnType<typeof getGroup>>> }
  | { error: string }
> {
  const { data: segmentData, error: segmentError } = await supabase
    .from('unit_segments')
    .select('*')
    .eq('id', segmentId)
    .maybeSingle()

  if (segmentError || !segmentData) return { error: 'Segment nicht gefunden.' }
  const segment = segmentData as SegmentRow

  const { data: unitData, error: unitError } = await supabase
    .from('units')
    .select('*')
    .eq('id', segment.unit_id)
    .eq('user_id', userId)
    .maybeSingle()

  if (unitError || !unitData) return { error: 'Diese Einheit gehört nicht zu deinem Konto.' }
  const unit = unitData as UnitRow

  const group = await getGroup(unit.group_id)
  if (!group) return { error: 'Die Gruppe dieser Einheit existiert nicht mehr.' }

  return { segment, unit, group }
}

/**
 * Die Kandidatenliste eines Segments für den Bearbeiten-Modus. Wird einmal je
 * Segment geholt; danach laufen Würfeln, Auswahl und Variantenwechsel im
 * Browser.
 *
 * Wirft bei jedem Fehlschlag, statt eine leere Liste zu liefern: der
 * Auswahldialog zeigt dann „erneut versuchen" und nicht den Leerzustand „du
 * hast noch keine Übungen".
 */
export async function getEditorPool(segmentId: string): Promise<EditorCandidate[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) throw new Error('Nicht angemeldet.')

  const context = await loadSegmentContext(supabase, user.id, segmentId)
  if ('error' in context) throw new Error(context.error)

  const sources = await loadCandidateSources(supabase, user.id, undefined, { strict: true })

  return buildEditorPool(
    sources,
    segmentRowToConfig(context.segment),
    toGeneratorGroup(context.group)
  )
}

/** Was die Datenbank-Funktion an Ausnahmen kennt, in Worten für den Nutzer. */
function savePlanError(message: string): string {
  if (message.includes('unit_not_found')) return UNIT_GONE
  if (message.includes('segments_changed')) {
    return 'Der Zeitverlauf dieser Einheit wurde inzwischen neu erzeugt. Lade die Seite neu — deine Änderungen hier passen nicht mehr dazu.'
  }
  if (message.includes('not_authenticated')) return 'Nicht angemeldet.'
  return 'Speichern fehlgeschlagen, bitte erneut versuchen. Deine Änderungen sind noch da.'
}

/**
 * Legt die Arbeitsfassung des Editors ab — als **eine** Datenbank-Operation.
 * Eigentumsprüfung, Abgleich des Änderungsstempels, Einträge, Notizen,
 * Verwendungsnachweise und die Markierung „manuell bearbeitet" passieren in
 * der Funktion `save_unit_plan` gemeinsam oder gar nicht.
 *
 * `stale: true` heißt: die Einheit wurde seit dem Öffnen anderswo geändert und
 * nichts wurde geschrieben. Mit `force` wird trotzdem überschrieben.
 *
 * Ein Entwurf bringt seinen Namen mit und wird im selben Zug in die
 * Übersichten aufgenommen.
 */
export async function saveUnitPlan(
  unitId: string,
  draft: UnitDraft,
  options: { expectedUpdatedAt: string; force: boolean; name?: string }
): Promise<{ error?: string; stale?: boolean }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsedDraft = unitDraftSchema.safeParse(draft)
  if (!parsedDraft.success) {
    return { error: parsedDraft.error.issues[0]?.message ?? 'Der Plan ist unvollständig.' }
  }

  const parsedOptions = savePlanOptionsSchema.safeParse(options)
  if (!parsedOptions.success) return { error: 'Ungültige Anfrage.' }

  let name: string | undefined
  if (parsedOptions.data.name !== undefined) {
    const checked = checkUnitName(parsedOptions.data.name)
    if ('error' in checked) return { error: checked.error }
    name = checked.name
  }

  const { data, error } = await supabase.rpc('save_unit_plan', {
    p_unit_id: unitId,
    p_segments: parsedDraft.data.segments as unknown as Json,
    p_expected_updated_at: parsedOptions.data.expectedUpdatedAt,
    p_force: parsedOptions.data.force,
    ...(name !== undefined ? { p_name: name } : {}),
  })

  if (error) return { error: savePlanError(error.message) }
  if (data === 'stale') return { stale: true }
  if (data !== 'ok') return { error: savePlanError('') }

  return {}
}

/** `%` und `_` sind in ILIKE Platzhalter — im Namen einer Übung sind sie Zeichen. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`)
}

/**
 * „Übung fehlt? Schnell anlegen" — legt die Übung **sofort** an, unabhängig vom
 * Speichern des Plans. Darum bleibt sie erhalten, wenn der Nutzer seine
 * Planänderungen verwirft.
 *
 * Sportart, Phase, Schwierigkeit und Altersgruppen kommen aus Segment und
 * Gruppe und nicht aus dem Formular: nur so ist die Übung beim nächsten
 * Generieren ein gültiger Kandidat. Sie trägt die Markierung „noch zu
 * ergänzen", bis sie über das reguläre Formular gespeichert wird.
 *
 * Den Namensabgleich macht der Server über **alle** Übungen des Nutzers.
 */
export async function quickCreateExercise(
  segmentId: string,
  input: QuickCreateInput
): Promise<QuickCreateResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = quickCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' }
  }
  const data = parsed.data

  const context = await loadSegmentContext(supabase, user.id, segmentId)
  if ('error' in context) return { error: context.error }

  const segment = segmentRowToConfig(context.segment)
  const group = toGeneratorGroup(context.group)

  /** Die Übung als Kandidat dieses Segments — derselbe Weg wie die Liste. */
  const asCandidate = async (exerciseId: string): Promise<EditorCandidate | null> => {
    const sources = await loadCandidateSources(supabase, user.id, [exerciseId])
    return (
      buildEditorPool(sources, segment, group).find((candidate) => candidate.variantId === null) ??
      null
    )
  }

  const { data: sameName, error: lookupError } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', escapeLike(data.name))
    .limit(1)

  if (lookupError) return { error: 'Übung konnte nicht angelegt werden.' }

  if (sameName && sameName.length > 0) {
    const duplicate = await asCandidate(sameName[0].id)
    if (duplicate) return { duplicate }
  }

  const { data: created, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      work_notes: data.workNotes || null,
      sports: segment.sports as unknown as Json,
      age_groups: group.ageGroups as unknown as Json,
      phases: [segment.name] as unknown as Json,
      difficulty: segment.difficulties[0] ?? 'Mittel',
      duration: data.duration,
      needs_completion: true,
    })
    .select('id')
    .single()

  if (error || !created) return { error: 'Übung konnte nicht angelegt werden.' }

  const candidate = await asCandidate(created.id)
  if (!candidate) {
    return {
      error:
        'Die Übung wurde angelegt, konnte aber nicht eingesetzt werden. Schließe den Dialog und öffne ihn erneut — sie steht dann in der Liste.',
    }
  }

  return { created: candidate }
}

// ---- Lesen ----

function segmentRowToConfig(row: SegmentRow): SegmentConfig {
  return {
    id: row.id,
    name: row.name,
    minutes: row.minutes,
    fillMode: row.fill_mode as SegmentFillMode,
    sports: (row.sports as string[]) ?? [],
    primarySport: row.primary_sport,
    difficulties: ((row.difficulties as string[]) ?? []) as DifficultyLevel[],
    notes: row.notes ?? '',
  }
}

// `candidateKey` liegt bei den Kandidaten selbst — der Editor aus PROJ-7 merkt
// sich darüber, was an einem Platz weggewürfelt wurde, und zwei Fassungen
// desselben Schlüssels würden lautlos auseinanderlaufen.

export async function getUnit(id: string): Promise<Unit | null> {
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const { data: unitData, error } = await supabase
    .from('units')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !unitData) return null
  const unit = unitData as UnitRow

  const [groupRes, segmentRes] = await Promise.all([
    supabase.from('groups').select('name').eq('id', unit.group_id).single(),
    supabase.from('unit_segments').select('*').eq('unit_id', unit.id).order('position'),
  ])

  const segmentRows = (segmentRes.data ?? []) as SegmentRow[]
  const segmentIds = segmentRows.map((row) => row.id)

  const itemRows = segmentIds.length > 0
    ? (((await supabase
        .from('unit_items')
        .select('*')
        .in('segment_id', segmentIds)
        .order('position')).data ?? []) as ItemRow[])
    : []

  // Verweis statt Kopie: die Übungen werden jetzt gelesen, Korrekturen an
  // ihnen sind damit sofort sichtbar. Nur die Plandauer steht am Eintrag.
  const exerciseIds = unique(
    itemRows.map((row) => row.exercise_id).filter((value): value is string => value != null)
  )
  const sources = await loadCandidateSources(supabase, user.id, exerciseIds)

  const descriptions = new Map<string, { description: string; musicRequired: boolean; musicLink: string | null }>()
  if (exerciseIds.length > 0) {
    const { data } = await supabase
      .from('exercises')
      .select('id, description, music_required, music_link')
      .in('id', exerciseIds)
    for (const row of (data ?? []) as Pick<ExerciseRow, 'id' | 'description' | 'music_required' | 'music_link'>[]) {
      descriptions.set(row.id, {
        description: row.description,
        musicRequired: row.music_required,
        musicLink: row.music_link,
      })
    }
  }

  const variantCounts = new Map(sources.map((source) => [source.id, source.variants.length]))
  const candidates = new Map<string, Candidate>(
    buildCandidates(sources).map((candidate) => [
      candidateKey(candidate.exerciseId, candidate.variantId),
      candidate,
    ])
  )

  const itemsBySegment = groupBy(itemRows, 'segment_id')

  const segments: UnitSegment[] = segmentRows.map((row) => ({
    ...segmentRowToConfig(row),
    gapReason: row.gap_reason,
    gapDetail: (row.gap_detail as unknown as GapDetail | null) ?? null,
    position: row.position,
    items: (itemsBySegment[row.id] ?? []).map((item) => mapItem(item, candidates, descriptions, variantCounts)),
  }))

  return {
    id: unit.id,
    userId: unit.user_id,
    groupId: unit.group_id,
    groupName: groupRes.data?.name ?? 'Gruppe',
    name: unit.name,
    totalMinutes: unit.total_minutes,
    seed: unit.seed,
    manuallyEdited: unit.manually_edited,
    saved: unit.saved,
    editorState: readEditorState(unit.editor_state),
    relaxedNote: unit.relaxed_note,
    segments,
    createdAt: unit.created_at,
    updatedAt: unit.updated_at,
  }
}

function mapItem(
  row: ItemRow,
  candidates: Map<string, Candidate>,
  descriptions: Map<string, { description: string; musicRequired: boolean; musicLink: string | null }>,
  variantCounts: Map<string, number>
): UnitItem {
  const base: UnitItem = {
    id: row.id,
    exerciseId: row.exercise_id,
    variantId: row.variant_id,
    plannedDuration: row.planned_duration,
    position: row.position,
    exercise: null,
  }

  if (!row.exercise_id) return base

  // Fällt eine Variante weg, greift der Eintrag auf die Hauptübung zurück,
  // statt mit einem Platzhalter zu verschwinden.
  const candidate =
    candidates.get(candidateKey(row.exercise_id, row.variant_id)) ??
    candidates.get(candidateKey(row.exercise_id, null))

  if (!candidate) return base

  const extra = descriptions.get(row.exercise_id)

  return {
    ...base,
    exercise: {
      id: candidate.exerciseId,
      name: candidate.name,
      description: extra?.description ?? '',
      estimatedDuration: candidate.duration,
      sports: candidate.sports,
      difficulty: candidate.difficulty,
      organizationForms: candidate.organizationForms,
      materials: candidate.materials,
      musicRequired: extra?.musicRequired ?? false,
      musicLink: extra?.musicLink ?? null,
      variantCount: variantCounts.get(candidate.exerciseId) ?? 0,
      variantTitle: candidate.variantTitle,
    },
  }
}

async function toSummaries(
  supabase: SupabaseClient,
  unitRows: UnitRow[]
): Promise<UnitSummary[]> {
  if (unitRows.length === 0) return []

  const unitIds = unitRows.map((row) => row.id)
  const groupIds = unique(unitRows.map((row) => row.group_id))

  const [groupRes, segmentRes] = await Promise.all([
    supabase.from('groups').select('id, name').in('id', groupIds),
    supabase.from('unit_segments').select('id, unit_id').in('unit_id', unitIds),
  ])

  const groupNames = new Map(
    ((groupRes.data ?? []) as { id: string; name: string }[]).map((row) => [row.id, row.name])
  )

  const segmentRows = (segmentRes.data ?? []) as { id: string; unit_id: string }[]
  const unitIdBySegment = new Map(segmentRows.map((row) => [row.id, row.unit_id]))

  const counts = new Map<string, number>()
  if (segmentRows.length > 0) {
    const { data } = await supabase
      .from('unit_items')
      .select('segment_id')
      .in('segment_id', segmentRows.map((row) => row.id))

    for (const row of (data ?? []) as { segment_id: string }[]) {
      const unitId = unitIdBySegment.get(row.segment_id)
      if (!unitId) continue
      counts.set(unitId, (counts.get(unitId) ?? 0) + 1)
    }
  }

  return unitRows.map((row) => ({
    id: row.id,
    name: row.name,
    groupId: row.group_id,
    groupName: groupNames.get(row.group_id) ?? 'Gruppe',
    totalMinutes: row.total_minutes,
    exerciseCount: counts.get(row.id) ?? 0,
    createdAt: row.created_at,
  }))
}

export async function getUnitsForGroup(groupId: string): Promise<UnitSummary[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .eq('saved', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return toSummaries(supabase, data as UnitRow[])
}

export async function getUnits(): Promise<UnitSummary[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('units')
    .select('*')
    .eq('user_id', user.id)
    .eq('saved', true)
    .order('created_at', { ascending: false })

  if (error || !data) return []
  return toSummaries(supabase, data as UnitRow[])
}

/**
 * Für die Löschwarnung bei einer Gruppe. Eine Gruppe zu löschen nimmt über die
 * Löschweitergabe **alle ihre Einheiten** mit — das muss im Dialog stehen,
 * bevor der Nutzer bestätigt.
 *
 * Entwürfe bleiben außen vor: Sie sind ohnehin flüchtig und werden beim
 * nächsten Generieren ersetzt, tauchen in keiner Übersicht auf und wären in
 * einer Warnung nur ein Name, den der Nutzer nirgends wiederfindet.
 */
export async function getUnitNamesForGroup(groupId: string): Promise<string[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data } = await supabase
    .from('units')
    .select('name')
    .eq('user_id', user.id)
    .eq('group_id', groupId)
    .eq('saved', true)
    .order('created_at', { ascending: false })

  return (data ?? []).map((row) => row.name)
}

/**
 * Für die Löschwarnung bei einer Übung: „Diese Übung wird in 2 Einheiten
 * verwendet: …". Ohne die Namen bleibt die Warnung abstrakt.
 *
 * Entwürfe bleiben außen vor — gleiche Begründung wie bei der Gruppenwarnung:
 * Sie werden beim nächsten Generieren ersetzt, stehen in keiner Übersicht und
 * wären in der Warnung nur ein Name, den der Nutzer nirgends wiederfindet.
 */
export async function getUnitNamesUsingExercise(exerciseId: string): Promise<string[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data: itemRows } = await supabase
    .from('unit_items')
    .select('segment_id')
    .eq('exercise_id', exerciseId)

  const segmentIds = unique((itemRows ?? []).map((row) => row.segment_id))
  if (segmentIds.length === 0) return []

  const { data: segmentRows } = await supabase
    .from('unit_segments')
    .select('unit_id')
    .in('id', segmentIds)

  const unitIds = unique((segmentRows ?? []).map((row) => row.unit_id))
  if (unitIds.length === 0) return []

  const { data: unitRows } = await supabase
    .from('units')
    .select('name, created_at')
    .eq('user_id', user.id)
    .eq('saved', true)
    .in('id', unitIds)
    .order('created_at', { ascending: false })

  return (unitRows ?? []).map((row) => row.name)
}
