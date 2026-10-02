'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Save, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { StepIndicator } from './step-indicator'
import { MultiSelect } from './multi-select'
import { MaterialInput } from './material-input'
import { VariantInput } from './variant-input'
import { LinkInput } from './link-input'
import { ImageUpload } from './image-upload'
import {
  SPORTS, AGE_GROUPS, PHASES, ORGANIZATION_FORMS, DIFFICULTY_LEVELS,
  EMPTY_FORM_DATA,
  type ExerciseFormData, type DifficultyLevel,
} from '@/lib/types/exercise'
import {
  stepBasisSchema,
  stepEinordnungSchema,
  stepLogistikSchema,
  stepExtrasSchema,
} from '@/lib/validations/exercise'

interface ExerciseWizardProps {
  initialData?: ExerciseFormData
  exerciseId?: string
  onSave: (data: ExerciseFormData) => Promise<{ success?: boolean; error?: string; id?: string }>
  customCategories?: Record<string, string[]>
}

export function ExerciseWizard({ initialData, exerciseId, onSave, customCategories = {} }: ExerciseWizardProps) {
  const sportsOptions = React.useMemo(() => mergeOptions(SPORTS, customCategories.sport), [customCategories.sport])
  const ageGroupOptions = React.useMemo(() => mergeOptions(AGE_GROUPS, customCategories.age_group), [customCategories.age_group])
  const phaseOptions = React.useMemo(() => mergeOptions(PHASES, customCategories.phase), [customCategories.phase])
  const orgFormOptions = React.useMemo(() => mergeOptions(ORGANIZATION_FORMS, customCategories.organization_form), [customCategories.organization_form])
  const customMaterials = React.useMemo(() => customCategories.material ?? [], [customCategories.material])
  const router = useRouter()
  const { toast } = useToast()
  const [step, setStep] = React.useState(0)
  const [maxVisited, setMaxVisited] = React.useState(initialData ? 3 : 0)
  const [saving, setSaving] = React.useState(false)
  const [data, setData] = React.useState<ExerciseFormData>(initialData ?? EMPTY_FORM_DATA)
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  function update<K extends keyof ExerciseFormData>(field: K, value: ExerciseFormData[K]) {
    setData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function cleanMaterials() {
    const cleaned = data.materials.filter((m) => m.name && m.name !== 'Kein Material')
    if (cleaned.length !== data.materials.length) {
      setData((prev) => ({ ...prev, materials: cleaned }))
    }
    return cleaned
  }

  function cleanExtras() {
    const cleanedVariants = data.variants.filter((v) => v.title || v.description)
    const cleanedLinks = data.links.filter((l) => l.url)
    const changed = cleanedVariants.length !== data.variants.length || cleanedLinks.length !== data.links.length
    if (changed) {
      setData((prev) => ({ ...prev, variants: cleanedVariants, links: cleanedLinks }))
    }
    return { variants: cleanedVariants, links: cleanedLinks }
  }

  function validateStep(): boolean {
    try {
      let result
      if (step === 0) {
        result = stepBasisSchema.safeParse(data)
      } else if (step === 1) {
        result = stepEinordnungSchema.safeParse(data)
      } else if (step === 2) {
        const cleaned = cleanMaterials()
        result = stepLogistikSchema.safeParse({ ...data, materials: cleaned })
      } else if (step === 3) {
        const cleaned = cleanExtras()
        result = stepExtrasSchema.safeParse(cleaned)
      } else {
        return true
      }
      if (!result || result.success) {
        setErrors({})
        return true
      }
      const fieldErrors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]?.toString()
        if (key && !fieldErrors[key]) {
          if (key === 'variants' && issue.path.length > 1) {
            const idx = Number(issue.path[1]) + 1
            fieldErrors._form = `Variante ${idx}: ${issue.message}`
          } else if (key === 'links' && issue.path.length > 1) {
            const idx = Number(issue.path[1]) + 1
            fieldErrors._form = `Link ${idx}: ${issue.message}`
          } else {
            fieldErrors[key] = issue.message
          }
        }
      }
      if (Object.keys(fieldErrors).length === 0) {
        fieldErrors._form = 'Bitte überprüfe deine Eingaben.'
      }
      setErrors(fieldErrors)
      return false
    } catch {
      setErrors({ _form: 'Validierungsfehler. Bitte überprüfe deine Eingaben.' })
      return false
    }
  }

  function goNext() {
    if (validateStep()) {
      const next = Math.min(step + 1, 3)
      setStep(next)
      setMaxVisited((prev) => Math.max(prev, next))
    }
  }

  function goBack() {
    setErrors({})
    setStep((s) => Math.max(s - 1, 0))
  }

  function goToStep(target: number) {
    if (target !== step && target <= maxVisited) {
      setErrors({})
      setStep(target)
    }
  }

  async function handleSave() {
    if (!validateStep()) return
    const cleanedMaterials = cleanMaterials()
    const cleanedExtras = cleanExtras()
    const saveData = { ...data, materials: cleanedMaterials, ...cleanedExtras }
    setSaving(true)
    try {
      const result = await onSave(saveData)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: exerciseId ? 'Übung aktualisiert' : 'Übung erstellt' })
      router.push(result.id ? `/exercises/${result.id}` : '/exercises')
    } catch (err) {
      console.error('Save failed:', err)
      toast({ variant: 'destructive', title: 'Fehler', description: 'Speichern fehlgeschlagen. Bitte erneut versuchen.' })
    } finally {
      setSaving(false)
    }
  }

  React.useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-end mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/exercises">
            <X className="mr-2 h-4 w-4" />
            Abbrechen
          </Link>
        </Button>
      </div>
      <StepIndicator currentStep={step} maxVisited={maxVisited} onStepClick={goToStep} />

      {step > 0 && data.name && (
        <p className="text-sm text-muted-foreground mb-4">
          Übung: <span className="font-medium text-foreground">{data.name}</span>
        </p>
      )}

      {errors._form && (
        <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
          {errors._form}
        </div>
      )}

      <div className="min-h-[400px]">
        {step === 0 && (
          <StepBasis data={data} errors={errors} update={update} />
        )}
        {step === 1 && (
          <StepEinordnung data={data} errors={errors} update={update}
            sportsOptions={sportsOptions} ageGroupOptions={ageGroupOptions}
            phaseOptions={phaseOptions} orgFormOptions={orgFormOptions} />
        )}
        {step === 2 && (
          <StepLogistik data={data} errors={errors} update={update}
            customMaterials={customMaterials} />
        )}
        {step === 3 && (
          <StepExtras data={data} update={update} />
        )}
      </div>

      <div className="flex justify-between mt-8 pt-4 border-t">
        <Button variant="outline" onClick={goBack} disabled={step === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        {step < 3 ? (
          <Button onClick={goNext}>
            Weiter
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Speichern
          </Button>
        )}
      </div>
    </div>
  )
}

