import { z } from 'zod'

/**
 * Die Durchführung, wie das Gerät sie schickt. Geprüft wird auf dem Server —
 * die Stundenakte lag bis dahin im Speicher des Browsers und kann alles
 * enthalten.
 */

const NOTE_MAX = 2000
/** Ein Tag: mehr läuft keine Stunde, auch keine vergessene. */
const SECONDS_MAX = 24 * 60 * 60

const runStepSchema = z.object({
  kind: z.enum(['exercise', 'free', 'placeholder']),
  phase: z.string().max(200),
  name: z.string().min(1).max(200),
  variantTitle: z.string().max(200).nullable(),
  plannedMinutes: z.number().int().min(0).max(1440),
  actualSeconds: z.number().int().min(0).max(SECONDS_MAX),
  status: z.enum(['done', 'skipped']),
  exerciseId: z.string().uuid().nullable(),
  variantId: z.string().uuid().nullable(),
})

export const runRecordSchema = z
  .object({
    id: z.string().uuid(),
    unitId: z.string().uuid(),
    startedAt: z.string().datetime({ offset: true }),
    endedAt: z.string().datetime({ offset: true }),
    plannedMinutes: z.number().int().min(0).max(1440),
    actualSeconds: z.number().int().min(0).max(SECONDS_MAX),
    pausedSeconds: z.number().int().min(0).max(SECONDS_MAX),
    note: z.string().max(NOTE_MAX),
    steps: z.array(runStepSchema).min(1).max(300),
  })
  .refine((run) => Date.parse(run.endedAt) >= Date.parse(run.startedAt), {
    message: 'Das Ende liegt vor dem Beginn.',
    path: ['endedAt'],
  })

export const runNoteSchema = z.string().max(NOTE_MAX, 'Maximal 2.000 Zeichen')

export const followUpTargetSchema = z.object({
  runId: z.string().uuid(),
  position: z.number().int().min(0).max(299),
})

/**
 * Die Notizen der Übung aus der Nachbereitung. Jeder Text ist der ganze neue
 * Inhalt seines Felds; ein leerer Text leert es. Mindestens eines muss dabei
 * sein.
 */
export const exerciseNotesSchema = z
  .object({
    work: z.string().trim().max(NOTE_MAX, 'Die Arbeitsnotiz hat mehr als 2.000 Zeichen.').optional(),
    personal: z
      .string()
      .trim()
      .max(NOTE_MAX, 'Die Anmerkungen haben mehr als 2.000 Zeichen.')
      .optional(),
    updatedAt: z.string().min(1),
  })
  .refine((notes) => notes.work !== undefined || notes.personal !== undefined, {
    message: 'Es wurde nichts geändert.',
  })

export const adoptDurationSchema = z.object({
  minutes: z.number().int().min(1, 'Mindestens 1 Minute').max(300, 'Maximal 300 Minuten'),
  updatedAt: z.string().min(1),
})
