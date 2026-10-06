// AI Trainer progression engine. Implements the PT-approved spec
// docs/fitness/approved/2026-10-07-progression-engine-spec.md (rules R1–R11, test cases T1–T29).
// The PT owns these rules; change them only through an approved PT spec with test cases.
// Pure functions: the LLM never chooses numbers — it only explains the structured recommendation returned here.

export type SetTag = 'main' | 'mini' | 'partial'

export type LoggedSet = {
  weight: number
  reps: number
  tag?: SetTag
  rir?: number
  drop?: { weight: number; reps: number }
}

export type RepRange = { min: number; max: number }

/** One past session of the exercise (any day of the program) and what the plan asked that day, if known. */
export type SessionEvidence = {
  date: string
  sets: LoggedSet[]
  target?: RepRange
  /** Planned technique and per-set reps of that session (pyramids). */
  technique?: string
  setReps?: number[]
  /** Week-6 deload session (R4) — excluded from capacity and "missed twice". */
  deload?: boolean
  /** Second exercise of a double-angle pair (R5) — excluded from this exercise's history. */
  follower?: boolean
  /** Session of a slot that prescribes tempo (R10). */
  tempo?: boolean
}

export type TrainerAction =
  | 'increase_weight'
  | 'increase_reps'
  | 'maintain'
  | 'decrease_weight'
  | 'collect_data'
  | 'deload'
  | 'regress'

export type ReasonCode =
  | 'no_history'
  | 'exceeded_target'
  | 'reached_top_of_range'
  | 'within_range'
  | 'drop_off_across_sets'
  | 'slightly_below_target'
  | 'below_target_twice'
  | 'below_target_once'
  | 'original_too_easy'
  | 'converted_rep_range'
  | 'deload_week'
  | 'long_break'
  | 'outlier_capped'
  | 'incomplete_session'
  | 'light_load_add_reps'
  | 'bodyweight_add_reps'
  | 'double_angle'

export type Confidence = 'low' | 'medium' | 'high'

export type Recommendation = {
  action: TrainerAction
  /** Recommended load in kg (the heaviest set for pyramids; null when unknown). */
  weight: number | null
  reps: RepRange
  sets: number
  reason: ReasonCode
  confidence: Confidence
  /** Per-set loads/reps when the sets differ (pyramids, deloaded pyramids). */
  setWeights?: number[]
  setReps?: number[]
  /** Drop-set: recommended drop load (R3). */
  dropWeight?: number
  /** Set when per-user calibration moved the load away from the rule result (spec 1.10). */
  calibration?: { offset: number; uncalibratedWeight: number; capped: boolean }
  evidence: {
    lastDate?: string
    lastWeight?: number
    lastReps?: number[]
    lastTarget?: RepRange
    estimatedOneRepMax?: number
    sessionsUsed: number
    daysSinceLast?: number
  }
}

export type RecommendInput = {
  history: SessionEvidence[]
  today: string
  target: RepRange
  sets: number
  equipment?: string
  plannedWeight?: number
  deload?: boolean
  technique?: string
  /** Planned reps per set (pyramids). */
  setReps?: number[]
  /** Today's slot prescribes tempo (R10). */
  tempo?: boolean
  /** Double-angle follower (R5): use the leading exercise's recommended load today. */
  followLoad?: number
  /** Per-user calibration offset O in reps (continuous-learning spec 1.2); 0 when not enough evidence. */
  calibrationOffset?: number
}

const MAX_REPS_FOR_ESTIMATE = 15
const RESERVE_REPS = 2
const CAPACITY_WINDOW_DAYS = 42
const OUTLIER_JUMP = 0.12
const MAX_INCREASE_PCT = 0.1

/** Continuous-learning spec 1.3: rir_eff = clamp(rir_tgt − O, 0, rir_tgt + 3). */
const effectiveReserve = (rirTarget: number, offset = 0) => Math.min(rirTarget + 3, Math.max(0, rirTarget - offset))

