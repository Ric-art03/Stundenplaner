'use client'

import * as React from 'react'
import { Check, ChevronDown, Layers, LayoutGrid, Package } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface FactsMaterial {
  name: string
  /** Ohne Menge wird nur der Name gezeigt (Auswahldialog). */
  quantity?: number
  mode?: string
}

export interface FactsVariant {
  id: string
  title: string
  /** Etwa „passt nicht: Material" — im Auswahldialog. */
  note?: string
}

interface ExerciseFactsRowProps {
  materials: FactsMaterial[]
  organizationForms: string[]
  /** Die Varianten der Übung, ohne die Grundübung — die setzt der Baustein selbst an den Anfang. */
  variants: FactsVariant[]
  /**
   * Welche Form gerade gilt: `null` = Grundübung, eine Kennung = diese
   * Variante. `undefined` = es gilt keine (Übungsordner) — dann ist nichts markiert.
   */
  currentVariantId?: string | null
  /** Etwa „passt nicht: Material" an der Grundübung. */
  baseNote?: string
  /**
   * Gesetzt = die Formen sind wählbar (Bearbeiten-Modus, Auswahldialog).
   * Fehlt = nur zum Ansehen (Leseansicht, Übungsordner).
   */
  onSelect?: (variantId: string | null) => void
  className?: string
}

/**
 * Material · Organisationsform · Varianten — an **allen** Orten in derselben
 * Reihenfolge und Gestalt: Karte im Stundenverlauf, Dialog „Übung einfügen",
 * Übungsordner. Einmal gelernt, überall gefunden.
 *
 * Fehlt eine Organisationsform, bleibt ihr Platz stehen und zeigt einen Strich:
 * die übrigen Angaben rücken dadurch nicht an eine andere Stelle.
 *
 * „Varianten (n)" klappt die Namen auf, darüber immer die Grundübung. Ob sich
 * dort etwas auswählen lässt, entscheidet der Ort, nicht der Baustein.
 */
export function ExerciseFactsRow({
  materials,
  organizationForms,
  variants,
  currentVariantId,
  baseNote,
  onSelect,
  className,
}: ExerciseFactsRowProps) {
  const [open, setOpen] = React.useState(false)

  const visibleMaterials = materials.filter(
    (material) => material.name.trim().toLowerCase() !== 'kein material'
  )

  const forms: { id: string | null; title: string; note?: string }[] = [
    { id: null, title: 'Grundübung', note: baseNote },
    ...variants,
  ]

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className={cn('text-xs text-muted-foreground', className)}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="flex items-center gap-1">
          <Package className="h-3 w-3 shrink-0" aria-hidden />
          <span className="sr-only">Material: </span>
          {visibleMaterials.length > 0
            ? visibleMaterials
                .map((material) =>
                  material.quantity === undefined
                    ? material.name
                    : `${material.quantity}× ${material.name}${
                        material.mode === 'pro Teilnehmer' ? ' p. TN' : ''
                      }`
                )
                .join(', ')
            : 'kein Material'}
        </span>

        <span className="flex items-center gap-1">
          <LayoutGrid className="h-3 w-3 shrink-0" aria-hidden />
          <span className="sr-only">Organisationsform: </span>
          {organizationForms.length > 0 ? (
            organizationForms.join(', ')
          ) : (
            <>
              <span aria-hidden>–</span>
              <span className="sr-only">keine angegeben</span>
            </>
          )}
        </span>

        {variants.length > 0 && (
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="-my-1 flex items-center gap-1 rounded py-1 font-medium text-foreground underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Layers className="h-3 w-3 shrink-0" aria-hidden />
              Varianten ({variants.length})
              <ChevronDown
                className={cn('h-3 w-3 transition-transform', open && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
        )}
      </div>

      {variants.length > 0 && (
        <CollapsibleContent>
          <ul className="mt-2 space-y-0.5 rounded-md border bg-background p-1">
            {forms.map((form) => {
              const current = currentVariantId !== undefined && form.id === currentVariantId
              const content = (
                <>
                  <Check
                    className={cn('h-3.5 w-3.5 shrink-0 text-primary', !current && 'invisible')}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className={cn('text-sm', current && 'font-medium text-foreground')}>
                      {form.title}
                    </span>
                    {form.note && (
                      <span className="block text-xs text-amber-600 dark:text-amber-500">
                        {form.note}
                      </span>
                    )}
                  </span>
                  {current && <span className="sr-only">(gilt gerade)</span>}
                </>
              )

              return (
                <li key={form.id ?? 'grunduebung'}>
                  {onSelect ? (
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(form.id)
                        setOpen(false)
                      }}
                      className="flex min-h-9 w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {content}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5">{content}</div>
                  )}
                </li>
              )
            })}
          </ul>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}
