'use server'

import { createClient } from '@/lib/supabase/server'
import {
  categoryNameError,
  conflictMessage,
  findNameConflict,
  isCategoryType,
  sortCategories,
  type CategoryType,
  type CategoryUsages,
  type CustomCategory,
  type NameConflict,
} from '@/lib/manage/categories'

const GENERIC_ERROR = 'Das hat nicht geklappt — es wurde nichts geändert. Bitte versuche es erneut.'
const GONE_ERROR = 'Diesen Begriff gibt es nicht mehr.'
/** Bis die Datenbank-Funktionen aus `/backend` stehen. */
const NOT_CONNECTED = 'Umbenennen ist noch nicht angeschlossen — es wurde nichts geändert.'

async function getAuthUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { supabase, user: null }
  return { supabase, user }
}

/**
 * Alle eigenen Begriffe des Nutzers für die Verwaltung.
 *
 * Die Verwendungszahlen liefert künftig eine Datenbank-Funktion in einem
 * Aufruf; bis dahin ist `usage` leer und die Oberfläche zeigt keine Zahl.
 */
export async function getManagedCategories(): Promise<CustomCategory[]> {
  const { supabase, user } = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('custom_categories')
    .select('id, category_type, name')
    .eq('user_id', user.id)
    .limit(2000)

  if (error || !data) return []

  return sortCategories(
    data
      .filter((row) => isCategoryType(row.category_type))
      .map((row) => ({
        id: row.id,
        type: row.category_type as CategoryType,
        name: row.name,
        usage: null,
      }))
  )
}

/**
 * Die Namen der Einträge, an denen ein Begriff steht. Wird erst geholt, wenn
 * der Nutzer „Verwendungen ansehen" oder „Löschen" öffnet. `null` = liegt
 * (noch) nicht vor.
 */
export async function getCategoryUsages(id: string): Promise<CategoryUsages | null> {
  const { user } = await getAuthUser()
  if (!user || !id) return null
  return null
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

  // Das Umschreiben aller Verwendungen ist eine Datenbank-Funktion, die mit
  // `/backend` kommt. Ohne sie wird bewusst nichts geändert: nur die Zeile der
  // Kategorie umzubenennen ließe die Übungen mit dem alten Namen zurück.
  return { error: NOT_CONNECTED }
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
