'use client'

import { CalendarCheck, Loader2, Plus, TriangleAlert, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GapCriterion, GapDetail } from '@/lib/units/generator'

interface GapNoticeProps {
  segmentMinutes: number
  filledMinutes: number
  reason: string | null
  detail: GapDetail | null
  singleSportGroup: boolean
  relaxing: boolean
  /** Nur im Bearbeiten-Modus gesetzt: die Lücke an dieser Stelle selbst füllen. */
  onInsert?: () => void
  /** Nur im Bearbeiten-Modus gesetzt: „Als geplante Lücke stehen lassen". */
  onDeclarePlanned?: () => void
  /**
   * Nur in der Leseansicht gesetzt. Lockern füllt das Segment auf dem Server
   * neu und lädt die Einheit — im Bearbeiten-Modus würde das die offenen
   * Änderungen ohne Nachfrage verwerfen.
   */
  onRelax?: () => void
}

/** Wie das Kriterium heißt und was der Nutzer dagegen tun kann. */
const CRITERIA: Record<GapCriterion, { label: string; remedy: string }> = {
  age: {
    label: 'Altersgruppe',
    remedy:
      'Trage bei den Übungen weitere Altersgruppen nach, oder erweitere die Altersgruppen im Gruppenprofil.',
  },
  material: {
    label: 'Material in deiner Halle',
    remedy:
      'Ergänze die Bestände in der Halle, oder lege Übungen an, die mit weniger Material auskommen.',
  },
  participants: {
    label: 'Teilnehmerzahl',
    remedy:
      'Erweitere die Teilnehmer-Spanne der Übungen, oder prüfe die Teilnehmerzahl im Gruppenprofil.',
  },
  sport: {
    label: 'gewählte Sportarten',
    remedy: 'Hake im Generator für diese Phase weitere Sportarten an.',
  },
  difficulty: {
    label: 'gewählte Schwierigkeitsgrade',
    remedy: 'Hake im Generator für diese Phase weitere Schwierigkeitsgrade an.',
  },
  organization: {
    label: 'gewählte Organisationsformen',
    remedy:
      'Hake im Generator für diese Phase weitere Organisationsformen an, nimm die Auswahl ganz heraus, oder trage die Organisationsform bei deinen Übungen nach.',
  },
}

const SOFT: GapCriterion[] = ['sport', 'difficulty', 'organization']

function remediesFor(detail: GapDetail): string[] {
  switch (detail.kind) {
    case 'no-phase':
      return [
        `Ordne Übungen der Phase „${detail.phase}" zu, oder wähle hier eine andere Phase, für die du schon Übungen hast.`,
      ]
    case 'all-filtered':
      // Zuerst, was sich im Generator für dieses Segment ändern lässt („Hake im
      // Generator …"), danach das, wofür man an Übungen, Gruppe oder Halle muss.
      return [
        ...detail.blockedBy.filter((entry) => SOFT.includes(entry.criterion)),
        ...detail.blockedBy.filter((entry) => !SOFT.includes(entry.criterion)),
      ].map((entry) => CRITERIA[entry.criterion].remedy)
    case 'exhausted':
      return [`Lege weitere Übungen der Phase „${detail.phase}" an.`]
    case 'too-short':
      return [
        'Verlängere diese Phase im Generator, oder lege kürzere Übungen an.',
      ]
  }
}

/** Lockern gibt nur Organisationsform, Schwierigkeitsgrad und Sportart frei — alles andere bleibt hart. */
function relaxCanHelp(detail: GapDetail | null): boolean {
  if (!detail || detail.relaxed) return false
  // Hat die Phase gar keine Übung, ist Lockern eine Sackgasse: `buildPool`
  // filtert **zuerst** auf die Phase und lässt die lockerbaren Kriterien erst
  // danach greifen (`generator.ts:264-266`). Ein leerer Phasen-Treffer bleibt
  // deshalb auf jeder Lockerungsstufe leer. Der Knopf würde folgenlos bleiben
  // und vom einzigen Ausweg ablenken — der Phase Übungen zuzuordnen.
  if (detail.kind === 'no-phase') return false
  if (detail.kind !== 'all-filtered') return true
  return detail.blockedBy.some((entry) => SOFT.includes(entry.criterion))
}

