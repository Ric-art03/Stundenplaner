import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => ({ from: vi.fn() })),
}))

describe('Supabase Browser Client', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('throws a descriptive error when NEXT_PUBLIC_SUPABASE_URL is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-key')

    const { createClient } = await import('./client')
    expect(() => createClient()).toThrow('Supabase-Umgebungsvariablen fehlen')
  })

  it('throws a descriptive error when NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    const { createClient } = await import('./client')
    expect(() => createClient()).toThrow('Supabase-Umgebungsvariablen fehlen')
  })

  it('creates a client successfully when env vars are present', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    const { createClient } = await import('./client')
    const client = createClient()
    expect(client).toBeDefined()
  })

  it('uses createBrowserClient from @supabase/ssr', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')

    const { createBrowserClient } = await import('@supabase/ssr')
    const { createClient } = await import('./client')
    createClient()

    expect(createBrowserClient).toHaveBeenCalledWith(
      'https://test.supabase.co',
      'test-anon-key'
    )
  })
})
