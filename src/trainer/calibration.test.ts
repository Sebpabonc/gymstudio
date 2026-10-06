// PT-approved calibration test cases (continuous-learning spec, section 5).
import { describe, expect, it } from 'vitest'
import { computeCalibration, effectiveRir, exposureResidual, fatigueFlag, roundHalf, speedTier, type Exposure } from './calibration'
import { roundToStep } from './engine'

const TODAY = '2026-10-14'
const dayMinus = (days: number) => new Date(Date.parse(`${TODAY}T00:00:00Z`) - days * 86_400_000).toISOString().slice(0, 10)

/** Exposure whose residual is exactly `d` (target 8 @ 2 RIR at 75 kg, reps = 8 + d). */
const exp = (d: number, age: number, extra: Partial<Exposure> = {}): Exposure => ({
  date: dayMinus(age),
  exerciseId: 'barbell-bench-press',
  pattern: 'push horizontal',
  bucket: 'straight',
  weightRecommended: 75,
  repsTarget: 8,
  rirTarget: 2,
  sets: [{ weight: 75, reps: 8 + d }],
  ...extra,
})
const ages = (n: number) => Array.from({ length: n }, (_, i) => i * 7)
const target = { exerciseId: 'barbell-bench-press', pattern: 'push horizontal', bucket: 'straight' as const }

/** Spec setup: e1RM 100, 8 reps, step 2.5 rounded down, guardrail from last 75 → max 80. */
const calibratedLoad = (oneRepMax: number, offset: number, lastLoad = 75) => {
  const rir = effectiveRir(2, offset)
  const raw = roundToStep(oneRepMax / (1 + (8 + rir) / 30), 2.5, 'down')
  const cap = roundToStep(lastLoad + Math.max(2.5, Math.min(lastLoad * 0.1, 5)), 2.5, 'down')
  return Math.min(raw, cap)
}

describe('per-user calibration', () => {
  it('C1 six exposures +2 → O +2, load 77.5', () => {
    const c = computeCalibration(ages(6).map((age) => exp(2, age)), TODAY, target)
    expect(c.offset).toBe(2)
    expect(calibratedLoad(100, c.offset)).toBe(77.5)
  })
  it('C2 four exposures +2 → ramp 50 % → O +1, load 75', () => {
    const c = computeCalibration(ages(4).map((age) => exp(2, age)), TODAY, target)
    expect(c).toMatchObject({ offset: 1, early: true })
    expect(calibratedLoad(100, c.offset)).toBe(75)
  })
  it('C3 three exposures → no calibration', () => {
    expect(computeCalibration(ages(3).map((age) => exp(4, age)), TODAY, target).offset).toBe(0)
  })
  it('C4 six exposures −2 → O −2, load 70', () => {
    const c = computeCalibration(ages(6).map((age) => exp(-2, age)), TODAY, target)
    expect(c.offset).toBe(-2)
    expect(calibratedLoad(100, c.offset)).toBe(70)
  })
  it('C5 residuals clamp at +5 per set and O at +3; rir_eff 0 → 77.5', () => {
    const c = computeCalibration(ages(6).map((age) => exp(7, age)), TODAY, target)
    expect(c.offset).toBe(3)
    expect(effectiveRir(2, c.offset)).toBe(0)
    expect(calibratedLoad(100, c.offset)).toBe(77.5)
  })
  it('C6 guardrail applies last → 80', () => {
    expect(calibratedLoad(120, 2)).toBe(80)
  })
  it('C7 decay: recent +3 and 6-week-old 0 → O +2', () => {
    const list = [...[0, 2, 4].map((age) => exp(3, age)), ...[42, 44, 46].map((age) => exp(0, age))]
    // Ages 2/4 and 44/46 keep weights ≈ 1 and ≈ 0.5 as in the spec example.
    expect(computeCalibration(list, TODAY, target).offset).toBe(2)
  })
  it('C8 logged RIR counts: 60 × 10 @ RIR 4 vs target 10 @ 2 → +2', () => {
    expect(exposureResidual({ ...exp(0, 0), weightRecommended: 60, repsTarget: 10, sets: [{ weight: 60, reps: 10, rir: 4 }] })).toBe(2)
  })
  it('C9 kept original heavier: 65 × 8 vs 60 × 8 target → +3.17', () => {
    expect(exposureResidual({ ...exp(0, 0), weightRecommended: 60, sets: [{ weight: 65, reps: 8 }] })).toBeCloseTo(3.17, 2)
  })
  it('C10 deload and double-angle exposures are excluded → O 0', () => {
    const list = ages(6).map((age, i) => exp(2, age, { excluded: i < 3 }))
    expect(computeCalibration(list, TODAY, target).offset).toBe(0)
  })
  it('C11 falls back to the movement-pattern scope → O +1', () => {
    // 2 exposures on this exercise (n < 4) + 4 on another horizontal press: pattern scope has 6 at +1.
    const list = [
      ...[0, 7].map((age) => exp(1, age)),
      ...[14, 21, 28, 35].map((age) => exp(1, age, { exerciseId: 'dumbbell-bench-press' })),
    ]
    const c = computeCalibration(list, TODAY, target)
    expect(c).toMatchObject({ scope: 'pattern-bucket', offset: 1 })
    expect(calibratedLoad(100, c.offset)).toBe(75)
  })
  it('C12 technique buckets learn separately: reverse pyramid −1, straight +2', () => {
    const list = [
      ...ages(6).map((age) => exp(2, age)),
      ...ages(5).map((age) => exp(-1, age + 1, { bucket: 'reverse-pyramid' })),
    ]
    expect(computeCalibration(list, TODAY, { ...target, bucket: 'reverse-pyramid' }).offset).toBe(-1)
    expect(computeCalibration(list, TODAY, target).offset).toBe(2)
    expect(roundHalf(-0.75)).toBe(-1)
  })
  it('C14 fatigue: 12, 10, 8 at one load → flag on', () => {
    const list = ages(4).map((age) => exp(0, age, { sets: [{ weight: 75, reps: 12 }, { weight: 75, reps: 10 }, { weight: 75, reps: 8 }] }))
    expect(fatigueFlag(list, TODAY)).toBe(true)
  })
  it('C15 hits in 2 of 6 → steady tier', () => {
    const list = ages(6).map((age, i) => exp(i >= 4 ? 0 : -2, age)) // hits are the 2 oldest → weighted H ≈ 0.3
    expect(speedTier(list, TODAY)).toBe('steady')
  })
  it('C17 paused for the first 2 sessions after a 35-day break', () => {
    const old = ages(6).map((age) => exp(2, age + 40))
    expect(computeCalibration(old, TODAY, target).offset).toBe(0)
    const oneBack = [...old, exp(2, 3)]
    expect(computeCalibration(oneBack, TODAY, target).offset).toBe(0)
    const twoBack = [...oneBack, exp(2, 1)]
    expect(computeCalibration(twoBack, TODAY, target).offset).not.toBe(0)
  })
})
