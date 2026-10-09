import { candidateKey } from './candidates'
import type { SegmentFillMode, Unit, UnitItemExercise } from '@/lib/types/unit'

/**
 * Die Arbeitsfassung des Plans — der Stand, an dem der Bearbeiten-Modus aus
 * PROJ-7 arbeitet, solange nichts gespeichert ist.
 *
 * Alle Operationen hier sind **reine Umformungen**: sie bekommen einen Stand
 * und geben einen neuen zurück, ohne den alten anzufassen. Daran hängt
 * „Rückgängig": die Oberfläche legt die vorigen Stände auf einen Stapel und
 * braucht keine Gegen-Operationen (sieben statt vierzehn Dinge, die stimmen
 * müssen).
 *
 * Was hier **nicht** liegt: Segmentnamen, Minutenlängen, Phasenfolge. Die
 * gehören dem Generator, und der Editor darf sie nicht ändern. Dass sie fehlen,
 * ist die Durchsetzung dieser Regel und kein Versehen — die Oberfläche legt die
 * Arbeitsfassung über die geladene Einheit und nimmt den Rahmen von dort.
 */

/** Kürzer als eine Minute kann ein Platz nicht sein. */
export const MIN_ITEM_MINUTES = 1

/**
 * Was eine Eintragskarte zum Anzeigen braucht. Gegenüber `UnitItemExercise`
 * fehlt nur die Beschreibung: sie wird in der Stundenansicht nicht angezeigt
 * (sie liegt für den Live-Modus bereit) und müsste sonst auch über die
 * Auswahlliste in den Browser wandern, wo sie der größte Teil der Daten wäre.
 */
export type DraftItemExercise = Omit<UnitItemExercise, 'description'>

/** Eine Übung, die in einen Platz gesetzt werden soll. */
export interface DraftPlacement {
  exerciseId: string
  variantId: string | null
  exercise: DraftItemExercise
}

export interface DraftItem {
  /**
   * Bleibt über alle Umformungen stabil, auch beim Umsortieren. Bei geladenen
   * Einträgen die Kennung aus der Datenbank, bei neuen eine eigene. Nicht die
   * Position: sonst springt beim Umsortieren der Tastaturfokus auf die
   * Nachbarkarte, und genau Umsortieren soll ohne Maus gehen.
   */
  key: string
  /** null = die Übung wurde aus der Datenbank gelöscht (Platzhalter). */
  exerciseId: string | null
  variantId: string | null
  plannedDuration: number
  exercise: DraftItemExercise | null
  /**
   * Was an **diesem** Platz schon weggewürfelt wurde, als Kandidaten-Schlüssel.
   * Hängt am Platz und nicht an der Einheit: „dreimal gewürfelt, keine
   * Wiederholung" gilt für diesen Platz, ein zweiter Platz im selben Segment
   * fängt bei null an.
   */
  rejected: string[]
}

export interface DraftSegment {
  id: string
  notes: string
  /**
   * Bis zu so viele freie Minuten sind hier **geplant**. Eine Zahl und kein
   * Ja/Nein: so gilt die Erklärung für den Stand, an dem sie gegeben wurde —
   * werden danach mehr Minuten frei, ist die Lücke von selbst wieder offen.
   */
  plannedGapMinutes: number
  items: DraftItem[]
}

export interface UnitDraft {
  segments: DraftSegment[]
}

/** Eigene Kennungen für neu eingefügte Plätze. */
let counter = 0

function newItemKey(): string {
  counter += 1
  // Vorangestellt, damit sich eine neue Kennung nie mit einer Datenbank-Kennung
  // überschneiden kann.
  return `neu-${counter}`
}

// ---- Anlegen ----

/**
 * Die Arbeitsfassung aus der geladenen Einheit. Dieser Stand ist gleichzeitig
 * der Ausgangszustand, gegen den „sind Änderungen offen?" geprüft wird.
 */
export function createDraft(unit: Unit): UnitDraft {
  return {
    segments: unit.segments.map((segment) => ({
      id: segment.id,
      notes: segment.notes,
      plannedGapMinutes: segment.plannedGapMinutes,
      items: segment.items.map((item) => ({
        key: item.id,
        exerciseId: item.exerciseId,
        variantId: item.variantId,
        plannedDuration: item.plannedDuration,
        exercise: item.exercise,
        rejected: [],
      })),
    })),
  }
}

