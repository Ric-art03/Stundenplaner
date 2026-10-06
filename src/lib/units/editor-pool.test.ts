import { describe, it, expect } from 'vitest'
import {
  drawCandidate,
  drawablePool,
  failureLabel,
  keyOf,
  passes,
  placementFrom,
  splitForPicker,
  variantsOf,
  type EditorCandidate,
} from './editor-pool'
import type { GapCriterion } from './generator'
import type { DrawExclusions } from './draft'

function candidate(
  exerciseId: string,
  options: Partial<EditorCandidate> = {}
): EditorCandidate {
  return {
    exerciseId,
    variantId: null,
    name: `Übung ${exerciseId}`,
    variantTitle: null,
    phases: ['Aufwärmen'],
    sports: ['Turnen'],
    difficulty: 'Mittel',
    ageGroups: ['Kinder (7–10)'],
    organizationForms: [],
    materials: [],
    participantsMin: null,
    participantsMax: null,
    duration: 10,
    musicRequired: false,
    musicLink: null,
    variantCount: 0,
    failedCriteria: [],
    needsCompletion: false,
    ...options,
  }
}

function exclusions(exerciseIds: string[] = [], keys: string[] = []): DrawExclusions {
  return { exerciseIds: new Set(exerciseIds), keys: new Set(keys) }
}

/** Zieht immer den Kandidaten an der gegebenen Stelle. */
function pick(index: number, size: number): () => number {
  return () => index / size
}

// ---- Eignung ----

describe('passes und failureLabel', () => {
  it('ohne verfehlte Kriterien passt der Kandidat', () => {
    expect(passes(candidate('a'))).toBe(true)
  })

  it('nennt die verfehlten Kriterien in lesbaren Worten', () => {
    const failing = candidate('a', { failedCriteria: ['material', 'age'] as GapCriterion[] })

    expect(passes(failing)).toBe(false)
    expect(failureLabel(failing)).toBe('Material, Altersgruppe')
  })
})

// ---- Schlüssel ----

describe('keyOf', () => {
  it('unterscheidet Hauptübung und Variante', () => {
    expect(keyOf(candidate('a'))).toBe('a:')
    expect(keyOf(candidate('a', { variantId: 'v1' }))).toBe('a:v1')
  })
})

// ---- Einsetzen ----

describe('placementFrom', () => {
  it('überträgt die Schätzdauer als Schätzdauer, nicht als Plandauer', () => {
    const next = placementFrom(candidate('a', { duration: 12 }))

    expect(next.exerciseId).toBe('a')
    expect(next.exercise.estimatedDuration).toBe(12)
  })

  it('überträgt den Variantentitel und die Kennung der Variante', () => {
    const next = placementFrom(
      candidate('a', { variantId: 'v1', variantTitle: 'Leichter' })
    )

    expect(next.variantId).toBe('v1')
    expect(next.exercise.variantTitle).toBe('Leichter')
  })

  it('überträgt das Material der Variante, nicht das der Hauptübung', () => {
    // Die Auflösung ist in `buildCandidates` schon passiert — hier wird nur
    // geprüft, dass sie nicht wieder verloren geht.
    const next = placementFrom(
      candidate('a', {
        variantId: 'v1',
        materials: [{ name: 'Reifen', quantity: 4, mode: 'insgesamt' }],
      })
    )

    expect(next.exercise.materials).toEqual([
      { name: 'Reifen', quantity: 4, mode: 'insgesamt' },
    ])
  })
})

// ---- Ziehbarer Vorrat ----

describe('drawablePool', () => {
  const pool = [
    candidate('a'),
    candidate('b'),
    candidate('c', { failedCriteria: ['material'] as GapCriterion[] }),
  ]

  it('lässt unpassende Kandidaten weg — ausgewürfelt wird nur Passendes', () => {
    expect(drawablePool(pool, exclusions()).map((c) => c.exerciseId)).toEqual(['a', 'b'])
  })

  it('lässt aus, was in der Einheit schon steht', () => {
    expect(drawablePool(pool, exclusions(['a'])).map((c) => c.exerciseId)).toEqual(['b'])
  })

  it('lässt aus, was an diesem Platz weggewürfelt wurde', () => {
    expect(drawablePool(pool, exclusions([], ['b:'])).map((c) => c.exerciseId)).toEqual(['a'])
  })

  it('schließt eine Variante mit aus, wenn die Hauptübung in der Einheit steht', () => {
    const withVariant = [candidate('a'), candidate('a', { variantId: 'v1' })]
    expect(drawablePool(withVariant, exclusions(['a']))).toEqual([])
  })
})

