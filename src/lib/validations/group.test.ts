import { describe, it, expect } from 'vitest'
import { venueSchema, groupSchema, scheduleSchema } from './group'

describe('venueSchema', () => {
  const validVenue = {
    name: 'Turnhalle Grundschule Mitte',
    notes: '',
    materials: [],
  }

  it('passes with valid data', () => {
    const result = venueSchema.safeParse(validVenue)
    expect(result.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const result = venueSchema.safeParse({ ...validVenue, name: '' })
    expect(result.success).toBe(false)
  })

  it('fails when name exceeds 100 characters', () => {
    const result = venueSchema.safeParse({ ...validVenue, name: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('passes with notes up to 2000 characters', () => {
    const result = venueSchema.safeParse({ ...validVenue, notes: 'A'.repeat(2000) })
    expect(result.success).toBe(true)
  })

  it('fails when notes exceed 2000 characters', () => {
    const result = venueSchema.safeParse({ ...validVenue, notes: 'A'.repeat(2001) })
    expect(result.success).toBe(false)
  })

  it('passes with valid materials', () => {
    const result = venueSchema.safeParse({
      ...validVenue,
      materials: [{ name: 'Ball', quantity: 5 }],
    })
    expect(result.success).toBe(true)
  })

  it('fails when material name is empty', () => {
    const result = venueSchema.safeParse({
      ...validVenue,
      materials: [{ name: '', quantity: 1 }],
    })
    expect(result.success).toBe(false)
  })

  it('fails when material quantity is 0', () => {
    const result = venueSchema.safeParse({
      ...validVenue,
      materials: [{ name: 'Ball', quantity: 0 }],
    })
    expect(result.success).toBe(false)
  })

  it('passes with empty notes string', () => {
    const result = venueSchema.safeParse({ ...validVenue, notes: '' })
    expect(result.success).toBe(true)
  })

  it('passes without notes field', () => {
    const result = venueSchema.safeParse({ name: 'Halle', materials: [] })
    expect(result.success).toBe(true)
  })
})

describe('scheduleSchema', () => {
  const validRecurring = {
    scheduleType: 'recurring' as const,
    weekday: 'Montag',
    date: null,
    startTime: '16:00',
    endTime: '17:30',
  }

  const validOneTime = {
    scheduleType: 'one_time' as const,
    weekday: '',
    date: '2026-12-15',
    startTime: '10:00',
    endTime: '11:00',
  }

  it('passes with valid recurring schedule', () => {
    const result = scheduleSchema.safeParse(validRecurring)
    expect(result.success).toBe(true)
  })

  it('passes with valid one-time schedule', () => {
    const result = scheduleSchema.safeParse(validOneTime)
    expect(result.success).toBe(true)
  })

  it('fails when recurring schedule has empty weekday', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, weekday: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('weekday')
    }
  })

  it('fails when one-time schedule has no date', () => {
    const result = scheduleSchema.safeParse({ ...validOneTime, date: null })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('date')
    }
  })

  it('fails when startTime is after endTime', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, startTime: '18:00', endTime: '16:00' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('endTime')
    }
  })

  it('fails when startTime equals endTime', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, startTime: '16:00', endTime: '16:00' })
    expect(result.success).toBe(false)
  })

  it('fails when startTime is empty', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, startTime: '' })
    expect(result.success).toBe(false)
  })

  it('fails when endTime is empty', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, endTime: '' })
    expect(result.success).toBe(false)
  })

  it('allows one-time schedule without weekday', () => {
    const result = scheduleSchema.safeParse({ ...validOneTime, weekday: '' })
    expect(result.success).toBe(true)
  })

  it('allows recurring schedule without date', () => {
    const result = scheduleSchema.safeParse({ ...validRecurring, date: null })
    expect(result.success).toBe(true)
  })
})

