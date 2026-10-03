import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from 'react'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseClient, isGoogleProviderEnabled } from '../lib/supabaseClient'
import { isDemoMode } from '../utils/demoMode'
import { syncWorkoutHistory } from '../utils/sync'
import {
  hasGuestWorkoutData,
  isGuestDataClaimed,
  markGuestDataClaimed,
  moveGuestDataToAccount,
  setStorageNamespace,
} from '../utils/storage'

export type AuthStatus = 'loading' | 'signed-out' | 'signed-in'
export type WorkoutSyncStatus = 'syncing' | 'synced' | 'offline' | 'error'

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
  syncStatus: WorkoutSyncStatus
  lastSyncedAt: string | null
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
  const [syncStatus, setSyncStatus] = useState<WorkoutSyncStatus>('syncing')
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null)
  const [resolvedGuestPromptFor, setResolvedGuestPromptFor] = useState<string | null>(null)

  const accountId = demoMode ? null : state.session?.user.id ?? null
  // Must be set during render so child effects read the right account's data.
  setStorageNamespace(accountId)
  const guestPromptPending =
    accountId !== null && resolvedGuestPromptFor !== accountId && !isGuestDataClaimed() && hasGuestWorkoutData()
  const guestDataToMove = guestPromptPending

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

  useEffect(() => {
    const userId = state.session?.user.id
    if (demoMode || !userId || guestPromptPending) {
      return
    }

    let active = true
    let running = false
    let rerun = false
    let debounceTimer: ReturnType<typeof setTimeout> | undefined
    let retryTimer: ReturnType<typeof setTimeout> | undefined

    const sync = async () => {
      if (!active) return
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline')
        return
      }
      if (running) {
        rerun = true
        return
      }

      running = true
      setSyncStatus('syncing')
      try {
        await syncWorkoutHistory(userId)
        if (active) {
          if (retryTimer) clearTimeout(retryTimer)
          setLastSyncedAt(new Date().toISOString())
          setSyncStatus('synced')
        }
      } catch {
        if (active) {
          setSyncStatus('error')
          retryTimer = setTimeout(() => void sync(), 10_000)
        }
      } finally {
        running = false
        if (rerun && active) {
          rerun = false
          void sync()
        }
      }
    }

    const scheduleSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => void sync(), 2_000)
    }
    const syncWhenOnline = () => void sync()
    const syncWhenOffline = () => setSyncStatus('offline')

    void sync()
    window.addEventListener('gym-studio:history-saved', scheduleSync)
    window.addEventListener('online', syncWhenOnline)
    window.addEventListener('offline', syncWhenOffline)

    return () => {
      active = false
      if (debounceTimer) clearTimeout(debounceTimer)
      if (retryTimer) clearTimeout(retryTimer)
      window.removeEventListener('gym-studio:history-saved', scheduleSync)
      window.removeEventListener('online', syncWhenOnline)
      window.removeEventListener('offline', syncWhenOffline)
    }
  }, [demoMode, state.session?.user.id, guestPromptPending])

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

  const resolveGuestPrompt = (move: boolean) => {
    if (!accountId) return
    if (move) moveGuestDataToAccount(accountId)
    else markGuestDataClaimed(accountId)
    setResolvedGuestPromptFor(accountId)
  }

  const value = useMemo<AuthContextValue>(() => ({
    ...state,
    user: state.session?.user ?? null,
    syncStatus,
    lastSyncedAt,
    signInWithPassword,
    signUp,
    resetPassword,
    signInWithGoogle,
    signOut,
  }), [
    state,
    syncStatus,
    lastSyncedAt,
    signInWithPassword,
    signUp,
    resetPassword,
    signInWithGoogle,
    signOut,
  ])

  return (
    <AuthContext.Provider value={value}>
      <React.Fragment key={`${accountId ?? 'guest'}${guestPromptPending ? ':pending' : ''}`}>{children}</React.Fragment>
      {guestDataToMove && (
        <div className="guest-data-prompt" role="dialog" aria-modal="true" aria-label="Move workouts to your account"
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)', padding: 16 }}>
          <div style={{ background: '#1b1b1f', color: '#fff', borderRadius: 12, padding: 20, maxWidth: 360 }}>
            <p>Move the workouts on this device to {state.session?.user.email ?? 'your account'}?</p>
            <p>This only happens once. Otherwise they stay on this device as guest data.</p>
            <button type="button" onClick={() => resolveGuestPrompt(true)}>Move workouts</button>{' '}
            <button type="button" onClick={() => resolveGuestPrompt(false)}>Keep as guest</button>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
