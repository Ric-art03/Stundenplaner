'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface UnitNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  /** Der vorhandene Name — vorausgefüllt und sofort editierbar. */
  initialName: string
  busy: boolean
  onConfirm: (name: string) => void
}

/**
 * Ein Name für die Einheit, gemeinsam genutzt von „Einheit speichern" und
 * „Umbenennen". Beide Wege stellen dieselbe Frage; nur die Beschriftung
 * unterscheidet sich.
 */
export function UnitNameDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  initialName,
  busy,
  onConfirm,
}: UnitNameDialogProps) {
  const [name, setName] = React.useState(initialName)

  // Beim Öffnen wieder auf den aktuellen Namen stellen — sonst stünde beim
  // zweiten Öffnen noch eine abgebrochene Eingabe im Feld.
  React.useEffect(() => {
    if (open) setName(initialName)
  }, [open, initialName])

  function submit(event: React.FormEvent) {
    event.preventDefault()
    onConfirm(name)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-4">
            <Label htmlFor="unit-name">Name</Label>
            <Input
              id="unit-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={200}
              autoFocus
              onFocus={(event) => event.target.select()}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Abbrechen
            </Button>
            <Button type="submit" disabled={busy || name.trim() === ''}>
              {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
