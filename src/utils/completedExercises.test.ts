import { describe, expect, it } from 'vitest'
import { WorkoutEntry } from '../types'
import { findCompletedEntry, findNextPendingIndex, findPrefillEntry, findPrefillSelection, findWeekCompletion, summarizeCompletedEntry, upsertScopedEntry } from './completedExercises'

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
    expect(summarizeCompletedEntry(entry())).toBe('2 sets · 20 kg × 10 · 26 kg × 8')
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 10, weight: 22.5 }] })))
      .toBe('1 set · top 22.5 kg')
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 12, weight: 0 }] }))).toBe('1 set')
    expect(summarizeCompletedEntry(entry(), 'es')).toBe('2 series · 20 kg × 10 · 26 kg × 8')
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 10, weight: 12.5 }, { id: 'b', reps: 10, weight: 12.5 }] }), 'es'))
      .toBe('2 series · mejor 12.5 kg')
  })

  it('shows each set load and reps when set loads differ', () => {
    const varied = entry({
      sets: [
        { id: 'a', reps: 10, weight: 35.5 },
        { id: 'b', reps: 10, weight: 33 },
        { id: 'c', reps: 10, weight: 30.5 },
      ],
    })

    expect(summarizeCompletedEntry(varied)).toBe(
      '3 sets · 35.5 kg × 10 · 33 kg × 10 · 30.5 kg × 10'
    )
    expect(summarizeCompletedEntry(varied, 'es')).toBe(
      '3 series · 35.5 kg × 10 · 33 kg × 10 · 30.5 kg × 10'
    )
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
  const make = (id: string, date: string, dayKey: string, weight: number, reps = 8): WorkoutEntry => ({
    id,
    exerciseId: 'press',
    date,
    dayKey,
    sets: [{ id: `${id}-1`, reps, weight }],
  })

  it('prefers the latest matching day before falling back to its paired day', () => {
    const list = [
      make('a', '2026-09-01', 'chest-back-a', 20),
      make('b', '2026-09-10', 'chest-back-b', 24),
      make('c', '2026-09-20', 'chest-back-a', 26),
    ]
    expect(findPrefillEntry(list, 'press', 'chest-back-a')?.id).toBe('c')
    expect(findPrefillEntry(list, 'press', 'chest-back-b')?.id).toBe('b')
    expect(findPrefillEntry(list, 'press', 'chest-back-c')?.id).toBe('c')
    expect(findPrefillEntry(list, 'press', 'C')?.id).toBe('c')
    expect(findPrefillEntry(list, 'other', 'chest-back-a')).toBeUndefined()
  })

  it('uses A as the basis for the first B session while retaining same-day history afterward', () => {
    const aSession = make('a', '2026-09-01', 'chest-back-a', 10, 10)
    const bSession = make('b', '2026-09-10', 'chest-back-b', 12.5, 15)

    expect(findPrefillSelection([aSession], 'press', 'chest-back-b')).toEqual({
      entry: aSession,
      basis: 'other-day',
    })
    expect(findPrefillSelection([bSession, aSession], 'press', 'chest-back-b')).toEqual({
      entry: bSession,
      basis: 'same-day',
    })
    expect(findPrefillSelection([aSession], 'press', 'chest-back-a')).toEqual({
      entry: aSession,
      basis: 'same-day',
    })
    const uppercaseA = make('upper-a', '2026-09-01', 'A', 10, 10)
    expect(findPrefillEntry([uppercaseA], 'press', 'B')?.id).toBe('upper-a')
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

describe('findWeekCompletion (active Monday–Sunday week)', () => {
  const e = (id: string, date: string, dayKey = 'chest-back-a') =>
    ({ id, exerciseId: 'press', date, blockId: 'b6', dayKey, sets: [{ id: `${id}-s`, weight: 20, reps: 10 }] })
  const scope = { date: '2026-10-08', blockId: 'b6', dayKey: 'chest-back-a' } // Thursday

  it('counts a log from Monday of the same week as done', () => {
    expect(findWeekCompletion([e('mon', '2026-10-05')], scope)?.id).toBe('mon')
  })
  it('starts empty again the next Monday', () => {
    expect(findWeekCompletion([e('mon', '2026-10-05')], { ...scope, date: '2026-10-12' })).toBeUndefined()
  })
  it('ignores other day slots and returns the latest log of the week', () => {
    const list = [e('mon', '2026-10-05'), e('wed', '2026-10-07'), e('other', '2026-10-08', 'arms-a')]
    expect(findWeekCompletion(list, scope)?.id).toBe('wed')
  })
})
