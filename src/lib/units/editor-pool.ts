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
  /** Alle Varianten der Übung mit Namen — für „Varianten (2)" auf der Karte. */
  variants: { id: string; title: string }[]
  /**
   * Kam in den letzten zwei gespeicherten Einheiten der Gruppe vor. Solche
   * Übungen würfelt der Editor erst, wenn sonst nichts frei ist — dieselbe
   * Frische-Regel wie im Generator.
   */
  recentlyUsed: boolean
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
  organization: 'Organisationsform',
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
      variants: candidate.variants,
      variantTitle: candidate.variantTitle,
      // Die Arbeitsnotiz zeigt nur die Leseansicht, und die lädt die Einheit
      // nach dem Speichern neu. Die Kandidatenliste bleibt dafür schlank.
      workNotes: null,
    },
  }
}

/**
 * Was an diesem Platz noch gezogen werden darf: passend, nicht in einem anderen
 * Platz der Einheit, an diesem Platz noch nicht weggewürfelt — und nicht die
 * Form, die gerade dasteht.
 */
export function drawablePool(
  pool: EditorCandidate[],
  exclusions: DrawExclusions
): EditorCandidate[] {
  return pool.filter(
    (candidate) =>
      passes(candidate) &&
      !exclusions.exerciseIds.has(candidate.exerciseId) &&
      !exclusions.keys.has(keyOf(candidate)) &&
      keyOf(candidate) !== exclusions.current
  )
}

/** Was die Phase für die Gewichtung beim Auswürfeln vorgibt. */
export interface DrawWeighting {
  sports: string[]
  primarySport: string | null
}

const NO_WEIGHTING: DrawWeighting = { sports: [], primarySport: null }

function pickFrom<T>(items: T[], random: () => number): T {
  return items[Math.min(items.length - 1, Math.floor(random() * items.length))]
}

