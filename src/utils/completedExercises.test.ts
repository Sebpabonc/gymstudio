import { describe, expect, it } from 'vitest'
import { WorkoutEntry } from '../types'
import { findCompletedEntry, findNextPendingIndex, findPrefillEntry, summarizeCompletedEntry, upsertScopedEntry } from './completedExercises'

const entry = (overrides: Partial<WorkoutEntry> = {}): WorkoutEntry => ({
  id: 'e1',
  exerciseId: 'bench',
  date: '2026-10-03',
  blockId: 'b1',
  dayKey: 'd1',
  sets: [
    { id: 's1', reps: 10, weight: 20 },
    { id: 's2', reps: 8, weight: 26 },
  ],
  ...overrides,
})

describe('completed exercises', () => {
  it('finds today\'s entry for the same block and day', () => {
    const e = entry()
    expect(findCompletedEntry([e], { date: '2026-10-03', blockId: 'b1', dayKey: 'd1' })).toBe(e)
  })

  it('resets on another date and ignores other days or blocks', () => {
    const list = [entry()]
    expect(findCompletedEntry(list, { date: '2026-10-04', blockId: 'b1', dayKey: 'd1' })).toBeUndefined()
    expect(findCompletedEntry(list, { date: '2026-10-03', blockId: 'b1', dayKey: 'd2' })).toBeUndefined()
    expect(findCompletedEntry(list, { date: '2026-10-03', blockId: 'b2', dayKey: 'd1' })).toBeUndefined()
    expect(findCompletedEntry(list, { date: '2026-10-03' })).toBeUndefined()
  })

  it('matches custom-plan entries without block/day', () => {
    const e = entry({ blockId: undefined, dayKey: undefined })
    expect(findCompletedEntry([e], { date: '2026-10-03' })).toBe(e)
  })

  it('summarizes sets and top weight', () => {
    expect(summarizeCompletedEntry(entry())).toBe('2 sets · top 26 kg')
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 10, weight: 22.5 }] })))
      .toBe('1 set · top 22.5 kg')
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 12, weight: 0 }] }))).toBe('1 set')
  })

  it('picks the next pending exercise after the current one', () => {
    expect(findNextPendingIndex([false, true, false, false], 1)).toBe(2)
    expect(findNextPendingIndex([false, true, true, false], 1)).toBe(3)
  })

  it('wraps to the first pending exercise only when none remain after', () => {
    expect(findNextPendingIndex([false, true, true], 1)).toBe(0)
    expect(findNextPendingIndex([true, true], 1)).toBe(-1)
    expect(findNextPendingIndex([true], 0)).toBe(-1)
    expect(findNextPendingIndex([], -1)).toBe(-1)
  })
})

describe('findPrefillEntry', () => {
  const make = (id: string, date: string, dayKey: string, weight: number): WorkoutEntry => ({
    id,
    exerciseId: 'press',
    date,
    dayKey,
    sets: [{ id: `${id}-1`, reps: 8, weight }],
  })

  it('prefers the latest session of the same day, else the latest overall', () => {
    const list = [make('a', '2026-09-01', 'A', 20), make('b', '2026-09-10', 'B', 24), make('c', '2026-09-20', 'A', 26)]
    expect(findPrefillEntry(list, 'press', 'A')?.id).toBe('c')
    expect(findPrefillEntry(list, 'press', 'B')?.id).toBe('b')
    expect(findPrefillEntry(list, 'press', 'C')?.id).toBe('c')
    expect(findPrefillEntry(list, 'other', 'A')).toBeUndefined()
  })
})

describe('upsertScopedEntry', () => {
  const scope = { date: '2026-10-04', blockId: 'b1', dayKey: 'd1' }
  const make = (id: string): WorkoutEntry => ({
    id,
    exerciseId: 'press',
    date: scope.date,
    blockId: 'b1',
    dayKey: 'd1',
    sets: [{ id: `${id}-1`, reps: 8, weight: 20 }],
  })

  it('logging twice leaves a single completed entry', () => {
    const first = upsertScopedEntry([], make('one'), scope)
    const second = upsertScopedEntry(first.history, make('two'), scope)
    expect(second.history).toHaveLength(1)
    expect(second.entry.id).toBe('one')
    expect(findCompletedEntry(second.history, scope)).toBe(second.entry)
  })

  it('collapses pre-existing duplicates and keeps other exercises', () => {
    const other = { ...make('x'), exerciseId: 'row' }
    const result = upsertScopedEntry([make('a'), make('b'), other], make('c'), scope)
    expect(result.history.map((e) => e.exerciseId).sort()).toEqual(['press', 'row'])
  })
})
