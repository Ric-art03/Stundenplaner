import * as React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { UnitConfigForm } from './unit-config-form'
import type { Group } from '@/lib/types/group'
import type { EditorState, SegmentConfig } from '@/lib/types/unit'

/**
 * Regressionstest für „Zurück zum Generator".
 *
 * Der mitgebrachte Bedienstand ging verloren, weil ein Einmal-Schalter den
 * Rücksetz-Effekt bewachte. React führt Effekte im Entwicklungsmodus doppelt
 * aus (StrictMode) — beim zweiten Lauf war der Schalter verbraucht und der
 * Stand wurde verworfen. Deshalb rendern diese Tests **ausdrücklich in
 * StrictMode**: ohne das wäre der Fehler unsichtbar geblieben.
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock('@/lib/actions/units', () => ({
  generateUnit: vi.fn(async () => ({ unitId: 'neu' })),
}))

beforeAll(() => {
  // react-resizable-panels braucht beides, jsdom bringt es nicht mit.
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {}
  }
})

const GROUP: Group = {
  id: 'group-1',
  userId: 'user-1',
  name: 'Vorschulturnen 1',
  sports: ['Turnen', 'Tanzen'],
  primarySport: null,
  ageGroups: ['Kinder (4–6)'],
  participants: 25,
  unitDuration: 60,
  venueId: null,
  venue: null,
  schedules: [],
  createdAt: '2026-10-01T00:00:00Z',
  updatedAt: '2026-10-01T00:00:00Z',
}

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

function renderForm(props: {
  initialSegments?: SegmentConfig[]
  initialEditorState?: EditorState
  initialGroupId?: string
}) {
  return render(
    <React.StrictMode>
      <UnitConfigForm
        groups={[GROUP]}
        customPhases={[]}
        customSports={[]}
        initialGroupId={props.initialGroupId ?? GROUP.id}
        initialSegments={props.initialSegments}
        initialEditorState={props.initialEditorState}
      />
    </React.StrictMode>
  )
}

/** „Individuell" ist gewählt, wenn der Zeitverlauf sichtbar ist. */
function timelineVisible(): boolean {
  return screen.queryByText('Zeitverlauf') !== null
}

describe('UnitConfigForm — Bedienstand aus „Zurück zum Generator"', () => {
  it('behält den individuellen Modus, obwohl der Effekt doppelt läuft', () => {
    renderForm({
      initialSegments: [
        segment({ id: 'a', name: 'Aufwärmen', minutes: 20 }),
        segment({ id: 'b', name: 'Hauptteil', minutes: 40 }),
      ],
      initialEditorState: { mode: 'custom', expandedPosition: 1 },
    })

    expect(timelineVisible()).toBe(true)
  })

  it('übernimmt die mitgebrachten Segmente statt der Standardvorlage', () => {
    renderForm({
      initialSegments: [
        segment({ id: 'a', name: 'Aufwärmen', minutes: 20 }),
        segment({ id: 'b', name: 'Wettkampfspiel', minutes: 40 }),
      ],
      initialEditorState: { mode: 'custom', expandedPosition: 0 },
    })

    // „Wettkampfspiel" steht in keiner Standardvorlage — es kann nur aus dem
    // mitgebrachten Stand stammen.
    expect(screen.getAllByText('Wettkampfspiel').length).toBeGreaterThan(0)

    // Die Minutenwerte unterscheiden die Quellen eindeutig: mitgebracht sind
    // 20/40, die Standardvorlage für 60 Minuten wäre 12/36/12. (Auf die
    // Phasennamen lässt sich nicht prüfen — die stehen auch als Auswahl-
    // einträge im Phasen-Dropdown.)
    expect(screen.getAllByText('40 Min').length).toBeGreaterThan(0)
    expect(screen.queryByText('36 Min')).toBeNull()
  })

  it('stellt „Standard" wieder her, wenn die Einheit so erzeugt wurde', () => {
    renderForm({
      initialSegments: [
        segment({ id: 'a', name: 'Aufwärmen', minutes: 12 }),
        segment({ id: 'b', name: 'Hauptteil', minutes: 36 }),
        segment({ id: 'c', name: 'Cool-Down', minutes: 12 }),
      ],
      initialEditorState: { mode: 'standard', expandedPosition: null },
    })

    // Bei „Standard" bleibt der Zeitverlauf zu.
    expect(timelineVisible()).toBe(false)
  })

  it('öffnet ohne mitgebrachten Stand wie bisher mit „Standard"', () => {
    renderForm({})
    expect(timelineVisible()).toBe(false)
  })

  it('fällt bei einer Einheit ohne gemerkten Stand auf „Individuell" zurück', () => {
    // Alte Einheiten aus der Zeit vor der Spalte tragen nichts. Dann sind die
    // gespeicherten Segmente die verlässlichere Quelle als eine Vorlage.
    renderForm({
      initialSegments: [segment({ id: 'a', name: 'Hauptteil', minutes: 60 })],
      initialEditorState: undefined,
    })
    expect(timelineVisible()).toBe(true)
  })
})
