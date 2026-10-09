import { describe, it, expect } from 'vitest'
import {
  MIN_ITEM_MINUTES,
  createDraft,
  declareAllOpenGaps,
  declarePlannedGap,
  draftsEqual,
  exclusionsFor,
  gapState,
  openGaps,
  reopenGap,
  insertItem,
  moveItem,
  plannedMinutes,
  removeItem,
  rerollItem,
  segmentBalance,
  segmentFits,
  setItemDuration,
  setItemExercise,
  setSegmentNotes,
  usedExerciseIds,
  type DraftItemExercise,
  type DraftPlacement,
  type SegmentFrame,
  type UnitDraft,
} from './draft'
import type { Unit, UnitItem, UnitSegment } from '@/lib/types/unit'

// ---- Testdaten ----

function exercise(id: string, duration = 10): DraftItemExercise {
  return {
    id,
    name: `Übung ${id}`,
    estimatedDuration: duration,
    sports: ['Turnen'],
    difficulty: 'Mittel',
    organizationForms: [],
    materials: [],
    musicRequired: false,
    musicLink: null,
    variants: [],
    variantTitle: null,
    workNotes: null,
  }
}

function placement(id: string, variantId: string | null = null, duration = 10): DraftPlacement {
  return { exerciseId: id, variantId, exercise: exercise(id, duration) }
}

function item(id: string, exerciseId: string | null, minutes: number, position: number): UnitItem {
  return {
    id,
    exerciseId,
    variantId: null,
    plannedDuration: minutes,
    position,
    exercise: exerciseId === null ? null : { ...exercise(exerciseId), description: '' },
  }
}

function segment(id: string, minutes: number, items: UnitItem[], notes = ''): UnitSegment {
  return {
    id,
    name: 'Aufwärmen',
    minutes,
    fillMode: 'generate',
    sports: ['Turnen'],
    primarySport: 'Turnen',
    difficulties: ['Mittel'],
    organizationForms: [],
    notes,
    plannedGapMinutes: 0,
    gapReason: null,
    gapDetail: null,
    position: 0,
    items,
  }
}

