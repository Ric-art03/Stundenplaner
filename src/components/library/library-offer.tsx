import Link from 'next/link'
import { Library } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { libraryHref } from '@/lib/library/address'

interface LibraryOfferProps {
  groupId: string
  count: number
}

/**
 * Das Angebot nach dem Anlegen einer Gruppe (PROJ-4, E): ein Hinweis auf der
 * Gruppenseite statt einer Kurzmeldung, die nach Sekunden verschwände.
 */
export function LibraryOffer({ groupId, count }: LibraryOfferProps) {
  if (count === 0) return null
  return (
    <Alert className="border-primary/40 bg-primary/5">
      <Library className="h-4 w-4" />
      <AlertTitle>
        Zu dieser Gruppe {count === 1 ? 'passt 1 Übung' : `passen ${count} Übungen`} aus der Übungsdatenbank
      </AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Der Generator könnte {count === 1 ? 'sie' : 'sie alle'} sofort einplanen. Übernommene
          Übungen gehören dir und lassen sich frei ändern.
        </p>
        <Button size="sm" asChild>
          <Link href={libraryHref({ groupId })}>Ansehen</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
