import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { ProgressEntry } from './types'
import { dateValue, findBlockForDate, isDeloadWeek, startOfWeek, workingSets } from './utils'
import { progressLiftSessions } from './trends'

const DAY_MS = 24 * 60 * 60 * 1000

export type ExerciseVolumeWeek = {
  weekStart: string
  complete: boolean
  deload: boolean
  volume: number | null
}

export type ExerciseVolumeTrend = {
  weeks: ExerciseVolumeWeek[]
  trendAvailable: boolean
  bodyweightUnloaded: boolean
}

export function exerciseVolumeTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercise: Exercise | undefined,
  today: string,
  startDate?: string,
  endDate = today
): ExerciseVolumeTrend {
  const sessions = progressLiftSessions(entries, blocks)
    .filter((session) => session.exerciseId === exercise?.id && session.date >= (startDate ?? '0000-01-01') && session.date <= endDate)
  const firstWeek = sessions.length ? startOfWeek(sessions[0].date) : startOfWeek(today)
  const lastWeek = startOfWeek(endDate)
  const unloadedBodyweight = exercise?.equipment?.trim().toLowerCase() === 'bodyweight'
    && sessions.every((session) => workingSets(session.sets).every((set) => set.weight <= 0))
  const weeks: ExerciseVolumeWeek[] = []
  for (let cursor = dateValue(firstWeek); cursor <= dateValue(lastWeek); cursor += 7 * DAY_MS) {
    const weekStart = new Date(cursor).toISOString().slice(0, 10)
    const weekEnd = new Date(cursor + 7 * DAY_MS).toISOString().slice(0, 10)
    const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date < weekEnd)
    const weekBlock = findBlockForDate(blocks, weekStart) ?? blocks.find((block) =>
      dateValue(weekStart) < dateValue(block.startDate) + block.weeks * 7 * DAY_MS
      && dateValue(weekEnd) > dateValue(block.startDate)
    ) ?? null
    const volume = unloadedBodyweight ? null : weekSessions.reduce((total, session) => total
      + workingSets(session.sets).reduce((sessionTotal, set) =>
        sessionTotal + set.weight * set.reps + (set.drop ? set.drop.weight * set.drop.reps : 0)
      , 0), 0)
    weeks.push({
      weekStart,
      complete: weekStart < startOfWeek(today),
      deload: weekSessions.length > 0
        ? weekSessions.every((session) => session.deload)
        : Boolean(weekBlock && isDeloadWeek(weekBlock, weekStart < weekBlock.startDate ? weekBlock.startDate : weekStart)),
      volume,
    })
  }
  const completeWeeks = weeks.filter((week) => week.complete && !week.deload && week.volume !== null)
  return {
    weeks,
    trendAvailable: !unloadedBodyweight && completeWeeks.length >= PROGRESS_THRESHOLDS.volumeTrendMinimumWeeks,
    bodyweightUnloaded: unloadedBodyweight,
  }
}
