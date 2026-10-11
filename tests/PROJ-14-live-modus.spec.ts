import { test, expect, type Page } from '@playwright/test'
import { adminClient, testUserId, TEST_EMAIL } from './fixtures'
import { buildUnit, type BuiltUnit, type SegmentLayout } from './editor-fixtures'
import {
  akte,
  cleanupLive,
  elapse,
  KREIS_DESCRIPTION,
  KREIS_NOTE,
  makeExercise,
  makeVariant,
  MATTE_DESCRIPTION,
  MIN,
  MUSIC_LINK,
  patchAkte,
  seedLive,
  VARIANT_DESCRIPTION,
  VARIANT_TITLE,
  warteliste,
  type LiveFixtures,
} from './live-fixtures'

/**
 * E2E-Tests für PROJ-14 (Live-Modus) gegen die Akzeptanzkriterien der Spec,
 * einschließlich der Änderungen nach den Durchsichten des Nutzers vom
 * 2026-10-11.
 *
 * Jeder Test baut sich **seine eigene Einheit**. Zeit vergeht nicht durch
 * Warten, sondern indem die festgehaltenen Zeitpunkte der Stundenakte
 * zurückgerückt werden (`elapse`) — für die App dasselbe wie ein gesperrtes
 * Handy, und genau der Weg, den sie in der Halle geht.
 */

const admin = adminClient()
let userId: string
let fx: LiveFixtures

test.beforeAll(async ({}, testInfo) => {
  userId = await testUserId(admin, TEST_EMAIL)
  fx = await seedLive(admin, userId, testInfo.project.name)
})

test.afterAll(async ({}, testInfo) => {
  await cleanupLive(admin, userId, testInfo.project.name)
})

// Nacheinander in einem Arbeiter: die Tests teilen sich Gruppe und Übungen.
test.describe.configure({ mode: 'default' })

// ---- Helfer ----

/** Kreisfangen 8 · Mattenrutschen 6 | Ruhekreis 5 · freie Zeit 5 — zwei Phasen, 24 Minuten. */
function plan(): SegmentLayout[] {
  return [
    {
      name: 'Aufwärmen',
      minutes: 14,
      notes: 'Ruhig beginnen.',
      items: [
        { exerciseId: fx.kreis, minutes: 8 },
        { exerciseId: fx.matte, minutes: 6 },
      ],
    },
    {
      name: 'Hauptteil',
      minutes: 10,
      plannedGapMinutes: 5,
      notes: 'Trinkpause einplanen.',
      items: [{ exerciseId: fx.ruhe, minutes: 5 }],
    },
  ]
}

async function build(segments: SegmentLayout[] = plan(), saved = true): Promise<BuiltUnit> {
  return buildUnit(admin, userId, fx, segments, { saved })
}

async function openUnit(page: Page, unit: BuiltUnit) {
  await page.goto(`/units/${unit.id}`)
  await expect(page.getByRole('heading', { name: unit.name })).toBeVisible()
}

const startButton = (page: Page) => page.getByRole('button', { name: 'Stunde starten', exact: true })
const goButton = (page: Page) => page.getByRole('button', { name: /Los geht/ })
const timer = (page: Page) => page.getByRole('timer')
const controls = (page: Page) => page.getByRole('navigation', { name: 'Bedienung' })
const upcoming = (page: Page) => page.locator('section[aria-labelledby="live-kommend"]')
const standing = (page: Page) => page.locator('header p').first()

/** Bis zum Bereitschaftsbild. */
async function ready(page: Page, segments?: SegmentLayout[]): Promise<BuiltUnit> {
  const unit = await build(segments)
  await openUnit(page, unit)
  await startButton(page).click()
  await expect(page).toHaveURL(/\/live$/)
  await expect(goButton(page)).toBeVisible()
  return unit
}

/** Bis in den ersten Schritt. */
async function running(page: Page, segments?: SegmentLayout[]): Promise<BuiltUnit> {
  const unit = await ready(page, segments)
  await goButton(page).click()
  await expect(timer(page)).toBeVisible()
  return unit
}

/**
 * Tippt einen Knopf der Bedienleiste. Vorher vergehen drei Sekunden: ein
 * Schritt, der unter zwei Sekunden offen war, gilt als ausgelassen.
 */
async function tap(page: Page, name: string, afterMs = 3000) {
  await elapse(page, afterMs)
  await controls(page).getByRole('button', { name, exact: true }).click()
}

async function menu(page: Page, item: string | RegExp) {
  await page.getByRole('button', { name: 'Menü' }).click()
  await page.getByRole('menuitem', { name: item }).click()
}

/** Geht die ganze Stunde durch bis in die Zusammenfassung. */
async function finishAll(page: Page) {
  for (;;) {
    const last = await controls(page).getByRole('button', { name: 'Stunde beenden' }).count()
    await tap(page, last ? 'Stunde beenden' : 'Weiter')
    if (last) break
  }
  await expect(page.getByText('Stunde beendet')).toBeVisible()
}

async function runsOf(unit: BuiltUnit) {
  const { data } = await admin
    .from('unit_runs')
    .select('id, note, actual_seconds, started_at')
    .eq('unit_id', unit.id)
    .order('started_at', { ascending: false })
  return data ?? []
}

async function stepsOf(runId: string) {
  const { data } = await admin
    .from('unit_run_steps')
    .select('position, name, status, actual_seconds, exercise_id, variant_id, adopted_note, adopted_duration')
    .eq('run_id', runId)
    .order('position')
  return data ?? []
}

/** Wartet, bis die Durchführung in der Datenbank steht, und gibt sie zurück. */
async function savedRun(unit: BuiltUnit) {
  await expect.poll(async () => (await runsOf(unit)).length, { timeout: 30_000 }).toBe(1)
  return (await runsOf(unit))[0]
}

/**
 * Wartet, bis auch das **Gerät** weiß, dass die Durchführung gespeichert ist —
 * die Zeile steht einen Augenblick früher in der Datenbank, als die Antwort
 * beim Browser ankommt.
 */
async function synced(page: Page, unit: BuiltUnit) {
  const run = await savedRun(unit)
  await expect.poll(async () => (await warteliste(page)).length, { timeout: 30_000 }).toBe(0)
  return run
}

/** Stunde durchlaufen, „Fertig", Durchführung an der Einheit aufklappen. */
async function completedRun(page: Page, segments?: SegmentLayout[]) {
  const unit = await running(page, segments)
  await finishAll(page)
  const run = await synced(page, unit)
  await page.getByRole('button', { name: 'Fertig' }).click()
  await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
  await page.getByRole('region', { name: 'Durchführungen' }).getByRole('button').first().click()
  return { unit, run }
}

// ============================================================
// Start und Bereitschaftsbild
// ============================================================

test.describe('Start und Bereitschaftsbild', () => {
  test('AC: „Stunde starten" steht an der gespeicherten Einheit in der Leseansicht, nicht im Bearbeiten-Modus', async ({ page }) => {
    const unit = await build()
    await openUnit(page, unit)
    await expect(startButton(page)).toBeVisible()

    await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click()
    await expect(page.getByRole('region', { name: 'Offene Änderungen' })).toBeVisible()
    await expect(startButton(page)).toHaveCount(0)
  })

  test('AC: an einem Entwurf gibt es keinen Knopf „Stunde starten"', async ({ page }) => {
    const unit = await build(plan(), false)
    await openUnit(page, unit)
    await expect(page.getByRole('button', { name: 'Einheit speichern' })).toBeVisible()
    await expect(startButton(page)).toHaveCount(0)
  })

  test('AC: die Stunde lässt sich aus der Einheiten-Übersicht starten', async ({ page }) => {
    const unit = await build()
    await page.goto('/units')
    await page.getByRole('button', { name: `Stunde starten: ${unit.name}` }).click()
    await expect(page).toHaveURL(/\/live$/)
    await expect(page.getByRole('heading', { name: unit.name })).toBeVisible()
  })

  test('AC: das Bereitschaftsbild zeigt Name, Gruppe, Halle und Gesamtdauer, und es läuft noch keine Zeit', async ({ page }) => {
    const unit = await ready(page)

    await expect(page.getByRole('heading', { name: unit.name })).toBeVisible()
    await expect(page.getByText(`${fx.groupName} · 12 TN`)).toBeVisible()
    await expect(page.getByText('keine Halle hinterlegt')).toBeVisible()
    await expect(page.getByText('24 Min', { exact: true })).toBeVisible()

    const session = await akte(page)
    expect(session.run.phase).toBe('ready')
    expect(session.run.startedAt).toBeNull()
    await expect(timer(page)).toHaveCount(0)
  })

  test('AC: Material steht je Art einmal mit dem größten gleichzeitigen Bedarf, „pro Teilnehmer" ist ausgerechnet', async ({ page }) => {
    await ready(page)
    const list = page.getByRole('region', { name: 'Material bereitlegen' }).getByRole('listitem')

    // 4 Hütchen bei Kreisfangen, 6 bei Mattenrutschen → einmal, mit 6.
    await expect(list.filter({ hasText: 'Hütchen' })).toHaveCount(1)
    await expect(list.filter({ hasText: 'Hütchen' })).toContainText('6')
    // 1 Ball pro Teilnehmer, 12 Teilnehmer.
    await expect(list.filter({ hasText: 'Ball' })).toContainText('12')
    await expect(list.filter({ hasText: 'Bank' })).toContainText('2')
  })

  test('AC: braucht keine Übung Material, steht das ausdrücklich da', async ({ page }) => {
    await ready(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])
    await expect(page.getByText('Für diese Einheit ist kein Material nötig.')).toBeVisible()
  })

  test('AC: Musik wird mit der betroffenen Übung und einem kurzen Verweis genannt', async ({ page }) => {
    await ready(page)
    const alert = page.getByRole('alert').filter({ hasText: 'Musik wird gebraucht' })
    await expect(alert).toContainText(fx.names.kreis)

    const link = alert.getByRole('link', { name: /Musik öffnen/ })
    await expect(link).toHaveAttribute('href', MUSIC_LINK)
    await expect(link).toHaveAttribute('target', '_blank')
    await expect(link).toHaveAttribute('rel', /noopener/)
    // Nicht die ganze Adresse.
    await expect(alert).not.toContainText('example.com')
  })

  test('AC: ein Platzhalter „Übung gelöscht" wird genannt, und die Stunde lässt sich trotzdem starten', async ({ page }) => {
    await ready(page, [
      {
        minutes: 10,
        items: [
          { exerciseId: fx.ruhe, minutes: 5 },
          { exerciseId: null as unknown as string, minutes: 5 },
        ],
      },
    ])
    await expect(page.getByText('Ein Platz ist nicht besetzt')).toBeVisible()

    await goButton(page).click()
    await expect(timer(page)).toBeVisible()
  })

  test('die erste Übung steht unten als „Zuerst", nach dem Muster von „Danach"', async ({ page }) => {
    await ready(page)
    const first = upcoming(page)

    await expect(first).toContainText('Zuerst')
    await expect(first).toContainText('Aufwärmen')
    await expect(first.getByRole('heading', { name: new RegExp(fx.names.kreis) })).toBeVisible()
    await expect(first).toContainText('4× Hütchen')
    await expect(first).toContainText('Kreis / Sitzkreis')
    await expect(first).toContainText(KREIS_DESCRIPTION)
    await expect(first).toContainText(KREIS_NOTE)
    // Noch läuft kein Schritt — es gibt nichts zu vergleichen.
    await expect(first.getByText('Neu holen')).toHaveCount(0)
  })

  test('AC: wer das Bereitschaftsbild ohne „Los geht\'s" verlässt, hat keine Stunde und keine Durchführung', async ({ page }) => {
    const unit = await ready(page)
    await page.getByRole('button', { name: 'Zurück zur Einheit' }).click()

    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
    expect(await akte(page)).toBeNull()
    await expect(page.getByText('Stunde läuft')).toHaveCount(0)
    expect(await runsOf(unit)).toHaveLength(0)
  })
})

