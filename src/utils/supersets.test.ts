import { describe, expect, it } from 'vitest'
import { createSupersetEntries, getLoggedSupersetRounds, groupSupersets } from './supersets'

describe('groupSupersets', () => {
  it('pairs adjacent exercises with the same code letter and superset technique', () => {
    const groups = groupSupersets([
      { name: 'Press', code: 'B1', technique: 'superset' },
      { name: 'Fly', code: 'B2', technique: 'superset' },
      { name: 'Curl', code: 'C1', technique: 'superset' },
      { name: 'Row', code: 'C2', technique: 'straight' },
    ])

    expect(groups.map(({ isSuperset, items }) => [isSuperset, items.map(({ exercise }) => exercise.name)])).toEqual([
      [true, ['Press', 'Fly']],
      [false, ['Curl']],
      [false, ['Row']],
    ])
  })
})

describe('getLoggedSupersetRounds', () => {
  it('restores only rounds logged for every exercise, capped at the prescribed count', () => {
    expect(getLoggedSupersetRounds([2, 2], 3)).toEqual([true, true, false])
    expect(getLoggedSupersetRounds([3, 2], 3)).toEqual([true, true, false])
    expect(getLoggedSupersetRounds([5, 5], 3)).toEqual([true, true, true])
  })

  it('returns no completed rounds when an exercise has no logged sets', () => {
    expect(getLoggedSupersetRounds([2, 0], 3)).toEqual([false, false, false])
  })
})

describe('createSupersetEntries', () => {
  const scope = { date: '2026-10-03', blockId: 'block-6', dayKey: 'chest-a' }

  it('creates one entry per exercise with filled sets and matching scope', () => {
    const entries = createSupersetEntries(
      [
        {
          exerciseId: 'press',
          equipment: 'dumbbell',
          sets: [
            { id: 'p1', reps: 10, weight: 20 },
            { id: 'p2', reps: 10, weight: 22 },
            { id: 'p3', reps: 10, weight: 0 },
          ],
        },
        {
          exerciseId: 'fly',
          equipment: 'cable',
          sets: [
            { id: 'f1', reps: 12, weight: 8 },
            { id: 'f2', reps: 12, weight: 9 },
          ],
        },
      ],
      scope,
      () => 'entry-id'
    )

    expect(entries).toHaveLength(2)
    expect(entries.map(({ exerciseId, sets, date, blockId, dayKey }) => ({
      exerciseId,
      sets: sets.map(({ id }) => id),
      date,
      blockId,
      dayKey,
    }))).toEqual([
      { exerciseId: 'press', sets: ['p1', 'p2'], date: scope.date, blockId: scope.blockId, dayKey: scope.dayKey },
      { exerciseId: 'fly', sets: ['f1', 'f2'], date: scope.date, blockId: scope.blockId, dayKey: scope.dayKey },
    ])
  })

  it('omits unfilled exercises and preserves drop-set data on filled sets', () => {
    const entries = createSupersetEntries(
      [
        { exerciseId: 'press', sets: [{ id: 'p1', reps: 10, weight: 0 }] },
        {
          exerciseId: 'fly',
          sets: [{ id: 'f1', reps: 12, weight: 8, drop: { reps: 12, weight: 6 } }],
        },
      ],
      scope,
      () => 'entry-id'
    )

    expect(entries).toHaveLength(1)
    expect(entries[0].exerciseId).toBe('fly')
    expect(entries[0].sets[0].drop).toEqual({ reps: 12, weight: 6 })
  })

  it('returns no entries when neither exercise has a filled set', () => {
    expect(createSupersetEntries([
      { exerciseId: 'press', sets: [{ id: 'p1', reps: 10, weight: 0 }] },
      { exerciseId: 'fly', sets: [{ id: 'f1', reps: 12, weight: 0 }] },
    ], scope, () => 'entry-id')).toEqual([])
  })
})
