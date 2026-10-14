import { effectiveMaterials, type CandidateSource } from '@/lib/units/candidates'
import { materialsAvailable } from '@/lib/units/generator'

/**
 * Was ein Ändern des Hallenmaterials für den Generator bedeutet (PROJ-16).
 * Reine Rechnung ohne Datenbank: Der Generator plant für eine Gruppe nur
 * Übungen ein, für die das Material ihrer Halle reicht. Fällt Material weg
 * oder wird es weniger, fallen Übungen heraus — und das soll der Nutzer vor
 * dem Speichern erfahren.
 */

export interface HallMaterial {
  name: string
  quantity: number
}

/** Ein Material, das wegfällt (`after` = null) oder weniger wird. */
export interface MaterialLoss {
  name: string
  before: number
  after: number | null
}

export interface MaterialImpact extends MaterialLoss {
  /** Die Gruppen der Halle, für die mindestens eine Übung herausfällt. */
  groups: string[]
  /** Übungen, die selbst oder mit einer Variante nicht mehr eingeplant werden. */
  exerciseCount: number
}

export interface ImpactGroup {
  name: string
  participants: number | null
}

/** Dieselbe Schreibweisen-Regel wie im Generator: Leerzeichen und Groß/klein egal. */
function key(name: string): string {
  return name.trim().toLowerCase()
}

/**
 * Was wegfällt oder weniger wird. Ein umbenanntes Material (eine Zeile auf ein
 * anderes Material umgestellt) erscheint hier als weggefallen — für den
 * Generator ist es genau das.
 */
export function materialLosses(before: HallMaterial[], after: HallMaterial[]): MaterialLoss[] {
  const remaining = new Map<string, number>()
  for (const material of after) {
    const k = key(material.name)
    if (k === '') continue
    remaining.set(k, (remaining.get(k) ?? 0) + material.quantity)
  }

  const losses: MaterialLoss[] = []
  for (const material of before) {
    const now = remaining.get(key(material.name))
    if (now === undefined) {
      losses.push({ name: material.name, before: material.quantity, after: null })
    } else if (now < material.quantity) {
      losses.push({ name: material.name, before: material.quantity, after: now })
    }
  }
  return losses
}

/** Das Hallenmaterial, wenn nur dieses eine Material sich ändert. */
function withSingleLoss(before: HallMaterial[], loss: MaterialLoss): HallMaterial[] {
  return before.flatMap((material) => {
    if (key(material.name) !== key(loss.name)) return [material]
    return loss.after === null ? [] : [{ name: material.name, quantity: loss.after }]
  })
}

/**
 * Je Verlust: welche Gruppen es trifft und wie viele Übungen dort herausfallen.
 * Jeder Verlust wird für sich gerechnet, damit eine Übung nicht einem Material
 * angelastet wird, das sie gar nicht braucht. Gerechnet wird wie im Generator,
 * „pro Teilnehmer" also mit der Teilnehmerzahl der jeweiligen Gruppe.
 * Verluste ohne Wirkung fallen weg — dann gibt es nichts nachzufragen.
 */
export function materialImpacts(
  before: HallMaterial[],
  losses: MaterialLoss[],
  groups: ImpactGroup[],
  exercises: Pick<CandidateSource, 'materials' | 'variants'>[]
): MaterialImpact[] {
  // Je Übung die Materiallisten der Hauptübung und jeder Variante.
  const materialSets = exercises.map((exercise) => [
    effectiveMaterials(exercise),
    ...exercise.variants.map((variant) => effectiveMaterials(exercise, variant)),
  ])

  const impacts: MaterialImpact[] = []
  for (const loss of losses) {
    const after = withSingleLoss(before, loss)
    const hitGroups = new Set<string>()
    const hitExercises = new Set<number>()

    for (const group of groups) {
      const was = { participants: group.participants, venueMaterials: before }
      const now = { participants: group.participants, venueMaterials: after }
      materialSets.forEach((sets, index) => {
        const dropped = sets.some(
          (materials) =>
            materialsAvailable({ materials }, was) && !materialsAvailable({ materials }, now)
        )
        if (dropped) {
          hitGroups.add(group.name)
          hitExercises.add(index)
        }
      })
    }

    if (hitExercises.size > 0) {
      impacts.push({
        ...loss,
        groups: groups.map((g) => g.name).filter((name) => hitGroups.has(name)),
        exerciseCount: hitExercises.size,
      })
    }
  }
  return impacts
}

/** „Bälle entfernt" bzw. „Bälle von 10 auf 6" — für die Nachfrage. */
export function describeLoss(loss: MaterialLoss): string {
  return loss.after === null
    ? `${loss.name} entfernt`
    : `${loss.name} von ${loss.before} auf ${loss.after}`
}
