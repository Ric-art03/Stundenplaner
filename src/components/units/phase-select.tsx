'use client'

import * as React from 'react'
import { Check, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PhaseSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  error?: string
}

export function PhaseSelect({ options, value, onChange, error }: PhaseSelectProps) {
  const [adding, setAdding] = React.useState(false)
  const [draft, setDraft] = React.useState('')

  // Eine bereits gewählte eigene Phase muss in der Liste auftauchen,
  // sonst zeigt die Auswahl nichts an.
  const allOptions = React.useMemo(() => {
    if (value && !options.includes(value)) return [...options, value]
    return options
  }, [options, value])

  function confirmCustom() {
    const name = draft.trim()
    if (!name) return
    onChange(name)
    setDraft('')
    setAdding(false)
  }

  if (adding) {
    return (
      <div className="space-y-1">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                confirmCustom()
              }
              if (e.key === 'Escape') {
                setAdding(false)
                setDraft('')
              }
            }}
            placeholder="Name der Phase"
            maxLength={60}
            aria-label="Name der eigenen Phase"
          />
          <Button type="button" size="icon" variant="outline" onClick={confirmCustom} aria-label="Phase übernehmen">
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => {
              setAdding(false)
              setDraft('')
            }}
            aria-label="Abbrechen"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Für eine neue Phase gibt es noch keine Übungen — das Segment bleibt dann leer,
          bis du Übungen dieser Phase zuordnest.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger aria-label="Phase">
            <SelectValue placeholder="Phase auswählen" />
          </SelectTrigger>
          <SelectContent>
            {allOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={() => setAdding(true)}
          aria-label="Eigene Phase anlegen"
          title="Eigene Phase anlegen"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
