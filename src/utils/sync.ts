import { getSupabaseClient } from '../lib/supabaseClient'
import type { WorkoutEntry } from '../types'
import {
  getWorkoutHistoryLastPulledAt,
  loadWorkoutHistoryForSync,
  markAllWorkoutEntriesDirty,
  markWorkoutEntriesSynced,
  quarantineWorkoutEntry,
  saveMergedWorkoutHistory,
  setWorkoutHistoryLastPulledAt,
  type SyncWorkoutEntry,
} from './storage'

export class SyncSignInRequiredError extends Error {
  readonly code = 'SIGN_IN_REQUIRED'

  constructor() {
    super('Sign in again to sync')
  }
}

export function getSyncRetryDelay(failures: number) {
  return Math.min(10_000 * 2 ** Math.max(0, failures - 1), 300_000)
}

function errorCode(error: unknown) {
  return error && typeof error === 'object' ? String((error as { code?: string }).code ?? '') : ''
}

function errorMessage(error: unknown) {
  return error && typeof error === 'object'
    ? String((error as { message?: string }).message ?? 'Upload failed')
    : String(error)
}

export function isNonRetryableSyncError(error: unknown, status?: number) {
  status ??= error && typeof error === 'object' ? (error as { status?: number }).status : undefined
  if (status === 401 || (status !== undefined && status >= 500)) return false
  return /^(23|22)[A-Z0-9]{3}$/i.test(errorCode(error)) || errorCode(error) === '42501'
}

function isSessionError(error: unknown, status?: number) {
  status ??= error && typeof error === 'object' ? (error as { status?: number }).status : undefined
  return status === 401 || errorCode(error) === '401' ||
    ['PGRST301', 'PGRST303'].includes(errorCode(error)) ||
    /jwt.*expired|expired.*jwt/i.test(errorMessage(error))
}

export function validateWorkoutEntry(entry: WorkoutEntry): string | null {
  if (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
      !Number.isFinite(Date.parse(entry.date)) ||
      new Date(entry.date).toISOString().slice(0, 10) !== entry.date) {
    return 'date must be a valid YYYY-MM-DD date'
  }
  if (typeof entry.exerciseId !== 'string' || !entry.exerciseId.trim()) return 'exerciseId must not be empty'
  const nonNegative = (value: unknown) => typeof value === 'number' && Number.isFinite(value) && value >= 0
  if (!Array.isArray(entry.sets) || entry.sets.some((set) =>
    !set || typeof set !== 'object' || !nonNegative(set.reps) || !nonNegative(set.weight) ||
    (set.drop !== undefined && (!set.drop || !nonNegative(set.drop.reps) || !nonNegative(set.drop.weight))) ||
    (set.rir !== undefined && !nonNegative(set.rir)) ||
    (set.at !== undefined && !nonNegative(set.at))
  )) return 'sets must contain finite non-negative numbers'
  if (entry.blockId != null && typeof entry.blockId !== 'string') return 'blockId must be a string or null'
  if (entry.dayKey != null && typeof entry.dayKey !== 'string') return 'dayKey must be a string or null'
  if (entry.target != null && (typeof entry.target !== 'object' || Array.isArray(entry.target))) {
    return 'target must be an object or null'
  }
  return null
}

export type RemoteWorkoutEntry = {
  id: string
  exercise_id: string
  date: string
  sets: WorkoutEntry['sets']
  notes: string | null
  block_id: string | null
  day_key: string | null
  target?: WorkoutEntry['target'] | null
  updated_at: string
  deleted_at: string | null
}

function timestamp(value: string) {
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? 0 : parsed
}

function fromRemoteEntry(entry: RemoteWorkoutEntry): SyncWorkoutEntry {
  return {
    id: entry.id,
    exerciseId: entry.exercise_id,
    date: entry.date,
    sets: entry.sets,
    notes: entry.notes ?? undefined,
    blockId: entry.block_id ?? undefined,
    dayKey: entry.day_key ?? undefined,
    ...(entry.target ? { target: entry.target } : {}),
    updatedAt: entry.updated_at,
    dirty: false,
    deletedAt: entry.deleted_at ?? undefined,
  }
}

