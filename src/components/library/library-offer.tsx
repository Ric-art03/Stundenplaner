import Link from 'next/link'
import { Library } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { libraryHref } from '@/lib/library/address'

interface LibraryOfferProps {
  groupId: string
  /** Passt zu Sportart und Alter und ist noch nicht übernommen. */
  matching: number
  /** Davon: was der Generator sofort einplanen würde. */
  ready: number
}

function offerTitle(matching: number): string {
  return `Zu dieser Gruppe ${matching === 1 ? 'passt 1 Übung' : `passen ${matching} Übungen`} aus der Übungsdatenbank`
}

/** Der Satz unter der Überschrift — sagt, wie viel davon sofort geht. */
export function offerDetail(matching: number, ready: number): string {
  if (ready === matching) {
    return matching === 1
      ? 'Der Generator könnte sie sofort einplanen.'
      : 'Der Generator könnte sie alle sofort einplanen.'
  }
  if (ready === 0) {
    return 'Für keine davon reicht im Moment das Material der Halle oder die Teilnehmerzahl — beim Ansehen steht bei jeder Übung, woran es liegt.'
  }
  return `${ready} davon kann der Generator sofort einplanen; bei den übrigen steht beim Ansehen, woran es liegt.`
}

/**
 * Das Angebot nach dem Anlegen einer Gruppe (PROJ-4, E): ein Hinweis auf der
 * Gruppenseite statt einer Kurzmeldung, die nach Sekunden verschwände. Er
 * nennt beide Zahlen und erscheint auch, wenn noch Material fehlt.
 */
export function LibraryOffer({ groupId, matching, ready }: LibraryOfferProps) {
  if (matching === 0) return null
  return (
    <Alert className="border-primary/40 bg-primary/5">
      <Library className="h-4 w-4" />
      <AlertTitle>{offerTitle(matching)}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          {offerDetail(matching, ready)} Übernommene Übungen gehören dir und lassen sich frei
          ändern.
        </p>
        <Button size="sm" asChild>
          <Link href={libraryHref({ groupId })}>Ansehen</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
