import { describe, expect, it } from 'vitest'
import {
  categoryAnchor,
  categoryNameError,
  categoryNameMax,
  conflictMessage,
  findNameConflict,
  isCategoryType,
  sortCategories,
  totalUsage,
  usageSummary,
} from './categories'

const NONE = { exercises: 0, groups: 0, venues: 0, units: 0, patterns: 0 }

describe('categoryNameError', () => {
  it('lehnt leere Namen und reine Leerzeichen ab', () => {
    expect(categoryNameError('sport', '')).not.toBeNull()
    expect(categoryNameError('sport', '   ')).not.toBeNull()
  })

  it('erlaubt 100 Zeichen, bei Phasen nur 60', () => {
    expect(categoryNameMax('material')).toBe(100)
    expect(categoryNameMax('phase')).toBe(60)
    expect(categoryNameError('material', 'x'.repeat(100))).toBeNull()
    expect(categoryNameError('material', 'x'.repeat(101))).not.toBeNull()
    expect(categoryNameError('phase', 'x'.repeat(60))).toBeNull()
    expect(categoryNameError('phase', 'x'.repeat(61))).not.toBeNull()
  })

  it('misst die Länge ohne Leerzeichen am Rand', () => {
    expect(categoryNameError('phase', `  ${'x'.repeat(60)}  `)).toBeNull()
  })
})

describe('findNameConflict', () => {
  it('findet einen vordefinierten Begriff ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    expect(findNameConflict('phase', 'aufwärmen', [])).toEqual({
      kind: 'predefined',
      name: 'Aufwärmen',
    })
  })

  it('findet einen eigenen Begriff und nennt dessen Schreibweise', () => {
    expect(findNameConflict('material', ' wackelbrett ', ['Wackelbrett'])).toEqual({
      kind: 'custom',
      name: 'Wackelbrett',
    })
  })

  it('meldet nichts bei einem freien Namen', () => {
    expect(findNameConflict('material', 'Wackelbrett', ['Zauberschnur'])).toBeNull()
  })

  it('sieht denselben Namen in einer anderen Art nicht als Konflikt', () => {
    // „Aufwärmen" ist als Phase vordefiniert, als Material aber frei.
    expect(findNameConflict('material', 'Aufwärmen', [])).toBeNull()
  })

  it('nimmt beim Umbenennen den eigenen Begriff aus', () => {
    expect(findNameConflict('material', 'Klemmring', ['klemmring'], 'klemmring')).toBeNull()
  })

  it('findet beim Umbenennen einen anderen Begriff, der sich nur in der Schreibweise unterscheidet', () => {
    expect(findNameConflict('material', 'Klemmring', ['klemmring', 'Klemmring'], 'klemmring')).toEqual({
      kind: 'custom',
      name: 'Klemmring',
    })
  })

  it('sagt in der Meldung, ob der Begriff mitgeliefert oder eigen ist', () => {
    expect(conflictMessage({ kind: 'predefined', name: 'Aufwärmen' })).toContain('mitgeliefert')
    expect(conflictMessage({ kind: 'custom', name: 'Klemmring' })).toContain('eigenen')
  })
})

describe('Verwendungen', () => {
  it('nennt nur, was nicht null ist, mit Einzahl und Mehrzahl', () => {
    expect(usageSummary({ ...NONE, exercises: 12, groups: 1, patterns: 2 })).toBe(
      '12 Übungen · 1 Gruppe · 2 Stundenmuster'
    )
  })

  it('ist leer, wenn nichts verwendet wird', () => {
    expect(usageSummary(NONE)).toBe('')
    expect(totalUsage(NONE)).toBe(0)
  })

  it('zählt alle Sorten zusammen', () => {
    expect(totalUsage({ exercises: 1, groups: 2, venues: 3, units: 4, patterns: 5 })).toBe(15)
  })
})

describe('Hilfen', () => {
  it('erkennt die fünf Arten', () => {
    expect(isCategoryType('organization_form')).toBe(true)
    expect(isCategoryType('difficulty')).toBe(false)
  })

  it('baut eine Sprungmarke je Art', () => {
    expect(categoryAnchor('age_group')).toBe('kategorie-age-group')
  })

  it('sortiert alphabetisch ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    expect(sortCategories([{ name: 'zirkel' }, { name: 'Ball' }, { name: 'ärmel' }]).map((e) => e.name)).toEqual([
      'ärmel',
      'Ball',
      'zirkel',
    ])
  })
})
