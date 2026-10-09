'use client'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

/**
 * Die Arbeitsnotiz — **ein** Name, **ein** Erklärtext, **ein** Aussehen, an
 * allen Stellen. Es gibt zwei davon: die der Übung (PROJ-3) und die der Phase
 * (PROJ-6). Beide erscheinen im fertigen Stundenverlauf, und beide werden im
 * Live-Modus (PROJ-14) einen besonderen Rang haben — deshalb sollen sie überall
 * gleich heißen und gleich aussehen.
 */

/** Wozu die Notiz gehört — bestimmt nur den Erklärtext. */
export type WorkNoteScope = 'exercise' | 'segment'

export const WORK_NOTE_LABEL = 'Arbeitsnotiz'

export const WORK_NOTE_HINTS: Record<WorkNoteScope, string> = {
  exercise: 'Erscheint im fertigen Stundenverlauf bei dieser Übung.',
  segment: 'Erscheint im fertigen Stundenverlauf an dieser Stelle.',
}

/** Das leichte Hellgrün, an dem die Arbeitsnotiz überall zu erkennen ist. */
const TINT = 'border-primary/20 bg-primary/5'

interface WorkNoteFieldProps {
  id: string
  scope: WorkNoteScope
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  maxLength?: number
  /** „(optional)" hinter dem Namen. */
  optional?: boolean
  /** „12/2.000" unter dem Feld. */
  showCount?: boolean
  className?: string
}

export function WorkNoteField({
  id,
  scope,
  value,
  onChange,
  placeholder,
  rows = 2,
  maxLength = 2000,
  optional = false,
  showCount = false,
  className,
}: WorkNoteFieldProps) {
  const hintId = `${id}-hinweis`

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {WORK_NOTE_LABEL}
        {optional && <span className="font-normal text-muted-foreground"> (optional)</span>}
      </Label>
      <p id={hintId} className="text-xs text-muted-foreground">
        {WORK_NOTE_HINTS[scope]}
      </p>
      <Textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        rows={rows}
        maxLength={maxLength}
        aria-describedby={hintId}
        className={cn('text-sm', TINT)}
      />
      {showCount && (
        <p className="text-right text-xs text-muted-foreground">
          {value.length}/{maxLength.toLocaleString('de-DE')}
        </p>
      )}
    </div>
  )
}

interface WorkNoteProps {
  text: string
  className?: string
}

/** Die Arbeitsnotiz zum Lesen — auf der Detailseite der Übung und im Stundenverlauf. */
export function WorkNote({ text, className }: WorkNoteProps) {
  return (
    <div className={cn('rounded-md border px-3 py-2', TINT, className)}>
      <p className="mb-0.5 text-xs font-medium text-primary">{WORK_NOTE_LABEL}</p>
      <p className="whitespace-pre-wrap text-sm">{text}</p>
    </div>
  )
}