// ============================================================
// Bildschirm an
// ============================================================

test.describe('Bildschirm an', () => {
  test('AC: kann das Gerät den Bildschirm wachhalten, sagt es das Bereitschaftsbild', async ({ page }) => {
    await page.addInitScript(() => {
      const lock = { released: false, release: async () => {}, addEventListener: () => {} }
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: { request: async () => lock },
      })
    })
    await ready(page)
    await expect(page.getByText('Bildschirm bleibt während der Stunde an')).toBeVisible()
  })

  test('AC: verweigert das Gerät das Wachhalten, erscheint die Anleitung, „Erneut prüfen" wechselt die Anzeige, und die Stunde startet trotzdem', async ({ page }) => {
    await page.addInitScript(() => {
      const state = window as unknown as { __wachhaltenErlaubt?: boolean }
      const lock = { released: false, release: async () => {}, addEventListener: () => {} }
      Object.defineProperty(navigator, 'wakeLock', {
        configurable: true,
        value: {
          request: async () => {
            if (!state.__wachhaltenErlaubt) throw new DOMException('verweigert', 'NotAllowedError')
            return lock
          },
        },
      })
    })
    await ready(page)

    const guide = page.getByRole('alert').filter({ hasText: 'Dein Gerät lässt das gerade nicht zu' })
    await expect(guide).toBeVisible()
    await expect(guide.getByRole('listitem')).not.toHaveCount(0)
    await expect(page.getByText('Bildschirm bleibt während der Stunde an')).toHaveCount(0)

    // Der Nutzer hat den Energiesparmodus ausgeschaltet.
    await page.evaluate(() => {
      ;(window as unknown as { __wachhaltenErlaubt?: boolean }).__wachhaltenErlaubt = true
    })
    await guide.getByRole('button', { name: 'Erneut prüfen' }).click()
    await expect(page.getByText('Bildschirm bleibt während der Stunde an')).toBeVisible()
    await expect(guide).toHaveCount(0)
  })

  test('AC: kann das Gerät es gar nicht, startet die Stunde trotzdem und der Live-Modus weist dauerhaft darauf hin', async ({ page }) => {
    await page.addInitScript(() => {
      // Ein Gerät, das das Wachhalten nicht kennt.
      delete (Navigator.prototype as unknown as { wakeLock?: unknown }).wakeLock
    })
    await ready(page)
    await expect(page.getByText('Dein Gerät lässt das gerade nicht zu')).toBeVisible()

    await goButton(page).click()
    await expect(timer(page)).toBeVisible()
    await expect(page.getByText('Der Bildschirm kann ausgehen')).toBeVisible()
  })

  test('lässt sich der Offline-Baustein nicht einrichten, sagt es das Bereitschaftsbild — und die Stunde startet trotzdem', async ({ page }) => {
    // Zweiter Teil von BUG-23: der Hinweis blieb aus, weil der Zustand auf
    // „wird eingerichtet" stehen blieb.
    // Ein Gerät, auf dem sich der Baustein nicht anmelden lässt.
    await page.addInitScript(() => {
      navigator.serviceWorker.register = () =>
        Promise.reject(new DOMException('nicht erlaubt', 'SecurityError'))
    })
    await ready(page)

    await expect(page.getByText(/Ohne Netz lässt sich dieser Bildschirm auf deinem Gerät nicht neu laden/)).toBeVisible()
    await goButton(page).click()
    await expect(timer(page)).toBeVisible()
  })

  test('AC: ohne Speicher des Browsers warnt das Bereitschaftsbild, dass die Stunde kein Neuladen übersteht', async ({ page }) => {
    await page.addInitScript(() => {
      Storage.prototype.setItem = () => {
        throw new DOMException('gesperrt', 'SecurityError')
      }
    })
    const unit = await build()
    await openUnit(page, unit)
    await startButton(page).click()

    await expect(page.getByText('Die Stunde übersteht kein Neuladen')).toBeVisible()
    await goButton(page).click()
    await expect(timer(page)).toBeVisible()
  })
})

// ============================================================
// Der Schritt
// ============================================================

