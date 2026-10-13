import { redirect } from 'next/navigation'
import { manageHref } from '@/lib/manage/tabs'

/**
 * Die Hallenverwaltung ist mit PROJ-16 in die Verwaltung umgezogen. Die alte
 * Adresse leitet weiter, damit Lesezeichen halten.
 */
export default function VenuesPage() {
  redirect(manageHref('venues'))
}
