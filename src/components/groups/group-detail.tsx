'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Pencil, Clock, Users, MapPin, Package, CalendarDays, RefreshCw, Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
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
import { Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { UnitList } from '@/components/units/unit-list'
import type { Group } from '@/lib/types/group'
import type { UnitSummary } from '@/lib/types/unit'

interface GroupDetailProps {
  group: Group
  units: UnitSummary[]
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>
}

export function GroupDetail({ group, units, onDelete }: GroupDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await onDelete(group.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Gruppe gelöscht' })
      router.push('/groups')
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Alle Gruppen
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{group.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {group.sports.map((sport) => (
              <Badge
                key={sport}
                variant={sport === group.primarySport ? 'default' : 'outline'}
                title={sport === group.primarySport ? 'Hauptsportart' : undefined}
              >
                {sport}
              </Badge>
            ))}
          </div>
          {group.primarySport && (
            <p className="mt-1 text-xs text-muted-foreground">
              Hauptsportart: {group.primarySport} — der Generator gewichtet sie doppelt.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:justify-end gap-2 shrink-0">
          <Button size="sm" asChild>
            <Link href={`/units/new?group=${group.id}`}>
              <Sparkles className="mr-2 h-4 w-4" />
              Einheit generieren
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/groups/${group.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={deleting}>
                <Trash2 className="mr-2 h-4 w-4" />
                Löschen
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Gruppe löschen?</AlertDialogTitle>
                <AlertDialogDescription>
                  Möchtest du &quot;{group.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Endgültig löschen
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Separator />

      {/* Metadaten */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetaItem
          icon={<Clock className="h-4 w-4" />}
          label="Einheitsdauer"
          value={`${group.unitDuration} Minuten`}
        />
        {group.participants && (
          <MetaItem
            icon={<Users className="h-4 w-4" />}
            label="Teilnehmer"
            value={`${group.participants}`}
          />
        )}
      </section>

      {/* Altersgruppen */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Altersgruppe</h2>
        <div className="flex flex-wrap gap-1">
          {group.ageGroups.map((ag) => (
            <Badge key={ag} variant="secondary">{ag}</Badge>
          ))}
        </div>
      </section>

      {/* Trainingszeiten */}
      {group.schedules.length > 0 && (() => {
        const recurring = group.schedules.filter((s) => s.scheduleType === 'recurring')
        const oneTime = group.schedules.filter((s) => s.scheduleType === 'one_time')
        return (
          <section className="space-y-3">
            {recurring.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Wiederkehrende Hallenzeiten
                </h2>
                <div className="space-y-1">
                  {recurring.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium w-28">{s.weekday}</span>
                      <span>{s.startTime}–{s.endTime}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {oneTime.length > 0 && (
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> Einmalige Termine
                </h2>
                <div className="space-y-1">
                  {oneTime.map((s, i) => {
                    const dateStr = s.date
                      ? (() => { const [y, m, d] = s.date.split('-'); return `${d}.${m}.${y}` })()
                      : ''
                    return (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium w-28">{dateStr}</span>
                        <span>{s.startTime}–{s.endTime}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </section>
        )
      })()}

      {/* Halle */}
      {group.venue && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Halle / Ort</h2>
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{group.venue.name}</span>
            </div>
            {group.venue.materials.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Verfügbares Material</p>
                <div className="flex flex-wrap gap-1">
                  {group.venue.materials.map((mat, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      <Package className="h-3 w-3 mr-1" />
                      {mat.quantity}× {mat.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {group.venue.notes && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Besonderheiten</p>
                <p className="text-sm whitespace-pre-wrap">{group.venue.notes}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Generierte Einheiten */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Einheiten</h2>
        {units.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Für diese Gruppe wurde noch keine Einheit generiert.
            </p>
            <Button size="sm" asChild>
              <Link href={`/units/new?group=${group.id}`}>
                <Sparkles className="mr-2 h-4 w-4" />
                Erste Einheit generieren
              </Link>
            </Button>
          </div>
        ) : (
          <UnitList units={units} />
        )}
      </section>
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
