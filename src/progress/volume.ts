import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { ProgressEntry, ProgressLiftSession, ProgressSet } from './types'
import {
  blockWeek,
  dateValue,
  findBlockForDate,
  getDayType,
  isDeloadWeek,
  sessionE1RM,
  startOfWeek,
  workingSets,
} from './utils'
import { equipmentStep, progressLiftSessions } from './trends'

const DAY_MS = 24 * 60 * 60 * 1000
const VOLUME_CHANGE_BAND_PERCENT = 5
const MAX_PLAUSIBLE_REPS = 50

export type VolumeChange = 'more' | 'same' | 'less'

export type VolumeContextNote =
  | { code: 'deload' }
  | { code: 'heavier-weight' }
  | { code: 'fewer-sets'; current: number; previous: number }
  | { code: 'first-week-back' }
  | { code: 'best-set-held' }
  | { code: 'different-target' }

export type ExerciseVolumeWeek = {
  weekStart: string
  complete: boolean
  deload: boolean
  volume: number | null
  loggedDayCount: number
  plannedDayCount: number
  change: VolumeChange | null
  changePercent: number | null
  previousVolume: number | null
  contextNote: VolumeContextNote | null
}

export type ExerciseVolumeTrend = {
  weeks: ExerciseVolumeWeek[]
  trendAvailable: boolean
  bodyweightUnloaded: boolean
  blockTrend: {
    firstWeek: number
    lastWeek: number
    firstVolume: number
    lastVolume: number
    change: VolumeChange
    changePercent: number
  } | null
}

function weekDate(value: number) {
  return new Date(value).toISOString().slice(0, 10)
}

function plannedDayTypes(block: TrainingBlock | null, exerciseId: string) {
  if (!block) return new Set<'A' | 'B'>()
  return new Set(block.days
    .filter((day) => day.exercises.some((exercise) => exercise.exerciseId === exerciseId))
    .map((day) => getDayType({ date: block.startDate, dayKey: day.key }, [block]))
    .filter((type): type is 'A' | 'B' => type !== null))
}

function sessionDayTypes(sessions: ProgressLiftSession[], blocks: TrainingBlock[]) {
  return new Set(sessions
    .map((session) => getDayType({ date: session.date, dayKey: session.dayKey ?? undefined }, blocks))
    .filter((type): type is 'A' | 'B' => type !== null))
}

function sessionSetCount(sessions: ProgressLiftSession[]) {
  return sessions.reduce((total, session) => total + plausibleWorkingSets(session.sets).length, 0)
}

function plausibleWorkingSets(sets: ProgressSet[]) {
  return workingSets(sets).filter((set) => set.reps >= 1 && set.reps <= MAX_PLAUSIBLE_REPS)
}

export function sessionVolumeLoad(sets: ProgressSet[]) {
  return plausibleWorkingSets(sets).reduce((total, set) => total + set.weight * set.reps
    + (set.drop && set.drop.reps >= 1 && set.drop.reps <= MAX_PLAUSIBLE_REPS
      ? set.drop.weight * set.drop.reps
      : 0), 0)
}

function sessionTopLoad(session: ProgressLiftSession) {
  return Math.max(...plausibleWorkingSets(session.sets).map((set) => set.weight), 0)
}

function hasAddedLoad(session: ProgressLiftSession) {
  return plausibleWorkingSets(session.sets).some((set) =>
    set.weight > 0 || (set.drop?.weight ?? 0) > 0
  )
}

function weeklyBest(sessions: ProgressLiftSession[]) {
  return sessions.reduce<number | null>((best, session) => {
    const estimate = sessionE1RM(session.sets)
    return estimate !== null && (best === null || estimate > best) ? estimate : best
  }, null)
}

function classifyVolumeChange(previous: number, current: number): VolumeChange {
  const changePercent = ((current - previous) / previous) * 100
  if (changePercent >= VOLUME_CHANGE_BAND_PERCENT) return 'more'
  if (changePercent <= -VOLUME_CHANGE_BAND_PERCENT) return 'less'
  return 'same'
}

function weekBlock(blocks: TrainingBlock[], weekStart: string) {
  return findBlockForDate(blocks, weekStart) ?? blocks.find((block) =>
    dateValue(weekStart) < dateValue(block.startDate) + block.weeks * 7 * DAY_MS
    && dateValue(weekStart) + 7 * DAY_MS > dateValue(block.startDate)
  ) ?? null
}

