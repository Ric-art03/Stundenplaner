import type { Exercise } from './exercise'
import type { ExerciseFit } from '@/lib/library/group-fit'

/**
 * Die Übungsdatenbank (PROJ-4): der gemeinsame, kuratierte Bestand. Eine Übung
 * daraus hat dieselbe Gestalt wie eine eigene — so zeigen Liste, Karten und
 * Detailansicht sie mit denselben Bausteinen. `exercise.id` ist die Kennung im
 * Bestand, nicht die einer Kopie.
 */
export interface LibraryEntry {
  exercise: Exercise
  /** Nur für die Vorschau-Konten des Blocks sichtbar, noch nicht freigegeben. */
  isDraft: boolean
  /** Zuerst freigegeben am — Grundlage von „Zuletzt hinzugefügt". */
  addedAt: string | null
  /** Die eigene Kopie, wenn der Nutzer die Übung übernommen hat. */
  copiedExerciseId: string | null
  /** Nur mit „Passt zu Gruppe". */
  fit?: ExerciseFit
}

export type LibrarySortField = 'addedAt' | 'name' | 'duration' | 'difficulty'
export type LibrarySortDirection = 'asc' | 'desc'

export const LIBRARY_SORT_OPTIONS: { value: `${LibrarySortField}-${LibrarySortDirection}`; label: string }[] = [
  { value: 'addedAt-desc', label: 'Zuletzt hinzugefügt' },
  { value: 'name-asc', label: 'Name (A–Z)' },
  { value: 'name-desc', label: 'Name (Z–A)' },
  { value: 'duration-asc', label: 'Dauer (kurz → lang)' },
  { value: 'duration-desc', label: 'Dauer (lang → kurz)' },
  { value: 'difficulty-asc', label: 'Schwierigkeit (leicht → schwer)' },
  { value: 'difficulty-desc', label: 'Schwierigkeit (schwer → leicht)' },
]

/** Die Gruppe, gegen die „Passt zu Gruppe" gerechnet hat — für die Hinweise oben. */
export interface LibraryGroupContext {
  id: string
  name: string
  /** Ohne Halle prüft der Generator kein Material. */
  noVenue: boolean
  /** Material „pro Teilnehmer" ist ohne Teilnehmerzahl nicht nachrechenbar. */
  participantsUnknown: boolean
}

export interface LibraryResult {
  /** false: die Übungsdatenbank ist (noch) nicht erreichbar — nicht dasselbe wie leer. */
  available: boolean
  /** Ob der Nutzer überhaupt etwas im Bestand sieht, unabhängig von den Filtern. */
  hasContent: boolean
  entries: LibraryEntry[]
  group: LibraryGroupContext | null
  /** Die Gruppe aus der Adresse gibt es nicht (mehr). */
  groupMissing: boolean
  /** Warum die Liste leer ist — jede Ursache, die beiträgt. Leer bei Treffern. */
  emptyReasons: string[]
}

export type CopyLibraryResult =
  | {
      copied: { libraryExerciseId: string; exerciseId: string; name: string }[]
      /** Inzwischen schon übernommen (anderer Tab) — übersprungen, kein Fehler. */
      alreadyCopied: { libraryExerciseId: string; exerciseId: string; name: string }[]
      /** Namen, die es in „Meine Übungen" jetzt mehr als einmal gibt. */
      duplicateNames: string[]
    }
  /** Nicht mehr im Bestand (zurückgezogen) — nichts wurde übernommen. */
  | { unavailable: { libraryExerciseId: string; name: string }[] }
  | { error: string }
