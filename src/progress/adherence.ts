import { TrainingBlock } from '../types'
import { AdherenceRate, ProgressEntry, AdherenceReport } from './types'
import {
  dateValue,
  findEntryBlock,
  plannedDayForEntry,
  prescribedReps,
  startOfWeek,
  workingSets,
} from './utils'

const DAY_MS = 24 * 60 * 60 * 1000

type DateSession = {
  date: string
  entries: ProgressEntry[]
  blockId?: string
  dayKey?: string
}

function groupByDate(entries: ProgressEntry[]): DateSession[] {
  const byDate = new Map<string, DateSession>()
  for (const entry of entries) {
    const date = entry.date.slice(0, 10)
    const session = byDate.get(date) ?? { date, entries: [], blockId: entry.blockId, dayKey: entry.dayKey }
    session.entries.push(entry)
    session.blockId ??= entry.blockId
    session.dayKey ??= entry.dayKey
    byDate.set(date, session)
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

function repsHitForDate(session: DateSession, blocks: TrainingBlock[]): AdherenceRate {
  const block = findEntryBlock(blocks, session)
  const day = block ? plannedDayForEntry(block, session) : null
  if (!block || !day) return { hitSets: 0, plannedSets: 0, hitRate: null }
  let hitSets = 0
  let plannedSets = 0
  for (const plan of day.exercises) {
    const loggedSets = workingSets(session.entries
      .filter((entry) => entry.exerciseId === plan.exerciseId)
      .flatMap((entry) => entry.sets))
    for (let index = 0; index < plan.sets; index += 1) {
      const target = prescribedReps(plan, index)
      if (target === null) continue
      plannedSets += 1
      if ((loggedSets[index]?.reps ?? 0) >= target) hitSets += 1
    }
  }
  return {
    hitSets,
    plannedSets,
    hitRate: plannedSets ? hitSets / plannedSets : null,
  }
}

function combinedRate(rates: AdherenceRate[]): AdherenceRate {
  const hitSets = rates.reduce((total, rate) => total + rate.hitSets, 0)
  const plannedSets = rates.reduce((total, rate) => total + rate.plannedSets, 0)
  return { hitSets, plannedSets, hitRate: plannedSets ? hitSets / plannedSets : null }
}

export function adherence(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  week: string
): AdherenceReport {
  const weekStart = startOfWeek(week)
  const weekStartValue = dateValue(weekStart)
  const weekEndValue = weekStartValue + 7 * DAY_MS
  const dates = groupByDate(entries)
  const weekSessions = dates.filter((session) => {
    const value = dateValue(session.date)
    return value >= weekStartValue && value < weekEndValue
  })
  const weeklyRate = combinedRate(weekSessions.map((session) => repsHitForDate(session, blocks)))
  const blockReports = blocks.map((block) => {
    const blockSessions = dates.filter((session) => findEntryBlock(blocks, session)?.id === block.id)
    const rates = blockSessions.map((session) => repsHitForDate(session, blocks))
    const rate = combinedRate(rates)
    return {
      blockId: block.id,
      blockNumber: block.number,
      sessionsDone: Math.min(blockSessions.length, 36),
      sessionsPlanned: 36,
      ...rate,
    }
  })

  return {
    week: {
      weekStart,
      sessionsDone: Math.min(weekSessions.length, 6),
      sessionsPlanned: 6,
      ...weeklyRate,
    },
    blocks: blockReports,
  }
}
