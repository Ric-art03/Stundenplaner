import { readFileSync } from 'node:fs'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { describeError, parseBlock, sortErrors, type ParsedBlock } from '@/lib/library/import/parse'
import {
  diffBlock,
  hasChanges,
  toImportPayload,
  type BlockDiff,
  type CurrentExercise,
  type LibrarySnapshot,
  type LibraryStatus,
} from '@/lib/library/import/diff'
import { coverage, describeCoverage, parseTargets } from '@/lib/library/import/coverage'
import { readBlock, readTargets, writeBlock, writeTargetsTemplate } from './xlsx'
import { EMPTY_TEMPLATE, TEST_BLOCK } from './testblock'

/**
 * Das Prüfprogramm der Übungsdatenbank (PROJ-4). Ohne Verwaltungsbildschirm:
 * Blöcke kommen als Tabelle, werden geprüft, als Entwurf eingelesen und
 * freigegeben. Was in die Datenbank schreibt, tut es nur mit `--ja`.
 *
 *   npm run bestand -- pruefen    <block.xlsx>
 *   npm run bestand -- einlesen   <block.xlsx> [--ja]
 *   npm run bestand -- freigeben  <block.xlsx> [--ja]
 *   npm run bestand -- abdeckung  <zielgruppen.xlsx> [--mit-entwuerfen]
 *   npm run bestand -- vorlage    <ziel.xlsx>
 *   npm run bestand -- zielgruppen-vorlage <ziel.xlsx>
 *   npm run bestand -- testblock  <ziel.xlsx>
 */

type Db = SupabaseClient

function env(): Record<string, string> {
  const vars: Record<string, string> = {}
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match) vars[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
  }
  return vars
}

/** Mit dem Dienstschlüssel — er bleibt auf diesem Rechner. */
function database(): Db {
  const vars = env()
  if (!vars.NEXT_PUBLIC_SUPABASE_URL || !vars.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('In .env.local fehlen NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY.')
  }
  return createClient(vars.NEXT_PUBLIC_SUPABASE_URL, vars.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  })
}

// ---- Datenbank lesen ----

interface ExerciseRow {
  id: string
  key: string
  name: string
  description: string
  notes: string | null
  sports: string[]
  age_groups: string[]
  phases: string[]
  difficulty: string
  organization_forms: string[]
  duration: number
  participants_min: number | null
  participants_max: number | null
  music_required: boolean
  source_credit: string | null
  status: LibraryStatus
  library_blocks: { name: string } | null
}

/** Dieselbe Gestalt und Reihenfolge wie `toSnapshot`, damit der Vergleich stimmt. */
async function snapshots(db: Db, rows: ExerciseRow[]): Promise<Map<string, CurrentExercise>> {
  const ids = rows.map((r) => r.id)
  const result = new Map<string, CurrentExercise>()
  if (ids.length === 0) return result

  const [materials, variants, links] = await Promise.all([
    db.from('library_exercise_materials').select('*').in('exercise_id', ids).order('sort_order'),
    db.from('library_exercise_variants').select('*').in('exercise_id', ids).order('sort_order'),
    db.from('library_exercise_links').select('*').in('exercise_id', ids).order('sort_order'),
  ])
  for (const res of [materials, variants, links]) if (res.error) throw new Error(res.error.message)

  const material = (m: { name: string; quantity: number; mode: string }) => ({ name: m.name, quantity: m.quantity, mode: m.mode })
  for (const row of rows) {
    const snapshot: LibrarySnapshot = {
      key: row.key,
      name: row.name,
      description: row.description,
      notes: row.notes,
      sports: row.sports,
      age_groups: row.age_groups,
      phases: row.phases,
      difficulty: row.difficulty,
      organization_forms: row.organization_forms,
      duration: row.duration,
      participants_min: row.participants_min,
      participants_max: row.participants_max,
      music_required: row.music_required,
      source_credit: row.source_credit,
      materials: (materials.data ?? []).filter((m) => m.exercise_id === row.id).map(material),
      variants: (variants.data ?? [])
        .filter((v) => v.exercise_id === row.id)
        .map((v) => ({
          title: v.title,
          description: v.description,
          materials: (v.materials ?? []).map(material),
          participants_min: v.participants_min,
          participants_max: v.participants_max,
          duration: v.duration,
          age_groups: v.age_groups,
          organization_forms: v.organization_forms,
        })),
      links: (links.data ?? []).filter((l) => l.exercise_id === row.id).map((l) => ({ url: l.url, title: l.title })),
    }
    result.set(row.key, { snapshot, status: row.status, blockName: row.library_blocks?.name ?? '' })
  }
  return result
}

const ROW_SELECT = '*, library_blocks(name)'

