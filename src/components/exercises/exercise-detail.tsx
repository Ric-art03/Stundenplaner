'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Clock, Users, Pencil, ArrowLeft, Music, ExternalLink,
  Package, Dumbbell,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'
import { DeleteConfirmDialog } from './delete-confirm-dialog'
import type { Exercise } from '@/lib/types/exercise'

interface ExerciseDetailProps {
  exercise: Exercise
  onDelete: (id: string) => Promise<{ success?: boolean; error?: string }>
}

export function ExerciseDetail({ exercise, onDelete }: ExerciseDetailProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [deleting, setDeleting] = React.useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      const result = await onDelete(exercise.id)
      if (result.error) {
        toast({ variant: 'destructive', title: 'Fehler', description: result.error })
        return
      }
      toast({ title: 'Übung gelöscht' })
      router.push('/exercises')
    } catch {
      toast({ variant: 'destructive', title: 'Fehler', description: 'Löschen fehlgeschlagen.' })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2 -ml-2">
            <Link href="/exercises">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Alle Übungen
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">{exercise.name}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {exercise.sports.map((sport) => (
              <Badge key={sport} variant="outline">{sport}</Badge>
            ))}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/exercises/${exercise.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Bearbeiten
            </Link>
          </Button>
          <DeleteConfirmDialog
            exerciseName={exercise.name}
            onConfirm={handleDelete}
            disabled={deleting}
          />
        </div>
      </div>

      <Separator />

      {/* Beschreibung */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Beschreibung</h2>
        <p className="whitespace-pre-wrap">{exercise.description}</p>
      </section>

      {/* Bilder */}
      {exercise.images.length > 0 && (
        <section>
          <div className={exercise.images.length === 1 ? '' : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}>
            {exercise.images.map((img) => (
              <ExerciseImage key={img.path} storagePath={img.path} alt={exercise.name} isCover={img.isCover} />
            ))}
          </div>
        </section>
      )}

      {/* Metadaten */}
      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <MetaItem icon={<Clock className="h-4 w-4" />} label="Dauer" value={`${exercise.duration} Minuten`} />
        {(exercise.participantsMin || exercise.participantsMax) && (
          <MetaItem
            icon={<Users className="h-4 w-4" />}
            label="Teilnehmer"
            value={
              exercise.participantsMin && exercise.participantsMax
                ? exercise.participantsMin === exercise.participantsMax
                  ? `${exercise.participantsMin}`
                  : `${exercise.participantsMin}–${exercise.participantsMax}`
                : exercise.participantsMin
                  ? `ab ${exercise.participantsMin}`
                  : `bis ${exercise.participantsMax}`
            }
          />
        )}
        <MetaItem icon={<Dumbbell className="h-4 w-4" />} label="Schwierigkeit" value={exercise.difficulty} />
      </section>

      {/* Phasen & Organisationsformen */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Phase</h2>
          <div className="flex flex-wrap gap-1">
            {exercise.phases.map((phase) => (
              <Badge key={phase} variant="secondary">{phase}</Badge>
            ))}
          </div>
        </div>
        {exercise.ageGroups.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Altersgruppe</h2>
            <div className="flex flex-wrap gap-1">
              {exercise.ageGroups.map((ag) => (
                <Badge key={ag} variant="secondary">{ag}</Badge>
              ))}
            </div>
          </div>
        )}
        {exercise.organizationForms.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">Organisationsform</h2>
            <div className="flex flex-wrap gap-1">
              {exercise.organizationForms.map((form) => (
                <Badge key={form} variant="secondary">{form}</Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Material */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-2">Material</h2>
        <div className="space-y-1">
          {exercise.materials.filter((mat) => mat.name !== 'Kein Material').length > 0 ? (
            exercise.materials
              .filter((mat) => mat.name !== 'Kein Material')
              .map((mat, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>
                    {mat.quantity}× {mat.name}
                    <span className="text-muted-foreground"> ({mat.mode})</span>
                  </span>
                </div>
              ))
          ) : (
            <p className="text-sm text-muted-foreground">Kein Material benötigt</p>
          )}
        </div>
      </section>

      {/* Musik */}
      {exercise.musicRequired && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Musik</h2>
          <div className="flex items-center gap-2">
            <Music className="h-4 w-4 text-muted-foreground" />
            {exercise.musicLink ? (
              <a
                href={exercise.musicLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline flex items-center gap-1"
              >
                Musik-Link öffnen
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <span className="text-sm">Musik benötigt (kein Link hinterlegt)</span>
            )}
          </div>
        </section>
      )}

      {/* Varianten */}
      {exercise.variants.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Varianten</h2>
          <Accordion type="multiple" className="w-full">
            {exercise.variants.map((variant, i) => (
              <AccordionItem key={i} value={`variant-${i}`}>
                <AccordionTrigger>{variant.title}</AccordionTrigger>
                <AccordionContent>
                  <p className="whitespace-pre-wrap mb-3">{variant.description}</p>
                  {(variant.duration || variant.participantsMin || variant.participantsMax) && (
                    <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                      {variant.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {variant.duration} Min
                        </span>
                      )}
                      {(variant.participantsMin || variant.participantsMax) && (
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {variant.participantsMin && variant.participantsMax
                            ? variant.participantsMin === variant.participantsMax
                              ? `${variant.participantsMin}`
                              : `${variant.participantsMin}–${variant.participantsMax}`
                            : variant.participantsMin
                              ? `ab ${variant.participantsMin}`
                              : `bis ${variant.participantsMax}`}
                        </span>
                      )}
                    </div>
                  )}
                  {variant.materials && variant.materials.filter((m) => m.name !== 'Kein Material').length > 0 && (
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">Abweichendes Material:</span>
                      {variant.materials.filter((m) => m.name !== 'Kein Material').map((mat, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          {mat.quantity}× {mat.name} ({mat.mode})
                        </div>
                      ))}
                    </div>
                  )}
                  {variant.ageGroups && variant.ageGroups.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Abweichende Altersgruppe:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variant.ageGroups.map((ag) => (
                          <Badge key={ag} variant="secondary" className="text-xs">{ag}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {variant.organizationForms && variant.organizationForms.length > 0 && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">Abweichende Organisationsform:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {variant.organizationForms.map((form) => (
                          <Badge key={form} variant="secondary" className="text-xs">{form}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      )}

      {/* Links */}
      {exercise.links.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Links</h2>
          <div className="space-y-1">
            {exercise.links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {link.title || link.url}
              </a>
            ))}
          </div>
        </section>
      )}

      {/* Arbeitsnotizen */}
      {exercise.workNotes && (
        <section className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <h2 className="text-sm font-medium text-primary mb-2">Arbeitsnotizen</h2>
          <p className="whitespace-pre-wrap text-sm">{exercise.workNotes}</p>
        </section>
      )}

      {/* Anmerkungen */}
      {exercise.notes && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Anmerkungen</h2>
          <p className="whitespace-pre-wrap text-sm">{exercise.notes}</p>
        </section>
      )}
    </div>
  )
}

function ExerciseImage({ storagePath, alt, isCover }: { storagePath: string; alt: string; isCover?: boolean }) {
  const [src, setSrc] = React.useState<string | null>(
    storagePath.startsWith('http') ? storagePath : null
  )

  React.useEffect(() => {
    if (storagePath.startsWith('http')) {
      setSrc(storagePath)
      return
    }
    const supabase = createClient()
    supabase.storage
      .from('exercise-images')
      .createSignedUrl(storagePath, 60 * 60)
      .then(({ data }) => {
        if (data?.signedUrl) setSrc(data.signedUrl)
      })
  }, [storagePath])

  if (!src) return null

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className={`rounded-lg object-contain ${isCover ? 'max-h-56' : 'max-h-44'}`}
      />
      {isCover && (
        <span className="absolute top-2 left-2 text-xs bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
          Titelbild
        </span>
      )}
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}