test.describe('Der Schritt', () => {
  test('AC: der aktuelle Schritt zeigt Phase und Stand, Name, Restzeit, Plandauer, Material, Organisationsform und Arbeitsnotiz', async ({ page }) => {
    await running(page)

    await expect(page.getByText('Aufwärmen · 1 von 2')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (8:00|7:5\d)/)
    await expect(page.getByText('von 8 Min')).toBeVisible()

    const current = page.locator('.overflow-y-auto > div').first()
    await expect(current).toContainText('4× Hütchen')
    await expect(current).toContainText('12× Ball')
    await expect(current).toContainText('Kreis / Sitzkreis')
    await expect(current).toContainText('Arbeitsnotiz der Übung')
    await expect(current).toContainText(KREIS_NOTE)
  })

  test('AC: die Beschreibung der aktuellen Übung ist eingeklappt, ein Tipp klappt sie auf', async ({ page }) => {
    await running(page)
    const current = page.locator('.overflow-y-auto > div').first()

    await expect(current.getByText(KREIS_DESCRIPTION)).toBeHidden()
    await current.getByRole('button', { name: 'Beschreibung' }).click()
    await expect(current.getByText(KREIS_DESCRIPTION)).toBeVisible()
  })

  test('die Arbeitsnotiz der Phase steht als Erstes und an jedem Schritt der Phase, vor Beschreibung und Arbeitsnotiz der Übung', async ({ page }) => {
    await running(page)
    const current = page.locator('.overflow-y-auto > div').first()

    for (const name of [fx.names.kreis, fx.names.matte]) {
      await expect(page.getByRole('heading', { level: 1, name })).toBeVisible()
      await expect(current).toContainText('Ruhig beginnen.')
      const text = (await current.innerText()).replace(/\s+/g, ' ')
      expect(text.indexOf('Arbeitsnotiz der Phase')).toBeGreaterThanOrEqual(0)
      expect(text.indexOf('Arbeitsnotiz der Phase')).toBeLessThan(text.indexOf('Beschreibung'))
      if (name === fx.names.kreis) {
        expect(text.indexOf('Beschreibung')).toBeLessThan(text.indexOf('Arbeitsnotiz der Übung'))
        await tap(page, 'Weiter')
      }
    }
  })

  test('AC: an einem Platz mit Variante stehen Titel und Beschreibung der Variante', async ({ page }) => {
    await running(page, [
      {
        minutes: 13,
        items: [
          { exerciseId: fx.ruhe, minutes: 5 },
          { exerciseId: fx.kreis, variantId: fx.kreisVariante, minutes: 8 },
        ],
      },
    ])

    // Schon in „Danach" …
    await expect(upcoming(page)).toContainText(VARIANT_TITLE)
    await expect(upcoming(page)).toContainText(VARIANT_DESCRIPTION)
    await expect(upcoming(page)).not.toContainText(KREIS_DESCRIPTION)

    // … und dann am laufenden Schritt.
    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(VARIANT_TITLE)
    const current = page.locator('.overflow-y-auto > div').first()
    await current.getByRole('button', { name: 'Beschreibung' }).click()
    await expect(current.getByText(VARIANT_DESCRIPTION)).toBeVisible()
  })

  test('AC: weitere Varianten lassen sich ansehen, aber nicht auswählen', async ({ page }) => {
    await running(page)
    const current = page.locator('.overflow-y-auto > div').first()

    await current.getByRole('button', { name: /Varianten \(1\)/ }).click()
    await expect(current.getByText(VARIANT_TITLE)).toBeVisible()
    await expect(current.getByRole('button', { name: VARIANT_TITLE })).toHaveCount(0)
  })

  test('AC: eine geplante Lücke wird zum Schritt „Freie Zeit" mit laufender Restzeit und der Arbeitsnotiz der Phase', async ({ page }) => {
    await running(page)
    await tap(page, 'Weiter')
    await tap(page, 'Weiter')
    await tap(page, 'Weiter')

    await expect(page.getByRole('heading', { level: 1, name: 'Freie Zeit' })).toBeVisible()
    await expect(page.getByText('von 5 Min')).toBeVisible()
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (5:00|4:5\d)/)
    await expect(page.locator('.overflow-y-auto > div').first()).toContainText('Trinkpause einplanen.')
  })

  test('AC: ein frei gelassenes Segment wird freie Zeit über seine ganze Länge', async ({ page }) => {
    await running(page, [
      { minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] },
      { name: 'Freiraum', minutes: 12, fillMode: 'empty', items: [] },
    ])
    await tap(page, 'Weiter')

    await expect(page.getByRole('heading', { level: 1, name: 'Freie Zeit' })).toBeVisible()
    await expect(page.getByText('von 12 Min')).toBeVisible()
  })

  test('AC: ein Platzhalter wird ein eigener Schritt mit Hinweis und der Plandauer des Platzes', async ({ page }) => {
    await running(page, [
      {
        minutes: 11,
        items: [
          { exerciseId: fx.ruhe, minutes: 5 },
          { exerciseId: null as unknown as string, minutes: 6 },
        ],
      },
    ])
    await expect(upcoming(page)).toContainText('Übung gelöscht')

    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: 'Übung gelöscht' })).toBeVisible()
    await expect(page.getByText('von 6 Min')).toBeVisible()
    await expect(page.getByText('der Platz wurde nicht nachbesetzt')).toBeVisible()
  })

  test('AC: am letzten Schritt steht „Ende der Stunde" und der Hauptknopf heißt „Stunde beenden"', async ({ page }) => {
    await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])

    await expect(page.getByText('Ende der Stunde')).toBeVisible()
    await expect(controls(page).getByRole('button', { name: 'Stunde beenden' })).toBeVisible()
    await expect(controls(page).getByRole('button', { name: 'Weiter', exact: true })).toHaveCount(0)
  })

  test('AC: bei 375 px und langen Texten gibt es kein waagerechtes Scrollen, Restzeit und Knöpfe bleiben beim Scrollen sichtbar', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    const long = await makeExercise(admin, userId, fx, {
      name: `Lang ${Date.now()}`,
      description: 'Ein sehr langer Beschreibungstext ohne Ende. '.repeat(40),
      workNotes: 'Eine sehr lange Arbeitsnotiz. '.repeat(30),
      materials: [
        { name: 'Weichbodenmatte', quantity: 3, mode: 'insgesamt' },
        { name: 'Seil/Springseil', quantity: 2, mode: 'pro Teilnehmer' },
        { name: 'Schwungtuch', quantity: 1, mode: 'insgesamt' },
      ],
    })
    await running(page, [
      {
        minutes: 16,
        items: [
          { exerciseId: long.id, minutes: 8 },
          { exerciseId: long.id, minutes: 8 },
        ],
      },
    ])

    const scroller = page.locator('.overflow-y-auto')
    await scroller.evaluate((element) => element.scrollTo(0, element.scrollHeight))

    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
    await expect(timer(page)).toBeInViewport()
    await expect(controls(page).getByRole('button', { name: 'Weiter', exact: true })).toBeInViewport()
    await expect(standing(page)).toBeInViewport()
  })
})

// ============================================================
// „Danach"
// ============================================================

test.describe('Die nächste Übung („Danach")', () => {
  test('AC: „Danach" zeigt Name, Dauer, Material, Organisationsform und Beschreibung, ohne dass etwas aufzuklappen ist', async ({ page }) => {
    await running(page)
    const next = upcoming(page)

    await expect(next).toContainText('Danach')
    await expect(next.getByRole('heading', { name: new RegExp(fx.names.matte) })).toBeVisible()
    await expect(next).toContainText('6 Min')
    await expect(next.getByText(MATTE_DESCRIPTION)).toBeVisible()
  })

  test('AC: „Danach" nennt, was weg kann, was zu holen ist, was sich in der Menge ändert und die neue Aufstellung — erst „Kann weg", dann „Neu holen"', async ({ page }) => {
    await running(page)
    const next = upcoming(page)

    // Kreisfangen: 4 Hütchen, 12 Bälle, Kreis → Mattenrutschen: 2 Bänke, 6 Hütchen, zwei Mannschaften.
    await expect(next.getByRole('listitem').filter({ hasText: 'Kann weg' })).toContainText('12× Ball')
    await expect(next.getByRole('listitem').filter({ hasText: 'Neu holen' })).toContainText('2× Bank')
    await expect(next.getByRole('listitem').filter({ hasText: 'Andere Menge' })).toContainText(
      '6× Hütchen (statt 4)'
    )
    await expect(next).toContainText('Neue Aufstellung')
    await expect(next).toContainText('Zwei Mannschaften (gemeinsames Spielfeld)')

    const labels = await next.getByRole('listitem').allInnerTexts()
    const at = (label: string) => labels.findIndex((text) => text.toLowerCase().includes(label))
    expect(at('kann weg')).toBeLessThan(at('neu holen'))
    expect(at('neu holen')).toBeLessThan(at('andere menge'))
  })

  test('AC: gleiches Material und gleiche Organisationsform stehen ohne Hervorhebung da', async ({ page }) => {
    await running(page, [
      {
        minutes: 16,
        items: [
          { exerciseId: fx.kreis, minutes: 8 },
          { exerciseId: fx.kreis, minutes: 8 },
        ],
      },
    ])
    const next = upcoming(page)

    await expect(next).toContainText('Bleibt:')
    await expect(next).toContainText('4× Hütchen')
    for (const label of ['Kann weg', 'Neu holen', 'Andere Menge', 'Neue Aufstellung']) {
      await expect(next.getByText(label)).toHaveCount(0)
    }
  })

  test('AC: beginnt eine neue Phase, steht sie in der Kopfleiste neben „Danach", mit ihrer Arbeitsnotiz', async ({ page }) => {
    await running(page)
    // Innerhalb der Phase: keine neue Phase, keine Arbeitsnotiz der Phase in „Danach".
    await expect(upcoming(page)).not.toContainText('Neue Phase')
    await expect(upcoming(page)).not.toContainText('Ruhig beginnen.')

    await tap(page, 'Weiter')
    await expect(upcoming(page)).toContainText('Neue Phase: Hauptteil')
    await expect(upcoming(page)).toContainText('Trinkpause einplanen.')
    await expect(upcoming(page)).toContainText('Arbeitsnotiz der Phase')
  })

  test('AC: ist der nächste Schritt freie Zeit, zeigt „Danach" sie mit Dauer und nennt das Material als „Kann weg"', async ({ page }) => {
    await running(page, [
      {
        name: 'Hauptteil',
        minutes: 13,
        plannedGapMinutes: 5,
        notes: 'Trinkpause einplanen.',
        items: [{ exerciseId: fx.matte, minutes: 8 }],
      },
    ])
    const next = upcoming(page)

    await expect(next.getByRole('heading', { name: /Freie Zeit/ })).toContainText('5 Min')
    await expect(next.getByRole('listitem').filter({ hasText: 'Kann weg' })).toContainText('2× Bank')
    // Dieselbe Phase: ihre Arbeitsnotiz steht oben am laufenden Schritt, nicht noch einmal hier.
    await expect(next).not.toContainText('Trinkpause einplanen.')
  })

  test('AC: aus freier Zeit heraus listet „Danach" Material und Organisationsform ohne Vergleich', async ({ page }) => {
    await running(page, [
      { name: 'Freiraum', minutes: 5, fillMode: 'empty', items: [] },
      { minutes: 6, items: [{ exerciseId: fx.matte, minutes: 6 }] },
    ])
    const next = upcoming(page)

    await expect(next).toContainText('Material:')
    await expect(next).toContainText('2× Bank')
    await expect(next.getByText('Neu holen')).toHaveCount(0)
    await expect(next.getByText('Neue Aufstellung')).toHaveCount(0)
  })

  test('AC: nach „Weiter" steht oben, was eben in „Danach" stand, und „Danach" zeigt die übernächste', async ({ page }) => {
    await running(page)
    await expect(upcoming(page).getByRole('heading')).toContainText(fx.names.matte)

    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await expect(upcoming(page).getByRole('heading')).toContainText(fx.names.ruhe)
  })

  test('AC: ein aufgeklappter Text ist im nächsten Schritt wieder zu', async ({ page }) => {
    await running(page)
    const current = page.locator('.overflow-y-auto > div').first()
    await current.getByRole('button', { name: 'Beschreibung' }).click()
    await expect(current.getByText(KREIS_DESCRIPTION)).toBeVisible()

    await tap(page, 'Weiter')
    await tap(page, 'Zurück')
    await expect(page.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()
    await expect(current.getByText(KREIS_DESCRIPTION)).toBeHidden()
  })
})

// ============================================================
// Zeit
// ============================================================

test.describe('Zeit', () => {
  test('AC: ein Schritt mit 8 Minuten, der seit 3 Minuten läuft, zeigt 5:00', async ({ page }) => {
    await running(page)
    await elapse(page, 3 * MIN)
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (5:00|4:5\d)/)
  })

  test('AC: bei null bleibt der Schritt stehen, die Anzeige zählt als „über" hoch', async ({ page }) => {
    await running(page)
    await elapse(page, 9 * MIN + 20_000)

    await expect(timer(page)).toHaveAttribute('aria-label', /1:2\d über der Zeit/)
    await expect(page.getByText('über', { exact: true })).toBeVisible()
    // Nichts schaltet von selbst weiter.
    await expect(page.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()
  })

  test('AC: der Gesamtstand nennt den Rückstand; unter einer Minute gilt „im Plan"', async ({ page }) => {
    await running(page)
    await expect(standing(page)).toContainText('noch 24 Min')
    await expect(standing(page)).toContainText('im Plan')

    await elapse(page, 8 * MIN + 40_000)
    await expect(standing(page)).toContainText('im Plan')

    await elapse(page, 4 * MIN)
    await expect(standing(page)).toContainText('4 Min hinter Plan')
  })

  test('AC: das Signal lässt sich stummschalten, und beim nächsten Start einer Stunde ist es weiter stumm', async ({ page }) => {
    await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])

    // Standard: an.
    const on = page.getByRole('button', { name: /Signal ist an/ })
    await expect(on).toHaveAttribute('aria-pressed', 'true')
    await on.click()
    await expect(page.getByRole('button', { name: /Signal ist stumm/ })).toHaveAttribute('aria-pressed', 'false')

    // Die Stunde verwerfen und eine neue starten.
    await menu(page, /Abbrechen/)
    await page.getByRole('alertdialog').getByRole('button', { name: 'Verwerfen' }).click()
    await expect(page).toHaveURL(/\/units\//)
    await startButton(page).click()
    await goButton(page).click()
    await expect(page.getByRole('button', { name: /Signal ist stumm/ })).toBeVisible()
  })

  test('AC: ein ausgelassener Schritt mit 6 Minuten verschiebt den Gesamtstand um 6 Minuten zugunsten des Nutzers', async ({ page }) => {
    await running(page)
    // Zehn Sekunden vor der Zeit weiter: so macht die Sekunde, die das
    // Auslassen selbst kostet, aus den sechs Minuten nicht fünf.
    await tap(page, 'Weiter', 7 * MIN + 50_000)
    await expect(standing(page)).toContainText('im Plan')

    await tap(page, 'Auslassen', 1000)
    await expect(standing(page)).toContainText('6 Min voraus')
  })
})

