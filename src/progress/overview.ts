import type { WatchObservation } from './comparison'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { LiftTrend } from './types'

/**
 * Overview "Next session" order (PO 2026-11-07): a lift that is ready for more weight leads, then the lifts that
 * missed a target, then repeated loads, then first-time baselines. Within one code the engine's order is kept.
 */
const NEXT_SESSION_ORDER: Record<WatchObservation['code'], number> = { W2: 0, W1: 1, W3: 2, W6: 3 }

export function nextSessionWatches(watches: WatchObservation[], limit: number = PROGRESS_THRESHOLDS.watchMessageLimit) {
  return watches
    .map((watch, index) => ({ watch, index }))
    .sort((a, b) => NEXT_SESSION_ORDER[a.watch.code] - NEXT_SESSION_ORDER[b.watch.code] || a.index - b.index)
    .slice(0, limit)
    .map(({ watch }) => watch)
}

export type BaselineSummary = {
  /** Non-deload sessions of the main lift closest to its first verdict, capped at the target. */
  sessions: number
  target: number
}

/**
 * Overview shows one "Building your baseline" card while fewer than two main lifts have a verdict or no week is
 * complete yet. Uses the existing verdict rules only (`liftTrend`), no new thresholds.
 */
export function baselineSummary(trends: LiftTrend[], completeWeeks: number): BaselineSummary | null {
  const eligible = trends.filter((trend) => trend.verdict !== 'not-enough-data').length
  if (eligible >= 2 && completeWeeks > 0) return null
  const target = PROGRESS_THRESHOLDS.minimumTrendSessions
  const pending = trends.filter((trend) => trend.verdict === 'not-enough-data')
  const counts = (pending.length ? pending : trends).map((trend) => trend.points.filter((point) => !point.deload).length)
  return { sessions: Math.min(target, Math.max(0, ...counts)), target }
}
