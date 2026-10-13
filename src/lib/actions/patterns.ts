'use server'

import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/lib/database.types'
import {
  patternNameSchema,
  savePatternSchema,
  type SavePatternInput,
} from '@/lib/validations/pattern'
import {
  MAX_PATTERNS,
  findPatternByName,
  sortPatterns,
  type PatternSegment,
  type UnitPattern,
} from '@/lib/units/patterns'

type PatternRow = Database['public']['Tables']['unit_patterns']['Row']

const GENERIC_ERROR = 'Das hat nicht geklappt — es wurde nichts geändert. Bitte versuche es erneut.'
const GONE_ERROR = 'Dieses Stundenmuster gibt es nicht mehr.'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

function mapPattern(row: PatternRow): UnitPattern {
  return {
    id: row.id,
    name: row.name,
    totalMinutes: row.total_minutes,
    segments: (row.segments as unknown as PatternSegment[]) ?? [],
  }
}

export async function getPatterns(): Promise<UnitPattern[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('unit_patterns')
    .select('*')
    .eq('user_id', user.id)
    .limit(MAX_PATTERNS)

  if (error || !data) return []
  return sortPatterns(data.map(mapPattern))
}

export type SavePatternResult =
  | { pattern: UnitPattern }
  /** Den Namen trägt schon ein anderes Muster — der Aufrufer fragt nach und überschreibt dann dieses. */
  | { nameTaken: { id: string; name: string } }
  | { error: string; gone?: boolean }

/**
 * Legt ein Stundenmuster an oder überschreibt eines (`id` gesetzt). Trägt ein
 * anderes Muster den Namen schon, wird nichts geschrieben.
 */
export async function savePattern(input: SavePatternInput): Promise<SavePatternResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = savePatternSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Das Stundenmuster ist unvollständig.' }
  }
  const { id, name, totalMinutes, segments } = parsed.data

  const existing = await getPatterns()
  const sameName = findPatternByName(existing, name, id)
  if (sameName) return { nameTaken: { id: sameName.id, name: sameName.name } }

  if (id) {
    const { data, error } = await supabase
      .from('unit_patterns')
      .update({
        name,
        total_minutes: totalMinutes,
        segments: segments as unknown as Json,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select('*')

    if (error) return { error: GENERIC_ERROR }
    if (!data || data.length === 0) return { error: GONE_ERROR, gone: true }
    return { pattern: mapPattern(data[0]) }
  }

  if (existing.length >= MAX_PATTERNS) {
    return {
      error:
        `Du hast bereits ${MAX_PATTERNS} Stundenmuster — mehr geht nicht. ` +
        'Lösche in der Verwaltung eines, das du nicht mehr brauchst, oder überschreibe ein vorhandenes.',
    }
  }

  const { data, error } = await supabase
    .from('unit_patterns')
    .insert({
      user_id: user.id,
      name,
      total_minutes: totalMinutes,
      segments: segments as unknown as Json,
    })
    .select('*')
    .single()

  if (error || !data) return { error: GENERIC_ERROR }
  return { pattern: mapPattern(data) }
}

export async function renamePattern(
  id: string,
  name: string
): Promise<{ success: true; name: string } | { error: string; gone?: boolean }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const parsed = patternNameSchema.safeParse(name)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ungültiger Name.' }

  const existing = await getPatterns()
  if (findPatternByName(existing, parsed.data, id)) {
    return { error: `Ein Stundenmuster „${parsed.data}" gibt es schon.` }
  }

  const { data, error } = await supabase
    .from('unit_patterns')
    .update({ name: parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { error: GENERIC_ERROR }
  if (!data || data.length === 0) return { error: GONE_ERROR, gone: true }
  return { success: true, name: parsed.data }
}

export async function deletePattern(
  id: string
): Promise<{ success: true } | { error: string; gone?: boolean }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data, error } = await supabase
    .from('unit_patterns')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { error: GENERIC_ERROR }
  if (!data || data.length === 0) return { error: GONE_ERROR, gone: true }
  return { success: true }
}
