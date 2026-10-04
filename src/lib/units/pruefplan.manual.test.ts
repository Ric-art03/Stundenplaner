/**
 * TEMPORÄR — nicht Teil der Testsuite auf Dauer.
 *
 * Fährt den Prüfplan aus features/PROJ-6-einheiten-generator.md gegen die
 * echten 40 Testübungen in der Datenbank. Läuft nur mit Dienstschlüssel und
 * wird nach der Prüfung wieder entfernt.
 *
 * Aufruf: npx vitest run src/lib/units/pruefplan.manual.test.ts
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { buildCandidates, type Candidate, type CandidateSource } from './candidates'
import {
  generateUnitPlan,
  matchesAgeGroups,
  materialsAvailable,
  participantsFit,
  type GeneratorGroup,
} from './generator'
import { buildClassicSegments } from './timeline'
import type { DifficultyLevel } from '@/lib/types/exercise'
import type { SegmentConfig } from '@/lib/types/unit'

const ALL_DIFFICULTIES: DifficultyLevel[] = ['Leicht', 'Mittel', 'Schwer']

function env() {
  const text = readFileSync('.env.local', 'utf8')
  const vars: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) vars[match[1]] = match[2].trim()
  }
  return vars
}

const vars = env()
const supabase = createClient(
  vars.NEXT_PUBLIC_SUPABASE_URL,
  vars.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

interface RealGroup {
  id: string
  name: string
  sports: string[]
  primarySport: string | null
  generator: GeneratorGroup
  unitDuration: number
}

async function loadAll() {
  const { data: groupRows } = await supabase
    .from('groups')
    .select('id, name, sports, primary_sport, age_groups, participants, unit_duration, venue_id')
    .order('name')

  const venueIds = (groupRows ?? []).map((g) => g.venue_id).filter(Boolean)
  const { data: venueMaterialRows } = await supabase
    .from('venue_materials')
    .select('venue_id, name, quantity')
    .in('venue_id', venueIds)

  const groups: RealGroup[] = (groupRows ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    sports: g.sports as string[],
    primarySport: g.primary_sport,
    unitDuration: g.unit_duration,
    generator: {
      ageGroups: g.age_groups as string[],
      participants: g.participants,
      venueMaterials: g.venue_id
        ? (venueMaterialRows ?? [])
            .filter((m) => m.venue_id === g.venue_id)
            .map((m) => ({ name: m.name, quantity: m.quantity }))
        : null,
    },
  }))

  const userId = (
    await supabase.from('groups').select('user_id').eq('id', groups[0].id).single()
  ).data!.user_id

  const { data: exerciseRows } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId)

  const ids = (exerciseRows ?? []).map((e) => e.id)
  const [{ data: materialRows }, { data: variantRows }] = await Promise.all([
    supabase.from('exercise_materials').select('*').in('exercise_id', ids).order('sort_order'),
    supabase.from('exercise_variants').select('*').in('exercise_id', ids).order('sort_order'),
  ])

  const sources: CandidateSource[] = (exerciseRows ?? []).map((e) => ({
    id: e.id,
    name: e.name,
    phases: e.phases as string[],
    sports: e.sports as string[],
    difficulty: e.difficulty as DifficultyLevel,
    ageGroups: e.age_groups as string[],
    organizationForms: e.organization_forms as string[],
    duration: e.duration,
    participantsMin: e.participants_min,
    participantsMax: e.participants_max,
    materials: (materialRows ?? [])
      .filter((m) => m.exercise_id === e.id)
      .map((m) => ({ name: m.name, quantity: m.quantity, mode: m.mode })),
    variants: (variantRows ?? [])
      .filter((v) => v.exercise_id === e.id)
      .map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        materials: v.materials ?? [],
        participantsMin: v.participants_min,
        participantsMax: v.participants_max,
        duration: v.duration,
        ageGroups: (v.age_groups as string[]) ?? [],
        organizationForms: (v.organization_forms as string[]) ?? [],
      })),
  }))

  return { groups, sources, candidates: buildCandidates(sources) }
}

const data = await loadAll()

function label(candidate: Candidate): string {
  return candidate.variantTitle ? `${candidate.name} → ${candidate.variantTitle}` : candidate.name
}

/** Harte, segmentunabhängige Kriterien: Alter, Material, Teilnehmerzahl. */
function availableFor(candidate: Candidate, group: GeneratorGroup): boolean {
  return (
    matchesAgeGroups(candidate, group.ageGroups) &&
    materialsAvailable(candidate, group) &&
    participantsFit(candidate, group.participants)
  )
}

