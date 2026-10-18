'use client'

import Link from 'next/link'
import { AlertTriangle, Check, CheckCircle2, Download, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { describeFit, type ExerciseFit } from '@/lib/library/group-fit'

/** Die Vermerke neben dem Namen: Entwurf (nur in der Vorschau) und Übernommen. */
export function EntryBadges({ isDraft, copied }: { isDraft: boolean; copied: boolean }) {
  return (
    <>
      {isDraft && (
        <Badge variant="outline" className="shrink-0 border-amber-400 text-[10px] text-amber-700">
          Entwurf
        </Badge>
      )}
      {copied && (
        <Badge variant="secondary" className="shrink-0 gap-1 text-[10px]">
          <Check className="h-3 w-3" aria-hidden />
          Übernommen
        </Badge>
      )}
    </>
  )
}

interface CopyControlProps {
  name: string
  copiedExerciseId: string | null
  copying: boolean
  disabled?: boolean
  onCopy: () => void
  className?: string
}

/** „Übernehmen" — oder, wenn schon übernommen, der Weg zur eigenen Kopie. */
export function CopyControl({ name, copiedExerciseId, copying, disabled, onCopy, className }: CopyControlProps) {
  if (copiedExerciseId) {
    return (
      <Button variant="link" size="sm" asChild className={cn('h-auto px-0', className)}>
        <Link href={`/exercises/${copiedExerciseId}`}>In Meine Übungen öffnen</Link>
      </Button>
    )
  }
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onCopy}
      disabled={copying || disabled}
      aria-label={`„${name}" übernehmen`}
      className={className}
    >
      {copying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
      Übernehmen
    </Button>
  )
}

/** Ein Satz, wie die Übung zur gewählten Gruppe steht — mit allen Gründen. */
export function FitLine({ fit }: { fit: ExerciseFit }) {
  const fits = fit.kind === 'fits'
  const Icon = fits ? CheckCircle2 : AlertTriangle
  return (
    <p className={cn('flex items-start gap-1.5 text-xs', fits ? 'text-green-700' : 'text-amber-700')}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>{describeFit(fit)}</span>
    </p>
  )
}
