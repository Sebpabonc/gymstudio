// Per-user live calibration (PT-approved spec docs/fitness/approved/2026-10-07-continuous-learning-spec.md,
// section 1, test cases C1–C17). Pure and deterministic: the same exposures always give the same offset.
// Calibration only changes the reps-in-reserve read by the load formula (rir_eff); rules, guardrails, deload,
// steps and the max increase are never touched (C-rule 7).

export type TechniqueBucket = 'straight' | 'reverse-pyramid' | 'ascending-pyramid' | 'intensity'

export type Exposure = {
  date: string
  exerciseId: string
  /** Catalogue movement pattern (scope fallback). */
  pattern?: string
  bucket: TechniqueBucket
  /** Engine target: recommended weight, reps and intended reps in reserve. */
  weightRecommended: number
  repsTarget: number
  rirTarget: number
  /** Progression sets as logged. */
  sets: Array<{ weight: number; reps: number; rir?: number }>
  /** Deload, double-angle follower, incomplete (R6), return-after-break, bodyweight without load. */
  excluded?: boolean
}

export type Scope = 'exercise-bucket' | 'exercise' | 'pattern-bucket' | 'pattern' | 'user'

export type Calibration = {
  offset: number
  exposures: number
  scope: Scope | null
  /** n 4-5 = "early read" (spec 1.10). */
  early: boolean
}

const HALF_LIFE_DAYS = 42
const DROP_AFTER_DAYS = 120
const MIN_EXPOSURES = 4
const USER_WIDE_MIN = 6
const OFFSET_LIMIT = 3
const SET_RESIDUAL_LIMIT = 5
const BREAK_DAYS = 28

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export function bucketFor(technique?: string): TechniqueBucket {
  if (technique === 'reverse-pyramid') return 'reverse-pyramid'
  if (technique === 'pyramid') return 'ascending-pyramid'
  if (technique === 'drop-set') return 'intensity'
  return 'straight'
}

/** Spec 1.1: mean per-set residual (reps the user had vs reps expected), each set clamped to ±5. */
export function exposureResidual(exposure: Exposure) {
  const { weightRecommended: wRec, repsTarget: rTgt, rirTarget: rirTgt } = exposure
  const residuals = exposure.sets.map((set) => {
    let repsEquivalent = set.reps
    if (set.weight !== wRec && wRec > 0 && set.weight > 0) {
      const oneRepMax = set.weight * (1 + set.reps / 30)
      repsEquivalent = 30 * (oneRepMax / wRec) - 30
    }
    const d = set.rir !== undefined ? repsEquivalent + set.rir - (rTgt + rirTgt) : repsEquivalent - rTgt
    return clamp(d, -SET_RESIDUAL_LIMIT, SET_RESIDUAL_LIMIT)
  })
  return residuals.length ? residuals.reduce((sum, value) => sum + value, 0) / residuals.length : 0
}

export const decayWeight = (ageDays: number) => Math.pow(0.5, ageDays / HALF_LIFE_DAYS)

/** Nearest 0.5, halves away from zero (spec D2, C12). */
export function roundHalf(value: number) {
  const doubled = value * 2
  const rounded = Math.sign(doubled) * Math.round(Math.abs(doubled))
  return rounded / 2 || 0
}

function spreadOk(exposures: Exposure[]) {
  const dates = [...new Set(exposures.map((exposure) => exposure.date))].sort()
  return dates.length >= 3 && daysBetween(dates[0], dates[dates.length - 1]) >= 10
}

/** Usable exposures: not excluded, not older than 120 days, and not inside a pause after a long break (C-rule 8). */
function eligible(exposures: Exposure[], today: string) {
  const usable = exposures
    .filter((exposure) => !exposure.excluded)
    .filter((exposure) => {
      const age = daysBetween(exposure.date, today)
      return age >= 0 && age <= DROP_AFTER_DAYS
    })
  return usable
}

