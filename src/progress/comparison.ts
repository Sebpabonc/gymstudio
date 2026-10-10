import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import { equivalentLiftSessions, equipmentStep, progressLiftSessions, sameLoad } from './trends'
import type { ProgressEntry, ProgressLiftSession, SessionComparison } from './types'
import { findEntryBlock, plannedExerciseForEntry, prescribedReps, workingSets } from './utils'

type SetResult = 'improved' | 'held' | 'dropped' | 'traded'

function repTargets(session: ProgressLiftSession, blocks: TrainingBlock[]) {
  const entry = {
    exerciseId: session.exerciseId,
    date: session.date,
    blockId: session.blockId ?? undefined,
    dayKey: session.dayKey ?? undefined,
  }
  const block = findEntryBlock(blocks, entry)
  const plan = block ? plannedExerciseForEntry(block, entry) : null
  if (plan) return plan.reps.map((rep, index) => prescribedReps(plan, index))
  if (session.target) return [session.target.reps.max]
  return []
}

function changedTarget(previous: ProgressLiftSession, current: ProgressLiftSession, blocks: TrainingBlock[]) {
  const previousTargets = repTargets(previous, blocks)
  const currentTargets = repTargets(current, blocks)
  return previousTargets.length > 0 && currentTargets.length > 0
    && (previousTargets.length !== currentTargets.length
      || previousTargets.some((value, index) => value !== currentTargets[index]))
}

function resultForSet(
  previous: ProgressLiftSession['sets'][number],
  current: ProgressLiftSession['sets'][number],
  step: number,
  bodyweight: boolean
): SetResult {
  const loadDifference = bodyweight ? 0 : current.weight - previous.weight
  const repsDifference = current.reps - previous.reps
  if (loadDifference >= step) {
    if (repsDifference <= -2) return 'traded'
    return repsDifference >= -1 ? 'improved' : 'traded'
  }
  if (loadDifference <= -step) {
    if (repsDifference >= 2) return 'traded'
    return repsDifference <= 1 ? 'dropped' : 'traded'
  }
  if (repsDifference > 0) return 'improved'
  if (repsDifference < 0) return 'dropped'
  return 'held'
}

export function compareLiftSessions(
  previous: ProgressLiftSession | null,
  current: ProgressLiftSession,
  exercise: Exercise | undefined,
  blocks: TrainingBlock[] = []
): SessionComparison {
  const previousSets = previous ? workingSets(previous.sets) : []
  const currentSets = workingSets(current.sets)
  const base = {
    improvedSets: 0,
    heldSets: 0,
    droppedSets: 0,
    tradedSets: 0,
    workingSetCount: currentSets.length,
    previousWorkingSetCount: previousSets.length,
    messages: [] as string[],
  }
  if (!previous) return { ...base, verdict: 'baseline' }
  if (changedTarget(previous, current, blocks)) return { ...base, verdict: 'target-changed' }

  const bodyweight = exercise?.equipment?.trim().toLowerCase() === 'bodyweight'
  const step = equipmentStep(exercise)
  const outcomes: SetResult[] = []
  for (let index = 0; index < Math.min(previousSets.length, currentSets.length); index += 1) {
    outcomes.push(resultForSet(previousSets[index], currentSets[index], step, bodyweight))
  }
  const targets = repTargets(current, blocks)
  for (let index = previousSets.length; index < currentSets.length; index += 1) {
    const currentSet = currentSets[index]
    const previousSet = previousSets[previousSets.length - 1]
    const target = targets[index] ?? current.target?.reps.max ?? previousSet?.reps
    if (previousSet && (bodyweight || sameLoad(previousSet.weight, currentSet.weight, step)) && target !== undefined && currentSet.reps >= target) {
      outcomes.push('improved')
    }
  }

  const improvedSets = outcomes.filter((result) => result === 'improved').length
  const heldSets = outcomes.filter((result) => result === 'held').length
  const droppedSets = outcomes.filter((result) => result === 'dropped').length
  const tradedSets = outcomes.filter((result) => result === 'traded').length
  const verdict = improvedSets && droppedSets ? 'mixed'
    : improvedSets ? 'improved'
      : droppedSets ? 'dropped'
        : tradedSets ? 'traded'
          : heldSets || currentSets.length < previousSets.length ? 'held' : 'mixed'
  const messages = currentSets.length !== previousSets.length
    ? [`sets:${currentSets.length}:${previousSets.length}`]
    : []
  return { verdict, improvedSets, heldSets, droppedSets, tradedSets, workingSetCount: currentSets.length, previousWorkingSetCount: previousSets.length, messages }
}

