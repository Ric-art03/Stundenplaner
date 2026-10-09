export const SPORTS = [
  'Turnen', 'Volleyball', 'Fußball', 'Basketball', 'Handball',
  'Leichtathletik', 'Tanzen', 'Fitness/Workout', 'Schwimmen',
  'Allgemeinsport', 'Krabbelgruppe', 'Eltern-Kind Turnen',
  'Vorschulturnen', 'Kinderturnen', 'Kinderspiele',
  'Abenteuer und Erlebnis', 'Kampfsport', 'Therapie',
  'Rehabilitation/Prävention', 'Teambuilding',
] as const

export const AGE_GROUPS = [
  'Kinder (0–1)', 'Kinder (1–2)', 'Kinder (2–4)', 'Kinder (4–6)',
  'Kinder (7–10)', 'Jugend (11–14)', 'Jugend (15–17)',
  'Erwachsene (18–45)', 'Erwachsene (46–60)', 'Senioren (60+)',
] as const

export const PHASES = [
  'Aufwärmen', 'Hauptteil', 'Cool-Down',
] as const

export const ORGANIZATION_FORMS = [
  'Freie Verteilung (ganze Halle)', 'Zu zweit / Paare', 'Kleingruppen',
  'Zwei Mannschaften (gemeinsames Spielfeld)',
  'Zwei Mannschaften (getrenntes Spielfeld)',
  'Kreis / Sitzkreis', 'Reihe / Gasse', 'Stationsbetrieb', '1-gegen-1',
] as const

export const MATERIALS = [
  'Ball', 'Yoga-Matte', 'Weichbodenmatte', 'Turnmatte', 'Hütchen',
  'Seil/Springseil', 'Bank', 'Reifen', 'Kleiner Kasten', 'Großer Kasten',
  'Bock', 'Pferd', 'Sprossenwand', 'Turnringe', 'Stab', 'Leibchen',
  'Tor/Netz', 'Kegel', 'Schwungtuch', 'Markierung', 'Tuch', 'Kein Material',
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
