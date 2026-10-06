// AI Trainer progression engine (PO-approved plan, 2026-10-07).
// Pure functions: every set is evidence of current capacity (Epley e1RM); capacity is turned into a load for
// each session's rep range and rounded to weights that exist. The LLM never chooses numbers — it only explains
// the structured recommendation this module returns.

export type LoggedSet = { weight: number; reps: number }

export type RepRange = { min: number; max: number }

/** One past session of the exercise (any day of the week/program) and what the plan asked that day, if known. */
export type SessionEvidence = {
  date: string
  sets: LoggedSet[]
  target?: RepRange
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

export type Confidence = 'low' | 'medium' | 'high'

export type Recommendation = {
  action: TrainerAction
  /** Recommended load in kg (null when there is no history and no planned weight). */
  weight: number | null
  reps: RepRange
  sets: number
  reason: ReasonCode
  confidence: Confidence
  /** Per-set loads/reps when the sets differ (pyramids); otherwise every set uses `weight` and `reps.min`. */
  setWeights?: number[]
  setReps?: number[]
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
  /** Planned technique and per-set reps; pyramids get a weight per set (PO 2026-10-07). */
  technique?: string
  setReps?: number[]
}

const MAX_REPS_FOR_ESTIMATE = 15
const RESERVE_REPS = 2
const CAPACITY_WINDOW_DAYS = 42
const LONG_BREAK_DAYS = 21
const OUTLIER_JUMP = 0.12
const MAX_INCREASE_PCT = 0.1

/** Load increment per equipment (PO 2026-10-07: dumbbells move in 2 kg steps). */
export function equipmentStep(equipment?: string) {
  switch (equipment) {
    case 'dumbbell':
    case 'kettlebell':
      return 2
    case 'bodyweight':
    case 'band':
      return 0
    default:
      return 2.5
  }
}

export function roundToStep(weight: number, step: number, direction: 'down' | 'up' | 'nearest' = 'down') {
  if (step <= 0) return Math.max(0, weight)
  const units = weight / step
  const rounded = direction === 'up' ? Math.ceil(units - 1e-9) : direction === 'down' ? Math.floor(units + 1e-9) : Math.round(units)
  return Math.max(0, Number((rounded * step).toFixed(2)))
}

export function estimateOneRepMax(set: LoggedSet) {
  if (!(set.weight > 0) || !(set.reps > 0)) return null
  return set.weight * (1 + Math.min(set.reps, MAX_REPS_FOR_ESTIMATE) / 30)
}

/** Load that leaves ~2 reps in reserve at `reps` for a given e1RM. */
export function loadForReps(oneRepMax: number, reps: number) {
  return oneRepMax / (1 + (reps + RESERVE_REPS) / 30)
}

/** The load used on most sets (ties keep the heaviest). */
export function workingWeight(sets: LoggedSet[]) {
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

/** Current capacity from the last 3 sessions in 6 weeks (latest weighs most). */
export function estimateCapacity(history: SessionEvidence[], today: string): Capacity | null {
  const recent = history
    .filter((session) => daysBetween(session.date, today) >= 0 && daysBetween(session.date, today) <= CAPACITY_WINDOW_DAYS)
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((session) => sessionOneRepMax(session.sets))
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
  if (recent.length >= 3 && spread <= 0.05) confidence = 'high'
  else if (recent.length >= 2 && spread <= 0.08) confidence = 'medium'
  else if (recent.length === 1 && history[0]?.sets.length >= 3 && new Set(history[0].sets.map((set) => set.reps)).size === 1) {
    // One session, but every set landed the same: consistent evidence inside the session.
    confidence = 'medium'
  }
  if (latestIsOutlier) confidence = 'low'
  return { oneRepMax, sessions: recent, confidence, latestIsOutlier }
}

function sameRange(a?: RepRange, b?: RepRange) {
  return !!a && !!b && a.min === b.min && a.max === b.max
}

function recommendBase(input: RecommendInput): Recommendation {
  const { today, target, sets, plannedWeight, deload } = input
  const step = equipmentStep(input.equipment)
  const history = [...input.history].filter((session) => session.sets.length > 0).sort((a, b) => b.date.localeCompare(a.date))
  const last = history[0]

  if (!last) {
    return {
      action: 'collect_data',
      weight: plannedWeight ?? null,
      reps: target,
      sets,
      reason: 'no_history',
      confidence: 'low',
      evidence: { sessionsUsed: 0 },
    }
  }

  const lastWeight = workingWeight(last.sets)
  const lastReps = last.sets.map((set) => set.reps)
  const lastTarget = last.target ?? target
  const daysSinceLast = daysBetween(last.date, today)
  const capacity = estimateCapacity(history, today)
  const evidence: Recommendation['evidence'] = {
    lastDate: last.date,
    lastWeight,
    lastReps,
    lastTarget: last.target,
    estimatedOneRepMax: capacity ? Number(capacity.oneRepMax.toFixed(1)) : undefined,
    sessionsUsed: capacity?.sessions.length ?? 1,
    daysSinceLast,
  }
  const confidence: Confidence = capacity?.confidence ?? 'low'
  const result = (action: TrainerAction, weight: number, reason: ReasonCode, reps = target, setCount = sets): Recommendation => ({
    action,
    weight,
    reps,
    sets: setCount,
    reason,
    confidence,
    evidence,
  })

  if (deload) return result('deload', lastWeight, 'deload_week', target, Math.ceil(sets / 2))
  if (daysSinceLast > LONG_BREAK_DAYS) {
    return result('regress', roundToStep(lastWeight * 0.9, step, 'down'), 'long_break')
  }

  // Guardrail: at most +10 % or 2 steps, but always allow one step; an outlier session allows one step only.
  const maxWeight = capacity?.latestIsOutlier
    ? lastWeight + step
    : Math.max(lastWeight + step, Math.min(lastWeight * (1 + MAX_INCREASE_PCT), lastWeight + 2 * step))
  const strong = confidence !== 'low'
  const capped = (weight: number) => {
    const next = Math.min(weight, roundToStep(maxWeight, step, 'down'))
    return next
  }

  const allLogged = last.sets.length >= Math.min(sets, lastReps.length)
  const exceeded = allLogged && lastReps.every((reps) => reps >= lastTarget.max + 3)
  const atTop = allLogged && lastReps.every((reps) => reps >= lastTarget.max)
  const belowBy3 = lastReps.filter((reps) => lastTarget.min - reps >= 3).length
  const dropOff = lastReps.length > 1 && lastReps[0] >= lastTarget.min && lastReps.slice(1).some((reps) => lastTarget.min - reps >= 3)

  // Different rep range today (e.g. Monday 8-10 → Thursday 12-15): convert through capacity, never copy the load.
  if (!sameRange(lastTarget, target) && capacity) {
    const raw = loadForReps(capacity.oneRepMax, target.min)
    let weight = roundToStep(raw, step, strong ? 'nearest' : 'down')
    // If the last session already beat today's target at a load ≥ this one, today's original is too easy.
    if (lastWeight >= weight && lastReps.every((reps) => reps >= target.max + 2)) {
      return result('increase_weight', capped(lastWeight + step), 'original_too_easy', { min: Math.max(1, target.max - 2), max: target.max })
    }
    weight = Math.min(weight, roundToStep(maxWeight, step, 'down'))
    const action: TrainerAction = weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
    return result(action, weight, 'converted_rep_range')
  }

  if (exceeded && capacity) {
    const raw = loadForReps(capacity.oneRepMax, target.min)
    const byCapacity = roundToStep(raw, step, strong ? 'up' : 'down')
    const weight = capped(Math.max(byCapacity, lastWeight + step))
    return result('increase_weight', weight, capacity.latestIsOutlier ? 'outlier_capped' : 'exceeded_target')
  }
  if (atTop) return result('increase_weight', capped(lastWeight + step), 'reached_top_of_range')
  if (dropOff) return result('maintain', lastWeight, 'drop_off_across_sets')
  if (belowBy3 >= 2) {
    const previous = history[1]
    const previousTarget = previous?.target ?? lastTarget
    const previousBelow = previous && previous.sets.filter((set) => previousTarget.min - set.reps >= 3).length >= 2
    if (previousBelow) {
      return result('decrease_weight', roundToStep(lastWeight * 0.925, step, 'down'), 'below_target_twice')
    }
    return result('maintain', lastWeight, 'below_target_once')
  }
  if (lastReps.some((reps) => reps < lastTarget.min)) return result('maintain', lastWeight, 'slightly_below_target')
  if (history.length === 1 && confidence === 'low') return result('collect_data', lastWeight, 'no_history')
  return result('increase_reps', lastWeight, 'within_range')
}

/**
 * Pyramids change the load every set: lighter for the high-rep sets, heavier for the low-rep sets. Each set's load
 * comes from current capacity at ~1 rep in reserve; the heaviest set rounds up only with medium/high confidence
 * and never passes the session guardrail (the base recommendation's weight + one step).
 */
export function pyramidSetWeights(
  oneRepMax: number,
  setReps: number[],
  step: number,
  confidence: Confidence,
  maxWeight: number
): number[] {
  const minReps = Math.min(...setReps)
  const raw = setReps.map((reps) => oneRepMax / (1 + (reps + 1) / 30))
  const weights = raw.map((weight, index) =>
    roundToStep(weight, step, setReps[index] === minReps && confidence !== 'low' ? 'up' : 'nearest')
  ).map((weight) => Math.min(weight, maxWeight))
  // Fewer reps never means less weight.
  const order = setReps.map((reps, index) => ({ reps, index })).sort((a, b) => b.reps - a.reps)
  for (let i = 1; i < order.length; i += 1) {
    const prev = weights[order[i - 1].index]
    if (weights[order[i].index] < prev) weights[order[i].index] = prev
  }
  const span = Math.max(...setReps) - minReps
  const heaviest = order[order.length - 1].index
  const lightest = order[0].index
  if (span >= 4 && step > 0 && weights[heaviest] === weights[lightest] && weights[heaviest] + step <= maxWeight) {
    weights[heaviest] += step
  }
  return weights
}

export function recommend(input: RecommendInput): Recommendation {
  const base = recommendBase(input)
  const setReps = input.setReps?.filter((reps) => reps > 0) ?? []
  const pyramid = input.technique === 'pyramid' || input.technique === 'reverse-pyramid'
  if (!pyramid || setReps.length < 2 || new Set(setReps).size < 2) return base
  if (base.action === 'collect_data' || base.action === 'deload' || base.action === 'regress' || base.weight === null) return base
  const capacity = estimateCapacity(input.history, input.today)
  if (!capacity) return base
  const step = equipmentStep(input.equipment)
  const reps = setReps.slice(0, base.sets)
  const weights = pyramidSetWeights(capacity.oneRepMax, reps, step, base.confidence, base.weight + step)
  const top = Math.max(...weights)
  const last = base.evidence.lastWeight ?? top
  const action: TrainerAction = top > last ? 'increase_weight' : top < last ? 'decrease_weight' : base.action
  return { ...base, action, weight: top, setWeights: weights, setReps: reps }
}
