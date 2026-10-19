'use client'

import * as React from 'react'
import { ExerciseToolbar } from '@/components/exercises/exercise-toolbar'
import { ExerciseListView } from '@/components/exercises/exercise-list-view'
import { ExerciseCardView } from '@/components/exercises/exercise-card-view'
import { EmptyState } from '@/components/exercises/empty-state'
import { ExerciseUsageWarning } from '@/components/exercises/exercise-usage-warning'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { deleteExercise } from '@/lib/actions/exercises'
import { exerciseListQuery } from '@/lib/library/address'
import { hasActiveFilters } from '@/lib/library/filter-reasons'
import {
  type Exercise, type ExerciseFilters, type ExerciseViewMode,
  type ExerciseSortField, type ExerciseSortDirection,
  EMPTY_FILTERS,
} from '@/lib/types/exercise'

const PAGE_SIZE = 50

interface MyExercisesProps {
  /** Ob es in der Übungsdatenbank etwas zu übernehmen gibt — für den Leerzustand. */
  libraryHasContent: boolean
  /** Eigene Kategorien für die Filter — kommen mit der Seite vom Server. */
  customCategories: Record<string, string[]>
}

/** Der Reiter „Meine Übungen" — die bisherige Übersicht, unverändert. */
export function MyExercises({ libraryHasContent, customCategories }: MyExercisesProps) {
  const { toast } = useToast()
  const [exercises, setExercises] = React.useState<Exercise[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [loadingMore, setLoadingMore] = React.useState(false)
  const [filters, setFilters] = React.useState<ExerciseFilters>(EMPTY_FILTERS)
  const [viewMode, setViewMode] = React.useState<ExerciseViewMode>('list')
  const [sortField, setSortField] = React.useState<ExerciseSortField>('updatedAt')
  const [sortDirection, setSortDirection] = React.useState<ExerciseSortDirection>('desc')
  const [deleteTarget, setDeleteTarget] = React.useState<Exercise | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [loadFailed, setLoadFailed] = React.useState(false)
  const listRequestRef = React.useRef<AbortController | null>(null)

  // Gelesen wird über `/api/exercises`, nicht über eine Server-Aktion: eine
  // Server-Aktion, die während eines Seitenwechsels zurückkam, setzte den
  // alten Seitenstand wieder ein (BUG-31). Ein überholtes Laden wird abgebrochen.
  const fetchExercises = React.useCallback(async (offset: number, append: boolean) => {
    listRequestRef.current?.abort()
    const request = new AbortController()
    listRequestRef.current = request
    if (append) setLoadingMore(true)
    else {
      setLoading(true)
      setLoadFailed(false)
    }
    try {
      const query = exerciseListQuery({ filters, sortField, sortDirection, offset, limit: PAGE_SIZE })
      const response = await fetch(`/api/exercises?${query}`, { cache: 'no-store', signal: request.signal })
      if (!response.ok) throw new Error(`Status ${response.status}`)
      const result = (await response.json()) as { exercises: Exercise[]; total: number }
      setExercises((prev) => append ? [...prev, ...result.exercises] : result.exercises)
      setTotal(result.total)
    } catch {
      if (request.signal.aborted) return
      if (append) {
        toast({ variant: 'destructive', title: 'Nicht geladen', description: 'Weitere Übungen ließen sich gerade nicht laden. Bitte versuche es erneut.' })
      } else {
        setLoadFailed(true)
      }
    } finally {
      if (listRequestRef.current === request) {
        setLoading(false)
        setLoadingMore(false)
      }
    }
  }, [filters, sortField, sortDirection, toast])

  React.useEffect(() => {
    fetchExercises(0, false)
    return () => listRequestRef.current?.abort()
  }, [fetchExercises])

  React.useEffect(() => {
    try {
      const saved = localStorage.getItem('exercise-view-mode')
      if (saved === 'list' || saved === 'cards') setViewMode(saved)
      const savedSort = localStorage.getItem('exercise-sort')
      if (savedSort) {
        const [f, d] = savedSort.split('-') as [ExerciseSortField, ExerciseSortDirection]
        if (f && d) { setSortField(f); setSortDirection(d) }
      }
    } catch { /* localStorage unavailable */ }
  }, [])

  function handleViewModeChange(mode: ExerciseViewMode) {
    setViewMode(mode)
    try { localStorage.setItem('exercise-view-mode', mode) } catch { /* ignore */ }
  }

  function handleSortChange(value: string) {
    const [field, direction] = value.split('-') as [ExerciseSortField, ExerciseSortDirection]
    setSortField(field)
    setSortDirection(direction)
    try { localStorage.setItem('exercise-sort', value) } catch { /* ignore */ }
  }

  function handleLoadMore() {
    fetchExercises(exercises.length, true)
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await deleteExercise(deleteTarget.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Übung gelöscht' })
      setExercises((prev) => prev.filter((e) => e.id !== deleteTarget.id))
      setTotal((prev) => prev - 1)
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const hasMore = exercises.length < total

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Deine persönliche Sammlung von Übungen und Spielen.</p>

      <ExerciseToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortValue={`${sortField}-${sortDirection}`}
        onSortValueChange={handleSortChange}
        customCategories={customCategories}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : loadFailed && exercises.length === 0 ? (
        <div className="space-y-3 py-12 text-center text-muted-foreground">
          <p>Deine Übungen ließen sich gerade nicht laden.</p>
          <Button variant="outline" onClick={() => fetchExercises(0, false)}>
            Erneut versuchen
          </Button>
        </div>
      ) : exercises.length === 0 ? (
        hasActiveFilters(filters) ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Keine Übungen gefunden, die zu deinen Filtern passen.</p>
          </div>
        ) : (
          <EmptyState libraryHasContent={libraryHasContent} />
        )
      ) : (
        <>
          {viewMode === 'list' ? (
            <ExerciseListView exercises={exercises} onRequestDelete={setDeleteTarget} />
          ) : (
            <ExerciseCardView exercises={exercises} onRequestDelete={setDeleteTarget} />
          )}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleLoadMore} disabled={loadingMore}>
                {loadingMore ? 'Wird geladen...' : 'Mehr laden'}
              </Button>
            </div>
          )}
        </>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Übung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{deleteTarget?.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
              <ExerciseUsageWarning exerciseId={deleteTarget?.id ?? null} active={!!deleteTarget} />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
