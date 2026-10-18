import { describe, expect, it } from 'vitest'
import type { CandidateSource } from '@/lib/units/candidates'
import type { ExerciseMaterial, ExerciseVariant } from '@/lib/types/exercise'
import { missingMaterials, materialsAvailable } from '@/lib/units/generator'
import { NO_MATERIAL } from '@/lib/categories/terms'
import {
  describeFit,
  explainEmptyGroupFit,
  fitExercise,
  summarizeGroupFit,
  type FitGroup,
} from './group-fit'

function exercise(id: string, overrides: Partial<CandidateSource> = {}): CandidateSource {
  return {
    id,
    name: `Übung ${id}`,
    phases: ['Aufwärmen'],
    sports: ['Kinderturnen'],
    difficulty: 'Mittel',
    ageGroups: ['Kinder (4–6)'],
    organizationForms: [],
    duration: 10,
    participantsMin: null,
    participantsMax: null,
    materials: [],
    variants: [],
    ...overrides,
  }
}

function total(name: string, quantity: number): ExerciseMaterial {
  return { name, quantity, mode: 'insgesamt' }
}

function variant(id: string, overrides: Partial<ExerciseVariant> = {}): ExerciseVariant {
  return { id, title: `Variante ${id}`, description: 'x', ...overrides }
}

const group: FitGroup = {
  sports: ['Kinderturnen'],
  ageGroups: ['Kinder (4–6)'],
  participants: 20,
  venueMaterials: [{ name: 'Ball', quantity: 10 }],
  venueName: 'Sporthalle Nord',
}

