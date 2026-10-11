import { test, expect } from '@playwright/test'

/**
 * PROJ-14 ohne Anmeldung. Diese Tests laufen bewusst **ohne** Sitzungszustand
 * (Projekt „abgemeldet" in playwright.config.ts).
 *
 * `/live` verlangt als einzige Seite der App keine Anmeldung vom Server: eine
 * laufende Stunde muss in einer Halle ohne Empfang und mit abgelaufener
 * Sitzung bedienbar bleiben. Geprüft wird hier, dass die Seite dabei nichts
 * preisgibt, was nicht schon auf dem Gerät liegt.
 */

const AKTE = 'stundenplaner:live:akte'

/** Eine Stundenakte, wie sie ein früherer Nutzer auf dem Gerät hinterlassen haben könnte. */
function session(phase: 'running' | 'ended') {
  const now = Date.now()
  const step = {
    key: 's1',
    kind: 'exercise',
    phase: 'Aufwärmen',
    phaseIndex: 0,
    indexInPhase: 1,
    phaseCount: 1,
    phaseNote: null,
    name: 'Geheime Übung des Vorgängers',
    variantTitle: null,
    plannedMinutes: 8,
    description: 'Beschreibung des Vorgängers',
    materials: [],
    organizationForms: [],
    workNote: 'Arbeitsnotiz des Vorgängers',
    variants: [],
    musicRequired: false,
    musicLink: null,
    exerciseId: '11111111-1111-4111-8111-111111111111',
    variantId: null,
    imagePaths: [],
  }
  return {
    version: 1,
    runId: '22222222-2222-4222-8222-222222222222',
    userId: '33333333-3333-4333-8333-333333333333',
    plan: {
      unitId: '44444444-4444-4444-8444-444444444444',
      unitName: 'Einheit des Vorgängers',
      groupName: 'Gruppe',
      venueName: null,
      participants: 12,
      totalMinutes: 8,
      steps: [step],
    },
    run:
      phase === 'running'
        ? {
            phase,
            startedAt: now - 60_000,
            endedAt: null,
            current: 0,
            enteredAt: now - 60_000,
            pausedAt: null,
            pausedMs: 0,
            steps: [{ elapsedMs: 0, status: 'open' }],
          }
        : {
            phase,
            startedAt: now - 600_000,
            endedAt: now - 60_000,
            current: 0,
            enteredAt: null,
            pausedAt: null,
            pausedMs: 0,
            steps: [{ elapsedMs: 540_000, status: 'done' }],
          },
    noteDraft: '',
    adopted: {},
  }
}

