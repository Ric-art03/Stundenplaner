'use client'

import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectionBarProps {
  count: number
  copying: boolean
  onCopy: () => void
  onClear: () => void
}

/**
 * Die Leiste fürs gesammelte Übernehmen. Klebt am unteren Rand, damit sie in
 * einer langen Liste erreichbar bleibt — auch am Handy, wo der Daumen unten ist.
 */
export function SelectionBar({ count, copying, onCopy, onClear }: SelectionBarProps) {
  if (count === 0) return null
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 backdrop-blur"
      role="region"
      aria-label="Auswahl"
    >
      <div className="container mx-auto flex items-center gap-2 px-4 py-3">
        <p className="mr-auto text-sm font-medium" role="status">
          {count} ausgewählt
        </p>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={copying}>
          Auswahl aufheben
        </Button>
        <Button size="sm" onClick={onCopy} disabled={copying}>
          {copying ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 hidden h-4 w-4 sm:inline" />
          )}
          Übernehmen
        </Button>
      </div>
    </div>
  )
}