export function GapNotice({
  segmentMinutes,
  filledMinutes,
  reason,
  detail,
  singleSportGroup,
  relaxing,
  onRelax,
  onInsert,
  onDeclarePlanned,
}: GapNoticeProps) {
  const missing = segmentMinutes - filledMinutes
  const canRelax = relaxCanHelp(detail)
  const remedies = detail ? remediesFor(detail) : []

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-50 p-3 dark:bg-amber-950/20">
      <div className="flex items-start gap-2">
        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <p className="text-sm font-medium">
              {filledMinutes === 0
                ? `${segmentMinutes} Minuten nicht gefüllt`
                : `${filledMinutes} von ${segmentMinutes} Minuten gefüllt — ${missing} Minuten fehlen`}
            </p>
            {reason && <p className="text-xs text-muted-foreground">{reason}</p>}
          </div>

          {/* Jede Ursache einzeln, damit klar ist, wo sich etwas ändern lässt. */}
          {detail && detail.kind === 'all-filtered' && detail.blockedBy.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Daran scheitern sie:</p>
              <ul className="space-y-0.5">
                {detail.blockedBy.map((entry) => (
                  <li key={entry.criterion} className="text-xs text-muted-foreground">
                    <span className="tabular-nums">{entry.count}</span>{' '}
                    {entry.count === 1 ? 'Übung' : 'Übungen'} an{' '}
                    <span className="font-medium text-foreground">
                      {CRITERIA[entry.criterion].label}
                      {entry.criterion === 'participants' && detail.participants != null
                        ? ` (${detail.participants})`
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
              {detail.blockedBy.length > 1 && (
                <p className="text-xs text-muted-foreground/80">
                  Mehrfachnennung möglich — eine Übung kann an mehrerem zugleich scheitern.
                </p>
              )}
            </div>
          )}

          {remedies.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium">Was hilft:</p>
              <ul className="space-y-0.5">
                {remedies.map((remedy) => (
                  <li key={remedy} className="text-xs text-muted-foreground">
                    {remedy}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {singleSportGroup && (
            <p className="text-xs text-muted-foreground">
              Deine Gruppe ist nur mit einer Sportart getaggt. Ergänze im Gruppenprofil
              weitere Sportarten, die in deinen Stunden vorkommen — das erhöht die Trefferzahl
              deutlich.
            </p>
          )}

          {/* Im Bearbeiten-Modus hat der Nutzer zwei Handhaben: füllen oder
              erklären. In der Leseansicht bleibt das Lockern. */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {onInsert && (
              <Button type="button" size="sm" onClick={onInsert}>
                <Plus className="mr-2 h-4 w-4" />
                Übung einfügen
              </Button>
            )}

            {onDeclarePlanned && (
              <Button type="button" variant="outline" size="sm" onClick={onDeclarePlanned}>
                <CalendarCheck className="mr-2 h-4 w-4" />
                Als geplante Lücke stehen lassen
              </Button>
            )}

            {!onRelax ? null : canRelax ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onRelax}
                disabled={relaxing}
              >
                {relaxing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Unlock className="mr-2 h-4 w-4" />
                )}
                Mit gelockerten Kriterien erneut versuchen
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                {detail?.relaxed
                  ? 'Die Kriterien sind für diese Phase bereits gelockert.'
                  : 'Lockern würde hier nichts bringen: Es gibt nur Organisationsform, Schwierigkeitsgrad und Sportart frei, und daran liegt es nicht.'}
              </p>
            )}
          </div>

          {/* In der Leseansicht fehlen die zwei Handhaben des Bearbeiten-Modus —
              der Hinweis sagt, wo sie sind. */}
          {!onInsert && !onDeclarePlanned && (
            <p className="text-xs text-muted-foreground">
              Klicke oben auf &bdquo;Bearbeiten&ldquo; für weitere Optionen (Übungen einfügen
              oder Lücke stehen lassen).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
