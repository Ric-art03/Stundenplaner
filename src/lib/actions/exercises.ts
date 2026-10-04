'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import { exerciseSchema } from '@/lib/validations/exercise'

type ExerciseRow = Database['public']['Tables']['exercises']['Row']
type MaterialRow = Database['public']['Tables']['exercise_materials']['Row']
type VariantRow = Database['public']['Tables']['exercise_variants']['Row']
type LinkRow = Database['public']['Tables']['exercise_links']['Row']
import {
  SPORTS, AGE_GROUPS, PHASES, ORGANIZATION_FORMS, MATERIALS,
  type Exercise, type ExerciseFormData, type ExerciseFilters,
  type ExerciseSortField, type ExerciseSortDirection,
  type ExerciseMaterial, type ExerciseVariant, type ExerciseLink,
  type ExerciseImage, type DifficultyLevel,
} from '@/lib/types/exercise'

const PREDEFINED: Record<string, readonly string[]> = {
  sport: SPORTS,
  age_group: AGE_GROUPS,
  phase: PHASES,
  organization_form: ORGANIZATION_FORMS,
  material: MATERIALS,
}

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

function mapRowToExercise(
  row: ExerciseRow,
  materials: ExerciseMaterial[],
  variants: ExerciseVariant[],
  links: ExerciseLink[],
): Exercise {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description,
    notes: row.notes,
    workNotes: row.work_notes,
    sports: (row.sports as string[]) ?? [],
    ageGroups: (row.age_groups as string[]) ?? [],
    phases: (row.phases as string[]) ?? [],
    difficulty: row.difficulty as DifficultyLevel,
    organizationForms: (row.organization_forms as string[]) ?? [],
    duration: row.duration,
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
    musicRequired: row.music_required,
    musicLink: row.music_link,
    images: ((row.images as unknown as ExerciseImage[]) ?? []).filter((img) => img?.path),
    materials,
    variants,
    links,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function getExercises(
  filters: ExerciseFilters,
  sortField: ExerciseSortField,
  sortDirection: ExerciseSortDirection,
  offset: number,
  limit: number,
): Promise<{ exercises: Exercise[]; total: number }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { exercises: [], total: 0 }

  let query = supabase
    .from('exercises')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)

  if (filters.search) {
    const safe = filters.search.replace(/[,()"'\\]/g, '').trim()
    if (safe) {
      query = query.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
    }
  }
  if (filters.sports.length > 0) {
    for (const sport of filters.sports) {
      query = query.contains('sports', JSON.stringify([sport]))
    }
  }
  if (filters.ageGroups.length > 0) {
    for (const ag of filters.ageGroups) {
      query = query.contains('age_groups', JSON.stringify([ag]))
    }
  }
  if (filters.phases.length > 0) {
    for (const phase of filters.phases) {
      query = query.contains('phases', JSON.stringify([phase]))
    }
  }
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }
  if (filters.organizationForms.length > 0) {
    for (const form of filters.organizationForms) {
      query = query.contains('organization_forms', JSON.stringify([form]))
    }
  }
  if (filters.participantsMin != null) {
    query = query.or(`participants_max.gte.${filters.participantsMin},participants_max.is.null`)
  }
  if (filters.participantsMax != null) {
    query = query.or(`participants_min.lte.${filters.participantsMax},participants_min.is.null`)
  }

  const sortMap: Record<string, string> = {
    name: 'name',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    duration: 'duration',
    difficulty: 'difficulty',
  }
  const sortColumn = sortMap[sortField] ?? 'updated_at'
  query = query
    .order(sortColumn, { ascending: sortDirection === 'asc' })
    .range(offset, offset + limit - 1)

  const { data, count, error } = await query
  if (error || !data) return { exercises: [], total: 0 }

  const rows = data as unknown as ExerciseRow[]
  if (rows.length === 0) return { exercises: [], total: count ?? 0 }

  const exerciseIds = rows.map((r) => r.id)

  const [materialsRes, variantsRes, linksRes] = await Promise.all([
    supabase
      .from('exercise_materials')
      .select('*')
      .in('exercise_id', exerciseIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('exercise_variants')
      .select('*')
      .in('exercise_id', exerciseIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('exercise_links')
      .select('*')
      .in('exercise_id', exerciseIds)
      .order('sort_order', { ascending: true }),
  ])

  const materialsByExercise = groupBy(materialsRes.data as MaterialRow[] ?? [], 'exercise_id')
  const variantsByExercise = groupBy(variantsRes.data as VariantRow[] ?? [], 'exercise_id')
  const linksByExercise = groupBy(linksRes.data as LinkRow[] ?? [], 'exercise_id')

  // Material filter: check if exercise has any of the requested materials
  let filteredRows = rows
  if (filters.materials.length > 0) {
    const allMaterialRows = (materialsRes.data ?? []) as MaterialRow[]
    const exerciseIdsWithMaterials = new Set(
      allMaterialRows
        .filter((m) => filters.materials.includes(m.name))
        .map((m) => m.exercise_id)
    )
    if (filters.materials.includes('Kein Material')) {
      for (const row of rows) {
        if (!materialsByExercise[row.id] || materialsByExercise[row.id].length === 0) {
          exerciseIdsWithMaterials.add(row.id)
        }
      }
    }
    filteredRows = rows.filter((r) => exerciseIdsWithMaterials.has(r.id))
  }

  const exercises = filteredRows.map((row) =>
    mapRowToExercise(
      row,
      (materialsByExercise[row.id] ?? []).map(mapMaterial),
      (variantsByExercise[row.id] ?? []).map(mapVariant),
      (linksByExercise[row.id] ?? []).map(mapLink),
    )
  )

  return {
    exercises,
    total: filters.materials.length > 0 ? exercises.length : (count ?? 0),
  }
}

export async function getExercise(id: string): Promise<Exercise | null> {
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  const row = data as unknown as ExerciseRow

  const [materialsRes, variantsRes, linksRes] = await Promise.all([
    supabase.from('exercise_materials').select('*').eq('exercise_id', id).order('sort_order'),
    supabase.from('exercise_variants').select('*').eq('exercise_id', id).order('sort_order'),
    supabase.from('exercise_links').select('*').eq('exercise_id', id).order('sort_order'),
  ])

  return mapRowToExercise(
    row,
    ((materialsRes.data ?? []) as unknown as MaterialRow[]).map(mapMaterial),
    ((variantsRes.data ?? []) as unknown as VariantRow[]).map(mapVariant),
    ((linksRes.data ?? []) as unknown as LinkRow[]).map(mapLink),
  )
}

export async function createExercise(
  data: ExerciseFormData,
): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = exerciseSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { data: exercise, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      name: data.name,
      description: data.description,
      notes: data.notes || null,
      work_notes: data.workNotes || null,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      phases: data.phases as unknown as Json,
      difficulty: data.difficulty,
      organization_forms: data.organizationForms as unknown as Json,
      duration: data.duration,
      participants_min: data.participantsMin,
      participants_max: data.participantsMax,
      music_required: data.musicRequired,
      music_link: data.musicLink || null,
      images: (data.images.length > 0 ? data.images : null) as unknown as Json,
    })
    .select('id')
    .single()

  if (error || !exercise) return { error: 'Übung konnte nicht erstellt werden.' }

  await insertRelatedData(supabase, exercise.id, data)
  await saveCustomCategories(supabase, user.id, data)

  return { success: true, id: exercise.id }
}

