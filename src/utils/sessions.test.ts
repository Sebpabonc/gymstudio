import { describe, expect, it } from 'vitest'
import { groupSessions, todaysEntriesForDay } from './sessions'
import type { WorkoutEntry } from '../types'

const e = (id: string, date: string, dayKey: string): WorkoutEntry =>
  ({ id, exerciseId: id, date, blockId: 'b6', dayKey, sets: [{ id: `${id}s`, weight: 10, reps: 10 }] })

describe('sessions', () => {
  const history = [e('a', '2026-10-07', 'lower-body-b'), e('b', '2026-10-07', 'lower-body-b'), e('c', '2026-10-07', 'lower-body-a'), e('d', '2026-10-06', 'arms-a')]
  it('groups by date and day, newest first', () => {
    const sessions = groupSessions(history)
    expect(sessions.map((s) => [s.date, s.dayKey, s.entries.length])).toEqual([
      ['2026-10-07', 'lower-body-a', 1], ['2026-10-07', 'lower-body-b', 2], ['2026-10-06', 'arms-a', 1],
    ])
  })
  it("finds today's entries for one day only", () => {
    expect(todaysEntriesForDay(history, '2026-10-07', 'b6', 'lower-body-b').map((x) => x.id)).toEqual(['a', 'b'])
  })
})
