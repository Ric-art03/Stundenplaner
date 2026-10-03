import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { Clock, Dumbbell } from 'lucide-react'
import type { UnitSummary } from '@/lib/types/unit'

interface UnitListProps {
  units: UnitSummary[]
  showGroupName?: boolean
}

export function UnitList({ units, showGroupName = false }: UnitListProps) {
  return (
    <div className="space-y-2">
      {units.map((unit) => (
        <Link
          key={unit.id}
          href={`/units/${unit.id}`}
          className="block rounded-lg border p-3 transition-colors hover:bg-muted/40"
        >
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
      ))}
    </div>
  )
}
