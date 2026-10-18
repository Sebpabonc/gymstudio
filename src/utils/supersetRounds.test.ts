import { describe, expect, it } from 'vitest'
import { completedSupersetRounds, createSupersetTicks, nextSupersetFocus, toggleSupersetTick } from './supersetRounds'
import { createSupersetEntries, getLoggedSupersetRounds } from './supersets'

describe('superset round ticks', () => {
  it('hands off a pair without completing the half-ticked round', () => {
    const counts = [3, 3]
    const ticks = toggleSupersetTick(createSupersetTicks(counts, []), counts, { round: 0, exercise: 0 })
    expect(completedSupersetRounds(ticks)).toEqual([false, false, false])
    expect(nextSupersetFocus(ticks, counts, { round: 0, exercise: 0 })).toEqual({ round: 0, exercise: 1 })
    const complete = toggleSupersetTick(ticks, counts, { round: 0, exercise: 1 })
    expect(completedSupersetRounds(complete)).toEqual([true, false, false])
    expect(nextSupersetFocus(complete, counts, { round: 0, exercise: 1 })).toEqual({ round: 1, exercise: 0 })
    expect(completedSupersetRounds(toggleSupersetTick(complete, counts, { round: 0, exercise: 0 }))[0]).toBe(false)
    expect(ticks[0]).toEqual([true, false])
  })

  it('supports three exercises and skips exercises with fewer sets', () => {
    const counts = [1, 3, 2]
    let ticks = createSupersetTicks(counts, [true])
    expect(ticks).toEqual([[true, true, true], [true, false, false], [true, false, true]])
    ticks = toggleSupersetTick(ticks, counts, { round: 1, exercise: 1 })
    expect(nextSupersetFocus(ticks, counts, { round: 1, exercise: 1 })).toEqual({ round: 1, exercise: 2 })
    ticks = toggleSupersetTick(ticks, counts, { round: 1, exercise: 2 })
    expect(nextSupersetFocus(ticks, counts, { round: 1, exercise: 2 })).toEqual({ round: 2, exercise: 1 })
    ticks = toggleSupersetTick(ticks, counts, { round: 2, exercise: 1 })
    expect(completedSupersetRounds(ticks)).toEqual([true, true, true])
    expect(nextSupersetFocus(ticks, counts, { round: 2, exercise: 1 })).toBeUndefined()
    expect(toggleSupersetTick(ticks, counts, { round: 2, exercise: 0 })).toBe(ticks)
    expect(createSupersetTicks([], [])).toEqual([])
  })

  it('hands off each exercise of a triple and completes only after the third tick', () => {
    const counts = [1, 1, 1]
    let ticks = createSupersetTicks(counts, [])
    for (let exercise = 0; exercise < 3; exercise++) {
      ticks = toggleSupersetTick(ticks, counts, { round: 0, exercise })
      expect(completedSupersetRounds(ticks)).toEqual([exercise === 2])
      expect(nextSupersetFocus(ticks, counts, { round: 0, exercise })).toEqual(
        exercise === 2 ? undefined : { round: 0, exercise: exercise + 1 }
      )
    }
  })

  it('keeps pyramid loads, timestamps, notes and saved entry shape identical', () => {
    const inputs = [
      { exerciseId: 'press', notes: 'note', sets: [24, 26, 28].map((weight, index) => ({
        id: `p${index}`, weight, reps: 12 - index * 2, at: 1000 + index,
      })) },
      { exerciseId: 'row', notes: '', sets: [40, 45, 50].map((weight, index) => ({
        id: `r${index}`, weight, reps: 12 - index * 2, at: 1000 + index,
      })) },
    ]
    const counts = inputs.map((input) => input.sets.length)
    let ticks = createSupersetTicks(counts, [])
    counts.forEach((count, exercise) => {
      for (let round = 0; round < count; round++) ticks = toggleSupersetTick(ticks, counts, { round, exercise })
    })
    const rows = completedSupersetRounds(ticks)
    const scope = { date: '2026-10-10', blockId: 'block-6', dayKey: 'chest-a' }
    expect(createSupersetEntries(inputs.map((input) => ({
      ...input, sets: input.sets.filter((_, index) => rows[index]),
    })), scope, () => 'entry')).toEqual(createSupersetEntries(inputs, scope, () => 'entry'))
    expect(getLoggedSupersetRounds(counts, 3)).toEqual(rows)
  })
})
