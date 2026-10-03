import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UnitList } from '@/components/units/unit-list'
import { UnitGeneratorEmptyState } from '@/components/units/unit-generator-empty-state'
import { getUnits } from '@/lib/actions/units'
import { getGroups } from '@/lib/actions/groups'

export default async function UnitsPage() {
  const [units, groups] = await Promise.all([getUnits(), getGroups()])

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl font-bold">Meine Einheiten</h1>
          <p className="text-muted-foreground">Deine generierten Trainingseinheiten.</p>
        </div>
        {groups.length > 0 && (
          <Button size="sm" asChild className="shrink-0">
            <Link href="/units/new">
              <Sparkles className="mr-2 h-4 w-4" />
              Einheit generieren
            </Link>
          </Button>
        )}
      </div>

      {groups.length === 0 ? (
        <UnitGeneratorEmptyState variant="no-groups" />
      ) : units.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h2 className="mb-1 text-lg font-semibold">Noch keine Einheit generiert</h2>
          <p className="mx-auto mb-4 max-w-md text-sm text-muted-foreground">
            Wähle eine Gruppe, lege fest wie die Stunde aufgebaut sein soll, und der Generator
            stellt dir eine passende Einheit zusammen.
          </p>
          <Button asChild>
            <Link href="/units/new">
              <Sparkles className="mr-2 h-4 w-4" />
              Erste Einheit generieren
            </Link>
          </Button>
        </div>
      ) : (
        <div className="max-w-3xl">
          <UnitList units={units} showGroupName />
        </div>
      )}
    </div>
  )
}
