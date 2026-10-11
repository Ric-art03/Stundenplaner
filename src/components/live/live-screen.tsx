'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CloudOff, Info, Loader2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ReadyScreen } from './ready-screen'
import { RunSummary } from './run-summary'
import { StepScreen } from './step-screen'
import type { FollowUpChange } from './step-follow-up'
import { useLiveOffline } from '@/hooks/use-live-offline'
import { useLiveSession, useNow, useOnline, usePendingRuns } from '@/hooks/use-live-session'
import { useStoredFlag } from '@/hooks/use-stored-flag'
import { useToast } from '@/hooks/use-toast'
import { useWakeLock } from '@/hooks/use-wake-lock'
import { saveRun, updateRunNote } from '@/lib/actions/live'
import { isForgotten } from '@/lib/live/clock'
import {
  buildRunRecord,
  endForgottenRun,
  endRun,
  nextStep,
  pauseRun,
  previousStep,
  resumeRun,
  skipStep,
  startRun,
} from '@/lib/live/run'
import { unlockSignal } from '@/lib/live/signal'
import {
  flushPending,
  queueRun,
  readSession,
  setPendingNote,
  storageAvailable,
  updateSession,
  writeSession,
} from '@/lib/live/store'
import { createClient } from '@/lib/supabase/client'
import type { LivePlan, LiveRun, LiveSession } from '@/lib/live/types'

const NOTE_MAX = 2000

/**
 * Wendet einen Tipp auf den Verlauf an — auf die Akte, wie sie **jetzt** auf
 * dem Gerät liegt, nicht auf den Stand dieses Tabs. Endet die Stunde dabei,
 * geht die Durchführung sofort in die Warteliste und von dort an den Server:
 * wer die Zusammenfassung einfach schließt, verliert nichts.
 */
function act(change: (run: LiveRun, plan: LivePlan, now: number) => LiveRun) {
  const before = readSession()
  if (!before) return
  const run = change(before.run, before.plan, Date.now())
  if (run === before.run) return

  const after: LiveSession = { ...before, run }
  writeSession(after)

  if (before.run.phase !== 'ended' && run.phase === 'ended') {
    queueRun(after)
    void flushPending(after.userId, saveRun)
  }
}

/**
 * Das Konto, das dieses Gerät zuletzt kannte — ohne den Server zu fragen, denn
 * eine laufende Stunde muss auch ohne Netz und mit abgelaufener Sitzung
 * bedienbar bleiben. `undefined` = noch nicht nachgesehen, `null` = keines.
 */
