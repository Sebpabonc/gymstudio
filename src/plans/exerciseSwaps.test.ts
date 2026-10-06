import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { activeSwaps, applySwaps, suggestAlternatives } from './exerciseSwaps'
import type { TrainingBlock } from '../types'

const dir = 'docs/fitness/approved/catalogue-v2'
const catalogue = readdirSync(dir)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')) as Array<Record<string, any>>)
  .map((row) => ({
    id: row.id as string,
    primaryMuscle: row.primary_muscles[0] as string,
    secondaryMuscles: row.secondary_muscles as string[],
    equipment: row.equipment as string,
    mechanic: row.mechanic,
    movementPattern: row.movement_pattern as string,
  }))
const byId = (id: string) => catalogue.find((exercise) => exercise.id === id)!

describe('suggestAlternatives', () => {
  it('only suggests exercises for the same primary muscle, preferring the same movement', () => {
    const original = byId('smith-machine-shoulder-press')
    const alternatives = suggestAlternatives(original, catalogue)
    expect(alternatives).toHaveLength(3)
    for (const alternative of alternatives) {
      expect(alternative.primaryMuscle).toBe(original.primaryMuscle)
      expect(alternative.id).not.toBe(original.id)
    }
    expect(alternatives[0].movementPattern).toBe(original.movementPattern)
  })

  it('skips exercises already in the day', () => {
    const original = byId('smith-machine-shoulder-press')
    const [first] = suggestAlternatives(original, catalogue)
    expect(suggestAlternatives(original, catalogue, [first.id]).map((item) => item.id)).not.toContain(first.id)
  })
})

describe('applySwaps', () => {
  const block = {
    id: 'b', days: [{ key: 'arms-a', position: 1, name: 'A', exercises: [
      { code: 'A1', position: 1, exerciseId: 'smith-machine-shoulder-press', sets: 3, reps: ['8'], restSeconds: 150, technique: 'straight', angleDegrees: 75 },
    ] }],
  } as unknown as TrainingBlock

  it('today-only swaps apply on that date and win over permanent ones', () => {
    const swaps = [
      { fromExerciseId: 'a', toExerciseId: 'b', scope: 'always' as const },
      { fromExerciseId: 'a', toExerciseId: 'c', scope: 'today' as const, date: '2026-10-06' },
    ]
    expect(activeSwaps(swaps, '2026-10-06').get('a')).toBe('c')
    expect(activeSwaps(swaps, '2026-10-07').get('a')).toBe('b')
  })

  it('replaces the exercise, keeps sets/reps/rest and drops the old bench angle', () => {
    const [day] = applySwaps([block], new Map([['smith-machine-shoulder-press', 'dumbbell-shoulder-press']]))[0].days
    expect(day.exercises[0]).toMatchObject({ exerciseId: 'dumbbell-shoulder-press', swappedFrom: 'smith-machine-shoulder-press', sets: 3, restSeconds: 150 })
    expect(day.exercises[0].angleDegrees).toBeUndefined()
  })
})
