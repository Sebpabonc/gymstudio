import type { SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { APPLE_CLIENT_ID, sha256Hex, signInWithAppleNative } from './appleSignIn'

vi.mock('@capacitor/core', () => ({ Capacitor: { isNativePlatform: () => false, getPlatform: () => 'web' } }))

function client() {
  const signInWithIdToken = vi.fn().mockResolvedValue({ error: null })
  const updateUser = vi.fn().mockResolvedValue({ error: null })
  return { auth: { signInWithIdToken, updateUser }, signInWithIdToken, updateUser }
}

describe('signInWithAppleNative', () => {
  it('sends Apple the SHA-256 of the nonce and Supabase the raw nonce with the identity token', async () => {
    const mock = client()
    const authorize = vi.fn().mockResolvedValue({ response: { identityToken: 'id-token', givenName: 'Ana', familyName: 'Ruiz' } })

    await expect(signInWithAppleNative(mock as unknown as SupabaseClient, authorize)).resolves.toBeNull()
    const sent = authorize.mock.calls[0][0]
    expect(sent.clientId).toBe(APPLE_CLIENT_ID)
    const { nonce } = mock.signInWithIdToken.mock.calls[0][0]
    expect(mock.signInWithIdToken).toHaveBeenCalledWith({ provider: 'apple', token: 'id-token', nonce })
    expect(sent.nonce).toBe(await sha256Hex(nonce))
    expect(mock.updateUser).toHaveBeenCalledWith({ data: { full_name: 'Ana Ruiz' } })
  })

  it('treats a closed Apple sheet as no error and does not sign in', async () => {
    const mock = client()
    const authorize = vi.fn().mockRejectedValue(new Error('The operation couldn’t be completed. (com.apple.AuthenticationServices.AuthorizationError error 1001.)'))

    await expect(signInWithAppleNative(mock as unknown as SupabaseClient, authorize)).resolves.toBeNull()
    expect(mock.signInWithIdToken).not.toHaveBeenCalled()
  })

  it('returns the Supabase error and keeps the name untouched when the token is rejected', async () => {
    const mock = client()
    mock.signInWithIdToken.mockResolvedValue({ error: { message: 'Provider is not enabled' } })
    const authorize = vi.fn().mockResolvedValue({ response: { identityToken: 't', givenName: null, familyName: null } })

    await expect(signInWithAppleNative(mock as unknown as SupabaseClient, authorize)).resolves.toBe('Provider is not enabled')
    expect(mock.updateUser).not.toHaveBeenCalled()
  })
})
