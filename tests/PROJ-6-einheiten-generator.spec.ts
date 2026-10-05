import { test, expect } from '@playwright/test'
import {
  adminClient,
  deleteUnitsOfGroup,
  FIXTURE_EXERCISE_COUNT,
  getFixtures,
  MARKER,
  testUserId,
  TEST_EMAIL,
  type Fixtures,
} from './fixtures'

/**
 * E2E-Tests für PROJ-6 gegen die Akzeptanzkriterien der Spec.
 *
 * Laufen angemeldet (siehe auth.setup.ts) gegen ein eigenes Testkonto mit
 * eigens angelegten Daten — die echten Übungen und Einheiten des Entwicklers
 * werden nie angefasst.
 */

/**
 * Nacheinander, nicht parallel: Alle Tests teilen sich **ein** Testkonto und
 * räumen zwischendurch dessen Einheiten weg. Nebenläufig würden sie sich
 * gegenseitig die Daten unter den Füßen wegziehen.
 */
test.describe.configure({ mode: 'serial' })

const admin = adminClient()
let userId: string
let fixtures: Fixtures

test.beforeAll(async () => {
  userId = await testUserId(admin, TEST_EMAIL)
  // Nur nachschlagen, nicht anlegen: Der Grundbestand kommt aus dem Projekt
  // „setup" und wird im Projekt „teardown" wieder abgeräumt.
  fixtures = await getFixtures(admin, userId)
})

/**
 * Vor jedem Test die Einheiten **dieser Gruppe** leeren.
 *
 * Bewusst nicht alle Einheiten des Kontos: Das Konto wird mit den übrigen
 * Spec-Dateien und dem Mobile-Projekt geteilt, die bei `fullyParallel: true`
 * gleichzeitig laufen. Ein Rundumschlag riss ihnen die Daten weg und machte
 * diesen Test im Verbund rot, obwohl er allein grün war.
 */
test.beforeEach(async () => {
  await deleteUnitsOfGroup(admin, userId, fixtures.groupId)
})

async function generateStandardUnit(page: import('@playwright/test').Page) {
  await page.goto(`/units/new?group=${fixtures.groupId}`)
  await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
  await page.getByRole('button', { name: /Einheit generieren/ }).click()
  await page.waitForURL(/\/units\/[0-9a-f-]{36}$/)
}

test.describe('PROJ-6 — Generieren und Entwurf', () => {
  test('AC: Gruppe ist über ?group= vorausgefüllt und „Standard" ist gewählt', async ({ page }) => {
    await page.goto(`/units/new?group=${fixtures.groupId}`)
    await expect(page.getByText(fixtures.groupName).first()).toBeVisible()
    // „Standard" ist vorausgewählt, der Zeitverlauf also zu.
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Einheit generieren/ })).toBeEnabled()
  })

  test('AC: Generieren führt zum Stundenverlauf als Entwurf', async ({ page }) => {
    await generateStandardUnit(page)
    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Einheit speichern' })).toBeVisible()
  })

  test('AC: Standard ergibt bei 60 Minuten die Segmente 12 / 36 / 12', async ({ page }) => {
    await generateStandardUnit(page)
    await expect(page.getByRole('heading', { name: 'Aufwärmen' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Hauptteil' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Cool-Down' })).toBeVisible()
    await expect(page.getByText('36 Min')).toBeVisible()
  })

  test('AC: ein Entwurf erscheint nicht in „Meine Einheiten"', async ({ page }) => {
    await generateStandardUnit(page)
    await page.goto('/units')
    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()
  })

  test('AC: erneutes Generieren hinterlässt nur einen Entwurf', async ({ page }) => {
    await generateStandardUnit(page)
    await generateStandardUnit(page)

    const { count } = await admin
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('saved', false)

    expect(count).toBe(1)
  })
})

