'use server'

import { createClient } from '@/lib/supabase/server'
import { absorbPredefinedCustoms } from '@/lib/categories/custom-store'
import {
  categoryNameError,
  conflictMessage,
  findNameConflict,
  groupUsages,
  isCategoryType,
  renameFailure,
  sortCategories,
  type CategoryType,
  type CategoryUsages,
  type CustomCategory,
  type NameConflict,
} from '@/lib/manage/categories'

const GENERIC_ERROR = 'Das hat nicht geklappt — es wurde nichts geändert. Bitte versuche es erneut.'
const GONE_ERROR = 'Diesen Begriff gibt es nicht mehr.'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

/**
 * Alle eigenen Begriffe des Nutzers für die Verwaltung, mit den
 * Verwendungszahlen aus einem Aufruf. Scheitert die Zählung, bleibt `usage`
 * leer und die Oberfläche zeigt keine Zahl — statt einer falschen Null.
 */
export async function getManagedCategories(): Promise<CustomCategory[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const rowsRes = await supabase
    .from('custom_categories')
    .select('id, category_type, name')
    .eq('user_id', user.id)
    .limit(2000)

  if (rowsRes.error || !rowsRes.data) return []

  // Erst aufgehen lassen, dann zählen: die Zählung eines aufgegangenen
  // Begriffs gehört zum mitgelieferten, der hier nicht steht.
  const rows = await absorbPredefinedCustoms(supabase, rowsRes.data)
  const countsRes = await supabase.rpc('category_usage_counts')

  const counts = countsRes.error
    ? null
    : new Map((countsRes.data ?? []).map((row) => [row.category_id, row]))

  return sortCategories(
    rows
      .filter((row) => isCategoryType(row.category_type))
      .map((row) => {
        const count = counts?.get(row.id)
        return {
          id: row.id,
          type: row.category_type as CategoryType,
          name: row.name,
          usage: counts
            ? {
                exercises: count?.exercises ?? 0,
                groups: count?.groups ?? 0,
                venues: count?.venues ?? 0,
                units: count?.units ?? 0,
                patterns: count?.patterns ?? 0,
              }
            : null,
        }
      })
  )
}

/**
 * Die Namen der Einträge, an denen ein Begriff steht. Wird erst geholt, wenn
 * der Nutzer „Verwendungen ansehen" oder „Löschen" öffnet. `null` = ließ sich
 * nicht holen.
 */
export async function getCategoryUsages(id: string): Promise<CategoryUsages | null> {
  const { supabase, user } = await getAuthUser()
  if (!user || !id) return null

  const { data: category, error: readError } = await supabase
    .from('custom_categories')
    .select('category_type, name')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (readError || !category) return null

  const { data, error } = await supabase.rpc('category_usages', {
    p_type: category.category_type,
    p_name: category.name,
  })

  if (error || !data) return null
  return groupUsages(data)
}

export async function createCategory(
  type: CategoryType,
  name: string
): Promise<{ category: CustomCategory } | { error: string }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }
  if (!isCategoryType(type)) return { error: 'Unbekannte Art.' }

  const formError = categoryNameError(type, name)
  if (formError) return { error: formError }
  const trimmed = name.trim()

  const { data: existing, error: readError } = await supabase
    .from('custom_categories')
    .select('name')
    .eq('user_id', user.id)
    .eq('category_type', type)
    .limit(2000)

  if (readError) return { error: GENERIC_ERROR }

  const conflict = findNameConflict(type, trimmed, (existing ?? []).map((row) => row.name))
  if (conflict) return { error: conflictMessage(conflict) }

  const { data, error } = await supabase
    .from('custom_categories')
    .insert({ user_id: user.id, category_type: type, name: trimmed })
    .select('id, name')
    .single()

  if (error || !data) return { error: GENERIC_ERROR }

  return {
    category: {
      id: data.id,
      type,
      name: data.name,
      usage: { exercises: 0, groups: 0, venues: 0, units: 0, patterns: 0 },
    },
  }
}

export type RenameCategoryResult =
  | { success: true; name: string; merged: boolean; affected: number }
  /** Den Namen gibt es schon — der Aufrufer fragt nach und ruft mit `merge` erneut auf. */
  | { conflict: NameConflict }
  | { error: string; gone?: boolean }

/**
 * Benennt einen eigenen Begriff überall um, wo er steht. Gleicht der neue Name
 * einem vorhandenen Begriff derselben Art, wird ohne `merge` nichts geändert.
 */
export async function renameCategory(
  id: string,
  newName: string,
  merge = false
): Promise<RenameCategoryResult> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data: rows, error: readError } = await supabase
    .from('custom_categories')
    .select('id, category_type, name')
    .eq('user_id', user.id)
    .limit(2000)

  if (readError || !rows) return { error: GENERIC_ERROR }

  const current = rows.find((row) => row.id === id)
  if (!current || !isCategoryType(current.category_type)) return { error: GONE_ERROR, gone: true }
  const type = current.category_type

  const formError = categoryNameError(type, newName)
  if (formError) return { error: formError }

  const conflict = findNameConflict(
    type,
    newName,
    rows.filter((row) => row.category_type === type).map((row) => row.name),
    current.name
  )
  if (conflict && !merge) return { conflict }

  // Alle Verwendungen und die Kategorienliste in einem Zug — alles oder nichts.
  // Ob der neue Name ein mitgelieferter Begriff ist, weiß nur der Server; ob er
  // einem anderen eigenen gleicht, prüft die Datenbank selbst noch einmal.
  const { data, error } = await supabase.rpc('rename_category', {
    p_id: id,
    p_new_name: conflict?.kind === 'predefined' ? conflict.name : newName.trim(),
    p_merge: merge,
    p_predefined: conflict?.kind === 'predefined',
  })

  if (error) {
    const failure = renameFailure(error.message)
    if (failure === 'gone') return { error: GONE_ERROR, gone: true }
    // Zwischen Prüfung und Aufruf hat ein anderer Tab den Namen vergeben.
    if (failure === 'taken') return { conflict: { kind: 'custom', name: newName.trim() } }
    if (failure === 'invalid') return { error: 'Dieser Name ist nicht zulässig.' }
    return { error: GENERIC_ERROR }
  }

  const result = data as { name?: unknown; merged?: unknown; affected?: unknown } | null
  if (!result || typeof result.name !== 'string') return { error: GENERIC_ERROR }

  return {
    success: true,
    name: result.name,
    merged: result.merged === true,
    affected: typeof result.affected === 'number' ? result.affected : 0,
  }
}

/**
 * Nimmt den Begriff aus den Auswahllisten. Bestehende Übungen, Gruppen, Hallen
 * und Einheiten behalten ihn.
 */
export async function deleteCategory(
  id: string
): Promise<{ success: true } | { error: string; gone?: boolean }> {
  const { supabase, user } = await getAuthUser()
  if (!user) return { error: 'Nicht angemeldet.' }

  const { data, error } = await supabase
    .from('custom_categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .select('id')

  if (error) return { error: GENERIC_ERROR }
  if (!data || data.length === 0) return { error: GONE_ERROR, gone: true }
  return { success: true }
}
