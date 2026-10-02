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
import { Separator } from '@/components/ui/separator'
import { MultiSelect } from './multi-select'
import {
  SPORTS, AGE_GROUPS, PHASES, ORGANIZATION_FORMS, MATERIALS, DIFFICULTY_LEVELS,
  type ExerciseFilters, type ExerciseViewMode, type ExerciseSortField, type ExerciseSortDirection,
  EMPTY_FILTERS,
} from '@/lib/types/exercise'

interface ExerciseToolbarProps {
  filters: ExerciseFilters
  onFiltersChange: (filters: ExerciseFilters) => void
  viewMode: ExerciseViewMode
  onViewModeChange: (mode: ExerciseViewMode) => void
  sortField: ExerciseSortField
  onSortChange: (field: ExerciseSortField, direction: ExerciseSortDirection) => void
  sortDirection: ExerciseSortDirection
  customCategories?: Record<string, string[]>
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

export function ExerciseToolbar({
  filters,
  onFiltersChange,
  viewMode,
  onViewModeChange,
  sortField,
  onSortChange,
  sortDirection,
  customCategories = {},
}: ExerciseToolbarProps) {
  const sportsOptions = React.useMemo(() => mergeOptions(SPORTS, customCategories.sport), [customCategories.sport])
  const ageGroupOptions = React.useMemo(() => mergeOptions(AGE_GROUPS, customCategories.age_group), [customCategories.age_group])
  const phaseOptions = React.useMemo(() => mergeOptions(PHASES, customCategories.phase), [customCategories.phase])
  const orgFormOptions = React.useMemo(() => mergeOptions(ORGANIZATION_FORMS, customCategories.organization_form), [customCategories.organization_form])
  const materialOptions = React.useMemo(() => mergeOptions(MATERIALS, customCategories.material), [customCategories.material])

  const activeChips = React.useMemo(() => {
    const chips: { label: string; key: string; value?: string }[] = []
    for (const s of filters.sports) chips.push({ label: s, key: 'sports', value: s })
    for (const ag of filters.ageGroups) chips.push({ label: ag, key: 'ageGroups', value: ag })
    for (const p of filters.phases) chips.push({ label: p, key: 'phases', value: p })
    if (filters.difficulty) chips.push({ label: `Schwierigkeit: ${filters.difficulty}`, key: 'difficulty' })
    for (const of_ of filters.organizationForms) chips.push({ label: of_, key: 'organizationForms', value: of_ })
    for (const m of filters.materials) chips.push({ label: m, key: 'materials', value: m })
    if (filters.participantsMin != null) chips.push({ label: `Min. ${filters.participantsMin} TN`, key: 'participantsMin' })
    if (filters.participantsMax != null) chips.push({ label: `Max. ${filters.participantsMax} TN`, key: 'participantsMax' })
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
        <div className="flex gap-2">
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
                <FilterSection label="Sportart">
                  <MultiSelect
                    options={sportsOptions}
                    selected={filters.sports}
                    onChange={(v) => updateFilter('sports', v)}
                    placeholder="Alle Sportarten"
                  />
                </FilterSection>
                <FilterSection label="Altersgruppe">
                  <MultiSelect
                    options={ageGroupOptions}
                    selected={filters.ageGroups}
                    onChange={(v) => updateFilter('ageGroups', v)}
                    placeholder="Alle Altersgruppen"
                  />
                </FilterSection>
                <FilterSection label="Phase">
                  <MultiSelect
                    options={phaseOptions}
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
                    selected={filters.organizationForms}
                    onChange={(v) => updateFilter('organizationForms', v)}
                    placeholder="Alle Organisationsformen"
                  />
                </FilterSection>
                <FilterSection label="Material">
                  <MultiSelect
                    options={materialOptions}
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

          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(v) => {
              const [field, dir] = v.split('-') as [ExerciseSortField, ExerciseSortDirection]
              onSortChange(field, dir)
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updatedAt-desc">Zuletzt bearbeitet</SelectItem>
              <SelectItem value="createdAt-desc">Zuletzt erstellt</SelectItem>
              <SelectItem value="name-asc">Name (A–Z)</SelectItem>
              <SelectItem value="name-desc">Name (Z–A)</SelectItem>
              <SelectItem value="duration-asc">Dauer (kurz → lang)</SelectItem>
              <SelectItem value="duration-desc">Dauer (lang → kurz)</SelectItem>
              <SelectItem value="difficulty-asc">Schwierigkeit (leicht → schwer)</SelectItem>
              <SelectItem value="difficulty-desc">Schwierigkeit (schwer → leicht)</SelectItem>
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

          <Button asChild>
            <Link href="/exercises/new">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Neue Übung</span>
            </Link>
          </Button>
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
