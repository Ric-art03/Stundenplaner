import type { ExerciseFilters } from '@/lib/types/exercise'

/**
 * Die Filter der Übungsübersicht als Abfrage — ein Baustein für „Meine
 * Übungen" und die Übungsdatenbank (PROJ-4). Beide Tabellenreihen sind gleich
 * aufgebaut; nur die Namen unterscheiden sich. So kann ein Filter in einem
 * Reiter nicht anders wirken als im anderen.
 *
 * Der Materialfilter läuft in der Abfrage selbst, damit Seitenaufteilung und
 * Gesamtzahl stimmen. „Ohne Material" heißt: keine Materialzeile; mit Material
 * zusammen gilt „oder" (PROJ-19).
 */

export type MaterialsTable = 'exercise_materials' | 'library_exercise_materials'

/**
 * Die Filtermethoden, die hier gebraucht werden. Die Abfrage-Bausteine von
 * Supabase sind je Tabelle eigens typisiert; dieser Baustein arbeitet für
 * beide und gibt die Abfrage unverändert getypt zurück.
 */
interface FilterQuery {
  eq(column: string, value: unknown): FilterQuery
  in(column: string, values: readonly unknown[]): FilterQuery
  or(filters: string): FilterQuery
  is(column: string, value: null): FilterQuery
  contains(column: string, value: string): FilterQuery
}

function activeMaterials(filters: ExerciseFilters): string[] {
  return filters.materials.filter((name) => name.trim() !== '')
}

/** Was die Abfrage mitlesen muss, damit der Materialfilter greifen kann. */
export function exerciseSelect(materialsTable: MaterialsTable, filters: ExerciseFilters): string {
  const materials = activeMaterials(filters)
  const withoutMaterial = filters.withoutMaterial === true
  if (materials.length > 0 && withoutMaterial) {
    return `*, matched:${materialsTable}(name), anymat:${materialsTable}(id)`
  }
  if (materials.length > 0) return `*, matched:${materialsTable}!inner(name)`
  if (withoutMaterial) return `*, anymat:${materialsTable}(id)`
  return '*'
}

export function applyExerciseFilters<Q>(query: Q, filters: ExerciseFilters): Q {
  let q = query as unknown as FilterQuery
  const materials = activeMaterials(filters)
  const withoutMaterial = filters.withoutMaterial === true

  if (materials.length > 0) q = q.in('matched.name', materials)
  if (materials.length > 0 && withoutMaterial) {
    q = q.or('matched.not.is.null,anymat.is.null')
  } else if (withoutMaterial) {
    q = q.is('anymat', null)
  }

  if (filters.search) {
    const safe = filters.search.replace(/[,()"'\\]/g, '').trim()
    if (safe) q = q.or(`name.ilike.%${safe}%,description.ilike.%${safe}%`)
  }
  for (const sport of filters.sports) q = q.contains('sports', JSON.stringify([sport]))
  for (const ag of filters.ageGroups) q = q.contains('age_groups', JSON.stringify([ag]))
  for (const phase of filters.phases) q = q.contains('phases', JSON.stringify([phase]))
  if (filters.difficulty) q = q.eq('difficulty', filters.difficulty)
  for (const form of filters.organizationForms) {
    q = q.contains('organization_forms', JSON.stringify([form]))
  }
  if (filters.needsCompletion) q = q.eq('needs_completion', true)
  if (filters.participantsMin != null) {
    q = q.or(`participants_max.gte.${filters.participantsMin},participants_max.is.null`)
  }
  if (filters.participantsMax != null) {
    q = q.or(`participants_min.lte.${filters.participantsMax},participants_min.is.null`)
  }

  return q as unknown as Q
}
