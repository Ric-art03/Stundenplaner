import { describe, expect, it } from 'vitest'
import {
  findTerm,
  isNoMaterial,
  isPredefinedTerm,
  isReservedMaterialName,
  noMaterialEntry,
  orderByTerm,
  orderTerms,
  predefinedSpelling,
  realMaterials,
  sameTerm,
  splitByGroup,
  termOptions,
  variantMaterialMode,
  withSelected,
} from './terms'
import { AGE_GROUPS, MATERIALS, ORGANIZATION_FORMS, PHASES, SPORTS } from '@/lib/types/exercise'

describe('Grundstock', () => {
  it('liefert die Sportarten in der festgelegten Reihenfolge', () => {
    expect(SPORTS).toEqual([
      'Krabbelgruppe', 'Eltern-Kind-Turnen', 'Kinderturnen', 'Kinderspiele',
      'Seniorensport', 'Gymnastik', 'Fitness/Workout',
      'Rehabilitation/Prävention', 'Therapie', 'Schwimmen', 'Turnen', 'Tanzen',
      'Kampfsport', 'Leichtathletik', 'Basketball', 'Fußball', 'Handball',
      'Volleyball', 'Abenteuer und Erlebnis', 'Teambuilding',
    ])
  })

  it('hat die Größen aus der Spec', () => {
    expect(SPORTS).toHaveLength(20)
    expect(AGE_GROUPS).toHaveLength(11)
    expect(PHASES).toHaveLength(3)
    expect(ORGANIZATION_FORMS).toHaveLength(9)
    expect(MATERIALS).toHaveLength(23)
  })

  it('enthält keinen weggefallenen Begriff', () => {
    const all: readonly string[] = [...SPORTS, ...AGE_GROUPS, ...ORGANIZATION_FORMS, ...MATERIALS]
    for (const gone of [
      'Vorschulturnen', 'Allgemeinsport', 'Eltern-Kind Turnen', '1-gegen-1',
      'Senioren (60+)', 'Kreis / Sitzkreis', 'Tor/Netz', 'Kein Material',
    ]) {
      expect(all).not.toContain(gone)
    }
  })

  it('hat in keiner Art einen Begriff doppelt', () => {
    for (const list of [SPORTS, AGE_GROUPS, PHASES, ORGANIZATION_FORMS, MATERIALS]) {
      const normalized = list.map((name) => name.toLowerCase())
      expect(new Set(normalized).size).toBe(list.length)
    }
  })
})

describe('sameTerm', () => {
  it('vergleicht ohne Groß/Klein und ohne Rand-Leerzeichen', () => {
    expect(sameTerm(' gymnastik ', 'Gymnastik')).toBe(true)
    expect(sameTerm('ÜBUNG', 'übung')).toBe(true)
    expect(sameTerm('Ball', 'Bälle')).toBe(false)
  })
})

describe('orderTerms', () => {
  it('stellt eigene Begriffe alphabetisch vor den Grundstock', () => {
    expect(orderTerms('sport', ['Volleyball', 'Zumba', 'Turnen', 'capoeira'])).toEqual([
      'capoeira', 'Zumba', 'Turnen', 'Volleyball',
    ])
  })

  it('ordnet den Grundstock nach seiner Liste, nicht alphabetisch', () => {
    expect(orderTerms('phase', ['Cool-Down', 'Aufwärmen', 'Hauptteil'])).toEqual([
      'Aufwärmen', 'Hauptteil', 'Cool-Down',
    ])
  })

  it('zählt weggefallene Begriffe wie eigene', () => {
    expect(orderTerms('sport', ['Kinderturnen', 'Vorschulturnen'])).toEqual([
      'Vorschulturnen', 'Kinderturnen',
    ])
  })

  it('erkennt den Grundstock auch in anderer Schreibweise', () => {
    expect(orderTerms('sport', ['Turnen', 'gymnastik'])).toEqual(['gymnastik', 'Turnen'])
  })

  it('lässt die Eingabe unverändert', () => {
    const input = ['Volleyball', 'Turnen']
    orderTerms('sport', input)
    expect(input).toEqual(['Volleyball', 'Turnen'])
  })
})

