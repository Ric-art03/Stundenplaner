import { test, expect, type Locator, type Page } from '@playwright/test'
import { adminClient, FIXTURE_GROUP_NAME, seed, cleanup, testUserId, TEST_EMAIL } from './fixtures'

/**
 * E2E-Tests für PROJ-4 (Starter-Datenbank / Übungsdatenbank) gegen die
 * Akzeptanzkriterien der Spec.
 *
 * Eigene Stufe in playwright.config.ts („uebungsdatenbank", danach
 * „uebungsdatenbank mobil"), nach dem Grundstock: Die Tests legen Kopien in
 * „Meine Übungen" an und räumen für die Leerzustände den Grundbestand
 * zeitweise weg — das darf neben keinem anderen Feature laufen.
 *
 * Gearbeitet wird mit dem Testblock „E2E-Testblock (nie freigeben)": fünf
 * Entwürfe, die nur das Testkonto sieht (Vorschau-Konto). Er wird hier nie
 * freigegeben. Wo ein Test den Block verändert (Name, Zustand, Datum,
 * Vorschau-Konten), stellt er ihn im `finally` wieder her.
 */

// Der Reihe nach in einem Arbeiter, aber ohne nach einem Fehlschlag abzubrechen.
test.describe.configure({ mode: 'default' })

const TAG = 'E2E4'
const MARKER = 'E2E-Testdaten (PROJ-4)'
const BLOCK = 'E2E-Testblock (nie freigeben)'

const FANG = 'E2E Fangspiel'
const BOCK = 'E2E Bockspringen'
const STAFFEL = 'E2E Ballstaffel'
const RUHE = 'E2E Entspannungsreise'
const PRITSCHEN = 'E2E Pritschen an der Wand'

const admin = adminClient()
let userId: string
let lib: Record<string, string> = {}

async function myGroupIds(): Promise<string[]> {
  const { data } = await admin.from('groups').select('id').eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  return (data ?? []).map((g) => g.id)
}

async function cleanupAll() {
  const groups = await myGroupIds()
  if (groups.length) await admin.from('units').delete().eq('user_id', userId).in('group_id', groups)
  await admin.from('groups').delete().eq('user_id', userId).like('name', `${FIXTURE_GROUP_NAME} ${TAG}%`)
  await admin.from('venues').delete().eq('user_id', userId).like('name', `${TAG}%`)
  await admin.from('exercises').delete().eq('user_id', userId).not('library_exercise_id', 'is', null)
  await admin.from('exercises').delete().eq('user_id', userId).eq('work_notes', MARKER)
}

test.beforeAll(async () => {
  userId = await testUserId(admin, TEST_EMAIL)
  const { data, error } = await admin.from('library_exercises').select('id, name, key').like('key', 'E2E-%')
  if (error || !data || data.length !== 5) {
    throw new Error(`Der Testblock fehlt oder ist unvollständig (${data?.length ?? 0} von 5). Einlesen: npm run bestand -- testblock`)
  }
  lib = Object.fromEntries(data.map((e) => [e.name, e.id]))
})

test.beforeEach(async () => {
  await cleanupAll()
})

test.afterAll(async () => {
  await cleanupAll()
})

// ---- Aufbau ----

async function createVenue(materials: { name: string; quantity: number }[]) {
  const { data, error } = await admin.from('venues').insert({ user_id: userId, name: `${TAG} Halle` }).select('id').single()
  if (error || !data) throw new Error(`Halle anlegen: ${error?.message}`)
  if (materials.length) {
    const { error: e } = await admin
      .from('venue_materials')
      .insert(materials.map((m, i) => ({ venue_id: data.id, name: m.name, quantity: m.quantity, sort_order: i })))
    if (e) throw new Error(`Hallenmaterial: ${e.message}`)
  }
  return data.id as string
}

async function createGroup(
  suffix: string,
  fields: { sports?: string[]; ages?: string[]; participants?: number | null; venueId?: string | null } = {}
) {
  const name = `${FIXTURE_GROUP_NAME} ${TAG} ${suffix}`
  const { data, error } = await admin
    .from('groups')
    .insert({
      user_id: userId,
      name,
      sports: fields.sports ?? ['Kinderturnen'],
      age_groups: fields.ages ?? ['Kinder (4–6)'],
      participants: fields.participants === undefined ? 12 : fields.participants,
      unit_duration: 60,
      venue_id: fields.venueId ?? null,
    })
    .select('id')
    .single()
  if (error || !data) throw new Error(`Gruppe anlegen: ${error?.message}`)
  return { id: data.id as string, name }
}

async function copiesOf(name?: string) {
  let q = admin.from('exercises').select('id, name, library_exercise_id, copied_at, work_notes').eq('user_id', userId).not('library_exercise_id', 'is', null)
  if (name) q = q.eq('library_exercise_id', lib[name])
  const { data } = await q
  return data ?? []
}

// ---- Griffe ----

async function openLibrary(page: Page, query = '') {
  await page.goto(`/exercises?tab=library${query}`)
  await expect(page.getByRole('tab', { name: 'Übungsdatenbank' })).toHaveAttribute('aria-selected', 'true')
}

function count(page: Page): Locator {
  return page.getByRole('status').filter({ hasText: /^\d+ Übung/ })
}

function row(page: Page, name: string): Locator {
  return page.locator('.divide-y > div').filter({ has: page.getByRole('heading', { level: 3, name, exact: true }) })
}

function checkbox(page: Page, name: string): Locator {
  return page.getByRole('checkbox', { name: new RegExp(`„${name}" (auswählen|ist schon übernommen)`) })
}

function bar(page: Page): Locator {
  return page.getByRole('region', { name: 'Auswahl' })
}

