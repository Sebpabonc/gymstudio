import { describe, expect, it } from 'vitest'
import { WorkoutEntry } from '../types'
import {
  captureUndoSnapshots,
  createSessionSummary,
  getPersonalRecordBadges,
  sessionDurationMs,
  undoLoggedEntries,
} from './loggingFeedback'

const entry = (overrides: Partial<WorkoutEntry> = {}): WorkoutEntry => ({
  id: 'press-1',
  exerciseId: 'press',
  date: '2026-10-03',
  blockId: 'block-1',
  dayKey: 'day-1',
  sets: [{ id: 'set-1', reps: 10, weight: 20 }],
  ...overrides,
})

const scope = { date: '2026-10-03', blockId: 'block-1', dayKey: 'day-1' }

describe('logging feedback', () => {
  it('undoes a new log without affecting other entries', () => {
    const logged = entry({ id: 'new' })
    const other = entry({ id: 'other', exerciseId: 'row' })
    const snapshots = captureUndoSnapshots([other], [logged], scope)

    expect(undoLoggedEntries([logged, other], snapshots)).toEqual([other])
  })

  it('restores the replaced entry when a log is undone', () => {
    const previous = entry({ id: 'original' })
    const logged = entry({ id: 'original', sets: [{ id: 'new-set', reps: 8, weight: 25 }] })
    const snapshots = captureUndoSnapshots([previous], [logged], scope)

    expect(undoLoggedEntries([logged], snapshots)).toEqual([previous])
  })

  it('keeps unrelated newer entries when an older log is undone', () => {
    const logged = entry({ id: 'new' })
    const later = entry({ id: 'later', date: '2026-10-04' })
    const snapshots = captureUndoSnapshots([], [logged], scope)

    expect(undoLoggedEntries([later, logged], snapshots)).toEqual([later])
  })

  it('measures duration only within the same session scope', () => {
    const start = { scopeKey: 'preset:2026-10-03:block-1:day-1', timestamp: 1000 }

    expect(sessionDurationMs(start, start.scopeKey, 61_000)).toBe(60_000)
    expect(sessionDurationMs(start, 'preset:2026-10-03:block-1:day-2', 61_000)).toBe(0)
    expect(sessionDurationMs(start, 'custom:2026-10-03:block-1:day-1', 61_000)).toBe(0)
  })

  it('summarizes set count, main and drop-set volume, duration and PRs', () => {
    const logged = entry({
      sets: [
        { id: 'set-1', reps: 10, weight: 20, drop: { reps: 5, weight: 10 } },
        { id: 'set-2', reps: 1, weight: 25 },
      ],
    })
    const history = [
      ...['2026-09-01', '2026-09-08', '2026-09-15'].map((date, index) =>
        entry({
          id: `prior-${index}`,
          date,
          sets: [{ id: `prior-set-${index}`, reps: 12, weight: 20 }],
        })
      ),
      logged,
    ]

    expect(createSessionSummary([logged], 90_000, history, [])).toEqual({
      duration: '2 mins',
      sets: 2,
      volume: 275,
      prs: [{ exerciseId: 'press', badges: ['weight', 'reps'] }],
    })
    expect(createSessionSummary([logged], 90_000, history, [], 'es')).toEqual({
      duration: '2 min',
      sets: 2,
      volume: 275,
      prs: [{ exerciseId: 'press', badges: ['weight', 'reps'] }],
    })
  })

  it('does not carry a same-date PR across different workout days', () => {
    const previousSessions = ['2026-09-01', '2026-09-08', '2026-09-15'].map((date, index) =>
      entry({
        id: `previous-${index}`,
        date,
        dayKey: 'day-1',
        sets: [{ id: `previous-set-${index}`, reps: 8, weight: 20 }],
      })
    )
    const currentDayEntry = entry({
      id: 'day-1-entry',
      dayKey: 'day-1',
      sets: [{ id: 'day-1-set', reps: 8, weight: 20 }],
    })
    const otherDayEntry = entry({
      id: 'day-2-entry',
      dayKey: 'day-2',
      sets: [{ id: 'day-2-set', reps: 8, weight: 30 }],
    })
    const history = [...previousSessions, currentDayEntry, otherDayEntry]

    expect(getPersonalRecordBadges(currentDayEntry, history, [])).toEqual([])
    expect(getPersonalRecordBadges(otherDayEntry, history, [])).toContain('weight')
  })
})
