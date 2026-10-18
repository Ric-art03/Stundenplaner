import type { Exercise, ExerciseFilters } from '@/lib/types/exercise'
import { normalizeTerm, realMaterials } from '@/lib/categories/terms'

/**
 * Warum die Übungsdatenbank für diese Filter leer bleibt (PROJ-4, B): jeder
 * einzelne Filterwert, für den es im ganzen Bestand keine Übung gibt, wird
 * genannt — „Für Volleyball gibt es … noch keine Übungen" statt nur „keine
 * Treffer". Hat jeder Wert für sich Treffer, liegt es an der Kombination, und
 * auch das wird gesagt.
 *
 * `exercises` ist der ganze sichtbare Bestand, ohne Filter.
 */

type Exercisey = Pick<Exercise, 'name' | 'description' | 'sports' | 'ageGroups' | 'phases' | 'organizationForms' | 'difficulty' | 'materials'>

function has(values: readonly string[], wanted: string): boolean {
  const key = normalizeTerm(wanted)
  return values.some((v) => normalizeTerm(v) === key)
}

function quoted(values: string[]): string {
  const q = values.map((v) => `„${v}"`)
  return q.length <= 1 ? q.join('') : `${q.slice(0, -1).join(', ')} und ${q[q.length - 1]}`
}

export function hasActiveFilters(filters: ExerciseFilters): boolean {
  return (
    filters.search.trim() !== '' ||
    filters.sports.length > 0 ||
    filters.ageGroups.length > 0 ||
    filters.phases.length > 0 ||
    filters.difficulty !== null ||
    filters.organizationForms.length > 0 ||
    filters.materials.length > 0 ||
    filters.withoutMaterial ||
    filters.participantsMin != null ||
    filters.participantsMax != null ||
    filters.needsCompletion
  )
}

export function explainEmptyFilters(exercises: Exercisey[], filters: ExerciseFilters): string[] {
  const reasons: string[] = []
  const none = (values: string[], pick: (e: Exercisey) => readonly string[]) =>
    values.filter((value) => !exercises.some((e) => has(pick(e), value)))

  const search = filters.search.trim().toLowerCase()
  if (search && !exercises.some((e) => `${e.name} ${e.description}`.toLowerCase().includes(search))) {
    reasons.push(`Keine Übung der Übungsdatenbank enthält „${filters.search.trim()}".`)
  }

  const sports = none(filters.sports, (e) => e.sports)
  if (sports.length > 0) reasons.push(`Für ${quoted(sports)} gibt es in der Übungsdatenbank noch keine Übungen.`)

  const ages = none(filters.ageGroups, (e) => e.ageGroups)
  if (ages.length > 0) reasons.push(`Für ${quoted(ages)} gibt es in der Übungsdatenbank noch keine Übungen.`)

  const phases = none(filters.phases, (e) => e.phases)
  if (phases.length > 0) {
    reasons.push(`Für die ${phases.length === 1 ? 'Phase' : 'Phasen'} ${quoted(phases)} gibt es in der Übungsdatenbank noch keine Übungen.`)
  }

  const forms = none(filters.organizationForms, (e) => e.organizationForms)
  if (forms.length > 0) {
    reasons.push(`Mit ${forms.length === 1 ? 'der Organisationsform' : 'den Organisationsformen'} ${quoted(forms)} gibt es in der Übungsdatenbank noch keine Übungen.`)
  }

  if (filters.difficulty && !exercises.some((e) => e.difficulty === filters.difficulty)) {
    reasons.push(`Mit dem Schwierigkeitsgrad „${filters.difficulty}" gibt es in der Übungsdatenbank noch keine Übungen.`)
  }

  // Die gewählten Materialien und „Ohne Material" gelten untereinander als
  // „oder" (wie in der Abfrage) — am Material liegt es nur, wenn keins davon
  // im Bestand vorkommt.
  const materialFilterOn = filters.materials.length > 0 || filters.withoutMaterial
  const anyMaterialHit = exercises.some((e) => {
    const names = realMaterials(e.materials).map((m) => m.name)
    return (
      filters.materials.some((m) => has(names, m)) ||
      (filters.withoutMaterial && names.length === 0)
    )
  })
  if (materialFilterOn && !anyMaterialHit) {
    if (filters.materials.length > 0) {
      reasons.push(`Mit ${quoted(filters.materials)} gibt es in der Übungsdatenbank noch keine Übungen.`)
    }
    if (filters.withoutMaterial) reasons.push('Ohne Material gibt es in der Übungsdatenbank noch keine Übungen.')
  }

  if (reasons.length === 0 && hasActiveFilters(filters)) {
    reasons.push('Jeder Filter hat für sich Treffer, aber keine Übung erfüllt alle zugleich.')
  }

  return reasons
}
