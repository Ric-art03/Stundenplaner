import { test, expect, type Page } from '@playwright/test'
import { adminClient, testUserId, TEST_EMAIL } from './fixtures'
import {
  buildUnit,
  cleanupEditor,
  seedEditor,
  type BuiltUnit,
  type EditorFixtures,
  type SegmentLayout,
} from './editor-fixtures'

/**
 * E2E-Tests für PROJ-7 (Einheiten-Editor) gegen die Akzeptanzkriterien der
 * Spec, einschließlich der Überarbeitung vom 2026-10-09.
 *
 * Jeder Test baut sich **seine eigene Einheit** und fasst keine andere an.
 * Dadurch dürfen die Tests nebeneinander und in beiden Browser-Projekten
 * laufen — die Gruppe und die Übungen gehören je Projekt.
 */

const admin = adminClient()
let userId: string
let fx: EditorFixtures

test.beforeAll(async ({}, testInfo) => {
  userId = await testUserId(admin, TEST_EMAIL)
  fx = await seedEditor(admin, userId, testInfo.project.name)
})

test.afterAll(async ({}, testInfo) => {
  await cleanupEditor(admin, userId, testInfo.project.name)
})

// Die Tests einer Datei teilen sich die Übungen; „Schnell anlegen" legt eine
// dazu und räumt sie wieder weg. Nacheinander in einem Arbeiter bleibt der
// Bestand für jeden Test vorhersagbar — aber ohne Abbruch: ein Fehlschlag soll
// die übrigen Tests nicht verdecken.
test.describe.configure({ mode: 'default' })

// ---- Helfer ----

async function open(page: Page, segments: SegmentLayout[]): Promise<BuiltUnit> {
  const unit = await buildUnit(admin, userId, fx, segments)
  await page.goto(`/units/${unit.id}`)
  await expect(page.getByRole('heading', { name: unit.name })).toBeVisible()
  return unit
}

async function edit(page: Page) {
  await page.getByRole('button', { name: 'Bearbeiten', exact: true }).click()
  await expect(bar(page)).toBeVisible()
}

/**
 * Das Speichern ist durch, wenn der Bearbeiten-Modus verlassen ist. Bewusst am
 * Zustand der Seite geprüft und nicht an der Erfolgsmeldung: die Meldungen
 * haben ihren eigenen Test.
 */
async function expectSaved(page: Page) {
  await expect(bar(page)).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Bearbeiten', exact: true })).toBeVisible()
}

/** Die Änderungsleiste. */
function bar(page: Page) {
  return page.getByRole('region', { name: 'Offene Änderungen' })
}

/** Das Menü am Platz mit dieser Nummer. */
async function menu(page: Page, position: number) {
  await page
    .getByRole('button', { name: `Weitere Möglichkeiten für Platz ${position}` })
    .click()
}

/** Die Namen der Übungen im Plan, in ihrer Reihenfolge. */
async function order(page: Page): Promise<string[]> {
  return page.locator('section a[href^="/exercises/"]').allTextContents()
}

/** Drei Übungen à 5 Minuten in einer Phase von 15 — geht auf. */
function full(): SegmentLayout[] {
  return [
    {
      minutes: 15,
      items: [
        { exerciseId: fx.exercises.alpha, minutes: 5 },
        { exerciseId: fx.exercises.beta, minutes: 5 },
        { exerciseId: fx.exercises.gamma, minutes: 5 },
      ],
    },
  ]
}

async function segmentRow(unit: BuiltUnit) {
  const { data } = await admin
    .from('unit_segments')
    .select('planned_gap_minutes, notes')
    .eq('id', unit.segmentIds[0])
    .single()
  return data
}

async function itemsOf(unit: BuiltUnit) {
  const { data } = await admin
    .from('unit_items')
    .select('exercise_id, variant_id, planned_duration')
    .eq('segment_id', unit.segmentIds[0])
    .order('position')
  return data ?? []
}

// ---- Betreten und Verlassen ----