function useKnownUserId(): string | null | undefined {
  const [userId, setUserId] = React.useState<string | null | undefined>(undefined)

  React.useEffect(() => {
    let cancelled = false
    createClient()
      .auth.getSession()
      .then(({ data }) => {
        if (!cancelled) setUserId(data.session?.user.id ?? null)
      })
      .catch(() => {
        if (!cancelled) setUserId(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return userId
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      {children}
    </div>
  )
}

function SummaryScreen({ session }: { session: LiveSession }) {
  const router = useRouter()
  const { toast } = useToast()
  const online = useOnline()
  const pending = usePendingRuns()
  const [finishing, setFinishing] = React.useState(false)

  const record = React.useMemo(() => buildRunRecord(session), [session])
  const waiting = pending.find((entry) => entry.record.id === session.runId)
  const unitHref = `/units/${session.plan.unitId}`

  // Beim Zurückkehren und sobald wieder Verbindung da ist: nachreichen.
  React.useEffect(() => {
    if (online && waiting && !waiting.failure) void flushPending(session.userId, saveRun)
  }, [online, waiting, session.userId])

  const disabledReason = !online
    ? 'Ohne Verbindung lässt sich an den Übungen nichts ändern. Du kannst das später an der gespeicherten Durchführung nachholen — „Fertig“ geht trotzdem.'
    : waiting
      ? 'Die Durchführung ist noch nicht gespeichert. Sobald sie es ist, kannst du hier oder an der Einheit Erkenntnisse in die Übungen übernehmen.'
      : null

  function onChanged(position: number, change: FollowUpChange) {
    updateSession((current) => ({
      ...current,
      adopted: { ...current.adopted, [position]: { ...current.adopted[position], ...change } },
    }))
  }

  async function finish() {
    const note = session.noteDraft.trim()
    setFinishing(true)
    try {
      // Wartet die Durchführung noch, reist die Notiz mit ihr. Ist sie schon
      // gespeichert, wird die Notiz nachgetragen.
      if (!setPendingNote(session.runId, note) && note) {
        const result = await updateRunNote(session.runId, note)
        if (!result.ok) {
          toast({ variant: 'destructive', title: 'Notiz nicht gespeichert', description: result.error })
          return
        }
      }
      writeSession(null)
      router.push(unitHref)
    } catch {
      toast({
        variant: 'destructive',
        title: 'Notiz nicht gespeichert',
        description: 'Keine Verbindung. Versuch es gleich noch einmal.',
      })
    } finally {
      setFinishing(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6">
      <main className="flex-1 space-y-5 pb-6">
        <header>
          <p className="text-sm font-medium text-primary">Stunde beendet</p>
          <h1 className="text-2xl font-bold leading-tight">{session.plan.unitName}</h1>
        </header>

        {waiting && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-md border px-3 py-2 text-sm text-muted-foreground"
          >
            <CloudOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            {waiting.failure
              ? `Die Durchführung konnte nicht gespeichert werden: ${waiting.failure}`
              : 'Die Durchführung liegt auf diesem Gerät und wird nachgereicht, sobald die App wieder Verbindung hat. Es geht nichts verloren.'}
          </p>
        )}

        <RunSummary
          record={record}
          followUp={{ returnTo: '/live', disabledReason, onChanged }}
        />

        <p className="flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-sm">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <span>
            Keine Zeit? Du kannst die Stunde auch später nachbereiten: sie steht an der Einheit unter
            „Durchführungen“, mit denselben Möglichkeiten an jeder Übung.
          </span>
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="live-wie-liefs">
            Wie lief&apos;s? <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="live-wie-liefs"
            value={session.noteDraft}
            onChange={(event) => {
              const noteDraft = event.target.value.slice(0, NOTE_MAX)
              updateSession((current) => ({ ...current, noteDraft }))
            }}
            rows={3}
            maxLength={NOTE_MAX}
            placeholder="Ein Satz zur Stunde"
          />
        </div>
      </main>

      <Button size="lg" className="h-14 w-full text-base" onClick={finish} disabled={finishing}>
        {finishing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Fertig
      </Button>
    </div>
  )
}

/** Der Live-Bildschirm: Bereitschaftsbild, laufende Stunde, Zusammenfassung. */
export function LiveScreen() {
  const router = useRouter()
  const session = useLiveSession()
  const knownUserId = useKnownUserId()
  const offline = useLiveOffline()
  const [muted, setMuted] = useStoredFlag('stundenplaner:live:stumm', false)
  const [confirming, setConfirming] = React.useState<'end' | 'cancel' | null>(null)

  const phase = session?.run.phase
  // Auch in der Pause — eine Trinkpause soll das Handy nicht sperren. Nach dem
  // Ende hält die App den Bildschirm nicht mehr wach.
  const wakeLock = useWakeLock(phase === 'ready' || phase === 'running')
  const now = useNow(phase === 'running')

  if (session === undefined || knownUserId === undefined) {
    return (
      <Centered>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Lädt" />
      </Centered>
    )
  }

  // Ein anderes Konto auf demselben Gerät sieht die Stunde nicht. Ist niemand
  // angemeldet (Sitzung abgelaufen), bleibt sie bedienbar.
  const foreign = session !== null && knownUserId !== null && knownUserId !== session.userId

  if (session === null || foreign) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Es läuft gerade keine Stunde</h1>
        <p className="text-sm text-muted-foreground">
          Starte eine Stunde an einer gespeicherten Einheit über „Stunde starten“.
        </p>
        <Button asChild>
          <Link href="/units">Zu den Einheiten</Link>
        </Button>
      </Centered>
    )
  }

  const { plan, run } = session
  const unitHref = `/units/${plan.unitId}`

  if (run.phase === 'ready') {
    return (
      <ReadyScreen
        plan={plan}
        wakeLock={wakeLock.status}
        onRetryWakeLock={wakeLock.retry}
        storageWorks={storageAvailable()}
        offline={offline}
        onStart={() => {
          // Aus dieser Berührung heraus lässt das Handy später den Ton zu.
          unlockSignal()
          act((current, _plan, at) => startRun(current, at))
        }}
        onLeave={() => {
          // Ohne „Los geht's“ läuft keine Stunde und nichts ist festgehalten.
          writeSession(null)
          router.push(unitHref)
        }}
      />
    )
  }

  if (run.phase === 'ended') return <SummaryScreen session={session} />

  if (isForgotten(run, plan, now)) {
    return (
      <Centered>
        <h1 className="text-xl font-semibold">Läuft diese Stunde noch?</h1>
        <p className="text-sm text-muted-foreground">
          „{plan.unitName}“ war für {plan.totalMinutes} Minuten geplant und ist seit mehr als dem
          Doppelten nicht beendet worden. Der zuletzt offene Schritt zählt mit höchstens seiner
          geplanten Dauer.
        </p>
        <Button className="min-h-11 w-full" onClick={() => act(endForgottenRun)}>
          Beenden und festhalten
        </Button>
        <Button
          variant="outline"
          className="min-h-11 w-full"
          onClick={() => {
            writeSession(null)
            router.push(unitHref)
          }}
        >
          Verwerfen
        </Button>
      </Centered>
    )
  }

  return (
    <>
      <StepScreen
        plan={plan}
        run={run}
        now={now}
        muted={muted}
        onMutedChange={setMuted}
        screenMayTurnOff={wakeLock.status === 'denied' || wakeLock.status === 'unsupported'}
        onNext={() => act((current, _plan, at) => nextStep(current, at))}
        onBack={() => act((current, _plan, at) => previousStep(current, at))}
        onSkip={() => act((current, _plan, at) => skipStep(current, at))}
        onPause={() => act((current, _plan, at) => pauseRun(current, at))}
        onResume={() => {
          unlockSignal()
          act((current, _plan, at) => resumeRun(current, at))
        }}
        onEnd={() => setConfirming('end')}
        onCancel={() => setConfirming('cancel')}
        onLeave={() => router.push(unitHref)}
      />

      <AlertDialog open={confirming === 'end'} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stunde jetzt beenden?</AlertDialogTitle>
            <AlertDialogDescription>
              Die Stunde wird festgehalten. Schritte, die noch ausstehen, gelten als ausgelassen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Weiterlaufen lassen</AlertDialogCancel>
            <AlertDialogAction onClick={() => act((current, _plan, at) => endRun(current, at))}>
              Stunde beenden
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={confirming === 'cancel'}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stunde abbrechen und verwerfen?</AlertDialogTitle>
            <AlertDialogDescription>
              Die laufende Stunde wird nicht festgehalten. Das lässt sich nicht rückgängig machen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Weiterlaufen lassen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => {
                writeSession(null)
                router.push(unitHref)
              }}
            >
              Verwerfen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
