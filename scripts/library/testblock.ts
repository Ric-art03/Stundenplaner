import { EXERCISE_COLUMNS as E, VARIANT_COLUMNS as V } from '@/lib/library/import/columns'
import type { TemplateContent } from './xlsx'

/**
 * Der Testblock für die Browser-Tests (PROJ-4, Tech Design D): erfundene
 * Übungen, **nie freigegeben**, sichtbar nur für das Testkonto. Die Tests
 * laufen gegen dieselbe Datenbank wie die Produktion — kein echter Nutzer darf
 * diese Übungen sehen.
 *
 * Die Fälle decken „Passt zu Gruppe" ab: passt ohne Material, scheitert an
 * Material mit passender Variante, scheitert an der Teilnehmerzahl, trägt eine
 * Quellenangabe, gehört zu einer anderen Sportart.
 */

export const TEST_BLOCK_NAME = 'E2E-Testblock (nie freigeben)'
export const TEST_ACCOUNT = 'humpert263+test1@gmail.com'

function row(columns: readonly string[], values: Record<string, string>): string[] {
  return columns.map((column) => values[column] ?? '')
}

const exerciseColumns = Object.values(E)
const variantColumns = Object.values(V)

const exercises: Record<string, string>[] = [
  {
    [E.key]: 'E2E-01', [E.name]: 'E2E Fangspiel', [E.description]: 'Aufbau: freie Halle. Ablauf: Ein Kind fängt, gefangene Kinder bleiben stehen, bis sie befreit werden.',
    [E.sports]: 'Kinderturnen', [E.ageGroups]: 'Kinder (4–6)', [E.phases]: 'Aufwärmen', [E.difficulty]: 'Leicht',
    [E.organizationForms]: 'Freie Verteilung (ganze Halle)', [E.duration]: '8', [E.provenance]: 'Erfunden für Tests',
  },
  {
    [E.key]: 'E2E-02', [E.name]: 'E2E Bockspringen', [E.description]: 'Aufbau: Bock mit Matte dahinter. Ablauf: anlaufen, abdrücken, über den Bock grätschen. Sicherheit: Hilfestellung neben dem Bock.',
    [E.sports]: 'Kinderturnen', [E.ageGroups]: 'Kinder (4–6)', [E.phases]: 'Hauptteil', [E.difficulty]: 'Mittel',
    [E.organizationForms]: 'Reihe / Gasse', [E.duration]: '15', [E.materials]: 'Bock 1; Turnmatte 2', [E.provenance]: 'Erfunden für Tests',
  },
  {
    [E.key]: 'E2E-03', [E.name]: 'E2E Ballstaffel', [E.description]: 'Aufbau: zwei Reihen. Ablauf: Ball über Kopf nach hinten geben, die letzte Person läuft nach vorn.',
    [E.sports]: 'Kinderturnen', [E.ageGroups]: 'Kinder (4–6)', [E.phases]: 'Hauptteil', [E.difficulty]: 'Leicht',
    [E.organizationForms]: 'Reihe / Gasse', [E.duration]: '12', [E.participantsMin]: '4', [E.participantsMax]: '12',
    [E.materials]: 'Ball 2', [E.provenance]: 'Erfunden für Tests',
  },
  {
    [E.key]: 'E2E-04', [E.name]: 'E2E Entspannungsreise', [E.description]: 'Aufbau: Matten im Kreis. Ablauf: auf dem Rücken liegen, eine kurze Geschichte hören, ruhig atmen.',
    [E.sports]: 'Kinderturnen; Gymnastik', [E.ageGroups]: 'Kinder (4–6); Kinder (7–10)', [E.phases]: 'Cool-Down', [E.difficulty]: 'Leicht',
    [E.organizationForms]: 'Kreis', [E.duration]: '6', [E.materials]: 'Yoga-Matte 1 je TN',
    [E.links]: 'Beispielquelle | https://example.org/entspannung', [E.sourceCredit]: 'Nach einer Idee aus „Beispielquelle", CC BY 4.0',
    [E.provenance]: 'Erfunden für Tests',
  },
  {
    [E.key]: 'E2E-05', [E.name]: 'E2E Pritschen an der Wand', [E.description]: 'Aufbau: je Person ein Ball, Abstand zur Wand zwei Meter. Ablauf: gegen die Wand pritschen.',
    [E.sports]: 'Volleyball', [E.ageGroups]: 'Jugend (11–14)', [E.phases]: 'Hauptteil', [E.difficulty]: 'Mittel',
    [E.organizationForms]: 'Reihe / Gasse', [E.duration]: '10', [E.materials]: 'Ball 1 je TN',
    [E.provenance]: 'Erfunden für Tests', [E.noVariantsReason]: 'Testübung',
  },
]

const variants: Record<string, string>[] = [
  { [V.exercise]: 'E2E-02', [V.title]: 'Ohne Bock (leichter)', [V.description]: 'Über eine gerollte Matte springen.', [V.materials]: 'Turnmatte 2' },
  { [V.exercise]: 'E2E-02', [V.title]: 'Mit längerem Anlauf (schwerer)', [V.description]: 'Anlauf verlängern, höher abspringen.' },
  { [V.exercise]: 'E2E-03', [V.title]: 'Im Sitzen (leichter)', [V.description]: 'Im Sitzen weitergeben.' },
  { [V.exercise]: 'E2E-03', [V.title]: 'Mit zwei Bällen (schwerer)', [V.description]: 'Zwei Bälle zugleich in der Reihe.', [V.materials]: 'Ball 4' },
]

export const TEST_BLOCK: TemplateContent = {
  blockName: TEST_BLOCK_NAME,
  previewAccounts: TEST_ACCOUNT,
  sourcesNote: 'Erfundene Testübungen, keine fremde Quelle.',
  exercises: exercises.map((e) => row(exerciseColumns, e)),
  variants: variants.map((v) => row(variantColumns, v)),
}

export const EMPTY_TEMPLATE: TemplateContent = {
  blockName: '',
  previewAccounts: '',
  sourcesNote: '',
  exercises: [],
  variants: [],
}
