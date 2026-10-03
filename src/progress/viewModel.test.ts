import { describe, expect, it } from 'vitest'
import { Exercise, TrainingBlock } from '../types'
import {
  buildChartModel,
  chartSummary,
  defaultExerciseId,
  filterExerciseOptions,
  exercisesWithHistory,
  formatBlockMethod,
  limitSuggestions,
  muscleStatus,
  formatWeekLabel,
  recentRecords,
  reportingBlock,
  reportingWeek,
  sessionDots,
  topLifts,
  visibleBlockReports,
  RECORD_TOOLTIPS,
  weeklyPRCount,
  weeklySummary,
} from './viewModel'
import { BlockReport, ProgressEntry, ProgressSuggestion } from './types'

const block = (number: number, startDate: string, exerciseId = 'bench'): TrainingBlock => ({
  id: `b${number}`,
  number,
  name: `Block ${number}`,
  method: 'm',
  startDate,
  weeks: 6,
  origin: 'coach',
  summary: '',
  insights: [],
  days: [1, 2, 3, 4, 5, 6].map((position) => ({
    key: `d${position}-a`,
    position,
    name: `Day ${position}`,
    exercises: [
      { code: 'a', position: 1, exerciseId: position === 2 ? 'row' : exerciseId, sets: 3, reps: ['10'], restSeconds: 60, technique: 'straight' },
    ],
  })),
})

const exercises: Exercise[] = [
  { id: 'bench', name: 'Bench', primaryMuscle: 'Chest' },
  { id: 'row', name: 'Row', primaryMuscle: 'Lats' },
  { id: 'curl', name: 'Curl', primaryMuscle: 'Biceps' },
]

const entry = (exerciseId: string, date: string): ProgressEntry => ({
  id: `${exerciseId}-${date}`,
  exerciseId,
  date,
  sets: [{ id: 's', reps: 8, weight: 50 }],
})

