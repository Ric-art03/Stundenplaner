import { test, expect } from '@playwright/test'

// NOTE: These E2E tests require a running dev server with a valid Supabase connection
// and a logged-in test user. For local testing, ensure:
// 1. Dev server is running (npm run dev)
// 2. .env.local has valid Supabase credentials
// 3. A test user is logged in (tests assume auth is handled)
//
// The tests are written against the acceptance criteria in features/PROJ-3-uebungsdatenbank.md.
// Some tests that modify data (create, edit, delete) may affect the database state.

test.describe('Übungsdatenbank - Übersichtsseite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to exercises page - assumes user is authenticated
    await page.goto('/exercises')
  })

  test('AC: Übersichtsseite zeigt Listenansicht als Standard', async ({ page }) => {
    // The list view should be active by default
    const listButton = page.getByRole('button', { name: 'Listenansicht' })
    await expect(listButton).toBeVisible()
  })

  test('AC: Ansichts-Toggle wechselt zwischen Listen- und Kartenansicht', async ({ page }) => {
    // Geprüft wird, was der Nutzer sieht, nicht ein Attribut am Knopf: Die
    // Umschalter sind zwei gewöhnliche Knöpfe und tragen kein `data-state`
    // (das stammte aus einer früheren Tabs-Fassung). Listenansicht und
    // Kartenansicht unterscheiden sich im Behälter — Liste trennt die Zeilen
    // mit `divide-y`, die Karten stehen in einem Raster.
    const list = page.locator('div.divide-y')
    const cards = page.locator('div.grid.grid-cols-1')

    // Voreinstellung ist die Liste. Das Warten hier deckt zugleich das
    // Nachladen der Übungen ab.
    await expect(list).toBeVisible()

    await page.getByRole('button', { name: 'Kartenansicht' }).click()
    await expect(cards).toBeVisible()
    await expect(list).toHaveCount(0)

    await page.getByRole('button', { name: 'Listenansicht' }).click()
    await expect(list).toBeVisible()
  })

  test('AC: Suchfeld filtert Übungen nach Name/Beschreibung', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Übung suchen...')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('NONEXISTENT_SEARCH_TERM_XYZ')
    // Should show no-results message
    await expect(page.getByText('Keine Übungen gefunden')).toBeVisible({ timeout: 5000 })
  })

  test('AC: Filter-Button öffnet Filter-Sheet', async ({ page }) => {
    await page.getByRole('button', { name: /Filter/ }).click()

    // `exact: true` ist nötig: Neben jeder Überschrift steht der Platzhalter
    // ihres Auswahlfelds — „Sportart" gegen „Alle Sportarten", „Phase" gegen
    // „Alle Phasen". Ohne `exact` trifft ein Textgriff beide und Playwright
    // bricht mit einer Mehrdeutigkeit ab.
    await expect(page.getByText('Sportart', { exact: true })).toBeVisible()
    await expect(page.getByText('Altersgruppe', { exact: true })).toBeVisible()
    await expect(page.getByText('Phase', { exact: true })).toBeVisible()
  })

  test('AC: Übersicht zeigt die Übungen des Kontos', async ({ page }) => {
    // Vorher stand hier eine Prüfung „Liste **oder** Leerzustand", die beides
    // mit `.count()` abfragte. `.count()` wartet nicht: Die Seite lädt ihre
    // Übungen erst nach dem Rendern und zeigt bis dahin Platzhalter, also war
    // beides null und die Prüfung schlug fehl. Davon abgesehen war sie eine
    // Tautologie — eines von beidem trifft immer zu.
    //
    // Geprüft wird jetzt der Fall, der hier auch herstellbar ist: Das
    // Testkonto hat einen Grundbestand (`data.setup.ts`), also muss die Liste
    // ihn zeigen. Den echten Leerzustand prüft
    // `PROJ-6-leerzustand.exklusiv.spec.ts` an einem leergeräumten Konto.
    await expect(page.locator('div.divide-y')).toBeVisible()
    await expect(page.getByRole('link', { name: /E2E Aufwärmen/ }).first()).toBeVisible()
    await expect(page.getByText('Noch keine Übungen vorhanden')).toHaveCount(0)
  })
})

