'use client'

import Link from 'next/link'
import { Dices, ExternalLink, Layers, Loader2, Music, Package, Search, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DraftItemExercise } from '@/lib/units/draft'

interface UnitItemCardProps {
  /**
   * Nur was die Karte anzeigt. Dadurch rendern geladene Einträge und die im
   * Bearbeiten-Modus eingesetzten durch dieselbe Karte — die Beschreibung
   * fehlt in beiden Fällen, weil die Karte sie nicht zeigt.
   */
  item: {
    plannedDuration: number
    exercise: DraftItemExercise | null
  }
  /**
   * Nachbesetzen am Platzhalter einer gelöschten Übung. Nur im
   * Bearbeiten-Modus gesetzt — behebt BUG-5.
   */
  refill?: {
    rolling: boolean
    onReroll: () => void
    onChoose: () => void
  }
}

export function UnitItemCard({ item, refill }: UnitItemCardProps) {
  if (!item.exercise) {
    return (
      <div className="rounded-lg border border-dashed border-destructive/40 bg-destructive/5 p-3">
        <div className="flex items-start gap-2">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="space-y-2">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Übung gelöscht</p>
              <p className="text-xs text-muted-foreground">
                Diese Übung wurde aus deiner Datenbank entfernt. Der Platz von{' '}
                {item.plannedDuration} Minuten ist noch frei.
              </p>
            </div>
            {refill && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={refill.onReroll}
                  disabled={refill.rolling}
                >
                  {refill.rolling ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Dices className="mr-2 h-3.5 w-3.5" />
                  )}
                  Auswürfeln
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={refill.onChoose}>
                  <Search className="mr-2 h-3.5 w-3.5" />
                  Selbst wählen
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const exercise = item.exercise
  const durationDiffers = item.plannedDuration !== exercise.estimatedDuration

  return (
    <div className="rounded-lg border p-3 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <Link
            href={`/exercises/${exercise.id}`}
            className="text-sm font-medium hover:underline"
          >
            {exercise.name}
          </Link>
          {exercise.variantTitle && (
            <p className="text-xs text-muted-foreground">
              Variante: {exercise.variantTitle}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-medium tabular-nums">{item.plannedDuration} Min</p>
          {durationDiffers && (
            <p className="text-xs text-muted-foreground tabular-nums">
              geschätzt: {exercise.estimatedDuration}
            </p>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        {exercise.sports.map((sport) => (
          <Badge key={sport} variant="outline" className="text-xs">{sport}</Badge>
        ))}
        <Badge variant="secondary" className="text-xs">{exercise.difficulty}</Badge>
        {exercise.organizationForms.map((form) => (
          <Badge key={form} variant="secondary" className="text-xs">{form}</Badge>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3" />
          {exercise.materials.length > 0
            ? exercise.materials
                .map((m) => `${m.quantity}× ${m.name}${m.mode === 'pro Teilnehmer' ? ' p. TN' : ''}`)
                .join(', ')
            : 'kein Material'}
        </span>

        {exercise.variantCount > 0 && (
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {exercise.variantCount}{' '}
            {exercise.variantCount === 1 ? 'Variante verfügbar' : 'Varianten verfügbar'}
          </span>
        )}

        {exercise.musicRequired && (
          <span className="flex items-center gap-1">
            <Music className="h-3 w-3" />
            {exercise.musicLink ? (
              <a
                href={exercise.musicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:underline"
              >
                Musik
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              'Musik benötigt'
            )}
          </span>
        )}
      </div>
    </div>
  )
}
