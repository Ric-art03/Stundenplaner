import { describe, it, expect } from 'vitest'
import {
  createRandom,
  failedCriteriaOf,
  generateUnitPlan,
  planDurations,
  planSegment,
  DURATION_TOLERANCE,
  type GeneratorGroup,
  type GeneratorInput,
} from './generator'
import type { Candidate } from './candidates'
import type { SegmentConfig } from '@/lib/types/unit'
import type { DifficultyLevel } from '@/lib/types/exercise'

const ALL_DIFFICULTIES: DifficultyLevel[] = ['Leicht', 'Mittel', 'Schwer']

function candidate(overrides: Partial<Candidate> & { exerciseId: string }): Candidate {
  return {
    variantId: null,
    name: overrides.exerciseId,
    variantTitle: null,
    phases: ['Hauptteil'],
    sports: ['Turnen'],
    difficulty: 'Mittel',
    ageGroups: ['Kinder (4–6)'],
    organizationForms: [],
    materials: [],
    participantsMin: null,
    participantsMax: null,
    duration: 10,
    ...overrides,
  }
}

function segment(overrides: Partial<SegmentConfig> = {}): SegmentConfig {
  return {
    id: 'seg-1',
    name: 'Hauptteil',
    minutes: 30,
    fillMode: 'generate',
    sports: ['Turnen'],
    primarySport: null,
    difficulties: ALL_DIFFICULTIES,
    organizationForms: [],
    notes: '',
    ...overrides,
  }
}

function group(overrides: Partial<GeneratorGroup> = {}): GeneratorGroup {
  return {
    ageGroups: ['Kinder (4–6)'],
    participants: 20,
    venueMaterials: null,
    ...overrides,
  }
}

function run(overrides: Partial<GeneratorInput> = {}) {
  return generateUnitPlan({
    group: group(),
    segments: [segment()],
    candidates: [],
    recentExerciseIds: [],
    seed: 42,
    relax: false,
    ...overrides,
  })
}

function usedIds(result: ReturnType<typeof generateUnitPlan>): string[] {
  return result.segments.flatMap((s) => s.items.map((i) => i.exerciseId))
}

// ---- Zufall ----