// ============================================================
// Bedienung
// ============================================================

test.describe('Bedienung', () => {
  test('AC: „Weiter" vor Ablauf beendet den Schritt als gemacht, „Auslassen" hält ihn als ausgelassen fest', async ({ page }) => {
    const unit = await running(page)
    await tap(page, 'Weiter', 3 * MIN)
    await tap(page, 'Auslassen', 1000)
    await expect(page.getByRole('heading', { level: 1, name: fx.names.ruhe })).toBeVisible()
    await finishAll(page)

    const steps = await stepsOf((await savedRun(unit)).id)
    expect(steps.map((step) => step.status)).toEqual(['done', 'skipped', 'done', 'done'])
    expect(steps[0].actual_seconds).toBeGreaterThanOrEqual(180)
    expect(steps[0].actual_seconds).toBeLessThan(200)
  })

  test('AC: „Zurück" öffnet den vorigen Schritt wieder, seine Zeit läuft dort weiter; am ersten Schritt ist „Zurück" nicht bedienbar', async ({ page }) => {
    await running(page)
    await expect(controls(page).getByRole('button', { name: 'Zurück' })).toBeDisabled()

    await tap(page, 'Weiter', 3 * MIN)
    await expect(controls(page).getByRole('button', { name: 'Zurück' })).toBeEnabled()
    await tap(page, 'Zurück', 1 * MIN)

    await expect(page.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()
    // Drei Minuten waren gelaufen; die Minute im zweiten Schritt zählt hier nicht.
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (5:00|4:5\d)/)
  })

  test('AC: ein ausgelassener Schritt gilt als gemacht, wenn er über „Zurück" mit „Weiter" beendet wird', async ({ page }) => {
    const unit = await running(page)
    await tap(page, 'Auslassen', 1000)
    await tap(page, 'Zurück')
    await tap(page, 'Weiter', 2 * MIN)
    await finishAll(page)

    const steps = await stepsOf((await savedRun(unit)).id)
    expect(steps[0].status).toBe('done')
  })

  test('AC: „Pause" hält Restzeit und Gesamtstand an und zeigt deutlich „Pausiert"; „Fortsetzen" läuft dort weiter', async ({ page }) => {
    await running(page)
    await tap(page, 'Pause', 2 * MIN)

    const paused = page.getByRole('dialog', { name: 'Pausiert' })
    await expect(paused).toBeVisible()
    await expect(paused).toContainText(/noch (6:00|5:5\d)/)

    // Vier Minuten Pause.
    await elapse(page, 4 * MIN)
    await expect(paused).toContainText(/noch (6:00|5:5\d)/)

    await paused.getByRole('button', { name: 'Fortsetzen' }).click()
    await expect(paused).toHaveCount(0)
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (6:00|5:5\d)/)
    await expect(standing(page)).toContainText('im Plan')
    expect((await akte(page)).run.pausedMs).toBeGreaterThanOrEqual(4 * MIN)
  })

  test('AC: „Stunde beenden" mit Bestätigung führt in die Zusammenfassung, übrige Schritte gelten als ausgelassen', async ({ page }) => {
    const unit = await running(page)
    await elapse(page, 2 * MIN)
    await menu(page, 'Stunde beenden')

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('Stunde jetzt beenden?')
    await confirm.getByRole('button', { name: 'Stunde beenden' }).click()

    await expect(page.getByText('Stunde beendet')).toBeVisible()
    await expect(page.getByText('3 Schritte ausgelassen')).toBeVisible()

    const steps = await stepsOf((await savedRun(unit)).id)
    expect(steps.map((step) => step.status)).toEqual(['done', 'skipped', 'skipped', 'skipped'])
  })

  test('im Menü steht „Live-Modus verlassen" vor „Stunde beenden"', async ({ page }) => {
    await running(page)
    await page.getByRole('button', { name: 'Menü' }).click()

    const items = await page.getByRole('menuitem').allInnerTexts()
    expect(items[0]).toContain('Live-Modus verlassen')
    expect(items[1]).toContain('Stunde beenden')
    expect(items[2]).toContain('Abbrechen')
  })

  test('AC: „Abbrechen" mit Bestätigung verwirft die Stunde — keine Akte, kein Hinweis, keine Durchführung', async ({ page }) => {
    const unit = await running(page)
    await elapse(page, 2 * MIN)
    await menu(page, /Abbrechen/)

    const confirm = page.getByRole('alertdialog')
    await expect(confirm).toContainText('Stunde abbrechen und verwerfen?')
    await confirm.getByRole('button', { name: 'Verwerfen' }).click()

    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
    expect(await akte(page)).toBeNull()
    await expect(page.getByText('Stunde läuft')).toHaveCount(0)
    expect(await warteliste(page)).toHaveLength(0)
    expect(await runsOf(unit)).toHaveLength(0)
  })
})

// ============================================================
// Robustheit
// ============================================================