/** Alles mit einem Schlüssel aus der Tabelle, dazu alles, was der Block schon hat. */
async function loadCurrent(db: Db, block: ParsedBlock): Promise<Map<string, CurrentExercise>> {
  const keys = block.exercises.map((e) => e.key)
  const [byKey, byBlock] = await Promise.all([
    db.from('library_exercises').select(ROW_SELECT).in('key', keys),
    db.from('library_exercises').select('*, library_blocks!inner(name)').eq('library_blocks.name', block.name),
  ])
  if (byKey.error) throw new Error(byKey.error.message)
  if (byBlock.error) throw new Error(byBlock.error.message)
  const rows = new Map<string, ExerciseRow>()
  for (const row of [...(byKey.data ?? []), ...(byBlock.data ?? [])] as ExerciseRow[]) rows.set(row.id, row)
  return snapshots(db, [...rows.values()])
}

/** E-Mail → Konto. Unbekannte Adressen sind ein Fehler, keine stille Lücke. */
async function resolveAccounts(db: Db, emails: string[]): Promise<{ ids: string[]; unknown: string[] }> {
  const found = new Map<string, string>()
  for (let page = 1; page < 50; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    for (const user of data.users) if (user.email) found.set(user.email.toLowerCase(), user.id)
    if (data.users.length < 1000) break
  }
  return {
    ids: emails.filter((e) => found.has(e)).map((e) => found.get(e)!),
    unknown: emails.filter((e) => !found.has(e)),
  }
}

async function currentPreview(db: Db, name: string): Promise<string[] | null> {
  const { data } = await db.from('library_blocks').select('preview_user_ids').eq('name', name).maybeSingle()
  return data ? (data.preview_user_ids as string[]) : null
}

// ---- Ausgabe ----

function printDiff(diff: BlockDiff) {
  const list = (title: string, items: { key: string; name: string }[]) => {
    if (items.length === 0) return
    console.log(`\n${title} (${items.length}):`)
    for (const item of items) console.log(`  ${item.key}  ${item.name}`)
  }
  list('Neu — kommt als Entwurf', diff.added)
  if (diff.changed.length > 0) {
    console.log(`\nGeändert (${diff.changed.length}):`)
    for (const change of diff.changed) {
      const live = change.status === 'released' ? '  ← freigegeben: nach dem Einlesen sofort für alle sichtbar' : ''
      console.log(`  ${change.key}  ${change.name}${live}`)
      for (const field of change.fields) {
        console.log(`      ${field.label}: ${field.before}  →  ${field.after}`)
      }
    }
  }
  list('Wird zurückgezogen', diff.withdrawn)
  list('Wieder aufgenommen — wird Entwurf', diff.reactivated)
  list('Im Block eingelesen, fehlt in der Tabelle — bleibt, wird NICHT zurückgezogen', diff.missing)
  if (diff.foreign.length > 0) {
    console.log(`\nSchlüssel aus einem anderen Block (${diff.foreign.length}) — so lässt sich nicht einlesen:`)
    for (const f of diff.foreign) console.log(`  ${f.key}  gehört zu „${f.blockName}"`)
  }
  console.log(`\nUnverändert: ${diff.unchanged}`)
}

async function parseFile(file: string): Promise<ParsedBlock | null> {
  const result = parseBlock(await readBlock(file))
  if (result.block) return result.block
  console.log(`\n${result.errors.length} ${result.errors.length === 1 ? 'Fehler' : 'Fehler'} — es wird nichts eingelesen:\n`)
  for (const error of sortErrors(result.errors)) console.log(`  ${describeError(error)}`)
  return null
}

// ---- Befehle ----

async function check(file: string, write: boolean): Promise<number> {
  const block = await parseFile(file)
  if (!block) return 1
  const active = block.exercises.filter((e) => !e.withdrawn).length
  console.log(`\nBlock „${block.name}": ${block.exercises.length} Zeilen, davon ${active} aktiv — fehlerfrei geprüft.`)
  if (block.sourcesNote) console.log(`Quellen-Vermerk: ${block.sourcesNote}`)

  const db = database()
  const accounts = await resolveAccounts(db, block.previewEmails)
  if (accounts.unknown.length > 0) {
    console.log(`\nUnbekannte Vorschau-Konten: ${accounts.unknown.join(', ')} — erst registrieren oder Adresse prüfen.`)
    return 1
  }

  const diff = diffBlock(block, await loadCurrent(db, block))
  printDiff(diff)
  if (diff.foreign.length > 0) return 1

  const before = await currentPreview(db, block.name)
  const previewChanged = before === null || JSON.stringify([...before].sort()) !== JSON.stringify([...accounts.ids].sort())
  if (before !== null && previewChanged) console.log(`\nVorschau-Konten ändern sich: ${block.previewEmails.join(', ')}`)

  if (!hasChanges(diff) && !previewChanged) {
    console.log('\nNichts zu tun — die Datenbank entspricht der Tabelle.')
    return 0
  }
  if (!write) {
    console.log(`\nZum Einlesen: npm run bestand -- einlesen "${file}" --ja`)
    return 0
  }

  const { data, error } = await db.rpc('import_library_block', { p_block: toImportPayload(block, accounts.ids) })
  if (error) {
    console.log(`\nEinlesen fehlgeschlagen — es wurde nichts geschrieben: ${error.message}`)
    return 1
  }
  const r = data as { inserted: number; updated: number; withdrawn: number }
  console.log(`\nEingelesen: ${r.inserted} neu, ${r.updated} überschrieben, ${r.withdrawn} zurückgezogen.`)
  console.log(`Entwürfe sind jetzt sichtbar für: ${block.previewEmails.join(', ')}`)
  console.log(`Freigeben, wenn alles stimmt: npm run bestand -- freigeben "${file}" --ja`)
  return 0
}

