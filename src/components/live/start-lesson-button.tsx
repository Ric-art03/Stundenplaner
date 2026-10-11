'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Play } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button, type ButtonProps } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { loadLivePlan } from '@/lib/actions/live'
import { endRun } from '@/lib/live/run'
import {
  openSession,
  queueRun,
  runningSession,
  writeSession,
} from '@/lib/live/store'
import { syncPending } from '@/lib/live/sync'
import { cn } from '@/lib/utils'

interface StartLessonButtonProps {
  unitId: string
  /** In der Übersicht nur das Symbol; der Name steht dann für Screenreader da. */
  compact?: boolean
  unitName?: string
  variant?: ButtonProps['variant']
  className?: string
  disabled?: boolean
}

/**
 * „Stunde starten“ — an jeder gespeicherten Einheit, auf der Detailseite und in
 * der Übersicht. Holt einmal alles, was die Stunde braucht, legt die
 * Stundenakte an und öffnet das Bereitschaftsbild.
 *
 * Läuft schon eine Stunde, wird gefragt: es läuft höchstens eine je Gerät.
 */
export function StartLessonButton({
  unitId,
  compact = false,
  unitName,
  variant = 'default',
  className,
  disabled,
}: StartLessonButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = React.useState(false)
  const [runningName, setRunningName] = React.useState<string | null>(null)

  async function start() {
    setLoading(true)
    try {
      const result = await loadLivePlan(unitId)
      if (!result.ok) {
        toast({ variant: 'destructive', title: 'Stunde nicht gestartet', description: result.error })
        return
      }
      openSession(result.userId, result.plan)
      router.push('/live')
    } catch {
      toast({
        variant: 'destructive',
        title: 'Stunde nicht gestartet',
        description: 'Zum Starten braucht die App Verbindung. Danach läuft die Stunde ohne Netz.',
      })
    } finally {
      setLoading(false)
    }
  }

  function onClick() {
    const running = runningSession(null)
    if (running) setRunningName(running.plan.unitName)
    else void start()
  }

  function endRunning() {
    const running = runningSession(null)
    if (running) {
      const ended = { ...running, run: endRun(running.run, Date.now()) }
      queueRun(ended)
      void syncPending(ended.userId)
    }
    setRunningName(null)
    void start()
  }

  function discardRunning() {
    writeSession(null)
    setRunningName(null)
    void start()
  }

  return (
    <>
      <Button
        variant={variant}
        size={compact ? 'icon' : 'sm'}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={compact ? `Stunde starten: ${unitName ?? 'Einheit'}` : undefined}
        title={compact ? 'Stunde starten' : undefined}
        className={cn(compact && 'h-9 w-9', className)}
      >
        {loading ? (
          <Loader2 className={cn('h-4 w-4 animate-spin', !compact && 'mr-2')} />
        ) : (
          <Play className={cn('h-4 w-4', !compact && 'mr-2')} />
        )}
        {!compact && 'Stunde starten'}
      </Button>

      <AlertDialog open={runningName !== null} onOpenChange={(open) => !open && setRunningName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Es läuft schon eine Stunde</AlertDialogTitle>
            <AlertDialogDescription>
              „{runningName}“ ist noch nicht beendet. Auf einem Gerät läuft höchstens eine Stunde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:flex-col sm:space-x-0">
            <Button className="min-h-11" onClick={() => router.push('/live')}>
              Laufende Stunde fortsetzen
            </Button>
            <Button variant="outline" className="min-h-11" onClick={endRunning}>
              Beenden und festhalten, dann neu starten
            </Button>
            <Button
              variant="outline"
              className="min-h-11 text-destructive hover:text-destructive"
              onClick={discardRunning}
            >
              Verwerfen, dann neu starten
            </Button>
            <AlertDialogCancel className="min-h-11">Abbrechen</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
