import { describe, it, expect } from 'vitest'
import {
  sumMinutes,
  distributeRemainder,
  layoutToMinutes,
  minutesToLayout,
  buildClassicSegments,
  addSegment,
  removeSegment,
  setSegmentMinutes,
  reorderSegments,
  rescaleSegments,
  resolvePrimarySport,
} from './timeline'
import type { DifficultyLevel } from '@/lib/types/exercise'

const SPORTS = ['Turnen']
const DIFFICULTIES: DifficultyLevel[] = ['Leicht', 'Mittel', 'Schwer']

describe('distributeRemainder', () => {
  it('gibt eine fehlende Minute dem längsten Segment', () => {
    expect(distributeRemainder([10, 31, 10], 52)).toEqual([10, 32, 10])
  })

  it('zieht eine überzählige Minute vom längsten Segment ab', () => {
    expect(distributeRemainder([10, 33, 10], 52)).toEqual([10, 32, 10])
  })

  it('lässt eine exakte Verteilung unverändert', () => {
    expect(distributeRemainder([12, 36, 12], 60)).toEqual([12, 36, 12])
  })

  it('unterschreitet die Mindestdauer nicht', () => {
    const result = distributeRemainder([1, 1, 20], 12)
    expect(Math.min(...result)).toBeGreaterThanOrEqual(1)
    expect(sumArray(result)).toBe(12)
  })

  it('kommt mit einer leeren Liste zurecht', () => {
    expect(distributeRemainder([], 60)).toEqual([])
  })
})

describe('layoutToMinutes', () => {
  it('rechnet Prozentwerte in Minuten um und trifft die Gesamtdauer exakt', () => {
    const result = layoutToMinutes([20, 60, 20], 60)
    expect(result).toEqual([12, 36, 12])
    expect(sumArray(result)).toBe(60)
  })

  it('hält die Gesamtdauer auch bei krummen Prozentwerten', () => {
    const result = layoutToMinutes([33.333, 33.333, 33.334], 60)
    expect(sumArray(result)).toBe(60)
  })

  it('gibt jedem Segment mindestens eine Minute', () => {
    const result = layoutToMinutes([0.1, 99.8, 0.1], 60)
    expect(Math.min(...result)).toBeGreaterThanOrEqual(1)
    expect(sumArray(result)).toBe(60)
  })
})

describe('minutesToLayout', () => {
  it('rechnet Minuten in Prozentwerte um', () => {
    expect(minutesToLayout([{ minutes: 12 }, { minutes: 36 }, { minutes: 12 }], 60))
      .toEqual([20, 60, 20])
  })

  it('bricht bei Gesamtdauer 0 nicht ab', () => {
    expect(minutesToLayout([{ minutes: 0 }], 0)).toEqual([0])
  })
})

describe('buildClassicSegments', () => {
  it('erzeugt 20/60/20 bei 60 Minuten', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    expect(segments.map((s) => s.minutes)).toEqual([12, 36, 12])
    expect(segments.map((s) => s.name)).toEqual(['Aufwärmen', 'Hauptteil', 'Cool-Down'])
  })

  it('trifft die Gesamtdauer auch bei krummen Werten exakt', () => {
    for (const total of [20, 25, 30, 45, 52, 55, 70, 90, 97, 120]) {
      const segments = buildClassicSegments(total, SPORTS, DIFFICULTIES)
      expect(sumMinutes(segments)).toBe(total)
    }
  })

  it('übernimmt Sportarten und Schwierigkeitsgrade in jedes Segment', () => {
    const segments = buildClassicSegments(60, ['Volleyball'], ['Leicht'])
    for (const segment of segments) {
      expect(segment.sports).toEqual(['Volleyball'])
      expect(segment.difficulties).toEqual(['Leicht'])
      expect(segment.fillMode).toBe('generate')
    }
  })

  it('vergibt eindeutige Kennungen', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    expect(new Set(segments.map((s) => s.id)).size).toBe(3)
  })
})

describe('resolvePrimarySport', () => {
  it('übernimmt eine Hauptsportart, die unter den Sportarten ist', () => {
    expect(resolvePrimarySport(['Turnen', 'Tanzen'], 'Tanzen')).toBe('Tanzen')
  })

  it('verwirft eine Hauptsportart, die nicht unter den Sportarten ist', () => {
    expect(resolvePrimarySport(['Turnen', 'Tanzen'], 'Volleyball')).toBeNull()
  })

  it('verwirft die Hauptsportart bei nur einer Sportart — es gibt nichts zu gewichten', () => {
    expect(resolvePrimarySport(['Turnen'], 'Turnen')).toBeNull()
  })

  it('bleibt bei null', () => {
    expect(resolvePrimarySport(['Turnen', 'Tanzen'], null)).toBeNull()
  })
})

