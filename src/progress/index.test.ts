import { describe, expect, it } from 'vitest'
import blockRows from '../../docs/fitness/approved/training-blocks/blocks.json'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { generateDemoHistory } from '../demo/generateDemoHistory'
import { createTranslator } from '../i18n/translate'
import { TrainingBlock, Exercise } from '../types'
import {
  adherence,
  bestSetE1RM,
  blockReports,
  dayTypeForEntry,
  epleyOneRepMax,
  getWorkingSets,
  personalRecords,
  progressSuggestions,
  suggestionSourceBlock,
  strengthTrend,
  weeklySets,
} from './index'
import { ProgressEntry } from './types'
import { entriesWithinBlock, startOfWeek } from './utils'
import { defaultActiveBlock, nextUnloggedDay } from '../utils/trainingBlocks'
import { formatShortDate } from '../i18n/format'

describe('tagged workout sets', () => {
  it('keeps mini-set and partial volume but excludes them from records and e1RM', () => {
    const mainSet = { id: 'main', reps: 8, weight: 40 }
    const entries: ProgressEntry[] = ['2026-09-28', '2026-10-01', '2026-10-04', '2026-10-07'].map((date, index) => ({
      id: `entry-${index}`,
      exerciseId: 'bench',
      date,
      sets: [
        mainSet,
        ...(index === 3
          ? [
              { id: 'mini', reps: 30, weight: 40, tag: 'mini' as const },
              { id: 'partial', reps: 20, weight: 100, tag: 'partial' as const },
            ]
          : []),
      ],
    }))
    const latestSets = entries[3].sets

    expect(getWorkingSets(latestSets)).toEqual([mainSet])
    expect(bestSetE1RM(latestSets)).toBeCloseTo(40 * (1 + 8 / 30))
    const records = personalRecords(entries, [])
    const points = strengthTrend(entries, [], 'bench', '2026-10-08', 'all').points
    expect(records[records.length - 1]?.badges).toEqual([])
    expect(points[points.length - 1]?.volume)
      .toBe(8 * 40 + 30 * 40 + 20 * 100)
  })
})

const approvedBlocks = (blockRows as unknown as Array<{
  id: string
  number: number
  name: string
  method: string
  start_date: string
  weeks: number
  origin: TrainingBlock['origin']
  summary: string
  insights: TrainingBlock['insights']
  days: Array<{
    key: string
    name: string
    focus?: string
    exercises: Array<{
      code: string
      position: number
      exercise_id: string
      sets: number
      reps: string[]
      rest_seconds: number
      technique: TrainingBlock['days'][number]['exercises'][number]['technique']
      notes?: string
    }>
  }>
}>).map((block) => ({
  id: block.id,
  number: block.number,
  name: block.name,
  method: block.method,
  startDate: block.start_date,
  weeks: block.weeks,
  origin: block.origin,
  summary: block.summary,
  insights: block.insights,
  days: block.days.map((day, dayIndex) => ({
    key: day.key,
    position: dayIndex + 1,
    name: day.name,
    focus: day.focus,
    exercises: day.exercises.map((exercise, exerciseIndex) => ({
      code: exercise.code,
      position: exercise.position ?? exerciseIndex + 1,
      exerciseId: exercise.exercise_id,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.rest_seconds,
      technique: exercise.technique,
      notes: exercise.notes,
    })),
  })),
}))
const dumbbellExercise: Exercise = {
  id: 'press',
  name: 'Dumbbell Press',
  nameEs: 'Press con mancuernas',
  primaryMuscle: 'Chest',
  equipment: 'dumbbell',
}

const en = { language: 'en' as const, t: createTranslator('en') }
const es = { language: 'es' as const, t: createTranslator('es') }

