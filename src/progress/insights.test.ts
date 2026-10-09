import { describe, expect, it } from 'vitest'
import { Exercise, TrainingBlock } from '../types'
import { calculateProgressInsights, classifyMovementPattern, mostFrequentWeekdays, PROGRESS_THRESHOLDS } from './insights'
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

    const declining = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 100),
      makeEntry('2026-01-19', 98),
      makeEntry('2026-01-26', 97),
    ], { today: '2026-01-26' })
    expect(declining.lifts[0]?.trend).toBe('declining')

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
      makeEntry('2026-02-02', 103),
      makeEntry('2026-02-06', 103),
    ], { today: '2026-02-10' })
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

    const deloadDoesNotCount = insights([
      makeEntry('2026-01-05', 100),
      makeEntry('2026-01-12', 98),
      makeEntry('2026-01-19', 99),
      makeEntry('2026-01-26', 97),
      makeEntry('2026-02-09', 80),
    ], { today: '2026-02-15' })
    expect(deloadDoesNotCount.noNewBest).toEqual([])
  })

  it('selects compound main lifts and uses the isolation fallback only when fewer than two qualify', () => {
    const exercises: Exercise[] = [
      squat,
      { id: 'press', name: 'Press', primaryMuscle: 'Chest', mechanic: 'compound', movementPattern: 'push horizontal', equipment: 'barbell' },
      { id: 'curl', name: 'Curl', primaryMuscle: 'Biceps', mechanic: 'isolation', movementPattern: 'isolation', equipment: 'dumbbell' },
      { id: 'bodyweight', name: 'Bodyweight squat', primaryMuscle: 'Quads', mechanic: 'compound', movementPattern: 'squat', equipment: 'bodyweight' },
      { id: 'hinge-short', name: 'Hinge', primaryMuscle: 'Hamstrings', mechanic: 'compound', movementPattern: 'hinge', equipment: 'barbell' },
      { id: 'unplanned', name: 'Unplanned row', primaryMuscle: 'Lats', mechanic: 'compound', movementPattern: 'pull horizontal', equipment: 'barbell' },
    ]
    const block = makeBlock(exercises.filter((exercise) => exercise.id !== 'unplanned').map((exercise) => exercise.id))
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
      ...addHistory('unplanned', 4),
    ], { block, exercises, today: '2026-02-10' })
    expect(result.lifts.map((lift) => lift.exerciseId)).toEqual(['press', 'squat', 'unplanned'])

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
    expect(classified({ id: 'g', name: 'G', primaryMuscle: 'Quads', movementPattern: 'carry' })).toEqual({ group: 'other', region: 'lower' })
  })

  it('counts a week with one session toward the streak and reuses weekly adherence', () => {
    const block = makeBlock()
    const result = insights([
      makeEntry('2026-01-05', 50),
      makeEntry('2026-01-08', 50, { exerciseId: 'press' }),
      makeEntry('2026-01-12', 50),
    ], { block, exercises: [squat, { ...squat, id: 'press', movementPattern: 'push horizontal' }], today: '2026-01-12' })
    expect(result.sessionsDone).toBe(3)
    expect(result.sessionsPlanned).toBe(2)
    expect(result.streakWeeks).toBe(2)
  })

  it('keeps the streak when the current week has no session and breaks it at a missing week', () => {
    const block = makeBlock()
    const result = insights([
      makeEntry('2026-01-05', 50),
      makeEntry('2026-01-12', 50),
      makeEntry('2026-01-19', 50),
    ], { block, today: '2026-01-28' })
    expect(result.streakWeeks).toBe(3)

    const withGap = insights([
      makeEntry('2026-01-05', 50),
      makeEntry('2026-01-19', 50),
    ], { block, today: '2026-01-28' })
    expect(withGap.streakWeeks).toBe(1)
  })

  it('selects and charts main lifts only from the selected range, including unplanned lifts', () => {
    const block = makeBlock()
    const row: Exercise = { id: 'row', name: 'Row', primaryMuscle: 'Lats', mechanic: 'compound', movementPattern: 'pull horizontal' }
    const result = calculateProgressInsights([
      makeEntry('2026-01-05', 50, { exerciseId: 'row' }),
      makeEntry('2026-01-12', 50, { exerciseId: 'row' }),
      makeEntry('2026-01-19', 50, { exerciseId: 'row' }),
      makeEntry('2026-01-26', 52, { exerciseId: 'row' }),
      makeEntry('2026-02-02', 54, { exerciseId: 'row' }),
      makeEntry('2026-02-09', 56, { exerciseId: 'row' }),
      makeEntry('2026-02-16', 58, { exerciseId: 'row' }),
    ], [block], [row], block, '2026-02-15', '4weeks')
    expect(result.lifts.map((lift) => lift.exerciseId)).toEqual(['row'])
    expect(result.lifts[0]).toMatchObject({ sessions: 3 })
    expect(result.lifts[0].points.map((point) => point.date)).toEqual([
      '2026-01-19', '2026-01-26', '2026-02-02', '2026-02-09',
    ])
  })

  it('keeps a completed block range within its dates and plans all of its weeks', () => {
    const block = makeBlock()
    const result = insights([
      makeEntry('2026-01-05', 50),
      makeEntry('2026-02-09', 50),
      makeEntry('2026-02-16', 50),
    ], { block, today: '2026-02-20' })
    expect(result.rangeEnd).toBe('2026-02-15')
    expect(result.sessionsDone).toBe(2)
    expect(result.sessionsPlanned).toBe(6)
    expect(result.activeBlockWeek).toBe(6)
  })

  it('marks strict all-history e1RM bests and counts rep PRs only at the same load', () => {
    const result = insights([
      makeEntry('2026-01-05', 50, { reps: 8 }),
      makeEntry('2026-01-12', 50, { reps: 10 }),
      makeEntry('2026-01-19', 50, { reps: 12 }),
      makeEntry('2026-01-26', 45, { reps: 12 }),
    ], { today: '2026-01-26' })
    expect(result.lifts[0]?.points.map((point) => point.isBestEver)).toEqual([true, true, true, false])
    expect(result.repPrs).toEqual([
      { exerciseId: 'squat', date: '2026-01-12', weight: 50, reps: 10, previousBest: 8 },
      { exerciseId: 'squat', date: '2026-01-19', weight: 50, reps: 12, previousBest: 10 },
    ])
  })

  it('counts personal-record badges occurring inside the selected range', () => {
    const result = insights([
      makeEntry('2026-01-05', 50, { reps: 8 }),
      makeEntry('2026-01-12', 50, { reps: 8 }),
      makeEntry('2026-01-19', 50, { reps: 8 }),
      makeEntry('2026-01-26', 50, { reps: 8 }),
      makeEntry('2026-02-02', 55, { reps: 8 }),
    ], { today: '2026-02-02' })
    expect(result.prCount).toBe(1)
    expect(result.recentRecordsCount).toBe(1)
    expect(result.records[result.records.length - 1]).toMatchObject({ date: '2026-02-02', badges: ['e1rm', 'weight', 'reps'] })
  })

  it('counts PR sessions in the selected range rather than counting their badge types', () => {
    const entries = [
      ...['2025-12-01', '2025-12-08', '2025-12-15', '2025-12-22'].map((date) => makeEntry(date, 50)),
      ...['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26', '2026-02-02'].map((date, index) =>
        makeEntry(date, 51 + index)
      ),
    ]
    const block = makeBlock(['squat'], '2026-01-05')
    const forRange = (range: 'block' | '4weeks') =>
      calculateProgressInsights(entries, [block], [squat], block, '2026-02-02', range)
    expect(forRange('block').prCount).toBe(5)
    expect(forRange('4weeks').prCount).toBe(4)
  })

  it('compares block tonnage and mean top-set loads through the same block week', () => {
    const previous = makeBlock(['squat'], '2026-01-05')
    const current = { ...makeBlock(['squat'], '2026-02-16'), id: 'block-2', number: 2 }
    const currentEntries = [0, 1, 2, 3].map((index) => {
      const date = new Date(Date.UTC(2026, 1, 16 + index * 7)).toISOString().slice(0, 10)
      return makeEntry(date, 60, { blockId: current.id })
    })
    const result = calculateProgressInsights([
      makeEntry('2026-01-05', 50, { blockId: previous.id }),
      makeEntry('2026-01-12', 50, { blockId: previous.id }),
      ...currentEntries,
    ], [previous, current], [squat], current, '2026-03-09', 'block')
    expect(result.currentTonnage).toBe(240)
    expect(result.previousTonnage).toBe(100)
    expect(result.averageTopSetLoadChange).toBeCloseTo(20)
    expect(result.topSetLoads).toHaveLength(1)
  })

  it('aggregates working-set tonnage per distinct session and includes drops', () => {
    const block = makeBlock([])
    const setEntry: ProgressEntry = {
      ...makeEntry('2026-01-05', 50, { exerciseId: 'press', blockId: block.id }),
      sets: [
        { id: 'warmup', weight: 10, reps: 10 },
        { id: 'work', weight: 50, reps: 2, drop: { weight: 30, reps: 2 } },
      ],
    }
    const secondEntry = makeEntry('2026-01-05', 20, { exerciseId: 'row', reps: 5, blockId: block.id })
    const nextWeek = makeEntry('2026-01-12', 50, { exerciseId: 'press', reps: 2, blockId: block.id })
    const result = insights([setEntry, secondEntry, nextWeek], {
      block,
      exercises: [],
      today: '2026-01-12',
    })
    expect(result.weeklyVolume.find((week) => week.weekStart === '2026-01-05')).toMatchObject({
      total: 260,
      sessionCount: 1,
      perSession: 260,
    })
    expect(result.volumePerSessionChange).toBeCloseTo(-61.53846)
  })

  it('compares the last complete muscle week with the previous three complete weeks', () => {
    const glutes: Exercise = { id: 'glutes', name: 'Glutes', primaryMuscle: 'Glutes', mechanic: 'isolation', movementPattern: 'isolation' }
    const hamstrings: Exercise = { id: 'hamstrings', name: 'Hamstrings', primaryMuscle: 'Hamstrings', secondaryMuscles: ['Glutes'], mechanic: 'isolation', movementPattern: 'isolation' }
    const block = makeBlock(['glutes'])
    const result = calculateProgressInsights([
      makeEntry('2026-01-05', 40, { exerciseId: 'glutes', sets: 9 }),
      makeEntry('2026-01-19', 40, { exerciseId: 'glutes', sets: 12 }),
      makeEntry('2026-01-26', 40, { exerciseId: 'hamstrings', sets: 4 }),
      makeEntry('2026-01-26', 40, { exerciseId: 'glutes', sets: 30 }),
    ], [block], [glutes, hamstrings], block, '2026-01-26', 'block')
    expect(result.weeklyMuscles.find((muscle) => muscle.muscleGroup === 'Glutes')).toMatchObject({
      thisWeek: 12,
      previousThreeWeekAverage: 3,
      commonRange: true,
    })
    expect(result.weeklyMuscles.find((muscle) => muscle.muscleGroup === 'Hamstrings')?.commonRange).toBe(false)
  })

  it('shows the 10–20 common-range band as a reference without verdicts', () => {
    const glutes: Exercise = { id: 'glutes', name: 'Glutes', primaryMuscle: 'Glutes', mechanic: 'isolation', movementPattern: 'isolation' }
    const block = makeBlock(['glutes'])
    const forSets = (count: number) => calculateProgressInsights([
      makeEntry('2026-01-19', 40, { exerciseId: 'glutes', sets: count, blockId: block.id }),
    ], [block], [glutes], block, '2026-01-26', 'block').weeklyMuscles.find((muscle) => muscle.muscleGroup === 'Glutes')
    expect(forSets(12)).toMatchObject({ thisWeek: 12, commonRange: true })
    expect(forSets(6)).toMatchObject({ thisWeek: 6, commonRange: true })
    expect(forSets(22)).toMatchObject({ thisWeek: 22, commonRange: true })
  })

  it('counts block-week sessions by date and day key, weekday frequency, and upper/lower sets', () => {
    const push: Exercise = { id: 'push', name: 'Push', primaryMuscle: 'Chest', movementPattern: 'push vertical' }
    const legs: Exercise = { id: 'legs', name: 'Legs', primaryMuscle: 'Quads', movementPattern: 'squat' }
    const core: Exercise = { id: 'core', name: 'Core', primaryMuscle: 'Abs', movementPattern: 'core' }
    const block = makeBlock([])
    const result = calculateProgressInsights([
      makeEntry('2026-01-05', 40, { exerciseId: 'push', sets: 2, dayKey: 'a' }),
      makeEntry('2026-01-05', 40, { exerciseId: 'legs', sets: 3, dayKey: 'a' }),
      makeEntry('2026-01-06', 40, { exerciseId: 'core', sets: 4, dayKey: 'b' }),
      makeEntry('2026-01-12', 40, { exerciseId: 'legs', dayKey: 'a' }),
    ], [block], [push, legs, core], block, '2026-01-12', 'block')
    expect(result.sessionsPerBlockWeek).toEqual([
      { week: 1, done: 2, planned: 1 },
      { week: 2, done: 1, planned: 1 },
    ])
    expect(result.weekdayCounts[1].sessions).toBe(2)
    expect(result.weekdayCounts[2].sessions).toBe(1)
    expect(result.upperLower).toEqual({ upper: 2, lower: 4, total: 6 })
  })

  it('returns every weekday tied for the highest frequency and none when history is empty', () => {
    expect(mostFrequentWeekdays([
      { weekday: 0, sessions: 10 },
      { weekday: 1, sessions: 8 },
      { weekday: 2, sessions: 10 },
      { weekday: 3, sessions: 4 },
      { weekday: 4, sessions: 10 },
    ])).toEqual([
      { weekday: 0, sessions: 10 },
      { weekday: 2, sessions: 10 },
      { weekday: 4, sessions: 10 },
    ])
    expect(mostFrequentWeekdays([
      { weekday: 0, sessions: 0 },
      { weekday: 1, sessions: 0 },
    ])).toEqual([])
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
    expect(makeCounts(20, 45).note).toBe('pull-dominant')
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

    const furtherFromFailure = insights([
      makeEntry('2026-01-05', 50, { rir: 1 }),
      makeEntry('2026-01-26', 50, { rir: 2.5 }),
    ], { today: '2026-01-26' })
    expect(furtherFromFailure.rirChange).toBeCloseTo(1.5)
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

  it('applies the approved most-improved eligibility, ranking, and alphabetical tie-break', () => {
    const a: Exercise = { ...squat, id: 'a-lift' }
    const b: Exercise = { ...squat, id: 'b-lift', movementPattern: 'hinge' }
    const block = makeBlock(['a-lift', 'b-lift'])
    const entriesFor = (id: string, values: number[]) => values.map((weight, index) =>
      makeEntry(new Date(Date.UTC(2026, 0, 5 + index * 7)).toISOString().slice(0, 10), weight, { exerciseId: id, blockId: block.id })
    )
    const compare = (left: number[], right: number[]) => calculateProgressInsights([
      ...entriesFor('a-lift', left),
      ...entriesFor('b-lift', right),
    ], [block], [a, b], block, '2026-02-10', 'block')

    expect(compare([100, 100, 106, 106], [100, 100, 104, 104, 104]).mostImproved?.exerciseId).toBe('a-lift')
    expect(compare([100, 100, 110], [100, 100, 103, 103]).mostImproved?.exerciseId).toBe('b-lift')
    expect(compare([100, 100, 101, 101], [100, 100, 102, 102]).mostImproved).toBeNull()
    expect(compare([100, 100, 105, 105], [100, 100, 105, 105]).mostImproved?.exerciseId).toBe('a-lift')
  })

  it('exposes the approved 10–20 common range, ignores empty history, and handles one session', () => {
    expect(PROGRESS_THRESHOLDS.commonRangeMinimumSets).toBe(10)
    expect(PROGRESS_THRESHOLDS.commonRangeMaximumSets).toBe(20)
    expect(insights([]).lifts).toEqual([])
    expect(insights([makeEntry('2026-01-05', 50)], { today: '2026-01-05' }).lifts).toEqual([])
  })
})
