import {
  AGE_GROUPS,
  MATERIALS,
  ORGANIZATION_FORMS,
  PHASES,
  SPORTS,
} from '@/lib/types/exercise'

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

export const PREDEFINED_CATEGORIES: Record<CategoryType, readonly string[]> = {
  sport: SPORTS,
  age_group: AGE_GROUPS,
  phase: PHASES,
  organization_form: ORGANIZATION_FORMS,
  material: MATERIALS,
}

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
  return null
}

export function conflictMessage(conflict: NameConflict): string {
  return conflict.kind === 'predefined'
    ? `„${conflict.name}" gibt es schon — als mitgelieferten Begriff.`
    : `„${conflict.name}" gibt es schon — als eigenen Begriff.`
}

export function sortCategories<T extends { name: string }>(entries: T[]): T[] {
  return [...entries].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
}
