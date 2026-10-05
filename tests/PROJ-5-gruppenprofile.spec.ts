import { test, expect } from '@playwright/test'

// NOTE: These E2E tests require a running dev server with a valid Supabase connection
// and a logged-in test user. For local testing, ensure:
// 1. Dev server is running (npm run dev)
// 2. .env.local has valid Supabase credentials
// 3. A test user is logged in (tests assume auth is handled via (protected) layout)
//
// The tests are written against the acceptance criteria in features/PROJ-5-gruppenprofile.md.

test.describe('Gruppenprofile - Übersichtsseite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/groups')
  })

  test('AC: Übersichtsseite zeigt Gruppen oder Empty State', async ({ page }) => {
    const hasGroups = await page.locator('[class*="grid"]').count() > 0
    const hasEmptyState = await page.getByText('Noch keine Gruppen angelegt').count() > 0
    expect(hasGroups || hasEmptyState).toBe(true)
  })

  test('AC: Empty State zeigt Erklärung und Erste-Gruppe-Button', async ({ page }) => {
    const emptyState = page.getByText('Noch keine Gruppen angelegt')
    if (await emptyState.count() > 0) {
      await expect(page.getByText('Lege deine Trainingsgruppen an')).toBeVisible()
      await expect(page.getByRole('link', { name: /Erste Gruppe anlegen/ })).toBeVisible()
    }
  })

  test('AC: Neue Gruppe Button ist sichtbar', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Neue Gruppe/ })).toBeVisible()
  })

  test('AC: Hallen verwalten Link ist sichtbar', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Hallen verwalten/ })).toBeVisible()
  })

  test('AC: Neue Gruppe Button öffnet Formular', async ({ page }) => {
    await page.getByRole('link', { name: /Neue Gruppe/ }).click()
    await expect(page).toHaveURL(/\/groups\/new/)
    await expect(page.getByLabel('Name *')).toBeVisible()
  })
})

test.describe('Gruppenprofile - Formular', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/groups/new')
  })

  test('AC: Formular zeigt alle Pflichtfelder', async ({ page }) => {
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByText('Sportart *')).toBeVisible()
    await expect(page.getByText('Altersgruppe *')).toBeVisible()
    await expect(page.getByLabel('Einheitsdauer (Minuten) *')).toBeVisible()
  })

  test('AC: Validierungsfehler bei leerem Formular', async ({ page }) => {
    // Clear default unit duration
    const durationInput = page.getByLabel('Einheitsdauer (Minuten) *')
    await durationInput.clear()

    // Clear name if it has content
    const nameInput = page.getByLabel('Name *')
    await nameInput.clear()

    await page.getByRole('button', { name: /Gruppe erstellen/ }).click()

    // Validation errors should appear
    await expect(page.getByText('Name ist erforderlich')).toBeVisible()
    await expect(page.getByText('Mindestens eine Sportart')).toBeVisible()
    await expect(page.getByText('Mindestens eine Altersgruppe')).toBeVisible()
  })

  // Die Oberfläche heißt „Hallenzeit", nicht mehr „Trainingszeit".
  //
  // `exact: true` ist hier nicht Zierde: Die Kopfzeile eines Eintrags trägt
  // „Wiederkehrend", der Knopf darunter „Wiederkehrende Hallenzeit
  // hinzufügen". Ohne `exact` trifft ein Textgriff beide und Playwright
  // bricht mit einer Mehrdeutigkeit ab. Dasselbe gilt für „Einmalig" gegen
  // „Einmalige Hallenzeit hinzufügen" und für „Datum" gegen „Datum wählen".
  test('AC: Hallenzeit hinzufügen Button ist sichtbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Wiederkehrende Hallenzeit/ })).toBeVisible()
    await expect(page.getByRole('button', { name: /Einmalige Hallenzeit/ })).toBeVisible()
  })

  test('AC: Wiederkehrende Hallenzeit hinzufügen', async ({ page }) => {
    await page.getByRole('button', { name: /Wiederkehrende Hallenzeit/ }).click()
    await expect(page.getByText('Wiederkehrend', { exact: true })).toBeVisible()
    await expect(page.getByText('Wochentag', { exact: true })).toBeVisible()
  })

  test('AC: Einmalige Hallenzeit hinzufügen', async ({ page }) => {
    await page.getByRole('button', { name: /Einmalige Hallenzeit/ }).click()
    await expect(page.getByText('Einmalig', { exact: true })).toBeVisible()
    await expect(page.getByText('Datum', { exact: true })).toBeVisible()
  })

  test('AC: Hallenzeit entfernen', async ({ page }) => {
    await page.getByRole('button', { name: /Wiederkehrende Hallenzeit/ }).click()
    const badge = page.getByText('Wiederkehrend', { exact: true })
    await expect(badge).toBeVisible()

    // Der Papierkorb im Eintrag selbst. Die Auswahlfelder daneben tragen die
    // Rolle „combobox", nicht „button", und kommen hier deshalb nicht dazwischen.
    await page.locator('.border.rounded-lg').first().getByRole('button').click()

    await expect(badge).toHaveCount(0)
  })

  test('AC: Neue Halle Button öffnet Dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Neue Halle/ }).click()
    await expect(page.getByText('Neue Halle anlegen')).toBeVisible()
    await expect(page.getByLabel('Name *')).toHaveCount(2) // Group name + venue name
  })

  test('AC: Halle/Ort Dropdown ist sichtbar', async ({ page }) => {
    await expect(page.getByText('Halle / Ort')).toBeVisible()
    await expect(page.getByText('Keine Halle')).toBeVisible()
  })

  test('AC: Abbrechen Link führt zur Übersicht', async ({ page }) => {
    await page.getByRole('link', { name: 'Abbrechen' }).click()
    await expect(page).toHaveURL(/\/groups$/)
  })
})

