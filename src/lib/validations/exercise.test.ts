import { describe, it, expect } from 'vitest'
import {
  stepBasisSchema,
  stepEinordnungSchema,
  stepLogistikSchema,
  stepExtrasSchema,
  exerciseSchema,
  quickCreateSchema,
} from './exercise'

describe('stepBasisSchema', () => {
  it('passes with valid name and description', () => {
    const result = stepBasisSchema.safeParse({
      name: 'Feuer-Wasser-Blitz',
      description: 'Eine lustige Übung',
    })
    expect(result.success).toBe(true)
  })

  it('fails when name is empty', () => {
    const result = stepBasisSchema.safeParse({
      name: '',
      description: 'Beschreibung',
    })
    expect(result.success).toBe(false)
  })

  it('fails when description is empty', () => {
    const result = stepBasisSchema.safeParse({
      name: 'Name',
      description: '',
    })
    expect(result.success).toBe(false)
  })

  it('fails when name exceeds 100 characters', () => {
    const result = stepBasisSchema.safeParse({
      name: 'A'.repeat(101),
      description: 'Beschreibung',
    })
    expect(result.success).toBe(false)
  })

  it('fails when description exceeds 5000 characters', () => {
    const result = stepBasisSchema.safeParse({
      name: 'Name',
      description: 'A'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional notes and workNotes', () => {
    const result = stepBasisSchema.safeParse({
      name: 'Name',
      description: 'Beschreibung',
      notes: 'Persönliche Tipps',
      workNotes: 'Aufbauhinweise',
    })
    expect(result.success).toBe(true)
  })

  it('accepts empty string for notes', () => {
    const result = stepBasisSchema.safeParse({
      name: 'Name',
      description: 'Beschreibung',
      notes: '',
      workNotes: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('stepEinordnungSchema', () => {
  const validData = {
    sports: ['Volleyball'],
    ageGroups: ['Erwachsene (18–45)'],
    phases: ['Aufwärmen'],
    difficulty: 'Mittel' as const,
    organizationForms: [],
  }

  it('passes with valid data', () => {
    const result = stepEinordnungSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails when sports is empty', () => {
    const result = stepEinordnungSchema.safeParse({ ...validData, sports: [] })
    expect(result.success).toBe(false)
  })

  it('fails when ageGroups is empty', () => {
    const result = stepEinordnungSchema.safeParse({ ...validData, ageGroups: [] })
    expect(result.success).toBe(false)
  })

  it('fails when phases is empty', () => {
    const result = stepEinordnungSchema.safeParse({ ...validData, phases: [] })
    expect(result.success).toBe(false)
  })

  it('fails with invalid difficulty', () => {
    const result = stepEinordnungSchema.safeParse({ ...validData, difficulty: 'Extrem' })
    expect(result.success).toBe(false)
  })

  it('accepts empty organizationForms', () => {
    const result = stepEinordnungSchema.safeParse({ ...validData, organizationForms: [] })
    expect(result.success).toBe(true)
  })

  it('accepts multiple sports, ageGroups, phases', () => {
    const result = stepEinordnungSchema.safeParse({
      ...validData,
      sports: ['Volleyball', 'Fußball'],
      ageGroups: ['Kinder (7–10)', 'Jugend (11–14)'],
      phases: ['Aufwärmen', 'Hauptteil'],
    })
    expect(result.success).toBe(true)
  })
})

describe('stepLogistikSchema', () => {
  const validData = {
    duration: 15,
    participantsMin: null,
    participantsMax: null,
    materials: [],
    musicRequired: false,
    musicLink: '',
  }

  it('passes with valid data', () => {
    const result = stepLogistikSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('fails when duration is 0', () => {
    const result = stepLogistikSchema.safeParse({ ...validData, duration: 0 })
    expect(result.success).toBe(false)
  })

  it('fails when duration exceeds 300', () => {
    const result = stepLogistikSchema.safeParse({ ...validData, duration: 301 })
    expect(result.success).toBe(false)
  })

  it('fails when participantsMin > participantsMax', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      participantsMin: 10,
      participantsMax: 5,
    })
    expect(result.success).toBe(false)
  })

  it('passes when participantsMin equals participantsMax', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      participantsMin: 4,
      participantsMax: 4,
    })
    expect(result.success).toBe(true)
  })

  it('passes when only participantsMin is set', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      participantsMin: 4,
      participantsMax: null,
    })
    expect(result.success).toBe(true)
  })

  it('passes with valid material entry', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      materials: [{ name: 'Ball', quantity: 3, mode: 'insgesamt' }],
    })
    expect(result.success).toBe(true)
  })

  it('fails when material name is empty', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      materials: [{ name: '', quantity: 1, mode: 'insgesamt' }],
    })
    expect(result.success).toBe(false)
  })

  it('fails when material quantity is 0', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      materials: [{ name: 'Ball', quantity: 0, mode: 'insgesamt' }],
    })
    expect(result.success).toBe(false)
  })

  it('fails with invalid music link URL', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      musicRequired: true,
      musicLink: 'not-a-url',
    })
    expect(result.success).toBe(false)
  })

  it('passes with empty music link when music required', () => {
    const result = stepLogistikSchema.safeParse({
      ...validData,
      musicRequired: true,
      musicLink: '',
    })
    expect(result.success).toBe(true)
  })
})

