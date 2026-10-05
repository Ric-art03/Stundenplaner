import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const STORAGE_STATE = path.join(__dirname, 'tests', '.auth', 'user.json')

/**
 * Normalerweise fährt Playwright seinen eigenen Chromium. Lässt der sich auf
 * einem Rechner nicht installieren — unter Windows bremst der Echtzeit-
 * Virenscan das Entpacken der tausenden Chromium-Dateien bis zur
 * Unbrauchbarkeit —, kann stattdessen ein vorhandener Browser übernehmen:
 *
 *   PLAYWRIGHT_CHANNEL=msedge npm run test:e2e
 *
 * Edge und Chrome sind beide Chromium-basiert, die Tests laufen unverändert.
 * Ohne die Variable bleibt alles beim Standard, damit nichts rechnerabhängig
 * im Repository landet.
 */
const channel = process.env.PLAYWRIGHT_CHANNEL
const browser = channel ? { channel } : {}

/**
 * Eigener Port, falls auf 3000 schon ein Entwicklungsserver läuft. Der würde
 * sonst weiterverwendet und übersetzte jede Route beim ersten Aufruf neu —
 * ein Durchlauf dauert damit ein Vielfaches.
 *
 *   PLAYWRIGHT_PORT=3100 npm run test:e2e
 */
const port = process.env.PLAYWRIGHT_PORT ?? '3000'
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests',
  // Großzügiger als die 30 Sekunden Voreinstellung: Die Tests sprechen mit
  // Supabase, und auf manchen Rechnern dauert allein das Starten eines
  // Browser-Kontexts über eine halbe Minute (Echtzeit-Virenscan). Lieber ein
  // langsamer Durchlauf als ein Fehlschlag, der nach einem Produktfehler
  // aussieht und keiner ist.
  timeout: 120_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    // Meldet einen Testnutzer an und legt den Sitzungszustand ab.
    { name: 'setup', testMatch: /auth\.setup\.ts/, use: { ...browser } },

    // Tests ohne Anmeldung — prüfen die Weiterleitung auf den Login.
    {
      name: 'abgemeldet',
      testMatch: /.*\.anon\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...browser },
    },

    // Alles Übrige läuft angemeldet. Ohne das prüften die Tests nur, dass
    // geschützte Seiten auf /login umleiten.
    {
      name: 'chromium',
      testIgnore: /.*\.anon\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...browser, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    // Auf dem Handy laufen nur die Tests, die keine Daten verändern. Die
    // PROJ-6-Tests legen Einheiten an und löschen sie wieder — liefen sie
    // zugleich in zwei Projekten gegen dasselbe Testkonto, würden sie sich
    // gegenseitig die Daten wegräumen.
    {
      name: 'Mobile Safari',
      testIgnore: [/.*\.anon\.spec\.ts/, /PROJ-6-einheiten-generator\.spec\.ts/],
      use: { ...devices['iPhone 13'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
  // Produktionsbuild statt Entwicklungsserver: Letzterer übersetzt jede Route
  // beim ersten Aufruf neu, was einen Durchlauf von Minuten auf Sekunden
  // Rechenzeit je Seitenwechsel aufbläht. Nebenbei wird damit geprüft, was
  // tatsächlich ausgeliefert wird. Läuft bereits ein Server auf dem Port,
  // wird er weiterverwendet.
  webServer: {
    command: `npm run build && npx next start -p ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
