'use server'

import { createClient } from '@/lib/supabase/server'
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/validations/auth'

export async function login(formData: { email: string; password: string }) {
  const parsed = loginSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Ungültige Eingabe' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  })

  if (error) {
    if (error.message === 'Email not confirmed') {
      return { error: 'Bitte bestätige zuerst deine E-Mail-Adresse. Prüfe dein Postfach.' }
    }
    return { error: 'E-Mail oder Passwort ist falsch.' }
  }

  return { success: true }
}

export async function register(formData: { email: string; password: string; displayName: string }) {
  const parsed = registerSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Ungültige Eingabe' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.displayName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { error: 'Diese E-Mail-Adresse ist bereits registriert.' }
    }
    return { error: 'Registrierung fehlgeschlagen. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function forgotPassword(formData: { email: string }) {
  const parsed = forgotPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: 'Ungültige Eingabe' }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?next=/reset-password`,
  })

  // Always return success to prevent email enumeration
  return { success: true }
}

export async function resetPassword(formData: { password: string; confirmPassword: string }) {
  const parsed = resetPasswordSchema.safeParse(formData)
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  })

  if (error) {
    return { error: 'Passwort konnte nicht geändert werden. Bitte versuche es erneut.' }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}