function unit(segments: UnitSegment[]): Unit {
  return {
    id: 'u1',
    userId: 'nutzer',
    groupId: 'g1',
    groupName: 'Gruppe',
    name: 'Einheit',
    totalMinutes: segments.reduce((sum, s) => sum + s.minutes, 0),
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

/** Ein Segment mit drei Übungen à 5 Minuten, Gerüst 15 Minuten. */
function threeItemDraft(): UnitDraft {
  return createDraft(
    unit([
      segment('s1', 15, [
        item('i1', 'a', 5, 0),
        item('i2', 'b', 5, 1),
        item('i3', 'c', 5, 2),
      ]),
    ])
  )
}

function keysOf(draft: UnitDraft, segmentId = 's1'): string[] {
  const found = draft.segments.find((s) => s.id === segmentId)
  return (found?.items ?? []).map((entry) => entry.exerciseId ?? '—')
}

// ---- Anlegen ----

describe('createDraft', () => {
  it('übernimmt Notiz, Übungen, Plandauern und Reihenfolge', () => {
    const draft = createDraft(
      unit([segment('s1', 15, [item('i1', 'a', 5, 0), item('i2', 'b', 7, 1)], 'Hinweis')])
    )

    expect(draft.segments).toHaveLength(1)
    expect(draft.segments[0].notes).toBe('Hinweis')
    expect(keysOf(draft)).toEqual(['a', 'b'])
    expect(draft.segments[0].items.map((i) => i.plannedDuration)).toEqual([5, 7])
  })

  it('nimmt die Datenbank-Kennung als Schlüssel des Platzes', () => {
    const draft = createDraft(unit([segment('s1', 5, [item('i1', 'a', 5, 0)])]))
    expect(draft.segments[0].items[0].key).toBe('i1')
  })

  it('behält eine gelöschte Übung als Platzhalter mit ihren Minuten', () => {
    const draft = createDraft(unit([segment('s1', 8, [item('i1', null, 8, 0)])]))

    expect(draft.segments[0].items[0].exerciseId).toBeNull()
    expect(draft.segments[0].items[0].exercise).toBeNull()
    expect(draft.segments[0].items[0].plannedDuration).toBe(8)
  })

  it('beginnt ohne weggewürfelte Übungen', () => {
    const draft = threeItemDraft()
    expect(draft.segments[0].items.every((i) => i.rejected.length === 0)).toBe(true)
  })
})

// ---- Reinheit ----

describe('Reinheit der Operationen', () => {
  it('lässt den Ausgangsstand unberührt — darauf baut Rückgängig auf', () => {
    const before = threeItemDraft()
    const snapshot = JSON.stringify(before)

    removeItem(before, 's1', 'i1')
    moveItem(before, 's1', 'i2', 'up')
    setItemDuration(before, 's1', 'i1', 9)
    setSegmentNotes(before, 's1', 'neu')
    insertItem(before, 's1', placement('d'))
    setItemExercise(before, 's1', 'i1', placement('x'))
    rerollItem(before, 's1', 'i1', placement('y'))

    expect(JSON.stringify(before)).toBe(snapshot)
  })
})

// ---- Notiz ----

describe('setSegmentNotes', () => {
  it('setzt die Notiz des benannten Segments', () => {
    const draft = setSegmentNotes(threeItemDraft(), 's1', 'Bälle vorher rausstellen')
    expect(draft.segments[0].notes).toBe('Bälle vorher rausstellen')
  })

  it('lässt eine vollständig geleerte Notiz zu', () => {
    const draft = setSegmentNotes(threeItemDraft(), 's1', '')
    expect(draft.segments[0].notes).toBe('')
  })
})

// ---- Plandauer ----

describe('setItemDuration', () => {
  it('setzt die Plandauer und lässt die Schätzdauer unberührt', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', 8)
    const entry = draft.segments[0].items[0]

    expect(entry.plannedDuration).toBe(8)
    expect(entry.exercise?.estimatedDuration).toBe(10)
  })

  it('hebt 0 auf die Mindestdauer', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', 0)
    expect(draft.segments[0].items[0].plannedDuration).toBe(MIN_ITEM_MINUTES)
  })

  it('hebt einen negativen Wert auf die Mindestdauer', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', -4)
    expect(draft.segments[0].items[0].plannedDuration).toBe(MIN_ITEM_MINUTES)
  })

  it('hebt eine leere Eingabe auf die Mindestdauer', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', Number.NaN)
    expect(draft.segments[0].items[0].plannedDuration).toBe(MIN_ITEM_MINUTES)
  })

  it('setzt keine Obergrenze — Überfüllung ist eine Entscheidung', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', 400)
    expect(draft.segments[0].items[0].plannedDuration).toBe(400)
  })
})

// ---- Reihenfolge ----

describe('moveItem', () => {
  it('schiebt den mittleren Platz nach oben und lässt die übrigen in Ordnung', () => {
    const draft = moveItem(threeItemDraft(), 's1', 'i2', 'up')
    expect(keysOf(draft)).toEqual(['b', 'a', 'c'])
  })

  it('schiebt den mittleren Platz nach unten', () => {
    const draft = moveItem(threeItemDraft(), 's1', 'i2', 'down')
    expect(keysOf(draft)).toEqual(['a', 'c', 'b'])
  })

  it('tut am ersten Platz nach oben nichts', () => {
    const draft = moveItem(threeItemDraft(), 's1', 'i1', 'up')
    expect(keysOf(draft)).toEqual(['a', 'b', 'c'])
  })

  it('tut am letzten Platz nach unten nichts', () => {
    const draft = moveItem(threeItemDraft(), 's1', 'i3', 'down')
    expect(keysOf(draft)).toEqual(['a', 'b', 'c'])
  })

  it('behält die Schlüssel der Plätze, damit der Fokus nicht springt', () => {
    const draft = moveItem(threeItemDraft(), 's1', 'i2', 'up')
    expect(draft.segments[0].items.map((i) => i.key)).toEqual(['i2', 'i1', 'i3'])
  })
})

// ---- Entfernen ----