describe('createRandom', () => {
  it('liefert bei gleichem Startwert dieselbe Folge', () => {
    const a = createRandom(123)
    const b = createRandom(123)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('liefert bei anderem Startwert eine andere Folge', () => {
    const a = createRandom(1)
    const b = createRandom(2)
    expect(a()).not.toBe(b())
  })
})

describe('Reproduzierbarkeit', () => {
  it('gleiche Eingabe und gleicher Startwert ergeben dieselbe Auswahl', () => {
    const candidates = Array.from({ length: 8 }, (_, i) =>
      candidate({ exerciseId: `e${i}`, duration: 8 })
    )
    const first = run({ candidates })
    const second = run({ candidates })
    expect(usedIds(first)).toEqual(usedIds(second))
  })

  it('ein anderer Startwert ergibt eine andere Auswahl', () => {
    const candidates = Array.from({ length: 12 }, (_, i) =>
      candidate({ exerciseId: `e${i}`, duration: 10 })
    )
    const a = run({ candidates, seed: 1 })
    const b = run({ candidates, seed: 99999 })
    expect(usedIds(a)).not.toEqual(usedIds(b))
  })
})

// ---- Harte Kriterien ----

describe('Phasen-Kriterium', () => {
  it('schlägt nur Übungen vor, deren Phasen-Tags den Segmentnamen enthalten', () => {
    const result = run({
      segments: [segment({ name: 'Aufwärmen', minutes: 10 })],
      candidates: [
        candidate({ exerciseId: 'warm', phases: ['Aufwärmen'] }),
        candidate({ exerciseId: 'main', phases: ['Hauptteil'] }),
      ],
    })
    expect(usedIds(result)).toEqual(['warm'])
  })

  it('lässt ein Segment mit neuer eigener Phase leer und erklärt warum', () => {
    const result = run({
      segments: [segment({ name: 'Wettkampfspiel', minutes: 20 })],
      candidates: [candidate({ exerciseId: 'main' })],
    })
    expect(result.segments[0].items).toEqual([])
    expect(result.segments[0].gapDetail).toMatchObject({
      kind: 'no-phase',
      phase: 'Wettkampfspiel',
      phaseMatches: 0,
    })
    expect(result.segments[0].gapReason).toBe(
      'Deine einzige Übung ist der Phase „Wettkampfspiel" nicht zugeordnet.'
    )
  })
})

describe('Sportart-Kriterium', () => {
  it('zählt eine Übung als Treffer, wenn eine ihrer Sportarten passt', () => {
    const result = run({
      segments: [segment({ sports: ['Volleyball'], minutes: 10 })],
      candidates: [candidate({ exerciseId: 'v', sports: ['Volleyball', 'Kinderspiele'] })],
    })
    expect(usedIds(result)).toEqual(['v'])
  })

  it('schließt Übungen ohne passende Sportart aus', () => {
    const result = run({
      segments: [segment({ sports: ['Volleyball'], minutes: 10 })],
      candidates: [candidate({ exerciseId: 'f', sports: ['Fußball'] })],
    })
    expect(usedIds(result)).toEqual([])
    expect(result.segments[0].gapDetail).toMatchObject({ kind: 'all-filtered', phaseMatches: 1 })
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([{ criterion: 'sport', count: 1 }])
  })
})

describe('Altersgruppen-Kriterium', () => {
  it('schließt eine Übung mit unpassender Altersgruppe aus', () => {
    const result = run({
      group: group({ ageGroups: ['Kinder (4–6)'] }),
      segments: [segment({ minutes: 10 })],
      candidates: [candidate({ exerciseId: 'alt', ageGroups: ['Senioren (60+)'] })],
    })
    expect(usedIds(result)).toEqual([])
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([{ criterion: 'age', count: 1 }])
  })

  it('genügt eine überlappende Altersgruppe', () => {
    const result = run({
      group: group({ ageGroups: ['Kinder (4–6)', 'Kinder (7–10)'] }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({ exerciseId: 'ok', ageGroups: ['Senioren (60+)', 'Kinder (7–10)'] }),
      ],
    })
    expect(usedIds(result)).toEqual(['ok'])
  })
})

describe('Material-Kriterium', () => {
  const venue = [{ name: 'Hütchen', quantity: 6 }, { name: 'Ball', quantity: 12 }]

  it('schließt eine Übung aus, deren Material insgesamt nicht ausreicht', () => {
    const result = run({
      group: group({ venueMaterials: venue }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'huetchen',
          materials: [{ name: 'Hütchen', quantity: 10, mode: 'insgesamt' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual([])
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([{ criterion: 'material', count: 1 }])
  })

  it('rechnet „pro Teilnehmer" mit der Teilnehmerzahl der Gruppe', () => {
    const result = run({
      group: group({ venueMaterials: venue, participants: 20 }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'ball',
          materials: [{ name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual([])
  })

  it('lässt eine Übung durch, die den Bestand exakt trifft', () => {
    const result = run({
      group: group({ venueMaterials: [{ name: 'Reifen', quantity: 50 }], participants: 25 }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'reifen',
          materials: [{ name: 'Reifen', quantity: 2, mode: 'pro Teilnehmer' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual(['reifen'])
  })

  it('prüft Material gar nicht, wenn der Gruppe keine Halle zugewiesen ist', () => {
    const result = run({
      group: group({ venueMaterials: null }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'viel',
          materials: [{ name: 'Weichbodenmatte', quantity: 99, mode: 'insgesamt' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual(['viel'])
  })

  it('überspringt „pro Teilnehmer" ohne hinterlegte Teilnehmerzahl', () => {
    const result = run({
      group: group({ venueMaterials: venue, participants: null }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'ball',
          materials: [{ name: 'Ball', quantity: 5, mode: 'pro Teilnehmer' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual(['ball'])
  })

  it('behandelt „Kein Material" immer als erfüllt', () => {
    const result = run({
      group: group({ venueMaterials: [] }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({
          exerciseId: 'frei',
          materials: [{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }],
        }),
      ],
    })
    expect(usedIds(result)).toEqual(['frei'])
  })

  it('prüft nicht kumulativ — zwei Übungen dürfen dasselbe Material brauchen', () => {
    const result = run({
      group: group({ venueMaterials: [{ name: 'Hütchen', quantity: 8 }] }),
      segments: [segment({ minutes: 20 })],
      candidates: [
        candidate({
          exerciseId: 'a',
          materials: [{ name: 'Hütchen', quantity: 8, mode: 'insgesamt' }],
        }),
        candidate({
          exerciseId: 'b',
          materials: [{ name: 'Hütchen', quantity: 8, mode: 'insgesamt' }],
        }),
      ],
    })
    expect(usedIds(result).sort()).toEqual(['a', 'b'])
  })
})

describe('Teilnehmer-Kriterium', () => {
  it('schließt eine Übung mit zu niedriger Obergrenze aus', () => {
    const result = run({
      group: group({ participants: 20 }),
      segments: [segment({ minutes: 10 })],
      candidates: [candidate({ exerciseId: 'klein', participantsMax: 8 })],
    })
    expect(usedIds(result)).toEqual([])
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([
      { criterion: 'participants', count: 1 },
    ])
    expect(result.segments[0].gapDetail?.participants).toBe(20)
  })

  it('schließt eine Übung mit zu hoher Untergrenze aus', () => {
    const result = run({
      group: group({ participants: 20 }),
      segments: [segment({ minutes: 10 })],
      candidates: [candidate({ exerciseId: 'gross', participantsMin: 25 })],
    })
    expect(usedIds(result)).toEqual([])
  })

  it('überspringt das Kriterium, wenn die Übung keine Teilnehmerzahl hat', () => {
    const result = run({
      group: group({ participants: 20 }),
      segments: [segment({ minutes: 10 })],
      candidates: [candidate({ exerciseId: 'offen' })],
    })
    expect(usedIds(result)).toEqual(['offen'])
  })

  it('überspringt das Kriterium, wenn die Gruppe keine Teilnehmerzahl hat', () => {
    const result = run({
      group: group({ participants: null }),
      segments: [segment({ minutes: 10 })],
      candidates: [candidate({ exerciseId: 'klein', participantsMax: 8 })],
    })
    expect(usedIds(result)).toEqual(['klein'])
  })

  it('verwirft einen widersprüchlichen Datensatz (Min größer als Max)', () => {
    const result = run({
      group: group({ participants: 20 }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({ exerciseId: 'kaputt', participantsMin: 30, participantsMax: 10 }),
      ],
    })
    expect(usedIds(result)).toEqual([])
  })
})

describe('Schwierigkeitsgrad-Kriterium', () => {
  it('nimmt nur Übungen mit einem der gewählten Grade', () => {
    const result = run({
      segments: [segment({ difficulties: ['Leicht'], minutes: 20 })],
      candidates: [
        candidate({ exerciseId: 'leicht', difficulty: 'Leicht' }),
        candidate({ exerciseId: 'schwer', difficulty: 'Schwer' }),
      ],
    })
    expect(usedIds(result)).toEqual(['leicht'])
  })
})

// ---- Varianten ----

describe('Varianten als Kandidaten', () => {
  it('plant nie Hauptübung und eigene Variante gemeinsam ein', () => {
    const result = run({
      segments: [segment({ minutes: 40 })],
      candidates: [
        candidate({ exerciseId: 'e1', variantId: null, duration: 10 }),
        candidate({ exerciseId: 'e1', variantId: 'v1', duration: 10 }),
      ],
    })
    expect(result.segments[0].items).toHaveLength(1)
  })

  it('nimmt die Variante, wenn nur sie die Kriterien erfüllt', () => {
    const result = run({
      group: group({ participants: 25 }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({ exerciseId: 'e1', variantId: null, participantsMax: 12 }),
        candidate({ exerciseId: 'e1', variantId: 'v1', participantsMax: 25 }),
      ],
    })
    expect(result.segments[0].items).toEqual([
      expect.objectContaining({ exerciseId: 'e1', variantId: 'v1' }),
    ])
  })
})

// ---- Sportart-Rotation ----

describe('Sportart-Rotation', () => {
  it('nutzt beide Sportarten, bevor sich eine wiederholt', () => {
    const candidates = [
      ...Array.from({ length: 4 }, (_, i) =>
        candidate({ exerciseId: `a${i}`, sports: ['Turnen'], duration: 10 })
      ),
      ...Array.from({ length: 4 }, (_, i) =>
        candidate({ exerciseId: `b${i}`, sports: ['Tanzen'], duration: 10 })
      ),
    ]
    const result = run({
      segments: [segment({ sports: ['Turnen', 'Tanzen'], minutes: 30 })],
      candidates,
    })
    const picked = usedIds(result)
    expect(picked).toHaveLength(3)
    const prefixes = picked.map((id) => id[0])
    expect(new Set(prefixes.slice(0, 2)).size).toBe(2)
  })

  it('gewichtet die Hauptsportart auf etwa jede zweite Übung', () => {
    const candidates = [
      ...Array.from({ length: 10 }, (_, i) =>
        candidate({ exerciseId: `cap${i}`, sports: ['Capoeira'], duration: 10 })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        candidate({ exerciseId: `kampf${i}`, sports: ['Kampfsport'], duration: 10 })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        candidate({ exerciseId: `allg${i}`, sports: ['Allgemeinsport'], duration: 10 })
      ),
    ]
    const result = run({
      segments: [
        segment({
          sports: ['Capoeira', 'Kampfsport', 'Allgemeinsport'],
          primarySport: 'Capoeira',
          minutes: 40,
        }),
      ],
      candidates,
    })
    const picked = usedIds(result)
    expect(picked).toHaveLength(4)
    expect(picked.filter((id) => id.startsWith('cap'))).toHaveLength(2)
  })

  it('rotiert ohne Hauptsportart gleichmäßig', () => {
    const candidates = ['x', 'y', 'z'].flatMap((prefix) =>
      Array.from({ length: 4 }, (_, i) =>
        candidate({
          exerciseId: `${prefix}${i}`,
          sports: [{ x: 'Turnen', y: 'Tanzen', z: 'Handball' }[prefix] as string],
          duration: 10,
        })
      )
    )
    const result = run({
      segments: [segment({ sports: ['Turnen', 'Tanzen', 'Handball'], minutes: 30 })],
      candidates,
    })
    const prefixes = usedIds(result).map((id) => id[0])
    expect(new Set(prefixes).size).toBe(3)
  })

  it('weicht von der gezogenen Sportart ab, statt eine Lücke zu lassen', () => {
    const result = run({
      segments: [segment({ sports: ['Turnen', 'Tanzen'], minutes: 20 })],
      candidates: [
        candidate({ exerciseId: 'a', sports: ['Turnen'], duration: 10 }),
        candidate({ exerciseId: 'b', sports: ['Turnen'], duration: 10 }),
      ],
    })
    expect(usedIds(result)).toHaveLength(2)
    expect(result.segments[0].gapReason).toBeNull()
  })
})

// ---- Frische-Regel ----

describe('Frische-Regel', () => {
  it('behandelt kürzlich verwendete Übungen nachrangig', () => {
    const candidates = Array.from({ length: 4 }, (_, i) =>
      candidate({ exerciseId: `e${i}`, duration: 10 })
    )
    const result = run({
      segments: [segment({ minutes: 20 })],
      candidates,
      recentExerciseIds: ['e0', 'e1'],
    })
    expect(usedIds(result).sort()).toEqual(['e2', 'e3'])
  })

  it('plant kürzlich verwendete Übungen trotzdem ein, wenn sonst nichts passt', () => {
    const result = run({
      segments: [segment({ minutes: 20 })],
      candidates: [
        candidate({ exerciseId: 'alt1', duration: 10 }),
        candidate({ exerciseId: 'alt2', duration: 10 }),
      ],
      recentExerciseIds: ['alt1', 'alt2'],
    })
    expect(usedIds(result)).toHaveLength(2)
    expect(result.segments[0].gapReason).toBeNull()
  })
})

// ---- Keine Dopplungen ----

describe('Keine Dopplungen', () => {
  it('verwendet keine Übung zweimal in derselben Einheit', () => {
    const candidates = Array.from({ length: 3 }, (_, i) =>
      candidate({ exerciseId: `e${i}`, phases: ['Aufwärmen', 'Hauptteil'], duration: 10 })
    )
    const result = run({
      segments: [
        segment({ id: 's1', name: 'Aufwärmen', minutes: 20 }),
        segment({ id: 's2', name: 'Hauptteil', minutes: 20 }),
      ],
      candidates,
    })
    const picked = usedIds(result)
    expect(new Set(picked).size).toBe(picked.length)
  })

  it('nennt als Grund, dass alle passenden Übungen schon eingeplant sind', () => {
    const result = run({
      segments: [
        segment({ id: 's1', name: 'Hauptteil', minutes: 20 }),
        segment({ id: 's2', name: 'Hauptteil', minutes: 20 }),
      ],
      candidates: [
        candidate({ exerciseId: 'e0', duration: 10 }),
        candidate({ exerciseId: 'e1', duration: 10 }),
      ],
    })
    expect(result.segments[1].items).toEqual([])
    expect(result.segments[1].gapReason).toBe(
      'Alle 2 passenden Übungen der Phase „Hauptteil" sind in dieser Einheit schon eingeplant.'
    )
  })
})

// ---- Zeitbudget ----

describe('planDurations', () => {
  it('streckt eine 10-Minuten-Übung auf ein 12-Minuten-Budget', () => {
    expect(planDurations([10], 12)).toEqual([12])
  })

  it('bleibt innerhalb von plus/minus 25 Prozent', () => {
    const planned = planDurations([10], 40)
    expect(planned[0]).toBeLessThanOrEqual(10 * (1 + DURATION_TOLERANCE))
    expect(planned[0]).toBeGreaterThanOrEqual(10 * (1 - DURATION_TOLERANCE))
  })

  it('verteilt die Restdifferenz auf mehrere Übungen', () => {
    expect(planDurations([15, 15], 36)).toEqual([18, 18])
  })

  it('kürzt bei zu großem Gesamtumfang bis an die Untergrenze', () => {
    expect(planDurations([20], 15)).toEqual([15])
  })

  it('lässt kurze Übungen unverändert, wenn kein Spielraum bleibt', () => {
    expect(planDurations([3, 3, 3, 3], 12)).toEqual([3, 3, 3, 3])
  })

  it('kommt mit einer leeren Liste zurecht', () => {
    expect(planDurations([], 30)).toEqual([])
  })
})

describe('Zeitbudget im Segment', () => {
  it('füllt das Budget mit einer gestreckten Übung und behält die Schätzung bei', () => {
    const result = run({
      segments: [segment({ minutes: 12 })],
      candidates: [candidate({ exerciseId: 'e', duration: 10 })],
    })
    expect(result.segments[0].items[0].plannedDuration).toBe(12)
    expect(result.segments[0].gapReason).toBeNull()
  })

  it('plant mehrere sehr kurze Übungen ein, ohne Mindestdauer', () => {
    const candidates = Array.from({ length: 6 }, (_, i) =>
      candidate({ exerciseId: `k${i}`, name: `kurz${i}`, duration: 3 })
    )
    const result = run({
      segments: [segment({ name: 'Cool-Down', minutes: 12 })],
      candidates: candidates.map((c) => ({ ...c, phases: ['Cool-Down'] })),
    })
    expect(result.segments[0].items).toHaveLength(4)
    expect(result.segments[0].items.every((i) => i.plannedDuration === 3)).toBe(true)
    expect(result.segments[0].gapReason).toBeNull()
  })

  it('lässt ein Segment leer, das kürzer als die kürzeste Übung ist', () => {
    const result = run({
      segments: [segment({ minutes: 4 })],
      candidates: [candidate({ exerciseId: 'lang', duration: 20 })],
    })
    expect(result.segments[0].items).toEqual([])
    expect(result.segments[0].gapReason).toBe(
      'Die restlichen 4 Minuten sind kürzer als die kürzeste noch passende Übung (20 Minuten).'
    )
  })

  it('die Summe der Plandauern überschreitet das Budget nie', () => {
    const candidates = Array.from({ length: 10 }, (_, i) =>
      candidate({ exerciseId: `e${i}`, duration: 7 })
    )
    for (const minutes of [5, 13, 20, 29, 44, 61]) {
      const result = run({ segments: [segment({ minutes })], candidates })
      const filled = result.segments[0].items.reduce((s, i) => s + i.plannedDuration, 0)
      expect(filled).toBeLessThanOrEqual(minutes)
    }
  })
})

// ---- Freie Segmente ----

describe('Segmente auf „frei lassen"', () => {
  it('bleibt leer und zählt nicht als Lücke mit Grund', () => {
    const result = run({
      segments: [segment({ fillMode: 'empty', minutes: 20 })],
      candidates: [candidate({ exerciseId: 'e' })],
    })
    expect(result.segments[0].items).toEqual([])
    expect(result.segments[0].gapReason).toBeNull()
  })

  it('erlaubt eine Einheit, in der alle Segmente frei bleiben', () => {
    const result = run({
      segments: [
        segment({ id: 's1', fillMode: 'empty', minutes: 20 }),
        segment({ id: 's2', fillMode: 'empty', minutes: 10 }),
      ],
      candidates: [candidate({ exerciseId: 'e' })],
    })
    expect(usedIds(result)).toEqual([])
    expect(result.relaxedNote).toBeNull()
  })

  it('verbraucht keine Übungen, die danach noch gebraucht werden', () => {
    const result = run({
      segments: [
        segment({ id: 's1', fillMode: 'empty', minutes: 10 }),
        segment({ id: 's2', fillMode: 'generate', minutes: 10 }),
      ],
      candidates: [candidate({ exerciseId: 'e', duration: 10 })],
    })
    expect(usedIds(result)).toEqual(['e'])
  })
})

// ---- Lockern ----

describe('Kriterien lockern', () => {
  it('lockert ohne Klick des Nutzers nichts', () => {
    const result = run({
      segments: [segment({ difficulties: ['Leicht'], minutes: 10 })],
      candidates: [candidate({ exerciseId: 'schwer', difficulty: 'Schwer' })],
      relax: false,
    })
    expect(usedIds(result)).toEqual([])
    expect(result.relaxedNote).toBeNull()
  })

  it('gibt zuerst den Schwierigkeitsgrad frei', () => {
    const result = run({
      segments: [segment({ difficulties: ['Leicht'], minutes: 10 })],
      candidates: [candidate({ exerciseId: 'schwer', difficulty: 'Schwer' })],
      relax: true,
    })
    expect(usedIds(result)).toEqual(['schwer'])
    expect(result.relaxedNote).toBe('„Hauptteil": Schwierigkeitsgrad gelockert — 1 Übung ergänzt.')
  })

  it('gibt danach die Sportart-Vorgabe frei', () => {
    const result = run({
      segments: [segment({ sports: ['Volleyball'], minutes: 10 })],
      candidates: [candidate({ exerciseId: 'turnen', sports: ['Turnen'] })],
      relax: true,
    })
    expect(usedIds(result)).toEqual(['turnen'])
    expect(result.relaxedNote).toContain('Sportart-Vorgabe gelockert')
  })

  it('hält Material und Altersgruppe auch beim Lockern hart', () => {
    const result = run({
      group: group({
        ageGroups: ['Kinder (4–6)'],
        venueMaterials: [{ name: 'Hütchen', quantity: 2 }],
      }),
      segments: [segment({ minutes: 10 })],
      candidates: [
        candidate({ exerciseId: 'alt', ageGroups: ['Senioren (60+)'] }),
        candidate({
          exerciseId: 'material',
          materials: [{ name: 'Hütchen', quantity: 20, mode: 'insgesamt' }],
        }),
      ],
      relax: true,
    })
    expect(usedIds(result)).toEqual([])
  })

  it('lässt Segmente unverändert, die streng gefüllt werden konnten', () => {
    const result = run({
      segments: [
        segment({ id: 's1', name: 'Aufwärmen', minutes: 10, difficulties: ['Leicht'] }),
        segment({ id: 's2', name: 'Hauptteil', minutes: 10, difficulties: ['Leicht'] }),
      ],
      candidates: [
        candidate({ exerciseId: 'warm', phases: ['Aufwärmen'], difficulty: 'Leicht' }),
        candidate({ exerciseId: 'hart', phases: ['Hauptteil'], difficulty: 'Schwer' }),
      ],
      relax: true,
    })
    expect(result.segments[0].relaxLevel).toBe(0)
    expect(result.segments[1].relaxLevel).toBe(2)
    expect(result.relaxedNote).toBe('„Hauptteil": Schwierigkeitsgrad gelockert — 1 Übung ergänzt.')
  })

  it('bleibt bei der strengen Auswahl, wenn Lockern nichts einbringt', () => {
    const result = run({
      segments: [segment({ minutes: 60 })],
      candidates: [candidate({ exerciseId: 'e', duration: 10 })],
      relax: true,
    })
    expect(result.segments[0].relaxLevel).toBe(0)
    expect(result.relaxedNote).toBeNull()
  })
})

// ---- Struktur des Ergebnisses ----

describe('Aufbau des Ergebnisses', () => {
  it('behält die Reihenfolge der Segmente und zählt die Positionen hoch', () => {
    const result = run({
      segments: [
        segment({ id: 's1', name: 'Aufwärmen', minutes: 12 }),
        segment({ id: 's2', name: 'Hauptteil', minutes: 36 }),
        segment({ id: 's3', name: 'Cool-Down', minutes: 12 }),
      ],
      candidates: Array.from({ length: 10 }, (_, i) =>
        candidate({
          exerciseId: `e${i}`,
          phases: ['Aufwärmen', 'Hauptteil', 'Cool-Down'],
          duration: 10,
        })
      ),
    })
    expect(result.segments.map((s) => s.segment.name)).toEqual([
      'Aufwärmen',
      'Hauptteil',
      'Cool-Down',
    ])
    expect(result.segments.map((s) => s.position)).toEqual([0, 1, 2])
    expect(result.segments[1].items.map((i) => i.position)).toEqual([0, 1, 2])
  })

  it('lässt bei leerem Kandidatenpool alle Segmente leer, ohne abzubrechen', () => {
    const result = run({
      segments: [segment({ minutes: 20 })],
      candidates: [],
    })
    expect(result.segments[0].items).toEqual([])
    expect(result.segments[0].gapDetail).toMatchObject({ kind: 'no-phase', totalCandidates: 0 })
    expect(result.segments[0].gapReason).toContain('noch keine Übungen angelegt')
  })
})

// ---- Vollständige Lückendiagnose ----

describe('Lückendiagnose nennt jede Ursache', () => {
  it('zählt jedes Kriterium unabhängig, nicht nur das zuerst geprüfte', () => {
    const result = run({
      group: group({
        ageGroups: ['Kinder (4–6)'],
        participants: 20,
        venueMaterials: [{ name: 'Hütchen', quantity: 2 }],
      }),
      segments: [segment({ sports: ['Turnen'], difficulties: ['Leicht'], minutes: 20 })],
      candidates: [
        // Scheitert ausschließlich an der Altersgruppe.
        candidate({ exerciseId: 'alt', ageGroups: ['Senioren (60+)'], difficulty: 'Leicht' }),
        // Scheitert am Material und zugleich am Schwierigkeitsgrad.
        candidate({
          exerciseId: 'mat',
          difficulty: 'Schwer',
          materials: [{ name: 'Hütchen', quantity: 20, mode: 'insgesamt' }],
        }),
        // Scheitert an der Teilnehmerzahl und an der Sportart.
        candidate({
          exerciseId: 'tn',
          difficulty: 'Leicht',
          sports: ['Handball'],
          participantsMax: 8,
        }),
      ],
    })

    const detail = result.segments[0].gapDetail
    expect(detail?.kind).toBe('all-filtered')
    expect(detail?.phaseMatches).toBe(3)

    // Eine Übung kann an mehrerem scheitern — die Zahlen überschneiden sich.
    const byCriterion = Object.fromEntries(
      (detail?.blockedBy ?? []).map((entry) => [entry.criterion, entry.count])
    )
    expect(byCriterion).toEqual({
      age: 1,
      material: 1,
      participants: 1,
      sport: 1,
      difficulty: 1,
    })
  })

  it('führt kein Kriterium auf, an dem nichts scheitert', () => {
    const result = run({
      segments: [segment({ sports: ['Handball'], minutes: 20 })],
      candidates: [candidate({ exerciseId: 'e', sports: ['Turnen'] })],
    })
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([{ criterion: 'sport', count: 1 }])
  })

  it('lässt die weichen Kriterien weg, sobald gelockert wurde', () => {
    const result = run({
      group: group({ venueMaterials: [{ name: 'Hütchen', quantity: 2 }] }),
      segments: [segment({ sports: ['Handball'], difficulties: ['Leicht'], minutes: 20 })],
      candidates: [
        candidate({
          exerciseId: 'e',
          sports: ['Turnen'],
          difficulty: 'Schwer',
          materials: [{ name: 'Hütchen', quantity: 20, mode: 'insgesamt' }],
        }),
      ],
      relax: true,
    })

    const detail = result.segments[0].gapDetail
    expect(detail?.relaxed).toBe(true)
    // Nur das harte Kriterium bleibt übrig — Sportart und Schwierigkeitsgrad
    // sind freigegeben und können nicht mehr der Grund sein.
    expect(detail?.blockedBy).toEqual([{ criterion: 'material', count: 1 }])
    expect(result.segments[0].gapReason).toContain('Auch mit gelockerten Kriterien')
  })

  it('unterscheidet „schon eingeplant" von „zu kurz"', () => {
    const exhausted = run({
      segments: [segment({ id: 's1', minutes: 20 }), segment({ id: 's2', minutes: 20 })],
      candidates: [
        candidate({ exerciseId: 'a', duration: 10 }),
        candidate({ exerciseId: 'b', duration: 10 }),
      ],
    })
    expect(exhausted.segments[1].gapDetail).toMatchObject({
      kind: 'exhausted',
      usableCandidates: 2,
    })

    const tooShort = run({
      segments: [segment({ minutes: 4 })],
      candidates: [candidate({ exerciseId: 'lang', duration: 20 })],
    })
    expect(tooShort.segments[0].gapDetail).toMatchObject({
      kind: 'too-short',
      remainingMinutes: 4,
      shortestDuration: 20,
    })
  })

  it('setzt keine Diagnose, wenn das Segment voll wird', () => {
    const result = run({
      segments: [segment({ minutes: 12 })],
      candidates: [candidate({ exerciseId: 'e', duration: 10 })],
    })
    expect(result.segments[0].gapDetail).toBeNull()
    expect(result.segments[0].gapReason).toBeNull()
  })
})

// ---- Einzelnes Segment lockern ----

describe('planSegment', () => {
  it('füllt ein einzelnes Segment nach denselben Regeln', () => {
    const plan = planSegment({
      segment: segment({ minutes: 20 }),
      segmentIndex: 0,
      group: group(),
      candidates: [
        candidate({ exerciseId: 'a', duration: 10 }),
        candidate({ exerciseId: 'b', duration: 10 }),
      ],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: false,
    })
    expect(plan.items).toHaveLength(2)
    expect(plan.gapReason).toBeNull()
  })

  it('übergeht Übungen, die in anderen Segmenten schon stehen', () => {
    const plan = planSegment({
      segment: segment({ minutes: 20 }),
      segmentIndex: 1,
      group: group(),
      candidates: [
        candidate({ exerciseId: 'a', duration: 10 }),
        candidate({ exerciseId: 'b', duration: 10 }),
      ],
      recentExerciseIds: [],
      blockedExerciseIds: ['a'],
      seed: 5,
      relax: false,
    })
    expect(plan.items.map((i) => i.exerciseId)).toEqual(['b'])
    expect(plan.gapDetail?.kind).toBe('exhausted')
  })

  it('begründet einen erfolglosen Lockerungsversuch, statt stumm zu bleiben', () => {
    const plan = planSegment({
      segment: segment({ minutes: 20 }),
      segmentIndex: 0,
      group: group({ venueMaterials: [{ name: 'Hütchen', quantity: 2 }] }),
      candidates: [
        candidate({
          exerciseId: 'e',
          materials: [{ name: 'Hütchen', quantity: 20, mode: 'insgesamt' }],
        }),
      ],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.items).toEqual([])
    expect(plan.relaxLevel).toBe(0)
    expect(plan.relaxNote).toBe('„Hauptteil": Lockern hat nichts gebracht, die Lücke bleibt.')
  })

  it('meldet den Erfolg mit Anzahl der ergänzten Übungen', () => {
    const plan = planSegment({
      segment: segment({ minutes: 10, difficulties: ['Leicht'] }),
      segmentIndex: 0,
      group: group(),
      candidates: [candidate({ exerciseId: 'schwer', difficulty: 'Schwer' })],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.relaxLevel).toBe(2)
    expect(plan.relaxNote).toBe('„Hauptteil": Schwierigkeitsgrad gelockert — 1 Übung ergänzt.')
  })

  it('lässt ein freies Segment unangetastet', () => {
    const plan = planSegment({
      segment: segment({ fillMode: 'empty', minutes: 20 }),
      segmentIndex: 0,
      group: group(),
      candidates: [candidate({ exerciseId: 'e' })],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.items).toEqual([])
    expect(plan.gapReason).toBeNull()
    expect(plan.relaxNote).toBeNull()
  })
})

describe('failedCriteriaOf — Auskunft je Kandidat (PROJ-7)', () => {
  it('ist leer, wenn der Kandidat alle Kriterien erfüllt', () => {
    expect(failedCriteriaOf(candidate({ exerciseId: 'a' }), segment(), group())).toEqual([])
  })

  it('nennt die Phase, wenn die Übung dem Segment nicht zugeordnet ist', () => {
    expect(
      failedCriteriaOf(candidate({ exerciseId: 'a', phases: ['Aufwärmen'] }), segment(), group())
    ).toEqual(['phase'])
  })

  it('nennt jedes verfehlte Kriterium, nicht nur das erste', () => {
    const failed = failedCriteriaOf(
      candidate({
        exerciseId: 'a',
        sports: ['Volleyball'],
        difficulty: 'Schwer',
        ageGroups: ['Senioren (60+)'],
        participantsMax: 10,
        materials: [{ name: 'Reifen', quantity: 6, mode: 'insgesamt' }],
      }),
      segment({ difficulties: ['Leicht'] }),
      group({ venueMaterials: [] })
    )

    expect([...failed].sort()).toEqual(['age', 'difficulty', 'material', 'participants', 'sport'])
  })

  it('urteilt wie der Generator: was er einplant, hat kein verfehltes Kriterium', () => {
    const candidates = [
      candidate({ exerciseId: 'passt' }),
      candidate({ exerciseId: 'falsche-sportart', sports: ['Volleyball'] }),
      candidate({ exerciseId: 'falsche-phase', phases: ['Cool-Down'] }),
      candidate({ exerciseId: 'zu-klein', participantsMax: 5 }),
    ]
    const plan = planSegment({
      segment: segment(),
      segmentIndex: 0,
      group: group(),
      candidates,
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 1,
      relax: false,
    })

    const fitting = candidates
      .filter((entry) => failedCriteriaOf(entry, segment(), group()).length === 0)
      .map((entry) => entry.exerciseId)

    expect(fitting).toEqual(['passt'])
    expect(plan.usedExerciseIds).toEqual(['passt'])
  })

  it('prüft immer streng — ein gelockert entstandenes Segment ändert daran nichts', () => {
    expect(
      failedCriteriaOf(
        candidate({ exerciseId: 'a', difficulty: 'Schwer' }),
        segment({ difficulties: ['Leicht'] }),
        group()
      )
    ).toEqual(['difficulty'])
  })
})

// ---- Organisationsform als weiches Kriterium (PROJ-7, Überarbeitung 2026-10-09) ----

describe('Organisationsform je Phase', () => {
  const kreis = candidate({ exerciseId: 'kreis', organizationForms: ['Kreis / Sitzkreis'] })
  const gruppen = candidate({ exerciseId: 'gruppen', organizationForms: ['Kleingruppen'] })
  const ohne = candidate({ exerciseId: 'ohne', organizationForms: [] })

  it('schränkt ohne Auswahl nichts ein', () => {
    const result = run({
      segments: [segment({ minutes: 30 })],
      candidates: [kreis, gruppen, ohne],
    })
    expect(usedIds(result).sort()).toEqual(['gruppen', 'kreis', 'ohne'])
  })

  it('nimmt nur Übungen mit einer der gewählten Organisationsformen', () => {
    const result = run({
      segments: [segment({ minutes: 30, organizationForms: ['Kleingruppen'] })],
      candidates: [kreis, gruppen, ohne],
    })
    expect(usedIds(result)).toEqual(['gruppen'])
  })

  it('lässt eine Übung ohne Organisationsform nicht durch, sobald eine gewählt ist', () => {
    expect(
      failedCriteriaOf(ohne, segment({ organizationForms: ['Kleingruppen'] }), group())
    ).toEqual(['organization'])
  })

  it('vergleicht ohne Rücksicht auf Groß- und Kleinschreibung', () => {
    expect(
      failedCriteriaOf(gruppen, segment({ organizationForms: ['  kleingruppen '] }), group())
    ).toEqual([])
  })

  it('zählt eine Variante mit ihrer eigenen Organisationsform', () => {
    const variante = candidate({
      exerciseId: 'kreis',
      variantId: 'v1',
      organizationForms: ['Kleingruppen'],
    })
    const result = run({
      segments: [segment({ minutes: 10, organizationForms: ['Kleingruppen'] })],
      candidates: [kreis, variante],
    })
    expect(result.segments[0].items.map((item) => item.variantId)).toEqual(['v1'])
  })

  it('nennt die Organisationsform im Lückenhinweis als eigene Ursache mit Anzahl', () => {
    const result = run({
      segments: [segment({ organizationForms: ['Stationsbetrieb'] })],
      candidates: [kreis, gruppen],
    })
    expect(result.segments[0].gapDetail?.blockedBy).toEqual([
      { criterion: 'organization', count: 2 },
    ])
  })

  it('gibt beim Lockern die Organisationsform als Erstes frei', () => {
    const plan = planSegment({
      segment: segment({ minutes: 10, organizationForms: ['Stationsbetrieb'] }),
      segmentIndex: 0,
      group: group(),
      candidates: [kreis],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.relaxLevel).toBe(1)
    expect(plan.relaxNote).toBe('„Hauptteil": Organisationsform gelockert — 1 Übung ergänzt.')
  })

  it('nennt im Hinweis alles, was freigegeben wurde', () => {
    const plan = planSegment({
      segment: segment({
        minutes: 10,
        difficulties: ['Leicht'],
        organizationForms: ['Stationsbetrieb'],
      }),
      segmentIndex: 0,
      group: group(),
      candidates: [candidate({ exerciseId: 'schwer', difficulty: 'Schwer' })],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.relaxLevel).toBe(2)
    expect(plan.relaxNote).toBe(
      '„Hauptteil": Organisationsform und Schwierigkeitsgrad gelockert — 1 Übung ergänzt.'
    )
  })

  it('überspringt die Stufe, wenn die Phase keine Organisationsform gewählt hat', () => {
    const plan = planSegment({
      segment: segment({ minutes: 10, sports: ['Volleyball'] }),
      segmentIndex: 0,
      group: group(),
      candidates: [candidate({ exerciseId: 'turnen' })],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.relaxLevel).toBe(3)
    expect(plan.relaxNote).toBe(
      '„Hauptteil": Schwierigkeitsgrad und Sportart-Vorgabe gelockert — 1 Übung ergänzt.'
    )
  })

  it('lässt harte Kriterien auch auf der letzten Stufe stehen', () => {
    const plan = planSegment({
      segment: segment({ minutes: 10, organizationForms: ['Stationsbetrieb'] }),
      segmentIndex: 0,
      group: group({ ageGroups: ['Senioren'] }),
      candidates: [kreis],
      recentExerciseIds: [],
      blockedExerciseIds: [],
      seed: 5,
      relax: true,
    })
    expect(plan.items).toEqual([])
    expect(plan.gapDetail?.blockedBy).toEqual([{ criterion: 'age', count: 1 }])
  })
})
