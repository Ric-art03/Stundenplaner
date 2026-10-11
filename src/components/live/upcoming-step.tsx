'use client'

import { ArrowRight, LayoutGrid } from 'lucide-react'
import { WorkNote } from '@/components/exercises/work-note'
import { ClampedText } from './clamped-text'
import { compareSteps, formatMaterial, stepTitle } from '@/lib/live/material'
import { cn } from '@/lib/utils'
import type { LiveStep } from '@/lib/live/types'

interface UpcomingStepProps {
  /** „Danach“ in der laufenden Stunde, „Zuerst“ auf dem Bereitschaftsbild. */
  label: string
  /** Der Schritt, der gerade läuft. `null` = es läuft noch keiner (Bereitschaftsbild). */
  current: LiveStep | null
  /** `null` = es kommt nichts mehr. */
  next: LiveStep | null
  className?: string
}

/**
 * Im Live-Modus stehen beide Arbeitsnotizen untereinander — deshalb tragen
 * beide ihren vollen Namen, statt dass eine nur „Arbeitsnotiz“ heißt.
 */
export const PHASE_NOTE_LABEL = 'Arbeitsnotiz der Phase'
export const EXERCISE_NOTE_LABEL = 'Arbeitsnotiz der Übung'

type Tone = 'remove' | 'fetch' | 'changed'

// Kräftige, deutlich verschiedene Farben: sie müssen aus ein paar Schritten
// Entfernung auseinanderzuhalten sein, nicht zum übrigen Erscheinungsbild passen.
const TONE: Record<Tone, string> = {
  remove: 'bg-slate-600 text-white',
  fetch: 'bg-emerald-600 text-white',
  changed: 'bg-amber-400 text-amber-950',
}

function Tag({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        'shrink-0 rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        TONE[tone]
      )}
    >
      {children}
    </span>
  )
}

function ChangeLine({
  tone,
  label,
  children,
}: {
  tone: Tone
  label: string
  children: React.ReactNode
}) {
  return (
    <li className="flex items-baseline gap-2">
      <Tag tone={tone}>{label}</Tag>
      <span className="min-w-0 break-words font-medium">{children}</span>
    </li>
  )
}

/**
 * Der kommende Schritt — mit dem, was sich ändert. In der laufenden Stunde ist
 * das „Danach“, auf dem Bereitschaftsbild „Zuerst“: dasselbe Muster an beiden
 * Orten, damit es einmal gelernt überall gelesen wird.
 *
 * Bewusst kein umrandetes Kästchen, sondern ein **eigenes Segment** über die
 * ganze Breite: eine kräftige Kopfleiste als Trennstrich, darunter eine eigene
 * Hintergrundfarbe. Es soll plakativ sein und von weitem zu erkennen — nicht
 * zum Rest der App passen.
 *
 * Die Reihenfolge ist fest: erst was **weg kann**, dann was **geholt wird** —
 * so wird in der Halle umgebaut. Danach die Aufstellung, dann die
 * **Beschreibung**, darunter die **Arbeitsnotizen** — erst die der Phase, dann
 * die der Übung.
 */
