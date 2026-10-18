'use client'

import * as React from 'react'
import { Info, Library, SearchX } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { ExerciseToolbar } from '@/components/exercises/exercise-toolbar'
import { ExerciseListView, type ExerciseViewSlots } from '@/components/exercises/exercise-list-view'
import { ExerciseCardView } from '@/components/exercises/exercise-card-view'
import { getLibrary } from '@/lib/actions/library'
import { libraryEntryHref, libraryQuery, type LibraryParams } from '@/lib/library/address'
import { hasActiveFilters } from '@/lib/library/filter-reasons'
import {
  dropCopied,
  hiddenCount,
  preselectedIds,
  selectableIds,
  selectionInOrder,
} from '@/lib/library/selection'
import { EMPTY_FILTERS, type Exercise, type ExerciseViewMode } from '@/lib/types/exercise'
import {
  LIBRARY_SORT_OPTIONS,
  type LibraryEntry,
  type LibraryResult,
  type LibrarySortDirection,
  type LibrarySortField,
} from '@/lib/types/library'
import { CopyControl, EntryBadges, FitLine } from './library-entry-parts'
import { LibraryGroupPicker } from './library-group-picker'
import { SelectionBar } from './selection-bar'
import { useLibraryCopy } from './use-library-copy'

interface LibraryBrowserProps {
  initialParams: LibraryParams
  groups: { id: string; name: string }[]
}

const UNREACHABLE: LibraryResult = {
  available: false,
  hasContent: false,
  entries: [],
  group: null,
  groupMissing: false,
  emptyReasons: [],
}

/**
 * Der Reiter „Übungsdatenbank" (PROJ-4). Filter, Sortierung und Gruppe stehen
 * in der Adresse; geladen wird über den Server, der auch „Passt zu Gruppe"
 * rechnet — mit den Kriterien des Generators.
 */