test.describe('PROJ-6 — Speichern, Benennen, Löschen', () => {
  test('AC: „Einheit speichern" öffnet einen Dialog mit vorausgefülltem Namen', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    const field = dialog.getByLabel('Name')
    await expect(field).toHaveValue(new RegExp(fixtures.groupName))
  })

  test('AC: der geänderte Name gilt in der Übersicht', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Eigener Einheitenname')
    await dialog.getByRole('button', { name: 'Speichern' }).click()

    /**
     * ‚Gespeichert‘ **nur** mit `exact`.
     *
     * Ohne das greift `getByText` als Teilzeichenkette und ohne Rücksicht auf
     * Groß- und Kleinschreibung (`internal:text="…"i`). Der Absatz des
     * Entwurfs — ‚Noch nicht gespeichert — diese Einheit erscheint erst …‘ —
     * erfüllte die Zusicherung damit ebenfalls. Ein **fehlgeschlagenes**
     * Speichern lief so als Bestätigung durch, und der Test scheiterte erst
     * eine Zeile später an der leeren Übersicht — an einer Stelle, die wie ein
     * Produktfehler aussieht und keiner ist.
     *
     * Mit `exact` trifft die Zusicherung genau den Vermerk neben dem Haken,
     * den die Seite erst nach `unit.saved === true` vom Server zeigt.
     */
    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()

    /**
     * Zwischenprüfung am Bestand. Scheitert der Test im Verbund, trennt sie
     * die drei möglichen Ursachen voneinander: keine Zeile (die Einheit wurde
     * weggelöscht), `saved: false` (das Speichern lief ins Leere, etwa weil
     * die Zeile vorher verschwand — ein Update ohne Treffer meldet in
     * Supabase keinen Fehler), oder `saved: true` bei trotzdem leerer
     * Übersicht (dann schlug das Lesen in `getUnits` fehl).
     */
    const { data: row } = await admin
      .from('units')
      .select('id, saved')
      .eq('user_id', userId)
      .eq('group_id', fixtures.groupId)
      .maybeSingle()
    expect(row, 'Die Einheit steht nicht mehr im Bestand').not.toBeNull()
    expect(row?.saved, 'Der Server hat die Einheit nicht als gespeichert vermerkt').toBe(true)

    await page.goto('/units')
    await expect(page.getByText('Eigener Einheitenname')).toBeVisible()
  })

  test('AC: Abbrechen lässt die Einheit ein Entwurf bleiben', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click()

    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    await page.goto('/units')
    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()
  })

  test('AC: Umbenennen über das Karten-Menü wirkt in der Übersicht', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()

    await page.goto('/units')
    await page.getByRole('button', { name: /Aktionen für/ }).first().click()
    await page.getByRole('menuitem', { name: 'Umbenennen' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByLabel('Name').fill('Umbenannte Einheit')
    // „Umbenennen" heißt der Menüpunkt und die Überschrift des Dialogs; sein
    // Bestätigungsknopf heißt „Speichern" (`unit-actions-menu.tsx:116`).
    await dialog.getByRole('button', { name: 'Speichern' }).click()

    await expect(page.getByText('Umbenannte Einheit')).toBeVisible()
  })

  test('AC: Löschen entfernt die Einheit, die Übungen bleiben', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()

    await page.goto('/units')
    await page.getByRole('button', { name: /Aktionen für/ }).first().click()
    await page.getByRole('menuitem', { name: 'Löschen' }).click()
    await page.getByRole('button', { name: 'Endgültig löschen' }).click()

    await expect(page.getByText('Noch keine Einheit generiert')).toBeVisible()

    // Auf die markierten Testübungen eingegrenzt: Der Satz des Grundbestands
    // ist bekannt, alles andere im Konto geht diesen Test nichts an.
    const { count } = await admin
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('work_notes', MARKER)
    expect(count).toBe(FIXTURE_EXERCISE_COUNT)
  })
})

