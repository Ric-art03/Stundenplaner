/**
 * Die Formen des Live-Modus (PROJ-14).
 *
 * Zwei Dinge werden streng getrennt: der **Plan vom Start** (`LivePlan`), der
 * nach dem Start nie mehr angefasst wird, und der **Verlauf** (`LiveRun`), der
 * sich bei jedem Tipp ändert. Deshalb läuft eine Stunde unverändert weiter,
 * wenn die Einheit währenddessen anderswo geändert oder gelöscht wird.
 */

export type LiveStepKind = 'exercise' | 'free' | 'placeholder'

export interface LiveMaterial {
  name: string
  /** Bei „pro Teilnehmer" schon mit der Teilnehmerzahl der Gruppe ausgerechnet. */
  quantity: number
  /**
   * Nur gesetzt, wenn die Gruppe keine Teilnehmerzahl hat: dann bleibt die
   * Menge „je Teilnehmer" stehen, statt eine Zahl zu erfinden.
   */
  perParticipant: boolean
}

/** Ein Schritt der Stunde, mit allem, was der Bildschirm von ihm zeigt. */
export interface LiveStep {
  key: string
  kind: LiveStepKind
  /** Name der Phase (des Segments). */
  phase: string
  /** Position der Phase — zwei Phasen können gleich heißen. */
  phaseIndex: number
  /** „2 von 3" innerhalb der Phase. */
  indexInPhase: number
  phaseCount: number
  phaseNote: string | null
  name: string
  variantTitle: string | null
  plannedMinutes: number
  description: string
  materials: LiveMaterial[]
  organizationForms: string[]
  workNote: string | null
  /** Die Formen der Übung, nur zum Ansehen. */
  variants: { id: string; title: string }[]
  musicRequired: boolean
  /** Der hinterlegte Musik-Link der Übung — bleibt ein Link, abgespielt wird nichts. */
  musicLink: string | null
  exerciseId: string | null
  variantId: string | null
  /** Speicherpfade der Bilder der Übung, das Titelbild zuerst. */
  imagePaths: string[]
}

export interface LivePlan {
  unitId: string
  unitName: string
  groupName: string
  venueName: string | null
  participants: number | null
  /** Die Summe der Schritte — bei einem überfüllten Segment mehr als die Länge im Generator. */
  totalMinutes: number
  steps: LiveStep[]
}

export type StepStatus = 'open' | 'done' | 'skipped'

export interface StepProgress {
  /** Bisher gelaufene Zeit, ohne die seit dem letzten Betreten. */
  elapsedMs: number
  status: StepStatus
}

export type LivePhase = 'ready' | 'running' | 'ended'

/**
 * Der Verlauf. Er hält nur fest, **wann** etwas geschah — jede Anzeige wird
 * daraus und aus „jetzt" gerechnet. Ein mitlaufender Zähler stünde, sobald das
 * Handy die Seite schlafen legt.
 */
export interface LiveRun {
  phase: LivePhase
  startedAt: number | null
  endedAt: number | null
  current: number
  /** Seit wann die Uhr des aktuellen Schritts läuft. */
  enteredAt: number | null
  /** Gesetzt = pausiert seit diesem Zeitpunkt. */
  pausedAt: number | null
  /** Summe aller abgeschlossenen Pausen. */
  pausedMs: number
  steps: StepProgress[]
}

/** Wohin eine Notiz aus der Nachbereitung ging. */
export type AdoptedNoteTarget = 'work' | 'personal'

/**
 * Der Vermerk am Schritt zählt mit: wurde erst an die Arbeitsnotiz und dann an
 * die Anmerkungen angehängt, steht beides da.
 */
export type AdoptedNote = AdoptedNoteTarget | 'both'

export interface RunStepRecord {
  position: number
  kind: LiveStepKind
  phase: string
  /** Abschrift — bleibt stehen, was auch immer mit der Übung geschieht. */
  name: string
  variantTitle: string | null
  plannedMinutes: number
  actualSeconds: number
  status: 'done' | 'skipped'
  /** Fällt weg, wenn die Übung gelöscht wird — und mit ihm die Nachbereitung. */
  exerciseId: string | null
  variantId: string | null
  adoptedNote: AdoptedNote | null
  adoptedDuration: number | null
}

/**
 * Eine Durchführung — dieselbe Form im Live-Bildschirm (aus der Stundenakte)
 * und auf der Detailseite (aus der Datenbank), damit eine Zusammenfassung für
 * beide Orte genügt.
 */
export interface RunRecord {
  /** Vergibt das Gerät beim Start; daran erkennt die Datenbank eine doppelte Sendung. */
  id: string
  unitId: string
  unitName: string
  startedAt: string
  endedAt: string
  plannedMinutes: number
  /** Ohne Pausen. */
  actualSeconds: number
  pausedSeconds: number
  note: string
  steps: RunStepRecord[]
}

/** Die Stundenakte, wie sie auf dem Gerät liegt. */
export interface LiveSession {
  version: 1
  runId: string
  /** Das Konto, zu dem die Akte gehört. Ein anderes sieht sie nicht. */
  userId: string
  plan: LivePlan
  run: LiveRun
  /** Der angefangene Text bei „Wie lief's?". */
  noteDraft: string
  /** Die Vermerke der Nachbereitung, je Position — bis „Fertig". */
  adopted: Record<number, { note?: AdoptedNote; duration?: number }>
}

/** Eine beendete Durchführung, die noch nicht in der Datenbank ist. */
export interface PendingRun {
  userId: string
  record: RunRecord
  /** Gesetzt = endgültig gescheitert; der Text nennt den Grund. */
  failure: string | null
}
