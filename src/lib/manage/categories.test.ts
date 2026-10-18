import { describe, expect, it } from 'vitest'
import {
  categoryAnchor,
  categoryNameError,
  categoryNameMax,
  conflictMessage,
  findNameConflict,
  groupUsages,
  isCategoryType,
  newlyAddedCustom,
  predefinedDuplicates,
  renameFailure,
  sortCategories,
  totalUsage,
  usageSummary,
  withoutKnownCustoms,
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

describe('newlyAddedCustom', () => {
  it('meldet nur, was vorher nicht am Eintrag stand', () => {
    expect(newlyAddedCustom('sport', ['Parkour'], ['Parkour', 'Slackline'])).toEqual(['Slackline'])
  })

  it('meldet einen gelöschten Begriff nicht erneut, solange er nur stehen bleibt', () => {
    // „Parkour" wurde in der Verwaltung gelöscht, steht aber noch an der Übung.
    expect(newlyAddedCustom('sport', ['Parkour', 'Volleyball'], ['Parkour', 'Volleyball'])).toEqual([])
  })

  it('lässt vordefinierte Begriffe aus', () => {
    expect(newlyAddedCustom('sport', [], ['Volleyball', 'Slackline'])).toEqual(['Slackline'])
  })

  it('meldet bei einem neuen Eintrag alles Eigene, jedes einmal und ohne Leeres', () => {
    expect(newlyAddedCustom('material', [], ['Pezziball', ' Pezziball ', '', 'Ball'])).toEqual([
      'Pezziball',
    ])
  })

  it('vergleicht ohne Groß/Klein, auch mit dem Grundstock (PROJ-19)', () => {
    expect(newlyAddedCustom('material', ['reifen'], ['Pezzi', 'Reifen'])).toEqual(['Pezzi'])
    expect(newlyAddedCustom('material', ['pezzi'], ['Pezzi'])).toEqual([])
    expect(newlyAddedCustom('sport', [], ['gymnastik ', 'VOLLEYBALL', 'Zumba'])).toEqual(['Zumba'])
  })

  it('meldet einen Begriff in zwei Schreibweisen einmal, in der ersten', () => {
    expect(newlyAddedCustom('sport', [], ['Zumba', 'ZUMBA', 'zumba'])).toEqual(['Zumba'])
  })

  it('trägt „Kein Material" und „Ohne Material" nie als Material ein', () => {
    expect(newlyAddedCustom('material', [], ['Kein Material', 'ohne material', 'Pezzi'])).toEqual([
      'Pezzi',
    ])
    // Als Sportart wäre es ein gewöhnlicher Begriff.
    expect(newlyAddedCustom('sport', [], ['Ohne Material'])).toEqual(['Ohne Material'])
  })
})

describe('predefinedDuplicates', () => {
  it('findet eigene Begriffe, die der Grundstock mitliefert, mit dessen Schreibweise', () => {
    expect(
      predefinedDuplicates([
        { id: '1', category_type: 'sport', name: 'gymnastik' },
        { id: '2', category_type: 'material', name: 'Stufenbarren' },
        { id: '3', category_type: 'sport', name: 'Zumba' },
        { id: '4', category_type: 'age_group', name: 'Senioren (75+) ' },
      ])
    ).toEqual([
      { id: '1', type: 'sport', name: 'gymnastik', spelling: 'Gymnastik' },
      { id: '2', type: 'material', name: 'Stufenbarren', spelling: 'Stufenbarren' },
      { id: '4', type: 'age_group', name: 'Senioren (75+) ', spelling: 'Senioren (75+)' },
    ])
  })

  it('vergleicht nur innerhalb einer Art und übergeht unbekannte Arten', () => {
    expect(
      predefinedDuplicates([
        { id: '1', category_type: 'sport', name: 'Ball' },
        { id: '2', category_type: 'unbekannt', name: 'Ball' },
      ])
    ).toEqual([])
  })
})

describe('withoutKnownCustoms', () => {
  it('lässt weg, was es als eigenen Begriff derselben Art schon gibt — ohne Groß/Klein', () => {
    expect(
      withoutKnownCustoms(
        [
          { category_type: 'sport', name: 'ZUMBA' },
          { category_type: 'material', name: 'Zumba' },
          { category_type: 'sport', name: 'Parkour' },
        ],
        [{ category_type: 'sport', name: 'Zumba' }]
      )
    ).toEqual([
      { category_type: 'material', name: 'Zumba' },
      { category_type: 'sport', name: 'Parkour' },
    ])
  })

  it('meldet jeden Begriff einmal', () => {
    expect(
      withoutKnownCustoms(
        [
          { category_type: 'phase', name: 'Spiel' },
          { category_type: 'phase', name: 'spiel' },
        ],
        []
      )
    ).toEqual([{ category_type: 'phase', name: 'Spiel' }])
  })
})

describe('groupUsages', () => {
  it('gliedert nach Sorte und sortiert nach Namen', () => {
    expect(
      groupUsages([
        { kind: 'exercises', entry_name: 'Zirkel' },
        { kind: 'exercises', entry_name: 'ärmelfangen' },
        { kind: 'units', entry_name: 'Montag' },
      ])
    ).toEqual({
      exercises: ['ärmelfangen', 'Zirkel'],
      groups: [],
      venues: [],
      units: ['Montag'],
      patterns: [],
    })
  })

  it('übergeht unbekannte Sorten', () => {
    expect(groupUsages([{ kind: 'runs', entry_name: 'x' }]).exercises).toEqual([])
  })
})

describe('renameFailure', () => {
  it('erkennt die Ausnahmen der Datenbank-Funktion', () => {
    expect(renameFailure('category_not_found')).toBe('gone')
    expect(renameFailure('ERROR: name_taken')).toBe('taken')
    expect(renameFailure('invalid_name')).toBe('invalid')
    expect(renameFailure('connection reset')).toBe('other')
  })
})