interface StepProps {
  data: ExerciseFormData
  errors: Record<string, string>
  update: <K extends keyof ExerciseFormData>(field: K, value: ExerciseFormData[K]) => void
  sportsOptions?: string[]
  ageGroupOptions?: string[]
  phaseOptions?: string[]
  orgFormOptions?: string[]
  customMaterials?: string[]
}

function mergeOptions(predefined: readonly string[], custom?: string[]): string[] {
  if (!custom || custom.length === 0) return [...predefined]
  const set = new Set<string>(predefined)
  const result = [...predefined]
  for (const c of custom) {
    if (!set.has(c)) result.push(c)
  }
  return result
}

function StepBasis({ data, errors, update }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Basis-Informationen</h2>
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          placeholder="z.B. Feuer-Wasser-Blitz"
          value={data.name}
          onChange={(e) => update('name', e.target.value)}
          maxLength={100}
          className={errors.name ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          <p className="text-xs text-muted-foreground ml-auto">{data.name.length}/100</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Beschreibung *</Label>
        <Textarea
          id="description"
          placeholder="Ablauf und Regeln der Übung..."
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={5000}
          rows={6}
          className={errors.description ? 'border-destructive' : ''}
        />
        <div className="flex justify-between">
          {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
          <p className="text-xs text-muted-foreground ml-auto">{data.description.length}/5.000</p>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="workNotes">Arbeitsnotizen</Label>
        <p className="text-xs text-muted-foreground">Werden angezeigt, wenn die Übung in der fertigen Stunde dran ist.</p>
        <Textarea
          id="workNotes"
          placeholder="Hinweise zur Durchführung, Aufbau-Details..."
          value={data.workNotes}
          onChange={(e) => update('workNotes', e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">{data.workNotes.length}/2.000</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Anmerkungen</Label>
        <Textarea
          id="notes"
          placeholder="Persönliche Tipps, Erfahrungen..."
          value={data.notes}
          onChange={(e) => update('notes', e.target.value)}
          maxLength={2000}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">{data.notes.length}/2.000</p>
      </div>
    </div>
  )
}

function StepEinordnung({ data, errors, update, sportsOptions, ageGroupOptions, phaseOptions, orgFormOptions }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Einordnung</h2>
      <div className="space-y-2">
        <Label>Sportart(en) *</Label>
        <MultiSelect
          options={sportsOptions ?? SPORTS}
          selected={data.sports}
          onChange={(v) => update('sports', v)}
          placeholder="Sportarten auswählen..."
          allowCustom
          customLabel="Eigene Sportart hinzufügen"
          error={errors.sports}
        />
      </div>
      <div className="space-y-2">
        <Label>Altersgruppe(n) *</Label>
        <MultiSelect
          options={ageGroupOptions ?? AGE_GROUPS}
          selected={data.ageGroups}
          onChange={(v) => update('ageGroups', v)}
          placeholder="Altersgruppen auswählen..."
          allowCustom
          customLabel="Eigene Altersgruppe hinzufügen"
          error={errors.ageGroups}
        />
      </div>
      <div className="space-y-2">
        <Label>Phase(n) *</Label>
        <MultiSelect
          options={phaseOptions ?? PHASES}
          selected={data.phases}
          onChange={(v) => update('phases', v)}
          placeholder="Phasen auswählen..."
          allowCustom
          customLabel="Eigene Phase hinzufügen"
          error={errors.phases}
        />
      </div>
      <div className="space-y-2">
        <Label>Schwierigkeitsgrad *</Label>
        <RadioGroup
          value={data.difficulty}
          onValueChange={(v) => update('difficulty', v as DifficultyLevel)}
          className="flex gap-4"
        >
          {DIFFICULTY_LEVELS.map((level) => (
            <div key={level} className="flex items-center space-x-2">
              <RadioGroupItem value={level} id={`difficulty-${level}`} />
              <Label htmlFor={`difficulty-${level}`} className="font-normal cursor-pointer">
                {level}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-2">
        <Label>Organisationsform(en)</Label>
        <MultiSelect
          options={orgFormOptions ?? ORGANIZATION_FORMS}
          selected={data.organizationForms}
          onChange={(v) => update('organizationForms', v)}
          placeholder="Organisationsformen auswählen..."
          allowCustom
          customLabel="Eigene Form hinzufügen"
        />
      </div>
    </div>
  )
}

function StepLogistik({ data, errors, update, customMaterials }: StepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Logistik</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration">Dauer (Minuten) *</Label>
          <Input
            id="duration"
            type="text"
            inputMode="numeric"
            value={data.duration || ''}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, '')
              update('duration', v ? Math.min(parseInt(v, 10), 300) : 0)
            }}
            placeholder="Min."
            className={errors.duration ? 'border-destructive' : ''}
          />
          {errors.duration && <p className="text-sm text-destructive">{errors.duration}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="participantsMin">Teilnehmer Min</Label>
          <Input
            id="participantsMin"
            type="number"
            min={1}
            placeholder="—"
            value={data.participantsMin ?? ''}
            onChange={(e) => update('participantsMin', e.target.value ? parseInt(e.target.value) : null)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="participantsMax">Teilnehmer Max</Label>
          <Input
            id="participantsMax"
            type="number"
            min={1}
            placeholder="—"
            value={data.participantsMax ?? ''}
            onChange={(e) => update('participantsMax', e.target.value ? parseInt(e.target.value) : null)}
            className={errors.participantsMax ? 'border-destructive' : ''}
          />
          {errors.participantsMax && <p className="text-sm text-destructive">{errors.participantsMax}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Material</Label>
        <MaterialInput
          materials={data.materials}
          onChange={(v) => update('materials', v)}
          customMaterials={customMaterials}
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="musicRequired">Musik benötigt</Label>
          <Switch
            id="musicRequired"
            checked={data.musicRequired}
            onCheckedChange={(v) => update('musicRequired', v)}
          />
        </div>
        {data.musicRequired && (
          <div className="space-y-2">
            <Label htmlFor="musicLink">Musik-Link</Label>
            <Input
              id="musicLink"
              placeholder="https://open.spotify.com/... oder YouTube-Link"
              value={data.musicLink}
              onChange={(e) => update('musicLink', e.target.value)}
              className={errors.musicLink ? 'border-destructive' : ''}
            />
            {errors.musicLink && <p className="text-sm text-destructive">{errors.musicLink}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

interface StepExtrasProps {
  data: ExerciseFormData
  update: <K extends keyof ExerciseFormData>(field: K, value: ExerciseFormData[K]) => void
}

function StepExtras({ data, update }: StepExtrasProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Extras</h2>
      <div className="space-y-2">
        <Label>Varianten</Label>
        <VariantInput
          variants={data.variants}
          onChange={(v) => update('variants', v)}
        />
      </div>
      <div className="space-y-2">
        <Label>Links</Label>
        <LinkInput
          links={data.links}
          onChange={(v) => update('links', v)}
        />
      </div>
      <div className="space-y-2">
        <Label>Bilder</Label>
        <ImageUpload
          images={data.images}
          onImagesChange={(imgs) => update('images', imgs)}
        />
      </div>
    </div>
  )
}
