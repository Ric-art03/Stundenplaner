import { test, expect, type Page } from '@playwright/test'
import { adminClient, FIXTURE_GROUP_NAME, testUserId, TEST_EMAIL } from './fixtures'

/**
 * E2E-Tests für PROJ-16 (Verwaltung) gegen die Akzeptanzkriterien der Spec,
 * einschließlich der Überarbeitung vom 2026-10-14.
 *
 * Eigene Stufe in playwright.config.ts („verwaltung", danach „verwaltung
 * mobil"): Die Tests legen Hallen, Gruppen, Kategorien und Stundenmuster an.
 * Liefen sie neben anderen Features, stünden diese Einträge dort in den
 * Auswahllisten. Beide Projekte laufen nacheinander, nie gleichzeitig — so darf
 * jeder Test vor dem Start alles mit der Kennung `E2E16` wegräumen.
 *
 * Aufgebaut wird über den Dienstschlüssel, geprüft durch die Oberfläche.
 */

test.describe.configure({ mode: 'serial' })

/** Markierung an jeder hier angelegten Übung. */
const MARKER = 'E2E-Testdaten (PROJ-16)'
/** Präfix aller hier angelegten Namen; Gruppen tragen zusätzlich den der Grundgruppe. */
const TAG = 'E2E16'

const admin = adminClient()
let userId: string

async function cleanupAll() {
  await admin.from('units').delete().eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  await admin.from('groups').delete().eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  await admin.from('venues').delete().eq('user_id', userId).like('name', `${TAG}%`)
  await admin.from('exercises').delete().eq('user_id', userId).eq('work_notes', MARKER)
  await admin.from('unit_patterns').delete().eq('user_id', userId).like('name', `${TAG}%`)
  await admin.from('custom_categories').delete().eq('user_id', userId).like('name', `${TAG}%`)
}

test.beforeAll(async () => {
  userId = await testUserId(admin, TEST_EMAIL)
})

test.beforeEach(async () => {
  await cleanupAll()
  // Ohne jede Übung zeigt der Generator nur seinen Leerzustand. Nicht auf den
  // Grundbestand verlassen — die Stufe soll auch allein lauffähig sein.
  await createExercise(`${TAG} Grundübung`)
})

test.afterAll(async () => {
  await cleanupAll()
})

// ---- Aufbau ----

async function createVenue(name: string, materials: { name: string; quantity: number }[]) {
  const { data, error } = await admin
    .from('venues')
    .insert({ user_id: userId, name })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Halle anlegen: ${error?.message}`)
  if (materials.length > 0) {
    const { error: matError } = await admin.from('venue_materials').insert(
      materials.map((m, i) => ({ venue_id: data.id, name: m.name, quantity: m.quantity, sort_order: i }))
    )
    if (matError) throw new Error(`Hallenmaterial: ${matError.message}`)
  }
  return data.id as string
}

async function createGroup(
  suffix: string,
  options: { venueId?: string | null; unitDuration?: number; sports?: string[] } = {}
) {
  const name = `${FIXTURE_GROUP_NAME} ${TAG} ${suffix}`
  const { data, error } = await admin
    .from('groups')
    .insert({
      user_id: userId,
      name,
      sports: options.sports ?? ['Turnen'],
      age_groups: ['Kinder (4–6)'],
      participants: 10,
      unit_duration: options.unitDuration ?? 60,
      venue_id: options.venueId ?? null,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Gruppe anlegen: ${error?.message}`)
  return { id: data.id as string, name }
}

async function createExercise(
  name: string,
  fields: { phases?: string[]; sports?: string[]; materials?: { name: string; quantity: number }[] } = {}
) {
  const { data, error } = await admin
    .from('exercises')
    .insert({
      user_id: userId,
      name,
      description: 'Testübung für PROJ-16.',
      work_notes: MARKER,
      sports: fields.sports ?? ['Turnen'],
      age_groups: ['Kinder (4–6)'],
      phases: fields.phases ?? ['Hauptteil'],
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
      fields.materials.map((m, i) => ({
        exercise_id: data.id,
        name: m.name,
        quantity: m.quantity,
        mode: 'insgesamt',
        sort_order: i,
      }))
    )
    if (matError) throw new Error(`Übungsmaterial: ${matError.message}`)
  }
  return data.id as string
}

async function createCategory(type: string, name: string) {
  const { error } = await admin
    .from('custom_categories')
    .insert({ user_id: userId, category_type: type, name })
  if (error) throw new Error(`Kategorie anlegen: ${error.message}`)
}

function patternSegment(name: string, minutes: number) {
  return {
    name,
    minutes,
    fillMode: 'generate',
    difficulties: ['Leicht', 'Mittel', 'Schwer'],
    organizationForms: [],
    notes: '',
    sports: null,
    primarySport: null,
  }
}

