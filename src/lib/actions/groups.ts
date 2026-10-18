'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import { groupSchema, venueSchema } from '@/lib/validations/group'
import {
  type Group, type GroupFormData, type GroupSchedule,
  type Venue, type VenueFormData, type VenueMaterial,
  type ScheduleType,
} from '@/lib/types/group'
import { newlyAddedCustom } from '@/lib/manage/categories'
import { addCustomCategories } from '@/lib/categories/custom-store'
import { orderByTerm, orderTerms } from '@/lib/categories/terms'
import {
  materialImpacts,
  materialLosses,
  type MaterialImpact,
} from '@/lib/manage/venue-materials'
import type { ExerciseVariantMaterial, MaterialMode } from '@/lib/types/exercise'

type VenueRow = Database['public']['Tables']['venues']['Row']
type VenueMaterialRow = Database['public']['Tables']['venue_materials']['Row']
type GroupRow = Database['public']['Tables']['groups']['Row']
type ScheduleRow = Database['public']['Tables']['group_schedules']['Row']

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

// ---- Venue helpers ----

function mapVenueRow(row: VenueRow, materials: VenueMaterial[]): Venue {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    notes: row.notes,
    // Geordnet beim Lesen (PROJ-19), wie an der Übung.
    materials: orderByTerm('material', materials),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapVenueMaterialRow(row: VenueMaterialRow): VenueMaterial {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
  }
}

// ---- Group helpers ----

function mapGroupRow(
  row: GroupRow,
  schedules: GroupSchedule[],
  venue: Venue | null,
): Group {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    sports: orderTerms('sport', (row.sports as string[]) ?? []),
    ageGroups: orderTerms('age_group', (row.age_groups as string[]) ?? []),
    primarySport: row.primary_sport,
    participants: row.participants,
    unitDuration: row.unit_duration,
    venueId: row.venue_id,
    venue,
    schedules,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function mapScheduleRow(row: ScheduleRow): GroupSchedule {
  return {
    id: row.id,
    scheduleType: (row.schedule_type ?? 'recurring') as ScheduleType,
    weekday: row.weekday ?? '',
    date: row.date ?? null,
    startTime: row.start_time.slice(0, 5),
    endTime: row.end_time.slice(0, 5),
  }
}

// ---- Venue CRUD ----

export async function getVenues(): Promise<Venue[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data: venueRows, error } = await supabase
    .from('venues')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error || !venueRows) return []

  if (venueRows.length === 0) return []

  const venueIds = venueRows.map((v) => v.id)
  const { data: materialRows } = await supabase
    .from('venue_materials')
    .select('*')
    .in('venue_id', venueIds)
    .order('sort_order')

  const materialsByVenue = groupBy(materialRows ?? [], 'venue_id')

  return (venueRows as VenueRow[]).map((row) =>
    mapVenueRow(
      row,
      (materialsByVenue[row.id] ?? []).map(mapVenueMaterialRow),
    )
  )
}

export async function getVenue(id: string): Promise<Venue | null> {
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  const { data: materialRows } = await supabase
    .from('venue_materials')
    .select('*')
    .eq('venue_id', id)
    .order('sort_order')

  return mapVenueRow(
    data as VenueRow,
    ((materialRows ?? []) as VenueMaterialRow[]).map(mapVenueMaterialRow),
  )
}

export async function createVenue(
  rawData: VenueFormData,
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const data = { ...rawData, materials: rawData.materials.filter((m) => m.name.trim() !== '') }
  const parsed = venueSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { data: existing } = await supabase
    .from('venues')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', data.name.trim())
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: `Eine Halle mit dem Namen "${data.name.trim()}" existiert bereits.` }
  }

  const { data: venue, error } = await supabase
    .from('venues')
    .insert({
      user_id: user.id,
      name: data.name,
      notes: data.notes || null,
    })
    .select('id')
    .single()

  if (error || !venue) return { error: 'Halle konnte nicht erstellt werden.' }

  if (data.materials.length > 0) {
    await supabase.from('venue_materials').insert(
      data.materials.map((m, i) => ({
        venue_id: venue.id,
        name: m.name,
        quantity: m.quantity,
        sort_order: i,
      }))
    )
  }

  await saveCustomMaterials(supabase, user.id, data.materials.map((m) => m.name), [])

  return { id: venue.id }
}

