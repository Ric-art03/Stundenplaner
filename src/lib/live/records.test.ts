import { describe, expect, it } from 'vitest'
import { followUpError, runPayload, runRecord, saveRunFailure } from './records'
import { coverImagePath, enrichLivePlan } from './steps'
import { planWith, step } from './test-helpers'
import { adoptDurationSchema, appendNoteSchema, runRecordSchema } from '@/lib/validations/live'
import type { RunRecord } from './types'

const RUN_ID = '0b6f5c1e-3a8d-4c57-9a3e-2f1f1b7d9c10'
const UNIT_ID = '7d1c2a44-91b3-4f0e-8a55-6f0c3e2b1a99'
const EXERCISE_ID = 'c2a9b7f0-5d3e-4a1b-8c6d-9e0f1a2b3c4d'

function record(overrides: Partial<RunRecord> = {}): RunRecord {
  return {
    id: RUN_ID,
    unitId: UNIT_ID,
    unitName: 'Kinderturnen',
    startedAt: '2026-10-11T16:00:00.000Z',
    endedAt: '2026-10-11T17:02:00.000Z',
    plannedMinutes: 60,
    actualSeconds: 3500,
    pausedSeconds: 220,
    note: 'Lief gut.',
    steps: [
      {
        position: 0,
        kind: 'exercise',
        phase: 'Aufwärmen',
        name: 'Kreisfangen',
        variantTitle: null,
        plannedMinutes: 8,
        actualSeconds: 640,
        status: 'done',
        exerciseId: EXERCISE_ID,
        variantId: null,
        adoptedNote: null,
        adoptedDuration: null,
      },
      {
        position: 1,
        kind: 'free',
        phase: 'Aufwärmen',
        name: 'Freie Zeit',
        variantTitle: null,
        plannedMinutes: 5,
        actualSeconds: 0,
        status: 'skipped',
        exerciseId: null,
        variantId: null,
        adoptedNote: null,
        adoptedDuration: null,
      },
    ],
    ...overrides,
  }
}

describe('Durchführung prüfen', () => {
  it('nimmt eine vollständige Durchführung an', () => {
    expect(runRecordSchema.safeParse(record()).success).toBe(true)
  })

  it('weist eine Kennung ab, die keine UUID ist', () => {
    expect(runRecordSchema.safeParse(record({ id: '18f3-abc' })).success).toBe(false)
  })

  it('weist eine Durchführung ohne Schritte ab', () => {
    expect(runRecordSchema.safeParse(record({ steps: [] })).success).toBe(false)
  })

  it('weist ein Ende vor dem Beginn ab', () => {
    const result = runRecordSchema.safeParse(
      record({ startedAt: '2026-10-11T17:00:00.000Z', endedAt: '2026-10-11T16:00:00.000Z' })
    )
    expect(result.success).toBe(false)
  })

  it('weist negative Zeiten und eine zu lange Notiz ab', () => {
    expect(runRecordSchema.safeParse(record({ actualSeconds: -1 })).success).toBe(false)
    expect(runRecordSchema.safeParse(record({ note: 'x'.repeat(2001) })).success).toBe(false)
  })

  it('weist einen unbekannten Status am Schritt ab', () => {
    const broken = record()
    const steps = [{ ...broken.steps[0], status: 'offen' as unknown as 'done' }]
    expect(runRecordSchema.safeParse({ ...broken, steps }).success).toBe(false)
  })
})

describe('Durchführung an die Datenbank', () => {
  it('schickt die Schritte ohne Position und ohne Vermerke der Nachbereitung', () => {
    const payload = runPayload(record())

    expect(payload.id).toBe(RUN_ID)
    expect(payload.steps[0]).toEqual({
      kind: 'exercise',
      phase: 'Aufwärmen',
      name: 'Kreisfangen',
      variantTitle: null,
      plannedMinutes: 8,
      actualSeconds: 640,
      status: 'done',
      exerciseId: EXERCISE_ID,
      variantId: null,
    })
    expect(payload).not.toHaveProperty('unitName')
  })

  it('liest eine gespeicherte Durchführung in der Reihenfolge ihrer Schritte', () => {
    const base = {
      id: 'x',
      run_id: RUN_ID,
      kind: 'exercise',
      phase: 'Hauptteil',
      variant_title: null,
      planned_minutes: 5,
      actual_seconds: 300,
      status: 'done',
      exercise_id: null,
      variant_id: null,
      adopted_note: null,
      adopted_duration: null,
    }
    const result = runRecord(
      {
        id: RUN_ID,
        user_id: 'u',
        unit_id: UNIT_ID,
        started_at: '2026-10-11T16:00:00+00:00',
        ended_at: '2026-10-11T17:00:00+00:00',
        planned_minutes: 60,
        actual_seconds: 3500,
        paused_seconds: 0,
        note: null,
        created_at: '',
      },
      [
        { ...base, position: 1, name: 'Zweite', adopted_duration: 11 },
        { ...base, position: 0, name: 'Erste', adopted_note: 'work' },
      ],
      'Kinderturnen'
    )

    expect(result.note).toBe('')
    expect(result.unitName).toBe('Kinderturnen')
    expect(result.steps.map((item) => item.name)).toEqual(['Erste', 'Zweite'])
    expect(result.steps[0].adoptedNote).toBe('work')
    expect(result.steps[1].adoptedDuration).toBe(11)
  })
})

