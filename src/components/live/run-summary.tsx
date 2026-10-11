'use client'

import { Check, SkipForward } from 'lucide-react'
import { StepFollowUp, type FollowUpChange } from './step-follow-up'
import { formatClock } from '@/lib/live/clock'
import { cn } from '@/lib/utils'
import type { RunRecord, RunStepRecord } from '@/lib/live/types'

interface RunSummaryProps {
  record: RunRecord
  /** Fehlt = ohne Nachbereitung (etwa solange nichts gespeichert ist). */
  followUp?: {
    returnTo: string
    /** Gesetzt = die vier Wege sind gerade nicht bedienbar; der Text sagt, warum. */
    disabledReason: string | null
    onChanged: (position: number, change: FollowUpChange) => void
  }
}

function Markers({ step }: { step: RunStepRecord }) {
  if (!step.adoptedNote && step.adoptedDuration === null) return null
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 text-xs font-medium text-primary">
      {step.adoptedNote && (
        <span>
          Notiz übernommen{step.adoptedNote === 'personal' ? ' (Anmerkungen)' : ''}
        </span>
      )}
      {step.adoptedDuration !== null && <span>Dauer übernommen: {step.adoptedDuration} Min</span>}
    </p>
  )
}

/**
 * Die Zusammenfassung einer Durchführung — **ein** Baustein für beide Orte:
 * direkt nach der Stunde im Live-Bildschirm und später an der gespeicherten
 * Durchführung auf der Detailseite. Sie zeigt den Plan, wie er lief.
 */
export function RunSummary({ record, followUp }: RunSummaryProps) {
  const skipped = record.steps.filter((step) => step.status === 'skipped').length

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-md border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Geplant</dt>
          <dd className="text-2xl font-semibold tabular-nums">{record.plannedMinutes} Min</dd>
        </div>
        <div className="rounded-md border px-3 py-2">
          <dt className="text-xs text-muted-foreground">Tatsächlich, ohne Pausen</dt>
          <dd className="text-2xl font-semibold tabular-nums">
            {formatClock(record.actualSeconds * 1000)}
          </dd>
        </div>
      </dl>
      {skipped > 0 && (
        <p className="text-sm text-muted-foreground">
          {skipped} {skipped === 1 ? 'Schritt' : 'Schritte'} ausgelassen
        </p>
      )}

      <ol className="divide-y rounded-md border">
        {record.steps.map((step) => {
          const done = step.status === 'done'
          return (
            <li key={step.position} className="px-3 py-2.5">
              <div className="flex items-start gap-2.5">
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full',
                    done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}
                  aria-hidden
                >
                  {done ? <Check className="h-3 w-3" /> : <SkipForward className="h-3 w-3" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={cn('break-words text-sm font-medium', !done && 'text-muted-foreground')}>
                    {step.name}
                    {step.variantTitle && (
                      <span className="font-normal text-muted-foreground"> · {step.variantTitle}</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {step.phase} · geplant {step.plannedMinutes} Min ·{' '}
                    {done ? (
                      <span className="text-foreground">
                        tatsächlich {formatClock(step.actualSeconds * 1000)}
                      </span>
                    ) : (
                      'ausgelassen'
                    )}
                  </p>
                  <Markers step={step} />
                  {followUp && (
                    <StepFollowUp
                      runId={record.id}
                      step={step}
                      returnTo={followUp.returnTo}
                      disabledReason={followUp.disabledReason}
                      onChanged={followUp.onChanged}
                    />
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ol>
      {followUp?.disabledReason && (
        <p className="text-xs text-muted-foreground">{followUp.disabledReason}</p>
      )}
    </div>
  )
}
