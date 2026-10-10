import { describe, expect, it } from 'vitest'
import type { Exercise, TrainingBlock } from '../types'
import { blockLiftComparisons } from './blockComparison'
import type { ProgressEntry } from './types'

const bench: Exercise = { id: 'bench', name: 'Bench', primaryMuscle: 'Chest', equipment: 'barbell' }

function makeBlock(id: string, number: number, startDate: string, reps = ['3']) : TrainingBlock {
  return {
    id,
    number,
    name: `Block ${number}`,
    method: 'flat-pyramid',
    startDate,
    weeks: 12,
    origin: 'coach',
    summary: '',
    insights: [],
    days: [{ key: 'day-a', position: 1, name: 'A', exercises: [{
      code: 'bench',
      position: 1,
      exerciseId: bench.id,
      sets: 1,
      reps,
      restSeconds: 90,
      technique: 'straight',
    }] }],
  }
}

function entry(date: string, weight: number, blockId: string, reps = 3, exerciseId = bench.id): ProgressEntry {
  return {
    id: `${date}-${blockId}`,
    exerciseId,
    date,
    blockId,
    dayKey: 'day-a',
    sets: [{ id: `${date}-set`, weight, reps }],
  }
}

describe('approved block-over-block lift comparisons', () => {
  it('uses first/last two sessions and compares the same exercise end-to-end', () => {
    const previous = makeBlock('b1', 1, '2025-10-06')
    const current = makeBlock('b2', 2, '2026-01-05')
    const result = blockLiftComparisons([
      entry('2025-10-20', 58, previous.id),
      entry('2025-10-27', 58, previous.id),
      entry('2026-01-05', 60, current.id),
      entry('2026-01-12', 60, current.id),
      entry('2026-01-19', 63, current.id),
      entry('2026-01-26', 65, current.id),
    ], [previous, current], [bench], current)[0]
    expect(result).toMatchObject({
      start: 60 * (1 + 3 / 30),
      end: 64 * (1 + 3 / 30),
      previousEnd: 58 * (1 + 3 / 30),
      newInBlock: false,
    })
    expect(result.changePercent).toBeCloseTo(6.7, 1)
    expect(result.previousChangePercent).toBeCloseTo(10.3, 1)
  })

  it('labels a new lift in the current block and withholds a change from only three sessions', () => {
    const previous = makeBlock('b1', 1, '2025-10-06')
    const current = makeBlock('b2', 2, '2026-01-05')
    const result = blockLiftComparisons([
      entry('2026-01-05', 60, current.id),
      entry('2026-01-12', 61, current.id),
      entry('2026-01-19', 62, current.id),
    ], [previous, current], [bench], current)[0]
    expect(result).toMatchObject({ newInBlock: true, changePercent: null, sessionCount: 3 })
    expect(result.start).not.toBeNull()
    expect(result.end).not.toBeNull()
  })

  it('flags changed rep targets for high-rep lifts without merging different exercise ids', () => {
    const raise: Exercise = { ...bench, id: 'raise', equipment: 'dumbbells' }
    const previous = makeBlock('b1', 1, '2025-10-06', ['12'])
    const current = makeBlock('b2', 2, '2026-01-05', ['20'])
    previous.days[0].exercises[0].exerciseId = raise.id
    current.days[0].exercises[0].exerciseId = raise.id
    const result = blockLiftComparisons([
      entry('2025-11-03', 8, previous.id, 15, raise.id),
      entry('2025-11-10', 8, previous.id, 15, raise.id),
      entry('2026-01-05', 8, current.id, 20, raise.id),
      entry('2026-01-12', 8, current.id, 20, raise.id),
    ], [previous, current], [raise], current)[0]
    expect(result).toMatchObject({ highRep: true, differentRepTarget: true })
  })
})
