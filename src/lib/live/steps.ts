import type { Unit, UnitItem, UnitSegment } from '@/lib/types/unit'
import type { ExerciseMaterial } from '@/lib/types/exercise'
import type { LiveMaterial, LivePlan, LiveStep } from './types'

export const FREE_TIME_NAME = 'Freie Zeit'
export const PLACEHOLDER_NAME = 'Übung gelöscht'

export interface LiveGroupFacts {
  venueName: string | null
  participants: number | null
}

/**
 * Rechnet das Material einer Übung für die Halle aus: „pro Teilnehmer" mal
 * Teilnehmerzahl. Ohne Teilnehmerzahl bleibt die Angabe je Teilnehmer stehen.
 * „Kein Material" ist kein Material.
 */
export function liveMaterials(
  materials: ExerciseMaterial[],
  participants: number | null
): LiveMaterial[] {
  return materials
    .filter((material) => material.name.trim().toLowerCase() !== 'kein material')
    .map((material) => {
      if (material.mode !== 'pro Teilnehmer') {
        return { name: material.name, quantity: material.quantity, perParticipant: false }
      }
      return participants
        ? { name: material.name, quantity: material.quantity * participants, perParticipant: false }
        : { name: material.name, quantity: material.quantity, perParticipant: true }
    })
}

type StepDraft = Omit<LiveStep, 'indexInPhase' | 'phaseCount'>

function emptyStep(segment: UnitSegment, key: string): StepDraft {
  return {
    key,
    kind: 'free',
    phase: segment.name,
    phaseIndex: segment.position,
    phaseNote: segment.notes.trim() || null,
    name: FREE_TIME_NAME,
    variantTitle: null,
    plannedMinutes: 0,
    description: '',
    materials: [],
    organizationForms: [],
    workNote: null,
    variants: [],
    musicRequired: false,
    musicLink: null,
    exerciseId: null,
    variantId: null,
    imagePath: null,
  }
}

function itemStep(segment: UnitSegment, item: UnitItem, participants: number | null): StepDraft {
  const base = emptyStep(segment, item.id)

  if (!item.exercise) {
    return {
      ...base,
      kind: 'placeholder',
      name: PLACEHOLDER_NAME,
      plannedMinutes: item.plannedDuration,
    }
  }

  const exercise = item.exercise
  return {
    ...base,
    kind: 'exercise',
    name: exercise.name,
    variantTitle: exercise.variantTitle,
    plannedMinutes: item.plannedDuration,
    description: exercise.description,
    materials: liveMaterials(exercise.materials, participants),
    organizationForms: exercise.organizationForms,
    workNote: exercise.workNotes?.trim() || null,
    variants: exercise.variants,
    musicRequired: exercise.musicRequired,
    musicLink: exercise.musicLink?.trim() || null,
    exerciseId: item.exerciseId,
    variantId: item.variantId,
  }
}

/**
 * Macht aus einer gespeicherten Einheit die Schrittliste — einmal, beim Start.
 * Danach kennt der Live-Bildschirm weder Segmente noch Lückenregeln.
 *
 * - Übungen in Planreihenfolge,
 * - ein Platzhalter „Übung gelöscht" als eigener Schritt mit seiner Plandauer,
 * - was in einem Segment frei bleibt, als „Freie Zeit" an dessen Ende — die
 *   geplante Lücke ebenso wie ein frei gelassenes Segment über seine ganze Länge.
 *
 * Nichts wird übersprungen: sonst fehlten Minuten in der Rechnung, und der
 * Nutzer läge scheinbar ständig voraus. Ein überfülltes Segment hat keine freie
 * Zeit; seine Schritte laufen mit ihrer Plandauer.
 */
export function buildLivePlan(unit: Unit, group: LiveGroupFacts): LivePlan {
  const steps: LiveStep[] = []
  const segments = [...unit.segments].sort((a, b) => a.position - b.position)

  for (const segment of segments) {
    const items = [...segment.items].sort((a, b) => a.position - b.position)
    const drafts = items.map((item) => itemStep(segment, item, group.participants))

    const planned = items.reduce((sum, item) => sum + item.plannedDuration, 0)
    const free = segment.minutes - planned
    if (free > 0) {
      drafts.push({ ...emptyStep(segment, `${segment.id}:frei`), plannedMinutes: free })
    }

    drafts.forEach((draft, index) => {
      steps.push({ ...draft, indexInPhase: index + 1, phaseCount: drafts.length })
    })
  }

  return {
    unitId: unit.id,
    unitName: unit.name,
    groupName: unit.groupName,
    venueName: group.venueName,
    participants: group.participants,
    totalMinutes: steps.reduce((sum, step) => sum + step.plannedMinutes, 0),
    steps,
  }
}

/** Was `getUnit` nicht mitbringt und der Live-Modus eigens nachlädt. */
export interface LivePlanExtras {
  /** Die Beschreibung je Variante — sonst stünde bei einer Variante die der Grundübung. */
  variantDescriptions: Map<string, string>
  /** Der Speicherpfad des Titelbilds je Übung. */
  coverImages: Map<string, string>
}

/** Trägt Variantenbeschreibung und Titelbild in die Schritte ein. */
export function enrichLivePlan(plan: LivePlan, extras: LivePlanExtras): LivePlan {
  return {
    ...plan,
    steps: plan.steps.map((step) => {
      if (step.kind !== 'exercise' || !step.exerciseId) return step
      const variantDescription = step.variantId
        ? extras.variantDescriptions.get(step.variantId)?.trim()
        : undefined
      return {
        ...step,
        description: variantDescription || step.description,
        imagePath: extras.coverImages.get(step.exerciseId) ?? null,
      }
    }),
  }
}

/** Das Titelbild aus der Bilderliste einer Übung; ohne Markierung das erste. */
export function coverImagePath(images: unknown): string | null {
  if (!Array.isArray(images)) return null
  const valid = images.filter(
    (image): image is { path: string; isCover?: boolean } =>
      typeof image === 'object' && image !== null && typeof (image as { path?: unknown }).path === 'string'
  )
  return (valid.find((image) => image.isCover) ?? valid[0])?.path ?? null
}
