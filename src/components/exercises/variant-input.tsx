'use client'

import * as React from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { MaterialInput } from './material-input'
import { MultiSelect } from './multi-select'
import {
  AGE_GROUPS,
  ORGANIZATION_FORMS,
  type ExerciseMaterial,
  type ExerciseVariant,
} from '@/lib/types/exercise'
import {
  NO_MATERIAL_LABEL,
  noMaterialEntry,
  orderByTerm,
  realMaterials,
  variantMaterialMode,
  type VariantMaterialMode,
} from '@/lib/categories/terms'

interface VariantInputProps {
  variants: ExerciseVariant[]
  onChange: (variants: ExerciseVariant[]) => void
  variantErrors?: Record<number, string>
  /** Material der Hauptübung — eine Variante erbt es, solange sie keins eigenes hat. */
  mainMaterials?: ExerciseMaterial[]
  /** Dieselben Listen wie an der Hauptübung, mit den eigenen Begriffen. */
  ageGroupOptions?: string[]
  orgFormOptions?: string[]
  customMaterials?: string[]
}

const MATERIAL_MODES: { value: VariantMaterialMode; label: string }[] = [
  { value: 'inherit', label: 'Wie die Hauptübung' },
  { value: 'own', label: 'Eigenes Material' },
  { value: 'none', label: NO_MATERIAL_LABEL },
]

