import { describe, it, expect } from 'vitest'
import {
  editorStateSchema,
  savePlanOptionsSchema,
  segmentConfigSchema,
  unitConfigSchema,
  unitDraftSchema,
} from './unit'
import type { SegmentConfig, UnitConfig } from '@/lib/types/unit'

function segment(overrides: Partial<SegmentConfig> = {}): SegmentConfig {
  return {
    id: 'seg-1',
    name: 'Hauptteil',
    minutes: 60,
    fillMode: 'generate',
    sports: ['Turnen'],
    primarySport: null,
    difficulties: ['Leicht', 'Mittel', 'Schwer'],
    notes: '',
    ...overrides,
  }
}

function config(overrides: Partial<UnitConfig> = {}): UnitConfig {
  return {
    groupId: 'group-1',
    totalMinutes: 60,
    segments: [segment()],
    editorState: { mode: 'standard', expandedPosition: null },
    ...overrides,
  }
}

describe('segmentConfigSchema', () => {
  it('nimmt ein vollständiges Segment an', () => {
    expect(segmentConfigSchema.safeParse(segment()).success).toBe(true)
  })

  it('verlangt mindestens eine Sportart', () => {
    const result = segmentConfigSchema.safeParse(segment({ sports: [] }))
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Sportart')
    }
  })

  it('verlangt mindestens einen Schwierigkeitsgrad', () => {
    expect(segmentConfigSchema.safeParse(segment({ difficulties: [] })).success).toBe(false)
  })

  it('verlangt mindestens eine Minute', () => {
    expect(segmentConfigSchema.safeParse(segment({ minutes: 0 })).success).toBe(false)
  })

  it('weist eine Hauptsportart ab, die nicht unter den Sportarten steht', () => {
    const result = segmentConfigSchema.safeParse(
      segment({ sports: ['Turnen'], primarySport: 'Volleyball' })
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Hauptsportart')
    }
  })

  it('erlaubt eine Hauptsportart aus den gewählten Sportarten', () => {
    const result = segmentConfigSchema.safeParse(
      segment({ sports: ['Turnen', 'Tanzen'], primarySport: 'Tanzen' })
    )
    expect(result.success).toBe(true)
  })

  it('erlaubt gar keine Hauptsportart', () => {
    expect(segmentConfigSchema.safeParse(segment({ primarySport: null })).success).toBe(true)
  })
})

describe('editorStateSchema', () => {
  it('nimmt beide Modi an', () => {
    expect(editorStateSchema.safeParse({ mode: 'standard', expandedPosition: null }).success).toBe(true)
    expect(editorStateSchema.safeParse({ mode: 'custom', expandedPosition: 2 }).success).toBe(true)
  })

  it('weist einen unbekannten Modus ab', () => {
    expect(editorStateSchema.safeParse({ mode: 'klassisch', expandedPosition: null }).success).toBe(false)
  })

  it('weist eine negative Position ab — sie käme nur aus einem findIndex-Fehlschlag', () => {
    expect(editorStateSchema.safeParse({ mode: 'custom', expandedPosition: -1 }).success).toBe(false)
  })
})

describe('unitConfigSchema', () => {
  it('nimmt eine vollständige Konfiguration an', () => {
    expect(unitConfigSchema.safeParse(config()).success).toBe(true)
  })

  it('verlangt eine Gruppe', () => {
    expect(unitConfigSchema.safeParse(config({ groupId: '' })).success).toBe(false)
  })

  it('verlangt mindestens ein Segment', () => {
    expect(unitConfigSchema.safeParse(config({ segments: [] })).success).toBe(false)
  })

  it('verlangt, dass die Segmente genau die Einheitsdauer ergeben', () => {
    const result = unitConfigSchema.safeParse(
      config({
        totalMinutes: 60,
        segments: [segment({ id: 'a', minutes: 20 }), segment({ id: 'b', minutes: 30 })],
      })
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Summe')
    }
  })

  it('nimmt mehrere Segmente an, die zusammen aufgehen', () => {
    const result = unitConfigSchema.safeParse(
      config({
        totalMinutes: 60,
        segments: [
          segment({ id: 'a', name: 'Aufwärmen', minutes: 12 }),
          segment({ id: 'b', name: 'Hauptteil', minutes: 36 }),
          segment({ id: 'c', name: 'Cool-Down', minutes: 12 }),
        ],
      })
    )
    expect(result.success).toBe(true)
  })

  it('erlaubt eine Einheit, in der alle Segmente frei bleiben', () => {
    // Edge Case 9 der Spec: ein leeres Gerüst ist ausdrücklich zulässig.
    const result = unitConfigSchema.safeParse(
      config({
        segments: [segment({ fillMode: 'empty', notes: 'Wettkampfspiel' })],
      })
    )
    expect(result.success).toBe(true)
  })

  it('verlangt den Bedienstand — ohne ihn ließe sich der Generator nicht wiederherstellen', () => {
    const withoutEditorState = { ...config() } as Partial<UnitConfig>
    delete withoutEditorState.editorState
    expect(unitConfigSchema.safeParse(withoutEditorState).success).toBe(false)
  })

  it('begrenzt die Einheitsdauer nach unten und oben', () => {
    expect(unitConfigSchema.safeParse(config({ totalMinutes: 4, segments: [segment({ minutes: 4 })] })).success).toBe(false)
    expect(unitConfigSchema.safeParse(config({ totalMinutes: 301, segments: [segment({ minutes: 301 })] })).success).toBe(false)
  })
})

