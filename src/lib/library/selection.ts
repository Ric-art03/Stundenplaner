import type { LibraryEntry } from '@/lib/types/library'

/**
 * Die Auswahl im Reiter „Übungsdatenbank" (PROJ-4). Übernommenes ist nie
 * auswählbar; vorausgewählt wird beim Wählen einer Gruppe, was der Generator
 * sofort einplanen würde. Danach springt die Auswahl nicht mehr von selbst um
 * (Edge Case 6) — auch nicht, wenn ein Filter Übungen ausblendet: Sie bleiben
 * ausgewählt, und die Leiste sagt, wie viele gerade nicht zu sehen sind
 * (vom Nutzer am 2026-10-18 so entschieden).
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

/**
 * Nimmt heraus, was in der Liste als übernommen steht (etwa aus einem anderen
 * Tab). Ausgeblendetes bleibt — darüber weiß die Liste nichts.
 */
export function dropCopied(selected: ReadonlySet<string>, entries: readonly LibraryEntry[]): Set<string> {
  const copied = new Set(entries.filter((e) => e.copiedExerciseId !== null).map((e) => e.exercise.id))
  return new Set([...selected].filter((id) => !copied.has(id)))
}

/** Wie viele Ausgewählte gerade nicht in der Liste stehen. */
export function hiddenCount(selected: ReadonlySet<string>, entries: readonly LibraryEntry[]): number {
  const visible = new Set(entries.map((e) => e.exercise.id))
  return [...selected].filter((id) => !visible.has(id)).length
}

/**
 * Was übernommen wird: die sichtbaren in Listenreihenfolge, danach die
 * ausgeblendeten in der Reihenfolge, in der sie ausgewählt wurden.
 */
export function selectionInOrder(selected: ReadonlySet<string>, entries: readonly LibraryEntry[]): string[] {
  const visible = entries.map((e) => e.exercise.id).filter((id) => selected.has(id))
  const shown = new Set(visible)
  return [...visible, ...[...selected].filter((id) => !shown.has(id))]
}