export function VariantInput({
  variants,
  onChange,
  variantErrors,
  mainMaterials = [],
  ageGroupOptions = [...AGE_GROUPS],
  orgFormOptions = [...ORGANIZATION_FORMS],
  customMaterials = [],
}: VariantInputProps) {
  const [expandedExtras, setExpandedExtras] = React.useState<Record<number, boolean>>({})

  // Der Zustand wird aus der Materialliste abgelesen (leer → wie die
  // Hauptübung). „Eigenes Material" mit noch leerer Liste sähe aber aus wie
  // „wie die Hauptübung" — dafür merkt sich die Maske die Wahl.
  const [chosenMode, setChosenMode] = React.useState<Record<number, VariantMaterialMode>>({})

  function materialMode(index: number, variant: ExerciseVariant): VariantMaterialMode {
    const derived = variantMaterialMode(variant.materials)
    return derived === 'inherit' && chosenMode[index] === 'own' ? 'own' : derived
  }

  function setMaterialMode(index: number, variant: ExerciseVariant, mode: VariantMaterialMode) {
    setChosenMode((prev) => ({ ...prev, [index]: mode }))
    if (mode === 'inherit') {
      updateVariant(index, 'materials', [])
    } else if (mode === 'none') {
      updateVariant(index, 'materials', [noMaterialEntry()])
    } else {
      const own = realMaterials(variant.materials ?? [])
      // Die Liste der Hauptübung wird kopiert, damit nichts abgetippt werden muss.
      updateVariant(
        index,
        'materials',
        own.length > 0 ? own : realMaterials(mainMaterials).map((m) => ({ ...m }))
      )
    }
  }

  const inheritedSummary = orderByTerm('material', realMaterials(mainMaterials).filter((m) => m.name))
    .map((m) => `${m.quantity}× ${m.name}`)
    .join(', ')

  function addVariant() {
    onChange([...variants, { title: '', description: '' }])
  }

  function removeVariant(index: number) {
    onChange(variants.filter((_, i) => i !== index))
    setExpandedExtras((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
  }

  function updateVariant(index: number, field: keyof ExerciseVariant, value: unknown) {
    onChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  function toggleExtras(index: number) {
    setExpandedExtras((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  return (
    <div className="space-y-3">
      {variants.map((variant, index) => (
        <div key={index} className="border rounded-lg p-4 space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1 space-y-3">
              <Input
                placeholder="Titel der Variante"
                value={variant.title}
                onChange={(e) => updateVariant(index, 'title', e.target.value)}
              />
              <Textarea
                placeholder="Beschreibung der Variante..."
                value={variant.description}
                onChange={(e) => updateVariant(index, 'description', e.target.value)}
                rows={3}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeVariant(index)}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Collapsible open={expandedExtras[index]} onOpenChange={() => toggleExtras(index)}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                {expandedExtras[index] ? (
                  <ChevronUp className="mr-2 h-4 w-4" />
                ) : (
                  <ChevronDown className="mr-2 h-4 w-4" />
                )}
                Abweichende Bedingungen
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3 space-y-3 pl-2 border-l-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dauer (Min.)</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="—"
                    value={variant.duration ?? ''}
                    onChange={(e) =>
                      updateVariant(index, 'duration', e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Teilnehmer Min</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="—"
                    value={variant.participantsMin ?? ''}
                    onChange={(e) =>
                      updateVariant(index, 'participantsMin', e.target.value ? parseInt(e.target.value) : null)
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Teilnehmer Max</label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="—"
                    value={variant.participantsMax ?? ''}
                    onChange={(e) =>
                      updateVariant(index, 'participantsMax', e.target.value ? parseInt(e.target.value) : null)
                    }
                    className={variantErrors?.[index] ? 'border-destructive' : ''}
                  />
                  {variantErrors?.[index] && (
                    <p className="text-xs text-destructive mt-1">{variantErrors[index]}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground block" id={`variant-${index}-material`}>
                  Material
                </label>
                <RadioGroup
                  aria-labelledby={`variant-${index}-material`}
                  value={materialMode(index, variant)}
                  onValueChange={(v) => setMaterialMode(index, variant, v as VariantMaterialMode)}
                  className="flex flex-wrap gap-x-4 gap-y-2"
                >
                  {MATERIAL_MODES.map((mode) => (
                    <div key={mode.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={mode.value} id={`variant-${index}-material-${mode.value}`} />
                      <Label
                        htmlFor={`variant-${index}-material-${mode.value}`}
                        className="font-normal cursor-pointer"
                      >
                        {mode.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {materialMode(index, variant) === 'inherit' && (
                  <p className="text-sm text-muted-foreground">
                    {inheritedSummary
                      ? `Wie die Hauptübung: ${inheritedSummary}`
                      : 'Die Hauptübung braucht kein Material.'}
                  </p>
                )}
                {materialMode(index, variant) === 'own' && (
                  <div className="space-y-2">
                    <MaterialInput
                      materials={realMaterials(variant.materials ?? [])}
                      onChange={(mats) => updateVariant(index, 'materials', mats)}
                      customMaterials={customMaterials}
                    />
                    <p className="text-xs text-muted-foreground">
                      Diese Liste <strong>ersetzt</strong> das Material der Hauptübung vollständig.
                    </p>
                  </div>
                )}
                {materialMode(index, variant) === 'none' && (
                  <p className="text-sm text-muted-foreground">
                    Diese Variante braucht kein Material — auch wenn die Hauptübung welches hat.
                  </p>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Abweichende Altersgruppe</label>
                <MultiSelect
                  options={ageGroupOptions}
                  termType="age_group"
                  selected={variant.ageGroups ?? []}
                  onChange={(v) => updateVariant(index, 'ageGroups', v)}
                  placeholder="Altersgruppen auswählen..."
                  allowCustom
                  customLabel="Eigene Altersgruppe hinzufügen"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Abweichende Organisationsform</label>
                <MultiSelect
                  options={orgFormOptions}
                  termType="organization_form"
                  selected={variant.organizationForms ?? []}
                  onChange={(v) => updateVariant(index, 'organizationForms', v)}
                  placeholder="Organisationsformen auswählen..."
                  allowCustom
                  customLabel="Eigene Form hinzufügen"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addVariant}>
        <Plus className="mr-2 h-4 w-4" />
        Variante hinzufügen
      </Button>
    </div>
  )
}
