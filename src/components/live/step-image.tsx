'use client'

import * as React from 'react'
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { loadStoredImage } from '@/lib/live/images'
import { cn } from '@/lib/utils'

interface StepImagesProps {
  /** Speicherpfade der Bilder, das Titelbild zuerst. */
  paths: string[]
  alt: string
  /** Etwa ein weißer Grund, wo das Feld auf Farbe steht („Danach"). */
  triggerClassName?: string
}

type ImageState = 'loading' | 'missing' | { src: string }

/**
 * Die Bilder der aktuellen Übung — eingeklappt wie die Beschreibung: der Platz
 * gehört der Zeit und dem, was als Nächstes kommt.
 *
 * Aufgeklappt zeigt das Feld zuerst das Titelbild; mit den Pfeilen links und
 * rechts blättert man durch die übrigen. Geladen wird aus der Ablage auf dem
 * Gerät, und erst das Bild, das gerade zu sehen ist — damit kommen die Bilder
 * auch ohne Netz.
 */
export function StepImages({ paths, alt, triggerClassName }: StepImagesProps) {
  const [open, setOpen] = React.useState(false)
  const [index, setIndex] = React.useState(0)
  const [state, setState] = React.useState<ImageState>('loading')

  const count = paths.length
  const path = paths[index]

  React.useEffect(() => {
    if (!open || !path) return
    let cancelled = false
    let created: string | null = null

    setState('loading')
    loadStoredImage(path).then((src) => {
      if (cancelled) {
        if (src) URL.revokeObjectURL(src)
        return
      }
      created = src
      setState(src ? { src } : 'missing')
    })

    return () => {
      cancelled = true
      if (created) URL.revokeObjectURL(created)
    }
  }, [open, path])

  // Im Kreis: nach dem letzten Bild kommt wieder das erste.
  function step(by: number) {
    setIndex((value) => (value + by + count) % count)
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            triggerClassName
          )}
        >
          {count > 1 ? `Bilder (${count})` : 'Bild'}
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="relative flex min-h-40 items-center justify-center rounded-md bg-muted/40">
          {state === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Bild wird geladen …
            </p>
          )}
          {state === 'missing' && (
            <p className="px-14 text-center text-sm text-muted-foreground">
              Dieses Bild liegt nicht auf dem Gerät und lässt sich gerade nicht laden.
            </p>
          )}
          {typeof state === 'object' && (
            // Eine Adresse, die nur in dieser Seite gilt — `next/image` kann sie nicht optimieren.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.src}
              alt={count > 1 ? `${alt}, Bild ${index + 1} von ${count}` : alt}
              className="max-h-72 w-full rounded-md object-contain"
            />
          )}

          {count > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-1 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full shadow"
                onClick={() => step(-1)}
                aria-label="Voriges Bild"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1/2 h-11 w-11 -translate-y-1/2 rounded-full shadow"
                onClick={() => step(1)}
                aria-label="Nächstes Bild"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
        {count > 1 && (
          <p className="mt-1 text-center text-xs text-muted-foreground" aria-live="polite">
            Bild {index + 1} von {count}
          </p>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
