'use client'

import Link from 'next/link'
import { ClipboardList, Library, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { libraryHref } from '@/lib/library/address'

interface EmptyStateProps {
  /** Ohne Bestand kein Verweis dorthin (PROJ-4, Edge Case 11). */
  libraryHasContent?: boolean
}

export function EmptyState({ libraryHasContent = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Noch keine Übungen vorhanden</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        {libraryHasContent
          ? 'Lege deine erste Übung an oder übernimm fertige Übungen aus der Übungsdatenbank — übernommene gehören danach dir und lassen sich frei ändern.'
          : 'Erstelle deine erste Übung und baue dir eine persönliche Sammlung auf.'}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button asChild>
          <Link href="/exercises/new">
            <Plus className="mr-2 h-4 w-4" />
            Erste Übung anlegen
          </Link>
        </Button>
        {libraryHasContent && (
          <Button variant="outline" asChild>
            <Link href={libraryHref()}>
              <Library className="mr-2 h-4 w-4" />
              Aus der Übungsdatenbank übernehmen
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}
