import type { ParsedBlock, ParsedExercise } from './parse'

/**
 * Die Gegenüberstellung vor dem Einlesen (PROJ-4, Tech Design C): was neu ist,
 * was sich Feld für Feld ändert, was zurückgezogen wird und was in der Tabelle
 * fehlt. Korrekturen an freigegebenen Übungen sind nach dem Einlesen sofort
 * sichtbar — deshalb muss das hier vorher zu sehen sein.
 */

/** Eine Übung so, wie sie in der Datenbank steht und wie das Einlesen sie schreibt. */
export interface LibrarySnapshot {
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
  materials: { name: string; quantity: number; mode: string }[]
  variants: {
    title: string
    description: string
    materials: { name: string; quantity: number; mode: string }[]
    participants_min: number | null
    participants_max: number | null
    duration: number | null
    age_groups: string[]
    organization_forms: string[]
  }[]
  links: { url: string; title: string | null }[]
}

export type LibraryStatus = 'draft' | 'released' | 'withdrawn'

export interface CurrentExercise {
  snapshot: LibrarySnapshot
  status: LibraryStatus
  blockName: string
}

export function toSnapshot(exercise: ParsedExercise): LibrarySnapshot {
  return {
    key: exercise.key,
    name: exercise.name,
    description: exercise.description,
    notes: exercise.notes,
    sports: exercise.sports,
    age_groups: exercise.ageGroups,
    phases: exercise.phases,
    difficulty: exercise.difficulty,
    organization_forms: exercise.organizationForms,
    duration: exercise.duration,
    participants_min: exercise.participantsMin,
    participants_max: exercise.participantsMax,
    music_required: exercise.musicRequired,
    source_credit: exercise.sourceCredit,
    materials: exercise.materials.map((m) => ({ name: m.name, quantity: m.quantity, mode: m.mode })),
    variants: exercise.variants.map((v) => ({
      title: v.title,
      description: v.description,
      materials: v.materials.map((m) => ({ name: m.name, quantity: m.quantity, mode: m.mode })),
      participants_min: v.participantsMin,
      participants_max: v.participantsMax,
      duration: v.duration,
      age_groups: v.ageGroups,
      organization_forms: v.organizationForms,
    })),
    links: exercise.links.map((l) => ({ url: l.url, title: l.title })),
  }
}

/** Was die Datenbank-Funktion `import_library_block` erwartet. */
export function toImportPayload(block: ParsedBlock, previewUserIds: string[]) {
  return {
    name: block.name,
    preview_user_ids: previewUserIds,
    exercises: block.exercises.map((exercise) =>
      exercise.withdrawn
        ? { key: exercise.key, withdrawn: true }
        : { ...toSnapshot(exercise), withdrawn: false }
    ),
  }
}

const FIELD_LABELS: Record<Exclude<keyof LibrarySnapshot, 'key'>, string> = {
  name: 'Name',
  description: 'Beschreibung',
  notes: 'Anmerkungen',
  sports: 'Sportarten',
  age_groups: 'Altersgruppen',
  phases: 'Phasen',
  difficulty: 'Schwierigkeit',
  organization_forms: 'Organisationsformen',
  duration: 'Dauer',
  participants_min: 'TN von',
  participants_max: 'TN bis',
  music_required: 'Musik',
  source_credit: 'Quellenangabe',
  materials: 'Material',
  variants: 'Varianten',
  links: 'Links',
}

export interface FieldChange {
  label: string
  before: string
  after: string
}

export interface BlockDiff {
  added: { key: string; name: string }[]
  changed: {
    key: string
    name: string
    status: LibraryStatus
    fields: FieldChange[]
  }[]
  withdrawn: { key: string; name: string }[]
  /** Zurückgezogen, steht jetzt wieder als aktiv in der Tabelle → wird Entwurf. */
  reactivated: { key: string; name: string }[]
  unchanged: number
  /** Im Block eingelesen, fehlt aber in der Tabelle — wird nicht zurückgezogen. */
  missing: { key: string; name: string }[]
  /** Der Schlüssel gehört schon zu einem anderen Block — das Einlesen bräche ab. */
  foreign: { key: string; blockName: string }[]
}

