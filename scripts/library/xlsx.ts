import ExcelJS from 'exceljs'
import {
  BLOCK_FIELD_COLUMN,
  BLOCK_FIELDS,
  BLOCK_VALUE_COLUMN,
  EXERCISE_COLUMNS,
  SHEETS,
  VARIANT_COLUMNS,
  type RawBlock,
  type RawSheet,
} from '@/lib/library/import/columns'
import { COVERAGE_COLUMNS, COVERAGE_SHEET } from '@/lib/library/import/coverage'

/** Lesen und Schreiben der Block-Tabellen (.xlsx). Inhaltlich geprüft wird woanders. */

function sheetToRaw(sheet: ExcelJS.Worksheet | undefined): RawSheet | null {
  if (!sheet) return null
  const headerRow = sheet.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, column) => {
    headers[column - 1] = cell.text.trim()
  })
  const rows: RawSheet['rows'] = []
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r)
    const cells: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (header) cells[header] = row.getCell(index + 1).text ?? ''
    })
    rows.push({ row: r, cells })
  }
  return { headers: headers.map((h) => h ?? ''), rows }
}

export async function readBlock(file: string): Promise<RawBlock> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file)
  return {
    block: sheetToRaw(workbook.getWorksheet(SHEETS.block)),
    exercises: sheetToRaw(workbook.getWorksheet(SHEETS.exercises)),
    variants: sheetToRaw(workbook.getWorksheet(SHEETS.variants)),
  }
}

export async function readTargets(file: string): Promise<RawSheet | null> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(file)
  return sheetToRaw(workbook.getWorksheet(COVERAGE_SHEET))
}

function addSheet(workbook: ExcelJS.Workbook, name: string, headers: string[], rows: string[][], widths: number[]) {
  const sheet = workbook.addWorksheet(name, { views: [{ state: 'frozen', ySplit: 1 }] })
  sheet.addRow(headers).font = { bold: true }
  for (const row of rows) sheet.addRow(row)
  headers.forEach((_, i) => {
    const column = sheet.getColumn(i + 1)
    column.width = widths[i] ?? 18
    column.alignment = { vertical: 'top', wrapText: true }
  })
}

const HINTS = [
  'So wird ein Block ausgefüllt',
  '',
  'Listen (Sportarten, Altersgruppen, Phasen, Organisationsformen) mit Semikolon trennen: „Kinderturnen; Gymnastik".',
  'Nur Begriffe des Grundstocks, genau so geschrieben wie in der App. Abweichungen meldet das Prüfprogramm, es korrigiert nichts.',
  'Material: „Ball 1 je TN; Hütchen 12" — „je TN" heißt pro Teilnehmer, ohne Zusatz insgesamt.',
  'Material einer Variante: leer = wie die Übung, „Ohne Material" = braucht keins, sonst die eigene Liste.',
  'Links: „Titel | https://…" oder nur die Adresse; mehrere mit Semikolon.',
  'Musik: ja oder nein. Zustand: leer, „aktiv" oder „zurückgezogen".',
  'Schlüssel: fest je Übung (z. B. „KT-07"), nie ändern — darüber findet ein erneutes Einlesen die Übung wieder.',
  'Herkunft: Pflicht. Woraus die Übung gewonnen wurde. Bleibt in der Tabelle, wird nicht angezeigt.',
  'Quellenangabe: nur wo eine Lizenz Namensnennung verlangt (z. B. CC BY). Wird an der Übung angezeigt und geht beim Übernehmen mit.',
  'Hauptteil: eine leichtere und eine schwerere Variante — oder „Ohne Varianten, weil" ausfüllen.',
  'Varianten stehen auf dem Blatt „Varianten", je Zeile eine, mit dem Schlüssel ihrer Übung.',
  'Eine Zeile löschen zieht nichts zurück. Zurückziehen nur über „Zustand: zurückgezogen".',
]

export interface TemplateContent {
  blockName: string
  previewAccounts: string
  sourcesNote: string
  exercises: string[][]
  variants: string[][]
}

/** Eine Block-Tabelle schreiben — leer als Vorlage oder gefüllt (Testblock). */
export async function writeBlock(file: string, content: TemplateContent) {
  const workbook = new ExcelJS.Workbook()
  addSheet(
    workbook,
    SHEETS.block,
    [BLOCK_FIELD_COLUMN, BLOCK_VALUE_COLUMN],
    [
      [BLOCK_FIELDS.name, content.blockName],
      [BLOCK_FIELDS.previewAccounts, content.previewAccounts],
      [BLOCK_FIELDS.sourcesNote, content.sourcesNote],
    ],
    [20, 70]
  )
  addSheet(workbook, SHEETS.exercises, Object.values(EXERCISE_COLUMNS), content.exercises, [
    10, 28, 60, 30, 26, 26, 16, 12, 26, 8, 8, 8, 8, 30, 30, 30, 30, 12, 26,
  ])
  addSheet(workbook, SHEETS.variants, Object.values(VARIANT_COLUMNS), content.variants, [
    10, 28, 60, 30, 8, 8, 8, 26, 26,
  ])
  const hints = workbook.addWorksheet('Hinweise')
  for (const line of HINTS) hints.addRow([line])
  hints.getColumn(1).width = 120
  hints.getRow(1).font = { bold: true }
  await workbook.xlsx.writeFile(file)
}

export async function writeTargetsTemplate(file: string) {
  const workbook = new ExcelJS.Workbook()
  addSheet(workbook, COVERAGE_SHEET, [COVERAGE_COLUMNS.sport, COVERAGE_COLUMNS.ageGroups], [
    ['Kinderturnen', 'Kinder (4–6)'],
  ], [26, 50])
  await workbook.xlsx.writeFile(file)
}