// ---- Auswürfeln ----

describe('drawCandidate', () => {
  it('zieht eine Übung aus dem Vorrat', () => {
    const pool = [candidate('a'), candidate('b')]
    expect(drawCandidate(pool, exclusions(), pick(1, 2))?.exerciseId).toBe('b')
  })

  it('gibt null zurück, wenn der Vorrat erschöpft ist', () => {
    const pool = [candidate('a')]
    expect(drawCandidate(pool, exclusions(['a']))).toBeNull()
  })

  it('gibt null zurück, wenn der einzige Kandidat schon im Platz steht', () => {
    // Edge Case 5: kein stilles Nichts-Passiert, sondern eine Meldung.
    const pool = [candidate('a')]
    expect(drawCandidate(pool, exclusions(['a'], []))).toBeNull()
  })

  it('gibt null zurück bei leerem Pool', () => {
    expect(drawCandidate([], exclusions())).toBeNull()
  })

  it('zieht auch bei einem Zufallswert von 1 noch einen gültigen Kandidaten', () => {
    const pool = [candidate('a'), candidate('b')]
    expect(drawCandidate(pool, exclusions(), () => 1)?.exerciseId).toBe('b')
  })

  it('wiederholt nach dreimaligem Würfeln keine der gezeigten Übungen', () => {
    const pool = [candidate('a'), candidate('b'), candidate('c'), candidate('d')]
    // a steht im Platz, b und c wurden weggewürfelt.
    const drawn = drawCandidate(pool, exclusions(['a'], ['b:', 'c:']), pick(0, 1))

    expect(drawn?.exerciseId).toBe('d')
  })
})

// ---- Varianten ----

describe('variantsOf', () => {
  it('nennt Hauptübung und alle Varianten, Hauptübung zuerst', () => {
    const pool = [
      candidate('a', { variantId: 'v1', variantTitle: 'Leichter' }),
      candidate('a'),
      candidate('a', { variantId: 'v2', variantTitle: 'Schwerer' }),
      candidate('b'),
    ]

    expect(variantsOf(pool, 'a').map((c) => c.variantId)).toEqual([null, 'v1', 'v2'])
  })

  it('bietet bei einer Übung ohne Varianten nur sie selbst', () => {
    expect(variantsOf([candidate('a')], 'a')).toHaveLength(1)
  })

  it('bietet auch unpassende Varianten an — die Wahl liegt beim Nutzer', () => {
    const pool = [
      candidate('a'),
      candidate('a', { variantId: 'v1', failedCriteria: ['material'] as GapCriterion[] }),
    ]
    expect(variantsOf(pool, 'a')).toHaveLength(2)
  })
})

// ---- Auswahldialog ----

describe('splitForPicker', () => {
  const pool = [
    candidate('a', { name: 'Hasenhüpfen' }),
    candidate('b', { name: 'Ballschule' }),
    candidate('c', { name: 'Hasenjagd', failedCriteria: ['material'] as GapCriterion[] }),
  ]

  it('trennt passende von unpassenden', () => {
    const { fitting, others } = splitForPicker(pool, '')

    expect(fitting.map((c) => c.name)).toEqual(['Hasenhüpfen', 'Ballschule'])
    expect(others.map((c) => c.name)).toEqual(['Hasenjagd'])
  })

  it('filtert in beiden Gruppen', () => {
    const { fitting, others } = splitForPicker(pool, 'hase')

    expect(fitting.map((c) => c.name)).toEqual(['Hasenhüpfen'])
    expect(others.map((c) => c.name)).toEqual(['Hasenjagd'])
  })

  it('sucht ohne Rücksicht auf Groß- und Kleinschreibung', () => {
    expect(splitForPicker(pool, 'BALL').fitting).toHaveLength(1)
  })

  it('sucht auch im Variantentitel', () => {
    const withVariant = [candidate('a', { name: 'Fangen', variantTitle: 'im Kreis' })]
    expect(splitForPicker(withVariant, 'kreis').fitting).toHaveLength(1)
  })

  it('findet bei einem Suchbegriff ohne Treffer nichts — dann greift „Schnell anlegen"', () => {
    const { fitting, others } = splitForPicker(pool, 'Trampolin')

    expect(fitting).toEqual([])
    expect(others).toEqual([])
  })
})
