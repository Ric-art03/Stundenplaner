'use client'

import * as React from 'react'
import { ExerciseToolbar } from '@/components/exercises/exercise-toolbar'
import { ExerciseListView } from '@/components/exercises/exercise-list-view'
import { ExerciseCardView } from '@/components/exercises/exercise-card-view'
import { EmptyState } from '@/components/exercises/empty-state'
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
import { getExercises, deleteExercise, getCustomCategories } from '@/lib/actions/exercises'
import {
  type Exercise, type ExerciseFilters, type ExerciseViewMode,
  type ExerciseSortField, type ExerciseSortDirection,
  EMPTY_FILTERS,
} from '@/lib/types/exercise'

const PAGE_SIZE = 50

export default function ExercisesPage() {
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
  const [customCategories, setCustomCategories] = React.useState<Record<string, string[]>>({})

  React.useEffect(() => {
    getCustomCategories().then(setCustomCategories)
  }, [])

  const fetchExercises = React.useCallback(async (offset: number, append: boolean) => {
    if (append) setLoadingMore(true)
    else setLoading(true)
    try {
      const result = await getExercises(filters, sortField, sortDirection, offset, PAGE_SIZE)
      setExercises((prev) => append ? [...prev, ...result.exercises] : result.exercises)
      setTotal(result.total)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters, sortField, sortDirection])

  React.useEffect(() => {
    fetchExercises(0, false)
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

  function handleSortChange(field: ExerciseSortField, direction: ExerciseSortDirection) {
    setSortField(field)
    setSortDirection(direction)
    try { localStorage.setItem('exercise-sort', `${field}-${direction}`) } catch { /* ignore */ }
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
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Übungsdatenbank</h1>
        <p className="text-muted-foreground">Deine persönliche Sammlung von Übungen und Spielen.</p>
      </div>

      <ExerciseToolbar
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        customCategories={customCategories}
      />

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : exercises.length === 0 ? (
        filters.search || Object.values(filters).some((v) => Array.isArray(v) ? v.length > 0 : v !== null && v !== '') ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Keine Übungen gefunden, die zu deinen Filtern passen.</p>
          </div>
        ) : (
          <EmptyState />
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
