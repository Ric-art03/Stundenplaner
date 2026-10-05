import { test, expect } from '@playwright/test'
import { adminClient, testUserId, TEST_EMAIL } from './fixtures'

/**
 * Der Leerzustand des Generators — der einzige Test, der ein Konto **ohne**
 * Gruppen braucht.
 *
 * Er räumt dafür den gesamten Bestand des Testkontos weg. Nebenläufig zu den
 * übrigen Tests wäre das verheerend: Sie verlieren mitten im Lauf ihre
 * Gruppe und ihre Einheiten. Deshalb läuft diese Datei in einem eigenen
 * Projekt („exklusiv"), das von den übrigen Projekten abhängt und damit
 * garantiert **zuletzt** startet.
 *
 * Wiederhergestellt wird nichts: Danach kommt nur noch das Projekt
 * „teardown", das ohnehin aufräumt.
 */

const admin = adminClient()

test('AC: ohne Gruppe erscheint der Hinweis mit „Erste Gruppe anlegen"', async ({ page }) => {
  const userId = await testUserId(admin, TEST_EMAIL)

  // Einheiten zuerst: Sie verweisen auf die Gruppen.
  await admin.from('units').delete().eq('user_id', userId)
  await admin.from('groups').delete().eq('user_id', userId)

  await page.goto('/units/new')
  await expect(page.getByRole('link', { name: /Erste Gruppe anlegen/ })).toBeVisible()
})