/** Load increment (spec "Definitions"): dumbbell 2 kg, machine/cable stacks 5 kg, everything else 2.5 kg. */
export function equipmentStep(equipment?: string) {
  switch (equipment) {
    case 'dumbbell':
    case 'kettlebell':
      return 2
    case 'machine':
    case 'cable':
      return 5
    default:
      return 2.5
  }
}

const isBodyweight = (equipment?: string) => equipment === 'bodyweight' || equipment === 'band'

export function roundToStep(weight: number, step: number, direction: 'down' | 'up' | 'nearest' = 'down') {
  if (step <= 0) return Math.max(0, weight)
  const units = weight / step
  const rounded = direction === 'up' ? Math.ceil(units - 1e-9) : direction === 'down' ? Math.floor(units + 1e-9) : Math.round(units)
  return Math.max(0, Number((rounded * step).toFixed(2)))
}

export function estimateOneRepMax(set: Pick<LoggedSet, 'weight' | 'reps'>) {
  if (!(set.weight > 0) || !(set.reps > 0)) return null
  return set.weight * (1 + Math.min(set.reps, MAX_REPS_FOR_ESTIMATE) / 30)
}

/** Load for `reps` with `reserve` reps in reserve (Epley). */
export function loadForReps(oneRepMax: number, reps: number, reserve = RESERVE_REPS) {
  return oneRepMax / (1 + (reps + reserve) / 30)
}

/** The load used on most sets (ties keep the heaviest). */
export function workingWeight(sets: Pick<LoggedSet, 'weight'>[]) {
  const counts = new Map<number, number>()
  for (const set of sets) if (set.weight > 0) counts.set(set.weight, (counts.get(set.weight) ?? 0) + 1)
  let best = 0
  let bestCount = 0
  for (const [weight, count] of counts) {
    if (count > bestCount || (count === bestCount && weight > best)) {
      best = weight
      bestCount = count
    }
  }
  return best
}

/** Progression sets: `main` sets only, up to the planned set count, in logged order (R3, R10). */
export function progressionSets(sets: LoggedSet[], planned: number) {
  return sets.filter((set) => !set.tag || set.tag === 'main').slice(0, Math.max(1, planned))
}

function sessionOneRepMax(sets: LoggedSet[]) {
  const working = workingWeight(sets)
  const estimates = sets
    .filter((set) => set.weight >= working * 0.9)
    .map(estimateOneRepMax)
    .filter((value): value is number => value !== null)
  if (!estimates.length) return null
  return estimates.reduce((sum, value) => sum + value, 0) / estimates.length
}

function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000)
}

export type Capacity = {
  oneRepMax: number
  sessions: number[]
  confidence: Confidence
  latestIsOutlier: boolean
}

/** Current capacity from the last 3 usable sessions in 6 weeks (latest weighs most). */
export function estimateCapacity(history: SessionEvidence[], today: string, planned = 99): Capacity | null {
  const sorted = history
    .filter((session) => daysBetween(session.date, today) >= 0 && daysBetween(session.date, today) <= CAPACITY_WINDOW_DAYS)
    .sort((a, b) => b.date.localeCompare(a.date))
  const recent = sorted
    .map((session) => sessionOneRepMax(progressionSets(session.sets, planned)))
    .filter((value): value is number => value !== null)
    .slice(0, 3)
  if (!recent.length) return null

  const weights = [3, 2, 1].slice(0, recent.length)
  const oneRepMax = recent.reduce((sum, value, index) => sum + value * weights[index], 0) / weights.reduce((a, b) => a + b, 0)
  const previous = recent.slice(1)
  const previousMean = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : null
  const latestIsOutlier = previousMean !== null && recent[0] > previousMean * (1 + OUTLIER_JUMP)
  const spread = (Math.max(...recent) - Math.min(...recent)) / Math.max(...recent)

  let confidence: Confidence = 'low'
  const latestSets = progressionSets(sorted[0]?.sets ?? [], planned)
  if (recent.length >= 3 && spread <= 0.05) confidence = 'high'
  else if (recent.length >= 2 && spread <= 0.08) confidence = 'medium'
  else if (recent.length === 1 && latestSets.length >= 3 && new Set(latestSets.map((set) => set.reps)).size === 1) {
    // R11: a single session is read from the LATEST session — every set landed the same.
    confidence = 'medium'
  }
  if (latestIsOutlier) confidence = 'low'
  return { oneRepMax, sessions: recent, confidence, latestIsOutlier }
}

