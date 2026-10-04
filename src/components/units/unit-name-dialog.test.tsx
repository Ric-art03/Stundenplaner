import * as React from 'react'
import { describe, it, expect, vi, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UnitNameDialog } from './unit-name-dialog'

beforeAll(() => {
  if (!globalThis.ResizeObserver) {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver
  }
})

function renderDialog(props: Partial<React.ComponentProps<typeof UnitNameDialog>> = {}) {
  const onConfirm = vi.fn()
  const onOpenChange = vi.fn()
  const view = render(
    <React.StrictMode>
      <UnitNameDialog
        open
        onOpenChange={onOpenChange}
        title="Einheit speichern"
        description="Unter diesem Namen findest du die Einheit später wieder."
        confirmLabel="Speichern"
        initialName="Vorschulturnen 1 – 5. Okt. 2026"
        busy={false}
        onConfirm={onConfirm}
        {...props}
      />
    </React.StrictMode>
  )
  return { ...view, onConfirm, onOpenChange }
}

function nameField(): HTMLInputElement {
  return screen.getByLabelText('Name') as HTMLInputElement
}

describe('UnitNameDialog', () => {
  it('füllt den bisherigen Namen vor', () => {
    renderDialog()
    expect(nameField().value).toBe('Vorschulturnen 1 – 5. Okt. 2026')
  })

  it('gibt den bearbeiteten Namen weiter', () => {
    const { onConfirm } = renderDialog()
    fireEvent.change(nameField(), { target: { value: 'Herbstferien-Stunde' } })
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(onConfirm).toHaveBeenCalledWith('Herbstferien-Stunde')
  })

  it('übernimmt den Vorschlag unverändert, wenn der Nutzer nichts ändert', () => {
    const { onConfirm } = renderDialog()
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(onConfirm).toHaveBeenCalledWith('Vorschulturnen 1 – 5. Okt. 2026')
  })

  it('sperrt das Bestätigen bei leerem Namen', () => {
    renderDialog()
    fireEvent.change(nameField(), { target: { value: '   ' } })
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
  })

  it('sperrt das Bestätigen, solange gespeichert wird', () => {
    renderDialog({ busy: true })
    expect(screen.getByRole('button', { name: 'Speichern' })).toBeDisabled()
  })

  it('verwirft eine abgebrochene Eingabe beim erneuten Öffnen', () => {
    // Sonst stünde beim zweiten Öffnen noch der verworfene Entwurf im Feld.
    const { rerender } = renderDialog()
    fireEvent.change(nameField(), { target: { value: 'Verworfen' } })

    const props = {
      onOpenChange: vi.fn(),
      title: 'Einheit speichern',
      description: 'Beschreibung',
      confirmLabel: 'Speichern',
      initialName: 'Vorschulturnen 1 – 5. Okt. 2026',
      busy: false,
      onConfirm: vi.fn(),
    }
    rerender(
      <React.StrictMode>
        <UnitNameDialog {...props} open={false} />
      </React.StrictMode>
    )
    rerender(
      <React.StrictMode>
        <UnitNameDialog {...props} open />
      </React.StrictMode>
    )

    expect(nameField().value).toBe('Vorschulturnen 1 – 5. Okt. 2026')
  })

  it('zeigt die übergebene Beschriftung statt einer festen', () => {
    renderDialog({ title: 'Einheit umbenennen', confirmLabel: 'Umbenennen' })
    expect(screen.getByText('Einheit umbenennen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Umbenennen' })).toBeInTheDocument()
  })
})