function find(name: string, variantTitle: string | null = null): Candidate | undefined {
  return data.candidates.find(
    (c) => c.name === name && (c.variantTitle ?? null) === variantTitle
  )
}

function groupByName(part: string): RealGroup {
  const group = data.groups.find((g) => g.name.includes(part))
  if (!group) throw new Error(`Gruppe "${part}" nicht gefunden`)
  return group
}

function segmentsFor(group: RealGroup): SegmentConfig[] {
  return buildClassicSegments(
    group.unitDuration,
    group.sports,
    ALL_DIFFICULTIES,
    group.primarySport
  )
}

function report(title: string, lines: string[]) {
  console.log(`\n### ${title}\n${lines.map((l) => `  ${l}`).join('\n')}`)
}

describe('Prüfplan — Bestandsaufnahme', () => {
  it('zeigt Gruppen und Pool', () => {
    report(
      'Grunddaten',
      [
        `Kandidaten gesamt: ${data.candidates.length} (${data.sources.length} Übungen + ${data.candidates.length - data.sources.length} Varianten)`,
        ...data.groups.map(
          (g) =>
            `${g.name}: ${g.unitDuration} Min, ${g.generator.participants} TN, Halle ${g.generator.venueMaterials ? `${g.generator.venueMaterials.length} Materialzeilen` : 'keine'}, Hauptsportart ${g.primarySport ?? '—'}, verwendbar ${data.candidates.filter((c) => availableFor(c, g.generator)).length}`
        ),
      ]
    )
    expect(data.candidates.length).toBeGreaterThan(40)
  })
})

