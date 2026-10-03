import { getSupabaseClient } from '../lib/supabaseClient'
import type { WorkoutEntry } from '../types'
import {
  getWorkoutHistoryLastPulledAt,
  loadWorkoutHistoryForSync,
  markAllWorkoutEntriesDirty,
  markWorkoutEntriesSynced,
  saveMergedWorkoutHistory,
  setWorkoutHistoryLastPulledAt,
  type SyncWorkoutEntry,
} from './storage'

export type RemoteWorkoutEntry = {
  id: string
  exercise_id: string
  date: string
  sets: WorkoutEntry['sets']
  notes: string | null
  block_id: string | null
  day_key: string | null
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

  return Array.from(merged.values()).sort((a, b) => b.date.localeCompare(a.date))
}

export async function syncWorkoutHistory(userId: string) {
  const client = await getSupabaseClient()
  if (!client) throw new Error('Supabase is unavailable')

  let lastPulledAt = getWorkoutHistoryLastPulledAt(userId)
  if (!lastPulledAt) {
    await markAllWorkoutEntriesDirty()
  }

  const localEntries = await loadWorkoutHistoryForSync()
  const dirtyEntries = localEntries.filter((entry) => entry.dirty)
  if (dirtyEntries.length > 0) {
    const rows = dirtyEntries.map((entry) => ({
      id: entry.id,
      user_id: userId,
      exercise_id: entry.exerciseId,
      date: entry.date,
      sets: entry.sets,
      notes: entry.notes ?? null,
      block_id: entry.blockId ?? null,
      day_key: entry.dayKey ?? null,
      updated_at: entry.updatedAt,
      deleted_at: entry.deletedAt ?? null,
    }))
    const { data, error } = await client
      .from('workout_entries')
      .upsert(rows, { onConflict: 'id' })
      .select('id, updated_at')

    if (error) throw error

    const timestamps = new Map(
      (data ?? []).map((row) => [row.id as string, row.updated_at as string])
    )
    markWorkoutEntriesSynced(dirtyEntries.map((entry) => ({
      id: entry.id,
      expectedUpdatedAt: entry.updatedAt,
      updatedAt: timestamps.get(entry.id),
    })))
  }

  lastPulledAt = getWorkoutHistoryLastPulledAt(userId)
  const remoteEntries: RemoteWorkoutEntry[] = []
  for (let from = 0; ; from += 1_000) {
    let query = client
      .from('workout_entries')
      .select('id, exercise_id, date, sets, notes, block_id, day_key, updated_at, deleted_at')
    if (lastPulledAt) query = query.gte('updated_at', lastPulledAt)
    const { data, error } = await query
      .eq('user_id', userId)
      .order('updated_at', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + 999)

    if (error) throw error

    const page = (data ?? []) as RemoteWorkoutEntry[]
    remoteEntries.push(...page)
    if (page.length < 1_000) break
  }

  const currentEntries = await loadWorkoutHistoryForSync()
  const merged = mergeWorkoutEntries(currentEntries, remoteEntries)
  saveMergedWorkoutHistory(merged)

  const latestUpdatedAt = remoteEntries.reduce(
    (latest, entry) => entry.updated_at > latest ? entry.updated_at : latest,
    lastPulledAt ?? ''
  )
  if (latestUpdatedAt) setWorkoutHistoryLastPulledAt(userId, latestUpdatedAt)
}
