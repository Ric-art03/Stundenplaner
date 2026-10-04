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
  gapDetail: GapDetail | null
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

/**
 * Warum ein Segment leer blieb oder nicht voll wurde. Jede Ursache wird
 * **einzeln** gezählt, statt nur die erste zu melden: Der Nutzer soll sehen,
 * an welchen Kriterien es überall hängt, damit er gezielt nachbessern kann.
 */
export interface GapDetail {
  kind: 'no-phase' | 'all-filtered' | 'exhausted' | 'too-short'
  phase: string
  /** Kandidaten im gesamten Pool des Nutzers (Übungen plus Varianten). */
  totalCandidates: number
  /** Davon mit passendem Phasen-Tag. */
  phaseMatches: number
  /**
   * Je Kriterium, wie viele der Phasen-Treffer daran scheitern. Unabhängig
   * voneinander gezählt — eine Übung kann an mehreren Kriterien zugleich
   * scheitern und taucht dann mehrfach auf.
   */
  blockedBy: { criterion: GapCriterion; count: number }[]
  /** Waren die weichen Kriterien bei diesem Versuch bereits gelockert? */
  relaxed: boolean
  /** Nur bei 'exhausted' und 'too-short': Kandidaten, die alle Kriterien erfüllen. */
  usableCandidates?: number
  /** Nur bei 'too-short'. */
  remainingMinutes?: number
  shortestDuration?: number
  /** Nur bei 'participants' in blockedBy — für die Formulierung. */
  participants?: number | null
}

export type GapCriterion = 'age' | 'material' | 'participants' | 'sport' | 'difficulty'

/** Einzeilige Zusammenfassung; die Aufschlüsselung steckt in `GapDetail`. */
export function summarizeGap(detail: GapDetail): string {
  const phase = `„${detail.phase}"`
  const prefix = detail.relaxed ? 'Auch mit gelockerten Kriterien: ' : ''

  switch (detail.kind) {
    case 'no-phase':
      if (detail.totalCandidates === 0) {
        return `${prefix}Du hast noch keine Übungen angelegt, aus denen der Generator schöpfen könnte.`
      }
      if (detail.totalCandidates === 1) {
        return `${prefix}Deine einzige Übung ist der Phase ${phase} nicht zugeordnet.`
      }
      return `${prefix}Keine deiner ${detail.totalCandidates} Übungen ist der Phase ${phase} zugeordnet.`
    case 'all-filtered':
      return detail.phaseMatches === 1
        ? `${prefix}Eine Übung trägt die Phase ${phase}, erfüllt aber nicht alle übrigen Kriterien.`
        : `${prefix}${detail.phaseMatches} Übungen tragen die Phase ${phase}, aber keine erfüllt alle übrigen Kriterien.`
    case 'exhausted':
      return detail.usableCandidates === 1
        ? `${prefix}Die einzige passende Übung der Phase ${phase} ist in dieser Einheit schon eingeplant.`
        : `${prefix}Alle ${detail.usableCandidates} passenden Übungen der Phase ${phase} sind in dieser Einheit schon eingeplant.`
    case 'too-short':
      return `${prefix}Die restlichen ${detail.remainingMinutes} Minuten sind kürzer als die kürzeste noch passende Übung (${detail.shortestDuration} Minuten).`
  }
}

interface Criterion {
  criterion: GapCriterion
  passes: (candidate: Candidate) => boolean
}

function criteriaFor(
  segment: SegmentConfig,
  group: GeneratorGroup,
  relaxLevel: RelaxLevel
): Criterion[] {
  const checks: Criterion[] = [
    { criterion: 'age', passes: (c) => matchesAgeGroups(c, group.ageGroups) },
    { criterion: 'material', passes: (c) => materialsAvailable(c, group) },
    { criterion: 'participants', passes: (c) => participantsFit(c, group.participants) },
  ]

  // Weiche Kriterien — fallen beim Lockern stufenweise weg.
  if (relaxLevel < 2) {
    checks.push({ criterion: 'sport', passes: (c) => matchesSports(c, segment.sports) })
  }
  if (relaxLevel < 1) {
    checks.push({ criterion: 'difficulty', passes: (c) => matchesDifficulty(c, segment.difficulties) })
  }

  return checks
}