export function mergeWorkoutEntries(
  localEntries: SyncWorkoutEntry[],
  remoteEntries: RemoteWorkoutEntry[]
): SyncWorkoutEntry[] {
  const merged = new Map(localEntries.map((entry) => [entry.id, entry]))

  for (const remote of remoteEntries) {
    const local = merged.get(remote.id)
    const remoteEntry = fromRemoteEntry(remote)

    if (remote.deleted_at) {
      if (!local || timestamp(remote.updated_at) >= timestamp(local.updatedAt)) {
        merged.delete(remote.id)
      } else {
        merged.set(remote.id, { ...local, dirty: true })
      }
      continue
    }

    if (!local || timestamp(remote.updated_at) >= timestamp(local.updatedAt)) {
      merged.set(remote.id, remoteEntry)
    } else if (!local.dirty) {
      merged.set(remote.id, { ...local, dirty: true })
    }
  }

  return Array.from(merged.values()).sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

export async function syncWorkoutHistory(userId: string, isActive: () => boolean = () => true) {
  const checkActive = () => {
    if (!isActive()) throw new DOMException('Sync cancelled', 'AbortError')
  }
  const client = await getSupabaseClient()
  checkActive()
  if (!client) throw new Error('Supabase is unavailable')

  let lastPulledAt = getWorkoutHistoryLastPulledAt(userId)
  if (!lastPulledAt) {
    await markAllWorkoutEntriesDirty(isActive)
  }

  const localEntries = await loadWorkoutHistoryForSync(isActive)
  checkActive()
  const dirtyEntries = localEntries.filter((entry) => entry.dirty && !entry.syncError)
  const validEntries = dirtyEntries.filter((entry) => {
    const reason = validateWorkoutEntry(entry)
    if (!reason) return true
    quarantineWorkoutEntry(entry, { code: 'VALIDATION', message: reason, at: new Date().toISOString() })
    return false
  })
  let refreshed = false
  const request = async <T extends { error: unknown; status?: number }>(operation: () => PromiseLike<T>): Promise<T> => {
    checkActive()
    let result = await operation()
    checkActive()
    if (!result.error || !isSessionError(result.error, result.status)) return result
    if (refreshed) throw new SyncSignInRequiredError()
    refreshed = true
    try {
      const { data, error } = await client.auth.refreshSession()
      checkActive()
      if (error || !data.session || data.session.user.id !== userId) throw new SyncSignInRequiredError()
    } catch {
      checkActive()
      throw new SyncSignInRequiredError()
    }
    result = await operation()
    checkActive()
    if (result.error && isSessionError(result.error, result.status)) throw new SyncSignInRequiredError()
    return result
  }
  const upload = async (entries: SyncWorkoutEntry[]) => {
    const rows = entries.map((entry) => ({
      id: entry.id,
      user_id: userId,
      exercise_id: entry.exerciseId,
      date: entry.date,
      sets: entry.sets,
      notes: entry.notes ?? null,
      block_id: entry.blockId ?? null,
      day_key: entry.dayKey ?? null,
      target: entry.target ?? null,
      updated_at: entry.updatedAt,
      deleted_at: entry.deletedAt ?? null,
    }))
    const result = await request(() => client
      .from('workout_entries')
      .upsert(rows, { onConflict: 'id' })
      .select('id, updated_at'))
    if (result.error) return result
    const timestamps = new Map(
      (result.data ?? []).map((row) => [row.id as string, row.updated_at as string])
    )
    markWorkoutEntriesSynced(entries.map((entry) => ({
      id: entry.id,
      expectedUpdatedAt: entry.updatedAt,
      updatedAt: timestamps.get(entry.id),
    })))
    return result
  }
  const attemptUpload = async (entries: SyncWorkoutEntry[]) => {
    try {
      return await upload(entries)
    } catch (error) {
      checkActive()
      return { error, status: undefined }
    }
  }
  let pushError: unknown
  for (let offset = 0; offset < validEntries.length; offset += 25) {
    const batch = validEntries.slice(offset, offset + 25)
    const result = await attemptUpload(batch)
    if (!result.error) continue
    if (result.error instanceof SyncSignInRequiredError) {
      pushError = result.error
      break
    }
    for (const entry of batch) {
      const single = batch.length === 1 ? result : await attemptUpload([entry])
      if (!single.error) continue
      if (single.error instanceof SyncSignInRequiredError) {
        pushError = single.error
        break
      }
      if (isNonRetryableSyncError(single.error, single.status)) {
        quarantineWorkoutEntry(entry, {
          code: errorCode(single.error),
          message: errorMessage(single.error).slice(0, 160),
          at: new Date().toISOString(),
        })
      } else {
        pushError = single.error
      }
    }
    if (pushError instanceof SyncSignInRequiredError) break
  }
  if (pushError instanceof SyncSignInRequiredError) throw pushError

  lastPulledAt = getWorkoutHistoryLastPulledAt(userId)
  const remoteEntries: RemoteWorkoutEntry[] = []
  for (let from = 0; ; from += 1_000) {
    const { data, error } = await request(() => {
      let pageQuery = client
        .from('workout_entries')
        .select('id, exercise_id, date, sets, notes, block_id, day_key, target, updated_at, deleted_at')
      if (lastPulledAt) pageQuery = pageQuery.gte('updated_at', lastPulledAt)
      return pageQuery.eq('user_id', userId)
        .order('updated_at', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + 999)
    })

    if (error) throw error

    const page = (data ?? []) as RemoteWorkoutEntry[]
    remoteEntries.push(...page)
    if (page.length < 1_000) break
  }

  const currentEntries = await loadWorkoutHistoryForSync(isActive)
  checkActive()
  const merged = mergeWorkoutEntries(currentEntries, remoteEntries)
  saveMergedWorkoutHistory(merged)

  const latestUpdatedAt = remoteEntries.reduce(
    (latest, entry) => entry.updated_at > latest ? entry.updated_at : latest,
    lastPulledAt ?? ''
  )
  if (latestUpdatedAt) setWorkoutHistoryLastPulledAt(userId, latestUpdatedAt)
  if (pushError) throw pushError
}
