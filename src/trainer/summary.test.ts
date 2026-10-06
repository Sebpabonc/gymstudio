import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { buildWorkoutSummary } from './summary'

const catalogue: Exercise[] = [{ id: 'press', name: 'Chest Press', primaryMuscle: 'chest', equipment: 'dumbbell' }]
const plan = (exerciseId: string, position: number, reps: string) => ({
  code: `P${position}`,
  position: 1,
  exerciseId,
  sets: 3,
  reps: [reps],
  restSeconds: 90,
  technique: 'straight' as const,
})
const block: TrainingBlock = {
  id: 'block-1',
  number: 1,
  name: 'Block',
  method: 'straight',
  startDate: '2026-10-05',
  weeks: 6,
  origin: 'pt',
  summary: '',
  insights: [],
  days: [
    { key: 'day-a', position: 1, name: 'Monday', exercises: [plan('press', 1, '10')] },
    { key: 'day-b', position: 4, name: 'Thursday', exercises: [plan('press', 4, '12')] },
    { key: 'day-f', position: 6, name: 'Saturday', exercises: [plan('other', 6, '8')] },
  ],
}
const entry = (
  id: string,
  date: string,
  dayKey: string,
  reps: number,
  targetReps = 10
): WorkoutEntry => ({
  id,
  exerciseId: 'press',
  date,
  blockId: block.id,
  dayKey,
  sets: [1, 2, 3].map((index) => ({ id: `${id}-${index}`, weight: 10, reps })),
  target: { sets: 3, reps: { min: targetReps, max: targetReps }, weight: 10 },
})

describe('buildWorkoutSummary', () => {
  it('shows an increase against the next same-week occurrence and includes today in its evidence', () => {
    const today = entry('today', '2026-10-05', 'day-a', 14)
    const [row] = buildWorkoutSummary([today], [], [block], catalogue, today.date)

    expect(row).toMatchObject({
      exerciseId: 'press',
      trend: 'up',
      actual: { weight: 10, reps: [14, 14, 14] },
      target: { weight: 10, reps: { min: 10, max: 10 } },
      next: { action: 'increase_weight', weight: 12, reps: { min: 10, max: 12 } },
      nextDate: '2026-10-08',
      nextDayKey: 'day-b',
    })
  })

  it('marks a maintained recommendation as the same trend', () => {
    const today = entry('today', '2026-10-05', 'day-a', 9)
    const sameRangeBlock = {
      ...block,
      days: block.days.map((day) => day.key === 'day-b'
        ? { ...day, exercises: [plan('press', 4, '10')] }
        : day),
    }

    expect(buildWorkoutSummary([today], [], [sameRangeBlock], catalogue, today.date)[0]?.trend).toBe('same')
  })

  it('marks a repeated below-target result as a downward trend (PT: two misses drop one step on coarse loads)', () => {
    const previous = entry('previous', '2026-10-01', 'day-a', 7)
    const today = entry('today', '2026-10-05', 'day-a', 7)

    expect(buildWorkoutSummary([today], [previous], [block], catalogue, today.date)[0]).toMatchObject({
      trend: 'down',
      next: { action: 'decrease_weight', weight: 8 },
    })
  })

  it('uses the next week when no occurrence remains this week', () => {
    const today = entry('today', '2026-10-10', 'day-f', 14)

    expect(buildWorkoutSummary([today], [], [block], catalogue, today.date)[0]).toMatchObject({
      nextDate: '2026-10-12',
      nextDayKey: 'day-a',
    })
  })

  it('applies the deload when the next occurrence is in week six', () => {
    const today = entry('today', '2026-11-08', 'day-f', 14)

    expect(buildWorkoutSummary([today], [], [block], catalogue, today.date)[0]).toMatchObject({
      nextDate: '2026-11-09',
      next: { action: 'deload', reason: 'deload_week' },
    })
  })
})