test.describe('Robustheit', () => {
  test('AC: Neuladen ändert nichts — derselbe Schritt, richtige Restzeit, richtiger Gesamtstand', async ({ page }) => {
    await running(page)
    await tap(page, 'Weiter', 10 * MIN)
    await elapse(page, 2 * MIN)

    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await expect(timer(page)).toHaveAttribute('aria-label', /Restzeit (4:00|3:5\d)/)
    await expect(standing(page)).toContainText('2 Min hinter Plan')
  })

  test('AC: eine pausierte Stunde ist nach dem Neuladen weiter pausiert', async ({ page }) => {
    await running(page)
    await tap(page, 'Pause', 1 * MIN)
    await expect(page.getByRole('dialog', { name: 'Pausiert' })).toBeVisible()

    await page.reload()
    await expect(page.getByRole('dialog', { name: 'Pausiert' })).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Pausiert' })).toContainText(/noch (7:00|6:5\d)/)
  })

  test('AC: ohne Verbindung lassen sich alle Schritte bis zum Ende mit allen Inhalten durchgehen', async ({ page, context }) => {
    await running(page)
    await context.setOffline(true)

    await expect(upcoming(page).getByText(MATTE_DESCRIPTION)).toBeVisible()
    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: fx.names.ruhe })).toBeVisible()
    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: 'Freie Zeit' })).toBeVisible()
    await tap(page, 'Stunde beenden')

    await expect(page.getByText('Stunde beendet')).toBeVisible()
    await context.setOffline(false)
  })

  test('der Live-Bildschirm lädt auch ohne Verbindung neu (Offline-Baustein)', async ({ page, context }) => {
    // War BUG-23: auf dem Weg aus der App — „Stunde starten" wechselt ohne neues
    // Laden nach /live — blieb die Ablage des Bausteins leer.
    await running(page)
    await tap(page, 'Weiter', 2 * MIN)

    // Der Baustein ist eingerichtet, sobald die Seite selbst abgelegt ist.
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const cache = await caches.open('stundenplaner-live-v1')
            return Boolean(await cache.match('/live'))
          }),
        { timeout: 30_000 }
      )
      .toBe(true)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await expect(timer(page)).toBeVisible()
    await context.setOffline(false)
  })

  test('nach einem Neuladen mit Netz liegt der Live-Bildschirm auf dem Gerät und lädt dann auch ohne Verbindung', async ({ page, context }) => {
    await running(page)
    await tap(page, 'Weiter', 2 * MIN)

    // Auch nach einem vollständigen Laden von /live liegt alles auf dem Gerät.
    await page.reload()
    await expect(timer(page)).toBeVisible()
    await expect
      .poll(
        () =>
          page.evaluate(async () => {
            const cache = await caches.open('stundenplaner-live-v1')
            return Boolean(await cache.match('/live'))
          }),
        { timeout: 30_000 }
      )
      .toBe(true)

    await context.setOffline(true)
    await page.reload()
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await expect(timer(page)).toBeVisible()
    await context.setOffline(false)
  })

  test('Edge: zwei Tabs zeigen denselben Stand — ein Tipp im einen ist im anderen zu sehen', async ({ page, context }) => {
    await running(page)
    const second = await context.newPage()
    await second.goto('/live')
    await expect(second.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()

    await tap(page, 'Weiter')
    await expect(page.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()
    await expect(second.getByRole('heading', { level: 1, name: fx.names.matte })).toBeVisible()

    await second.getByRole('navigation', { name: 'Bedienung' }).getByRole('button', { name: 'Pause' }).click()
    await expect(page.getByRole('dialog', { name: 'Pausiert' })).toBeVisible()
    await second.close()
  })

  test('AC: wird die Einheit anderswo geändert, zeigt die laufende Stunde weiter den Plan vom Start', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Vorher ${Date.now()}` })
    await running(page, [
      {
        minutes: 10,
        items: [
          { exerciseId: fx.ruhe, minutes: 5 },
          { exerciseId: exercise.id, minutes: 5 },
        ],
      },
    ])

    await admin.from('exercises').update({ name: `${exercise.name} GEÄNDERT` }).eq('id', exercise.id)
    await page.reload()

    await expect(upcoming(page).getByRole('heading')).toContainText(exercise.name)
    await expect(upcoming(page)).not.toContainText('GEÄNDERT')
  })
})

// ============================================================
// Laufende Stunde
// ============================================================

test.describe('Laufende Stunde', () => {
  test('AC: wer den Live-Modus verlässt, sieht auf jeder Seite „Stunde läuft — fortsetzen", angeklebt, und kommt damit zurück', async ({ page }) => {
    const unit = await running(page)
    await menu(page, /Live-Modus verlassen/)
    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))

    const banner = page.getByRole('link', { name: /Stunde läuft — fortsetzen/ })
    await expect(banner).toBeVisible()

    for (const route of ['/units', '/exercises', '/groups', '/dashboard']) {
      await page.goto(route)
      await expect(banner).toBeVisible()
    }

    // Klebt unter der Kopfzeile: auch nach dem Scrollen im Bild.
    await page.goto('/exercises')
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(banner).toBeInViewport()

    await banner.click()
    await expect(page).toHaveURL(/\/live$/)
    await expect(page.getByRole('heading', { level: 1, name: fx.names.kreis })).toBeVisible()
  })

  test('AC: wer eine zweite Stunde startet, wird gefragt — fortsetzen führt in die laufende zurück', async ({ page }) => {
    const first = await running(page)
    await menu(page, /Live-Modus verlassen/)

    const second = await build()
    await openUnit(page, second)
    await startButton(page).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Es läuft schon eine Stunde')
    await expect(dialog).toContainText(first.name)
    await expect(dialog.getByRole('button', { name: /Beenden und festhalten/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Verwerfen/ })).toBeVisible()

    await dialog.getByRole('button', { name: 'Laufende Stunde fortsetzen' }).click()
    await expect(page).toHaveURL(/\/live$/)
    expect((await akte(page)).plan.unitId).toBe(first.id)
  })

  test('AC: „Beenden und festhalten, dann neu starten" hält die laufende Stunde fest und öffnet die neue', async ({ page }) => {
    const first = await running(page)
    await elapse(page, 3 * MIN)
    await menu(page, /Live-Modus verlassen/)

    const second = await build()
    await openUnit(page, second)
    await startButton(page).click()
    await page.getByRole('alertdialog').getByRole('button', { name: /Beenden und festhalten/ }).click()

    await expect(page).toHaveURL(/\/live$/)
    await expect(goButton(page)).toBeVisible()
    expect((await akte(page)).plan.unitId).toBe(second.id)
    await savedRun(first)
  })

  test('AC: eine vergessene Stunde wird zur Entscheidung vorgelegt; „Beenden und festhalten" zählt den offenen Schritt mit höchstens seiner Plandauer', async ({ page }) => {
    const unit = await running(page)
    await tap(page, 'Weiter', 5 * MIN)
    // 24 Minuten geplant — nach mehr als 48 gilt die Stunde als vergessen.
    await elapse(page, 200 * MIN)

    await expect(page.getByRole('heading', { name: 'Läuft diese Stunde noch?' })).toBeVisible()
    await expect(timer(page)).toHaveCount(0)

    await page.getByRole('button', { name: 'Beenden und festhalten' }).click()
    await expect(page.getByText('Stunde beendet')).toBeVisible()

    const steps = await stepsOf((await savedRun(unit)).id)
    // Der offene Schritt (6 Min geplant) steht nicht mit Stunden im Protokoll.
    expect(steps[1].actual_seconds).toBe(360)
    expect(steps[1].status).toBe('done')
  })

  test('AC: eine vergessene Stunde lässt sich verwerfen; der Hinweis in der App fragt nach, statt „läuft" zu sagen', async ({ page }) => {
    const unit = await running(page)
    await elapse(page, 200 * MIN)
    await page.goto('/units')
    await expect(page.getByRole('link', { name: /Läuft diese Stunde noch\?/ })).toBeVisible()

    await page.getByRole('link', { name: /Läuft diese Stunde noch\?/ }).click()
    await page.getByRole('button', { name: 'Verwerfen' }).click()

    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
    expect(await akte(page)).toBeNull()
    expect(await runsOf(unit)).toHaveLength(0)
  })

  test('AC: wer sich bei laufender Stunde abmelden will, wird vorher gefragt', async ({ page }) => {
    await running(page)
    await menu(page, /Live-Modus verlassen/)
    await page.getByRole('button', { name: 'Abmelden' }).click()

    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Es läuft noch eine Stunde')
    await expect(dialog.getByRole('button', { name: /Beenden, festhalten und abmelden/ })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Verwerfen und abmelden/ })).toBeVisible()

    // Nicht wirklich abmelden: das beendete die Sitzung aller übrigen Tests.
    await dialog.getByRole('button', { name: 'Angemeldet bleiben' }).click()
    await expect(dialog).toHaveCount(0)
    expect((await akte(page)).run.phase).toBe('running')
  })

  test('AC: ein anderes Konto auf demselben Gerät sieht die Stunde nicht', async ({ page }) => {
    await running(page)
    // Die Akte gehört einem anderen Konto.
    await patchAkte(page, { userId: '00000000-0000-4000-8000-000000000000' })

    await page.reload()
    await expect(page.getByText('Es läuft gerade keine Stunde')).toBeVisible()
    await expect(timer(page)).toHaveCount(0)

    await page.goto('/units')
    await expect(page.getByText('Stunde läuft')).toHaveCount(0)
  })
})

// ============================================================
// Abschluss und Durchführungen
// ============================================================

test.describe('Abschluss und Durchführungen', () => {
  test('AC: die Zusammenfassung zeigt geplante und tatsächliche Gesamtdauer ohne Pausen und je Schritt Status und Dauern', async ({ page }) => {
    await running(page)
    await tap(page, 'Pause', 3 * MIN)
    await elapse(page, 10 * MIN)
    await page.getByRole('button', { name: 'Fortsetzen' }).click()
    await tap(page, 'Weiter', 1000)
    await tap(page, 'Auslassen', 1000)
    await finishAll(page)

    await expect(page.getByText('24 Min', { exact: true })).toBeVisible()
    const rows = page.getByRole('list').getByRole('listitem')
    // 3 Minuten und ein paar Sekunden — die zehn Minuten Pause zählen nicht.
    await expect(rows.filter({ hasText: fx.names.kreis })).toContainText(/geplant 8 Min · tatsächlich 3:0\d/)
    await expect(rows.filter({ hasText: fx.names.matte })).toContainText('ausgelassen')
    await expect(page.getByText('1 Schritt ausgelassen')).toBeVisible()
    await expect(page.getByText(/später nachbereiten/)).toBeVisible()
  })

  test('AC: „Fertig" ohne Eintrag speichert die Durchführung ohne Notiz; sie steht an der Einheit mit Datum, Dauer und ausgelassenen Schritten', async ({ page }) => {
    const unit = await running(page)
    await tap(page, 'Weiter', 3 * MIN)
    await tap(page, 'Auslassen', 1000)
    await finishAll(page)

    // Kein Aufblitzen von „Es läuft gerade keine Stunde" beim Verlassen.
    await page.evaluate(() => {
      const state = window as unknown as { __aufgeblitzt?: boolean }
      new MutationObserver(() => {
        if (document.body.innerText.includes('Es läuft gerade keine Stunde')) state.__aufgeblitzt = true
      }).observe(document.body, { childList: true, subtree: true, characterData: true })
    })

    await page.getByRole('button', { name: 'Fertig' }).click()
    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
    expect(await page.evaluate(() => (window as unknown as { __aufgeblitzt?: boolean }).__aufgeblitzt)).toBeFalsy()
    expect(await akte(page)).toBeNull()

    const run = await savedRun(unit)
    expect(run.note).toBeNull()

    const entry = page.getByRole('region', { name: 'Durchführungen' }).getByRole('listitem').first()
    await expect(entry).toContainText(String(new Date().getFullYear()))
    await expect(entry).toContainText('von 24 Min')
    await expect(entry).toContainText('1 ausgelassen')
  })

  test('AC: eine Notiz bei „Wie lief\'s?" steht an der Durchführung, lässt sich ändern, und die Durchführung lässt sich löschen', async ({ page }) => {
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])
    await finishAll(page)
    await page.getByLabel(/Wie lief's\?/).fill('Lief richtig gut.')
    await synced(page, unit)
    await page.getByRole('button', { name: 'Fertig' }).click()
    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))

    const runs = page.getByRole('region', { name: 'Durchführungen' })
    await expect(runs).toContainText('Lief richtig gut.')
    await expect.poll(async () => (await runsOf(unit))[0]?.note).toBe('Lief richtig gut.')

    await runs.getByRole('button').first().click()
    await runs.getByRole('button', { name: 'Notiz ändern' }).click()
    await runs.getByLabel('Notiz zur Stunde').fill('Beim nächsten Mal kürzer.')
    await runs.getByRole('button', { name: 'Speichern' }).click()
    await expect(runs).toContainText('Beim nächsten Mal kürzer.')
    await expect.poll(async () => (await runsOf(unit))[0]?.note).toBe('Beim nächsten Mal kürzer.')

    await runs.getByRole('button', { name: 'Durchführung löschen' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Löschen' }).click()
    await expect(runs).toContainText('noch nicht durchgeführt')
    expect(await runsOf(unit)).toHaveLength(0)
  })

  test('die Notiz geht nicht verloren, wenn „Fertig" getippt wird, während das Speichern der Durchführung noch unterwegs ist', async ({ page }) => {
    // BUG-22 (QA 2026-10-11): die Notiz reist mit der wartenden Durchführung —
    // die aber schon ohne sie abgeschickt ist. Erwarteter Fehlschlag, bis das
    // behoben ist; dann gehört diese Zeile weg.
    test.fail(true, 'BUG-22: Notiz geht verloren, wenn „Fertig" das laufende Speichern überholt')
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])

    // Eine langsame Verbindung: die Antwort auf das Speichern lässt auf sich warten.
    await page.route('**/live', async (route) => {
      if (route.request().method() === 'POST') await new Promise((done) => setTimeout(done, 4000))
      await route.continue()
    })

    await finishAll(page)
    await page.getByLabel(/Wie lief's\?/).fill('Schnell getippt')
    await page.getByRole('button', { name: 'Fertig' }).click()
    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))

    await savedRun(unit)
    await expect
      .poll(async () => (await runsOf(unit))[0]?.note, { timeout: 20_000 })
      .toBe('Schnell getippt')
  })

  test('AC: zwei Durchführungen stehen beide da, die neuere oben; die Übersicht nennt „Zuletzt durchgeführt am …"', async ({ page }) => {
    const unit = await build([{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])

    for (const note of ['Erste Stunde', 'Zweite Stunde']) {
      await openUnit(page, unit)
      await startButton(page).click()
      await goButton(page).click()
      await finishAll(page)
      await page.getByLabel(/Wie lief's\?/).fill(note)
      await expect.poll(async () => (await runsOf(unit)).length).toBe(note === 'Erste Stunde' ? 1 : 2)
      await expect.poll(async () => (await warteliste(page)).length).toBe(0)
      await page.getByRole('button', { name: 'Fertig' }).click()
      await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
      await expect.poll(async () => (await runsOf(unit)).some((run) => run.note === note)).toBe(true)
    }

    await page.reload()
    const entries = page.getByRole('region', { name: 'Durchführungen' }).getByRole('listitem')
    await expect(entries).toHaveCount(2)
    await expect(entries.nth(0)).toContainText('Zweite Stunde')
    await expect(entries.nth(1)).toContainText('Erste Stunde')

    await page.goto('/units')
    await expect(page.locator('div.relative').filter({ hasText: unit.name })).toContainText(
      'Zuletzt durchgeführt am'
    )
  })

  test('AC: ohne Netz bleibt die Durchführung auf dem Gerät und wird nachgereicht — genau einmal', async ({ page, context }) => {
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])
    await context.setOffline(true)
    await finishAll(page)

    await expect(page.getByText('liegt auf diesem Gerät')).toBeVisible()
    expect(await warteliste(page)).toHaveLength(1)
    expect(await runsOf(unit)).toHaveLength(0)
    // Ohne Verbindung sind die Wege der Nachbereitung nicht bedienbar.
    await expect(page.getByRole('button', { name: 'Notiz anhängen' })).toBeDisabled()
    await expect(page.getByText(/später an der gespeicherten Durchführung nachholen/)).toBeVisible()

    await context.setOffline(false)
    await savedRun(unit)
    await expect.poll(async () => (await warteliste(page)).length).toBe(0)
    await expect(page.getByText('liegt auf diesem Gerät')).toHaveCount(0)

    // Ein zweiter Versuch mit derselben Kennung legt nichts doppelt an.
    await page.reload()
    await expect(page.getByText('Stunde beendet')).toBeVisible()
    expect(await runsOf(unit)).toHaveLength(1)
  })

  test('AC: ohne Netz geht „Fertig" trotzdem — die App bleibt stehen und sagt, dass nichts verloren ist; mit Netz wird nachgereicht', async ({ page, context }) => {
    // War BUG-25: „Fertig" wechselte ohne Netz auf die Fehlerseite des Browsers.
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])
    await context.setOffline(true)
    await finishAll(page)
    await page.getByLabel(/Wie lief's\?/).fill('Ohne Netz geschrieben')
    await page.getByRole('button', { name: 'Fertig' }).click()

    await expect(page.getByRole('heading', { name: 'Fertig — die Stunde ist festgehalten' })).toBeVisible()
    await expect(page.getByText(/liegt samt deiner Notiz auf diesem Gerät/)).toBeVisible()
    await expect(page).toHaveURL(/\/live$/)
    expect((await warteliste(page))[0].record.note).toBe('Ohne Netz geschrieben')

    // Noch immer kein Netz: der Knopf führt nirgendwohin, und sagt es.
    await page.getByRole('button', { name: 'Zur Einheit' }).click()
    await expect(page.getByText('Noch keine Verbindung.')).toBeVisible()
    await expect(page).toHaveURL(/\/live$/)

    // Wieder im Netz: nachgereicht wird von selbst, samt Notiz.
    await context.setOffline(false)
    await expect.poll(async () => (await runsOf(unit))[0]?.note, { timeout: 30_000 }).toBe('Ohne Netz geschrieben')
    await expect.poll(async () => (await warteliste(page)).length).toBe(0)

    await page.getByRole('button', { name: 'Zur Einheit' }).click()
    await expect(page).toHaveURL(new RegExp(`/units/${unit.id}$`))
    await expect(page.getByRole('region', { name: 'Durchführungen' })).toContainText('Ohne Netz geschrieben')
  })

  test('ohne Netz bleibt „Live-Modus verlassen" im Live-Modus und sagt, warum — die Stunde läuft weiter', async ({ page, context }) => {
    await running(page)
    await context.setOffline(true)
    await menu(page, /Live-Modus verlassen/)

    await expect(page.getByText('Gerade keine Verbindung').first()).toBeVisible()
    await expect(page).toHaveURL(/\/live$/)
    await expect(timer(page)).toBeVisible()
    expect((await akte(page)).run.phase).toBe('running')
    await context.setOffline(false)
  })

  test('Edge: wird die Einheit während der Stunde gelöscht, sagt die App es und bietet „Verwerfen" an', async ({ page }) => {
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] }])
    await admin.from('units').delete().eq('id', unit.id)
    await finishAll(page)

    await expect(page.getByText(/konnte nicht gespeichert werden: Die Einheit gibt es nicht mehr/)).toBeVisible()

    await page.goto('/units')
    const failed = page.getByText(/konnte nicht gespeichert werden/)
    await expect(failed).toBeVisible()
    await page.getByRole('button', { name: 'Verwerfen' }).click()
    await expect(failed).toHaveCount(0)
    expect(await warteliste(page)).toHaveLength(0)
  })

  test('AC: wird eine Übung nach der Durchführung gelöscht, steht sie dort weiter mit ihrem Namen — ohne Nachbereitung', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Löschbar ${Date.now()}` })
    const { unit } = await completedRun(page, [
      { minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] },
    ])
    const runs = page.getByRole('region', { name: 'Durchführungen' })
    await expect(runs.getByRole('button', { name: 'Notiz anhängen' })).toBeVisible()

    await admin.from('exercises').delete().eq('id', exercise.id)
    await page.reload()
    await runs.getByRole('button').first().click()

    await expect(runs).toContainText(exercise.name)
    await expect(runs.getByRole('button', { name: 'Notiz anhängen' })).toHaveCount(0)
    const steps = await stepsOf((await runsOf(unit))[0].id)
    expect(steps[0].exercise_id).toBeNull()
    expect(steps[0].name).toBe(exercise.name)
  })

  test('wird die Einheit gelöscht, sind ihre Durchführungen mit gelöscht', async ({ page }) => {
    const { unit, run } = await completedRun(page, [
      { minutes: 5, items: [{ exerciseId: fx.ruhe, minutes: 5 }] },
    ])
    await admin.from('units').delete().eq('id', unit.id)

    const { data: runs } = await admin.from('unit_runs').select('id').eq('id', run.id)
    const { data: steps } = await admin.from('unit_run_steps').select('id').eq('run_id', run.id)
    expect(runs).toHaveLength(0)
    expect(steps).toHaveLength(0)
  })
})

