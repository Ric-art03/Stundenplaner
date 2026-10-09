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
 * Für Geräteprofile, die von sich aus **WebKit** verlangen (`iPhone 13` setzt
 * `defaultBrowserType: 'webkit'`).
 *
 * Ein `channel` allein genügt dort nicht: Playwright wählt den Browser weiter
 * über `defaultBrowserType`, sucht also WebKit und bricht ab, wenn es nicht
 * installiert ist („Executable doesn't exist at …\webkit-2248"). Der
 * Browsertyp muss deshalb mitgezogen werden.
 *
 * Der Ersatzweg prüft die Mobilbreite damit in einem Chromium-Motor statt in
 * WebKit — weniger aussagekräftig als echtes Safari, aber ungleich besser als
 * 36 Tests, die stillschweigend gar nicht laufen. Ohne die Variable bleibt es
 * bei WebKit.
 */
const mobileBrowser = channel ? { channel, browserName: 'chromium' as const } : {}

/**
 * Eigener Port, falls auf 3000 schon ein Entwicklungsserver läuft. Der würde
 * sonst weiterverwendet und übersetzte jede Route beim ersten Aufruf neu —
 * ein Durchlauf dauert damit ein Vielfaches.
 *
 *   PLAYWRIGHT_PORT=3100 npm run test:e2e
 */
const port = process.env.PLAYWRIGHT_PORT ?? '3000'

/** Die Tests des Einheiten-Editors — sie laufen in einer eigenen Stufe, siehe unten. */
const EDITOR_TESTS = /PROJ-7-.*\.spec\.ts/
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests',
  // Großzügiger als die 30 Sekunden Voreinstellung: Die Tests sprechen mit
  // Supabase, und auf manchen Rechnern dauert allein das Starten eines
  // Browser-Kontexts über eine halbe Minute (Echtzeit-Virenscan). Lieber ein
  // langsamer Durchlauf als ein Fehlschlag, der nach einem Produktfehler
  // aussieht und keiner ist.
  timeout: 120_000,
  /**
   * Dasselbe Zugeständnis für die **Zusicherungen**. Ohne das blieb es bei
   * den 5 Sekunden der Voreinstellung, während der Test selbst 120 bekam —
   * eine Navigation, die unter der Last zweier gleichzeitig laufender
   * Browser-Projekte 6 Sekunden braucht, scheiterte damit an einem Fenster,
   * das 24-mal kleiner war als das des Tests. Genau so fiel
   * ‚Abbrechen-Link führt zurück zur Übersichtsseite‘ in Lauf 3 **und** 4:
   * Der Seitenabzug zeigt den Link geklickt und fokussiert, nur die Adresse
   * kam zu spät.
   */
  expect: { timeout: 15_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    // Meldet den Testnutzer an, legt den Sitzungszustand ab und baut den
    // Grundbestand des Testkontos auf. Beides einmal je Durchlauf, bevor
    // irgendein Test läuft; aufgeräumt wird danach im Projekt „teardown".
    {
      name: 'setup',
      testMatch: /(auth|data)\.setup\.ts/,
      teardown: 'teardown',
      use: { ...browser },
    },

    // Entfernt den Grundbestand, nachdem alle Tests durch sind.
    { name: 'teardown', testMatch: /data\.teardown\.ts/ },

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
      testIgnore: [/.*\.anon\.spec\.ts/, /.*\.exklusiv\.spec\.ts/, EDITOR_TESTS],
      use: { ...devices['Desktop Chrome'], ...browser, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },
    // Auf dem Handy laufen nur die Tests, die keine Daten verändern. Die
    // PROJ-6-Tests legen Einheiten an und löschen sie wieder — liefen sie
    // zugleich in zwei Projekten gegen dasselbe Testkonto, würden sie sich
    // gegenseitig die Daten wegräumen.
    //
    // `...mobileBrowser` steht **nach** dem Gerät und zieht beim Ersatzweg
    // auch den Browsertyp mit — sonst sucht Playwright weiter WebKit und
    // dieses Projekt fällt vollständig aus, samt der Prüfung auf Mobilbreite.
    {
      name: 'Mobile Safari',
      testIgnore: [
        /.*\.anon\.spec\.ts/,
        /.*\.exklusiv\.spec\.ts/,
        /PROJ-6-einheiten-generator\.spec\.ts/,
        EDITOR_TESTS,
      ],
      use: { ...devices['iPhone 13'], ...mobileBrowser, storageState: STORAGE_STATE },
      dependencies: ['setup'],
    },

    // Der Editor (PROJ-7) in einer eigenen Stufe, **nach** den übrigen Tests.
    // Er arbeitet an fertig aufgebauten, gespeicherten Einheiten — und die
    // stünden sonst in „Meine Einheiten", während die PROJ-6-Tests dort den
    // Leerzustand erwarten. Jedes der beiden Projekte hat seine eigene Gruppe,
    // seine eigenen Übungen und je Test eine eigene Einheit; nebeneinander
    // dürfen sie deshalb laufen.
    {
      name: 'editor',
      testMatch: EDITOR_TESTS,
      use: { ...devices['Desktop Chrome'], ...browser, storageState: STORAGE_STATE },
      dependencies: ['chromium', 'Mobile Safari', 'abgemeldet'],
    },
    {
      name: 'editor mobil',
      testMatch: EDITOR_TESTS,
      use: { ...devices['iPhone 13'], ...mobileBrowser, storageState: STORAGE_STATE },
      dependencies: ['chromium', 'Mobile Safari', 'abgemeldet'],
    },

    // Tests, die den Bestand des Testkontos leerräumen und deshalb niemanden
    // neben sich dulden. Über `dependencies` laufen sie garantiert erst,
    // wenn alle übrigen Projekte durch sind.
    {
      name: 'exklusiv',
      testMatch: /.*\.exklusiv\.spec\.ts/,
      use: { ...devices['Desktop Chrome'], ...browser, storageState: STORAGE_STATE },
      dependencies: ['chromium', 'Mobile Safari', 'abgemeldet', 'editor', 'editor mobil'],
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