test.describe('PROJ-7 — Bearbeiten-Modus betreten und verlassen', () => {
  test('AC: „Bearbeiten" blendet die Bedienelemente ein, „Fertig" führt ohne Nachfrage zurück', async ({
    page,
  }) => {
    await open(page, full())
    await edit(page)

    await expect(bar(page).getByText('Keine Änderungen')).toBeVisible()
    await expect(bar(page).getByRole('button', { name: 'Fertig' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Bearbeiten', exact: true })).toHaveCount(0)
    await expect(page.getByText('Gespeichert', { exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: /Neu generieren/ })).toHaveCount(0)
    await expect(page.getByLabel('Plandauer')).toHaveCount(3)

    await bar(page).getByRole('button', { name: 'Fertig' }).click()
    await expect(bar(page)).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Bearbeiten', exact: true })).toBeVisible()
  })

  test('AC: mit offenen Änderungen fragt ein Verweis auf eine andere Seite nach', async ({ page }) => {
    await open(page, full())
    await edit(page)
    await page.getByRole('button', { name: /Nach unten, derzeit Platz 1 von 3/ }).click()
    await expect(bar(page).getByText('1 offene Änderung')).toBeVisible()
    await expect(bar(page).getByRole('button', { name: 'Speichern' })).toBeVisible()

    await page.getByRole('link', { name: /Zurück zum Generator/ }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Änderungen speichern?')).toBeVisible()

    // Abbrechen: der Nutzer bleibt, die Änderung bleibt.
    await dialog.getByRole('button', { name: 'Abbrechen' }).click()
    await expect(page).toHaveURL(/\/units\/[0-9a-f-]{36}$/)
    await expect(bar(page).getByText('1 offene Änderung')).toBeVisible()
  })
})

// ---- Entfernen, Dauer, Reihenfolge, Rückgängig ----

test.describe('PROJ-7 — Entfernen, Dauer, Reihenfolge', () => {
  test('AC: Umsortieren ändert die Reihenfolge, der Rand ist gesperrt, „Rückgängig" nimmt zurück', async ({
    page,
  }) => {
    await open(page, full())
    await edit(page)

    await expect(page.getByRole('button', { name: /Nach oben, derzeit Platz 1 von 3/ })).toBeDisabled()
    await expect(page.getByRole('button', { name: /Nach unten, derzeit Platz 3 von 3/ })).toBeDisabled()

    await page.getByRole('button', { name: /Nach oben, derzeit Platz 2 von 3/ }).click()
    expect(await order(page)).toEqual([fx.names.beta, fx.names.alpha, fx.names.gamma])

    await bar(page).getByRole('button', { name: 'Rückgängig' }).click()
    expect(await order(page)).toEqual([fx.names.alpha, fx.names.beta, fx.names.gamma])
    await expect(bar(page).getByText('Keine Änderungen')).toBeVisible()
    await expect(bar(page).getByRole('button', { name: 'Rückgängig' })).toBeDisabled()
  })

  test('AC: eine Plandauer von 0 wird auf 1 Minute korrigiert, mit Hinweis', async ({ page }) => {
    await open(page, full())
    await edit(page)

    const field = page.getByLabel('Plandauer').first()
    await field.fill('0')
    await field.blur()

    await expect(field).toHaveValue('1')
    await expect(page.getByText(/Mindestens 1 Minute — auf 1 gesetzt/)).toBeVisible()
    await expect(page.getByText('11 von 15 Min · 4 Min frei')).toBeVisible()
  })

  test('AC: Überfüllung wird ausgewiesen, im Dialog genannt und lässt sich speichern', async ({
    page,
  }) => {
    const unit = await open(page, full())
    await edit(page)

    const field = page.getByLabel('Plandauer').first()
    await field.fill('9')
    await field.blur()
    await expect(page.getByText('4 Min über')).toBeVisible()
    await expect(page.getByText('geschätzt: 5 Min')).toBeVisible()

    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Trotzdem speichern?')).toBeVisible()
    await expect(dialog.getByText(new RegExp(`„${fx.phase}" \\(4 Min über\\)`))).toBeVisible()
    await dialog.getByRole('button', { name: 'Speichern' }).click()

    await expectSaved(page)
    await expect(page.getByText('· manuell bearbeitet')).toBeVisible()
    expect((await itemsOf(unit)).map((item) => item.planned_duration)).toEqual([9, 5, 5])
  })

  test('AC: „Verwerfen" stellt den gespeicherten Zustand wieder her', async ({ page }) => {
    const unit = await open(page, full())
    await edit(page)

    await menu(page, 1)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()
    expect(await order(page)).toEqual([fx.names.beta, fx.names.gamma])

    await bar(page).getByRole('button', { name: 'Verwerfen' }).click()
    await page.getByRole('alertdialog').getByRole('button', { name: 'Verwerfen' }).click()

    expect(await order(page)).toEqual([fx.names.alpha, fx.names.beta, fx.names.gamma])
    expect(await itemsOf(unit)).toHaveLength(3)
  })
})

// ---- Lücken ----

test.describe('PROJ-7 — Offene und geplante Lücke', () => {
  test('AC: eine entfernte Übung hinterlässt eine offene Lücke mit genau einem „Übung einfügen"', async ({
    page,
  }) => {
    await open(page, full())
    await edit(page)

    // Ohne Lücke steht der Knopf am Ende der Phase.
    await expect(page.getByRole('button', { name: 'Übung einfügen' })).toHaveCount(1)

    await menu(page, 3)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()

    await expect(page.getByText('10 von 15 Minuten gefüllt — 5 Minuten fehlen')).toBeVisible()
    await expect(page.getByText('5 Min frei')).toBeVisible()
    // Mit Lücke trägt der Hinweis den Knopf — und es bleibt bei einem.
    await expect(page.getByRole('button', { name: 'Übung einfügen' })).toHaveCount(1)
    // Lockern lädt die Einheit neu und gehört deshalb nicht in den Bearbeiten-Modus.
    await expect(page.getByRole('button', { name: /gelockerten Kriterien/ })).toHaveCount(0)
  })

  test('AC: „Als geplante Lücke stehen lassen" beruhigt die Lücke, übersteht das Speichern und das Neuladen', async ({
    page,
  }) => {
    const unit = await open(page, full())
    await edit(page)
    await menu(page, 3)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()

    await page.getByRole('button', { name: 'Als geplante Lücke stehen lassen' }).click()
    await expect(page.getByText(/Geplante Lücke · 5 Min/)).toBeVisible()
    await expect(page.getByText(/Minuten fehlen/)).toHaveCount(0)
    await expect(bar(page).getByText('2 offene Änderungen')).toBeVisible()

    // Rückgängig bringt den gelben Hinweis zurück, erneut erklären beruhigt wieder.
    await bar(page).getByRole('button', { name: 'Rückgängig' }).click()
    await expect(page.getByText(/5 Minuten fehlen/)).toBeVisible()
    await page.getByRole('button', { name: 'Als geplante Lücke stehen lassen' }).click()

    // Ohne offene Lücke wird ohne Nachfrage gespeichert.
    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)
    await expect(page.getByRole('alertdialog')).toHaveCount(0)

    expect((await segmentRow(unit))?.planned_gap_minutes).toBe(5)

    await page.reload()
    await expect(page.getByText(/Geplante Lücke · 5 Min/)).toBeVisible()
    await expect(page.getByText(/Minuten fehlen/)).toHaveCount(0)
  })

  test('AC: werden nach der Erklärung weitere Minuten frei, ist die Lücke wieder offen', async ({
    page,
  }) => {
    await open(page, full())
    await edit(page)
    await menu(page, 3)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()
    await page.getByRole('button', { name: 'Als geplante Lücke stehen lassen' }).click()
    await expect(page.getByText(/Geplante Lücke · 5 Min/)).toBeVisible()

    await menu(page, 2)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()

    await expect(page.getByText('5 von 15 Minuten gefüllt — 10 Minuten fehlen')).toBeVisible()
    await expect(page.getByText(/Geplante Lücke/)).toHaveCount(0)
  })

  test('AC: „Wieder öffnen" macht aus der geplanten wieder eine offene Lücke', async ({ page }) => {
    await open(page, [
      { minutes: 15, plannedGapMinutes: 10, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] },
    ])
    await expect(page.getByText(/Geplante Lücke · 10 Min/)).toBeVisible()
    // In der Leseansicht ist die geplante Lücke nur eine Angabe.
    await expect(page.getByRole('button', { name: 'Wieder öffnen' })).toHaveCount(0)

    await edit(page)
    await page.getByRole('button', { name: 'Wieder öffnen' }).click()
    await expect(page.getByText('5 von 15 Minuten gefüllt — 10 Minuten fehlen')).toBeVisible()
  })

  test('AC: mit offener Lücke wird nicht gespeichert — der Dialog nennt sie und bietet an, sie zu übernehmen', async ({
    page,
  }) => {
    const unit = await open(page, full())
    await edit(page)
    await menu(page, 3)
    await page.getByRole('menuitem', { name: 'Entfernen' }).click()

    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Eine Lücke ist noch offen')).toBeVisible()
    await expect(dialog.getByText(new RegExp(`„${fx.phase}" \\(5 Min frei\\)`))).toBeVisible()

    // Noch ist nichts geschrieben.
    expect(await itemsOf(unit)).toHaveLength(3)

    // Der Dialog ragt nicht über den Rand: sein Hauptknopf liegt innerhalb.
    const box = await dialog.boundingBox()
    const action = await dialog
      .getByRole('button', { name: 'Alle als geplant übernehmen und speichern' })
      .boundingBox()
    expect(box && action && action.x >= box.x && action.x + action.width <= box.x + box.width).toBe(true)

    await dialog.getByRole('button', { name: 'Alle als geplant übernehmen und speichern' }).click()
    await expectSaved(page)

    expect(await itemsOf(unit)).toHaveLength(2)
    expect((await segmentRow(unit))?.planned_gap_minutes).toBe(5)
    await expect(page.getByText(/Geplante Lücke · 5 Min/)).toBeVisible()
  })

  test('AC: eine früher gespeicherte Einheit mit offener Lücke zeigt ihren Hinweis und den Weg zu „Bearbeiten"', async ({
    page,
  }) => {
    await open(page, [
      { minutes: 15, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] },
    ])

    await expect(page.getByText('5 von 15 Minuten gefüllt — 10 Minuten fehlen')).toBeVisible()
    await expect(page.getByText(/Klicke oben auf .Bearbeiten. für weitere Optionen/)).toBeVisible()
    // In der Leseansicht gibt es an der Lücke nichts einzufügen.
    await expect(page.getByRole('button', { name: 'Übung einfügen' })).toHaveCount(0)
  })

  test('AC: ein im Generator frei gelassenes Segment gilt als geplant und ist befüllbar', async ({
    page,
  }) => {
    await open(page, [
      { minutes: 5, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] },
      { name: fx.otherPhase, minutes: 10, fillMode: 'empty', items: [] },
    ])
    await expect(page.getByText('— Lücke —')).toBeVisible()

    await edit(page)
    await expect(page.getByText(/Geplante Lücke · 10 Min/)).toBeVisible()
    // Im Generator geplant — hier gibt es nichts wieder zu öffnen.
    await expect(page.getByRole('button', { name: 'Wieder öffnen' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Übung einfügen' })).toHaveCount(2)
  })
})

test.describe('PROJ-7 — Entwurf mit offener Lücke speichern', () => {
  test('AC: „Einheit speichern" nennt die offene Lücke, bietet „Bearbeiten" an und speichert nach dem Übernehmen', async ({
    page,
  }) => {
    const unit = await buildUnit(
      admin,
      userId,
      fx,
      [{ minutes: 15, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] }],
      { saved: false }
    )
    await page.goto(`/units/${unit.id}`)
    await expect(page.getByText('Mit offenen Lücken:')).toBeVisible()

    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Eine Lücke ist noch offen')).toBeVisible()
    await expect(dialog.getByRole('button', { name: 'Bearbeiten' })).toBeVisible()

    await dialog.getByRole('button', { name: 'Alle als geplant übernehmen und speichern' }).click()

    // Ein Entwurf bekommt beim Speichern seinen Namen.
    const naming = page.getByRole('dialog')
    await naming.getByLabel('Name').fill(`${unit.name} gespeichert`)
    await naming.getByRole('button', { name: 'Speichern' }).click()

    await expect(page.getByText('Gespeichert', { exact: true })).toBeVisible()
    await expect(page.getByText(/Geplante Lücke · 10 Min/)).toBeVisible()
    await expect(page.getByText(/Minuten fehlen/)).toHaveCount(0)

    const { data: row } = await admin.from('units').select('saved, name').eq('id', unit.id).single()
    expect(row?.saved).toBe(true)
    expect(row?.name).toBe(`${unit.name} gespeichert`)
    expect((await segmentRow(unit))?.planned_gap_minutes).toBe(10)
  })

  test('AC: bricht der Nutzer im Namensdialog ab, bleibt die Lücke offen', async ({ page }) => {
    const unit = await buildUnit(
      admin,
      userId,
      fx,
      [{ minutes: 15, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] }],
      { saved: false }
    )
    await page.goto(`/units/${unit.id}`)

    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Alle als geplant übernehmen und speichern' })
      .click()
    await page.getByRole('dialog').getByRole('button', { name: 'Abbrechen' }).click()

    // Nichts ist erklärt worden, was der Nutzer nicht sieht: die Lücke ist
    // weiter gelb, und das nächste Speichern fragt wieder.
    await expect(page.getByText('5 von 15 Minuten gefüllt — 10 Minuten fehlen')).toBeVisible()
    await page.getByRole('button', { name: 'Einheit speichern' }).click()
    await expect(page.getByRole('alertdialog').getByText('Eine Lücke ist noch offen')).toBeVisible()
    expect((await segmentRow(unit))?.planned_gap_minutes).toBe(0)
  })
})

// ---- Auswürfeln ----

test.describe('PROJ-7 — Neu auswürfeln', () => {
  /** Würfelt am ersten Platz und wartet, bis der Vorgang durch ist. */
  async function roll(page: Page) {
    await menu(page, 1)
    await page.getByRole('menuitem', { name: 'Neu auswürfeln' }).click()
    await expect(page.getByText('Wird gewürfelt …')).toHaveCount(0)
  }

  /** Was im ersten Platz steht — Übung samt Variante, denn Varianten sind eigene Kandidaten. */
  async function formInPlace(page: Page): Promise<string> {
    const [name] = await order(page)
    const variant = page.getByText(/^Variante: /)
    return (await variant.count()) > 0 ? `${name} — ${await variant.first().textContent()}` : name
  }

  test('AC: jeder Wurf bringt etwas Neues, nichts kehrt wieder, und der Platz behält seine Minuten', async ({
    page,
  }) => {
    await open(page, [{ minutes: 5, items: [{ exerciseId: fx.exercises.beta, minutes: 5 }] }])
    await edit(page)

    // Zu ziehen sind Gamma, Alpha und die zwei Varianten von Alpha. Wie viele
    // Würfe das ergibt, hängt von der Reihenfolge ab: steht eine Form von Alpha
    // im Platz, gilt die ganze Übung als „in dieser Einheit" und ihre übrigen
    // Formen werden nicht gezogen. Zwei Würfe sind es mindestens, vier höchstens.
    const seen = new Set<string>([await formInPlace(page)])
    let changes = 0

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const before = await formInPlace(page)
      await roll(page)
      const form = await formInPlace(page)

      // Der Vorrat ist erschöpft: der Platz bleibt, wie er ist.
      if (form === before) break

      expect(seen.has(form), `„${form}" stand hier schon`).toBe(false)
      seen.add(form)
      changes += 1
      await expect(bar(page).getByText(new RegExp(`^${changes} offene Änderung`))).toBeVisible()
    }

    expect(changes).toBeGreaterThanOrEqual(2)
    expect(changes).toBeLessThanOrEqual(4)
    expect([...seen]).toContain(fx.names.gamma)
    expect([...seen].some((form) => form.startsWith(fx.names.alpha))).toBe(true)
    await expect(page.getByLabel('Plandauer')).toHaveValue('5')

    // Ein weiterer Wurf findet nichts mehr und zählt nicht als Änderung.
    const settled = await formInPlace(page)
    await roll(page)
    expect(await formInPlace(page)).toBe(settled)
    await expect(bar(page).getByText(new RegExp(`^${changes} offene Änderung`))).toBeVisible()
  })

  test('AC: was in der Einheit schon steht, wird nicht gewürfelt', async ({ page }) => {
    await open(page, full())
    await edit(page)

    // Alle drei passenden Übungen stehen schon im Plan — es gibt nichts zu ziehen.
    await roll(page)
    expect(await order(page)).toEqual([fx.names.alpha, fx.names.beta, fx.names.gamma])
    await expect(bar(page).getByText('Keine Änderungen')).toBeVisible()
  })

  test('AC: ist der Vorrat erschöpft, erscheint eine Meldung mit jeder Ursache und ihrer Anzahl', async ({
    page,
  }) => {
    await open(page, full())
    await edit(page)
    await roll(page)

    // Kein stilles Nichts-Passiert: die Begründung muss zu sehen sein.
    await expect(page.getByText('Keine weitere passende Übung').first()).toBeVisible()
    await expect(page.getByText(/3 × steht schon in dieser Einheit/).first()).toBeVisible()
    await expect(page.getByText(/1 × Schwierigkeit/).first()).toBeVisible()
  })
})

