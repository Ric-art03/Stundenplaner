import type { LiveMaterial, LivePlan, LiveStep } from './types'

function materialKey(material: LiveMaterial): string {
  // Eine Menge „je Teilnehmer" lässt sich mit einer festen nicht vergleichen —
  // beide stehen dann getrennt da.
  return `${material.name.trim().toLowerCase()}|${material.perParticipant ? 'tn' : 'fest'}`
}

/**
 * Das Material der ganzen Einheit, je Material **einmal**, mit der Menge, die
 * **gleichzeitig** gebraucht wird: der größte Bedarf einer einzelnen Übung,
 * nicht die Summe. Dieselben Hütchen werden in mehreren Übungen benutzt.
 */
export function materialNeeds(plan: LivePlan): LiveMaterial[] {
  const needs = new Map<string, LiveMaterial>()

  for (const step of plan.steps) {
    for (const material of step.materials) {
      const key = materialKey(material)
      const known = needs.get(key)
      if (!known || material.quantity > known.quantity) needs.set(key, material)
    }
  }

  return [...needs.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'))
}

export interface MusicNeed {
  key: string
  title: string
  /** Nur gesetzt, wenn ein Link hinterlegt ist, der sich gefahrlos öffnen lässt. */
  link: string | null
}

/** Nur gewöhnliche Web-Adressen werden zu einem Verweis — nichts, was Code ausführt. */
function safeLink(value: string | null): string | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null
  } catch {
    return null
  }
}

/** Die Übungen, die Musik brauchen, je mit ihrem Link — fürs Bereitschaftsbild. */
export function musicNeeds(plan: LivePlan): MusicNeed[] {
  return plan.steps
    .filter((step) => step.musicRequired)
    .map((step) => ({ key: step.key, title: stepTitle(step), link: safeLink(step.musicLink) }))
}

export function hasPlaceholder(plan: LivePlan): boolean {
  return plan.steps.some((step) => step.kind === 'placeholder')
}

/** „Kreisfangen" oder „Kreisfangen · mit zwei Fängern". */
export function stepTitle(step: LiveStep): string {
  return step.variantTitle ? `${step.name} · ${step.variantTitle}` : step.name
}

export interface MaterialChange {
  name: string
  from: number
  to: number
  perParticipant: boolean
}

export interface StepComparison {
  /**
   * `false` = es gibt nichts zu vergleichen (der aktuelle Schritt ist freie
   * Zeit oder ein Platzhalter): dann steht alles Material unter `stays`, ohne
   * Hervorhebung.
   */
  compared: boolean
  /** Neu holen. */
  fetch: LiveMaterial[]
  /** Kann weg. */
  remove: LiveMaterial[]
  /** Dasselbe Material in anderer Menge. */
  changed: MaterialChange[]
  /** Bleibt — steht ruhig darunter. */
  stays: LiveMaterial[]
  organizationForms: string[]
  /** Gesetzt = die Organisationsform wechselt; „von" für „Kreis → Zwei Mannschaften". */
  organizationFrom: string[] | null
}

function sameForms(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false
  const set = new Set(a)
  return b.every((form) => set.has(form))
}

/**
 * Was sich vom aktuellen zum nächsten Schritt ändert. Die eigentliche
 * Vorbereitung in der Halle ist der Umbau — zwei Materiallisten im Kopf
 * abzugleichen, während eine Übung läuft, nimmt die App ab.
 */
export function compareSteps(current: LiveStep | null, next: LiveStep): StepComparison {
  // Aus freier Zeit oder einem Platzhalter heraus gibt es keinen Stand, mit dem
  // sich vergleichen ließe.
  // Auch vor dem ersten Schritt nicht: auf dem Bereitschaftsbild läuft noch keiner.
  if (current === null || current.kind !== 'exercise') {
    return {
      compared: false,
      fetch: [],
      remove: [],
      changed: [],
      stays: next.materials,
      organizationForms: next.organizationForms,
      organizationFrom: null,
    }
  }

  const before = new Map(current.materials.map((material) => [materialKey(material), material]))
  const after = new Map(next.materials.map((material) => [materialKey(material), material]))

  const fetch: LiveMaterial[] = []
  const changed: MaterialChange[] = []
  const stays: LiveMaterial[] = []

  for (const [key, material] of after) {
    const known = before.get(key)
    if (!known) fetch.push(material)
    else if (known.quantity !== material.quantity) {
      changed.push({
        name: material.name,
        from: known.quantity,
        to: material.quantity,
        perParticipant: material.perParticipant,
      })
    } else stays.push(material)
  }

  const remove = [...before.entries()]
    .filter(([key]) => !after.has(key))
    .map(([, material]) => material)

  // Nur wo beide Seiten eine Organisationsform nennen, ist ein Wechsel belegt.
  const formsChange =
    next.kind === 'exercise' &&
    current.organizationForms.length > 0 &&
    next.organizationForms.length > 0 &&
    !sameForms(current.organizationForms, next.organizationForms)

  return {
    compared: true,
    fetch,
    remove,
    changed,
    stays,
    organizationForms: next.organizationForms,
    organizationFrom: formsChange ? current.organizationForms : null,
  }
}

/** „6× Hütchen" oder „1× Ball je TN". */
export function formatMaterial(material: LiveMaterial): string {
  return `${material.quantity}× ${material.name}${material.perParticipant ? ' je TN' : ''}`
}
