import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { compareLiftSessions, watchObservations } from './comparison'
import { equivalentLiftSessions } from './trends'
import type { ProgressEntry, ProgressLiftSession } from './types'

const barbell: Exercise = { id: 'bench', name: 'Bench', primaryMuscle: 'Chest', equipment: 'barbell' }
const dumbbell: Exercise = { ...barbell, id: 'curl', equipment: 'dumbbells' }

function session(date: string, specs: Array<[number, number]>, options: {
  dayKey?: string | null
  blockId?: string | null
  deload?: boolean
  target?: ProgressLiftSession['target']
} = {}): ProgressLiftSession {
  return {
    exerciseId: 'bench',
    date,
    blockId: options.blockId === undefined ? 'b1' : options.blockId,
    dayKey: options.dayKey === undefined ? 'day-a' : options.dayKey,
    deload: options.deload ?? false,
    target: options.target,
    sets: specs.map(([weight, reps], index) => ({ id: `${date}-${index}`, weight, reps })),
  }
}

function pairs(previous: Array<[number, number]>, current: Array<[number, number]>, exercise = barbell, options: {
  previousTarget?: number
  currentTarget?: number
} = {}) {
  return compareLiftSessions(
    session('2026-10-05', previous, { target: options.previousTarget ? { sets: previous.length, reps: { min: options.previousTarget, max: options.previousTarget } } : undefined }),
    session('2026-10-12', current, { target: options.currentTarget ? { sets: current.length, reps: { min: options.currentTarget, max: options.currentTarget } } : undefined }),
    exercise
  )
}

