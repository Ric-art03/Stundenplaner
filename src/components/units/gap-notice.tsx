'use client'

import Link from 'next/link'
import { Loader2, Plus, TriangleAlert, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GapNoticeProps {
  segmentMinutes: number
  filledMinutes: number
  reason: string | null
  singleSportGroup: boolean
  relaxing: boolean
  onRelax: () => void
}

export function GapNotice({
  segmentMinutes,
  filledMinutes,
  reason,
  singleSportGroup,
  relaxing,
  onRelax,
}: GapNoticeProps) {
  const missing = segmentMinutes - filledMinutes

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="space-y-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {filledMinutes === 0
                ? `${segmentMinutes} Minuten nicht gefüllt`
                : `${filledMinutes} von ${segmentMinutes} Minuten gefüllt — ${missing} Minuten fehlen`}
            </p>
            {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
            {singleSportGroup && (
              <p className="text-xs text-muted-foreground">
                Deine Gruppe ist nur mit einer Sportart getaggt. Ergänze im Gruppenprofil
                weitere Sportarten, die in deinen Stunden vorkommen — das erhöht die Trefferzahl
                deutlich.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRelax}
              disabled={relaxing}
            >
              {relaxing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="mr-2 h-4 w-4" />
              )}
              Mit gelockerten Kriterien erneut versuchen
            </Button>
            <Button type="button" variant="ghost" size="sm" asChild>
              <Link href="/exercises/new">
                <Plus className="mr-2 h-4 w-4" />
                Übung anlegen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
