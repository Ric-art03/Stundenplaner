import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS, type Exercise } from '@/lib/types/exercise'
import { explainEmptyFilters, hasActiveFilters } from './filter-reasons'

function exercise(overrides: Partial<Exercise> = {}) {
  return {
    name: 'Feuer, Wasser, Sturm',
    description: 'Laufspiel',
    sports: ['Kinderturnen'],
    ageGroups: ['Kinder (4–6)'],
    phases: ['Aufwärmen'],
    organizationForms: ['Freie Verteilung (ganze Halle)'],
    difficulty: 'Leicht' as const,
    materials: [],
    ...overrides,
  }
}

const library = [
  exercise(),
  exercise({ sports: ['Gymnastik'], phases: ['Cool-Down'], materials: [{ name: 'Ball', quantity: 1, mode: 'insgesamt' }] }),
]

describe('explainEmptyFilters', () => {
  it('nennt eine Sportart ohne Übungen', () => {
    expect(explainEmptyFilters(library, { ...EMPTY_FILTERS, sports: ['Volleyball'] })).toEqual([
      'Für „Volleyball" gibt es in der Übungsdatenbank noch keine Übungen.',
    ])
  })

  it('nennt jeden Filter, der für sich leer ausgeht', () => {
    expect(
      explainEmptyFilters(library, { ...EMPTY_FILTERS, search: 'Zirkel', phases: ['Hauptteil'], difficulty: 'Schwer' })
    ).toEqual([
      'Keine Übung der Übungsdatenbank enthält „Zirkel".',
      'Für die Phase „Hauptteil" gibt es in der Übungsdatenbank noch keine Übungen.',
      'Mit dem Schwierigkeitsgrad „Schwer" gibt es in der Übungsdatenbank noch keine Übungen.',
    ])
  })

  it('wertet Material und „Ohne Material" als „oder"', () => {
    expect(explainEmptyFilters(library, { ...EMPTY_FILTERS, materials: ['Bock'], withoutMaterial: true })).toEqual([
      'Jeder Filter hat für sich Treffer, aber keine Übung erfüllt alle zugleich.',
    ])
    expect(explainEmptyFilters([library[1]], { ...EMPTY_FILTERS, materials: ['Bock'], withoutMaterial: true })).toEqual([
      'Mit „Bock" gibt es in der Übungsdatenbank noch keine Übungen.',
      'Ohne Material gibt es in der Übungsdatenbank noch keine Übungen.',
    ])
  })

  it('sagt, wenn es an der Kombination liegt', () => {
    expect(explainEmptyFilters(library, { ...EMPTY_FILTERS, sports: ['Gymnastik'], phases: ['Aufwärmen'] })).toEqual([
      'Jeder Filter hat für sich Treffer, aber keine Übung erfüllt alle zugleich.',
    ])
  })
})

describe('hasActiveFilters', () => {
  it('erkennt leere und gesetzte Filter', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: '  ' })).toBe(false)
    expect(hasActiveFilters({ ...EMPTY_FILTERS, withoutMaterial: true })).toBe(true)
  })
})
