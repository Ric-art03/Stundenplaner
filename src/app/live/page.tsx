import type { Metadata } from 'next'
import { LiveScreen } from '@/components/live/live-screen'

export const metadata: Metadata = {
  title: 'Stunde läuft · Stundenplaner',
}

/**
 * Der Live-Modus (PROJ-14): ein eigener Bildschirm ohne die Navigation der App.
 *
 * Bewusst **eine feste Adresse ohne Einheit darin** und ohne Abfrage an den
 * Server: welche Stunde läuft, steht in der Stundenakte auf dem Gerät. Nur so
 * lässt sich der Bildschirm ablegen und in einer Halle ohne Empfang wieder
 * öffnen. Deshalb liegt die Seite auch nicht unter `(protected)` — sie zeigt
 * nur, was schon auf dem Gerät liegt; alles, was den Server berührt, prüft die
 * Anmeldung wie bisher.
 */
export default function LivePage() {
  return <LiveScreen />
}