export function latestEquivalentComparisons(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[]
) {
  const sessions = progressLiftSessions(entries, blocks)
  const latestByExercise = new Map<string, ProgressLiftSession[]>()
  for (const session of sessions) {
    latestByExercise.set(session.exerciseId, [...(latestByExercise.get(session.exerciseId) ?? []), session])
  }
  return [...latestByExercise].map(([exerciseId, history]) => {
    const latest = history[history.length - 1]
    const previous = [...history].reverse().slice(1).find((session) =>
      equivalentLiftSessions(session, latest)
    ) ?? null
    return {
      exerciseId,
      session: latest,
      previous,
      comparison: compareLiftSessions(previous, latest, exercises.find((item) => item.id === exerciseId), blocks),
    }
  })
}

export type WatchObservation = {
  exerciseId: string
  code: 'W1' | 'W2' | 'W3' | 'W4' | 'W5' | 'W6'
  params: Record<string, string | number>
  priority: number
}

const WATCH_PRIORITY = { W1: 6, W2: 5, W3: 4, W4: 3, W6: 2, W5: 1 } as const

export function watchObservations(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  limit = 3
): WatchObservation[] {
  const observations: WatchObservation[] = []
  for (const row of latestEquivalentComparisons(entries, blocks, exercises)) {
    const { session, previous, exerciseId } = row
    if (session.deload) continue
    const entry = {
      exerciseId,
      date: session.date,
      blockId: session.blockId ?? undefined,
      dayKey: session.dayKey ?? undefined,
    }
    const block = findEntryBlock(blocks, entry)
    const planned = block ? plannedExerciseForEntry(block, entry) : null
    const targets = repTargets(session, blocks)
    const sets = workingSets(session.sets)
    const target = planned ? targets[targets.length - 1] : session.target?.reps.min
    const lastSet = sets[sets.length - 1]
    const push = (code: WatchObservation['code'], params: WatchObservation['params']) => observations.push({
      exerciseId,
      code,
      params,
      priority: WATCH_PRIORITY[code],
    })
    if (lastSet && target && lastSet.reps < target) {
      push('W1', { reps: lastSet.reps, target })
      continue
    }
    const sameTopLoad = sets.length > 0 && sets.every((set) => sameLoad(set.weight, sets[0].weight, equipmentStep(exercises.find((item) => item.id === exerciseId))))
    const targetMax = session.target?.reps.max
    const meetsEveryTarget = sets.length > 0 && sets.every((set, index) =>
      set.reps >= (targets[index] ?? targetMax ?? Number.POSITIVE_INFINITY)
    )
    if (sameTopLoad && meetsEveryTarget) {
      push('W2', { target: targetMax ?? targets[0] ?? 0, weight: sets[0].weight })
      continue
    }
    if (previous && sets.length && sameLoad(
      Math.max(...sets.map((set) => set.weight)),
      Math.max(...workingSets(previous.sets).map((set) => set.weight), 0),
      equipmentStep(exercises.find((item) => item.id === exerciseId))
    )) {
      push('W3', { weight: Math.max(...sets.map((set) => set.weight)) })
      continue
    }
    if (lastSet?.rir === 0) {
      push('W4', {})
      continue
    }
    if (!previous) {
      push('W6', { date: session.date })
      continue
    }
    if (!Number.isFinite(lastSet?.rir)) {
      push('W5', {})
    }
  }
  return observations.sort((a, b) => b.priority - a.priority).slice(0, Math.min(limit, PROGRESS_THRESHOLDS.watchMessageLimit))
}