// ---- Auswahldialog ----

test.describe('PROJ-7 — Übung selbst wählen', () => {
  test('AC: passende zuerst, unpassende aufklappbar mit Begründung, und eine unpassende lässt sich ohne Nachfrage einsetzen', async ({
    page,
  }) => {
    const unit = await open(page, [
      { minutes: 5, items: [{ exerciseId: fx.exercises.beta, minutes: 5 }] },
    ])
    await edit(page)
    await menu(page, 1)
    await page.getByRole('menuitem', { name: /Selbst wählen/ }).click()

    const dialog = page.getByRole('dialog')
    await expect(dialog.getByText(`Übung für „${fx.phase}"`)).toBeVisible()
    // Eine Zeile je Übung: Alpha zählt mit ihren zwei Varianten einmal.
    await expect(dialog.getByText(/^Passend \(\d+\)$/)).toBeVisible()
    await expect(dialog.getByText(fx.names.alpha)).toHaveCount(1)
    await expect(dialog.getByText(fx.names.delta)).toHaveCount(0)

    // Material, Organisationsform und Varianten stehen an der Zeile.
    await expect(dialog.getByText('Hütchen')).toBeVisible()
    await expect(dialog.getByText('Kleingruppen')).toBeVisible()
    await expect(dialog.getByRole('button', { name: /Varianten \(2\)/ })).toBeVisible()

    await dialog.getByRole('button', { name: /Auch unpassende anzeigen/ }).click()
    await expect(dialog.getByText(fx.names.delta)).toBeVisible()
    await expect(dialog.getByText('passt nicht: Phase').first()).toBeVisible()
    await expect(dialog.getByText('passt nicht: Schwierigkeit').first()).toBeVisible()

    await dialog.getByText(fx.names.delta).click()
    await expect(dialog).toHaveCount(0)
    expect(await order(page)).toEqual([fx.names.delta])
    await expect(page.getByLabel('Plandauer')).toHaveValue('5')

    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)
    expect((await itemsOf(unit)).map((item) => item.exercise_id)).toEqual([fx.exercises.delta])
  })

  test('AC: die Suche filtert in beiden Gruppen und findet eine Übung über den Titel ihrer Variante', async ({
    page,
  }) => {
    await open(page, [{ minutes: 5, items: [{ exerciseId: fx.exercises.beta, minutes: 5 }] }])
    await edit(page)
    await page.getByRole('button', { name: 'Übung einfügen' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder(/suchen/).fill('Zu zweit')
    await expect(dialog.getByText(fx.names.alpha)).toBeVisible()
    await expect(dialog.getByText(fx.names.gamma)).toHaveCount(0)

    // Über „Varianten (2)" lässt sich genau diese Form einsetzen.
    await dialog.getByRole('button', { name: /Varianten \(2\)/ }).click()
    await dialog.getByRole('button', { name: 'Zu zweit' }).click()

    await expect(dialog).toHaveCount(0)
    await expect(page.getByText('Variante: Zu zweit')).toBeVisible()
    // Eingefügt wird mit der Schätzdauer — die Phase ist damit überfüllt.
    await expect(page.getByText('5 Min über')).toBeVisible()
  })
})

// ---- Varianten ----

test.describe('PROJ-7 — Varianten auf der Karte', () => {
  test('AC: in der Leseansicht klappen die Namen auf, ohne dass etwas wählbar ist', async ({ page }) => {
    await open(page, [
      {
        minutes: 5,
        items: [{ exerciseId: fx.exercises.alpha, variantId: fx.variants.ball, minutes: 5 }],
      },
    ])

    await expect(page.getByText('Variante: Mit Ball')).toBeVisible()
    // Das Material der Variante gilt, nicht das der Grundübung.
    await expect(page.getByText(/6× Bälle/)).toBeVisible()
    await expect(page.getByText(/Hütchen/)).toHaveCount(0)

    await page.getByRole('button', { name: /Varianten \(2\)/ }).click()
    await expect(page.getByText('Grundübung')).toBeVisible()
    await expect(page.getByText('Zu zweit')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Zu zweit' })).toHaveCount(0)
  })

  test('AC: im Bearbeiten-Modus ersetzt die gewählte Form den Eintrag, und die Grundübung bleibt wählbar', async ({
    page,
  }) => {
    const unit = await open(page, [
      { minutes: 5, items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }] },
    ])
    await edit(page)

    // Der Menüpunkt von früher ist weg — umgeschaltet wird auf der Karte.
    await menu(page, 1)
    await expect(page.getByRole('menuitem', { name: /Variante umschalten/ })).toHaveCount(0)
    await page.keyboard.press('Escape')

    await page.getByRole('button', { name: /Varianten \(2\)/ }).click()
    await page.getByRole('button', { name: 'Zu zweit' }).click()

    await expect(page.getByText('Variante: Zu zweit')).toBeVisible()
    // Die Organisationsform der Variante gilt.
    await expect(page.getByText('Zu zweit / Paare')).toBeVisible()
    await expect(page.getByLabel('Plandauer')).toHaveValue('5')

    await page.getByRole('button', { name: /Varianten \(2\)/ }).click()
    await page.getByRole('button', { name: 'Grundübung' }).click()
    await expect(page.getByText(/^Variante:/)).toHaveCount(0)
    await expect(page.getByText('Kleingruppen')).toBeVisible()
    // Zurück beim Ausgangszustand — am Plan hat sich nichts geändert.
    await expect(bar(page).getByRole('button', { name: 'Fertig' })).toBeVisible()

    await page.getByRole('button', { name: /Varianten \(2\)/ }).click()
    await page.getByRole('button', { name: 'Mit Ball' }).click()
    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)
    expect((await itemsOf(unit))[0].variant_id).toBe(fx.variants.ball)
  })
})

