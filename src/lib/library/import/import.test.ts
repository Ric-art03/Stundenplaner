import { describe, expect, it } from 'vitest'
import {
  BLOCK_FIELD_COLUMN,
  BLOCK_VALUE_COLUMN,
  EXERCISE_COLUMNS as E,
  VARIANT_COLUMNS as V,
  type RawBlock,
  type RawRow,
} from './columns'
import { describeError, parseBlock, type ParsedBlock } from './parse'
import { diffBlock, toImportPayload, toSnapshot, type CurrentExercise } from './diff'
import { coverage, describeCoverage, parseTargets } from './coverage'

function rows(list: Record<string, string>[], start = 2): RawRow[] {
  return list.map((cells, i) => ({ row: start + i, cells }))
}

const EXERCISE: Record<string, string> = {
  [E.key]: 'KT-01',
  [E.name]: 'Feuer, Wasser, Sturm',
  [E.description]: 'Aufbau: freie Halle. Ablauf: auf Zuruf reagieren.',
  [E.notes]: '',
  [E.sports]: 'Kinderturnen; Kinderspiele',
  [E.ageGroups]: 'Kinder (4–6)',
  [E.phases]: 'Aufwärmen',
  [E.difficulty]: 'Leicht',
  [E.organizationForms]: 'Freie Verteilung (ganze Halle)',
  [E.duration]: '8',
  [E.participantsMin]: '6',
  [E.participantsMax]: '30',
  [E.music]: 'nein',
  [E.materials]: 'Ball 1 je TN; Hütchen 12',
  [E.links]: '',
  [E.sourceCredit]: '',
  [E.provenance]: 'Eigene Praxis',
  [E.state]: '',
  [E.noVariantsReason]: '',
}

function raw(
  exercises: Record<string, string>[] = [EXERCISE],
  variants: Record<string, string>[] = [],
  block: [string, string][] = [
    ['Name', 'Kinder 4–6, Aufwärmen'],
    ['Vorschau-Konten', 'trainer@example.org'],
  ]
): RawBlock {
  return {
    block: {
      headers: [BLOCK_FIELD_COLUMN, BLOCK_VALUE_COLUMN],
      rows: rows(block.map(([f, v]) => ({ [BLOCK_FIELD_COLUMN]: f, [BLOCK_VALUE_COLUMN]: v }))),
    },
    exercises: { headers: Object.values(E), rows: rows(exercises) },
    variants: { headers: Object.values(V), rows: rows(variants) },
  }
}

function errorsOf(input: RawBlock): string[] {
  const result = parseBlock(input)
  return result.errors.map(describeError)
}

describe('parseBlock — fehlerfreier Block', () => {
  it('liest Übung, Material in kurzer Schreibweise und Block-Angaben', () => {
    const result = parseBlock(raw())
    expect(result.errors).toEqual([])
    const block = result.block as ParsedBlock
    expect(block.name).toBe('Kinder 4–6, Aufwärmen')
    expect(block.previewEmails).toEqual(['trainer@example.org'])
    expect(block.exercises[0]).toMatchObject({
      key: 'KT-01',
      sports: ['Kinderturnen', 'Kinderspiele'],
      duration: 8,
      participantsMin: 6,
      participantsMax: 30,
      musicRequired: false,
      materials: [
        { name: 'Ball', quantity: 1, mode: 'pro Teilnehmer' },
        { name: 'Hütchen', quantity: 12, mode: 'insgesamt' },
      ],
    })
  })

  it('hängt Varianten an ihre Übung, „Ohne Material" als eigener Zustand', () => {
    const hauptteil = { ...EXERCISE, [E.phases]: 'Hauptteil' }
    const result = parseBlock(
      raw([hauptteil], [
        { [V.exercise]: 'KT-01', [V.title]: 'Leichter', [V.description]: 'Langsamer.', [V.materials]: 'Ohne Material' },
        { [V.exercise]: 'KT-01', [V.title]: 'Schwerer', [V.description]: 'Auf einem Bein.', [V.ageGroups]: 'Kinder (7–10)' },
      ])
    )
    expect(result.errors).toEqual([])
    const variants = result.block!.exercises[0].variants
    expect(variants.map((v) => v.title)).toEqual(['Leichter', 'Schwerer'])
    expect(variants[0].materials).toEqual([{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }])
    expect(variants[1].materials).toEqual([])
    expect(variants[1].ageGroups).toEqual(['Kinder (7–10)'])
  })

  it('verlangt bei einer zurückgezogenen Zeile nur den Schlüssel', () => {
    const result = parseBlock(raw([{ [E.key]: 'KT-09', [E.state]: 'zurückgezogen' }]))
    expect(result.errors).toEqual([])
    expect(result.block!.exercises[0].withdrawn).toBe(true)
  })
})

