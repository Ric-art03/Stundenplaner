'use client'

import * as React from 'react'
import {
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Clock,
  MapPin,
  MonitorCheck,
  MonitorOff,
  Music,
  Package,
  Play,
  Users,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { UpcomingStep } from './upcoming-step'
import { hasPlaceholder, materialNeeds, musicNeeds } from '@/lib/live/material'
import type { LivePlan } from '@/lib/live/types'
import type { WakeLockStatus } from '@/hooks/use-wake-lock'
import type { OfflineStatus } from '@/hooks/use-live-offline'

interface ReadyScreenProps {
  plan: LivePlan
  wakeLock: WakeLockStatus
  onRetryWakeLock: () => void
  /** `false` = privates Fenster o. Ä.: die Stunde übersteht kein Neuladen. */
  storageWorks: boolean
  offline: OfflineStatus
  onStart: () => void
  onLeave: () => void
}

type Device = 'iphone' | 'android' | 'other'

function detectDevice(): Device {
  const agent = navigator.userAgent
  if (/iPhone|iPad|iPod/i.test(agent)) return 'iphone'
  if (/Android/i.test(agent)) return 'android'
  return 'other'
}

/**
 * Die Anleitung nennt den **Bereich** der Einstellungen, nicht jeden
 * Menüpunkt: die Wege heißen je Hersteller und Version anders, und nichts
 * Falsches zu nennen ist wichtiger als Vollständigkeit.
 */
const GUIDE: Record<Exclude<Device, 'other'>, { saver: string; lock: string }> = {
  iphone: {
    saver: 'Öffne Einstellungen → Batterie und schalte den Stromsparmodus aus.',
    lock: 'Öffne Einstellungen → Anzeige & Helligkeit → Automatische Sperre und wähle eine längere Zeit.',
  },
  android: {
    saver: 'Öffne Einstellungen → Akku und schalte den Energiesparmodus aus.',
    lock: 'Öffne Einstellungen → Display und stelle dort die Zeit hoch, nach der sich der Bildschirm ausschaltet.',
  },
}

function WakeLockGuide({ onRetry }: { onRetry: () => void }) {
  const [device, setDevice] = React.useState<Device>('other')
  React.useEffect(() => setDevice(detectDevice()), [])

  const guides = device === 'other' ? (['iphone', 'android'] as const) : ([device] as const)

  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
      <MonitorOff className="h-4 w-4" />
      <AlertTitle>Dein Gerät lässt das gerade nicht zu</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>
          Der Bildschirm kann während der Stunde ausgehen. Die Stunde läuft trotzdem richtig
          weiter — so bleibt er an:
        </p>
        {guides.map((key) => (
          <div key={key}>
            {guides.length > 1 && (
              <p className="font-medium">{key === 'iphone' ? 'iPhone' : 'Android'}</p>
            )}
            <ol className="list-decimal space-y-1 pl-5">
              <li>{GUIDE[key].saver} Tippe danach auf „Erneut prüfen“.</li>
              <li>
                Hilft das nicht: {GUIDE[key].lock} Stelle sie nach der Stunde wieder zurück.
              </li>
            </ol>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={onRetry} className="min-h-11 bg-background">
          Erneut prüfen
        </Button>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Das Bereitschaftsbild: alles, was vor der Stunde bereitliegen muss. Die Uhr
 * läuft noch nicht — wer während des Aufbaus startet, läge von Beginn an
 * hinter Plan.
 */
export function ReadyScreen({
  plan,
  wakeLock,
  onRetryWakeLock,
  storageWorks,
  offline,
  onStart,
  onLeave,
}: ReadyScreenProps) {
  const needs = materialNeeds(plan)
  const music = musicNeeds(plan)

  return (
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
      <div>
        <Button variant="ghost" size="sm" onClick={onLeave} className="-ml-2 min-h-11">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück zur Einheit
        </Button>
      </div>

      <main className="flex-1 space-y-6 py-4">
        <header>
          <p className="text-sm font-medium text-primary">Gleich geht&apos;s los</p>
          <h1 className="text-2xl font-bold leading-tight">{plan.unitName}</h1>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <li className="flex items-center gap-1.5">
              <Users className="h-4 w-4" aria-hidden />
              {plan.groupName}
              {plan.participants ? ` · ${plan.participants} TN` : ''}
            </li>
            <li className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {plan.venueName ?? 'keine Halle hinterlegt'}
            </li>
            <li className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" aria-hidden />
              {plan.totalMinutes} Min
            </li>
          </ul>
        </header>

        <section aria-labelledby="bereit-material">
          <h2 id="bereit-material" className="mb-2 flex items-center gap-2 text-base font-semibold">
            <Package className="h-4 w-4" aria-hidden />
            Material bereitlegen
          </h2>
          {needs.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-3 text-sm text-muted-foreground">
              Für diese Einheit ist kein Material nötig.
            </p>
          ) : (
            <>
              <ul className="divide-y rounded-md border">
                {needs.map((material) => (
                  <li
                    key={`${material.name}-${material.perParticipant}`}
                    className="flex items-center justify-between gap-3 px-3 py-2.5"
                  >
                    <span className="min-w-0 break-words">{material.name}</span>
                    <span className="shrink-0 text-lg font-semibold tabular-nums">
                      {material.quantity}
                      {material.perParticipant && (
                        <span className="text-sm font-normal text-muted-foreground"> je TN</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs text-muted-foreground">
                Je Material die Menge, die gleichzeitig gebraucht wird — nicht die Summe über alle
                Übungen.
              </p>
            </>
          )}
        </section>

        {music.length > 0 && (
          <Alert>
            <Music className="h-4 w-4" />
            <AlertTitle>Musik wird gebraucht</AlertTitle>
            <AlertDescription>
              <ul className="mt-1 space-y-1">
                {music.map((need) => (
                  <li key={need.key} className="flex flex-wrap items-center gap-x-3">
                    <span className="min-w-0 break-words">{need.title}</span>
                    {/* Ein kurzer Verweis statt der ganzen Adresse. In einem
                        neuen Tab, damit das Bereitschaftsbild stehen bleibt. */}
                    {need.link && (
                      <a
                        href={need.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-9 items-center gap-1 font-medium text-primary underline underline-offset-2"
                      >
                        Musik öffnen
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only"> für {need.title} (neuer Tab)</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {hasPlaceholder(plan) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Ein Platz ist nicht besetzt</AlertTitle>
            <AlertDescription>
              In dieser Einheit steht ein Platzhalter „Übung gelöscht“. Du kannst trotzdem starten —
              oder den Platz vorher über „Bearbeiten“ an der Einheit nachbesetzen.
            </AlertDescription>
          </Alert>
        )}

        <section aria-live="polite" className="space-y-3">
          {wakeLock === 'checking' && (
            <p className="text-sm text-muted-foreground">Prüfe, ob der Bildschirm an bleibt …</p>
          )}
          {wakeLock === 'held' && (
            <p className="flex items-center gap-2 text-sm font-medium text-primary">
              <MonitorCheck className="h-4 w-4 shrink-0" aria-hidden />
              Bildschirm bleibt während der Stunde an
            </p>
          )}
          {(wakeLock === 'denied' || wakeLock === 'unsupported') && (
            <WakeLockGuide onRetry={onRetryWakeLock} />
          )}

          {!storageWorks && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Die Stunde übersteht kein Neuladen</AlertTitle>
              <AlertDescription>
                Dieses Fenster darf nichts auf dem Gerät ablegen (privates Fenster?). Die Stunde
                läuft, geht aber verloren, wenn die Seite neu lädt oder geschlossen wird.
              </AlertDescription>
            </Alert>
          )}
          {storageWorks && offline === 'unavailable' && (
            <p className="text-sm text-muted-foreground">
              Ohne Netz lässt sich dieser Bildschirm auf deinem Gerät nicht neu laden. Der Stand der
              Stunde bleibt trotzdem erhalten.
            </p>
          )}
        </section>

        {/* Die erste Übung, nach demselben Muster wie später „Danach“ — über
            die ganze Breite, deshalb aus dem Seitenrand herausgezogen. */}
        <UpcomingStep
          label="Zuerst"
          current={null}
          next={plan.steps[0] ?? null}
          className="-mx-4"
        />
      </main>

      <Button size="lg" onClick={onStart} className="h-16 w-full text-lg">
        <Play className="mr-2 h-5 w-5" />
        Los geht&apos;s
      </Button>
    </div>
  )
}
