import { predefinedSpelling } from '@/lib/categories/terms'
import { PHASES } from '@/lib/types/exercise'
import { LIST_SEPARATOR, type RawSheet } from './columns'
import type { LibrarySnapshot } from './diff'

/**
 * Die Abdeckung je Zielgruppe (PROJ-4, F): Sportart + Alter, gezählt je Phase
 * gegen 3 / 5 / 3. Eine Übung zählt für jede Zielgruppe, deren Sportart und
 * Alter sie trägt — Altersgruppen einer Variante eingeschlossen, denn der
 * Generator plant auch die Variante allein ein.
 */

export const COVERAGE_SHEET = 'Zielgruppen'
export const COVERAGE_COLUMNS = { sport: 'Sportart', ageGroups: 'Altersgruppen' } as const

export const TARGETS: Record<(typeof PHASES)[number], number> = {
  'Aufwärmen': 3,
  'Hauptteil': 5,
  'Cool-Down': 3,
}

export interface Target {
  row: number
  sport: string
  ageGroups: string[]
}

export interface TargetCoverage {
  target: Target
  counts: Record<string, number>
  covered: boolean
}

/** Die Liste der Zielgruppen lesen — mit denselben Schreibweise-Regeln wie ein Block. */
export function parseTargets(sheet: RawSheet): { targets: Target[]; errors: string[] } {
  const targets: Target[] = []
  const errors: string[] = []
  for (const row of sheet.rows) {
    const sport = (row.cells[COVERAGE_COLUMNS.sport] ?? '').trim()
    const ages = (row.cells[COVERAGE_COLUMNS.ageGroups] ?? '')
      .split(LIST_SEPARATOR)
      .map((a) => a.trim())
      .filter((a) => a !== '')
    if (sport === '' && ages.length === 0) continue

    if (predefinedSpelling('sport', sport) !== sport) {
      errors.push(`Zeile ${row.row}: „${sport}" ist keine Sportart des Grundstocks (oder anders geschrieben).`)
      continue
    }
    const bad = ages.filter((a) => predefinedSpelling('age_group', a) !== a)
    if (ages.length === 0 || bad.length > 0) {
      errors.push(
        ages.length === 0
          ? `Zeile ${row.row}: Altersgruppen fehlen.`
          : `Zeile ${row.row}: ${bad.map((a) => `„${a}"`).join(', ')} keine Altersgruppe des Grundstocks (oder anders geschrieben).`
      )
      continue
    }
    targets.push({ row: row.row, sport, ageGroups: ages })
  }
  return { targets, errors }
}

function ageGroupsOf(exercise: LibrarySnapshot): Set<string> {
  return new Set([...exercise.age_groups, ...exercise.variants.flatMap((v) => v.age_groups)])
}

export function coverage(targets: Target[], released: LibrarySnapshot[]): TargetCoverage[] {
  return targets.map((target) => {
    const matching = released.filter((exercise) => {
      if (!exercise.sports.includes(target.sport)) return false
      const ages = ageGroupsOf(exercise)
      return target.ageGroups.some((age) => ages.has(age))
    })
    const counts: Record<string, number> = {}
    for (const phase of PHASES) {
      counts[phase] = matching.filter((exercise) => exercise.phases.includes(phase)).length
    }
    const covered = PHASES.every((phase) => counts[phase] >= TARGETS[phase])
    return { target, counts, covered }
  })
}

/** „Kinderturnen, Kinder (4–6): Aufwärmen 3/3, Hauptteil 2/5, Cool-Down 1/3" */
export function describeCoverage(entry: TargetCoverage): string {
  const parts = PHASES.map((phase) => `${phase} ${entry.counts[phase]}/${TARGETS[phase]}`)
  return `${entry.covered ? '✓' : '·'} ${entry.target.sport}, ${entry.target.ageGroups.join(' + ')}: ${parts.join(', ')}`
}
