import { z } from 'zod'
import { exerciseSchema } from '@/lib/validations/exercise'
import {
  NO_MATERIAL_LABEL,
  noMaterialEntry,
  predefinedSpelling,
  type TermType,
} from '@/lib/categories/terms'
import { DIFFICULTY_LEVELS, type DifficultyLevel, type MaterialMode } from '@/lib/types/exercise'
import {
  ACTIVE,
  BLOCK_FIELD_COLUMN,
  BLOCK_FIELDS,
  BLOCK_VALUE_COLUMN,
  EXERCISE_COLUMNS,
  LIST_SEPARATOR,
  PER_PARTICIPANT,
  SHEETS,
  VARIANT_COLUMNS,
  WITHDRAWN,
  type RawBlock,
  type RawRow,
  type RawSheet,
  type SheetName,
} from './columns'

/**
 * Prüft eine Block-Tabelle (PROJ-4, G): jede Zeile gegen den Grundstock
 * (PROJ-19) und **dieselben Grenzen wie das Übungsformular** — ein Block kann
 * nichts enthalten, was ein Nutzer nicht auch von Hand anlegen könnte. Dazu die
 * Regeln, die nur für den Bestand gelten (Sportart, Altersgruppe, Phase und
 * Herkunft sind Pflicht; im Hauptteil zwei Varianten oder eine Begründung).
 *
 * **Jeder** Fehler wird mit Blatt, Zeile und Spalte gemeldet; nichts wird still
 * korrigiert — auch keine Schreibweise.
 */

export interface ImportError {
  sheet: SheetName
  /** Zeile wie in Excel; 0 = das Blatt als Ganzes. */
  row: number
  field: string
  message: string
}

export interface ParsedMaterial {
  name: string
  quantity: number
  mode: MaterialMode
}

export interface ParsedVariant {
  row: number
  title: string
  description: string
  /** Leer = wie die Übung; ein Eintrag „Kein Material" = ohne Material. */
  materials: ParsedMaterial[]
  participantsMin: number | null
  participantsMax: number | null
  duration: number | null
  ageGroups: string[]
  organizationForms: string[]
}

export interface ParsedExercise {
  row: number
  key: string
  withdrawn: boolean
  name: string
  description: string
  notes: string | null
  sports: string[]
  ageGroups: string[]
  phases: string[]
  difficulty: DifficultyLevel
  organizationForms: string[]
  duration: number
  participantsMin: number | null
  participantsMax: number | null
  musicRequired: boolean
  materials: ParsedMaterial[]
  links: { url: string; title: string | null }[]
  sourceCredit: string | null
  /** Woraus die Übung gewonnen wurde (Abschnitt H) — bleibt in der Tabelle. */
  provenance: string
  noVariantsReason: string | null
  variants: ParsedVariant[]
}

export interface ParsedBlock {
  name: string
  previewEmails: string[]
  sourcesNote: string | null
  exercises: ParsedExercise[]
}

export type ParseResult = { block: ParsedBlock; errors: [] } | { block: null; errors: ImportError[] }

export const KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/
const MAX_SOURCE_CREDIT = 500
const MAX_BLOCK_NAME = 100

class Collector {
  errors: ImportError[] = []
  add(sheet: SheetName, row: number, field: string, message: string) {
    this.errors.push({ sheet, row, field, message })
  }
}

function text(row: RawRow, column: string): string {
  return (row.cells[column] ?? '').trim()
}

function isEmptyRow(row: RawRow): boolean {
  return Object.values(row.cells).every((value) => value.trim() === '')
}

function listCell(value: string): string[] {
  return value
    .split(LIST_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part !== '')
}

function checkHeaders(sheet: RawSheet | null, name: SheetName, expected: readonly string[], out: Collector): sheet is RawSheet {
  if (!sheet) {
    out.add(name, 0, '—', `Das Blatt „${name}" fehlt.`)
    return false
  }
  for (const column of expected) {
    if (!sheet.headers.includes(column)) out.add(name, 1, column, `Die Spalte „${column}" fehlt.`)
  }
  for (const header of sheet.headers) {
    if (header !== '' && !expected.includes(header)) {
      out.add(name, 1, header, `Unbekannte Spalte „${header}" — Tippfehler in der Überschrift?`)
    }
  }
  return true
}

