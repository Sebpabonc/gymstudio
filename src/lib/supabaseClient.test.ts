import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({})),
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  vi.clearAllMocks()
})

describe('getSupabaseClient', () => {
  it('returns null when environment variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { getSupabaseClient } = await import('./supabaseClient')

    await expect(getSupabaseClient()).resolves.toBeNull()
  })

  it('creates the lazy client with PKCE session persistence enabled', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key')
    const { createClient } = await import('@supabase/supabase-js')
    const { getSupabaseClient } = await import('./supabaseClient')

    await getSupabaseClient()

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'public-anon-key',
      { auth: { flowType: 'pkce', persistSession: true, detectSessionInUrl: true } }
    )
  })
})
