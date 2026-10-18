'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/database.types'
import type { DifficultyLevel, Exercise, ExerciseFilters } from '@/lib/types/exercise'
import type {
  CopyLibraryResult,
  LibraryEntry,
  LibraryResult,
} from '@/lib/types/library'
import type { LibraryParams } from '@/lib/library/address'
import { applyExerciseFilters, exerciseSelect } from '@/lib/exercises/filter-query'
import { groupBy, mapLink, mapMaterial, mapVariant } from '@/lib/exercises/map-rows'
import { orderByTerm, orderTerms } from '@/lib/categories/terms'
import { explainEmptyFilters, hasActiveFilters } from '@/lib/library/filter-reasons'
import {
  explainEmptyGroupFit,
  summarizeGroupFit,
  type FitGroup,
} from '@/lib/library/group-fit'
import { getGroup } from './groups'

/**
 * Die Übungsdatenbank (PROJ-4). Lesen, was der Nutzer sehen darf — das
 * entscheidet die Datenbank (freigegeben für alle, Entwürfe nur für die
 * Vorschau-Konten ihres Blocks) —, und übernehmen in einem Zug. In den Bestand
 * schreibt die App nie; das tut nur das Prüfprogramm.
 */

type LibraryRow = Database['public']['Tables']['library_exercises']['Row']
type MaterialRow = Database['public']['Tables']['exercise_materials']['Row']
type VariantRow = Database['public']['Tables']['exercise_variants']['Row']
type LinkRow = Database['public']['Tables']['exercise_links']['Row']
type Supabase = Awaited<ReturnType<typeof createClient>>

/** Zurückgezogene Übungen sieht niemand; die Datenbank sorgt dafür, das hier zusätzlich. */
const VISIBLE_STATUSES = ['draft', 'released']

const GENERIC_COPY_ERROR =
  'Das Übernehmen hat nicht geklappt — es wurde nichts übernommen. Bitte versuche es erneut.'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

