'use client'

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

interface DiscardChangesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  changeCount: number
  /** Namen der Übungen, die während dieser Bearbeitung schnell angelegt wurden. */
  quickCreated: string[]
  onConfirm: () => void
}

/**
 * „Verwerfen" aus der Änderungsleiste. Nennt die Anzahl, damit der Nutzer weiß,
 * wie viel er wegwirft — und sagt ausdrücklich, dass schnell angelegte Übungen
 * in der Datenbank bleiben. Sie wurden dort regulär angelegt; nur ihr Einsatz im
 * Plan wird verworfen.
 */
export function DiscardChangesDialog({
  open,
  onOpenChange,
  changeCount,
  quickCreated,
  onConfirm,
}: DiscardChangesDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Änderungen verwerfen?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p>
                {changeCount === 1
                  ? 'Deine Änderung wird verworfen'
                  : `Deine ${changeCount} Änderungen werden verworfen`}
                , und die Einheit steht wieder so da wie beim Öffnen. Das lässt sich
                nicht zurücknehmen.
              </p>
              {quickCreated.length > 0 && (
                <p>
                  {quickCreated.length === 1
                    ? `Die neu angelegte Übung „${quickCreated[0]}" bleibt in deiner Übungsdatenbank.`
                    : `Die ${quickCreated.length} neu angelegten Übungen bleiben in deiner Übungsdatenbank.`}
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Verwerfen</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
