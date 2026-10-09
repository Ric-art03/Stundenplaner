'use client'

import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WorkNoteField } from '@/components/exercises/work-note'
import type { EditorCandidate } from '@/lib/units/editor-pool'

/** Was aus Segment und Gruppe übernommen wird, damit die Übung ein gültiger
 *  Kandidat ist und nicht beim nächsten Generieren durch jeden Filter fällt. */
export interface QuickCreateDefaults {
  sports: string[]
  phase: string
  difficulty: string
  ageGroups: string[]
  /** Nur gefüllt, wenn die Phase genau eine Organisationsform vorgibt. */
  organizationForms: string[]
}

export interface QuickCreateInput {
  name: string
  duration: number
  description: string
  /** Leer, wenn der Nutzer nichts eingetragen hat. */
  workNotes: string
}

export interface QuickCreateResult {
  error?: string
  /** Eine Übung dieses Namens gibt es schon — sie wird zur Auswahl angeboten. */
  duplicate?: EditorCandidate
  created?: EditorCandidate
}

interface QuickCreateExerciseFormProps {
  /** Vorbelegter Name aus dem Suchfeld — meist hat der Nutzer ihn dort schon getippt. */
  initialName: string
  defaults: QuickCreateDefaults
  onCreate: (input: QuickCreateInput) => Promise<QuickCreateResult>
  /** Die vorhandene Übung stattdessen einsetzen. */
  onUseExisting: (candidate: EditorCandidate) => void
  onCancel: () => void
}

/**
 * „Übung fehlt? Schnell anlegen" — das Kurzformular im Auswahldialog.
 *
 * Getippt werden nur Name, Dauer und Beschreibung, wahlweise dazu die
 * Arbeitsnotiz — das eine Feld, das in der Halle neben der Übung steht. Sportart, Phase,
 * Schwierigkeit und Altersgruppen kommen aus Segment und Gruppe und werden
 * **angezeigt**, nicht abgefragt: der Nutzer soll sehen, dass die Übung
 * eingeordnet ist, ohne sie einordnen zu müssen.
 *
 * Die Übung wird sofort in der Datenbank angelegt, nicht erst beim Speichern des
 * Plans — darum bleibt sie erhalten, wenn der Nutzer seine Planänderungen
 * verwirft.
 */
export function QuickCreateExerciseForm({
  initialName,
  defaults,
  onCreate,
  onUseExisting,
  onCancel,
}: QuickCreateExerciseFormProps) {
  const [name, setName] = React.useState(initialName)
  const [duration, setDuration] = React.useState('10')
  const [description, setDescription] = React.useState('')
  const [workNotes, setWorkNotes] = React.useState('')
  const [busy, setBusy] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [duplicate, setDuplicate] = React.useState<EditorCandidate | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()

    if (name.trim() === '') {
      // Die übrigen Eingaben bleiben stehen — nichts wird zurückgesetzt.
      setError('Bitte gib der Übung einen Namen.')
      return
    }

    const parsed = Number.parseInt(duration, 10)
    setBusy(true)
    setError(null)
    setDuplicate(null)

    try {
      const result = await onCreate({
        name: name.trim(),
        duration: Number.isFinite(parsed) && parsed >= 1 ? parsed : 10,
        description: description.trim(),
        workNotes: workNotes.trim(),
      })

      if (result.duplicate) {
        setDuplicate(result.duplicate)
        return
      }
      if (result.error) {
        setError(result.error)
        return
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 p-1">
      <div className="space-y-1.5">
        <Label htmlFor="schnell-name">Name</Label>
        <Input
          id="schnell-name"
          value={name}
          onChange={(event) => setName(event.target.value.slice(0, 100))}
          placeholder="z. B. Abschlussspiel Kettenfangen"
          autoFocus
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="schnell-dauer">Dauer in Minuten</Label>
        <Input
          id="schnell-dauer"
          type="number"
          inputMode="numeric"
          min={1}
          value={duration}
          onChange={(event) => setDuration(event.target.value)}
          className="w-24 tabular-nums"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="schnell-beschreibung">Kurze Beschreibung</Label>
        <Textarea
          id="schnell-beschreibung"
          value={description}
          onChange={(event) => setDescription(event.target.value.slice(0, 5000))}
          placeholder="Wie läuft die Übung ab?"
          rows={3}
        />
      </div>

      <WorkNoteField
        id="schnell-arbeitsnotiz"
        scope="exercise"
        value={workNotes}
        onChange={setWorkNotes}
        placeholder="Hinweise zur Durchführung, Aufbau-Details..."
        optional
      />

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Wird aus Abschnitt und Gruppe übernommen, damit die Übung beim nächsten
          Generieren gefunden wird:
        </p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">{defaults.phase}</Badge>
          <Badge variant="secondary" className="text-xs">{defaults.difficulty}</Badge>
          {defaults.sports.map((sport) => (
            <Badge key={sport} variant="outline" className="text-xs">{sport}</Badge>
          ))}
          {defaults.ageGroups.map((group) => (
            <Badge key={group} variant="outline" className="text-xs">{group}</Badge>
          ))}
          {defaults.organizationForms.map((form) => (
            <Badge key={form} variant="secondary" className="text-xs">{form}</Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Die Übung wird als &bdquo;noch zu ergänzen&ldquo; markiert — so findest du sie
          später in der Übungsübersicht wieder, um Material und Details nachzutragen.
        </p>
      </div>

      {duplicate && (
        <Alert>
          <AlertDescription className="space-y-2 text-xs">
            <p>
              Eine Übung namens &bdquo;{duplicate.name}&ldquo; hast du schon. Willst du
              sie einsetzen, statt eine zweite anzulegen?
            </p>
            <Button type="button" size="sm" onClick={() => onUseExisting(duplicate)}>
              Vorhandene einsetzen
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="text-xs">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
          Zurück zur Auswahl
        </Button>
        <Button type="submit" disabled={busy}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Anlegen und einsetzen
        </Button>
      </div>
    </form>
  )
}