// ---- Innere Helfer ----

function mapSegment(
  draft: UnitDraft,
  segmentId: string,
  change: (segment: DraftSegment) => DraftSegment
): UnitDraft {
  return {
    segments: draft.segments.map((segment) =>
      segment.id === segmentId ? change(segment) : segment
    ),
  }
}

function mapItem(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string,
  change: (item: DraftItem) => DraftItem
): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => ({
    ...segment,
    items: segment.items.map((item) => (item.key === itemKey ? change(item) : item)),
  }))
}

function placed(item: DraftItem, next: DraftPlacement): DraftItem {
  return {
    ...item,
    exerciseId: next.exerciseId,
    variantId: next.variantId,
    exercise: next.exercise,
  }
}

// ---- Die Operationen ----

/** Notiz eines Segments. Der Ort für alles, was keine Übung ist. */
export function setSegmentNotes(
  draft: UnitDraft,
  segmentId: string,
  notes: string
): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => ({ ...segment, notes }))
}

/**
 * Plandauer eines Platzes. Wird auf die Mindestdauer gehoben — auch bei 0,
 * negativen Werten und einer leeren Eingabe. Nach oben gibt es keine Grenze:
 * eine Überfüllung ist laut Spec eine Entscheidung des Übungsleiters, die
 * ausgewiesen und nicht verhindert wird.
 */
export function setItemDuration(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string,
  minutes: number
): UnitDraft {
  const safe = Number.isFinite(minutes)
    ? Math.max(MIN_ITEM_MINUTES, Math.floor(minutes))
    : MIN_ITEM_MINUTES

  return mapItem(draft, segmentId, itemKey, (item) => ({ ...item, plannedDuration: safe }))
}

/**
 * Einen Platz um eine Stelle verschieben, innerhalb seines Segments. Am Rand
 * ein Nichts — die Oberfläche deaktiviert den Knopf dort ohnehin, aber die
 * Regel gehört hierher und nicht nur an den Knopf.
 */
export function moveItem(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string,
  direction: 'up' | 'down'
): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => {
    const index = segment.items.findIndex((item) => item.key === itemKey)
    if (index === -1) return segment

    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= segment.items.length) return segment

    const items = [...segment.items]
    ;[items[index], items[target]] = [items[target], items[index]]
    return { ...segment, items }
  })
}

/**
 * Einen Platz entfernen. Die Minuten werden im Segment frei; dass daraus eine
 * Lücke wird, rechnet `segmentBalance` aus. Ein Segment darf leer werden —
 * laut Spec ist eine leere Einheit ein zulässiges Gerüst.
 */
export function removeItem(draft: UnitDraft, segmentId: string, itemKey: string): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => ({
    ...segment,
    items: segment.items.filter((item) => item.key !== itemKey),
  }))
}

/**
 * Eine andere Übung in einen Platz setzen: selbst gewählt, auf eine Variante
 * umgeschaltet oder ein Platzhalter nachbesetzt. Der Platz **behält seine
 * Minuten** — ein schnelles „passt nicht, nächste" darf keine Aufräumarbeit
 * nach sich ziehen.
 *
 * Die weggewürfelten Übungen bleiben unberührt: wer bewusst wählt, hebt damit
 * nicht auf, was er vorher verworfen hat.
 */
export function setItemExercise(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string,
  next: DraftPlacement
): UnitDraft {
  return mapItem(draft, segmentId, itemKey, (item) => placed(item, next))
}

/**
 * Wie `setItemExercise`, merkt sich aber die bisherige Übung als an diesem
 * Platz weggewürfelt. Nur so bringt jeder weitere Klick wirklich etwas Neues,
 * statt zwischen zwei Übungen zu pendeln.
 *
 * Ein Platzhalter (gelöschte Übung) hat nichts zu merken und wird einfach
 * besetzt.
 */
export function rerollItem(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string,
  next: DraftPlacement
): UnitDraft {
  return mapItem(draft, segmentId, itemKey, (item) => {
    const previous =
      item.exerciseId === null ? null : candidateKey(item.exerciseId, item.variantId)

    return {
      ...placed(item, next),
      rejected:
        previous === null || item.rejected.includes(previous)
          ? item.rejected
          : [...item.rejected, previous],
    }
  })
}

