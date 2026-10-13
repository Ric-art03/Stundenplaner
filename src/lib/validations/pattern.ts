import { z } from 'zod'
import { DIFFICULTY_LEVELS } from '@/lib/types/exercise'
import { PATTERN_NAME_MAX } from '@/lib/units/patterns'

export const patternNameSchema = z
  .string()
  .trim()
  .min(1, 'Bitte gib dem Stundenmuster einen Namen.')
  .max(PATTERN_NAME_MAX, `Höchstens ${PATTERN_NAME_MAX} Zeichen.`)

export const patternSegmentSchema = z
  .object({
    name: z.string().min(1).max(60),
    minutes: z.number().int().min(1),
    fillMode: z.enum(['generate', 'empty']),
    difficulties: z.array(z.enum(DIFFICULTY_LEVELS)).min(1),
    organizationForms: z.array(z.string().min(1).max(100)).max(30),
    notes: z.string().max(2000),
    // null = „wie die Gruppe".
    sports: z.array(z.string().min(1).max(100)).min(1).max(30).nullable(),
    primarySport: z.string().nullable(),
  })
  .refine(
    (segment) =>
      segment.primarySport === null ||
      (segment.sports !== null && segment.sports.includes(segment.primarySport)),
    { message: 'Die Hauptsportart muss eine der Sportarten des Segments sein' }
  )

export const savePatternSchema = z
  .object({
    /** Gesetzt = dieses Muster überschreiben. */
    id: z.string().uuid().optional(),
    name: patternNameSchema,
    totalMinutes: z.number().int().min(5).max(300),
    segments: z.array(patternSegmentSchema).min(1).max(50),
  })
  .refine(
    (pattern) =>
      pattern.segments.reduce((sum, segment) => sum + segment.minutes, 0) === pattern.totalMinutes,
    { message: 'Die Minuten der Phasen ergeben nicht die Gesamtdauer.' }
  )

export type SavePatternInput = z.input<typeof savePatternSchema>
