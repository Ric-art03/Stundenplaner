import {
  AGE_GROUPS,
  MATERIALS,
  ORGANIZATION_FORMS,
  PHASES,
  SPORTS,
} from '@/lib/types/exercise'

/**
 * Die Begriffsordnung (PROJ-19): **eine** Reihenfolge für alle Auswahllisten
 * und Anzeigen der App. Eigene Begriffe stehen oben, alphabetisch; danach der
 * Grundstock in der Folge seiner Liste. Jede Stelle, die Begriffe zeigt, ordnet
 * hierüber, statt selbst zu sortieren.
 *
 * Begriffe, die weder im Grundstock stehen noch als eigene bekannt sind —
 * weggefallen wie „Vorschulturnen" oder in der Verwaltung gelöscht —, zählen
 * wie eigene: an der Übung sind sie das faktisch. Deshalb braucht das Ordnen
 * die Liste der eigenen Begriffe nicht.
 */

export type TermType = 'sport' | 'age_group' | 'phase' | 'organization_form' | 'material'

export const PREDEFINED_TERMS: Record<TermType, readonly string[]> = {
  sport: SPORTS,
  age_group: AGE_GROUPS,
  phase: PHASES,
  organization_form: ORGANIZATION_FORMS,
  material: MATERIALS,
}

/** Gleich ist, was ohne Rand-Leerzeichen und ohne Groß/Klein gleich ist. */
export function normalizeTerm(name: string): string {
  return name.trim().toLocaleLowerCase('de')
}

export function sameTerm(a: string, b: string): boolean {
  return normalizeTerm(a) === normalizeTerm(b)
}

const PREDEFINED_INDEX: Record<TermType, Map<string, number>> = Object.fromEntries(
  (Object.keys(PREDEFINED_TERMS) as TermType[]).map((type) => [
    type,
    new Map(PREDEFINED_TERMS[type].map((name, index) => [normalizeTerm(name), index])),
  ])
) as Record<TermType, Map<string, number>>

function predefinedIndex(type: TermType, name: string): number {
  return PREDEFINED_INDEX[type].get(normalizeTerm(name)) ?? -1
}

export function isPredefinedTerm(type: TermType, name: string): boolean {
  return predefinedIndex(type, name) >= 0
}

/** Die Schreibweise des Grundstocks, wenn der Begriff dazugehört. */
export function predefinedSpelling(type: TermType, name: string): string | null {
  const index = predefinedIndex(type, name)
  return index >= 0 ? PREDEFINED_TERMS[type][index] : null
}

function compareAlphabetically(a: string, b: string): number {
  return a.localeCompare(b, 'de', { sensitivity: 'base' })
}

/** Vergleich nach der Begriffsordnung — für `sort`. */
export function compareTerms(type: TermType): (a: string, b: string) => number {
  return (a, b) => {
    const ia = predefinedIndex(type, a)
    const ib = predefinedIndex(type, b)
    if (ia < 0 && ib < 0) return compareAlphabetically(a, b)
    if (ia < 0) return -1
    if (ib < 0) return 1
    return ia - ib
  }
}

/** Die Begriffe in der Begriffsordnung — für Chips, Karten, Listen. */
export function orderTerms(type: TermType, values: readonly string[]): string[] {
  return [...values].sort(compareTerms(type))
}

/** Einträge mit Namen (Materialzeilen, Hallenmaterial) in der Begriffsordnung. */
export function orderByTerm<T extends { name: string }>(type: TermType, items: readonly T[]): T[] {
  const compare = compareTerms(type)
  return [...items].sort((a, b) => compare(a.name, b.name))
}

/** Ohne Doppel; bei Gleichheit gewinnt der erste. */
function uniqueTerms(values: readonly string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const key = normalizeTerm(value)
    if (key === '' || seen.has(key)) continue
    seen.add(key)
    result.push(value)
  }
  return result
}

/**
 * Die Auswahlliste einer Art: eigene Begriffe oben, alphabetisch, dann der
 * Grundstock. Gleicht ein eigener Begriff einem mitgelieferten, steht nur der
 * mitgelieferte da — der eigene geht darin auf (Abschnitt D der Spec).
 */
export function termOptions(type: TermType, customs: readonly string[] = []): string[] {
  return orderTerms(type, uniqueTerms([...PREDEFINED_TERMS[type], ...customs]))
}

/**
 * Die Optionen ergänzt um Gewähltes, das in ihnen fehlt (weggefallen,
 * gelöscht, gerade eingetippt) — damit es sich abwählen lässt.
 */
export function withSelected(
  type: TermType,
  options: readonly string[],
  selected: readonly string[]
): string[] {
  return orderTerms(type, uniqueTerms([...options, ...selected]))
}

/**
 * Die Ausnahme im Generator: die Sportarten der Gruppe oben, alle übrigen
 * darunter — beide Blöcke in der Begriffsordnung.
 */
export function splitByGroup(
  type: TermType,
  options: readonly string[],
  groupTerms: readonly string[]
): { group: string[]; rest: string[] } {
  const group = orderTerms(type, uniqueTerms(groupTerms))
  const rest = options.filter((option) => !group.some((term) => sameTerm(term, option)))
  return { group, rest: orderTerms(type, rest) }
}

/** Der vorhandene Begriff, der dem eingetippten gleicht — oder `undefined`. */
export function findTerm(name: string, options: readonly string[]): string | undefined {
  return options.find((option) => sameTerm(option, name))
}

// ---- „Ohne Material" ----

/**
 * „Ohne Material" an einer Variante wird als einzelner Eintrag dieses Namens in
 * ihrer Materialliste gespeichert, so wie vor PROJ-19 „Kein Material". Der
 * Nutzer sieht ihn nie als Begriff; vorhandene Varianten und Stundenakten auf
 * Geräten bleiben damit gültig.
 */
export const NO_MATERIAL = 'Kein Material'
export const NO_MATERIAL_LABEL = 'Ohne Material'

export function isNoMaterial(name: string): boolean {
  return sameTerm(name, NO_MATERIAL)
}

/** Diese Namen lassen sich nicht als eigenes Material anlegen. */
export function isReservedMaterialName(name: string): boolean {
  return isNoMaterial(name) || sameTerm(name, NO_MATERIAL_LABEL)
}

/** Nur das echte Material — ohne den internen Eintrag. */
export function realMaterials<T extends { name: string }>(materials: readonly T[]): T[] {
  return materials.filter((material) => !isNoMaterial(material.name))
}

export type VariantMaterialMode = 'inherit' | 'own' | 'none'

/**
 * Leer → wie die Hauptübung; nur der interne Eintrag → ohne Material; sonst
 * eigenes Material. Steht der Eintrag neben echtem Material (Altbestand), gilt
 * das echte Material.
 */
export function variantMaterialMode(materials: readonly { name: string }[] | undefined | null): VariantMaterialMode {
  const list = materials ?? []
  if (list.length === 0) return 'inherit'
  return realMaterials(list).length === 0 ? 'none' : 'own'
}

export function noMaterialEntry(): { name: string; quantity: number; mode: 'insgesamt' } {
  return { name: NO_MATERIAL, quantity: 1, mode: 'insgesamt' }
}
