import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WorkoutEntry } from '../types'
import type { RemoteWorkoutEntry } from './sync'

const supabaseMock = vi.hoisted(() => ({
  client: null as unknown,
}))

vi.mock('../lib/supabaseClient', () => ({
  getSupabaseClient: vi.fn(async () => supabaseMock.client),
}))

function createMemoryStorage(): Storage {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => Array.from(data.keys())[index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, String(value)),
  }
}

const localEntry: WorkoutEntry = {
  id: 'entry-1',
  exerciseId: 'barbell-bench-press',
  date: '2026-10-03',
  sets: [{ id: 'set-1', reps: 8, weight: 60 }],
}

const remoteEntry = (
  updatedAt: string,
  overrides: Partial<RemoteWorkoutEntry> = {}
): RemoteWorkoutEntry => ({
  id: localEntry.id,
  exercise_id: localEntry.exerciseId,
  date: localEntry.date,
  sets: localEntry.sets,
  notes: null,
  block_id: null,
  day_key: null,
  updated_at: updatedAt,
  deleted_at: null,
  ...overrides,
})

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage())
  vi.stubGlobal('sessionStorage', createMemoryStorage())
  supabaseMock.client = null
})

describe('mergeWorkoutEntries', () => {
  it('adds new remote entries and replaces local entries with newer remote versions', async () => {
    const { mergeWorkoutEntries } = await import('./sync')
    const local = [{ ...localEntry, updatedAt: '2026-10-01T00:00:00Z', dirty: false }]
    const remote = [
      remoteEntry('2026-10-02T00:00:00Z', { id: 'new-entry' }),
      remoteEntry('2026-10-03T00:00:00Z', { sets: [{ id: 'new-set', reps: 10, weight: 70 }] }),
    ]

    expect(mergeWorkoutEntries(local, remote)).toEqual([
      expect.objectContaining({ id: 'entry-1', updatedAt: '2026-10-03T00:00:00Z', dirty: false }),
      expect.objectContaining({ id: 'new-entry', updatedAt: '2026-10-02T00:00:00Z', dirty: false }),
    ])
  })

  it('keeps a newer local version but accepts an equal-clock remote version', async () => {
    const { mergeWorkoutEntries } = await import('./sync')
    const newerLocal = { ...localEntry, notes: 'local edit', updatedAt: '2026-10-03T00:00:01Z', dirty: true }
    const equalLocal = { ...localEntry, notes: 'old copy', updatedAt: '2026-10-03T00:00:00Z', dirty: true }

    expect(mergeWorkoutEntries([newerLocal], [remoteEntry('2026-10-03T00:00:00Z')])[0]).toEqual(newerLocal)
    expect(mergeWorkoutEntries([equalLocal], [
      remoteEntry('2026-10-03T00:00:00Z', { notes: 'remote copy' }),
    ])[0]).toMatchObject({ notes: 'remote copy', dirty: false })
  })

  it('removes entries deleted remotely unless the local version is newer', async () => {
    const { mergeWorkoutEntries } = await import('./sync')
    const local = { ...localEntry, updatedAt: '2026-10-03T00:00:00Z', dirty: false }
    const deleted = remoteEntry('2026-10-03T00:00:01Z', { deleted_at: '2026-10-03T00:00:01Z' })

    expect(mergeWorkoutEntries([local], [deleted])).toEqual([])
    expect(mergeWorkoutEntries([
      { ...local, updatedAt: '2026-10-03T00:00:02Z', dirty: false },
    ], [deleted])).toEqual([
      expect.objectContaining({ id: localEntry.id, dirty: true }),
    ])
  })
})

describe('syncWorkoutHistory', () => {
  it('marks existing history dirty for first sync and only dirties entries changed by later saves', async () => {
    localStorage.setItem('gym-studio.history', JSON.stringify([localEntry]))
    const {
      loadWorkoutHistoryForSync,
      markWorkoutEntriesSynced,
      saveWorkoutHistory,
    } = await import('./storage')

    const [initial] = await loadWorkoutHistoryForSync()
    expect(initial).toMatchObject({ id: localEntry.id, dirty: true })
    markWorkoutEntriesSynced([{ id: initial.id, expectedUpdatedAt: initial.updatedAt }])

    saveWorkoutHistory([
      { ...localEntry, notes: 'edited locally' },
      { ...localEntry, id: 'new-entry' },
    ])
    const updated = await loadWorkoutHistoryForSync()

    expect(updated).toEqual([
      expect.objectContaining({ id: localEntry.id, dirty: true, notes: 'edited locally' }),
      expect.objectContaining({ id: 'new-entry', dirty: true }),
    ])
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ dirty: true })])
    )
  })

  it('uploads every existing local entry on first sign-in and stores the merged remote result', async () => {
    const serverUpdatedAt = '2026-10-03T12:00:00.000Z'
    localStorage.setItem('gym-studio.history', JSON.stringify([localEntry]))
    const uploadedRows: Record<string, unknown>[] = []
    const remoteRows: RemoteWorkoutEntry[] = [remoteEntry(serverUpdatedAt)]
    const query = {
      eq: vi.fn(),
      gt: vi.fn(),
      order: vi.fn(async () => ({ data: remoteRows, error: null })),
    }
    query.eq.mockReturnValue(query)
    query.gt.mockReturnValue(query)
    const upsertSelect = vi.fn(async () => ({
      data: [{ id: localEntry.id, updated_at: serverUpdatedAt }],
      error: null,
    }))
    const client = {
      from: vi.fn(() => ({
        upsert: vi.fn((rows: Record<string, unknown>[]) => {
          uploadedRows.push(...rows)
          return { select: upsertSelect }
        }),
        select: vi.fn(() => query),
      })),
    }
    supabaseMock.client = client

    const { syncWorkoutHistory } = await import('./sync')
    const { loadWorkoutHistory } = await import('./storage')
    await syncWorkoutHistory('user-1')

    expect(uploadedRows).toHaveLength(1)
    expect(uploadedRows[0]).toMatchObject({
      id: localEntry.id,
      user_id: 'user-1',
      exercise_id: localEntry.exerciseId,
      sets: localEntry.sets,
    })
    expect(await loadWorkoutHistory()).toEqual([localEntry])
    expect(JSON.parse(localStorage.getItem('gym-studio.sync-metadata')!)).toMatchObject({
      entries: { [localEntry.id]: { updatedAt: serverUpdatedAt, dirty: false } },
      lastPulledAt: { 'user-1': serverUpdatedAt },
    })
  })
})
