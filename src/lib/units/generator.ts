import { MIN_SEGMENT_MINUTES } from '@/lib/types/unit'
import type { SegmentConfig } from '@/lib/types/unit'
import type { Candidate } from './candidates'

/**
 * Der Auswahlalgorithmus als reine Logik: keine Datenbank, keine Systemzeit,
 * keine eigene Zufallsquelle. Alles kommt als Eingabe herein, damit sich die
 * Auswahlregeln vollständig und schnell testen lassen — und damit ein
 * Fehlerbericht über den gespeicherten Startwert exakt nachstellbar ist.
 */

/** Die Plandauer darf höchstens um ein Viertel von der Schätzung abweichen. */
export const DURATION_TOLERANCE = 0.25

const NO_MATERIAL = 'kein material'

export interface GeneratorGroup {
  ageGroups: string[]
  participants: number | null
  /** null = der Gruppe ist keine Halle zugewiesen → Material wird nicht geprüft. */
  venueMaterials: { name: string; quantity: number }[] | null
}

export interface GeneratorInput {
  group: GeneratorGroup
  segments: SegmentConfig[]
  candidates: Candidate[]
  /** Übungen der letzten zwei Einheiten dieser Gruppe — nachrangig, nicht ausgeschlossen. */
  recentExerciseIds: string[]
  seed: number
  /** Nur auf aktiven Klick des Nutzers: weiche Kriterien dürfen stufenweise fallen. */
  relax: boolean
}

export interface GeneratedItem {
  exerciseId: string
  variantId: string | null
  plannedDuration: number
  position: number
}

/** 0 = streng, 1 = Schwierigkeitsgrad frei, 2 = zusätzlich Sportart frei. */
export type RelaxLevel = 0 | 1 | 2

export interface GeneratedSegment {
  segment: SegmentConfig
  position: number
  items: GeneratedItem[]
  gapReason: string | null
  relaxLevel: RelaxLevel
}

export interface GeneratedUnit {
  segments: GeneratedSegment[]
  relaxedNote: string | null
}

// ---- Zufall ----

/**
 * Startwert herein, Ergebnis heraus: gleicher Startwert, gleiches Ergebnis.
 * (mulberry32 — klein, schnell, gut genug für eine Übungsauswahl.)
 */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = result[i]
    result[i] = result[j]
    result[j] = swap
  }
  return result
}

// ---- Harte Kriterien ----

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

function matchesPhase(candidate: Candidate, segmentName: string): boolean {
  const wanted = normalize(segmentName)
  return candidate.phases.some((phase) => normalize(phase) === wanted)
}

/**
 * Ein passender Wert genügt (OR innerhalb der Kategorie). Trägt die Übung
 * gar keine Altersgruppe, entfällt das Kriterium statt die Übung auszuschließen
 * — unbekannt ist kein Widerspruch.
 */
export function matchesAgeGroups(candidate: Candidate, groupAgeGroups: string[]): boolean {
  if (groupAgeGroups.length === 0 || candidate.ageGroups.length === 0) return true
  const wanted = groupAgeGroups.map(normalize)
  return candidate.ageGroups.some((age) => wanted.includes(normalize(age)))
}

function matchesSports(candidate: Candidate, segmentSports: string[]): boolean {
  const wanted = segmentSports.map(normalize)
  return candidate.sports.some((sport) => wanted.includes(normalize(sport)))
}

function matchesDifficulty(candidate: Candidate, difficulties: string[]): boolean {
  return difficulties.some((level) => normalize(level) === normalize(candidate.difficulty))
}

/**
 * Pro Übung geprüft, nicht kumulativ über das Segment: Übungen laufen
 * nacheinander und konkurrieren nicht um dasselbe Material.
 */
export function materialsAvailable(candidate: Candidate, group: GeneratorGroup): boolean {
  if (group.venueMaterials === null) return true

  for (const material of candidate.materials) {
    if (normalize(material.name) === NO_MATERIAL) continue

    let needed = material.quantity
    if (material.mode === 'pro Teilnehmer') {
      // Ohne Teilnehmerzahl ist „pro Teilnehmer" nicht nachrechenbar.
      if (group.participants == null) continue
      needed = material.quantity * group.participants
    }

    const stock = group.venueMaterials.find(
      (entry) => normalize(entry.name) === normalize(material.name)
    )
    if ((stock?.quantity ?? 0) < needed) return false
  }

  return true
}