/** C-rule 8: after a break of more than 28 days, calibration pauses for the first 2 sessions back. */
export function pausedAfterBreak(sessionDates: string[], today: string) {
  const dates = [...new Set(sessionDates)].filter((date) => date <= today).sort()
  const timeline = [...dates, today]
  for (let i = timeline.length - 1; i > 0; i -= 1) {
    if (daysBetween(timeline[i - 1], timeline[i]) > BREAK_DAYS) {
      const sessionsBack = dates.filter((date) => date >= timeline[i]).length
      return sessionsBack < 2
    }
  }
  return false
}

function offsetFor(exposures: Exposure[], today: string) {
  const weights = exposures.map((exposure) => decayWeight(daysBetween(exposure.date, today)))
  const total = weights.reduce((sum, value) => sum + value, 0)
  const raw = exposures.reduce((sum, exposure, index) => sum + weights[index] * exposureResidual(exposure), 0) / total
  const ramp = Math.min(1, (exposures.length - 2) / 4)
  return roundHalf(clamp(raw * ramp, -OFFSET_LIMIT, OFFSET_LIMIT))
}

/** Spec 1.2–1.4: personal offset O from the most specific scope with enough evidence. */
export function computeCalibration(
  exposures: Exposure[],
  today: string,
  target: { exerciseId: string; pattern?: string; bucket: TechniqueBucket },
  sessionDates: string[] = exposures.map((exposure) => exposure.date)
): Calibration {
  const none: Calibration = { offset: 0, exposures: 0, scope: null, early: false }
  if (pausedAfterBreak(sessionDates, today)) return none
  const usable = eligible(exposures, today)
  const scopes: Array<[Scope, Exposure[], number]> = [
    ['exercise-bucket', usable.filter((e) => e.exerciseId === target.exerciseId && e.bucket === target.bucket), MIN_EXPOSURES],
    ['exercise', usable.filter((e) => e.exerciseId === target.exerciseId), MIN_EXPOSURES],
    ['pattern-bucket', target.pattern ? usable.filter((e) => e.pattern === target.pattern && e.bucket === target.bucket) : [], MIN_EXPOSURES],
    ['pattern', target.pattern ? usable.filter((e) => e.pattern === target.pattern) : [], MIN_EXPOSURES],
    ['user', usable, USER_WIDE_MIN],
  ]
  for (const [scope, list, minimum] of scopes) {
    if (list.length >= minimum && spreadOk(list)) {
      return { offset: offsetFor(list, today), exposures: list.length, scope, early: list.length < 6 }
    }
  }
  return none
}

/** Spec 1.3: the only input calibration changes. */
export function effectiveRir(rirTarget: number, offset: number) {
  return clamp(rirTarget - offset, 0, rirTarget + 3)
}

/** Spec 1.5: "steady" tier when the decay-weighted hit rate is below 40 % (needs 6 exposures). */
export function speedTier(exposures: Exposure[], today: string): 'normal' | 'steady' {
  const usable = eligible(exposures, today)
  if (usable.length < 6) return 'normal'
  let hits = 0
  let total = 0
  for (const exposure of usable) {
    const weight = decayWeight(daysBetween(exposure.date, today))
    const hit = exposure.sets.every((set) => set.weight !== exposure.weightRecommended
      ? exposureResidual({ ...exposure, sets: [set] }) >= 0
      : set.reps >= exposure.repsTarget)
    hits += hit ? weight : 0
    total += weight
  }
  return total > 0 && hits / total < 0.4 ? 'steady' : 'normal'
}

/** Spec 1.6: reps lost per set on straight sets at one load; F ≥ 1.5 flags fast fatigue (never lowers loads). */
export function fatigueFlag(exposures: Exposure[], today: string) {
  const usable = eligible(exposures, today).filter((exposure) =>
    exposure.bucket === 'straight' && exposure.sets.length > 1 && new Set(exposure.sets.map((set) => set.weight)).size === 1)
  if (usable.length < 4) return false
  let sum = 0
  let total = 0
  for (const exposure of usable) {
    const first = exposure.sets[0].reps
    const last = exposure.sets[exposure.sets.length - 1].reps
    const weight = decayWeight(daysBetween(exposure.date, today))
    sum += weight * ((first - last) / (exposure.sets.length - 1))
    total += weight
  }
  return sum / total >= 1.5
}
