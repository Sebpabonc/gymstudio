import type { SupabaseClient } from '@supabase/supabase-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

async function createGoogleOAuthClient() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co/')
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key')
  const { startGoogleOAuth } = await import('./AuthProvider')
  const signInWithOAuth = vi.fn(async () => ({ error: null }))
  const client = { auth: { signInWithOAuth } } as unknown as SupabaseClient
  return { startGoogleOAuth, signInWithOAuth, client }
}

describe('Google OAuth provider preflight', () => {
  it('redirects only when Supabase reports Google enabled', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ external: { google: true } }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { startGoogleOAuth, signInWithOAuth, client } = await createGoogleOAuthClient()

    await expect(startGoogleOAuth(client, 'https://gymstudio.example/')).resolves.toEqual({ error: null })

    expect(fetchMock).toHaveBeenCalledWith('https://example.supabase.co/auth/v1/settings', {
      headers: { apikey: 'public-anon-key' },
    })
    expect(signInWithOAuth).toHaveBeenCalledWith({
      provider: 'google',
      options: { redirectTo: 'https://gymstudio.example/' },
    })
  })

  it('stays on the screen when Google is disabled and caches that result', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ external: { google: false } }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const { startGoogleOAuth, signInWithOAuth, client } = await createGoogleOAuthClient()

    await expect(startGoogleOAuth(client, 'https://gymstudio.example/')).resolves.toEqual({
      error: 'provider is not enabled',
    })
    await startGoogleOAuth(client, 'https://gymstudio.example/')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })

  it('treats a failed settings request as disabled and caches the result', async () => {
    const fetchMock = vi.fn(async () => { throw new Error('offline') })
    vi.stubGlobal('fetch', fetchMock)
    const { startGoogleOAuth, signInWithOAuth, client } = await createGoogleOAuthClient()

    await expect(startGoogleOAuth(client, 'https://gymstudio.example/')).resolves.toEqual({
      error: 'provider is not enabled',
    })
    await startGoogleOAuth(client, 'https://gymstudio.example/')

    expect(fetchMock).toHaveBeenCalledOnce()
    expect(signInWithOAuth).not.toHaveBeenCalled()
  })
})
