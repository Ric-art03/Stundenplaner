import { createDraft, draftsEqual, type UnitDraft } from './draft'
import type { Unit } from '@/lib/types/unit'

/**
 * Der Verlauf der Bearbeitung: der Ausgangszustand, der aktuelle Stand und die
 * Kette der vorigen Stände.
 *
 * Daran hängen die drei Anzeigen der Änderungsleiste, ohne dass eine davon
 * eigens gerechnet wird — „3 offene Änderungen" ist die Länge der Kette,
 * „Rückgängig" ist aus, wenn die Kette leer ist, und gefragt wird beim
 * Verlassen, wenn sich der Stand vom Ausgangszustand unterscheidet.
 *
 * „Rückgängig" nimmt den vorigen Stand vom Stapel, statt die Operation
 * umzukehren: sonst müsste zu jeder der sieben Operationen eine Umkehrung
 * stimmen, also vierzehn Dinge statt sieben. Der Preis ist Speicher für ein paar
 * Dutzend Pläne — bei dieser Größe nicht messbar.
 */
export interface DraftHistory {
  /** Wie die Einheit beim Öffnen des Bearbeiten-Modus aussah. */
  baseline: UnitDraft
  present: UnitDraft
  /** Die vorigen Stände, der jüngste zuletzt. */
  past: UnitDraft[]
}

export function startHistory(unit: Unit): DraftHistory {
  const draft = createDraft(unit)
  return { baseline: draft, present: draft, past: [] }
}

/**
 * Eine Operation anwenden und den bisherigen Stand auf den Stapel legen.
 *
 * Eine Operation, die am Plan nichts verändert, landet nicht auf dem Stapel —
 * „nach oben" am ersten Platz, dieselbe Plandauer erneut eingetragen, die
 * bereits eingesetzte Übung noch einmal gewählt. Sonst würde ein folgenloser
 * Klick als offene Änderung gezählt und „Rückgängig" täte danach scheinbar
 * nichts.
 *
 * Verglichen wird der Inhalt, nicht die Kennung des Objekts: die Operationen
 * geben grundsätzlich einen neuen Stand zurück, auch wenn sie nichts geändert
 * haben.
 */
export function applyChange(
  history: DraftHistory,
  change: (draft: UnitDraft) => UnitDraft
): DraftHistory {
  const next = change(history.present)
  if (draftsEqual(next, history.present)) return history

  return {
    ...history,
    present: next,
    past: [...history.past, history.present],
  }
}

/** Einen Schritt zurück. Bei leerer Kette ein Nichts. */
export function undoChange(history: DraftHistory): DraftHistory {
  if (history.past.length === 0) return history

  const past = [...history.past]
  const previous = past.pop() as UnitDraft

  return { ...history, present: previous, past }
}

/** „Verwerfen": zurück auf den Ausgangszustand, Kette leeren. */
export function discardChanges(history: DraftHistory): DraftHistory {
  return { baseline: history.baseline, present: history.baseline, past: [] }
}

// Nach dem Speichern wird der Verlauf mit `startHistory` auf die neu geladene
// Einheit gesetzt: der gespeicherte Stand ist der neue Ausgangszustand, und die
// Kette beginnt leer — „Rückgängig" gilt laut Spec für die laufende Bearbeitung
// und nicht über das Speichern hinaus.

/** Unterscheidet sich der Stand vom Ausgangszustand? */
export function isDirty(history: DraftHistory): boolean {
  return !draftsEqual(history.baseline, history.present)
}

/**
 * Wie viele Änderungen der Nutzer vorgenommen hat. Bewusst die Länge der Kette
 * und nicht die Zahl der Unterschiede zum Ausgangszustand: der Nutzer hat so oft
 * etwas getan, und genau das zählt die Leiste mit.
 */
export function changeCount(history: DraftHistory): number {
  return history.past.length
}

export function canUndo(history: DraftHistory): boolean {
  return history.past.length > 0
}
