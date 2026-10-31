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

function mockSyncClient(
  push: (rows: Record<string, unknown>[]) => { error: unknown; status?: number },
  remoteRows: RemoteWorkoutEntry[] = [],
  pushUserExercise: (rows: Record<string, unknown>[]) => { error: unknown; status?: number } = () => ({ error: null }),
  remoteUserExercises: Record<string, unknown>[] = []
) {
  const makeQuery = (rows: Record<string, unknown>[]) => {
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async () => ({ data: rows, error: null, status: 200 })),
    }
    query.eq.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.order.mockReturnValue(query)
    return query
  }
  const query = makeQuery(remoteRows as unknown as Record<string, unknown>[])
  const userExerciseQuery = makeQuery(remoteUserExercises)
  const makeUpsert = (respond: typeof push) => vi.fn((rows: Record<string, unknown>[]) => ({
    select: vi.fn(async () => ({
      data: rows.map((row) => ({ id: row.id, updated_at: row.updated_at })),
      ...respond(rows),
    })),
  }))
  const upsert = makeUpsert(push)
  const userExerciseUpsert = makeUpsert(pushUserExercise)
  const refreshSession = vi.fn(async () => ({
    data: { session: { user: { id: 'user-1' } } },
    error: null as unknown,
  }))
  supabaseMock.client = {
    from: vi.fn((table: string) => table === 'user_exercises'
      ? { upsert: userExerciseUpsert, select: vi.fn(() => userExerciseQuery) }
      : { upsert, select: vi.fn(() => query) }),
    auth: { refreshSession },
  }
  return { upsert, userExerciseUpsert, query, userExerciseQuery, refreshSession }
}

