import type {
  DifficultyLevel,
  Exercise,
  ExerciseMaterial,
  ExerciseVariant,
  MaterialMode,
} from '@/lib/types/exercise'

/**
 * Die eine gemeinsame Stelle, an der die effektiven Daten einer Variante
 * berechnet werden. Generator, PROJ-7 und die Übungsanzeige nutzen sie
 * gemeinsam — sonst wäre die Regel „Variantenmaterial ersetzt die Liste der
 * Hauptübung" an mehreren Orten nachgebaut und würde auseinanderlaufen. Bei
 * einem harten Auswahlkriterium wie Material wäre das ein echter Fehler.
 */

export interface CandidateMaterial {
  name: string
  quantity: number
  mode: MaterialMode
}

/**
 * Ein Kandidat im Auswahlpool: entweder eine Hauptübung oder eine ihrer
 * Varianten. `exerciseId` ist bei beiden dieselbe — darüber schließen sich
 * eine Hauptübung und ihre eigenen Varianten gegenseitig aus.
 */
export interface Candidate {
  exerciseId: string
  variantId: string | null
  name: string
  variantTitle: string | null
  /** Immer von der Hauptübung — eine Variante kann das nicht überschreiben. */
  phases: string[]
  sports: string[]
  difficulty: DifficultyLevel
  ageGroups: string[]
  organizationForms: string[]
  materials: CandidateMaterial[]
  participantsMin: number | null
  participantsMax: number | null
  duration: number
}

/**
 * Nur die Felder, die der Generator wirklich braucht — so lässt sich der Pool
 * aus der Datenbank laden, ohne Beschreibungen, Bilder und Links mitzuziehen.
 */
export type CandidateSource = Pick<
  Exercise,
  | 'id'
  | 'name'
  | 'phases'
  | 'sports'
  | 'difficulty'
  | 'ageGroups'
  | 'organizationForms'
  | 'duration'
  | 'participantsMin'
  | 'participantsMax'
  | 'materials'
  | 'variants'
>

function nonEmpty<T>(list: T[] | undefined | null): T[] | null {
  return list && list.length > 0 ? list : null
}

/**
 * Das Material einer Variante **ersetzt** die Liste der Hauptübung vollständig,
 * sobald sie gefüllt ist. Eine Variante, die gar kein Material braucht, trägt
 * dafür den Eintrag „Kein Material" — so bleibt „leer" eindeutig als „erbt".
 */
export function effectiveMaterials(
  exercise: Pick<CandidateSource, 'materials'>,
  variant?: Pick<ExerciseVariant, 'materials'> | null
): CandidateMaterial[] {
  const own = nonEmpty(variant?.materials)
  if (own) {
    return own.map((m) => ({ name: m.name, quantity: m.quantity, mode: m.mode }))
  }
  return exercise.materials.map((m: ExerciseMaterial) => ({
    name: m.name,
    quantity: m.quantity,
    mode: m.mode,
  }))
}

function candidateFromExercise(exercise: CandidateSource): Candidate {
  return {
    exerciseId: exercise.id,
    variantId: null,
    name: exercise.name,
    variantTitle: null,
    phases: exercise.phases,
    sports: exercise.sports,
    difficulty: exercise.difficulty,
    ageGroups: exercise.ageGroups,
    organizationForms: exercise.organizationForms,
    materials: effectiveMaterials(exercise),
    participantsMin: exercise.participantsMin ?? null,
    participantsMax: exercise.participantsMax ?? null,
    duration: exercise.duration,
  }
}

function candidateFromVariant(exercise: CandidateSource, variant: ExerciseVariant): Candidate | null {
  // Ohne stabile Kennung lässt sich die Variante später nicht am Einheiten-
  // Eintrag hinterlegen — sie bliebe nicht wiederauffindbar.
  if (!variant.id) return null

  return {
    exerciseId: exercise.id,
    variantId: variant.id,
    name: exercise.name,
    variantTitle: variant.title,
    phases: exercise.phases,
    sports: exercise.sports,
    difficulty: exercise.difficulty,
    ageGroups: nonEmpty(variant.ageGroups) ?? exercise.ageGroups,
    organizationForms: nonEmpty(variant.organizationForms) ?? exercise.organizationForms,
    materials: effectiveMaterials(exercise, variant),
    participantsMin: variant.participantsMin ?? exercise.participantsMin ?? null,
    participantsMax: variant.participantsMax ?? exercise.participantsMax ?? null,
    duration: variant.duration ?? exercise.duration,
  }
}

/** Alle Hauptübungen und alle Varianten als gleichwertige Kandidaten. */
export function buildCandidates(exercises: CandidateSource[]): Candidate[] {
  const candidates: Candidate[] = []

  for (const exercise of exercises) {
    candidates.push(candidateFromExercise(exercise))
    for (const variant of exercise.variants) {
      const candidate = candidateFromVariant(exercise, variant)
      if (candidate) candidates.push(candidate)
    }
  }

  return candidates
}