describe('orderByTerm', () => {
  it('ordnet Materialzeilen nach der Begriffsordnung', () => {
    const rows = [
      { name: 'Weichbodenmatte', quantity: 1 },
      { name: 'Hütchen', quantity: 8 },
      { name: 'Ball', quantity: 1 },
    ]
    expect(orderByTerm('material', rows).map((r) => r.name)).toEqual([
      'Ball', 'Hütchen', 'Weichbodenmatte',
    ])
  })
})

describe('termOptions', () => {
  it('bringt eigene Begriffe vor den Grundstock', () => {
    const options = termOptions('sport', ['Zumba', 'Capoeira'])
    expect(options.slice(0, 3)).toEqual(['Capoeira', 'Zumba', 'Krabbelgruppe'])
    expect(options.at(-1)).toBe('Teambuilding')
  })

  it('lässt einen eigenen Begriff im gleichnamigen mitgelieferten aufgehen', () => {
    const options = termOptions('material', ['stufenbarren'])
    expect(options.filter((o) => sameTerm(o, 'Stufenbarren'))).toEqual(['Stufenbarren'])
    expect(options).toHaveLength(MATERIALS.length)
  })

  it('entfernt Doppel unter den eigenen Begriffen', () => {
    expect(termOptions('phase', ['Spiel', 'spiel'])).toEqual([
      'Spiel', 'Aufwärmen', 'Hauptteil', 'Cool-Down',
    ])
  })
})

describe('withSelected', () => {
  it('ergänzt Gewähltes, das in den Optionen fehlt, an seinem Platz', () => {
    const options = termOptions('sport')
    const result = withSelected('sport', options, ['Vorschulturnen', 'Turnen'])
    expect(result[0]).toBe('Vorschulturnen')
    expect(result.filter((o) => o === 'Turnen')).toHaveLength(1)
  })
})

describe('splitByGroup', () => {
  it('stellt die Sportarten der Gruppe in Listenfolge oben hin', () => {
    const { group, rest } = splitByGroup('sport', termOptions('sport', ['Zumba']), [
      'Volleyball',
      'Kinderturnen',
    ])
    expect(group).toEqual(['Kinderturnen', 'Volleyball'])
    expect(rest[0]).toBe('Zumba')
    expect(rest[1]).toBe('Krabbelgruppe')
    expect(rest).not.toContain('Volleyball')
    expect(rest).not.toContain('Kinderturnen')
  })

  it('behält eine Sportart der Gruppe, die es nicht mehr gibt', () => {
    const { group } = splitByGroup('sport', termOptions('sport'), ['Allgemeinsport'])
    expect(group).toEqual(['Allgemeinsport'])
  })
})

describe('findTerm und Grundstock', () => {
  it('findet den vorhandenen Begriff zur Eingabe', () => {
    expect(findTerm('  gymnastik', termOptions('sport'))).toBe('Gymnastik')
    expect(findTerm('Zumba', termOptions('sport'))).toBeUndefined()
  })

  it('kennt Zugehörigkeit und Schreibweise des Grundstocks', () => {
    expect(isPredefinedTerm('material', 'tor')).toBe(true)
    expect(isPredefinedTerm('sport', 'Ball')).toBe(false)
    expect(predefinedSpelling('sport', 'eltern-kind-turnen')).toBe('Eltern-Kind-Turnen')
    expect(predefinedSpelling('sport', 'Zumba')).toBeNull()
  })
})

describe('„Ohne Material"', () => {
  it('erkennt den internen Eintrag und sperrt beide Namen', () => {
    expect(isNoMaterial('kein material')).toBe(true)
    expect(isReservedMaterialName('Ohne Material')).toBe(true)
    expect(isReservedMaterialName('Kein Material ')).toBe(true)
    expect(isReservedMaterialName('Ball')).toBe(false)
  })

  it('liest die drei Zustände einer Variante ab', () => {
    expect(variantMaterialMode(undefined)).toBe('inherit')
    expect(variantMaterialMode([])).toBe('inherit')
    expect(variantMaterialMode([noMaterialEntry()])).toBe('none')
    expect(variantMaterialMode([{ name: 'Ball' }])).toBe('own')
  })

  it('lässt echtes Material neben dem Eintrag gelten (Altbestand)', () => {
    const list = [noMaterialEntry(), { name: 'Ball', quantity: 2, mode: 'insgesamt' as const }]
    expect(variantMaterialMode(list)).toBe('own')
    expect(realMaterials(list).map((m) => m.name)).toEqual(['Ball'])
  })
})