async function release(file: string, write: boolean): Promise<number> {
  const block = await parseFile(file)
  if (!block) return 1
  const db = database()
  const current = await loadCurrent(db, block)
  const diff = diffBlock(block, current)
  if (hasChanges(diff)) {
    printDiff(diff)
    console.log('\nDie Tabelle weicht vom eingelesenen Stand ab — erst einlesen, dann ansehen, dann freigeben.')
    return 1
  }

  const drafts = [...current.values()].filter((c) => c.blockName === block.name && c.status === 'draft')
  if (drafts.length === 0) {
    console.log(`\nIm Block „${block.name}" wartet kein Entwurf.`)
    return 0
  }
  console.log(`\nWird für alle Nutzer freigegeben (${drafts.length}):`)
  for (const d of drafts) console.log(`  ${d.snapshot.key}  ${d.snapshot.name}`)
  if (!write) {
    console.log(`\nZum Freigeben: npm run bestand -- freigeben "${file}" --ja`)
    return 0
  }
  const { data, error } = await db.rpc('release_library_block', { p_block_name: block.name })
  if (error) {
    console.log(`\nFreigeben fehlgeschlagen — nichts geändert: ${error.message}`)
    return 1
  }
  console.log(`\nFreigegeben: ${data} Übungen. Sie stehen jetzt bei allen unter „Zuletzt hinzugefügt" oben.`)
  return 0
}

async function report(file: string, withDrafts: boolean): Promise<number> {
  const sheet = await readTargets(file)
  if (!sheet) {
    console.log('Das Blatt „Zielgruppen" fehlt.')
    return 1
  }
  const { targets, errors } = parseTargets(sheet)
  for (const error of errors) console.log(`  ${error}`)
  if (errors.length > 0) return 1

  const db = database()
  const statuses = withDrafts ? ['released', 'draft'] : ['released']
  const { data, error } = await db.from('library_exercises').select(ROW_SELECT).in('status', statuses)
  if (error) throw new Error(error.message)
  const current = await snapshots(db, (data ?? []) as ExerciseRow[])
  const result = coverage(targets, [...current.values()].map((c) => c.snapshot))

  console.log(`\nAbdeckung je Zielgruppe (${withDrafts ? 'freigegeben und Entwürfe' : 'nur freigegeben'}), Ziel 3 / 5 / 3:\n`)
  for (const entry of result) console.log(`  ${describeCoverage(entry)}`)
  console.log(`\n${result.filter((e) => e.covered).length} von ${result.length} Zielgruppen abgedeckt.`)
  return 0
}

export async function main(args: string[]): Promise<number> {
  const [command, file] = args
  const yes = args.includes('--ja')
  try {
    switch (command) {
      case 'pruefen':
        if (!file) break
        return await check(file, false)
      case 'einlesen':
        if (!file) break
        return await check(file, yes)
      case 'freigeben':
        if (!file) break
        return await release(file, yes)
      case 'abdeckung':
        if (!file) break
        return await report(file, args.includes('--mit-entwuerfen'))
      case 'vorlage':
        if (!file) break
        await writeBlock(file, EMPTY_TEMPLATE)
        console.log(`Leere Block-Tabelle geschrieben: ${file}`)
        return 0
      case 'zielgruppen-vorlage':
        if (!file) break
        await writeTargetsTemplate(file)
        console.log(`Zielgruppen-Liste geschrieben: ${file}`)
        return 0
      case 'testblock':
        if (!file) break
        await writeBlock(file, TEST_BLOCK)
        console.log(`Testblock geschrieben: ${file}`)
        return 0
    }
  } catch (error) {
    console.log(`\nAbgebrochen: ${error instanceof Error ? error.message : String(error)}`)
    return 1
  }
  console.log(
    'Befehle: pruefen | einlesen [--ja] | freigeben [--ja] <block.xlsx>; abdeckung <zielgruppen.xlsx> [--mit-entwuerfen];\n' +
      '         vorlage | zielgruppen-vorlage | testblock <ziel.xlsx>'
  )
  return 1
}
