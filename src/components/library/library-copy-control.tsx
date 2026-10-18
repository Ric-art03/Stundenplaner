'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CopyControl } from './library-entry-parts'
import { useLibraryCopy } from './use-library-copy'

interface LibraryCopyControlProps {
  libraryExerciseId: string
  name: string
  initialCopiedExerciseId: string | null
}

/** „Übernehmen" in der Leseansicht — mit eigenem Stand, weil die Seite vom Server kommt. */
export function LibraryCopyControl({ libraryExerciseId, name, initialCopiedExerciseId }: LibraryCopyControlProps) {
  const [copiedId, setCopiedId] = React.useState(initialCopiedExerciseId)
  const [gone, setGone] = React.useState(false)
  const { copy, copying } = useLibraryCopy()

  async function handleCopy() {
    const outcome = await copy([libraryExerciseId])
    if (!outcome) return
    if (outcome.unavailable.length > 0) {
      setGone(true)
      return
    }
    setCopiedId(outcome.copies.get(libraryExerciseId) ?? null)
  }

  if (gone) {
    return (
      <p className="max-w-xs text-sm text-muted-foreground">
        Diese Übung gibt es in der Übungsdatenbank nicht mehr.
      </p>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {copiedId && (
        <Badge variant="secondary" className="gap-1">
          <Check className="h-3 w-3" aria-hidden />
          Übernommen
        </Badge>
      )}
      <CopyControl
        name={name}
        copiedExerciseId={copiedId}
        copying={copying.size > 0}
        onCopy={handleCopy}
      />
    </div>
  )
}