function repTarget(block: TrainingBlock | null, exerciseId: string) {
  return block?.days.flatMap((day) => day.exercises)
    .find((planned) => planned.exerciseId === exerciseId)?.reps.join(',')
    ?? null
}

function firstWeekBack(
  sessions: ProgressLiftSession[],
  currentSessions: ProgressLiftSession[],
  block: TrainingBlock | null,
  weekStart: string,
  blocks: TrainingBlock[]
) {
  const previousWeek = weekDate(dateValue(weekStart) - 7 * DAY_MS)
  const previousBlock = weekBlock(blocks, previousWeek)
  if (previousBlock && isDeloadWeek(previousBlock, previousWeek)) return true
  const firstCurrentSession = currentSessions[0]
  const lastPreviousSession = sessions.filter((session) => session.date < weekStart).slice(-1)[0]
  if (!firstCurrentSession || !lastPreviousSession) return false
  if (dateValue(firstCurrentSession.date) - dateValue(lastPreviousSession.date) >= 21 * DAY_MS) return true
  return Boolean(block && lastPreviousSession.blockId !== block.id
    && dateValue(firstCurrentSession.date) - dateValue(lastPreviousSession.date) >= 21 * DAY_MS)
}

function heavierWeightThisWeek(
  sessions: ProgressLiftSession[],
  currentSessions: ProgressLiftSession[],
  weekStart: string,
  exercise: Exercise | undefined
) {
  const previousWeekStart = weekDate(dateValue(weekStart) - 7 * DAY_MS)
  const step = equipmentStep(exercise)
  return currentSessions.some((current) => {
    if (!current.dayKey) return false
    const previous = sessions.find((session) =>
      session.date >= previousWeekStart
      && session.date < weekStart
      && session.dayKey === current.dayKey
    )
    return previous !== undefined && sessionTopLoad(current) >= sessionTopLoad(previous) + step - Number.EPSILON
  })
}

function blockVolumeTrend(weeks: ExerciseVolumeWeek[], blocks: TrainingBlock[], today: string) {
  const block = findBlockForDate(blocks, today)
  if (!block) return null
  const complete = weeks.filter((week) => {
    const weekNumber = blockWeek(block, week.weekStart)
    return weekNumber !== null && week.complete && !week.deload && week.volume !== null
  })
  if (complete.length < 3) return null
  const first = complete[0]
  const last = complete[complete.length - 1]
  const firstWeek = blockWeek(block, first.weekStart)
  const lastWeek = blockWeek(block, last.weekStart)
  if (firstWeek === null || lastWeek === null || first.volume === null || last.volume === null || first.volume === 0) return null
  const changePercent = ((last.volume - first.volume) / first.volume) * 100
  return {
    firstWeek,
    lastWeek,
    firstVolume: first.volume,
    lastVolume: last.volume,
    change: classifyVolumeChange(first.volume, last.volume),
    changePercent,
  }
}

export function sessionVolumeComparison(
  current: ProgressLiftSession,
  previous: ProgressLiftSession | null,
  exercise: Exercise | undefined
) {
  if (!previous || current.exerciseId !== previous.exerciseId
    || !current.dayKey || current.dayKey !== previous.dayKey) return null
  if (exercise?.equipment?.trim().toLowerCase() === 'bodyweight'
    && (!hasAddedLoad(current) || !hasAddedLoad(previous))) return null
  return {
    current: sessionVolumeLoad(current.sets),
    previous: sessionVolumeLoad(previous.sets),
    heavierWeight: sessionTopLoad(current) >= sessionTopLoad(previous) + equipmentStep(exercise) - Number.EPSILON,
  }
}