describe('parseBlock — Fehler mit Zeile und Spalte, nichts still korrigiert', () => {
  it('nennt unbekannte Sportart, Dauer 0 und falschen Modus — alle zugleich', () => {
    expect(
      errorsOf(raw([{ ...EXERCISE, [E.sports]: 'Capoeirax', [E.duration]: '0', [E.materials]: 'Ball 2 pro Kind' }]))
    ).toEqual([
      'Übungen, Zeile 2, Sportarten: „Capoeirax" ist kein Begriff des Grundstocks.',
      'Übungen, Zeile 2, Material: „Ball 2 pro Kind": „pro Kind" ist kein Modus — nur „je TN" oder nichts (= insgesamt).',
      'Übungen, Zeile 2, Dauer: Zwischen 1 und 300 Minuten.',
    ])
  })

  it('korrigiert keine Schreibweise, sondern nennt die richtige', () => {
    expect(errorsOf(raw([{ ...EXERCISE, [E.ageGroups]: 'kinder (4–6)', [E.materials]: 'ball 2' }]))).toEqual([
      'Übungen, Zeile 2, Altersgruppen: „kinder (4–6)" ist anders geschrieben als im Grundstock: „Kinder (4–6)".',
      'Übungen, Zeile 2, Material: „ball" ist anders geschrieben als im Grundstock: „Ball".',
    ])
  })

  it('verlangt Sportart, Altersgruppe, Phase und Herkunft', () => {
    const errors = errorsOf(
      raw([{ ...EXERCISE, [E.sports]: '', [E.ageGroups]: '', [E.phases]: '', [E.provenance]: '' }])
    )
    expect(errors).toEqual([
      'Übungen, Zeile 2, Herkunft: Woraus wurde die Übung gewonnen? Die Herkunft ist Pflicht.',
      'Übungen, Zeile 2, Sportarten: Mindestens eine Sportart auswählen',
      'Übungen, Zeile 2, Altersgruppen: Mindestens eine Altersgruppe auswählen',
      'Übungen, Zeile 2, Phasen: Mindestens eine Phase auswählen',
    ])
  })

  it('verlangt im Hauptteil zwei Varianten oder eine Begründung', () => {
    const hauptteil = { ...EXERCISE, [E.phases]: 'Hauptteil' }
    expect(errorsOf(raw([hauptteil]))).toEqual([
      'Übungen, Zeile 2, Ohne Varianten, weil: Im Hauptteil gehören eine leichtere und eine schwerere Variante dazu — oder hier die Begründung, warum nicht.',
    ])
    expect(errorsOf(raw([{ ...hauptteil, [E.noVariantsReason]: 'Spiel ohne Steigerung' }]))).toEqual([])
  })

  it('prüft mit den Grenzen des Übungsformulars', () => {
    expect(errorsOf(raw([{ ...EXERCISE, [E.name]: 'x'.repeat(101), [E.participantsMin]: '20', [E.participantsMax]: '10' }]))).toEqual([
      'Übungen, Zeile 2, Name: Maximal 100 Zeichen',
      'Übungen, Zeile 2, TN bis: Minimum muss kleiner oder gleich Maximum sein',
    ])
  })

  it('findet doppelte Schlüssel, verwaiste Varianten und fehlende Spalten', () => {
    expect(
      errorsOf(raw([EXERCISE, { ...EXERCISE, [E.name]: 'Andere' }], [
        { [V.exercise]: 'XX-99', [V.title]: 'T', [V.description]: 'D' },
      ]))
    ).toEqual([
      'Übungen, Zeile 3, Schlüssel: „KT-01" steht schon in Zeile 2.',
      'Varianten, Zeile 2, Übung: Eine Übung mit dem Schlüssel „XX-99" gibt es im Block nicht.',
    ])

    const broken = raw()
    broken.exercises = { headers: [...Object.values(E).filter((h) => h !== E.provenance), 'Herkunf'], rows: [] }
    expect(errorsOf(broken)).toEqual([
      'Übungen, Zeile 1, Herkunft: Die Spalte „Herkunft" fehlt.',
      'Übungen, Zeile 1, Herkunf: Unbekannte Spalte „Herkunf" — Tippfehler in der Überschrift?',
    ])
  })

  it('prüft das Blatt „Block"', () => {
    expect(errorsOf(raw([EXERCISE], [], [['Name', ''], ['Vorschau-Konten', 'keine-mail']]))).toEqual([
      'Block, Zeile 2, Name: Der Block braucht einen Namen.',
      'Block, Zeile 3, Vorschau-Konten: „keine-mail" ist keine E-Mail-Adresse.',
    ])
  })
})