function makeBlock(
  exercises: TrainingBlock['days'][number]['exercises'] = [],
  startDate = '2026-01-05'
): TrainingBlock {
  const dayKeys = ['chest-back-a', 'arms-a', 'lower-body-a', 'chest-back-b', 'arms-b', 'lower-body-b']
  return {
    id: 'block-1',
    number: 1,
    name: 'Test block',
    method: 'flat',
    startDate,
    weeks: 6,
    origin: 'coach',
    summary: '',
    insights: [],
    days: dayKeys.map((key, index) => ({
      key,
      position: index + 1,
      name: key,
      exercises,
    })),
  }
}

function makeEntry(
  exerciseId: string,
  date: string,
  weightsAndReps: Array<[number, number, ProgressEntry['sets'][number]['drop']?]>,
  extras: Partial<Pick<ProgressEntry, 'blockId' | 'dayKey'>> = {}
): ProgressEntry {
  return {
    id: `${exerciseId}-${date}`,
    exerciseId,
    date,
    ...extras,
    sets: weightsAndReps.map(([weight, reps, drop], index) => ({
      id: `${exerciseId}-${date}-${index}`,
      weight,
      reps,
      ...(drop ? { drop } : {}),
    })),
  }
}

describe('progress calculations', () => {
  it('computes Epley e1RM, caps eligible sets at 12 reps, and ignores drop parts', () => {
    expect(epleyOneRepMax(60, 1)).toBe(60)
    expect(bestSetE1RM([
      { id: 'warmup', weight: 20, reps: 12 },
      { id: 'main', weight: 50, reps: 10, drop: { weight: 35, reps: 15 } },
      { id: 'high-rep', weight: 100, reps: 13 },
    ])).toBeCloseTo(50 * (1 + 10 / 30))
    expect(bestSetE1RM([{ id: 'high-rep', weight: 50, reps: 13 }])).toBeNull()
  })

  it('selects the best e1RM from ascending and reverse pyramids regardless of set order', () => {
    const ascending = [
      { id: '1', weight: 20, reps: 12 },
      { id: '2', weight: 25, reps: 10 },
      { id: '3', weight: 30, reps: 8 },
    ]
    expect(bestSetE1RM(ascending)).toBeCloseTo(38)
    expect(bestSetE1RM([...ascending].reverse())).toBeCloseTo(38)
  })

  it('uses explicit A/B tags then block date weekdays, returning null outside known dates', () => {
    const block = makeBlock()
    expect(dayTypeForEntry({ date: '2026-01-06', dayKey: 'arms-b' }, [block])).toBe('B')
    expect(dayTypeForEntry({ date: '2026-01-05' }, [block])).toBe('A')
    expect(dayTypeForEntry({ date: '2026-01-08' }, [block])).toBe('B')
    expect(dayTypeForEntry({ date: '2026-01-11' }, [block])).toBeNull()
    expect(dayTypeForEntry({ date: '2026-03-01' }, [block])).toBeNull()
  })

  it('filters strength trend by A/B and starts a fresh comparison at a block boundary', () => {
    const firstBlock = makeBlock([], '2026-01-05')
    const secondBlock = { ...makeBlock([], '2026-02-16'), id: 'block-2', number: 2 }
    const entries = [
      makeEntry('press', '2026-01-05', [[100, 8]], { blockId: firstBlock.id, dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-16', [[40, 8]], { blockId: secondBlock.id, dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-23', [[42, 8]], { blockId: secondBlock.id, dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-24', [[60, 8]], { blockId: secondBlock.id, dayKey: 'chest-back-b' }),
      makeEntry('press', '2026-03-02', [[44, 8]], { blockId: secondBlock.id, dayKey: 'chest-back-a' }),
    ]
    const aTrend = strengthTrend(entries, [firstBlock, secondBlock], 'press', '2026-03-02', 'A', [dumbbellExercise], en)
    const allTrend = strengthTrend(entries, [firstBlock, secondBlock], 'press', '2026-03-02', 'all', [dumbbellExercise], en)
    expect(aTrend.points).toHaveLength(4)
    expect(allTrend.points).toHaveLength(5)
    expect(aTrend.points[2].e1rm).toBeCloseTo(53.2)
    expect(aTrend.points[2]).toMatchObject({
      sets: [{ weight: 42, reps: 8 }],
      bestSetIndex: 0,
      volume: 336,
    })
    expect(aTrend.takeaway).toContain('Dumbbell Press: est. 1RM +')
    expect(aTrend.takeaway).not.toContain('-')
    expect(aTrend.isTrendAvailable).toBe(true)
  })

  it('includes all per-set and drop-set volume while highlighting the e1RM-best set', () => {
    const block = makeBlock()
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8], [50, 6], [20, 16]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[30, 10, { weight: 20, reps: 5 }]], { dayKey: 'chest-back-a' }),
    ]

    const trend = strengthTrend(entries, [block], 'press', '2026-01-12', 'all', [dumbbellExercise], en)

    expect(trend.points[0]).toMatchObject({
      e1rm: 60,
      bestSetIndex: 1,
      volume: 940,
    })
    expect(trend.points[0].sets).toHaveLength(3)
    expect(trend.points[1]).toMatchObject({
      volume: 400,
      sets: [{ weight: 30, reps: 10, drop: { weight: 20, reps: 5 } }],
    })
  })

  it('shows the latest available block trend when the current block has no sessions for the lift', () => {
    const firstBlock = makeBlock([], '2026-01-05')
    const secondBlock = { ...makeBlock([], '2026-02-16'), id: 'block-2', number: 2 }
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { blockId: firstBlock.id, dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[44, 8]], { blockId: firstBlock.id, dayKey: 'chest-back-a' }),
    ]

    const trend = strengthTrend(entries, [firstBlock, secondBlock], 'press', '2026-02-23', 'A', [dumbbellExercise], en)

    expect(trend.takeaway).toBe('Dumbbell Press: Not in Block 2 · last trend +10% in Block 1.')
  })

  it('makes the first session a baseline and flags a likely weight typo', () => {
    const block = makeBlock()
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-19', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-26', [[100, 8]], { dayKey: 'chest-back-a' }),
    ]
    const result = personalRecords(entries, [block])
    expect(result[0].badges).toEqual([])
    expect(result[3].likelyTypoSetIds).toHaveLength(1)
    expect(result[3].badges).not.toContain('weight')
  })

  it('tracks bodyweight rep records without calculating e1RM', () => {
    const entries = [10, 11, 12, 13].map((reps, index) =>
      makeEntry('pull-up', `2026-01-${String(5 + index * 7).padStart(2, '0')}`, [[0, reps]])
    )
    const records = personalRecords(entries, [makeBlock()])
    expect(records[0].badges).toEqual([])
    expect(records[3].badges).toContain('reps')
    expect(records[3].badges).not.toContain('e1rm')
  })

  it('returns e1RM, weight, and rep PR badges after three earlier sessions', () => {
    const block = makeBlock()
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-19', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-26', [[42, 10]], { dayKey: 'chest-back-a' }),
    ]
    expect(personalRecords(entries, [block])[3].badges).toEqual(['e1rm', 'weight', 'reps'])
  })

  it('suggests equipment-sized load increases and replaces broad plateaus with fatigue', () => {
    const planned = ['press', 'row', 'curl'].map((exerciseId, index) => ({
      code: `A${index + 1}`,
      position: index + 1,
      exerciseId,
      sets: exerciseId === 'press' ? 2 : 1,
      reps: exerciseId === 'press' ? ['8', '8'] : ['8'],
      restSeconds: 90,
      technique: 'straight' as const,
    }))
    const block = makeBlock(planned)
    const ready = [
      makeEntry('press', '2026-01-05', [[20, 8], [20, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-06', [[20, 8], [20, 8]], { dayKey: 'chest-back-b' }),
    ]
    const readySuggestions = progressSuggestions(ready, [block], [dumbbellExercise], '2026-01-06', en)
    expect(readySuggestions).toHaveLength(1)
    expect(readySuggestions[0]).toMatchObject({
      type: 'add-weight',
      message: 'Dumbbell Press: next B day, aim for 22 kg × 8 reps.',
      why: 'Last time you reached the top of the 8-rep target at 20 kg, so I moved the load up.',
    })
    const lowerBodySuggestion = progressSuggestions(
      [makeEntry('leg-press', '2026-01-05', [[80, 8]], { dayKey: 'lower-body-a' })],
      [makeBlock([{
        code: 'A1',
        position: 1,
        exerciseId: 'leg-press',
        sets: 1,
        reps: ['8'],
        restSeconds: 90,
        technique: 'straight',
      }])],
      [{ ...dumbbellExercise, id: 'leg-press', name: 'Leg Press', bodyRegion: 'Legs', equipment: 'machine' }],
      '2026-01-06',
      en
    )
    expect(lowerBodySuggestion[0]).toMatchObject({
      type: 'add-weight',
      message: 'Leg Press: next A day, aim for 82.5 kg × 8 reps.',
    })

    const stalledEntries: ProgressEntry[] = []
    for (const exerciseId of ['press', 'row', 'curl']) {
      for (const date of ['2026-01-05', '2026-01-19', '2026-01-26', '2026-02-02']) {
        stalledEntries.push(makeEntry(exerciseId, date, [[20, 6]], { dayKey: 'chest-back-a' }))
      }
    }
    const fatigue = progressSuggestions(
      stalledEntries,
      [block],
      [dumbbellExercise, { ...dumbbellExercise, id: 'row' }, { ...dumbbellExercise, id: 'curl' }],
      '2026-02-02',
      en
    )
    expect(fatigue.filter((item) => item.type === 'fatigue')).toHaveLength(1)
    expect(fatigue.some((item) => item.type === 'plateau')).toBe(false)
  })

  it('does not suggest changes from a block that has ended', () => {
    const block = makeBlock([{
      code: 'B1',
      position: 1,
      exerciseId: 'press',
      sets: 1,
      reps: ['8'],
      restSeconds: 90,
      technique: 'straight',
    }])
    const entries = [
      makeEntry('press', '2026-02-09', [[20, 8]], { blockId: block.id, dayKey: 'chest-back-b' }),
      makeEntry('press', '2026-02-10', [[20, 8]], { blockId: block.id, dayKey: 'chest-back-b' }),
    ]
    expect(progressSuggestions(entries, [block], [dumbbellExercise], '2026-02-16', en)).toEqual([])
  })

  it('reports median block change and requires two sessions in each comparison window', () => {
    const block = makeBlock()
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-02', [[44, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-09', [[44, 8]], { dayKey: 'chest-back-a' }),
    ]
    const report = blockReports(entries, [block], [dumbbellExercise])[0]
    expect(report.method).toBe('flat')
    expect(report.liftCount).toBe(1)
    expect(report.medianChangePercent).toBeCloseTo(10)
    expect(report.lifts[0].metric).toBe('e1rm')
    const missingStartSession = blockReports(
      entries.filter((entry) => entry.date !== '2026-01-12'),
      [block]
    )[0]
    expect(missingStartSession.liftCount).toBe(0)
  })

  it('ignores lifts with incomplete data and flat rep-only lifts in the block headline', () => {
    const block = makeBlock()
    const entries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[40, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-02', [[44, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-02-09', [[44, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('row', '2026-01-05', [[30, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('row', '2026-01-12', [[30, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('curl', '2026-01-05', [[10, 20]], { dayKey: 'chest-back-a' }),
      makeEntry('curl', '2026-01-12', [[10, 20]], { dayKey: 'chest-back-a' }),
      makeEntry('curl', '2026-02-02', [[10, 20]], { dayKey: 'chest-back-a' }),
      makeEntry('curl', '2026-02-09', [[10, 20]], { dayKey: 'chest-back-a' }),
    ]
    const report = blockReports(entries, [block])[0]
    expect(report.lifts.map((lift) => lift.exerciseId).sort()).toEqual(['curl', 'press'])
    expect(report.medianChangePercent).toBeCloseTo(10)
  })

  it('counts fractional weekly sets, keeps drop pairs as one, and compares planned volume', () => {
    const block = makeBlock([{
      code: 'A1',
      position: 1,
      exerciseId: 'press',
      sets: 3,
      reps: ['8', '8', '8'],
      restSeconds: 90,
      technique: 'drop-set',
    }])
    const chestPress: Exercise = {
      ...dumbbellExercise,
      primaryMuscles: ['Chest', 'Upper Chest'],
      secondaryMuscles: ['Triceps'],
    }
    const entries = [makeEntry('press', '2026-01-05', [[20, 8], [20, 8]], { dayKey: 'chest-back-a' })]
    entries[0].sets[0].drop = { reps: 8, weight: 15 }
    const result = weeklySets(entries, [block], [chestPress], '2026-01-05')
    expect(result.groups.find((group) => group.muscleGroup === 'Chest')).toMatchObject({
      done: 2,
      planned: 18,
      band: 'low',
      flagged: true,
    })
    expect(result.groups.find((group) => group.muscleGroup === 'Triceps')?.done).toBe(1)
  })

  it('counts sessions and reps-hit rate from planned sets', () => {
    const block = makeBlock([{
      code: 'A1',
      position: 1,
      exerciseId: 'press',
      sets: 2,
      reps: ['8', '8'],
      restSeconds: 90,
      technique: 'straight',
    }])
    const entries = [makeEntry('press', '2026-01-05', [[20, 8], [20, 6]], {
      blockId: block.id,
      dayKey: 'chest-back-a',
    })]
    const result = adherence(entries, [block], '2026-01-05')
    expect(result.week).toMatchObject({
      sessionsDone: 1,
      sessionsPlanned: 6,
      hitSets: 1,
      plannedSets: 2,
      hitRate: 0.5,
    })
    expect(result.blocks[0].sessionsPlanned).toBe(36)
  })

  it('keeps all progress views aligned on the upcoming block during a gap week', () => {
    const plan = [{
      code: 'A1',
      position: 1,
      exerciseId: 'press',
      sets: 2,
      reps: ['8', '8'],
      restSeconds: 90,
      technique: 'straight' as const,
    }]
    const previousBlock = { ...makeBlock(plan, '2026-08-17'), id: 'block-5', number: 5 }
    const upcomingBlock = { ...makeBlock(plan, '2026-10-05'), id: 'block-6', number: 6 }
    const today = '2026-10-04'
    const week = startOfWeek(today)
    const gapEntry = makeEntry('press', today, [[20, 8], [20, 8]], {
      blockId: upcomingBlock.id,
      dayKey: 'chest-back-a',
    })
    const previousEntry = makeEntry('press', '2026-09-27', [[20, 8], [20, 8]], {
      blockId: previousBlock.id,
      dayKey: 'chest-back-a',
    })
    const blocks = [previousBlock, upcomingBlock]
    const activeBlock = defaultActiveBlock(blocks, today)

    expect(activeBlock?.id).toBe(upcomingBlock.id)
    expect(nextUnloggedDay(upcomingBlock, [gapEntry], today)?.key).toBe('chest-back-a')

    const currentBlockEntries = activeBlock ? entriesWithinBlock([gapEntry], activeBlock) : []
    const consistency = adherence(currentBlockEntries, blocks, week)
    expect(consistency.week.sessionsDone).toBe(0)
    expect(consistency.blocks.find((block) => block.blockId === activeBlock?.id)?.sessionsDone).toBe(0)

    const weekly = weeklySets([gapEntry], blocks, [dumbbellExercise], week, activeBlock)
    expect(weekly.groups.find((group) => group.muscleGroup === 'Chest')).toMatchObject({
      done: 0,
      planned: 12,
    })

    expect(suggestionSourceBlock(blocks, activeBlock, today)?.id).toBe(previousBlock.id)
    expect(progressSuggestions(
      [previousEntry, gapEntry],
      blocks,
      [dumbbellExercise],
      today,
      en,
      activeBlock
    )).toHaveLength(0) // 2026-09-27 is week 6 (deload) of block 5: PT spec R4 excludes it from progression.

    expect(en.t('progress.headline.blockStarts', {
      number: upcomingBlock.number,
      date: formatShortDate('en', upcomingBlock.startDate),
    })).toBe('Block 6 starts Oct 5')
    expect(es.t('progress.headline.blockStarts', {
      number: upcomingBlock.number,
      date: formatShortDate('es', upcomingBlock.startDate),
    })).toBe('El bloque 6 empieza el 5 oct')
  })

  it('excludes the lighter first week of block 8 from strength trends and PR history', () => {
    const block = { ...makeBlock([], '2026-01-05'), id: 'block-8', number: 8 }
    const entries = [
      makeEntry('press', '2026-01-05', [[100, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[40, 8]], { dayKey: 'chest-back-a' }),
    ]
    const trend = strengthTrend(entries, [block], 'press', '2026-01-12', 'A', [], en)
    expect(trend.points.map((point) => point.date)).toEqual(['2026-01-12'])
    expect(personalRecords(entries, [block]).every((session) => session.badges.length === 0)).toBe(true)
  })

  it('runs the engine against realistic demo history', async () => {
    const entries = generateDemoHistory({
      blocks: approvedBlocks,
      endDate: '2026-10-09',
      months: 8,
      seed: 26,
    })
    const { exerciseLibrary } = await loadExerciseLibrary()
    const records = personalRecords(entries, approvedBlocks)
    const suggestions = progressSuggestions(entries, approvedBlocks, exerciseLibrary, '2026-10-09', en)
    const reports = blockReports(entries, approvedBlocks, exerciseLibrary)
    const lastFullWeekSets = weeklySets(entries, approvedBlocks, exerciseLibrary, '2026-09-21')

    expect(records.some((session) => session.badges.length > 0)).toBe(true)
    expect(suggestions.some((suggestion) => suggestion.type === 'add-weight')).toBe(true)
    expect(reports.filter((report) => report.blockNumber >= 2 && report.blockNumber <= 5))
      .toHaveLength(4)
    expect(lastFullWeekSets.weekStart).toBe('2026-09-21')
    expect(lastFullWeekSets.groups.some((group) => group.done > 0)).toBe(true)
  })

  it('renders Spanish suggestion and trend text', () => {
    const block = makeBlock([{
      code: 'A1',
      position: 1,
      exerciseId: 'press',
      sets: 2,
      reps: ['8', '8'],
      restSeconds: 90,
      technique: 'straight',
    }])
    const ready = [
      makeEntry('press', '2026-01-05', [[20, 8], [20, 8]], { dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-06', [[20, 8], [20, 8]], { dayKey: 'chest-back-b' }),
    ]
    expect(progressSuggestions(ready, [block], [dumbbellExercise], '2026-01-06', es)[0]).toMatchObject({
      message: 'Press con mancuernas: el próximo día B, apunta a 22 kg × 8 reps.',
      why: 'La última vez alcanzaste el máximo del objetivo de 8 repeticiones con 20 kg, así que subí el peso.',
    })

    const trendEntries = [
      makeEntry('press', '2026-01-05', [[40, 8]], { blockId: block.id, dayKey: 'chest-back-a' }),
      makeEntry('press', '2026-01-12', [[44, 8]], { blockId: block.id, dayKey: 'chest-back-a' }),
    ]
    expect(strengthTrend(trendEntries, [block], 'press', '2026-01-12', 'A', [dumbbellExercise], es).takeaway)
      .toBe('Press con mancuernas: 1RM est. +10% en este bloque (50.7 → 55.7 kg).')
  })
})
