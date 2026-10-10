import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { muscleTrend } from './muscles'
import type { ProgressEntry } from './types'

const gluteExercise: Exercise = {
  id: 'glute-work',
  name: 'Glute work',
  primaryMuscle: 'Glutes',
  primaryMuscles: ['Glutes'],
  secondaryMuscles: ['Hamstrings'],
  equipment: 'bodyweight',
}

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
  days: [{ key: 'day-a', position: 1, name: 'A', exercises: [{
    code: 'glute-work',
    position: 1,
    exerciseId: gluteExercise.id,
    sets: 3,
    reps: ['12', '12', '12'],
    restSeconds: 60,
    technique: 'straight',
  }] }],
}

function entry(date: string, setCount: number): ProgressEntry {
  return {
    id: date,
    exerciseId: gluteExercise.id,
    date,
    blockId: 'b1',
    dayKey: 'day-a',
    sets: Array.from({ length: setCount }, (_, index) => ({ id: `${date}-${index}`, weight: 0, reps: 10 })),
  }
}

describe('approved weekly muscle set trends', () => {
  it('credits primary muscles one set and secondary muscles half a set', () => {
    const result = muscleTrend([entry('2026-01-05', 12), entry('2026-01-06', 4)], [block], [gluteExercise], block, '2026-01-10')
    expect(result.weeks[0].values.Glutes).toBe(16)
    expect(result.weeks[0].values.Hamstrings).toBe(8)
    expect(result.averages.Glutes).toBeUndefined()
  })

  it('shows a four-complete-week average while excluding deload weeks', () => {
    const deloadBlock = { ...block, startDate: '2025-11-03' }
    const dates = ['2025-12-08', '2025-12-15', '2025-12-22', '2025-12-29', '2026-01-05']
    const result = muscleTrend(dates.map((date) => entry(date, 2)), [deloadBlock], [gluteExercise], deloadBlock, '2026-01-14')
    expect(result.weeks.filter((week) => week.complete && !week.deload)).toHaveLength(4)
    expect(result.averages.Glutes).toBe(2)
  })
})