// ============================================================
// Nachbereitung
// ============================================================

test.describe('Nachbereitung', () => {
  test('an einer Übung stehen Notiz anhängen, Dauer übernehmen und Übung bearbeiten — „Übung löschen" nicht mehr; an freier Zeit und am ausgelassenen Schritt entsprechend weniger', async ({ page }) => {
    await running(page)
    await tap(page, 'Weiter', 3 * MIN)
    await tap(page, 'Auslassen', 1000)
    await finishAll(page)
    await expect.poll(async () => (await warteliste(page)).length, { timeout: 30_000 }).toBe(0)

    const rows = page.getByRole('list').getByRole('listitem')
    const done = rows.filter({ hasText: fx.names.kreis })
    await expect(done.getByRole('button', { name: 'Notiz anhängen' })).toBeEnabled()
    await expect(done.getByRole('button', { name: 'Dauer übernehmen' })).toBeEnabled()
    await expect(done.getByRole('link', { name: 'Übung bearbeiten' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Übung löschen' })).toHaveCount(0)

    // Ausgelassen: keine tatsächliche Dauer, also kein „Dauer übernehmen".
    const skipped = rows.filter({ hasText: fx.names.matte })
    await expect(skipped.getByRole('button', { name: 'Notiz anhängen' })).toBeVisible()
    await expect(skipped.getByRole('button', { name: 'Dauer übernehmen' })).toHaveCount(0)

    // Freie Zeit: keiner der Wege.
    const free = rows.filter({ hasText: 'Freie Zeit' })
    await expect(free.getByRole('button')).toHaveCount(0)
    await expect(free.getByRole('link')).toHaveCount(0)
  })

  test('AC: wer keinen der Wege benutzt und „Fertig" tippt, verändert keine Übung', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, {
      name: `Unberührt ${Date.now()}`,
      workNotes: 'Bleibt so.',
      duration: 7,
    })
    const read = async () =>
      (
        await admin
          .from('exercises')
          .select('work_notes, notes, duration, updated_at')
          .eq('id', exercise.id)
          .single()
      ).data
    const before = await read()

    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    expect(await read()).toEqual(before)
  })

  test('der Dialog zeigt das Notizfeld der Übung selbst: Arbeitsnotiz ändern, Vermerk nennt „Arbeitsnotiz", und sie erscheint in jeder Einheit mit der Übung', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, {
      name: `Notiz ${Date.now()}`,
      workNotes: 'Bälle vorher aufpumpen',
      notes: 'Mein Tipp',
    })
    const other = await build([{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    const { run } = await completedRun(page, [
      { minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] },
    ])

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Notizen der Übung' })
    const field = dialog.locator('#notiz-text')

    // Ein Feld mit dem bestehenden Text — kein „Dein Satz", keine Vorschau.
    await expect(dialog.getByRole('radio', { name: /Arbeitsnotiz/ })).toBeChecked()
    await expect(field).toHaveValue('Bälle vorher aufpumpen')
    await expect(dialog.getByText('Dein Satz')).toHaveCount(0)
    await expect(dialog.getByText('Erscheint ab sofort in allen Einheiten mit dieser Übung.')).toBeVisible()
    // Ohne Änderung lässt sich nichts übernehmen.
    await expect(dialog.getByRole('button', { name: 'Übernehmen' })).toBeDisabled()

    await field.fill('Bälle vorher aufpumpen\nMit 2 Bällen besser')
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(dialog).toHaveCount(0)

    await expect(page.getByText('Notiz übernommen (Arbeitsnotiz)')).toBeVisible()
    const { data } = await admin.from('exercises').select('work_notes, notes').eq('id', exercise.id).single()
    expect(data?.work_notes).toBe('Bälle vorher aufpumpen\nMit 2 Bällen besser')
    expect(data?.notes).toBe('Mein Tipp')
    expect((await stepsOf(run.id))[0].adopted_note).toBe('work')

    await openUnit(page, other)
    await expect(page.getByText('Mit 2 Bällen besser')).toBeVisible()
  })

  test('beim Umschalten wechselt das Feld auf die Anmerkungen, das Getippte bleibt; beide lassen sich in einem Zug übernehmen und der Vermerk nennt beide', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, {
      name: `Beide ${Date.now()}`,
      workNotes: 'Alt Arbeit',
      notes: 'Alt Anmerkung',
    })
    const { run } = await completedRun(page, [
      { minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] },
    ])

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Notizen der Übung' })
    const field = dialog.locator('#notiz-text')

    await field.fill('Neu Arbeit')
    await dialog.getByRole('radio', { name: /Anmerkungen/ }).click()
    await expect(field).toHaveValue('Alt Anmerkung')
    await expect(dialog.getByText('Erscheint ab sofort in allen Einheiten')).toHaveCount(0)
    await field.fill('Neu Anmerkung')

    // Zurückschalten verwirft nichts.
    await dialog.getByRole('radio', { name: /Arbeitsnotiz/ }).click()
    await expect(field).toHaveValue('Neu Arbeit')
    await expect(dialog.getByText('· geändert')).toHaveCount(2)

    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Notiz übernommen (Arbeitsnotiz, Anmerkungen)')).toBeVisible()

    const { data } = await admin.from('exercises').select('work_notes, notes').eq('id', exercise.id).single()
    expect(data).toEqual({ work_notes: 'Neu Arbeit', notes: 'Neu Anmerkung' })
    expect((await stepsOf(run.id))[0].adopted_note).toBe('both')
  })

  test('der Vermerk zählt auch nacheinander mit: erst Anmerkungen, dann Arbeitsnotiz ergibt beide', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Nacheinander ${Date.now()}` })
    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    const dialog = page.getByRole('dialog', { name: 'Notizen der Übung' })

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    await dialog.getByRole('radio', { name: /Anmerkungen/ }).click()
    await dialog.locator('#notiz-text').fill('Nur für mich')
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('Notiz übernommen (Anmerkungen)')).toBeVisible()

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    await dialog.locator('#notiz-text').fill('Für alle Stunden')
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('Notiz übernommen (Arbeitsnotiz, Anmerkungen)')).toBeVisible()
  })

  test('Edge: ein Text über 2.000 Zeichen wird nicht übernommen, die Eingabe bleibt stehen', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Lang ${Date.now()}`, workNotes: 'Kurz' })
    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Notizen der Übung' })
    await dialog.locator('#notiz-text').fill('x'.repeat(2001))

    await expect(dialog.getByText(/Zu lang: 2\.001 von 2\.000 Zeichen/)).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Übernehmen' })).toBeDisabled()
    const { data } = await admin.from('exercises').select('work_notes').eq('id', exercise.id).single()
    expect(data?.work_notes).toBe('Kurz')
  })

  test('Edge: wurde die Übung inzwischen anderswo geändert, wird nichts überschrieben und die Eingabe bleibt stehen', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Veraltet ${Date.now()}`, workNotes: 'Stand A' })
    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])

    await page.getByRole('button', { name: 'Notiz anhängen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Notizen der Übung' })
    await expect(dialog.locator('#notiz-text')).toHaveValue('Stand A')
    await dialog.locator('#notiz-text').fill('Mein Text')

    // Währenddessen ändert jemand die Übung im Übungsordner.
    await admin.from('exercises').update({ work_notes: 'Stand B' }).eq('id', exercise.id)
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()

    await expect(page.getByText('inzwischen anderswo geändert').first()).toBeVisible()
    await expect(dialog.locator('#notiz-text')).toHaveValue('Mein Text')
    const { data } = await admin.from('exercises').select('work_notes').eq('id', exercise.id).single()
    expect(data?.work_notes).toBe('Stand B')
  })

  test('AC: „Dauer übernehmen" stellt geschätzt und tatsächlich nebeneinander, schlägt die gerundete Dauer vor, lässt sie ändern — und die Einheit behält ihre Plandauer', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Dauer ${Date.now()}`, duration: 8 })
    const unit = await running(page, [{ minutes: 8, items: [{ exerciseId: exercise.id, minutes: 8 }] }])
    await tap(page, 'Stunde beenden', 10 * MIN + 40_000)
    await expect(page.getByText('Stunde beendet')).toBeVisible()
    const run = await synced(page, unit)

    await page.getByRole('button', { name: 'Dauer übernehmen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Dauer übernehmen' })
    await expect(dialog).toContainText('Bisher geschätzt')
    await expect(dialog).toContainText('8 Min')
    await expect(dialog).toContainText('11 Min')
    await expect(dialog.getByLabel(/Neue geschätzte Dauer/)).toHaveValue('11')
    // Die Übung steht in keiner weiteren Einheit: nur der erste Satz.
    await expect(dialog).toContainText('Die neue Dauer gilt für künftige Einheiten.')
    await expect(dialog).not.toContainText('In bestehenden Einheiten bleibt')

    await dialog.getByLabel(/Neue geschätzte Dauer/).fill('10')
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(dialog).toHaveCount(0)
    // Die Erfolgsmeldung trägt denselben Text — gemeint ist der Vermerk am Schritt.
    await expect(page.getByRole('main').getByText('Dauer übernommen: 10 Min')).toBeVisible()

    const { data } = await admin.from('exercises').select('duration').eq('id', exercise.id).single()
    expect(data?.duration).toBe(10)
    expect((await stepsOf(run.id))[0].adopted_duration).toBe(10)
    const { data: items } = await admin
      .from('unit_items')
      .select('planned_duration')
      .eq('segment_id', unit.segmentIds[0])
    expect(items?.[0].planned_duration).toBe(8)
  })

  test('AC: steht die Übung in einer weiteren gespeicherten Einheit, sagt der Hinweis, dass bestehende Einheiten ihre Dauer behalten', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Mehrfach ${Date.now()}` })
    await build([{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])

    await page.getByRole('button', { name: 'Dauer übernehmen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Dauer übernehmen' })
    await expect(dialog).toContainText('In bestehenden Einheiten bleibt die geplante Dauer stehen')
    // Tatsächliche Dauer unter einer Minute: vorgeschlagen wird die Mindestdauer, nicht null.
    await expect(dialog.getByLabel(/Neue geschätzte Dauer/)).toHaveValue('1')
  })

  test('AC: lief der Schritt als Variante, ändert „Dauer übernehmen" die Dauer der Variante, nicht die der Grundübung', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Variante ${Date.now()}`, duration: 8 })
    const variantId = await makeVariant(admin, exercise.id, 'Rückwärts', 'Dasselbe rückwärts.')
    await completedRun(page, [
      { minutes: 8, items: [{ exerciseId: exercise.id, variantId, minutes: 8 }] },
    ])

    await page.getByRole('button', { name: 'Dauer übernehmen' }).click()
    const dialog = page.getByRole('dialog', { name: 'Dauer übernehmen' })
    await expect(dialog).toContainText('gilt für diese Variante')
    await dialog.getByLabel(/Neue geschätzte Dauer/).fill('12')
    await dialog.getByRole('button', { name: 'Übernehmen' }).click()
    await expect(
      page.getByRole('region', { name: 'Durchführungen' }).getByText('Dauer übernommen: 12 Min')
    ).toBeVisible()

    const { data: variant } = await admin.from('exercise_variants').select('duration').eq('id', variantId).single()
    const { data: base } = await admin.from('exercises').select('duration').eq('id', exercise.id).single()
    expect(variant?.duration).toBe(12)
    expect(base?.duration).toBe(8)
  })

  test('AC: geändertes Material und geänderte Organisationsform stehen sofort in der gespeicherten Einheit und auf dem Bereitschaftsbild', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, {
      name: `Umbau ${Date.now()}`,
      organizationForms: ['Kleingruppen'],
      materials: [{ name: 'Reifen', quantity: 3, mode: 'insgesamt' }],
    })
    const unit = await build([{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    await openUnit(page, unit)
    await expect(page.getByText('3× Reifen')).toBeVisible()
    await expect(page.getByText('Kleingruppen')).toBeVisible()

    // In der Maske geändert — hier über die Datenbank, wie es die Maske ablegt.
    await admin.from('exercise_materials').delete().eq('exercise_id', exercise.id)
    await admin
      .from('exercise_materials')
      .insert({ exercise_id: exercise.id, name: 'Stab', quantity: 7, mode: 'insgesamt' })
    await admin.from('exercises').update({ organization_forms: ['Stationsbetrieb'] }).eq('id', exercise.id)

    await page.reload()
    await expect(page.getByText('7× Stab')).toBeVisible()
    await expect(page.getByText('Stationsbetrieb')).toBeVisible()
    await expect(page.getByText('3× Reifen')).toHaveCount(0)

    await startButton(page).click()
    await expect(goButton(page)).toBeVisible()
    const list = page.getByRole('region', { name: 'Material bereitlegen' }).getByRole('listitem')
    await expect(list.filter({ hasText: 'Stab' })).toContainText('7')
    await expect(list.filter({ hasText: 'Reifen' })).toHaveCount(0)
    await expect(upcoming(page)).toContainText('Stationsbetrieb')
  })

  test('AC: an einem Platzhalter gibt es in der Zusammenfassung keinen der Wege', async ({ page }) => {
    await running(page, [
      {
        minutes: 10,
        items: [
          { exerciseId: fx.ruhe, minutes: 5 },
          { exerciseId: null as unknown as string, minutes: 5 },
        ],
      },
    ])
    await finishAll(page)

    const row = page.getByRole('list').getByRole('listitem').filter({ hasText: 'Übung gelöscht' })
    await expect(row).toBeVisible()
    await expect(row.getByRole('button')).toHaveCount(0)
    await expect(row.getByRole('link')).toHaveCount(0)
  })

  test('AC: „Übung bearbeiten" aus der Zusammenfassung führt nach dem Abbrechen an dieselbe Stelle zurück, die Notiz zur Stunde ist noch da', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Bearbeiten ${Date.now()}` })
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    await finishAll(page)
    await synced(page, unit)
    await page.getByLabel(/Wie lief's\?/).fill('Noch nicht fertig geschrieben')

    await page.getByRole('link', { name: 'Übung bearbeiten' }).click()
    await expect(page).toHaveURL(new RegExp(`/exercises/${exercise.id}/edit`))
    await expect(page.getByRole('heading', { name: 'Übung bearbeiten' })).toBeVisible()

    await page.getByRole('link', { name: 'Abbrechen' }).click()
    await expect(page).toHaveURL(/\/live$/)
    await expect(page.getByText('Stunde beendet')).toBeVisible()
    await expect(page.getByLabel(/Wie lief's\?/)).toHaveValue('Noch nicht fertig geschrieben')
  })

  test('AC: die Bearbeiten-Maske nennt, in wie vielen gespeicherten Einheiten die Übung steht, und beim Aufklappen deren Namen — Entwürfe zählen nicht', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Hinweis ${Date.now()}` })
    const layout: SegmentLayout[] = [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }]

    // In keiner Einheit: kein Hinweis.
    await page.goto(`/exercises/${exercise.id}/edit`)
    await expect(page.getByRole('heading', { name: 'Übung bearbeiten' })).toBeVisible()
    await expect(page.getByText('Diese Übung steht in')).toHaveCount(0)

    // Nur in einem Entwurf: weiter kein Hinweis.
    await build(layout, false)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Übung bearbeiten' })).toBeVisible()
    await expect(page.getByText('Diese Übung steht in')).toHaveCount(0)

    const first = await build(layout)
    const second = await build(layout)
    await page.reload()
    await expect(page.getByText('Diese Übung steht in')).toContainText('2 gespeicherten Einheiten')
    await expect(page.getByText('nur die geplante Dauer bleibt dort stehen')).toBeVisible()

    await page.getByRole('button', { name: 'Welche Einheiten?' }).click()
    await expect(page.getByText(first.name)).toBeVisible()
    await expect(page.getByText(second.name)).toBeVisible()
  })

  test('AC: an der gespeicherten Durchführung stehen dieselben Wege der Nachbereitung', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Später ${Date.now()}` })
    await completedRun(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    const runs = page.getByRole('region', { name: 'Durchführungen' })

    await expect(runs.getByRole('button', { name: 'Notiz anhängen' })).toBeEnabled()
    await expect(runs.getByRole('button', { name: 'Dauer übernehmen' })).toBeEnabled()
    await expect(runs.getByRole('link', { name: 'Übung bearbeiten' })).toHaveAttribute(
      'href',
      new RegExp(`/exercises/${exercise.id}/edit\\?zurueck=`)
    )
    await expect(runs.getByRole('button', { name: 'Übung löschen' })).toHaveCount(0)
  })
})

// ============================================================
// Sicherheit
// ============================================================

test.describe('Sicherheit', () => {
  test('eine Rücksprungadresse nach außen wird nicht angenommen', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, { name: `Rücksprung ${Date.now()}` })

    for (const target of ['https://example.com/boese', '//example.com/boese', '/\\example.com']) {
      await page.goto(`/exercises/${exercise.id}/edit?zurueck=${encodeURIComponent(target)}`)
      await expect(page.getByRole('link', { name: 'Abbrechen' })).toHaveAttribute('href', '/exercises')
    }

    await page.goto(`/exercises/${exercise.id}/edit?zurueck=${encodeURIComponent('/live')}`)
    await expect(page.getByRole('link', { name: 'Abbrechen' })).toHaveAttribute('href', '/live')
  })

  test('Übungsnamen und Notizen mit Markup werden als Text gezeigt, nicht ausgeführt', async ({ page }) => {
    const exercise = await makeExercise(admin, userId, fx, {
      name: `<img src=x onerror=window.__xss=1> ${Date.now()}`,
      description: '<script>window.__xss=1</script>Beschreibung',
      workNotes: '<b onmouseover=window.__xss=1>Notiz</b>',
    })
    const unit = await running(page, [{ minutes: 5, items: [{ exerciseId: exercise.id, minutes: 5 }] }])
    await expect(page.getByRole('heading', { level: 1 })).toContainText('<img src=x')
    await finishAll(page)
    await page.getByLabel(/Wie lief's\?/).fill('<img src=x onerror=window.__xss=1>')
    await synced(page, unit)
    await page.getByRole('button', { name: 'Fertig' }).click()
    await expect(page.getByRole('region', { name: 'Durchführungen' })).toContainText('<img src=x')

    expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
  })
})
