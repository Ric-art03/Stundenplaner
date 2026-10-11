'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

// Tailwind braucht die Klassennamen ausgeschrieben.
const CLAMP = {
  3: 'line-clamp-3',
  4: 'line-clamp-4',
} as const

export type ClampLines = keyof typeof CLAMP

interface ClampedTextProps {
  text: string
  lines: ClampLines
  className?: string
}

/**
 * Ein langer Text, bis zu einer festen Zeilenzahl sichtbar und darüber hinaus
 * gekürzt, mit „mehr“ zum Aufklappen. „mehr“ erscheint nur, wenn wirklich
 * etwas abgeschnitten ist.
 *
 * Der aufgeklappte Zustand gehört zum Schritt: wer den Baustein mit einem
 * neuen `key` einsetzt, bekommt ihn wieder zugeklappt.
 */
export function ClampedText({ text, lines, className }: ClampedTextProps) {
  const [open, setOpen] = React.useState(false)
  const [overflows, setOverflows] = React.useState(false)
  const paragraph = React.useRef<HTMLParagraphElement>(null)

  React.useLayoutEffect(() => {
    const element = paragraph.current
    if (!element || open) return

    const measure = () => setOverflows(element.scrollHeight > element.clientHeight + 1)
    measure()

    // Die Breite ändert die Zeilenzahl — etwa beim Drehen des Handys.
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [text, open])

  return (
    <div className={className}>
      <p ref={paragraph} className={cn('whitespace-pre-wrap', !open && CLAMP[lines])}>
        {text}
      </p>
      {(overflows || open) && (
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="-mb-1 mt-0.5 min-h-9 rounded text-sm font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {open ? 'weniger' : 'mehr'}
        </button>
      )}
    </div>
  )
}