function sameRange(a?: RepRange, b?: RepRange) {
  return !!a && !!b && a.min === b.min && a.max === b.max
}

const isPyramid = (technique?: string, setReps?: number[]) =>
  (technique === 'pyramid' || technique === 'reverse-pyramid') && !!setReps && setReps.length > 1 && new Set(setReps).size > 1

/** Per-set guardrail (spec "Definitions"): max(1 step, min(+10 %, 2 steps)) above that set's last load, rounded down. */
function setCap(lastLoad: number, step: number) {
  return roundToStep(lastLoad + Math.max(step, Math.min(lastLoad * MAX_INCREASE_PCT, 2 * step)), step, 'down')
}

/** Fewer reps never means less weight. */
function monotonic(weights: number[], reps: number[]) {
  const order = reps.map((count, index) => ({ count, index })).sort((a, b) => b.count - a.count)
  for (let i = 1; i < order.length; i += 1) {
    const prev = weights[order[i - 1].index]
    if (weights[order[i].index] < prev) weights[order[i].index] = prev
  }
  return weights
}

type Make = (action: TrainerAction, weight: number | null, reason: ReasonCode, extra?: Partial<Recommendation>) => Recommendation

export function recommend(input: RecommendInput): Recommendation {
  const { today, target, sets, plannedWeight } = input
  const step = equipmentStep(input.equipment)
  const pyramid = isPyramid(input.technique, input.setReps)

  // R5 / R10 / R4: which past sessions count.
  const usable = [...input.history]
    .filter((session) => session.sets.length > 0 && !session.follower && !!session.tempo === !!input.tempo)
    .sort((a, b) => b.date.localeCompare(a.date))
  const progressing = usable.filter((session) => !session.deload)
  const last = progressing[0]

  const capacity = estimateCapacity(progressing, today, sets)
  const confidence: Confidence = capacity?.confidence ?? 'low'
  const lastSets = last ? progressionSets(last.sets, sets) : []
  const lastWeight = workingWeight(lastSets)
  const lastReps = lastSets.map((set) => set.reps)
  const daysSinceLast = last ? daysBetween(last.date, today) : undefined
  const evidence: Recommendation['evidence'] = {
    lastDate: last?.date,
    lastWeight: last ? lastWeight : undefined,
    lastReps: last ? lastReps : undefined,
    lastTarget: last?.target,
    estimatedOneRepMax: capacity ? Number(capacity.oneRepMax.toFixed(1)) : undefined,
    sessionsUsed: capacity?.sessions.length ?? (last ? 1 : 0),
    daysSinceLast,
  }
  const make: Make = (action, weight, reason, extra = {}) => ({
    action, weight, reps: target, sets, reason, confidence, evidence, ...extra,
  })

  // R5: double-angle follower uses the leading exercise's load today, max reps at ~1 RIR.
  if (input.followLoad !== undefined) return make('maintain', input.followLoad, 'double_angle')

  // R4: deload — same loads as the last non-deload session, half the sets, bottom of the range.
  if (input.deload) {
    const half = Math.ceil(sets / 2)
    if (!last) return make('deload', plannedWeight ?? null, 'deload_week', { sets: half, reps: { min: target.min, max: target.min } })
    if (pyramid && input.setReps) {
      const planned = input.setReps
      const loads = progressionSets(last.sets, planned.length).map((set) => set.weight)
      const topIndex = planned.indexOf(Math.min(...planned))
      const indexes = planned.map((_, index) => index)
      // Ascending: the first (lighter) sets; reverse: skip the top set and use the back-off sets.
      const chosen = (input.technique === 'reverse-pyramid' ? indexes.filter((index) => index !== topIndex) : indexes).slice(0, half)
      const setWeights = chosen.map((index) => loads[index] ?? lastWeight)
      const setReps = chosen.map((index) => planned[index])
      return make('deload', Math.max(...setWeights), 'deload_week', {
        sets: half, setWeights, setReps, reps: { min: Math.min(...setReps), max: Math.max(...setReps) },
      })
    }
    return make('deload', lastWeight, 'deload_week', { sets: half, reps: { min: target.min, max: target.min } })
  }

  if (!last) return make('collect_data', plannedWeight ?? null, 'no_history')

  // R11: long break — 22-56 days −10 %, more than 56 days −20 %, rounded down; per set for pyramids.
  if (daysSinceLast !== undefined && daysSinceLast > 21) {
    const factor = daysSinceLast > 56 ? 0.8 : 0.9
    if (pyramid && input.setReps) {
      const loads = progressionSets(last.sets, input.setReps.length)
      const setWeights = input.setReps.map((_, index) => roundToStep((loads[index]?.weight ?? lastWeight) * factor, step, 'down'))
      return make('regress', Math.max(...setWeights), 'long_break', { setWeights, setReps: [...input.setReps] })
    }
    return make('regress', roundToStep(lastWeight * factor, step, 'down'), 'long_break')
  }

  if (pyramid && input.setReps) return recommendPyramid(input, progressing, capacity, confidence, step, make)

  const result = recommendStraight(input, progressing, lastSets, lastWeight, capacity, confidence, step, make)
  // R3: drop-set — the drop is 75 % of the recommended main load, rounded down.
  if (input.technique === 'drop-set' && result.weight !== null && result.weight > 0) {
    return { ...result, dropWeight: roundToStep(result.weight * 0.75, step, 'down') }
  }
  return result
}

