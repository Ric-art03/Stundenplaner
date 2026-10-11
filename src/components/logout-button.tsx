'use client'

import { useState } from 'react'
import { logout } from '@/app/(auth)/actions'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { saveRun } from '@/lib/actions/live'
import { endRun } from '@/lib/live/run'
import { flushPending, queueRun, runningSession, writeSession } from '@/lib/live/store'

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false)
  // Der Name der laufenden Stunde, solange die Nachfrage offen ist (PROJ-14).
  const [runningName, setRunningName] = useState<string | null>(null)

  async function handleLogout() {
    setIsLoading(true)
    try {
      await logout()
      window.location.href = '/'
    } catch {
      setIsLoading(false)
    }
  }

  function requestLogout() {
    const running = runningSession(null)
    if (running) setRunningName(running.plan.unitName)
    else void handleLogout()
  }

  async function endThenLogout() {
    setRunningName(null)
    setIsLoading(true)
    const running = runningSession(null)
    if (running) {
      queueRun({ ...running, run: endRun(running.run, Date.now()) })
      // Solange die Anmeldung noch gilt. Klappt es nicht, wartet die
      // Durchführung auf dem Gerät, bis dasselbe Konto wieder angemeldet ist.
      await flushPending(running.userId, saveRun).catch(() => {})
    }
    // Danach liegt keine Akte mehr auf dem Gerät — ein anderes Konto sieht nichts.
    writeSession(null)
    await handleLogout()
  }

  function discardThenLogout() {
    setRunningName(null)
    writeSession(null)
    void handleLogout()
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={requestLogout} disabled={isLoading}>
        {isLoading ? 'Wird abgemeldet...' : 'Abmelden'}
      </Button>

      <AlertDialog open={runningName !== null} onOpenChange={(open) => !open && setRunningName(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Es läuft noch eine Stunde</AlertDialogTitle>
            <AlertDialogDescription>
              „{runningName}“ ist nicht beendet. Mit dem Abmelden endet sie auf diesem Gerät.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:flex-col sm:space-x-0">
            <Button className="min-h-11" onClick={endThenLogout}>
              Beenden, festhalten und abmelden
            </Button>
            <Button
              variant="outline"
              className="min-h-11 text-destructive hover:text-destructive"
              onClick={discardThenLogout}
            >
              Verwerfen und abmelden
            </Button>
            <AlertDialogCancel className="min-h-11">Angemeldet bleiben</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