export function participantsFit(candidate: Candidate, participants: number | null): boolean {
  // Widersprüchlicher Datensatz (Min > Max): fällt aus dem Pool, statt den
  // Generator abzubrechen.
  if (
    candidate.participantsMin != null &&
    candidate.participantsMax != null &&
    candidate.participantsMin > candidate.participantsMax
  ) {
    return false
  }

  if (participants == null) return true
  if (candidate.participantsMax != null && candidate.participantsMax < participants) return false
  if (candidate.participantsMin != null && candidate.participantsMin > participants) return false
  return true
}

// ---- Pool und Lückengründe ----

type GapCause =
  | 'phase'
  | 'age'
  | 'material'
  | 'participants'
  | 'sport'
  | 'difficulty'
  | 'exhausted'
  | 'duration'

function describeGap(
  cause: GapCause,
  segment: SegmentConfig,
  group: GeneratorGroup,
  detail: { poolSize?: number; remaining?: number; shortest?: number }
): string {
  const phase = `„${segment.name}"`

  switch (cause) {
    case 'phase':
      return `Es gibt noch keine Übung, die der Phase ${phase} zugeordnet ist.`
    case 'age':
      return `Keine Übung der Phase ${phase} passt zu den Altersgruppen deiner Gruppe.`
    case 'material':
      return `Für keine Übung der Phase ${phase} reicht das Material in deiner Halle.`
    case 'participants':
      return `Keine Übung der Phase ${phase} ist für ${group.participants} Teilnehmer ausgelegt.`
    case 'sport':
      return `Keine Übung der Phase ${phase} ist mit einer der gewählten Sportarten getaggt.`
    case 'difficulty':
      return `Keine Übung der Phase ${phase} hat einen der gewählten Schwierigkeitsgrade.`
    case 'exhausted':
      return detail.poolSize === 1
        ? `Die einzige passende Übung der Phase ${phase} ist in dieser Einheit schon eingeplant.`
        : `Alle ${detail.poolSize} passenden Übungen der Phase ${phase} sind in dieser Einheit schon eingeplant.`
    case 'duration':
      return `Die restlichen ${detail.remaining} Minuten sind kürzer als die kürzeste noch passende Übung (${detail.shortest} Minuten).`
  }
}

/**
 * Filtert den Pool in fester Reihenfolge und merkt sich, welche Stufe ihn
 * geleert hat. Die harten Kriterien stehen vorn, damit der Grund zuerst das
 * nennt, woran Lockern nichts ändern würde.
 */
function buildPool(
  candidates: Candidate[],
  segment: SegmentConfig,
  group: GeneratorGroup,
  relaxLevel: RelaxLevel
): { pool: Candidate[]; cause: GapCause | null } {
  const stages: { cause: GapCause; keep: (candidate: Candidate) => boolean }[] = [
    { cause: 'phase', keep: (c) => matchesPhase(c, segment.name) },
    { cause: 'age', keep: (c) => matchesAgeGroups(c, group.ageGroups) },
    { cause: 'material', keep: (c) => materialsAvailable(c, group) },
    { cause: 'participants', keep: (c) => participantsFit(c, group.participants) },
  ]

  // Weiche Kriterien — fallen beim Lockern stufenweise weg.
  if (relaxLevel < 2) {
    stages.push({ cause: 'sport', keep: (c) => matchesSports(c, segment.sports) })
  }
  if (relaxLevel < 1) {
    stages.push({ cause: 'difficulty', keep: (c) => matchesDifficulty(c, segment.difficulties) })
  }

  let pool = candidates
  for (const stage of stages) {
    const next = pool.filter(stage.keep)
    if (next.length === 0) return { pool: [], cause: stage.cause }
    pool = next
  }

  return { pool, cause: null }
}

// ---- Dauer-Anpassung ----

function lowerBound(duration: number): number {
  return Math.max(MIN_SEGMENT_MINUTES, Math.ceil(duration * (1 - DURATION_TOLERANCE)))
}

