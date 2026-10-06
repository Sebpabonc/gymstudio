import { describe, expect, it } from 'vitest'
import { buildExposures } from './exposures'
import type { WorkoutEntry } from '../types'
import type { TrainerRecommendationRow } from '../utils/profileData'

const row = (id: string, entryId: string, extra: Partial<TrainerRecommendationRow> = {}): TrainerRecommendationRow => ({
  id, exerciseId: 'barbell-bench-press', date: '2026-10-07',
  original: { weight: 75, reps: { min: 8, max: 8 }, sets: 3 },
  recommended: { weight: 75, reps: { min: 8, max: 8 }, sets: 3 },
  action: 'maintain', reason: 'within_range', confidence: 'medium', evidence: {}, status: 'accepted', resultEntryId: entryId,
  ...extra,
})
const entry = (id: string, reps: number[]): WorkoutEntry => ({
  id, exerciseId: 'barbell-bench-press', date: '2026-10-07', sets: reps.map((r, i) => ({ id: `${id}-${i}`, weight: 75, reps: r })),
})
const catalogue = [{ id: 'barbell-bench-press', movementPattern: 'push horizontal', equipment: 'barbell' }]

describe('buildExposures', () => {
  it('links recommendations to their logged result', () => {
    const [exposure] = buildExposures([row('r1', 'e1')], [entry('e1', [10, 10, 10])], [], catalogue)
    expect(exposure).toMatchObject({ weightRecommended: 75, repsTarget: 8, pattern: 'push horizontal', bucket: 'straight' })
    expect(exposure.excluded).toBeUndefined()
  })
  it('marks incomplete sessions and long-break reductions as excluded, and skips missing results', () => {
    const list = buildExposures(
      [row('r1', 'e1'), row('r2', 'e2', { reason: 'long_break' }), row('r3', 'missing')],
      [entry('e1', [10, 10]), entry('e2', [10, 10, 10])],
      [],
      catalogue
    )
    expect(list).toHaveLength(2)
    expect(list.every((exposure) => exposure.excluded)).toBe(true)
  })

  it('pyramid exposures use the heaviest set at 1 RIR: exactly as predicted contributes 0', async () => {
    const { exposureResidual } = await import('./calibration')
    const pyramidEntry: WorkoutEntry = {
      id: 'p1', exerciseId: 'barbell-bench-press', date: '2026-10-07',
      target: { sets: 3, reps: { min: 10, max: 14 }, technique: 'pyramid' },
      sets: [{ id: 'a', weight: 24, reps: 14 }, { id: 'b', weight: 26, reps: 12 }, { id: 'c', weight: 28, reps: 10 }],
    }
    const [exposure] = buildExposures(
      [row('r', 'p1', { recommended: { weight: 28, reps: { min: 10, max: 14 }, sets: 3 } })],
      [pyramidEntry], [], catalogue
    )
    expect(exposure.sets).toEqual([{ weight: 28, reps: 10, rirTarget: 1 }])
    expect(exposureResidual({ ...exposure, sets: [{ ...exposure.sets[0], rir: 1 }] })).toBe(0)
  })
})
