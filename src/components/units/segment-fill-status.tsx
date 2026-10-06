import type { SegmentBalance } from '@/lib/units/draft'

interface SegmentFillStatusProps {
  balance: SegmentBalance
}

/**
 * Der Stand eines Segments im Bearbeiten-Modus: „10 von 12 Min · 2 Min frei".
 *
 * Eine Abweichung ist hier keine Fehlermeldung — laut Spec ist sie eine
 * Entscheidung des Übungsleiters. Deshalb nur ein Hinweis in Farbe, kein
 * Warnzeichen, und das Speichern bleibt erlaubt.
 */
export function SegmentFillStatus({ balance }: SegmentFillStatusProps) {
  const { planned, minutes, free, over } = balance

  return (
    <p className="text-xs text-muted-foreground tabular-nums">
      {planned} von {minutes} Min
      {free > 0 && (
        <>
          {' · '}
          <span className="text-amber-600 dark:text-amber-500">{free} Min frei</span>
        </>
      )}
      {over > 0 && (
        <>
          {' · '}
          <span className="text-amber-600 dark:text-amber-500">{over} Min über</span>
        </>
      )}
    </p>
  )
}
