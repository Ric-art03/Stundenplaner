'use client'

import * as React from 'react'
import Link from 'next/link'
import { useToast } from '@/hooks/use-toast'
import { copyLibraryExercises } from '@/lib/actions/library'

/**
 * Übernehmen aus der Übungsdatenbank (PROJ-4) — einzeln wie gesammelt
 * derselbe Weg, mit denselben Meldungen. Die Datenbank übernimmt ganz oder gar
 * nicht; hier wird nur gesagt, was geschehen ist, und der Aufrufer erfährt,
 * welche Übungen jetzt eine Kopie haben.
 */

export interface CopyOutcome {
  /** Bestand-Kennung → Kennung der eigenen Kopie, auch für schon Übernommenes. */
  copies: Map<string, string>
  /** Nicht mehr im Bestand — der Aufrufer nimmt sie aus Liste und Auswahl. */
  unavailable: string[]
}

const linkClass = 'font-medium underline underline-offset-2'

function duplicateHint(names: string[]): string | null {
  if (names.length === 0) return null
  return names.length === 1
    ? `In „Meine Übungen" gibt es jetzt zwei Übungen namens „${names[0]}".`
    : `In „Meine Übungen" gibt es jetzt mehrere Übungen mit demselben Namen: ${names.map((n) => `„${n}"`).join(', ')}.`
}

export function useLibraryCopy() {
  const { toast } = useToast()
  const [copying, setCopying] = React.useState<ReadonlySet<string>>(new Set())

  const copy = React.useCallback(
    async (ids: string[]): Promise<CopyOutcome | null> => {
      if (ids.length === 0) return null
      setCopying(new Set(ids))
      try {
        const result = await copyLibraryExercises(ids)

        if ('error' in result) {
          toast({ variant: 'destructive', title: 'Nichts übernommen', description: result.error })
          return null
        }

        if ('unavailable' in result) {
          const names = result.unavailable.map((u) => `„${u.name}"`).join(', ')
          toast({
            variant: 'destructive',
            title: 'Nichts übernommen',
            description: `${names} gibt es in der Übungsdatenbank nicht mehr. Es wurde nichts übernommen — die übrige Auswahl kannst du erneut übernehmen.`,
          })
          return { copies: new Map(), unavailable: result.unavailable.map((u) => u.libraryExerciseId) }
        }

        const copies = new Map<string, string>()
        for (const c of [...result.copied, ...result.alreadyCopied]) copies.set(c.libraryExerciseId, c.exerciseId)
        const hint = duplicateHint(result.duplicateNames)

        if (result.copied.length === 0 && result.alreadyCopied.length > 0) {
          const first = result.alreadyCopied[0]
          toast({
            title: 'Schon übernommen',
            description: (
              <span>
                {result.alreadyCopied.length === 1
                  ? `„${first.name}" hattest du schon übernommen. `
                  : `Diese ${result.alreadyCopied.length} Übungen hattest du schon übernommen. `}
                <Link
                  className={linkClass}
                  href={result.alreadyCopied.length === 1 ? `/exercises/${first.exerciseId}` : '/exercises'}
                >
                  {result.alreadyCopied.length === 1 ? 'In Meine Übungen öffnen' : 'Zu Meine Übungen'}
                </Link>
              </span>
            ),
          })
        } else if (result.copied.length === 1 && result.alreadyCopied.length === 0) {
          const only = result.copied[0]
          toast({
            title: 'Übernommen',
            description: (
              <span>
                &bdquo;{only.name}&ldquo; steht jetzt in &bdquo;Meine Übungen&ldquo;. {hint && `${hint} `}
                <Link className={linkClass} href={`/exercises/${only.exerciseId}`}>
                  Öffnen
                </Link>
              </span>
            ),
          })
        } else {
          toast({
            title: `${result.copied.length} ${result.copied.length === 1 ? 'Übung' : 'Übungen'} übernommen`,
            description: (
              <span>
                {result.alreadyCopied.length > 0 &&
                  `${result.alreadyCopied.length} weitere hattest du schon. `}
                {hint && `${hint} `}
                <Link className={linkClass} href="/exercises">
                  Zu Meine Übungen
                </Link>
              </span>
            ),
          })
        }

        return { copies, unavailable: [] }
      } catch {
        toast({
          variant: 'destructive',
          title: 'Nichts übernommen',
          description: 'Die Verbindung ist abgebrochen — es wurde nichts übernommen. Bitte versuche es erneut.',
        })
        return null
      } finally {
        setCopying(new Set())
      }
    },
    [toast]
  )

  return { copy, copying }
}
