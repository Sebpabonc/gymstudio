import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import {
  buildWorkoutExerciseInsight,
  buildWorkoutSetTrend,
  workoutCompletionCounts,
  workoutInsightTally,
  workoutMuscleSetTotals,
} from './workoutInsights'

const exercise: Exercise = {
  id: 'bench',
  name: 'Bench',
  primaryMuscle: 'Chest',
  primaryMuscles: ['Chest'],
  secondaryMuscles: ['Triceps'],
  equipment: 'barbell',
}

function entry(date: string, sets: Array<[number, number]>, options: Partial<WorkoutEntry> = {}): WorkoutEntry {
  return {
    id: `entry-${date}`,
    exerciseId: 'bench',
    date,
    blockId: 'block-1',
    dayKey: 'chest-a',
    target: { sets: sets.length, reps: { min: 10, max: 10 } },
    sets: sets.map(([weight, reps], index) => ({ id: `${date}-${index}`, weight, reps })),
    ...options,
  }
}

describe('workout exercise insights', () => {
  it('uses the latest equivalent same-day session and approved comparison classifications', () => {
    const previous = entry('2026-10-05', [[30, 10], [30, 10]])
    const differentDay = entry('2026-10-08', [[60, 10]], { id: 'other-day', dayKey: 'chest-b' })
    const current = entry('2026-10-12', [[32.5, 10], [30, 9]])
    const insight = buildWorkoutExerciseInsight(current, [previous, differentDay], [], exercise)

    expect(insight.previous?.date).toBe('2026-10-05')
    expect(insight.comparison.verdict).toBe('mixed')
    expect(insight.changes).toHaveLength(2)
    expect(workoutInsightTally([insight])).toMatchObject({ mixed: 1 })
  })

  it('classifies missing same-day evidence as Baseline and includes traded in Mixed', () => {
    const baseline = buildWorkoutExerciseInsight(entry('2026-10-12', [[30, 10]]), [], [], exercise)
    const traded = buildWorkoutExerciseInsight(
      entry('2026-10-12', [[32.5, 8]]),
      [entry('2026-10-05', [[30, 10]])],
      [],
      exercise
    )

    expect(baseline.comparison.verdict).toBe('baseline')
    expect(traded.comparison.verdict).toBe('traded')
    expect(workoutInsightTally([baseline, traded])).toMatchObject({ baseline: 1, mixed: 1 })
  })

  it('counts partial workouts for the early-finish screen without changing entry data', () => {
    const entries = [entry('2026-10-12', [[30, 10], [30, 9]])]
    expect(workoutCompletionCounts(entries, 3, 8)).toEqual({
      sets: 2,
      plannedSets: 8,
      exercises: 1,
      plannedExercises: 3,
      complete: false,
    })
    expect(entries[0]).not.toHaveProperty('workoutMode')
  })

  it('counts hard sets per primary and half sets per secondary muscle', () => {
    expect(workoutMuscleSetTotals([entry('2026-10-12', [[30, 10], [30, 10]])], [exercise])).toEqual([
      { muscle: 'Chest', sets: 2 },
      { muscle: 'Triceps', sets: 1 },
    ])
  })
})

describe('workout set trend data', () => {
  it('returns the last five any-day sessions, target ghosts, and A/B labels', () => {
    const history = ['2026-10-01', '2026-10-03', '2026-10-05', '2026-10-08', '2026-10-10'].map((date, index) =>
      entry(date, [[30 + index, 10]], { id: `entry-${index}`, dayKey: index % 2 ? 'chest-b' : 'chest-a' })
    )
    const trend = buildWorkoutSetTrend(history, [], 'bench', '2026-10-12', [
      { weight: 35, reps: 10 },
      { weight: 32.5, reps: 12 },
    ])

    expect(trend).toHaveLength(5)
    expect(trend.map((session) => session.date)).toEqual([
      '2026-10-03', '2026-10-05', '2026-10-08', '2026-10-10', '2026-10-12',
    ])
    expect(trend[trend.length - 1]).toMatchObject({
      date: '2026-10-12',
      today: true,
      sets: [
        { weight: 35, reps: 10, logged: false },
        { weight: 32.5, reps: 12, logged: false },
      ],
    })
    expect(trend[2].dayType).toBe('B')
  })

  it('marks deload groups and uses the saved working sets for today', () => {
    const block: TrainingBlock = {
      id: 'block-1', number: 1, name: 'Block', method: 'flat', startDate: '2026-01-01', weeks: 6,
      origin: 'pt', summary: '', insights: [], days: [],
    }
    const current = entry('2026-02-05', [[30, 10]], { dayKey: 'chest-a' })
    const trend = buildWorkoutSetTrend([current], [block], 'bench', '2026-02-05', [
      { weight: 35, reps: 10 },
      { weight: 32.5, reps: 12 },
    ])

    expect(trend[0].deload).toBe(true)
    expect(trend[0].sets).toEqual([
      { weight: 30, reps: 10, logged: true },
      { weight: 32.5, reps: 12, logged: false },
    ])
  })
})