function mapLibraryRow(
  row: LibraryRow,
  materials: MaterialRow[],
  variants: VariantRow[],
  links: LinkRow[],
): Exercise {
  // Dieselbe Gestalt wie eine eigene Übung, damit Liste, Karten und
  // Detailansicht sie unverändert zeigen. Was der Bestand nicht hat, bleibt leer.
  return {
    id: row.id,
    userId: '',
    name: row.name,
    description: row.description,
    notes: row.notes,
    workNotes: null,
    sports: orderTerms('sport', (row.sports as string[]) ?? []),
    ageGroups: orderTerms('age_group', (row.age_groups as string[]) ?? []),
    phases: orderTerms('phase', (row.phases as string[]) ?? []),
    difficulty: row.difficulty as DifficultyLevel,
    organizationForms: orderTerms('organization_form', (row.organization_forms as string[]) ?? []),
    duration: row.duration,
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
    musicRequired: row.music_required,
    musicLink: null,
    needsCompletion: false,
    sourceCredit: row.source_credit,
    libraryOrigin: null,
    images: [],
    materials: orderByTerm('material', materials.map(mapMaterial)),
    variants: variants.map(mapVariant),
    links: links.map(mapLink),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

interface LoadedRow {
  row: LibraryRow
  exercise: Exercise
}

/**
 * Den sichtbaren Bestand laden, wahlweise gefiltert. `null` heißt: die
 * Übungsdatenbank ist nicht erreichbar (Verbindung, oder vor der Migration).
 */
async function loadLibrary(
  supabase: Supabase,
  filters: ExerciseFilters | null,
  params?: Pick<LibraryParams, 'sortField' | 'sortDirection'>,
): Promise<LoadedRow[] | null> {
  let query = supabase
    .from('library_exercises')
    .select(filters ? exerciseSelect('library_exercise_materials', filters) : '*')
    .in('status', VISIBLE_STATUSES)
  if (filters) query = applyExerciseFilters(query, filters)

  const ascending = params?.sortDirection === 'asc'
  switch (params?.sortField ?? 'addedAt') {
    case 'addedAt':
      // Entwürfe (noch ohne Datum) stehen in der Vorschau oben.
      query = query
        .order('first_released_at', { ascending, nullsFirst: true })
        .order('created_at', { ascending: false })
      break
    case 'name':
      query = query.order('name', { ascending })
      break
    case 'duration':
      query = query.order('duration', { ascending }).order('name', { ascending: true })
      break
    case 'difficulty':
      query = query.order('difficulty', { ascending }).order('name', { ascending: true })
      break
  }

  const { data, error } = await query
  if (error || !data) return null

  const rows = data as unknown as LibraryRow[]
  if (rows.length === 0) return []

  const ids = rows.map((r) => r.id)
  const [materialsRes, variantsRes, linksRes] = await Promise.all([
    supabase.from('library_exercise_materials').select('*').in('exercise_id', ids).order('sort_order'),
    supabase.from('library_exercise_variants').select('*').in('exercise_id', ids).order('sort_order'),
    supabase.from('library_exercise_links').select('*').in('exercise_id', ids).order('sort_order'),
  ])
  if (materialsRes.error || variantsRes.error || linksRes.error) return null

  const materials = groupBy((materialsRes.data ?? []) as MaterialRow[], 'exercise_id')
  const variants = groupBy((variantsRes.data ?? []) as VariantRow[], 'exercise_id')
  const links = groupBy((linksRes.data ?? []) as LinkRow[], 'exercise_id')

  return rows.map((row) => ({
    row,
    exercise: mapLibraryRow(row, materials[row.id] ?? [], variants[row.id] ?? [], links[row.id] ?? []),
  }))
}

/** Bestand-Kennung → Kennung der eigenen Kopie. */
async function loadCopies(supabase: Supabase, userId: string): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('exercises')
    .select('id, library_exercise_id')
    .eq('user_id', userId)
    .not('library_exercise_id', 'is', null)

  const copies = new Map<string, string>()
  for (const row of data ?? []) {
    if (row.library_exercise_id) copies.set(row.library_exercise_id, row.id)
  }
  return copies
}

function toEntry(loaded: LoadedRow, copies: Map<string, string>): LibraryEntry {
  return {
    exercise: loaded.exercise,
    isDraft: loaded.row.status === 'draft',
    addedAt: loaded.row.first_released_at,
    copiedExerciseId: copies.get(loaded.row.id) ?? null,
  }
}

function toFitGroup(group: NonNullable<Awaited<ReturnType<typeof getGroup>>>): FitGroup {
  return {
    sports: group.sports,
    ageGroups: group.ageGroups,
    participants: group.participants,
    // Wie im Generator: ohne Halle wird kein Material geprüft.
    venueMaterials: group.venue
      ? group.venue.materials.map((m) => ({ name: m.name, quantity: m.quantity }))
      : null,
    venueName: group.venue?.name ?? null,
  }
}

const EMPTY_RESULT: LibraryResult = {
  available: true,
  hasContent: false,
  entries: [],
  group: null,
  groupMissing: false,
  emptyReasons: [],
}

/** Der Reiter „Übungsdatenbank": Liste, wahlweise mit „Passt zu Gruppe". */
export async function getLibrary(params: LibraryParams): Promise<LibraryResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return EMPTY_RESULT

  const [filtered, copies, group] = await Promise.all([
    loadLibrary(supabase, params.filters, params),
    loadCopies(supabase, user.id),
    params.groupId ? getGroup(params.groupId) : Promise.resolve(null),
  ])
  if (filtered === null) return { ...EMPTY_RESULT, available: false }

  const groupMissing = params.groupId !== null && group === null
  const fitGroup = group ? toFitGroup(group) : null
  const copiedIds = new Set(copies.keys())

  let entries = filtered.map((loaded) => toEntry(loaded, copies))
  let participantsUnknown = false
  if (fitGroup) {
    const summary = summarizeGroupFit(filtered.map((l) => l.exercise), fitGroup, copiedIds)
    participantsUnknown = summary.participantsUnknown
    entries = entries
      .filter((entry) => summary.fits.has(entry.exercise.id))
      .map((entry) => ({ ...entry, fit: summary.fits.get(entry.exercise.id) }))
  }

  // Nur bei leerer Liste: den ganzen Bestand ansehen, um jede Ursache zu nennen.
  let hasContent = filtered.length > 0 || entries.length > 0
  let emptyReasons: string[] = []
  if (entries.length === 0) {
    const all = hasActiveFilters(params.filters) ? await loadLibrary(supabase, null) : filtered
    hasContent = (all ?? []).length > 0
    if (all && all.length > 0) {
      const exercises = all.map((l) => l.exercise)
      if (fitGroup) {
        const unfiltered = summarizeGroupFit(exercises, fitGroup, copiedIds)
        emptyReasons =
          unfiltered.fits.size === 0
            ? explainEmptyGroupFit(exercises, fitGroup)
            : explainEmptyFilters(
                exercises.filter((e) => unfiltered.fits.has(e.id)),
                params.filters
              )
      } else {
        emptyReasons = explainEmptyFilters(exercises, params.filters)
      }
    }
  }

  return {
    available: true,
    hasContent,
    entries,
    group: group
      ? { id: group.id, name: group.name, noVenue: group.venue === null, participantsUnknown }
      : null,
    groupMissing,
    emptyReasons,
  }
}

