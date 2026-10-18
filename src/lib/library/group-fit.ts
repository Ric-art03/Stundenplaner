import { buildCandidates, type Candidate, type CandidateSource } from '@/lib/units/candidates'
import {
  matchesAgeGroups,
  matchesSports,
  missingMaterials,
  participantsFit,
  type MissingMaterial,
} from '@/lib/units/generator'
import { isNoMaterial, isPredefinedTerm } from '@/lib/categories/terms'

/**
 * „Passt zu Gruppe" (PROJ-4): die Kriterienliste des Generators, befragt für
 * die ganze Gruppe statt für ein Segment. Sportart, Altersgruppe, Material und
 * Teilnehmerzahl hängen an der Gruppe; Phase, Schwierigkeit und
 * Organisationsform am Segment — sie fallen hier weg. Jede Grundform und jede
 * Variante ist ein eigener Kandidat, genau wie im Generator (BUG-20).
 *
 * Reine Rechnung ohne Datenbank, damit sie sich vollständig testen lässt.
 */

export interface FitGroup {
  sports: string[]
  ageGroups: string[]
  participants: number | null
  /** null = keine Halle → Material wird nicht geprüft (wie im Generator). */
  venueMaterials: { name: string; quantity: number }[] | null
  venueName: string | null
}

export type FitReason =
  | { kind: 'material'; venueName: string; missing: MissingMaterial[] }
  | { kind: 'participants'; min: number | null; max: number | null; participants: number }

export type ExerciseFit =
  /** `viaVariant`: die Grundform scheitert (oder passt nicht zu Sportart/Alter), diese Variante passt. */
  | { kind: 'fits'; viaVariant: string | null }
  /** `forVariant`: die Gründe gelten dieser Variante, weil nur sie zu Sportart und Alter passt. */
  | { kind: 'blocked'; reasons: FitReason[]; forVariant: string | null }

/** Alle Gründe, an denen dieser eine Kandidat für die Gruppe scheitert. */
function reasonsFor(candidate: Candidate, group: FitGroup): FitReason[] {
  const reasons: FitReason[] = []

  const missing = missingMaterials(candidate, group)
  if (missing.length > 0) {
    reasons.push({ kind: 'material', venueName: group.venueName ?? 'Die Halle', missing })
  }

  if (group.participants != null && !participantsFit(candidate, group.participants)) {
    reasons.push({
      kind: 'participants',
      min: candidate.participantsMin,
      max: candidate.participantsMax,
      participants: group.participants,
    })
  }

  return reasons
}

function matchesSportAndAge(candidate: Candidate, group: FitGroup): boolean {
  return matchesSports(candidate, group.sports) && matchesAgeGroups(candidate, group.ageGroups)
}

/**
 * Wie eine Übung zur Gruppe steht — `null`, wenn keine ihrer Formen zu
 * Sportart und Altersgruppe passt: dann steht sie gar nicht in der Liste.
 */
export function fitExercise(exercise: CandidateSource, group: FitGroup): ExerciseFit | null {
  const relevant = buildCandidates([exercise]).filter((c) => matchesSportAndAge(c, group))
  if (relevant.length === 0) return null

  // Die Grundform steht vorn — passt sie, ist keine Variante zu nennen.
  for (const candidate of relevant) {
    if (reasonsFor(candidate, group).length === 0) {
      return { kind: 'fits', viaVariant: candidate.variantTitle }
    }
  }

  const first = relevant[0]
  return { kind: 'blocked', reasons: reasonsFor(first, group), forVariant: first.variantTitle }
}

function needsParticipantCount(candidate: Candidate): boolean {
  return candidate.materials.some((m) => m.mode === 'pro Teilnehmer' && !isNoMaterial(m.name))
}

export interface GroupFitSummary {
  /** Nur die Übungen, die zu Sportart und Alter passen. */
  fits: Map<string, ExerciseFit>
  /** Was der Generator sofort einplanen würde und noch nicht übernommen ist. */
  preselected: string[]
  /** Material „pro Teilnehmer" kommt vor, die Gruppe hat aber keine Teilnehmerzahl. */
  participantsUnknown: boolean
  /** Es gibt Passendes, und alles davon ist schon übernommen. */
  allCopied: boolean
}

export function summarizeGroupFit(
  exercises: CandidateSource[],
  group: FitGroup,
  copiedIds: ReadonlySet<string>
): GroupFitSummary {
  const fits = new Map<string, ExerciseFit>()
  const preselected: string[] = []
  let participantsUnknown = false

  for (const exercise of exercises) {
    const fit = fitExercise(exercise, group)
    if (!fit) continue
    fits.set(exercise.id, fit)
    if (fit.kind === 'fits' && !copiedIds.has(exercise.id)) preselected.push(exercise.id)

    if (group.participants == null && !participantsUnknown) {
      participantsUnknown = buildCandidates([exercise])
        .filter((c) => matchesSportAndAge(c, group))
        .some(needsParticipantCount)
    }
  }

  const allCopied = fits.size > 0 && [...fits.keys()].every((id) => copiedIds.has(id))
  return { fits, preselected, participantsUnknown, allCopied }
}