function upperBound(duration: number): number {
  return Math.max(lowerBound(duration), Math.floor(duration * (1 + DURATION_TOLERANCE)))
}

/**
 * Verteilt die Restdifferenz auf die gewählten Übungen — minutenweise und
 * immer dort, wo noch der größte Spielraum ist. Keine Übung weicht dabei um
 * mehr als ein Viertel von ihrer Schätzung ab.
 */
export function planDurations(durations: number[], budget: number): number[] {
  if (durations.length === 0) return []

  const lo = durations.map(lowerBound)
  const hi = durations.map(upperBound)
  const planned = durations.map((duration, i) => Math.min(Math.max(duration, lo[i]), hi[i]))

  const target = Math.min(Math.max(budget, sum(lo)), sum(hi))
  let diff = target - sum(planned)

  while (diff !== 0) {
    const step = diff > 0 ? 1 : -1
    const roomOf = (i: number) => (step > 0 ? hi[i] - planned[i] : planned[i] - lo[i])

    let best = -1
    for (let i = 0; i < planned.length; i += 1) {
      if (roomOf(i) <= 0) continue
      if (best === -1 || roomOf(i) > roomOf(best)) best = i
    }
    if (best === -1) break

    planned[best] += step
    diff -= step
  }

  return planned
}

// ---- Auswahl innerhalb eines Segments ----

interface Attempt {
  items: GeneratedItem[]
  gapReason: string | null
  usedExerciseIds: string[]
}

function fillSegment(
  segment: SegmentConfig,
  group: GeneratorGroup,
  candidates: Candidate[],
  recentExerciseIds: Set<string>,
  blockedExerciseIds: Set<string>,
  relaxLevel: RelaxLevel,
  random: () => number
): Attempt {
  const budget = segment.minutes
  const { pool, cause } = buildPool(candidates, segment, group, relaxLevel)

  if (cause !== null) {
    return {
      items: [],
      gapReason: describeGap(cause, segment, group, {}),
      usedExerciseIds: [],
    }
  }

  // Die gemischte Grundreihenfolge entscheidet dort, wo sonst alles gleich ist.
  const shuffled = shuffle(pool, random)
  const baseRank = new Map(shuffled.map((candidate, index) => [candidate, index]))

  // Die Hauptsportart erscheint zweimal im Zyklus, jede andere einmal — also
  // etwa jede zweite Übung aus ihr, ohne dass die übrigen verschwinden.
  const cycleSource = [...segment.sports]
  if (segment.primarySport && segment.sports.length >= 2) {
    cycleSource.push(segment.primarySport)
  }

  let cycle: string[] = []
  let cycleIndex = 0
  let lastDrawn: string | null = null
  const drawSport = (): string | null => {
    if (cycleSource.length === 0) return null
    if (cycleIndex >= cycle.length) {
      cycle = shuffle(cycleSource, random)
      cycleIndex = 0
      // Ein neuer Zyklus soll nicht mit derselben Sportart beginnen, mit der
      // der vorige endete — bei zwei Sportarten und drei Slots ergibt das
      // A, B, A statt A, B, B.
      if (lastDrawn !== null && cycle[0] === lastDrawn) {
        const other = cycle.findIndex((sport) => sport !== lastDrawn)
        if (other > 0) {
          cycle[0] = cycle[other]
          cycle[other] = lastDrawn
        }
      }
    }
    lastDrawn = cycle[cycleIndex]
    cycleIndex += 1
    return lastDrawn
  }

  const used = new Set(blockedExerciseIds)
  const chosen: Candidate[] = []
  let loTotal = 0
  let hiTotal = 0
  let lastCause: GapCause = 'exhausted'
  let lastDetail: { remaining?: number; shortest?: number } = {}

  for (;;) {
    // Sobald sich das Budget durch Strecken füllen lässt, ist das Segment voll.
    if (chosen.length > 0 && budget <= hiTotal) break

    const drawnSport = drawSport()
    const available = pool.filter((candidate) => !used.has(candidate.exerciseId))

    if (available.length === 0) {
      lastCause = 'exhausted'
      break
    }

    const fitting = available.filter((candidate) => loTotal + lowerBound(candidate.duration) <= budget)
    if (fitting.length === 0) {
      lastCause = 'duration'
      lastDetail = {
        remaining: budget - sum(chosen.map((c) => c.duration)),
        shortest: Math.min(...available.map((candidate) => candidate.duration)),
      }
      break
    }

    // Frische zuerst: kürzlich verwendete Übungen stehen hinten und kommen nur
    // dran, wenn sonst nichts übrig ist. Innerhalb gleicher Frische ordnet die
    // gezogene Sportart, danach die gemischte Grundreihenfolge.
    const next = fitting.reduce((best, candidate) => {
      const key = (c: Candidate): [number, number, number] => [
        recentExerciseIds.has(c.exerciseId) ? 1 : 0,
        drawnSport && c.sports.some((s) => normalize(s) === normalize(drawnSport)) ? 0 : 1,
        baseRank.get(c) ?? 0,
      ]
      const a = key(candidate)
      const b = key(best)
      for (let i = 0; i < a.length; i += 1) {
        if (a[i] !== b[i]) return a[i] < b[i] ? candidate : best
      }
      return best
    })

    chosen.push(next)
    used.add(next.exerciseId)
    loTotal += lowerBound(next.duration)
    hiTotal += upperBound(next.duration)
  }

  const planned = planDurations(chosen.map((candidate) => candidate.duration), budget)
  const filled = sum(planned)

  const items: GeneratedItem[] = chosen.map((candidate, index) => ({
    exerciseId: candidate.exerciseId,
    variantId: candidate.variantId,
    plannedDuration: planned[index],
    position: index,
  }))

  let gapReason: string | null = null
  if (filled < budget) {
    gapReason = describeGap(lastCause, segment, group, {
      poolSize: pool.length,
      remaining: lastDetail.remaining ?? budget - filled,
      shortest: lastDetail.shortest,
    })
  }

  return {
    items,
    gapReason,
    usedExerciseIds: chosen.map((candidate) => candidate.exerciseId),
  }
}

