'use client'

import * as React from 'react'
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronLeft,
  Flag,
  LogOut,
  MonitorOff,
  MoreVertical,
  Pause,
  Play,
  SkipForward,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ExerciseFactsRow } from '@/components/exercises/exercise-facts-row'
import { WorkNote } from '@/components/exercises/work-note'
import { StepImages } from './step-image'
import { EXERCISE_NOTE_LABEL, PHASE_NOTE_LABEL, UpcomingStep } from './upcoming-step'
import {
  formatClock,
  minutesLeft,
  overallClock,
  standingLabel,
  stepClock,
} from '@/lib/live/clock'
import { playSignal } from '@/lib/live/signal'
import { cn } from '@/lib/utils'
import type { LivePlan, LiveRun, LiveStep } from '@/lib/live/types'

interface StepScreenProps {
  plan: LivePlan
  run: LiveRun
  now: number
  muted: boolean
  onMutedChange: (muted: boolean) => void
  /** Das Wachhalten ist verloren und lässt sich nicht zurückholen. */
  screenMayTurnOff: boolean
  onNext: () => void
  onBack: () => void
  onSkip: () => void
  onPause: () => void
  onResume: () => void
  onEnd: () => void
  onCancel: () => void
  onLeave: () => void
}

function factsMaterials(step: LiveStep) {
  return step.materials.map((material) => ({
    name: material.name,
    quantity: material.quantity,
    mode: material.perParticipant ? 'pro Teilnehmer' : undefined,
  }))
}

