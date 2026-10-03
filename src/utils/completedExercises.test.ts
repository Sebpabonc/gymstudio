import { describe, expect, it } from 'vitest'
import { WorkoutEntry } from '../types'
import { findCompletedEntry, summarizeCompletedEntry } from './completedExercises'

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
    expect(summarizeCompletedEntry(entry({ sets: [{ id: 'a', reps: 12, weight: 0 }] }))).toBe('1 set')
  })
})
