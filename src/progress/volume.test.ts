import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { exerciseVolumeTrend } from './volume'
import type { ProgressEntry } from './types'

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

function entry(date: string, exercise: Exercise, sets: ProgressEntry['sets']): ProgressEntry {
  return { id: `${exercise.id}-${date}`, exerciseId: exercise.id, date, blockId: 'b1', dayKey: 'day-a', sets }
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

  it('shows an unweighted bodyweight lift as not tracked and counts added load only', () => {
    const bodyweight: Exercise = { ...rdl, id: 'dip', equipment: 'bodyweight' }
    const empty = exerciseVolumeTrend([entry('2026-01-05', bodyweight, [{ id: 'set', weight: 0, reps: 12 }])], [block], bodyweight, '2026-01-10')
    expect(empty).toMatchObject({ bodyweightUnloaded: true, weeks: [{ volume: null }] })
    const loaded = exerciseVolumeTrend([entry('2026-01-05', bodyweight, [{ id: 'set', weight: 10, reps: 12 }])], [block], bodyweight, '2026-01-10')
    expect(loaded.weeks[0].volume).toBe(120)
    expect(loaded.bodyweightUnloaded).toBe(false)
  })

  it('requires three completed non-deload weeks before drawing a trend', () => {
    const entries = ['2026-01-05', '2026-01-12', '2026-01-19', '2026-01-26']
      .map((date) => entry(date, rdl, [{ id: date, weight: 60, reps: 10 }]))
    const twoWeeks = exerciseVolumeTrend(entries.slice(0, 2), [block], rdl, '2026-01-21')
    const threeWeeks = exerciseVolumeTrend(entries.slice(0, 3), [block], rdl, '2026-01-28')
    expect(twoWeeks.trendAvailable).toBe(false)
    expect(threeWeeks.trendAvailable).toBe(true)
  })
})