export async function updateVenue(
  id: string,
  rawData: VenueFormData,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const data = { ...rawData, materials: rawData.materials.filter((m) => m.name.trim() !== '') }
  const parsed = venueSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { data: existing } = await supabase
    .from('venues')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', data.name.trim())
    .neq('id', id)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: `Eine Halle mit dem Namen "${data.name.trim()}" existiert bereits.` }
  }

  const { error } = await supabase
    .from('venues')
    .update({
      name: data.name,
      notes: data.notes || null,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Halle konnte nicht aktualisiert werden.' }

  const { data: materialsBefore, error: beforeError } = await supabase
    .from('venue_materials')
    .select('name')
    .eq('venue_id', id)

  await supabase.from('venue_materials').delete().eq('venue_id', id)

  if (data.materials.length > 0) {
    await supabase.from('venue_materials').insert(
      data.materials.map((m, i) => ({
        venue_id: id,
        name: m.name,
        quantity: m.quantity,
        sort_order: i,
      }))
    )
  }

  await saveCustomMaterials(
    supabase,
    user.id,
    data.materials.map((m) => m.name),
    beforeError ? null : (materialsBefore ?? []).map((row) => row.name),
  )

  return { success: true }
}

export async function deleteVenue(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Halle konnte nicht gelöscht werden.' }
  return { success: true }
}

/**
 * Was ein geändertes Hallenmaterial für den Generator bedeutet: je Material,
 * das wegfällt oder weniger wird, die betroffenen Gruppen und die Zahl der
 * Übungen, die für sie nicht mehr eingeplant werden (PROJ-16). Gerechnet wird
 * gegen den gespeicherten Stand der Halle, nicht gegen das, was der Browser
 * für den alten Stand hält.
 */
export async function getVenueMaterialImpact(
  venueId: string,
  materials: VenueMaterial[],
): Promise<{ impacts?: MaterialImpact[]; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const failed = { error: 'Die Folgen ließen sich gerade nicht ermitteln.' }

  const [beforeRes, groupsRes] = await Promise.all([
    supabase.from('venue_materials').select('name, quantity').eq('venue_id', venueId),
    supabase
      .from('groups')
      .select('name, participants')
      .eq('user_id', user.id)
      .eq('venue_id', venueId),
  ])
  if (beforeRes.error || groupsRes.error) return failed

  const groups = (groupsRes.data ?? []) as { name: string; participants: number | null }[]
  const before = (beforeRes.data ?? []) as { name: string; quantity: number }[]
  const losses = materialLosses(before, materials)
  if (groups.length === 0 || losses.length === 0) return { impacts: [] }

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from('exercises')
    .select('id')
    .eq('user_id', user.id)
  if (exerciseError) return failed

  const ids = (exerciseRows ?? []).map((row) => row.id)
  if (ids.length === 0) return { impacts: [] }

  const [materialsRes, variantsRes] = await Promise.all([
    supabase.from('exercise_materials').select('exercise_id, name, quantity, mode').in('exercise_id', ids),
    supabase.from('exercise_variants').select('exercise_id, materials').in('exercise_id', ids),
  ])
  if (materialsRes.error || variantsRes.error) return failed

  const exercises = ids.map((id) => ({
    materials: (materialsRes.data ?? [])
      .filter((row) => row.exercise_id === id)
      .map((row) => ({ name: row.name, quantity: row.quantity, mode: row.mode as MaterialMode })),
    variants: (variantsRes.data ?? [])
      .filter((row) => row.exercise_id === id)
      .map((row) => ({
        title: '',
        description: '',
        materials: (row.materials as unknown as ExerciseVariantMaterial[] | null) ?? [],
      })),
  }))

  return { impacts: materialImpacts(before, losses, groups, exercises) }
}

export async function getVenuesWithGroupCount(): Promise<(Venue & { groupCount: number; groupNames: string[] })[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const [venuesResult, groupsResult] = await Promise.all([
    getVenues(),
    supabase
      .from('groups')
      .select('name, venue_id')
      .eq('user_id', user.id)
      .not('venue_id', 'is', null),
  ])

  const groupsByVenue: Record<string, string[]> = {}
  for (const g of (groupsResult.data ?? []) as { name: string; venue_id: string | null }[]) {
    if (!g.venue_id) continue
    if (!groupsByVenue[g.venue_id]) groupsByVenue[g.venue_id] = []
    groupsByVenue[g.venue_id].push(g.name)
  }

  return venuesResult.map((v) => ({
    ...v,
    groupCount: groupsByVenue[v.id]?.length ?? 0,
    groupNames: groupsByVenue[v.id] ?? [],
  }))
}

// ---- Group CRUD ----

export async function getGroups(): Promise<Group[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data: groupRows, error } = await supabase
    .from('groups')
    .select('*')
    .eq('user_id', user.id)
    .order('name')

  if (error || !groupRows) return []
  if (groupRows.length === 0) return []

  const rows = groupRows as GroupRow[]
  const groupIds = rows.map((r) => r.id)
  const venueIds = rows.map((r) => r.venue_id).filter((id): id is string => id != null)

  const [schedulesRes, venuesData] = await Promise.all([
    supabase
      .from('group_schedules')
      .select('*')
      .in('group_id', groupIds)
      .order('sort_order'),
    venueIds.length > 0
      ? (async () => {
          const { data: vRows } = await supabase
            .from('venues')
            .select('*')
            .in('id', venueIds)
          const vIds = (vRows ?? []).map((v) => v.id)
          const { data: mRows } = vIds.length > 0
            ? await supabase.from('venue_materials').select('*').in('venue_id', vIds).order('sort_order')
            : { data: [] }
          const matByVenue = groupBy(mRows ?? [], 'venue_id')
          const venueMap: Record<string, Venue> = {}
          for (const v of (vRows ?? []) as VenueRow[]) {
            venueMap[v.id] = mapVenueRow(v, (matByVenue[v.id] ?? []).map(mapVenueMaterialRow))
          }
          return venueMap
        })()
      : Promise.resolve({} as Record<string, Venue>),
  ])

  const schedulesByGroup = groupBy((schedulesRes.data ?? []) as ScheduleRow[], 'group_id')

  return rows.map((row) =>
    mapGroupRow(
      row,
      (schedulesByGroup[row.id] ?? []).map(mapScheduleRow),
      row.venue_id ? (venuesData[row.venue_id] ?? null) : null,
    )
  )
}

