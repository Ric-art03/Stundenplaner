import { test, expect } from '@playwright/test'

/**
 * Die Verwaltung ohne Anmeldung. Läuft bewusst **ohne** Sitzungszustand
 * (Projekt „abgemeldet" in playwright.config.ts).
 */

test.describe('PROJ-16 — Zugriff ohne Anmeldung', () => {
  for (const route of [
    '/manage',
    '/manage?tab=patterns',
    '/manage?tab=categories',
    '/groups/venues',
    '/units/new?pattern=00000000-0000-0000-0000-000000000000',
  ]) {
    test(`AC: ${route} leitet zur Anmeldung`, async ({ page }) => {
      await page.goto(route)
      await expect(page).toHaveURL(/\/login/)
    })
  }
})
