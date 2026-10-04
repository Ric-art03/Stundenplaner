'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { deleteUnit, renameUnit } from '@/lib/actions/units'

interface UnitActionsMenuProps {
  unitId: string
  unitName: string
  /** Wohin nach dem Löschen — auf der Detailseite weg, in Listen nur neu laden. */
  redirectAfterDelete?: string
}

export function UnitActionsMenu({
  unitId,
  unitName,
  redirectAfterDelete,
}: UnitActionsMenuProps) {
  const router = useRouter()
  const { toast } = useToast()

  const [renaming, setRenaming] = React.useState(false)
  const [confirmingDelete, setConfirmingDelete] = React.useState(false)
  const [draftName, setDraftName] = React.useState(unitName)
  const [busy, setBusy] = React.useState(false)

  function openRename() {
    setDraftName(unitName)
    setRenaming(true)
  }

  async function submitRename(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    try {
      const result = await renameUnit(unitId, draftName)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      setRenaming(false)
      toast({ title: 'Einheit umbenannt' })
      router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Umbenennen fehlgeschlagen.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    setBusy(true)
    try {
      const result = await deleteUnit(unitId)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Einheit gelöscht' })
      if (redirectAfterDelete) router.push(redirectAfterDelete)
      else router.refresh()
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setBusy(false)
      setConfirmingDelete(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label={`Aktionen für ${unitName}`}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setTimeout(openRename, 0)}>
            <Pencil className="mr-2 h-4 w-4" />
            Umbenennen
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setTimeout(() => setConfirmingDelete(true), 0)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Löschen
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent>
          <form onSubmit={submitRename}>
            <DialogHeader>
              <DialogTitle>Einheit umbenennen</DialogTitle>
              <DialogDescription>
                Der automatische Name aus Gruppe und Datum lässt sich jederzeit durch einen
                eigenen ersetzen.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-4">
              <Label htmlFor="unit-name">Name</Label>
              <Input
                id="unit-name"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                maxLength={200}
                autoFocus
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRenaming(false)}
                disabled={busy}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={busy || draftName.trim() === ''}>
                {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Speichern
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Einheit löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              „{unitName}&quot; wird endgültig entfernt. Deine Übungen bleiben erhalten — die
              Einheit verweist nur auf sie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                confirmDelete()
              }}
              disabled={busy}
              className="bg-destructive hover:bg-destructive/90"
            >
              {busy ? 'Wird gelöscht…' : 'Endgültig löschen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