/**
 * Eine Übung zusätzlich in ein Segment einfügen — am Ende, oder an einer
 * bestimmten Stelle.
 *
 * Die Plandauer startet auf der Schätzdauer der Übung. Anders als beim Tausch
 * gibt es hier keine Minuten, die der Platz behalten könnte, und die Schätzung
 * ist der einzige Wert, der nicht geraten ist. Dass damit ein volles Segment
 * überfüllt werden kann, ist laut Spec zugelassen und wird ausgewiesen.
 */
export function insertItem(
  draft: UnitDraft,
  segmentId: string,
  next: DraftPlacement,
  atIndex?: number
): UnitDraft {
  const item: DraftItem = {
    key: newItemKey(),
    exerciseId: next.exerciseId,
    variantId: next.variantId,
    plannedDuration: Math.max(MIN_ITEM_MINUTES, next.exercise.estimatedDuration),
    exercise: next.exercise,
    rejected: [],
  }

  return mapSegment(draft, segmentId, (segment) => {
    const items = [...segment.items]
    const at = atIndex === undefined ? items.length : Math.max(0, Math.min(atIndex, items.length))
    items.splice(at, 0, item)
    return { ...segment, items }
  })
}

/**
 * „Als geplante Lücke stehen lassen": was in diesem Segment gerade frei ist,
 * gilt ab jetzt als geplant. Ohne freie Minuten ein Nichts.
 */
export function declarePlannedGap(
  draft: UnitDraft,
  segmentId: string,
  segmentMinutes: number
): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => {
    const free = Math.max(0, segmentMinutes - plannedMinutes(segment))
    return free === 0 ? segment : { ...segment, plannedGapMinutes: free }
  })
}

/** „Wieder öffnen": die Lücke ist wieder eine offene. */
export function reopenGap(draft: UnitDraft, segmentId: string): UnitDraft {
  return mapSegment(draft, segmentId, (segment) => ({ ...segment, plannedGapMinutes: 0 }))
}

/** Der Rahmen eines Segments, den die Arbeitsfassung bewusst nicht trägt. */
export interface SegmentFrame {
  id: string
  name: string
  minutes: number
  fillMode: SegmentFillMode
}

/**
 * „Alle als geplant übernehmen": erklärt jede **offene** Lücke zur geplanten.
 * Segmente ohne offene Lücke bleiben unberührt — eine schon geplante Lücke
 * wird nicht nebenbei vergrößert.
 */
export function declareAllOpenGaps(draft: UnitDraft, frames: SegmentFrame[]): UnitDraft {
  return openGaps(draft, frames).reduce(
    (current, gap) => declarePlannedGap(current, gap.id, gap.minutes),
    draft
  )
}

// ---- Abgeleitetes ----

/** Verplante Minuten eines Segments. */
export function plannedMinutes(segment: DraftSegment): number {
  return segment.items.reduce((sum, item) => sum + item.plannedDuration, 0)
}

export interface SegmentBalance {
  /** Summe der Plandauern. */
  planned: number
  /** Was das Zeitgerüst für dieses Segment vorsieht. */
  minutes: number
  /** Freie Minuten; 0 wenn das Segment aufgeht oder übervoll ist. */
  free: number
  /** Überzählige Minuten; 0 wenn das Segment aufgeht oder Platz frei ist. */
  over: number
}

/**
 * Der Stand eines Segments — Grundlage der Füllstandszeile („10 von 12 Min ·
 * 2 Min frei") und der Nennung im Speichern-Dialog.
 */
export function segmentBalance(segment: DraftSegment, minutes: number): SegmentBalance {
  const planned = plannedMinutes(segment)
  return {
    planned,
    minutes,
    free: Math.max(0, minutes - planned),
    over: Math.max(0, planned - minutes),
  }
}

export type GapState = 'none' | 'open' | 'planned'

/**
 * Die eine Regel für freie Minuten:
 *
 * - nichts frei → keine Lücke
 * - das Segment stand im Generator auf „frei lassen" → immer geplant
 * - frei ≤ geplant → geplant
 * - frei > geplant → offen, und eine offene Lücke sperrt das Speichern
 */
export function gapState(
  free: number,
  plannedGapMinutes: number,
  fillMode: SegmentFillMode
): GapState {
  if (free <= 0) return 'none'
  if (fillMode === 'empty') return 'planned'
  return free <= plannedGapMinutes ? 'planned' : 'open'
}

