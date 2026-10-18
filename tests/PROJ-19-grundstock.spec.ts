import { test, expect, type Locator, type Page } from '@playwright/test'
import { adminClient, FIXTURE_GROUP_NAME, testUserId, TEST_EMAIL } from './fixtures'

/**
 * E2E-Tests für PROJ-19 (Grundstock der Kategorien) gegen die
 * Akzeptanzkriterien der Spec.
 *
 * Eigene Stufe in playwright.config.ts („grundstock", danach „grundstock
 * mobil"), nach der Verwaltung: Die Tests legen eigene Begriffe an, die in
 * jeder Auswahlliste oben stünden, und einer lässt eigene Begriffe im
 * Grundstock aufgehen — das darf neben keinem anderen Feature laufen.
 *
 * Die Listen des Grundstocks stehen hier abgeschrieben aus Abschnitt A der
 * Spec, nicht aus dem Programm importiert: geprüft wird gegen die Spec.
 */

test.describe.configure({ mode: 'serial' })

const MARKER = 'E2E-Testdaten (PROJ-19)'
const TAG = 'E2E19'

const SPORTS = [
  'Krabbelgruppe', 'Eltern-Kind-Turnen', 'Kinderturnen', 'Kinderspiele', 'Seniorensport',
  'Gymnastik', 'Fitness/Workout', 'Rehabilitation/Prävention', 'Therapie', 'Schwimmen',
  'Turnen', 'Tanzen', 'Kampfsport', 'Leichtathletik', 'Basketball', 'Fußball', 'Handball',
  'Volleyball', 'Abenteuer und Erlebnis', 'Teambuilding',
]
const AGE_GROUPS = [
  'Kinder (0–1)', 'Kinder (1–2)', 'Kinder (2–4)', 'Kinder (4–6)', 'Kinder (7–10)',
  'Jugend (11–14)', 'Jugend (15–17)', 'Erwachsene (18–45)', 'Erwachsene (46–60)',
  'Senioren (60–75)', 'Senioren (75+)',
]
const PHASES = ['Aufwärmen', 'Hauptteil', 'Cool-Down']
const ORGANIZATION_FORMS = [
  'Freie Verteilung (ganze Halle)', 'Kreis', 'Reihe / Gasse', 'Schachbrettformation',
  'Zu zweit / Paare', 'Kleingruppen', 'Stationsbetrieb',
  'Zwei Mannschaften (gemeinsames Spielfeld)', 'Zwei Mannschaften (getrenntes Spielfeld)',
]
const MATERIALS = [
  'Ball', 'Seil/Springseil', 'Reifen', 'Stab', 'Tuch', 'Schwungtuch', 'Leibchen', 'Hütchen',
  'Kegel', 'Markierung', 'Turnmatte', 'Yoga-Matte', 'Weichbodenmatte', 'Bank', 'Kleiner Kasten',
  'Großer Kasten', 'Bock', 'Pferd', 'Sprossenwand', 'Turnringe', 'Stufenbarren', 'Tor',
  'Volleyballnetz',
]
const GONE = [
  'Vorschulturnen', 'Allgemeinsport', 'Eltern-Kind Turnen', '1-gegen-1', 'Senioren (60+)',
  'Kreis / Sitzkreis', 'Tor/Netz', 'Kein Material',
]
/** Eigene Begriffe aus der Zeit vor PROJ-19, die im Grundstock aufgehen sollen. */
const ABSORBED = ['gymnastik', 'stufenbarren']

const admin = adminClient()
let userId: string

async function cleanupAll() {
  await admin.from('units').delete().eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  await admin.from('groups').delete().eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  await admin.from('venues').delete().eq('user_id', userId).like('name', `${TAG}%`)
  await admin.from('exercises').delete().eq('user_id', userId).eq('work_notes', MARKER)
  await admin.from('custom_categories').delete().eq('user_id', userId).ilike('name', `${TAG}%`)
  await admin.from('custom_categories').delete().eq('user_id', userId).in('name', ABSORBED)
}

test.beforeAll(async () => {
  userId = await testUserId(admin, TEST_EMAIL)
})

test.beforeEach(async () => {
  await cleanupAll()
})

test.afterAll(async () => {
  await cleanupAll()
})

// ---- Aufbau ----

async function createCategory(type: string, name: string) {
  const { error } = await admin.from('custom_categories').insert({ user_id: userId, category_type: type, name })
  if (error) throw new Error(`Kategorie anlegen: ${error.message}`)
}

