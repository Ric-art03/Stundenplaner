import type { ExerciseVariant } from '@/lib/types/exercise'
import type { FactsVariant } from './exercise-facts-row'

/** Die Varianten einer Übung in der Form, die die Übungszeile aufklappt. */
export function variantFacts(variants: ExerciseVariant[]): FactsVariant[] {
  return variants.map((variant, index) => ({
    // Gespeicherte Varianten haben eine Kennung; die Position ist nur der
    // Rückfall für den Schlüssel der Liste.
    id: variant.id ?? `variante-${index}`,
    title: variant.title,
  }))
}