test.describe('PROJ-6 — Zurück zum Generator', () => {
  test('AC: der Bedienstand „Standard" wird wiederhergestellt', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('link', { name: /Zurück zum Generator/ }).click()

    await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
    // Mit „Standard" erzeugt → der Zeitverlauf bleibt zu.
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
  })

  test('AC: auch aus „Meine Einheiten" heraus greift der Bedienstand', async ({ page }) => {
    await generateStandardUnit(page)
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()

    // Über die Übersicht statt direkt aus dem Generator.
    await page.goto('/units')
    await page.getByRole('link', { name: new RegExp(fixtures.groupName) }).first().click()
    await page.getByRole('link', { name: /Zurück zum Generator/ }).click()

    await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()
    await expect(page.getByText('Zeitverlauf')).toHaveCount(0)
  })
})

test.describe('PROJ-6 — Neu generieren', () => {
  test('AC: aus einer gespeicherten Einheit entsteht ein Entwurf daneben', async ({ page }) => {
    await generateStandardUnit(page)
    const savedUrl = page.url()

    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click()
    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()

    await page.getByRole('button', { name: /Neu generieren/ }).click()

    // Landet auf einer anderen Einheit, und diese ist ein Entwurf.
    await expect(page.getByText(/Noch nicht gespeichert/)).toBeVisible()
    expect(page.url()).not.toBe(savedUrl)

    // Die gespeicherte Fassung steht unverändert im Ordner. Auf die
    // Testgruppe eingegrenzt, damit nebenläufige Tests das Ergebnis nicht
    // verfälschen können.
    const { count } = await admin
      .from('units')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('group_id', fixtures.groupId)
      .eq('saved', true)
    expect(count).toBe(1)
  })
})

test.describe('PROJ-6 — Löschwarnung bei Übungen', () => {
  /** Die erste Übung, die in der aktuellen Einheit des Testkontos steckt. */
  async function exerciseInCurrentUnit(): Promise<string> {
    const { data: units } = await admin
      .from('units')
      .select('id')
      .eq('user_id', userId)
      .eq('group_id', fixtures.groupId)
    const unitIds = (units ?? []).map((u) => u.id)
    const { data: segments } = await admin
      .from('unit_segments')
      .select('id')
      .in('unit_id', unitIds)
    const { data: items } = await admin
      .from('unit_items')
      .select('exercise_id')
      .in('segment_id', (segments ?? []).map((s) => s.id))
      .not('exercise_id', 'is', null)
      .limit(1)

    const id = items?.[0]?.exercise_id
    if (!id) throw new Error('Keine eingeplante Übung gefunden')
    return id
  }

  test('AC: ein Entwurf wird in der Warnung nicht genannt, eine gespeicherte Einheit schon', async ({
    page,
  }) => {
    // Erst als Entwurf — die Warnung darf schweigen.
    await generateStandardUnit(page)
    const exerciseId = await exerciseInCurrentUnit()

    await page.goto(`/exercises/${exerciseId}`)
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText(/wird in .* Einheit/)).toHaveCount(0)
    await page.getByRole('button', { name: 'Abbrechen' }).click()

    // Jetzt dieselbe Einheit speichern — nun muss die Warnung erscheinen.
    // Ohne diese Gegenprobe wäre der Test auch dann grün, wenn die Warnung
    // grundsätzlich nie auftaucht.
    await admin
      .from('units')
      .update({ saved: true })
      .eq('user_id', userId)
      .eq('group_id', fixtures.groupId)

    await page.goto(`/exercises/${exerciseId}`)
    await page.getByRole('button', { name: 'Löschen' }).click()
    await expect(page.getByText(/wird in .* Einheit/)).toBeVisible()
  })
})

// Der Leerzustand „noch keine Gruppe" braucht ein Konto **ohne** Gruppen und
// räumt dafür alles weg. Das verträgt sich nicht mit nebenläufigen Tests und
// steht deshalb in `PROJ-6-leerzustand.exklusiv.spec.ts`, das zuletzt und
// allein läuft.