// ---- Texte ----

function listing(values: string[]): string {
  if (values.length <= 1) return values.join('')
  return `${values.slice(0, -1).join(', ')} und ${values[values.length - 1]}`
}

function quoted(values: string[]): string {
  return listing(values.map((v) => `„${v}"`))
}

function describeMissing(m: MissingMaterial): string {
  return m.available === 0 ? m.name : `${m.name} (${m.needed} nötig, ${m.available} da)`
}

function describeParticipants(r: Extract<FitReason, { kind: 'participants' }>): string {
  const range =
    r.min != null && r.max != null
      ? r.min === r.max
        ? `für genau ${r.min} Teilnehmer`
        : `für ${r.min}–${r.max} Teilnehmer`
      : r.max != null
        ? `bis ${r.max} Teilnehmer`
        : `ab ${r.min} Teilnehmern`
  return `${range}, die Gruppe hat ${r.participants}`
}

export function describeFitReason(reason: FitReason): string {
  if (reason.kind === 'participants') return describeParticipants(reason)
  const verb = reason.missing.length === 1 ? 'fehlt' : 'fehlen'
  return `In „${reason.venueName}" ${verb}: ${reason.missing.map(describeMissing).join(', ')}`
}

/** Ein Satz je Übung, mit allen Gründen. */
export function describeFit(fit: ExerciseFit): string {
  if (fit.kind === 'fits') {
    return fit.viaVariant ? `Passt mit der Variante „${fit.viaVariant}"` : 'Passt zur Gruppe'
  }
  const text = fit.reasons.map(describeFitReason).join(' · ')
  return fit.forVariant ? `Variante „${fit.forVariant}": ${text}` : text
}

/**
 * Warum zu einer Gruppe keine Übung passt — jede Ursache, die beiträgt, statt
 * nur „nichts gefunden". `exercises` ist der ganze sichtbare Bestand, ohne Filter.
 */
export function explainEmptyGroupFit(exercises: CandidateSource[], group: FitGroup): string[] {
  const candidates = buildCandidates(exercises)
  const reasons: string[] = []

  if (group.sports.length === 0) {
    reasons.push('Die Gruppe hat keine Sportart — ohne sie passt keine Übung.')
  }

  const ownSports = group.sports.filter((s) => !isPredefinedTerm('sport', s))
  const sports = group.sports.filter((s) => isPredefinedTerm('sport', s))
  const sportHits = sports.filter((s) => candidates.some((c) => matchesSports(c, [s])))

  if (sports.length > 0 && sportHits.length === 0) {
    reasons.push(`Für ${quoted(sports)} gibt es in der Übungsdatenbank noch keine Übungen.`)
  }
  if (ownSports.length > 0) {
    reasons.push(
      `${ownSports.length === 1 ? 'Die Sportart' : 'Die Sportarten'} ${quoted(ownSports)} ${ownSports.length === 1 ? 'ist ein eigener Begriff' : 'sind eigene Begriffe'} — die Übungsdatenbank trägt nur die mitgelieferten.`
    )
  }

  const ownAges = group.ageGroups.filter((a) => !isPredefinedTerm('age_group', a))
  const ages = group.ageGroups.filter((a) => isPredefinedTerm('age_group', a))
  const ageHits = ages.filter((a) => candidates.some((c) => c.ageGroups.length > 0 && matchesAgeGroups(c, [a])))

  if (ages.length > 0 && ageHits.length === 0) {
    reasons.push(`Für ${quoted(ages)} gibt es in der Übungsdatenbank noch keine Übungen.`)
  }
  if (ownAges.length > 0) {
    reasons.push(
      `${ownAges.length === 1 ? 'Die Altersgruppe' : 'Die Altersgruppen'} ${quoted(ownAges)} ${ownAges.length === 1 ? 'ist ein eigener Begriff' : 'sind eigene Begriffe'} — die Übungsdatenbank trägt nur die mitgelieferten.`
    )
  }

  // Beides gibt es, nur nicht zusammen.
  const agesOk = group.ageGroups.length === 0 || ageHits.length > 0
  if (sportHits.length > 0 && agesOk && reasons.length === 0) {
    reasons.push(
      ageHits.length > 0
        ? `Es gibt Übungen für ${quoted(sportHits)} und für ${quoted(ageHits)}, aber noch keine für beides zusammen.`
        : `Es gibt Übungen für ${quoted(sportHits)}, aber keine passt zur Gruppe.`
    )
  }

  return reasons
}
