import Link from 'next/link'
import { Dumbbell, Library, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { libraryHref } from '@/lib/library/address'

type EmptyStateVariant = 'no-groups' | 'no-exercises'

interface UnitGeneratorEmptyStateProps {
  variant: EmptyStateVariant
  /** Ob es in der Übungsdatenbank etwas zu übernehmen gibt (PROJ-4, Edge Case 11). */
  libraryHasContent?: boolean
  /** Die Gruppe, auf die „Passt zu Gruppe" gleich gesetzt wird. */
  libraryGroupId?: string | null
}

export function UnitGeneratorEmptyState({
  variant,
  libraryHasContent = false,
  libraryGroupId = null,
}: UnitGeneratorEmptyStateProps) {
  if (variant === 'no-groups') {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <h2 className="mb-1 text-lg font-semibold">Noch keine Gruppe angelegt</h2>
        <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
          Der Generator richtet jede Einheit nach einem Gruppenprofil aus — daraus kennt er
          Sportart, Altersgruppe, Teilnehmerzahl, Dauer und das verfügbare Material. Lege
          deshalb zuerst eine Gruppe an.
        </p>
        <Button asChild>
          <Link href="/groups/new">
            <Plus className="mr-2 h-4 w-4" />
            Erste Gruppe anlegen
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-dashed p-8 text-center">
      <Dumbbell className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
      <h2 className="mb-1 text-lg font-semibold">Noch keine Übungen vorhanden</h2>
      <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
        Der Generator stellt Einheiten aus deinen eigenen Übungen zusammen. Je mehr Übungen du
        hast, desto abwechslungsreicher werden die Vorschläge.
        {libraryHasContent &&
          ' Am schnellsten geht es mit der Übungsdatenbank: Dort wählt „Passt zu Gruppe" vor, was der Generator für deine Gruppe sofort einplanen würde.'}
      </p>
      <div className="flex flex-col justify-center gap-2 sm:flex-row">
        {libraryHasContent && (
          <Button asChild>
            <Link href={libraryHref({ groupId: libraryGroupId })}>
              <Library className="mr-2 h-4 w-4" />
              Zur Übungsdatenbank
            </Link>
          </Button>
        )}
        <Button variant={libraryHasContent ? 'outline' : 'default'} asChild>
          <Link href="/exercises/new">
            <Plus className="mr-2 h-4 w-4" />
            Erste Übung anlegen
          </Link>
        </Button>
      </div>
    </div>
  )
}
