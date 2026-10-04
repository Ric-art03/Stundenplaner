import { describe, it, expect } from 'vitest'
import { buildCandidates, effectiveMaterials } from './candidates'
import type { Exercise, ExerciseVariant } from '@/lib/types/exercise'

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'e1',
    userId: 'u1',
    name: 'Reifen-Parcours',
    description: 'Beschreibung',
    sports: ['Turnen'],
    ageGroups: ['Kinder (4–6)'],
    phases: ['Hauptteil'],
    difficulty: 'Mittel',
    organizationForms: ['Stationsbetrieb'],
    duration: 15,
    participantsMin: 6,
    participantsMax: 20,
    musicRequired: false,
    images: [],
    materials: [{ name: 'Reifen', quantity: 6, mode: 'insgesamt' }],
    variants: [],
    links: [],
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    ...overrides,
  }
}

function variant(overrides: Partial<ExerciseVariant> = {}): ExerciseVariant {
  return {
    id: 'v1',
    title: 'Mit Turnmatten',
    description: 'Variante',
    ...overrides,
  }
}

describe('effectiveMaterials', () => {
  it('nimmt das Material der Hauptübung, wenn die Variante keines trägt', () => {
    expect(effectiveMaterials(exercise(), variant())).toEqual([
      { name: 'Reifen', quantity: 6, mode: 'insgesamt' },
    ])
  })

  it('ersetzt die Liste vollständig, wenn die Variante eigenes Material trägt', () => {
    const result = effectiveMaterials(
      exercise(),
      variant({ materials: [{ name: 'Turnmatte', quantity: 4, mode: 'insgesamt' }] })
    )
    expect(result).toEqual([{ name: 'Turnmatte', quantity: 4, mode: 'insgesamt' }])
    expect(result.some((m) => m.name === 'Reifen')).toBe(false)
  })

  it('behandelt eine leere Liste als „erbt" und nicht als „kein Material"', () => {
    expect(effectiveMaterials(exercise(), variant({ materials: [] }))).toEqual([
      { name: 'Reifen', quantity: 6, mode: 'insgesamt' },
    ])
  })

  it('nimmt „Kein Material" der Variante als bewusste Ersetzung', () => {
    expect(
      effectiveMaterials(
        exercise(),
        variant({ materials: [{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }] })
      )
    ).toEqual([{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }])
  })

  it('kommt ohne Variante zurecht', () => {
    expect(effectiveMaterials(exercise())).toEqual([
      { name: 'Reifen', quantity: 6, mode: 'insgesamt' },
    ])
  })
})

describe('buildCandidates', () => {
  it('erzeugt je Hauptübung einen Kandidaten', () => {
    const result = buildCandidates([exercise()])
    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ exerciseId: 'e1', variantId: null, duration: 15 })
  })

  it('erzeugt zusätzlich je Variante einen Kandidaten mit derselben Übungs-Kennung', () => {
    const result = buildCandidates([exercise({ variants: [variant()] })])
    expect(result).toHaveLength(2)
    expect(result.map((c) => c.exerciseId)).toEqual(['e1', 'e1'])
    expect(result.map((c) => c.variantId)).toEqual([null, 'v1'])
  })

  it('überspringt eine Variante ohne Kennung — sie wäre nicht wiederauffindbar', () => {
    const result = buildCandidates([exercise({ variants: [variant({ id: undefined })] })])
    expect(result).toHaveLength(1)
  })

  it('erbt Phase, Sportart und Schwierigkeitsgrad immer von der Hauptübung', () => {
    const [, candidate] = buildCandidates([
      exercise({
        phases: ['Aufwärmen'],
        sports: ['Volleyball'],
        difficulty: 'Schwer',
        variants: [variant()],
      }),
    ])
    expect(candidate.phases).toEqual(['Aufwärmen'])
    expect(candidate.sports).toEqual(['Volleyball'])
    expect(candidate.difficulty).toBe('Schwer')
  })

  it('übernimmt abweichende Altersgruppen und Organisationsformen der Variante', () => {
    const [, candidate] = buildCandidates([
      exercise({
        variants: [
          variant({ ageGroups: ['Jugend (11–14)'], organizationForms: ['Kreis / Sitzkreis'] }),
        ],
      }),
    ])
    expect(candidate.ageGroups).toEqual(['Jugend (11–14)'])
    expect(candidate.organizationForms).toEqual(['Kreis / Sitzkreis'])
  })

  it('erbt Altersgruppen, wenn die Variante keine trägt', () => {
    const [, candidate] = buildCandidates([exercise({ variants: [variant()] })])
    expect(candidate.ageGroups).toEqual(['Kinder (4–6)'])
  })

  it('übernimmt Teilnehmerzahl und Dauer der Variante je Feld einzeln', () => {
    const [, candidate] = buildCandidates([
      exercise({ variants: [variant({ participantsMax: 25, duration: 20 })] }),
    ])
    expect(candidate.participantsMin).toBe(6)
    expect(candidate.participantsMax).toBe(25)
    expect(candidate.duration).toBe(20)
  })

  it('trägt den Variantentitel mit, der Name bleibt der der Hauptübung', () => {
    const [, candidate] = buildCandidates([exercise({ variants: [variant()] })])
    expect(candidate.name).toBe('Reifen-Parcours')
    expect(candidate.variantTitle).toBe('Mit Turnmatten')
  })
})
