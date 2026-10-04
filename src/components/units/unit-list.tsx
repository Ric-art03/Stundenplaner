import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Clock, Dumbbell } from 'lucide-react'
import { UnitActionsMenu } from './unit-actions-menu'
import type { UnitSummary } from '@/lib/types/unit'

interface UnitListProps {
  units: UnitSummary[]
  showGroupName?: boolean
}

export function UnitList({ units, showGroupName = false }: UnitListProps) {
  return (
    <div className="space-y-2">
      {units.map((unit) => (
        // Das Menü liegt neben dem Link statt darin — ein Klick darauf soll
        // die Einheit nicht öffnen.
        <div
          key={unit.id}
          className="relative rounded-lg border transition-colors hover:bg-muted/40"
        >
          <Link href={`/units/${unit.id}`} className="block p-3 pr-12">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{unit.name}</p>
                {showGroupName && (
                  <p className="truncate text-xs text-muted-foreground">{unit.groupName}</p>
                )}
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {format(new Date(unit.createdAt), 'd. MMM yyyy', { locale: de })}
              </span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {unit.totalMinutes} Min
              </span>
              <span className="flex items-center gap-1">
                <Dumbbell className="h-3 w-3" />
                {unit.exerciseCount}{' '}
                {unit.exerciseCount === 1 ? 'Übung' : 'Übungen'}
              </span>
            </div>
          </Link>

          <div className="absolute right-2 top-2">
            <UnitActionsMenu unitId={unit.id} unitName={unit.name} />
          </div>
        </div>
      ))}
    </div>
  )
}
