import { test, expect } from '@playwright/test'
import { adminClient, cleanup, seed, testUserId, type Fixtures } from './fixtures'
import { TEST_EMAIL } from './auth.setup'

/**
 * E2E-Tests für PROJ-6 gegen die Akzeptanzkriterien der Spec.
 *
 * Laufen angemeldet (siehe auth.setup.ts) gegen ein eigenes Testkonto mit
 * eigens angelegten Daten — die echten Übungen und Einheiten des Entwicklers
 * werden nie angefasst.
 */

const admin = adminClient()
let userId: string
let fixtures: Fixtures

test.beforeAll(async () => {
  userId = await testUserId(admin, TEST_EMAIL)
  fixtures = await seed(admin, userId)
})

test.afterAll(async () => {
  await cleanup(admin, userId)
})

/** Vor jedem Test die Einheiten leeren, damit die Tests sich nicht beeinflussen. */
test.beforeEach(async () => {
  await admin.from('units').delete().eq('user_id', userId)
})

async function generateStandardUnit(page: import('@playwright/test').Page) {
  await page.goto(`/units/new?group=${fixtures.groupId}`)
  await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
  await page.getByRole('button', { name: /Einheit generieren/ }).click()
  await page.waitForURL(/\/units\/[0-9a-f-]{36}$/)
}

test.describe('PROJ-6 — Generieren und Entwurf', () => {
  test('AC: Gruppe ist über ?group= vorausgefüllt und „Standard" ist gewählt', async ({ page }) => {
    await page.goto(`/units/new?group=${fixtures.groupId}`)
    await expect(page.getByText(fixtures.groupName).first()).toBeVisible()
    // „Standard" ist vorausgewählt, der Zeitverlauf also zu.
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Einheit generieren/ })).toBeEnabled()
  })

  test('AC: Generieren führt zum Stundenverlauf als Entwurf', async ({ page }) => {
    await generateStandardUnit(page)
    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Einheit speichern' })).toBeVisible()
  })

  test('AC: Standard ergibt bei 60 Minuten die Segmente 12 / 36 / 12', async ({ page }) => {
    await generateStandardUnit(page)
    await expect(page.getByRole('heading', { name: 'Aufwärmen' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hauptteil' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cool-Down' })).toBeVisible()
    await expect(page.getByText('36 Min')).toBeVisible()
  })

  test('AC: ein Entwurf erscheint nicht in „Meine Einheiten"', async ({ page }) => {
    await generateStandardUnit(page)
    await page.goto('/units')
    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()
  })

  test('AC: erneutes Generieren hinterlässt nur einen Entwurf', async ({ page }) => {
    await generateStandardUnit(page)
    await generateStandardUnit(page)

    const { count } = await admin
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('saved', false)

    expect(count).toBe(1)
  })
})

test.describe('PROJ-6 — Speichern, Benennen, Löschen', () => {
  test('AC: „Einheit speichern" öffnet einen Dialog mit vorausgefülltem Namen', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const field = dialog.getByLabel('Name')
    await expect(field).toHaveValue(new RegExp(fixtures.groupName))
  })

  test('AC: der geänderte Name gilt in der Übersicht', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Eigener Einheitenname')
    await dialog.getByRole('button', { name: 'Speichern' }).click()

    await expect(page.getByText('Gespeichert')).toBeVisible()
    await page.goto('/units')
    await expect(page.getByText('Eigener Einheitenname')).toBeVisible()
  })

  test('AC: Abbrechen lässt die Einheit ein Entwurf bleiben', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click()

    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    await page.goto('/units')
    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()
  })

  test('AC: Umbenennen über das Karten-Menü wirkt in der Übersicht', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert')).toBeVisible()

    await page.goto('/units')
    await page.getByRole('button', { name: /Aktionen für/ }).first().click()
    await page.getByRole('menuitem', { name: 'Umbenennen' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Umbenannte Einheit')
    await dialog.getByRole('button', { name: 'Umbenennen' }).click()

    await expect(page.getByText('Umbenannte Einheit')).toBeVisible()
  })

  test('AC: Löschen entfernt die Einheit, die Übungen bleiben', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert')).toBeVisible()

    await page.goto('/units')
    await page.getByRole('button', { name: /Aktionen für/ }).first().click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    await page.getByRole('button', { name: 'Endgültig löschen' }).click()

    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()

    const { count } = await admin
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
    expect(count).toBe(6)
  })
})

test.describe('PROJ-6 — Zurück zum Generator', () => {
  test('AC: der Bedienstand „Standard" wird wiederhergestellt', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('link', { name: /Zurück zum Generator/ }).click()

    await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
    // Mit „Standard" erzeugt → der Zeitverlauf bleibt zu.
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
  })

  test('AC: auch aus „Meine Einheiten" heraus greift der Bedienstand', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert')).toBeVisible()

    // Über die Übersicht statt direkt aus dem Generator.
    await page.goto('/units')
    await page.getByRole('link', { name: new RegExp(fixtures.groupName) }).first().click()
    await page.getByRole('link', { name: /Zurück zum Generator/ }).click()

    await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
  })
})

test.describe('PROJ-6 — Neu generieren', () => {
  test('AC: aus einer gespeicherten Einheit entsteht ein Entwurf daneben', async ({ page }) => {
    await generateStandardUnit(page)
    const savedUrl = page.url()

    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert')).toBeVisible()

    await page.getByRole('button', { name: /Neu generieren/ }).click()

    // Landet auf einer anderen Einheit, und diese ist ein Entwurf.
    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    expect(page.url()).not.toBe(savedUrl)

    // Die gespeicherte Fassung steht unverändert im Ordner.
    const { count } = await admin
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('saved', true)
    expect(count).toBe(1)
  })
})

test.describe('PROJ-6 — Leerzustände', () => {
  test('AC: ohne Gruppe erscheint der Hinweis mit „Erste Gruppe anlegen"', async ({ page }) => {
    await admin.from('units').delete().eq('user_id', userId)
    await admin.from('groups').delete().eq('user_id', userId)

    await page.goto('/units/new')
    await expect(page.getByRole('link', { name: /Erste Gruppe anlegen/ })).toBeVisible()

    // Für die folgenden Tests wiederherstellen.
    fixtures = await seed(admin, userId)
  })
})
