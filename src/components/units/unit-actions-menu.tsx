'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import { deleteUnit, renameUnit } from '@/lib/actions/units'
import { UnitNameDialog } from './unit-name-dialog'

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
  const [busy, setBusy] = React.useState(false)

  async function submitRename(name: string) {
    setBusy(true)
    try {
      const result = await renameUnit(unitId, name)
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
          <DropdownMenuItem onSelect={() => setTimeout(() => setRenaming(true), 0)}>
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

      <UnitNameDialog
        open={renaming}
        onOpenChange={setRenaming}
        title="Einheit umbenennen"
        description="Der automatische Name aus Gruppe und Datum lässt sich jederzeit durch einen eigenen ersetzen."
        confirmLabel="Speichern"
        initialName={unitName}
        busy={busy}
        onConfirm={submitRename}
      />

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
