import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { exerciseVolumeTrend, sessionVolumeComparison, sessionVolumeLoad } from './volume'
import type { ProgressEntry, ProgressLiftSession } from './types'

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
  days: [],
}

const rdl: Exercise = { id: 'rdl', name: 'Romanian deadlift', primaryMuscle: 'Hamstrings', equipment: 'barbell' }
const abBlock: TrainingBlock = {
  ...block,
  days: [
    { key: 'chest-back-a', position: 1, name: 'A', exercises: [{ exerciseId: 'rdl', reps: ['10'], code: 'A1', position: 1, sets: 3, restSeconds: 90, technique: 'straight' }] },
    { key: 'chest-back-b', position: 2, name: 'B', exercises: [{ exerciseId: 'rdl', reps: ['12'], code: 'B1', position: 1, sets: 3, restSeconds: 90, technique: 'straight' }] },
  ],
}

function entry(date: string, exercise: Exercise, sets: ProgressEntry['sets']): ProgressEntry {
  return { id: `${exercise.id}-${date}`, exerciseId: exercise.id, date, blockId: 'b1', dayKey: 'day-a', sets }
}

function dayEntry(date: string, dayKey: string, sets: ProgressEntry['sets'], blockId = 'b1'): ProgressEntry {
  return { id: `${dayKey}-${date}`, exerciseId: 'rdl', date, blockId, dayKey, sets }
}

function sets(weight: number, reps: number[], prefix: string) {
  return reps.map((rep, index) => ({ id: `${prefix}-${index}`, weight, reps: rep }))
}

function session(date: string, dayKey: string, weight: number, reps: number[]): ProgressLiftSession {
  return {
    exerciseId: 'rdl',
    date,
    blockId: 'b1',
    dayKey,
    sets: sets(weight, reps, `${date}-${dayKey}`),
    deload: false,
  }
}

function abWeek(week: string, aSets: ProgressEntry['sets'], bSets = aSets, blockId = 'b1') {
  return [
    dayEntry(week, 'chest-back-a', aSets, blockId),
    dayEntry(new Date(Date.parse(`${week}T00:00:00Z`) + 2 * 86_400_000).toISOString().slice(0, 10), 'chest-back-b', bSets, blockId),
  ]
}

function volumeWeek(result: ReturnType<typeof exerciseVolumeTrend>, weekStart: string) {
  return result.weeks.find((week) => week.weekStart === weekStart)
}

