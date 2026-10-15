import { describe, expect, it } from 'vitest'
import {
  applyPattern,
  carryTimeline,
  findPatternByName,
  patternNameError,
  patternOptionLabel,
  patternTooLongMessage,
  sortPatterns,
  summarizePattern,
  toPatternSegments,
  type PatternSegment,
  type UnitPattern,
} from './patterns'
import { createSegment, sumMinutes } from './timeline'
import type { SegmentConfig } from '@/lib/types/unit'

const VOLLEYBALL = { sports: ['Volleyball', 'Allgemeine Fitness'], primarySport: 'Volleyball' }

function segment(name: string, minutes: number, overrides: Partial<SegmentConfig> = {}): SegmentConfig {
  return {
    ...createSegment(name, minutes, [...VOLLEYBALL.sports], ['Leicht', 'Mittel'], 'Volleyball'),
    ...overrides,
  }
}

function patternSegment(name: string, minutes: number, overrides: Partial<PatternSegment> = {}): PatternSegment {
  return {
    name,
    minutes,
    fillMode: 'generate',
    difficulties: ['Mittel'],
    organizationForms: [],
    notes: '',
    sports: null,
    primarySport: null,
    ...overrides,
  }
}

function pattern(segments: PatternSegment[], name = 'Mein Schema'): UnitPattern {
  return { id: 'p1', name, totalMinutes: segments.reduce((sum, s) => sum + s.minutes, 0), segments }
}

describe('toPatternSegments', () => {
  it('merkt sich „wie die Gruppe", wenn Sportarten und Hauptsportart übereinstimmen', () => {
    const [result] = toPatternSegments([segment('Aufwärmen', 15)], VOLLEYBALL)
    expect(result.sports).toBeNull()
    expect(result.primarySport).toBeNull()
  })

  it('achtet nicht auf die Reihenfolge der Sportarten', () => {
    const reordered = segment('Aufwärmen', 15, { sports: ['Allgemeine Fitness', 'Volleyball'] })
    expect(toPatternSegments([reordered], VOLLEYBALL)[0].sports).toBeNull()
  })

  it('behält eine abweichende Sportart-Auswahl', () => {
    const own = segment('Aufwärmen', 15, { sports: ['Laufspiele'], primarySport: null })
    const [result] = toPatternSegments([own], VOLLEYBALL)
    expect(result.sports).toEqual(['Laufspiele'])
    expect(result.primarySport).toBeNull()
  })

  it('behält eine abweichende Hauptsportart bei gleichen Sportarten', () => {
    const own = segment('Hauptteil', 60, { primarySport: 'Allgemeine Fitness' })
    const [result] = toPatternSegments([own], VOLLEYBALL)
    expect(result.sports).toEqual(VOLLEYBALL.sports)
    expect(result.primarySport).toBe('Allgemeine Fitness')
  })

  it('übernimmt Phase, Minuten, Füllart, Schwierigkeit, Organisationsform und Arbeitsnotiz', () => {
    const full = segment('Spiel', 20, {
      fillMode: 'empty',
      organizationForms: ['Kreis'],
      notes: 'Netz aufbauen',
    })
    expect(toPatternSegments([full], VOLLEYBALL)[0]).toMatchObject({
      name: 'Spiel',
      minutes: 20,
      fillMode: 'empty',
      difficulties: ['Leicht', 'Mittel'],
      organizationForms: ['Kreis'],
      notes: 'Netz aufbauen',
    })
  })

  it('trägt keine Kennung des Zeitverlaufs mit', () => {
    expect(toPatternSegments([segment('Aufwärmen', 15)], VOLLEYBALL)[0]).not.toHaveProperty('id')
  })
})

