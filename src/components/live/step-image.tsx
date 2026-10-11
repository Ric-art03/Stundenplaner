'use client'

import * as React from 'react'
import { ChevronDown, Loader2 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { loadStoredImage } from '@/lib/live/images'
import { cn } from '@/lib/utils'

interface StepImageProps {
  /** Speicherpfad des Titelbilds. */
  path: string
  alt: string
}

/**
 * Das Titelbild der aktuellen Übung — eingeklappt wie die Beschreibung: der
 * Platz gehört der Zeit und dem, was als Nächstes kommt.
 *
 * Geladen wird erst beim Aufklappen, und zwar aus der Ablage auf dem Gerät.
 * Damit kommt das Bild auch ohne Netz.
 */
export function StepImage({ path, alt }: StepImageProps) {
  const [open, setOpen] = React.useState(false)
  const [state, setState] = React.useState<'idle' | 'loading' | 'missing' | { src: string }>('idle')

  React.useEffect(() => {
    if (!open) return
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

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Bild
          <ChevronDown
            className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
            aria-hidden
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {state === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Bild wird geladen …
          </p>
        )}
        {state === 'missing' && (
          <p className="text-sm text-muted-foreground">
            Das Bild liegt nicht auf diesem Gerät und lässt sich gerade nicht laden.
          </p>
        )}
        {typeof state === 'object' && (
          // Eine Adresse, die nur in dieser Seite gilt — `next/image` kann sie nicht optimieren.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.src} alt={alt} className="max-h-72 w-full rounded-md object-contain" />
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