describe('removeItem', () => {
  it('entfernt den Platz und macht seine Minuten frei', () => {
    const draft = removeItem(threeItemDraft(), 's1', 'i2')

    expect(keysOf(draft)).toEqual(['a', 'c'])
    expect(segmentBalance(draft.segments[0], 15).free).toBe(5)
  })

  it('lässt ein Segment vollständig leer werden', () => {
    let draft = threeItemDraft()
    for (const key of ['i1', 'i2', 'i3']) draft = removeItem(draft, 's1', key)

    expect(draft.segments[0].items).toEqual([])
    expect(segmentBalance(draft.segments[0], 15).free).toBe(15)
  })
})

// ---- Tauschen und Auswürfeln ----

describe('setItemExercise', () => {
  it('setzt die neue Übung und behält die Minuten des Platzes', () => {
    const draft = setItemExercise(threeItemDraft(), 's1', 'i1', placement('z', null, 12))
    const entry = draft.segments[0].items[0]

    expect(entry.exerciseId).toBe('z')
    expect(entry.plannedDuration).toBe(5)
    expect(entry.exercise?.estimatedDuration).toBe(12)
  })

  it('merkt die bisherige Übung nicht als weggewürfelt', () => {
    const draft = setItemExercise(threeItemDraft(), 's1', 'i1', placement('z'))
    expect(draft.segments[0].items[0].rejected).toEqual([])
  })

  it('besetzt einen Platzhalter nach, ohne die Minuten zu ändern', () => {
    const start = createDraft(unit([segment('s1', 8, [item('i1', null, 8, 0)])]))
    const draft = setItemExercise(start, 's1', 'i1', placement('z', null, 3))
    const entry = draft.segments[0].items[0]

    expect(entry.exerciseId).toBe('z')
    expect(entry.plannedDuration).toBe(8)
  })

  it('schaltet auf eine Variante derselben Übung um', () => {
    const draft = setItemExercise(threeItemDraft(), 's1', 'i1', placement('a', 'v1'))
    const entry = draft.segments[0].items[0]

    expect(entry.exerciseId).toBe('a')
    expect(entry.variantId).toBe('v1')
  })
})

describe('rerollItem', () => {
  it('setzt die neue Übung und behält die Minuten des Platzes', () => {
    const draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('z', null, 12))
    const entry = draft.segments[0].items[0]

    expect(entry.exerciseId).toBe('z')
    expect(entry.plannedDuration).toBe(5)
  })

  it('merkt sich jede weggewürfelte Übung — dreimal würfeln sperrt drei', () => {
    let draft = threeItemDraft()
    draft = rerollItem(draft, 's1', 'i1', placement('x'))
    draft = rerollItem(draft, 's1', 'i1', placement('y'))
    draft = rerollItem(draft, 's1', 'i1', placement('z'))

    expect(draft.segments[0].items[0].rejected).toEqual(['a:', 'x:', 'y:'])
  })

  it('merkt eine Variante getrennt von ihrer Hauptübung', () => {
    const start = setItemExercise(threeItemDraft(), 's1', 'i1', placement('a', 'v1'))
    const draft = rerollItem(start, 's1', 'i1', placement('z'))

    expect(draft.segments[0].items[0].rejected).toEqual(['a:v1'])
  })

  it('merkt dieselbe Übung nicht zweimal', () => {
    let draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('x'))
    draft = setItemExercise(draft, 's1', 'i1', placement('a'))
    draft = rerollItem(draft, 's1', 'i1', placement('y'))

    expect(draft.segments[0].items[0].rejected).toEqual(['a:'])
  })

  it('hat an einem Platzhalter nichts zu merken', () => {
    const start = createDraft(unit([segment('s1', 8, [item('i1', null, 8, 0)])]))
    const draft = rerollItem(start, 's1', 'i1', placement('z'))

    expect(draft.segments[0].items[0].rejected).toEqual([])
    expect(draft.segments[0].items[0].exerciseId).toBe('z')
  })

  it('merkt nur am betroffenen Platz, nicht an den Nachbarn', () => {
    const draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('x'))
    expect(draft.segments[0].items[1].rejected).toEqual([])
    expect(draft.segments[0].items[2].rejected).toEqual([])
  })
})