describe('stepExtrasSchema', () => {
  it('passes with empty variants and links', () => {
    const result = stepExtrasSchema.safeParse({ variants: [], links: [] })
    expect(result.success).toBe(true)
  })

  it('passes with valid variant', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [{ title: 'Variante A', description: 'Einfachere Version' }],
      links: [],
    })
    expect(result.success).toBe(true)
  })

  it('fails when variant title is empty', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [{ title: '', description: 'Beschreibung' }],
      links: [],
    })
    expect(result.success).toBe(false)
  })

  it('fails when variant description is empty', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [{ title: 'Titel', description: '' }],
      links: [],
    })
    expect(result.success).toBe(false)
  })

  it('passes with valid link', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'https://youtube.com/watch?v=123' }],
    })
    expect(result.success).toBe(true)
  })

  it('fails with invalid link URL', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'not-a-url' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects javascript: URLs in links', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'javascript:alert(1)' }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects data: URLs in links', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'data:text/html,<h1>XSS</h1>' }],
    })
    expect(result.success).toBe(false)
  })

  it('accepts https:// links', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'https://example.com' }],
    })
    expect(result.success).toBe(true)
  })

  it('accepts http:// links', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [],
      links: [{ url: 'http://example.com' }],
    })
    expect(result.success).toBe(true)
  })

  it('passes with variant including optional conditions', () => {
    const result = stepExtrasSchema.safeParse({
      variants: [{
        title: 'Variante B',
        description: 'Mit weniger Spielern',
        duration: 10,
        participantsMin: 4,
        participantsMax: 8,
        materials: [{ name: 'Ball', quantity: 1, mode: 'insgesamt' }],
        ageGroups: ['Kinder (7–10)'],
        organizationForms: ['Kleingruppen'],
      }],
      links: [],
    })
    expect(result.success).toBe(true)
  })
})

describe('exerciseSchema (full validation)', () => {
  const validExercise = {
    name: 'Feuer-Wasser-Blitz',
    description: 'Kinder laufen durch die Halle. Auf Zuruf: Feuer = auf die Bank, Wasser = auf eine Matte, Blitz = hinlegen.',
    notes: '',
    workNotes: '',
    sports: ['Kinderturnen'],
    ageGroups: ['Kinder (4–6)'],
    phases: ['Aufwärmen'],
    difficulty: 'Leicht' as const,
    organizationForms: ['Freie Verteilung (ganze Halle)'],
    duration: 10,
    participantsMin: 6,
    participantsMax: 30,
    musicRequired: false,
    musicLink: '',
    materials: [],
    variants: [],
    links: [],
  }

  it('passes with complete valid exercise data', () => {
    const result = exerciseSchema.safeParse(validExercise)
    expect(result.success).toBe(true)
  })

  it('fails when participantsMin > participantsMax', () => {
    const result = exerciseSchema.safeParse({
      ...validExercise,
      participantsMin: 20,
      participantsMax: 10,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'))
      expect(paths).toContain('participantsMax')
    }
  })

  it('fails when required fields are missing', () => {
    const result = exerciseSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('quickCreateSchema — „Schnell anlegen" aus dem Editor (PROJ-7)', () => {
  const valid = { name: 'Kettenfangen', duration: 10, description: 'Fänger bilden eine Kette.', workNotes: '' }

  it('nimmt Name, Dauer und Beschreibung an — Arbeitsnotizen dürfen leer sein', () => {
    expect(quickCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('übernimmt Arbeitsnotizen, wenn sie ausgefüllt sind', () => {
    const result = quickCreateSchema.safeParse({ ...valid, workNotes: ' Hütchen vorher stellen ' })
    expect(result.success && result.data.workNotes).toBe('Hütchen vorher stellen')
  })

  it('weist einen leeren oder nur aus Leerzeichen bestehenden Namen ab', () => {
    expect(quickCreateSchema.safeParse({ ...valid, name: '' }).success).toBe(false)
    expect(quickCreateSchema.safeParse({ ...valid, name: '   ' }).success).toBe(false)
  })

  it('verlangt eine Beschreibung und sagt das verständlich', () => {
    const result = quickCreateSchema.safeParse({ ...valid, description: '  ' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('beschreibe')
    }
  })

  it('hält die Grenzen der Übungstabelle ein', () => {
    expect(quickCreateSchema.safeParse({ ...valid, name: 'a'.repeat(101) }).success).toBe(false)
    expect(quickCreateSchema.safeParse({ ...valid, duration: 0 }).success).toBe(false)
    expect(quickCreateSchema.safeParse({ ...valid, duration: 301 }).success).toBe(false)
    expect(quickCreateSchema.safeParse({ ...valid, workNotes: 'a'.repeat(2001) }).success).toBe(false)
  })

  it('nimmt keine Einordnung aus dem Formular an — die setzt der Server', () => {
    const result = quickCreateSchema.safeParse({ ...valid, sports: ['Fußball'], phases: ['Hauptteil'] })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).not.toHaveProperty('sports')
      expect(result.data).not.toHaveProperty('phases')
    }
  })
})
