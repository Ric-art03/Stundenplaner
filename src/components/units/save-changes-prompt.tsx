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
import { Button } from '@/components/ui/button'

/** Ein Segment, das nicht aufgeht — namentlich, mit der Abweichung in Minuten. */
export interface SegmentMismatch {
  name: string
  free: number
  over: number
}

interface SaveChangesPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * `leave` beim Verlassen mit offenen Änderungen: Speichern, Verwerfen,
   * Abbrechen. `confirm` beim Speichern selbst, wenn ein Segment nicht aufgeht:
   * dann gibt es nichts zu verwerfen, nur zu bestätigen oder zurückzugehen.
   */
  mode: 'leave' | 'confirm'
  mismatches: SegmentMismatch[]
  /** Namen der Übungen, die während dieser Bearbeitung schnell angelegt wurden. */
  quickCreated: string[]
  saving: boolean
  onSave: () => void
  onDiscard: () => void
}

function mismatchSentence(mismatch: SegmentMismatch): string {
  const deviation =
    mismatch.free > 0
      ? `${mismatch.free} Min frei`
      : `${mismatch.over} Min über`
  return `„${mismatch.name}" (${deviation})`
}

/**
 * Die Nachfrage vor dem Speichern.
 *
 * Nicht aufgehende Segmente werden **namentlich mit ihrer Abweichung** genannt,
 * nicht bloß gezählt: so ist die Abweichung eine Entscheidung und kein Versehen.
 * Gespeichert werden darf trotzdem — das ersetzt die Sperre aus PROJ-6.
 */
export function SaveChangesPrompt({
  open,
  onOpenChange,
  mode,
  mismatches,
  quickCreated,
  saving,
  onSave,
  onDiscard,
}: SaveChangesPromptProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === 'leave' ? 'Änderungen speichern?' : 'Trotzdem speichern?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              {mismatches.length > 0 ? (
                <p>
                  {mismatches.length === 1
                    ? 'Ein Abschnitt geht nicht auf: '
                    : `${mismatches.length} Abschnitte gehen nicht auf: `}
                  {mismatches.map(mismatchSentence).join(', ')}. Das lässt sich speichern —
                  ein Puffer oder eine überzogene Phase sind zulässige Planung.
                </p>
              ) : mode === 'leave' ? (
                <p>Du hast Änderungen an dieser Einheit, die noch nicht gespeichert sind.</p>
              ) : null}

              {quickCreated.length > 0 && mode === 'leave' && (
                <p>
                  {quickCreated.length === 1
                    ? `Die neu angelegte Übung „${quickCreated[0]}" bleibt in deiner Übungsdatenbank, auch wenn du verwirfst.`
                    : `Die ${quickCreated.length} neu angelegten Übungen bleiben in deiner Übungsdatenbank, auch wenn du verwirfst.`}{' '}
                  Verworfen wird nur ihr Einsatz im Plan.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={saving}>Abbrechen</AlertDialogCancel>
          {mode === 'leave' && (
            // Kein AlertDialogAction: „Verwerfen" ist der zerstörende Weg und
            // soll nicht wie die empfohlene Antwort aussehen.
            <Button variant="outline" onClick={onDiscard} disabled={saving}>
              Verwerfen
            </Button>
          )}
          <AlertDialogAction
            onClick={(event) => {
              // Der Dialog bleibt offen, bis das Speichern geantwortet hat —
              // schlägt es fehl, soll die Meldung nicht ins Leere laufen.
              event.preventDefault()
              onSave()
            }}
            disabled={saving}
          >
            {saving ? 'Speichert …' : 'Speichern'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