/**
 * Baut den Pool und — falls er leer bleibt — die vollständige Begründung.
 * Anders als eine Filterkette, die beim ersten leeren Zwischenstand abbricht,
 * wird jedes Kriterium unabhängig gegen die Phasen-Treffer gezählt. Nur so
 * erfährt der Nutzer alle Ursachen und nicht bloß die zuerst geprüfte.
 */
function buildPool(
  candidates: Candidate[],
  segment: SegmentConfig,
  group: GeneratorGroup,
  relaxLevel: RelaxLevel
): { pool: Candidate[]; detail: GapDetail | null } {
  const phaseMatches = candidates.filter((c) => matchesPhase(c, segment.name))
  const checks = criteriaFor(segment, group, relaxLevel)
  const pool = phaseMatches.filter((c) => checks.every((check) => check.passes(c)))

  if (pool.length > 0) return { pool, detail: null }

  return {
    pool: [],
    detail: {
      kind: phaseMatches.length === 0 ? 'no-phase' : 'all-filtered',
      phase: segment.name,
      totalCandidates: candidates.length,
      phaseMatches: phaseMatches.length,
      blockedBy: checks
        .map((check) => ({
          criterion: check.criterion,
          count: phaseMatches.filter((c) => !check.passes(c)).length,
        }))
        .filter((entry) => entry.count > 0),
      relaxed: relaxLevel > 0,
      participants: group.participants,
    },
  }
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
  gapDetail: GapDetail | null
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
  const { pool, detail } = buildPool(candidates, segment, group, relaxLevel)

  if (detail !== null) {
    return {
      items: [],
      gapReason: summarizeGap(detail),
      gapDetail: detail,
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
  let lastKind: 'exhausted' | 'too-short' = 'exhausted'
  let shortestLeft: number | undefined

  for (;;) {
    // Sobald sich das Budget durch Strecken füllen lässt, ist das Segment voll.
    if (chosen.length > 0 && budget <= hiTotal) break

    const drawnSport = drawSport()
    const available = pool.filter((candidate) => !used.has(candidate.exerciseId))

    if (available.length === 0) {
      lastKind = 'exhausted'
      break
    }

    const fitting = available.filter((candidate) => loTotal + lowerBound(candidate.duration) <= budget)
    if (fitting.length === 0) {
      lastKind = 'too-short'
      shortestLeft = Math.min(...available.map((candidate) => candidate.duration))
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
  let gapDetail: GapDetail | null = null

  if (filled < budget) {
    gapDetail = {
      kind: lastKind,
      phase: segment.name,
      totalCandidates: candidates.length,
      phaseMatches: candidates.filter((c) => matchesPhase(c, segment.name)).length,
      blockedBy: [],
      relaxed: relaxLevel > 0,
      usableCandidates: pool.length,
      remainingMinutes: budget - filled,
      shortestDuration: shortestLeft,
      participants: group.participants,
    }
    gapReason = summarizeGap(gapDetail)
  }

  return {
    items,
    gapReason,
    gapDetail,
    usedExerciseIds: chosen.map((candidate) => candidate.exerciseId),
  }
}

// ---- Einheit ----

function relaxLabel(level: RelaxLevel): string {
  return level === 1
    ? 'Schwierigkeitsgrad gelockert'
    : 'Schwierigkeitsgrad und Sportart-Vorgabe gelockert'
}

export interface SegmentPlanInput {
  segment: SegmentConfig
  /** Position im Zeitverlauf — geht in den abgeleiteten Startwert ein. */
  segmentIndex: number
  group: GeneratorGroup
  candidates: Candidate[]
  recentExerciseIds: Iterable<string>
  /** Übungen, die in anderen Segmenten derselben Einheit schon stehen. */
  blockedExerciseIds: Iterable<string>
  seed: number
  relax: boolean
}

export interface SegmentPlan {
  items: GeneratedItem[]
  gapReason: string | null
  gapDetail: GapDetail | null
  relaxLevel: RelaxLevel
  /** Satz für den Lockerungshinweis; null, wenn nichts gelockert wurde. */
  relaxNote: string | null
  usedExerciseIds: string[]
}

/**
 * Plant **ein** Segment. Sowohl das Generieren einer ganzen Einheit als auch
 * das nachträgliche Lockern eines einzelnen Segments laufen hierüber — damit
 * gelten in beiden Fällen dieselben Regeln.
 */
export function planSegment(input: SegmentPlanInput): SegmentPlan {
  const { segment } = input

  if (segment.fillMode === 'empty') {
    return {
      items: [],
      gapReason: null,
      gapDetail: null,
      relaxLevel: 0,
      relaxNote: null,
      usedExerciseIds: [],
    }
  }

  const recent = new Set(input.recentExerciseIds)
  const blocked = new Set(input.blockedExerciseIds)

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
      createRandom(input.seed + input.segmentIndex * 1013 + level * 7919)
    )

  const filledOf = (attempt: Attempt) => sum(attempt.items.map((item) => item.plannedDuration))

  const strict = attemptAt(0)
  let best = strict
  let bestLevel: RelaxLevel = 0
  // Der tiefste tatsächlich unternommene Versuch. Bringt Lockern nichts, ist
  // dessen Diagnose die ehrliche: Sie nennt nur noch die harten Kriterien,
  // die auch nach dem Freigeben von Sportart und Schwierigkeitsgrad bleiben.
  let deepest = strict

  if (input.relax) {
    for (const level of [1, 2] as RelaxLevel[]) {
      if (filledOf(best) >= segment.minutes) break
      const attempt = attemptAt(level)
      deepest = attempt
      // Eine höhere Stufe gilt nur, wenn sie die Lücke wirklich verkleinert.
      if (filledOf(attempt) > filledOf(best)) {
        best = attempt
        bestLevel = level
      }
    }
  }

  // Gefüllt wird mit der besten Auswahl, begründet wird mit dem tiefsten
  // Versuch — sonst stünde „auch mit gelockerten Kriterien" über einer Liste,
  // die genau die gelockerten Kriterien aufzählt.
  const report = bestLevel === 0 && input.relax ? deepest : best

  let relaxNote: string | null = null
  if (bestLevel > 0) {
    const added = best.items.length - strict.items.length
    const detail = added > 0 ? ` — ${added} ${added === 1 ? 'Übung' : 'Übungen'} ergänzt` : ''
    relaxNote = `„${segment.name}": ${relaxLabel(bestLevel)}${detail}.`
  } else if (input.relax && report.gapDetail) {
    // Auch ein erfolgloser Lockerungsversuch bekommt eine Begründung — sonst
    // klickt der Nutzer auf den Knopf und sieht nur, dass nichts passiert.
    relaxNote = `„${segment.name}": Lockern hat nichts gebracht, die Lücke bleibt.`
  }

  return {
    items: best.items,
    gapReason: report.gapReason,
    gapDetail: report.gapDetail,
    relaxLevel: bestLevel,
    relaxNote,
    usedExerciseIds: best.usedExerciseIds,
  }
}

export function generateUnitPlan(input: GeneratorInput): GeneratedUnit {
  const blocked = new Set<string>()
  const segments: GeneratedSegment[] = []
  const notes: string[] = []

  input.segments.forEach((segment, index) => {
    const plan = planSegment({
      segment,
      segmentIndex: index,
      group: input.group,
      candidates: input.candidates,
      recentExerciseIds: input.recentExerciseIds,
      blockedExerciseIds: blocked,
      seed: input.seed,
      relax: input.relax,
    })

    if (plan.relaxLevel > 0 && plan.relaxNote) notes.push(plan.relaxNote)
    for (const id of plan.usedExerciseIds) blocked.add(id)

    segments.push({
      segment,
      position: index,
      items: plan.items,
      gapReason: plan.gapReason,
      gapDetail: plan.gapDetail,
      relaxLevel: plan.relaxLevel,
    })
  })

  return {
    segments,
    relaxedNote: notes.length > 0 ? notes.join(' ') : null,
  }
}