describe('Prüffall 1–6: harte Kriterien', () => {
  it('1 — Material fehlt in der Halle', () => {
    const cases: [string, string][] = [
      ['Schwungtuch-Wellen', 'Vorschulturnen'],
      ['Partnerakrobatik Grundformen', 'Capoeira'],
      ['Seilsprung-Intervalle', 'Capoeira'],
    ]
    const lines: string[] = []
    for (const [name, groupPart] of cases) {
      const candidate = find(name)
      if (!candidate) { lines.push(`${name}: NICHT GEFUNDEN`); continue }
      const group = groupByName(groupPart)
      const ok = materialsAvailable(candidate, group.generator)
      lines.push(`${name} (${group.name}): ${ok ? 'FEHLER — durchgelassen' : 'korrekt ausgeschlossen'}`)
      expect(ok).toBe(false)
    }
    report('1 — Material fehlt', lines)
  })

  it('2 — Material „pro Teilnehmer" übersteigt den Bestand', () => {
    const candidate = find('Weichboden-Sprungfest')
    const group = groupByName('Vorschulturnen')
    expect(candidate).toBeDefined()
    const ok = materialsAvailable(candidate!, group.generator)
    report('2 — pro Teilnehmer', [
      `Weichboden-Sprungfest: ${JSON.stringify(candidate!.materials)}`,
      `Gruppe ${group.generator.participants} TN → ${ok ? 'FEHLER — durchgelassen' : 'korrekt ausgeschlossen'}`,
    ])
    expect(ok).toBe(false)
  })

  it('3 — Material „insgesamt" übersteigt den Bestand knapp', () => {
    const candidate = find('Bank-Sprungkraft')
    const group = groupByName('Capoeira')
    expect(candidate).toBeDefined()
    const ok = materialsAvailable(candidate!, group.generator)
    report('3 — knapp zu wenig', [
      `Bank-Sprungkraft: ${JSON.stringify(candidate!.materials)} → ${ok ? 'FEHLER' : 'korrekt ausgeschlossen'}`,
    ])
    expect(ok).toBe(false)
  })

  it('4 — Material trifft die Grenze exakt', () => {
    const candidate = find('Reifen-Hausbau')
    const group = groupByName('Vorschulturnen')
    expect(candidate).toBeDefined()
    const ok = materialsAvailable(candidate!, group.generator)
    report('4 — exakte Grenze', [
      `Reifen-Hausbau: ${JSON.stringify(candidate!.materials)} × ${group.generator.participants} TN → ${ok ? 'korrekt zugelassen' : 'FEHLER — ausgeschlossen'}`,
    ])
    expect(ok).toBe(true)
  })

  it('5 — Teilnehmer-Obergrenze unter der Gruppengröße', () => {
    const candidate = find('Bockspringen für Kleine')
    const group = groupByName('Vorschulturnen')
    expect(candidate).toBeDefined()
    const ok = participantsFit(candidate!, group.generator.participants)
    report('5 — TN-Obergrenze', [
      `Bockspringen für Kleine: max ${candidate!.participantsMax} bei ${group.generator.participants} TN → ${ok ? 'FEHLER' : 'korrekt ausgeschlossen'}`,
    ])
    expect(ok).toBe(false)
  })

  it('6 — Übungen ohne Material kommen immer durch', () => {
    const withoutMaterial = data.candidates.filter((c) => c.materials.length === 0)
    const blocked = withoutMaterial.filter(
      (c) => !materialsAvailable(c, groupByName('Capoeira').generator)
    )
    report('6 — ohne Material', [
      `${withoutMaterial.length} Kandidaten ohne Material, davon am Material gescheitert: ${blocked.length}`,
    ])
    expect(blocked).toHaveLength(0)
  })
})

describe('Prüffall 7–9: Varianten', () => {
  it('7/9 — Variante rettet über Material und ersetzt die Liste', () => {
    const lines: string[] = []
    const cases: [string, string, string][] = [
      ['Weichboden-Sprungfest', 'Mit Turnmatten statt Weichböden', 'Vorschulturnen'],
      ['Schwungtuch-Wellen', 'Mit Tüchern statt Schwungtuch', 'Vorschulturnen'],
    ]
    for (const [name, variantTitle, groupPart] of cases) {
      const main = find(name)
      const variant = find(name, variantTitle)
      const group = groupByName(groupPart)
      if (!main || !variant) {
        lines.push(`${name} → ${variantTitle}: NICHT GEFUNDEN`)
        continue
      }
      const mainOk = materialsAvailable(main, group.generator)
      const variantOk = materialsAvailable(variant, group.generator)
      lines.push(
        `${name}: Haupt ${mainOk ? 'durch' : 'aus'} ${JSON.stringify(main.materials.map((m) => m.name))} | Variante ${variantOk ? 'durch' : 'aus'} ${JSON.stringify(variant.materials.map((m) => m.name))}`
      )
      expect(mainOk).toBe(false)
      expect(variantOk).toBe(true)
      // Regel A: das Material der Hauptübung darf nicht mitkommen.
      for (const material of main.materials) {
        expect(variant.materials.some((m) => m.name === material.name)).toBe(false)
      }
    }
    report('7/9 — Variante rettet über Material', lines)
  })

  it('8 — Variante rettet über die Teilnehmerzahl', () => {
    const main = find('Bockspringen für Kleine')
    const variant = find('Bockspringen für Kleine', 'In zwei Gruppen mit Wartestation')
    const group = groupByName('Vorschulturnen')
    expect(main).toBeDefined()
    expect(variant).toBeDefined()
    const mainOk = participantsFit(main!, group.generator.participants)
    const variantOk = participantsFit(variant!, group.generator.participants)
    report('8 — Variante rettet über TN', [
      `Haupt max ${main!.participantsMax} → ${mainOk ? 'durch' : 'aus'}`,
      `Variante max ${variant!.participantsMax} → ${variantOk ? 'durch' : 'aus'}`,
    ])
    expect(mainOk).toBe(false)
    expect(variantOk).toBe(true)
  })
})

