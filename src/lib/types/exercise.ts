// Der Grundstock (PROJ-19). Die Reihenfolge der Listen ist die Reihenfolge,
// in der die Begriffe überall erscheinen — eine zweite Angabe dazu gibt es
// nicht. Geordnet wird über `src/lib/categories/terms.ts`.

export const SPORTS = [
  'Krabbelgruppe', 'Eltern-Kind-Turnen', 'Kinderturnen', 'Kinderspiele',
  'Seniorensport', 'Gymnastik', 'Fitness/Workout',
  'Rehabilitation/Prävention', 'Therapie', 'Schwimmen', 'Turnen', 'Tanzen',
  'Kampfsport', 'Leichtathletik', 'Basketball', 'Fußball', 'Handball',
  'Volleyball', 'Abenteuer und Erlebnis', 'Teambuilding',
] as const

// Dass sich Grenzen überschneiden (4, 60, 75), ist gewollt.
export const AGE_GROUPS = [
  'Kinder (0–1)', 'Kinder (1–2)', 'Kinder (2–4)', 'Kinder (4–6)',
  'Kinder (7–10)', 'Jugend (11–14)', 'Jugend (15–17)',
  'Erwachsene (18–45)', 'Erwachsene (46–60)', 'Senioren (60–75)',
  'Senioren (75+)',
] as const

export const PHASES = [
  'Aufwärmen', 'Hauptteil', 'Cool-Down',
] as const

// Erst die ganze Gruppe zusammen, dann aufgeteilt nach Gruppengröße,
// zuletzt Mannschaften.
export const ORGANIZATION_FORMS = [
  'Freie Verteilung (ganze Halle)', 'Kreis', 'Reihe / Gasse',
  'Schachbrettformation', 'Zu zweit / Paare', 'Kleingruppen',
  'Stationsbetrieb', 'Zwei Mannschaften (gemeinsames Spielfeld)',
  'Zwei Mannschaften (getrenntes Spielfeld)',
] as const

// Von klein nach groß, wie man es im Geräteraum zusammensucht: Kleingeräte,
// Markieren, Matten, Großgeräte. „Ohne Material" ist kein Material und steht
// deshalb nicht hier (siehe `NO_MATERIAL` in terms.ts).
export const MATERIALS = [
  'Ball', 'Seil/Springseil', 'Reifen', 'Stab', 'Tuch', 'Schwungtuch',
  'Leibchen', 'Hütchen', 'Kegel', 'Markierung', 'Turnmatte', 'Yoga-Matte',
  'Weichbodenmatte', 'Bank', 'Kleiner Kasten', 'Großer Kasten', 'Bock',
  'Pferd', 'Sprossenwand', 'Turnringe', 'Stufenbarren', 'Tor',
  'Volleyballnetz',
] as const

export const DIFFICULTY_LEVELS = [
  'Leicht', 'Mittel', 'Schwer',
] as const

export type DifficultyLevel = typeof DIFFICULTY_LEVELS[number]

export type MaterialMode = 'pro Teilnehmer' | 'insgesamt'

export interface ExerciseMaterial {
  id?: string
  name: string
  quantity: number
  mode: MaterialMode
}

export interface ExerciseVariantMaterial {
  name: string
  quantity: number
  mode: MaterialMode
}

export interface ExerciseVariant {
  id?: string
  title: string
  description: string
  materials?: ExerciseVariantMaterial[]
  participantsMin?: number | null
  participantsMax?: number | null
  duration?: number | null
  ageGroups?: string[]
  organizationForms?: string[]
}

export interface ExerciseLink {
  id?: string
  url: string
  title?: string
}

export interface ExerciseImage {
  path: string
  isCover: boolean
}

export interface Exercise {
  id: string
  userId: string
  name: string
  description: string
  notes?: string | null
  workNotes?: string | null
  sports: string[]
  ageGroups: string[]
  phases: string[]
  difficulty: DifficultyLevel
  organizationForms: string[]
  duration: number
  participantsMin?: number | null
  participantsMax?: number | null
  musicRequired: boolean
  musicLink?: string | null
  /**
   * „Noch zu ergänzen": im Einheiten-Editor schnell angelegt und noch nicht
   * über das reguläre Formular gespeichert. Ein Hinweis, keine Einschränkung —
   * Generator und Editor behandeln die Übung wie jede andere.
   */
  needsCompletion: boolean
  /**
   * Quellenangabe, wo eine Lizenz Namensnennung verlangt (PROJ-4). Kommt nur
   * aus der Übungsdatenbank, geht beim Übernehmen mit und steht nicht im
   * Formular — bleibt also beim Bearbeiten erhalten.
   */
  sourceCredit?: string | null
  /** Gesetzt, wenn die Übung aus der Übungsdatenbank übernommen wurde (PROJ-4). */
  libraryOrigin?: { libraryExerciseId: string | null; copiedAt: string } | null
  images: ExerciseImage[]
  materials: ExerciseMaterial[]
  variants: ExerciseVariant[]
  links: ExerciseLink[]
  createdAt: string
  updatedAt: string
}

export interface ExerciseFormData {
  name: string
  description: string
  notes: string
  workNotes: string
  sports: string[]
  ageGroups: string[]
  phases: string[]
  difficulty: DifficultyLevel
  organizationForms: string[]
  duration: number
  participantsMin: number | null
  participantsMax: number | null
  musicRequired: boolean
  musicLink: string
  images: ExerciseImage[]
  materials: ExerciseMaterial[]
  variants: ExerciseVariant[]
  links: ExerciseLink[]
}

export type ExerciseSortField = 'name' | 'updatedAt' | 'duration' | 'difficulty' | 'createdAt'
export type ExerciseSortDirection = 'asc' | 'desc'
export type ExerciseViewMode = 'list' | 'cards'

export interface ExerciseFilters {
  search: string
  sports: string[]
  ageGroups: string[]
  phases: string[]
  difficulty: DifficultyLevel | null
  organizationForms: string[]
  materials: string[]
  /**
   * Übungen ohne jede Materialzeile. Eine eigene Angabe, kein Begriff der
   * Materialliste (PROJ-19); mit Material zusammen gilt „oder".
   */
  withoutMaterial: boolean
  participantsMin: number | null
  participantsMax: number | null
  /** Nur Übungen mit der Markierung „noch zu ergänzen". */
  needsCompletion: boolean
}

export const EMPTY_FILTERS: ExerciseFilters = {
  search: '',
  sports: [],
  ageGroups: [],
  phases: [],
  difficulty: null,
  organizationForms: [],
  materials: [],
  withoutMaterial: false,
  participantsMin: null,
  participantsMax: null,
  needsCompletion: false,
}

export const EMPTY_FORM_DATA: ExerciseFormData = {
  name: '',
  description: '',
  notes: '',
  workNotes: '',
  sports: [],
  ageGroups: [],
  phases: [],
  difficulty: 'Mittel',
  organizationForms: [],
  duration: 10,
  participantsMin: null,
  participantsMax: null,
  musicRequired: false,
  musicLink: '',
  images: [],
  materials: [],
  variants: [],
  links: [],
}
