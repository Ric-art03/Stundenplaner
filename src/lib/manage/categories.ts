import {
  isPredefinedTerm,
  isReservedMaterialName,
  NO_MATERIAL_LABEL,
  normalizeTerm,
  predefinedSpelling,
  PREDEFINED_TERMS,
} from '@/lib/categories/terms'

/** Die fünf Arten eigener Kategorien, in der Reihenfolge der Verwaltung. */
export const CATEGORY_TYPES = ['sport', 'age_group', 'phase', 'organization_form', 'material'] as const
export type CategoryType = (typeof CATEGORY_TYPES)[number]

export const CATEGORY_LABELS: Record<CategoryType, { plural: string; singular: string }> = {
  sport: { plural: 'Sportarten', singular: 'Sportart' },
  age_group: { plural: 'Altersgruppen', singular: 'Altersgruppe' },
  phase: { plural: 'Phasen', singular: 'Phase' },
  organization_form: { plural: 'Organisationsformen', singular: 'Organisationsform' },
  material: { plural: 'Material', singular: 'Material' },
}

/** Der Grundstock (PROJ-19) — eine Quelle mit der Begriffsordnung. */
export const PREDEFINED_CATEGORIES: Record<CategoryType, readonly string[]> = PREDEFINED_TERMS

/**
 * Phasen sind kürzer begrenzt als die übrigen Arten: das Segment einer Einheit
 * fasst nur 60 Zeichen, eine längere Phase ließe sich nicht mehr einplanen.
 */
export function categoryNameMax(type: CategoryType): number {
  return type === 'phase' ? 60 : 100
}

export function isCategoryType(value: string): value is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(value)
}

/** Die Sprungmarke eines Abschnitts im Reiter „Kategorien". */
export function categoryAnchor(type: CategoryType): string {
  return `kategorie-${type.replace('_', '-')}`
}

/** Wie oft ein Begriff an welcher Sorte von Eintrag steht. */
export interface CategoryUsageCounts {
  exercises: number
  groups: number
  venues: number
  units: number
  patterns: number
}

export const USAGE_KINDS = ['exercises', 'groups', 'venues', 'units', 'patterns'] as const
export type UsageKind = (typeof USAGE_KINDS)[number]

const USAGE_WORDS: Record<UsageKind, [string, string]> = {
  exercises: ['Übung', 'Übungen'],
  groups: ['Gruppe', 'Gruppen'],
  venues: ['Halle', 'Hallen'],
  units: ['Einheit', 'Einheiten'],
  patterns: ['Stundenmuster', 'Stundenmuster'],
}

export const USAGE_HEADINGS: Record<UsageKind, string> = {
  exercises: 'Übungen',
  groups: 'Gruppen',
  venues: 'Hallen',
  units: 'Einheiten',
  patterns: 'Stundenmuster',
}

/** Die Namen der Einträge, an denen ein Begriff steht — je Sorte. */
export type CategoryUsages = Record<UsageKind, string[]>

export interface CustomCategory {
  id: string
  type: CategoryType
  name: string
  /** `null`, solange die Zählung nicht vorliegt. */
  usage: CategoryUsageCounts | null
}

export function totalUsage(counts: CategoryUsageCounts): number {
  return USAGE_KINDS.reduce((sum, kind) => sum + counts[kind], 0)
}

/** „12 Übungen · 2 Gruppen" — nur was nicht null ist; leer, wenn nichts verwendet wird. */
export function usageSummary(counts: CategoryUsageCounts): string {
  return USAGE_KINDS.filter((kind) => counts[kind] > 0)
    .map((kind) => `${counts[kind]} ${USAGE_WORDS[kind][counts[kind] === 1 ? 0 : 1]}`)
    .join(' · ')
}

function normalize(name: string): string {
  return name.trim().toLowerCase()
}

export type NameConflict = { kind: 'predefined' | 'custom'; name: string }

/**
 * Gibt es in dieser Art schon einen Begriff dieses Namens? Groß-/Kleinschreibung
 * macht keinen Unterschied. `exceptName` nimmt den Begriff aus, der gerade
 * umbenannt wird — „reifen" → „Reifen" ist kein Zusammenführen.
 */
export function findNameConflict(
  type: CategoryType,
  name: string,
  customNames: string[],
  exceptName?: string
): NameConflict | null {
  const wanted = normalize(name)

  const predefined = PREDEFINED_CATEGORIES[type].find((entry) => normalize(entry) === wanted)
  if (predefined) return { kind: 'predefined', name: predefined }

  const custom = customNames.find(
    (entry) => entry !== exceptName && normalize(entry) === wanted
  )
  return custom ? { kind: 'custom', name: custom } : null
}