function sameSport(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

/**
 * Eine Übung auswürfeln, oder `null`, wenn der Vorrat erschöpft ist.
 *
 * Gezogen wird nach den Regeln des Generators, übertragen auf einen einzelnen
 * Platz:
 *
 * 1. **Frische zuerst** — Übungen aus den letzten zwei Einheiten der Gruppe
 *    kommen erst dran, wenn sonst nichts frei ist
 * 2. **Erst die Sportart, dann die Übung** — die Hauptsportart liegt zweimal im
 *    Topf. Ein Gewicht je Übung hinge davon ab, wie viele Übungen jede Sportart
 *    hat; so zählt die Sportart und nicht ihre Menge
 * 3. Hat die gezogene Sportart nichts mehr, wird unter allen gezogen
 *
 * Was nicht übertragbar ist: das Abwechseln über eine Folge von Übungen. Ein
 * einzelner Platz hat keine Folge.
 */
export function drawCandidate(
  pool: EditorCandidate[],
  exclusions: DrawExclusions,
  random: () => number = Math.random,
  weighting: DrawWeighting = NO_WEIGHTING
): EditorCandidate | null {
  const drawable = drawablePool(pool, exclusions)
  if (drawable.length === 0) return null

  const fresh = drawable.filter((candidate) => !candidate.recentlyUsed)
  const base = fresh.length > 0 ? fresh : drawable

  const sportPot = [...weighting.sports]
  if (weighting.primarySport && weighting.sports.length >= 2) {
    sportPot.push(weighting.primarySport)
  }
  if (sportPot.length === 0) return pickFrom(base, random)

  const sport = pickFrom(sportPot, random)
  const ofSport = base.filter((candidate) =>
    candidate.sports.some((entry) => sameSport(entry, sport))
  )

  return pickFrom(ofSport.length > 0 ? ofSport : base, random)
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
 * Eine Übung im Auswahldialog: die Grundübung und alle ihre Varianten in
 * **einer** Zeile. In den Daten bleiben Varianten eigene Kandidaten, wie im
 * Generator — zusammengefasst wird nur die Darstellung.
 */
export interface PickerEntry {
  exerciseId: string
  name: string
  /** Grundübung zuerst, danach die Varianten in ihrer Reihenfolge. */
  forms: EditorCandidate[]
  /**
   * Was ein Klick auf die Zeile einsetzt: die Grundübung, wenn sie passt —
   * sonst die erste passende Variante. Passt keine Form, die Grundübung.
   */
  preferred: EditorCandidate
  /** Passt mindestens eine Form? Dann steht die Zeile unter „Passend". */
  fits: boolean
}

/**
 * Teilt die Liste für den Auswahldialog: oben die Übungen, von denen
 * mindestens eine Form passt, darunter aufklappbar die übrigen. Ein Suchbegriff
 * filtert in beiden Gruppen und greift auf den Namen der Übung und die Titel
 * aller Varianten.
 */
export function groupForPicker(
  pool: EditorCandidate[],
  search: string
): { fitting: PickerEntry[]; others: PickerEntry[] } {
  const term = search.trim().toLowerCase()

  const order: string[] = []
  const byExercise = new Map<string, EditorCandidate[]>()
  for (const candidate of pool) {
    const forms = byExercise.get(candidate.exerciseId)
    if (forms) {
      forms.push(candidate)
    } else {
      byExercise.set(candidate.exerciseId, [candidate])
      order.push(candidate.exerciseId)
    }
  }

  const entries: PickerEntry[] = order.flatMap((exerciseId) => {
    const forms = variantsOf(byExercise.get(exerciseId) ?? [], exerciseId)
    const found =
      term === '' ||
      forms.some(
        (form) =>
          form.name.toLowerCase().includes(term) ||
          (form.variantTitle?.toLowerCase().includes(term) ?? false)
      )
    if (!found) return []

    const base = forms[0]
    const firstFitting = forms.find(passes)

    return [
      {
        exerciseId,
        name: base.name,
        forms,
        preferred: firstFitting ?? base,
        fits: firstFitting !== undefined,
      },
    ]
  })

  return {
    fitting: entries.filter((entry) => entry.fits),
    others: entries.filter((entry) => !entry.fits),
  }
}

// ---- Aufbau auf dem Server ----

/** Die Varianten einer Übung mit Namen. Ohne stabile Kennung lässt sich eine
 *  Variante nicht einsetzen — sie zählt dann nicht mit (wie bei den Kandidaten). */
export function variantNamesOf(
  source: Pick<CandidateSource, 'variants'>
): { id: string; title: string }[] {
  return source.variants.flatMap((variant) =>
    variant.id ? [{ id: variant.id, title: variant.title }] : []
  )
}

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
  group: GeneratorGroup,
  recentExerciseIds: Iterable<string> = []
): EditorCandidate[] {
  const bySource = new Map(sources.map((source) => [source.id, source]))
  const recent = new Set(recentExerciseIds)

  return buildCandidates(sources).flatMap((candidate) => {
    const source = bySource.get(candidate.exerciseId)
    if (!source) return []

    return [
      {
        ...candidate,
        musicRequired: source.musicRequired,
        musicLink: source.musicLink,
        variants: variantNamesOf(source),
        recentlyUsed: recent.has(candidate.exerciseId),
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

  for (const criterion of [
    'sport',
    'difficulty',
    'organization',
    'material',
    'age',
    'participants',
  ] as const) {
    const count = inPhase.filter((candidate) => candidate.failedCriteria.includes(criterion)).length
    if (count > 0) causes.push(`${count} × ${CRITERION_LABELS[criterion]}`)
  }

  const fitting = inPhase.filter(passes)
  const inUnit = fitting.filter((candidate) => exclusions.exerciseIds.has(candidate.exerciseId))
  const rolledAway = fitting.filter(
    (candidate) =>
      !exclusions.exerciseIds.has(candidate.exerciseId) &&
      keyOf(candidate) !== exclusions.current &&
      exclusions.keys.has(keyOf(candidate))
  )

  // Die Form im eigenen Platz ist weder weggewürfelt noch anderswo verplant —
  // sie steht nur gerade da. Ohne eigene Nennung ginge die Rechnung nicht auf.
  const inPlace = fitting.filter(
    (candidate) =>
      !exclusions.exerciseIds.has(candidate.exerciseId) && keyOf(candidate) === exclusions.current
  )

  if (inUnit.length > 0) causes.push(`${inUnit.length} × steht schon in dieser Einheit`)
  if (inPlace.length > 0) causes.push('1 × steht gerade in diesem Platz')
  if (rolledAway.length > 0) causes.push(`${rolledAway.length} × hier schon weggewürfelt`)

  const head = countOf(
    inPhase.length,
    `Eine Übung trägt die Phase ${phase}, ist aber nicht mehr frei.`,
    `{n} Übungen tragen die Phase ${phase}, aber keine ist mehr frei.`
  )

  return causes.length > 0 ? `${head} Woran es hängt: ${causes.join(', ')}.` : head
}
