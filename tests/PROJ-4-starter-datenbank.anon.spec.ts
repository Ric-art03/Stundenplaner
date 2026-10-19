import { test, expect } from '@playwright/test'

/**
 * PROJ-4 ohne Anmeldung: die Übungsdatenbank und ihre Leseansicht sind
 * geschützte Seiten wie alle anderen.
 */

test('AC: ohne Anmeldung führt die Übungsdatenbank zur Anmeldung', async ({ page }) => {
  await page.goto('/exercises?tab=library')
  await expect(page).toHaveURL(/\/login/)
})

test('AC: ohne Anmeldung führt die Leseansicht einer Übung zur Anmeldung', async ({ page }) => {
  await page.goto('/exercises/library/00000000-0000-4000-8000-000000000000')
  await expect(page).toHaveURL(/\/login/)
})
