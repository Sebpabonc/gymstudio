import { Exercise, TrainingBlock } from '../types'
import {
  DayType,
  DayTypeFilter,
  ProgressEntry,
  StrengthTrend,
  StrengthTrendPoint,
} from './types'
import {
  currentOrLatestBlock,
  findEntryBlock,
  getDayType,
  groupExerciseSessions,
  isDeloadWeek,
  sessionE1RM,
} from './utils'

export function strengthTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  today: string,
  dayType: DayTypeFilter = 'A',
  exercises: Exercise[] = []
): StrengthTrend {
  const points: StrengthTrendPoint[] = groupExerciseSessions(entries)
    .filter((session) => session.exerciseId === exerciseId)
    .flatMap((session) => {
      const block = findEntryBlock(blocks, session)
      if (isDeloadWeek(block, session.date)) return []
      const estimate = sessionE1RM(session.sets)
      if (estimate === null) return []
      const inferredDayType = getDayType(session, blocks)
      if (dayType !== 'all' && inferredDayType !== dayType) return []
      return [{
        date: session.date,
        e1rm: estimate,
        dayType: inferredDayType,
        blockId: block?.id ?? null,
      }]
    })

  const block = currentOrLatestBlock(blocks, today)
  const blockPoints = points.filter((point) => point.blockId === (block?.id ?? null))
  const comparablePoints = blockPoints.filter((point) => point.dayType !== null)
  const first = comparablePoints[0]
  const latest = comparablePoints[comparablePoints.length - 1]
  const name = exercises.find((exercise) => exercise.id === exerciseId)?.name ?? exerciseId
  let takeaway = `${name}: not enough data for a strength trend.`

  if (latest && comparablePoints.length === 1) {
    takeaway = `${name}: first session sets your baseline.`
  } else if (first && latest) {
    const percent = ((latest.e1rm - first.e1rm) / first.e1rm) * 100
    const sign = percent > 0 ? '+' : ''
    takeaway = `${name}: est. 1RM ${sign}${Math.round(percent)}% this block (${first.e1rm.toFixed(1)} → ${latest.e1rm.toFixed(1)} kg).`
  } else if (!comparablePoints.length && block) {
    const previousTrend = [...blocks]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((candidate) => ({
        block: candidate,
        points: points.filter((point) => point.blockId === candidate.id && point.dayType !== null),
      }))
      .find(({ block: candidate, points: candidatePoints }) =>
        candidate.startDate < block.startDate && candidatePoints.length >= 2
      )

    if (previousTrend) {
      const previousFirst = previousTrend.points[0]
      const previousLatest = previousTrend.points[previousTrend.points.length - 1]
      const percent = ((previousLatest.e1rm - previousFirst.e1rm) / previousFirst.e1rm) * 100
      const sign = percent > 0 ? '+' : ''
      takeaway = `${name}: Not in Block ${block.number} · last trend ${sign}${Math.round(percent)}% in Block ${previousTrend.block.number}.`
    }
  }

  return {
    exerciseId,
    points,
    isTrendAvailable: points.filter((point) => point.dayType !== null).length >= 3,
    takeaway,
  }
}

export function getStrengthTrendPoints(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  dayType: DayType | 'all' = 'A',
  exercises: Exercise[] = []
) {
  return strengthTrend(entries, blocks, exerciseId, '9999-12-31', dayType, exercises).points
}
