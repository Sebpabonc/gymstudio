import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import { compareLiftSessions } from './comparison'
import type { ProgressEntry, ProgressLiftSession } from './types'
import { dateValue, findBlockForDate, plannedExerciseForEntry, startOfWeek, workingSets } from './utils'
import { equivalentLiftSessions, progressLiftSessions } from './trends'

const DAY_MS = 24 * 60 * 60 * 1000

export type ConsistencyWeek = {
  weekStart: string
  plannedDays: number
  loggedPlannedDays: number
  sessions: number
  adherence: number | null
  complete: boolean
}

export type ConsistencyTrend = {
  weeks: ConsistencyWeek[]
  currentStreak: number
  longestStreak: number
  adherenceFourWeeks: number | null
}

function blockForWeek(sessions: ProgressLiftSession[], blocks: TrainingBlock[], weekStart: string) {
  return findBlockForDate(blocks, weekStart)
    ?? blocks.find((block) => sessions.some((session) => session.blockId === block.id && session.date >= weekStart
      && session.date < new Date(dateValue(weekStart) + 7 * DAY_MS).toISOString().slice(0, 10)))
    ?? null
}

export function consistencyTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  today: string
): ConsistencyTrend {
  const sessions = progressLiftSessions(entries, blocks).filter((session) => workingSets(session.sets).length > 0)
  const currentWeek = startOfWeek(today)
  const firstWeek = sessions.length ? startOfWeek(sessions[0].date) : currentWeek
  const weeks: ConsistencyWeek[] = []
  for (let cursor = dateValue(firstWeek); cursor <= dateValue(currentWeek); cursor += 7 * DAY_MS) {
    const weekStart = new Date(cursor).toISOString().slice(0, 10)
    const weekEnd = new Date(cursor + 7 * DAY_MS).toISOString().slice(0, 10)
    const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date < weekEnd)
    const block = blockForWeek(weekSessions, blocks, weekStart)
    const dayKeys = new Set(block?.days.map((day) => day.key) ?? [])
    const loggedDays = new Set(weekSessions.flatMap((session) => {
      const sessionBlockId = session.blockId ?? block?.id
      return sessionBlockId === block?.id && session.dayKey && dayKeys.has(session.dayKey)
        ? [`${sessionBlockId}:${session.dayKey}`]
        : []
    }))
    const sessionsByDate = new Set(weekSessions.map((session) => session.date))
    const plannedDays = block?.days.length ?? 0
    const complete = weekStart < currentWeek
    weeks.push({
      weekStart,
      plannedDays,
      loggedPlannedDays: Math.min(loggedDays.size, plannedDays),
      sessions: sessionsByDate.size,
      adherence: complete && plannedDays ? Math.min(loggedDays.size / plannedDays, 1) : null,
      complete,
    })
  }
  const completed = weeks.filter((week) => week.complete && week.plannedDays > 0)
  let currentStreak = 0
  for (let index = completed.length - 1; index >= 0; index -= 1) {
    const rate = completed[index].adherence
    if (rate === null || rate < PROGRESS_THRESHOLDS.adherenceStreakRate) break
    currentStreak += 1
  }
  let longestStreak = 0
  let run = 0
  for (const week of completed) {
    run = week.adherence !== null && week.adherence >= PROGRESS_THRESHOLDS.adherenceStreakRate ? run + 1 : 0
    longestStreak = Math.max(longestStreak, run)
  }
  const recent = completed.slice(-4)
  const planned = recent.reduce((total, week) => total + week.plannedDays, 0)
  const adhered = recent.reduce((total, week) => total + week.loggedPlannedDays, 0)
  return {
    weeks,
    currentStreak,
    longestStreak,
    adherenceFourWeeks: recent.length === 4 && planned ? adhered / planned : null,
  }
}

export function progressiveOverloadRate(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  today: string
) {
  const sessions = progressLiftSessions(entries, blocks)
  const thisWeek = startOfWeek(today)
  const windowStart = new Date(dateValue(thisWeek) - 4 * 7 * DAY_MS).toISOString().slice(0, 10)
  const byExercise = new Map<string, ProgressLiftSession[]>()
  for (const session of sessions) byExercise.set(session.exerciseId, [...(byExercise.get(session.exerciseId) ?? []), session])
  let improved = 0
  let comparable = 0
  for (const current of sessions) {
    if (current.date < windowStart || current.date >= thisWeek || current.deload) continue
    const history = byExercise.get(current.exerciseId) ?? []
    const previous = [...history].reverse().find((session) =>
      session.date < current.date && equivalentLiftSessions(session, current)
    )
    if (!previous || previous.deload) continue
    const verdict = compareLiftSessions(previous, current, exercises.find((exercise) => exercise.id === current.exerciseId), blocks).verdict
    if (verdict === 'target-changed' || verdict === 'traded' || verdict === 'baseline') continue
    comparable += 1
    if (verdict === 'improved') improved += 1
  }
  return {
    improved,
    comparable,
    rate: comparable >= PROGRESS_THRESHOLDS.overloadMinimumComparisons ? improved / comparable : null,
  }
}

export function plannedExerciseForProgressSession(session: ProgressLiftSession, blocks: TrainingBlock[]) {
  const block = blocks.find((item) => item.id === session.blockId)
  if (!block) return null
  return plannedExerciseForEntry(block, {
    date: session.date,
    dayKey: session.dayKey ?? undefined,
    exerciseId: session.exerciseId,
  })
}