// ---- Arbeitsnotiz ----

test.describe('PROJ-7 — Arbeitsnotiz', () => {
  test('AC: die Arbeitsnotiz der Übung steht in der Leseansicht, der Schalter blendet sie aus und merkt sich das', async ({
    page,
  }) => {
    await open(page, full())

    const notes = page.getByText(/E2E-Testdaten \(PROJ-7\)/)
    await expect(notes).toHaveCount(3)

    const toggle = page.getByRole('switch', { name: 'Arbeitsnotizen anzeigen' })
    await expect(toggle).toBeChecked()
    await toggle.click()
    await expect(notes).toHaveCount(0)

    await page.reload()
    await expect(page.getByRole('switch', { name: 'Arbeitsnotizen anzeigen' })).not.toBeChecked()
    await expect(notes).toHaveCount(0)

    await page.getByRole('switch', { name: 'Arbeitsnotizen anzeigen' }).click()
    await expect(notes).toHaveCount(3)

    // Im Bearbeiten-Modus geht es um den Aufbau des Plans.
    await edit(page)
    await expect(notes).toHaveCount(0)
    await expect(page.getByRole('switch', { name: 'Arbeitsnotizen anzeigen' })).toHaveCount(0)
  })

  test('AC: die Arbeitsnotiz der Phase lässt sich hinzufügen, speichern und wieder leeren', async ({
    page,
  }) => {
    const unit = await open(page, full())
    await edit(page)

    await page.getByRole('button', { name: 'Arbeitsnotiz hinzufügen' }).click()
    const field = page.getByLabel('Arbeitsnotiz')
    await expect(page.getByText('Erscheint im fertigen Stundenverlauf an dieser Stelle.')).toBeVisible()
    await field.fill('Matten vorher aufbauen')

    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)
    await expect(page.getByText('Matten vorher aufbauen')).toBeVisible()
    expect((await segmentRow(unit))?.notes).toBe('Matten vorher aufbauen')

    await edit(page)
    await page.getByLabel('Arbeitsnotiz').fill('')
    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)
    await expect(page.getByText('Matten vorher aufbauen')).toHaveCount(0)
    expect((await segmentRow(unit))?.notes).toBeNull()
  })
})

