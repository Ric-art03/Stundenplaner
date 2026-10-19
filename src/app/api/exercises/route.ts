import { NextResponse, type NextRequest } from 'next/server'
import { getExercises } from '@/lib/actions/exercises'
import { parseExerciseListQuery } from '@/lib/library/address'

/**
 * Die Liste von „Meine Übungen" (BUG-31, PROJ-4). Eine gewöhnliche Abfrage
 * statt einer Server-Aktion: Server-Aktionen laufen durch die Warteschlange des
 * Routers, und eine, die während eines Seitenwechsels zurückkam, setzte den
 * alten Seitenstand wieder ein.
 *
 * Die Anmeldung prüft `getExercises` selbst (ohne Nutzer: leere Liste), die
 * Zugriffsregeln der Datenbank dahinter; die Werte aus der Adresse werden
 * beim Lesen begrenzt.
 */
export async function GET(request: NextRequest) {
  const p = parseExerciseListQuery(request.nextUrl.searchParams)
  const result = await getExercises(p.filters, p.sortField, p.sortDirection, p.offset, p.limit)
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
