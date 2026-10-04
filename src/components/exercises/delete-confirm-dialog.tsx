'use client'

import * as React from 'react'
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
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'
import { ExerciseUsageWarning } from './exercise-usage-warning'

interface DeleteConfirmDialogProps {
  exerciseId: string
  exerciseName: string
  onConfirm: () => void
  disabled?: boolean
}

export function DeleteConfirmDialog({
  exerciseId,
  exerciseName,
  onConfirm,
  disabled,
}: DeleteConfirmDialogProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={disabled}>
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Übung löschen?</AlertDialogTitle>
          <AlertDialogDescription>
            Möchtest du &quot;{exerciseName}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            <ExerciseUsageWarning exerciseId={exerciseId} active={open} />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-destructive hover:bg-destructive/90">
            Endgültig löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
