import { z } from 'zod'
import { DIFFICULTY_LEVELS } from '@/lib/types/exercise'

export const segmentConfigSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1, 'Phase auswählen').max(60, 'Maximal 60 Zeichen'),
    minutes: z.number().int().min(1, 'Mindestens 1 Minute'),
    fillMode: z.enum(['generate', 'empty']),
    sports: z.array(z.string()).min(1, 'Mindestens eine Sportart auswählen'),
    primarySport: z.string().nullable(),
    difficulties: z
      .array(z.enum(DIFFICULTY_LEVELS))
      .min(1, 'Mindestens einen Schwierigkeitsgrad auswählen'),
    notes: z.string().max(2000, 'Maximal 2.000 Zeichen'),
  })
  .refine(
    (data) => data.primarySport === null || data.sports.includes(data.primarySport),
    {
      message: 'Die Hauptsportart muss eine der gewählten Sportarten sein',
      path: ['primarySport'],
    }
  )

export const editorStateSchema = z.object({
  mode: z.enum(['standard', 'custom']),
  expandedPosition: z.number().int().min(0).nullable(),
})

export const unitConfigSchema = z
  .object({
    groupId: z.string().min(1, 'Gruppe auswählen'),
    totalMinutes: z
      .number()
      .int()
      .min(5, 'Mindestens 5 Minuten')
      .max(300, 'Maximal 300 Minuten'),
    segments: z.array(segmentConfigSchema).min(1, 'Mindestens ein Segment'),
    editorState: editorStateSchema,
  })
  .refine(
    (data) => data.segments.reduce((sum, s) => sum + s.minutes, 0) === data.totalMinutes,
    {
      message: 'Die Summe der Segmente muss der Einheitsdauer entsprechen',
      path: ['segments'],
    }
  )
// Bewusst keine Prüfung, dass mindestens ein Segment gefüllt werden muss:
// Laut Spec darf der Nutzer alle Segmente frei lassen und so ein leeres
// Gerüst erzeugen, das er später selbst füllt.

export type SegmentConfigSchema = z.infer<typeof segmentConfigSchema>
export type UnitConfigSchema = z.infer<typeof unitConfigSchema>
