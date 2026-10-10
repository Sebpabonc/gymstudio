import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { consistencyTrend, progressiveOverloadRate } from './consistency'
import type { ProgressEntry } from './types'

const plannedDays = Array.from({ length: 5 }, (_, index) => ({
  key: `day-${index + 1}`,
  position: index + 1,
  name: `Day ${index + 1}`,
  exercises: [],
}))

const block: TrainingBlock = {
  id: 'b1',
  number: 1,
  name: 'Block 1',
  method: 'flat-pyramid',
  startDate: '2026-01-05',
  weeks: 12,
  origin: 'coach',
  summary: '',
  insights: [],
  days: plannedDays,
}

const squat: Exercise = { id: 'squat', name: 'Squat', primaryMuscle: 'Quads', equipment: 'barbell' }

function entriesForWeek(days: number[], weekStart = '2026-01-05'): ProgressEntry[] {
  return days.map((day, index) => {
    const date = new Date(Date.parse(`${weekStart}T00:00:00Z`) + day * 86_400_000).toISOString().slice(0, 10)
    return {
      id: `${date}-${index}`,
      exerciseId: squat.id,
      date,
      blockId: 'b1',
      dayKey: index < 5 ? `day-${index + 1}` : `extra-${index}`,
      sets: [{ id: `${date}-set`, weight: 50, reps: 10 }],
    }
  })
}

describe('approved weekly consistency calculations', () => {
  it('caps adherence at 100% while keeping extra sessions visible', () => {
    const result = consistencyTrend(entriesForWeek([0, 1, 2, 3, 4, 5]), [block], '2026-01-14')
    expect(result.weeks[0]).toMatchObject({ plannedDays: 5, loggedPlannedDays: 5, sessions: 6, adherence: 1 })
  })

  it('calculates 80% adherence from four of five planned days', () => {
    const result = consistencyTrend(entriesForWeek([0, 1, 2, 3]), [block], '2026-01-14')
    expect(result.weeks[0].adherence).toBe(0.8)
  })

  it('uses completed weeks only for the 75% current and longest streaks', () => {
    const historical = [
      ...entriesForWeek([0, 1, 2, 3, 4], '2026-01-05'),
      ...entriesForWeek([0, 1, 2, 3], '2026-01-12'),
      ...entriesForWeek([0, 1, 2], '2026-01-19'),
      ...entriesForWeek([0, 1, 2, 3, 4], '2026-01-26'),
      ...entriesForWeek([0, 1, 2, 3, 4], '2026-02-02'),
    ]
    const result = consistencyTrend(historical, [block], '2026-02-11')
    expect(result.longestStreak).toBe(2)
    expect(result.currentStreak).toBe(2)
    const inProgress = consistencyTrend(entriesForWeek([0], '2026-02-09'), [block], '2026-02-11')
    expect(inProgress.weeks[0].adherence).toBeNull()
    expect(inProgress.currentStreak).toBe(0)
  })

  it('hides overload rate until eight comparable sessions are available', () => {
    const dates = Array.from({ length: 9 }, (_, index) => {
      const date = new Date(Date.parse('2026-02-06T00:00:00Z') + index * 3 * 86_400_000).toISOString().slice(0, 10)
      return {
        id: `s${index}`,
        exerciseId: squat.id,
        date,
        blockId: 'b1',
        dayKey: 'day-1',
        sets: [{ id: `set${index}`, weight: 50 + index * 2.5, reps: 10 }],
      }
    })
    const overloadBlock = { ...block, startDate: '2025-11-03', weeks: 24 }
    const seven = progressiveOverloadRate(dates.slice(0, 8), [overloadBlock], [squat], '2026-03-09')
    const eight = progressiveOverloadRate(dates, [overloadBlock], [squat], '2026-03-09')
    expect(seven.rate).toBeNull()
    expect(eight).toMatchObject({ comparable: 8, rate: 1 })
  })
})