describe('diffBlock', () => {
  const block = parseBlock(raw()).block!
  const snapshot = toSnapshot(block.exercises[0])

  function current(entries: [string, Partial<CurrentExercise>][]): Map<string, CurrentExercise> {
    return new Map(
      entries.map(([key, extra]) => [
        key,
        { snapshot: { ...snapshot, key }, status: 'released', blockName: block.name, ...extra } as CurrentExercise,
      ])
    )
  }

  it('erkennt Neues', () => {
    expect(diffBlock(block, new Map()).added).toEqual([{ key: 'KT-01', name: 'Feuer, Wasser, Sturm' }])
  })

  it('zeigt Änderungen Feld für Feld', () => {
    const diff = diffBlock(block, current([['KT-01', { snapshot: { ...snapshot, duration: 10, sports: ['Kinderturnen'] } }]]))
    expect(diff.changed).toEqual([
      {
        key: 'KT-01',
        name: 'Feuer, Wasser, Sturm',
        status: 'released',
        fields: [
          { label: 'Sportarten', before: 'Kinderturnen', after: 'Kinderturnen; Kinderspiele' },
          { label: 'Dauer', before: '10', after: '8' },
        ],
      },
    ])
    expect(diff.unchanged).toBe(0)
  })

  it('zählt Unverändertes und meldet, was in der Tabelle fehlt, ohne es zurückzuziehen', () => {
    const diff = diffBlock(block, current([['KT-01', {}], ['KT-07', {}]]))
    expect(diff.unchanged).toBe(1)
    expect(diff.missing).toEqual([{ key: 'KT-07', name: 'Feuer, Wasser, Sturm' }])
    expect(diff.withdrawn).toEqual([])
  })

  it('erkennt einen Schlüssel aus einem anderen Block', () => {
    expect(diffBlock(block, current([['KT-01', { blockName: 'Anderer Block' }]])).foreign).toEqual([
      { key: 'KT-01', blockName: 'Anderer Block' },
    ])
  })

  it('baut die Nutzlast für die Datenbank', () => {
    const payload = toImportPayload(block, ['00000000-0000-4000-8000-000000000001'])
    expect(payload.exercises[0]).toMatchObject({ key: 'KT-01', withdrawn: false, duration: 8 })
    expect(payload.preview_user_ids).toHaveLength(1)
  })
})

describe('coverage', () => {
  const base = toSnapshot(parseBlock(raw()).block!.exercises[0])

  it('zählt je Zielgruppe und Phase, Varianten-Altersgruppen eingeschlossen', () => {
    const { targets, errors } = parseTargets({
      headers: ['Sportart', 'Altersgruppen'],
      rows: rows([
        { Sportart: 'Kinderturnen', Altersgruppen: 'Kinder (4–6)' },
        { Sportart: 'Kinderturnen', Altersgruppen: 'Kinder (7–10)' },
      ]),
    })
    expect(errors).toEqual([])
    const library = [
      base,
      { ...base, key: 'b', phases: ['Hauptteil'], age_groups: ['Kinder (2–4)'], variants: [{ ...base.variants[0], title: 'v', description: 'd', materials: [], participants_min: null, participants_max: null, duration: null, age_groups: ['Kinder (7–10)'], organization_forms: [] }] },
    ]
    const result = coverage(targets, library)
    expect(describeCoverage(result[0])).toBe('· Kinderturnen, Kinder (4–6): Aufwärmen 1/3, Hauptteil 0/5, Cool-Down 0/3')
    expect(result[1].counts).toEqual({ 'Aufwärmen': 0, 'Hauptteil': 1, 'Cool-Down': 0 })
  })

  it('nennt Zielgruppen mit falschen Begriffen', () => {
    const { errors } = parseTargets({
      headers: ['Sportart', 'Altersgruppen'],
      rows: rows([{ Sportart: 'Kinderturnen', Altersgruppen: 'Kinder 4-6' }]),
    })
    expect(errors).toEqual(['Zeile 2: „Kinder 4-6" keine Altersgruppe des Grundstocks (oder anders geschrieben).'])
  })
})
