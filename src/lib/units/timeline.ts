import { CLASSIC_DISTRIBUTION, MIN_SEGMENT_MINUTES } from '@/lib/types/unit'
import type { SegmentConfig } from '@/lib/types/unit'
import type { DifficultyLevel } from '@/lib/types/exercise'

export function sumMinutes(segments: { minutes: number }[]): number {
  return segments.reduce((total, s) => total + s.minutes, 0)
}

/**
 * Verteilt eine Rundungsdifferenz auf das längste Segment, damit die Summe
 * exakt der Einheitsdauer entspricht. Ohne diese Regel würde sich eine
 * 60-Minuten-Einheit beim Ziehen schleichend auf 59 oder 61 Minuten verschieben.
 */
export function distributeRemainder(minutes: number[], total: number): number[] {
  if (minutes.length === 0) return minutes
  const result = [...minutes]
  let diff = total - sumArray(result)

  // Zuerst dem längsten Segment geben; reicht das nicht (weil es sonst unter
  // die Mindestdauer fiele), der Reihe nach bei den nächstlängsten weiter.
  while (diff !== 0) {
    const order = result
      .map((m, i) => ({ m, i }))
      .sort((a, b) => b.m - a.m)
      .map((e) => e.i)

    const target = diff > 0
      ? order[0]
      : order.find((i) => result[i] + diff >= MIN_SEGMENT_MINUTES) ?? order[0]

    const applied = diff > 0
      ? diff
      : Math.max(diff, MIN_SEGMENT_MINUTES - result[target])

    result[target] += applied
    diff -= applied

    if (applied === 0) break
  }

  return result
}

/** Prozentwerte der Anzeige zurück in ganze Minuten — Minuten sind die Wahrheit. */
export function layoutToMinutes(sizes: number[], total: number): number[] {
  const rounded = sizes.map((size) =>
    Math.max(MIN_SEGMENT_MINUTES, Math.round((size / 100) * total))
  )
  return distributeRemainder(rounded, total)
}

/** Minuten in Prozentwerte für die Anzeige. */
export function minutesToLayout(segments: { minutes: number }[], total: number): number[] {
  if (total <= 0) return segments.map(() => 0)
  return segments.map((s) => (s.minutes / total) * 100)
}

/** Kleinster erlaubter Panel-Anteil in Prozent (entspricht einer Minute). */
export function minPanelSize(total: number): number {
  if (total <= 0) return 0
  return (MIN_SEGMENT_MINUTES / total) * 100
}

function sumArray(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `segment-${idCounter}-${Math.random().toString(36).slice(2, 8)}`
}

export function createSegment(
  name: string,
  minutes: number,
  sports: string[],
  difficulties: DifficultyLevel[],
  fillMode: SegmentConfig['fillMode'] = 'generate'
): SegmentConfig {
  return { id: nextId(), name, minutes, fillMode, sports, difficulties, notes: '' }
}

/** Die klassische Verteilung 20 / 60 / 20 auf die Einheitsdauer umgerechnet. */
export function buildClassicSegments(
  total: number,
  sports: string[],
  difficulties: DifficultyLevel[]
): SegmentConfig[] {
  const raw = CLASSIC_DISTRIBUTION.map((phase) =>
    Math.max(MIN_SEGMENT_MINUTES, Math.round(phase.share * total))
  )
  const minutes = distributeRemainder(raw, total)

  return CLASSIC_DISTRIBUTION.map((phase, i) =>
    createSegment(phase.name, minutes[i], sports, difficulties)
  )
}

/**
 * Fügt ein Segment hinzu, indem dem längsten vorhandenen Segment Minuten
 * abgezogen werden. Die Gesamtdauer bleibt dadurch unverändert.
 */
export function addSegment(
  segments: SegmentConfig[],
  name: string,
  sports: string[],
  difficulties: DifficultyLevel[]
): SegmentConfig[] {
  const longestIndex = segments.reduce(
    (best, s, i) => (s.minutes > segments[best].minutes ? i : best),
    0
  )
  const donor = segments[longestIndex]
  const take = Math.floor(donor.minutes / 2)

  if (take < MIN_SEGMENT_MINUTES) return segments

  const updated = segments.map((s, i) =>
    i === longestIndex ? { ...s, minutes: s.minutes - take } : s
  )

  return [...updated, createSegment(name, take, sports, difficulties)]
}

/** Entfernt ein Segment und gibt dessen Minuten an das längste verbleibende. */
export function removeSegment(segments: SegmentConfig[], id: string): SegmentConfig[] {
  if (segments.length <= 1) return segments

  const removed = segments.find((s) => s.id === id)
  if (!removed) return segments

  const rest = segments.filter((s) => s.id !== id)
  const longestIndex = rest.reduce(
    (best, s, i) => (s.minutes > rest[best].minutes ? i : best),
    0
  )

  return rest.map((s, i) =>
    i === longestIndex ? { ...s, minutes: s.minutes + removed.minutes } : s
  )
}

/**
 * Setzt die Minuten eines Segments. Die Differenz wird anteilig auf die
 * übrigen Segmente verteilt, damit die Gesamtdauer exakt erhalten bleibt.
 */
export function setSegmentMinutes(
  segments: SegmentConfig[],
  id: string,
  minutes: number,
  total: number
): SegmentConfig[] {
  const index = segments.findIndex((s) => s.id === id)
  if (index === -1) return segments
  if (segments.length === 1) return [{ ...segments[0], minutes: total }]

  // Den übrigen Segmenten muss je mindestens eine Minute bleiben.
  const maxForThis = total - (segments.length - 1) * MIN_SEGMENT_MINUTES
  const target = Math.min(Math.max(minutes, MIN_SEGMENT_MINUTES), maxForThis)

  const others = segments.filter((s) => s.id !== id)
  const othersTotal = sumMinutes(others)
  const othersBudget = total - target

  const rawOthers = others.map((s) =>
    othersTotal > 0
      ? Math.max(MIN_SEGMENT_MINUTES, Math.round((s.minutes / othersTotal) * othersBudget))
      : MIN_SEGMENT_MINUTES
  )
  const adjustedOthers = distributeRemainder(rawOthers, othersBudget)

  let cursor = 0
  return segments.map((s, i) =>
    i === index ? { ...s, minutes: target } : { ...s, minutes: adjustedOthers[cursor++] }
  )
}

/**
 * Verschiebt ein Segment an eine neue Position. Die Minuten bleiben am
 * Segment, nur die Reihenfolge im Zeitverlauf ändert sich.
 */
export function reorderSegments(
  segments: SegmentConfig[],
  fromIndex: number,
  toIndex: number
): SegmentConfig[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= segments.length ||
    toIndex >= segments.length
  ) {
    return segments
  }

  const result = [...segments]
  const [moved] = result.splice(fromIndex, 1)
  result.splice(toIndex, 0, moved)
  return result
}

/** Passt bestehende Segmente an eine neue Einheitsdauer an (Gruppenwechsel). */
export function rescaleSegments(segments: SegmentConfig[], total: number): SegmentConfig[] {
  const current = sumMinutes(segments)
  if (current === total || current === 0) return segments

  const raw = segments.map((s) =>
    Math.max(MIN_SEGMENT_MINUTES, Math.round((s.minutes / current) * total))
  )
  const minutes = distributeRemainder(raw, total)

  return segments.map((s, i) => ({ ...s, minutes: minutes[i] }))
}
