// AI Trainer progression engine. Implements the PT-approved spec
// docs/fitness/approved/2026-10-07-progression-engine-spec.md (R1–R11, T1–T29) and its v2 amendment
// docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md (R12–R19, T30–T52c) and
// docs/fitness/approved/2026-10-13-engine-same-day-evidence.md (R20–R24, T53–T63).
// docs/fitness/approved/2026-10-19-reverse-pyramid-after-strong-b.md (R25, T64–T72).
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
  dayKey?: string
  blockId?: string
  sets: LoggedSet[]
  target?: RepRange
  /** Planned technique and per-set reps of that session (pyramids). */
  technique?: string
  setReps?: number[]
  dayName?: string
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
  | 'consolidate_load'
  | 'achieved_floor'
  | 'same_day_boost'
  | 'recent_miss_cap'

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
  firstSessionProtocol?: 'pyramid' | 'reverse-pyramid'
  evidence: {
    lastDate?: string
    lastWeight?: number
    lastReps?: number[]
    lastTarget?: RepRange
    estimatedOneRepMax?: number
    sessionsUsed: number
    daysSinceLast?: number
    sameDayDate?: string
    sameDayName?: string
    sameDayWeight?: number
    sameDayReps?: number[]
    sameDayTarget?: RepRange
    recentMiss?: { weight: number; reps: number; target: number; newWeight: number }
    /** R31d: the grid load behind an off-grid logged lastWeight / sameDayWeight; only set when they differ. */
    lastGridWeight?: number
    sameDayGridWeight?: number
  }
}

export type RecommendInput = {
  history: SessionEvidence[]
  today: string
  dayKey?: string
  blockId?: string
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
  /** Catalogue id (R16 cable crunch). */
  exerciseId?: string
  /** R12a: a configured per-exercise step wins over the equipment default. */
  step?: number
}

const MAX_REPS_FOR_ESTIMATE = 15
const RESERVE_REPS = 2
const CAPACITY_WINDOW_DAYS = 42
const OUTLIER_JUMP = 0.12
const MAX_INCREASE_PCT = 0.1

/** Continuous-learning spec 1.3: rir_eff = clamp(rir_tgt − O, 0, rir_tgt + 3). */
const effectiveReserve = (rirTarget: number, offset = 0) => Math.min(rirTarget + 3, Math.max(0, rirTarget - offset))

