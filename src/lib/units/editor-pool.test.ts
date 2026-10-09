import { describe, it, expect } from 'vitest'
import {
  buildEditorPool,
  describeExhaustion,
  drawCandidate,
  drawablePool,
  failureLabel,
  groupForPicker,
  keyOf,
  passes,
  placementFrom,
  variantNamesOf,
  variantsOf,
  type EditorCandidate,
  type EditorSource,
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
    variants: [],
    recentlyUsed: false,
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

describe('groupForPicker — eine Zeile je Übung', () => {
  const pool = [
    candidate('a', { name: 'Hasenhüpfen' }),
    candidate('b', { name: 'Ballschule' }),
    candidate('c', { name: 'Hasenjagd', failedCriteria: ['material'] as GapCriterion[] }),
  ]

  it('trennt passende von unpassenden', () => {
    const { fitting, others } = groupForPicker(pool, '')

    expect(fitting.map((entry) => entry.name)).toEqual(['Hasenhüpfen', 'Ballschule'])
    expect(others.map((entry) => entry.name)).toEqual(['Hasenjagd'])
  })

  it('filtert in beiden Gruppen', () => {
    const { fitting, others } = groupForPicker(pool, 'hase')

    expect(fitting.map((entry) => entry.name)).toEqual(['Hasenhüpfen'])
    expect(others.map((entry) => entry.name)).toEqual(['Hasenjagd'])
  })

  it('sucht ohne Rücksicht auf Groß- und Kleinschreibung', () => {
    expect(groupForPicker(pool, 'BALL').fitting).toHaveLength(1)
  })

  it('findet bei einem Suchbegriff ohne Treffer nichts — dann greift „Schnell anlegen"', () => {
    const { fitting, others } = groupForPicker(pool, 'Trampolin')

    expect(fitting).toEqual([])
    expect(others).toEqual([])
  })

  describe('mit Varianten', () => {
    const failing = ['material'] as GapCriterion[]
    const fangen = [
      candidate('f', { name: 'Fangen' }),
      candidate('f', { name: 'Fangen', variantId: 'v1', variantTitle: 'im Kreis' }),
      candidate('f', { name: 'Fangen', variantId: 'v2', variantTitle: 'mit Ball' }),
    ]

    it('fasst Grundübung und Varianten zu einer Zeile zusammen, Grundübung zuerst', () => {
      const shuffled = [fangen[2], fangen[0], fangen[1]]
      const { fitting } = groupForPicker(shuffled, '')

      expect(fitting).toHaveLength(1)
      expect(fitting[0].forms.map((form) => form.variantId)).toEqual([null, 'v2', 'v1'])
    })

    it('zählt Übungen, nicht Formen', () => {
      expect(groupForPicker([...fangen, candidate('b')], '').fitting).toHaveLength(2)
    })

    it('setzt die Grundübung ein, wenn sie passt', () => {
      expect(groupForPicker(fangen, '').fitting[0].preferred.variantId).toBeNull()
    })

    it('steht unter „Passend", wenn nur eine Variante passt — und setzt genau die ein', () => {
      const onlyVariant = [
        { ...fangen[0], failedCriteria: failing },
        { ...fangen[1], failedCriteria: failing },
        fangen[2],
      ]
      const { fitting, others } = groupForPicker(onlyVariant, '')

      expect(others).toEqual([])
      expect(fitting[0].fits).toBe(true)
      expect(fitting[0].preferred.variantId).toBe('v2')
    })

    it('steht unter den unpassenden, wenn keine Form passt, und setzt die Grundübung ein', () => {
      const none = fangen.map((form) => ({ ...form, failedCriteria: failing }))
      const { fitting, others } = groupForPicker(none, '')

      expect(fitting).toEqual([])
      expect(others[0].preferred.variantId).toBeNull()
    })

    it('findet die Übung über den Titel einer Variante und zeigt dann alle Formen', () => {
      const { fitting } = groupForPicker(fangen, 'kreis')

      expect(fitting).toHaveLength(1)
      expect(fitting[0].forms).toHaveLength(3)
    })
  })
})

describe('buildEditorPool', () => {
  function source(id: string, options: Partial<EditorSource> = {}): EditorSource {
    return {
      id,
      name: `Übung ${id}`,
      phases: ['Aufwärmen'],
      sports: ['Turnen'],
      difficulty: 'Mittel',
      ageGroups: ['Kinder (7–10)'],
      organizationForms: [],
      duration: 10,
      participantsMin: null,
      participantsMax: null,
      materials: [],
      variants: [],
      musicRequired: false,
      musicLink: null,
      needsCompletion: false,
      ...options,
    }
  }

  const segment = {
    id: 's1',
    name: 'Aufwärmen',
    minutes: 10,
    fillMode: 'generate' as const,
    sports: ['Turnen'],
    primarySport: null,
    difficulties: ['Mittel' as const],
    organizationForms: [],
    notes: '',
  }
  const group = { ageGroups: ['Kinder (7–10)'], participants: 12, venueMaterials: null }

  it('liefert alle Übungen, auch die unpassenden — mit Begründung', () => {
    const pool = buildEditorPool(
      [source('a'), source('b', { phases: ['Hauptteil'], sports: ['Volleyball'] })],
      segment,
      group
    )

    expect(pool.map((entry) => entry.exerciseId)).toEqual(['a', 'b'])
    expect(pool[0].failedCriteria).toEqual([])
    expect(pool[1].failedCriteria).toEqual(['phase', 'sport'])
  })

  it('führt Varianten als eigene Einträge und zählt sie an der Übung', () => {
    const pool = buildEditorPool(
      [
        source('a', {
          variants: [
            { id: 'v1', title: 'Mit Ball', description: 'x' },
            { id: 'v2', title: 'Zu zweit', description: 'x' },
          ],
        }),
      ],
      segment,
      group
    )

    expect(pool.map((entry) => entry.variantId)).toEqual([null, 'v1', 'v2'])
    expect(pool.every((entry) => entry.variants.length === 2)).toBe(true)
    expect(pool[0].variants).toEqual([
      { id: 'v1', title: 'Mit Ball' },
      { id: 'v2', title: 'Zu zweit' },
    ])
  })

  it('beurteilt eine Variante nach ihrem eigenen Material', () => {
    const pool = buildEditorPool(
      [
        source('a', {
          variants: [
            {
              id: 'v1',
              title: 'Mit Kasten',
              description: 'x',
              materials: [{ name: 'Großer Kasten', quantity: 2, mode: 'insgesamt' }],
            },
          ],
        }),
      ],
      segment,
      { ...group, venueMaterials: [] }
    )

    expect(pool[0].failedCriteria).toEqual([])
    expect(pool[1].failedCriteria).toEqual(['material'])
  })

  it('reicht Musik und die Markierung „noch zu ergänzen" durch', () => {
    const [entry] = buildEditorPool(
      [source('a', { musicRequired: true, musicLink: 'https://example.org', needsCompletion: true })],
      segment,
      group
    )

    expect(entry.musicRequired).toBe(true)
    expect(entry.musicLink).toBe('https://example.org')
    expect(entry.needsCompletion).toBe(true)
  })

  it('benachteiligt eine markierte Übung nicht — die Markierung ist kein Kriterium', () => {
    const [entry] = buildEditorPool([source('a', { needsCompletion: true })], segment, group)
    expect(passes(entry)).toBe(true)
  })
})

describe('describeExhaustion', () => {
  it('sagt, wenn es gar keine Übungen gibt', () => {
    expect(describeExhaustion([], exclusions(), 'Aufwärmen')).toContain('noch keine Übungen')
  })

  it('sagt, wenn keine Übung der Phase zugeordnet ist', () => {
    const pool = [
      candidate('a', { failedCriteria: ['phase'] }),
      candidate('b', { failedCriteria: ['phase', 'sport'] }),
    ]
    expect(describeExhaustion(pool, exclusions(), 'Aufwärmen')).toBe(
      'Keine deiner 2 Übungen ist der Phase „Aufwärmen" zugeordnet.'
    )
  })

  it('nennt jede Ursache einzeln und mit Anzahl', () => {
    const pool = [
      candidate('a'),
      candidate('b'),
      candidate('c'),
      candidate('d', { failedCriteria: ['sport'] }),
      candidate('e', { failedCriteria: ['sport', 'material'] }),
      candidate('f', { failedCriteria: ['age'] }),
      candidate('g', { failedCriteria: ['phase'] }),
    ]

    const text = describeExhaustion(pool, exclusions(['a', 'b'], [keyOf(pool[2])]), 'Aufwärmen')

    expect(text).toContain('6 Übungen tragen die Phase „Aufwärmen"')
    expect(text).toContain('2 × Sportart')
    expect(text).toContain('1 × Material')
    expect(text).toContain('1 × Altersgruppe')
    expect(text).toContain('2 × steht schon in dieser Einheit')
    expect(text).toContain('1 × hier schon weggewürfelt')
    expect(text).not.toContain('Schwierigkeit')
    expect(text).not.toContain('Teilnehmerzahl')
  })

  it('zählt eine Übung nicht doppelt, die in der Einheit steht und weggewürfelt wurde', () => {
    const pool = [candidate('a')]
    const text = describeExhaustion(pool, exclusions(['a'], [keyOf(pool[0])]), 'Aufwärmen')

    expect(text).toContain('1 × steht schon in dieser Einheit')
    expect(text).not.toContain('weggewürfelt')
  })

  it('kommt mit dem Fall aus Edge Case 5 zurecht: ein einziger Kandidat, er steht im Platz', () => {
    const text = describeExhaustion([candidate('a')], exclusions(['a']), 'Cool-Down')
    expect(text).toBe(
      'Eine Übung trägt die Phase „Cool-Down", ist aber nicht mehr frei. Woran es hängt: 1 × steht schon in dieser Einheit.'
    )
  })
})

// ---- Auswürfeln nach den Regeln des Generators (Überarbeitung 2026-10-09) ----

describe('drawCandidate — Frische und Hauptsportart', () => {
  /** Liefert die gegebenen Zufallswerte der Reihe nach. */
  function sequence(...values: number[]): () => number {
    let index = 0
    return () => values[Math.min(index++, values.length - 1)]
  }

  it('zieht frische Übungen zuerst', () => {
    const pool = [candidate('alt', { recentlyUsed: true }), candidate('neu')]

    for (const value of [0, 0.3, 0.6, 0.99]) {
      expect(drawCandidate(pool, exclusions(), () => value)?.exerciseId).toBe('neu')
    }
  })

  it('zieht kürzlich verwendete erst, wenn sonst nichts frei ist', () => {
    const pool = [candidate('alt', { recentlyUsed: true }), candidate('neu')]
    expect(drawCandidate(pool, exclusions(['neu']))?.exerciseId).toBe('alt')
  })

  it('zieht erst die Sportart, dann die Übung — die Hauptsportart liegt zweimal im Topf', () => {
    // Zehn Volleyball-Übungen, eine Turnübung: bei einem Gewicht je Übung käme
    // Turnen kaum dran. Gezogen wird aber zuerst die Sportart.
    const pool = [
      ...Array.from({ length: 10 }, (_, i) => candidate(`v${i}`, { sports: ['Volleyball'] })),
      candidate('turnen', { sports: ['Turnen'] }),
    ]
    const weighting = { sports: ['Volleyball', 'Turnen'], primarySport: 'Turnen' }
    const random = createSeeded(11)

    let turnen = 0
    for (let i = 0; i < 3000; i += 1) {
      if (drawCandidate(pool, exclusions(), random, weighting)?.exerciseId === 'turnen') turnen += 1
    }

    // Topf: Volleyball, Turnen, Turnen → zwei von drei.
    expect(turnen / 3000).toBeGreaterThan(0.62)
    expect(turnen / 3000).toBeLessThan(0.72)
  })

  it('gewichtet ohne Hauptsportart alle Sportarten gleich', () => {
    const pool = [
      candidate('v', { sports: ['Volleyball'] }),
      candidate('t', { sports: ['Turnen'] }),
    ]
    const weighting = { sports: ['Volleyball', 'Turnen'], primarySport: null }

    expect(drawCandidate(pool, exclusions(), sequence(0, 0), weighting)?.exerciseId).toBe('v')
    expect(drawCandidate(pool, exclusions(), sequence(0.99, 0), weighting)?.exerciseId).toBe('t')
  })

  it('zieht unter allen, wenn die gezogene Sportart nichts mehr hat', () => {
    const pool = [candidate('v', { sports: ['Volleyball'] })]
    const weighting = { sports: ['Volleyball', 'Turnen'], primarySport: 'Turnen' }

    // Turnen wird gezogen, hat aber keine Übung — also nicht „nichts".
    expect(drawCandidate(pool, exclusions(), sequence(0.99, 0), weighting)?.exerciseId).toBe('v')
  })

  it('stellt Frische vor die Sportart', () => {
    const pool = [
      candidate('t-alt', { sports: ['Turnen'], recentlyUsed: true }),
      candidate('v-neu', { sports: ['Volleyball'] }),
    ]
    const weighting = { sports: ['Volleyball', 'Turnen'], primarySport: 'Turnen' }

    expect(drawCandidate(pool, exclusions(), sequence(0.99, 0), weighting)?.exerciseId).toBe('v-neu')
  })

  it('meldet einen erschöpften Vorrat auch mit Gewichtung als null', () => {
    const weighting = { sports: ['Turnen'], primarySport: null }
    expect(drawCandidate([candidate('a')], exclusions(['a']), Math.random, weighting)).toBeNull()
  })
})

/** Kleiner, fester Zufall für die Häufigkeitsprüfung — unabhängig vom Generator. */
function createSeeded(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

describe('variantNamesOf und „kürzlich verwendet"', () => {
  it('liefert die Varianten mit Namen und lässt solche ohne Kennung weg', () => {
    expect(
      variantNamesOf({
        variants: [
          { id: 'v1', title: 'Mit Ball', description: 'x' },
          { title: 'Noch nicht gespeichert', description: 'x' },
        ],
      })
    ).toEqual([{ id: 'v1', title: 'Mit Ball' }])
  })

  it('gibt die Varianten an den Platz weiter', () => {
    const variants = [{ id: 'v1', title: 'Mit Ball' }]
    expect(placementFrom(candidate('a', { variants })).exercise.variants).toEqual(variants)
  })
})
