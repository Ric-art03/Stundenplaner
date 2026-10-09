import { describe, it, expect } from 'vitest'
import {
  applyChange,
  canUndo,
  changeCount,
  discardChanges,
  isDirty,
  startHistory,
  undoChange,
} from './draft-history'
import {
  insertItem,
  moveItem,
  removeItem,
  setItemDuration,
  setItemExercise,
  setSegmentNotes,
  type DraftPlacement,
  type UnitDraft,
} from './draft'
import type { Unit, UnitItem, UnitSegment } from '@/lib/types/unit'

// ---- Testdaten ----

function placement(id: string, duration = 10): DraftPlacement {
  return {
    exerciseId: id,
    variantId: null,
    exercise: {
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
    },
  }
}

function item(id: string, exerciseId: string, minutes: number, position: number): UnitItem {
  return {
    id,
    exerciseId,
    variantId: null,
    plannedDuration: minutes,
    position,
    exercise: { ...placement(exerciseId).exercise, description: '' },
  }
}

function segment(id: string, minutes: number, items: UnitItem[]): UnitSegment {
  return {
    id,
    name: 'Aufwärmen',
    minutes,
    fillMode: 'generate',
    sports: ['Turnen'],
    primarySport: 'Turnen',
    difficulties: ['Mittel'],
    organizationForms: [],
    notes: '',
    plannedGapMinutes: 0,
    gapReason: null,
    gapDetail: null,
    position: 0,
    items,
  }
}

function testUnit(): Unit {
  return {
    id: 'u1',
    userId: 'nutzer',
    groupId: 'g1',
    groupName: 'Gruppe',
    name: 'Einheit',
    totalMinutes: 15,
    seed: 1,
    manuallyEdited: false,
    saved: true,
    editorState: { mode: 'standard', expandedPosition: null },
    relaxedNote: null,
    segments: [
      segment('s1', 15, [
        item('i1', 'a', 5, 0),
        item('i2', 'b', 5, 1),
        item('i3', 'c', 5, 2),
      ]),
    ],
    createdAt: '',
    updatedAt: '',
  }
}

function names(draft: UnitDraft): string[] {
  return draft.segments[0].items.map((entry) => entry.exerciseId ?? '—')
}

// ---- Ausgangszustand ----

describe('startHistory', () => {
  it('beginnt ohne offene Änderungen', () => {
    const history = startHistory(testUnit())

    expect(changeCount(history)).toBe(0)
    expect(isDirty(history)).toBe(false)
    expect(canUndo(history)).toBe(false)
  })

  it('nimmt den geladenen Stand als Ausgangszustand', () => {
    const history = startHistory(testUnit())
    expect(history.baseline).toBe(history.present)
  })
})

// ---- Zählen ----

describe('changeCount und isDirty', () => {
  it('zählt drei Änderungen als drei', () => {
    let history = startHistory(testUnit())
    history = applyChange(history, (d) => setItemDuration(d, 's1', 'i1', 6))
    history = applyChange(history, (d) => moveItem(d, 's1', 'i2', 'up'))
    history = applyChange(history, (d) => setSegmentNotes(d, 's1', 'Hinweis'))

    expect(changeCount(history)).toBe(3)
    expect(isDirty(history)).toBe(true)
    expect(canUndo(history)).toBe(true)
  })

  it('zählt eine geänderte Notiz als Änderung — sie löst die Nachfrage aus', () => {
    const history = applyChange(startHistory(testUnit()), (d) =>
      setSegmentNotes(d, 's1', 'Bälle rausstellen')
    )

    expect(changeCount(history)).toBe(1)
    expect(isDirty(history)).toBe(true)
  })
})

// ---- Folgenlose Klicks ----