describe('progress view model', () => {
  it('limits suggestions to five', () => {
    const suggestions: ProgressSuggestion[] = Array.from({ length: 8 }, (_, index) => ({
      type: 'plateau', exerciseId: `e${index}`, dayType: 'A', message: 'x', why: 'y',
    }))
    expect(limitSuggestions(suggestions)).toHaveLength(5)
  })

  it('builds session dots', () => {
    const dots = sessionDots({
      week: { weekStart: '2026-01-05', sessionsDone: 4, sessionsPlanned: 6, hitSets: 0, plannedSets: 0, hitRate: null },
      blocks: [],
    })
    expect(dots).toEqual([true, true, true, true, false, false])
  })

  it('returns the latest five records with badges', () => {
    const records = Array.from({ length: 7 }, (_, index) => ({
      exerciseId: 'bench', date: `2026-01-0${index + 1}`, badges: index === 6 ? [] : ['e1rm' as const], likelyTypoSetIds: [],
    }))
    const result = recentRecords(records)
    expect(result).toHaveLength(5)
    expect(result[0].date).toBe('2026-01-06')
  })

  it('hides blocks without logged sessions and keeps top three lifts', () => {
    const blocks = [block(1, '2026-01-05'), block(2, '2026-02-16')]
    const lift = (changePercent: number) => ({
      exerciseId: 'bench', dayType: 'A' as const, startValue: 1, endValue: 2, changePercent, metric: 'e1rm' as const,
    })
    const reports: BlockReport[] = blocks.map((item) => ({
      blockId: item.id, blockNumber: item.number, method: 'm', lifts: [lift(1), lift(9), lift(5), lift(3)],
      medianChangePercent: 4, liftCount: 4, improvedLiftCount: 4,
    }))
    const visible = visibleBlockReports(reports, [entry('bench', '2026-01-06')], blocks)
    expect(visible.map((report) => report.blockId)).toEqual(['b1'])
    expect(topLifts(visible[0]).map((item) => item.changePercent)).toEqual([9, 5, 3])
  })

  it('marks high sets as planned when the plan prescribes them', () => {
    expect(muscleStatus({ band: 'high', done: 24, planned: 24 })).toBe('Above range (planned)')
    expect(muscleStatus({ band: 'high', done: 26, planned: 20 })).toBe('Above range')
    expect(muscleStatus({ band: 'in-range', done: 12, planned: 12 })).toBe('In range')
  })

  it('uses plain block method labels and explains personal record types', () => {
    expect(formatBlockMethod('reverse-pyramid')).toBe('Reverse Pyramid')
    expect(RECORD_TOOLTIPS.e1rm).toContain('Estimated one-rep max')
    expect(RECORD_TOOLTIPS.weight).toContain('Highest weight')
    expect(RECORD_TOOLTIPS.reps).toContain('Most reps')
  })

  it('orders chart exercises by most recent session and filters them by search', () => {
    const entries = [
      entry('bench', '2026-01-06'),
      entry('curl', '2026-01-07'),
      entry('curl', '2026-01-08'),
      entry('row', '2026-01-09'),
    ]
    const options = exercisesWithHistory(entries, exercises)
    expect(options.map((item) => item.id)).toEqual(['row', 'curl', 'bench'])
    expect(filterExerciseOptions(options, 'UR')).toEqual([exercises[2]])
    expect(filterExerciseOptions(options, '')).toEqual(options)
  })

  it('summarizes PRs from the selected week without counting outside dates', () => {
    const records = [
      { exerciseId: 'bench', date: '2026-03-02', badges: ['e1rm' as const, 'weight' as const], likelyTypoSetIds: [] },
      { exerciseId: 'row', date: '2026-03-08', badges: ['reps' as const], likelyTypoSetIds: [] },
      { exerciseId: 'curl', date: '2026-03-09', badges: ['weight' as const], likelyTypoSetIds: [] },
    ]
    expect(weeklyPRCount(records, '2026-03-02')).toBe(2)
    expect(weeklySummary(1, 6, 1)).toBe('This week: 1 of 6 sessions · 1 PR · on track')
    expect(weeklySummary(0, 6, 0)).toBe('This week: 0 of 6 sessions · 0 PRs · on track')
  })

  it('picks the main lift of the current day, falling back to most logged', () => {
    const blocks = [block(1, '2026-01-05')]
    const entries = [entry('bench', '2026-01-06'), entry('curl', '2026-01-07'), entry('curl', '2026-01-08')]
    // 2026-01-06 is a Tuesday → day 2 → row, but row has no history
    expect(defaultExerciseId(entries, exercises, blocks, '2026-01-06')).toBe('curl')
    expect(defaultExerciseId(entries, exercises, blocks, '2026-01-05')).toBe('bench')
    expect(exercisesWithHistory(entries, exercises).map((item) => item.id)).toEqual(['curl', 'bench'])
  })

  it('builds chart geometry with bands and record markers', () => {
    const blocks = [block(1, '2026-01-05')]
    const points = [
      { date: '2026-01-05', e1rm: 60, dayType: 'A' as const, blockId: 'b1' },
      { date: '2026-01-19', e1rm: 66, dayType: 'A' as const, blockId: 'b1' },
    ]
    const model = buildChartModel(points, blocks, new Set(['2026-01-19']))
    expect(model.points).toHaveLength(2)
    expect(model.points[1].isRecord).toBe(true)
    expect(model.points[1].y).toBeLessThan(model.points[0].y)
    expect(model.bands).toHaveLength(1)
    expect(model.path.startsWith('M')).toBe(true)
    expect(model.xTicks.map((tick) => tick.date)).toEqual(['2026-01-05', '2026-01-19'])
    expect(buildChartModel([], blocks).points).toEqual([])
    expect(chartSummary(points, 'Up.')).toContain('2 sessions')
  })

  it('starts a new chart line at each block boundary', () => {
    const blocks = [block(1, '2026-01-05'), block(2, '2026-02-16')]
    const points = [
      { date: '2026-01-05', e1rm: 60, dayType: 'A' as const, blockId: 'b1' },
      { date: '2026-02-16', e1rm: 66, dayType: 'A' as const, blockId: 'b2' },
      { date: '2026-02-23', e1rm: 68, dayType: 'A' as const, blockId: 'b2' },
    ]
    const model = buildChartModel(points, blocks)
    expect(model.path.match(/M/g)).toHaveLength(2)
    expect(model.path.match(/L/g)).toHaveLength(1)
  })

  it('falls back to the most recent week and block with sessions', () => {
    const blocks = [block(1, '2026-01-05'), block(2, '2026-02-16')]
    const entries = [entry('bench', '2026-01-06'), entry('bench', '2026-01-22')]
    expect(reportingWeek(entries, '2026-03-04')).toBe('2026-01-19')
    expect(reportingWeek(entries, '2026-01-22')).toBe('2026-01-19')
    expect(reportingWeek([], '2026-03-04')).toBe('2026-03-02')
    expect(reportingBlock(blocks, entries, '2026-03-04')?.id).toBe('b1')
    expect(reportingBlock(blocks, [...entries, entry('bench', '2026-02-17')], '2026-02-20')?.id).toBe('b2')
    expect(reportingBlock(blocks, [], '2026-03-04')).toBeNull()
    expect(formatWeekLabel('2026-01-19', '2026-03-04')).toBe('Week of 19 Jan')
    expect(formatWeekLabel('2026-03-02', '2026-03-04')).toBe('This week')
  })
})