describe('applyPattern', () => {
  const target = { totalMinutes: 90, sports: ['Turnen'], primarySport: null }

  it('lässt die Minuten stehen, wenn die Dauer passt', () => {
    const result = applyPattern(
      pattern([patternSegment('Aufwärmen', 15), patternSegment('Hauptteil', 60), patternSegment('Cool-Down', 15)]),
      target
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.convertedFrom).toBeNull()
    expect(result.segments.map((s) => s.minutes)).toEqual([15, 60, 15])
  })

  it('rechnet anteilig um und nennt die ursprüngliche Dauer', () => {
    const result = applyPattern(
      pattern([patternSegment('Aufwärmen', 15), patternSegment('Hauptteil', 60), patternSegment('Cool-Down', 15)]),
      { ...target, totalMinutes: 60 }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.convertedFrom).toBe(90)
    expect(result.segments.map((s) => s.minutes)).toEqual([10, 40, 10])
  })

  it('trifft beim Umrechnen die Einheitsdauer genau, auch wenn gerundet werden muss', () => {
    const result = applyPattern(
      pattern([patternSegment('A', 20), patternSegment('B', 20), patternSegment('C', 20)]),
      { ...target, totalMinutes: 50 }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(sumMinutes(result.segments)).toBe(50)
  })

  it('gibt einem sehr kurzen Segment die Mindestlänge und hält die Summe', () => {
    const result = applyPattern(
      pattern([patternSegment('Begrüßung', 1), patternSegment('Hauptteil', 88), patternSegment('Abschluss', 1)]),
      { ...target, totalMinutes: 20 }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.segments.every((s) => s.minutes >= 1)).toBe(true)
    expect(sumMinutes(result.segments)).toBe(20)
  })

  it('lehnt ab, wenn die Gruppe weniger Minuten als das Muster Segmente hat', () => {
    const many = Array.from({ length: 8 }, (_, i) => patternSegment(`Phase ${i + 1}`, 10))
    const result = applyPattern(pattern(many), { ...target, totalMinutes: 5 })
    expect(result).toEqual({ ok: false, segmentCount: 8, totalMinutes: 5 })
  })

  it('wendet ein Muster an, das genau so viele Segmente wie Minuten hat', () => {
    const many = Array.from({ length: 5 }, (_, i) => patternSegment(`Phase ${i + 1}`, 10))
    const result = applyPattern(pattern(many), { ...target, totalMinutes: 5 })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.segments.map((s) => s.minutes)).toEqual([1, 1, 1, 1, 1])
  })

  it('lehnt ein Muster ohne Segmente ab', () => {
    expect(applyPattern(pattern([]), target).ok).toBe(false)
  })

  it('setzt bei „wie die Gruppe" die Sportarten und die Hauptsportart der Gruppe ein', () => {
    const result = applyPattern(pattern([patternSegment('Hauptteil', 90)]), {
      totalMinutes: 90,
      ...VOLLEYBALL,
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.segments[0].sports).toEqual(VOLLEYBALL.sports)
    expect(result.segments[0].primarySport).toBe('Volleyball')
  })

  it('behält eigene Sportarten, auch wenn keine zur Gruppe gehört', () => {
    const own = patternSegment('Aufwärmen', 90, {
      sports: ['Laufspiele', 'Fangspiele'],
      primarySport: 'Laufspiele',
    })
    const result = applyPattern(pattern([own]), target)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.segments[0].sports).toEqual(['Laufspiele', 'Fangspiele'])
    expect(result.segments[0].primarySport).toBe('Laufspiele')
  })

  it('übernimmt Füllart, Organisationsform und Arbeitsnotiz und vergibt frische Kennungen', () => {
    const source = pattern([
      patternSegment('Spiel', 45, { fillMode: 'empty', organizationForms: ['Kreis'], notes: 'Netz' }),
      patternSegment('Abschluss', 45),
    ])
    const result = applyPattern(source, target)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.segments[0]).toMatchObject({
      fillMode: 'empty',
      organizationForms: ['Kreis'],
      notes: 'Netz',
    })
    expect(result.segments[0].id).not.toBe(result.segments[1].id)
  })

  it('lässt das Muster selbst unverändert', () => {
    const source = pattern([patternSegment('A', 30), patternSegment('B', 60)])
    const before = JSON.stringify(source)
    applyPattern(source, { ...target, totalMinutes: 45 })
    expect(JSON.stringify(source)).toBe(before)
  })

  it('ergibt nach Speichern und Anwenden auf dieselbe Gruppe denselben Zeitverlauf', () => {
    const original = [
      segment('Aufwärmen', 15, { notes: 'locker' }),
      segment('Hauptteil', 60, { sports: ['Laufspiele'], primarySport: null }),
      segment('Spiel', 15, { fillMode: 'empty' }),
    ]
    const result = applyPattern(
      { segments: toPatternSegments(original, VOLLEYBALL) },
      { totalMinutes: 90, ...VOLLEYBALL }
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const strip = (list: SegmentConfig[]) => list.map(({ id: _id, ...rest }) => rest)
    expect(strip(result.segments)).toEqual(strip(original))
  })
})

