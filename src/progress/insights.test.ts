import { describe, expect, it } from 'vitest'
import { Exercise, TrainingBlock } from '../types'
import { calculateProgressInsights, classifyMovementPattern, PROGRESS_THRESHOLDS } from './insights'
import { ProgressEntry } from './types'

const squat: Exercise = {
  id: 'squat',
  name: 'Squat',
  primaryMuscle: 'Quads',
  mechanic: 'compound',
  movementPattern: 'squat',
  equipment: 'barbell',
}

function makeBlock(exerciseIds = ['squat'], startDate = '2026-01-05'): TrainingBlock {
  const planExercises = exerciseIds.map((exerciseId, index) => ({
    code: `${exerciseId}-${index}`,
    position: index + 1,
    exerciseId,
    sets: 3,
    reps: ['8', '8', '8'],
    restSeconds: 90,
    technique: 'straight' as const,
  }))
  return {
    id: 'block-1',
    number: 1,
    name: 'Block 1',
    method: 'flat',
    startDate,
    weeks: 6,
    origin: 'coach',
    summary: '',
    insights: [],
    days: [{ key: 'day-a', position: 1, name: 'Day A', exercises: planExercises }],
  }
}

function makeEntry(
  date: string,
  weight: number,
  options: {
    exerciseId?: string
    reps?: number
    sets?: number
    rir?: number
    blockId?: string
    dayKey?: string
  } = {}
): ProgressEntry {
  const exerciseId = options.exerciseId ?? 'squat'
  return {
    id: `${exerciseId}-${date}`,
    exerciseId,
    date,
    blockId: options.blockId ?? 'block-1',
    dayKey: options.dayKey ?? 'day-a',
    sets: Array.from({ length: options.sets ?? 1 }, (_, index) => ({
      id: `${exerciseId}-${date}-${index}`,
      weight,
      reps: options.reps ?? 1,
      ...(options.rir !== undefined ? { rir: options.rir } : {}),
    })),
  }
}

function insights(entries: ProgressEntry[], options: {
  block?: TrainingBlock
  exercises?: Exercise[]
  today?: string
} = {}) {
  const block = options.block ?? makeBlock()
  const exercises = options.exercises ?? [squat]
  return calculateProgressInsights(entries, [block], exercises, block, options.today ?? '2026-02-15', 'block')
}