async function createExercise(
  name: string,
  fields: {
    sports?: string[]
    materials?: string[]
    variants?: { title: string; materials?: { name: string; quantity: number; mode: string }[] }[]
  } = {}
) {
  const { data, error } = await admin
    .from('exercises')
    .insert({
      user_id: userId,
      name,
      description: 'Testübung für PROJ-19.',
      work_notes: MARKER,
      sports: fields.sports ?? ['Turnen'],
      age_groups: ['Kinder (4–6)'],
      phases: ['Hauptteil'],
      difficulty: 'Mittel',
      organization_forms: [],
      duration: 10,
      music_required: false,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Übung anlegen: ${error?.message}`)
  if (fields.materials?.length) {
    const { error: matError } = await admin.from('exercise_materials').insert(
      fields.materials.map((m, i) => ({ exercise_id: data.id, name: m, quantity: 1, mode: 'insgesamt', sort_order: i }))
    )
    if (matError) throw new Error(`Übungsmaterial: ${matError.message}`)
  }
  if (fields.variants?.length) {
    const { error: varError } = await admin.from('exercise_variants').insert(
      fields.variants.map((v, i) => ({
        exercise_id: data.id,
        title: v.title,
        description: 'Testvariante.',
        materials: v.materials ?? [],
        sort_order: i,
      }))
    )
    if (varError) throw new Error(`Variante: ${varError.message}`)
  }
  return data.id as string
}

async function createGroup(suffix: string, sports: string[]) {
  const name = `${FIXTURE_GROUP_NAME} ${TAG} ${suffix}`
  const { data, error } = await admin
    .from('groups')
    .insert({
      user_id: userId,
      name,
      sports,
      age_groups: ['Kinder (4–6)'],
      participants: 10,
      unit_duration: 60,
      venue_id: null,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Gruppe anlegen: ${error?.message}`)
  return { id: data.id as string, name }
}

// ---- Hilfen ----

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

/** Das offene Auswahlfeld (Radix-Popover). */
function popover(page: Page): Locator {
  return page.locator('[data-radix-popper-content-wrapper]').last()
}

/** Öffnet ein Auswahlfeld und liefert seine Einträge in der angezeigten Folge. */
async function openOptions(page: Page, combobox: Locator): Promise<string[]> {
  await combobox.click()
  const list = popover(page)
  await expect(list.locator('label').first()).toBeVisible()
  return (await list.locator('label').allInnerTexts()).map((text) => text.trim())
}

async function closePopover(page: Page) {
  await page.keyboard.press('Escape')
  await expect(page.locator('[data-radix-popper-content-wrapper]')).toHaveCount(0)
}

/** Der Teil der Liste ab dem ersten mitgelieferten Begriff — er muss genau der Grundstock sein. */
function fromFirst(options: string[], predefined: string[]) {
  const start = options.indexOf(predefined[0])
  return { own: options.slice(0, start), rest: options.slice(start) }
}

function wizardField(page: Page, placeholder: string) {
  return page.getByRole('combobox').filter({ hasText: placeholder })
}

/** Neue Übung bis Schritt 2 „Einordnung". */
async function openNewExerciseStep2(page: Page) {
  await page.goto('/exercises/new')
  await page.getByLabel('Name *').fill(`${TAG} Formular`)
  await page.getByLabel('Beschreibung *').fill('Nur zum Ansehen der Listen.')
  await page.getByRole('button', { name: 'Weiter' }).click()
  await expect(page.getByRole('heading', { name: 'Einordnung' })).toBeVisible()
}

const STEPS = ['Basis', 'Einordnung', 'Logistik', 'Extras'] as const

/**
 * Über „Weiter" statt über die Schrittanzeige: deren Namen sind am Handy
 * ausgeblendet.
 */
async function openEditStep(page: Page, exerciseId: string, step: 'Einordnung' | 'Logistik' | 'Extras') {
  await page.goto(`/exercises/${exerciseId}/edit`)
  await expect(page.getByLabel('Name *')).toBeVisible()
  for (let i = 0; i < STEPS.indexOf(step); i += 1) {
    await page.getByRole('button', { name: 'Weiter' }).click()
  }
  await expect(page.getByRole('heading', { name: step, exact: true })).toBeVisible()
}

/** Von einem Schritt bis „Extras", wo gespeichert wird. */
async function goToExtras(page: Page) {
  while (await page.getByRole('button', { name: 'Weiter' }).isVisible()) {
    await page.getByRole('button', { name: 'Weiter' }).click()
  }
}

async function saveWizard(page: Page, exerciseId: string) {
  await page.getByRole('button', { name: 'Speichern' }).click()
  await expect(page).not.toHaveURL(new RegExp(`/exercises/${exerciseId}/edit`))
}

// ---- A. Der Grundstock ----

test.describe('PROJ-19 — A. Der Grundstock', () => {
  test('AC: Sportarten, Altersgruppen, Phasen und Organisationsformen sind genau der Grundstock, in seiner Folge', async ({ page }) => {
    await openNewExerciseStep2(page)

    const lists: [string, string[]][] = [
      ['Sportarten auswählen', SPORTS],
      ['Altersgruppen auswählen', AGE_GROUPS],
      ['Phasen auswählen', PHASES],
      ['Organisationsformen auswählen', ORGANIZATION_FORMS],
    ]
    for (const [placeholder, predefined] of lists) {
      const options = await openOptions(page, wizardField(page, placeholder))
      const { own, rest } = fromFirst(options, predefined)
      expect(rest, placeholder).toEqual(predefined)
      // Was davor steht, sind eigene Begriffe — kein mitgelieferter darunter.
      for (const term of own) expect(predefined).not.toContain(term)
      for (const gone of GONE) expect(options, placeholder).not.toContain(gone)
      await closePopover(page)
    }
  })

  test('AC: ohne eigene Sportarten beginnt die Liste mit „Krabbelgruppe" und endet mit „Teambuilding"', async ({ page }) => {
    const { data } = await admin
      .from('custom_categories')
      .select('name')
      .eq('user_id', userId)
      .eq('category_type', 'sport')
    test.skip((data ?? []).length > 0, 'Das Testkonto hat eigene Sportarten')

    await openNewExerciseStep2(page)
    const options = await openOptions(page, wizardField(page, 'Sportarten auswählen'))
    expect(options[0]).toBe('Krabbelgruppe')
    expect(options[options.length - 1]).toBe('Teambuilding')
  })

  test('AC: Material ist genau der Grundstock, ohne „Kein Material"; die Halle bietet Volleyballnetz und Stufenbarren', async ({ page }) => {
    const id = await createExercise(`${TAG} Materialliste`)
    await openEditStep(page, id, 'Logistik')
    await page.getByRole('button', { name: 'Material hinzufügen' }).click()
    const options = await openOptions(page, page.getByRole('combobox').filter({ hasText: 'Auswählen...' }))
    expect(fromFirst(options, MATERIALS).rest).toEqual(MATERIALS)
    expect(options).not.toContain('Kein Material')
    expect(options).not.toContain('Ohne Material')
    await closePopover(page)

    await page.goto('/manage?tab=venues')
    await page.getByRole('button', { name: /Neue Halle/ }).first().click()
    const dialog = page.getByRole('dialog', { name: 'Neue Halle anlegen' })
    await dialog.getByRole('button', { name: 'Material hinzufügen' }).click()
    const venueOptions = await openOptions(page, dialog.getByRole('combobox').filter({ hasText: 'Auswählen...' }))
    expect(venueOptions).toContain('Volleyballnetz')
    expect(venueOptions).toContain('Stufenbarren')
    expect(venueOptions).not.toContain('Kein Material')
    expect(venueOptions).not.toContain('Ohne Material')
  })
})

// ---- B. Eine Reihenfolge überall ----

test.describe('PROJ-19 — B. Eine Reihenfolge überall', () => {
  test('AC: eigene Sportarten stehen oben, alphabetisch ohne Groß/Klein — im Formular und im Filter gleich', async ({ page }) => {
    await createCategory('sport', `${TAG} Zumba`)
    await createCategory('sport', `${TAG} Capoeira`)
    await createCategory('sport', `${TAG.toLowerCase()} aerobic`)
    const mine = [`${TAG.toLowerCase()} aerobic`, `${TAG} Capoeira`, `${TAG} Zumba`]

    await openNewExerciseStep2(page)
    const form = await openOptions(page, wizardField(page, 'Sportarten auswählen'))
    const { own, rest } = fromFirst(form, SPORTS)
    expect(rest).toEqual(SPORTS)
    expect(own.filter((term) => term.toUpperCase().startsWith(TAG))).toEqual(mine)
    await closePopover(page)

    await page.goto('/exercises')
    await page.getByRole('button', { name: /Filter/ }).click()
    // Die Übersicht holt die eigenen Begriffe erst nach dem Aufbau der Seite.
    await openOptions(page, page.getByRole('combobox').filter({ hasText: 'Alle Sportarten' }))
    await expect
      .poll(async () => (await popover(page).locator('label').allInnerTexts()).map((t) => t.trim()))
      .toEqual(form)
  })

  test('AC: gewählte Begriffe stehen in Listenfolge — Detailansicht und Liste gleich, Material nach dem Speichern auch', async ({ page }) => {
    await createCategory('sport', `${TAG} Zumba`)
    const name = `${TAG} Reihenfolge`
    const id = await createExercise(name, {
      sports: ['Volleyball', 'Turnen', `${TAG} Zumba`],
      materials: ['Weichbodenmatte', 'Bank', 'Ball'],
    })

    await page.goto(`/exercises/${id}`)
    await expect(page.locator('h1 + div > *')).toHaveText([`${TAG} Zumba`, 'Turnen', 'Volleyball'])
    const material = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Material', exact: true }) })
    await expect(material.locator('span:not(.text-muted-foreground)')).toHaveText([
      // Folge des Grundstocks: Weichbodenmatte (13) steht vor Bank (14).
      /Ball/, /Weichbodenmatte/, /Bank/,
    ])

    await page.goto('/exercises')
    await page.getByPlaceholder('Übung suchen...').fill(name)
    const row = page.getByRole('link', { name: new RegExp(name) }).first()
    await expect(row).toBeVisible()
    const rowText = (await row.innerText()).replace(/\s+/g, ' ')
    expect(rowText.indexOf(`${TAG} Zumba`)).toBeLessThan(rowText.indexOf('Turnen'))
    expect(rowText.indexOf('Turnen')).toBeLessThan(rowText.indexOf('Volleyball'))
  })

  test('AC: im Formular stehen die Chips schon beim Anklicken in Listenfolge', async ({ page }) => {
    await openNewExerciseStep2(page)
    await wizardField(page, 'Sportarten auswählen').click()
    await popover(page).getByText('Volleyball', { exact: true }).click()
    await popover(page).getByText('Turnen', { exact: true }).click()
    await closePopover(page)
    const chips = page.getByRole('button', { name: /^(Turnen|Volleyball) entfernen$/ })
    await expect(chips).toHaveCount(2)
    await expect(chips.nth(0)).toHaveAccessibleName('Turnen entfernen')
    await expect(chips.nth(1)).toHaveAccessibleName('Volleyball entfernen')
  })

  test('AC: Materialzeilen bleiben beim Bearbeiten in Eingabefolge; danach zeigt die Detailansicht die Listenfolge', async ({ page }) => {
    const id = await createExercise(`${TAG} Materialzeilen`)
    await openEditStep(page, id, 'Logistik')

    for (const material of ['Bank', 'Ball']) {
      await page.getByRole('button', { name: 'Material hinzufügen' }).click()
      await page.getByRole('combobox').filter({ hasText: 'Auswählen...' }).last().click()
      await popover(page).getByText(material, { exact: true }).click()
    }
    const rows = page.getByRole('combobox').filter({ hasText: /^(Bank|Ball)$/ })
    await expect(rows).toHaveText(['Bank', 'Ball'])
    // „Anzahl" ist eine Beschriftung ohne Verknüpfung — das Feld steht in der Zeile.
    await page.locator('div.p-3.border.rounded-lg').first().locator('input[type="number"]').fill('3')
    await expect(rows).toHaveText(['Bank', 'Ball'])

    await goToExtras(page)
    await saveWizard(page, id)
    await page.goto(`/exercises/${id}`)
    const material = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Material', exact: true }) })
    await expect(material.locator('span:not(.text-muted-foreground)')).toHaveText([/1× Ball/, /3× Bank/])
  })

  test('AC: bei Varianten stehen eigene Altersgruppen und Organisationsformen zur Wahl, ganz oben', async ({ page }) => {
    await createCategory('age_group', `${TAG} Altersgruppe`)
    await createCategory('organization_form', `${TAG} Form`)
    const id = await createExercise(`${TAG} Variantenlisten`, { variants: [{ title: `${TAG} Variante` }] })

    await openEditStep(page, id, 'Extras')
    await page.getByRole('button', { name: 'Abweichende Bedingungen' }).click()

    const ages = await openOptions(page, page.getByRole('combobox').filter({ hasText: 'Altersgruppen auswählen' }))
    expect(ages.indexOf(`${TAG} Altersgruppe`)).toBeGreaterThanOrEqual(0)
    expect(ages.indexOf(`${TAG} Altersgruppe`)).toBeLessThan(ages.indexOf(AGE_GROUPS[0]))
    await closePopover(page)

    const forms = await openOptions(page, page.getByRole('combobox').filter({ hasText: 'Organisationsformen auswählen' }))
    expect(forms.indexOf(`${TAG} Form`)).toBeGreaterThanOrEqual(0)
    expect(forms.indexOf(`${TAG} Form`)).toBeLessThan(forms.indexOf(ORGANIZATION_FORMS[0]))
  })

  test('AC: Generator — Sportarten der Gruppe oben in Listenfolge, darunter „Weitere": eigene, dann der Grundstock', async ({ page }, testInfo) => {
    await createCategory('sport', `${TAG} Zumba`)
    await createExercise(`${TAG} Generatorübung`)
    // Klick-Reihenfolge an der Gruppe: erst Volleyball, dann Kinderturnen.
    const group = await createGroup('Blöcke', ['Volleyball', 'Kinderturnen'])

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    const field = page
      .locator('div.space-y-2')
      .filter({ has: page.getByText('Sportart(en)', { exact: true }) })
      .getByRole('combobox')
      .first()
    await field.click()

    const groupBlock = popover(page).getByRole('group', { name: 'Sportarten der Gruppe' })
    const restBlock = popover(page).getByRole('group', { name: 'Weitere' })
    await expect(groupBlock.locator('label')).toHaveText(['Kinderturnen', 'Volleyball'])
    const rest = (await restBlock.locator('label').allInnerTexts()).map((t) => t.trim())
    const expected = SPORTS.filter((s) => s !== 'Kinderturnen' && s !== 'Volleyball')
    const { own, rest: predefined } = fromFirst(rest, expected)
    expect(predefined).toEqual(expected)
    expect(own).toContain(`${TAG} Zumba`)
    if (testInfo.project.name.includes('mobil')) await noHorizontalScroll(page)
  })
})

// ---- C. „Ohne Material" ----

test.describe('PROJ-19 — C. „Ohne Material"', () => {
  test('AC: Variante — drei Wahlen, Voreinstellung „Wie die Hauptübung"; „Ohne Material" lässt kein Material zu und zeigt „Kein Material nötig"', async ({ page }) => {
    const id = await createExercise(`${TAG} Variante ohne`, {
      materials: ['Ball'],
      variants: [{ title: `${TAG} Variante` }],
    })
    await openEditStep(page, id, 'Extras')
    await page.getByRole('button', { name: 'Abweichende Bedingungen' }).click()

    const material = page.getByRole('radiogroup', { name: 'Material' })
    await expect(material.getByRole('radio')).toHaveCount(3)
    await expect(material.getByRole('radio', { name: 'Wie die Hauptübung' })).toBeChecked()
    await expect(page.getByText('Wie die Hauptübung: 1× Ball')).toBeVisible()

    await material.getByRole('radio', { name: 'Ohne Material' }).click()
    await expect(page.getByRole('button', { name: 'Material hinzufügen' })).toHaveCount(0)

    await material.getByRole('radio', { name: 'Eigenes Material' }).click()
    await expect(page.getByRole('button', { name: 'Material hinzufügen' })).toBeVisible()
    await material.getByRole('radio', { name: 'Ohne Material' }).click()

    await saveWizard(page, id)
    await page.goto(`/exercises/${id}`)
    await page.getByRole('button', { name: `${TAG} Variante` }).click()
    await expect(page.getByText('Kein Material nötig')).toBeVisible()
    await expect(page.getByText('Abweichendes Material:')).toHaveCount(0)
  })

  test('AC: Filter „Ohne Material" findet genau die Übungen ohne Materialzeile; mit „Ball" gilt „oder"', async ({ page }) => {
    await createExercise(`${TAG} Filter ohne`)
    await createExercise(`${TAG} Filter Ball`, { materials: ['Ball'] })
    await createExercise(`${TAG} Filter Matte`, { materials: ['Turnmatte'] })
    // Eine Variante „Ohne Material" macht die Übung nicht materiallos.
    await createExercise(`${TAG} Filter Variante`, {
      materials: ['Bank'],
      variants: [{ title: 'ohne', materials: [{ name: 'Kein Material', quantity: 1, mode: 'insgesamt' }] }],
    })

    await page.goto('/exercises')
    await page.getByPlaceholder('Übung suchen...').fill(`${TAG} Filter`)
    const names = page.getByRole('link', { name: new RegExp(`${TAG} Filter`) })
    await expect(names).toHaveCount(4)

    // Solange das Filterfenster offen ist, ist die Seite dahinter für
    // Hilfsmittel ausgeblendet — gezählt wird nach dem Schließen.
    await page.getByRole('button', { name: /Filter/ }).click()
    await page.getByLabel('Ohne Material').check()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(names).toHaveCount(1)
    await expect(names.first()).toContainText(`${TAG} Filter ohne`)

    await page.getByRole('button', { name: /Filter/ }).click()
    await page.getByRole('combobox').filter({ hasText: 'Alle Materialien' }).click()
    await popover(page).getByText('Ball', { exact: true }).click()
    await closePopover(page)
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(names).toHaveCount(2)
    await expect(page.getByRole('link', { name: new RegExp(`${TAG} Filter Ball`) })).toBeVisible()
    await expect(page.getByRole('link', { name: new RegExp(`${TAG} Filter ohne`) })).toBeVisible()
  })
})

// ---- D. Kein Begriff zweimal ----

test.describe('PROJ-19 — D. Kein Begriff zweimal', () => {
  async function typeCustom(page: Page, placeholder: string, buttonLabel: string, text: string) {
    await wizardField(page, placeholder).click()
    await popover(page).getByRole('button', { name: buttonLabel }).click()
    await popover(page).getByPlaceholder('Neuer Eintrag...').fill(text)
    await popover(page).getByPlaceholder('Neuer Eintrag...').press('Enter')
  }

  test('AC: „gymnastik " wird als „Gymnastik" ausgewählt; ein zweites Mal heißt „schon ausgewählt"; „ZUMBA" wählt das eigene „Zumba"', async ({ page }) => {
    await createCategory('sport', `${TAG} Zumba`)
    await openNewExerciseStep2(page)

    await typeCustom(page, 'Sportarten auswählen', 'Eigene Sportart hinzufügen', 'gymnastik ')
    await expect(popover(page).getByRole('status')).toHaveText('„Gymnastik" gibt es schon — ausgewählt.')
    await closePopover(page)
    await expect(page.getByRole('button', { name: 'Gymnastik entfernen' })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'gibt es schon' })).toHaveText('„Gymnastik" gibt es schon — ausgewählt.')

    await typeCustom(page, '1 ausgewählt', 'Eigene Sportart hinzufügen', 'Gymnastik')
    await expect(popover(page).getByRole('status')).toHaveText('„Gymnastik" ist schon ausgewählt.')
    await closePopover(page)
    await expect(page.getByRole('button', { name: /entfernen$/ })).toHaveCount(1)

    await typeCustom(page, '1 ausgewählt', 'Eigene Sportart hinzufügen', `${TAG} ZUMBA`)
    await closePopover(page)
    // `exact`: sonst vergleicht Playwright ohne Groß/Klein, und „ZUMBA" träfe „Zumba".
    await expect(page.getByRole('button', { name: `${TAG} Zumba entfernen`, exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: `${TAG} ZUMBA entfernen`, exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /entfernen$/ })).toHaveCount(2)
  })

  test('AC: dasselbe bei Altersgruppen und Phasen', async ({ page }) => {
    await openNewExerciseStep2(page)
    await typeCustom(page, 'Altersgruppen auswählen', 'Eigene Altersgruppe hinzufügen', 'senioren (75+)')
    await expect(popover(page).getByRole('status')).toHaveText('„Senioren (75+)" gibt es schon — ausgewählt.')
    await closePopover(page)
    await expect(page.getByRole('button', { name: 'Senioren (75+) entfernen' })).toBeVisible()

    await typeCustom(page, 'Phasen auswählen', 'Eigene Phase hinzufügen', '  COOL-DOWN')
    await expect(popover(page).getByRole('status')).toHaveText('„Cool-Down" gibt es schon — ausgewählt.')
  })

  test('AC: Material eingetippt wählt das vorhandene; „Kein Material" lässt sich nicht als Material anlegen', async ({ page }) => {
    const id = await createExercise(`${TAG} Material eintippen`)
    await openEditStep(page, id, 'Logistik')
    await page.getByRole('button', { name: 'Material hinzufügen' }).click()
    const field = page.getByRole('combobox').filter({ hasText: 'Auswählen...' })

    await field.click()
    await popover(page).getByRole('button', { name: 'Eigenes Material hinzufügen' }).click()
    await popover(page).getByPlaceholder('Neues Material...').fill('ball')
    await popover(page).getByPlaceholder('Neues Material...').press('Enter')
    await expect(page.getByRole('combobox').filter({ hasText: /^Ball$/ })).toBeVisible()
    await expect(page.getByRole('status').filter({ hasText: 'gibt es schon' })).toHaveText('„Ball" gibt es schon — ausgewählt.')

    await page.getByRole('button', { name: 'Material hinzufügen' }).click()
    await page.getByRole('combobox').filter({ hasText: 'Auswählen...' }).click()
    await popover(page).getByRole('button', { name: 'Eigenes Material hinzufügen' }).click()
    await popover(page).getByPlaceholder('Neues Material...').fill('kein material')
    await popover(page).getByPlaceholder('Neues Material...').press('Enter')
    await expect(popover(page).getByRole('status')).toContainText('ist kein Material')
    await closePopover(page)
    await expect(page.getByRole('combobox').filter({ hasText: /kein material/i })).toHaveCount(0)
  })

  test('AC: in der Verwaltung meldet „gymnastik" den mitgelieferten Begriff und legt nichts an', async ({ page }) => {
    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: 'Sportart anlegen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('gymnastik')
    await dialog.getByRole('button', { name: 'Anlegen' }).click()
    await expect(dialog).toContainText('„Gymnastik" gibt es schon — als mitgelieferten Begriff.')
    const { data } = await admin.from('custom_categories').select('id').eq('user_id', userId).ilike('name', 'gymnastik')
    expect(data).toEqual([])
  })

  test('AC: eigene Begriffe aus der Zeit vor PROJ-19 gehen im Grundstock auf — Verwaltung, Übung, Materialliste', async ({ page }) => {
    await createCategory('sport', 'gymnastik')
    await createCategory('material', 'stufenbarren')
    const id = await createExercise(`${TAG} Aufgehen`, { sports: ['gymnastik', 'Turnen'], materials: ['stufenbarren'] })

    await page.goto('/manage?tab=categories')
    await expect(page.getByRole('heading', { name: 'Sportarten' })).toBeVisible()
    await expect(page.locator('section li').filter({ hasText: /^gymnastik/ })).toHaveCount(0)
    await expect(page.locator('section li').filter({ hasText: /^stufenbarren/ })).toHaveCount(0)

    await expect
      .poll(async () => (await admin.from('custom_categories').select('id').eq('user_id', userId).in('name', ABSORBED)).data?.length)
      .toBe(0)
    const { data: exercise } = await admin.from('exercises').select('sports').eq('id', id).single()
    expect(exercise?.sports).toEqual(['Gymnastik', 'Turnen'])
    const { data: materials } = await admin.from('exercise_materials').select('name').eq('exercise_id', id)
    expect(materials).toEqual([{ name: 'Stufenbarren' }])

    await openEditStep(page, id, 'Logistik')
    await page.getByRole('button', { name: 'Material hinzufügen' }).click()
    const options = await openOptions(page, page.getByRole('combobox').filter({ hasText: 'Auswählen...' }))
    expect(options.filter((o) => o.toLowerCase() === 'stufenbarren')).toEqual(['Stufenbarren'])
    expect(options.indexOf('Stufenbarren') - options.indexOf('Ball')).toBe(20)
  })
})

// ---- E. Richtiges Markieren ----

test.describe('PROJ-19 — E. Die App bringt richtiges Markieren bei', () => {
  test('AC: unter Sportart und Altersgruppe steht der Satz zum vollständigen Markieren, ohne Aufklappen', async ({ page }) => {
    await openNewExerciseStep2(page)
    const hints = page.getByText('Wähle alles, wofür die Übung taugt')
    await expect(hints).toHaveCount(2)
    await expect(hints.first()).toBeVisible()
    await expect(hints.nth(1)).toBeVisible()
    await noHorizontalScroll(page)
  })
})