export function LibraryBrowser({ initialParams, groups }: LibraryBrowserProps) {
  const [params, setParams] = React.useState<LibraryParams>(initialParams)
  const [result, setResult] = React.useState<LibraryResult | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [viewMode, setViewMode] = React.useState<ExerciseViewMode>('list')
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [missingGroupNotice, setMissingGroupNotice] = React.useState(false)
  const requestRef = React.useRef(0)
  // Für welche Gruppe zuletzt vorausgewählt wurde — `undefined`: noch gar nicht.
  const appliedGroupRef = React.useRef<string | null | undefined>(undefined)
  const { copy, copying } = useLibraryCopy()

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('exercise-view-mode')
      if (saved === 'list' || saved === 'cards') setViewMode(saved)
    } catch { /* localStorage nicht verfügbar */ }
  }, [])

  // Die Adresse spiegelt den Stand — ohne Seitenwechsel und ohne Serverrunde.
  React.useEffect(() => {
    const href = `/exercises?${libraryQuery(params)}`
    if (`${window.location.pathname}${window.location.search}` !== href) {
      window.history.replaceState(null, '', href)
    }
  }, [params])

  React.useEffect(() => {
    const request = ++requestRef.current
    setLoading(true)
    // Kurz warten, damit nicht jeder Tastendruck in der Suche eine Abfrage wird.
    const timer = window.setTimeout(async () => {
      try {
        const next = await getLibrary(params)
        if (request === requestRef.current) setResult(next)
      } catch {
        if (request === requestRef.current) setResult(UNREACHABLE)
      } finally {
        if (request === requestRef.current) setLoading(false)
      }
    }, 200)
    return () => window.clearTimeout(timer)
  }, [params])

  React.useEffect(() => {
    if (!result) return
    if (result.groupMissing) {
      setMissingGroupNotice(true)
      setParams((prev) => ({ ...prev, groupId: null }))
      return
    }
    const groupId = result.group?.id ?? null
    if (groupId !== appliedGroupRef.current) {
      appliedGroupRef.current = groupId
      setSelected((prev) => (groupId ? preselectedIds(result.entries) : dropCopied(prev, result.entries)))
    } else {
      // Filter blenden aus, wählen aber nicht ab — die Leiste sagt, was verborgen mitkommt.
      setSelected((prev) => dropCopied(prev, result.entries))
    }
  }, [result])

  function update(patch: Partial<LibraryParams>) {
    setParams((prev) => ({ ...prev, ...patch }))
  }

  function handleViewModeChange(mode: ExerciseViewMode) {
    setViewMode(mode)
    try { localStorage.setItem('exercise-view-mode', mode) } catch { /* ignorieren */ }
  }

  function toggle(id: string, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })
  }

  async function handleCopy(ids: string[]) {
    const outcome = await copy(ids, (id) => byId.get(id)?.exercise.name)
    if (!outcome) return

    if (outcome.unavailable.length > 0) {
      const gone = new Set(outcome.unavailable)
      setResult((prev) => prev && { ...prev, entries: prev.entries.filter((e) => !gone.has(e.exercise.id)) })
      setSelected((prev) => new Set([...prev].filter((id) => !gone.has(id))))
      return
    }

    setResult((prev) =>
      prev && {
        ...prev,
        entries: prev.entries.map((e) =>
          outcome.copies.has(e.exercise.id)
            ? { ...e, copiedExerciseId: outcome.copies.get(e.exercise.id) ?? null }
            : e
        ),
      }
    )
    setSelected((prev) => new Set([...prev].filter((id) => !outcome.copies.has(id))))
  }

  const entries = React.useMemo(() => result?.entries ?? [], [result])
  const byId = React.useMemo(() => new Map(entries.map((e) => [e.exercise.id, e])), [entries])
  const selectable = React.useMemo(() => selectableIds(entries), [entries])
  const allSelected = selectable.size > 0 && [...selectable].every((id) => selected.has(id))
  const hidden = hiddenCount(selected, entries)
  const copyingAny = copying.size > 0
  const group = result?.group ?? null
  const allCopied = group !== null && entries.length > 0 && selectable.size === 0

  const entryOf = (exercise: Exercise): LibraryEntry => byId.get(exercise.id)!
  const slots: ExerciseViewSlots = {
    hrefFor: (exercise) => libraryEntryHref(exercise.id, params),
    leading: (exercise) => {
      const entry = entryOf(exercise)
      const copied = entry.copiedExerciseId !== null
      return (
        <Checkbox
          className="mt-1"
          checked={!copied && selected.has(exercise.id)}
          disabled={copied || copyingAny}
          onCheckedChange={(value) => toggle(exercise.id, value === true)}
          aria-label={copied ? `„${exercise.name}" ist schon übernommen` : `„${exercise.name}" auswählen`}
        />
      )
    },
    titleExtras: (exercise) => {
      const entry = entryOf(exercise)
      return <EntryBadges isDraft={entry.isDraft} copied={entry.copiedExerciseId !== null} />
    },
    footer: (exercise) => {
      const entry = entryOf(exercise)
      return (
        <div className="space-y-1.5">
          {entry.fit && <FitLine fit={entry.fit} />}
          <CopyControl
            name={exercise.name}
            copiedExerciseId={entry.copiedExerciseId}
            copying={copying.has(exercise.id)}
            disabled={copyingAny}
            onCopy={() => handleCopy([exercise.id])}
          />
        </div>
      )
    },
    actions: () => null,
  }

  const filtersActive = hasActiveFilters(params.filters)

  return (
    <div className={selected.size > 0 ? 'space-y-5 pb-20' : 'space-y-5'}>
      <p className="text-sm text-muted-foreground">
        Kuratierte Übungen zum Übernehmen. Eine übernommene Übung gehört dir: Du kannst sie
        ändern, und der Generator plant sie ein wie jede eigene.
      </p>

      <ExerciseToolbar
        mode="library"
        filters={params.filters}
        onFiltersChange={(filters) => update({ filters })}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortValue={`${params.sortField}-${params.sortDirection}`}
        sortOptions={LIBRARY_SORT_OPTIONS}
        onSortValueChange={(value) => {
          const [sortField, sortDirection] = value.split('-') as [LibrarySortField, LibrarySortDirection]
          update({ sortField, sortDirection })
        }}
      />

      <LibraryGroupPicker
        groups={groups}
        groupId={params.groupId}
        onChange={(groupId) => {
          setMissingGroupNotice(false)
          update({ groupId })
        }}
      />

      {missingGroupNotice && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Die Gruppe aus dem Verweis gibt es nicht mehr. Gezeigt werden alle Übungen.
          </AlertDescription>
        </Alert>
      )}

      {group && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Gezeigt werden Übungen, deren Sportart und Altersgruppe zu &bdquo;{group.name}&ldquo;
            passen. Vorausgewählt ist, was der Generator für die Gruppe sofort einplanen würde.
          </p>
          {group.noVenue && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                &bdquo;{group.name}&ldquo; hat keine Halle — deshalb wird kein Material geprüft,
                wie im Generator.
              </AlertDescription>
            </Alert>
          )}
          {group.participantsUnknown && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                &bdquo;{group.name}&ldquo; hat keine Teilnehmerzahl — Material &bdquo;pro
                Teilnehmer&ldquo; lässt sich nicht nachrechnen und gilt als vorhanden, wie im
                Generator.
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      {result === null ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !result.available ? (
        <EmptyNote
          icon={<Library className="h-8 w-8 text-muted-foreground" />}
          title="Die Übungsdatenbank ist gerade nicht erreichbar"
          lines={['Bitte versuche es in einem Moment erneut.']}
        />
      ) : !result.hasContent ? (
        <EmptyNote
          icon={<Library className="h-8 w-8 text-muted-foreground" />}
          title="Die Übungsdatenbank wird gerade aufgebaut"
          lines={['Bald findest du hier kuratierte Übungen, die du mit einem Klick übernehmen kannst.']}
        />
      ) : entries.length === 0 ? (
        <EmptyNote
          icon={<SearchX className="h-8 w-8 text-muted-foreground" />}
          title={group ? `Zu „${group.name}" passt keine Übung` : 'Keine Übung gefunden'}
          lines={result.emptyReasons}
          action={
            filtersActive ? (
              <Button variant="outline" onClick={() => update({ filters: EMPTY_FILTERS })}>
                Filter zurücksetzen
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className={loading ? 'space-y-3 opacity-60 transition-opacity' : 'space-y-3'} aria-busy={loading}>
          {allCopied && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>Alles Passende hast du schon übernommen.</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground" role="status">
              {entries.length} {entries.length === 1 ? 'Übung' : 'Übungen'}
              {group ? ' passen zu Sportart und Alter' : ''}
            </p>
            {selectable.size > 0 && (
              <Button
                variant="ghost"
                size="sm"
                disabled={copyingAny}
                // Wirkt nur auf die sichtbaren; ausgeblendete Auswahl bleibt.
                onClick={() =>
                  setSelected((prev) => {
                    const next = new Set(prev)
                    for (const id of selectable) {
                      if (allSelected) next.delete(id)
                      else next.add(id)
                    }
                    return next
                  })
                }
              >
                {allSelected ? 'Keine auswählen' : 'Alle auswählen'}
              </Button>
            )}
          </div>
          {viewMode === 'list' ? (
            <ExerciseListView exercises={entries.map((e) => e.exercise)} {...slots} />
          ) : (
            <ExerciseCardView exercises={entries.map((e) => e.exercise)} {...slots} />
          )}
        </div>
      )}

      <SelectionBar
        count={selected.size}
        hidden={hidden}
        copying={copyingAny}
        onClear={() => setSelected(new Set())}
        onCopy={() => handleCopy(selectionInOrder(selected, entries))}
      />
    </div>
  )
}

function EmptyNote({
  icon,
  title,
  lines,
  action,
}: {
  icon: React.ReactNode
  title: string
  lines: string[]
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">{icon}</div>
      <h2 className="mb-2 text-lg font-semibold">{title}</h2>
      <div className="mb-4 max-w-md space-y-1 text-sm text-muted-foreground">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      {action}
    </div>
  )
}
