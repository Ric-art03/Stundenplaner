import { describe, expect, it } from 'vitest'
import type { ExerciseMaterial, ExerciseVariant } from '@/lib/types/exercise'
import { describeLoss, materialImpacts, materialLosses } from './venue-materials'

function total(name: string, quantity: number): ExerciseMaterial {
  return { name, quantity, mode: 'insgesamt' }
}

function perHead(name: string, quantity: number): ExerciseMaterial {
  return { name, quantity, mode: 'pro Teilnehmer' }
}

function exercise(materials: ExerciseMaterial[], variants: ExerciseVariant[] = []) {
  return { materials, variants }
}

describe('materialLosses', () => {
  it('meldet entferntes und verringertes Material', () => {
    const before = [
      { name: 'Bälle', quantity: 10 },
      { name: 'Matten', quantity: 4 },
      { name: 'Kästen', quantity: 2 },
    ]
    const after = [
      { name: 'Bälle', quantity: 6 },
      { name: 'Kästen', quantity: 2 },
    ]
    expect(materialLosses(before, after)).toEqual([
      { name: 'Bälle', before: 10, after: 6 },
      { name: 'Matten', before: 4, after: null },
    ])
  })

  it('schweigt bei Hinzugefügtem und Vermehrtem', () => {
    const before = [{ name: 'Bälle', quantity: 10 }]
    const after = [
      { name: 'Bälle', quantity: 12 },
      { name: 'Matten', quantity: 4 },
    ]
    expect(materialLosses(before, after)).toEqual([])
  })

  it('wertet ein umgestelltes Material als entfernt', () => {
    expect(
      materialLosses([{ name: 'Bälle', quantity: 10 }], [{ name: 'Reifen', quantity: 10 }])
    ).toEqual([{ name: 'Bälle', before: 10, after: null }])
  })

  it('vergleicht ohne Rücksicht auf Groß-/Kleinschreibung und Leerzeichen', () => {
    expect(
      materialLosses([{ name: 'Bälle', quantity: 10 }], [{ name: ' bälle ', quantity: 10 }])
    ).toEqual([])
  })
})

describe('materialImpacts', () => {
  const before = [
    { name: 'Bälle', quantity: 10 },
    { name: 'Matten', quantity: 4 },
  ]
  const groups = [
    { name: 'Kinderturnen', participants: 12 },
    { name: 'Senioren', participants: 4 },
  ]

  it('zählt Übungen, die das entfernte Material brauchen, und nennt die Gruppen', () => {
    const impacts = materialImpacts(
      before,
      [{ name: 'Matten', before: 4, after: null }],
      groups,
      [exercise([total('Matten', 2)]), exercise([total('Bälle', 1)])]
    )
    expect(impacts).toEqual([
      {
        name: 'Matten',
        before: 4,
        after: null,
        groups: ['Kinderturnen', 'Senioren'],
        exerciseCount: 1,
      },
    ])
  })

  it('rechnet „pro Teilnehmer" mit der Gruppe — nur die große Gruppe verliert die Übung', () => {
    // 1 Ball pro Kopf: 12 Kinder brauchen 12 (hatten nie genug), 4 Senioren brauchen 4.
    // Von 10 auf 3 gesenkt: bei den Senioren fällt sie jetzt heraus.
    const impacts = materialImpacts(
      before,
      [{ name: 'Bälle', before: 10, after: 3 }],
      groups,
      [exercise([perHead('Bälle', 1)])]
    )
    expect(impacts).toHaveLength(1)
    expect(impacts[0].groups).toEqual(['Senioren'])
    expect(impacts[0].exerciseCount).toBe(1)
  })

  it('lässt eine Senkung weg, für die die neue Anzahl noch reicht', () => {
    const impacts = materialImpacts(
      before,
      [{ name: 'Bälle', before: 10, after: 6 }],
      groups,
      [exercise([total('Bälle', 5)])]
    )
    expect(impacts).toEqual([])
  })

  it('zählt eine Übung einmal, auch wenn Hauptübung und Variante herausfallen', () => {
    const impacts = materialImpacts(
      before,
      [{ name: 'Matten', before: 4, after: null }],
      groups,
      [
        exercise([total('Matten', 2)], [
          { title: 'Mit mehr Matten', description: '', materials: [total('Matten', 4)] },
        ]),
      ]
    )
    expect(impacts[0].exerciseCount).toBe(1)
  })

  it('zählt eine Übung mit, wenn nur eine Variante das Material braucht', () => {
    const impacts = materialImpacts(
      before,
      [{ name: 'Matten', before: 4, after: null }],
      groups,
      [
        exercise([total('Bälle', 1)], [
          { title: 'Auf Matten', description: '', materials: [total('Matten', 2)] },
        ]),
      ]
    )
    expect(impacts[0].exerciseCount).toBe(1)
  })

  it('lastet einer Übung nur das Material an, das sie braucht', () => {
    const impacts = materialImpacts(
      before,
      [
        { name: 'Bälle', before: 10, after: null },
        { name: 'Matten', before: 4, after: null },
      ],
      groups,
      [exercise([total('Bälle', 2)])]
    )
    expect(impacts.map((impact) => impact.name)).toEqual(['Bälle'])
  })

  it('übergeht „Kein Material"', () => {
    const impacts = materialImpacts(
      before,
      [{ name: 'Matten', before: 4, after: null }],
      groups,
      [exercise([total('Kein Material', 0)])]
    )
    expect(impacts).toEqual([])
  })
})

describe('describeLoss', () => {
  it('nennt Entferntes und Verringertes', () => {
    expect(describeLoss({ name: 'Matten', before: 4, after: null })).toBe('Matten entfernt')
    expect(describeLoss({ name: 'Bälle', before: 10, after: 6 })).toBe('Bälle von 10 auf 6')
  })
})