export async function getGroup(id: string): Promise<Group | null> {
  const { supabase, user } = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return null

  const row = data as GroupRow

  const [schedulesRes, venue] = await Promise.all([
    supabase.from('group_schedules').select('*').eq('group_id', id).order('sort_order'),
    row.venue_id ? getVenue(row.venue_id) : Promise.resolve(null),
  ])

  return mapGroupRow(
    row,
    ((schedulesRes.data ?? []) as ScheduleRow[]).map(mapScheduleRow),
    venue,
  )
}

export async function createGroup(
  data: GroupFormData,
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = groupSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', data.name.trim())
    .limit(1)

  if (existingGroup && existingGroup.length > 0) {
    return { error: `Eine Gruppe mit dem Namen "${data.name.trim()}" existiert bereits.` }
  }

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      user_id: user.id,
      name: data.name,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      primary_sport: data.primarySport,
      participants: data.participants,
      unit_duration: data.unitDuration,
      venue_id: data.venueId,
    })
    .select('id')
    .single()

  if (error || !group) return { error: 'Gruppe konnte nicht erstellt werden.' }

  if (data.schedules.length > 0) {
    await supabase.from('group_schedules').insert(
      data.schedules.map((s, i) => ({
        group_id: group.id,
        schedule_type: s.scheduleType,
        weekday: s.scheduleType === 'recurring' ? s.weekday : null,
        date: s.scheduleType === 'one_time' ? s.date : null,
        start_time: s.startTime,
        end_time: s.endTime,
        sort_order: i,
      }))
    )
  }

  await saveGroupCustomCategories(supabase, user.id, data, { sports: [], ageGroups: [] })

  return { id: group.id }
}