export function UpcomingStep({ label, current, next, className }: UpcomingStepProps) {
  const bar = 'flex flex-wrap items-baseline gap-x-2 bg-sky-700 px-4 py-2 text-white'
  const barLabel = 'text-sm font-extrabold uppercase tracking-widest'

  if (!next) {
    return (
      <section className={cn('bg-sky-50 dark:bg-sky-950/40', className)}>
        <p className={bar}>
          <span className={barLabel}>{label}</span>
        </p>
        <p className="px-4 py-4 text-lg font-semibold">Ende der Stunde</p>
      </section>
    )
  }

  const comparison = compareSteps(current, next)
  const newPhase = current !== null && next.phaseIndex !== current.phaseIndex
  const hasChanges =
    comparison.fetch.length + comparison.remove.length + comparison.changed.length > 0

  return (
    <section
      aria-labelledby="live-kommend"
      className={cn('bg-sky-50 dark:bg-sky-950/40', className)}
    >
      {/* Die Kopfleiste ist zugleich der Trennstrich. Eine neue Phase steht
          hier, in einer Reihe mit „Danach“ und vor dem Namen der Übung. */}
      <p className={bar}>
        <span className={barLabel}>{label}</span>
        {newPhase && (
          <span className="text-sm font-semibold">· Neue Phase: {next.phase}</span>
        )}
        {current === null && <span className="text-sm font-semibold">· {next.phase}</span>}
      </p>

      <div className="space-y-3 px-4 pb-5 pt-3">
        <h2 id="live-kommend" className="break-words text-xl font-bold leading-snug">
          {next.kind === 'exercise' ? stepTitle(next) : next.name}
          {/* „8 Min“ bricht nicht zwischen Zahl und Einheit um. */}
          <span className="font-normal text-muted-foreground">
            {' '}
            · <span className="whitespace-nowrap">{next.plannedMinutes} Min</span>
          </span>
        </h2>

        {hasChanges && (
          <ul className="space-y-1.5">
            {comparison.remove.length > 0 && (
              <ChangeLine tone="remove" label="Kann weg">
                {comparison.remove.map(formatMaterial).join(', ')}
              </ChangeLine>
            )}
            {comparison.fetch.length > 0 && (
              <ChangeLine tone="fetch" label="Neu holen">
                {comparison.fetch.map(formatMaterial).join(', ')}
              </ChangeLine>
            )}
            {comparison.changed.length > 0 && (
              <ChangeLine tone="changed" label="Andere Menge">
                {comparison.changed
                  .map(
                    (change) =>
                      `${change.to}× ${change.name}${change.perParticipant ? ' je TN' : ''} (statt ${change.from})`
                  )
                  .join(', ')}
              </ChangeLine>
            )}
          </ul>
        )}

        {next.kind === 'exercise' && (
          <>
            {comparison.stays.length > 0 && (
              <p>
                <span className="text-muted-foreground">
                  {comparison.compared ? 'Bleibt: ' : 'Material: '}
                </span>
                {comparison.stays.map(formatMaterial).join(', ')}
              </p>
            )}
            {!hasChanges && comparison.stays.length === 0 && (
              <p className="text-muted-foreground">Kein Material nötig.</p>
            )}

            {comparison.organizationFrom ? (
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-medium">
                <Tag tone="changed">Neue Aufstellung</Tag>
                <span className="text-muted-foreground line-through decoration-1">
                  {comparison.organizationFrom.join(', ')}
                </span>
                <ArrowRight className="h-4 w-4 shrink-0" aria-label="wird zu" />
                <span>{comparison.organizationForms.join(', ')}</span>
              </p>
            ) : (
              comparison.organizationForms.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <LayoutGrid className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="sr-only">Organisationsform: </span>
                  {comparison.organizationForms.join(', ')}
                </p>
              )
            )}
          </>
        )}

        {next.kind === 'placeholder' && (
          <p className="text-muted-foreground">Dieser Platz wurde nicht nachbesetzt.</p>
        )}

        {/* Erst die Beschreibung, darunter die Arbeitsnotiz — überall gleich. */}
        {next.description && <ClampedText text={next.description} lines={4} />}
        {/* Weiß statt Hellgrün: auf dem blauen Grund würde das Grün der
            Arbeitsnotiz verschwimmen. Ihr grüner Name bleibt.

            Zuerst die der Phase, dann die der Übung. Die der Phase steht hier
            nur, wenn sie neu ist: innerhalb einer Phase steht sie schon oben
            am laufenden Schritt. */}
        {(newPhase || current === null || next.kind === 'free') && next.phaseNote && (
          <WorkNote
            text={next.phaseNote}
            label={PHASE_NOTE_LABEL}
            clamp={3}
            className="bg-background"
          />
        )}
        {next.workNote && (
          <WorkNote
            text={next.workNote}
            label={EXERCISE_NOTE_LABEL}
            clamp={3}
            className="bg-background"
          />
        )}
      </div>
    </section>
  )
}
