import * as React from 'react'
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react'
import { LibraryBrowser } from './library-browser'
import { DEFAULT_LIBRARY_PARAMS } from '@/lib/library/address'
import type { Exercise } from '@/lib/types/exercise'
import type { LibraryEntry, LibraryResult } from '@/lib/types/library'

/**
 * Der Reiter „Übungsdatenbank" mit nachgestellten Serverantworten — bis die
 * Tabellen mit `/backend` kommen, ist das der einzige Weg, Liste, Vorauswahl
 * und Auswahlleiste zu sehen.
 */

const getLibrary = vi.fn<(...args: unknown[]) => Promise<LibraryResult>>()
const copyLibraryExercises = vi.fn()

vi.mock('@/lib/actions/library', () => ({
  getLibrary: (...args: unknown[]) => getLibrary(...args),
  copyLibraryExercises: (...args: unknown[]) => copyLibraryExercises(...args),
}))

vi.mock('@/lib/actions/exercises', () => ({ getCustomCategories: vi.fn(async () => ({})) }))

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
})

function exercise(id: string, name: string): Exercise {
  return {
    id,
    userId: '',
    name,
    description: 'Ablauf',
    sports: ['Kinderturnen'],
    ageGroups: ['Kinder (4–6)'],
    phases: ['Aufwärmen'],
    difficulty: 'Leicht',
    organizationForms: [],
    duration: 10,
    musicRequired: false,
    needsCompletion: false,
    images: [],
    materials: [],
    variants: [],
    links: [],
    createdAt: '2026-10-18T10:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
  }
}

function entry(id: string, name: string, extra: Partial<LibraryEntry> = {}): LibraryEntry {
  return { exercise: exercise(id, name), isDraft: false, addedAt: null, copiedExerciseId: null, ...extra }
}

const GROUP = '0b9a6a3e-2f1c-4c55-9a51-1f2e3d4c5b6a'

function result(entries: LibraryEntry[], extra: Partial<LibraryResult> = {}): LibraryResult {
  return { available: true, hasContent: true, entries, group: null, groupMissing: false, emptyReasons: [], ...extra }
}

beforeEach(() => {
  getLibrary.mockReset()
  copyLibraryExercises.mockReset()
})

describe('LibraryBrowser', () => {
  it('zeigt den Bestand mit Vermerken und ohne Bearbeiten-Menü', async () => {
    getLibrary.mockResolvedValue(
      result([
        entry('a', 'Feuer, Wasser, Sturm'),
        entry('b', 'Schattenlauf', { copiedExerciseId: 'kopie-b' }),
        entry('c', 'Ballkönig', { isDraft: true }),
      ])
    )
    render(<LibraryBrowser initialParams={DEFAULT_LIBRARY_PARAMS} groups={[]} />)

    expect(await screen.findByText('3 Übungen')).toBeTruthy()
    expect(screen.getByText('Übernommen')).toBeTruthy()
    expect(screen.getByText('Entwurf')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'In Meine Übungen öffnen' }).getAttribute('href')).toBe('/exercises/kopie-b')
    expect(screen.getAllByRole('button', { name: /übernehmen$/ })).toHaveLength(2)
    expect(screen.queryByRole('button', { name: 'Aktionen' })).toBeNull()
    // Übernommenes ist nicht auswählbar.
    expect(screen.getByRole('checkbox', { name: /Schattenlauf.*schon übernommen/ }).hasAttribute('disabled')).toBe(true)
  })

  it('wählt mit einer Gruppe vor, was passt, und nennt die Gründe der übrigen', async () => {
    getLibrary.mockResolvedValue(
      result(
        [
          entry('a', 'Feuer, Wasser, Sturm', { fit: { kind: 'fits', viaVariant: null } }),
          entry('b', 'Bockspringen', {
            fit: {
              kind: 'blocked',
              forVariant: null,
              reasons: [{ kind: 'material', venueName: 'Sporthalle Nord', missing: [{ name: 'Bock', needed: 1, available: 0 }] }],
            },
          }),
          entry('c', 'Ballkönig', { fit: { kind: 'fits', viaVariant: 'Mit Softball' } }),
        ],
        { group: { id: GROUP, name: 'Turnzwerge', noVenue: false, participantsUnknown: false } }
      )
    )
    render(
      <LibraryBrowser
        initialParams={{ ...DEFAULT_LIBRARY_PARAMS, groupId: GROUP }}
        groups={[{ id: GROUP, name: 'Turnzwerge' }]}
      />
    )

    const bar = await screen.findByRole('region', { name: 'Auswahl' })
    expect(within(bar).getByText('2 ausgewählt')).toBeTruthy()
    expect(screen.getByText('In „Sporthalle Nord" fehlt: Bock')).toBeTruthy()
    expect(screen.getByText('Passt mit der Variante „Mit Softball"')).toBeTruthy()
    expect(screen.getByRole('checkbox', { name: /Bockspringen/ }).getAttribute('data-state')).toBe('unchecked')
  })

  it('übernimmt genau die Auswahl und markiert sie danach als übernommen', async () => {
    getLibrary.mockResolvedValue(
      result([entry('a', 'Feuer, Wasser, Sturm'), entry('b', 'Schattenlauf'), entry('c', 'Ballkönig')])
    )
    copyLibraryExercises.mockResolvedValue({
      copied: [
        { libraryExerciseId: 'a', exerciseId: 'k-a', name: 'Feuer, Wasser, Sturm' },
        { libraryExerciseId: 'c', exerciseId: 'k-c', name: 'Ballkönig' },
      ],
      alreadyCopied: [],
      duplicateNames: [],
    })
    render(<LibraryBrowser initialParams={DEFAULT_LIBRARY_PARAMS} groups={[]} />)

    fireEvent.click(await screen.findByRole('checkbox', { name: /Ballkönig/ }))
    fireEvent.click(screen.getByRole('checkbox', { name: /Feuer/ }))
    const bar = screen.getByRole('region', { name: 'Auswahl' })
    expect(within(bar).getByText('2 ausgewählt')).toBeTruthy()

    fireEvent.click(within(bar).getByRole('button', { name: /Übernehmen/ }))
    // In Listenreihenfolge, nicht in Klickreihenfolge.
    await waitFor(() => expect(copyLibraryExercises).toHaveBeenCalledWith(['a', 'c']))
    await waitFor(() => expect(screen.getAllByText('Übernommen')).toHaveLength(2))
    expect(screen.queryByRole('region', { name: 'Auswahl' })).toBeNull()
  })

  it('nennt die Gründe einer leeren Liste und bietet an, die Filter zurückzusetzen', async () => {
    getLibrary.mockResolvedValue(
      result([], { emptyReasons: ['Für „Volleyball" gibt es in der Übungsdatenbank noch keine Übungen.'] })
    )
    render(
      <LibraryBrowser
        initialParams={{ ...DEFAULT_LIBRARY_PARAMS, filters: { ...DEFAULT_LIBRARY_PARAMS.filters, sports: ['Volleyball'] } }}
        groups={[]}
      />
    )
    expect(await screen.findByText('Für „Volleyball" gibt es in der Übungsdatenbank noch keine Übungen.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Filter zurücksetzen' })).toBeTruthy()
  })

  it('sagt, dass die Übungsdatenbank aufgebaut wird, solange sie leer ist', async () => {
    getLibrary.mockResolvedValue(result([], { hasContent: false }))
    render(<LibraryBrowser initialParams={DEFAULT_LIBRARY_PARAMS} groups={[]} />)
    expect(await screen.findByText('Die Übungsdatenbank wird gerade aufgebaut')).toBeTruthy()
  })
})
