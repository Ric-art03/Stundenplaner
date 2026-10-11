import type { LiveMaterial, LivePlan, LiveStep } from './types'

/** Bausteine für die Tests des Live-Modus — kein Teil der App. */

export const MIN = 60_000

export function material(name: string, quantity: number, perParticipant = false): LiveMaterial {
  return { name, quantity, perParticipant }
}

export function step(overrides: Partial<LiveStep> = {}): LiveStep {
  return {
    key: overrides.key ?? `schritt-${Math.random()}`,
    kind: 'exercise',
    phase: 'Hauptteil',
    phaseIndex: 0,
    indexInPhase: 1,
    phaseCount: 1,
    phaseNote: null,
    name: 'Übung',
    variantTitle: null,
    plannedMinutes: 5,
    description: '',
    materials: [],
    organizationForms: [],
    workNote: null,
    variants: [],
    musicRequired: false,
    musicLink: null,
    exerciseId: 'uebung-1',
    variantId: null,
    imagePath: null,
    ...overrides,
  }
}

/** Ein Plan aus lauter Übungen mit den genannten Plandauern. */
export function planOf(...minutes: number[]): LivePlan {
  return planWith(minutes.map((plannedMinutes, index) => step({ key: `s${index}`, plannedMinutes })))
}

export function planWith(steps: LiveStep[]): LivePlan {
  return {
    unitId: 'einheit-1',
    unitName: 'Testeinheit',
    groupName: 'Testgruppe',
    venueName: 'Halle',
    participants: 12,
    totalMinutes: steps.reduce((sum, item) => sum + item.plannedMinutes, 0),
    steps,
  }
}
