import { describe, expect, it } from 'vitest'
import type { TrainingBlock, WorkoutEntry } from '../types'
import { buildEvidence } from './evidence'

const blocks: TrainingBlock[] = [{
  id: 'block-1',
  number: 1,
  name: 'Block',
  method: 'straight',
  startDate: '2026-10-01',
  weeks: 6,
  origin: 'pt',
  summary: '',
  insights: [],
  days: [
    {
      key: 'day-a',
      position: 1,
      name: 'Day A',
      exercises: [{ code: 'A1', position: 1, exerciseId: 'press', sets: 3, reps: ['10'], restSeconds: 90, technique: 'straight' }],
    },
    {
      key: 'day-b',
      position: 2,
      name: 'Day B',
      exercises: [{ code: 'B1', position: 1, exerciseId: 'press', sets: 3, reps: ['12+12'], restSeconds: 90, technique: 'drop-set' }],
    },
  ],
}]

const entry = (id: string, date: string, dayKey: string, target?: WorkoutEntry['target']): WorkoutEntry => ({
  id,
  exerciseId: 'press',
  date,
  blockId: 'block-1',
  dayKey,
  sets: [{ id: `${id}-set`, weight: 10, reps: 14 }],
  ...(target ? { target } : {}),
})

describe('buildEvidence', () => {
  it('includes different training days, newest first, and excludes today being edited', () => {
    const evidence = buildEvidence([
      entry('monday', '2026-10-05', 'day-a'),
      entry('today', '2026-10-08', 'day-b'),
      entry('thursday', '2026-10-08', 'day-a'),
    ], 'press', blocks, '2026-10-08')

    expect(evidence).toHaveLength(1)
    expect(evidence[0]).toMatchObject({
      date: '2026-10-05',
      target: { min: 10, max: 10 },
      sets: [{ weight: 10, reps: 14 }],
    })
  })

  it('prefers the target saved with an entry over its block prescription', () => {
    const evidence = buildEvidence([
      entry('logged-target', '2026-10-05', 'day-a', {
        sets: 3,
        reps: { min: 8, max: 10 },
        weight: 10,
      }),
    ], 'press', blocks, '2026-10-08')

    expect(evidence[0]?.target).toEqual({ min: 8, max: 10 })
  })

  it('derives drop-set targets from the plan and returns 12 for 12+12', () => {
    const evidence = buildEvidence([
      entry('drop-set', '2026-10-05', 'day-b'),
    ], 'press', blocks, '2026-10-08')

    expect(evidence[0]?.target).toEqual({ min: 12, max: 12 })
  })

  it('preserves a reported zero RIR in trainer evidence', () => {
    const logged = entry('rir', '2026-10-05', 'day-a')
    logged.sets[0].rir = 0

    expect(buildEvidence([logged], 'press', blocks, '2026-10-08')[0]?.sets[0]?.rir).toBe(0)
  })
})

describe('same-day evidence across day slots', () => {
  it('keeps another day done today (D2 today feeds D5 today) but drops the slot being edited', () => {
    const doneToday = { ...entry('d2', '2026-10-08', 'day-a') }
    expect(buildEvidence([doneToday], 'press', blocks, '2026-10-08', 'day-b')).toHaveLength(1)
    expect(buildEvidence([doneToday], 'press', blocks, '2026-10-08', 'day-a')).toHaveLength(0)
  })
})
