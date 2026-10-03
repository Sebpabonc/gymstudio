import { Exercise, TrainingBlock } from '../types'
import { BlockLiftReport, BlockReport, DayType, ProgressEntry } from './types'
import {
  blockWeek,
  findEntryBlock,
  getDayType,
  groupExerciseSessions,
  isDeloadWeek,
  percentChange,
  sessionE1RM,
  workingSets,
} from './utils'

function bestRepsValue(sessions: ReturnType<typeof groupExerciseSessions>) {
  const sets = sessions.flatMap((session) => workingSets(session.sets))
  if (!sets.length) return null
  const counts = new Map<number, number>()
  for (const set of sets) counts.set(set.weight, (counts.get(set.weight) ?? 0) + 1)
  const mostUsedWeight = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
  const matching = sets.filter((set) => set.weight === mostUsedWeight)
  return matching.length ? Math.max(...matching.map((set) => set.reps)) : null
}

function blockLiftValue(
  sessions: ReturnType<typeof groupExerciseSessions>,
  weekNumbers: number[],
  block: TrainingBlock
) {
  const window = sessions.filter((session) => {
    const week = blockWeek(block, session.date)
    return week !== null && weekNumbers.includes(week)
  })
  if (window.length < 2) return null
  const e1rmValues = window.map((session) => sessionE1RM(session.sets))
    .filter((value): value is number => value !== null)
  if (e1rmValues.length) {
    return { value: Math.max(...e1rmValues), metric: 'e1rm' as const }
  }
  const reps = bestRepsValue(window)
  return reps === null ? null : { value: reps, metric: 'reps' as const }
}

function median(values: number[]) {
  if (!values.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function blockReports(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  _exercises: Exercise[] = []
): BlockReport[] {
  const sessions = groupExerciseSessions(entries)
  return [...blocks].sort((a, b) => a.number - b.number).map((block) => {
    const grouped = new Map<string, typeof sessions>()
    for (const session of sessions) {
      const entryBlock = findEntryBlock(blocks, session)
      const dayType = getDayType(session, blocks)
      if (entryBlock?.id !== block.id || !dayType || isDeloadWeek(block, session.date)) continue
      const key = `${session.exerciseId}:${dayType}`
      grouped.set(key, [...(grouped.get(key) ?? []), session])
    }
    const lifts: BlockLiftReport[] = []
    for (const [key, exerciseSessions] of grouped) {
      const start = blockLiftValue(exerciseSessions, block.number === 8 ? [2] : [1, 2], block)
      const end = blockLiftValue(exerciseSessions, [5, 6], block)
      if (!start || !end || start.metric !== end.metric) continue
      const changePercent = percentChange(start.value, end.value)
      if (changePercent === null) continue
      const [exerciseId, dayType] = key.split(':') as [string, DayType]
      lifts.push({
        exerciseId,
        dayType,
        startValue: start.value,
        endValue: end.value,
        changePercent,
        metric: start.metric,
      })
    }
    return {
      blockId: block.id,
      blockNumber: block.number,
      method: block.method,
      lifts,
      medianChangePercent: median(lifts.map((lift) => lift.changePercent)),
      liftCount: lifts.length,
      improvedLiftCount: lifts.filter((lift) => lift.changePercent > 0).length,
    }
  })
}
