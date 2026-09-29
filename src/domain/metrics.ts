import { SetEntry } from './types'

export interface SetsSummary {
  setCount: number
  totalReps: number
  /** Sum of weight × reps, in kg. */
  volume: number
  /** Heaviest set (ties broken by reps). */
  topSet?: SetEntry
  /** Best estimated one-rep max across all sets (Epley), in kg. */
  bestE1RM: number
}

export function setVolume(set: SetEntry): number {
  return set.weight * set.reps
}

/** Epley formula. Returns 0 for sets without reps. */
export function estimatedOneRepMax(set: SetEntry): number {
  if (set.reps <= 0) return 0
  if (set.reps === 1) return set.weight
  return set.weight * (1 + set.reps / 30)
}

export function topSet(sets: SetEntry[]): SetEntry | undefined {
  let best: SetEntry | undefined
  for (const set of sets) {
    if (!best || set.weight > best.weight || (set.weight === best.weight && set.reps > best.reps)) {
      best = set
    }
  }
  return best
}

export function summarizeSets(sets: SetEntry[]): SetsSummary {
  return {
    setCount: sets.length,
    totalReps: sets.reduce((sum, s) => sum + s.reps, 0),
    volume: sets.reduce((sum, s) => sum + setVolume(s), 0),
    topSet: topSet(sets),
    bestE1RM: sets.reduce((max, s) => Math.max(max, estimatedOneRepMax(s)), 0),
  }
}

export type Trend = 'up' | 'down' | 'same'

export interface Comparison {
  topWeightDelta: number
  volumeDelta: number
  /** Relative volume change, e.g. 0.08 for +8%. Undefined if previous volume was 0. */
  volumeDeltaPct?: number
  e1rmDelta: number
  /** Overall verdict, driven by estimated 1RM, then volume. */
  trend: Trend
}

const EPSILON = 0.05

export function compareSummaries(current: SetsSummary, previous: SetsSummary): Comparison {
  const topWeightDelta = (current.topSet?.weight ?? 0) - (previous.topSet?.weight ?? 0)
  const volumeDelta = current.volume - previous.volume
  const e1rmDelta = current.bestE1RM - previous.bestE1RM

  const sign = (n: number): Trend => (n > EPSILON ? 'up' : n < -EPSILON ? 'down' : 'same')
  const e1rmTrend = sign(e1rmDelta)

  return {
    topWeightDelta,
    volumeDelta,
    volumeDeltaPct: previous.volume > 0 ? volumeDelta / previous.volume : undefined,
    e1rmDelta,
    trend: e1rmTrend !== 'same' ? e1rmTrend : sign(volumeDelta),
  }
}
