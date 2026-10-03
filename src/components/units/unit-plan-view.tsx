'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Info, Loader2, RefreshCw, Users } from 'lucide-react'
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
import { regenerateUnit } from '@/lib/actions/units'
import type { Unit, UnitSegment } from '@/lib/types/unit'

interface UnitPlanViewProps {
  unit: Unit
  singleSportGroup: boolean
}

export function UnitPlanView({ unit, singleSportGroup }: UnitPlanViewProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = React.useState<'regenerate' | 'relax' | null>(null)

  async function run(mode: 'regenerate' | 'relax') {
    setBusy(mode)
    try {
      const result = await regenerateUnit(unit.id, mode === 'relax')
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: mode === 'relax' ? 'Mit gelockerten Kriterien neu generiert' : 'Neu generiert' })
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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Kopf */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
            <Link href={`/groups/${unit.groupId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {unit.groupName}
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

        <div className="shrink-0">
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
                  <AlertDialogAction onClick={() => run('regenerate')}>
                    Neu generieren
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => run('regenerate')}
              disabled={busy !== null}
            >
              {busy === 'regenerate' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Neu generieren
            </Button>
          )}
        </div>
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
            relaxing={busy === 'relax'}
            onRelax={() => run('relax')}
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
