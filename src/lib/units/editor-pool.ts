import {
  buildCandidates,
  candidateKey,
  type Candidate,
  type CandidateSource,
} from './candidates'
import {
  failedCriteriaOf,
  type CandidateCriterion,
  type GeneratorGroup,
} from './generator'
import type { DrawExclusions, DraftPlacement } from './draft'
import type { SegmentConfig } from '@/lib/types/unit'

/**
 * Die Kandidatenliste eines Segments, wie der Editor sie braucht — die
 * „schlanke Fassung" aus dem Entwurf.
 *
 * Sie wird beim ersten Auswürfeln oder Öffnen des Auswahldialogs **einmal je
 * Segment** geladen und für die Dauer des Bearbeiten-Modus behalten. Danach
 * laufen Würfeln, Auswahl und Variantenwechsel ohne Server.
 *
 * Was die Liste **nicht** trägt: Beschreibung, Bilder, Links, Notizen. Die
 * Eintragskarte zeigt sie nicht an, und sie wären der größte Teil der Daten.
 */
export interface EditorCandidate extends Candidate {
  musicRequired: boolean
  musicLink: string | null
  /** Varianten der Hauptübung — für „2 Varianten verfügbar" auf der Karte. */
  variantCount: number
  /**
   * Leer = erfüllt alle Kriterien dieses Segments. Sonst die Kriterien, an denen
   * der Kandidat scheitert. Ausgerechnet hat das der Server aus derselben
   * Kriterienliste, die der Generator benutzt — der Browser bekommt das
   * Ergebnis, nicht die Regeln.
   */
  failedCriteria: CandidateCriterion[]
  /** Markierung „noch zu ergänzen" aus dem Schnell-Anlegen. */
  needsCompletion: boolean
}

/** Kurze Beschriftung je Kriterium, für die Begründung am einzelnen Kandidaten.
 *
 * Bewusst andere Texte als im Lückenhinweis: dort stehen sie in einem Satz
 * („erfüllt nicht das Material in deiner Halle"), hier als Merkmal an einer
 * Zeile. Dieselben Wörter würden an einer der beiden Stellen falsch klingen. */
export const CRITERION_LABELS: Record<CandidateCriterion, string> = {
  phase: 'Phase',
  age: 'Altersgruppe',
  material: 'Material',
  participants: 'Teilnehmerzahl',
  sport: 'Sportart',
  difficulty: 'Schwierigkeit',
}

export function passes(candidate: EditorCandidate): boolean {
  return candidate.failedCriteria.length === 0
}

/** „passt nicht: Material, Altersgruppe" */
export function failureLabel(candidate: EditorCandidate): string {
  return candidate.failedCriteria.map((criterion) => CRITERION_LABELS[criterion]).join(', ')
}

export function keyOf(candidate: EditorCandidate): string {
  return candidateKey(candidate.exerciseId, candidate.variantId)
}

/** Die Übung in der Form, in der sie in einen Platz gesetzt wird. */
export function placementFrom(candidate: EditorCandidate): DraftPlacement {
  return {
    exerciseId: candidate.exerciseId,
    variantId: candidate.variantId,
    exercise: {
      id: candidate.exerciseId,
      name: candidate.name,
      estimatedDuration: candidate.duration,
      sports: candidate.sports,
      difficulty: candidate.difficulty,
      organizationForms: candidate.organizationForms,
      materials: candidate.materials.map((material) => ({
        name: material.name,
        quantity: material.quantity,
        mode: material.mode,
      })),
      musicRequired: candidate.musicRequired,
      musicLink: candidate.musicLink,
      variantCount: candidate.variantCount,
      variantTitle: candidate.variantTitle,
    },
  }
}

/**
 * Was an diesem Platz noch gezogen werden darf: passend, nicht schon in der
 * Einheit, an diesem Platz noch nicht weggewürfelt.
 */
export function drawablePool(
  pool: EditorCandidate[],
  exclusions: DrawExclusions
): EditorCandidate[] {
  return pool.filter(
    (candidate) =>
      passes(candidate) &&
      !exclusions.exerciseIds.has(candidate.exerciseId) &&
      !exclusions.keys.has(keyOf(candidate))
  )
}

/**
 * Eine Übung auswürfeln, oder `null`, wenn der Vorrat erschöpft ist. Dann
 * erscheint die Aufschlüsselung der Ursachen, die der Generator schon
 * formuliert — es gibt hier keinen zweiten Satz von Meldungen.
 *
 * Gleichverteilt gezogen, ohne die Gewichtung des Generators: „diese Gruppe
 * hatte das letzte Woche schon" gehört laut Spec zu PROJ-10, das die Regel für
 * Generator und Editor gemeinsam setzen soll.
 */
export function drawCandidate(
  pool: EditorCandidate[],
  exclusions: DrawExclusions,
  random: () => number = Math.random
): EditorCandidate | null {
  const drawable = drawablePool(pool, exclusions)
  if (drawable.length === 0) return null

  const index = Math.min(drawable.length - 1, Math.floor(random() * drawable.length))
  return drawable[index]
}

/**
 * Hauptübung und alle Varianten einer Übung, für das Umschalten. Kommt aus
 * derselben geladenen Liste — Varianten sind darin eigene Kandidaten, es gibt
 * also keinen zweiten Ladeweg.
 *
 * Eignung spielt hier keine Rolle: wer bewusst auf eine Variante umschaltet,
 * entscheidet das selbst, so wie bei der eigenen Auswahl.
 */
