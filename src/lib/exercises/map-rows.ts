import type { Database } from '@/lib/database.types'
import type { ExerciseLink, ExerciseMaterial, ExerciseVariant } from '@/lib/types/exercise'
import { orderByTerm, orderTerms } from '@/lib/categories/terms'

/**
 * Material, Varianten und Links einer Übung aus ihren Tabellenzeilen. Die
 * Übungsdatenbank (PROJ-4) hat dieselben Zeilen wie die eigenen Übungen —
 * beide lesen sie hierüber.
 */

type MaterialRow = Database['public']['Tables']['exercise_materials']['Row']
type VariantRow = Database['public']['Tables']['exercise_variants']['Row']
type LinkRow = Database['public']['Tables']['exercise_links']['Row']

export function groupBy<T extends Record<string, unknown>>(items: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const item of items) {
    const k = String(item[key])
    if (!map[k]) map[k] = []
    map[k].push(item)
  }
  return map
}

export function mapMaterial(row: MaterialRow): ExerciseMaterial {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    mode: row.mode as 'pro Teilnehmer' | 'insgesamt',
  }
}

export function mapVariant(row: VariantRow): ExerciseVariant {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    materials: orderByTerm('material', (row.materials as unknown as ExerciseVariant['materials']) ?? []),
    participantsMin: row.participants_min,
    participantsMax: row.participants_max,
    duration: row.duration,
    ageGroups: orderTerms('age_group', (row.age_groups as string[]) ?? []),
    organizationForms: orderTerms('organization_form', (row.organization_forms as string[]) ?? []),
  }
}

export function mapLink(row: LinkRow): ExerciseLink {
  return {
    id: row.id,
    url: row.url,
    title: row.title ?? undefined,
  }
}
