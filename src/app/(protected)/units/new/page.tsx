import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getGroups } from '@/lib/actions/groups'
import { getCustomCategories, getExercises } from '@/lib/actions/exercises'
import { getUnit } from '@/lib/actions/units'
import { EMPTY_FILTERS } from '@/lib/types/exercise'
import { UnitConfigForm } from '@/components/units/unit-config-form'
import { UnitGeneratorEmptyState } from '@/components/units/unit-generator-empty-state'
import type { SegmentConfig } from '@/lib/types/unit'

interface NewUnitPageProps {
  searchParams: Promise<{ group?: string; from?: string }>
}

export default async function NewUnitPage({ searchParams }: NewUnitPageProps) {
  const { group: groupParam, from: fromUnitId } = await searchParams

  const [groups, categories, exerciseResult] = await Promise.all([
    getGroups(),
    getCustomCategories(),
    // Nur die Gesamtzahl interessiert hier — deshalb ein Limit von 1.
    getExercises(EMPTY_FILTERS, 'name', 'asc', 0, 1),
  ])

  // „Zurück zum Generator" aus einer Einheit: deren Konfiguration wird wieder
  // geladen, damit der Nutzer mit denselben Einstellungen weiterarbeiten kann.
  const source = fromUnitId ? await getUnit(fromUnitId) : null
  const initialSegments: SegmentConfig[] | undefined = source
    ? source.segments.map((segment) => ({
        id: segment.id,
        name: segment.name,
        minutes: segment.minutes,
        fillMode: segment.fillMode,
        sports: segment.sports,
        primarySport: segment.primarySport,
        difficulties: segment.difficulties,
        notes: segment.notes,
      }))
    : undefined

  const initialGroupId = source
    ? source.groupId
    : groupParam && groups.some((g) => g.id === groupParam)
      ? groupParam
      : undefined

  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link href="/units">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Alle Einheiten
          </Link>
        </Button>
        <h1 className="mb-1 text-2xl font-bold">Einheit generieren</h1>
        <p className="text-muted-foreground">
          {source
            ? 'Deine Einstellungen aus dem letzten Durchlauf sind geladen — passe an, was du ändern willst.'
            : 'Der Generator stellt eine strukturierte Einheit aus deiner Übungsdatenbank zusammen.'}
        </p>
      </div>

      <div className="mx-auto max-w-3xl">
        {groups.length === 0 ? (
          <UnitGeneratorEmptyState variant="no-groups" />
        ) : exerciseResult.total === 0 ? (
          <UnitGeneratorEmptyState variant="no-exercises" />
        ) : (
          <UnitConfigForm
            groups={groups}
            customPhases={categories.phase ?? []}
            customSports={categories.sport ?? []}
            initialGroupId={initialGroupId}
            initialSegments={initialSegments}
          />
        )}
      </div>
    </div>
  )
}