// ---- Schnell anlegen ----

test.describe('PROJ-7 — Schnell anlegen', () => {
  test('AC: ohne Treffer wird „Schnell anlegen" angeboten; die Übung landet in Datenbank und Plan und ist „noch zu ergänzen"', async ({
    page,
  }, testInfo) => {
    const name = `E7 Schnell ${testInfo.project.name.replace(/\s+/g, '')} ${Date.now()}`
    await open(page, [
      {
        minutes: 15,
        organizationForms: ['Kleingruppen'],
        items: [{ exerciseId: fx.exercises.alpha, minutes: 5 }],
      },
    ])
    await edit(page)
    await page.getByRole('button', { name: 'Übung einfügen' }).click()

    const dialog = page.getByRole('dialog')
    await dialog.getByPlaceholder(/suchen/).fill(name)
    await expect(dialog.getByText('Keine Übung gefunden.')).toBeVisible()
    await dialog.getByRole('button', { name: /Übung fehlt\? Schnell anlegen/ }).click()

    // Der Suchbegriff ist als Name vorbelegt, Phase und Organisationsform kommen aus der Phase.
    await expect(dialog.getByLabel('Name')).toHaveValue(name)
    await expect(dialog.getByText(fx.phase, { exact: true })).toBeVisible()
    await expect(dialog.getByText('Kleingruppen', { exact: true })).toBeVisible()

    // Ohne Namen: Validierung, die übrigen Eingaben bleiben stehen.
    await dialog.getByLabel('Kurze Beschreibung').fill('Kurz beschrieben.')
    await dialog.getByLabel('Name').fill('')
    await dialog.getByRole('button', { name: 'Anlegen und einsetzen' }).click()
    await expect(dialog.getByText('Bitte gib der Übung einen Namen.')).toBeVisible()
    await expect(dialog.getByLabel('Kurze Beschreibung')).toHaveValue('Kurz beschrieben.')

    await dialog.getByLabel('Name').fill(name)
    await dialog.getByLabel(/Arbeitsnotiz/).fill(`E2E-Testdaten (PROJ-7) ${testInfo.project.name} schnell`)
    await dialog.getByRole('button', { name: 'Anlegen und einsetzen' }).click()

    await expect(dialog).toHaveCount(0)
    expect(await order(page)).toEqual([fx.names.alpha, name])

    const { data: created } = await admin
      .from('exercises')
      .select('needs_completion, phases, organization_forms, work_notes')
      .eq('user_id', userId)
      .eq('name', name)
      .single()
    expect(created?.needs_completion).toBe(true)
    expect(created?.phases).toEqual([fx.phase])
    expect(created?.organization_forms).toEqual(['Kleingruppen'])

    // Verwerfen nimmt nur den Einsatz im Plan zurück — die Übung bleibt.
    await bar(page).getByRole('button', { name: 'Verwerfen' }).click()
    const confirm = page.getByRole('alertdialog')
    await expect(confirm.getByText(/bleibt in deiner Übungsdatenbank/)).toBeVisible()
    await confirm.getByRole('button', { name: 'Verwerfen' }).click()
    expect(await order(page)).toEqual([fx.names.alpha])

    const { count } = await admin
      .from('exercises')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('name', name)
    expect(count).toBe(1)

    // Wieder weg damit: die übrigen Tests rechnen mit genau drei passenden Übungen.
    await admin.from('exercises').delete().eq('user_id', userId).eq('name', name)
  })
})

