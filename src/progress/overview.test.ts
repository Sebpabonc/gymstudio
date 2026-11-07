import { describe, expect, it } from 'vitest'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import type { Exercise } from '../types'
import { watchObservations, type WatchObservation } from './comparison'
import { baselineSummary, nextSessionWatches } from './overview'
import type { LiftTrend, ProgressEntry } from './types'

function watch(exerciseId: string, code: WatchObservation['code']): WatchObservation {
  return { exerciseId, code, params: {}, priority: 0 }
}

function trend(verdict: LiftTrend['verdict'], sessions: number, deloads = 0): LiftTrend {
  const points = Array.from({ length: sessions + deloads }, (_, index) => ({ date: `2026-10-${10 + index}`, deload: index >= sessions }))
  return { verdict, points } as unknown as LiftTrend
}

function entries(exerciseId: string, reps: number[]): ProgressEntry[] {
  return ['2026-10-05', '2026-10-12'].map((date, index) => ({
    id: `${exerciseId}-${index}`,
    exerciseId,
    date,
    blockId: 'b1',
    dayKey: 'day-a',
    target: { sets: 3, reps: { min: 10, max: 10 } },
    sets: (index === 0 ? [10, 10, 10] : reps).map((value, set) => ({ id: `${exerciseId}-${index}-${set}`, weight: 60, reps: value })),
  }))
}

describe('Overview "Next session" (PO 2026-11-07)', () => {
  it('puts "Hit every target rep" (W2) first, then missed targets, repeats and baselines, top 3', () => {
    const ordered = nextSessionWatches([
      watch('squat', 'W1'),
      watch('row', 'W1'),
      watch('press', 'W1'),
      watch('bench', 'W2'),
      watch('curl', 'W3'),
      watch('fly', 'W6'),
    ])
    expect(ordered.map((item) => `${item.code}:${item.exerciseId}`)).toEqual(['W2:bench', 'W1:squat', 'W1:row'])
  })

  it('keeps the engine order inside one watch type', () => {
    const ordered = nextSessionWatches([watch('a', 'W3'), watch('b', 'W2'), watch('c', 'W2'), watch('d', 'W6')], 10)
    expect(ordered.map((item) => item.exerciseId)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('keeps a W2 lift that the engine would have cut behind three missed targets', () => {
    const lifts: Exercise[] = ['bench', 'squat', 'row', 'press'].map((id) => ({ id, name: id, primaryMuscle: 'Other', equipment: 'barbell' }))
    const history = [
      ...entries('squat', [10, 10, 8]),
      ...entries('row', [10, 10, 7]),
      ...entries('press', [10, 10, 9]),
      ...entries('bench', [10, 10, 10]),
    ]
    // The engine's own priority (W1 before W2) and default cap are unchanged.
    expect(watchObservations(history, [], lifts).map((item) => item.code)).toEqual(['W1', 'W1', 'W1'])
    const all = watchObservations(history, [], lifts, Number.POSITIVE_INFINITY)
    expect(all).toHaveLength(4)
    const next = nextSessionWatches(all)
    expect(next[0]).toMatchObject({ exerciseId: 'bench', code: 'W2', params: { target: 10, weight: 60 } })
    expect(next.slice(1).every((item) => item.code === 'W1')).toBe(true)
    expect(next).toHaveLength(3)
  })

  it('words W2 as a fact, not a load call, in both languages', () => {
    expect(en['progress.v3.next.W2']).toBe('Hit every target rep')
    expect(es['progress.v3.next.W2']).toBe('Lograste todas las reps')
    expect(en['progress.v3.next.title']).toBe('Next session')
  })
})

describe('Overview "Building your baseline" empty state', () => {
  it('shows the baseline while fewer than two main lifts have a verdict', () => {
    expect(baselineSummary([], 0)).toEqual({ sessions: 0, target: 4 })
    expect(baselineSummary([trend('improving', 6), trend('not-enough-data', 2)], 3)).toEqual({ sessions: 2, target: 4 })
  })

  it('counts the lift closest to its first verdict, without deloads, capped at 4', () => {
    expect(baselineSummary([trend('not-enough-data', 1), trend('not-enough-data', 3, 2)], 0)).toEqual({ sessions: 3, target: 4 })
    expect(baselineSummary([trend('not-enough-data', 7)], 1)).toEqual({ sessions: 4, target: 4 })
  })

  it('shows the baseline until a week is complete, then the two insights', () => {
    expect(baselineSummary([trend('improving', 4), trend('held', 4)], 0)).toEqual({ sessions: 4, target: 4 })
    expect(baselineSummary([trend('improving', 4), trend('held', 4)], 1)).toBeNull()
  })

  it('reuses the existing "{count} of 4 sessions" text inside the baseline body', () => {
    expect(en['progress.v3.unlock.sessions']).toBe('{count} of 4 sessions')
    expect(en['progress.v3.baseline.title']).toBe('Building your baseline')
    expect(en['progress.v3.baseline.body']).toContain('{sessions}')
    expect(es['progress.v3.baseline.body']).toContain('{sessions}')
  })

  it('drops the removed Overview strings from both dictionaries', () => {
    for (const key of ['progress.v3.sparklineNote', 'progress.v3.summary.improved', 'progress.v3.evidence.estMax', 'progress.v3.status.buildingReason']) {
      expect(Object.keys(en)).not.toContain(key)
      expect(Object.keys(es)).not.toContain(key)
    }
  })
})