// ---- Einfügen ----

describe('insertItem', () => {
  it('hängt die Übung ans Ende des Segments', () => {
    const draft = insertItem(threeItemDraft(), 's1', placement('d'))
    expect(keysOf(draft)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('setzt die Plandauer auf die Schätzdauer der Übung', () => {
    const draft = insertItem(threeItemDraft(), 's1', placement('d', null, 12))
    expect(draft.segments[0].items[3].plannedDuration).toBe(12)
  })

  it('fügt an einer bestimmten Stelle ein', () => {
    const draft = insertItem(threeItemDraft(), 's1', placement('d'), 1)
    expect(keysOf(draft)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('überfüllt ein volles Segment, statt die Übung abzulehnen', () => {
    const draft = insertItem(threeItemDraft(), 's1', placement('d', null, 6))
    const balance = segmentBalance(draft.segments[0], 15)

    expect(balance.planned).toBe(21)
    expect(balance.over).toBe(6)
  })

  it('füllt ein leeres Segment', () => {
    const start = createDraft(unit([segment('s1', 10, [])]))
    const draft = insertItem(start, 's1', placement('d', null, 10))

    expect(keysOf(draft)).toEqual(['d'])
    expect(segmentFits(draft.segments[0], 10)).toBe(true)
  })

  it('gibt jedem neuen Platz einen eigenen Schlüssel', () => {
    let draft = insertItem(threeItemDraft(), 's1', placement('d'))
    draft = insertItem(draft, 's1', placement('e'))

    const keys = draft.segments[0].items.map((i) => i.key)
    expect(new Set(keys).size).toBe(keys.length)
  })
})

// ---- Füllstand ----

describe('segmentBalance', () => {
  it('weist freie Minuten aus', () => {
    const draft = removeItem(threeItemDraft(), 's1', 'i1')
    expect(segmentBalance(draft.segments[0], 15)).toEqual({
      planned: 10,
      minutes: 15,
      free: 5,
      over: 0,
    })
  })

  it('weist überzählige Minuten aus', () => {
    const draft = setItemDuration(threeItemDraft(), 's1', 'i1', 8)
    expect(segmentBalance(draft.segments[0], 15)).toEqual({
      planned: 18,
      minutes: 15,
      free: 0,
      over: 3,
    })
  })

  it('meldet bei einem aufgehenden Segment weder frei noch über', () => {
    const balance = segmentBalance(threeItemDraft().segments[0], 15)
    expect(balance.free).toBe(0)
    expect(balance.over).toBe(0)
    expect(segmentFits(threeItemDraft().segments[0], 15)).toBe(true)
  })

  it('zählt die Plandauern, nicht die Schätzdauern', () => {
    const draft = setItemExercise(threeItemDraft(), 's1', 'i1', placement('z', null, 30))
    expect(plannedMinutes(draft.segments[0])).toBe(15)
  })
})

// ---- Ausschlüsse beim Auswürfeln ----

describe('exclusionsFor', () => {
  it('schließt alle Übungen der ganzen Einheit aus, nicht nur die des Segments', () => {
    const draft = createDraft(
      unit([
        segment('s1', 5, [item('i1', 'a', 5, 0)]),
        segment('s2', 5, [item('i2', 'b', 5, 0)]),
      ])
    )

    const exclusions = exclusionsFor(draft, 's1', 'i1')
    expect([...exclusions.exerciseIds].sort()).toEqual(['a', 'b'])
  })

  it('schließt zusätzlich die an diesem Platz weggewürfelten aus', () => {
    const draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('x'))
    expect([...exclusionsFor(draft, 's1', 'i1').keys]).toEqual(['a:'])
  })

  it('lässt einen zweiten Platz im selben Segment bei null anfangen', () => {
    const draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('x'))
    expect([...exclusionsFor(draft, 's1', 'i2').keys]).toEqual([])
  })

  it('zählt einen Platzhalter nicht als belegte Übung', () => {
    const draft = createDraft(
      unit([segment('s1', 10, [item('i1', 'a', 5, 0), item('i2', null, 5, 1)])])
    )
    expect([...exclusionsFor(draft, 's1', 'i1').exerciseIds]).toEqual(['a'])
  })
})

describe('usedExerciseIds', () => {
  it('nennt jede Übung einmal, über alle Segmente', () => {
    const draft = createDraft(
      unit([
        segment('s1', 10, [item('i1', 'a', 5, 0), item('i2', 'b', 5, 1)]),
        segment('s2', 5, [item('i3', 'a', 5, 0)]),
      ])
    )
    expect(usedExerciseIds(draft).sort()).toEqual(['a', 'b'])
  })
})

// ---- Offene Änderungen ----

describe('draftsEqual', () => {
  it('erkennt den unveränderten Ausgangsstand', () => {
    expect(draftsEqual(threeItemDraft(), threeItemDraft())).toBe(true)
  })

  it('erkennt eine geänderte Notiz', () => {
    const changed = setSegmentNotes(threeItemDraft(), 's1', 'neu')
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('erkennt eine geänderte Plandauer', () => {
    const changed = setItemDuration(threeItemDraft(), 's1', 'i1', 6)
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('erkennt eine geänderte Reihenfolge', () => {
    const changed = moveItem(threeItemDraft(), 's1', 'i2', 'up')
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('erkennt eine getauschte Übung', () => {
    const changed = setItemExercise(threeItemDraft(), 's1', 'i1', placement('z'))
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('erkennt einen entfernten Platz', () => {
    const changed = removeItem(threeItemDraft(), 's1', 'i1')
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('erkennt den Wechsel auf eine Variante', () => {
    const changed = setItemExercise(threeItemDraft(), 's1', 'i1', placement('a', 'v1'))
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })

  it('meldet keinen Unterschied, wenn über Umwege dieselbe Übung wieder im Platz steht', () => {
    // Wegwürfeln, eine andere nehmen, zurück zur ursprünglichen: am Plan hat
    // sich nichts geändert, also soll beim Verlassen nicht gefragt werden.
    let draft = rerollItem(threeItemDraft(), 's1', 'i1', placement('x'))
    draft = setItemExercise(draft, 's1', 'i1', placement('a'))

    expect(draftsEqual(threeItemDraft(), draft)).toBe(true)
  })

  it('meldet keinen Unterschied bei bloß neu gesetzten Anzeigedaten', () => {
    const draft = setItemExercise(threeItemDraft(), 's1', 'i1', {
      exerciseId: 'a',
      variantId: null,
      exercise: { ...exercise('a'), name: 'anders geschrieben' },
    })
    expect(draftsEqual(threeItemDraft(), draft)).toBe(true)
  })

  it('erkennt eine eingefügte Übung', () => {
    const changed = insertItem(threeItemDraft(), 's1', placement('d'))
    expect(draftsEqual(threeItemDraft(), changed)).toBe(false)
  })
})

// ---- Geplante Lücke (Überarbeitung 2026-10-09) ----

describe('gapState — die eine Regel für freie Minuten', () => {
  it('kennt ohne freie Minuten keine Lücke', () => {
    expect(gapState(0, 0, 'generate')).toBe('none')
    expect(gapState(0, 5, 'generate')).toBe('none')
  })

  it('hält eine nicht erklärte Lücke für offen', () => {
    expect(gapState(2, 0, 'generate')).toBe('open')
  })

  it('hält freie Minuten bis zur erklärten Zahl für geplant', () => {
    expect(gapState(2, 2, 'generate')).toBe('planned')
    expect(gapState(1, 2, 'generate')).toBe('planned')
  })

  it('öffnet die Lücke wieder, sobald mehr frei wird als erklärt', () => {
    expect(gapState(7, 2, 'generate')).toBe('open')
  })

  it('hält ein im Generator frei gelassenes Segment immer für geplant', () => {
    expect(gapState(10, 0, 'empty')).toBe('planned')
  })
})

describe('declarePlannedGap und reopenGap', () => {
  // Drei Übungen à 5 Minuten in einem Gerüst von 15.
  const FRAME: SegmentFrame = { id: 's1', name: 'Aufwärmen', minutes: 15, fillMode: 'generate' }
  const withGap = () => removeItem(threeItemDraft(), 's1', 'i3')

  it('erklärt die gerade freien Minuten als geplant', () => {
    const declared = declarePlannedGap(withGap(), 's1', 15)
    expect(declared.segments[0].plannedGapMinutes).toBe(5)
    expect(openGaps(declared, [FRAME])).toEqual([])
  })

  it('ändert nichts, wenn nichts frei ist', () => {
    const draft = threeItemDraft()
    expect(draftsEqual(declarePlannedGap(draft, 's1', 15), draft)).toBe(true)
  })

  it('gilt für den Stand, an dem erklärt wurde — eine größere Lücke ist wieder offen', () => {
    const declared = declarePlannedGap(withGap(), 's1', 15)
    const larger = removeItem(declared, 's1', 'i2')

    expect(openGaps(larger, [FRAME])).toEqual([{ ...FRAME, free: 10 }])
  })

  it('bleibt geplant, wenn die Lücke kleiner wird', () => {
    const declared = declarePlannedGap(withGap(), 's1', 15)
    const smaller = setItemDuration(declared, 's1', 'i1', 8)

    expect(openGaps(smaller, [FRAME])).toEqual([])
  })

  it('öffnet die Lücke wieder', () => {
    const reopened = reopenGap(declarePlannedGap(withGap(), 's1', 15), 's1')
    expect(reopened.segments[0].plannedGapMinutes).toBe(0)
    expect(openGaps(reopened, [FRAME])).toHaveLength(1)
  })

  it('zählt als Änderung am Plan', () => {
    const draft = withGap()
    expect(draftsEqual(draft, declarePlannedGap(draft, 's1', 15))).toBe(false)
  })

  it('übernimmt die geplanten Minuten aus der geladenen Einheit', () => {
    const loaded = createDraft(
      unit([{ ...segment('s1', 15, [item('i1', 'a', 5, 0)]), plannedGapMinutes: 10 }])
    )
    expect(loaded.segments[0].plannedGapMinutes).toBe(10)
    expect(openGaps(loaded, [FRAME])).toEqual([])
  })
})

describe('declareAllOpenGaps', () => {
  const frames: SegmentFrame[] = [
    { id: 's1', name: 'Aufwärmen', minutes: 10, fillMode: 'generate' },
    { id: 's2', name: 'Hauptteil', minutes: 20, fillMode: 'generate' },
    { id: 's3', name: 'Spiel', minutes: 10, fillMode: 'empty' },
    { id: 's4', name: 'Cool-Down', minutes: 5, fillMode: 'generate' },
  ]
  const draft = () =>
    createDraft(
      unit([
        segment('s1', 10, [item('i1', 'a', 8, 0)]),
        segment('s2', 20, []),
        { ...segment('s3', 10, []), fillMode: 'empty' },
        segment('s4', 5, [item('i4', 'd', 5, 0)]),
      ])
    )

  it('nennt nur die offenen Lücken — Restlücke und leeres Segment, nicht das frei gelassene', () => {
    expect(openGaps(draft(), frames).map((gap) => [gap.name, gap.free])).toEqual([
      ['Aufwärmen', 2],
      ['Hauptteil', 20],
    ])
  })

  it('erklärt alle offenen Lücken in einem Zug', () => {
    const declared = declareAllOpenGaps(draft(), frames)

    expect(openGaps(declared, frames)).toEqual([])
    expect(declared.segments.map((s) => s.plannedGapMinutes)).toEqual([2, 20, 0, 0])
  })

  it('lässt einen Plan ohne offene Lücke unverändert', () => {
    const full = createDraft(unit([segment('s4', 5, [item('i4', 'd', 5, 0)])]))
    expect(draftsEqual(declareAllOpenGaps(full, [frames[3]]), full)).toBe(true)
  })

  it('hält eine Überfüllung nicht für eine Lücke', () => {
    const over = createDraft(unit([segment('s4', 5, [item('i4', 'd', 9, 0)])]))
    expect(openGaps(over, [frames[3]])).toEqual([])
  })
})
