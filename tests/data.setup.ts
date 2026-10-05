import { test as setup } from '@playwright/test'
import { adminClient, seed, testUserId, TEST_EMAIL } from './fixtures'

/**
 * Legt den Grundbestand des Testkontos an: **einmal je Durchlauf**, bevor
 * irgendein Test läuft.
 *
 * Vorher baute jede Spec-Datei ihren Bestand selbst auf und riss ihn danach
 * ab. Weil alle Dateien und beide Browser-Projekte sich **ein** Testkonto
 * teilen und bei `fullyParallel: true` gleichzeitig laufen, zog ein solcher
 * Abriss den nebenläufigen Tests die Daten unter den Füßen weg. Aufgeräumt
 * wird deshalb zentral in `data.teardown.ts`.
 */
setup('Grundbestand anlegen', async () => {
  const admin = adminClient()
  const userId = await testUserId(admin, TEST_EMAIL)
  await seed(admin, userId)
})