describe('folgenlose Operationen', () => {
  it('zählt „nach oben" am ersten Platz nicht', () => {
    const history = applyChange(startHistory(testUnit()), (d) => moveItem(d, 's1', 'i1', 'up'))

    expect(changeCount(history)).toBe(0)
    expect(isDirty(history)).toBe(false)
  })

  it('zählt „nach unten" am letzten Platz nicht', () => {
    const history = applyChange(startHistory(testUnit()), (d) => moveItem(d, 's1', 'i3', 'down'))
    expect(changeCount(history)).toBe(0)
  })

  it('zählt dieselbe Plandauer erneut eingetragen nicht', () => {
    const history = applyChange(startHistory(testUnit()), (d) => setItemDuration(d, 's1', 'i1', 5))
    expect(changeCount(history)).toBe(0)
  })

  it('zählt die bereits eingesetzte Übung erneut gewählt nicht', () => {
    const history = applyChange(startHistory(testUnit()), (d) =>
      setItemExercise(d, 's1', 'i1', placement('a'))
    )
    expect(changeCount(history)).toBe(0)
  })
})

// ---- Rückgängig ----

describe('undoChange', () => {
  it('nimmt Schritt für Schritt bis zum Ausgangszustand zurück', () => {
    let history = startHistory(testUnit())
    history = applyChange(history, (d) => removeItem(d, 's1', 'i1'))
    history = applyChange(history, (d) => removeItem(d, 's1', 'i2'))
    expect(names(history.present)).toEqual(['c'])

    history = undoChange(history)
    expect(names(history.present)).toEqual(['b', 'c'])
    expect(changeCount(history)).toBe(1)

    history = undoChange(history)
    expect(names(history.present)).toEqual(['a', 'b', 'c'])
    expect(changeCount(history)).toBe(0)
    expect(isDirty(history)).toBe(false)
    expect(canUndo(history)).toBe(false)
  })

  it('stellt einen entfernten Platz an seiner alten Stelle und mit seiner Dauer wieder her', () => {
    let history = startHistory(testUnit())
    history = applyChange(history, (d) => removeItem(d, 's1', 'i2'))
    history = undoChange(history)

    const restored = history.present.segments[0].items[1]
    expect(restored.exerciseId).toBe('b')
    expect(restored.plannedDuration).toBe(5)
  })

  it('tut am Ausgangszustand nichts', () => {
    const history = startHistory(testUnit())
    expect(undoChange(history)).toBe(history)
  })

  it('nimmt auch eine eingefügte Übung wieder zurück', () => {
    let history = startHistory(testUnit())
    history = applyChange(history, (d) => insertItem(d, 's1', placement('d')))
    expect(names(history.present)).toEqual(['a', 'b', 'c', 'd'])

    history = undoChange(history)
    expect(names(history.present)).toEqual(['a', 'b', 'c'])
  })
})

// ---- Verwerfen ----

describe('discardChanges', () => {
  it('stellt den gespeicherten Stand wieder her und leert die Kette', () => {
    let history = startHistory(testUnit())
    history = applyChange(history, (d) => removeItem(d, 's1', 'i1'))
    history = applyChange(history, (d) => setSegmentNotes(d, 's1', 'weg damit'))

    history = discardChanges(history)

    expect(names(history.present)).toEqual(['a', 'b', 'c'])
    expect(history.present.segments[0].notes).toBe('')
    expect(changeCount(history)).toBe(0)
    expect(isDirty(history)).toBe(false)
  })
})

// ---- Nach dem Speichern ----

describe('Neuer Ausgangszustand nach dem Speichern', () => {
  it('macht den gespeicherten Stand zum neuen Ausgangszustand', () => {
    const saved = testUnit()
    saved.segments[0].items = [item('i1', 'a', 5, 0)]

    const history = startHistory(saved)

    expect(names(history.present)).toEqual(['a'])
    expect(isDirty(history)).toBe(false)
    expect(canUndo(history)).toBe(false)
  })
})

// ---- Reinheit ----

describe('Reinheit', () => {
  it('lässt den übergebenen Verlauf unberührt', () => {
    const history = startHistory(testUnit())
    const snapshot = JSON.stringify(history)

    applyChange(history, (d) => removeItem(d, 's1', 'i1'))
    undoChange(history)
    discardChanges(history)

    expect(JSON.stringify(history)).toBe(snapshot)
  })
})
