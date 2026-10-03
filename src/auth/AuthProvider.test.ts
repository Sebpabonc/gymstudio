import type { AuthChangeEvent, Session, SupabaseClient } from '@supabase/supabase-js'
import { describe, expect, it, vi } from 'vitest'
import { authStateReducer, subscribeToAuthChanges } from './AuthProvider'

describe('AuthProvider state transitions', () => {
  it('tracks mocked Supabase sign-in and sign-out events and unsubscribes', () => {
    let changeHandler: ((event: AuthChangeEvent, session: Session | null) => void) | undefined
    const unsubscribe = vi.fn()
    const client = {
      auth: {
        onAuthStateChange: vi.fn((callback: typeof changeHandler) => {
          changeHandler = callback
          return { data: { subscription: { unsubscribe } } }
        }),
      },
    } as unknown as SupabaseClient
    let state: ReturnType<typeof authStateReducer> = { session: null, status: 'loading', available: false }
    const stopListening = subscribeToAuthChanges(client, (session) => {
      state = authStateReducer(state, { type: 'session', session })
    })
    const session = { user: { id: 'user-1', email: 'lifter@example.com' } } as unknown as Session

    changeHandler?.('SIGNED_IN', session)
    expect(state).toEqual({ session, status: 'signed-in', available: true })

    changeHandler?.('SIGNED_OUT', null)
    expect(state).toEqual({ session: null, status: 'signed-out', available: true })

    stopListening()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('settles as signed out when Supabase is unavailable', () => {
    expect(authStateReducer(
      { session: null, status: 'loading', available: false },
      { type: 'unavailable' }
    )).toEqual({ session: null, status: 'signed-out', available: false })
  })
})