async function createPattern(name: string, totalMinutes: number, segments: ReturnType<typeof patternSegment>[]) {
  const { data, error } = await admin
    .from('unit_patterns')
    .insert({ user_id: userId, name, total_minutes: totalMinutes, segments })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Muster anlegen: ${error?.message}`)
  return data.id as string
}

// ---- Hilfen ----

function isMobile(projectName: string) {
  return projectName.includes('mobil')
}

async function noHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

/** Die Zeile einer Halle in der Hallenliste. */
function venueRow(page: Page, name: string) {
  return page.locator('div.border.rounded-lg').filter({ hasText: name }).first()
}

/**
 * Die Zeile eines Musters in der Verwaltung. Meldungen sind ebenfalls
 * Listeneinträge (`ol > li`) und tragen oft denselben Namen — deshalb `ul`.
 */
function patternRow(page: Page, name: string) {
  return page.locator('ul > li').filter({ hasText: name })
}

async function chooseGroup(page: Page, groupName: string) {
  await page.getByRole('combobox', { name: 'Gruppe' }).click()
  await page.getByRole('option', { name: new RegExp(groupName) }).click()
}

// ---- A. Seite und Zugang ----

test.describe('PROJ-16 — A. Seite „Verwaltung" und ihr Zugang', () => {
  test('AC: die Startseite hat eine Karte „Verwaltung" mit Erklärsatz, die zur Verwaltung führt', async ({ page }) => {
    await page.goto('/dashboard')
    const card = page.getByRole('link', { name: /Verwaltung.*Hallen, Stundenmuster und eigene Kategorien/ })
    await expect(card).toBeVisible()
    await card.click()
    await expect(page).toHaveURL(/\/manage/)
    await expect(page.getByRole('heading', { name: 'Verwaltung', level: 1 })).toBeVisible()
  })

  test('AC: drei Reiter in der Reihenfolge Hallen, Stundenmuster, Kategorien; ohne Angabe ist „Hallen" offen', async ({ page }) => {
    await page.goto('/manage')
    const tabs = page.getByRole('tab')
    await expect(tabs).toHaveText(['Hallen', 'Stundenmuster', 'Kategorien'])
    await expect(page.getByRole('tab', { name: 'Hallen' })).toHaveAttribute('aria-selected', 'true')
    await noHorizontalScroll(page)
  })

  test('AC: der Reiter steht in der Adresse und überlebt das Neuladen', async ({ page }) => {
    await page.goto('/manage')
    await page.getByRole('tab', { name: 'Kategorien' }).click()
    await expect(page).toHaveURL(/tab=categories/)
    await page.reload()
    await expect(page.getByRole('tab', { name: 'Kategorien' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { name: 'Sportarten' })).toBeVisible()
  })

  test('AC: jeder Reiter trägt einen Erklärtext', async ({ page }) => {
    await page.goto('/manage?tab=venues')
    await expect(page.getByText(/Hallen sind deine Trainingsorte/)).toBeVisible()
    await page.goto('/manage?tab=patterns')
    await expect(page.getByText(/Ein Stundenmuster ist ein Zeitverlauf/)).toBeVisible()
    await page.goto('/manage?tab=categories')
    await expect(page.getByText(/Die mitgelieferten Begriffe der App sind fest/)).toBeVisible()
  })

  test('AC: „Hallen verwalten" auf der Gruppenübersicht öffnet den Reiter „Hallen"', async ({ page }) => {
    await page.goto('/groups')
    await page.getByRole('link', { name: /Hallen verwalten/ }).click()
    await expect(page).toHaveURL(/\/manage\?tab=venues/)
    await expect(page.getByRole('tab', { name: 'Hallen' })).toHaveAttribute('aria-selected', 'true')
  })

  test('AC (2026-10-14): Gruppen-Formular — ein „Kategorien verwalten", dazu „Hallen verwalten" und „Neue Halle"', async ({ page }) => {
    await page.goto('/groups/new')
    const categories = page.getByRole('link', { name: /Kategorien verwalten/ })
    await expect(categories).toHaveCount(1)
    await expect(categories).toHaveAttribute('href', '/manage?tab=categories')
    // Neuer Tab, damit die Eingaben im Formular stehen bleiben.
    await expect(categories).toHaveAttribute('target', '_blank')
    const venues = page.getByRole('link', { name: /Hallen verwalten/ })
    await expect(venues).toHaveAttribute('href', '/manage?tab=venues')
    await expect(venues).toHaveAttribute('target', '_blank')
    await expect(page.getByRole('button', { name: /Neue Halle/ })).toBeVisible()
  })

  test('AC (2026-10-14): Übungs-Assistent — ein Link in „Einordnung", einer bei „Logistik"', async ({ page }) => {
    const id = await createExercise(`${TAG} Assistent`)
    await page.goto(`/exercises/${id}/edit`)
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByRole('heading', { name: 'Einordnung' })).toBeVisible()
    const link = page.getByRole('link', { name: /Kategorien verwalten/ })
    await expect(link).toHaveCount(1)
    await expect(link).toHaveAttribute('href', '/manage?tab=categories')

    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByRole('heading', { name: 'Logistik' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Kategorien verwalten/ })).toHaveCount(1)
    await expect(page.getByRole('link', { name: /Kategorien verwalten/ })).toHaveAttribute(
      'href',
      '/manage?tab=categories#kategorie-material'
    )
  })

  test('AC (2026-10-14): Generator — ein „Kategorien verwalten" unter dem Zeitverlauf, nicht je Segment', async ({ page }) => {
    const group = await createGroup('Links')
    // Ohne Übung zeigt der Generator nur seinen Leerzustand; nicht auf den
    // Grundbestand verlassen, der läuft nicht mit, wenn die Stufe allein läuft.
    await createExercise(`${TAG} Übung Links`)
    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    await expect(page.getByText('Zeitverlauf', { exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Kategorien verwalten/ })).toHaveCount(1)
  })

  test('AC (2026-10-14): Kopfzeile — „Verwaltung" ab 768 px, am Handy weiter drei Punkte', async ({ page }, testInfo) => {
    await page.goto('/exercises')
    const header = page.locator('header nav')
    await expect(header.getByRole('link', { name: 'Einheiten' })).toBeVisible()
    if (isMobile(testInfo.project.name)) {
      await expect(header.getByRole('link', { name: 'Verwaltung' })).toBeHidden()
    } else {
      await page.setViewportSize({ width: 768, height: 900 })
      await expect(header.getByRole('link', { name: 'Verwaltung' })).toBeVisible()
      const headerHeight = await page.locator('header').evaluate((el) => el.getBoundingClientRect().height)
      expect(headerHeight).toBeLessThan(70)
      await noHorizontalScroll(page)
      await header.getByRole('link', { name: 'Verwaltung' }).click()
      await expect(page).toHaveURL(/\/manage/)
    }
  })
})

// ---- B. Hallen ----

test.describe('PROJ-16 — B. Reiter „Hallen"', () => {
  test('AC: die alte Adresse der Hallenverwaltung leitet in den Reiter „Hallen"', async ({ page }) => {
    await page.goto('/groups/venues')
    await expect(page).toHaveURL(/\/manage\?tab=venues/)
  })

  test('AC (2026-10-14): Löschen einer Halle mit Gruppen nennt Gruppen und die Folge für den Generator', async ({ page }) => {
    const venueName = `${TAG} Halle mit Gruppe`
    const venueId = await createVenue(venueName, [{ name: 'Bälle', quantity: 10 }])
    const group = await createGroup('Hallengruppe', { venueId })

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').nth(1).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText(`„${venueName}“ löschen?`)).toBeVisible()
    await expect(dialog).toContainText(group.name)
    await expect(dialog).toContainText('prüft der Generator')
    await expect(dialog).toContainText('kein Material mehr')
    await expect(dialog).toContainText('Gruppenprofil')
    await expect(dialog).toContainText('Gespeicherte Einheiten bleiben')
    await expect(dialog).toContainText('nicht rückgängig')

    await dialog.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(venueRow(page, venueName)).toBeVisible()
  })

  test('AC (2026-10-14): Löschen einer Halle ohne Gruppe — ein Satz, nicht rückgängig, danach weg', async ({ page }) => {
    const venueName = `${TAG} Halle allein`
    await createVenue(venueName, [])

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').nth(1).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Keine Gruppe nutzt diese Halle')
    await expect(dialog).toContainText('nicht rückgängig')
    await dialog.getByRole('button', { name: 'Endgültig löschen' }).click()
    await expect(page.getByText(venueName)).toHaveCount(0)
  })

  test('AC (2026-10-14): weniger Material an einer Halle mit Gruppen wird nachgefragt — mit Zahl der Übungen', async ({ page }) => {
    const venueName = `${TAG} Halle Senken`
    const venueId = await createVenue(venueName, [{ name: 'Bälle', quantity: 10 }])
    const group = await createGroup('Senken', { venueId })
    await createExercise(`${TAG} Braucht acht Bälle`, { materials: [{ name: 'Bälle', quantity: 8 }] })
    await createExercise(`${TAG} Braucht zwei Bälle`, { materials: [{ name: 'Bälle', quantity: 2 }] })

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').first().click()
    const edit = page.getByRole('dialog', { name: 'Halle bearbeiten' })
    await edit.locator('input[type="number"]').first().fill('5')
    await edit.getByRole('button', { name: 'Speichern' }).click()

    const ask = page.getByRole('alertdialog')
    await expect(ask.getByText('Weniger Material speichern?')).toBeVisible()
    // Nur die Übung mit acht Bällen fällt heraus; die mit zwei reicht weiter.
    await expect(ask).toContainText('Bälle von 10 auf 5')
    await expect(ask).toContainText(`1 Übung für ${group.name}`)
    await expect(ask).toContainText('Gespeicherte Einheiten bleiben')

    // „Zurück" lässt den Dialog mit der Eingabe stehen und speichert nichts.
    await ask.getByRole('button', { name: 'Zurück' }).click()
    await expect(edit.locator('input[type="number"]').first()).toHaveValue('5')
    const { data: unchanged } = await admin.from('venue_materials').select('quantity').eq('venue_id', venueId)
    expect(unchanged?.[0]?.quantity).toBe(10)

    await edit.getByRole('button', { name: 'Speichern' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Trotzdem speichern' }).click()
    await expect(edit).toBeHidden()
    await expect
      .poll(async () => (await admin.from('venue_materials').select('quantity').eq('venue_id', venueId)).data?.[0]?.quantity)
      .toBe(5)
  })

  test('AC (2026-10-14): Material hinzufügen speichert ohne Nachfrage', async ({ page }) => {
    const venueName = `${TAG} Halle Mehr`
    const venueId = await createVenue(venueName, [{ name: 'Bälle', quantity: 10 }])
    await createGroup('Mehr', { venueId })
    await createExercise(`${TAG} Braucht Bälle`, { materials: [{ name: 'Bälle', quantity: 8 }] })

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').first().click()
    const edit = page.getByRole('dialog', { name: 'Halle bearbeiten' })
    await edit.locator('input[type="number"]').first().fill('12')
    await edit.getByRole('button', { name: 'Speichern' }).click()
    await expect(edit).toBeHidden()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect
      .poll(async () => (await admin.from('venue_materials').select('quantity').eq('venue_id', venueId)).data?.[0]?.quantity)
      .toBe(12)
  })

  test('AC (2026-10-14): Material entfernen, das keine Übung braucht, speichert ohne Nachfrage', async ({ page }) => {
    const venueName = `${TAG} Halle Unbenutzt`
    const venueId = await createVenue(venueName, [
      { name: 'Bälle', quantity: 10 },
      { name: 'Matten', quantity: 4 },
    ])
    await createGroup('Unbenutzt', { venueId })
    await createExercise(`${TAG} Nur Bälle`, { materials: [{ name: 'Bälle', quantity: 2 }] })

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').first().click()
    const edit = page.getByRole('dialog', { name: 'Halle bearbeiten' })
    // Die Zeile mit den Matten ist die zweite; ihr Löschknopf ist der einzige Knopf ohne Text darin.
    const mattenRow = edit.locator('div.border.rounded-lg').filter({ hasText: 'Matten' })
    await mattenRow.locator('button:has(svg.lucide-trash-2)').click()
    await edit.getByRole('button', { name: 'Speichern' }).click()
    await expect(edit).toBeHidden()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect
      .poll(async () => (await admin.from('venue_materials').select('name').eq('venue_id', venueId)).data?.length)
      .toBe(1)
  })

  test('AC (2026-10-14): Material einer Halle ohne Gruppen ändern speichert ohne Nachfrage', async ({ page }) => {
    const venueName = `${TAG} Halle ohne Gruppe`
    await createVenue(venueName, [{ name: 'Bälle', quantity: 10 }])
    await createExercise(`${TAG} Braucht viele Bälle`, { materials: [{ name: 'Bälle', quantity: 8 }] })

    await page.goto('/manage?tab=venues')
    await venueRow(page, venueName).getByRole('button').first().click()
    const edit = page.getByRole('dialog', { name: 'Halle bearbeiten' })
    await edit.locator('input[type="number"]').first().fill('1')
    await edit.getByRole('button', { name: 'Speichern' }).click()
    await expect(edit).toBeHidden()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
  })
})

// ---- C–F. Kategorien ----

test.describe('PROJ-16 — C–F. Reiter „Kategorien"', () => {
  test('AC: fünf Abschnitte in fester Reihenfolge; Verwendung und „unbenutzt" an den Begriffen', async ({ page }) => {
    const used = `${TAG} Sportart benutzt`
    const unused = `${TAG} Sportart frei`
    await createCategory('sport', used)
    await createCategory('sport', unused)
    await createExercise(`${TAG} Übung mit Sportart`, { sports: [used] })

    await page.goto('/manage?tab=categories')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Sportarten',
      'Altersgruppen',
      'Phasen',
      'Organisationsformen',
      'Material',
    ])
    const usedRow = page.locator('section li').filter({ hasText: used })
    await expect(usedRow).toContainText('1 Übung')
    const unusedRow = page.locator('section li').filter({ hasText: unused })
    await expect(unusedRow).toContainText('unbenutzt')
    await noHorizontalScroll(page)
  })

  test('AC: „Verwendungen ansehen" nennt die Einträge mit Namen, nach Sorte', async ({ page }) => {
    const name = `${TAG} Phase Verwendet`
    await createCategory('phase', name)
    await createExercise(`${TAG} Übung in Phase`, { phases: [name] })

    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Verwendungen ansehen' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Übungen (1)')
    await expect(dialog).toContainText(`${TAG} Übung in Phase`)
  })

  test('AC: Anlegen — leerer Name und vorhandener Begriff werden abgelehnt, ein neuer steht danach als „unbenutzt" da', async ({ page }) => {
    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: 'Sportart anlegen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('button', { name: 'Anlegen' }).click()
    await expect(dialog).toContainText('Bitte gib einen Namen ein.')

    await dialog.getByLabel('Name').fill('volleyball')
    await dialog.getByRole('button', { name: 'Anlegen' }).click()
    await expect(dialog).toContainText('als mitgelieferten Begriff')

    const name = `${TAG} Neue Sportart`
    await dialog.getByLabel('Name').fill(`  ${name}  `)
    await dialog.getByRole('button', { name: 'Anlegen' }).click()
    await expect(dialog).toBeHidden()
    const row = page.locator('section li').filter({ hasText: name })
    await expect(row).toBeVisible()
    await expect
      .poll(async () => (await admin.from('custom_categories').select('name').eq('user_id', userId).eq('name', name)).data?.length)
      .toBe(1)
  })

  test('AC: Umbenennen zieht den Begriff an der Übung mit', async ({ page }) => {
    const oldName = `${TAG} Phase Alt`
    const newName = `${TAG} Phase Neu`
    await createCategory('phase', oldName)
    const exerciseId = await createExercise(`${TAG} Übung zum Umbenennen`, { phases: [oldName] })

    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: `Aktionen für ${oldName}` }).click()
    await page.getByRole('menuitem', { name: 'Umbenennen' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('Betroffen: 1 Übung')
    await dialog.getByLabel('Name').fill(newName)
    await dialog.getByRole('button', { name: 'Umbenennen' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('section li').filter({ hasText: newName })).toBeVisible()
    await expect
      .poll(async () => (await admin.from('exercises').select('phases').eq('id', exerciseId).single()).data?.phases)
      .toEqual([newName])
  })

  test('AC: gleicht der neue Name einem mitgelieferten Begriff, wird nachgefragt; Abbrechen lässt die Eingabe stehen', async ({ page }) => {
    const name = `${TAG} Aufwaermen`
    await createCategory('phase', name)
    const exerciseId = await createExercise(`${TAG} Übung zum Zusammenführen`, {
      phases: [name, 'Aufwärmen'],
    })

    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Umbenennen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Aufwärmen')
    await dialog.getByRole('button', { name: 'Umbenennen' }).click()
    await expect(dialog).toContainText('gibt es schon. Zusammenführen?')
    await expect(dialog).toContainText('nicht rückgängig')

    await dialog.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(dialog.getByLabel('Name')).toHaveValue('Aufwärmen')

    await dialog.getByRole('button', { name: 'Umbenennen' }).click()
    await dialog.getByRole('button', { name: 'Zusammenführen' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('section li').filter({ hasText: name })).toHaveCount(0)
    // Die Übung trug beide Begriffe — danach trägt sie ihn einmal.
    await expect
      .poll(async () => (await admin.from('exercises').select('phases').eq('id', exerciseId).single()).data?.phases)
      .toEqual(['Aufwärmen'])
  })

  test('AC (2026-10-14): Löschen eines benutzten Materials sagt, dass der Generator wie bisher rechnet; die Übung behält es', async ({ page }) => {
    const name = `${TAG} Pezzibälle`
    await createCategory('material', name)
    const exerciseId = await createExercise(`${TAG} Übung mit Pezzibällen`, {
      materials: [{ name, quantity: 4 }],
    })

    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('verschwindet nur aus den Auswahllisten')
    await expect(dialog).toContainText('Auch der Generator rechnet wie bisher')
    await expect(dialog).toContainText(`${TAG} Übung mit Pezzibällen`)
    await expect(dialog.getByRole('button', { name: 'Stattdessen umbenennen' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Löschen' }).click()
    await expect(dialog).toBeHidden()
    await expect(page.locator('section li').filter({ hasText: name })).toHaveCount(0)
    const { data } = await admin.from('exercise_materials').select('name').eq('exercise_id', exerciseId)
    expect(data?.map((row) => row.name)).toEqual([name])
  })

  test('AC: Löschen eines unbenutzten Begriffs fragt einmal nach und ohne „Stattdessen umbenennen"', async ({ page }) => {
    const name = `${TAG} Altersgruppe frei`
    await createCategory('age_group', name)

    await page.goto('/manage?tab=categories')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toContainText('nirgends verwendet')
    await expect(dialog.getByRole('button', { name: 'Stattdessen umbenennen' })).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.locator('section li').filter({ hasText: name })).toHaveCount(0)
  })

  test('AC: ein gelöschter Begriff kommt beim Speichern einer Gruppe nicht von selbst zurück', async ({ page }) => {
    const name = `${TAG} Sportart gelöscht`
    // Die Gruppe trägt den Begriff, die Kategorienliste nicht (mehr).
    const group = await createGroup('Gelöscht', { sports: [name] })

    await page.goto(`/groups/${group.id}/edit`)
    await expect(page.getByLabel('Name *')).toHaveValue(group.name)
    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await page.waitForURL((url) => !url.pathname.endsWith('/edit'))

    const { data } = await admin
      .from('custom_categories')
      .select('name')
      .eq('user_id', userId)
      .eq('name', name)
    expect(data).toEqual([])
    const { data: stored } = await admin.from('groups').select('sports').eq('id', group.id).single()
    expect(stored?.sports).toEqual([name])
  })
})

// ---- G–I. Stundenmuster ----

test.describe('PROJ-16 — G–I. Stundenmuster', () => {
  test('AC: Stundenmuster im Generator speichern — danach in der Verwaltung', async ({ page }) => {
    const group = await createGroup('Speichern')
    const name = `${TAG} Mein Muster`

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    await page.getByRole('button', { name: 'Stundenmuster speichern' }).click()
    const dialog = page.getByRole('dialog', { name: 'Stundenmuster speichern' })
    // Ohne Namen wird nichts gespeichert.
    await dialog.getByRole('button', { name: 'Speichern' }).click()
    await expect(dialog.locator('#pattern-name-error')).toBeVisible()
    await dialog.getByLabel('Name').fill(name)
    await dialog.getByRole('button', { name: 'Speichern' }).click()
    await expect(dialog).toBeHidden()

    await expect
      .poll(async () => (await admin.from('unit_patterns').select('total_minutes').eq('user_id', userId).eq('name', name)).data?.[0]?.total_minutes)
      .toBe(60)

    await page.goto('/manage?tab=patterns')
    await expect(patternRow(page, name)).toBeVisible()
  })

  test('AC: Weg „Stundenmuster" lädt ein Muster und rechnet auf die Dauer der Gruppe um', async ({ page }) => {
    const group = await createGroup('Anwenden', { unitDuration: 60 })
    const name = `${TAG} Neunzig`
    await createPattern(name, 90, [
      patternSegment('Aufwärmen', 30),
      patternSegment('Hauptteil', 60),
    ])

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    await expect(page.getByText('Muster von 90 auf 60 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByText('20 Min', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('40 Min', { exact: true }).first()).toBeVisible()
  })

  test('AC: die Verwaltung zeigt ein Muster mit Dauer und Kurzfassung; „Im Generator öffnen" steht zuerst im Menü', async ({ page }) => {
    const name = `${TAG} Kurzfassung`
    await createPattern(name, 45, [patternSegment('Aufwärmen', 15), { ...patternSegment('Spiel', 30), fillMode: 'empty' }])

    await page.goto('/manage?tab=patterns')
    const row = patternRow(page, name)
    await expect(row).toContainText('45 Min')
    await expect(row).toContainText('Aufwärmen · 15 Min')
    await expect(row).toContainText('Spiel · 30 Min · frei')

    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    const items = page.getByRole('menuitem')
    await expect(items.first()).toHaveText('Im Generator öffnen')
    await expect(items).toHaveText(['Im Generator öffnen', 'Umbenennen', 'Löschen'])
  })

  test('AC (2026-10-14): „Im Generator öffnen" wählt das Muster vor; nach der Gruppenwahl ist es angewendet', async ({ page }) => {
    const group = await createGroup('Öffnen', { unitDuration: 60 })
    const name = `${TAG} Vorgewählt`
    const patternId = await createPattern(name, 90, [
      patternSegment('Ankommen', 30),
      patternSegment('Hauptteil', 60),
    ])

    await page.goto('/manage?tab=patterns')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Im Generator öffnen' }).click()
    await expect(page).toHaveURL(new RegExp(`/units/new\\?pattern=${patternId}`))

    await chooseGroup(page, group.name)
    await expect(page.getByRole('radio', { name: 'Stundenmuster' })).toBeChecked()
    await expect(page.getByRole('combobox', { name: 'Stundenmuster' })).toContainText(name)
    await expect(page.getByText('Muster von 90 auf 60 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByRole('button', { name: /Ankommen/ }).first()).toBeVisible()
  })

  test('AC (2026-10-14): passt das Muster nicht zur Gruppe, bleibt es gewählt und der Grund steht da', async ({ page }) => {
    const shortGroup = await createGroup('Kurz', { unitDuration: 5 })
    const name = `${TAG} Sechs Phasen`
    const patternId = await createPattern(
      name,
      60,
      ['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => patternSegment(`Phase ${letter}`, 10))
    )

    await page.goto(`/units/new?pattern=${patternId}`)
    await chooseGroup(page, shortGroup.name)
    await expect(page.getByRole('radio', { name: 'Stundenmuster' })).toBeChecked()
    // Der Grund steht unter der Auswahl (die gleichlautende Meldung oben zählt nicht).
    await expect(
      page.locator('p[role="status"]').filter({ hasText: 'hat 6 Phasen' })
    ).toBeVisible()
    await expect(page.getByText('Zeitverlauf', { exact: true })).toHaveCount(0)

    await page.getByRole('button', { name: /Einheit generieren/ }).click()
    await expect(page.getByRole('alert').filter({ hasText: 'hat 6 Phasen' }).first()).toBeVisible()
    await expect(page).toHaveURL(/\/units\/new/)
  })

  test('AC (2026-10-14): Muster in einem anderen Tab gelöscht, dann „Im Generator öffnen" — Meldung, Generator auf „Standard"', async ({ page }) => {
    const group = await createGroup('Anderer Tab')
    const name = `${TAG} Gleich weg`
    const patternId = await createPattern(name, 60, [patternSegment('Hauptteil', 60)])

    await page.goto('/manage?tab=patterns')
    await expect(patternRow(page, name)).toBeVisible()
    // Der „andere Tab": das Muster verschwindet, die Liste hier ist veraltet.
    await admin.from('unit_patterns').delete().eq('id', patternId)

    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Im Generator öffnen' }).click()
    await expect(page.getByText('Dieses Stundenmuster gibt es nicht mehr', { exact: true })).toBeVisible()
    await chooseGroup(page, group.name)
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked()
  })

  test('BUG-27: gelöschtes Muster in der Adresse, direkt aufgerufen — die Meldung fehlt', async ({ page }) => {
    // Erwarteter Fehlschlag, bis BUG-27 behoben ist: Beim ersten Laden der
    // Seite wird die Meldung ausgelöst, bevor die Anzeige zuhört.
    test.fail()
    await createGroup('Gelöschtes Muster')
    await page.goto('/units/new?pattern=00000000-0000-0000-0000-000000000000')
    await expect(page.getByText('Dieses Stundenmuster gibt es nicht mehr', { exact: true })).toBeVisible({ timeout: 10_000 })
    // Ohne Gruppe ist noch kein Weg sichtbar; nach der Wahl steht „Standard".
    await page.getByRole('combobox', { name: 'Gruppe' }).click()
    await page.getByRole('option').first().click()
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked()
  })

  test('AC (2026-10-15): „Auf Standard zurücksetzen" fragt nur nach, wenn der Zeitverlauf verändert ist', async ({ page }) => {
    const group = await createGroup('Zurücksetzen')
    // Ohne Übung zeigt der Generator nur seinen Leerzustand.
    await createExercise(`${TAG} Übung Zurücksetzen`)
    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    const reset = page.getByRole('button', { name: 'Auf Standard zurücksetzen' })
    const confirm = page.getByRole('alertdialog')

    // Verändert: erst nach „Ersetzen" wird zurückgesetzt.
    await note.fill('Bälle bereitlegen')
    await reset.click()
    await expect(confirm).toContainText('Bisherigen Zeitverlauf ersetzen?')
    await expect(confirm).toContainText('Der Zeitverlauf wird auf Standard zurückgesetzt')
    await confirm.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(note).toHaveValue('Bälle bereitlegen')

    // Zurückgenommen ist unverändert: keine Nachfrage.
    await note.fill('')
    await reset.click()
    await expect(page.getByText('Auf Standard zurückgesetzt', { exact: true })).toBeVisible()
    await expect(confirm).toHaveCount(0)

    await note.fill('Bälle bereitlegen')
    await reset.click()
    await confirm.getByRole('button', { name: 'Ersetzen' }).click()
    await expect(note).toHaveValue('')
  })

  test('AC (2026-10-15, b): Gruppenwechsel nimmt den veränderten Zeitverlauf mit, umgerechnet und ohne Nachfrage', async ({ page }) => {
    const first = await createGroup('Mitnehmen Eins', { unitDuration: 60 })
    const second = await createGroup('Mitnehmen Zwei', { unitDuration: 45 })
    await createExercise(`${TAG} Übung Mitnehmen`)
    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Nimmt die neue Gruppe mit')

    // Umschalten auf „Standard" verliert nichts und fragt nicht.
    await page.getByRole('radio', { name: 'Standard' }).click()
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    await expect(note).toHaveValue('Nimmt die neue Gruppe mit')

    await chooseGroup(page, second.name)
    await expect(page.getByText('Zeitverlauf übernommen und von 60 auf 45 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Individuell' })).toBeChecked()
    await page.getByRole('button', { name: /Aufwärmen/ }).first().click()
    await expect(note).toHaveValue('Nimmt die neue Gruppe mit')
  })

  test('AC (2026-10-15, b): Muster gewählt, dann „Individuell" und verändert — der Gruppenwechsel nimmt den Stand mit, nicht das Muster', async ({ page }) => {
    const first = await createGroup('Muster Mitnehmen Eins', { unitDuration: 60 })
    const second = await createGroup('Muster Mitnehmen Zwei', { unitDuration: 60 })
    const name = `${TAG} Mitnehmen Muster`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Muster Mitnehmen`)

    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    await page.getByRole('radio', { name: 'Individuell' }).click()
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Eigene Begrüßung')

    await chooseGroup(page, second.name)
    await expect(page.getByText('Zeitverlauf übernommen.', { exact: true })).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    await expect(note).toHaveValue('Eigene Begrüßung')
    // Das Muster bleibt der Vergleichsstand: der Stand weicht ab, Speichern ist frei.
    await expect(page.getByRole('button', { name: 'Stundenmuster speichern' })).toBeEnabled()
  })

  test('AC (2026-10-15, b): passt der Zeitverlauf nicht auf die neue Gruppe, fragt die App mit beiden Zahlen', async ({ page }) => {
    const first = await createGroup('Zu kurz Eins', { unitDuration: 60 })
    const short = await createGroup('Zu kurz Zwei', { unitDuration: 5 })
    await createExercise(`${TAG} Übung Zu kurz`)
    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    // Drei Phasen dazu: sechs Phasen passen nicht in fünf Minuten.
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Phase hinzufügen' }).click()

    await chooseGroup(page, short.name)
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('Zeitverlauf passt nicht zur neuen Gruppe')
    await expect(confirm).toContainText('6 Phasen')
    await expect(confirm).toContainText('5 Minuten')
    await confirm.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page.getByRole('combobox', { name: 'Gruppe' })).toContainText(first.name)
    await expect(page.getByRole('radio', { name: 'Individuell' })).toBeChecked()

    await chooseGroup(page, short.name)
    await confirm.getByRole('button', { name: 'Trotzdem wechseln' }).click()
    await expect(page.getByRole('combobox', { name: 'Gruppe' })).toContainText(short.name)
    await expect(page.getByRole('radio', { name: 'Standard' })).toBeChecked()
  })

  test('AC (2026-10-15): „Stundenmuster speichern" ist ausgegraut, solange das geladene Muster unverändert ist', async ({ page }) => {
    const group = await createGroup('Ausgegraut', { unitDuration: 60 })
    const same = `${TAG} Sechzig`
    const longer = `${TAG} Neunzig umgerechnet`
    await createPattern(same, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createPattern(longer, 90, [patternSegment('Ankommen', 30), patternSegment('Hauptteil', 60)])
    await createExercise(`${TAG} Übung Ausgegraut`)

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(same) }).click()

    const save = page.getByRole('button', { name: 'Stundenmuster speichern' })
    const reason = page.getByText('Dieses Stundenmuster ist so schon gespeichert.')
    await expect(save).toBeDisabled()
    await expect(reason).toBeVisible()

    // Eine Änderung macht den Knopf frei, ihre Rücknahme graut ihn wieder aus.
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Begrüßung im Kreis')
    await expect(save).toBeEnabled()
    await expect(reason).toBeHidden()
    await note.fill('')
    await expect(save).toBeDisabled()

    // Nur umgerechnet ist nicht verändert (2026-10-16): ausgegraut, mit Hinweis auf die Umrechnung.
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(longer) }).click()
    await expect(page.getByText('Muster von 90 auf 60 Minuten umgerechnet.')).toBeVisible()
    await expect(save).toBeDisabled()
    await expect(
      page.getByText('Dieses Stundenmuster ist so schon gespeichert — hier auf 60 Minuten umgerechnet.')
    ).toBeVisible()
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    await note.fill('Für die Sechzig-Minuten-Fassung')
    await expect(save).toBeEnabled()
  })

  // ---- QA 2026-10-16: was bis dahin nur am Code gelesen war ----

  test('AC (2026-10-15): nach dem Speichern ist das Muster das geladene — ausgegraut bis zur nächsten Änderung, dann „überschreiben"', async ({ page }) => {
    const group = await createGroup('Nach Speichern', { unitDuration: 60 })
    await createExercise(`${TAG} Übung Nach Speichern`)
    const name = `${TAG} Frisch gespeichert`

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Erst im Kreis')
    const save = page.getByRole('button', { name: 'Stundenmuster speichern' })
    await save.click()
    const dialog = page.getByRole('dialog', { name: 'Stundenmuster speichern' })
    await dialog.getByLabel('Name').fill(name)
    await dialog.getByRole('button', { name: 'Speichern' }).click()
    await expect(dialog).toBeHidden()

    await expect(save).toBeDisabled()
    await expect(page.getByText('Dieses Stundenmuster ist so schon gespeichert.')).toBeVisible()

    // Eine Änderung macht ihn frei — der Dialog bietet jetzt „überschreiben".
    await note.fill('Erst im Kreis, dann Laufspiel')
    await expect(save).toBeEnabled()
    await save.click()
    await expect(dialog.getByText(`„${name}“ überschreiben`)).toBeVisible()
    await expect(dialog.getByText('Als neues Muster speichern')).toBeVisible()
    await dialog.getByRole('button', { name: 'Überschreiben' }).click()
    await expect(dialog).toBeHidden()
    await expect(save).toBeDisabled()
    await expect
      .poll(async () => {
        const { data } = await admin.from('unit_patterns').select('segments').eq('user_id', userId).eq('name', name)
        return (data?.[0]?.segments as { notes: string }[] | undefined)?.[0]?.notes
      })
      .toBe('Erst im Kreis, dann Laufspiel')
  })

  test('AC (2026-10-15, b): unveränderter Zeitverlauf mit Muster — der Gruppenwechsel wendet das Muster frisch an', async ({ page }) => {
    const first = await createGroup('Frisch Eins', { unitDuration: 60 })
    const second = await createGroup('Frisch Zwei', { unitDuration: 45, sports: ['Volleyball'] })
    const name = `${TAG} Frisch angewendet`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Frisch`)

    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()

    await chooseGroup(page, second.name)
    await expect(page.getByText('Muster von 60 auf 45 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByText(/Zeitverlauf übernommen/)).toHaveCount(0)
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByRole('combobox', { name: 'Stundenmuster' })).toContainText(name)
    await expect(page.getByRole('button', { name: 'Stundenmuster speichern' })).toBeDisabled()
    await expect(
      page.getByText('Dieses Stundenmuster ist so schon gespeichert — hier auf 45 Minuten umgerechnet.')
    ).toBeVisible()
    // „Wie die Gruppe": die Phase trägt jetzt die Sportart der neuen Gruppe.
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    const region = page.getByRole('region').filter({ hasText: 'Sportart(en)' })
    await expect(region).toContainText('Volleyball')
    await expect(region).not.toContainText('Turnen')
  })

  test('AC (2026-10-15, b): Muster gewählt und verändert — mitgenommen, Muster bleibt gewählt und Vergleichsstand', async ({ page }) => {
    const first = await createGroup('Vergleich Eins', { unitDuration: 60 })
    const second = await createGroup('Vergleich Zwei', { unitDuration: 30, sports: ['Volleyball'] })
    const name = `${TAG} Vergleichsstand`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Vergleich`)

    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Namen sagen')

    await chooseGroup(page, second.name)
    await expect(page.getByText('Zeitverlauf übernommen und von 60 auf 30 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Stundenmuster' })).toBeChecked()
    await expect(page.getByRole('combobox', { name: 'Stundenmuster' })).toContainText(name)
    const save = page.getByRole('button', { name: 'Stundenmuster speichern' })
    await expect(save).toBeEnabled()

    await page.getByRole('button', { name: /Ankommen/ }).first().click()
    await expect(note).toHaveValue('Namen sagen')
    const region = page.getByRole('region').filter({ hasText: 'Sportart(en)' })
    await expect(region).toContainText('Volleyball')

    // Zurückgenommen gleicht der Stand dem Muster, wie es auf diese Gruppe angewendet würde.
    await note.fill('')
    await expect(save).toBeDisabled()
    await expect(
      page.getByText('Dieses Stundenmuster ist so schon gespeichert — hier auf 30 Minuten umgerechnet.')
    ).toBeVisible()

    // „Überschreiben" bleibt möglich.
    await note.fill('Namen sagen')
    await save.click()
    await expect(
      page.getByRole('dialog', { name: 'Stundenmuster speichern' }).getByText(`„${name}“ überschreiben`)
    ).toBeVisible()
  })

  test('Edge (2026-10-15, b): Muster zu lang für die neue Gruppe, der veränderte Stand passt — Muster abgewählt, Weg „Individuell"', async ({ page }) => {
    const first = await createGroup('Abgewählt Eins', { unitDuration: 60 })
    const short = await createGroup('Abgewählt Zwei', { unitDuration: 5 })
    const name = `${TAG} Sechs Phasen`
    await createPattern(
      name,
      60,
      ['A', 'B', 'C', 'D', 'E', 'F'].map((letter) => patternSegment(`Teil ${letter}`, 10))
    )
    await createExercise(`${TAG} Übung Abgewählt`)

    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    // Zwei Phasen weg: vier passen in fünf Minuten, das Muster mit sechs nicht.
    for (const letter of ['E', 'F']) {
      // Die Überschrift in der Liste, nicht das Ziehfeld im Zeitbalken: dort
      // wird ein Klick auf ein schmales Segment gelegentlich als Ziehen gewertet.
      await page.locator('h3').getByRole('button', { name: new RegExp(`Teil ${letter}`) }).click()
      // Erst im aufgeklappten Bereich dieser Phase klicken — während der
      // Animation landete der Tipp am Handy sonst auf der Überschrift darunter.
      await page
        .getByRole('region', { name: new RegExp(`Teil ${letter}`) })
        .getByRole('button', { name: 'Phase entfernen' })
        .click()
      await expect(page.locator('h3').getByRole('button', { name: new RegExp(`Teil ${letter}`) })).toHaveCount(0)
    }

    await chooseGroup(page, short.name)
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByText('Zeitverlauf übernommen und von 60 auf 5 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByRole('radio', { name: 'Individuell' })).toBeChecked()
    await expect(page.getByText(/Teil D/).first()).toBeVisible()
    // Kein Muster mehr geladen: Speichern ist frei.
    await expect(page.getByRole('button', { name: 'Stundenmuster speichern' })).toBeEnabled()
  })

  test('Edge (2026-10-15, b): veränderter Stand passt nicht, das Muster schon — „Trotzdem wechseln" wendet das Muster an', async ({ page }) => {
    const first = await createGroup('Rückfall Eins', { unitDuration: 60 })
    const short = await createGroup('Rückfall Zwei', { unitDuration: 5 })
    const name = `${TAG} Zwei Phasen`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Rückfall`)

    await page.goto(`/units/new?group=${first.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    for (let i = 0; i < 4; i++) await page.getByRole('button', { name: 'Phase hinzufügen' }).click()

    await chooseGroup(page, short.name)
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('6 Phasen')
    await expect(confirm).toContainText('das gewählte Stundenmuster für sie frisch angewendet')
    await confirm.getByRole('button', { name: 'Trotzdem wechseln' }).click()

    await expect(page.getByRole('combobox', { name: 'Gruppe' })).toContainText(short.name)
    await expect(page.getByRole('combobox', { name: 'Stundenmuster' })).toContainText(name)
    await expect(page.getByText('Muster von 60 auf 5 Minuten umgerechnet.')).toBeVisible()
    await expect(page.getByText(/Zeitverlauf übernommen/)).toHaveCount(0)
    // Das Muster (20 / 40) auf 5 Minuten: 2 / 3 — die vier Phasen von Hand sind weg.
    await expect(page.getByText('2 Min', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('3 Min', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('1 Min', { exact: true })).toHaveCount(0)
  })

  test('Edge (2026-10-15): Muster geladen, dann auf Standard zurückgesetzt — kein Muster mehr geladen, Speichern frei', async ({ page }) => {
    const group = await createGroup('Zurück auf Standard', { unitDuration: 60 })
    const name = `${TAG} Vor dem Zurücksetzen`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Zurück auf Standard`)

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Stundenmuster' }).click()
    await page.getByRole('combobox', { name: 'Stundenmuster' }).click()
    await page.getByRole('option', { name: new RegExp(name) }).click()
    const save = page.getByRole('button', { name: 'Stundenmuster speichern' })
    await expect(save).toBeDisabled()

    // Unverändert gegenüber dem Muster: ohne Nachfrage.
    await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
    await expect(page.getByText('Auf Standard zurückgesetzt', { exact: true })).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)
    await expect(page.getByRole('radio', { name: 'Individuell' })).toBeChecked()
    await expect(save).toBeEnabled()
    await expect(page.getByText(/schon gespeichert/)).toHaveCount(0)
  })

  test('AC: Muster wählen bei verändertem Zeitverlauf fragt vorher; „Abbrechen" lässt den Stand, „Ersetzen" lädt', async ({ page }) => {
    const group = await createGroup('Ersetzen', { unitDuration: 60 })
    const name = `${TAG} Ersetzt`
    await createPattern(name, 60, [patternSegment('Ankommen', 20), patternSegment('Hauptteil', 40)])
    await createExercise(`${TAG} Übung Ersetzen`)

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('radio', { name: 'Individuell' }).click()
    const note = page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt')
    await note.fill('Handarbeit')

    await page.getByRole('button', { name: 'Auf Stundenmuster setzen' }).click()
    await page.getByRole('menuitem', { name: new RegExp(name) }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('Das Stundenmuster ersetzt den Zeitverlauf')
    await confirm.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(note).toHaveValue('Handarbeit')

    await page.getByRole('button', { name: 'Auf Stundenmuster setzen' }).click()
    await page.getByRole('menuitem', { name: new RegExp(name) }).click()
    await confirm.getByRole('button', { name: 'Ersetzen' }).click()
    await expect(page.getByRole('button', { name: /Ankommen/ }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Stundenmuster speichern' })).toBeDisabled()
  })

  test('Edge (2026-10-15): mit „Zurück zum Generator" mitgebracht — verglichen wird mit dem Standard der Gruppe', async ({ page }) => {
    const group = await createGroup('Zurück zum Generator', { unitDuration: 60 })
    await createExercise(`${TAG} Übung Zurück zum Generator`)
    // Eine Einheit im Standard-Aufbau der Gruppe (12 / 36 / 12).
    const { data: unit, error } = await admin
      .from('units')
      .insert({
        user_id: userId,
        group_id: group.id,
        name: `${group.name} Einheit`,
        total_minutes: 60,
        seed: 1,
        saved: true,
        editor_state: { mode: 'custom', expandedPosition: null },
      })
      .select('id')
      .single()
    if (error || !unit) throw new Error(`Einheit anlegen: ${error?.message}`)
    const classic = [
      ['Aufwärmen', 12],
      ['Hauptteil', 36],
      ['Cool-Down', 12],
    ] as const
    for (const [position, [name, minutes]] of classic.entries()) {
      const { error: segError } = await admin.from('unit_segments').insert({
        unit_id: unit.id,
        name,
        minutes,
        fill_mode: 'generate',
        sports: ['Turnen'],
        primary_sport: null,
        difficulties: ['Leicht', 'Mittel', 'Schwer'],
        organization_forms: [],
        planned_gap_minutes: 0,
        notes: null,
        position,
      })
      if (segError) throw new Error(`Segment anlegen: ${segError.message}`)
    }

    await page.goto(`/units/new?from=${unit.id}`)
    await expect(page.getByRole('radio', { name: 'Individuell' })).toBeChecked()
    const save = page.getByRole('button', { name: 'Stundenmuster speichern' })
    // Kein Muster geladen: Speichern ist frei.
    await expect(save).toBeEnabled()
    // Gleicht dem Standard: Zurücksetzen ohne Nachfrage.
    await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
    await expect(page.getByText('Auf Standard zurückgesetzt', { exact: true })).toBeVisible()
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    // Weicht er ab, fragt das Zurücksetzen nach.
    await page.goto(`/units/new?from=${unit.id}`)
    await page.getByRole('button', { name: /Aufwärmen/ }).first().click()
    await page.getByPlaceholder('Hinweise für dich zu diesem Abschnitt').fill('Mitgebracht und geändert')
    await page.getByRole('button', { name: 'Auf Standard zurücksetzen' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Bisherigen Zeitverlauf ersetzen?')
  })

  test('AC: ein Muster umbenennen und löschen', async ({ page }) => {
    const name = `${TAG} Alter Name`
    const newName = `${TAG} Neuer Name`
    await createPattern(name, 60, [patternSegment('Hauptteil', 60)])

    await page.goto('/manage?tab=patterns')
    await page.getByRole('button', { name: `Aktionen für ${name}` }).click()
    await page.getByRole('menuitem', { name: 'Umbenennen' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill(newName)
    await dialog.getByRole('button', { name: 'Umbenennen' }).click()
    await expect(patternRow(page, newName)).toBeVisible()

    await page.getByRole('button', { name: `Aktionen für ${newName}` }).click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('Einheiten, die mit dem Muster entstanden sind, bleiben')
    await confirm.getByRole('button', { name: 'Löschen' }).click()
    await expect(confirm).toBeHidden()
    await expect(patternRow(page, newName)).toHaveCount(0)
  })
})