function recommendPyramid(
  input: RecommendInput,
  progressing: SessionEvidence[],
  capacity: Capacity | null,
  confidence: Confidence,
  step: number,
  make: Make
): Recommendation {
  const planned = input.setReps!
  const topReps = Math.min(...planned)
  const topIndex = planned.indexOf(topReps)
  const sameTechnique = progressing.filter((session) => session.technique === input.technique)
  const lastPyramid = sameTechnique[0]
  const heaviestOf = (sets: LoggedSet[]) => sets[topIndex] ?? sets.reduce((a, b) => (b.weight > a.weight ? b : a))

  let top: number
  let action: TrainerAction
  let reason: ReasonCode
  let lastLoads: number[] | null = null
  if (lastPyramid) {
    // R1.1 / R2.1: the top (heaviest) set progresses on its own history.
    const lastSets = progressionSets(lastPyramid.sets, planned.length)
    lastLoads = lastSets.map((set) => set.weight)
    const topSet = heaviestOf(lastSets)
    const short = topReps - topSet.reps
    const previous = sameTechnique[1] ? heaviestOf(progressionSets(sameTechnique[1].sets, planned.length)) : null
    if (short <= 0 && topSet.rir !== 0) {
      top = topSet.weight + step
      action = 'increase_weight'
      reason = 'reached_top_of_range'
    } else if (short <= 1) {
      top = topSet.weight
      action = 'maintain'
      reason = 'slightly_below_target'
    } else if (previous && topReps - previous.reps >= 2) {
      top = roundToStep(topSet.weight * 0.95, step, 'down')
      action = 'decrease_weight'
      reason = 'below_target_twice'
    } else {
      top = topSet.weight
      action = 'maintain'
      reason = 'below_target_once'
    }
    // R6: incomplete pyramid → at most the same load.
    if (lastSets.length < planned.length && top > topSet.weight) {
      top = topSet.weight
      action = 'maintain'
      reason = 'incomplete_session'
    }
  } else if (capacity) {
    // R1.3: first time with this pyramid — top set from capacity at ~1 RIR, round up only with medium/high confidence.
    top = roundToStep(loadForReps(capacity.oneRepMax, topReps, effectiveReserve(1, input.calibrationOffset)), step, confidence === 'low' ? 'down' : 'up')
    action = 'increase_weight'
    reason = 'converted_rep_range'
  } else {
    return make('collect_data', input.plannedWeight ?? null, 'no_history')
  }

  // R1.2 / R2.2: the other sets.
  const others = planned.filter((_, index) => index !== topIndex)
  const backOffFormat = input.technique === 'reverse-pyramid' && new Set(others).size === 1
  const setWeights = planned.map((reps, index) => {
    if (index === topIndex) return top
    if (backOffFormat) return roundToStep(top * 0.9, step, 'down')
    let load = roundToStep((top * (1 + (topReps + 1) / 30)) / (1 + (reps + 2) / 30), step, 'nearest')
    const lastLoad = lastLoads?.[index]
    if (lastLoad !== undefined && lastLoad > 0) load = Math.min(load, setCap(lastLoad, step))
    return load
  })
  if (!backOffFormat) monotonic(setWeights, planned)
  const lastTopLoad = lastLoads?.[topIndex]
  const finalAction: TrainerAction =
    lastTopLoad === undefined ? action : top > lastTopLoad ? 'increase_weight' : top < lastTopLoad ? 'decrease_weight' : action
  return make(finalAction, top, reason, {
    setWeights,
    setReps: [...planned],
    reps: { min: topReps, max: Math.max(...planned) },
  })
}

