'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Clock, Users, MapPin, CalendarDays, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { useToast } from '@/hooks/use-toast'
import { WEEKDAY_SHORT } from '@/lib/types/group'
import type { Group } from '@/lib/types/group'

interface GroupCardProps {
  group: Group
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

export function GroupCard({ group, onDelete }: GroupCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleteOpen, setDeleteOpen] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  const recurringSchedules = group.schedules.filter((s) => s.scheduleType === 'recurring')
  const oneTimeSchedules = group.schedules.filter((s) => s.scheduleType === 'one_time')

  const recurringText = recurringSchedules
    .map((s) => `${WEEKDAY_SHORT[s.weekday] ?? s.weekday} ${s.startTime}–${s.endTime}`)
    .join(', ')
  const oneTimeText = oneTimeSchedules
    .map((s) => `${s.date ? formatDate(s.date) : ''} ${s.startTime}–${s.endTime}`)
    .join(', ')

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await onDelete(group.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Gruppe gelöscht' })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  return (
    <>
      <Card className="hover:shadow-md transition-shadow h-full relative group/card">
        <Link href={`/groups/${group.id}`} className="absolute inset-0 z-0" />
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 relative z-10 opacity-0 group-hover/card:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/groups/${group.id}/edit`)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteOpen(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {group.sports.map((sport) => (
              <Badge key={sport} variant="outline" className="text-xs">
                {sport}
              </Badge>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex flex-wrap gap-1">
            {group.ageGroups.map((ag) => (
              <Badge key={ag} variant="secondary" className="text-xs">
                {ag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground">
            {(group.participantsMin || group.participantsMax) && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {group.participantsMin && group.participantsMax
                  ? `${group.participantsMin}–${group.participantsMax}`
                  : group.participantsMin
                    ? `ab ${group.participantsMin}`
                    : `bis ${group.participantsMax}`}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {group.unitDuration} Min
            </span>
          </div>

          {recurringText && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {recurringText}
            </span>
          )}

          {oneTimeText && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              {oneTimeText}
            </span>
          )}

          {group.venue && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {group.venue.name}
            </span>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gruppe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du &quot;{group.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting ? 'Wird gelöscht...' : 'Endgültig löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
