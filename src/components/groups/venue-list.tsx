'use client'

import * as React from 'react'
import Link from 'next/link'
import { ArrowLeft, Pencil, Trash2, MapPin, Plus, Package, ChevronDown, ChevronUp, Info, Users } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { VenueDialog } from './venue-dialog'
import type { Venue, VenueFormData } from '@/lib/types/group'

interface VenueWithGroups extends Venue {
  groupCount: number
  groupNames: string[]
}

interface VenueListProps {
  venues: VenueWithGroups[]
  customMaterials: string[]
  onCreateVenue: (data: VenueFormData) => Promise<{ id?: string; error?: string }>
  onUpdateVenue: (id: string, data: VenueFormData) => Promise<{ success?: boolean; error?: string }>
  onDeleteVenue: (id: string) => Promise<{ success?: boolean; error?: string }>
}

export function VenueList({
  venues: initialVenues,
  customMaterials,
  onCreateVenue,
  onUpdateVenue,
  onDeleteVenue,
}: VenueListProps) {
  const { toast } = useToast()
  const [venues, setVenues] = React.useState(initialVenues)
  const [editVenue, setEditVenue] = React.useState<VenueWithGroups | null>(null)
  const [createOpen, setCreateOpen] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<VenueWithGroups | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [expandedMaterials, setExpandedMaterials] = React.useState<Set<string>>(new Set())

  async function handleCreate(data: VenueFormData) {
    const result = await onCreateVenue(data)
    if (result.id) {
      const newVenue: VenueWithGroups = {
        id: result.id,
        userId: '',
        name: data.name,
        notes: data.notes || null,
        materials: data.materials,
        groupCount: 0,
        groupNames: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setVenues((prev) => [...prev, newVenue])
    }
    return result
  }

  async function handleUpdate(data: VenueFormData) {
    if (!editVenue) return { error: 'Keine Halle ausgewählt' }
    const result = await onUpdateVenue(editVenue.id, data)
    if (!result.error) {
      setVenues((prev) =>
        prev.map((v) =>
          v.id === editVenue.id
            ? { ...v, name: data.name, notes: data.notes || null, materials: data.materials }
            : v
        )
      )
    }
    return result
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const result = await onDeleteVenue(deleteTarget.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Halle gelöscht' })
      setVenues((prev) => prev.filter((v) => v.id !== deleteTarget.id))
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/groups">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Alle Gruppen
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Hallen verwalten</h1>
          <p className="text-muted-foreground mt-1">Bearbeite oder lösche deine Trainingsstandorte.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Neue Halle
        </Button>
      </div>

      {venues.length === 0 ? (
        <div className="text-center py-12">
          <div className="rounded-full bg-muted p-4 mb-4 inline-block">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Noch keine Hallen angelegt</h2>
          <p className="text-muted-foreground mb-6">
            Lege eine Halle an, um ihr Material und Besonderheiten zu erfassen.
          </p>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Erste Halle anlegen
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {venues.map((venue) => (
            <div key={venue.id} className="flex items-start justify-between p-4 border rounded-lg">
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="font-medium">{venue.name}</span>
                </div>

                {venue.materials.length > 0 && (() => {
                  const isExpanded = expandedMaterials.has(venue.id)
                  const showToggle = venue.materials.length > 6
                  const visible = showToggle && !isExpanded ? venue.materials.slice(0, 6) : venue.materials
                  return (
                    <div className="ml-6">
                      <div className="flex flex-wrap gap-1">
                        {visible.map((mat, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            {mat.quantity}× {mat.name}
                          </Badge>
                        ))}
                        {showToggle && !isExpanded && (
                          <Badge variant="secondary" className="text-xs">
                            +{venue.materials.length - 6} weitere
                          </Badge>
                        )}
                      </div>
                      {showToggle && (
                        <button
                          type="button"
                          className="text-xs text-primary hover:underline mt-1 flex items-center gap-0.5"
                          onClick={() => setExpandedMaterials((prev) => {
                            const next = new Set(prev)
                            isExpanded ? next.delete(venue.id) : next.add(venue.id)
                            return next
                          })}
                        >
                          {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          {isExpanded ? 'Weniger' : 'Alle anzeigen'}
                        </button>
                      )}
                    </div>
                  )
                })()}

                {venue.notes && (
                  <p className="text-xs text-muted-foreground ml-6 flex items-start gap-1">
                    <Info className="h-3 w-3 shrink-0 mt-0.5" />
                    <span className="whitespace-pre-wrap">{venue.notes}</span>
                  </p>
                )}

                <div className="text-xs text-muted-foreground ml-6 flex items-start gap-1">
                  <Users className="h-3 w-3 shrink-0 mt-0.5" />
                  {venue.groupCount === 0
                    ? <span>Keiner Gruppe zugewiesen</span>
                    : (
                      <span>
                        Zugewiesene Gruppen: <span className="font-medium">{venue.groupNames.join(', ')}</span>
                      </span>
                    )}
                </div>
              </div>
              <div className="flex gap-1 shrink-0 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditVenue(venue)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setDeleteTarget(venue)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <VenueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSave={handleCreate}
        customMaterials={customMaterials}
      />

      {/* Edit dialog */}
      <VenueDialog
        open={!!editVenue}
        onOpenChange={(open) => !open && setEditVenue(null)}
        venue={editVenue}
        onSave={handleUpdate}
        customMaterials={customMaterials}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Halle löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && deleteTarget.groupCount > 0 ? (
                <>
                  Diese Halle wird von {deleteTarget.groupCount === 1 ? '1 Gruppe' : `${deleteTarget.groupCount} Gruppen`} verwendet
                  {deleteTarget.groupNames.length > 0 && (
                    <> ({deleteTarget.groupNames.join(', ')})</>
                  )}
                  . Diese Gruppen haben danach keine Halle mehr zugewiesen.
                </>
              ) : (
                <>Möchtest du &quot;{deleteTarget?.name}&quot; wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.</>
              )}
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
    </div>
  )
}