/** Begriffe aus dem Grundstock, genau so geschrieben. Doppelte sind ein Fehler. */
function terms(
  type: TermType,
  value: string,
  at: { sheet: SheetName; row: number; field: string },
  out: Collector
): string[] {
  const result: string[] = []
  for (const term of listCell(value)) {
    const spelling = predefinedSpelling(type, term)
    if (spelling === null) {
      out.add(at.sheet, at.row, at.field, `„${term}" ist kein Begriff des Grundstocks.`)
    } else if (spelling !== term) {
      out.add(at.sheet, at.row, at.field, `„${term}" ist anders geschrieben als im Grundstock: „${spelling}".`)
    } else if (result.includes(term)) {
      out.add(at.sheet, at.row, at.field, `„${term}" steht doppelt.`)
    } else {
      result.push(term)
    }
  }
  return result
}

function integer(
  value: string,
  at: { sheet: SheetName; row: number; field: string },
  out: Collector
): number | null {
  if (value === '') return null
  if (!/^\d+$/.test(value)) {
    out.add(at.sheet, at.row, at.field, `„${value}" ist keine ganze Zahl.`)
    return null
  }
  return Number(value)
}

const MATERIAL_ENTRY = /^(.*?)\s+(\d+)(?:\s+(.+))?$/

/** „Ball 1 je TN; Hütchen 12" — Material, Menge, wahlweise „je TN". */
function materials(
  value: string,
  at: { sheet: SheetName; row: number; field: string },
  out: Collector
): ParsedMaterial[] {
  const result: ParsedMaterial[] = []
  for (const entry of listCell(value)) {
    const match = entry.match(MATERIAL_ENTRY)
    if (!match) {
      out.add(at.sheet, at.row, at.field, `„${entry}": erwartet „Material Menge" oder „Material Menge ${PER_PARTICIPANT}".`)
      continue
    }
    const [, rawName, quantity, mode] = match
    if (mode !== undefined && mode !== PER_PARTICIPANT) {
      out.add(at.sheet, at.row, at.field, `„${entry}": „${mode}" ist kein Modus — nur „${PER_PARTICIPANT}" oder nichts (= insgesamt).`)
      continue
    }
    const spelling = predefinedSpelling('material', rawName)
    if (spelling === null) {
      out.add(at.sheet, at.row, at.field, `„${rawName}" ist kein Material des Grundstocks.`)
      continue
    }
    if (spelling !== rawName) {
      out.add(at.sheet, at.row, at.field, `„${rawName}" ist anders geschrieben als im Grundstock: „${spelling}".`)
      continue
    }
    if (result.some((m) => m.name === spelling)) {
      out.add(at.sheet, at.row, at.field, `„${spelling}" steht doppelt.`)
      continue
    }
    if (Number(quantity) < 1) {
      out.add(at.sheet, at.row, at.field, `„${entry}": die Menge muss mindestens 1 sein.`)
      continue
    }
    result.push({ name: spelling, quantity: Number(quantity), mode: mode ? 'pro Teilnehmer' : 'insgesamt' })
  }
  return result
}

/** „Titel | https://…" oder nur die Adresse; mehrere mit „;". */
function links(value: string): { url: string; title: string | null }[] {
  return listCell(value).map((entry) => {
    const bar = entry.lastIndexOf('|')
    if (bar === -1) return { url: entry, title: null }
    const title = entry.slice(0, bar).trim()
    return { url: entry.slice(bar + 1).trim(), title: title === '' ? null : title }
  })
}

// ---- Blatt „Block" ----

function parseBlockSheet(sheet: RawSheet, out: Collector): Pick<ParsedBlock, 'name' | 'previewEmails' | 'sourcesNote'> {
  const fields = new Map<string, { row: number; value: string }>()
  for (const row of sheet.rows) {
    if (isEmptyRow(row)) continue
    const field = text(row, BLOCK_FIELD_COLUMN)
    const value = text(row, BLOCK_VALUE_COLUMN)
    if (!(Object.values(BLOCK_FIELDS) as string[]).includes(field)) {
      out.add(SHEETS.block, row.row, BLOCK_FIELD_COLUMN, `Unbekanntes Feld „${field}".`)
      continue
    }
    if (fields.has(field)) {
      out.add(SHEETS.block, row.row, field, `Das Feld „${field}" steht doppelt.`)
      continue
    }
    fields.set(field, { row: row.row, value })
  }

  const name = fields.get(BLOCK_FIELDS.name)
  if (!name || name.value === '') {
    out.add(SHEETS.block, name?.row ?? 0, BLOCK_FIELDS.name, 'Der Block braucht einen Namen.')
  } else if (name.value.length > MAX_BLOCK_NAME) {
    out.add(SHEETS.block, name.row, BLOCK_FIELDS.name, `Höchstens ${MAX_BLOCK_NAME} Zeichen.`)
  }

  const preview = fields.get(BLOCK_FIELDS.previewAccounts)
  const previewEmails = (preview?.value ?? '')
    .split(/[;,]/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e !== '')
  for (const email of previewEmails) {
    if (!z.email().safeParse(email).success) {
      out.add(SHEETS.block, preview!.row, BLOCK_FIELDS.previewAccounts, `„${email}" ist keine E-Mail-Adresse.`)
    }
  }
  if (previewEmails.length === 0) {
    out.add(SHEETS.block, preview?.row ?? 0, BLOCK_FIELDS.previewAccounts, 'Mindestens ein Konto, das die Entwürfe vorab sieht.')
  }

  const note = fields.get(BLOCK_FIELDS.sourcesNote)?.value ?? ''
  return { name: name?.value ?? '', previewEmails: [...new Set(previewEmails)], sourcesNote: note === '' ? null : note }
}

