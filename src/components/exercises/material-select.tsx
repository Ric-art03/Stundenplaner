'use client'

import * as React from 'react'
import { Plus, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  findTerm,
  isReservedMaterialName,
  NO_MATERIAL_LABEL,
  withSelected,
} from '@/lib/categories/terms'

interface MaterialSelectProps {
  /** Wählbare Materialien, schon in der Begriffsordnung. */
  options: string[]
  value: string
  onChange: (value: string) => void
  /**
   * Namen, die in einer anderen Zeile schon vergeben sind und deshalb nicht in
   * `options` stehen (Hallenmaterial) — eingetippt, wird darauf hingewiesen.
   */
  takenNames?: string[]
}

/** Die Auswahl eines Materials für eine Zeile (Übung, Variante, Halle). */
export function MaterialSelect({ options, value, onChange, takenNames = [] }: MaterialSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [customInput, setCustomInput] = React.useState('')
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const [localOptions, setLocalOptions] = React.useState<string[]>([])
  const [notice, setNotice] = React.useState<string | null>(null)

  const allOptions = React.useMemo(
    () => withSelected('material', options, [...localOptions, ...(value ? [value] : [])]),
    [options, localOptions, value]
  )

  const filtered = allOptions.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  function select(val: string) {
    setNotice(null)
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed) return

    if (isReservedMaterialName(trimmed)) {
      setNotice(
        `„${trimmed}" ist kein Material. Braucht eine Variante nichts, wähle dort „${NO_MATERIAL_LABEL}".`
      )
      setCustomInput('')
      setShowCustomInput(false)
      return
    }

    const taken = findTerm(trimmed, takenNames)
    if (taken && !findTerm(trimmed, allOptions)) {
      setNotice(`„${taken}" steht schon in einer anderen Zeile.`)
      setCustomInput('')
      setShowCustomInput(false)
      return
    }

    // Ein Material gibt es nur einmal: das vorhandene wird gewählt.
    const existing = findTerm(trimmed, allOptions)
    if (existing) {
      onChange(existing)
      setNotice(
        existing === value ? `„${existing}" ist schon ausgewählt.` : `„${existing}" gibt es schon — ausgewählt.`
      )
    } else {
      setLocalOptions((prev) => [...prev, trimmed])
      setNotice(null)
      onChange(trimmed)
    }
    setCustomInput('')
    setShowCustomInput(false)
    setOpen(false)
    setSearch('')
  }

  return (
    <div className="space-y-1">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (next) setNotice(null)
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between font-normal ${
              open ? 'text-primary border-primary' : !value ? 'text-muted-foreground' : ''
            }`}
          >
            {open ? 'Fertig' : value || 'Auswählen...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className="p-2">
            <Input
              placeholder="Suchen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="max-h-60 overflow-y-auto overscroll-contain p-2 space-y-1">
            {filtered.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent"
                onClick={() => select(option)}
              >
                <Checkbox checked={value === option} />
                {option}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1.5">
                Keine Ergebnisse
              </p>
            )}
          </div>
          <div className="border-t p-2">
            {notice && (
              <p className="px-2 pb-2 text-sm text-muted-foreground" role="status">
                {notice}
              </p>
            )}
            {showCustomInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Neues Material..."
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addCustom()}
                  className="h-8"
                  autoFocus
                />
                <Button size="sm" variant="outline" onClick={addCustom} className="h-8 px-2">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground"
                onClick={() => setShowCustomInput(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Eigenes Material hinzufügen
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {notice && !open && (
        <p className="text-xs text-muted-foreground" role="status">
          {notice}
        </p>
      )}
    </div>
  )
}
