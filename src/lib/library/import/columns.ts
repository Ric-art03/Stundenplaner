/**
 * Der Aufbau einer Block-Tabelle (PROJ-4, Tech Design C): drei Blätter, die
 * Spalten mit diesen Überschriften. Eine Stelle für Prüfprogramm, Vorlage und
 * Testblock.
 */

export const SHEETS = {
  block: 'Block',
  exercises: 'Übungen',
  variants: 'Varianten',
} as const

export type SheetName = (typeof SHEETS)[keyof typeof SHEETS]

/** Blatt „Block": zwei Spalten, je Zeile ein Feld. */
export const BLOCK_FIELD_COLUMN = 'Feld'
export const BLOCK_VALUE_COLUMN = 'Wert'
export const BLOCK_FIELDS = {
  name: 'Name',
  previewAccounts: 'Vorschau-Konten',
  sourcesNote: 'Quellen-Vermerk',
} as const

export const EXERCISE_COLUMNS = {
  key: 'Schlüssel',
  name: 'Name',
  description: 'Beschreibung',
  notes: 'Anmerkungen',
  sports: 'Sportarten',
  ageGroups: 'Altersgruppen',
  phases: 'Phasen',
  difficulty: 'Schwierigkeit',
  organizationForms: 'Organisationsformen',
  duration: 'Dauer',
  participantsMin: 'TN von',
  participantsMax: 'TN bis',
  music: 'Musik',
  materials: 'Material',
  links: 'Links',
  sourceCredit: 'Quellenangabe',
  provenance: 'Herkunft',
  state: 'Zustand',
  noVariantsReason: 'Ohne Varianten, weil',
} as const

export const VARIANT_COLUMNS = {
  exercise: 'Übung',
  title: 'Titel',
  description: 'Beschreibung',
  materials: 'Material',
  participantsMin: 'TN von',
  participantsMax: 'TN bis',
  duration: 'Dauer',
  ageGroups: 'Altersgruppen',
  organizationForms: 'Organisationsformen',
} as const

/** Trennzeichen in Listen-Zellen („Kinderturnen; Gymnastik"). */
export const LIST_SEPARATOR = ';'
/** „Ball 2 je TN" = pro Teilnehmer; ohne Zusatz = insgesamt. */
export const PER_PARTICIPANT = 'je TN'
export const WITHDRAWN = 'zurückgezogen'
export const ACTIVE = 'aktiv'

/** Eine Zeile einer Tabelle, so wie sie aus der Datei kommt: Überschrift → Text. */
export interface RawRow {
  /** Zeilennummer in der Tabelle, wie Excel sie zeigt. */
  row: number
  cells: Record<string, string>
}

export interface RawSheet {
  headers: string[]
  rows: RawRow[]
}

/** Eine Block-Tabelle, gelesen, aber noch nicht geprüft. `null` = Blatt fehlt. */
export interface RawBlock {
  block: RawSheet | null
  exercises: RawSheet | null
  variants: RawSheet | null
}