// ---- Blatt „Varianten" ----

function parseVariants(sheet: RawSheet, out: Collector): Map<string, ParsedVariant[]> {
  const byExercise = new Map<string, ParsedVariant[]>()
  const C = VARIANT_COLUMNS
  for (const row of sheet.rows) {
    if (isEmptyRow(row)) continue
    const at = (field: string) => ({ sheet: SHEETS.variants, row: row.row, field })
    const key = text(row, C.exercise)
    if (key === '') {
      out.add(SHEETS.variants, row.row, C.exercise, 'Zu welcher Übung gehört die Variante? Schlüssel fehlt.')
      continue
    }

    const materialCell = text(row, C.materials)
    let variantMaterials: ParsedMaterial[]
    if (materialCell === NO_MATERIAL_LABEL) {
      variantMaterials = [noMaterialEntry()]
    } else if (materialCell.toLowerCase() === NO_MATERIAL_LABEL.toLowerCase()) {
      out.add(SHEETS.variants, row.row, C.materials, `Anders geschrieben als „${NO_MATERIAL_LABEL}".`)
      variantMaterials = []
    } else {
      variantMaterials = materials(materialCell, at(C.materials), out)
    }

    const variant: ParsedVariant = {
      row: row.row,
      title: text(row, C.title),
      description: text(row, C.description),
      materials: variantMaterials,
      participantsMin: integer(text(row, C.participantsMin), at(C.participantsMin), out),
      participantsMax: integer(text(row, C.participantsMax), at(C.participantsMax), out),
      duration: integer(text(row, C.duration), at(C.duration), out),
      ageGroups: terms('age_group', text(row, C.ageGroups), at(C.ageGroups), out),
      organizationForms: terms('organization_form', text(row, C.organizationForms), at(C.organizationForms), out),
    }
    if (variant.duration !== null && (variant.duration < 1 || variant.duration > 300)) {
      out.add(SHEETS.variants, row.row, C.duration, 'Zwischen 1 und 300 Minuten.')
    }
    byExercise.set(key, [...(byExercise.get(key) ?? []), variant])
  }
  return byExercise
}

// ---- Blatt „Übungen" ----

/** Welche Spalte ein Fehler aus der Formularprüfung meint. */
const FIELD_COLUMNS: Record<string, string> = {
  name: EXERCISE_COLUMNS.name,
  description: EXERCISE_COLUMNS.description,
  notes: EXERCISE_COLUMNS.notes,
  sports: EXERCISE_COLUMNS.sports,
  ageGroups: EXERCISE_COLUMNS.ageGroups,
  phases: EXERCISE_COLUMNS.phases,
  difficulty: EXERCISE_COLUMNS.difficulty,
  organizationForms: EXERCISE_COLUMNS.organizationForms,
  duration: EXERCISE_COLUMNS.duration,
  participantsMin: EXERCISE_COLUMNS.participantsMin,
  participantsMax: EXERCISE_COLUMNS.participantsMax,
  materials: EXERCISE_COLUMNS.materials,
  links: EXERCISE_COLUMNS.links,
}
const VARIANT_FIELD_COLUMNS: Record<string, string> = {
  title: VARIANT_COLUMNS.title,
  description: VARIANT_COLUMNS.description,
  materials: VARIANT_COLUMNS.materials,
  participantsMin: VARIANT_COLUMNS.participantsMin,
  participantsMax: VARIANT_COLUMNS.participantsMax,
  duration: VARIANT_COLUMNS.duration,
}

