'use client'

import * as React from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

interface VariantInputProps {
  variants: ExerciseVariant[]
  onChange: (variants: ExerciseVariant[]) => void
  variantErrors?: Record<number, string>
  /** Material der Hauptübung — eine Variante erbt es, solange sie keins eigenes hat. */
  mainMaterials?: ExerciseMaterial[]
}

export function VariantInput({
  variants,
  onChange,
  variantErrors,
  mainMaterials = [],
}: VariantInputProps) {
  const [expandedExtras, setExpandedExtras] = React.useState<Record<number, boolean>>({})

  // Eine Variante mit eigener Materialliste weicht ab; eine leere Liste erbt.
  // Beim Umschalten auf "abweichend" brauchen wir den Zustand aber auch dann,
  // wenn noch keine Zeile eingetragen ist.
  const [overriding, setOverriding] = React.useState<Record<number, boolean>>({})

  function isOverriding(index: number, variant: ExerciseVariant): boolean {
    return overriding[index] ?? (variant.materials?.length ?? 0) > 0
  }

  function startOverride(index: number) {
    setOverriding((prev) => ({ ...prev, [index]: true }))
    // Die Liste der Hauptübung wird kopiert, damit nichts abgetippt werden muss.
    updateVariant(index, 'materials', mainMaterials.map((m) => ({ ...m })))
  }

  function stopOverride(index: number) {
    setOverriding((prev) => ({ ...prev, [index]: false }))
    updateVariant(index, 'materials', [])
  }

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
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Material</label>
                {isOverriding(index, variant) ? (
                  <div className="space-y-2">
                    <MaterialInput
                      materials={variant.materials ?? []}
                      onChange={(mats) => updateVariant(index, 'materials', mats)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Diese Liste <strong>ersetzt</strong> das Material der Hauptübung
                      vollständig. Braucht die Variante gar nichts, wähle
                      {' '}&bdquo;Kein Material&ldquo;.
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => stopOverride(index)}
                      className="text-muted-foreground"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Wieder von der Hauptübung erben
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm">
                      {mainMaterials.length > 0 ? (
                        <>
                          <span className="text-muted-foreground">Wie Hauptübung: </span>
                          {mainMaterials
                            .map((m) => `${m.quantity}× ${m.name}`)
                            .join(', ')}
                        </>
                      ) : (
                        <span className="text-muted-foreground">
                          Wie Hauptübung: kein Material
                        </span>
                      )}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => startOverride(index)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Material für diese Variante anpassen
                    </Button>
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Abweichende Altersgruppe</label>
                <MultiSelect
                  options={AGE_GROUPS}
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
                  options={ORGANIZATION_FORMS}
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