export async function updateExercise(
  id: string,
  data: ExerciseFormData,
): Promise<{ success?: boolean; error?: string; id?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = exerciseSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { error } = await supabase
    .from('exercises')
    .update({
      name: data.name,
      description: data.description,
      notes: data.notes || null,
      work_notes: data.workNotes || null,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      phases: data.phases as unknown as Json,
      difficulty: data.difficulty,
      organization_forms: data.organizationForms as unknown as Json,
      duration: data.duration,
      participants_min: data.participantsMin,
      participants_max: data.participantsMax,
      music_required: data.musicRequired,
      music_link: data.musicLink || null,
      images: (data.images.length > 0 ? data.images : null) as unknown as Json,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Übung konnte nicht aktualisiert werden.' }

  await Promise.all([
    supabase.from('exercise_materials').delete().eq('exercise_id', id),
    supabase.from('exercise_links').delete().eq('exercise_id', id),
  ])

  await Promise.all([
    insertRelatedData(supabase, id, data, { skipVariants: true }),
    syncVariants(supabase, id, data.variants),
  ])
  await saveCustomCategories(supabase, user.id, data)

  return { success: true, id }
}

export async function deleteExercise(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase
    .from('exercises')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Übung konnte nicht gelöscht werden.' }
  return { success: true }
}

export async function getCustomCategories(): Promise<Record<string, string[]>> {
  const { supabase, user } = await getAuthUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('custom_categories')
    .select('category_type, name')
    .eq('user_id', user.id)
    .order('name')

  if (error || !data) return {}

  const grouped: Record<string, string[]> = {}
  for (const row of data) {
    if (!grouped[row.category_type]) grouped[row.category_type] = []
    grouped[row.category_type].push(row.name)
  }
  return grouped
}

// ---- Helpers ----

function variantRow(exerciseId: string, variant: ExerciseVariant, index: number) {
  return {
    exercise_id: exerciseId,
    title: variant.title,
    description: variant.description,
    materials: (variant.materials ?? []) as unknown as Json,
    participants_min: variant.participantsMin ?? null,
    participants_max: variant.participantsMax ?? null,
    duration: variant.duration ?? null,
    age_groups: (variant.ageGroups ?? []) as Json,
    organization_forms: (variant.organizationForms ?? []) as Json,
    sort_order: index,
  }
}

/**
 * Varianten werden beim Bearbeiten an ihrer Kennung fortgeschrieben, nicht
 * gelöscht und neu angelegt. Einheiten aus PROJ-6 verweisen auf genau diese
 * Kennung — beim Neuanlegen würde jede Korrektur an der Übung, selbst ein
 * Tippfehler im Namen, die eingeplante Variante aus allen Einheiten lösen.
 */
async function syncVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  variants: ExerciseVariant[],
) {
  const { data: existing } = await supabase
    .from('exercise_variants')
    .select('id')
    .eq('exercise_id', exerciseId)

  const kept = new Set(variants.map((v) => v.id).filter((id): id is string => Boolean(id)))
  const removed = ((existing ?? []) as { id: string }[])
    .map((row) => row.id)
    .filter((id) => !kept.has(id))

  if (removed.length > 0) {
    await supabase.from('exercise_variants').delete().in('id', removed)
  }

  const added = variants
    .map((variant, index) => ({ variant, index }))
    .filter((entry) => !entry.variant.id)

  await Promise.all([
    ...variants
      .map((variant, index) => ({ variant, index }))
      .filter((entry) => Boolean(entry.variant.id))
      .map((entry) =>
        supabase
          .from('exercise_variants')
          .update(variantRow(exerciseId, entry.variant, entry.index))
          .eq('id', entry.variant.id as string)
          .eq('exercise_id', exerciseId),
      ),
    ...(added.length > 0
      ? [
          supabase
            .from('exercise_variants')
            .insert(added.map((entry) => variantRow(exerciseId, entry.variant, entry.index))),
        ]
      : []),
  ])
}

async function insertRelatedData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  exerciseId: string,
  data: ExerciseFormData,
  options: { skipVariants?: boolean } = {},
) {
  const promises: PromiseLike<unknown>[] = []

  if (data.materials.length > 0) {
    promises.push(
      supabase.from('exercise_materials').insert(
        data.materials.map((m, i) => ({
          exercise_id: exerciseId,
          name: m.name,
          quantity: m.quantity,
          mode: m.mode,
          sort_order: i,
        }))
      ).select()
    )
  }

  if (!options.skipVariants && data.variants.length > 0) {
    promises.push(
      supabase
        .from('exercise_variants')
        .insert(data.variants.map((v, i) => variantRow(exerciseId, v, i)))
        .select()
    )
  }

  if (data.links.length > 0) {
    promises.push(
      supabase.from('exercise_links').insert(
        data.links.map((l, i) => ({
          exercise_id: exerciseId,
          url: l.url,
          title: l.title || null,
          sort_order: i,
        }))
      ).select()
    )
  }

  await Promise.all(promises)
}

async function saveCustomCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: ExerciseFormData,
) {
  const customs: { user_id: string; category_type: string; name: string }[] = []

  function collectCustom(items: string[], type: string) {
    const predefined = PREDEFINED[type]
    if (!predefined) return
    for (const item of items) {
      if (!(predefined as readonly string[]).includes(item)) {
        customs.push({ user_id: userId, category_type: type, name: item })
      }
    }
  }

  collectCustom(data.sports, 'sport')
  collectCustom(data.ageGroups, 'age_group')
  collectCustom(data.phases, 'phase')
  collectCustom(data.organizationForms, 'organization_form')
  collectCustom(data.materials.map((m) => m.name), 'material')

  if (customs.length > 0) {
    await supabase
      .from('custom_categories')
      .upsert(customs, { onConflict: 'user_id,category_type,name', ignoreDuplicates: true })
  }
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

function mapMaterial(row: MaterialRow): ExerciseMaterial {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    mode: row.mode as 'pro Teilnehmer' | 'insgesamt',
  }
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

function mapLink(row: LinkRow): ExerciseLink {
  return {
    id: row.id,
    url: row.url,
    title: row.title ?? undefined,
  }
}
