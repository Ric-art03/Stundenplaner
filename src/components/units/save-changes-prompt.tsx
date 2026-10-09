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
import { cn } from '@/lib/utils'

/** Ein Segment mit offener Lücke — sperrt das Speichern, bis sie gefüllt oder erklärt ist. */
export interface OpenGapNotice {
  name: string
  free: number
}

/** Ein überfülltes Segment — wird genannt, sperrt aber nicht. */
export interface OverfillNotice {
  name: string
  over: number
}

interface SaveChangesPromptProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * `leave` beim Verlassen mit offenen Änderungen: Speichern, Verwerfen,
   * Abbrechen. `confirm` beim Speichern selbst, wenn etwas nicht aufgeht.
   */
  mode: 'leave' | 'confirm'
  openGaps: OpenGapNotice[]
  overfills: OverfillNotice[]
  /** Namen der Übungen, die während dieser Bearbeitung schnell angelegt wurden. */
  quickCreated: string[]
  saving: boolean
  onSave: () => void
  /** „Alle als geplant übernehmen und speichern". */
  onAcceptGapsAndSave: () => void
  onDiscard: () => void
  /** Nur in der Leseansicht: der Weg in den Bearbeiten-Modus, um die Lücken zu füllen. */
  onEdit?: () => void
}

function list(parts: string[]): string {
  return parts.join(', ')
}

/**
 * Die Nachfrage vor dem Speichern.
 *
 * Gespeichert wird nur **ohne offene Lücke**: jede freie Minute ist gefüllt
 * oder als geplant erklärt. Damit das keine Sackgasse wird, nennt der Dialog
 * die offenen Lücken namentlich und bietet an, sie in einem Zug zu erklären.
 *
 * Eine Überfüllung ist dagegen eine Planung und kein Loch — sie wird genannt
 * und nach Bestätigung gespeichert.
 */
export function SaveChangesPrompt({
  open,
  onOpenChange,
  mode,
  openGaps,
  overfills,
  quickCreated,
  saving,
  onSave,
  onAcceptGapsAndSave,
  onDiscard,
  onEdit,
}: SaveChangesPromptProps) {
  const hasGaps = openGaps.length > 0

  // Mit offenen Lücken stehen bis zu vier Knöpfe da, einer davon mit einer
  // langen Beschriftung. Nebeneinander ragen sie über den Dialog hinaus —
  // deshalb untereinander, in voller Breite, und der Text darf umbrechen.
  const stacked = 'h-auto min-h-9 w-full whitespace-normal'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasGaps
              ? openGaps.length === 1
                ? 'Eine Lücke ist noch offen'
                : `${openGaps.length} Lücken sind noch offen`
              : mode === 'leave'
                ? 'Änderungen speichern?'
                : 'Trotzdem speichern?'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="min-w-0 space-y-2 break-words">
              {hasGaps && (
                <>
                  <p>
                    {list(
                      openGaps.map((gap) => `„${gap.name}" (${gap.free} Min frei)`)
                    )}
                    . Eine gespeicherte Einheit hat keine offenen Lücken — fülle sie, oder
                    lass sie bewusst als geplante Lücke stehen.
                  </p>
                  <p>
                    Geplante Lücken erscheinen in der Stunde ohne Warnhinweis. Du kannst sie
                    später jederzeit füllen.
                  </p>
                </>
              )}

              {overfills.length > 0 && (
                <p>
                  {overfills.length === 1 ? 'Ein Abschnitt ist überfüllt: ' : 'Überfüllt: '}
                  {list(overfills.map((entry) => `„${entry.name}" (${entry.over} Min über)`))}.
                  Das lässt sich speichern — eine überzogene Phase ist zulässige Planung.
                </p>
              )}

              {!hasGaps && overfills.length === 0 && mode === 'leave' && (
                <p>Du hast Änderungen an dieser Einheit, die noch nicht gespeichert sind.</p>
              )}

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
        <AlertDialogFooter
          className={cn(
            'gap-2 sm:gap-2',
            hasGaps && 'sm:flex-col-reverse sm:space-x-0'
          )}
        >
          <AlertDialogCancel disabled={saving} className={cn(hasGaps && stacked, hasGaps && 'mt-0')}>
            {hasGaps && mode === 'confirm' && !onEdit ? 'Zurück zum Bearbeiten' : 'Abbrechen'}
          </AlertDialogCancel>
          {hasGaps && onEdit && (
            <Button variant="outline" onClick={onEdit} disabled={saving} className={stacked}>
              Bearbeiten
            </Button>
          )}
          {mode === 'leave' && (
            // Kein AlertDialogAction: „Verwerfen" ist der zerstörende Weg und
            // soll nicht wie die empfohlene Antwort aussehen.
            <Button
              variant="outline"
              onClick={onDiscard}
              disabled={saving}
              className={cn(hasGaps && stacked)}
            >
              Verwerfen
            </Button>
          )}
          <AlertDialogAction
            onClick={(event) => {
              // Der Dialog bleibt offen, bis das Speichern geantwortet hat —
              // schlägt es fehl, soll die Meldung nicht ins Leere laufen.
              event.preventDefault()
              if (hasGaps) onAcceptGapsAndSave()
              else onSave()
            }}
            disabled={saving}
            className={cn(hasGaps && stacked)}
          >
            {saving
              ? 'Speichert …'
              : hasGaps
                ? 'Alle als geplant übernehmen und speichern'
                : 'Speichern'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