/** Der aktuelle Schritt unterhalb der Restzeit: was jetzt gebraucht wird. */
function CurrentDetails({ step }: { step: LiveStep }) {
  const [descriptionOpen, setDescriptionOpen] = React.useState(false)

  if (step.kind === 'free') {
    return step.phaseNote ? (
      <WorkNote text={step.phaseNote} label={PHASE_NOTE_LABEL} clamp={3} />
    ) : (
      <p className="text-sm text-muted-foreground">Für diese Zeit ist nichts geplant.</p>
    )
  }

  if (step.kind === 'placeholder') {
    return (
      <p className="rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground">
        Die Übung an dieser Stelle wurde gelöscht, der Platz wurde nicht nachbesetzt.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {/* Der reguläre Platz der Arbeitsnotiz der Phase: sie gilt für die ganze
          Phase und steht deshalb an jedem ihrer Schritte — als Erstes, noch
          vor allem, was nur diese eine Übung betrifft. */}
      {step.phaseNote && <WorkNote text={step.phaseNote} label={PHASE_NOTE_LABEL} clamp={3} />}
      <ExerciseFactsRow
        materials={factsMaterials(step)}
        organizationForms={step.organizationForms}
        variants={step.variants}
        currentVariantId={step.variantId}
        className="text-sm"
      />
      {step.description && (
        <Collapsible open={descriptionOpen} onOpenChange={setDescriptionOpen}>
          <CollapsibleTrigger asChild>
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Beschreibung
              <ChevronDown
                className={cn('h-4 w-4 transition-transform', descriptionOpen && 'rotate-180')}
                aria-hidden
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <p className="whitespace-pre-wrap px-1 pt-2 text-sm">{step.description}</p>
          </CollapsibleContent>
        </Collapsible>
      )}
      {/* Eine Akte aus einer älteren Fassung der App kennt die Liste noch nicht. */}
      {(step.imagePaths?.length ?? 0) > 0 && (
        <StepImages paths={step.imagePaths} alt={step.name} />
      )}
      {/* Erst die Beschreibung, darunter die Arbeitsnotiz der Übung — überall gleich. */}
      {step.workNote && <WorkNote text={step.workNote} label={EXERCISE_NOTE_LABEL} clamp={3} />}
    </div>
  )
}

/**
 * Die laufende Stunde. Drei Zonen bleiben stehen — Gesamtstand, Restzeit,
 * Bedienleiste —, dazwischen scrollt der Inhalt.
 */
export function StepScreen({
  plan,
  run,
  now,
  muted,
  onMutedChange,
  screenMayTurnOff,
  onNext,
  onBack,
  onSkip,
  onPause,
  onResume,
  onEnd,
  onCancel,
  onLeave,
}: StepScreenProps) {
  const step = plan.steps[run.current]
  const next = plan.steps[run.current + 1] ?? null
  const clock = stepClock(run, plan, now)
  const overall = overallClock(run, plan, now)
  const paused = run.pausedAt !== null
  const last = next === null

  // Das Signal ertönt genau einmal: wenn die Restzeit vor unseren Augen null
  // erreicht. Wer einen längst abgelaufenen Schritt wieder öffnet oder die
  // Seite neu lädt, hört nichts.
  const watched = React.useRef<{ key: string; expired: boolean } | null>(null)
  React.useEffect(() => {
    const before = watched.current
    watched.current = { key: step.key, expired: clock.expired }
    if (!before || before.key !== step.key) return
    if (!before.expired && clock.expired && !muted && !paused) playSignal()
  }, [step.key, clock.expired, muted, paused])

  // Beim Schrittwechsel zurück an den Anfang — sonst stünde der neue Schritt
  // dort, wohin der alte gescrollt war.
  const scroller = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [step.key])

  return (
    <div className="mx-auto flex h-dvh max-w-xl flex-col">
      <header className="flex shrink-0 items-center gap-1 border-b pl-4 pr-1">
        <p className="min-w-0 flex-1 truncate text-sm" aria-live="off">
          <span className="text-muted-foreground">
            noch {minutesLeft(overall.remainingMs)} Min ·{' '}
          </span>
          <span
            className={cn(
              'font-semibold',
              overall.standing === 'behind' && 'text-destructive',
              overall.standing === 'ahead' && 'text-primary'
            )}
          >
            {standingLabel(overall)}
          </span>
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-11 w-11 shrink-0"
          aria-pressed={!muted}
          aria-label={muted ? 'Signal ist stumm — einschalten' : 'Signal ist an — stummschalten'}
          onClick={() => onMutedChange(!muted)}
        >
          {muted ? <BellOff className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-11 w-11 shrink-0" aria-label="Menü">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onSelect={onLeave} className="min-h-11">
              <LogOut className="mr-2 h-4 w-4" />
              Live-Modus verlassen (läuft weiter)
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onEnd} className="min-h-11">
              <Flag className="mr-2 h-4 w-4" />
              Stunde beenden
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onCancel} className="min-h-11 text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Abbrechen und verwerfen
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {screenMayTurnOff && (
        <p className="flex shrink-0 items-center gap-2 border-b bg-muted/60 px-4 py-1.5 text-xs text-muted-foreground">
          <MonitorOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Der Bildschirm kann ausgehen — die Stunde läuft trotzdem weiter.
        </p>
      )}

      {/* Die Restzeit: das größte Element des Bildschirms, bleibt beim Scrollen stehen. */}
      <div className="shrink-0 border-b px-4 pb-3 pt-2">
        <p className="text-sm text-muted-foreground">
          {step.phase} · {step.indexInPhase} von {step.phaseCount}
        </p>
        <h1 className="line-clamp-2 break-words text-xl font-bold leading-tight">
          {step.name}
          {step.variantTitle && (
            <span className="font-semibold text-muted-foreground"> · {step.variantTitle}</span>
          )}
        </h1>
        <div
          className="mt-1 flex items-baseline gap-3"
          role="timer"
          aria-live="off"
          aria-label={
            clock.expired
              ? `${formatClock(clock.overMs)} über der Zeit`
              : `Restzeit ${formatClock(clock.remainingMs)}`
          }
        >
          <span
            className={cn(
              'text-7xl font-bold leading-none tabular-nums tracking-tight',
              clock.expired && 'text-destructive'
            )}
          >
            {clock.expired ? formatClock(clock.overMs) : formatClock(clock.remainingMs)}
          </span>
          <span className={cn('text-base', clock.expired ? 'font-semibold text-destructive' : 'text-muted-foreground')}>
            {clock.expired ? 'über' : `von ${step.plannedMinutes} Min`}
          </span>
        </div>
        {/* Für Screenreader nur beim Wechsel und beim Ablauf, nicht jede Sekunde. */}
        <p className="sr-only" aria-live="polite">
          {clock.expired
            ? `Zeit abgelaufen: ${step.name}`
            : `${step.name}, ${step.plannedMinutes} Minuten`}
        </p>
      </div>

      {/* Der `key` klappt beim Schrittwechsel alles wieder zu. */}
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <div className="px-4 py-3">
          <CurrentDetails key={`aktuell-${step.key}`} step={step} />
        </div>
        {/* Ein eigenes Segment über die ganze Breite, das den Rest des
            Bildschirms füllt — kein Kästchen im Inhalt. */}
        <UpcomingStep
          key={`danach-${step.key}`}
          label="Danach"
          current={step}
          next={next}
          className="flex-1"
        />
      </div>

      <nav
        aria-label="Bedienung"
        className="flex shrink-0 gap-2 border-t bg-background px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        <Button
          variant="outline"
          className="h-14 flex-1 flex-col gap-0.5 px-1 text-xs"
          onClick={onBack}
          disabled={run.current === 0}
        >
          <ChevronLeft className="h-5 w-5" />
          Zurück
        </Button>
        <Button variant="outline" className="h-14 flex-1 flex-col gap-0.5 px-1 text-xs" onClick={onSkip}>
          <SkipForward className="h-5 w-5" />
          Auslassen
        </Button>
        <Button variant="outline" className="h-14 flex-1 flex-col gap-0.5 px-1 text-xs" onClick={onPause}>
          <Pause className="h-5 w-5" />
          Pause
        </Button>
        <Button className="h-14 flex-[2] text-base" onClick={onNext}>
          {last ? 'Stunde beenden' : 'Weiter'}
        </Button>
      </nav>

      {paused && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="live-pausiert"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-background/95 px-6 text-center"
        >
          <div>
            <p id="live-pausiert" className="text-4xl font-bold">
              Pausiert
            </p>
            <p className="mt-2 text-muted-foreground">
              {step.name} · {clock.expired
                ? `${formatClock(clock.overMs)} über`
                : `noch ${formatClock(clock.remainingMs)}`}
            </p>
            <p className="text-sm text-muted-foreground">Die Zeit steht. Der Bildschirm bleibt an.</p>
          </div>
          <Button size="lg" className="h-16 w-full max-w-xs text-lg" onClick={onResume} autoFocus>
            <Play className="mr-2 h-5 w-5" />
            Fortsetzen
          </Button>
        </div>
      )}
    </div>
  )
}