describe('Meldungen', () => {
  it('nennt eine gelöschte Einheit endgültig — erneutes Senden hilft nicht', () => {
    expect(saveRunFailure('unit_not_found').permanent).toBe(true)
    expect(saveRunFailure('invalid_run').permanent).toBe(true)
  })

  it('versucht es nach fehlender Anmeldung und unbekannten Fehlern wieder', () => {
    expect(saveRunFailure('not_authenticated').permanent).toBe(false)
    expect(saveRunFailure('connection reset').permanent).toBe(false)
  })

  it('sagt bei der Nachbereitung, was nicht ging', () => {
    expect(followUpError('exercise_gone')).toMatch(/gibt es nicht mehr/)
    expect(followUpError('variant_gone')).toMatch(/Variante/)
    expect(followUpError('irgendwas')).toMatch(/Eingabe steht noch da/)
  })
})

describe('Nachbereitung prüfen', () => {
  it('nimmt keine leere Notiz und keine über 2.000 Zeichen', () => {
    expect(appendNoteSchema.safeParse({ field: 'work', text: '   ', updatedAt: 'x' }).success).toBe(false)
    expect(
      appendNoteSchema.safeParse({ field: 'work', text: 'x'.repeat(2001), updatedAt: 'x' }).success
    ).toBe(false)
    expect(appendNoteSchema.safeParse({ field: 'personal', text: 'Gut', updatedAt: 'x' }).success).toBe(true)
  })

  it('nimmt als Dauer nur ganze Minuten zwischen 1 und 300', () => {
    expect(adoptDurationSchema.safeParse({ minutes: 0, updatedAt: 'x' }).success).toBe(false)
    expect(adoptDurationSchema.safeParse({ minutes: 10.5, updatedAt: 'x' }).success).toBe(false)
    expect(adoptDurationSchema.safeParse({ minutes: 301, updatedAt: 'x' }).success).toBe(false)
    expect(adoptDurationSchema.safeParse({ minutes: 11, updatedAt: 'x' }).success).toBe(true)
  })
})

describe('Was der Start eigens nachlädt', () => {
  it('setzt bei einer Variante deren Beschreibung statt der der Grundübung', () => {
    const plan = planWith([
      step({ key: 'a', exerciseId: 'e1', variantId: 'v1', description: 'Grundübung' }),
      step({ key: 'b', exerciseId: 'e2', variantId: null, description: 'Ohne Variante' }),
    ])
    const result = enrichLivePlan(plan, {
      variantDescriptions: new Map([['v1', 'Mit zwei Fängern']]),
      coverImages: new Map([['e2', 'nutzer/bild.jpg']]),
    })

    expect(result.steps[0].description).toBe('Mit zwei Fängern')
    expect(result.steps[0].imagePath).toBeNull()
    expect(result.steps[1].description).toBe('Ohne Variante')
    expect(result.steps[1].imagePath).toBe('nutzer/bild.jpg')
  })

  it('lässt freie Zeit und Platzhalter unberührt', () => {
    const plan = planWith([step({ kind: 'free', name: 'Freie Zeit', exerciseId: null })])
    const result = enrichLivePlan(plan, { variantDescriptions: new Map(), coverImages: new Map() })

    expect(result.steps[0]).toEqual(plan.steps[0])
  })

  it('nimmt das als Titelbild markierte Bild, sonst das erste', () => {
    expect(
      coverImagePath([
        { path: 'a.jpg', isCover: false },
        { path: 'b.jpg', isCover: true },
      ])
    ).toBe('b.jpg')
    expect(coverImagePath([{ path: 'a.jpg' }, { path: 'b.jpg' }])).toBe('a.jpg')
    expect(coverImagePath([])).toBeNull()
    expect(coverImagePath(null)).toBeNull()
    expect(coverImagePath([{ kein: 'pfad' }])).toBeNull()
  })
})