// ---- Meldungen ----

test.describe('PROJ-7 — Meldungen', () => {
  test('AC: nach dem Speichern erscheint eine Bestätigung', async ({ page }) => {
    await open(page, full())
    await edit(page)
    await page.getByRole('button', { name: /Nach unten, derzeit Platz 1 von 3/ }).click()
    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    await expectSaved(page)

    await expect(page.getByText('Änderungen gespeichert').first()).toBeVisible()
  })
})

// ---- Zwei Tabs ----

test.describe('PROJ-7 — Anderswo geändert', () => {
  test('AC: wurde die Einheit zwischenzeitlich geändert, wird nachgefragt statt stillschweigend überschrieben', async ({
    page,
  }) => {
    const unit = await open(page, full())
    await edit(page)
    await page.getByRole('button', { name: /Nach unten, derzeit Platz 1 von 3/ }).click()

    // Eine Änderung „aus dem anderen Tab": der Änderungsstempel zieht nach.
    await admin.from('units').update({ relaxed_note: 'anderswo' }).eq('id', unit.id)

    await bar(page).getByRole('button', { name: 'Speichern' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog.getByText('Anderswo geändert')).toBeVisible()
    expect((await itemsOf(unit)).map((item) => item.exercise_id)).toEqual([
      fx.exercises.alpha,
      fx.exercises.beta,
      fx.exercises.gamma,
    ])

    await dialog.getByRole('button', { name: 'Trotzdem überschreiben' }).click()
    await expectSaved(page)
    expect((await itemsOf(unit)).map((item) => item.exercise_id)).toEqual([
      fx.exercises.beta,
      fx.exercises.alpha,
      fx.exercises.gamma,
    ])
  })
})

// ---- Erweiterungen an PROJ-3 und PROJ-6 ----

test.describe('PROJ-7 — Übungsordner und Generator', () => {
  test('AC: im Übungsordner stehen Material, Organisationsform und Varianten an der Übung — Varianten nur zum Ansehen', async ({
    page,
  }) => {
    await page.goto('/exercises')

    // Die Zeile dieser einen Übung — im Ordner stehen auch die des anderen Projekts.
    const row = page
      .locator('div.divide-y > div')
      .filter({ has: page.getByRole('heading', { name: fx.names.alpha, exact: true }) })
    await expect(row).toHaveCount(1)

    await expect(row.getByText(/4× Hütchen/)).toBeVisible()
    await expect(row.getByText('Kleingruppen')).toBeVisible()

    await row.getByRole('button', { name: /Varianten \(2\)/ }).click()
    // Aufgeklappt, ohne die Detailseite zu öffnen.
    await expect(page).toHaveURL(/\/exercises(\?.*)?$/)
    await expect(row.getByText('Mit Ball')).toBeVisible()
    await expect(row.getByText('Zu zweit', { exact: true })).toBeVisible()
    await expect(row.getByText('Grundübung')).toHaveCount(0)
    await expect(row.getByRole('button', { name: 'Mit Ball' })).toHaveCount(0)

    // Eine Übung ohne Organisationsform und ohne Varianten: der Platz bleibt, die Varianten fehlen.
    const plain = page
      .locator('div.divide-y > div')
      .filter({ has: page.getByRole('heading', { name: fx.names.beta, exact: true }) })
    await expect(plain.getByText('kein Material')).toBeVisible()
    await expect(plain.getByText('keine angegeben')).toHaveCount(1)
    await expect(plain.getByRole('button', { name: /Varianten/ })).toHaveCount(0)
  })

  test('AC: die Arbeitsnotiz heißt auf der Detailseite der Übung „Arbeitsnotiz"', async ({ page }) => {
    await page.goto(`/exercises/${fx.exercises.alpha}`)
    await expect(page.getByText('Arbeitsnotiz', { exact: true })).toBeVisible()
    await expect(page.getByText('Arbeitsnotizen', { exact: true })).toHaveCount(0)
  })

  test('AC: im Generator lässt sich je Phase eine Organisationsform wählen, und die Arbeitsnotiz trägt ihren Erklärtext', async ({
    page,
  }) => {
    await page.goto(`/units/new?group=${fx.groupId}`)
    await expect(page.getByRole('heading', { name: 'Einheit generieren' })).toBeVisible()

    await page.getByText('Individuell', { exact: true }).click()
    await expect(page.getByRole('button', { name: 'Phase hinzufügen' })).toBeVisible()

    await expect(page.getByText('Organisationsform(en)').first()).toBeVisible()
    await expect(page.getByText(/Beim\s+Lockern wird diese Vorgabe als Erstes freigegeben/).first()).toBeVisible()
    await expect(page.getByLabel('Arbeitsnotiz').first()).toBeVisible()
    await expect(
      page.getByText('Erscheint im fertigen Stundenverlauf an dieser Stelle.').first()
    ).toBeVisible()
  })
})
