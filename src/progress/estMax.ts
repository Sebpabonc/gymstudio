import type { TrainingBlock, WorkoutEntry } from '../types'
import { getDayType, dateValue, workingSets } from './utils'
import { progressLiftSessions } from './trends'
import type { DayType, ProgressLiftSession, ProgressSet } from './types'

const DAY_MS = 24 * 60 * 60 * 1000
const COMPARISON_DAYS = 28
const CHANGE_BAND_PERCENT = 3

type SessionEstimate = {
  value: number
  bestSet: ProgressSet
}

export type EstMaxChange = 'up' | 'same' | 'lower'

export type AnyDayEstMaxComparison =
  | {
      kind: 'comparison'
      previous: ProgressLiftSession
      previousValue: number
      currentValue: number
      changePercent: number
      change: EstMaxChange
      previousDayType: DayType | null
      currentDayType: DayType | null
      previousRir: number | undefined
      currentRir: number | undefined
      effort: { before: number; now: number } | null
    }
  | {
      kind: 'different-rep-range'
      previous: ProgressLiftSession
      previousDayType: DayType
    }

    function sessionDayType(session: ProgressLiftSession, blocks: TrainingBlock[]) {
      return getDayType({ date: session.date, dayKey: session.dayKey ?? undefined }, blocks)
    }

    function estimateSession(session: ProgressLiftSession): SessionEstimate | null {
  const eligibleSets = workingSets(session.sets.filter((set) =>
    Number.isFinite(set.weight) && Number.isFinite(set.reps)
    && set.weight > 0 && set.reps >= 1 && set.reps <= 12
  ))
  let best: SessionEstimate | null = null
  for (const set of eligibleSets) {
    const value = set.weight * (1 + set.reps / 30)
    if (!best || value > best.value) best = { value, bestSet: set }
  }
  return best
}

export function roundEstMax(value: number) {
  return Math.round(value * 2) / 2
}

export function classifyEstMaxChange(previous: number, current: number): EstMaxChange {
  const changePercent = ((current - previous) / previous) * 100
  if (changePercent >= CHANGE_BAND_PERCENT) return 'up'
  if (changePercent <= -CHANGE_BAND_PERCENT) return 'lower'
  return 'same'
}

export function anyDayEstMaxComparison(
  currentEntry: WorkoutEntry,
  history: WorkoutEntry[],
  blocks: TrainingBlock[]
): AnyDayEstMaxComparison | null {
  const current = progressLiftSessions([currentEntry], blocks)[0]
  if (!current) return null
  const earliestDate = dateValue(current.date) - COMPARISON_DAYS * DAY_MS
  const previousSessions = progressLiftSessions(history.filter((entry) =>
    entry.exerciseId === current.exerciseId && entry.date.slice(0, 10) < current.date
  ), blocks).filter((session) =>
    session.date >= new Date(earliestDate).toISOString().slice(0, 10)
    && session.date < current.date
    && session.deload === current.deload
  )
  const previous = previousSessions[previousSessions.length - 1]
  if (!previous) return null

  const previousDayType = sessionDayType(previous, blocks)
  const currentDayType = sessionDayType(current, blocks)
  const previousEstimate = estimateSession(previous)
  const currentEstimate = estimateSession(current)
  if (!previousEstimate || !currentEstimate) {
    return previousDayType && currentDayType && previousDayType !== currentDayType
      ? { kind: 'different-rep-range', previous, previousDayType }
      : null
  }

  const changePercent = ((currentEstimate.value - previousEstimate.value) / previousEstimate.value) * 100
  return {
    kind: 'comparison',
    previous,
    previousValue: previousEstimate.value,
    currentValue: currentEstimate.value,
    changePercent,
    change: classifyEstMaxChange(previousEstimate.value, currentEstimate.value),
    previousDayType,
    currentDayType,
    previousRir: previousEstimate.bestSet.rir,
    currentRir: currentEstimate.bestSet.rir,
    effort: previousEstimate.bestSet.rir !== undefined && currentEstimate.bestSet.rir !== undefined
      && Math.abs(currentEstimate.bestSet.rir - previousEstimate.bestSet.rir) >= 2
      ? { before: previousEstimate.bestSet.rir, now: currentEstimate.bestSet.rir }
      : null,
  }
}

export type WeeklyEstMax = {
  current: { value: number; session: ProgressLiftSession } | null
  previous: { value: number; session: ProgressLiftSession } | null
  currentWeekComplete: boolean
  previousWeekComplete: boolean
  change: EstMaxChange | null
  changePercent: number | null
}

export function weeklyBestEstMax(
  sessions: ProgressLiftSession[],
  exerciseId: string,
  weekStart: string,
  blocks: TrainingBlock[]
): WeeklyEstMax {
  const weekStartValue = dateValue(weekStart)
  const sessionsForWeek = (start: number) => sessions
    .filter((session) => session.exerciseId === exerciseId && !session.deload
      && dateValue(session.date) >= start && dateValue(session.date) < start + 7 * DAY_MS)
  const best = (week: ProgressLiftSession[]) => week.reduce<WeeklyEstMax['current']>((highest, session) => {
    const estimate = estimateSession(session)
    return estimate && (!highest || estimate.value > highest.value)
      ? { value: estimate.value, session }
      : highest
  }, null)
  const currentSessions = sessionsForWeek(weekStartValue)
  const previousSessions = sessionsForWeek(weekStartValue - 7 * DAY_MS)
  const current = best(currentSessions)
  const previous = best(previousSessions)
  const currentDayTypes = new Set(currentSessions.map((session) => sessionDayType(session, blocks)).filter(Boolean))
  const previousDayTypes = new Set(previousSessions.map((session) => sessionDayType(session, blocks)).filter(Boolean))
  const changePercent = current && previous
    ? ((current.value - previous.value) / previous.value) * 100
    : null

  return {
    current,
    previous,
    currentWeekComplete: currentDayTypes.has('A') && currentDayTypes.has('B'),
    previousWeekComplete: previousDayTypes.has('A') && previousDayTypes.has('B'),
    change: current && previous ? classifyEstMaxChange(previous.value, current.value) : null,
    changePercent,
  }
}
