import type { LibraryEntry } from '@/lib/types/library'

/**
 * Die Auswahl im Reiter „Übungsdatenbank" (PROJ-4). Übernommenes ist nie
 * auswählbar; vorausgewählt wird beim Wählen einer Gruppe, was der Generator
 * sofort einplanen würde. Danach springt die Auswahl nicht mehr von selbst um
 * (Edge Case 6) — sie schrumpft nur auf das, was noch in der Liste steht, damit
 * nie etwas Unsichtbares mit übernommen wird.
 */

export function preselectedIds(entries: readonly LibraryEntry[]): Set<string> {
  return new Set(
    entries
      .filter((e) => e.fit?.kind === 'fits' && e.copiedExerciseId === null)
      .map((e) => e.exercise.id)
  )
}

export function selectableIds(entries: readonly LibraryEntry[]): Set<string> {
  return new Set(entries.filter((e) => e.copiedExerciseId === null).map((e) => e.exercise.id))
}

export function pruneSelection(selected: ReadonlySet<string>, entries: readonly LibraryEntry[]): Set<string> {
  const selectable = selectableIds(entries)
  return new Set([...selected].filter((id) => selectable.has(id)))
}

/** In Listenreihenfolge, damit die Kopien in derselben Folge entstehen. */
export function selectionInOrder(selected: ReadonlySet<string>, entries: readonly LibraryEntry[]): string[] {
  return entries.map((e) => e.exercise.id).filter((id) => selected.has(id))
}
