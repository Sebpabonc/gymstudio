import { describe, expect, it } from 'vitest'
import blockRows from '../../docs/fitness/approved/training-blocks/blocks.json'
import { loadExerciseLibrary } from '../data/exerciseLibrary'
import { TrainingBlock } from '../types'
import { mapTrainingBlockRows } from '../utils/storage'
import { blockWeek } from '../utils/trainingBlocks'
import { generateDemoHistory } from './generateDemoHistory'

const approvedBlocks = mapTrainingBlockRows(blockRows)

function testBlock(exercises: TrainingBlock['days'][number]['exercises']): TrainingBlock[] {
  return [{
    id: 'test-block',
    number: 1,
    name: 'Test block',
    method: 'pyramid',
    startDate: '2026-05-11',
    weeks: 6,
    origin: 'coach',
    summary: '',
    insights: [],
    days: [{ key: 'chest-back-a', position: 1, name: 'Chest-Back A', exercises }],
  }]
}

describe('generateDemoHistory', () => {
  it('is deterministic for the same seed and end date', () => {
    const options = { blocks: approvedBlocks, endDate: '2026-10-03', months: 6, seed: 26 }
    expect(generateDemoHistory(options)).toEqual(generateDemoHistory(options))
  })

  it('creates around six months of catalogue workouts only Monday through Saturday', async () => {
    const history = generateDemoHistory({
      blocks: approvedBlocks,
      endDate: '2026-10-03',
      months: 6,
      seed: 26,
    })
    const { exerciseLibrary } = await loadExerciseLibrary()
    const exerciseIds = new Set(exerciseLibrary.map((exercise) => exercise.id))
    const latestDate = history.reduce((latest, entry) => (entry.date > latest ? entry.date : latest), '')

    const sessionDates = new Set(history.map((entry) => entry.date))
    expect(sessionDates.size).toBeGreaterThan(100)
    expect(sessionDates.size).toBeLessThan(180)
    expect(history.length).toBeGreaterThan(600)
    expect(history.every((entry) => exerciseIds.has(entry.exerciseId))).toBe(true)
    expect(history.every((entry) => entry.blockId && entry.dayKey)).toBe(true)
    expect(history.every((entry) => new Date(`${entry.date}T00:00:00Z`).getUTCDay() !== 0)).toBe(true)
    expect(history.every((entry) => entry.date <= '2026-10-03')).toBe(true)
    expect(approvedBlocks.find((block) => blockWeek(block, latestDate) !== null)?.number).toBe(5)
  })

  it('trends loads upward within a block', () => {
    const exercises: TrainingBlock['days'][number]['exercises'] = [{
      code: 'A1',
      position: 1,
      exerciseId: 'barbell-bench-press',
      sets: 3,
      reps: ['10', '10', '10'],
      restSeconds: 90,
      technique: 'straight',
    }]
    const history = generateDemoHistory({
      blocks: testBlock(exercises),
      endDate: '2026-06-21',
      months: 1,
      seed: 'progression',
    })

    expect(history.length).toBeGreaterThan(3)
    expect(history[history.length - 1].sets[0].weight).toBeGreaterThan(history[0].sets[0].weight)
  })

  it('follows ascending and reverse-pyramid rep and load patterns', () => {
    const exercises: TrainingBlock['days'][number]['exercises'] = [
      {
        code: 'A1',
        position: 1,
        exerciseId: 'barbell-bench-press',
        sets: 3,
        reps: ['12', '10', '8'],
        restSeconds: 90,
        technique: 'pyramid',
      },
      {
        code: 'B1',
        position: 2,
        exerciseId: 'barbell-row',
        sets: 3,
        reps: ['8', '10', '12'],
        restSeconds: 90,
        technique: 'reverse-pyramid',
      },
      {
        code: 'C1',
        position: 3,
        exerciseId: 'machine-triceps-extension',
        sets: 2,
        reps: ['12+12', '12+12'],
        restSeconds: 60,
        technique: 'drop-set',
      },
      {
        code: 'D1',
        position: 4,
        exerciseId: 'push-up',
        sets: 2,
        reps: ['10', '10'],
        restSeconds: 60,
        technique: 'straight',
      },
    ]
    const history = generateDemoHistory({
      blocks: testBlock(exercises),
      endDate: '2026-06-21',
      months: 1,
      seed: 'pyramid-patterns',
    })
    const ascending = history.find((entry) => entry.exerciseId === 'barbell-bench-press')!
    const descending = history.find((entry) => entry.exerciseId === 'barbell-row')!
    const dropSet = history.find((entry) => entry.exerciseId === 'machine-triceps-extension')!
    const bodyweight = history.find((entry) => entry.exerciseId === 'push-up')!

    expect(ascending.sets.map((set) => set.reps)).toEqual([12, 10, expect.any(Number)])
    expect(ascending.sets[2].reps).toBeLessThanOrEqual(8)
    expect(ascending.sets[0].weight).toBeLessThan(ascending.sets[1].weight)
    expect(ascending.sets[1].weight).toBeLessThan(ascending.sets[2].weight)
    expect(descending.sets.map((set) => set.reps)).toEqual([8, 10, expect.any(Number)])
    expect(descending.sets[2].reps).toBeLessThanOrEqual(12)
    expect(descending.sets[0].weight).toBeGreaterThan(descending.sets[1].weight)
    expect(descending.sets[1].weight).toBeGreaterThan(descending.sets[2].weight)
    expect(dropSet.sets.map((set) => set.reps)).toEqual([12, expect.any(Number)])
    expect(dropSet.sets[1].reps).toBeLessThanOrEqual(12)
    expect(dropSet.sets[0].drop).toEqual({ reps: 12, weight: expect.any(Number) })
    expect(dropSet.sets).toHaveLength(2)
    expect(bodyweight.sets.every((set) => set.weight === 0)).toBe(true)
  })

  it('records the planned block and day for a Block 2 drop-set exercise', () => {
    const dropSetEntry = generateDemoHistory({
      blocks: approvedBlocks,
      endDate: '2026-05-10',
      months: 2,
      seed: 'block-day-drop-set',
    }).find((entry) =>
      entry.blockId === 'block-2026-03-30-hypertrophy-reverse-pyramid' &&
      entry.dayKey === 'chest-back-a' &&
      entry.exerciseId === 'wide-grip-chest-press'
    )

    expect(dropSetEntry).toBeDefined()
    expect(dropSetEntry?.sets[0]).toMatchObject({
      reps: 12,
      drop: { reps: 12 },
    })
  })
})
