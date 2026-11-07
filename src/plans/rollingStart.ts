import type { TrainingBlock, TrainingDay, WorkoutEntry } from '../types'
import { nextUnloggedDay } from '../utils/trainingBlocks'

/*
 * Same-day start (PT spec 2026-11-01-first-run-and-same-day-start, section 2, approved 2026-11-07).
 * A first-run plan starts on the date of its first logged set. Until then the start floats on today, so Today shows
 * Day 1 and the clock does not run. Weeks are 7 days from the start; nothing here assumes Monday.
 */

const DAY_MS = 86_400_000
const toValue = (date: string) => Date.parse(`${date.slice(0, 10)}T00:00:00Z`)
const toDate = (value: number) => new Date(value).toISOString().slice(0, 10)
export const addDays = (date: string, days: number) => toDate(toValue(date) + days * DAY_MS)

/** Earliest recommended day of each session, counted from the week's first day (spec table "Recommended rhythm"). */
const RHYTHM: Record<number, number[]> = { 3: [0, 2, 4], 4: [0, 1, 3, 4], 5: [0, 1, 3, 4, 5], 6: [0, 1, 2, 3, 4, 5] }
/** Minimum days after the session at each position before the next one (spec table "Rest between sessions"). */
const MIN_GAP: Record<number, number[]> = { 3: [2, 2, 2], 4: [1, 2, 1, 1], 5: [1, 2, 1, 1, 1], 6: [1, 1, 1, 1, 1, 1] }
/** The same plan day again: a partial session, or a repeat after a week rollover. */
const SAME_DAY_GAP = 2

export function startsOnFirstLog(block: TrainingBlock | null | undefined) {
  return !!block?.startsOnFirstLog
}

/** Before the first log, the start is today. */
export function withFloatingStart(block: TrainingBlock, today: string): TrainingBlock {
  if (!block.startsOnFirstLog || block.firstLoggedOn) return block
  return { ...block, startDate: today }
}

/** The plan with its start pinned to the first logged date, or null when nothing changes. */
export function pinFirstLog(block: TrainingBlock, history: readonly WorkoutEntry[]): TrainingBlock | null {
  if (!block.startsOnFirstLog || block.firstLoggedOn) return null
  const first = history
    .filter((entry) => entry.blockId === block.id && entry.sets.length > 0)
    .map((entry) => entry.date.slice(0, 10))
    .sort()[0]
  return first ? { ...block, startDate: first, firstLoggedOn: first } : null
}

/** Anchor for 7-day weeks: the block start for first-run plans, none (Monday weeks) for every other block. */
export function weekAnchor(block: TrainingBlock | null | undefined) {
  return block?.startsOnFirstLog ? block.startDate.slice(0, 10) : undefined
}

function sortedDays(block: TrainingBlock) {
  return [...block.days].sort((a, b) => a.position - b.position)
}

function gapAfter(block: TrainingBlock, day: TrainingDay) {
  const days = sortedDays(block)
  const gaps = MIN_GAP[days.length]
  const index = days.findIndex((item) => item.key === day.key)
  return gaps?.[index] ?? 1
}

/** PT review 2026-11-07: the gap depends on the pair. Same day: 2. Not the direct successor (after a dropped day): 2, except 6 days. */
function gapBetween(block: TrainingBlock, last: TrainingDay, next: TrainingDay) {
  if (last.key === next.key) return SAME_DAY_GAP
  const days = sortedDays(block)
  const index = days.findIndex((item) => item.key === last.key)
  const successor = days[(index + 1) % days.length]
  if (successor?.key !== next.key && days.length < 6) return 2
  return gapAfter(block, last)
}

type Session = { date: string; days: TrainingDay[] }

function sessions(block: TrainingBlock, history: readonly WorkoutEntry[]): Session[] {
  const byDate = new Map<string, TrainingDay[]>()
  for (const entry of history) {
    if (entry.blockId !== block.id || !entry.dayKey || entry.sets.length === 0) continue
    const day = block.days.find((item) => item.key === entry.dayKey)
    if (!day) continue
    const date = entry.date.slice(0, 10)
    const days = byDate.get(date) ?? []
    if (!days.some((item) => item.key === day.key)) days.push(day)
    byDate.set(date, days)
  }
  return [...byDate].map(([date, days]) => ({ date, days })).sort((a, b) => a.date.localeCompare(b.date))
}

export type RestRecommendation = { nextDay: TrainingDay; date: string }

/**
 * A rest day is recommended when today falls inside the minimum gap after the last session. It is advice, not a lock:
 * the next plan day stays available. Never on a day that already has a logged session.
 */
export function restRecommendation(block: TrainingBlock, history: readonly WorkoutEntry[], today: string): RestRecommendation | null {
  if (!block.startsOnFirstLog || !block.firstLoggedOn) return null
  const done = sessions(block, history)
  if (done.some((session) => session.date === today)) return null
  const last = [...done].reverse().find((session) => session.date < today)
  if (!last) return null
  const nextDay = nextUnloggedDay(block, [...history], today)
  if (!nextDay) return null
  // Two plan days on one date: the largest gap among them wins.
  const gap = Math.max(...last.days.map((day) => gapBetween(block, day, nextDay)))
  const date = addDays(last.date, gap)
  return date > today ? { nextDay, date } : null
}

/**
 * Dates for each plan day in one plan week: logged days keep their date; the rest follow the recommended rhythm,
 * moved along by the gaps after earlier sessions, and never before today.
 */
export function plannedDayDates(block: TrainingBlock, history: readonly WorkoutEntry[], weekStart: string, today: string) {
  const days = sortedDays(block)
  const rhythm = RHYTHM[days.length] ?? days.map((_, index) => index)
  const weekEnd = addDays(weekStart, 6)
  const dates = new Map<string, string>()
  let earliest: string | undefined
  days.forEach((day, index) => {
    const logged = history
      .filter((entry) => entry.blockId === block.id && entry.dayKey === day.key && entry.sets.length > 0)
      .map((entry) => entry.date.slice(0, 10))
      .filter((date) => date >= weekStart && date <= weekEnd)
      .sort()[0]
    let date = logged
    if (!date) {
      date = addDays(weekStart, rhythm[index] ?? index)
      if (earliest && date < earliest) date = earliest
      if (date < today && weekEnd >= today) date = today
    }
    dates.set(day.key, date)
    earliest = addDays(date, gapAfter(block, day))
  })
  return dates
}
