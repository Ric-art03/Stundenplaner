import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { GroupUnitsWarning } from './group-units-warning'
import { getUnitNamesForGroup } from '@/lib/actions/units'

vi.mock('@/lib/actions/units', () => ({
  getUnitNamesForGroup: vi.fn(),
}))

const mocked = vi.mocked(getUnitNamesForGroup)

function renderWarning(active = true) {
  // StrictMode, weil der Effekt dort doppelt läuft — derselbe Fehlertyp hat in
  // diesem Projekt schon zweimal zugeschlagen.
  return render(
    <React.StrictMode>
      <GroupUnitsWarning groupId="group-1" active={active} />
    </React.StrictMode>
  )
}

beforeEach(() => {
  mocked.mockReset()
})

describe('GroupUnitsWarning', () => {
  it('lädt nichts, solange der Dialog zu ist', () => {
    mocked.mockResolvedValue(['Einheit A'])
    renderWarning(false)
    expect(mocked).not.toHaveBeenCalled()
  })

  it('nennt die betroffenen Einheiten beim Namen', async () => {
    mocked.mockResolvedValue(['Kinderturnen – 1. Okt.', 'Kinderturnen – 8. Okt.'])
    renderWarning()

    await waitFor(() => {
      expect(
        screen.getByText(/Dabei werden auch 2 gespeicherte Einheiten gelöscht/)
      ).toBeInTheDocument()
    })
    expect(screen.getByText(/Kinderturnen – 1\. Okt\./)).toBeInTheDocument()
    expect(screen.getByText(/Kinderturnen – 8\. Okt\./)).toBeInTheDocument()
  })

  it('formuliert eine einzelne Einheit im Singular', async () => {
    mocked.mockResolvedValue(['Nur eine'])
    renderWarning()
    await waitFor(() => {
      expect(
        screen.getByText(/Dabei wird auch 1 gespeicherte Einheit gelöscht/)
      ).toBeInTheDocument()
    })
  })

  it('kürzt lange Listen und nennt die Restzahl', async () => {
    mocked.mockResolvedValue(['A', 'B', 'C', 'D', 'E', 'F', 'G'])
    renderWarning()
    await waitFor(() => {
      expect(screen.getByText(/und 2 weitere/)).toBeInTheDocument()
    })
    expect(screen.getByText(/Dabei werden auch 7 gespeicherte Einheiten/)).toBeInTheDocument()
  })

  it('sagt zu, dass die Übungen erhalten bleiben', async () => {
    mocked.mockResolvedValue(['Einheit A'])
    renderWarning()
    await waitFor(() => {
      expect(screen.getByText(/Deine Übungen bleiben erhalten/)).toBeInTheDocument()
    })
  })

  it('zeigt nichts, wenn die Gruppe keine gespeicherten Einheiten hat', async () => {
    mocked.mockResolvedValue([])
    const { container } = renderWarning()
    await waitFor(() => expect(mocked).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('verschluckt einen Fehler, statt den Löschdialog zu blockieren', async () => {
    mocked.mockRejectedValue(new Error('Netzwerk'))
    const { container } = renderWarning()
    await waitFor(() => expect(mocked).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})
