import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Meldet einen Testnutzer an und legt den Sitzungszustand ab, damit die
 * eigentlichen Tests hinter dem Login laufen können.
 *
 * Bis hierhin prüften die E2E-Tests dieses Projekts praktisch nichts: Ohne
 * Anmeldung leitet jede geschützte Seite auf `/login` um, und die Tests waren
 * so geschrieben, dass sie bei fehlendem Inhalt stillschweigend durchliefen.
 *
 * Der Weg nutzt die echte Anmeldestrecke der App: Der Dienstschlüssel erzeugt
 * einen einmaligen Anmeldelink, der Browser folgt ihm, und `/auth/callback`
 * tauscht ihn wie bei einem echten Nutzer gegen eine Sitzung.
 */

export const STORAGE_STATE = path.join(__dirname, '.auth', 'user.json')

/** Eigenes Konto, damit Tests nie die echten Daten des Entwicklers anfassen. */
export const TEST_EMAIL = 'humpert263+test1@gmail.com'

function env(name: string): string {
  const file = readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
  const match = file.match(new RegExp(`^${name}=(.+)$`, 'm'))
  if (!match) throw new Error(`${name} fehlt in .env.local`)
  return match[1].trim()
}

setup('anmelden', async ({ page, baseURL }) => {
  const admin = createClient(
    env('NEXT_PUBLIC_SUPABASE_URL'),
    env('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false } }
  )

  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
    options: { redirectTo: `${baseURL}/auth/callback` },
  })

  if (error) throw new Error(`Anmeldelink fehlgeschlagen: ${error.message}`)

  await page.goto(data.properties.action_link)

  // Die Anmeldung gilt erst als gelungen, wenn eine geschützte Seite auch
  // wirklich lädt — nicht schon, wenn der Link besucht wurde.
  await page.goto('/units')
  await expect(page).toHaveURL(/\/units$/)
  await expect(page.getByRole('heading', { name: 'Meine Einheiten' })).toBeVisible()

  await page.context().storageState({ path: STORAGE_STATE })
})
