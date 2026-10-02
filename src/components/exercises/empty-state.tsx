'use client'

import Link from 'next/link'
import { ClipboardList, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <ClipboardList className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">Noch keine Übungen vorhanden</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Erstelle deine erste Übung und baue dir eine persönliche Sammlung auf.
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
