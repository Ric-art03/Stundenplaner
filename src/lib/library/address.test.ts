import { describe, expect, it } from 'vitest'
import { EMPTY_FILTERS } from '@/lib/types/exercise'
import {
  DEFAULT_LIBRARY_PARAMS,
  libraryEntryHref,
  libraryHref,
  libraryQuery,
  parseExercisesTab,
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