function show(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'ja' : 'nein'
  if (Array.isArray(value)) {
    if (value.length === 0) return '—'
    if (typeof value[0] === 'string') return value.join('; ')
    if (value[0] && typeof value[0] === 'object' && 'quantity' in value[0]) {
      return (value as { name: string; quantity: number; mode: string }[])
        .map((m) => `${m.name} ${m.quantity}${m.mode === 'pro Teilnehmer' ? ' je TN' : ''}`)
        .join('; ')
    }
    if (value[0] && typeof value[0] === 'object' && 'title' in value[0] && 'description' in value[0]) {
      return (value as { title: string }[]).map((v) => v.title).join('; ')
    }
    if (value[0] && typeof value[0] === 'object' && 'url' in value[0]) {
      return (value as { url: string }[]).map((l) => l.url).join('; ')
    }
  }
  const text = String(value).replace(/\s+/g, ' ')
  return text.length > 80 ? `${text.slice(0, 77)}…` : text
}

/** Feld für Feld; Varianten als Ganzes, aber mit „(geändert)", wenn nur ihr Inhalt abweicht. */
export function fieldChanges(before: LibrarySnapshot, after: LibrarySnapshot): FieldChange[] {
  const changes: FieldChange[] = []
  for (const field of Object.keys(FIELD_LABELS) as (keyof typeof FIELD_LABELS)[]) {
    if (JSON.stringify(before[field]) === JSON.stringify(after[field])) continue
    let shownBefore = show(before[field])
    let shownAfter = show(after[field])
    if (shownBefore === shownAfter) {
      shownBefore = `${shownBefore} (Inhalt alt)`
      shownAfter = `${shownAfter} (Inhalt neu)`
    }
    changes.push({ label: FIELD_LABELS[field], before: shownBefore, after: shownAfter })
  }
  return changes
}

/**
 * `current`: alle eingelesenen Übungen mit einem Schlüssel aus der Tabelle,
 * dazu alle Übungen des Blocks selbst.
 */
export function diffBlock(block: ParsedBlock, current: Map<string, CurrentExercise>): BlockDiff {
  const diff: BlockDiff = {
    added: [],
    changed: [],
    withdrawn: [],
    reactivated: [],
    unchanged: 0,
    missing: [],
    foreign: [],
  }
  const inSheet = new Set(block.exercises.map((e) => e.key))

  for (const exercise of block.exercises) {
    const existing = current.get(exercise.key)
    if (existing && existing.blockName !== block.name) {
      diff.foreign.push({ key: exercise.key, blockName: existing.blockName })
      continue
    }
    if (exercise.withdrawn) {
      if (existing && existing.status !== 'withdrawn') {
        diff.withdrawn.push({ key: exercise.key, name: existing.snapshot.name })
      } else {
        diff.unchanged++
      }
      continue
    }
    if (!existing) {
      diff.added.push({ key: exercise.key, name: exercise.name })
      continue
    }
    if (existing.status === 'withdrawn') {
      diff.reactivated.push({ key: exercise.key, name: exercise.name })
    }
    const fields = fieldChanges(existing.snapshot, toSnapshot(exercise))
    if (fields.length > 0) {
      diff.changed.push({ key: exercise.key, name: exercise.name, status: existing.status, fields })
    } else if (existing.status !== 'withdrawn') {
      diff.unchanged++
    }
  }

  for (const [key, existing] of current) {
    if (existing.blockName === block.name && !inSheet.has(key) && existing.status !== 'withdrawn') {
      diff.missing.push({ key, name: existing.snapshot.name })
    }
  }

  return diff
}

/** Ob Einlesen überhaupt etwas schreiben würde. */
export function hasChanges(diff: BlockDiff): boolean {
  return diff.added.length + diff.changed.length + diff.withdrawn.length + diff.reactivated.length > 0
}