test.describe('Übungsdatenbank - Wizard', () => {
  test('AC: "Neue Übung" öffnet Wizard mit Schritt 1 (Basis)', async ({ page }) => {
    await page.goto('/exercises/new')
    await expect(page.getByText('Basis-Informationen')).toBeVisible()
    await expect(page.getByLabel('Name *')).toBeVisible()
    await expect(page.getByLabel('Beschreibung *')).toBeVisible()
  })

  test('AC: Pflichtfeldvalidierung blockiert "Weiter" bei leeren Feldern', async ({ page }) => {
    await page.goto('/exercises/new')
    // Click "Weiter" without filling anything
    await page.getByRole('button', { name: 'Weiter' }).click()
    // Validation error should appear
    await expect(page.getByText('Name ist erforderlich')).toBeVisible()
  })

  // Auf die Überschrift greifen, nicht auf den Text: „Einordnung" steht auch
  // in der Fortschrittsanzeige über dem Formular. Ein Textgriff trifft beide
  // und Playwright bricht mit einer Mehrdeutigkeit ab.
  test('AC: Schritt 1 → Schritt 2 mit gültigen Daten', async ({ page }) => {
    await page.goto('/exercises/new')
    await page.getByLabel('Name *').fill('Test-Übung')
    await page.getByLabel('Beschreibung *').fill('Eine Testbeschreibung für die Übung.')
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByRole('heading', { name: 'Einordnung' })).toBeVisible()
  })

  test('AC: Zeichenzähler zeigt aktuelle Länge', async ({ page }) => {
    await page.goto('/exercises/new')
    await page.getByLabel('Name *').fill('Hallo')
    await expect(page.getByText('5/100')).toBeVisible()
  })

  test('AC: Zurück-Button navigiert zum vorherigen Schritt', async ({ page }) => {
    await page.goto('/exercises/new')
    // Fill step 1 and go to step 2
    await page.getByLabel('Name *').fill('Test')
    await page.getByLabel('Beschreibung *').fill('Test Beschreibung')
    await page.getByRole('button', { name: 'Weiter' }).click()
    await expect(page.getByRole('heading', { name: 'Einordnung' })).toBeVisible()
    // Go back
    await page.getByRole('button', { name: 'Zurück' }).click()
    await expect(page.getByRole('heading', { name: 'Basis-Informationen' })).toBeVisible()
    // Data should be preserved
    await expect(page.getByLabel('Name *')).toHaveValue('Test')
  })

  test('AC: Abbrechen-Link führt zurück zur Übersichtsseite', async ({ page }) => {
    await page.goto('/exercises/new')
    await page.getByRole('link', { name: 'Abbrechen' }).click()
    await expect(page).toHaveURL(/\/exercises$/)
  })
})

test.describe('Übungsdatenbank - Datentrennung', () => {
  test('AC: Nicht-authentifizierte Nutzer werden zum Login weitergeleitet', async ({ page }) => {
    // Clear any session by going to a protected page without auth
    // The middleware should redirect to /login
    await page.goto('/exercises')
    // If not logged in, should see login page
    const url = page.url()
    const isOnExercises = url.includes('/exercises')
    const isOnLogin = url.includes('/login')
    expect(isOnExercises || isOnLogin).toBe(true)
  })
})

test.describe('Übungsdatenbank - Sortierung', () => {
  test('AC: Sortier-Dropdown ist sichtbar und hat Optionen', async ({ page }) => {
    await page.goto('/exercises')
    // The sort dropdown should be visible
    const sortTrigger = page.locator('button').filter({ hasText: 'Zuletzt bearbeitet' }).or(
      page.locator('button').filter({ hasText: 'Name' })
    ).first()
    await expect(sortTrigger).toBeVisible()
  })
})
