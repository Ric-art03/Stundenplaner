import { test, expect } from '@playwright/test'

/**
 * Datentrennung ohne Anmeldung. Diese Tests laufen bewusst **ohne**
 * Sitzungszustand (Projekt „abgemeldet" in playwright.config.ts).
 */

test.describe('PROJ-6 — Zugriff ohne Anmeldung', () => {
  for (const route of ['/units', '/units/new']) {
    test(`AC: ${route} leitet nicht angemeldete Nutzer zum Login`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    })
  }

  test('AC: eine konkrete Einheit ist ohne Anmeldung nicht erreichbar', async ({ page }) => {
    // Eine beliebige, gültig geformte Kennung — es darf weder die Einheit
    // noch ein Hinweis auf ihre Existenz erscheinen.
    await page.goto('/units/00000000-0000-0000-0000-000000000000')
    await expect(page).toHaveURL(/\/login/)
  })

  test('AC: der Generator gibt ohne Anmeldung keine Gruppendaten preis', async ({ page }) => {
    const response = await page.goto('/units/new')
    expect(page.url()).toMatch(/\/login/)

    const body = (await response?.text()) ?? ''
    // Keine Spur von Gruppen-, Übungs- oder Hallennamen im ausgelieferten HTML.
    expect(body).not.toContain('Vorschulturnen')
    expect(body).not.toContain('Capoeira')
    expect(body).not.toContain('Turnhalle')
  })
})