describe('Prüffall 10–15: Generatorverhalten', () => {
  it('erzeugt für beide Gruppen eine vollständige Standard-Einheit', () => {
    for (const group of data.groups) {
      const segments = segmentsFor(group)
      const plan = generateUnitPlan({
        group: group.generator,
        segments,
        candidates: data.candidates,
        recentExerciseIds: [],
        seed: 4711,
        relax: false,
      })

      const lines: string[] = []
      for (const entry of plan.segments) {
        const filled = entry.items.reduce((s, i) => s + i.plannedDuration, 0)
        lines.push(
          `${entry.segment.name} (${entry.segment.minutes} Min): ${filled} Min gefüllt, ${entry.items.length} Übungen`
        )
        for (const item of entry.items) {
          const candidate = data.candidates.find(
            (c) => c.exerciseId === item.exerciseId && c.variantId === item.variantId
          )!
          lines.push(
            `   · ${item.plannedDuration} Min (geschätzt ${candidate.duration}) — ${label(candidate)} [${candidate.sports.join(', ')}]`
          )
        }
        if (entry.gapReason) lines.push(`   ⚠ ${entry.gapReason}`)
      }
      report(`Einheit „${group.name}"`, lines)

      // 14 — Dauer-Anpassung höchstens ±25 %
      for (const entry of plan.segments) {
        for (const item of entry.items) {
          const candidate = data.candidates.find(
            (c) => c.exerciseId === item.exerciseId && c.variantId === item.variantId
          )!
          expect(item.plannedDuration).toBeGreaterThanOrEqual(Math.ceil(candidate.duration * 0.75))
          expect(item.plannedDuration).toBeLessThanOrEqual(Math.floor(candidate.duration * 1.25))
        }
      }

      // Keine Dopplung, kein Überlauf, nur zulässige Kandidaten
      const used = plan.segments.flatMap((s) => s.items.map((i) => i.exerciseId))
      expect(new Set(used).size).toBe(used.length)
      for (const entry of plan.segments) {
        const filled = entry.items.reduce((s, i) => s + i.plannedDuration, 0)
        expect(filled).toBeLessThanOrEqual(entry.segment.minutes)
        for (const item of entry.items) {
          const candidate = data.candidates.find(
            (c) => c.exerciseId === item.exerciseId && c.variantId === item.variantId
          )!
          expect(availableFor(candidate, group.generator)).toBe(true)
          expect(candidate.phases).toContain(entry.segment.name)
        }
      }
    }
  })

  it('11/12 — Sportart-Rotation und Gewichtung der Hauptsportart', () => {
    const group = groupByName('Capoeira')
    const segments = segmentsFor(group)
    const lines: string[] = [`Sportarten: ${group.sports.join(', ')} | Hauptsportart: ${group.primarySport}`]

    for (const seed of [1, 2, 3, 4, 5]) {
      const plan = generateUnitPlan({
        group: group.generator,
        segments,
        candidates: data.candidates,
        recentExerciseIds: [],
        seed,
        relax: false,
      })
      const main = plan.segments[1]
      const sportsPerItem = main.items.map((item) => {
        const candidate = data.candidates.find(
          (c) => c.exerciseId === item.exerciseId && c.variantId === item.variantId
        )!
        return candidate.sports.includes(group.primarySport!) ? '★' : '·'
      })
      lines.push(
        `Startwert ${seed}: Hauptteil ${main.items.length} Übungen — ${sportsPerItem.join('')} (★ = Hauptsportart)`
      )
    }
    report('11/12 — Rotation und Gewichtung', lines)
  })

  it('13 — Frische-Regel über drei Einheiten', () => {
    const group = groupByName('Vorschulturnen')
    const segments = segmentsFor(group)
    const history: string[][] = []
    const lines: string[] = []

    for (let round = 1; round <= 3; round += 1) {
      const recent = history.slice(-2).flat()
      const plan = generateUnitPlan({
        group: group.generator,
        segments,
        candidates: data.candidates,
        recentExerciseIds: recent,
        seed: 1000 + round,
        relax: false,
      })
      const used = plan.segments.flatMap((s) => s.items.map((i) => i.exerciseId))
      const repeats = used.filter((id) => recent.includes(id)).length
      lines.push(
        `Einheit ${round}: ${used.length} Übungen, davon ${repeats} aus den letzten zwei Einheiten`
      )
      history.push(used)
    }
    report('13 — Frische-Regel', lines)
    expect(history).toHaveLength(3)
  })

  it('16 — Aufschlüsselung aller Ursachen an echten Daten', () => {
    const group = groupByName('Vorschulturnen')
    const cases: [string, Partial<SegmentConfig>][] = [
      ['Eigene, unbelegte Phase', { name: 'Hauptteil 2' }],
      ['Nur eine fremde Sportart', { name: 'Hauptteil', sports: ['Handball'] }],
      ['Nur Schwierigkeitsgrad Schwer', { name: 'Hauptteil', difficulties: ['Schwer'] }],
      ['Sehr kurzes Segment', { name: 'Hauptteil', minutes: 3 }],
    ]
    const lines: string[] = []
    for (const [title, overrides] of cases) {
      const plan = generateUnitPlan({
        group: group.generator,
        segments: [{
          id: 's1', name: 'Hauptteil', minutes: 60, fillMode: 'generate',
          sports: group.sports, primarySport: null,
          difficulties: ALL_DIFFICULTIES, notes: '', ...overrides,
        }],
        candidates: data.candidates,
        recentExerciseIds: [],
        seed: 7,
        relax: false,
      })
      const entry = plan.segments[0]
      lines.push(title + ':')
      lines.push('   ' + (entry.gapReason ?? 'keine Lücke'))
      for (const b of entry.gapDetail?.blockedBy ?? []) {
        lines.push('     · ' + b.count + ' an ' + b.criterion)
      }
    }
    report('16 — Aufschlüsselung aller Ursachen', lines)
    expect(lines.length).toBeGreaterThan(0)
  })
  it('15 — Lücke mit Begründung bei einer unbelegten eigenen Phase', () => {
    const group = groupByName('Vorschulturnen')
    const plan = generateUnitPlan({
      group: group.generator,
      segments: [
        {
          id: 's1',
          name: 'Wettkampfspiel',
          minutes: 60,
          fillMode: 'generate',
          sports: group.sports,
          primarySport: null,
          difficulties: ALL_DIFFICULTIES,
          notes: '',
        },
      ],
      candidates: data.candidates,
      recentExerciseIds: [],
      seed: 7,
      relax: false,
    })
    report('15 — Lücke mit Begründung', [
      `Einträge: ${plan.segments[0].items.length}`,
      `Grund: ${plan.segments[0].gapReason}`,
    ])
    expect(plan.segments[0].items).toHaveLength(0)
    expect(plan.segments[0].gapReason).toContain('Wettkampfspiel')
  })

  it('Performance: unter 2 Sekunden', () => {
    const group = groupByName('Capoeira')
    const segments = segmentsFor(group)
    const started = Date.now()
    for (let i = 0; i < 20; i += 1) {
      generateUnitPlan({
        group: group.generator,
        segments,
        candidates: data.candidates,
        recentExerciseIds: [],
        seed: i,
        relax: true,
      })
    }
    const elapsed = Date.now() - started
    report('Performance', [
      `20 Durchläufe über ${data.candidates.length} Kandidaten: ${elapsed} ms (${Math.round(elapsed / 20)} ms je Einheit)`,
    ])
    expect(elapsed / 20).toBeLessThan(2000)
  })
})
