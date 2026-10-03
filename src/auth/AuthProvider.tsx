import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseClient, isGoogleProviderEnabled } from '../lib/supabaseClient'
import { isDemoMode } from '../utils/demoMode'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'

type AuthState = {
  session: Session | null
  status: AuthStatus
  available: boolean
}

type AuthAction =
  | { type: 'session'; session: Session | null }
  | { type: 'unavailable' }

const initialState: AuthState = {
  session: null,
  status: 'loading',
  available: false,
}

export function authStateReducer(state: AuthState, action: AuthAction): AuthState {
  if (action.type === 'unavailable') {
    return { session: null, status: 'signed-out', available: false }
  }

  return {
    session: action.session,
    status: action.session ? 'signed-in' : 'signed-out',
    available: true,
  }
}

export function subscribeToAuthChanges(client: SupabaseClient, onSession: (session: Session | null) => void) {
  const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => onSession(session))
  return () => subscription.unsubscribe()
}

type ActionResult = { error: string | null; needsConfirmation?: boolean }

type AuthContextValue = {
  session: Session | null
  user: User | null
  status: AuthStatus
  available: boolean
  signInWithPassword: (email: string, password: string) => Promise<ActionResult>
  signUp: (email: string, password: string) => Promise<ActionResult>
  resetPassword: (email: string) => Promise<ActionResult>
  signInWithGoogle: () => Promise<ActionResult>
  signOut: () => Promise<ActionResult>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function resultError(error: { message: string } | null | undefined): ActionResult {
  return { error: error?.message ?? null }
}

export async function startGoogleOAuth(client: SupabaseClient, redirectTo: string): Promise<ActionResult> {
  if (!await isGoogleProviderEnabled()) return { error: 'provider is not enabled' }

  const { error } = await client.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo },
  })
  return resultError(error)
}

async function getClient() {
  if (isDemoMode()) return null
  return getSupabaseClient()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const demoMode = isDemoMode()
  const startingState: AuthState = demoMode ? { ...initialState, status: 'signed-out' } : initialState
  const [state, dispatch] = useReducer(authStateReducer, startingState)

  useEffect(() => {
    if (demoMode) return

    let active = true
    let unsubscribe: (() => void) | undefined

    void (async () => {
      const supabase = await getSupabaseClient()
      if (!active) return
      if (!supabase) {
        dispatch({ type: 'unavailable' })
        return
      }

      unsubscribe = subscribeToAuthChanges(supabase, (session) => {
        if (active) dispatch({ type: 'session', session })
      })
      const { data, error } = await supabase.auth.getSession()
      if (active) dispatch({ type: 'session', session: error ? null : data.session })
    })().catch(() => {
      if (active) dispatch({ type: 'unavailable' })
    })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [demoMode])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const client = await getClient()
    if (!client) return { error: 'Sign-in unavailable offline.' }
    const { error } = await client.auth.signInWithPassword({ email, password })
    return resultError(error)
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const client = await getClient()
    if (!client) return { error: 'Sign-in unavailable offline.' }
    const { data, error } = await client.auth.signUp({ email, password })
    return { ...resultError(error), needsConfirmation: !error && !data.session }
  }, [])

  const resetPassword = useCallback(async (email: string) => {
    const client = await getClient()
    if (!client) return { error: 'Sign-in unavailable offline.' }
    const redirectTo = `${window.location.origin}${window.location.pathname}`
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo })
    return resultError(error)
  }, [])

  const signInWithGoogle = useCallback(async () => {
    const client = await getClient()
    if (!client) return { error: 'Sign-in unavailable offline.' }
    const redirectTo = `${window.location.origin}${window.location.pathname}`
    return startGoogleOAuth(client, redirectTo)
  }, [])

  const signOut = useCallback(async () => {
    const client = await getClient()
    if (!client) return { error: 'Sign-in unavailable offline.' }
    const { error } = await client.auth.signOut()
    return resultError(error)
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    user: state.session?.user ?? null,
    signInWithPassword,
    signUp,
    resetPassword,
    signInWithGoogle,
    signOut,
  }), [state, signInWithPassword, signUp, resetPassword, signInWithGoogle, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
