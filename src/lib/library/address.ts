import {
  DIFFICULTY_LEVELS,
  EMPTY_FILTERS,
  type ExerciseFilters,
  type ExerciseSortDirection,
  type ExerciseSortField,
} from '@/lib/types/exercise'
import type { LibrarySortDirection, LibrarySortField } from '@/lib/types/library'

/**
 * Die Seite „Übungen" trägt Reiter, Filter, Sortierung und Gruppe in der
 * Adresse (PROJ-4). Daraus ergeben sich Neuladen, „Zurück" aus der Leseansicht
 * mit denselben Filtern und die Einstiege mit vorbelegter Gruppe, ohne dass
 * sich die App etwas merken muss.
 *
 * Gelesen wird misstrauisch: Unbekanntes fällt weg, statt die Seite zu stören —
 * und ein „Zurück"-Verweis wird immer aus den gelesenen Werten neu gebaut, nie
 * aus dem, was in der Adresse stand.
 */

export const EXERCISE_TABS = ['mine', 'library'] as const
export type ExercisesTab = (typeof EXERCISE_TABS)[number]

export const EXERCISE_TAB_LABELS: Record<ExercisesTab, string> = {
  mine: 'Meine Übungen',
  library: 'Übungsdatenbank',
}

export function isExercisesTab(value: unknown): value is ExercisesTab {
  return typeof value === 'string' && (EXERCISE_TABS as readonly string[]).includes(value)
}

export interface LibraryParams {
  filters: ExerciseFilters
  sortField: LibrarySortField
  sortDirection: LibrarySortDirection
  groupId: string | null
}

export const DEFAULT_LIBRARY_PARAMS: LibraryParams = {
  filters: EMPTY_FILTERS,
  sortField: 'addedAt',
  sortDirection: 'desc',
  groupId: null,
}

const SORT_FIELDS: LibrarySortField[] = ['addedAt', 'name', 'duration', 'difficulty']
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const MAX_VALUE_LENGTH = 100
const MAX_VALUES = 30

/** Ein lesbarer Zugriff auf beide Formen, die Next.js liefert. */
type Source = URLSearchParams | Record<string, string | string[] | undefined>

function all(source: Source, key: string): string[] {
  const raw = source instanceof URLSearchParams ? source.getAll(key) : source[key]
  const values = raw === undefined ? [] : Array.isArray(raw) ? raw : [raw]
  return [...new Set(values.map((v) => v.trim()).filter((v) => v !== '' && v.length <= MAX_VALUE_LENGTH))].slice(0, MAX_VALUES)
}

function one(source: Source, key: string): string | null {
  return all(source, key)[0] ?? null
}

function positiveInt(value: string | null): number | null {
  if (value === null || !/^\d{1,4}$/.test(value)) return null
  const n = Number(value)
  return n >= 1 ? n : null
}

export function parseExercisesTab(source: Source): ExercisesTab {
  const tab = one(source, 'tab')
  return isExercisesTab(tab) ? tab : 'mine'
}

/** Die Filter aus einer Adresse — dieselben Schlüssel für beide Reiter. */
function parseFilters(source: Source): ExerciseFilters {
  const difficulty = one(source, 'schwierigkeit')
  return {
    ...EMPTY_FILTERS,
    search: (one(source, 'suche') ?? '').slice(0, MAX_VALUE_LENGTH),
    sports: all(source, 'sportart'),
    ageGroups: all(source, 'alter'),
    phases: all(source, 'phase'),
    organizationForms: all(source, 'form'),
    materials: all(source, 'material'),
    withoutMaterial: one(source, 'ohneMaterial') === '1',
    difficulty: (DIFFICULTY_LEVELS as readonly string[]).includes(difficulty ?? '')
      ? (difficulty as ExerciseFilters['difficulty'])
      : null,
    participantsMin: positiveInt(one(source, 'tnMin')),
    participantsMax: positiveInt(one(source, 'tnMax')),
    needsCompletion: one(source, 'zuErgaenzen') === '1',
  }
}

