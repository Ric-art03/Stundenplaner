import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS } from '@/lib/types/exercise'
import {
  DEFAULT_LIBRARY_PARAMS,
  exerciseListQuery,
  libraryEntryHref,
  libraryHref,
  libraryQuery,
  parseExercisesTab,
  parseExerciseListQuery,
  parseLibraryParams,
} from './address'

const GROUP = '0b9a6a3e-2f1c-4c55-9a51-1f2e3d4c5b6a'

describe('parseExercisesTab', () => {
  it('liest den Reiter und fällt sonst auf „Meine Übungen" zurück', () => {
    expect(parseExercisesTab(new URLSearchParams('tab=library'))).toBe('library')
    expect(parseExercisesTab({ tab: 'unsinn' })).toBe('mine')
    expect(parseExercisesTab({})).toBe('mine')
  })
})

describe('parseLibraryParams / libraryQuery', () => {
  it('liest und schreibt dieselben Werte (Hin und zurück)', () => {
    const params = {
      filters: {
        ...EMPTY_FILTERS,
        search: 'Ball',
        sports: ['Kinderturnen', 'Gymnastik'],
        ageGroups: ['Kinder (4–6)'],
        phases: ['Aufwärmen'],
        organizationForms: ['Kreis'],
        materials: ['Ball'],
        withoutMaterial: true,
        difficulty: 'Leicht' as const,
        participantsMin: 4,
        participantsMax: 20,
      },
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
      groupId: GROUP,
    }
    expect(parseLibraryParams(new URLSearchParams(libraryQuery(params)))).toEqual(params)
  })

  it('schreibt nur, was vom Standard abweicht', () => {
    expect(libraryQuery(DEFAULT_LIBRARY_PARAMS)).toBe('tab=library')
    expect(libraryHref({ groupId: GROUP })).toBe(`/exercises?tab=library&gruppe=${GROUP}`)
  })

  it('verwirft Unbekanntes statt die Seite zu stören', () => {
    const params = parseLibraryParams({
      schwierigkeit: 'Extrem',
      sortierung: 'drop-table',
      gruppe: 'javascript:alert(1)',
      tnMin: '-3',
      tnMax: 'viele',
      sportart: ['', 'Kinderturnen', 'Kinderturnen'],
    })
    expect(params.filters.difficulty).toBeNull()
    expect(params.sortField).toBe('addedAt')
    expect(params.sortDirection).toBe('desc')
    expect(params.groupId).toBeNull()
    expect(params.filters.participantsMin).toBeNull()
    expect(params.filters.participantsMax).toBeNull()
    expect(params.filters.sports).toEqual(['Kinderturnen'])
  })

  it('führt die Leseansicht mit derselben Liste zurück', () => {
    const params = { ...DEFAULT_LIBRARY_PARAMS, filters: { ...EMPTY_FILTERS, sports: ['Gymnastik'] } }
    expect(libraryEntryHref('abc', params)).toBe('/exercises/library/abc?tab=library&sportart=Gymnastik')
  })
})

describe('exerciseListQuery / parseExerciseListQuery (BUG-31)', () => {
  it('liest und schreibt dieselben Werte (Hin und zurück)', () => {
    const params = {
      filters: {
        ...EMPTY_FILTERS,
        search: 'Ball',
        sports: ['Turnen'],
        materials: ['Bank'],
        withoutMaterial: true,
        difficulty: 'Mittel' as const,
        participantsMax: 12,
        needsCompletion: true,
      },
      sortField: 'name' as const,
      sortDirection: 'asc' as const,
      offset: 50,
      limit: 50,
    }
    expect(parseExerciseListQuery(new URLSearchParams(exerciseListQuery(params)))).toEqual(params)
  })

  it('fällt bei Unsinn auf die Voreinstellung zurück und begrenzt Seite und Anzahl', () => {
    const parsed = parseExerciseListQuery(new URLSearchParams('sortierung=drop-table&ab=-3&anzahl=100000'))
    expect(parsed.sortField).toBe('updatedAt')
    expect(parsed.sortDirection).toBe('desc')
    expect(parsed.offset).toBe(0)
    expect(parsed.limit).toBe(100)
    expect(parseExerciseListQuery(new URLSearchParams('anzahl=abc')).limit).toBe(50)
  })

  it('„noch zu ergänzen" gilt nur für eigene Übungen, nie in der Übungsdatenbank', () => {
    expect(parseLibraryParams(new URLSearchParams('tab=library&zuErgaenzen=1')).filters.needsCompletion).toBe(false)
    expect(libraryQuery({ ...DEFAULT_LIBRARY_PARAMS, filters: { ...EMPTY_FILTERS, needsCompletion: true } })).toBe('tab=library')
  })
})
