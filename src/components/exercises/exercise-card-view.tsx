'use client'

import * as React from 'react'
import Link from 'next/link'
import { Clock, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { ExerciseFactsRow } from './exercise-facts-row'
import { variantFacts } from './variant-facts'
import type { Exercise } from '@/lib/types/exercise'

interface ExerciseCardViewProps {
  exercises: Exercise[]
  onRequestDelete?: (exercise: Exercise) => void
}

export function ExerciseCardView({ exercises, onRequestDelete }: ExerciseCardViewProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {exercises.map((exercise) => (
        <Card key={exercise.id} className="h-full hover:shadow-md transition-shadow relative">
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Aktionen</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/exercises/${exercise.id}/edit`}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Bearbeiten
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onRequestDelete?.(exercise)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Link href={`/exercises/${exercise.id}`}>
            {exercise.images.find((img) => img.isCover)?.path ? (
              <CardImage storagePath={exercise.images.find((img) => img.isCover)!.path} alt={exercise.name} />
            ) : exercise.images[0]?.path ? (
              <CardImage storagePath={exercise.images[0].path} alt={exercise.name} />
            ) : (
              <div className="h-40 bg-muted rounded-t-lg flex items-center justify-center">
                <span className="text-4xl opacity-30">
                  {getSportEmoji(exercise.sports[0])}
                </span>
              </div>
            )}
            <CardContent className="p-4 pb-2">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-medium truncate">{exercise.name}</h3>
                <DifficultyDot difficulty={exercise.difficulty} />
                {exercise.needsCompletion && (
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    noch zu ergänzen
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {exercise.phases.map((phase) => (
                  <Badge key={phase} variant="secondary" className="text-xs font-normal">
                    {phase}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-1 mb-3">
                {exercise.sports.map((sport) => (
                  <Badge key={sport} variant="outline" className="text-xs">
                    {sport}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {exercise.duration} Min
                </span>
                {(exercise.participantsMin || exercise.participantsMax) && (
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {exercise.participantsMin && exercise.participantsMax
                      ? exercise.participantsMin === exercise.participantsMax
                        ? `${exercise.participantsMin}`
                        : `${exercise.participantsMin}–${exercise.participantsMax}`
                      : exercise.participantsMin
                        ? `ab ${exercise.participantsMin}`
                        : `bis ${exercise.participantsMax}`}
                  </span>
                )}
              </div>
            </CardContent>
          </Link>
          {/* Neben dem Verweis, nicht in ihm: „Varianten (n)" klappt auf, ohne
              die Detailseite zu öffnen. */}
          <ExerciseFactsRow
            className="px-4 pb-4"
            materials={exercise.materials}
            organizationForms={exercise.organizationForms}
            variants={variantFacts(exercise.variants)}
          />
        </Card>
      ))}
    </div>
  )
}

function CardImage({ storagePath, alt }: { storagePath: string; alt: string }) {
  const [src, setSrc] = React.useState<string | null>(
    storagePath.startsWith('http') ? storagePath : null
  )

  React.useEffect(() => {
    if (storagePath.startsWith('http')) return
    const supabase = createClient()
    supabase.storage
      .from('exercise-images')
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data }) => {
        if (data?.signedUrl) setSrc(data.signedUrl)
      })
  }, [storagePath])

  if (!src) {
    return <div className="h-40 bg-muted rounded-t-lg animate-pulse" />
  }

  return (
    <div className="h-40 bg-muted rounded-t-lg overflow-hidden flex items-center justify-center">
      <img src={src} alt={alt} className="max-w-full max-h-full object-contain" />
    </div>
  )
}

function DifficultyDot({ difficulty }: { difficulty: string }) {
  const color =
    difficulty === 'Leicht' ? 'bg-green-500' :
    difficulty === 'Schwer' ? 'bg-red-500' :
    'bg-yellow-500'
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${color}`} title={`Schwierigkeit: ${difficulty}`} />
  )
}

function getSportEmoji(sport?: string): string {
  const map: Record<string, string> = {
    'Fußball': '⚽', 'Volleyball': '🏐', 'Basketball': '🏀',
    'Handball': '🤾', 'Turnen': '🤸', 'Schwimmen': '🏊',
    'Leichtathletik': '🏃', 'Tanzen': '💃', 'Fitness/Workout': '💪',
    'Kinderturnen': '🤸', 'Kinderspiele': '🎮', 'Krabbelgruppe': '👶',
    'Eltern-Kind Turnen': '👨‍👧', 'Vorschulturnen': '🧒',
  }
  return sport ? (map[sport] ?? '🏅') : '🏅'
}
