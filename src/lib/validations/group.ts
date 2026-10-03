import { z } from 'zod'

export const venueMaterialSchema = z.object({
  name: z.string().min(1, 'Material auswählen'),
  quantity: z.number().int().min(1, 'Mindestens 1'),
})

export const venueSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
  notes: z.string().max(2000, 'Maximal 2.000 Zeichen').optional().or(z.literal('')),
  materials: z.array(venueMaterialSchema),
})

export const scheduleSchema = z.object({
  scheduleType: z.enum(['recurring', 'one_time']),
  weekday: z.string(),
  date: z.string().nullable(),
  startTime: z.string().min(1, 'Startzeit eingeben'),
  endTime: z.string().min(1, 'Endzeit eingeben'),
}).refine(
  (data) => {
    if (data.scheduleType === 'recurring') return data.weekday.length > 0
    return true
  },
  { message: 'Wochentag auswählen', path: ['weekday'] }
).refine(
  (data) => {
    if (data.scheduleType === 'one_time') return !!data.date
    return true
  },
  { message: 'Datum auswählen', path: ['date'] }
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime
    }
    return true
  },
  { message: 'Endzeit muss nach Startzeit liegen', path: ['endTime'] }
)

export const groupSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
  sports: z.array(z.string()).min(1, 'Mindestens eine Sportart auswählen'),
  ageGroups: z.array(z.string()).min(1, 'Mindestens eine Altersgruppe auswählen'),
  participants: z.number().int().min(1, 'Mindestens 1 Teilnehmer').nullable(),
  unitDuration: z.number().int().min(5, 'Mindestens 5 Minuten').max(300, 'Maximal 300 Minuten'),
  venueId: z.string().nullable(),
  schedules: z.array(scheduleSchema),
})

export type VenueFormSchema = z.infer<typeof venueSchema>
export type GroupFormSchema = z.infer<typeof groupSchema>
