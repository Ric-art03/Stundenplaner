'use client'

import Link from 'next/link'
import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function GroupEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Noch keine Gruppen angelegt</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Lege deine Trainingsgruppen an, damit der Stundenplaner passende Übungen für jede Gruppe zusammenstellen kann.
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
