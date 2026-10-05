import { test as setup, expect } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { adminClient, env, STORAGE_STATE, TEST_EMAIL } from './fixtures'

/**
 * Meldet einen Testnutzer an und legt den Sitzungszustand ab, damit die
 * eigentlichen Tests hinter dem Login laufen können.
 *
 * Bis hierhin prüften die E2E-Tests dieses Projekts praktisch nichts: Ohne
 * Anmeldung leitet jede geschützte Seite auf `/login` um, und die Tests waren
 * so geschrieben, dass sie bei fehlendem Inhalt stillschweigend durchliefen.
 *
 * **Warum nicht einfach dem Anmeldelink folgen?** Zwei Gründe sprechen
 * dagegen, beide geprüft:
 *   1. Supabase leitet den Link auf die hinterlegte Produktions-URL um —
 *      `http://localhost:3000` steht nicht unter den erlaubten Zielen, und
 *      das zu ändern wäre eine Einstellung am Projekt nur für Tests.
 *   2. Die Token kommen im URL-Fragment (`#access_token=…`), während
 *      `/auth/callback` einen `?code=` erwartet. Ein Server sieht Fragmente nie.
 *
 * Stattdessen wird die Sitzung hier erzeugt und **von `@supabase/ssr` selbst**
 * in Cookies geschrieben. So stimmt deren Format garantiert mit dem überein,
 * was die App liest — statt es nachzubauen und bei der nächsten Version zu
 * brechen.
 */

setup('anmelden', async ({ page, context }) => {
  const url = env('NEXT_PUBLIC_SUPABASE_URL')
  const anonKey = env('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  // 1. Einmal-Token für den Testnutzer erzeugen und sofort einlösen.
  const { data: link, error: linkError } = await adminClient().auth.admin.generateLink({
    type: 'magiclink',
    email: TEST_EMAIL,
  })
  if (linkError) throw new Error(`Anmeldelink fehlgeschlagen: ${linkError.message}`)

  const plain = createClient(url, anonKey, { auth: { persistSession: false } })
  const { data: verified, error: verifyError } = await plain.auth.verifyOtp({
    token_hash: link.properties.hashed_token,
    type: 'magiclink',
  })
  if (verifyError || !verified.session) {
    throw new Error(`Sitzung konnte nicht erzeugt werden: ${verifyError?.message}`)
  }

  // 2. Die Bibliothek die Cookies bauen lassen, die der Server erwartet.
  const written: { name: string; value: string }[] = []
  const ssr = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        for (const cookie of cookies) written.push({ name: cookie.name, value: cookie.value })
      },
    },
  })
  await ssr.auth.setSession({
    access_token: verified.session.access_token,
    refresh_token: verified.session.refresh_token,
  })
  if (written.length === 0) throw new Error('@supabase/ssr hat keine Cookies geschrieben')

  await context.addCookies(
    written.map((cookie) => ({
      name: cookie.name,
      value: cookie.value,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    }))
  )

  // 3. Die Anmeldung gilt erst, wenn eine geschützte Seite wirklich lädt.
  await page.goto('/units')
  await expect(page.getByRole('heading', { name: 'Meine Einheiten' })).toBeVisible()
  await expect(page).toHaveURL(/\/units$/)

  await context.storageState({ path: STORAGE_STATE })
})
