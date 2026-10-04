'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, Clock, Info, Loader2, RefreshCw, Save, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { UnitItemCard } from './unit-item-card'
import { GapNotice } from './gap-notice'
import { regenerateUnit, relaxSegment, saveUnit } from '@/lib/actions/units'
import type { Unit, UnitSegment } from '@/lib/types/unit'

interface UnitPlanViewProps {
  unit: Unit
  singleSportGroup: boolean
}

export function UnitPlanView({ unit, singleSportGroup }: UnitPlanViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<string | null>(null)

  async function regenerate() {
    setBusy('regenerate')
    try {
      const result = await regenerateUnit(unit.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Neu generiert' })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Generieren fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setBusy(null)
    }
  }

  /** Lockern wirkt nur in dem Segment, in dem der Nutzer geklickt hat. */
  async function relax(segmentId: string) {
    setBusy(segmentId)
    try {
      const result = await relaxSegment(segmentId)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Erneuter Versuch fehlgeschlagen.',
      })
    } finally {
      setBusy(null)
    }
  }

  async function save() {
    setBusy('save')
    try {
      const result = await saveUnit(unit.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Einheit gespeichert' })
      router.refresh()
    } catch {
      toast({
        variant: 'destructive',
        title: 'Fehler',
        description: 'Speichern fehlgeschlagen, bitte erneut versuchen.',
      })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Kopf */}
      <div className="space-y-4">
        <div className="min-w-0">
          {/* Zurück in den Generator — die Konfiguration dieser Einheit wird
              dort wieder geladen und lässt sich weiter anpassen. */}
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/units/new?from=${unit.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Generator
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{unit.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              {unit.totalMinutes} Minuten
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {unit.groupName}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          {unit.saved ? (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Check className="h-4 w-4 text-primary" />
              Gespeichert
            </span>
          ) : (
            <Button size="sm" onClick={save} disabled={busy !== null}>
              {busy === 'save' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Einheit speichern
            </Button>
          )}

          {unit.manuallyEdited ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={busy !== null}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Neu generieren
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Änderungen überschreiben?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Deine Änderungen an dieser Einheit werden überschrieben. Die
                    Zeitstrahl-Konfiguration bleibt erhalten — du bekommst nur eine andere
                    Übungsauswahl.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                  <AlertDialogAction onClick={regenerate}>Neu generieren</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button variant="outline" size="sm" onClick={regenerate} disabled={busy !== null}>
              {busy === 'regenerate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Neu generieren
            </Button>
          )}
        </div>

        {!unit.saved && (
          <p className="text-xs text-muted-foreground">
            Noch nicht gespeichert — diese Einheit erscheint erst in deinen Übersichten,
            wenn du sie speicherst. Ein neuer Durchlauf im Generator ersetzt sie.
          </p>
        )}
      </div>

      {unit.relaxedNote && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">{unit.relaxedNote}</AlertDescription>
        </Alert>
      )}

      <Separator />

      {/* Stundenverlauf */}
      <div className="space-y-6">
        {unit.segments.map((segment) => (
          <SegmentBlock
            key={segment.id}
            segment={segment}
            singleSportGroup={singleSportGroup}
            relaxing={busy === segment.id}
            onRelax={() => relax(segment.id)}
          />
        ))}
      </div>
    </div>
  )
}

function SegmentBlock({
  segment,
  singleSportGroup,
  relaxing,
  onRelax,
}: {
  segment: UnitSegment
  singleSportGroup: boolean
  relaxing: boolean
  onRelax: () => void
}) {
  const filledMinutes = segment.items.reduce((sum, item) => sum + item.plannedDuration, 0)
  const hasGap = segment.fillMode === 'generate' && filledMinutes < segment.minutes

  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {segment.fillMode === 'empty' ? `${segment.name} · frei` : segment.name}
        </h2>
        <span className="text-xs text-muted-foreground tabular-nums">{segment.minutes} Min</span>
      </div>

      {segment.notes && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm whitespace-pre-wrap">
          {segment.notes}
        </p>
      )}

      {segment.fillMode === 'empty' ? (
        <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          — Lücke —
          <p className="mt-1 text-xs">
            {segment.notes ? 'Du füllst diesen Abschnitt selbst.' : 'Bewusst frei gelassen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {segment.items.map((item) => (
            <UnitItemCard key={item.id} item={item} />
          ))}

          {hasGap && (
            <GapNotice
              segmentMinutes={segment.minutes}
              filledMinutes={filledMinutes}
              reason={segment.gapReason}
              detail={segment.gapDetail}
              singleSportGroup={singleSportGroup}
              relaxing={relaxing}
              onRelax={onRelax}
            />
          )}
        </div>
      )}
    </section>
  )
}