describe('Texte und Namen', () => {
  it('nennt in der Meldung beide Zahlen', () => {
    const message = patternTooLongMessage(8, 5)
    expect(message).toContain('8 Phasen')
    expect(message).toContain('5 Minuten')
  })

  it('fasst den Aufbau zusammen und kennzeichnet freie Segmente', () => {
    expect(
      summarizePattern(
        pattern([patternSegment('Aufwärmen', 15), patternSegment('Spiel', 15, { fillMode: 'empty' })])
      )
    ).toBe('Aufwärmen 15 · Spiel 15 (frei)')
  })

  it('beschriftet die Auswahlzeile mit Name, Dauer und Segmentzahl', () => {
    expect(patternOptionLabel(pattern([patternSegment('A', 90)]))).toBe('Mein Schema · 90 Min · 1 Phase')
    expect(patternOptionLabel(pattern([patternSegment('A', 30), patternSegment('B', 30)]))).toBe(
      'Mein Schema · 60 Min · 2 Phasen'
    )
  })

  it('findet einen Namen ohne Rücksicht auf Groß-/Kleinschreibung und Leerzeichen', () => {
    const list = [pattern([], 'Mein Schema')]
    expect(findPatternByName(list, '  mein schema ')?.id).toBe('p1')
    expect(findPatternByName(list, 'Anderes')).toBeNull()
  })

  it('übergeht beim Suchen das Muster, das gerade umbenannt wird', () => {
    expect(findPatternByName([pattern([], 'Mein Schema')], 'MEIN SCHEMA', 'p1')).toBeNull()
  })

  it('lehnt leere und zu lange Namen ab', () => {
    expect(patternNameError('   ')).not.toBeNull()
    expect(patternNameError('x'.repeat(61))).not.toBeNull()
    expect(patternNameError('x'.repeat(60))).toBeNull()
  })

  it('sortiert alphabetisch ohne Rücksicht auf Groß-/Kleinschreibung', () => {
    const sorted = sortPatterns([pattern([], 'zirkel'), pattern([], 'Ärobic'), pattern([], 'Ball')])
    expect(sorted.map((p) => p.name)).toEqual(['Ärobic', 'Ball', 'zirkel'])
  })
})

describe('carryTimeline', () => {
  const TURNEN = { totalMinutes: 45, sports: ['Turnen'], primarySport: null }

  it('rechnet auf die Dauer der neuen Gruppe um und sagt, von wie viel', () => {
    const result = carryTimeline(
      [segment('Aufwärmen', 15), segment('Hauptteil', 30), segment('Spiel', 15)],
      VOLLEYBALL,
      TURNEN
    )
    if (!result.ok) throw new Error('sollte passen')
    expect(sumMinutes(result.segments)).toBe(45)
    expect(result.convertedFrom).toBe(60)
    expect(result.segments.map((s) => s.name)).toEqual(['Aufwärmen', 'Hauptteil', 'Spiel'])
  })

  it('Segmente „wie die Gruppe" tragen die Sportarten der neuen Gruppe', () => {
    const result = carryTimeline([segment('Hauptteil', 60)], VOLLEYBALL, TURNEN)
    if (!result.ok) throw new Error('sollte passen')
    expect(result.segments[0].sports).toEqual(['Turnen'])
  })

  it('bewusst abweichende Sportarten bleiben', () => {
    const own = segment('Aufwärmen', 60, { sports: ['Laufspiele'], primarySport: null })
    const result = carryTimeline([own], VOLLEYBALL, TURNEN)
    if (!result.ok) throw new Error('sollte passen')
    expect(result.segments[0].sports).toEqual(['Laufspiele'])
  })

  it('Phase, Füllart, Schwierigkeit, Organisationsform und Arbeitsnotiz bleiben', () => {
    const own = segment('Spiel', 60, {
      fillMode: 'empty',
      difficulties: ['Schwer'],
      organizationForms: ['Kreis'],
      notes: 'Bälle bereitlegen',
    })
    const result = carryTimeline([own], VOLLEYBALL, TURNEN)
    if (!result.ok) throw new Error('sollte passen')
    const [carried] = result.segments
    expect(carried).toMatchObject({
      name: 'Spiel',
      fillMode: 'empty',
      difficulties: ['Schwer'],
      organizationForms: ['Kreis'],
      notes: 'Bälle bereitlegen',
      minutes: 45,
    })
  })

  it('bei gleicher Dauer wird nichts umgerechnet', () => {
    const result = carryTimeline([segment('Hauptteil', 60)], VOLLEYBALL, { ...TURNEN, totalMinutes: 60 })
    if (!result.ok) throw new Error('sollte passen')
    expect(result.convertedFrom).toBeNull()
  })

  it('passt nicht, wenn die neue Gruppe weniger Minuten als Phasen hat', () => {
    const six = ['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => segment(`Phase ${letter}`, 10))
    expect(carryTimeline(six, VOLLEYBALL, { ...TURNEN, totalMinutes: 5 })).toEqual({
      ok: false,
      segmentCount: 6,
      totalMinutes: 5,
    })
  })
})