describe('groupSchema', () => {
  const validGroup = {
    name: 'Kinderturnen',
    sports: ['Turnen'],
    primarySport: null,
    ageGroups: ['Kinder (4–6)'],
    participants: 18,
    unitDuration: 60,
    venueId: null,
    schedules: [],
  }

  it('passes with valid data', () => {
    const result = groupSchema.safeParse(validGroup)
    expect(result.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const result = groupSchema.safeParse({ ...validGroup, name: '' })
    expect(result.success).toBe(false)
  })

  it('fails when name exceeds 100 characters', () => {
    const result = groupSchema.safeParse({ ...validGroup, name: 'A'.repeat(101) })
    expect(result.success).toBe(false)
  })

  it('fails when sports is empty', () => {
    const result = groupSchema.safeParse({ ...validGroup, sports: [] })
    expect(result.success).toBe(false)
  })

  it('fails when ageGroups is empty', () => {
    const result = groupSchema.safeParse({ ...validGroup, ageGroups: [] })
    expect(result.success).toBe(false)
  })

  it('fails when unitDuration is less than 5', () => {
    const result = groupSchema.safeParse({ ...validGroup, unitDuration: 4 })
    expect(result.success).toBe(false)
  })

  it('fails when unitDuration exceeds 300', () => {
    const result = groupSchema.safeParse({ ...validGroup, unitDuration: 301 })
    expect(result.success).toBe(false)
  })

  it('passes when unitDuration is exactly 5', () => {
    const result = groupSchema.safeParse({ ...validGroup, unitDuration: 5 })
    expect(result.success).toBe(true)
  })

  it('passes when unitDuration is exactly 300', () => {
    const result = groupSchema.safeParse({ ...validGroup, unitDuration: 300 })
    expect(result.success).toBe(true)
  })

  it('fails when participants is zero', () => {
    const result = groupSchema.safeParse({ ...validGroup, participants: 0 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('participants')
    }
  })

  it('fails when participants is negative', () => {
    const result = groupSchema.safeParse({ ...validGroup, participants: -5 })
    expect(result.success).toBe(false)
  })

  it('fails when participants is not an integer', () => {
    const result = groupSchema.safeParse({ ...validGroup, participants: 12.5 })
    expect(result.success).toBe(false)
  })

  it('passes when participants is exactly 1', () => {
    const result = groupSchema.safeParse({ ...validGroup, participants: 1 })
    expect(result.success).toBe(true)
  })

  it('passes when participants is null', () => {
    const result = groupSchema.safeParse({ ...validGroup, participants: null })
    expect(result.success).toBe(true)
  })

  it('passes when primarySport is one of the selected sports', () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      sports: ['Turnen', 'Tanzen'],
      primarySport: 'Tanzen',
    })
    expect(result.success).toBe(true)
  })

  it('fails when primarySport is not among the selected sports', () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      sports: ['Turnen', 'Tanzen'],
      primarySport: 'Volleyball',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('primarySport')
    }
  })

  it('passes when primarySport is null', () => {
    const result = groupSchema.safeParse({ ...validGroup, primarySport: null })
    expect(result.success).toBe(true)
  })

  it('passes without venue', () => {
    const result = groupSchema.safeParse({ ...validGroup, venueId: null })
    expect(result.success).toBe(true)
  })

  it('passes with empty schedules', () => {
    const result = groupSchema.safeParse({ ...validGroup, schedules: [] })
    expect(result.success).toBe(true)
  })

  it('passes with valid schedule included', () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      schedules: [{
        scheduleType: 'recurring',
        weekday: 'Dienstag',
        date: null,
        startTime: '16:00',
        endTime: '17:30',
      }],
    })
    expect(result.success).toBe(true)
  })

  it('fails with invalid schedule inside group', () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      schedules: [{
        scheduleType: 'recurring',
        weekday: '',
        date: null,
        startTime: '16:00',
        endTime: '17:30',
      }],
    })
    expect(result.success).toBe(false)
  })

  it('passes with multiple sports and age groups', () => {
    const result = groupSchema.safeParse({
      ...validGroup,
      sports: ['Turnen', 'Volleyball', 'Akrobatik'],
      ageGroups: ['Kinder (4–6)', 'Kinder (7–10)'],
    })
    expect(result.success).toBe(true)
  })

  it('fails when required fields are missing', () => {
    const result = groupSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