describe('approved progress insight thresholds', () => {
  it('uses a strict ±2% trend band and averages the first and last two sessions', () => {
    const improving = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 100),
      makeEntry('2026-01-19', 103),
      makeEntry('2026-01-26', 103),
    ], { today: '2026-01-26' })
    expect(improving.lifts[0]?.trend).toBe('improving')
    expect(improving.lifts[0]?.changePercent).toBeCloseTo(3)

    const flat = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 102),
      makeEntry('2026-01-19', 101),
      makeEntry('2026-01-26', 103),
    ], { today: '2026-01-26' })
    expect(flat.lifts[0]?.changePercent).toBeCloseTo(100 * (102 / 101 - 1))
    expect(flat.lifts[0]?.trend).toBe('flat')

    const exactlyAtBoundary = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 100),
      makeEntry('2026-01-19', 97.9),
      makeEntry('2026-01-26', 98.1),
    ], { today: '2026-01-26' })
    expect(exactlyAtBoundary.lifts[0]?.changePercent).toBeCloseTo(-2)
    expect(exactlyAtBoundary.lifts[0]?.trend).toBe('flat')
  })

  it('requires four non-deload sessions spanning at least fourteen days', () => {
    const threeSessions = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 104),
      makeEntry('2026-01-19', 106),
    ], { today: '2026-01-19' })
    expect(threeSessions.lifts[0]?.trend).toBe('not-enough-data')

    const tenDaySpan = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-08', 100),
      makeEntry('2026-01-11', 103),
      makeEntry('2026-01-15', 103),
    ], { today: '2026-01-15' })
    expect(tenDaySpan.lifts[0]?.trend).toBe('not-enough-data')
  })

  it('ignores the block week-six deload in trend calculations', () => {
    const result = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 100),
      makeEntry('2026-02-09', 80),
      makeEntry('2026-02-16', 103),
      makeEntry('2026-02-23', 103),
    ], { today: '2026-02-23' })
    expect(result.lifts[0]).toMatchObject({ sessions: 4, trend: 'improving' })
  })

  it('flags four non-deload sessions and 21 days since the strict best', () => {
    const eligible = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 98),
      makeEntry('2026-01-19', 99),
      makeEntry('2026-01-26', 97),
      makeEntry('2026-02-02', 100),
    ], { today: '2026-02-02' })
    expect(eligible.noNewBest).toHaveLength(1)
    expect(eligible.noNewBest[0]).toMatchObject({
      exerciseId: 'squat',
      sessionsSince: 4,
      bestDate: '2026-01-05',
    })
    expect(eligible.noNewBest[0].bestValue).toBeCloseTo(100 * (1 + 1 / 30))

    const tooFewSessions = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 98),
      makeEntry('2026-01-19', 99),
      makeEntry('2026-01-26', 97),
    ], { today: '2026-01-26' })
    expect(tooFewSessions.noNewBest).toEqual([])

    const tooFewDays = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-09', 98),
      makeEntry('2026-01-13', 99),
      makeEntry('2026-01-17', 97),
      makeEntry('2026-01-21', 98),
    ], { today: '2026-01-21' })
    expect(tooFewDays.noNewBest).toEqual([])

    const newerBest = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 98),
      makeEntry('2026-01-19', 99),
      makeEntry('2026-01-26', 97),
      makeEntry('2026-02-02', 101),
    ], { today: '2026-02-02' })
    expect(newerBest.noNewBest).toEqual([])
  })

  it('selects compound main lifts and uses the isolation fallback only when fewer than two qualify', () => {
    const exercises: Exercise[] = [
      squat,
      { id: 'press', name: 'Press', primaryMuscle: 'Chest', mechanic: 'compound', movementPattern: 'push horizontal', equipment: 'barbell' },
      { id: 'curl', name: 'Curl', primaryMuscle: 'Biceps', mechanic: 'isolation', movementPattern: 'isolation', equipment: 'dumbbell' },
      { id: 'bodyweight', name: 'Bodyweight squat', primaryMuscle: 'Quads', mechanic: 'compound', movementPattern: 'squat', equipment: 'bodyweight' },
      { id: 'hinge-short', name: 'Hinge', primaryMuscle: 'Hamstrings', mechanic: 'compound', movementPattern: 'hinge', equipment: 'barbell' },
    ]
    const block = makeBlock(exercises.map((exercise) => exercise.id))
    const addHistory = (id: string, count: number, load = 50) => Array.from({ length: count }, (_, index) => {
      const date = new Date(Date.UTC(2026, 0, 5 + index * 7)).toISOString().slice(0, 10)
      return makeEntry(date, id === 'bodyweight' ? 0 : load, {
        exerciseId: id,
        blockId: block.id,
      })
    })
    const result = insights([
      ...addHistory('squat', 4),
      ...addHistory('press', 4),
      ...addHistory('curl', 5),
      ...addHistory('bodyweight', 6),
      ...addHistory('hinge-short', 2),
    ], { block, exercises, today: '2026-02-10' })
    expect(result.lifts.map((lift) => lift.exerciseId)).toEqual(['press', 'squat'])

    const fallbackExercises = [squat, exercises[2], { ...exercises[2], id: 'triceps', primaryMuscle: 'Triceps' }]
    const fallbackBlock = makeBlock(fallbackExercises.map((exercise) => exercise.id))
    const fallback = insights([
      ...addHistory('squat', 4),
      ...addHistory('curl', 4),
      ...addHistory('triceps', 4),
    ], {
      block: fallbackBlock,
      exercises: fallbackExercises,
      today: '2026-02-10',
    })
    expect(fallback.lifts.map((lift) => lift.exerciseId)).toEqual(['curl', 'squat', 'triceps'])
  })

  it('classifies movement patterns and isolation muscles for push/pull and upper/lower', () => {
    const classified = (exercise: Exercise) => classifyMovementPattern(exercise)
    expect(classified({ id: 'a', name: 'A', primaryMuscle: 'Chest', movementPattern: 'push vertical' })).toEqual({ group: 'push', region: 'upper' })
    expect(classified({ id: 'b', name: 'B', primaryMuscle: 'Biceps', movementPattern: 'isolation' })).toEqual({ group: 'pull', region: 'upper' })
    expect(classified({ id: 'c', name: 'C', primaryMuscle: 'Side Delts', movementPattern: 'isolation' })).toEqual({ group: 'push', region: 'upper' })
    expect(classified({ id: 'd', name: 'D', primaryMuscle: 'Glutes', movementPattern: 'hinge' })).toEqual({ group: 'legs', region: 'lower' })
    expect(classified({ id: 'e', name: 'E', primaryMuscle: 'Hamstrings', movementPattern: 'isolation' })).toEqual({ group: 'legs', region: 'lower' })
    expect(classified({ id: 'f', name: 'F', primaryMuscle: 'Abs', movementPattern: 'core' })).toEqual({ group: 'core', region: 'core' })
    expect(classified({ id: 'g', name: 'G', primaryMuscle: 'Quads', movementPattern: 'carry' })).toEqual({ group: 'legs', region: 'lower' })
  })

  it('shows a push/pull note only beyond the two-to-one ratio and twenty classified sets', () => {
    const push: Exercise = { id: 'push', name: 'Push', primaryMuscle: 'Chest', movementPattern: 'push horizontal' }
    const pull: Exercise = { id: 'pull', name: 'Pull', primaryMuscle: 'Back', movementPattern: 'pull horizontal' }
    const block = makeBlock([])
    const makeCounts = (pushCount: number, pullCount: number) => calculateProgressInsights([
      makeEntry('2026-01-20', 40, { exerciseId: 'push', sets: pushCount, blockId: block.id }),
      makeEntry('2026-01-21', 40, { exerciseId: 'pull', sets: pullCount, blockId: block.id }),
    ], [block], [push, pull], block, '2026-01-30', '4weeks').pushPull
    expect(makeCounts(40, 38).note).toBeNull()
    expect(makeCounts(45, 20).note).toBe('push-dominant')
    expect(makeCounts(20, 10).note).toBeNull()
    expect(makeCounts(12, 4).note).toBeNull()
  })

  it('gates the RIR comparison on at least 30% coverage and a one-RIR change', () => {
    const enoughCoverage = insights([
      makeEntry('2026-01-05', 50, { rir: 2.5 }),
      makeEntry('2026-01-26', 50, { rir: 1.4 }),
    ], { today: '2026-01-26' })
    expect(enoughCoverage.rirChange).toBeCloseTo(-1.1)

    const lowCoverage = insights([
      makeEntry('2026-01-05', 50, { rir: 3 }),
      ...Array.from({ length: 4 }, (_, index) => makeEntry('2026-01-26', 50, {
        rir: index === 0 ? 1 : undefined,
        exerciseId: index === 0 ? 'squat' : `other-${index}`,
      })),
    ], { today: '2026-01-26' })
    expect(lowCoverage.rirChange).toBeNull()

    const smallChange = insights([
      makeEntry('2026-01-05', 50, { rir: 2 }),
      makeEntry('2026-01-26', 50, { rir: 2.6 }),
    ], { today: '2026-01-26' })
    expect(smallChange.rirChange).toBeNull()
  })

  it('selects the most improved lift by change, session count, then exercise id', () => {
    const exercises = [squat, { ...squat, id: 'press', name: 'Press', movementPattern: 'push horizontal' }]
    const block = makeBlock(exercises.map((exercise) => exercise.id))
    const entries = [
      ...[100, 100, 105, 105].map((weight, index) => makeEntry(`2026-01-${String(5 + index * 7).padStart(2, '0')}`, weight, { exerciseId: 'squat' })),
      ...[100, 100, 105, 105, 105].map((weight, index) => makeEntry(`2026-01-${String(5 + index * 7).padStart(2, '0')}`, weight, { exerciseId: 'press' })),
    ]
    const result = insights(entries, { block, exercises, today: '2026-02-10' })
    expect(result.mostImproved?.exerciseId).toBe('press')
    expect(result.mostImproved?.changePercent).toBeCloseTo(5)
  })

  it('exposes the approved 10–20 common range, ignores empty history, and handles one session', () => {
    expect(PROGRESS_THRESHOLDS.commonRangeMinimumSets).toBe(10)
    expect(PROGRESS_THRESHOLDS.commonRangeMaximumSets).toBe(20)
    expect(insights([]).lifts).toEqual([])
    expect(insights([makeEntry('2026-01-05', 50)], { today: '2026-01-05' }).lifts).toEqual([])
  })
})
