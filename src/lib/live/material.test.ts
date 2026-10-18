import { describe, expect, it } from 'vitest'
import { compareSteps, hasPlaceholder, materialNeeds, musicNeeds } from './material'
import { buildLivePlan, liveMaterials } from './steps'
import { material, planWith, step } from './test-helpers'
import type { Unit, UnitItem, UnitSegment } from '@/lib/types/unit'

describe('Bereitschaftsbild', () => {
  it('nennt ein Material einmal, mit dem größten gleichzeitigen Bedarf', () => {
    const plan = planWith([
      step({ materials: [material('Hütchen', 4)] }),
      step({ materials: [material('Hütchen', 6), material('Bank', 2)] }),
    ])

    // Hütchen vor Bank: in der Begriffsordnung (PROJ-19), nicht alphabetisch.
    expect(materialNeeds(plan)).toEqual([material('Hütchen', 6), material('Bank', 2)])
  })

  it('ordnet das Material von klein nach groß, wie im Geräteraum', () => {
    const plan = planWith([
      step({ materials: [material('Weichbodenmatte', 1), material('Ball', 10), material('Hütchen', 8)] }),
    ])

    expect(materialNeeds(plan).map((m) => m.name)).toEqual(['Ball', 'Hütchen', 'Weichbodenmatte'])
  })

  it('rechnet „pro Teilnehmer" mit der Teilnehmerzahl der Gruppe aus', () => {
    const materials = liveMaterials([{ name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' }], 12)
    expect(materials).toEqual([material('Ball', 12)])
  })

  it('lässt die Menge je Teilnehmer stehen, wenn die Gruppe keine Teilnehmerzahl hat', () => {
    const materials = liveMaterials([{ name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' }], null)
    expect(materials).toEqual([material('Ball', 1, true)])
  })

  it('zählt den Eintrag „Ohne Material" einer Variante nicht als Material', () => {
    expect(liveMaterials([{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }], 12)).toEqual([])
  })

  it('nennt die Übungen mit Musik samt Link und erkennt Platzhalter', () => {
    const plan = planWith([
      step({ key: 'a', name: 'Tanzkreis', musicRequired: true, musicLink: 'https://example.com/lied' }),
      step({ key: 'b', name: 'Stopptanz', musicRequired: true }),
      step({ key: 'c', name: 'Ohne Musik', musicLink: 'https://example.com/nie' }),
      step({ kind: 'placeholder', name: 'Übung gelöscht', exerciseId: null }),
    ])

    expect(musicNeeds(plan)).toEqual([
      { key: 'a', title: 'Tanzkreis', link: 'https://example.com/lied' },
      { key: 'b', title: 'Stopptanz', link: null },
    ])
    expect(hasPlaceholder(plan)).toBe(true)
  })

  it('macht nur aus gewöhnlichen Web-Adressen einen Verweis', () => {
    const plan = planWith([
      step({ key: 'a', musicRequired: true, musicLink: 'javascript:alert(1)' }),
      step({ key: 'b', musicRequired: true, musicLink: 'irgendein Lied von der CD' }),
    ])

    expect(musicNeeds(plan).map((need) => need.link)).toEqual([null, null])
  })

  it('vergleicht nicht, solange noch kein Schritt läuft', () => {
    const result = compareSteps(null, step({ materials: [material('Bank', 2)] }))

    expect(result.compared).toBe(false)
    expect(result.stays).toEqual([material('Bank', 2)])
    expect(result.fetch).toEqual([])
  })
})

describe('„Danach" — was sich ändert', () => {
  it('nennt neues Material als „neu holen" und nicht mehr gebrauchtes als „kann weg"', () => {
    const result = compareSteps(
      step({ materials: [material('Hütchen', 4)] }),
      step({ materials: [material('Bank', 2)] })
    )

    expect(result.fetch).toEqual([material('Bank', 2)])
    expect(result.remove).toEqual([material('Hütchen', 4)])
    expect(result.stays).toEqual([])
  })

  it('kennzeichnet dasselbe Material in anderer Menge', () => {
    const result = compareSteps(
      step({ materials: [material('Ball', 6)] }),
      step({ materials: [material('Ball', 12)] })
    )

    expect(result.changed).toEqual([{ name: 'Ball', from: 6, to: 12, perParticipant: false }])
    expect(result.fetch).toEqual([])
    expect(result.remove).toEqual([])
  })

  it('lässt gleiches Material ohne Hervorhebung stehen', () => {
    const result = compareSteps(
      step({ materials: [material('Hütchen', 4)] }),
      step({ materials: [material('Hütchen', 4)] })
    )

    expect(result.stays).toEqual([material('Hütchen', 4)])
    expect(result.fetch).toEqual([])
    expect(result.changed).toEqual([])
  })

  it('hebt den Wechsel der Organisationsform hervor', () => {
    const result = compareSteps(
      step({ organizationForms: ['Kreis / Sitzkreis'] }),
      step({ organizationForms: ['Zwei Mannschaften (gemeinsames Spielfeld)'] })
    )

    expect(result.organizationFrom).toEqual(['Kreis / Sitzkreis'])
  })

  it('hebt eine gleichbleibende Organisationsform nicht hervor', () => {
    const result = compareSteps(
      step({ organizationForms: ['Kleingruppen', 'Stationsbetrieb'] }),
      step({ organizationForms: ['Stationsbetrieb', 'Kleingruppen'] })
    )

    expect(result.organizationFrom).toBeNull()
  })

  it('nennt vor freier Zeit das Material des aktuellen Schritts als „kann weg"', () => {
    const result = compareSteps(
      step({ materials: [material('Hütchen', 4)] }),
      step({ kind: 'free', name: 'Freie Zeit', exerciseId: null })
    )

    expect(result.remove).toEqual([material('Hütchen', 4)])
    expect(result.organizationFrom).toBeNull()
  })

  it('vergleicht nicht, wenn der aktuelle Schritt freie Zeit ist', () => {
    const result = compareSteps(
      step({ kind: 'free', name: 'Freie Zeit', exerciseId: null }),
      step({ materials: [material('Bank', 2)], organizationForms: ['Kleingruppen'] })
    )

    expect(result.compared).toBe(false)
    expect(result.stays).toEqual([material('Bank', 2)])
    expect(result.fetch).toEqual([])
    expect(result.organizationFrom).toBeNull()
  })

  it('zeigt nichts an, wenn dieselbe Übung auf sich selbst folgt', () => {
    const same = step({ materials: [material('Ball', 6)], organizationForms: ['Kleingruppen'] })
    const result = compareSteps(same, same)

    expect(result.fetch).toEqual([])
    expect(result.remove).toEqual([])
    expect(result.changed).toEqual([])
    expect(result.organizationFrom).toBeNull()
  })
})

function item(id: string, minutes: number, withExercise = true): UnitItem {
  return {
    id,
    exerciseId: withExercise ? `uebung-${id}` : null,
    variantId: null,
    plannedDuration: minutes,
    position: 0,
    exercise: withExercise
      ? {
          id: `uebung-${id}`,
          name: `Übung ${id}`,
          description: 'Beschreibung',
          estimatedDuration: minutes,
          sports: [],
          difficulty: 'Mittel',
          organizationForms: [],
          materials: [],
          musicRequired: false,
          musicLink: null,
          variants: [],
          variantTitle: null,
          workNotes: null,
        }
      : null,
  }
}

function segment(position: number, minutes: number, items: UnitItem[], notes = ''): UnitSegment {
  return {
    id: `segment-${position}`,
    name: ['Aufwärmen', 'Hauptteil', 'Cool-Down'][position] ?? 'Phase',
    minutes,
    fillMode: 'generate',
    sports: [],
    primarySport: null,
    difficulties: [],
    organizationForms: [],
    notes,
    plannedGapMinutes: 0,
    gapReason: null,
    gapDetail: null,
    position,
    items: items.map((entry, index) => ({ ...entry, position: index })),
  }
}

function unit(segments: UnitSegment[]): Unit {
  return {
    id: 'einheit-1',
    userId: 'nutzer-1',
    groupId: 'gruppe-1',
    groupName: 'Kinderturnen',
    name: 'Testeinheit',
    totalMinutes: 60,
    seed: 1,
    manuallyEdited: false,
    saved: true,
    editorState: { mode: 'standard', expandedPosition: null },
    relaxedNote: null,
    segments,
    createdAt: '',
    updatedAt: '',
  }
}

describe('Schritte', () => {
  const facts = { venueName: 'Turnhalle', participants: 12 }

  it('macht aus einer geplanten Lücke einen Schritt „Freie Zeit" am Ende des Segments', () => {
    const plan = buildLivePlan(unit([segment(0, 15, [item('a', 10)], 'Trinkpause')]), facts)

    expect(plan.steps.map((entry) => [entry.kind, entry.plannedMinutes])).toEqual([
      ['exercise', 10],
      ['free', 5],
    ])
    expect(plan.steps[1].name).toBe('Freie Zeit')
    expect(plan.steps[1].phaseNote).toBe('Trinkpause')
  })

  it('macht aus einem frei gelassenen Segment freie Zeit über seine ganze Länge', () => {
    const plan = buildLivePlan(unit([segment(0, 12, [])]), facts)
    expect(plan.steps.map((entry) => [entry.kind, entry.plannedMinutes])).toEqual([['free', 12]])
  })

  it('macht aus einem Platzhalter einen eigenen Schritt mit seiner Plandauer', () => {
    const plan = buildLivePlan(unit([segment(0, 10, [item('a', 4), item('b', 6, false)])]), facts)

    expect(plan.steps[1].kind).toBe('placeholder')
    expect(plan.steps[1].plannedMinutes).toBe(6)
    expect(plan.steps[1].exerciseId).toBeNull()
  })

  it('rechnet die Gesamtdauer aus den Schritten, auch bei einem überfüllten Segment', () => {
    const plan = buildLivePlan(unit([segment(0, 10, [item('a', 8), item('b', 6)])]), facts)

    expect(plan.totalMinutes).toBe(14)
    expect(plan.steps.every((entry) => entry.kind === 'exercise')).toBe(true)
  })

  it('zählt den Stand innerhalb der Phase und hält die Reihenfolge der Segmente', () => {
    const plan = buildLivePlan(
      unit([segment(1, 10, [item('c', 10)]), segment(0, 10, [item('a', 4), item('b', 6)])]),
      facts
    )

    expect(plan.steps.map((entry) => `${entry.phase} ${entry.indexInPhase}/${entry.phaseCount}`)).toEqual([
      'Aufwärmen 1/2',
      'Aufwärmen 2/2',
      'Hauptteil 1/1',
    ])
    expect(plan.venueName).toBe('Turnhalle')
  })
})
