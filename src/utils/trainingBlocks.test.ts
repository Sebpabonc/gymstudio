import { describe, expect, it } from 'vitest'
import { TrainingBlock } from '../types'
import { blockDateRange, blockWeek, defaultActiveBlock, formatBenchAngle } from './trainingBlocks'

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
  it('selects the upcoming block during the gap before block 6', () => {
    expect(defaultActiveBlock(blocks, '2026-10-03')?.id).toBe('block-6')
  })

  it('selects a block containing today and switches at the six-week boundary', () => {
    expect(defaultActiveBlock(blocks, '2026-09-27')?.id).toBe('block-5')
    expect(defaultActiveBlock(blocks, '2026-10-05')?.id).toBe('block-6')
  })

  it('uses the latest block when all blocks are finished', () => {
    expect(defaultActiveBlock(blocks, '2027-01-01')?.id).toBe('block-6')
    expect(defaultActiveBlock([], '2026-10-03')).toBeNull()
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
  })
})

describe('bench angle labels', () => {
  it('formats flat, incline, upright, and decline angles', () => {
    expect(formatBenchAngle(0)).toBe('Flat bench')
    expect(formatBenchAngle(30)).toBe('Incline 30°')
    expect(formatBenchAngle(90)).toBe('Upright seat')
    expect(formatBenchAngle(-15)).toBe('Decline 15°')
  })

  it('omits a label when the angle is not set', () => {
    expect(formatBenchAngle(null)).toBeNull()
    expect(formatBenchAngle(undefined)).toBeNull()
  })
})