describe('unitDraftSchema — die Arbeitsfassung des Editors (PROJ-7)', () => {
  const SEGMENT = '11111111-1111-4111-8111-111111111111'
  const EXERCISE = '22222222-2222-4222-8222-222222222222'
  const VARIANT = '33333333-3333-4333-8333-333333333333'

  function item(overrides: Record<string, unknown> = {}) {
    return { exerciseId: EXERCISE, variantId: null, plannedDuration: 10, ...overrides }
  }

  function draft(items: unknown[] = [item()], notes = '') {
    return { segments: [{ id: SEGMENT, notes, items }] }
  }

  it('nimmt eine gültige Arbeitsfassung an', () => {
    expect(unitDraftSchema.safeParse(draft([item(), item({ variantId: VARIANT })])).success).toBe(true)
  })

  it('lässt ein leeres Segment zu — eine leere Einheit ist ein zulässiges Gerüst', () => {
    expect(unitDraftSchema.safeParse(draft([])).success).toBe(true)
  })

  it('lässt den Platzhalter einer gelöschten Übung stehen', () => {
    expect(unitDraftSchema.safeParse(draft([item({ exerciseId: null })])).success).toBe(true)
  })

  it('wirft Anzeigedaten und weggewürfelte Kandidaten weg, statt sie durchzureichen', () => {
    const result = unitDraftSchema.safeParse(
      draft([item({ key: 'neu-1', rejected: ['x:'], exercise: { name: 'Fangen' } })])
    )

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.segments[0].items[0]).toEqual(item())
    }
  })

  it('weist eine Plandauer unter einer Minute ab', () => {
    expect(unitDraftSchema.safeParse(draft([item({ plannedDuration: 0 })])).success).toBe(false)
    expect(unitDraftSchema.safeParse(draft([item({ plannedDuration: -5 })])).success).toBe(false)
    expect(unitDraftSchema.safeParse(draft([item({ plannedDuration: 2.5 })])).success).toBe(false)
  })

  it('lässt eine Plandauer über der Segmentlänge zu — der Übungsleiter entscheidet', () => {
    expect(unitDraftSchema.safeParse(draft([item({ plannedDuration: 400 })])).success).toBe(true)
  })

  it('weist Kennungen ab, die keine sind', () => {
    expect(unitDraftSchema.safeParse(draft([item({ exerciseId: 'neu-1' })])).success).toBe(false)
    expect(
      unitDraftSchema.safeParse({ segments: [{ id: 'seg-1', notes: '', items: [] }] }).success
    ).toBe(false)
  })

  it('begrenzt die Notiz auf 2.000 Zeichen', () => {
    expect(unitDraftSchema.safeParse(draft([], 'a'.repeat(2000))).success).toBe(true)
    expect(unitDraftSchema.safeParse(draft([], 'a'.repeat(2001))).success).toBe(false)
  })

  it('verlangt mindestens ein Segment', () => {
    expect(unitDraftSchema.safeParse({ segments: [] }).success).toBe(false)
  })
})

describe('savePlanOptionsSchema', () => {
  it('nimmt den Änderungsstempel so an, wie die Datenbank ihn liefert', () => {
    expect(
      savePlanOptionsSchema.safeParse({
        expectedUpdatedAt: '2026-10-07T12:34:56.123456+00:00',
        force: false,
      }).success
    ).toBe(true)
  })

  it('weist einen Stempel ab, der kein Zeitpunkt ist', () => {
    expect(
      savePlanOptionsSchema.safeParse({ expectedUpdatedAt: 'gestern', force: false }).success
    ).toBe(false)
  })

  it('lässt den Namen weg oder nimmt ihn mit', () => {
    const base = { expectedUpdatedAt: '2026-10-07T12:34:56Z', force: true }
    expect(savePlanOptionsSchema.safeParse(base).success).toBe(true)
    expect(savePlanOptionsSchema.safeParse({ ...base, name: 'Mittwoch' }).success).toBe(true)
  })
})
