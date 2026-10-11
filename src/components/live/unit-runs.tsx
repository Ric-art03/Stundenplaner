'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { ChevronDown, Loader2, Pencil, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Textarea } from '@/components/ui/textarea'
import { RunSummary } from './run-summary'
import { useOnline } from '@/hooks/use-live-session'
import { useToast } from '@/hooks/use-toast'
import { deleteRun, updateRunNote } from '@/lib/actions/live'
import { formatClock } from '@/lib/live/clock'
import { cn } from '@/lib/utils'
import type { RunRecord } from '@/lib/live/types'

const NOTE_MAX = 2000

interface UnitRunsProps {
  unitId: string
  /** Neueste zuerst. */
  runs: RunRecord[]
}

function RunEntry({ unitId, run }: { unitId: string; run: RunRecord }) {
  const router = useRouter()
  const { toast } = useToast()
  const online = useOnline()
  const [open, setOpen] = React.useState(false)
  const [note, setNote] = React.useState<string | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)

  const skipped = run.steps.filter((step) => step.status === 'skipped').length

  async function saveNote() {
    if (note === null) return
    setBusy(true)
    try {
      const result = await updateRunNote(run.id, note.trim())
      if (!result.ok) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      setNote(null)
      toast({ title: 'Notiz gespeichert' })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Speichern fehlgeschlagen.' })
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    setBusy(true)
    try {
      const result = await deleteRun(run.id)
      if (!result.ok) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Durchführung gelöscht' })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex min-h-11 w-full items-start gap-3 px-3 py-2.5 text-left hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">
                {format(new Date(run.startedAt), "EEEE, d. MMMM yyyy · HH:mm 'Uhr'", { locale: de })}
              </span>
              <span className="block text-xs text-muted-foreground">
                {formatClock(run.actualSeconds * 1000)} von {run.plannedMinutes} Min
                {skipped > 0 && ` · ${skipped} ausgelassen`}
              </span>
              {run.note && !open && (
                <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">
                  „{run.note}“
                </span>
              )}
            </span>
            <ChevronDown
              className={cn('mt-1 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-4 px-3 pb-4 pt-1">
          <RunSummary
            record={run}
            followUp={{
              returnTo: `/units/${unitId}`,
              disabledReason: online ? null : 'Ohne Verbindung lässt sich an den Übungen nichts ändern.',
              // Die Vermerke hat der Server schon gesetzt — neu lesen genügt.
              onChanged: () => router.refresh(),
            }}
          />

          {note === null ? (
            <div className="space-y-2">
              {run.note ? (
                <p className="whitespace-pre-wrap rounded-md border px-3 py-2 text-sm">{run.note}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Notiz zu dieser Stunde.</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setNote(run.note)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Notiz ändern
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setConfirmingDelete(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Durchführung löschen
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX))}
                rows={3}
                maxLength={NOTE_MAX}
                aria-label="Notiz zur Stunde"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveNote} disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Speichern
                </Button>
                <Button variant="outline" size="sm" onClick={() => setNote(null)} disabled={busy}>
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Durchführung löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Das Protokoll dieser Stunde und ihre Notiz werden gelöscht. Die Einheit und ihre
              Übungen bleiben, wie sie sind.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void remove()
              }}
              disabled={busy}
              className="bg-destructive hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </li>
  )
}

/** Die Durchführungen einer Einheit, neueste zuerst — jede steht für sich. */
export function UnitRuns({ unitId, runs }: UnitRunsProps) {
  return (
    <section aria-labelledby="durchfuehrungen" className="mx-auto mt-10 max-w-3xl">
      <h2 id="durchfuehrungen" className="mb-2 text-lg font-semibold">
        Durchführungen
      </h2>
      {runs.length === 0 ? (
        <p className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Diese Einheit wurde noch nicht durchgeführt. Über „Stunde starten“ begleitet dich die App
          durch die Stunde und hält fest, was stattgefunden hat.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {runs.map((run) => (
            <RunEntry key={run.id} unitId={unitId} run={run} />
          ))}
        </ul>
      )}
    </section>
  )
}
