import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('getSupabaseClient', () => {
  it('returns null when environment variables are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')

    const { getSupabaseClient } = await import('./supabaseClient')

    await expect(getSupabaseClient()).resolves.toBeNull()
  })
})