test.describe('PROJ-14 — Live-Modus ohne Anmeldung', () => {
  test('ohne Stundenakte zeigt /live nichts als den Hinweis, dass keine Stunde läuft', async ({ page }) => {
    const response = await page.goto('/live')
    expect(response?.status()).toBe(200)

    await expect(page.getByText('Es läuft gerade keine Stunde')).toBeVisible()
    await expect(page.getByRole('timer')).toHaveCount(0)

    // Die ausgelieferte Seite ist für alle dieselbe und enthält keine Daten.
    const body = (await response?.text()) ?? ''
    expect(body).not.toContain('E2E')
    expect(body).not.toContain('Kreisfangen')
  })

  test('der Offline-Baustein liegt aus und ist auf /live begrenzt', async ({ page }) => {
    const response = await page.request.get('/live-sw.js')
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toContain('javascript')
    expect(response.headers()['x-content-type-options']).toBe('nosniff')

    const script = await response.text()
    expect(script).toContain("const PAGE = '/live'")
    // Nichts, was Daten oder Zugänge ablegen könnte.
    expect(script).not.toMatch(/supabase|cookie|authorization/i)
  })

  test('AC: eine laufende Stunde bleibt bei abgelaufener Sitzung bedienbar', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: AKTE, value: JSON.stringify(session('running')) }
    )
    await page.goto('/live')

    await expect(page.getByRole('heading', { level: 1, name: 'Geheime Übung des Vorgängers' })).toBeVisible()
    await expect(page.getByRole('timer')).toBeVisible()
  })

  test('die Server-Stellen des Live-Modus geben ohne Anmeldung nichts her und schreiben nichts', async ({ page }) => {
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: AKTE, value: JSON.stringify(session('running')) }
    )
    await page.goto('/live')
    await expect(page.getByRole('timer')).toBeVisible()

    // „Stunde beenden" schickt die Durchführung an den Server — ohne Anmeldung
    // bleibt sie auf dem Gerät liegen, statt angenommen zu werden.
    await page.getByRole('navigation', { name: 'Bedienung' }).getByRole('button', { name: 'Stunde beenden' }).click()
    await expect(page.getByText('Stunde beendet')).toBeVisible()
    await expect(page.getByText('liegt auf diesem Gerät')).toBeVisible()

    const waiting = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('stundenplaner:live:warteliste') ?? '[]')
    )
    expect(waiting).toHaveLength(1)
    expect(waiting[0].failure).toBeNull()
  })

  test('eine beendete Stunde eines früheren Nutzers ist ohne Anmeldung nicht mehr einsehbar', async ({ page }) => {
    // War BUG-24: die Zusammenfassung einer beendeten Stunde blieb auf dem
    // Gerät und war unter /live für jeden zu sehen.
    await page.addInitScript(
      ({ key, value }) => localStorage.setItem(key, value),
      { key: AKTE, value: JSON.stringify(session('ended')) }
    )
    await page.goto('/live')

    // Anders als eine laufende Stunde muss eine beendete nicht bedienbar
    // bleiben — ohne Anmeldung gibt es an ihr nichts mehr zu tun. Geprüft wird
    // an dem, was stattdessen dastehen soll: „nichts zu sehen" allein gälte
    // auch für die Sekunde, in der die Seite noch lädt.
    await expect(page.getByText('Es läuft gerade keine Stunde')).toBeVisible()
    await expect(page.getByText('Geheime Übung des Vorgängers')).toHaveCount(0)
    await expect(page.getByText('Einheit des Vorgängers')).toHaveCount(0)

    // Nicht bloß verborgen: sie liegt auch nicht mehr im Speicher des Browsers.
    await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), AKTE)).toBeNull()
  })

  test('ein offen gelassenes Bereitschaftsbild ist ohne Anmeldung nicht einsehbar', async ({ page }) => {
    const ready = session('running')
    const value = JSON.stringify({
      ...ready,
      run: { ...ready.run, phase: 'ready', startedAt: null, enteredAt: null },
    })
    await page.addInitScript(({ key, value }) => localStorage.setItem(key, value), { key: AKTE, value })
    await page.goto('/live')

    await expect(page.getByText('Es läuft gerade keine Stunde')).toBeVisible()
    await expect(page.getByText('Einheit des Vorgängers')).toHaveCount(0)
  })

  test('eine beendete Stunde bleibt ohne Anmeldung stehen, solange ihre Durchführung noch auf dem Gerät wartet', async ({ page }) => {
    // Der Fall, für den die Ausnahme da ist: Halle ohne Netz, die Sitzung ist
    // während der Stunde abgelaufen, die Durchführung noch nicht nachgereicht.
    const ended = session('ended')
    const record = {
      id: ended.runId,
      unitId: ended.plan.unitId,
      unitName: ended.plan.unitName,
      startedAt: new Date(ended.run.startedAt as number).toISOString(),
      endedAt: new Date(ended.run.endedAt as number).toISOString(),
      plannedMinutes: 8,
      actualSeconds: 540,
      pausedSeconds: 0,
      note: '',
      steps: [],
    }
    await page.addInitScript(
      ({ key, value, queue }) => {
        localStorage.setItem(key, value)
        localStorage.setItem('stundenplaner:live:warteliste', queue)
      },
      {
        key: AKTE,
        value: JSON.stringify(ended),
        queue: JSON.stringify([{ userId: ended.userId, record, failure: null }]),
      }
    )
    await page.goto('/live')

    await expect(page.getByText('Stunde beendet')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Einheit des Vorgängers' })).toBeVisible()
    await expect(page.getByText('liegt auf diesem Gerät')).toBeVisible()
  })
})
