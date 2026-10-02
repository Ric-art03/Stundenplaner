import { z } from 'zod'

const materialSchema = z.object({
  name: z.string().min(1, 'Material auswählen'),
  quantity: z.number().int().min(1, 'Mindestens 1'),
  mode: z.enum(['pro Teilnehmer', 'insgesamt']),
})

const variantMaterialSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().int().min(1),
  mode: z.enum(['pro Teilnehmer', 'insgesamt']),
})

const variantSchema = z.object({
  title: z.string().min(1, 'Titel eingeben'),
  description: z.string().min(1, 'Beschreibung eingeben'),
  materials: z.array(variantMaterialSchema).optional(),
  participantsMin: z.number().int().min(1).nullable().optional(),
  participantsMax: z.number().int().min(1).nullable().optional(),
  duration: z.number().int().min(1).nullable().optional(),
  ageGroups: z.array(z.string()).optional(),
  organizationForms: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.participantsMin != null && data.participantsMax != null) {
      return data.participantsMin <= data.participantsMax
    }
    return true
  },
  { message: 'Minimum muss kleiner oder gleich Maximum sein', path: ['participantsMax'] }
)

const httpUrl = z.string().url('Ungültige URL').refine(
  (url) => /^https?:\/\//i.test(url),
  { message: 'Nur http:// und https:// Links erlaubt' },
)

const linkSchema = z.object({
  url: httpUrl,
  title: z.string().optional(),
})

export const stepBasisSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(100, 'Maximal 100 Zeichen'),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(5000, 'Maximal 5.000 Zeichen'),
  notes: z.string().max(2000, 'Maximal 2.000 Zeichen').optional().or(z.literal('')),
  workNotes: z.string().max(2000, 'Maximal 2.000 Zeichen').optional().or(z.literal('')),
})

export const stepEinordnungSchema = z.object({
  sports: z.array(z.string()).min(1, 'Mindestens eine Sportart auswählen'),
  ageGroups: z.array(z.string()).min(1, 'Mindestens eine Altersgruppe auswählen'),
  phases: z.array(z.string()).min(1, 'Mindestens eine Phase auswählen'),
  difficulty: z.enum(['Leicht', 'Mittel', 'Schwer']),
  organizationForms: z.array(z.string()),
})

const musicLinkSchema = z.union([
  httpUrl,
  z.literal(''),
  z.undefined(),
])

export const stepLogistikSchema = z.object({
  duration: z.number().int().min(1, 'Mindestens 1 Minute').max(300, 'Maximal 300 Minuten'),
  participantsMin: z.number().int().min(1).nullable(),
  participantsMax: z.number().int().min(1).nullable(),
  materials: z.array(materialSchema),
  musicRequired: z.boolean(),
  musicLink: musicLinkSchema,
}).refine(
  (data) => {
    if (data.participantsMin != null && data.participantsMax != null) {
      return data.participantsMin <= data.participantsMax
    }
    return true
  },
  { message: 'Minimum muss kleiner oder gleich Maximum sein', path: ['participantsMax'] }
)

export const stepExtrasSchema = z.object({
  variants: z.array(variantSchema),
  links: z.array(linkSchema),
})

export const exerciseSchema = z.object({
  ...stepBasisSchema.shape,
  ...stepEinordnungSchema.shape,
  duration: z.number().int().min(1).max(300),
  participantsMin: z.number().int().min(1).nullable(),
  participantsMax: z.number().int().min(1).nullable(),
  materials: z.array(materialSchema),
  musicRequired: z.boolean(),
  musicLink: musicLinkSchema,
  ...stepExtrasSchema.shape,
}).refine(
  (data) => {
    if (data.participantsMin != null && data.participantsMax != null) {
      return data.participantsMin <= data.participantsMax
    }
    return true
  },
  { message: 'Minimum muss kleiner oder gleich Maximum sein', path: ['participantsMax'] }
)

export type StepBasisData = z.infer<typeof stepBasisSchema>
export type StepEinordnungData = z.infer<typeof stepEinordnungSchema>
export type StepLogistikData = z.infer<typeof stepLogistikSchema>
export type StepExtrasData = z.infer<typeof stepExtrasSchema>
