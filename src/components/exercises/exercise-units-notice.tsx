'use client'

import * as React from 'react'
import { ChevronDown, Info } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ExerciseUnitsNoticeProps {
  /** Die gespeicherten Einheiten, in denen die Übung steht — ohne Entwürfe. */
  unitNames: string[]
}

/**
 * Der gemeinsame Hinweis in der Bearbeiten-Maske: eine Einheit **verweist** auf
 * ihre Übungen und kopiert nur die Plandauer. Was hier geändert wird, erscheint
 * deshalb sofort in allen gespeicherten Einheiten — außer der Dauer.
 *
 * Ein Hinweis für alle Felder statt je einem pro Feld. Er steht da, sobald die
 * Maske offen ist. Steht die Übung in keiner gespeicherten Einheit, erscheint
 * er nicht.
 */
export function ExerciseUnitsNotice({ unitNames }: ExerciseUnitsNoticeProps) {
  const [open, setOpen] = React.useState(false)

  if (unitNames.length === 0) return null
  const count = unitNames.length

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="mb-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm"
    >
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
        <div className="min-w-0 flex-1">
          <p>
            Diese Übung steht in{' '}
            <strong className="font-medium">
              {count} {count === 1 ? 'gespeicherten Einheit' : 'gespeicherten Einheiten'}
            </strong>
            . Änderungen erscheinen dort sofort — nur die geplante Dauer bleibt dort stehen.
          </p>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="mt-1 flex min-h-9 items-center gap-1 rounded font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {count === 1 ? 'Welche Einheit?' : 'Welche Einheiten?'}
              <ChevronDown
                className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="list-disc space-y-0.5 pb-1 pl-5">
              {unitNames.map((name, index) => (
                <li key={`${name}-${index}`} className="break-words">
                  {name}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </div>
      </div>
    </Collapsible>
  )
}