/** Dieselbe Prüfung wie das Übungsformular — Grenzen an einer Stelle. */
function checkAgainstForm(exercise: ParsedExercise, out: Collector, alreadyFailed: Set<string>) {
  const result = exerciseSchema.safeParse({
    name: exercise.name,
    description: exercise.description,
    notes: exercise.notes ?? '',
    workNotes: '',
    sports: exercise.sports,
    ageGroups: exercise.ageGroups,
    phases: exercise.phases,
    difficulty: exercise.difficulty,
    organizationForms: exercise.organizationForms,
    duration: exercise.duration,
    participantsMin: exercise.participantsMin,
    participantsMax: exercise.participantsMax,
    materials: exercise.materials,
    musicRequired: exercise.musicRequired,
    musicLink: '',
    variants: exercise.variants.map((v) => ({
      title: v.title,
      description: v.description,
      materials: v.materials,
      participantsMin: v.participantsMin,
      participantsMax: v.participantsMax,
      duration: v.duration,
      ageGroups: v.ageGroups,
      organizationForms: v.organizationForms,
    })),
    links: exercise.links.map((l) => ({ url: l.url, title: l.title ?? undefined })),
  })
  if (result.success) return

  const seen = new Set<string>()
  for (const issue of result.error.issues) {
    const [first, index, inner] = issue.path
    if (first === 'variants' && typeof index === 'number') {
      const variant = exercise.variants[index]
      const column = VARIANT_FIELD_COLUMNS[String(inner)] ?? String(inner ?? '—')
      const id = `v${index}:${column}`
      if (!variant || seen.has(id) || alreadyFailed.has(id)) continue
      seen.add(id)
      out.add(SHEETS.variants, variant.row, column, issue.message)
      continue
    }
    const column = FIELD_COLUMNS[String(first)] ?? String(first ?? '—')
    if (seen.has(column) || alreadyFailed.has(column)) continue
    seen.add(column)
    out.add(SHEETS.exercises, exercise.row, column, issue.message)
  }
}