export async function updateGroup(
  id: string,
  data: GroupFormData,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = groupSchema.safeParse(data)
  if (!parsed.success) return { error: 'Ungültige Eingabe.' }

  const { data: existingGroup } = await supabase
    .from('groups')
    .select('id')
    .eq('user_id', user.id)
    .ilike('name', data.name.trim())
    .neq('id', id)
    .limit(1)

  if (existingGroup && existingGroup.length > 0) {
    return { error: `Eine Gruppe mit dem Namen "${data.name.trim()}" existiert bereits.` }
  }

  const { data: groupBefore } = await supabase
    .from('groups')
    .select('sports, age_groups')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('groups')
    .update({
      name: data.name,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      primary_sport: data.primarySport,
      participants: data.participants,
      unit_duration: data.unitDuration,
      venue_id: data.venueId,
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gruppe konnte nicht aktualisiert werden.' }

  await supabase.from('group_schedules').delete().eq('group_id', id)

  if (data.schedules.length > 0) {
    await supabase.from('group_schedules').insert(
      data.schedules.map((s, i) => ({
        group_id: id,
        schedule_type: s.scheduleType,
        weekday: s.scheduleType === 'recurring' ? s.weekday : null,
        date: s.scheduleType === 'one_time' ? s.date : null,
        start_time: s.startTime,
        end_time: s.endTime,
        sort_order: i,
      }))
    )
  }

  await saveGroupCustomCategories(
    supabase,
    user.id,
    data,
    groupBefore
      ? {
          sports: (groupBefore.sports as string[]) ?? [],
          ageGroups: (groupBefore.age_groups as string[]) ?? [],
        }
      : null,
  )

  return { success: true }
}

export async function deleteGroup(
  id: string,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { error } = await supabase
    .from('groups')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: 'Gruppe konnte nicht gelöscht werden.' }
  return { success: true }
}

// ---- Custom category helpers ----

// Eingetragen wird nur, was mit diesem Speichern neu an den Eintrag gekommen
// ist. Was er schon trug, wird nicht erneut eingetragen — sonst käme ein in der
// Verwaltung gelöschter Begriff von selbst zurück (PROJ-16). `before` ist der
// Stand vor dem Speichern; `null` heißt, er ließ sich nicht lesen, und dann
// wird nichts eingetragen statt alles.

async function saveCustomMaterials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  materialNames: string[],
  before: string[] | null,
) {
  if (!before) return

  await addCustomCategories(
    supabase,
    userId,
    newlyAddedCustom('material', before, materialNames)
      .map((name) => ({ category_type: 'material' as const, name })),
  )
}

async function saveGroupCustomCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: GroupFormData,
  before: { sports: string[]; ageGroups: string[] } | null,
) {
  if (!before) return

  await addCustomCategories(supabase, userId, [
    ...newlyAddedCustom('sport', before.sports, data.sports)
      .map((name) => ({ category_type: 'sport' as const, name })),
    ...newlyAddedCustom('age_group', before.ageGroups, data.ageGroups)
      .map((name) => ({ category_type: 'age_group' as const, name })),
  ])
}

// ---- Generic helpers ----

function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const k = String(item[key])
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}
