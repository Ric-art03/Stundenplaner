'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import { groupSchema, venueSchema } from '@/lib/validations/group'
import {
  SPORTS, AGE_GROUPS, MATERIALS,
  type Group, type GroupFormData, type GroupSchedule,
  type Venue, type VenueFormData, type VenueMaterial,
  type ScheduleType,
} from '@/lib/types/group'

type VenueRow = Database['public']['Tables']['venues']['Row']
type VenueMaterialRow = Database['public']['Tables']['venue_materials']['Row']
type GroupRow = Database['public']['Tables']['groups']['Row']
type ScheduleRow = Database['public']['Tables']['group_schedules']['Row']

const PREDEFINED: Record<string, readonly string[]> = {
  sport: SPORTS,
  age_group: AGE_GROUPS,
  material: MATERIALS,
}

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
    materials,
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
    sports: (row.sports as string[]) ?? [],
    ageGroups: (row.age_groups as string[]) ?? [],
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
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
  data: VenueFormData,
): Promise<{ id?: string; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

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

  await saveCustomMaterials(supabase, user.id, data.materials.map((m) => m.name))

  return { id: venue.id }
}

export async function updateVenue(
  id: string,
  data: VenueFormData,
): Promise<{ success?: boolean; error?: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

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

  await saveCustomMaterials(supabase, user.id, data.materials.map((m) => m.name))

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

  const { data: group, error } = await supabase
    .from('groups')
    .insert({
      user_id: user.id,
      name: data.name,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      participants_min: data.participantsMin,
      participants_max: data.participantsMax,
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

  await saveGroupCustomCategories(supabase, user.id, data)

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

  const { error } = await supabase
    .from('groups')
    .update({
      name: data.name,
      sports: data.sports as unknown as Json,
      age_groups: data.ageGroups as unknown as Json,
      participants_min: data.participantsMin,
      participants_max: data.participantsMax,
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

  await saveGroupCustomCategories(supabase, user.id, data)

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

async function saveCustomMaterials(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  materialNames: string[],
) {
  const customs = materialNames
    .filter((name) => !(MATERIALS as readonly string[]).includes(name))
    .map((name) => ({ user_id: userId, category_type: 'material', name }))

  if (customs.length > 0) {
    await supabase
      .from('custom_categories')
      .upsert(customs, { onConflict: 'user_id,category_type,name', ignoreDuplicates: true })
  }
}

async function saveGroupCustomCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  data: GroupFormData,
) {
  const customs: { user_id: string; category_type: string; name: string }[] = []

  for (const sport of data.sports) {
    if (!(SPORTS as readonly string[]).includes(sport)) {
      customs.push({ user_id: userId, category_type: 'sport', name: sport })
    }
  }
  for (const ag of data.ageGroups) {
    if (!(AGE_GROUPS as readonly string[]).includes(ag)) {
      customs.push({ user_id: userId, category_type: 'age_group', name: ag })
    }
  }

  if (customs.length > 0) {
    await supabase
      .from('custom_categories')
      .upsert(customs, { onConflict: 'user_id,category_type,name', ignoreDuplicates: true })
  }
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
