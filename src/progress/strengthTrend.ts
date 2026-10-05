import { formatNumber } from '../i18n/format'
import { Exercise, TrainingBlock } from '../types'
import { getExerciseDisplayName } from '../utils/storage'
import { workoutSetVolume } from '../utils/workoutSets'
import {
  DayType,
  DayTypeFilter,
  ProgressEntry,
  StrengthTrend,
  StrengthTrendPoint,
} from './types'
import {
  currentOrLatestBlock,
  defaultProgressI18n,
  bestSetIndex,
  findEntryBlock,
  getDayType,
  groupExerciseSessions,
  isDeloadWeek,
  ProgressI18n,
  sessionE1RM,
} from './utils'

export function strengthTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  today: string,
  dayType: DayTypeFilter = 'A',
  exercises: Exercise[] = [],
  { language, t }: ProgressI18n = defaultProgressI18n
): StrengthTrend {
  const points: StrengthTrendPoint[] = groupExerciseSessions(entries)
    .filter((session) => session.exerciseId === exerciseId)
    .flatMap((session) => {
      const block = findEntryBlock(blocks, session)
      if (isDeloadWeek(block, session.date)) return []
      const best = bestSetIndex(session.sets)
      const estimate = sessionE1RM(session.sets)
      if (estimate === null || best === null) return []
      const inferredDayType = getDayType(session, blocks)
      if (dayType !== 'all' && inferredDayType !== dayType) return []
      return [{
        date: session.date,
        e1rm: estimate,
        sets: session.sets,
        bestSetIndex: best,
        volume: session.sets.reduce((total, set) => total + workoutSetVolume(set), 0),
        dayType: inferredDayType,
        blockId: block?.id ?? null,
      }]
    })

  const block = currentOrLatestBlock(blocks, today)
  const blockPoints = points.filter((point) => point.blockId === (block?.id ?? null))
  const comparablePoints = blockPoints.filter((point) => point.dayType !== null)
  const first = comparablePoints[0]
  const latest = comparablePoints[comparablePoints.length - 1]
  const exercise = exercises.find((item) => item.id === exerciseId)
  const name = exercise ? getExerciseDisplayName(exercise, language) : exerciseId
  let takeaway = t('progress.trend.notEnough', { exercise: name })

  if (latest && comparablePoints.length === 1) {
    takeaway = t('progress.trend.firstSession', { exercise: name })
  } else if (first && latest) {
    const percent = ((latest.e1rm - first.e1rm) / first.e1rm) * 100
    const sign = percent > 0 ? '+' : percent < 0 ? '−' : ''
    takeaway = t('progress.trend.blockChange', {
      exercise: name,
      percent: `${sign}${formatNumber(language, Math.round(percent))}`,
      start: formatNumber(language, first.e1rm, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      end: formatNumber(language, latest.e1rm, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
      unit: t('progress.unit.kg'),
    })
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
      const sign = percent > 0 ? '+' : percent < 0 ? '−' : ''
      takeaway = t('progress.trend.previousBlock', {
        exercise: name,
        currentBlock: block.number,
        percent: `${sign}${formatNumber(language, Math.round(percent))}`,
        previousBlock: previousTrend.block.number,
      })
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
  exercises: Exercise[] = [],
  i18n: ProgressI18n = defaultProgressI18n
) {
  return strengthTrend(entries, blocks, exerciseId, '9999-12-31', dayType, exercises, i18n).points
}