describe('missingMaterials', () => {
  it('nennt fehlendes und zu knappes Material, „pro Teilnehmer" hochgerechnet', () => {
    const candidate = {
      materials: [
        { name: 'Bock', quantity: 1, mode: 'insgesamt' as const },
        { name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' as const },
      ],
    }
    expect(missingMaterials(candidate, { participants: 20, venueMaterials: [{ name: 'ball', quantity: 10 }] })).toEqual([
      { name: 'Bock', needed: 1, available: 0 },
      { name: 'Ball', needed: 20, available: 10 },
    ])
  })

  it('ist leer ohne Halle, bei „Ohne Material" und bei „pro Teilnehmer" ohne Teilnehmerzahl', () => {
    const perHead = { materials: [{ name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' as const }] }
    expect(missingMaterials(perHead, { participants: 20, venueMaterials: null })).toEqual([])
    expect(missingMaterials(perHead, { participants: null, venueMaterials: [] })).toEqual([])
    expect(missingMaterials({ materials: [total(NO_MATERIAL, 1)] }, { participants: 5, venueMaterials: [] })).toEqual([])
  })

  it('stimmt mit materialsAvailable überein', () => {
    const halle = { participants: 5, venueMaterials: [{ name: 'Ball', quantity: 3 }] }
    expect(materialsAvailable({ materials: [total('Ball', 3)] }, halle)).toBe(true)
    expect(materialsAvailable({ materials: [total('Ball', 4)] }, halle)).toBe(false)
  })
})

describe('fitExercise', () => {
  it('ist null, wenn Sportart oder Altersgruppe nicht passt', () => {
    expect(fitExercise(exercise('a', { sports: ['Volleyball'] }), group)).toBeNull()
    expect(fitExercise(exercise('a', { ageGroups: ['Senioren (75+)'] }), group)).toBeNull()
  })

  it('passt, wenn die Grundform alle Kriterien erfüllt', () => {
    expect(fitExercise(exercise('a', { materials: [total('Ball', 5)] }), group)).toEqual({
      kind: 'fits',
      viaVariant: null,
    })
  })

  it('nennt Material und Teilnehmerzahl zugleich, nicht nur den ersten Grund', () => {
    const fit = fitExercise(exercise('a', { materials: [total('Bock', 1)], participantsMax: 12 }), group)
    expect(fit).toEqual({
      kind: 'blocked',
      forVariant: null,
      reasons: [
        { kind: 'material', venueName: 'Sporthalle Nord', missing: [{ name: 'Bock', needed: 1, available: 0 }] },
        { kind: 'participants', min: null, max: 12, participants: 20 },
      ],
    })
    expect(describeFit(fit!)).toBe('In „Sporthalle Nord" fehlt: Bock · bis 12 Teilnehmer, die Gruppe hat 20')
  })

  it('passt mit einer Variante, wenn nur sie die Kriterien erfüllt', () => {
    const fit = fitExercise(
      exercise('a', {
        materials: [total('Bock', 1)],
        variants: [variant('v1', { materials: [total('Ball', 2)], title: 'Mit Ball' })],
      }),
      group
    )
    expect(fit).toEqual({ kind: 'fits', viaVariant: 'Mit Ball' })
    expect(describeFit(fit!)).toBe('Passt mit der Variante „Mit Ball"')
  })

  it('nimmt eine Variante mit passender Altersgruppe auf, auch wenn die Grundform nicht passt', () => {
    const fit = fitExercise(
      exercise('a', {
        ageGroups: ['Kinder (7–10)'],
        variants: [variant('v1', { ageGroups: ['Kinder (4–6)'], title: 'Für Kleine', participantsMax: 8 })],
      }),
      group
    )
    expect(fit).toEqual({
      kind: 'blocked',
      forVariant: 'Für Kleine',
      reasons: [{ kind: 'participants', min: null, max: 8, participants: 20 }],
    })
  })

  it('prüft ohne Halle kein Material — wie der Generator', () => {
    expect(fitExercise(exercise('a', { materials: [total('Bock', 1)] }), { ...group, venueMaterials: null, venueName: null }))
      .toEqual({ kind: 'fits', viaVariant: null })
  })
})

describe('summarizeGroupFit', () => {
  const exercises = [
    exercise('passt'),
    exercise('material', { materials: [total('Bock', 1)] }),
    exercise('übernommen'),
    exercise('fremd', { sports: ['Fußball'] }),
  ]

  it('wählt vor, was passt und noch nicht übernommen ist', () => {
    const summary = summarizeGroupFit(exercises, group, new Set(['übernommen']))
    expect([...summary.fits.keys()]).toEqual(['passt', 'material', 'übernommen'])
    expect(summary.preselected).toEqual(['passt'])
    expect(summary.allCopied).toBe(false)
  })

  it('erkennt, dass alles Passende schon übernommen ist', () => {
    const summary = summarizeGroupFit(exercises, group, new Set(['passt', 'material', 'übernommen']))
    expect(summary.allCopied).toBe(true)
    expect(summary.preselected).toEqual([])
  })

  it('meldet fehlende Teilnehmerzahl nur, wenn Material „pro Teilnehmer" vorkommt', () => {
    const noCount = { ...group, participants: null }
    expect(summarizeGroupFit([exercise('a')], noCount, new Set()).participantsUnknown).toBe(false)
    const perHead = exercise('b', { materials: [{ name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' }] })
    expect(summarizeGroupFit([perHead], noCount, new Set()).participantsUnknown).toBe(true)
  })
})

describe('explainEmptyGroupFit', () => {
  const library = [
    exercise('a', { sports: ['Kinderturnen'], ageGroups: ['Kinder (7–10)'] }),
    exercise('b', { sports: ['Gymnastik'], ageGroups: ['Kinder (4–6)'] }),
  ]

  it('nennt eine Sportart ohne Übungen', () => {
    expect(explainEmptyGroupFit(library, { ...group, sports: ['Volleyball'] })).toEqual([
      'Für „Volleyball" gibt es in der Übungsdatenbank noch keine Übungen.',
    ])
  })

  it('nennt Sportart und Altersgruppe, wenn beide fehlen', () => {
    expect(explainEmptyGroupFit(library, { ...group, sports: ['Volleyball'], ageGroups: ['Senioren (75+)'] })).toEqual([
      'Für „Volleyball" gibt es in der Übungsdatenbank noch keine Übungen.',
      'Für „Senioren (75+)" gibt es in der Übungsdatenbank noch keine Übungen.',
    ])
  })

  it('sagt, wenn es beides gibt, nur nicht zusammen', () => {
    expect(explainEmptyGroupFit(library, group)).toEqual([
      'Es gibt Übungen für „Kinderturnen" und für „Kinder (4–6)", aber noch keine für beides zusammen.',
    ])
  })

  it('nennt eigene Begriffe als Grund', () => {
    expect(explainEmptyGroupFit(library, { ...group, sports: ['Capoeira'] })).toEqual([
      'Die Sportart „Capoeira" ist ein eigener Begriff — die Übungsdatenbank trägt nur die mitgelieferten.',
    ])
  })
})
