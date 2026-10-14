import React, { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import type { AuthChangeEvent, Session, SupabaseClient, User } from '@supabase/supabase-js'
import { getSupabaseClient, isGoogleProviderEnabled } from '../lib/supabaseClient'
import GuestDataPrompt from '../components/GuestDataPrompt'
import { isDemoMode } from '../utils/demoMode'
import { SyncSignInRequiredError, syncWorkoutHistory } from '../utils/sync'
import { createSyncScheduler } from './syncScheduler'
import { isNativeApp, listenForNativeAuthCallback, startNativeGoogleOAuth } from './nativeOAuth'
import {
  hasGuestWorkoutData,
  isGuestDataClaimed,
  markGuestDataClaimed,
  moveGuestDataToAccount,
  setStorageNamespace,
  loadWorkoutHistoryForSync,
  retryQuarantinedWorkoutEntry,
  type SyncWorkoutEntry,
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

export function subscribeToAuthChanges(client: SupabaseClient, onSession: (session: Session | null, event?: AuthChangeEvent) => void) {
  const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => onSession(session, event))
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
  syncErrorDetail: string | null
  syncSignInRequired: boolean
  pendingSyncCount: number
  quarantinedEntries: SyncWorkoutEntry[]
  retrySyncNow: () => void
  retryQuarantinedEntry: (id: string) => void
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
  const [syncErrorDetail, setSyncErrorDetail] = useState<string | null>(null)
  const [syncSignInRequired, setSyncSignInRequired] = useState(false)
  const [pendingEntries, setPendingEntries] = useState<SyncWorkoutEntry[]>([])
  const [syncAccountId, setSyncAccountId] = useState<string | null>(null)
  const retrySyncRef = useRef<{ accountId: string; retry: () => void } | null>(null)
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

      unsubscribe = subscribeToAuthChanges(supabase, (session, event) => {
        if (!active) return
        dispatch({ type: 'session', session })
        if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') &&
            retrySyncRef.current?.accountId === session.user.id) {
          retrySyncRef.current.retry()
        }
      })
      if (isNativeApp()) {
        const removeNativeListener = await listenForNativeAuthCallback(supabase)
        const removeAuthListener = unsubscribe
        unsubscribe = () => {
          removeAuthListener?.()
          removeNativeListener()
        }
      }
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
    setPendingEntries([])
    setSyncErrorDetail(null)
    setSyncSignInRequired(false)
    setLastSyncedAt(null)
    setSyncAccountId(userId ?? null)
    if (demoMode || !userId || guestPromptPending) {
      return
    }

    let active = true
    let readVersion = 0
    const readPending = async () => {
      if (!active) return []
      const version = ++readVersion
      const entries = await loadWorkoutHistoryForSync(() => active)
      if (active && version === readVersion) {
        setPendingEntries(entries.filter(entry => entry.dirty))
        return entries
      }
      return []
    }
    const scheduler = createSyncScheduler({
      isOnline: () => typeof navigator === 'undefined' || navigator.onLine,
      onOffline: () => { if (active) setSyncStatus('offline') },
      onError: (error) => {
        if (!active) return
        const detail = error && typeof error === 'object'
          ? [(error as { code?: string }).code, (error as { message?: string }).message].filter(Boolean).join(' · ')
          : String(error)
        setSyncErrorDetail(detail.slice(0, 160) || null)
        setSyncSignInRequired(error instanceof SyncSignInRequiredError)
        setSyncStatus('error')
      },
      sync: async () => {
        setSyncStatus('syncing')
        try {
          await syncWorkoutHistory(userId, () => active)
          const entries = await readPending()
          if (active) {
            setLastSyncedAt(new Date().toISOString())
            setSyncStatus(typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'synced')
            setSyncSignInRequired(false)
            setSyncErrorDetail(entries.find(entry => entry.dirty && entry.syncError)?.syncError?.message ?? null)
          }
        } finally {
          await readPending()
        }
      },
    })
    const refreshPending = () => void readPending().catch(() => undefined)
    const scheduleSync = () => {
      refreshPending()
      scheduler.historySaved()
    }
    const syncWhenOnline = scheduler.online
    const syncWhenOffline = scheduler.offline

    retrySyncRef.current = { accountId: userId, retry: scheduler.retryNow }
    refreshPending()
    scheduler.retryNow()
    window.addEventListener('gym-studio:history-saved', scheduleSync)
    window.addEventListener('online', syncWhenOnline)
    window.addEventListener('offline', syncWhenOffline)

    return () => {
      active = false
      scheduler.dispose()
      retrySyncRef.current = null
      window.removeEventListener('gym-studio:history-saved', scheduleSync)
      window.removeEventListener('online', syncWhenOnline)
      window.removeEventListener('offline', syncWhenOffline)
    }
  }, [demoMode, state.session?.user.id, guestPromptPending])

  const retrySyncNow = useCallback(() => {
    if (accountId && retrySyncRef.current?.accountId === accountId) retrySyncRef.current.retry()
  }, [accountId])
  const retryQuarantinedEntry = useCallback((id: string) => {
    if (!accountId || syncAccountId !== accountId || !pendingEntries.some(entry => entry.id === id && entry.syncError)) return
    retryQuarantinedWorkoutEntry(id)
    retrySyncNow()
  }, [accountId, syncAccountId, pendingEntries, retrySyncNow])

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
    if (isNativeApp()) {
      if (!await isGoogleProviderEnabled()) return { error: 'provider is not enabled' }
      return { error: await startNativeGoogleOAuth(client) }
    }
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
    syncStatus: syncAccountId === accountId ? syncStatus : 'syncing',
    lastSyncedAt: accountId && syncAccountId === accountId ? lastSyncedAt : null,
    syncErrorDetail: accountId && syncAccountId === accountId ? syncErrorDetail : null,
    syncSignInRequired: !!accountId && syncAccountId === accountId && syncSignInRequired,
    pendingSyncCount: accountId && syncAccountId === accountId ? pendingEntries.length : 0,
    quarantinedEntries: accountId && syncAccountId === accountId ? pendingEntries.filter(entry => entry.syncError) : [],
    retrySyncNow,
    retryQuarantinedEntry,
    signInWithPassword,
    signUp,
    resetPassword,
    signInWithGoogle,
    signOut,
  }), [
    state,
    syncStatus,
    lastSyncedAt,
    syncErrorDetail,
    syncAccountId,
    accountId,
    syncSignInRequired,
    pendingEntries,
    retrySyncNow,
    retryQuarantinedEntry,
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
        <GuestDataPrompt
          accountLabel={state.session?.user.email ?? 'your account'}
          onMove={() => resolveGuestPrompt(true)}
          onKeep={() => resolveGuestPrompt(false)}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}
