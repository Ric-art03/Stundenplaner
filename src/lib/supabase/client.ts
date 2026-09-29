'use client'

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../database.types'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase-Umgebungsvariablen fehlen. ' +
      'Kopiere .env.example nach .env.local und trage deine Supabase-Schlüssel ein. ' +
      'Du findest sie unter: https://supabase.com/dashboard/project/_/settings/api'
    )
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}