/** Nur gesetzte Filter, damit die Adresse kurz bleibt. */
function appendFilters(query: URLSearchParams, f: ExerciseFilters): void {
  if (f.search.trim()) query.set('suche', f.search.trim())
  for (const v of f.sports) query.append('sportart', v)
  for (const v of f.ageGroups) query.append('alter', v)
  for (const v of f.phases) query.append('phase', v)
  for (const v of f.organizationForms) query.append('form', v)
  for (const v of f.materials) query.append('material', v)
  if (f.withoutMaterial) query.set('ohneMaterial', '1')
  if (f.difficulty) query.set('schwierigkeit', f.difficulty)
  if (f.participantsMin != null) query.set('tnMin', String(f.participantsMin))
  if (f.participantsMax != null) query.set('tnMax', String(f.participantsMax))
  if (f.needsCompletion) query.set('zuErgaenzen', '1')
}

export function parseLibraryParams(source: Source): LibraryParams {
  const [field, direction] = (one(source, 'sortierung') ?? '').split('-')
  const group = one(source, 'gruppe')

  return {
    // „noch zu ergänzen" gibt es nur an eigenen Übungen.
    filters: { ...parseFilters(source), needsCompletion: false },
    sortField: SORT_FIELDS.includes(field as LibrarySortField) ? (field as LibrarySortField) : 'addedAt',
    sortDirection: direction === 'asc' || direction === 'desc' ? direction : 'desc',
    groupId: group && UUID.test(group) ? group.toLowerCase() : null,
  }
}

/** Nur was vom Standard abweicht, damit die Adresse kurz bleibt. */
export function libraryQuery(params: LibraryParams): string {
  const query = new URLSearchParams()
  query.set('tab', 'library')
  appendFilters(query, { ...params.filters, needsCompletion: false })
  if (params.sortField !== 'addedAt' || params.sortDirection !== 'desc') {
    query.set('sortierung', `${params.sortField}-${params.sortDirection}`)
  }
  if (params.groupId) query.set('gruppe', params.groupId)
  return query.toString()
}

/** Die Übungsdatenbank, wahlweise mit vorbelegter Gruppe — für alle Einstiege. */
export function libraryHref(params: Partial<LibraryParams> = {}): string {
  return `/exercises?${libraryQuery({ ...DEFAULT_LIBRARY_PARAMS, ...params })}`
}

/** Die Leseansicht einer Übung; sie trägt die Liste mit, um dorthin zurückzuführen. */
export function libraryEntryHref(id: string, params: LibraryParams): string {
  return `/exercises/library/${id}?${libraryQuery(params)}`
}

/**
 * Die Liste von „Meine Übungen" als Abfrage an `/api/exercises` (BUG-31).
 * Gelesen wird über eine gewöhnliche Abfrage statt einer Server-Aktion:
 * Server-Aktionen stehen in der Warteschlange des Routers, und eine, die
 * während einer Navigation zurückkommt, setzte den alten Seitenstand wieder
 * ein — die Adresse wechselte, der Inhalt nicht.
 */
export interface ExerciseListParams {
  filters: ExerciseFilters
  sortField: ExerciseSortField
  sortDirection: ExerciseSortDirection
  offset: number
  limit: number
}

const EXERCISE_SORT_FIELDS: ExerciseSortField[] = ['name', 'updatedAt', 'createdAt', 'duration', 'difficulty']
const MAX_LIMIT = 100

export function exerciseListQuery(params: ExerciseListParams): string {
  const query = new URLSearchParams()
  appendFilters(query, params.filters)
  query.set('sortierung', `${params.sortField}-${params.sortDirection}`)
  query.set('ab', String(params.offset))
  query.set('anzahl', String(params.limit))
  return query.toString()
}

export function parseExerciseListQuery(source: Source): ExerciseListParams {
  const [field, direction] = (one(source, 'sortierung') ?? '').split('-')
  const offset = Number(one(source, 'ab'))
  const limit = Number(one(source, 'anzahl'))
  return {
    filters: parseFilters(source),
    sortField: EXERCISE_SORT_FIELDS.includes(field as ExerciseSortField) ? (field as ExerciseSortField) : 'updatedAt',
    sortDirection: direction === 'asc' ? 'asc' : 'desc',
    offset: Number.isInteger(offset) && offset >= 0 && offset <= 100_000 ? offset : 0,
    limit: Number.isInteger(limit) && limit >= 1 ? Math.min(limit, MAX_LIMIT) : 50,
  }
}