/** Die Leseansicht. `null`, wenn die Übung nicht (mehr) sichtbar ist. */
export async function getLibraryEntry(id: string): Promise<LibraryEntry | null> {
  if (!z.uuid().safeParse(id).success) return null
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('library_exercises')
    .select('*')
    .eq('id', id)
    .in('status', VISIBLE_STATUSES)
    .maybeSingle()
  if (error || !data) return null

  const row = data as unknown as LibraryRow
  const [materialsRes, variantsRes, linksRes, copies] = await Promise.all([
    supabase.from('library_exercise_materials').select('*').eq('exercise_id', id).order('sort_order'),
    supabase.from('library_exercise_variants').select('*').eq('exercise_id', id).order('sort_order'),
    supabase.from('library_exercise_links').select('*').eq('exercise_id', id).order('sort_order'),
    loadCopies(supabase, user.id),
  ])

  return toEntry(
    {
      row,
      exercise: mapLibraryRow(
        row,
        (materialsRes.data ?? []) as MaterialRow[],
        (variantsRes.data ?? []) as VariantRow[],
        (linksRes.data ?? []) as LinkRow[],
      ),
    },
    copies
  )
}

/** Ob der Nutzer überhaupt etwas im Bestand sieht — für die Einstiege (Edge Case 11). */
export async function hasLibraryContent(): Promise<boolean> {
  const { supabase, user } = await getAuthUser()
  if (!user) return false
  const { count, error } = await supabase
    .from('library_exercises')
    .select('id', { count: 'exact', head: true })
    .in('status', VISIBLE_STATUSES)
  return !error && (count ?? 0) > 0
}

export interface LibraryOffer {
  /** Passt zu Sportart und Alter und ist noch nicht übernommen. */
  matching: number
  /** Davon: was der Generator sofort einplanen würde. */
  ready: number
}

/**
 * Für das Angebot nach dem Anlegen einer Gruppe — beide Zahlen, damit das
 * Angebot auch erscheint, wenn der Halle für alles noch Material fehlt
 * (vom Nutzer am 2026-10-18 so entschieden).
 */
export async function getLibraryOfferForGroup(groupId: string): Promise<LibraryOffer> {
  const none = { matching: 0, ready: 0 }
  const { supabase, user } = await getAuthUser()
  if (!user) return none

  const [all, copies, group] = await Promise.all([
    loadLibrary(supabase, null),
    loadCopies(supabase, user.id),
    getGroup(groupId),
  ])
  if (!all || !group) return none

  const copied = new Set(copies.keys())
  const summary = summarizeGroupFit(all.map((l) => l.exercise), toFitGroup(group), copied)
  return {
    matching: [...summary.fits.keys()].filter((id) => !copied.has(id)).length,
    ready: summary.preselected.length,
  }
}

const copyIdsSchema = z.array(z.uuid()).min(1).max(500)

interface CopyResponse {
  copied?: { library_id: string; exercise_id: string; name: string }[]
  already?: { library_id: string; exercise_id: string; name: string }[]
  unavailable?: { library_id: string }[]
}

/**
 * Übernehmen — eine oder viele, ganz oder gar nicht. Die Datenbank-Funktion
 * läuft mit den Rechten des Nutzers und kann deshalb nur in sein Konto
 * schreiben. Schon Übernommenes überspringt sie (zwei Tabs); ist eine Übung
 * nicht mehr im Bestand, schreibt sie nichts und nennt sie.
 */
export async function copyLibraryExercises(ids: string[]): Promise<CopyLibraryResult> {
  const parsed = copyIdsSchema.safeParse([...new Set(ids)])
  if (!parsed.success) return { error: GENERIC_COPY_ERROR }

  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data, error } = await supabase.rpc('copy_library_exercises', { p_ids: parsed.data })
  if (error || !data) return { error: GENERIC_COPY_ERROR }

  const response = data as unknown as CopyResponse
  if (response.unavailable && response.unavailable.length > 0) {
    return { unavailable: response.unavailable.map((u) => u.library_id) }
  }

  const copied = (response.copied ?? []).map((c) => ({
    libraryExerciseId: c.library_id,
    exerciseId: c.exercise_id,
    name: c.name,
  }))
  const alreadyCopied = (response.already ?? []).map((c) => ({
    libraryExerciseId: c.library_id,
    exerciseId: c.exercise_id,
    name: c.name,
  }))

  // Gleicher Name wie eine eigene Übung: übernommen, aber gesagt (C, Kriterium 7).
  let duplicateNames: string[] = []
  const names = [...new Set(copied.map((c) => c.name))]
  if (names.length > 0) {
    const { data: sameName } = await supabase
      .from('exercises')
      .select('name')
      .eq('user_id', user.id)
      .in('name', names)
    const counts = new Map<string, number>()
    for (const row of sameName ?? []) counts.set(row.name, (counts.get(row.name) ?? 0) + 1)
    duplicateNames = names.filter((name) => (counts.get(name) ?? 0) > 1)
  }

  return { copied, alreadyCopied, duplicateNames }
}
