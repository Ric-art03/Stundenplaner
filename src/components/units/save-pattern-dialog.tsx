'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { savePattern } from '@/lib/actions/patterns'
import {
  MAX_PATTERNS,
  PATTERN_NAME_MAX,
  findPatternByName,
  patternNameError,
  type PatternSegment,
  type UnitPattern,
} from '@/lib/units/patterns'

interface SavePatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patterns: UnitPattern[]
  /** Das Muster, aus dem der Zeitverlauf stammt — dann lässt es sich überschreiben. */
  loadedPattern: UnitPattern | null
  totalMinutes: number
  /** Der Zeitverlauf, wie er gerade steht, schon als Segmente eines Musters. */
  getSegments: () => PatternSegment[]
  onSaved: (pattern: UnitPattern) => void
}

type Choice = 'overwrite' | 'new'

/**
 * Legt den Zeitverlauf als Stundenmuster ab. Stammt er aus einem geladenen
 * Muster, stehen „überschreiben“ und „als neues Muster“ zur Wahl. Trägt ein
 * anderes Muster den gewählten Namen schon, wird vor dem Überschreiben gefragt.
 */
export function SavePatternDialog({
  open,
  onOpenChange,
  patterns,
  loadedPattern,
  totalMinutes,
  getSegments,
  onSaved,
}: SavePatternDialogProps) {
  const [choice, setChoice] = React.useState<Choice>('new')
  const [name, setName] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [nameTaken, setNameTaken] = React.useState<{ id: string; name: string } | null>(null)
  const [busy, setBusy] = React.useState(false)

  React.useEffect(() => {
    if (!open) return
    setChoice(loadedPattern ? 'overwrite' : 'new')
    setName('')
    setError(null)
    setNameTaken(null)
  }, [open, loadedPattern])

  const overwriting = !!loadedPattern && choice === 'overwrite'

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    // Der Dialog liegt im Formular des Generators — dessen Absenden darf er nicht auslösen.
    event.stopPropagation()

    let id: string | undefined
    let saveName: string

    if (overwriting && loadedPattern) {
      id = loadedPattern.id
      saveName = loadedPattern.name
    } else {
      const formError = patternNameError(name)
      if (formError) return setError(formError)
      saveName = name.trim()

      if (nameTaken) {
        id = nameTaken.id
      } else {
        const taken = findPatternByName(patterns, saveName)
        if (taken) return setNameTaken({ id: taken.id, name: taken.name })
        if (patterns.length >= MAX_PATTERNS) {
          return setError(
            `Du hast bereits ${MAX_PATTERNS} Stundenmuster — mehr geht nicht. Lösche in der Verwaltung eines oder überschreibe ein vorhandenes.`
          )
        }
      }
    }

    setBusy(true)
    try {
      const result = await savePattern({
        id,
        name: saveName,
        totalMinutes,
        segments: getSegments(),
      })
      if ('nameTaken' in result) return setNameTaken(result.nameTaken)
      if ('error' in result) {
        setNameTaken(null)
        return setError(result.error)
      }
      onSaved(result.pattern)
      onOpenChange(false)
    } catch {
      setNameTaken(null)
      setError('Keine Verbindung — das Stundenmuster wurde nicht gespeichert.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {nameTaken ? (
            <>
              <DialogHeader>
                <DialogTitle>„{nameTaken.name}“ gibt es schon. Überschreiben?</DialogTitle>
                <DialogDescription>
                  Der bisherige Aufbau dieses Stundenmusters wird durch den jetzigen Zeitverlauf
                  ersetzt. Einheiten, die damit entstanden sind, bleiben, wie sie sind.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNameTaken(null)} disabled={busy}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Überschreiben
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Stundenmuster speichern</DialogTitle>
                <DialogDescription>
                  Der Zeitverlauf wird so abgelegt, wie er gerade steht — ohne Gruppe. Du kannst
                  ihn später auf jede Gruppe setzen.
                </DialogDescription>
              </DialogHeader>

              {loadedPattern && (
                <RadioGroup
                  value={choice}
                  onValueChange={(value) => {
                    setChoice(value as Choice)
                    setError(null)
                  }}
                  className="gap-2"
                >
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="overwrite" id="pattern-overwrite" className="mt-0.5" />
                    <Label htmlFor="pattern-overwrite" className="cursor-pointer break-words font-normal">
                      „{loadedPattern.name}“ überschreiben
                    </Label>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border p-3">
                    <RadioGroupItem value="new" id="pattern-new" className="mt-0.5" />
                    <Label htmlFor="pattern-new" className="cursor-pointer font-normal">
                      Als neues Muster speichern
                    </Label>
                  </div>
                </RadioGroup>
              )}

              {!overwriting && (
                <div className="space-y-2">
                  <Label htmlFor="pattern-name">Name</Label>
                  <Input
                    id="pattern-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      setError(null)
                    }}
                    placeholder="z. B. Mein 90-Minuten-Schema"
                    maxLength={PATTERN_NAME_MAX + 20}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'pattern-name-error' : undefined}
                    autoFocus
                  />
                </div>
              )}

              {error && (
                <p id="pattern-name-error" className="text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={busy}>
                  {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {overwriting ? 'Überschreiben' : 'Speichern'}
                </Button>
              </DialogFooter>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
