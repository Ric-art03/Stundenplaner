'use client'

import { Check, Package } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { keyOf, type EditorCandidate } from '@/lib/units/editor-pool'

interface VariantSwitchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Hauptübung zuerst, danach die Varianten. */
  variants: EditorCandidate[]
  currentKey: string | null
  onPick: (candidate: EditorCandidate) => void
}

/**
 * Umschalten zwischen Hauptübung und Varianten.
 *
 * Die Liste kommt aus der schon geladenen Kandidatenliste des Segments — dort
 * sind Varianten eigene Kandidaten, genau wie im Generator. Deshalb braucht das
 * Umschalten keinen eigenen Ladeweg, und Material und Dauer der Variante sind
 * bereits aufgelöst.
 */
export function VariantSwitchDialog({
  open,
  onOpenChange,
  variants,
  currentKey,
  onPick,
}: VariantSwitchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Variante umschalten</DialogTitle>
          <DialogDescription>
            Material, Beschreibung und Dauer der gewählten Variante gelten dann für
            diesen Platz.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          {variants.map((candidate) => {
            const selected = keyOf(candidate) === currentKey

            return (
              <Button
                key={keyOf(candidate)}
                variant={selected ? 'secondary' : 'outline'}
                className="h-auto w-full justify-start py-3 text-left"
                onClick={() => {
                  onPick(candidate)
                  onOpenChange(false)
                }}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className="truncate text-sm font-medium">
                      {candidate.variantTitle ?? 'Hauptübung'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs font-normal text-muted-foreground">
                    <span className="tabular-nums">{candidate.duration} Min</span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {candidate.materials.length > 0
                        ? candidate.materials.map((material) => material.name).join(', ')
                        : 'kein Material'}
                    </span>
                  </div>
                </div>
              </Button>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
