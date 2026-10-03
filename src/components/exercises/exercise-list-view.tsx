'use client'

import Link from 'next/link'
import { Clock, Users, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Exercise } from '@/lib/types/exercise'

interface ExerciseListViewProps {
  exercises: Exercise[]
  onRequestDelete?: (exercise: Exercise) => void
}

export function ExerciseListView({ exercises, onRequestDelete }: ExerciseListViewProps) {
  return (
    <div className="divide-y border rounded-lg">
      {exercises.map((exercise) => (
        <div
          key={exercise.id}
          className="flex items-center gap-3 p-4 hover:bg-accent/50 transition-colors"
        >
          <Link href={`/exercises/${exercise.id}`} className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <h3 className="font-medium truncate">{exercise.name}</h3>
              <DifficultyDot difficulty={exercise.difficulty} />
            </div>
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
              {exercise.phases.map((phase) => (
                <Badge key={phase} variant="secondary" className="text-xs font-normal">
                  {phase}
                </Badge>
              ))}
              {exercise.phases.length > 0 && exercise.sports.length > 0 && (
                <span className="text-muted-foreground/30">|</span>
              )}
              {exercise.sports.map((sport) => (
                <Badge key={sport} variant="outline" className="text-xs">
                  {sport}
                </Badge>
              ))}
              {exercise.sports.length > 0 && (
                <span className="text-muted-foreground/30">|</span>
              )}
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {exercise.duration} Min
              </span>
              {(exercise.participantsMin || exercise.participantsMax) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
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
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
      ))}
    </div>
  )
}

function DifficultyDot({ difficulty }: { difficulty: string }) {
  const color =
    difficulty === 'Leicht' ? 'bg-green-500' :
    difficulty === 'Schwer' ? 'bg-red-500' :
    'bg-yellow-500'
  return (
    <span className={`inline-block w-2 h-2 rounded-full shrink-0 ${color}`} title={`Schwierigkeit: ${difficulty}`} />
  )
}
