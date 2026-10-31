import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import {
  authStateReducer,
  getPasswordRecoveryRedirect,
  needsSignInAfterAuthChange,
  subscribeToAuthChanges,
  updatePasswordWithClient,
} from './AuthProvider'
import { NATIVE_AUTH_CALLBACK } from './nativeOAuth'

describe('AuthProvider state transitions', () => {
  it('tracks mocked Supabase sign-in and sign-out events and unsubscribes', () => {
    let changeHandler: ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    const unsubscribe = vi.fn()
    let lastEvent: AuthChangeEvent | undefined
    const client = {
      auth: {
        onAuthStateChange: vi.fn((callback: typeof changeHandler) => {
          changeHandler = callback
          return { data: { subscription: { unsubscribe } } }
        }),
      },
    } as unknown as SupabaseClient
    let state: ReturnType<typeof authStateReducer> = { session: null, status: 'loading', available: false }
    const stopListening = subscribeToAuthChanges(client, (session, event) => {
      lastEvent = event
      state = authStateReducer(state, { type: 'session', session })
    })
    const session = { user: { id: 'user-1', email: 'lifter@example.com' } } as unknown as Session

    changeHandler?.('SIGNED_IN', session)
    expect(state).toEqual({ session, status: 'signed-in', available: true })
    changeHandler?.('PASSWORD_RECOVERY', session)
    expect(lastEvent).toBe('PASSWORD_RECOVERY')

    changeHandler?.('SIGNED_OUT', null)
    expect(state).toEqual({ session: null, status: 'signed-out', available: true })

    stopListening()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('updates the password through the active Supabase recovery session', async () => {
    const updateUser = vi.fn().mockResolvedValue({ error: null })
    const client = { auth: { updateUser } } as unknown as SupabaseClient

    await expect(updatePasswordWithClient(client, 'new-secure-password')).resolves.toEqual({ error: null })
    expect(updateUser).toHaveBeenCalledWith({ password: 'new-secure-password' })
  })

  it('uses the registered native callback for recovery but the current page on web', () => {
    expect(getPasswordRecoveryRedirect(true, 'capacitor://localhost', '/')).toBe(NATIVE_AUTH_CALLBACK)
    expect(getPasswordRecoveryRedirect(false, 'https://gymstudio.example', '/gymstudio/')).toBe(
      'https://gymstudio.example/gymstudio/',
    )
  })

  it('settles as signed out when Supabase is unavailable', () => {
    expect(authStateReducer(
      { session: null, status: 'loading', available: false },
      { type: 'unavailable' }
    )).toEqual({ session: null, status: 'signed-out', available: false })
  })

  it('retains a generic reauth notice after an automatic signout but not a deliberate one', () => {
    expect(needsSignInAfterAuthChange('SIGNED_OUT', null, 'previous-account', false)).toBe(true)
    expect(needsSignInAfterAuthChange('SIGNED_OUT', null, 'previous-account', true)).toBe(false)
    expect(needsSignInAfterAuthChange('SIGNED_OUT', null, null, false)).toBe(false)
    expect(needsSignInAfterAuthChange('INITIAL_SESSION', null, null, false)).toBe(false)
    const nextSession = { user: { id: 'next-account' } } as Session
    expect(needsSignInAfterAuthChange('SIGNED_IN', nextSession, 'previous-account', false)).toBe(false)
  })
})
