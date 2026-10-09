'use client'

import * as React from 'react'
import Link from 'next/link'
import { Dices, ExternalLink, Loader2, Music, Search, TriangleAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ExerciseFactsRow } from '@/components/exercises/exercise-facts-row'
import { WorkNote } from '@/components/exercises/work-note'
import { cn } from '@/lib/utils'
import type { DraftItemExercise } from '@/lib/units/draft'

interface UnitItemCardProps {
  /**
   * Nur was die Karte anzeigt. Dadurch rendern geladene Einträge und die im
   * Bearbeiten-Modus eingesetzten durch dieselbe Karte — die Beschreibung
   * fehlt in beiden Fällen, weil die Karte sie nicht zeigt.
   */
  item: {
    plannedDuration: number
    variantId: string | null
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
  /** Wird an diesem Platz gerade gewürfelt? Dann zeigt es die Karte selbst. */
  rolling?: boolean
  /**
   * Nur im Bearbeiten-Modus gesetzt: eine Form aus „Varianten (n)" wählen.
   * `null` = zurück zur Grundübung. In der Leseansicht ist die Liste nur zum
   * Ansehen.
   */
  onSelectVariant?: (variantId: string | null) => void
  /** Die Arbeitsnotiz der Übung unter der Karte — nur in der Leseansicht. */
  showWorkNotes?: boolean
  /** Die Bedienzeile. Sitzt **im** Rahmen der Karte: beide bilden einen Block. */
  children?: React.ReactNode
}

export function UnitItemCard({
  item,
  refill,
  rolling = false,
  onSelectVariant,
  showWorkNotes = false,
  children,
}: UnitItemCardProps) {
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
                  {refill.rolling ? 'Wird gewürfelt …' : 'Auswürfeln'}
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
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        !children && 'hover:bg-muted/40',
        rolling && 'border-primary/40'
      )}
      aria-busy={rolling}
    >
      {/* Dass gewürfelt wird, steht an der Karte selbst — nicht nur als kleiner
          Kreisel am Menüknopf. Sonst wirkt ein laufender Vorgang wie ein
          Knopf, der nichts tut. */}
      {rolling && (
        <p role="status" className="mb-2 flex items-center gap-2 text-xs font-medium text-primary">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Wird gewürfelt …
        </p>
      )}

      <div className={cn(rolling && 'opacity-50')}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <Link
              href={`/exercises/${exercise.id}`}
              className="text-sm font-medium hover:underline"
            >
              {exercise.name}
            </Link>
            {exercise.variantTitle && (
              <p className="text-sm font-medium">
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
        </div>

        <ExerciseFactsRow
          className="mt-2"
          materials={exercise.materials}
          organizationForms={exercise.organizationForms}
          variants={exercise.variants}
          currentVariantId={item.variantId}
          onSelect={onSelectVariant}
        />

        {exercise.musicRequired && (
          <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
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
          </p>
        )}

        {showWorkNotes && exercise.workNotes && (
          <WorkNote className="mt-3" text={exercise.workNotes} />
        )}
      </div>

      {children}
    </div>
  )
}
