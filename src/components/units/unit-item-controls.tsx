'use client'

import * as React from 'react'
import {
  ChevronDown,
  ChevronUp,
  Dices,
  Loader2,
  MoreVertical,
  Search,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MIN_ITEM_MINUTES } from '@/lib/units/draft'

interface UnitItemControlsProps {
  itemKey: string
  plannedDuration: number
  /** null am Platzhalter einer gelöschten Übung. */
  estimatedDuration: number | null
  /** 1-basiert, nur für die Beschriftung von Hoch/Runter. */
  position: number
  total: number
  /** Läuft gerade ein Auswürfeln an diesem Platz? */
  rolling?: boolean
  /**
   * Läuft ein Auswürfeln an einem **anderen** Platz? Dann ist „Neu auswürfeln"
   * hier ausgegraut — ein Knopf, der sich klicken lässt und nichts tut, ist
   * genau der Fehler, der vermieden werden soll.
   */
  rollBlocked?: boolean
  onDurationChange: (minutes: number) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onReroll: () => void
  onChoose: () => void
  onRemove: () => void
}

/**
 * Die Bedienzeile eines Eintrags. Bewusst **unter** dem Inhalt der Karte und
 * nicht in einer schmalen Spalte daneben: auf dem Telefon ist das der
 * Unterschied zwischen treffbar und nicht treffbar.
 *
 * Sie sitzt **im Rahmen der Karte** und ist nur durch ihre Hinterlegung
 * abgesetzt, nicht durch einen Strich: Karte und Bedienzeile gehören zusammen,
 * die Trennung liegt danach — zwischen diesem Eintrag und dem nächsten.
 *
 * Die Variante wird nicht hier umgeschaltet, sondern auf der Karte über
 * „Varianten (n)".
 *
 * Hoch und Runter liegen als eigene Knöpfe draußen, nicht im Menü — sie werden
 * in der Halle gebraucht und sollen einen Daumen weit weg sein. Alles Übrige
 * liegt im Menü.
 */
export function UnitItemControls({
  itemKey,
  plannedDuration,
  estimatedDuration,
  position,
  total,
  rolling = false,
  rollBlocked = false,
  onDurationChange,
  onMoveUp,
  onMoveDown,
  onReroll,
  onChoose,
  onRemove,
}: UnitItemControlsProps) {
  const fieldId = `dauer-${itemKey}`
  const [raw, setRaw] = React.useState(String(plannedDuration))
  const [corrected, setCorrected] = React.useState(false)
  /** Der Wert, den dieses Feld zuletzt selbst übernommen hat. */
  const committed = React.useRef(plannedDuration)

  // Nach „Rückgängig" oder einem Tausch steht ein anderer Wert im Platz. Der
  // Korrektur-Hinweis verschwindet nur dann — kommt der neue Wert aus der
  // eigenen Korrektur (5 → 0 → 1), muss er stehen bleiben.
  React.useEffect(() => {
    setRaw(String(plannedDuration))
    if (plannedDuration !== committed.current) {
      committed.current = plannedDuration
      setCorrected(false)
    }
  }, [plannedDuration])

  /** Übernommen wird beim Verlassen des Feldes, nicht bei jedem Tastendruck:
   *  sonst stünde zwischen „1" und „12" kurz eine 1 im Plan und auf dem
   *  Rückgängig-Stapel. */
  function commit() {
    const parsed = Number.parseInt(raw, 10)
    const safe = Number.isFinite(parsed) ? Math.max(MIN_ITEM_MINUTES, parsed) : MIN_ITEM_MINUTES

    setCorrected(!Number.isFinite(parsed) || parsed < MIN_ITEM_MINUTES)
    setRaw(String(safe))
    committed.current = safe
    if (safe !== plannedDuration) onDurationChange(safe)
  }

  const durationDiffers = estimatedDuration !== null && estimatedDuration !== plannedDuration

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md bg-muted/50 px-2 py-1.5">
      {/* Plandauer */}
      <div className="flex items-center gap-1.5">
        <Label htmlFor={fieldId} className="text-xs text-muted-foreground">
          Plandauer
        </Label>
        <Input
          id={fieldId}
          type="number"
          inputMode="numeric"
          min={MIN_ITEM_MINUTES}
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="h-8 w-16 tabular-nums"
          aria-describedby={durationDiffers ? `${fieldId}-hinweis` : undefined}
        />
        <span className="text-xs text-muted-foreground">Min</span>
      </div>

      {durationDiffers && (
        <span id={`${fieldId}-hinweis`} className="text-xs text-muted-foreground tabular-nums">
          geschätzt: {estimatedDuration} Min
        </span>
      )}

      {corrected && (
        <span role="status" className="text-xs text-amber-600 dark:text-amber-500">
          Mindestens {MIN_ITEM_MINUTES} Minute — auf {MIN_ITEM_MINUTES} gesetzt.
        </span>
      )}

      <div className="ml-auto flex items-center gap-1">
        {/* Umsortieren */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={position === 1}
          onClick={onMoveUp}
          aria-label={`Nach oben, derzeit Platz ${position} von ${total}`}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          disabled={position === total}
          onClick={onMoveDown}
          aria-label={`Nach unten, derzeit Platz ${position} von ${total}`}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>

        {/* Alles Übrige */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label={`Weitere Möglichkeiten für Platz ${position}`}
            >
              {rolling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {/* Solange irgendwo gewürfelt wird, ist der Punkt ausgegraut statt
                folgenlos klickbar. */}
            <DropdownMenuItem onClick={onReroll} disabled={rolling || rollBlocked}>
              <Dices className="mr-2 h-4 w-4" />
              Neu auswürfeln
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onChoose}>
              <Search className="mr-2 h-4 w-4" />
              Selbst wählen …
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onRemove} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Entfernen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