async function pickGroup(page: Page, groupName: string) {
  await page.getByRole('combobox', { name: 'Passt zu Gruppe' }).click()
  await page.getByRole('option', { name: groupName }).click()
  await expect(count(page)).toContainText('passen zu Sportart und Alter')
}

/** Lässt jede Server-Aktion der Seite scheitern — wie eine abgebrochene Verbindung. */
async function breakServerActions(page: Page) {
  await page.route('**/*', (route) => {
    const request = route.request()
    if (request.method() === 'POST' && request.headers()['next-action']) return route.abort('failed')
    return route.continue()
  })
}

// ==== A. Seite „Übungen" mit zwei Reitern ====

test.describe('PROJ-4 — A. Reiter und Namen', () => {
  test('AC: „Übungen" öffnet mit dem Reiter „Meine Übungen" und der eigenen Übersicht', async ({ page }) => {
    await page.goto('/exercises')
    await expect(page.getByRole('heading', { level: 1, name: 'Übungen' })).toBeVisible()
    await expect(page.getByRole('tab', { name: 'Meine Übungen' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { level: 3, name: 'E2E Aufwärmen Turnen' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Neue Übung' })).toBeVisible()
  })

  test('AC: der Reiter „Übungsdatenbank" steht in der Adresse — Neuladen und Zurück führen in denselben Reiter', async ({ page }) => {
    await page.goto('/exercises')
    // Bewusst sofort, während „Meine Übungen" noch lädt: bis BUG-31 ging ein
    // solcher Klick meist verloren — die Adresse wechselte, der Inhalt nicht.
    await page.getByRole('tab', { name: 'Übungsdatenbank' }).click()
    await expect(page.getByRole('tab', { name: 'Übungsdatenbank' })).toHaveAttribute('aria-selected', 'true')
    await expect(page).toHaveURL(/tab=library/)
    await expect(row(page, FANG)).toBeVisible()

    await page.reload()
    await expect(page.getByRole('tab', { name: 'Übungsdatenbank' })).toHaveAttribute('aria-selected', 'true')
    await expect(row(page, FANG)).toBeVisible()

    await page.goBack()
    await expect(page.getByRole('tab', { name: 'Meine Übungen' })).toHaveAttribute('aria-selected', 'true')
    await page.goForward()
    await expect(page.getByRole('tab', { name: 'Übungsdatenbank' })).toHaveAttribute('aria-selected', 'true')
    await expect(row(page, FANG)).toBeVisible()
  })

  test('AC: aus der Leseansicht zurück steht man in der Übungsdatenbank mit denselben Filtern', async ({ page }) => {
    await openLibrary(page)
    await page.getByPlaceholder('Übung suchen...').fill('Bockspringen')
    await expect(count(page)).toHaveText('1 Übung')
    await expect(page).toHaveURL(/suche=Bockspringen/)

    await row(page, BOCK).getByRole('link').first().click()
    await expect(page.getByRole('heading', { level: 1, name: BOCK })).toBeVisible()
    await page.getByRole('link', { name: 'Zurück zur Übungsdatenbank' }).click()
    await expect(page.getByPlaceholder('Übung suchen...')).toHaveValue('Bockspringen')
    await expect(count(page)).toHaveText('1 Übung')

    // Auch der Zurück-Knopf des Browsers.
    await row(page, BOCK).getByRole('link').first().click()
    await expect(page.getByRole('heading', { level: 1, name: BOCK })).toBeVisible()
    await page.goBack()
    await expect(page.getByPlaceholder('Übung suchen...')).toHaveValue('Bockspringen')
    await expect(count(page)).toHaveText('1 Übung')
  })

  test('AC: die Karte der Startseite heißt „Übungen"; der Generator schöpft „aus deinen Übungen"', async ({ page }) => {
    await page.goto('/dashboard')
    // Die Karte, nicht der Menüpunkt gleichen Namens.
    await expect(page.locator('.text-lg').filter({ hasText: /^Übungen$/ })).toBeVisible()
    await expect(page.getByText('Übungen erstellen, verwalten und durchsuchen')).toBeVisible()
    await expect(page.getByText('Übungsdatenbank', { exact: true })).toHaveCount(0)

    await page.goto('/units/new')
    await expect(page.getByText('Der Generator stellt eine strukturierte Einheit aus deinen Übungen zusammen.')).toBeVisible()
  })

  test('AC: am Handy stehen beide Reiter nebeneinander, ohne waagerechtes Scrollen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await openLibrary(page)
    await expect(row(page, FANG)).toBeVisible()
    const mine = await page.getByRole('tab', { name: 'Meine Übungen' }).boundingBox()
    const library = await page.getByRole('tab', { name: 'Übungsdatenbank' }).boundingBox()
    expect(mine && library).toBeTruthy()
    expect(Math.abs(mine!.y - library!.y)).toBeLessThan(2)
    expect(library!.x + library!.width).toBeLessThanOrEqual(375)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })
})

// ==== B. Durchsehen ====

test.describe('PROJ-4 — B. Durchsehen', () => {
  test('AC: der Reiter zeigt alle sichtbaren Übungen mit ihrer Anzahl', async ({ page }) => {
    await openLibrary(page)
    await expect(count(page)).toHaveText('5 Übungen')
    for (const name of [FANG, BOCK, STAFFEL, RUHE, PRITSCHEN]) await expect(row(page, name)).toBeVisible()
    // Dieselbe Übungszeile wie in „Meine Übungen": Material an der Übung.
    await expect(row(page, BOCK).getByText(/Bock/).first()).toBeVisible()
  })

  test('AC: auch die Kartenansicht zeigt Auswählen, Vermerke und „Übernehmen"', async ({ page }) => {
    await openLibrary(page)
    await page.getByRole('button', { name: 'Kartenansicht' }).click()
    try {
      await expect(checkbox(page, FANG)).toBeVisible()
      await expect(page.getByText('Entwurf').first()).toBeVisible()
      await page.getByRole('button', { name: `„${FANG}" übernehmen` }).click()
      await expect(page.getByRole('link', { name: 'In Meine Übungen öffnen' })).toBeVisible()
      await expect(checkbox(page, FANG)).toBeDisabled()
    } finally {
      await page.getByRole('button', { name: 'Listenansicht' }).click()
    }
  })

  test('AC: Filter und Suche zeigen nur Passendes mit der Anzahl der Treffer', async ({ page }) => {
    await openLibrary(page, '&sportart=Volleyball')
    await expect(count(page)).toHaveText('1 Übung')
    await expect(row(page, PRITSCHEN)).toBeVisible()
    await expect(row(page, FANG)).toHaveCount(0)

    await openLibrary(page, '&phase=Cool-Down')
    await expect(count(page)).toHaveText('1 Übung')
    await expect(row(page, RUHE)).toBeVisible()

    await openLibrary(page)
    await page.getByPlaceholder('Übung suchen...').fill('Entspannung')
    await expect(count(page)).toHaveText('1 Übung')
    await expect(row(page, RUHE)).toBeVisible()
  })

  test('AC: „Zuletzt hinzugefügt" stellt die zuletzt freigegebenen Übungen nach oben', async ({ page }) => {
    // Der Testblock wird nie freigegeben — gesetzt wird nur das Datum, nach dem sortiert wird.
    const dates: [string, string][] = [
      [STAFFEL, '2026-01-03T10:00:00Z'],
      [FANG, '2026-01-02T10:00:00Z'],
      [RUHE, '2026-01-01T10:00:00Z'],
      [BOCK, '2025-12-31T10:00:00Z'],
      [PRITSCHEN, '2025-12-30T10:00:00Z'],
    ]
    try {
      for (const [name, at] of dates) await admin.from('library_exercises').update({ first_released_at: at }).eq('id', lib[name])
      await openLibrary(page)
      await expect(page.getByRole('combobox').filter({ hasText: 'Zuletzt hinzugefügt' })).toBeVisible()
      await expect(count(page)).toHaveText('5 Übungen')
      const names = await page.locator('.divide-y > div h3').allInnerTexts()
      expect(names).toEqual(dates.map(([name]) => name))
    } finally {
      await admin.from('library_exercises').update({ first_released_at: null }).in('id', Object.values(lib))
    }
  })

  test('AC: die Leseansicht zeigt Beschreibung, Metadaten, Material, Varianten mit Bedingungen und Links — ohne Bearbeiten und Löschen', async ({ page }) => {
    await page.goto(`/exercises/library/${lib[BOCK]}`)
    await expect(page.getByRole('heading', { level: 1, name: BOCK })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Beschreibung' })).toBeVisible()
    await expect(page.getByText('Kinderturnen').first()).toBeVisible()
    await expect(page.getByText('Turnmatte').first()).toBeVisible()
    await expect(page.getByText('Ohne Bock (leichter)').first()).toBeVisible()
    await expect(page.getByText('Mit längerem Anlauf (schwerer)').first()).toBeVisible()
    await expect(page.getByRole('button', { name: `„${BOCK}" übernehmen` })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Bearbeiten' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(0)
    await expect(page.getByText('Noch nicht freigegeben — nur in deiner Vorschau sichtbar.')).toBeVisible()

    await page.goto(`/exercises/library/${lib[RUHE]}`)
    await expect(page.getByRole('link', { name: /Beispielquelle/ })).toBeVisible()
  })

  test('AC: eine Quellenangabe ist in der Leseansicht sichtbar', async ({ page }) => {
    await page.goto(`/exercises/library/${lib[RUHE]}`)
    await expect(page.getByRole('heading', { name: 'Quelle' })).toBeVisible()
    await expect(page.getByText('Nach einer Idee aus „Beispielquelle", CC BY 4.0')).toBeVisible()
  })

  test('AC: ein Filter ohne Treffer nennt, woran es liegt', async ({ page }) => {
    await openLibrary(page, '&sportart=Fu%C3%9Fball')
    await expect(page.getByRole('heading', { name: 'Keine Übung gefunden' })).toBeVisible()
    await expect(page.getByText('Für „Fußball" gibt es in der Übungsdatenbank noch keine Übungen.')).toBeVisible()
    await page.getByRole('button', { name: 'Filter zurücksetzen' }).click()
    await expect(count(page)).toHaveText('5 Übungen')
  })

  test('Edge 11: ist der Bestand leer, sagt der Reiter, dass er aufgebaut wird, und die Einstiege fehlen', async ({ page }) => {
    const { data: block } = await admin.from('library_blocks').select('id, preview_user_ids').eq('name', BLOCK).single()
    try {
      await admin.from('library_blocks').update({ preview_user_ids: [] }).eq('id', block!.id)
      await openLibrary(page)
      await expect(page.getByRole('heading', { name: 'Die Übungsdatenbank wird gerade aufgebaut' })).toBeVisible()
      await expect(page.getByRole('button', { name: /übernehmen/ })).toHaveCount(0)
    } finally {
      await admin.from('library_blocks').update({ preview_user_ids: block!.preview_user_ids }).eq('id', block!.id)
    }
  })

  test('Edge 13: eine nicht sichtbare Übung lässt sich über ihre Adresse nicht öffnen', async ({ page }) => {
    const { data: block } = await admin.from('library_blocks').select('id, preview_user_ids').eq('name', BLOCK).single()
    try {
      await admin.from('library_blocks').update({ preview_user_ids: [] }).eq('id', block!.id)
      const response = await page.goto(`/exercises/library/${lib[FANG]}`)
      expect(response?.status()).toBe(404)
      await expect(page.getByRole('heading', { level: 1, name: FANG })).toHaveCount(0)
    } finally {
      await admin.from('library_blocks').update({ preview_user_ids: block!.preview_user_ids }).eq('id', block!.id)
    }
  })
})

// ==== C. Einzeln übernehmen ====

test.describe('PROJ-4 — C. Einzeln übernehmen', () => {
  test('AC: „Übernehmen" legt eine vollständige Kopie an, und eine Meldung verweist auf sie', async ({ page }) => {
    await openLibrary(page)
    await row(page, BOCK).getByRole('button', { name: `„${BOCK}" übernehmen` }).click()
    await expect(page.getByText(new RegExp(`„${BOCK}[“"] steht jetzt in „Meine Übungen[“"]`)).first()).toBeVisible()

    const [copy] = await copiesOf(BOCK)
    expect(copy).toBeTruthy()
    expect(copy.work_notes).toBeNull()
    const [{ count: mats }, { count: vars }] = await Promise.all([
      admin.from('exercise_materials').select('id', { count: 'exact', head: true }).eq('exercise_id', copy.id),
      admin.from('exercise_variants').select('id', { count: 'exact', head: true }).eq('exercise_id', copy.id),
    ])
    expect(mats).toBe(2)
    expect(vars).toBe(2)

    await page.getByRole('link', { name: 'Öffnen', exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/exercises/${copy.id}$`))
    await expect(page.getByRole('heading', { level: 1, name: BOCK })).toBeVisible()
  })

  test('AC: Link und Quellenangabe gehen mit', async ({ page }) => {
    await page.goto(`/exercises/library/${lib[RUHE]}`)
    await page.getByRole('button', { name: `„${RUHE}" übernehmen` }).click()
    await expect(page.getByRole('link', { name: 'In Meine Übungen öffnen' })).toBeVisible()
    const [copy] = await copiesOf(RUHE)
    await page.goto(`/exercises/${copy.id}`)
    await expect(page.getByText('Nach einer Idee aus „Beispielquelle", CC BY 4.0')).toBeVisible()
    await expect(page.getByRole('link', { name: /Beispielquelle/ })).toBeVisible()
  })

  test('AC: die Kopie trägt „Aus der Übungsdatenbank übernommen am …"; Bearbeiten funktioniert und lässt den Vermerk stehen', async ({ page }) => {
    await openLibrary(page)
    await row(page, FANG).getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(row(page, FANG).getByRole('link', { name: 'In Meine Übungen öffnen' })).toBeVisible()
    const [copy] = await copiesOf(FANG)

    await page.goto(`/exercises/${copy.id}`)
    await expect(page.getByText(/Aus der Übungsdatenbank übernommen am \d{1,2}\. \S+ \d{4}/)).toBeVisible()

    await page.getByRole('link', { name: 'Bearbeiten' }).click()
    await page.getByLabel('Name *').fill(`${FANG} (meine Fassung)`)
    for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Weiter' }).click()
    await page.getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByRole('heading', { level: 1, name: `${FANG} (meine Fassung)` })).toBeVisible()
    await expect(page.getByText(/Aus der Übungsdatenbank übernommen am/)).toBeVisible()

    // In der Übungsdatenbank bleibt die Übung „übernommen".
    await openLibrary(page)
    await expect(row(page, FANG).getByText('Übernommen')).toBeVisible()
  })

  test('AC: eine übernommene Übung plant der Generator ein wie jede eigene', async ({ page }) => {
    const group = await createGroup('Generator', { participants: 10 })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await expect(bar(page)).toContainText('4 ausgewählt')
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('4 Übungen übernommen').first()).toBeVisible()

    await page.goto(`/units/new?group=${group.id}`)
    await page.getByRole('button', { name: /Einheit generieren/ }).click()
    await page.waitForURL(/\/units\/[0-9a-f-]{36}$/)
    await expect(page.getByText(FANG).first()).toBeVisible()
    await expect(page.getByText(RUHE).first()).toBeVisible()
    await expect(page.getByText(new RegExp(`${BOCK}|${STAFFEL}`)).first()).toBeVisible()
  })

  test('AC: eine Korrektur am Bestand lässt die Kopie unverändert, „Übernommen" bleibt', async ({ page }) => {
    await page.goto(`/exercises/library/${lib[FANG]}`)
    await page.getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(page.getByRole('link', { name: 'In Meine Übungen öffnen' })).toBeVisible()
    try {
      await admin.from('library_exercises').update({ name: `${FANG} korrigiert`, duration: 9 }).eq('id', lib[FANG])
      const [copy] = await copiesOf(FANG)
      expect(copy.name).toBe(FANG)
      await openLibrary(page)
      await expect(row(page, `${FANG} korrigiert`).getByText('Übernommen')).toBeVisible()
    } finally {
      await admin.from('library_exercises').update({ name: FANG, duration: 8 }).eq('id', lib[FANG])
    }
  })

  test('AC: eine übernommene Übung trägt „Übernommen" und „In Meine Übungen öffnen", aber kein „Übernehmen"', async ({ page }) => {
    await openLibrary(page)
    await row(page, STAFFEL).getByRole('button', { name: `„${STAFFEL}" übernehmen` }).click()
    const r = row(page, STAFFEL)
    await expect(r.getByText('Übernommen')).toBeVisible()
    await expect(r.getByRole('link', { name: 'In Meine Übungen öffnen' })).toBeVisible()
    await expect(r.getByRole('button', { name: /übernehmen/ })).toHaveCount(0)
    await expect(checkbox(page, STAFFEL)).toBeDisabled()

    await page.reload()
    await expect(row(page, STAFFEL).getByText('Übernommen')).toBeVisible()
  })

  test('AC: nach dem Löschen der Kopie ist der Vermerk weg, und die Übung lässt sich neu übernehmen', async ({ page }) => {
    await openLibrary(page)
    await row(page, FANG).getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await row(page, FANG).getByRole('link', { name: 'In Meine Übungen öffnen' }).click()
    const [first] = await copiesOf(FANG)
    await page.getByRole('button', { name: 'Löschen' }).click()
    await page.getByRole('button', { name: 'Endgültig löschen' }).click()
    await expect(page).toHaveURL(/\/exercises$/)

    await openLibrary(page)
    await expect(row(page, FANG).getByText('Übernommen')).toHaveCount(0)
    await row(page, FANG).getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(row(page, FANG).getByText('Übernommen')).toBeVisible()
    const copies = await copiesOf(FANG)
    expect(copies).toHaveLength(1)
    expect(copies[0].id).not.toBe(first.id)
  })

  test('AC: gibt es schon eine eigene Übung gleichen Namens, wird übernommen und darauf hingewiesen', async ({ page }) => {
    const { error } = await admin.from('exercises').insert({
      user_id: userId, name: FANG, description: 'Meine eigene Fassung.', work_notes: MARKER,
      sports: ['Turnen'], age_groups: [], phases: ['Aufwärmen'], difficulty: 'Mittel', organization_forms: [], duration: 5,
    })
    if (error) throw new Error(error.message)
    await openLibrary(page)
    await row(page, FANG).getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(page.getByText(`In „Meine Übungen" gibt es jetzt zwei Übungen namens „${FANG}".`).first()).toBeVisible()
    expect(await copiesOf(FANG)).toHaveLength(1)
  })

  test('AC: Übernehmen legt keine eigene Kategorie an', async ({ page }) => {
    const before = await admin.from('custom_categories').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    await openLibrary(page)
    await row(page, BOCK).getByRole('button', { name: `„${BOCK}" übernehmen` }).click()
    await expect(row(page, BOCK).getByText('Übernommen')).toBeVisible()
    const after = await admin.from('custom_categories').select('id', { count: 'exact', head: true }).eq('user_id', userId)
    expect(after.count).toBe(before.count)
  })

  test('AC: schlägt das Übernehmen fehl, sagt eine Meldung, dass nichts übernommen wurde — und es bleibt keine halbe Kopie', async ({ page }) => {
    await openLibrary(page)
    await expect(row(page, BOCK)).toBeVisible()
    await breakServerActions(page)
    await row(page, BOCK).getByRole('button', { name: `„${BOCK}" übernehmen` }).click()
    await expect(page.getByText('Nichts übernommen').first()).toBeVisible()
    await expect(page.getByText(/es wurde nichts übernommen/).first()).toBeVisible()
    expect(await copiesOf()).toHaveLength(0)
    await expect(row(page, BOCK).getByRole('button', { name: `„${BOCK}" übernehmen` })).toBeEnabled()
  })

  test('Edge 2: zurückgezogen, während die Leseansicht offen ist — die App sagt es, nichts wird angelegt', async ({ page }) => {
    await page.goto(`/exercises/library/${lib[FANG]}`)
    await expect(page.getByRole('button', { name: `„${FANG}" übernehmen` })).toBeVisible()
    try {
      await admin.from('library_exercises').update({ status: 'withdrawn' }).eq('id', lib[FANG])
      await page.getByRole('button', { name: `„${FANG}" übernehmen` }).click()
      await expect(page.getByText('Diese Übung gibt es in der Übungsdatenbank nicht mehr.')).toBeVisible()
      expect(await copiesOf()).toHaveLength(0)
    } finally {
      await admin.from('library_exercises').update({ status: 'draft' }).eq('id', lib[FANG])
    }
  })

  test('Edge 1: dieselbe Übung schon in einem anderen Tab übernommen — nur eine Kopie, hier heißt es „Schon übernommen"', async ({ page }) => {
    // Zwei Seiten im selben Browser-Kontext blieben in dieser Umgebung beim Laden hängen.
    // Der andere Tab wird deshalb nachgestellt: seine Kopie entsteht nebenher, während
    // diese Seite noch „Übernehmen" zeigt. Gleichzeitige Aufrufe der Datenbank-Funktion
    // sind in der QA eigens geprüft (drei auf einmal → eine Kopie).
    await page.goto(`/exercises/library/${lib[FANG]}`)
    await expect(page.getByRole('button', { name: `„${FANG}" übernehmen` })).toBeVisible()
    const { error } = await admin.from('exercises').insert({
      user_id: userId, name: FANG, description: 'Kopie aus dem anderen Tab.', library_exercise_id: lib[FANG],
      copied_at: new Date().toISOString(), sports: ['Kinderturnen'], age_groups: ['Kinder (4–6)'], phases: ['Aufwärmen'],
      difficulty: 'Leicht', organization_forms: [], duration: 8,
    })
    if (error) throw new Error(error.message)
    await page.getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(page.getByText('Schon übernommen').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'In Meine Übungen öffnen' }).first()).toBeVisible()
    expect(await copiesOf(FANG)).toHaveLength(1)
  })
})

// ==== D. Gesammelt übernehmen und „Passt zu Gruppe" ====

test.describe('PROJ-4 — D. Gesammelt und „Passt zu Gruppe"', () => {
  test('AC: angekreuzte Übungen zeigen eine Leiste mit Anzahl, „Übernehmen" und „Auswahl aufheben"', async ({ page }) => {
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, RUHE).check()
    await expect(bar(page)).toContainText('2 ausgewählt')
    await expect(bar(page).getByRole('button', { name: 'Übernehmen' })).toBeVisible()
    await bar(page).getByRole('button', { name: 'Auswahl aufheben' }).click()
    await expect(bar(page)).toHaveCount(0)
  })

  test('AC: gesammelt übernehmen übernimmt alle, die Meldung nennt die Anzahl und verweist auf „Meine Übungen"', async ({ page }) => {
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, PRITSCHEN).check()
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('2 Übungen übernommen').first()).toBeVisible()
    expect((await copiesOf()).map((c) => c.name).sort()).toEqual([FANG, PRITSCHEN].sort())
    await page.getByRole('link', { name: 'Zu Meine Übungen' }).click()
    await expect(page.getByRole('tab', { name: 'Meine Übungen' })).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('heading', { level: 3, name: PRITSCHEN })).toBeVisible()
  })

  test('AC: schlägt das gesammelte Übernehmen fehl, ist keine übernommen und die Auswahl bleibt', async ({ page }) => {
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, BOCK).check()
    await breakServerActions(page)
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('Nichts übernommen').first()).toBeVisible()
    await expect(bar(page)).toContainText('2 ausgewählt')
    expect(await copiesOf()).toHaveLength(0)
  })

  test('Edge 3: gesammelt mit einer inzwischen zurückgezogenen Übung — nichts übernommen, sie wird genannt, der Rest bleibt ausgewählt', async ({ page }) => {
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, BOCK).check()
    try {
      await admin.from('library_exercises').update({ status: 'withdrawn' }).eq('id', lib[FANG])
      await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
      await expect(page.getByText(`„${FANG}" gibt es in der Übungsdatenbank nicht mehr.`, { exact: false }).first()).toBeVisible()
      expect(await copiesOf()).toHaveLength(0)
      await expect(bar(page)).toContainText('1 ausgewählt')
      await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
      await expect(page.getByText(new RegExp(`„${BOCK}[“"] steht jetzt in „Meine Übungen[“"]`)).first()).toBeVisible()
    } finally {
      await admin.from('library_exercises').update({ status: 'draft' }).eq('id', lib[FANG])
    }
  })

  test('AC: mit Gruppen lässt sich unter „Passt zu Gruppe" eine davon wählen', async ({ page }) => {
    const group = await createGroup('Wahl')
    await openLibrary(page)
    await page.getByRole('combobox', { name: 'Passt zu Gruppe' }).click()
    await expect(page.getByRole('option', { name: group.name })).toBeVisible()
    await expect(page.getByRole('option', { name: 'Keine Gruppe — alle Übungen' })).toBeVisible()
  })

  test('AC: mit Gruppe nur Passendes; vorausgewählt, was der Generator einplanen würde; Material, Teilnehmer, Variante und mehrere Gründe stehen dabei', async ({ page }) => {
    const venueId = await createVenue([{ name: 'Turnmatte', quantity: 4 }])
    const group = await createGroup('Halle', { participants: 18, venueId })
    await openLibrary(page)
    await pickGroup(page, group.name)

    await expect(count(page)).toHaveText('4 Übungen passen zu Sportart und Alter')
    await expect(row(page, PRITSCHEN)).toHaveCount(0)

    await expect(checkbox(page, FANG)).toBeChecked()
    await expect(row(page, FANG).getByText('Passt zur Gruppe')).toBeVisible()

    await expect(checkbox(page, BOCK)).toBeChecked()
    await expect(row(page, BOCK).getByText('Passt mit der Variante „Ohne Bock (leichter)"')).toBeVisible()

    await expect(checkbox(page, RUHE)).not.toBeChecked()
    await expect(row(page, RUHE).getByText(`In „${TAG} Halle" fehlt: Yoga-Matte`)).toBeVisible()

    await expect(checkbox(page, STAFFEL)).not.toBeChecked()
    await expect(
      row(page, STAFFEL).getByText(`In „${TAG} Halle" fehlt: Ball · für 4–12 Teilnehmer, die Gruppe hat 18`)
    ).toBeVisible()

    await expect(bar(page)).toContainText('2 ausgewählt')
  })

  test('AC: zu wenig Material nennt Bedarf und Bestand', async ({ page }) => {
    const venueId = await createVenue([{ name: 'Turnmatte', quantity: 1 }, { name: 'Ball', quantity: 5 }])
    const group = await createGroup('Wenig', { participants: 10, venueId })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await expect(checkbox(page, BOCK)).not.toBeChecked()
    await expect(row(page, BOCK).getByText(`In „${TAG} Halle" fehlen: Turnmatte (2 nötig, 1 da), Bock`)).toBeVisible()
  })

  test('AC: ohne Halle sagt ein Hinweis, dass kein Material geprüft wird; ohne Teilnehmerzahl ebenso (Edge 9)', async ({ page }) => {
    const group = await createGroup('Ohne Halle', { participants: null })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await expect(page.getByText(`„${group.name}“ hat keine Halle — deshalb wird kein Material geprüft, wie im Generator.`)).toBeVisible()
    await expect(page.getByText(/hat keine Teilnehmerzahl — Material „pro Teilnehmer“ lässt sich nicht nachrechnen/)).toBeVisible()
    await expect(checkbox(page, RUHE)).toBeChecked()
    await expect(checkbox(page, STAFFEL)).toBeChecked()
  })

  test('Edge 8: Halle ohne Material — was Material braucht, ist nicht vorausgewählt; ohne Material schon', async ({ page }) => {
    const venueId = await createVenue([])
    const group = await createGroup('Leere Halle', { participants: 10, venueId })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await expect(checkbox(page, FANG)).toBeChecked()
    await expect(checkbox(page, BOCK)).not.toBeChecked()
    await expect(checkbox(page, STAFFEL)).not.toBeChecked()
    await expect(checkbox(page, RUHE)).not.toBeChecked()
    await expect(row(page, BOCK).getByText(`In „${TAG} Halle" fehlen: Turnmatte, Bock`)).toBeVisible()
  })

  test('AC: genau die eigene Auswahl wird übernommen', async ({ page }) => {
    const venueId = await createVenue([{ name: 'Turnmatte', quantity: 4 }])
    const group = await createGroup('Auswahl', { participants: 18, venueId })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await checkbox(page, FANG).uncheck()
    await checkbox(page, RUHE).check()
    await expect(bar(page)).toContainText('2 ausgewählt')
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('2 Übungen übernommen').first()).toBeVisible()
    expect((await copiesOf()).map((c) => c.name).sort()).toEqual([BOCK, RUHE].sort())
  })

  test('AC: ein Filter blendet aus, wählt aber nicht ab — die Leiste sagt es, übernommen wird alles Angekreuzte', async ({ page }) => {
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, RUHE).check()
    await page.getByPlaceholder('Übung suchen...').fill('Entspannung')
    await expect(count(page)).toHaveText('1 Übung')
    await expect(bar(page)).toContainText('2 ausgewählt')
    await expect(bar(page)).toContainText('davon 1 gerade ausgeblendet')
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('2 Übungen übernommen').first()).toBeVisible()
    expect((await copiesOf()).map((c) => c.name).sort()).toEqual([FANG, RUHE].sort())
  })

  test('AC: passt zu einer Gruppe nichts, nennt die App jeden Grund', async ({ page }) => {
    const group = await createGroup('Nichts', { sports: ['Fußball'], ages: ['Kinder (0–1)'] })
    await openLibrary(page, `&gruppe=${group.id}`)
    await expect(page.getByRole('heading', { name: `Zu „${group.name}" passt keine Übung` })).toBeVisible()
    await expect(page.getByText('Für „Fußball" gibt es in der Übungsdatenbank noch keine Übungen.')).toBeVisible()
    await expect(page.getByText('Für „Kinder (0–1)" gibt es in der Übungsdatenbank noch keine Übungen.')).toBeVisible()
  })

  test('Edge 7: trägt die Gruppe nur eigene Begriffe, nennt die App genau das', async ({ page }) => {
    const group = await createGroup('Eigen', { sports: [`${TAG} Eigensport`] })
    await openLibrary(page, `&gruppe=${group.id}`)
    await expect(page.getByRole('heading', { name: `Zu „${group.name}" passt keine Übung` })).toBeVisible()
    await expect(page.getByText(`Die Sportart „${TAG} Eigensport" ist ein eigener Begriff — die Übungsdatenbank trägt nur die mitgelieferten.`)).toBeVisible()
  })

  test('AC: ist alles Passende übernommen, sagt die App das ausdrücklich', async ({ page }) => {
    const group = await createGroup('Alles', { participants: 10 })
    await openLibrary(page)
    await pickGroup(page, group.name)
    await bar(page).getByRole('button', { name: 'Übernehmen' }).click()
    await expect(page.getByText('4 Übungen übernommen').first()).toBeVisible()
    await expect(page.getByText('Alles Passende hast du schon übernommen.')).toBeVisible()
    await page.reload()
    await expect(page.getByText('Alles Passende hast du schon übernommen.')).toBeVisible()
  })

  test('BUG-32: blendet ein Filter das noch nicht Übernommene aus, heißt es nicht „Alles Passende hast du schon übernommen"', async ({ page }) => {
    test.fail(true, 'BUG-32: der Satz rechnet nur mit der sichtbaren Liste')
    const group = await createGroup('Teilweise', { participants: 10 })
    await openLibrary(page)
    await row(page, FANG).getByRole('button', { name: `„${FANG}" übernehmen` }).click()
    await expect(row(page, FANG).getByText('Übernommen')).toBeVisible()
    await pickGroup(page, group.name)
    await page.getByPlaceholder('Übung suchen...').fill('Fangspiel')
    await expect(count(page)).toHaveText(/^1 Übung /)
    // Drei passende Übungen sind noch nicht übernommen — nur ausgeblendet.
    await expect(page.getByText('Alles Passende hast du schon übernommen.')).toHaveCount(0, { timeout: 3_000 })
  })

  test('BUG-34: bei einem Treffer heißt es „1 Übung passt zu Sportart und Alter"', async ({ page }) => {
    test.fail(true, 'BUG-34: dort steht „1 Übung passen …"')
    const group = await createGroup('Einer', { participants: 10 })
    await openLibrary(page, `&gruppe=${group.id}&suche=Fangspiel`)
    await expect(count(page)).toHaveText('1 Übung passt zu Sportart und Alter', { timeout: 5_000 })
  })

  test('AC: am Handy bleibt die Leiste mit Anzahl und „Übernehmen" erreichbar, ohne waagerechtes Scrollen', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await openLibrary(page)
    await checkbox(page, FANG).check()
    await checkbox(page, PRITSCHEN).check()
    const box = await bar(page).boundingBox()
    expect(box).toBeTruthy()
    expect(box!.y + box!.height).toBeLessThanOrEqual(667 + 1)
    await expect(bar(page)).toContainText('2 ausgewählt')
    await expect(bar(page).getByRole('button', { name: 'Übernehmen' })).toBeInViewport()
    await page.mouse.wheel(0, 2000)
    await expect(bar(page).getByRole('button', { name: 'Übernehmen' })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
  })

  test('AC: ohne Gruppe erklärt „Passt zu Gruppe", dass es eine Gruppe braucht, mit „Gruppe anlegen"', async ({ page }) => {
    try {
      await cleanup(admin, userId) // nimmt auch die Testgruppe des Grundbestands
      await admin.from('groups').delete().eq('user_id', userId)
      await openLibrary(page)
      await expect(page.getByText(/Für „Passt zu Gruppe“ braucht es eine Gruppe/)).toBeVisible()
      // Bewusst sofort, während die Liste noch lädt (BUG-31: der Klick ging verloren
      // oder die Adresse blieb stehen, während schon die neue Seite zu sehen war).
      await page.getByRole('link', { name: 'Gruppe anlegen' }).click()
      await expect(page.getByRole('heading', { level: 1, name: 'Neue Gruppe anlegen' })).toBeVisible()
      await expect(page).toHaveURL(/\/groups\/new$/)
    } finally {
      await seed(admin, userId)
    }
  })
})