export function exerciseVolumeTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercise: Exercise | undefined,
  today: string,
  startDate?: string,
  endDate = today
): ExerciseVolumeTrend {
  const allSessions = progressLiftSessions(entries, blocks)
    .filter((session) => session.exerciseId === exercise?.id && session.date <= endDate)
  const firstWeek = startOfWeek(allSessions[0]?.date ?? startDate ?? today)
  const visibleStartWeek = startOfWeek(startDate ?? firstWeek)
  const lastWeek = startOfWeek(endDate)
  const unloadedBodyweight = exercise?.equipment?.trim().toLowerCase() === 'bodyweight'
    && allSessions.every((session) => plausibleWorkingSets(session.sets).every((set) =>
      set.weight <= 0 && (set.drop?.weight ?? 0) <= 0
    ))
  const weeks: ExerciseVolumeWeek[] = []
  for (let cursor = dateValue(firstWeek); cursor <= dateValue(lastWeek); cursor += 7 * DAY_MS) {
    const weekStart = weekDate(cursor)
    const weekEnd = weekDate(cursor + 7 * DAY_MS)
    const sessions = allSessions.filter((session) => session.date >= weekStart && session.date < weekEnd)
    const block = weekBlock(blocks, weekStart)
    const planned = plannedDayTypes(block, exercise?.id ?? '')
    const logged = sessionDayTypes(sessions, blocks)
    const requiredDayTypes = planned.size ? planned : logged
    const loggedDayCount = [...requiredDayTypes].filter((type) => logged.has(type)).length
    const plannedDayCount = requiredDayTypes.size || new Set(sessions.map((session) => session.dayKey).filter(Boolean)).size
    const volume = unloadedBodyweight ? null : sessions.reduce((total, session) => total + sessionVolumeLoad(session.sets), 0)
    const deload = sessions.length
      ? sessions.some((session) => session.deload)
      : Boolean(block && isDeloadWeek(block, weekStart < block.startDate ? block.startDate : weekStart))
    const complete = dateValue(weekEnd) <= dateValue(today)
      && plannedDayCount > 0
      && loggedDayCount === plannedDayCount
    const week: ExerciseVolumeWeek = {
      weekStart,
      complete,
      deload,
      volume,
      loggedDayCount,
      plannedDayCount,
      change: null,
      changePercent: null,
      previousVolume: null,
      contextNote: deload ? { code: 'deload' } : null,
    }
    weeks.push(week)
  }

  const historyWeeks = weeks
  for (let index = 0; index < historyWeeks.length; index += 1) {
    const current = historyWeeks[index]
    const currentSessions = allSessions.filter((session) => session.date >= current.weekStart
      && session.date < weekDate(dateValue(current.weekStart) + 7 * DAY_MS))
    if (!current.complete || current.deload || current.volume === null) continue
    const previous = [...historyWeeks.slice(0, index)].reverse()
      .find((week) => week.complete && !week.deload && week.volume !== null)
    const backFromBreak = firstWeekBack(allSessions, currentSessions, weekBlock(blocks, current.weekStart), current.weekStart, blocks)
    let differentTarget = false
    if (previous) {
      const previousBlock = weekBlock(blocks, previous.weekStart)
      const currentBlock = weekBlock(blocks, current.weekStart)
      differentTarget = previousBlock?.id !== currentBlock?.id
        && repTarget(previousBlock, exercise?.id ?? '') !== repTarget(currentBlock, exercise?.id ?? '')
    }
    if (backFromBreak) {
      current.contextNote = { code: 'first-week-back' }
      continue
    }
    if (differentTarget) {
      current.contextNote = { code: 'different-target' }
      continue
    }
    if (!previous || previous.volume === null || previous.volume <= 0) continue
    current.previousVolume = previous.volume
    current.changePercent = ((current.volume - previous.volume) / previous.volume) * 100
    current.change = classifyVolumeChange(previous.volume, current.volume)
    const currentSets = sessionSetCount(currentSessions)
    const previousSessions = allSessions.filter((session) => session.date >= previous.weekStart
      && session.date < weekDate(dateValue(previous.weekStart) + 7 * DAY_MS))
    const previousSets = sessionSetCount(previousSessions)
    const currentBest = weeklyBest(currentSessions)
    const previousBest = weeklyBest(previousSessions)
    if (current.change !== 'less') continue
    if (heavierWeightThisWeek(allSessions, currentSessions, current.weekStart, exercise)) {
      current.contextNote = { code: 'heavier-weight' }
    } else if (currentSets < previousSets) {
      current.contextNote = { code: 'fewer-sets', current: currentSets, previous: previousSets }
    } else if (currentBest !== null && previousBest !== null
      && ((currentBest - previousBest) / previousBest) * 100 >= -3) {
      current.contextNote = { code: 'best-set-held' }
    }
  }

  const completeWeeks = weeks.filter((week) => week.complete && !week.deload && week.volume !== null)
  const visibleWeeks = weeks.filter((week) => week.weekStart >= visibleStartWeek)
  return {
    weeks: visibleWeeks,
    trendAvailable: !unloadedBodyweight && completeWeeks.length >= PROGRESS_THRESHOLDS.volumeTrendMinimumWeeks,
    bodyweightUnloaded: unloadedBodyweight,
    blockTrend: blockVolumeTrend(weeks, blocks, today),
  }
}