// ---- Einheit ----

function relaxLabel(level: RelaxLevel): string {
  return level === 1
    ? 'Schwierigkeitsgrad gelockert'
    : 'Schwierigkeitsgrad und Sportart-Vorgabe gelockert'
}

export function generateUnitPlan(input: GeneratorInput): GeneratedUnit {
  const recent = new Set(input.recentExerciseIds)
  const blocked = new Set<string>()
  const segments: GeneratedSegment[] = []
  const notes: string[] = []

  input.segments.forEach((segment, index) => {
    if (segment.fillMode === 'empty') {
      segments.push({ segment, position: index, items: [], gapReason: null, relaxLevel: 0 })
      return
    }

    const attemptAt = (level: RelaxLevel) =>
      fillSegment(
        segment,
        input.group,
        input.candidates,
        recent,
        blocked,
        level,
        // Eigener Startwert je Segment und Stufe: ein zweiter Versuch
        // verschiebt damit nicht die Auswahl der folgenden Segmente.
        createRandom(input.seed + index * 1013 + level * 7919)
      )

    const strict = attemptAt(0)
    let best = strict
    let bestLevel: RelaxLevel = 0

    if (input.relax) {
      const filledOf = (attempt: Attempt) =>
        sum(attempt.items.map((item) => item.plannedDuration))

      for (const level of [1, 2] as RelaxLevel[]) {
        if (filledOf(best) >= segment.minutes) break
        const attempt = attemptAt(level)
        // Eine höhere Stufe gilt nur, wenn sie die Lücke wirklich verkleinert.
        if (filledOf(attempt) > filledOf(best)) {
          best = attempt
          bestLevel = level
        }
      }
    }

    if (bestLevel > 0) {
      const added = best.items.length - strict.items.length
      const detail =
        added > 0 ? ` — ${added} ${added === 1 ? 'Übung' : 'Übungen'} ergänzt` : ''
      notes.push(`„${segment.name}": ${relaxLabel(bestLevel)}${detail}.`)
    }

    for (const id of best.usedExerciseIds) blocked.add(id)

    segments.push({
      segment,
      position: index,
      items: best.items,
      gapReason: best.gapReason,
      relaxLevel: bestLevel,
    })
  })

  return {
    segments,
    relaxedNote: notes.length > 0 ? notes.join(' ') : null,
  }
}
