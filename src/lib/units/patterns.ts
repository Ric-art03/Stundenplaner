import { MIN_SEGMENT_MINUTES } from '@/lib/types/unit'
import type { SegmentConfig, SegmentFillMode } from '@/lib/types/unit'
import type { DifficultyLevel } from '@/lib/types/exercise'
import { createSegment, rescaleSegments, resolvePrimarySport, sumMinutes } from './timeline'

export const MAX_PATTERNS = 100
export const PATTERN_NAME_MAX = 60

/**
 * Ein Segment eines Stundenmusters. Anders als das Segment des Zeitverlaufs
 * trägt es keine Kennung, und die Sportarten dürfen fehlen.
 */
export interface PatternSegment {
  name: string
  minutes: number
  fillMode: SegmentFillMode
  difficulties: DifficultyLevel[]
  organizationForms: string[]
  notes: string
  /**
   * `null` = „wie die Gruppe": beim Anwenden kommen Sportarten und
   * Hauptsportart der gewählten Gruppe. Sonst gilt genau diese Auswahl — eine
   * bewusste Abweichung, die das Muster mitnimmt.
   */
  sports: string[] | null
  /** Nur von Bedeutung, wenn `sports` gesetzt ist. */
  primarySport: string | null
}

export interface UnitPattern {
  id: string
  name: string
  /** Die Gesamtdauer, bei der das Muster gespeichert wurde. */
  totalMinutes: number
  segments: PatternSegment[]
}

/** Was ein Muster von der Gruppe braucht, auf die es gesetzt wird. */
export interface PatternTarget {
  totalMinutes: number
  sports: string[]
  primarySport: string | null
}

export type ApplyPatternResult =
  | {
      ok: true
      segments: SegmentConfig[]
      /** Die ursprüngliche Dauer, wenn umgerechnet wurde; sonst `null`. */
      convertedFrom: number | null
    }
  | { ok: false; segmentCount: number; totalMinutes: number }

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((value) => set.has(value))
}

/**
 * Zeitverlauf → Segmente eines Musters. Trägt ein Segment genau die
 * Sportarten und die Hauptsportart der Gruppe, merkt sich das Muster nur
 * „wie die Gruppe" — sonst stünde „Volleyball" später auch im Kinderturnen.
 */
export function toPatternSegments(
  segments: SegmentConfig[],
  group: Pick<PatternTarget, 'sports' | 'primarySport'>
): PatternSegment[] {
  const groupPrimary = resolvePrimarySport(group.sports, group.primarySport)

  return segments.map((segment) => {
    const likeGroup =
      sameSet(segment.sports, group.sports) &&
      resolvePrimarySport(segment.sports, segment.primarySport) === groupPrimary

    return {
      name: segment.name,
      minutes: segment.minutes,
      fillMode: segment.fillMode,
      difficulties: [...segment.difficulties],
      organizationForms: [...segment.organizationForms],
      notes: segment.notes,
      sports: likeGroup ? null : [...segment.sports],
      primarySport: likeGroup ? null : resolvePrimarySport(segment.sports, segment.primarySport),
    }
  })
}

/**
 * Muster → Zeitverlauf für eine Gruppe. Passt die Dauer nicht, wird anteilig
 * umgerechnet. Hat das Muster mehr Segmente, als die Gruppe Minuten bietet,
 * lässt es sich nicht anwenden — jedes Segment braucht seine Mindestlänge.
 */
export function applyPattern(
  pattern: Pick<UnitPattern, 'segments'>,
  target: PatternTarget
): ApplyPatternResult {
  const count = pattern.segments.length
  if (count === 0 || count * MIN_SEGMENT_MINUTES > target.totalMinutes) {
    return { ok: false, segmentCount: count, totalMinutes: target.totalMinutes }
  }

  const segments = pattern.segments.map((segment) => {
    const sports = segment.sports ?? target.sports
    const primary = segment.sports ? segment.primarySport : target.primarySport
    return {
      ...createSegment(
        segment.name,
        segment.minutes,
        [...sports],
        [...segment.difficulties],
        primary,
        segment.fillMode
      ),
      organizationForms: [...segment.organizationForms],
      notes: segment.notes,
    }
  })

  const original = sumMinutes(segments)
  if (original === target.totalMinutes) return { ok: true, segments, convertedFrom: null }

  return {
    ok: true,
    segments: rescaleSegments(segments, target.totalMinutes),
    convertedFrom: original,
  }
}

/** Die Meldung, wenn ein Muster nicht in die Einheitsdauer der Gruppe passt. */
export function patternTooLongMessage(segmentCount: number, totalMinutes: number): string {
  if (segmentCount === 0) return 'Dieses Stundenmuster hat keine Phasen.'
  return (
    `Das Stundenmuster hat ${segmentCount} Phasen, die Einheit dieser Gruppe aber nur ` +
    `${totalMinutes} Minuten. Jede Phase braucht mindestens ${MIN_SEGMENT_MINUTES} Minute — ` +
    'verlängere die Einheitsdauer im Gruppenprofil oder nimm ein Muster mit weniger Phasen.'
  )
}

/** Kurzfassung des Aufbaus für Listen: „Aufwärmen 15 · Hauptteil 60 · Spiel 15 (frei)". */
export function summarizePattern(pattern: Pick<UnitPattern, 'segments'>): string {
  return pattern.segments
    .map(
      (segment) =>
        `${segment.name} ${segment.minutes}${segment.fillMode === 'empty' ? ' (frei)' : ''}`
    )
    .join(' · ')
}

/** Die Zeile in der Auswahlliste des Generators. */
export function patternOptionLabel(pattern: UnitPattern): string {
  const count = pattern.segments.length
  return `${pattern.name} · ${pattern.totalMinutes} Min · ${count} ${count === 1 ? 'Phase' : 'Phasen'}`
}

/** Namen gelten ohne Rücksicht auf Groß-/Kleinschreibung als gleich. */
export function findPatternByName(
  patterns: UnitPattern[],
  name: string,
  exceptId?: string
): UnitPattern | null {
  const wanted = name.trim().toLowerCase()
  return patterns.find((p) => p.id !== exceptId && p.name.trim().toLowerCase() === wanted) ?? null
}

/** Prüft nur die Form des Namens — ob er schon vergeben ist, entscheidet der Aufrufer. */
export function patternNameError(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed === '') return 'Bitte gib dem Stundenmuster einen Namen.'
  if (trimmed.length > PATTERN_NAME_MAX) return `Höchstens ${PATTERN_NAME_MAX} Zeichen.`
  return null
}

export function sortPatterns(patterns: UnitPattern[]): UnitPattern[] {
  return [...patterns].sort((a, b) => a.name.localeCompare(b.name, 'de', { sensitivity: 'base' }))
}
