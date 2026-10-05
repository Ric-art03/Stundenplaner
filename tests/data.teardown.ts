import { test as teardown } from '@playwright/test'
import { adminClient, cleanup, testUserId, TEST_EMAIL } from './fixtures'

/**
 * Räumt den Grundbestand des Testkontos weg — **einmal je Durchlauf**,
 * nachdem alle Tests durch sind. Die echten Daten des Entwicklers bleiben
 * unangetastet: Es hängt alles am Testkonto, und Übungen werden zusätzlich
 * über ihre Markierung eingegrenzt.
 */
teardown('Grundbestand aufräumen', async () => {
  const admin = adminClient()
  const userId = await testUserId(admin, TEST_EMAIL)
  await cleanup(admin, userId)
})