export interface OpenGap extends SegmentFrame {
  free: number
}

/** Alle Segmente mit offener Lücke, in der Reihenfolge des Zeitverlaufs. */
export function openGaps(draft: UnitDraft, frames: SegmentFrame[]): OpenGap[] {
  return frames.flatMap((frame) => {
    const segment = draft.segments.find((entry) => entry.id === frame.id)
    if (!segment) return []

    const { free } = segmentBalance(segment, frame.minutes)
    return gapState(free, segment.plannedGapMinutes, frame.fillMode) === 'open'
      ? [{ ...frame, free }]
      : []
  })
}

/** Geht dieses Segment auf? */
export function segmentFits(segment: DraftSegment, minutes: number): boolean {
  return plannedMinutes(segment) === minutes
}

/** Alle Übungen, die in der Arbeitsfassung stehen — Platzhalter zählen nicht. */
export function usedExerciseIds(draft: UnitDraft): string[] {
  const ids = new Set<string>()
  for (const segment of draft.segments) {
    for (const item of segment.items) {
      if (item.exerciseId !== null) ids.add(item.exerciseId)
    }
  }
  return [...ids]
}

export interface DrawExclusions {
  /**
   * Übungen, die in **anderen** Plätzen dieser Einheit stehen. Nach Übung und
   * nicht nach Kandidat: eine andere Variante derselben Übung wäre dieselbe
   * Übung zweimal in einer Stunde — genau der Fehler, den der Generator
   * vermeidet.
   *
   * Die Übung im eigenen Platz gehört bewusst **nicht** dazu: der Tausch im
   * selben Platz bringt sie nicht ein zweites Mal in die Stunde, und ihre
   * übrigen Formen sind vollwertige Kandidaten (BUG-20).
   */
  exerciseIds: Set<string>
  /** Was an diesem Platz schon weggewürfelt wurde. */
  keys: Set<string>
  /** Die Form, die gerade im Platz steht — sie zu ziehen wäre kein Wurf. */
  current: string | null
}

/**
 * Was beim Auswürfeln an diesem Platz nicht gezogen werden darf. Gilt nur für
 * das Auswürfeln: eine bewusst zweimal gewählte Übung ist laut Spec eine
 * Absicht und wird im Auswahldialog nur mit einem Hinweis bedacht.
 */
export function exclusionsFor(
  draft: UnitDraft,
  segmentId: string,
  itemKey: string
): DrawExclusions {
  const segment = draft.segments.find((entry) => entry.id === segmentId)
  const item = segment?.items.find((entry) => entry.key === itemKey)

  const elsewhere = new Set<string>()
  for (const other of draft.segments) {
    for (const entry of other.items) {
      if (entry.exerciseId === null) continue
      if (other.id === segmentId && entry.key === itemKey) continue
      elsewhere.add(entry.exerciseId)
    }
  }

  return {
    exerciseIds: elsewhere,
    keys: new Set(item?.rejected ?? []),
    current:
      item && item.exerciseId !== null ? candidateKey(item.exerciseId, item.variantId) : null,
  }
}

/**
 * Unterscheiden sich zwei Stände im **Plan**? Verglichen wird, was gespeichert
 * würde: Notizen, geplante Lücken, Reihenfolge, Übungen, Plandauern.
 *
 * Bewusst nicht verglichen werden die weggewürfelten Übungen und die
 * Anzeigedaten. Wer A wegwürfelt, dann B, dann wieder bei A landet, hat am
 * Plan nichts geändert und soll beim Verlassen nicht gefragt werden.
 */
export function draftsEqual(a: UnitDraft, b: UnitDraft): boolean {
  if (a.segments.length !== b.segments.length) return false

  return a.segments.every((segment, index) => {
    const other = b.segments[index]
    if (segment.id !== other.id) return false
    if (segment.notes !== other.notes) return false
    if (segment.plannedGapMinutes !== other.plannedGapMinutes) return false
    if (segment.items.length !== other.items.length) return false

    return segment.items.every((item, position) => {
      const otherItem = other.items[position]
      return (
        item.exerciseId === otherItem.exerciseId &&
        item.variantId === otherItem.variantId &&
        item.plannedDuration === otherItem.plannedDuration
      )
    })
  })
}