describe('mergeWorkoutEntries', () => {
  it('T110/T144: sync round-trips partial sets and their target without adding sets or RIR', async () => {
    const { fromRemoteEntry, toRemoteWorkoutEntry } = await import('./sync')
    const partial = {
      ...localEntry, blockId: 'block-6', dayKey: 'chest-back-a',
      target: { sets: 3, reps: { min: 8, max: 8 }, weight: 60, technique: 'superset' },
      updatedAt: '2026-10-03T00:00:00Z', dirty: true,
    }
    const remote = toRemoteWorkoutEntry(partial, 'user-1', new Set())
    const restored = fromRemoteEntry(remote as RemoteWorkoutEntry)
    expect(restored.sets).toEqual(partial.sets)
    expect(restored.target).toEqual(partial.target)
    expect(restored.sets).toHaveLength(1)
    expect(restored.sets[0]).not.toHaveProperty('rir')
    const old = { ...partial, sets: [{ ...partial.sets[0], rir: 0 }] }
    expect(fromRemoteEntry(toRemoteWorkoutEntry(old, 'user-1', new Set()) as RemoteWorkoutEntry).sets[0].rir).toBe(0)
  })

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

describe('user exercise sync mapping', () => {
  it('uses the custom foreign key in both directions and leaves catalogue mapping unchanged', async () => {
    const { fromRemoteEntry, toRemoteWorkoutEntry } = await import('./sync')
    const custom = { ...localEntry, exerciseId: 'custom-id', updatedAt: '2026-10-03T00:00:00Z', dirty: true }
    expect(toRemoteWorkoutEntry(custom, 'user-1', new Set(['custom-id']))).toMatchObject({
      exercise_id: null,
      user_exercise_id: 'custom-id',
    })
    expect(toRemoteWorkoutEntry({
      ...localEntry, updatedAt: '2026-10-03T00:00:00Z', dirty: true,
    }, 'user-1', new Set())).toMatchObject({
      exercise_id: localEntry.exerciseId,
      user_exercise_id: null,
    })
    expect(fromRemoteEntry(remoteEntry('2026-10-04T00:00:00Z', {
      exercise_id: null,
      user_exercise_id: 'custom-id',
    }))).toMatchObject({ exerciseId: 'custom-id' })
  })
})

describe('syncWorkoutHistory', () => {
  it('isolates rejected user exercise rows and defers their logs without quarantining them', async () => {
    localStorage.setItem('gym-studio.exercises', JSON.stringify([
      { id: 'bad-custom', name: 'Invalid legacy exercise', primaryMuscle: 'Core' },
      { id: 'good-custom', name: 'Valid exercise', primaryMuscle: 'Chest' },
    ]))
    const { saveWorkoutHistory, loadWorkoutHistoryForSync } = await import('./storage')
    saveWorkoutHistory([
      { ...localEntry, id: 'bad-exercise-log', exerciseId: 'bad-custom' },
      { ...localEntry, id: 'good-exercise-log', exerciseId: 'good-custom' },
    ])
    const constraintError = { code: '23514', message: 'Body region rejected' }
    const { upsert, userExerciseUpsert } = mockSyncClient(
      () => ({ error: null }),
      [],
      (rows) => rows.some((row) => row.id === 'bad-custom')
        ? { error: constraintError, status: 400 }
        : { error: null },
    )
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')

    expect(userExerciseUpsert.mock.calls.map(([rows]) => rows.map((row) => row.id))).toEqual([
      ['bad-custom', 'good-custom'], ['bad-custom'], ['good-custom'],
    ])
    expect(upsert.mock.calls.flatMap(([rows]) => rows).map((row) => row.id)).toEqual(['good-exercise-log'])
    const blockedLog = (await loadWorkoutHistoryForSync()).find((entry) => entry.id === 'bad-exercise-log')
    expect(blockedLog).toMatchObject({ dirty: true })
    expect(blockedLog).not.toHaveProperty('syncError')
    expect(JSON.parse(localStorage.getItem('gym-studio.sync-metadata')!).userExercises['bad-custom'])
      .toMatchObject({ dirty: true, syncError: { code: '23514' } })

    userExerciseUpsert.mockClear()
    await syncWorkoutHistory('user-1')
    expect(userExerciseUpsert).not.toHaveBeenCalled()
  })

  it('uploads legacy custom exercises before their entries and restores the user exercise id on pull', async () => {
    const legacyId = 'old-name-based-custom-id'
    const entryId = 'custom-exercise-entry'
    localStorage.setItem('gym-studio.exercises', JSON.stringify([
      { id: legacyId, name: 'My old exercise', primaryMuscle: 'Back' },
    ]))
    const { saveWorkoutHistory, loadWorkoutHistory, loadUserExercisesForSync } = await import('./storage')
    saveWorkoutHistory([{ ...localEntry, id: entryId, exerciseId: legacyId }])
    const callOrder: string[] = []
    const remoteExercise: Record<string, unknown> = {
      id: legacyId,
      name: 'My old exercise',
      body_region: 'Back',
      equipment: null,
      notes: null,
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2099-10-01T00:00:00Z',
      deleted_at: null,
    }
    const { userExerciseUpsert, upsert } = mockSyncClient(
      () => { callOrder.push('entry'); return { error: null } },
      [remoteEntry('2099-10-02T00:00:00Z', {
        id: entryId, exercise_id: null, user_exercise_id: legacyId,
      })],
      () => { callOrder.push('user exercise'); return { error: null } },
      [remoteExercise],
    )

    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')

    expect(userExerciseUpsert.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: legacyId, user_id: 'user-1', body_region: 'Back' }),
    ]))
    expect(upsert.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ exercise_id: null, user_exercise_id: legacyId }),
    ]))
    expect(callOrder).toEqual(['user exercise', 'entry'])
    expect(await loadWorkoutHistory()).toEqual([
      expect.objectContaining({ id: entryId, exerciseId: legacyId }),
    ])
    expect((await loadUserExercisesForSync())[0].dirty).toBe(false)
    await syncWorkoutHistory('user-1')
    expect(userExerciseUpsert).toHaveBeenCalledTimes(1)
  })

  it('isolates a rejected row, uploads A/B logs, pulls, and skips quarantine on later syncs', async () => {
    const { saveWorkoutHistory, setWorkoutHistoryLastPulledAt, loadWorkoutHistoryForSync } = await import('./storage')
    setWorkoutHistoryLastPulledAt('user-1', '2026-10-01T00:00:00Z')
    saveWorkoutHistory([
      { ...localEntry, id: 'bad', exerciseId: 'missing-exercise' },
      { ...localEntry, id: 'day-a', blockId: 'block-1', dayKey: 'A' },
      { ...localEntry, id: 'day-b', blockId: 'block-1', dayKey: 'B' },
    ])
    const error = { code: '23503', message: 'Exercise is not in the catalogue' }
    const { upsert, query } = mockSyncClient((rows) => ({
      error: rows.some((row) => row.id === 'bad') ? error : null,
      status: 400,
    }), [remoteEntry('2026-10-02T00:00:00Z', { id: 'remote-log' })])
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    const entries = await loadWorkoutHistoryForSync()
    expect(entries.find((entry) => entry.id === 'bad')).toMatchObject({
      dirty: true, syncError: { ...error, at: expect.any(String) },
    })
    expect(entries.filter((entry) => entry.id.startsWith('day-')).every((entry) => !entry.dirty)).toBe(true)
    expect(entries.some((entry) => entry.id === 'remote-log')).toBe(true)
    expect(upsert).toHaveBeenCalledTimes(4)
    expect(upsert.mock.calls[0][0]).toEqual(expect.arrayContaining([
      expect.objectContaining({ day_key: 'A' }), expect.objectContaining({ day_key: 'B' }),
    ]))
    expect(query.range).toHaveBeenCalledTimes(1)
    expect(JSON.parse(localStorage.getItem('gym-studio.history')!)[0]).not.toHaveProperty('syncError')
    upsert.mockClear()
    await syncWorkoutHistory('user-1')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('validates without a network upload and revalidates a manually retried row', async () => {
    const { saveWorkoutHistory, loadWorkoutHistoryForSync, retryQuarantinedWorkoutEntry } = await import('./storage')
    saveWorkoutHistory([{ ...localEntry, date: '2026-02-30' }])
    const { upsert, query } = mockSyncClient(() => ({ error: null }))
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(upsert).not.toHaveBeenCalled()
    expect(query.range).toHaveBeenCalled()
    expect((await loadWorkoutHistoryForSync())[0]).toMatchObject({
      dirty: true, syncError: { code: 'VALIDATION', message: 'date must be a valid YYYY-MM-DD date' },
    })
    retryQuarantinedWorkoutEntry(localEntry.id)
    expect((await loadWorkoutHistoryForSync())[0].syncError).toBeUndefined()
    await syncWorkoutHistory('user-1')
    expect(upsert).not.toHaveBeenCalled()
    saveWorkoutHistory([localEntry])
    await syncWorkoutHistory('user-1')
    expect(upsert).toHaveBeenCalledTimes(1)
    expect((await loadWorkoutHistoryForSync())[0]).toMatchObject({ dirty: false })
  })

  it('uses batches of at most 25 logs', async () => {
    const { saveWorkoutHistory } = await import('./storage')
    saveWorkoutHistory(Array.from({ length: 61 }, (_, index) => ({ ...localEntry, id: `batch-${index}` })))
    const { upsert } = mockSyncClient(() => ({ error: null }))
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(upsert.mock.calls.map(([rows]) => rows.length)).toEqual([25, 25, 11])
  })

  it('leaves network failures dirty, still uploads other rows and pulls before retrying', async () => {
    const { saveWorkoutHistory, loadWorkoutHistoryForSync } = await import('./storage')
    saveWorkoutHistory([localEntry, { ...localEntry, id: 'good' }])
    const error = { code: '', message: 'Failed to fetch' }
    const { query } = mockSyncClient((rows) => ({
      error: rows.some((row) => row.id === localEntry.id) ? error : null,
      status: 503,
    }))
    const { syncWorkoutHistory } = await import('./sync')
    await expect(syncWorkoutHistory('user-1')).rejects.toEqual(error)
    const entries = await loadWorkoutHistoryForSync()
    expect(entries.find((entry) => entry.id === localEntry.id)).toMatchObject({ dirty: true })
    expect(entries.find((entry) => entry.id === localEntry.id)?.syncError).toBeUndefined()
    expect(entries.find((entry) => entry.id === 'good')).toMatchObject({ dirty: false })
    expect(query.range).toHaveBeenCalled()
  })

  it('refreshes once on 401 and retries the upload successfully', async () => {
    const { saveWorkoutHistory, loadWorkoutHistoryForSync } = await import('./storage')
    saveWorkoutHistory([localEntry])
    let attempts = 0
    const { refreshSession, upsert } = mockSyncClient(() => ++attempts === 1
      ? { error: { code: 'PGRST301', message: 'JWT expired' }, status: 401 }
      : { error: null, status: 200 })
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledTimes(2)
    expect((await loadWorkoutHistoryForSync())[0]).toMatchObject({ dirty: false })
  })

  it('refreshes an expired session during pull and retries the page', async () => {
    const { query, refreshSession } = mockSyncClient(() => ({ error: null }))
    query.range.mockResolvedValueOnce({
      data: [], error: { code: 'PGRST301', message: 'JWT expired' } as never, status: 401,
    })
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(refreshSession).toHaveBeenCalledTimes(1)
    expect(query.range).toHaveBeenCalledTimes(2)
  })

  it.each(['refresh-fails', 'retry-still-expired', 'different-account'])(
    'requests sign-in without quarantining when %s', async (mode) => {
      const { saveWorkoutHistory, loadWorkoutHistoryForSync } = await import('./storage')
      saveWorkoutHistory([localEntry])
      const { refreshSession } = mockSyncClient(() => ({
        error: { code: 'PGRST301', message: 'JWT expired' }, status: 401,
      }))
      if (mode === 'refresh-fails') refreshSession.mockResolvedValue({
        data: { session: null as never }, error: { message: 'Refresh expired' },
      })
      if (mode === 'different-account') refreshSession.mockResolvedValue({
        data: { session: { user: { id: 'user-2' } } }, error: null,
      })
      const { syncWorkoutHistory } = await import('./sync')
      await expect(syncWorkoutHistory('user-1')).rejects.toMatchObject({ code: 'SIGN_IN_REQUIRED' })
      expect(refreshSession).toHaveBeenCalledTimes(1)
      expect((await loadWorkoutHistoryForSync())[0].syncError).toBeUndefined()
    }
  )

  it('keeps quarantine through merges and guards against quarantining a concurrent edit', async () => {
    const { saveWorkoutHistory, loadWorkoutHistoryForSync, quarantineWorkoutEntry, saveMergedWorkoutHistory } = await import('./storage')
    saveWorkoutHistory([localEntry])
    const [original] = await loadWorkoutHistoryForSync()
    const error = { code: '23514', message: 'Check rejected', at: new Date().toISOString() }
    quarantineWorkoutEntry(original, error)
    saveMergedWorkoutHistory(await loadWorkoutHistoryForSync())
    expect((await loadWorkoutHistoryForSync())[0].syncError).toEqual(error)
    saveMergedWorkoutHistory([{ ...original, updatedAt: '2099-01-01T00:00:00Z' }])
    quarantineWorkoutEntry(original, error)
    expect((await loadWorkoutHistoryForSync())[0].syncError).toBeUndefined()
  })

  it('loads old sync metadata without losing timestamps or dirty flags', async () => {
    localStorage.setItem('gym-studio.history', JSON.stringify([localEntry]))
    localStorage.setItem('gym-studio.sync-metadata', JSON.stringify({
      entries: { [localEntry.id]: { updatedAt: '2026-10-01T00:00:00Z', dirty: false } },
      lastPulledAt: { 'user-1': '2026-10-01T00:00:00Z' },
    }))
    const { loadWorkoutHistoryForSync } = await import('./storage')
    expect(await loadWorkoutHistoryForSync()).toEqual([
      { ...localEntry, updatedAt: '2026-10-01T00:00:00Z', dirty: false },
    ])
    const { upsert } = mockSyncClient(() => ({ error: null }))
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(upsert).not.toHaveBeenCalled()
  })

  it('cancels pending requests without changing another account’s metadata', async () => {
    const { saveWorkoutHistory, setStorageNamespace, loadWorkoutHistoryForSync } = await import('./storage')
    saveWorkoutHistory([localEntry])
    let active = true
    mockSyncClient(() => {
      active = false
      setStorageNamespace('user-2')
      saveWorkoutHistory([{ ...localEntry, notes: 'Other account' }])
      return { error: { code: '23503', message: 'Rejected' } }
    })
    const { syncWorkoutHistory } = await import('./sync')
    try {
      await expect(syncWorkoutHistory('user-1', () => active)).rejects.toMatchObject({ name: 'AbortError' })
      expect((await loadWorkoutHistoryForSync())[0]).toMatchObject({ dirty: true, notes: 'Other account' })
      expect((await loadWorkoutHistoryForSync())[0].syncError).toBeUndefined()
    } finally {
      setStorageNamespace(null)
    }
  })

  it('uploads soft deletes and restores, and merges remote tombstones', async () => {
    const { saveWorkoutHistory, deleteWorkoutEntry, restoreWorkoutEntry, loadWorkoutHistory, setWorkoutHistoryLastPulledAt } = await import('./storage')
    saveWorkoutHistory([localEntry])
    setWorkoutHistoryLastPulledAt('user-1', '2026-01-01T00:00:00Z')
    await deleteWorkoutEntry(localEntry.id)
    const { upsert } = mockSyncClient(() => ({ error: null }))
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')
    expect(upsert.mock.calls[0][0][0].deleted_at).toEqual(expect.any(String))
    expect(await loadWorkoutHistory()).toEqual([])
    restoreWorkoutEntry(localEntry)
    await syncWorkoutHistory('user-1')
    expect(upsert.mock.calls[1][0][0].deleted_at).toBeNull()
    expect(await loadWorkoutHistory()).toEqual([localEntry])
    mockSyncClient(() => ({ error: null }), [remoteEntry('2099-01-01T00:00:00Z', { deleted_at: '2099-01-01T00:00:00Z' })])
    await syncWorkoutHistory('user-1')
    expect(await loadWorkoutHistory()).toEqual([])
  })

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

  describe('sync validation and retry policy', () => {
    it.each([
      { date: '10/03/2026' }, { date: '2026-13-01' }, { date: 123 },
      { exerciseId: '  ' }, { sets: null }, { sets: [{}] },
      { sets: [{ reps: -1, weight: 60 }] }, { sets: [{ reps: 8, weight: Infinity }] },
      { sets: [{ reps: 8, weight: NaN }] },
      { sets: [{ reps: 8, weight: 60, drop: { reps: 1, weight: -1 } }] },
      { sets: [{ reps: 8, weight: 60, rir: -1 }] },
      { blockId: 12 }, { dayKey: [] }, { target: [] }, { target: 'bad' },
    ])('rejects malformed fields %j', async (fields) => {
      const { validateWorkoutEntry } = await import('./sync')
      expect(validateWorkoutEntry({ ...localEntry, ...fields } as WorkoutEntry)).toEqual(expect.any(String))
    })

    it('accepts zero/bodyweight, leap-day, optional null fields and A/B day entries', async () => {
      const { validateWorkoutEntry } = await import('./sync')
      for (const dayKey of ['A', 'B', null]) {
        expect(validateWorkoutEntry({
          ...localEntry, date: '2024-02-29', sets: [{ id: 'set', reps: 0, weight: 0 }],
          blockId: null, dayKey, target: null,
        } as unknown as WorkoutEntry)).toBeNull()
      }
    })

    it.each([
      ['23503', 400, true], ['23514', 400, true], ['22007', 400, true],
      ['22P02', 400, true], ['23P01', 400, true],
      ['42501', 403, true], ['23514', 500, false], ['42501', 401, false],
      ['PGRST301', 401, false], ['', 503, false], ['', undefined, false],
    ])('classifies %s with HTTP %s', async (code, status, expected) => {
      const { isNonRetryableSyncError } = await import('./sync')
      expect(isNonRetryableSyncError({ code }, status)).toBe(expected)
    })

    it('backs off from 10 seconds to a 5-minute cap', async () => {
      const { getSyncRetryDelay } = await import('./sync')
      expect([1, 2, 3, 4, 5, 6, 7, 20].map(getSyncRetryDelay))
        .toEqual([10_000, 20_000, 40_000, 80_000, 160_000, 300_000, 300_000, 300_000])
    })
  })

  it('uploads every existing local entry on first sign-in and stores the merged remote result', async () => {
    const serverUpdatedAt = '2026-10-03T12:00:00.000Z'
    localStorage.setItem('gym-studio.history', JSON.stringify([localEntry]))
    const uploadedRows: Record<string, unknown>[] = []
    const remoteRows: RemoteWorkoutEntry[] = [remoteEntry(serverUpdatedAt)]
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async () => ({ data: remoteRows, error: null })),
    }
    query.eq.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.order.mockReturnValue(query)
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

  it('pulls all pages in batches of 1000 before advancing the cursor', async () => {
    const cursor = '2026-10-03T00:00:00.000Z'
    const rows = Array.from({ length: 2_001 }, (_, index) =>
      remoteEntry('2026-10-03T00:00:01.000Z', { id: `entry-${index}` })
    )
    const ranges: Array<[number, number]> = []
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async (from: number, to: number) => {
        ranges.push([from, to])
        return { data: rows.slice(from, to + 1), error: null }
      }),
    }
    query.eq.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.order.mockReturnValue(query)
    const userExerciseQuery = {
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async () => ({ data: [], error: null })),
    }
    userExerciseQuery.eq.mockReturnValue(userExerciseQuery)
    userExerciseQuery.gte.mockReturnValue(userExerciseQuery)
    userExerciseQuery.order.mockReturnValue(userExerciseQuery)
    supabaseMock.client = {
      from: vi.fn((table: string) => ({
        select: vi.fn(() => table === 'user_exercises' ? userExerciseQuery : query),
      })),
    }

    const { setWorkoutHistoryLastPulledAt, loadWorkoutHistory } = await import('./storage')
    setWorkoutHistoryLastPulledAt('user-1', cursor)
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')

    expect(ranges).toEqual([[0, 999], [1_000, 1_999], [2_000, 2_999]])
    expect(query.order.mock.calls).toEqual([
      ['updated_at', { ascending: true }],
      ['id', { ascending: true }],
      ['updated_at', { ascending: true }],
      ['id', { ascending: true }],
      ['updated_at', { ascending: true }],
      ['id', { ascending: true }],
    ])
    expect(await loadWorkoutHistory()).toHaveLength(2_001)
    expect(JSON.parse(localStorage.getItem('gym-studio.sync-metadata')!).lastPulledAt['user-1'])
      .toBe('2026-10-03T00:00:01.000Z')
  })

  it('pulls rows exactly at the last-pulled timestamp boundary', async () => {
    const cursor = '2026-10-03T00:00:00.000Z'
    const boundaryRow = remoteEntry(cursor, { id: 'boundary-entry' })
    const query = {
      eq: vi.fn(),
      gte: vi.fn(),
      order: vi.fn(),
      range: vi.fn(async () => ({ data: [boundaryRow], error: null })),
    }
    query.eq.mockReturnValue(query)
    query.gte.mockReturnValue(query)
    query.order.mockReturnValue(query)
    supabaseMock.client = { from: vi.fn(() => ({ select: vi.fn(() => query) })) }

    const { setWorkoutHistoryLastPulledAt, loadWorkoutHistory } = await import('./storage')
    setWorkoutHistoryLastPulledAt('user-1', cursor)
    const { syncWorkoutHistory } = await import('./sync')
    await syncWorkoutHistory('user-1')

    expect(query.gte).toHaveBeenCalledWith('updated_at', cursor)
    expect(await loadWorkoutHistory()).toEqual([
      expect.objectContaining({ id: 'boundary-entry' }),
    ])
  })
})