/** Prüft nur die Form des Namens. */
export function categoryNameError(type: CategoryType, name: string): string | null {
  const trimmed = name.trim()
  if (trimmed === '') return 'Bitte gib einen Namen ein.'
  const max = categoryNameMax(type)
  if (trimmed.length > max) return `Höchstens ${max} Zeichen.`
  if (type === 'material' && isReservedMaterialName(trimmed)) {
    return `„${NO_MATERIAL_LABEL}" ist kein Material — bei einer Variante wählst du es eigens.`
  }
  return null
}

export function conflictMessage(conflict: NameConflict): string {
  return conflict.kind === 'predefined'
    ? `„${conflict.name}" gibt es schon — als mitgelieferten Begriff.`
    : `„${conflict.name}" gibt es schon — als eigenen Begriff.`
}

/**
 * Die eigenen Begriffe, die mit diesem Speichern neu an den Eintrag kommen —
 * nur sie werden in die Auswahllisten eingetragen. Was der Eintrag schon trug,
 * wird nicht erneut gemeldet: sonst käme ein in der Verwaltung gelöschter
 * Begriff beim nächsten Speichern von selbst zurück.
 *
 * Verglichen wird wie überall (PROJ-19): ohne Rand-Leerzeichen und ohne
 * Groß/Klein. „gymnastik" ist der mitgelieferte Begriff, kein eigener.
 */
export function newlyAddedCustom(
  type: CategoryType,
  before: readonly string[],
  after: readonly string[]
): string[] {
  const seen = new Set(before.map(normalizeTerm))
  const result: string[] = []
  for (const raw of after) {
    const name = raw.trim()
    const key = normalizeTerm(name)
    if (key === '' || seen.has(key)) continue
    seen.add(key)
    if (isPredefinedTerm(type, name)) continue
    if (type === 'material' && isReservedMaterialName(name)) continue
    result.push(name)
  }
  return result
}

export interface CategoryRow {
  id: string
  category_type: string
  name: string
}

/**
 * Die eigenen Begriffe, die der Grundstock inzwischen mitliefert — mit der
 * Schreibweise des Grundstocks. Sie gehen beim Laden im mitgelieferten auf
 * (PROJ-19, Abschnitt D).
 */
export function predefinedDuplicates(
  rows: readonly CategoryRow[]
): { id: string; type: CategoryType; name: string; spelling: string }[] {
  return rows.flatMap((row) => {
    if (!isCategoryType(row.category_type)) return []
    const spelling = predefinedSpelling(row.category_type, row.name)
    return spelling ? [{ id: row.id, type: row.category_type, name: row.name, spelling }] : []
  })
}

/**
 * Was davon noch nicht als eigener Begriff derselben Art besteht — auch nicht
 * in anderer Schreibweise. Die Datenbank prüft beim Eintragen nur genau.
 */
export function withoutKnownCustoms<T extends { category_type: string; name: string }>(
  entries: readonly T[],
  existing: readonly { category_type: string; name: string }[]
): T[] {
  const seen = new Set(existing.map((row) => `${row.category_type}:${normalizeTerm(row.name)}`))
  return entries.filter((entry) => {
    const key = `${entry.category_type}:${normalizeTerm(entry.name)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/** Die Zeilen von `category_usages`, nach Sorte gegliedert und nach Namen sortiert. */
export function groupUsages(rows: { kind: string; entry_name: string }[]): CategoryUsages {
  const usages: CategoryUsages = { exercises: [], groups: [], venues: [], units: [], patterns: [] }
  for (const row of rows) {
    if ((USAGE_KINDS as readonly string[]).includes(row.kind)) {
      usages[row.kind as UsageKind].push(row.entry_name)
    }
  }
  for (const kind of USAGE_KINDS) {
    usages[kind].sort((a, b) => a.localeCompare(b, 'de', { sensitivity: 'base' }))
  }
  return usages
}

/** Die Ausnahmen von `rename_category`, wie die Oberfläche sie unterscheidet. */
export function renameFailure(message: string): 'gone' | 'taken' | 'invalid' | 'other' {
  if (message.includes('category_not_found')) return 'gone'
  if (message.includes('name_taken')) return 'taken'
  if (message.includes('invalid_name')) return 'invalid'
  return 'other'
}

export function sortCategories<T extends { name: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
}