export function variantsOf(pool: EditorCandidate[], exerciseId: string): EditorCandidate[] {
  return pool
    .filter((candidate) => candidate.exerciseId === exerciseId)
    .sort((a, b) => {
      // Die Hauptübung zuerst, danach die Varianten in ihrer Reihenfolge.
      if (a.variantId === null) return -1
      if (b.variantId === null) return 1
      return 0
    })
}

/**
 * Teilt die Liste für den Auswahldialog: oben die passenden, darunter
 * aufklappbar die übrigen. Ein Suchbegriff filtert in beiden Gruppen.
 */
export function splitForPicker(
  pool: EditorCandidate[],
  search: string
): { fitting: EditorCandidate[]; others: EditorCandidate[] } {
  const term = search.trim().toLowerCase()
  const matches = (candidate: EditorCandidate) =>
    term === '' ||
    candidate.name.toLowerCase().includes(term) ||
    (candidate.variantTitle?.toLowerCase().includes(term) ?? false)

  const found = pool.filter(matches)

  return {
    fitting: found.filter(passes),
    others: found.filter((candidate) => !passes(candidate)),
  }
}

// ---- Aufbau auf dem Server ----

/** Was der Editor über den Generator-Zuschnitt hinaus von einer Übung braucht. */
export interface EditorSource extends CandidateSource {
  musicRequired: boolean
  musicLink: string | null
  needsCompletion: boolean
}

/**
 * Die Kandidatenliste eines Segments: **alle** Übungen des Nutzers samt
 * Varianten, jede mit der Auskunft, woran sie in diesem Segment scheitert.
 *
 * Alle und nicht nur die passenden, weil der Übungsleiter im Auswahldialog das
 * letzte Wort hat — und weil „Variante umschalten" die Geschwister auch einer
 * Übung finden muss, die selbst gewählt wurde und nicht zum Segment passt.
 *
 * Läuft auf dem Server. Die Regeln stehen im Generator; hier werden sie nur
 * befragt.
 */
export function buildEditorPool(
  sources: EditorSource[],
  segment: SegmentConfig,
  group: GeneratorGroup
): EditorCandidate[] {
  const bySource = new Map(sources.map((source) => [source.id, source]))

  return buildCandidates(sources).flatMap((candidate) => {
    const source = bySource.get(candidate.exerciseId)
    if (!source) return []

    return [
      {
        ...candidate,
        musicRequired: source.musicRequired,
        musicLink: source.musicLink,
        variantCount: source.variants.length,
        failedCriteria: failedCriteriaOf(candidate, segment, group),
        needsCompletion: source.needsCompletion,
      },
    ]
  })
}

// ---- Wenn der Vorrat erschöpft ist ----

function countOf(count: number, one: string, many: string): string {
  return count === 1 ? one : many.replace('{n}', String(count))
}

/**
 * Warum an diesem Platz nichts mehr zu würfeln ist — **jede** Ursache einzeln
 * und mit Anzahl, nicht nur die erste. Der Nutzer soll sehen, wo es überall
 * hängt, damit er gezielt nachbessern kann.
 *
 * Gezählt wird wie im Lückenhinweis des Generators: die Übungen mit passender
 * Phase sind die Grundmenge, jedes Kriterium zählt unabhängig. Eine Übung, die
 * an zwei Kriterien scheitert, taucht deshalb zweimal auf.
 */
export function describeExhaustion(
  pool: EditorCandidate[],
  exclusions: DrawExclusions,
  segmentName: string
): string {
  const phase = `„${segmentName}"`

  if (pool.length === 0) {
    return 'Du hast noch keine Übungen angelegt, aus denen gewürfelt werden könnte.'
  }

  const inPhase = pool.filter((candidate) => !candidate.failedCriteria.includes('phase'))
  if (inPhase.length === 0) {
    return countOf(
      pool.length,
      `Deine einzige Übung ist der Phase ${phase} nicht zugeordnet.`,
      `Keine deiner {n} Übungen ist der Phase ${phase} zugeordnet.`
    )
  }

  const causes: string[] = []

  for (const criterion of ['sport', 'difficulty', 'material', 'age', 'participants'] as const) {
    const count = inPhase.filter((candidate) => candidate.failedCriteria.includes(criterion)).length
    if (count > 0) causes.push(`${count} × ${CRITERION_LABELS[criterion]}`)
  }

  const fitting = inPhase.filter(passes)
  const inUnit = fitting.filter((candidate) => exclusions.exerciseIds.has(candidate.exerciseId))
  const rolledAway = fitting.filter(
    (candidate) =>
      !exclusions.exerciseIds.has(candidate.exerciseId) && exclusions.keys.has(keyOf(candidate))
  )

  if (inUnit.length > 0) causes.push(`${inUnit.length} × steht schon in dieser Einheit`)
  if (rolledAway.length > 0) causes.push(`${rolledAway.length} × hier schon weggewürfelt`)

  const head = countOf(
    inPhase.length,
    `Eine Übung trägt die Phase ${phase}, ist aber nicht mehr frei.`,
    `{n} Übungen tragen die Phase ${phase}, aber keine ist mehr frei.`
  )

  return causes.length > 0 ? `${head} Woran es hängt: ${causes.join(', ')}.` : head
}
