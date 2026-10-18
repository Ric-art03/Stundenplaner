'use client'

import * as React from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { type ExerciseMaterial, type MaterialMode } from '@/lib/types/exercise'
import { termOptions } from '@/lib/categories/terms'
import { MaterialSelect } from './material-select'

interface MaterialInputProps {
  materials: ExerciseMaterial[]
  onChange: (materials: ExerciseMaterial[]) => void
  customMaterials?: string[]
}

/**
 * Die Materialzeilen einer Übung oder Variante. Die Zeilen bleiben beim
 * Bearbeiten in der Folge, in der sie eingegeben wurden — sonst spränge eine
 * Zeile weg, während man die Menge eintippt. Geordnet wird in der Anzeige.
 */
export function MaterialInput({ materials, onChange, customMaterials = [] }: MaterialInputProps) {
  const allMaterials = React.useMemo(() => termOptions('material', customMaterials), [customMaterials])

  function addMaterial() {
    onChange([...materials, { name: '', quantity: 1, mode: 'insgesamt' }])
  }

  function removeMaterial(index: number) {
    onChange(materials.filter((_, i) => i !== index))
  }

  function updateMaterial(index: number, field: keyof ExerciseMaterial, value: string | number) {
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
              value={material.quantity}
              onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="w-full sm:w-44">
            <label className="text-xs text-muted-foreground mb-1 block">Modus</label>
            <Select
              value={material.mode}
              onValueChange={(v) => updateMaterial(index, 'mode', v as MaterialMode)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="insgesamt">insgesamt</SelectItem>
                <SelectItem value="pro Teilnehmer">pro Teilnehmer</SelectItem>
              </SelectContent>
            </Select>
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
      <Button type="button" variant="outline" size="sm" onClick={addMaterial}>
        <Plus className="mr-2 h-4 w-4" />
        Material hinzufügen
      </Button>
    </div>
  )
}
