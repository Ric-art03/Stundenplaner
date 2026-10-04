import { DIFFICULTY_LEVELS, PHASES } from './exercise'
import type { GapDetail } from '@/lib/units/generator'
import type { DifficultyLevel, ExerciseMaterial } from './exercise'

export { DIFFICULTY_LEVELS, PHASES }

export type SegmentFillMode = 'generate' | 'empty'

/**
 * „Standard" = volle Dauer, klassische 20/60/20-Verteilung, keine Lücken.
 * „Individuell" = Zeitverlauf-Editor, alles frei bearbeitbar.
 */
export type UnitMode = 'standard' | 'custom'

/** Anteile der klassischen Phasenverteilung (20 / 60 / 20). */
export const CLASSIC_DISTRIBUTION = [
  { name: 'Aufwärmen', share: 0.2 },
  { name: 'Hauptteil', share: 0.6 },
  { name: 'Cool-Down', share: 0.2 },
] as const

export const MIN_SEGMENT_MINUTES = 1

/** Ein Segment auf der Konfigurationsseite, bevor generiert wurde. */
export interface SegmentConfig {
  id: string
  name: string
  minutes: number
  fillMode: SegmentFillMode
  sports: string[]
  /**
   * Wird in diesem Segment doppelt gewichtet. Vorbelegt mit der Hauptsportart
   * der Gruppe, pro Segment aber frei änderbar. Muss eine der Sportarten aus
   * `sports` sein; bei nur einer gewählten Sportart ohne Bedeutung.
   */
  primarySport: string | null
  difficulties: DifficultyLevel[]
  /** Freie Notiz, vor allem für Segmente die der Nutzer selbst füllt. */
  notes: string
}

/**
 * Der reine Bedienstand der Konfigurationsseite. Wird an der Einheit
 * mitgespeichert, damit „Zurück zum Generator" die Maske genau so öffnet, wie
 * der Nutzer sie verlassen hat.
 */
export interface EditorState {
  mode: UnitMode
  /** Position des Segments, dessen Einstellbereich offen war. */
  expandedPosition: number | null
}

export interface UnitConfig {
  groupId: string
  totalMinutes: number
  segments: SegmentConfig[]
  editorState: EditorState
}

/** Die Übung hinter einem Einheiten-Eintrag, inklusive Variantenauflösung. */
export interface UnitItemExercise {
  id: string
  name: string
  description: string
  estimatedDuration: number
  sports: string[]
  difficulty: DifficultyLevel
  organizationForms: string[]
  materials: ExerciseMaterial[]
  musicRequired: boolean
  musicLink: string | null
  variantCount: number
  variantTitle: string | null
}

export interface UnitItem {
  id: string
  exerciseId: string | null
  variantId: string | null
  plannedDuration: number
  position: number
  /** null, wenn die Übung nachträglich gelöscht wurde */
  exercise: UnitItemExercise | null
}

export interface UnitSegment {
  id: string
  name: string
  minutes: number
  fillMode: SegmentFillMode
  sports: string[]
  primarySport: string | null
  difficulties: DifficultyLevel[]
  notes: string
  gapReason: string | null
  /** Aufschlüsselung aller Ursachen, damit der Nutzer gezielt nachbessern kann. */
  gapDetail: GapDetail | null
  position: number
  items: UnitItem[]
}

export interface Unit {
  id: string
  userId: string
  groupId: string
  groupName: string
  name: string
  totalMinutes: number
  seed: number
  manuallyEdited: boolean
  /**
   * Eine frisch generierte Einheit ist zunächst nur ein Entwurf. Erst
   * „Einheit speichern" nimmt sie in die Übersichten auf.
   */
  saved: boolean
  /** Bedienstand der Konfigurationsseite, für „Zurück zum Generator". */
  editorState: EditorState
  /** Hinweis, welche Kriterien auf Wunsch gelockert wurden; null wenn nicht gelockert. */
  relaxedNote: string | null
  segments: UnitSegment[]
  createdAt: string
  updatedAt: string
}

/** Kompakte Darstellung für Listen (Gruppen-Detailseite, Einheitenübersicht). */
export interface UnitSummary {
  id: string
  name: string
  groupId: string
  groupName: string
  totalMinutes: number
  exerciseCount: number
  createdAt: string
}