// ==== E. Einstiege ====

test.describe('PROJ-4 — E. Einstiege', () => {
  test('AC: ohne eigene Übung bietet „Meine Übungen" auch „Aus der Übungsdatenbank übernehmen" an', async ({ page }) => {
    try {
      await admin.from('exercises').delete().eq('user_id', userId)
      await page.goto('/exercises')
      await expect(page.getByRole('heading', { name: 'Noch keine Übungen vorhanden' })).toBeVisible()
      await expect(page.getByRole('link', { name: /Erste Übung anlegen/ })).toBeVisible()
      await page.getByRole('link', { name: /Aus der Übungsdatenbank übernehmen/ }).click()
      await expect(page.getByRole('tab', { name: 'Übungsdatenbank' })).toHaveAttribute('aria-selected', 'true')
      await expect(row(page, FANG)).toBeVisible()
    } finally {
      await seed(admin, userId)
    }
  })

  test('AC: ohne eigene Übung führt der Generator mit gesetzter Gruppe in die Übungsdatenbank — „in Vorbereitung" ist weg', async ({ page }) => {
    const group = await createGroup('Einstieg')
    try {
      await admin.from('exercises').delete().eq('user_id', userId)
      await page.goto(`/units/new?group=${group.id}`)
      await expect(page.getByText(/Der Generator stellt Einheiten aus deinen eigenen Übungen zusammen/)).toBeVisible()
      await expect(page.getByText(/in Vorbereitung/)).toHaveCount(0)
      await page.getByRole('link', { name: 'Zur Übungsdatenbank' }).click()
      await expect(page).toHaveURL(new RegExp(`gruppe=${group.id}`))
      await expect(page.getByRole('combobox', { name: 'Passt zu Gruppe' })).toContainText(group.name)
      await expect(count(page)).toContainText('passen zu Sportart und Alter')
    } finally {
      await seed(admin, userId)
    }
  })

  test('AC: nach dem Anlegen einer neuen Gruppe bietet die App die passenden Übungen an, der Link setzt „Passt zu Gruppe"', async ({ page }) => {
    const name = `${FIXTURE_GROUP_NAME} ${TAG} Neu`
    await page.goto('/groups/new')
    await page.getByLabel('Name *').first().fill(name)
    await page.getByRole('combobox').filter({ hasText: 'Sportarten auswählen' }).click()
    await page.locator('[data-radix-popper-content-wrapper]').last().getByText('Kinderturnen', { exact: true }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('combobox').filter({ hasText: 'Altersgruppen auswählen' }).click()
    await page.locator('[data-radix-popper-content-wrapper]').last().getByText('Kinder (4–6)', { exact: true }).click()
    await page.keyboard.press('Escape')
    await page.getByRole('button', { name: /Gruppe erstellen/ }).click()

    await expect(page).toHaveURL(/\/groups\/[0-9a-f-]{36}\?neu=1$/)
    await expect(page.getByText('Zu dieser Gruppe passen 4 Übungen aus der Übungsdatenbank')).toBeVisible()
    await page.getByRole('link', { name: 'Ansehen' }).click()
    await expect(page.getByRole('combobox', { name: 'Passt zu Gruppe' })).toContainText(name)
    await expect(count(page)).toHaveText('4 Übungen passen zu Sportart und Alter')
  })

  test('AC: passt zur neuen Gruppe nichts oder ist alles übernommen, erscheint kein Angebot', async ({ page }) => {
    const none = await createGroup('Ohne Treffer', { sports: ['Handball'], ages: ['Erwachsene (18–45)'] })
    await page.goto(`/groups/${none.id}?neu=1`)
    await expect(page.getByRole('heading', { level: 1, name: none.name })).toBeVisible()
    await expect(page.getByText(/aus der Übungsdatenbank/)).toHaveCount(0)

    const volley = await createGroup('Volley', { sports: ['Volleyball'], ages: ['Jugend (11–14)'] })
    await openLibrary(page)
    await row(page, PRITSCHEN).getByRole('button', { name: `„${PRITSCHEN}" übernehmen` }).click()
    await expect(row(page, PRITSCHEN).getByText('Übernommen')).toBeVisible()
    await page.goto(`/groups/${volley.id}?neu=1`)
    await expect(page.getByRole('heading', { level: 1, name: volley.name })).toBeVisible()
    await expect(page.getByText(/aus der Übungsdatenbank/)).toHaveCount(0)
  })

  test('AC: beim Bearbeiten einer bestehenden Gruppe erscheint kein Angebot', async ({ page }) => {
    const group = await createGroup('Bearbeiten')
    await page.goto(`/groups/${group.id}/edit`)
    await page.getByRole('button', { name: 'Änderungen speichern' }).click()
    await expect(page).toHaveURL(new RegExp(`/groups/${group.id}$`))
    await expect(page.getByRole('heading', { level: 1, name: group.name })).toBeVisible()
    await expect(page.getByText(/aus der Übungsdatenbank/)).toHaveCount(0)
  })
})