/** Load increment (R12a, Sebas's gym): dumbbell/kettlebell 2 kg; machines, cables and everything else 2.5 kg. */
export function equipmentStep(equipment?: string) {
  switch (equipment) {
    case 'dumbbell':
    case 'kettlebell':
      return 2
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

function sameDaySession(input: RecommendInput, sessions: SessionEvidence[]) {
  if (!input.dayKey) return undefined
  return sessions.find((session) => {
    const days = daysBetween(session.date, input.today)
    return session.dayKey === input.dayKey &&
      (input.blockId === undefined || session.blockId === input.blockId) &&
      session.date < input.today && days >= 0 && days <= 28
  })
}

function topWorkingWeight(session: SessionEvidence, planned: number) {
  const logged = progressionSets(session.sets, planned)
  return isPyramid(session.technique, session.setReps)
    ? Math.max(0, ...logged.map((set) => set.weight))
    : workingWeight(logged)
}

function firstSessionProtocol(input: RecommendInput) {
  if (!['machine', 'plate-loaded', 'cable', 'smith-machine'].includes(input.equipment ?? '')) return undefined
  return input.technique === 'reverse-pyramid' ? 'reverse-pyramid' : 'pyramid'
}

const isPyramid = (technique?: string, setReps?: number[]) =>
  (technique === 'pyramid' || technique === 'reverse-pyramid') && !!setReps && setReps.length > 1 && new Set(setReps).size > 1

/** Per-set guardrail (spec "Definitions"): max(1 step, min(+10 %, 2 steps)) above that set's last load, rounded down. */
function setCap(lastLoad: number, step: number) {
  // R12a: odd logged loads (e.g. 6.25 on a 2.5 kg machine) keep their offset — the increment is what is rounded.
  return Number((lastLoad + roundToStep(Math.max(step, Math.min(lastLoad * MAX_INCREASE_PCT, 2 * step)), step, 'down')).toFixed(2))
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

/** R5 / R10 / R4: which past sessions count, newest first. */
function progressingSessions(input: RecommendInput) {
  return [...input.history]
    .filter((session) => session.sets.length > 0 && !session.follower && !!session.tempo === !!input.tempo && !session.deload)
    .sort((a, b) => b.date.localeCompare(a.date))
}

type Make = (action: TrainerAction, weight: number | null, reason: ReasonCode, extra?: Partial<Recommendation>) => Recommendation

/** R31a: on a cable grid a load counts as the grid load at or below it, and never below one step. */
function gridLoad(weight: number, step: number) {
  return weight <= 0 ? weight : Math.max(step, roundToStep(weight, step, 'down'))
}

export function recommend(input: RecommendInput): Recommendation {
  return input.equipment === 'cable' ? recommendOnCableGrid(input) : recommendWithFloor(input)
}

/** R31 (PT 2026-11-01): cables only offer the grid. Rules read logs at the grid load; evidence still shows what was logged. */
function recommendOnCableGrid(input: RecommendInput): Recommendation {
  const step = input.step ?? equipmentStep(input.equipment)
  const toGrid = (weight: number) => gridLoad(weight, step)
  const result = recommendWithFloor({
    ...input,
    history: input.history.map((session) => ({
      ...session,
      sets: session.sets.map((set) => (!set.tag || set.tag === 'main' ? { ...set, weight: toGrid(set.weight) } : set)),
    })),
  })
  const progressing = progressingSessions(input)
  const last = progressing[0]
  const sameDay = sameDaySession(input, progressing)
  const evidence = { ...result.evidence }
  if (last) {
    evidence.lastGridWeight = evidence.lastWeight
    evidence.lastWeight = workingWeight(progressionSets(last.sets, input.sets))
    if (evidence.lastGridWeight === evidence.lastWeight) delete evidence.lastGridWeight
    const capacity = estimateCapacity(progressing, input.today, input.sets)
    if (capacity) evidence.estimatedOneRepMax = Number(capacity.oneRepMax.toFixed(1))
  }
  if (sameDay) {
    evidence.sameDayGridWeight = evidence.sameDayWeight
    evidence.sameDayWeight = topWorkingWeight(sameDay, input.sets)
    if (evidence.sameDayGridWeight === evidence.sameDayWeight) delete evidence.sameDayGridWeight
  }
  if (evidence.recentMiss) {
    const missLoad = evidence.recentMiss.weight
    const logged = progressing.flatMap((session) => progressionSets(session.sets, input.sets)).find((set) => toGrid(set.weight) === missLoad)
    if (logged) evidence.recentMiss = { ...evidence.recentMiss, weight: logged.weight }
  }
  return {
    ...result,
    evidence,
    // R31c: inputs that do not come from history (R5 followLoad, planned weight) end on the grid too.
    weight: result.weight === null ? null : toGrid(result.weight),
    ...(result.setWeights ? { setWeights: result.setWeights.map(toGrid) } : {}),
    ...(result.dropWeight !== undefined ? { dropWeight: Math.max(step, toGrid(result.dropWeight)) } : {}),
  }
}

/** Every recommendation passes the PT global floor (never 0 kg for a weighted exercise, minimum one step). */
function recommendWithFloor(input: RecommendInput): Recommendation {
  const result = recommendUnfloored(input)
  const lastMax = Math.max(0, ...input.history.flatMap((session) => session.sets.map((set) => set.weight)))
  if (!(lastMax > 0)) return result
  const unit = isBodyweight(input.equipment) ? 2.5 : equipmentStep(input.equipment)
  const minimum = Math.min(unit, lastMax)
  const floor = (weight: number) => (weight > 0 ? weight : minimum)
  if (result.weight === null && !result.setWeights) return result
  return {
    ...result,
    ...(result.weight !== null ? { weight: floor(result.weight) } : {}),
    ...(result.setWeights ? { setWeights: result.setWeights.map(floor) } : {}),
  }
}

function recommendUnfloored(input: RecommendInput): Recommendation {
  const { today, target, sets, plannedWeight } = input
  const step = input.step ?? equipmentStep(input.equipment)
  const pyramid = isPyramid(input.technique, input.setReps)

  const progressing = progressingSessions(input)
  const last = progressing[0]

  const capacity = estimateCapacity(progressing, today, sets)
  const confidence: Confidence = capacity?.confidence ?? 'low'
  const lastSets = last ? progressionSets(last.sets, sets) : []
  const lastWeight = workingWeight(lastSets)
  const lastReps = lastSets.map((set) => set.reps)
  const daysSinceLast = last ? daysBetween(last.date, today) : undefined
  const sameDay = sameDaySession(input, progressing)
  const sameDaySets = sameDay ? progressionSets(sameDay.sets, sets) : []
  const evidence: Recommendation['evidence'] = {
    lastDate: last?.date,
    lastWeight: last ? lastWeight : undefined,
    lastReps: last ? lastReps : undefined,
    lastTarget: last?.target,
    estimatedOneRepMax: capacity ? Number(capacity.oneRepMax.toFixed(1)) : undefined,
    sessionsUsed: capacity?.sessions.length ?? (last ? 1 : 0),
    daysSinceLast,
    ...(sameDay ? {
      sameDayDate: sameDay.date,
      ...(sameDay.dayName ? { sameDayName: sameDay.dayName } : {}),
      sameDayWeight: topWorkingWeight(sameDay, sets),
      sameDayReps: sameDaySets.map((set) => set.reps),
      sameDayTarget: sameDay.target,
    } : {}),
  }
  const make: Make = (action, weight, reason, extra = {}) => ({
    action, weight, reps: target, sets, reason, confidence, evidence, ...extra,
  })

  // R5: double-angle follower uses the leading exercise's load today, max reps at ~1 RIR.
  if (input.followLoad !== undefined) return make('maintain', input.followLoad, 'double_angle')

  // R4: deload — same loads as the last non-deload session, half the sets, bottom of the range.
  if (input.deload) {
    const half = Math.ceil(sets / 2)
    if (!last) {
      const protocol = firstSessionProtocol(input)
      if (protocol) return make('collect_data', null, 'no_history', { firstSessionProtocol: protocol })
      return make('deload', plannedWeight ?? null, 'deload_week', { sets: half, reps: { min: target.min, max: target.min } })
    }
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

  if (!last) {
    const protocol = firstSessionProtocol(input)
    return {
      ...make('collect_data', protocol ? null : plannedWeight ?? null, 'no_history'),
      ...(protocol ? { firstSessionProtocol: protocol } : {}),
    }
  }

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

  const result = pyramid && input.setReps
    ? recommendPyramid(input, progressing, capacity, confidence, step, make)
    : recommendStraight(input, progressing, lastSets, lastWeight, capacity, confidence, step, make)
  const floored = applyApprovedFloors(input, progressing, last, lastSets, lastWeight, step, result)
  // R3: drop-set — the drop is 75 % of the recommended main load, rounded down.
  if (input.technique === 'drop-set' && floored.weight !== null && floored.weight > 0) {
    return { ...floored, dropWeight: roundToStep(floored.weight * 0.75, step, 'down') }
  }
  return floored
}

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

function belowTargetReason(reps: number[], target: RepRange): ReasonCode {
  if (!reps.some((count) => count < target.min)) return 'within_range'
  return target.min - median(reps) >= 2 ? 'below_target_once' : 'slightly_below_target'
}

function sameTargetSessions(
  input: RecommendInput,
  progressing: SessionEvidence[],
  target = input.target,
  dayKey = input.dayKey
) {
  return progressing.filter((session) => {
    const days = daysBetween(session.date, input.today)
    return days >= 0 && days <= 42 &&
      session.dayKey === dayKey &&
      (input.blockId === undefined || session.blockId === input.blockId) &&
      sameRange(session.target ?? target, target)
  }).slice(0, 2)
}

function recentMisses(input: RecommendInput, progressing: SessionEvidence[]) {
  const last = progressing.find((session) => {
    const days = daysBetween(session.date, input.today)
    return days >= 0 && days <= 28
  })
  if (!last || sameRange(last.target ?? input.target, input.target)) return []

  const logged = progressionSets(last.sets, input.sets)
  const loads = [...new Set(logged.map((set) => set.weight).filter((weight) => weight > 0))]
  return loads.flatMap((weight) => {
    const atLoad = logged.flatMap((set, index) => {
      if (set.weight !== weight) return []
      const planned = isPyramid(last.technique, last.setReps)
        ? last.setReps?.[index] ?? last.target?.min ?? input.target.min
        : last.target?.min ?? input.target.min
      return [{ reps: set.reps, planned }]
    })
    const missed = atLoad.filter(({ reps, planned }) => reps <= planned - 2)
    if (missed.length < Math.ceil(atLoad.length / 2)) return []
    return [{ weight, reps: median(atLoad.map((set) => set.reps)), target: median(atLoad.map((set) => set.planned)) }]
  })
}

function capRecentMisses(
  input: RecommendInput,
  weights: number[],
  targets: number[],
  misses: ReturnType<typeof recentMisses>,
  step: number,
  progressing?: SessionEvidence[],
  respectProof = false
) {
  let detail: Recommendation['evidence']['recentMiss']
  const original = [...weights]
  targets.forEach((target, index) => {
    for (const miss of misses) {
      if (weights[index] < miss.weight || target <= miss.reps) continue
      if (respectProof && progressing && hasRecentProof(input, progressing, target, weights[index])) continue
      const cap = Math.max(step, miss.weight - step)
      if (weights[index] > cap) {
        weights[index] = cap
        detail = { ...miss, newWeight: cap }
      }
    }
  })
  const pyramid = isPyramid(input.technique, input.setReps)
  if (pyramid && input.setReps) {
    const topIndex = input.setReps.indexOf(Math.min(...input.setReps))
    if (weights[topIndex] < original[topIndex]) {
      const top = weights[topIndex]
      input.setReps.forEach((reps, index) => {
        if (index === topIndex) return
        weights[index] = input.technique === 'reverse-pyramid' &&
          new Set(input.setReps!.filter((_, i) => i !== topIndex)).size === 1
          ? roundToStep(top * 0.9, step, 'down')
          : roundToStep((top * (1 + (input.setReps![topIndex] + 1) / 30)) / (1 + (reps + 2) / 30), step, 'nearest')
      })
      if (input.technique === 'pyramid') monotonic(weights, input.setReps)
    }
  }
  return detail
}

function hasRecentProof(
  input: RecommendInput,
  progressing: SessionEvidence[],
  target: number,
  weight: number
) {
  return progressing.some((session) => {
    const days = daysBetween(session.date, input.today)
    if (days < 0 || days > 28) return false
    const logged = progressionSets(session.sets, input.sets)
    if (isPyramid(input.technique, input.setReps)) {
      return logged.some((set) => set.weight >= weight && set.reps >= target)
    }
    if (input.technique === 'reverse-pyramid') {
      const isStraight = session.technique === 'straight' ||
        new Set(logged.map((set) => set.weight)).size === 1
      const isTopSet = target === Math.min(...(input.setReps ?? []))
      return logged.some((set, index) =>
        set.weight >= weight && set.reps >= target &&
        (isTopSet || index > 0 || isStraight && logged.length >= input.sets && logged.every((item) => item.reps >= target)))
    }
    return logged.length >= input.sets &&
      new Set(logged.map((set) => set.weight)).size === 1 &&
      logged[0].weight >= weight &&
      logged.every((set) => set.reps >= target)
  })
}

function applyApprovedFloors(
  input: RecommendInput,
  progressing: SessionEvidence[],
  last: SessionEvidence,
  lastSets: LoggedSet[],
  lastWeight: number,
  step: number,
  recommendation: Recommendation
): Recommendation {
  if (recommendation.weight === null) return recommendation

  const pyramid = isPyramid(input.technique, input.setReps)
  const ascendingPyramid = input.technique === 'pyramid' && pyramid
  const floorsApply = !pyramid || ascendingPyramid
  const lastTarget = last.target ?? input.target
  const repRangeChanged = !sameRange(lastTarget, input.target)
  const missDrop = recommendation.reason === 'below_target_twice' ||
    (!pyramid && step / lastWeight > MAX_INCREASE_PCT &&
      input.target.min > lastTarget.max && lastSets.some((set) => set.reps < lastTarget.min))
  const targets = ascendingPyramid ? input.setReps! : [input.target.min]
  let weights = pyramid
    ? [...(recommendation.setWeights ?? Array.from({ length: targets.length }, () => recommendation.weight!))]
    : [recommendation.weight]
  let reason = recommendation.reason

  const missTargets = pyramid && input.setReps ? input.setReps : targets
  const miss = capRecentMisses(input, weights, missTargets, recentMisses(input, progressing), step)
  if (miss) {
    reason = 'recent_miss_cap'
    recommendation = { ...recommendation, evidence: { ...recommendation.evidence, recentMiss: miss } }
  }

  if (input.technique === 'reverse-pyramid' && pyramid) {
    let result = applyReversePyramidFloors(input, progressing, last, lastSets, lastWeight, step, recommendation, weights)
    const finalWeights = [...(result.setWeights ?? weights)]
    const finalMiss = capRecentMisses(input, finalWeights, missTargets, recentMisses(input, progressing), step, progressing, true)
    if (finalMiss) {
      const topIndex = input.setReps!.indexOf(Math.min(...input.setReps!))
      result = {
        ...result,
        weight: finalWeights[topIndex],
        setWeights: finalWeights,
        reason: 'recent_miss_cap',
        evidence: { ...result.evidence, recentMiss: finalMiss },
      }
    }
    return applyLikeForLikeAction(input, last, result)
  }

  // R21: convert from the median of all working-load sets, not a best set or a mean.
  if (floorsApply && repRangeChanged && !missDrop && lastWeight > 0) {
    const workingReps = lastSets.filter((set) => set.weight === lastWeight).map((set) => set.reps)
    if (workingReps.length) {
      const seriesReps = median(workingReps)
      const seriesE1rm = lastWeight * (1 + seriesReps / 30)
      targets.forEach((target, index) => {
        const floor = seriesReps >= target
          ? lastWeight
          : roundToStep(seriesE1rm / (1 + target / 30), step, 'down')
        weights[index] = Math.max(weights[index], floor)
      })
    }
  }

  // R22: recent completed performances are a floor; deloads and long-break sessions are not evidence here.
  let achieved = false
  // An approved negative calibration remains a distinct explicit load decrease (spec 1.2).
  if (floorsApply && !missDrop && !(recommendation.calibration && recommendation.calibration.offset < 0)) {
    const recent = progressing.filter((session) => {
      const days = daysBetween(session.date, input.today)
      return days >= 0 && days <= 28
    })
    targets.forEach((target, index) => {
      const achievedWeight = recent.reduce((highest, session) => {
        const logged = progressionSets(session.sets, input.sets)
        if (ascendingPyramid) {
          const achievedWeight = logged
            .filter((candidate) => candidate.reps >= target)
            .reduce((weight, candidate) => Math.max(weight, candidate.weight), 0)
          return Math.max(highest, achievedWeight)
        }
        if (logged.length < input.sets) return highest
        const loads = new Set(logged.map((set) => set.weight))
        const achievedLoad = [...loads].filter((weight) => {
          const atLoad = logged.filter((set) => set.weight === weight)
          return atLoad.length >= input.sets && atLoad.every((set) => set.reps >= target)
        })
        return Math.max(highest, ...achievedLoad)
      }, 0)
      if (achievedWeight > weights[index]) {
        weights[index] = achievedWeight
        achieved = true
      }
    })
    if (achieved) {
      const topIndex = ascendingPyramid ? input.setReps!.indexOf(Math.min(...input.setReps!)) : 0
      if (!miss || weights[topIndex] > miss.newWeight) reason = 'achieved_floor'
    }
  }

  // R22b: a pyramid built from straight-set history fills upward within one step of the next set.
  const hasPriorPyramid = progressing.some((session) =>
    session.technique === input.technique &&
    new Set(progressionSets(session.sets, targets.length).map((set) => set.weight)).size > 1)
  if (ascendingPyramid && !hasPriorPyramid) {
    for (let index = weights.length - 2; index >= 0; index -= 1) {
      weights[index] = Math.min(weights[index + 1], Math.max(weights[index], weights[index + 1] - step))
    }
  }

  // R23: same-day evidence may add one step, but can never exceed the latest any-day session.
  const sameDay = floorsApply ? sameDaySession(input, progressing) : undefined
  if (sameDay && !missDrop) {
    const sameDaySets = progressionSets(sameDay.sets, input.sets)
    const latestSets = progressionSets(last.sets, input.sets)
    let boosted = false
    if (ascendingPyramid) {
      targets.forEach((target, index) => {
        const performed = sameDaySets[index]
        const cap = latestSets[index]?.weight ?? lastWeight
        if (performed && performed.reps >= target + 2) {
          const boost = Math.min(performed.weight + step, cap)
          if (boost > weights[index]) {
            weights[index] = boost
            boosted = true
          }
        }
      })
    } else {
      const complete = sameDaySets.length >= input.sets
      const crunch = input.exerciseId === 'cable-crunch'
      const reachedTop = complete && sameDaySets.every((set) =>
        set.reps >= input.target.max + (crunch ? 2 : 0))
      const coarseStep = step / Math.max(1, workingWeight(sameDaySets)) > MAX_INCREASE_PCT
      const earned = reachedTop || (complete && coarseStep && sameDaySets.every((set) => set.reps >= input.target.max + 2))
      if (earned) {
        const sameDayWeight = workingWeight(sameDaySets)
        const boost = Math.min(sameDayWeight + step, lastWeight)
        if (boost > weights[0]) {
          weights[0] = boost
          boosted = true
        }
      }
    }
    if (boosted) reason = 'same_day_boost'
  }

  const finalMiss = capRecentMisses(input, weights, missTargets, recentMisses(input, progressing), step, progressing, true)
  if (finalMiss) {
    reason = 'recent_miss_cap'
    recommendation = { ...recommendation, evidence: { ...recommendation.evidence, recentMiss: finalMiss } }
  }

  const result = !pyramid
    ? (() => {
      const weight = weights[0]
      const action = weight === recommendation.weight
        ? recommendation.action
        : weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
      return { ...recommendation, weight, action, reason }
    })()
    : (() => {
      const setReps = input.setReps!
      const topIndex = setReps.indexOf(Math.min(...setReps))
      const weight = weights[topIndex]
      const action = weight === recommendation.weight
        ? recommendation.action
        : weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
      return { ...recommendation, weight, setWeights: weights, action, reason }
    })()
  return applyLikeForLikeAction(input, last, result)
}

function applyLikeForLikeAction(
  input: RecommendInput,
  last: SessionEvidence,
  recommendation: Recommendation
): Recommendation {
  if (recommendation.weight === null) return recommendation
  const lastTarget = last.target ?? input.target
  const sameDayWeight = recommendation.evidence.sameDayWeight
  const finalWeight = recommendation.setWeights?.[input.setReps?.indexOf(Math.min(...input.setReps)) ?? -1] ??
    recommendation.weight
  const comparisonWeight = sameDayWeight ?? topWorkingWeight(last, input.sets)
  const changedTarget = !sameRange(lastTarget, input.target)
  const protectedReason = ['below_target_twice', 'deload_week', 'long_break', 'recent_miss_cap']
    .includes(recommendation.reason)
  let action = recommendation.action
  if (changedTarget && !protectedReason) {
    if (finalWeight > comparisonWeight) action = 'increase_weight'
    else if (finalWeight < comparisonWeight) {
      action = sameDayWeight === undefined && recommendation.reason === 'converted_rep_range'
        ? 'maintain'
        : 'decrease_weight'
    } else if (action === 'increase_weight' || action === 'decrease_weight') {
      action = 'maintain'
    }
  }
  if (action === 'increase_weight' && finalWeight <= comparisonWeight) action = 'maintain'
  if (action === 'decrease_weight' && finalWeight >= comparisonWeight) action = 'maintain'

  const sameDayReps = recommendation.evidence.sameDayReps ?? []
  const sameDayTarget = recommendation.evidence.sameDayTarget
  let reason = recommendation.reason
  if (
    sameDayWeight !== undefined &&
    finalWeight === sameDayWeight &&
    sameDayTarget !== undefined &&
    sameRange(sameDayTarget, input.target) &&
    !['recent_miss_cap', 'same_day_boost', 'below_target_twice', 'reached_top_of_range'].includes(reason) &&
    sameDayReps.some((reps) => reps < input.target.min)
  ) {
    reason = belowTargetReason(sameDayReps, input.target)
  }
  if (
    (action === 'increase_weight' || action === 'decrease_weight') &&
    ['light_load_add_reps', 'within_range', 'slightly_below_target', 'below_target_once'].includes(reason)
  ) {
    reason = 'converted_rep_range'
  }
  return {
    ...recommendation,
    action,
    reason,
  }
}

function applyReversePyramidFloors(
  input: RecommendInput,
  progressing: SessionEvidence[],
  last: SessionEvidence,
  lastSets: LoggedSet[],
  lastWeight: number,
  step: number,
  recommendation: Recommendation,
  weights: number[]
): Recommendation {
  if (recommendation.reason === 'below_target_twice') return recommendation

  const setReps = input.setReps!
  const topReps = Math.min(...setReps)
  const topIndex = setReps.indexOf(topReps)
  const latestIsReversePyramid = last.technique === 'reverse-pyramid' &&
    new Set(lastSets.map((set) => set.weight)).size > 1

  const recent = progressing.filter((session) => {
    const days = daysBetween(session.date, input.today)
    return days >= 0 && days <= 28
  })

  const workingReps = lastSets.filter((set) => set.weight === lastWeight).map((set) => set.reps)
  if (!latestIsReversePyramid && lastWeight > 0 && workingReps.length) {
    const seriesReps = Math.min(median(workingReps), 12)
    const e1rm = lastWeight * (1 + seriesReps / 30)
    const crossTop = roundToStep(e1rm / (1 + (topReps + 1) / 30), step, 'down')
    weights[topIndex] = Math.max(weights[topIndex], crossTop)
  }

  const sameTechniquePyramids = progressing.filter((session) =>
    session.technique === input.technique &&
    new Set(progressionSets(session.sets, setReps.length).map((set) => set.weight)).size > 1)
  const latestSets = progressionSets(last.sets, input.sets)
  let topCap = !latestIsReversePyramid && lastWeight > 0 && last.technique !== 'reverse-pyramid'
    ? setCap(lastWeight, step)
    : Number.POSITIVE_INFINITY
  if (!sameTechniquePyramids.length && latestSets.length > 0 &&
    new Set(latestSets.map((set) => set.weight)).size === 1) {
    const latestRange = last.target ?? input.target
    const previousSets = progressionSets(progressing[1]?.sets ?? [], setReps.length)
    const previousRange = progressing[1]?.target ?? { min: topReps, max: topReps }
    const latestReachedTop = latestSets.every((set) => set.reps >= latestRange.max)
    const previousReachedTop = previousSets.length > 0 &&
      new Set(previousSets.map((set) => set.weight)).size === 1 &&
      previousSets[0].weight === lastWeight &&
      previousSets.every((set) => set.reps >= previousRange.max)
    const tooEasy = latestSets.every((set) => set.reps >= latestRange.max) &&
      latestSets.filter((set) => set.reps >= latestRange.max + 3).length >= Math.ceil(latestSets.length / 2)
    const earnedByCrossDay = latestSets.every((set) => set.reps >= latestRange.max + 2)
    if (!((latestReachedTop && previousReachedTop) || tooEasy || earnedByCrossDay)) {
      topCap = Math.min(topCap, lastWeight)
    }
  }
  weights[topIndex] = Math.min(weights[topIndex], topCap)

  const topProof = recent.reduce((highest, session) => {
    const achieved = progressionSets(session.sets, input.sets)
      .filter((set) => set.reps >= topReps)
      .reduce((weight, set) => Math.max(weight, set.weight), 0)
    return Math.max(highest, achieved)
  }, 0)
  const cappedTopProof = latestIsReversePyramid ? topProof : Math.min(topProof, topCap)
  if (cappedTopProof > weights[topIndex]) weights[topIndex] = cappedTopProof

  const top = weights[topIndex]
  const backOffFormat = new Set(setReps.filter((_, index) => index !== topIndex)).size === 1
  const lastPyramidSets = sameTechniquePyramids[0]
    ? progressionSets(sameTechniquePyramids[0].sets, setReps.length)
    : []
  setReps.forEach((reps, index) => {
    if (index === topIndex) return
    let load = backOffFormat
      ? roundToStep(top * 0.9, step, 'down')
      : roundToStep((top * (1 + (topReps + 1) / 30)) / (1 + (reps + 2) / 30), step, 'nearest')
    const priorLoad = lastPyramidSets[index]?.weight
    if (!backOffFormat && priorLoad !== undefined && priorLoad > 0) {
      load = Math.min(load, setCap(priorLoad, step))
    }
    weights[index] = load
  })

  let achieved = false
  setReps.forEach((targetReps, index) => {
    if (index === topIndex) return
    const floor = recent.reduce((highest, session) => {
      const sessionSets = progressionSets(session.sets, input.sets)
      const straight = session.technique === 'straight' ||
        (!session.technique && new Set(sessionSets.map((set) => set.weight)).size === 1)
      const wholeStraightSessionReachedTarget = straight &&
        sessionSets.length >= input.sets &&
        sessionSets.every((set) => set.reps >= targetReps)
      return Math.max(highest, ...sessionSets
        .filter((set, setIndex) => set.reps >= targetReps && (setIndex > 0 || wholeStraightSessionReachedTarget))
        .map((set) => set.weight))
    }, 0)
    if (floor > weights[index]) {
      weights[index] = floor
      achieved = true
    }
  })
  if (achieved) recommendation = { ...recommendation, reason: 'achieved_floor' }

  const sameDay = input.dayKey
    ? progressing.find((session) =>
      session.dayKey === input.dayKey &&
      (input.blockId === undefined || session.blockId === input.blockId) &&
      session.date < input.today)
    : undefined
  if (sameDay) {
    const sameDaySets = progressionSets(sameDay.sets, input.sets)
    let boosted = false
    setReps.forEach((target, index) => {
      const performed = sameDaySets[index]
      const cap = latestSets[index]?.weight ?? lastWeight
      if (performed && performed.reps >= target + 2) {
        const boost = Math.min(performed.weight + step, cap)
        if (boost > weights[index]) {
          weights[index] = boost
          boosted = true
        }
      }
    })
    if (boosted) recommendation = { ...recommendation, reason: 'same_day_boost' }
  }

  const finalTop = weights[topIndex]
  setReps.forEach((_, index) => {
    if (index !== topIndex) weights[index] = Math.min(weights[index], finalTop - step)
  })
  monotonic(weights, setReps)
  const previousTop = lastSets[topIndex]?.weight ?? lastWeight
  const action = latestIsReversePyramid
    ? finalTop === recommendation.weight
      ? recommendation.action
      : finalTop > previousTop ? 'increase_weight' : finalTop < previousTop ? 'decrease_weight' : 'maintain'
    : finalTop > lastWeight ? 'increase_weight' : finalTop < lastWeight ? 'decrease_weight' : 'maintain'
  return { ...recommendation, weight: finalTop, setWeights: weights, action }
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
  // R17: a "pyramid" session logged at one load on every set is straight-set history.
  const sameTechnique = progressing.filter((session) =>
    session.technique === input.technique &&
    new Set(progressionSets(session.sets, planned.length).map((set) => set.weight)).size > 1)
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
    const lastLoad = progressing[0] ? workingWeight(progressionSets(progressing[0].sets, planned.length)) : 0
    action = top === lastLoad ? 'maintain' : 'increase_weight'
    reason = 'converted_rep_range'
  } else {
    const protocol = firstSessionProtocol(input)
    return {
      ...make('collect_data', protocol ? null : input.plannedWeight ?? null, 'no_history'),
      ...(protocol ? { firstSessionProtocol: protocol } : {}),
    }
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
  // R12b: final jump cap against the last working load when the pyramid is built from straight-set history (R1.3/R17).
  if (!lastLoads && progressing[0]) {
    const lastSession = progressionSets(progressing[0].sets, planned.length)
    const lastLoad = workingWeight(lastSession)
    if (lastLoad > 0) {
      // R17b: a pyramid built from single-load history never goes above that load, unless (a) the two most recent
      // sessions were both single-load at that load and reached the top of their range, or (b) the last was too easy.
      const single = (session?: SessionEvidence) => {
        const loaded = session ? progressionSets(session.sets, planned.length) : []
        return loaded.length > 0 && new Set(loaded.map((set) => set.weight)).size === 1 ? loaded : null
      }
      const reachedTop = (session?: SessionEvidence) => {
        const loaded = single(session)
        const range = session?.target ?? { min: topReps, max: topReps }
        return !!loaded && loaded[0].weight === lastLoad && loaded.every((set) => set.reps >= range.max)
      }
      const lastRange = progressing[0].target ?? { min: topReps, max: topReps }
      const tooEasy = lastSession.every((set) => set.reps >= lastRange.max) &&
        lastSession.filter((set) => set.reps >= lastRange.max + 3).length >= Math.ceil(lastSession.length / 2)
      const singleLoad = !!single(progressing[0])
      const earnedByCrossDay = input.technique === 'reverse-pyramid' &&
        lastSession.every((set) => set.reps >= lastRange.max + 2)
      const earned = (reachedTop(progressing[0]) && reachedTop(progressing[1])) || tooEasy || earnedByCrossDay
      const cap = singleLoad && !earned ? lastLoad : setCap(lastLoad, step)
      setWeights.forEach((weight, index) => { setWeights[index] = Math.min(weight, cap) })
      top = setWeights[topIndex]
      if (top === lastLoad) action = 'maintain'
    }
  }
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
  const result = recommendStraightRules(input, progressing, lastSets, lastWeight, capacity, confidence, step, make)
  const last = progressing[0]
  const repsReference = input.exerciseId === 'cable-crunch' && last &&
    !sameRange(last.target ?? input.target, input.target)
    ? progressionSets(sameDaySession(input, progressing)?.sets ?? [], input.sets)
    : lastSets
  if (result.weight === null || isBodyweight(input.equipment) && lastWeight === 0) return applyR15(result, repsReference, input.target)
  let { weight, action, reason } = result
  // R18: add load only when every working set used the working load.
  const allAtLoad = lastSets.every((set) => set.weight >= lastWeight)
  const lastWasRealPyramid = !!last && isPyramid(last.technique, last.setReps) &&
    new Set(lastSets.map((set) => set.weight)).size > 1
  if (!lastWasRealPyramid && !allAtLoad && weight > lastWeight) {
    weight = lastWeight
    action = 'maintain'
    reason = 'consolidate_load'
  }
  // R12b: final jump cap — max(1 step, min(+10 %, 2 steps)) above the last working load, rounded down.
  if (lastWeight > 0) weight = Math.min(weight, setCap(lastWeight, step))
  const finalAction: TrainerAction = weight === result.weight ? action
    : weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
  return applyR15({ ...result, weight, action: finalAction, reason }, repsReference, input.target)
}

/** R15: an "increase reps" target always asks for more reps than the lowest set last time. */
function applyR15(result: Recommendation, lastSets: LoggedSet[], target: RepRange): Recommendation {
  if (result.action !== 'increase_reps' || !lastSets.length) return result
  const atLoad = lastSets.filter((set) => set.weight === result.weight)
  const mLast = Math.min(...(atLoad.length ? atLoad : lastSets).map((set) => set.reps))
  return { ...result, reps: { min: Math.max(target.min, mLast + 1), max: Math.max(target.min, mLast + 2) } }
}

function recommendStraightRules(
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
    if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', 0, belowTargetReason(lastReps, lastTarget))
    return make('increase_reps', 0, 'bodyweight_add_reps')
  }

  // Guardrail: at most +10 % or 2 steps, always one step allowed; an outlier allows one step only.
  const maxWeight = capacity?.latestIsOutlier
    ? lastWeight + step
    : Math.max(lastWeight + step, Math.min(lastWeight * (1 + MAX_INCREASE_PCT), lastWeight + 2 * step))
  const capped = (weight: number) => Math.min(weight, roundToStep(maxWeight, step, 'down'))
  const strong = confidence !== 'low'
  // R14: "too easy" = complete, every set at the top of the range and at least half 3+ reps above it.
  const tooEasyFor = (range: RepRange) =>
    complete && lastReps.every((reps) => reps >= range.max) &&
    lastReps.filter((reps) => reps >= range.max + 3).length >= Math.ceil(lastReps.length / 2)

  // R16: cable crunch — reps first, then exactly one step once every set reaches max + 2.
  if (input.exerciseId === 'cable-crunch' && lastWeight > 0 && sameRange(lastTarget, target)) {
    if (complete && lastReps.every((reps) => reps >= target.max + 2)) {
      return make('increase_weight', lastWeight + step, 'reached_top_of_range')
    }
    if (lastReps.some((reps) => reps < target.min)) return make('maintain', lastWeight, belowTargetReason(lastReps, target))
    return make('increase_reps', lastWeight, 'light_load_add_reps')
  }

  // R29: changed crunch targets keep progressing reps from the latest same-day session.
  if (input.exerciseId === 'cable-crunch' && lastWeight > 0 && !sameRange(lastTarget, target)) {
    const sameDay = sameDaySession(input, progressing)
    if (sameDay) {
      const sameDaySets = progressionSets(sameDay.sets, sets)
      const sameDayWeight = topWorkingWeight(sameDay, sets)
      if (sameDaySets.length >= sets && sameDaySets.every((set) => set.reps >= target.max + 2)) {
        return make('increase_weight', sameDayWeight + step, 'reached_top_of_range')
      }
      if (sameDaySets.some((set) => set.reps < target.min)) {
        return make('maintain', sameDayWeight, belowTargetReason(sameDaySets.map((set) => set.reps), target))
      }
      return make('increase_reps', sameDayWeight, 'light_load_add_reps')
    }
  }

  // R8: light loads — when one step is more than 10 % of the load, add reps to max + 2 before adding the step.
  // (Added load on bodyweight work follows normal straight-set rules — R7, T9/T21.)
  if (!isBodyweight(input.equipment) && lastWeight > 0 && step / lastWeight > MAX_INCREASE_PCT && sameRange(lastTarget, target)) {
    if ((complete && lastReps.every((reps) => reps >= target.max + 2)) || tooEasyFor(target)) {
      return make('increase_weight', lastWeight + step, 'reached_top_of_range', { reps: { min: target.min, max: target.min } })
    }
    if (lastReps.some((reps) => reps < target.min)) return make('maintain', lastWeight, belowTargetReason(lastReps, target))
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
    // PT 2026-10-07: the R8 coarse-step guard also covers rep-range conversion — when one step is more than 10 % of
    // the last load, keep the load and use today's reps (never convert a 5 kg cable load down to 0 kg).
    if (lastWeight > 0 && step / lastWeight > MAX_INCREASE_PCT) {
      // PT: one session missed by 3+ reps on 2+ sets → keep; two in a row → drop exactly one step (never 0).
      const missedBy3 = (session?: SessionEvidence) => {
        if (!session) return false
        const t = session.target ?? target
        return progressionSets(session.sets, sets).filter((set) => t.min - set.reps >= 3).length >= 2
      }
      const [sameTargetLatest, sameTargetPrevious] = sameTargetSessions(input, progressing, lastTarget, last.dayKey)
      if (missedBy3(sameTargetLatest) && missedBy3(sameTargetPrevious)) {
        return make('decrease_weight', Math.max(step, lastWeight - step), 'below_target_twice')
      }
      // R19: higher rep target after any miss (even one rep) drops exactly one step when Epley says so.
      const anyMiss = lastReps.some((reps) => reps < lastTarget.min)
      if (target.min > lastTarget.max && anyMiss) {
        const meanReps = lastReps.reduce((sum, reps) => sum + reps, 0) / lastReps.length
        const e1rm = lastWeight * (1 + meanReps / 30)
        const load = e1rm / (1 + (target.min + 2) / 30)
        if (load <= lastWeight - step / 2) return make('maintain', Math.max(step, lastWeight - step), 'converted_rep_range')
      }
      const missed = missedBy3(sameTargetLatest)
      return make(!missed && target.min > lastTarget.max ? 'increase_reps' : 'maintain', lastWeight, missed ? belowTargetReason(lastReps, target) : 'light_load_add_reps')
    }
    // R13: never below the load that matches what was already done at those reps.
    const atWorking = lastSets.filter((set) => set.weight === lastWeight).map((set) => set.reps)
    const rSeries = median(atWorking)
    const floorLoad = rSeries >= target.min
      ? lastWeight
      : roundToStep(lastWeight * (1 + rSeries / 30) / (1 + target.min / 30), step, 'down')
    weight = Math.max(weight, floorLoad)
    weight = Math.min(weight, roundToStep(maxWeight, step, 'down'))
    const action: TrainerAction = weight > lastWeight ? 'increase_weight' : weight < lastWeight ? 'decrease_weight' : 'maintain'
    return make(action, weight, 'converted_rep_range')
  }

  const exceeded = tooEasyFor(lastTarget) // R14 replaces "every set ≥ max + 3"
  const atTop = lastReps.every((reps) => reps >= lastTarget.max)
  const belowBy3 = lastReps.filter((reps) => lastTarget.min - reps >= 3).length
  const dropOff = lastReps.length > 1 && lastReps[0] >= lastTarget.min && lastReps.slice(1).some((reps) => lastTarget.min - reps >= 3)

  const stepResult = (): Recommendation => {
    if (!complete) {
      // R6: incomplete session → at most the same load.
      if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', lastWeight, belowTargetReason(lastReps, lastTarget))
      return make('maintain', lastWeight, 'incomplete_session')
    }
    if (exceeded && capacity) {
      const byCapacity = roundToStep(loadForReps(capacity.oneRepMax, target.min, effectiveReserve(RESERVE_REPS, input.calibrationOffset)), step, strong ? 'up' : 'down')
      return make('increase_weight', capped(Math.max(byCapacity, lastWeight + step)), capacity.latestIsOutlier ? 'outlier_capped' : 'exceeded_target')
    }
    if (atTop) return make('increase_weight', capped(lastWeight + step), 'reached_top_of_range')
    if (dropOff) return make('maintain', lastWeight, 'drop_off_across_sets')
    const [sameTargetLatest, sameTargetPrevious] = sameTargetSessions(input, progressing)
    const stallMiss = (session?: SessionEvidence) => {
      if (!session) return false
      const logged = progressionSets(session.sets, sets)
      return lastTarget.min - median(logged.map((set) => set.reps)) >= 2
    }
    if (sameTargetLatest && sameTargetPrevious &&
      workingWeight(sameTargetLatest.sets) === workingWeight(sameTargetPrevious.sets) &&
      stallMiss(sameTargetLatest) && stallMiss(sameTargetPrevious) &&
      progressionSets(sameTargetLatest.sets, sets).reduce((sum, set) => sum + set.reps, 0) <=
        progressionSets(sameTargetPrevious.sets, sets).reduce((sum, set) => sum + set.reps, 0)) {
      return make('decrease_weight', Math.max(step, workingWeight(sameTargetLatest.sets) - step), 'below_target_twice')
    }
    const previousMedian = sameTargetPrevious
      ? median(progressionSets(sameTargetPrevious.sets, sets).map((set) => set.reps))
      : undefined
    const latestTotal = sameTargetLatest
      ? progressionSets(sameTargetLatest.sets, sets).reduce((sum, set) => sum + set.reps, 0)
      : 0
    const previousTotal = sameTargetPrevious
      ? progressionSets(sameTargetPrevious.sets, sets).reduce((sum, set) => sum + set.reps, 0)
      : 0
    const improvingAfterMiss = sameTargetLatest && sameTargetPrevious && previousMedian !== undefined &&
      lastTarget.min - previousMedian >= 2 &&
      lastTarget.min - median(lastReps) === 1 &&
      latestTotal > previousTotal
    if (improvingAfterMiss) return make('maintain', lastWeight, 'below_target_once')
    if (belowBy3 >= 2) {
      const previousBelow = sameTargetLatest && sameTargetPrevious &&
        progressionSets(sameTargetPrevious.sets, sets).filter((set) =>
          (sameTargetPrevious.target ?? target).min - set.reps >= 3).length >= 2
      if (previousBelow) return make('decrease_weight', roundToStep(lastWeight * 0.925, step, 'down'), 'below_target_twice')
      return make('maintain', lastWeight, belowTargetReason(lastReps, lastTarget))
    }
    if (lastReps.some((reps) => reps < lastTarget.min)) return make('maintain', lastWeight, belowTargetReason(lastReps, lastTarget))
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
