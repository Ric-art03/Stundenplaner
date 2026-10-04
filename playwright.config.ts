import { defineConfig, devices } from '@playwright/test'
import path from 'node:path'

const STORAGE_STATE = path.join(__dirname, 'tests', '.auth', 'user.json')

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Meldet einen Testnutzer an und legt den Sitzungszustand ab.
    { name: 'setup', testMatch: /auth\.setup\.ts/ },

    // Tests ohne Anmeldung — prüfen die Weiterleitung auf den Login.
    {
      name: 'abgemeldet',
      testMatch: /.*\.anon\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // Alles Übrige läuft angemeldet. Ohne das prüften die Tests nur, dass
    // geschützte Seiten auf /login umleiten.
    {
      name: 'chromium',
      testIgnore: /.*\.anon\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      testIgnore: /.*\.anon\.spec\.ts/,
      use: { ...devices['iPhone 13'], storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
