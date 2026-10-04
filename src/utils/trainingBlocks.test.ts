import { describe, expect, it } from 'vitest'
import { TrainingBlock, WorkoutEntry } from '../types'
import {
  blockDateRange,
  blockWeek,
  defaultActiveBlock,
  formatBenchAngle,
  formatBlockMethod,
  nextUnloggedDay,
  trainingBlockDateStatus,
} from './trainingBlocks'

const blocks: TrainingBlock[] = [
  {
    id: 'block-5',
    number: 5,
    name: 'Block Five',
    method: 'reverse-pyramid',
    startDate: '2026-08-17',
    weeks: 6,
    origin: 'coach',
    summary: '',
    insights: [],
    days: [],
  },
  {
    id: 'block-6',
    number: 6,
    name: 'Hypertrophy Flat Pyramid II',
    method: 'flat-pyramid',
    startDate: '2026-10-05',
    weeks: 6,
    origin: 'pt',
    summary: '',
    insights: [],
    days: [],
  },
]

describe('training block dates', () => {
  it('formats method slugs as title-case labels', () => {
    expect(formatBlockMethod('reverse-pyramid')).toBe('Reverse Pyramid')
    expect(formatBlockMethod('flat-pyramid')).toBe('Flat Pyramid')
    expect(formatBlockMethod('strength_hypertrophy')).toBe('Strength Hypertrophy')
    expect(formatBlockMethod('  DUP   training ')).toBe('DUP Training')
    expect(formatBlockMethod('')).toBe('')
    expect(formatBlockMethod('reverse-pyramid', 'es')).toBe('Pirámide inversa')
  })

  it('selects the next block during a gap when it starts within a week', () => {
    expect(defaultActiveBlock(blocks, '2026-10-03')?.id).toBe('block-6')
  })

  it('selects a block containing today and switches at the six-week boundary', () => {
    expect(defaultActiveBlock(blocks, '2026-09-27')?.id).toBe('block-5')
    expect(defaultActiveBlock(blocks, '2026-10-05')?.id).toBe('block-6')
  })

  it('selects the earliest block before the programme begins', () => {
    expect(defaultActiveBlock(blocks, '2026-01-01')?.id).toBe('block-5')
  })

  it('uses the latest block when all blocks are finished', () => {
    expect(defaultActiveBlock(blocks, '2027-01-01')?.id).toBe('block-6')
    expect(defaultActiveBlock([], '2026-10-03')).toBeNull()
  })

  it('labels blocks only by their date range', () => {
    expect(trainingBlockDateStatus(blocks[0], '2026-09-27')).toBe('Current')
    expect(trainingBlockDateStatus(blocks[0], '2026-09-28')).toBe('Completed')
    expect(trainingBlockDateStatus(blocks[1], '2026-10-03')).toBe('Upcoming')
  })

  it('returns the one-based week only inside the block range', () => {
    const block = blocks[1]
    expect(blockWeek(block, '2026-10-04')).toBeNull()
    expect(blockWeek(block, '2026-10-05')).toBe(1)
    expect(blockWeek(block, '2026-11-15')).toBe(6)
    expect(blockWeek(block, '2026-11-16')).toBeNull()
  })

  it('formats an inclusive six-week date range in English', () => {
    expect(blockDateRange(blocks[1])).toBe('5 Oct – 15 Nov 2026')
    expect(blockDateRange(blocks[1], 'es')).toBe('5 oct – 15 nov 2026')
  })
})

describe('next unlogged training day', () => {
  const block: TrainingBlock = {
    ...blocks[1],
    days: [
      {
        key: 'day-2',
        position: 2,
        name: 'Arms A',
        exercises: [{ exerciseId: 'curl', code: 'A1', position: 1, sets: 1, reps: ['8'], restSeconds: 60, technique: 'straight' }],
      },
      {
        key: 'day-1',
        position: 1,
        name: 'Chest-Back A',
        exercises: [
          { exerciseId: 'press', code: 'A1', position: 1, sets: 1, reps: ['8'], restSeconds: 60, technique: 'straight' },
          { exerciseId: 'row', code: 'B1', position: 2, sets: 1, reps: ['8'], restSeconds: 60, technique: 'straight' },
        ],
      },
    ],
  }
  const entry = (exerciseId: string, dayKey: string, date: string, blockId = block.id): WorkoutEntry => ({
    id: `${exerciseId}-${date}`,
    exerciseId,
    dayKey,
    blockId,
    date,
    sets: [{ id: 'set', reps: 8, weight: 20 }],
  })

  it('selects the first incomplete day in position order for the current block week', () => {
    const history = [
      entry('press', 'day-1', '2026-10-05'),
      entry('row', 'day-1', '2026-10-08'),
    ]

    expect(nextUnloggedDay(block, history, '2026-10-08')?.key).toBe('day-2')
    expect(nextUnloggedDay(block, history.slice(0, 1), '2026-10-08')?.key).toBe('day-1')
  })

  it('ignores logs outside the week or from another block and falls back to day one', () => {
    const history = [
      entry('press', 'day-1', '2026-10-05'),
      entry('curl', 'day-2', '2026-10-07', 'other-block'),
    ]

    expect(nextUnloggedDay(block, history, '2026-10-12')?.key).toBe('day-1')
  })

  it('uses the upcoming block first week and repeats the sequence after all days are logged', () => {
    const weekHistory = [
      entry('press', 'day-1', '2026-10-05'),
      entry('row', 'day-1', '2026-10-06'),
      entry('curl', 'day-2', '2026-10-07'),
    ]

    expect(nextUnloggedDay(block, [], '2026-10-04')?.key).toBe('day-1')
    expect(nextUnloggedDay(block, weekHistory, '2026-10-08')?.key).toBe('day-1')
  })
})

describe('bench angle labels', () => {
  it('formats flat, incline, upright, and decline angles', () => {
    expect(formatBenchAngle(0)).toBe('Flat bench')
    expect(formatBenchAngle(30)).toBe('Incline 30°')
    expect(formatBenchAngle(90)).toBe('Upright seat')
    expect(formatBenchAngle(-15)).toBe('Decline 15°')
    expect(formatBenchAngle(30, 'es')).toBe('Inclinado 30°')
  })

  it('omits a label when the angle is not set', () => {
    expect(formatBenchAngle(null)).toBeNull()
    expect(formatBenchAngle(undefined)).toBeNull()
  })
})

describe('defaultActiveBlock between blocks', () => {
  const day = { key: 'd1', position: 1, focus: 'Push', exercises: [] }
  const block = (id: string, startDate: string) =>
    ({ id, startDate, weeks: 1, days: [day] }) as unknown as import('../types').TrainingBlock

  it('prefers the block starting within a week over the one that just ended', () => {
    const blocks = [block('b5', '2026-09-21'), block('b6', '2026-10-05')]
    expect(defaultActiveBlock(blocks, '2026-10-04')?.id).toBe('b6')
  })

  it('keeps the last started block when the next one is more than a week away', () => {
    const blocks = [block('b5', '2026-09-01'), block('b6', '2026-10-20')]
    expect(defaultActiveBlock(blocks, '2026-10-04')?.id).toBe('b5')
  })
})