function recommendStraight(
  input: RecommendInput,
  progressing: SessionEvidence[],
  lastSets: LoggedSet[],
  lastWeight: number,
  capacity: Capacity | null,
  confidence: Confidence,
  step: number,
  make: Make
): Recommendation {
  const { target, sets } = input
  const last = progressing[0]
  const lastTarget = last.target ?? target
  const lastReps = lastSets.map((set) => set.reps)
  const complete = lastSets.length >= sets

  // R7: bodyweight with no added load — progress reps; +2.5 kg after two sessions at target max + 2.
  if (isBodyweight(input.equipment) && lastWeight === 0) {
    const atPlus2 = (session?: SessionEvidence) => {
      if (!session) return false
      const logged = progressionSets(session.sets, sets)
      return logged.length >= sets && logged.every((set) => set.reps >= (session.target ?? target).max + 2)
    }
    if (atPlus2(progressing[0]) && atPlus2(progressing[1])) return make('increase_weight', 2.5, 'bodyweight_add_reps')
    if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', 0, 'slightly_below_target')
    return make('increase_reps', 0, 'bodyweight_add_reps')
  }

  // Guardrail: at most +10 % or 2 steps, always one step allowed; an outlier allows one step only.
  const maxWeight = capacity?.latestIsOutlier
    ? lastWeight + step
    : Math.max(lastWeight + step, Math.min(lastWeight * (1 + MAX_INCREASE_PCT), lastWeight + 2 * step))
  const capped = (weight: number) => Math.min(weight, roundToStep(maxWeight, step, 'down'))
  const strong = confidence !== 'low'
  // R8: light loads — when one step is more than 10 % of the load, add reps to max + 2 before adding the step.
  // (Added load on bodyweight work follows normal straight-set rules — R7, T9/T21.)
  if (!isBodyweight(input.equipment) && lastWeight > 0 && step / lastWeight > MAX_INCREASE_PCT && sameRange(lastTarget, target)) {
    if (complete && lastReps.every((reps) => reps >= target.max + 2)) {
      return make('increase_weight', lastWeight + step, 'reached_top_of_range', { reps: { min: target.min, max: target.min } })
    }
    if (lastReps.some((reps) => reps < target.min)) return make('maintain', lastWeight, 'slightly_below_target')
    return make('increase_reps', lastWeight, 'light_load_add_reps')
  }

  // Different rep range today (e.g. Monday 8-10 → Thursday 12-15): convert through capacity, never copy the load.
  if (!sameRange(lastTarget, target) && capacity) {
    let weight = roundToStep(loadForReps(capacity.oneRepMax, target.min, effectiveReserve(RESERVE_REPS, input.calibrationOffset)), step, strong ? 'nearest' : 'down')
    if (complete && lastWeight >= weight && lastReps.every((reps) => reps >= target.max + 2)) {
      return make('increase_weight', capped(lastWeight + step), 'original_too_easy', {
        reps: { min: Math.max(1, target.max - 2), max: target.max },
      })
    }
    weight = Math.min(weight, roundToStep(maxWeight, step, 'down'))
    const action: TrainerAction = weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
    return make(action, weight, 'converted_rep_range')
  }

  const exceeded = lastReps.every((reps) => reps >= lastTarget.max + 3)
  const atTop = lastReps.every((reps) => reps >= lastTarget.max)
  const belowBy3 = lastReps.filter((reps) => lastTarget.min - reps >= 3).length
  const dropOff = lastReps.length > 1 && lastReps[0] >= lastTarget.min && lastReps.slice(1).some((reps) => lastTarget.min - reps >= 3)

  const stepResult = (): Recommendation => {
    if (!complete) {
      // R6: incomplete session → at most the same load.
      if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', lastWeight, 'slightly_below_target')
      return make('maintain', lastWeight, 'incomplete_session')
    }
    if (exceeded && capacity) {
      const byCapacity = roundToStep(loadForReps(capacity.oneRepMax, target.min, effectiveReserve(RESERVE_REPS, input.calibrationOffset)), step, strong ? 'up' : 'down')
      return make('increase_weight', capped(Math.max(byCapacity, lastWeight + step)), capacity.latestIsOutlier ? 'outlier_capped' : 'exceeded_target')
    }
    if (atTop) return make('increase_weight', capped(lastWeight + step), 'reached_top_of_range')
    if (dropOff) return make('maintain', lastWeight, 'drop_off_across_sets')
    if (belowBy3 >= 2) {
      const previous = progressing[1]
      const previousTarget = previous?.target ?? lastTarget
      const previousBelow = previous && progressionSets(previous.sets, sets).filter((set) => previousTarget.min - set.reps >= 3).length >= 2
      if (previousBelow) return make('decrease_weight', roundToStep(lastWeight * 0.925, step, 'down'), 'below_target_twice')
      return make('maintain', lastWeight, 'below_target_once')
    }
    if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', lastWeight, 'slightly_below_target')
    if (progressing.length === 1 && confidence === 'low') return make('collect_data', lastWeight, 'no_history')
    return make('increase_reps', lastWeight, 'within_range')
  }

  // Continuous-learning integration (PT, approved by Sebas 2026-10-07): with |O| ≥ 1 the calibrated capacity load
  // L_c can raise (O ≥ +1: max) or lower (O ≤ −1: min) the step result S; never below the last load when the last
  // session reached the top of the range (Sebas); per-set guardrail last; deload/bodyweight/light loads untouched.
  const base = stepResult()
  const offset = input.calibrationOffset ?? 0
  if (Math.abs(offset) < 1 || !capacity || base.weight === null || base.action === 'collect_data') return base
  const calibrated = roundToStep(loadForReps(capacity.oneRepMax, target.min, effectiveReserve(RESERVE_REPS, offset)), step, 'down')
  let weight = offset > 0 ? Math.max(base.weight, calibrated) : Math.min(base.weight, calibrated)
  // PT pre-merge review: a calibration decrease is at most −5 % of the last load per session.
  if (offset < 0) weight = Math.max(weight, roundToStep(lastWeight * 0.95, step, 'down'))
  if (atTop && complete) weight = Math.max(weight, lastWeight)
  const limit = roundToStep(maxWeight, step, 'down')
  const hitGuardrail = weight > limit
  weight = Math.min(weight, limit)
  if (weight === base.weight) return base
  const action: TrainerAction = weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
  return { ...base, action, weight, calibration: { offset, uncalibratedWeight: base.weight, capped: hitGuardrail } }
}
