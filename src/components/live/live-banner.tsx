'use client'

import * as React from 'react'
import Link from 'next/link'
import { CloudOff, Play, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLiveSession, useNow, useOnline, usePendingRuns } from '@/hooks/use-live-session'
import { saveRun } from '@/lib/actions/live'
import { isForgotten } from '@/lib/live/clock'
import { dropPending, flushPending } from '@/lib/live/store'

interface LiveBannerProps {
  /** Das angemeldete Konto — die Akte eines anderen wird nicht gezeigt. */
  userId: string
}

/**
 * Der Stunden-Hinweis in der Kopfzeile, auf jeder Seite der App:
 *
 * - „Stunde läuft — fortsetzen“, solange eine Stunde offen ist,
 * - „Durchführung wartet auf Verbindung“, solange etwas nachzureichen ist,
 * - und der Grund samt „Verwerfen“, wenn das Nachreichen endgültig scheitert.
 *
 * Er ist zugleich der Ort, an dem nachgereicht wird: beim Öffnen der App und
 * sobald das Gerät wieder Verbindung meldet.
 */
export function LiveBanner({ userId }: LiveBannerProps) {
  const session = useLiveSession()
  const pending = usePendingRuns()
  const online = useOnline()
  const now = useNow(false)

  const mine = pending.filter((entry) => entry.userId === userId)
  const waiting = mine.filter((entry) => !entry.failure)
  const failed = mine.filter((entry) => entry.failure)

  React.useEffect(() => {
    if (online && waiting.length > 0) void flushPending(userId, saveRun)
  }, [online, waiting.length, userId])

  const running = session && session.userId === userId && session.run.phase === 'running' ? session : null

  if (!running && mine.length === 0) return null

  return (
    // Klebt unter der Kopfzeile (die ist 4rem hoch und klebt selbst): wer die
    // Stunde verlassen hat, sieht den Rückweg auch nach dem Scrollen.
    <div className="sticky top-16 z-30 border-b bg-background text-sm shadow-sm" role="status">
      {running && (
        <Link
          href="/live"
          className="block bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        >
          <span className="container mx-auto flex min-h-11 items-center gap-2 px-4 font-semibold">
            <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden />
            <span className="min-w-0 truncate">
              {/* Eine vergessene Stunde wird nicht still weitergezählt. */}
              {isForgotten(running.run, running.plan, now)
                ? 'Läuft diese Stunde noch? Beenden oder verwerfen'
                : 'Stunde läuft — fortsetzen'}
            </span>
            <span className="min-w-0 truncate font-normal opacity-90">
              {running.plan.unitName}
            </span>
          </span>
        </Link>
      )}

      {mine.length > 0 && (
        <div className="container mx-auto space-y-1.5 px-4 py-2">
        {waiting.length > 0 && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <CloudOff className="h-4 w-4 shrink-0" aria-hidden />
            {waiting.length === 1
              ? 'Eine Durchführung wartet auf Verbindung und wird nachgereicht.'
              : `${waiting.length} Durchführungen warten auf Verbindung und werden nachgereicht.`}
          </p>
        )}

        {failed.map((entry) => (
          <div key={entry.record.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className="flex min-w-0 flex-1 items-start gap-2 text-destructive">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                Die Durchführung von „{entry.record.unitName}“ konnte nicht gespeichert werden:{' '}
                {entry.failure}
              </span>
            </p>
            <Button variant="outline" size="sm" onClick={() => dropPending(entry.record.id)}>
              Verwerfen
            </Button>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}