describe('approved Progress v3 session comparisons', () => {
  it('requires matching exercise, block, and day key for equivalent sessions', () => {
    const a = session('2026-10-05', [[30, 12]])
    expect(equivalentLiftSessions(a, session('2026-10-08', [[30, 12]], { dayKey: 'day-b' }))).toBe(false)
    expect(equivalentLiftSessions(a, session('2026-10-12', [[30, 12]]))).toBe(true)
    expect(equivalentLiftSessions(session('2026-09-29', [[30, 12]], { blockId: null, dayKey: null }), a)).toBe(false)
    expect(equivalentLiftSessions(
      session('2026-10-05', [[30, 12]], { deload: true }),
      session('2026-10-12', [[30, 12]], { deload: false })
    )).toBe(false)
  })

  it('labels the first equivalent session as a baseline', () => {
    expect(compareLiftSessions(null, session('2026-10-05', [[30, 12]]), barbell).verdict).toBe('baseline')
  })

  it('marks equipment steps and extra reps as improved', () => {
    expect(pairs([[30, 12], [30, 12], [30, 12]], [[32.5, 12], [32.5, 12], [32.5, 12]]).verdict).toBe('improved')
    expect(pairs([[22.5, 12], [22.5, 12], [22.5, 12]], [[22.5, 15], [22.5, 15], [22.5, 15]]).verdict).toBe('improved')
    expect(pairs([[26, 12]], [[28, 11]], dumbbell).verdict).toBe('improved')
  })

  it('holds pyramids and ignores changes to drop parts', () => {
    expect(pairs([[65, 10], [60, 11], [65, 11]], [[65, 10], [60, 11], [65, 11]]).verdict).toBe('held')
    const previous = session('2026-10-05', [[6, 12]])
    previous.sets[0].drop = { weight: 4, reps: 12 }
    const current = session('2026-10-12', [[6, 12]])
    current.sets[0].drop = { weight: 4, reps: 15 }
    expect(compareLiftSessions(previous, current, { ...barbell, equipment: 'cable' }).verdict).toBe('held')
    expect(pairs([[80, 8], [72, 10], [70, 12]], [[80, 9], [72, 10], [70, 11]]).verdict).toBe('mixed')
  })

  it('distinguishes traded load and rep changes from improved and dropped sets', () => {
    expect(pairs([[26, 12]], [[28, 10]], dumbbell).verdict).toBe('traded')
    expect(pairs([[6.25, 15]], [[6, 15]], { ...barbell, equipment: 'cable' }).verdict).toBe('held')
    expect(pairs([[30, 12]], [[30, 11]]).verdict).toBe('dropped')
  })

  it('does not call one fewer set a drop and counts a qualifying extra set as improved', () => {
    expect(pairs([[30, 12], [30, 12], [30, 12]], [[30, 12], [30, 12]]).verdict).toBe('held')
    const result = pairs([[30, 12], [30, 12], [30, 12]], [[30, 12], [30, 12], [30, 12], [30, 12]], barbell, { currentTarget: 12 })
    expect(result).toMatchObject({ verdict: 'improved', improvedSets: 1, workingSetCount: 4 })
  })

  it('reports changed rep targets without assigning a verdict', () => {
    expect(pairs([[30, 12]], [[30, 15]], barbell, { previousTarget: 12, currentTarget: 15 }).verdict).toBe('target-changed')
  })

  it('selects factual watch observations in approved priority order, capped at three', () => {
    const exercise: Exercise = { ...barbell, id: 'bench' }
    const entries: ProgressEntry[] = [
      ...Array.from({ length: 4 }, (_, index) => ({
        id: `entry-${index}`,
        exerciseId: exercise.id,
        date: `2026-10-${String(5 + index * 7).padStart(2, '0')}`,
        blockId: 'b1',
        dayKey: 'day-a',
        target: { sets: 1, reps: { min: 12, max: 12 } },
        sets: [{ id: `set-${index}`, weight: 30, reps: index === 3 ? 8 : 12, rir: index === 3 ? 0 : undefined }],
      })),
    ]
    const watches = watchObservations(entries, [], [exercise])
    expect(watches).toHaveLength(1)
    expect(watches[0]).toMatchObject({ code: 'W1', params: { reps: 8, target: 12 } })
  })

  it.each([undefined, 0, 3])('T108: does not generate an effort watch for logged RIR %s', (rir) => {
    const entries: ProgressEntry[] = [
      {
        id: 'previous',
        exerciseId: 'bench',
        date: '2026-10-05',
        blockId: 'b1',
        dayKey: 'day-a',
        target: { sets: 3, reps: { min: 8, max: 8 } },
        sets: [{ id: 'previous-set', weight: 50, reps: 8 }],
      },
      {
        id: 'current',
        exerciseId: 'bench',
        date: '2026-10-12',
        blockId: 'b1',
        dayKey: 'day-a',
        target: { sets: 3, reps: { min: 8, max: 8 } },
        sets: [
          { id: 'current-1', weight: 52.5, reps: 8 },
          { id: 'current-2', weight: 55, reps: 8 },
          { id: 'current-3', weight: 57.5, reps: 8, rir },
        ],
      },
    ]
    expect(watchObservations(entries, [], [barbell])).toEqual([])
    expect(entries[1].sets[2].rir).toBe(rir)
  })

  it('keeps baseline W6 even when an old answer was logged at zero', () => {
    const entry: ProgressEntry = {
      id: 'baseline',
      exerciseId: 'bench',
      date: '2026-10-05',
      target: { sets: 3, reps: { min: 8, max: 8 } },
      sets: [{ id: 'set', weight: 50, reps: 8, rir: 0 }],
    }
    expect(watchObservations([entry], [], [barbell])).toMatchObject([{ code: 'W6' }])
  })

  it.each([false, true])('T148: requires all planned main sets for W2 (saved target: %s)', (savedTarget) => {
    const block: TrainingBlock = {
      id: 'b1',
      number: 1,
      name: 'Block',
      method: 'Straight sets',
      startDate: '2026-10-05',
      weeks: 6,
      origin: 'pt',
      summary: '',
      insights: [],
      days: [{
        key: 'day-a',
        position: 1,
        name: 'Day A',
        exercises: [{
          code: 'A1',
          position: 1,
          exerciseId: 'bench',
          sets: 3,
          reps: ['8', '8', '8'],
          restSeconds: 120,
          technique: 'straight',
        }],
      }],
    }
    const entry: ProgressEntry = {
      id: 'entry',
      exerciseId: 'bench',
      date: '2026-10-05',
      blockId: 'b1',
      dayKey: 'day-a',
      target: savedTarget ? { sets: 3, reps: { min: 8, max: 8 } } : undefined,
      sets: [
        { id: 'warmup', weight: 20, reps: 8 },
        { id: '1', weight: 50, reps: 8, drop: { weight: 30, reps: 8 } },
        { id: '2', weight: 50, reps: 8 },
      ],
    }
    const blocks = savedTarget ? [] : [block]
    expect(watchObservations([entry], blocks, [barbell]).some((watch) => watch.code === 'W2')).toBe(false)
    entry.sets.push({ id: '3', weight: 50, reps: 8 })
    expect(watchObservations([entry], blocks, [barbell])).toMatchObject([
      { code: 'W2', params: { target: 8, weight: 50 } },
    ])
  })
})