describe('buildClassicSegments mit Hauptsportart', () => {
  it('belegt jedes Segment mit der Hauptsportart der Gruppe vor', () => {
    const segments = buildClassicSegments(60, ['Capoeira', 'Kampfsport'], DIFFICULTIES, 'Capoeira')
    expect(segments.every((s) => s.primarySport === 'Capoeira')).toBe(true)
  })

  it('lässt die Hauptsportart leer, wenn die Gruppe nur eine Sportart hat', () => {
    const segments = buildClassicSegments(60, ['Turnen'], DIFFICULTIES, 'Turnen')
    expect(segments.every((s) => s.primarySport === null)).toBe(true)
  })

  it('lässt die Hauptsportart leer, wenn keine gesetzt ist', () => {
    const segments = buildClassicSegments(60, ['Turnen', 'Tanzen'], DIFFICULTIES)
    expect(segments.every((s) => s.primarySport === null)).toBe(true)
  })
})

describe('addSegment', () => {
  it('nimmt dem längsten Segment Minuten ab und erhält die Gesamtdauer', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = addSegment(segments, 'Hauptteil', SPORTS, DIFFICULTIES)
    expect(result).toHaveLength(4)
    expect(sumMinutes(result)).toBe(60)
  })

  it('fügt nichts hinzu, wenn kein Segment genug Minuten abgeben kann', () => {
    const segments = [
      { id: 'a', name: 'Aufwärmen', minutes: 1, fillMode: 'generate' as const, sports: SPORTS, primarySport: null, difficulties: DIFFICULTIES, notes: '' },
      { id: 'b', name: 'Hauptteil', minutes: 1, fillMode: 'generate' as const, sports: SPORTS, primarySport: null, difficulties: DIFFICULTIES, notes: '' },
    ]
    expect(addSegment(segments, 'Cool-Down', SPORTS, DIFFICULTIES)).toHaveLength(2)
  })
})

describe('removeSegment', () => {
  it('gibt die Minuten an das längste verbleibende Segment', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = removeSegment(segments, segments[0].id)
    expect(result).toHaveLength(2)
    expect(sumMinutes(result)).toBe(60)
    expect(result.find((s) => s.name === 'Hauptteil')?.minutes).toBe(48)
  })

  it('entfernt das letzte Segment nicht', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES).slice(0, 1)
    expect(removeSegment(segments, segments[0].id)).toHaveLength(1)
  })
})

describe('setSegmentMinutes', () => {
  it('setzt die Minuten und erhält die Gesamtdauer', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = setSegmentMinutes(segments, segments[0].id, 20, 60)
    expect(result[0].minutes).toBe(20)
    expect(sumMinutes(result)).toBe(60)
  })

  it('begrenzt den Wert so, dass jedem anderen Segment eine Minute bleibt', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = setSegmentMinutes(segments, segments[0].id, 999, 60)
    expect(result[0].minutes).toBe(58)
    expect(sumMinutes(result)).toBe(60)
    expect(Math.min(...result.map((s) => s.minutes))).toBeGreaterThanOrEqual(1)
  })

  it('erlaubt keine Dauer unter einer Minute', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = setSegmentMinutes(segments, segments[0].id, 0, 60)
    expect(result[0].minutes).toBe(1)
    expect(sumMinutes(result)).toBe(60)
  })

  it('gibt bei einem einzigen Segment die volle Dauer', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES).slice(0, 1)
    const result = setSegmentMinutes(segments, segments[0].id, 10, 60)
    expect(result[0].minutes).toBe(60)
  })
})

describe('reorderSegments', () => {
  it('verschiebt ein Segment von vorne nach hinten', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = reorderSegments(segments, 0, 2)
    expect(result.map((s) => s.name)).toEqual(['Hauptteil', 'Cool-Down', 'Aufwärmen'])
  })

  it('verschiebt ein Segment von hinten nach vorne', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = reorderSegments(segments, 2, 0)
    expect(result.map((s) => s.name)).toEqual(['Cool-Down', 'Aufwärmen', 'Hauptteil'])
  })

  it('lässt die Minuten am Segment kleben', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = reorderSegments(segments, 1, 0)
    expect(result[0].name).toBe('Hauptteil')
    expect(result[0].minutes).toBe(36)
    expect(sumMinutes(result)).toBe(60)
  })

  it('ändert nichts bei gleicher Position', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    expect(reorderSegments(segments, 1, 1)).toEqual(segments)
  })

  it('ignoriert Positionen außerhalb der Liste', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    expect(reorderSegments(segments, 0, 9)).toEqual(segments)
    expect(reorderSegments(segments, -1, 1)).toEqual(segments)
  })
})

describe('rescaleSegments', () => {
  it('skaliert auf eine neue Gesamtdauer', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    const result = rescaleSegments(segments, 90)
    expect(sumMinutes(result)).toBe(90)
    expect(result.map((s) => s.minutes)).toEqual([18, 54, 18])
  })

  it('lässt die Segmente bei gleicher Dauer unverändert', () => {
    const segments = buildClassicSegments(60, SPORTS, DIFFICULTIES)
    expect(rescaleSegments(segments, 60)).toEqual(segments)
  })

  it('trifft auch beim Verkleinern die Gesamtdauer exakt', () => {
    const segments = buildClassicSegments(90, SPORTS, DIFFICULTIES)
    expect(sumMinutes(rescaleSegments(segments, 25))).toBe(25)
  })
})

function sumArray(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
