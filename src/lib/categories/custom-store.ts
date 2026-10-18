import type { createClient } from '@/lib/supabase/server'
import {
  predefinedDuplicates,
  withoutKnownCustoms,
  type CategoryRow,
  type CategoryType,
} from '@/lib/manage/categories'

/**
 * Lesen und Eintragen der eigenen Begriffe auf dem Server. Bewusst keine
 * Server-Aktion: die Funktionen bekommen den Client des Aufrufers und sind aus
 * dem Browser nicht aufrufbar.
 */

type SupabaseClient = Awaited<ReturnType<typeof createClient>>

/**
 * Lässt eigene Begriffe, die der Grundstock inzwischen mitliefert, im
 * mitgelieferten aufgehen (PROJ-19, Abschnitt D) — über `rename_category`, die
 * alle Stellen in einem Zug in die Schreibweise des Grundstocks bringt.
 *
 * Gibt die Zeilen zurück, die eigene Begriffe bleiben. Scheitert das Aufgehen
 * eines Begriffs, bleibt er in der Liste und wird beim nächsten Laden erneut
 * versucht; die Auswahllisten blenden den Doppel bis dahin aus. Ein zweiter
 * Tab, der denselben Begriff gleichzeitig aufgehen lässt, findet ihn nicht
 * mehr — das zählt als erledigt.
 */
export async function absorbPredefinedCustoms<T extends CategoryRow>(
  supabase: SupabaseClient,
  rows: T[]
): Promise<T[]> {
  const duplicates = predefinedDuplicates(rows)
  if (duplicates.length === 0) return rows

  const absorbed = new Set<string>()
  // Nacheinander: die Funktion sperrt je Nutzer, gleichzeitige Aufrufe
  // warteten ohnehin aufeinander.
  for (const duplicate of duplicates) {
    const { error } = await supabase.rpc('rename_category', {
      p_id: duplicate.id,
      p_new_name: duplicate.spelling,
      p_merge: true,
      p_predefined: true,
    })
    if (!error || error.message.includes('category_not_found')) absorbed.add(duplicate.id)
  }

  return rows.filter((row) => !absorbed.has(row.id))
}

/**
 * Trägt neue eigene Begriffe in die Auswahllisten ein. Was es schon gibt, auch
 * in anderer Schreibweise, wird nicht ein zweites Mal angelegt.
 */
export async function addCustomCategories(
  supabase: SupabaseClient,
  userId: string,
  entries: { category_type: CategoryType; name: string }[]
): Promise<void> {
  if (entries.length === 0) return

  const types = [...new Set(entries.map((entry) => entry.category_type))]
  const { data: existing, error } = await supabase
    .from('custom_categories')
    .select('category_type, name')
    .eq('user_id', userId)
    .in('category_type', types)
    .limit(2000)

  // Lässt sich der Bestand nicht lesen, wird trotzdem eingetragen, wie vor
  // PROJ-19: genau Gleiches weist die Datenbank ab, nur eine andere
  // Schreibweise käme durch.
  const fresh = withoutKnownCustoms(entries, error || !existing ? [] : existing)
  if (fresh.length === 0) return

  await supabase
    .from('custom_categories')
    .upsert(
      fresh.map((entry) => ({ user_id: userId, ...entry })),
      { onConflict: 'user_id,category_type,name', ignoreDuplicates: true }
    )
}
