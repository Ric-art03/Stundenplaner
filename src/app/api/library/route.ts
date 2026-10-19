import { NextResponse, type NextRequest } from 'next/server'
import { getLibrary } from '@/lib/actions/library'
import { parseLibraryParams } from '@/lib/library/address'

/**
 * Der Reiter „Übungsdatenbank" samt „Passt zu Gruppe" (BUG-31, PROJ-4). Eine
 * gewöhnliche Abfrage statt einer Server-Aktion — siehe `/api/exercises`.
 * Dieselbe Adresse wie die Seite selbst, misstrauisch gelesen.
 *
 * Was der Nutzer sieht, entscheiden `getLibrary` (Anmeldung, eigene Gruppe)
 * und die Zugriffsregeln der Datenbank (Entwürfe nur für Vorschau-Konten).
 */
export async function GET(request: NextRequest) {
  const result = await getLibrary(parseLibraryParams(request.nextUrl.searchParams))
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
}
