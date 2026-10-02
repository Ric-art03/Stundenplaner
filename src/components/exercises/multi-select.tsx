'use client'

import * as React from 'react'
import { X, ChevronsUpDown, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'

interface MultiSelectProps {
  options: readonly string[] | string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  allowCustom?: boolean
  customLabel?: string
  error?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Auswählen...',
  allowCustom = false,
  customLabel = 'Eigene hinzufügen',
  error,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [customInput, setCustomInput] = React.useState('')
  const [showCustomInput, setShowCustomInput] = React.useState(false)

  const allOptions = React.useMemo(() => {
    const customs = selected.filter((s) => !(options as string[]).includes(s))
    return [...options, ...customs]
  }, [options, selected])

  const filtered = allOptions.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (trimmed && !allOptions.includes(trimmed)) {
      onChange([...selected, trimmed])
      setCustomInput('')
      setShowCustomInput(false)
    }
  }

  function removeItem(value: string) {
    onChange(selected.filter((s) => s !== value))
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={`w-full justify-between font-normal ${
              open ? 'text-primary border-primary' : selected.length === 0 ? 'text-muted-foreground' : ''
            } ${error ? 'border-destructive' : ''}`}
          >
            {open
              ? 'Fertig'
              : selected.length === 0
                ? placeholder
                : `${selected.length} ausgewählt`}
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
              >
                <Checkbox
                  checked={selected.includes(option)}
                  onCheckedChange={() => toggle(option)}
                />
                {option}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1.5">
                Keine Ergebnisse
              </p>
            )}
          </div>
          {allowCustom && (
            <div className="border-t p-2">
              {showCustomInput ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Neuer Eintrag..."
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
                  {customLabel}
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="rounded-full hover:bg-muted-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
