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
import {
  findTerm,
  splitByGroup,
  withSelected,
  type TermType,
} from '@/lib/categories/terms'

interface MultiSelectProps {
  options: readonly string[] | string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  allowCustom?: boolean
  customLabel?: string
  error?: string
  /**
   * Ordnet Optionen und gewählte Begriffe nach der Begriffsordnung (PROJ-19).
   * Ohne: in der Folge von `options`, Fremdes davor.
   */
  termType?: TermType
  /**
   * Die Ausnahme im Generator: diese Begriffe stehen in einem eigenen Block
   * oben, alle übrigen darunter.
   */
  leadingGroup?: { terms: string[]; label: string; restLabel: string }
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Auswählen...',
  allowCustom = false,
  customLabel = 'Eigene hinzufügen',
  error,
  termType,
  leadingGroup,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [customInput, setCustomInput] = React.useState('')
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const [notice, setNotice] = React.useState<string | null>(null)

  const allOptions = React.useMemo(() => {
    if (termType) return withSelected(termType, options, selected)
    const known = options as readonly string[]
    const foreign = selected.filter((s) => !known.includes(s))
    return [...foreign, ...known]
  }, [options, selected, termType])

  // Zwei Blöcke nur, wenn es Begriffe für den oberen gibt.
  const blocks = React.useMemo(() => {
    if (!leadingGroup || !termType || leadingGroup.terms.length === 0) return null
    return splitByGroup(termType, allOptions, leadingGroup.terms)
  }, [allOptions, leadingGroup, termType])

  // Gewähltes steht in der Reihenfolge der Liste, nicht in der des Anklickens.
  const orderedSelected = React.useMemo(() => {
    const order = blocks ? [...blocks.group, ...blocks.rest] : allOptions
    const index = (value: string) => {
      const i = order.indexOf(value)
      return i < 0 ? Number.MAX_SAFE_INTEGER : i
    }
    return [...selected].sort((a, b) => index(a) - index(b))
  }, [allOptions, blocks, selected])

  const matches = (option: string) => option.toLowerCase().includes(search.toLowerCase())
  const filtered = allOptions.filter(matches)

  function change(next: string[]) {
    setNotice(null)
    onChange(next)
  }

  function toggle(value: string) {
    if (selected.includes(value)) {
      change(selected.filter((s) => s !== value))
    } else {
      change([...selected, value])
    }
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (!trimmed) return

    // Einen Begriff gibt es nur einmal: der vorhandene wird ausgewählt.
    const existing = findTerm(trimmed, allOptions)
    if (existing) {
      if (selected.includes(existing)) {
        setNotice(`„${existing}" ist schon ausgewählt.`)
      } else {
        onChange([...selected, existing])
        setNotice(`„${existing}" gibt es schon — ausgewählt.`)
      }
    } else {
      change([...selected, trimmed])
    }
    setCustomInput('')
    setShowCustomInput(false)
  }

  function removeItem(value: string) {
    change(selected.filter((s) => s !== value))
  }

  function renderOption(option: string) {
    return (
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
    )
  }

  function renderBlock(label: string, items: string[]) {
    const visible = items.filter(matches)
    if (visible.length === 0) return null
    return (
      <div role="group" aria-label={label}>
        <p className="px-2 pt-1 pb-0.5 text-xs font-medium text-muted-foreground">{label}</p>
        {visible.map(renderOption)}
      </div>
    )
  }

  return (
    <div className="space-y-2">
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
            className={`w-full justify-between font-normal focus-visible:ring-offset-0 focus-visible:ring-inset ${
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
            {blocks && leadingGroup ? (
              <>
                {renderBlock(leadingGroup.label, blocks.group)}
                {blocks.group.some(matches) && blocks.rest.some(matches) && (
                  <div className="my-1 border-t" />
                )}
                {renderBlock(leadingGroup.restLabel, blocks.rest)}
              </>
            ) : (
              filtered.map(renderOption)
            )}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground px-2 py-1.5">
                Keine Ergebnisse
              </p>
            )}
          </div>
          {allowCustom && (
            <div className="border-t p-2">
              {notice && (
                <p className="px-2 pb-2 text-sm text-muted-foreground" role="status">
                  {notice}
                </p>
              )}
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

      {orderedSelected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {orderedSelected.map((item) => (
            <Badge key={item} variant="secondary" className="gap-1">
              {item}
              <button
                type="button"
                onClick={() => removeItem(item)}
                className="rounded-full hover:bg-muted-foreground/20"
                aria-label={`${item} entfernen`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {notice && !open && (
        <p className="text-sm text-muted-foreground" role="status">
          {notice}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
