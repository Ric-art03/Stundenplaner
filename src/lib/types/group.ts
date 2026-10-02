import { SPORTS, AGE_GROUPS, MATERIALS } from './exercise'

export { SPORTS, AGE_GROUPS, MATERIALS }

export const WEEKDAYS = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
] as const

export const WEEKDAY_SHORT: Record<string, string> = {
  'Montag': 'Mo',
  'Dienstag': 'Di',
  'Mittwoch': 'Mi',
  'Donnerstag': 'Do',
  'Freitag': 'Fr',
  'Samstag': 'Sa',
  'Sonntag': 'So',
}

export interface VenueMaterial {
  id?: string
  name: string
  quantity: number
}

export interface Venue {
  id: string
  userId: string
  name: string
  notes: string | null
  materials: VenueMaterial[]
  groupCount?: number
  createdAt: string
  updatedAt: string
}

export interface VenueFormData {
  name: string
  notes: string
  materials: VenueMaterial[]
}

export const EMPTY_VENUE_FORM: VenueFormData = {
  name: '',
  notes: '',
  materials: [],
}

export type ScheduleType = 'recurring' | 'one_time'

export interface GroupSchedule {
  id?: string
  scheduleType: ScheduleType
  weekday: string
  date: string | null
  startTime: string
  endTime: string
}

export interface Group {
  id: string
  userId: string
  name: string
  sports: string[]
  ageGroups: string[]
  participantsMin: number | null
  participantsMax: number | null
  unitDuration: number
  venueId: string | null
  venue: Venue | null
  schedules: GroupSchedule[]
  createdAt: string
  updatedAt: string
}

export interface GroupFormData {
  name: string
  sports: string[]
  ageGroups: string[]
  participantsMin: number | null
  participantsMax: number | null
  unitDuration: number
  venueId: string | null
  schedules: GroupSchedule[]
}

export const EMPTY_GROUP_FORM: GroupFormData = {
  name: '',
  sports: [],
  ageGroups: [],
  participantsMin: null,
  participantsMax: null,
  unitDuration: 60,
  venueId: null,
  schedules: [],
}
