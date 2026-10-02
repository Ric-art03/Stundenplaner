'use client'

import * as React from 'react'
import { Plus, Trash2, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { MATERIALS, type VenueMaterial } from '@/lib/types/group'

interface VenueMaterialInputProps {
  materials: VenueMaterial[]
  onChange: (materials: VenueMaterial[]) => void
  customMaterials?: string[]
}

const VENUE_MATERIALS = MATERIALS.filter((m) => m !== 'Kein Material')

export function VenueMaterialInput({ materials, onChange, customMaterials = [] }: VenueMaterialInputProps) {
  const allMaterials = React.useMemo(() => {
    const customs = customMaterials.filter((c) => !(VENUE_MATERIALS as readonly string[]).includes(c))
    return [...VENUE_MATERIALS, ...customs]
  }, [customMaterials])

  function addMaterial() {
    onChange([...materials, { name: '', quantity: 1 }])
  }

  function removeMaterial(index: number) {
    onChange(materials.filter((_, i) => i !== index))
  }

  function updateMaterial(index: number, field: keyof VenueMaterial, value: string | number) {
    const updated = materials.map((m, i) => {
      if (i !== index) return m
      return { ...m, [field]: value }
    })
    onChange(updated)
  }

  return (
    <div className="space-y-3">
      {materials.map((material, index) => (
        <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-end p-3 border rounded-lg">
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <label className="text-xs text-muted-foreground mb-1 block">Material</label>
            <VenueMaterialSelect
              options={allMaterials}
              value={material.name}
              onChange={(v) => updateMaterial(index, 'name', v)}
            />
          </div>
          <div className="w-full sm:w-24">
            <label className="text-xs text-muted-foreground mb-1 block">Anzahl</label>
            <Input
              type="number"
              min={1}
              value={material.quantity || ''}
              onChange={(e) => {
                const v = e.target.valueAsNumber
                updateMaterial(index, 'quantity', Number.isNaN(v) ? 0 : v)
              }}
              onBlur={() => {
                if (!material.quantity || material.quantity < 1) {
                  updateMaterial(index, 'quantity', 1)
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => removeMaterial(index)}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
        <Plus className="mr-2 h-4 w-4" />
        Material hinzufügen
      </Button>
    </div>
  )
}

interface VenueMaterialSelectProps {
  options: (string | typeof VENUE_MATERIALS[number])[]
  value: string
  onChange: (value: string) => void
}

function VenueMaterialSelect({ options, value, onChange }: VenueMaterialSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [customInput, setCustomInput] = React.useState('')
  const [showCustomInput, setShowCustomInput] = React.useState(false)
  const [localOptions, setLocalOptions] = React.useState<string[]>([])

  const allOptions = React.useMemo(() => {
    const extra = localOptions.filter((l) => !options.includes(l))
    return [...options, ...extra]
  }, [options, localOptions])

  const filtered = allOptions.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase())
  )

  function select(val: string) {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  function addCustom() {
    const trimmed = customInput.trim()
    if (trimmed && !allOptions.includes(trimmed)) {
      setLocalOptions((prev) => [...prev, trimmed])
      onChange(trimmed)
      setCustomInput('')
      setShowCustomInput(false)
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
  )
}
