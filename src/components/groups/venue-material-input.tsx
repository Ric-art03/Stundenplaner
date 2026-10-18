'use client'

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { MaterialSelect } from '@/components/exercises/material-select'
import { type VenueMaterial } from '@/lib/types/group'
import { termOptions } from '@/lib/categories/terms'

interface VenueMaterialInputProps {
  materials: VenueMaterial[]
  onChange: (materials: VenueMaterial[]) => void
  customMaterials?: string[]
}

export function VenueMaterialInput({ materials, onChange, customMaterials = [] }: VenueMaterialInputProps) {
  const allMaterials = React.useMemo(() => termOptions('material', customMaterials), [customMaterials])

  const takenNames = React.useMemo(
    () => new Set(materials.map((m) => m.name).filter(Boolean)),
    [materials]
  )

  const allTaken = allMaterials.every((option) => takenNames.has(option))

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
            <MaterialSelect
              // Bereits vergebene Materialien fallen aus der Liste, damit
              // dasselbe Material nicht zweimal mit getrennten Mengen entsteht.
              options={allMaterials.filter(
                (option) => option === material.name || !takenNames.has(option)
              )}
              takenNames={[...takenNames].filter((name) => name !== material.name)}
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
            aria-label="Material entfernen"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addMaterial}
        disabled={allTaken}
      >
        <Plus className="mr-2 h-4 w-4" />
        Material hinzufügen
      </Button>
      {allTaken && (
        <p className="text-xs text-muted-foreground">
          Alle bekannten Materialien sind bereits erfasst. Eigene Einträge lassen sich über
          die Auswahl einer vorhandenen Zeile ergänzen.
        </p>
      )}
    </div>
  )
}
