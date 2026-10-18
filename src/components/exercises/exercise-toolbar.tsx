'use client'

import * as React from 'react'
import Link from 'next/link'
import { Search, SlidersHorizontal, List, LayoutGrid, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from './multi-select'
import {
  DIFFICULTY_LEVELS,
  type ExerciseFilters, type ExerciseViewMode,
  EMPTY_FILTERS,
} from '@/lib/types/exercise'
import { NO_MATERIAL_LABEL, orderTerms, termOptions } from '@/lib/categories/terms'

/** Die Sortierungen von „Meine Übungen"; die Übungsdatenbank hat eigene (PROJ-4). */
export const OWN_SORT_OPTIONS: { value: string; label: string }[] = [
  { value: 'updatedAt-desc', label: 'Zuletzt bearbeitet' },
  { value: 'createdAt-desc', label: 'Zuletzt erstellt' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'duration-asc', label: 'Dauer (kurz → lang)' },
  { value: 'duration-desc', label: 'Dauer (lang → kurz)' },
  { value: 'difficulty-asc', label: 'Schwierigkeit (leicht → schwer)' },
  { value: 'difficulty-desc', label: 'Schwierigkeit (schwer → leicht)' },
]

interface ExerciseToolbarProps {
  filters: ExerciseFilters
  onFiltersChange: (filters: ExerciseFilters) => void
  viewMode: ExerciseViewMode
  onViewModeChange: (mode: ExerciseViewMode) => void
  /** „Feld-Richtung", z. B. „name-asc" — eine der `sortOptions`. */
  sortValue: string
  sortOptions?: { value: string; label: string }[]
  onSortValueChange: (value: string) => void
  customCategories?: Record<string, string[]>
  /**
   * „library": die Übungsdatenbank — ohne „Neue Übung" und ohne „noch zu
   * ergänzen", denn beides gibt es dort nicht.
   */
  mode?: 'own' | 'library'
}

export function ExerciseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  sortValue,
  sortOptions = OWN_SORT_OPTIONS,
  onSortValueChange,
  customCategories = {},
  mode = 'own',
}: ExerciseToolbarProps) {
  const sportsOptions = React.useMemo(() => termOptions('sport', customCategories.sport), [customCategories.sport])
  const ageGroupOptions = React.useMemo(() => termOptions('age_group', customCategories.age_group), [customCategories.age_group])
  const phaseOptions = React.useMemo(() => termOptions('phase', customCategories.phase), [customCategories.phase])
  const orgFormOptions = React.useMemo(() => termOptions('organization_form', customCategories.organization_form), [customCategories.organization_form])
  const materialOptions = React.useMemo(() => termOptions('material', customCategories.material), [customCategories.material])

  const activeChips = React.useMemo(() => {
    const chips: { label: string; key: string; value?: string }[] = []
    for (const s of orderTerms('sport', filters.sports)) chips.push({ label: s, key: 'sports', value: s })
    for (const ag of orderTerms('age_group', filters.ageGroups)) chips.push({ label: ag, key: 'ageGroups', value: ag })
    for (const p of orderTerms('phase', filters.phases)) chips.push({ label: p, key: 'phases', value: p })
    if (filters.difficulty) chips.push({ label: `Schwierigkeit: ${filters.difficulty}`, key: 'difficulty' })
    for (const of_ of orderTerms('organization_form', filters.organizationForms)) chips.push({ label: of_, key: 'organizationForms', value: of_ })
    if (filters.withoutMaterial) chips.push({ label: NO_MATERIAL_LABEL, key: 'withoutMaterial' })
    for (const m of orderTerms('material', filters.materials)) chips.push({ label: m, key: 'materials', value: m })
    if (filters.participantsMin != null) chips.push({ label: `Min. ${filters.participantsMin} TN`, key: 'participantsMin' })
    if (filters.participantsMax != null) chips.push({ label: `Max. ${filters.participantsMax} TN`, key: 'participantsMax' })
    if (filters.needsCompletion) chips.push({ label: 'Noch zu ergänzen', key: 'needsCompletion' })
    return chips
  }, [filters])

  function updateFilter<K extends keyof ExerciseFilters>(key: K, value: ExerciseFilters[K]) {
    onFiltersChange({ ...filters, [key]: value })
  }

  function removeChip(chip: { key: string; value?: string }) {
    const key = chip.key as keyof ExerciseFilters
    const current = filters[key]
    if (Array.isArray(current) && chip.value) {
      onFiltersChange({ ...filters, [key]: (current as string[]).filter((v) => v !== chip.value) })
    } else if (key === 'difficulty') {
      onFiltersChange({ ...filters, difficulty: null })
    } else if (key === 'participantsMin') {
      onFiltersChange({ ...filters, participantsMin: null })
    } else if (key === 'participantsMax') {
      onFiltersChange({ ...filters, participantsMax: null })
    } else if (key === 'needsCompletion') {
      onFiltersChange({ ...filters, needsCompletion: false })
    } else if (key === 'withoutMaterial') {
      onFiltersChange({ ...filters, withoutMaterial: false })
    }
  }

  function clearFilters() {
    onFiltersChange(EMPTY_FILTERS)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Übung suchen..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filter
                {activeChips.length > 0 && (
                  <Badge variant="default" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {activeChips.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="overflow-y-auto">
              <SheetHeader>
                <SheetTitle className="flex items-center justify-between">
                  Filter
                  {activeChips.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      <X className="mr-1 h-3 w-3" />
                      Zurücksetzen
                    </Button>
                  )}
                </SheetTitle>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                {mode === 'own' && (<>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="filter-noch-zu-ergaenzen" className="text-sm font-medium">
                      Nur noch zu ergänzende
                    </Label>
                    <Switch
                      id="filter-noch-zu-ergaenzen"
                      checked={filters.needsCompletion}
                      onCheckedChange={(checked) => updateFilter('needsCompletion', checked)}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Übungen, die du beim Bearbeiten einer Einheit schnell angelegt hast.
                    Die Markierung verschwindet, sobald du die Übung bearbeitest und
                    speicherst.
                  </p>
                </div>
                <Separator />
                </>)}
                <FilterSection label="Sportart">
                  <MultiSelect
                    options={sportsOptions}
                    termType="sport"
                    selected={filters.sports}
                    onChange={(v) => updateFilter('sports', v)}
                    placeholder="Alle Sportarten"
                  />
                </FilterSection>
                <FilterSection label="Altersgruppe">
                  <MultiSelect
                    options={ageGroupOptions}
                    termType="age_group"
                    selected={filters.ageGroups}
                    onChange={(v) => updateFilter('ageGroups', v)}
                    placeholder="Alle Altersgruppen"
                  />
                </FilterSection>
                <FilterSection label="Phase">
                  <MultiSelect
                    options={phaseOptions}
                    termType="phase"
                    selected={filters.phases}
                    onChange={(v) => updateFilter('phases', v)}
                    placeholder="Alle Phasen"
                  />
                </FilterSection>
                <FilterSection label="Schwierigkeitsgrad">
                  <Select
                    value={filters.difficulty ?? 'all'}
                    onValueChange={(v) => updateFilter('difficulty', v === 'all' ? null : v as ExerciseFilters['difficulty'])}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Alle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      {DIFFICULTY_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FilterSection>
                <FilterSection label="Organisationsform">
                  <MultiSelect
                    options={orgFormOptions}
                    termType="organization_form"
                    selected={filters.organizationForms}
                    onChange={(v) => updateFilter('organizationForms', v)}
                    placeholder="Alle Organisationsformen"
                  />
                </FilterSection>
                <FilterSection label="Material">
                  {/* Eine eigene Angabe, kein Begriff — deshalb abgesetzt über der Liste. */}
                  <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2">
                    <Checkbox
                      id="filter-without-material"
                      checked={filters.withoutMaterial}
                      onCheckedChange={(v) => updateFilter('withoutMaterial', v === true)}
                    />
                    <Label htmlFor="filter-without-material" className="font-normal cursor-pointer">
                      {NO_MATERIAL_LABEL}
                    </Label>
                  </div>
                  <MultiSelect
                    options={materialOptions}
                    termType="material"
                    selected={filters.materials}
                    onChange={(v) => updateFilter('materials', v)}
                    placeholder="Alle Materialien"
                  />
                </FilterSection>
                <Separator />
                <FilterSection label="Teilnehmerzahl">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-muted-foreground">Min</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="—"
                        value={filters.participantsMin ?? ''}
                        onChange={(e) => updateFilter('participantsMin', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Max</label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="—"
                        value={filters.participantsMax ?? ''}
                        onChange={(e) => updateFilter('participantsMax', e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>
                </FilterSection>
              </div>
            </SheetContent>
          </Sheet>

          <Select value={sortValue} onValueChange={onSortValueChange}>
            <SelectTrigger className="min-w-[9rem] flex-1 sm:w-[200px] sm:flex-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('list')}
              aria-label="Listenansicht"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => onViewModeChange('cards')}
              aria-label="Kartenansicht"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          {mode === 'own' && (
          <Button asChild className="h-10 w-10 shrink-0 p-0 sm:w-auto sm:px-4">
            <Link href="/exercises/new" aria-label="Neue Übung">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Neue Übung</span>
            </Link>
          </Button>
          )}
        </div>
      </div>

      {activeChips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filter:</span>
          {activeChips.map((chip, i) => (
            <Badge
              key={`${chip.key}-${chip.value ?? i}`}
              variant="secondary"
              className="pl-2 pr-1 gap-1 cursor-pointer hover:bg-secondary/80"
              onClick={() => removeChip(chip)}
            >
              {chip.label}
              <X className="h-3 w-3" />
            </Badge>
          ))}
          {activeChips.length > 1 && (
            <Button variant="ghost" size="sm" className="h-6 text-xs px-2" onClick={clearFilters}>
              Alle entfernen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

function FilterSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}