export function parseBlock(raw: RawBlock): ParseResult {
  const out = new Collector()

  const blockOk = checkHeaders(raw.block, SHEETS.block, [BLOCK_FIELD_COLUMN, BLOCK_VALUE_COLUMN], out)
  const exercisesOk = checkHeaders(raw.exercises, SHEETS.exercises, Object.values(EXERCISE_COLUMNS), out)
  const variantsOk = checkHeaders(raw.variants, SHEETS.variants, Object.values(VARIANT_COLUMNS), out)
  if (out.errors.length > 0 || !blockOk || !exercisesOk || !variantsOk) {
    return { block: null, errors: out.errors }
  }

  const head = parseBlockSheet(raw.block!, out)
  const variantsByKey = parseVariants(raw.variants!, out)
  const C = EXERCISE_COLUMNS
  const exercises: ParsedExercise[] = []
  const keys = new Map<string, number>()

  for (const row of raw.exercises!.rows) {
    if (isEmptyRow(row)) continue
    const before = out.errors.length
    const at = (field: string) => ({ sheet: SHEETS.exercises, row: row.row, field })
    const failedColumns = () =>
      new Set(out.errors.slice(before).filter((e) => e.sheet === SHEETS.exercises).map((e) => e.field))

    const key = text(row, C.key)
    if (!KEY_PATTERN.test(key)) {
      out.add(SHEETS.exercises, row.row, C.key, key === ''
        ? 'Jede Übung braucht einen Schlüssel.'
        : `„${key}": nur Buchstaben, Ziffern und Bindestrich, höchstens 40 Zeichen.`)
    } else if (keys.has(key)) {
      out.add(SHEETS.exercises, row.row, C.key, `„${key}" steht schon in Zeile ${keys.get(key)}.`)
    } else {
      keys.set(key, row.row)
    }

    const state = text(row, C.state)
    if (state !== '' && state !== ACTIVE && state !== WITHDRAWN) {
      out.add(SHEETS.exercises, row.row, C.state, `Nur „${ACTIVE}", „${WITHDRAWN}" oder leer.`)
    }
    const withdrawn = state === WITHDRAWN

    const difficultyCell = text(row, C.difficulty)
    let difficulty: DifficultyLevel = 'Mittel'
    if ((DIFFICULTY_LEVELS as readonly string[]).includes(difficultyCell)) {
      difficulty = difficultyCell as DifficultyLevel
    } else if (!withdrawn) {
      out.add(SHEETS.exercises, row.row, C.difficulty, `Nur ${DIFFICULTY_LEVELS.map((d) => `„${d}"`).join(', ')}.`)
    }

    const music = text(row, C.music)
    if (music !== '' && music !== 'ja' && music !== 'nein' && !withdrawn) {
      out.add(SHEETS.exercises, row.row, C.music, 'Nur „ja", „nein" oder leer.')
    }

    const notes = text(row, C.notes)
    const sourceCredit = text(row, C.sourceCredit)
    const reason = text(row, C.noVariantsReason)

    // Eine zurückgezogene Zeile braucht nur ihren Schlüssel — ihr Inhalt darf
    // bleiben, wie er ist, und wird nicht mehr geprüft.
    const muted = new Collector()
    const sink = withdrawn ? muted : out

    const exercise: ParsedExercise = {
      row: row.row,
      key,
      withdrawn,
      name: text(row, C.name),
      description: text(row, C.description),
      notes: notes === '' ? null : notes,
      sports: terms('sport', text(row, C.sports), at(C.sports), sink),
      ageGroups: terms('age_group', text(row, C.ageGroups), at(C.ageGroups), sink),
      phases: terms('phase', text(row, C.phases), at(C.phases), sink),
      difficulty,
      organizationForms: terms('organization_form', text(row, C.organizationForms), at(C.organizationForms), sink),
      duration: integer(text(row, C.duration), at(C.duration), sink) ?? 0,
      participantsMin: integer(text(row, C.participantsMin), at(C.participantsMin), sink),
      participantsMax: integer(text(row, C.participantsMax), at(C.participantsMax), sink),
      musicRequired: music === 'ja',
      materials: materials(text(row, C.materials), at(C.materials), sink),
      links: links(text(row, C.links)),
      sourceCredit: sourceCredit === '' ? null : sourceCredit,
      provenance: text(row, C.provenance),
      noVariantsReason: reason === '' ? null : reason,
      variants: variantsByKey.get(key) ?? [],
    }

    if (!withdrawn) {
      if (text(row, C.duration) === '') {
        out.add(SHEETS.exercises, row.row, C.duration, 'Die Dauer fehlt.')
      } else if (exercise.duration > 300 || (exercise.duration < 1 && !failedColumns().has(C.duration))) {
        out.add(SHEETS.exercises, row.row, C.duration, 'Zwischen 1 und 300 Minuten.')
      }
      if (exercise.provenance === '') {
        out.add(SHEETS.exercises, row.row, C.provenance, 'Woraus wurde die Übung gewonnen? Die Herkunft ist Pflicht.')
      }
      if (exercise.sourceCredit && exercise.sourceCredit.length > MAX_SOURCE_CREDIT) {
        out.add(SHEETS.exercises, row.row, C.sourceCredit, `Höchstens ${MAX_SOURCE_CREDIT} Zeichen.`)
      }
      if (
        exercise.phases.includes('Hauptteil') &&
        exercise.variants.length < 2 &&
        exercise.noVariantsReason === null
      ) {
        out.add(
          SHEETS.exercises,
          row.row,
          C.noVariantsReason,
          'Im Hauptteil gehören eine leichtere und eine schwerere Variante dazu — oder hier die Begründung, warum nicht.'
        )
      }
      checkAgainstForm(exercise, out, failedColumns())
    }

    exercises.push(exercise)
  }

  for (const [key, variants] of variantsByKey) {
    if (!keys.has(key)) {
      for (const variant of variants) {
        out.add(SHEETS.variants, variant.row, VARIANT_COLUMNS.exercise, `Eine Übung mit dem Schlüssel „${key}" gibt es im Block nicht.`)
      }
    }
  }

  if (exercises.length === 0) {
    out.add(SHEETS.exercises, 0, '—', 'Der Block enthält keine Übung.')
  }

  if (out.errors.length > 0) return { block: null, errors: out.errors }
  return { block: { ...head, exercises }, errors: [] }
}

/** Fehler zum Ausgeben, in der Reihenfolge der Tabelle. */
export function sortErrors(errors: ImportError[]): ImportError[] {
  const order: SheetName[] = [SHEETS.block, SHEETS.exercises, SHEETS.variants]
  return [...errors].sort(
    (a, b) => order.indexOf(a.sheet) - order.indexOf(b.sheet) || a.row - b.row
  )
}

export function describeError(error: ImportError): string {
  const where = error.row === 0 ? error.sheet : `${error.sheet}, Zeile ${error.row}`
  return `${where}, ${error.field}: ${error.message}`
}