describe('approved per-exercise weekly volume', () => {
  it('counts working-set kg × reps and the drop part, excluding warm-ups', () => {
    const result = exerciseVolumeTrend([
      entry('2026-01-05', rdl, [
        { id: 'warmup', weight: 20, reps: 10 },
        { id: 'work1', weight: 50, reps: 10 },
        { id: 'work2', weight: 50, reps: 10, drop: { weight: 25, reps: 10 } },
        { id: 'work3', weight: 50, reps: 10 },
      ]),
    ], [block], rdl, '2026-01-10')
    expect(result.weeks[0].volume).toBe(1750)
  })

  it('excludes a warm-up at exactly half the top working load', () => {
    const result = exerciseVolumeTrend([
      entry('2026-01-05', rdl, [
        { id: 'warmup', weight: 40, reps: 10 },
        { id: 'work1', weight: 80, reps: 8 },
        { id: 'work2', weight: 80, reps: 8 },
        { id: 'work3', weight: 80, reps: 8 },
      ]),
    ], [block], rdl, '2026-01-10')
    expect(result.weeks[0].volume).toBe(1920)
  })

  it('V-T14: does not track unweighted bodyweight work and counts added load only', () => {
    const bodyweight: Exercise = { ...rdl, id: 'dip', equipment: 'bodyweight' }
    const empty = exerciseVolumeTrend([entry('2026-01-05', bodyweight, [{ id: 'set', weight: 0, reps: 12 }])], [block], bodyweight, '2026-01-10')
    expect(empty).toMatchObject({ bodyweightUnloaded: true, weeks: [{ volume: null }] })
    const loaded = exerciseVolumeTrend([entry('2026-01-05', bodyweight, [{ id: 'set', weight: 10, reps: 12 }])], [block], bodyweight, '2026-01-10')
    expect(loaded.weeks[0].volume).toBe(120)
    expect(loaded.bodyweightUnloaded).toBe(false)
    const loadedDrop = exerciseVolumeTrend([entry('2026-01-05', bodyweight, [{
      id: 'set',
      weight: 0,
      reps: 12,
      drop: { weight: 5, reps: 8 },
    }])], [block], bodyweight, '2026-01-10')
    expect(loadedDrop.weeks[0].volume).toBe(40)
    expect(loadedDrop.bodyweightUnloaded).toBe(false)
  })

  it('V-T14: omits bodyweight session totals unless both sessions use added load', () => {
    const bodyweight: Exercise = { ...rdl, id: 'dip', equipment: 'bodyweight' }
    const bodyweightSession = (date: string, weight: number): ProgressLiftSession => ({
      ...session(date, 'chest-back-a', weight, [12]),
      exerciseId: bodyweight.id,
    })
    expect(sessionVolumeComparison(
      bodyweightSession('2026-01-12', 0),
      bodyweightSession('2026-01-05', 0),
      bodyweight
    )).toBeNull()
    expect(sessionVolumeComparison(
      bodyweightSession('2026-01-12', 10),
      bodyweightSession('2026-01-05', 5),
      bodyweight
    )).toMatchObject({ current: 120, previous: 60 })
  })

  it('excludes sets and drop parts with implausible repetition counts', () => {
    const result = exerciseVolumeTrend([
      entry('2026-01-05', rdl, [
        { id: 'valid', weight: 50, reps: 10, drop: { weight: 25, reps: 60 } },
        { id: 'too-many', weight: 50, reps: 60 },
        { id: 'none', weight: 50, reps: 0 },
      ]),
    ], [block], rdl, '2026-01-10')
    expect(result.weeks[0].volume).toBe(500)
  })

  it('requires three completed non-deload weeks before drawing a trend', () => {
    const entries = ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26']
      .map((date) => entry(date, rdl, [{ id: date, weight: 60, reps: 10 }]))
    const twoWeeks = exerciseVolumeTrend(entries.slice(0, 2), [block], rdl, '2026-01-21')
    const threeWeeks = exerciseVolumeTrend(entries.slice(0, 3), [block], rdl, '2026-01-28')
    expect(twoWeeks.trendAvailable).toBe(false)
    expect(threeWeeks.trendAvailable).toBe(true)
  })

  it('labels an empty block week-six deload', () => {
    const result = exerciseVolumeTrend([
      entry('2026-02-02', rdl, [{ id: 'set', weight: 60, reps: 10 }]),
    ], [block], rdl, '2026-02-16')
    expect(result.weeks.find((week) => week.weekStart === '2026-02-09')?.deload).toBe(true)
  })

  it('V-T1: reports a same-day total independently of the strength verdict and flags a heavier load', () => {
    const result = sessionVolumeComparison(
      session('2026-01-16', 'chest-back-b', 25, [10, 10, 9]),
      session('2026-01-09', 'chest-back-b', 22.5, [12, 12, 12]),
      rdl
    )
    expect(result).toEqual({ current: 725, previous: 810, heavierWeight: true })
  })

  it('V-T2: never compares A and B session totals', () => {
    expect(sessionVolumeComparison(
      session('2026-01-12', 'chest-back-a', 30, [10, 8, 8]),
      session('2026-01-08', 'chest-back-b', 28, [14, 12, 12]),
      rdl
    )).toBeNull()
  })

  it('V-T3: marks a lower weekly total neutrally and gives the heavier-weight context first', () => {
    const entries = [
      ...abWeek('2026-01-05', sets(22.5, [10, 10, 10], 'a1'), sets(22.5, [12, 12, 12], 'b1')),
      ...abWeek('2026-01-12', sets(25, [10, 8, 8], 'a2'), sets(25, [10, 10, 9], 'b2')),
    ]
    const result = exerciseVolumeTrend(entries, [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(result, '2026-01-12')).toMatchObject({
      volume: 1375,
      previousVolume: 1485,
      change: 'less',
      contextNote: { code: 'heavier-weight' },
    })
    expect(volumeWeek(result, '2026-01-12')?.changePercent).toBeCloseTo(-7.4074, 3)
  })

  it('V-T4 and V-T5: applies the five-percent neutral band to complete A+B weeks', () => {
    const aboutSame = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 70, reps: 10 }], [{ id: 'b1', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 71.5, reps: 10 }], [{ id: 'b2', weight: 71.5, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(aboutSame, '2026-01-12')?.change).toBe('same')

    const more = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 65, reps: 10 }], [{ id: 'b1', weight: 72.5, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 75, reps: 10 }], [{ id: 'b2', weight: 75, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(more, '2026-01-12')?.change).toBe('more')
  })

  it('V-T6: treats exactly plus or minus five percent as outside the neutral band', () => {
    const more = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 70, reps: 10 }], [{ id: 'b1', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 72, reps: 10 }], [{ id: 'b2', weight: 75, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(more, '2026-01-12')).toMatchObject({ volume: 1470, change: 'more' })

    const less = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 70, reps: 10 }], [{ id: 'b1', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 65, reps: 10 }], [{ id: 'b2', weight: 68, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(less, '2026-01-12')).toMatchObject({ volume: 1330, change: 'less' })
  })

  it('V-T7: keeps an incomplete A+B week as a total so far with no comparison', () => {
    const result = exerciseVolumeTrend([
      ...abWeek('2026-01-05', sets(70, [10], 'a1'), sets(70, [10], 'b1')),
      dayEntry('2026-01-13', 'chest-back-a', [{ id: 'now', weight: 65, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-15')
    expect(volumeWeek(result, '2026-01-12')).toMatchObject({
      complete: false,
      volume: 650,
      loggedDayCount: 1,
      plannedDayCount: 2,
      change: null,
    })
  })

  it('V-T8: skips deload comparisons and does not compare the first complete week back', () => {
    const entries = [
      ...abWeek('2026-02-02', [{ id: 'a5', weight: 70, reps: 10 }], [{ id: 'b5', weight: 70, reps: 10 }]),
      ...abWeek('2026-02-09', [{ id: 'a6', weight: 35, reps: 10 }], [{ id: 'b6', weight: 35, reps: 10 }]),
      ...abWeek('2026-02-16', [{ id: 'a7', weight: 70, reps: 10 }], [{ id: 'b7', weight: 70, reps: 10 }]),
      ...abWeek('2026-02-23', [{ id: 'a8', weight: 70, reps: 10 }], [{ id: 'b8', weight: 70, reps: 10 }]),
    ]
    const result = exerciseVolumeTrend(entries, [abBlock], rdl, '2026-03-02')
    expect(volumeWeek(result, '2026-02-09')).toMatchObject({ deload: true, change: null, contextNote: { code: 'deload' } })
    expect(volumeWeek(result, '2026-02-16')).toMatchObject({ change: null, contextNote: { code: 'first-week-back' } })
    expect(volumeWeek(result, '2026-02-23')?.change).toBe('same')
  })

  it('V-T9: uses fewer working sets as the first applicable lower-week note after a weight check', () => {
    const result = exerciseVolumeTrend([
      ...abWeek('2026-01-05', sets(70, [10, 10, 10], 'a1'), sets(70, [10, 10, 10], 'b1')),
      ...abWeek('2026-01-12', sets(70, [10, 10], 'a2'), sets(70, [10, 10, 10], 'b2')),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(result, '2026-01-12')).toMatchObject({
      change: 'less',
      contextNote: { code: 'fewer-sets', current: 5, previous: 6 },
    })
  })

  it('V-T10: notes when the weekly best set is held or stronger despite lower total weight moved', () => {
    const result = exerciseVolumeTrend([
      ...abWeek('2026-01-05', sets(100, [10, 10, 10], 'a1'), sets(100, [10, 10, 10], 'b1')),
      ...abWeek('2026-01-12', [
        { id: 'a2-best', weight: 100, reps: 10 },
        { id: 'a2-mid-1', weight: 60, reps: 5 },
        { id: 'a2-mid-2', weight: 60, reps: 5 },
      ], [
        { id: 'b2-best', weight: 100, reps: 10 },
        { id: 'b2-mid-1', weight: 60, reps: 5 },
        { id: 'b2-mid-2', weight: 60, reps: 5 },
      ]),
    ], [abBlock], rdl, '2026-01-26')
    expect(volumeWeek(result, '2026-01-12')).toMatchObject({
      change: 'less',
      contextNote: { code: 'best-set-held' },
    })
  })

  it('V-T11: creates a block trend from at least three complete non-deload weeks', () => {
    const values = [1485, 1375, 1450, 1530, 1560]
    const entries = values.flatMap((value, index) => {
      const monday = new Date(Date.parse('2026-01-05T00:00:00Z') + index * 7 * 86_400_000).toISOString().slice(0, 10)
      return abWeek(monday, [{ id: `a-${index}`, weight: value / 2, reps: 1 }], [{ id: `b-${index}`, weight: value / 2, reps: 1 }])
    })
    const result = exerciseVolumeTrend(entries, [abBlock], rdl, '2026-02-09')
    expect(result.blockTrend).toMatchObject({
      firstWeek: 1,
      lastWeek: 5,
      firstVolume: 1485,
      lastVolume: 1560,
      change: 'more',
    })
    expect(result.blockTrend?.changePercent).toBeCloseTo(5.05, 1)
  })

  it('V-T12: tracks high-rep A+B totals without requiring an Epley estimate', () => {
    const raises: Exercise = { ...rdl, equipment: 'dumbbell' }
    const result = exerciseVolumeTrend([
      dayEntry('2026-01-06', 'chest-back-a', sets(10, [15, 15, 15], 'a0')),
      dayEntry('2026-01-08', 'chest-back-b', sets(8, [20, 20, 20], 'b0')),
      dayEntry('2026-01-13', 'chest-back-a', sets(10, [16, 15, 15], 'a2')),
      dayEntry('2026-01-15', 'chest-back-b', sets(8, [20, 20, 20], 'b2')),
    ], [abBlock], raises, '2026-01-26')
    expect(volumeWeek(result, '2026-01-12')).toMatchObject({ volume: 940, change: 'same' })
  })

  it('V-T13: includes drop-set work in the total without counting it as another hard set', () => {
    expect(sessionVolumeLoad([{
      id: 'drop',
      weight: 60,
      reps: 10,
      drop: { weight: 45, reps: 8 },
    }])).toBe(960)
  })

  it('V-T15: does not compare weekly totals across a rep-target change between blocks', () => {
    const previousBlock = {
      ...abBlock,
      weeks: 2,
      days: abBlock.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({ ...exercise, reps: ['12'] })),
      })),
    }
    const nextBlock: TrainingBlock = {
      ...abBlock,
      id: 'b2',
      number: 2,
      startDate: '2026-01-19',
      weeks: 4,
      days: abBlock.days.map((day) => ({
        ...day,
        exercises: day.exercises.map((exercise) => ({ ...exercise, reps: ['10'] })),
      })),
    }
    const result = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 70, reps: 10 }], [{ id: 'b1', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 70, reps: 10 }], [{ id: 'b2', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-19', [{ id: 'a3', weight: 60, reps: 10 }], [{ id: 'b3', weight: 60, reps: 10 }], 'b2'),
    ], [previousBlock, nextBlock], rdl, '2026-01-26')
    expect(volumeWeek(result, '2026-01-19')).toMatchObject({
      change: null,
      contextNote: { code: 'different-target' },
    })
  })

  it('V-T17: returns factual progress only, with no target or prescription', () => {
    const result = exerciseVolumeTrend([
      ...abWeek('2026-01-05', [{ id: 'a1', weight: 70, reps: 10 }], [{ id: 'b1', weight: 70, reps: 10 }]),
      ...abWeek('2026-01-12', [{ id: 'a2', weight: 70, reps: 10 }], [{ id: 'b2', weight: 70, reps: 10 }]),
    ], [abBlock], rdl, '2026-01-26')
    expect(result).not.toHaveProperty('target')
    expect(result).not.toHaveProperty('recommendation')
  })
})
