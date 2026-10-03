import Link from 'next/link'
import { Dumbbell, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'

type EmptyStateVariant = 'no-groups' | 'no-exercises'

interface UnitGeneratorEmptyStateProps {
  variant: EmptyStateVariant
}

export function UnitGeneratorEmptyState({ variant }: UnitGeneratorEmptyStateProps) {
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
        Der Generator stellt Einheiten aus deiner eigenen Übungsdatenbank zusammen. Je mehr
        Übungen du erfasst, desto abwechslungsreicher werden die Vorschläge. Eine kuratierte
        Starter-Datenbank zum Übernehmen ist in Vorbereitung.
      </p>
      <Button asChild>
        <Link href="/exercises/new">
          <Plus className="mr-2 h-4 w-4" />
          Erste Übung anlegen
        </Link>
      </Button>
    </div>
  )
}
