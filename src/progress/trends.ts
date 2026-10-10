import { TrainingBlock, Exercise } from '../types'
import { dateValue, findEntryBlock, groupExerciseSessions, isDeloadWeek, sessionE1RM, workingSets } from './utils'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { LiftTrend, LiftTrendIndexPoint, LiftTrendPoint, ProgressEntry, ProgressLiftSession, ProgressV3Range } from './types'

const DAY_MS = 24 * 60 * 60 * 1000

function dateString(value: number) {
  const date = new Date(value)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function progressLiftSessions(entries: ProgressEntry[], blocks: TrainingBlock[]): ProgressLiftSession[] {
  const grouped = new Map<string, ProgressLiftSession>()
  for (const entry of entries) {
    const date = entry.date.slice(0, 10)
    const block = findEntryBlock(blocks, entry)
    const blockId = block?.id ?? entry.blockId ?? null
    const dayKey = entry.dayKey ?? null
    const key = [entry.exerciseId, date, blockId ?? '', dayKey ?? ''].join(':')
    const session = grouped.get(key) ?? {
      exerciseId: entry.exerciseId,
      date,
      blockId,
      dayKey,
      sets: [],
      deload: isDeloadWeek(block, date),
      target: entry.target,
    }
    session.sets.push(...entry.sets)
    session.target ??= entry.target
    grouped.set(key, session)
  }
  return [...grouped.values()].sort((a, b) => a.date.localeCompare(b.date) || (a.dayKey ?? '').localeCompare(b.dayKey ?? ''))
}

export function equipmentStep(exercise: Exercise | undefined) {
  return /dumbbell|dumbbells/i.test(exercise?.equipment ?? '') ? 2 : 2.5
}

export function sameLoad(a: number, b: number, step: number) {
  return Math.abs(a - b) < step
}

export function equivalentLiftSessions(a: ProgressLiftSession, b: ProgressLiftSession) {
  return a.exerciseId === b.exerciseId
    && a.blockId === b.blockId
    && a.dayKey === b.dayKey
    && a.deload === b.deload
}

export function rangeStart(range: ProgressV3Range, today: string, activeBlock: TrainingBlock | null, entries: ProgressEntry[]) {
  if (range === 'block' && activeBlock) return activeBlock.startDate
  if (range === 'all') return entries.length ? entries.map((entry) => entry.date.slice(0, 10)).sort()[0] : today
  const days = range === '4w' ? 27 : 55
  return dateString(dateValue(today) - days * DAY_MS)
}

export function rangeEnd(range: ProgressV3Range, today: string, activeBlock: TrainingBlock | null) {
  if (range === 'block' && activeBlock) {
    const end = dateValue(activeBlock.startDate) + activeBlock.weeks * 7 * DAY_MS - DAY_MS
    return dateValue(today) < end ? today : dateString(end)
  }
  return today
}

function sessionStats(session: ProgressLiftSession, exercise: Exercise | undefined) {
  const sets = workingSets(session.sets).filter((set) =>
    set.reps >= 1 && set.reps <= 50 && (set.weight > 0 || exercise?.equipment?.toLowerCase() === 'bodyweight')
  )
  const topLoad = sets.length ? Math.max(...sets.map((set) => set.weight)) : null
  const repsAtTop = topLoad === null ? 0 : sets
    .filter((set) => sameLoad(set.weight, topLoad, equipmentStep(exercise)))
    .reduce((total, set) => total + set.reps, 0)
  const e1rm = sessionE1RM(sets)
  return { e1rm, topLoad, repsAtTop }
}

function movingAverages(points: LiftTrendPoint[]) {
  let segment: LiftTrendPoint[] = []
  let previousDate: string | null = null
  for (const point of points) {
    point.movingAverage = null
    if (point.deload || point.e1rm === null) continue
    const gap = previousDate ? (dateValue(point.date) - dateValue(previousDate)) / DAY_MS : 0
    if (gap >= PROGRESS_THRESHOLDS.trendBreakDays) segment = []
    segment.push(point)
    if (segment.length >= PROGRESS_THRESHOLDS.movingAverageSessions) {
      point.movingAverage = segment.slice(-PROGRESS_THRESHOLDS.movingAverageSessions)
        .reduce((total, item) => total + (item.e1rm ?? 0), 0) / PROGRESS_THRESHOLDS.movingAverageSessions
    }
    previousDate = point.date
  }
}

function e1rmVerdict(points: LiftTrendPoint[]) {
  const valid = points.filter((point) => !point.deload && point.e1rm !== null)
  if (
    valid.length < PROGRESS_THRESHOLDS.minimumTrendSessions
    || dateValue(valid[valid.length - 1].date) - dateValue(valid[0].date) < PROGRESS_THRESHOLDS.minimumTrendSpanDays * DAY_MS
  ) return { verdict: 'not-enough-data' as const, changePercent: null }
  const first = valid.slice(0, 2).reduce((total, point) => total + (point.e1rm ?? 0), 0) / 2
  const last = valid.slice(-2).reduce((total, point) => total + (point.e1rm ?? 0), 0) / 2
  const changePercent = first > 0 ? Number((((last / first) - 1) * 100).toFixed(10)) : null
  const band = PROGRESS_THRESHOLDS.trendFlatPercent
  return {
    verdict: changePercent === null ? 'not-enough-data' as const
      : changePercent > band ? 'improving' as const
        : changePercent < -band ? 'lower' as const : 'held' as const,
    changePercent,
  }
}

function regressionRate(points: LiftTrendPoint[]) {
  const values = points.filter((point) => !point.deload && point.e1rm !== null)
  const xMean = values.reduce((sum, point) => sum + dateValue(point.date), 0) / values.length
  const yMean = values.reduce((sum, point) => sum + (point.e1rm ?? 0), 0) / values.length
  const numerator = values.reduce((sum, point) => sum + (dateValue(point.date) - xMean) * ((point.e1rm ?? 0) - yMean), 0)
  const denominator = values.reduce((sum, point) => sum + (dateValue(point.date) - xMean) ** 2, 0)
  if (!denominator || !yMean) return { kgPerWeek: null, percentPerWeek: null }
  const kgPerWeek = Math.round((numerator / denominator * 7 * DAY_MS) * 10) / 10
  return { kgPerWeek, percentPerWeek: Math.round(kgPerWeek / yMean * 1000) / 10 }
}

function highRepVerdict(points: LiftTrendPoint[], step: number) {
  const valid = points.filter((point) => !point.deload && point.topLoad !== null && point.repsAtTop > 0)
  if (
    valid.length < PROGRESS_THRESHOLDS.comparisonMinimumSessions
    || dateValue(valid[valid.length - 1].date) - dateValue(valid[0].date) < PROGRESS_THRESHOLDS.comparisonMinimumSpanDays * DAY_MS
  ) return { verdict: 'not-enough-data' as const, changePercent: null }
  const first = valid[0]
  const last = valid[valid.length - 1]
  const loads = Math.floor(((last.topLoad ?? 0) - (first.topLoad ?? 0)) / step + Number.EPSILON)
  const repsChange = first.repsAtTop ? ((last.repsAtTop - first.repsAtTop) / first.repsAtTop) * 100 : 0
  const verdict = loads >= 1
    ? last.repsAtTop >= first.repsAtTop * (1 - PROGRESS_THRESHOLDS.highRepTolerancePercent / 100) ? 'improving' as const : 'held' as const
    : loads <= -1
      ? repsChange >= PROGRESS_THRESHOLDS.highRepTolerancePercent ? 'held' as const : 'lower' as const
      : repsChange >= PROGRESS_THRESHOLDS.highRepTolerancePercent ? 'improving' as const
        : repsChange <= -PROGRESS_THRESHOLDS.highRepTolerancePercent ? 'lower' as const : 'held' as const
  return { verdict, changePercent: repsChange }
}

function confidenceFor(points: LiftTrendPoint[]) {
  const valid = points.filter((point) => !point.deload && point.e1rm !== null)
  if (valid.length < PROGRESS_THRESHOLDS.minimumTrendSessions) return null
  const span = (dateValue(valid[valid.length - 1].date) - dateValue(valid[0].date)) / DAY_MS
  if (valid.length >= 10 && span >= 42) return 'solid' as const
  if (valid.length >= 6 && span >= 28) return 'based-on' as const
  return 'early' as const
}

export function liftTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercise: Exercise | undefined,
  range: ProgressV3Range,
  activeBlock: TrainingBlock | null,
  today: string
): LiftTrend {
  const start = rangeStart(range, today, activeBlock, entries)
  const end = rangeEnd(range, today, activeBlock)
  const sessions = progressLiftSessions(entries, blocks)
    .filter((session) => session.exerciseId === exercise?.id && session.date >= start && session.date <= end)
  const trainingSessions = sessions.filter((session) => !session.deload)
  const e1rmCount = trainingSessions.filter((session) => sessionStats(session, exercise).e1rm !== null).length
  const highRep = trainingSessions.length > 0 && e1rmCount < trainingSessions.length / 2
  let series = sessions
  if (highRep) {
    const equivalenceGroups = new Map<string, ProgressLiftSession[]>()
    for (const session of sessions) {
      const key = `${session.blockId ?? ''}:${session.dayKey ?? ''}`
      equivalenceGroups.set(key, [...(equivalenceGroups.get(key) ?? []), session])
    }
    series = [...equivalenceGroups.values()].sort((a, b) =>
      b.length - a.length || b[b.length - 1].date.localeCompare(a[a.length - 1].date)
    )[0] ?? []
  }
  const allSessions = progressLiftSessions(entries, blocks).filter((item) => item.exerciseId === exercise?.id)
  const allBest = new Set<string>()
  if (highRep && series[0]) {
    const groupKey = `${series[0].blockId ?? ''}:${series[0].dayKey ?? ''}`
    const history = allSessions.filter((item) => `${item.blockId ?? ''}:${item.dayKey ?? ''}` === groupKey && !item.deload)
    let bestLoad = -Infinity
    let repsAtBestLoad = 0
    let hasPrior = false
    for (const session of history) {
      const { topLoad, repsAtTop } = sessionStats(session, exercise)
      if (topLoad === null) continue
      const loadUp = topLoad - bestLoad >= equipmentStep(exercise)
      const same = bestLoad !== -Infinity && sameLoad(topLoad, bestLoad, equipmentStep(exercise))
      if (hasPrior && (loadUp || (same && repsAtTop > repsAtBestLoad))) {
        allBest.add(`${session.date}:${session.blockId ?? ''}:${session.dayKey ?? ''}`)
      }
      if (loadUp) {
        bestLoad = topLoad
        repsAtBestLoad = repsAtTop
      } else if (same) {
        repsAtBestLoad = Math.max(repsAtBestLoad, repsAtTop)
      }
      hasPrior = true
    }
  } else {
    let best = -Infinity
    let hasPrior = false
    for (const session of allSessions.filter((item) => !item.deload)) {
      const value = sessionStats(session, exercise).e1rm
      if (value !== null) {
        if (hasPrior && value > best) {
          allBest.add(`${session.date}:${session.blockId ?? ''}:${session.dayKey ?? ''}`)
        }
        best = Math.max(best, value)
        hasPrior = true
      }
    }
  }
  const points: LiftTrendPoint[] = series.map((session) => {
    const stats = sessionStats(session, exercise)
    return {
      ...session,
      ...stats,
      movingAverage: null,
      isBest: allBest.has(`${session.date}:${session.blockId ?? ''}:${session.dayKey ?? ''}`),
      breakDays: null,
    }
  })
  let previousDate: string | null = null
  for (const point of points) {
    if (!point.deload && point.e1rm !== null) {
      point.breakDays = previousDate
        ? (dateValue(point.date) - dateValue(previousDate)) / DAY_MS >= PROGRESS_THRESHOLDS.trendBreakDays
          ? (dateValue(point.date) - dateValue(previousDate)) / DAY_MS
          : null
        : null
      previousDate = point.date
    }
  }
  movingAverages(points)
  const result = highRep ? highRepVerdict(points, equipmentStep(exercise)) : e1rmVerdict(points)
  let rate = { kgPerWeek: null as number | null, percentPerWeek: null as number | null }
  if (!highRep && result.verdict !== 'not-enough-data') rate = regressionRate(points)
  if (
    (result.verdict === 'improving' && (rate.kgPerWeek ?? 0) < 0)
    || (result.verdict === 'lower' && (rate.kgPerWeek ?? 0) > 0)
  ) rate = { kgPerWeek: null, percentPerWeek: null }
  const valid = allSessions
    .filter((point) => !point.deload)
    .map((point) => ({ ...point, e1rm: sessionStats(point, exercise).e1rm }))
    .filter((point) => point.e1rm !== null)
  const bestIndex = valid.reduce((index, point, current) =>
    point.e1rm !== null && (valid[index]?.e1rm ?? -Infinity) < point.e1rm ? current : index
  , 0)
  const sessionsSinceBest = valid.length - bestIndex - 1
  const bestPoint = valid[bestIndex]
  const worthLookingAt = !highRep && bestPoint && sessionsSinceBest >= PROGRESS_THRESHOLDS.noNewBestSessions
    && (dateValue(today) - dateValue(bestPoint.date)) / DAY_MS >= PROGRESS_THRESHOLDS.noNewBestDays
    ? { date: bestPoint.date, sessions: sessionsSinceBest }
    : null
  return {
    exerciseId: exercise?.id ?? '',
    highRep,
    points,
    verdict: result.verdict,
    changePercent: result.changePercent,
    ...rate,
    confidence: highRep ? (result.verdict === 'not-enough-data' ? null : 'early') : confidenceFor(points),
    worthLookingAt,
  }
}

export function liftTrendIndexPoints(trend: LiftTrend, exercise?: Exercise): LiftTrendIndexPoint[] {
  const points = trend.points.filter((point) => trend.highRep
    ? point.topLoad !== null && point.repsAtTop > 0
    : point.e1rm !== null)
  if (!points.length) return []

  let baseline = 0
  let previousLoad: number | null = null
  return points.map((point, index) => {
    let value: number
    let breakBefore = point.breakDays !== null && point.breakDays >= PROGRESS_THRESHOLDS.trendBreakDays
    if (trend.highRep) {
      const load = point.topLoad ?? 0
      breakBefore ||= previousLoad !== null && !sameLoad(load, previousLoad, equipmentStep(exercise))
      if (breakBefore || index === 0) baseline = point.repsAtTop
      value = baseline ? (point.repsAtTop / baseline - 1) * 100 : 0
      previousLoad = load
    } else {
      if (index === 0) baseline = point.e1rm ?? 0
      value = baseline ? ((point.e1rm ?? baseline) / baseline - 1) * 100 : 0
    }
    return {
      date: point.date,
      value,
      latest: index === points.length - 1,
      breakBefore,
    }
  })
}