test.describe('Gruppenprofile - Hallen verwalten', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/groups/venues')
  })

  test('AC: Hallen-Verwaltungsseite ist erreichbar', async ({ page }) => {
    await expect(page.getByText('Hallen verwalten')).toBeVisible()
  })

  test('AC: Hallen-Seite zeigt Empty State oder Hallen', async ({ page }) => {
    const hasVenues = await page.locator('.border.rounded-lg').count() > 0
    const hasEmptyState = await page.getByText('Noch keine Hallen angelegt').count() > 0
    expect(hasVenues || hasEmptyState).toBe(true)
  })

  test('AC: Neue Halle Button ist sichtbar', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Neue Halle/ })).toBeVisible()
  })

  test('AC: Zurück-Link führt zu Gruppen', async ({ page }) => {
    await page.getByRole('link', { name: /Alle Gruppen/ }).click()
    await expect(page).toHaveURL(/\/groups$/)
  })
})

test.describe('Gruppenprofile - Navigation', () => {
  test('AC: Dashboard hat Gruppen-Link', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: /Gruppen/ }).first()).toBeVisible()
  })

  test('AC: Nicht eingeloggt wird zum Login weitergeleitet', async ({ page }) => {
    // Clear auth state and try accessing protected route
    await page.context().clearCookies()
    await page.goto('/groups')
    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 })
  })
})

test.describe('Gruppenprofile - Responsive', () => {
  test('Mobile: Formular ist auf 375px nutzbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/groups/new')
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByRole('button', { name: /Gruppe erstellen/ })).toBeVisible()

    // No horizontal scroll
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('Mobile: Übersichtsseite ist auf 375px nutzbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/groups')
    await expect(page.getByText('Meine Gruppen')).toBeVisible()

    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1)
  })

  test('Tablet: Formular ist auf 768px nutzbar', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/groups/new')
    await expect(page.getByLabel('Name *')).toBeVisible()
  })
})
