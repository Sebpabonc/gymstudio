import { Exercise, TrainingBlock } from '../types'
import { adherence } from './adherence'
import { personalRecords } from './personalRecords'
import { PROGRESS_THRESHOLDS } from './thresholds'
import { ProgressEntry, ProgressSet, WeeklyMuscleSets } from './types'
import {
  blockWeek,
  dateValue,
  exerciseFor,
  findEntryBlock,
  groupExerciseSessions,
  isDeloadWeek,
  sessionE1RM,
  startOfWeek,
  workingSets,
} from './utils'
import { weeklySets } from './weeklySets'

const DAY_MS = 24 * 60 * 60 * 1000

export { PROGRESS_THRESHOLDS }

const MAIN_MOVEMENT_PATTERNS = new Set([
  'push horizontal',
  'push vertical',
  'pull horizontal',
  'pull vertical',
  'squat',
  'hinge',
  'lunge',
])

const PUSH_MUSCLES = new Set(['Chest', 'Upper Chest', 'Front Delts', 'Side Delts', 'Triceps'])
const PULL_MUSCLES = new Set(['Lats', 'Upper Back', 'Traps', 'Rear Delts', 'Biceps', 'Forearms'])
const LOWER_MUSCLES = new Set(['Quads', 'Hamstrings', 'Glutes', 'Adductors', 'Abductors', 'Calves', 'Lower Back'])
const CORE_MUSCLES = new Set(['Abs', 'Obliques', 'Hip Flexors'])

export type ProgressRange = 'block' | '4weeks' | '12weeks'
export type MovementGroup = 'push' | 'pull' | 'legs' | 'core' | 'other'
export type BodyRegion = 'upper' | 'lower' | 'core' | 'other'
export type LiftTrend = 'improving' | 'flat' | 'declining' | 'not-enough-data'

export type E1rmPoint = {
  date: string
  value: number
  isBestEver: boolean
}

export type LiftInsight = {
  exerciseId: string
  sessions: number
  points: E1rmPoint[]
  changePercent: number | null
  trend: LiftTrend
}

export type RepPr = {
  exerciseId: string
  date: string
  weight: number
  reps: number
  previousBest: number
}

type ClassifiedMovement = {
  group: MovementGroup
  region: BodyRegion
}

export function classifyMovementPattern(exercise: Exercise | undefined): ClassifiedMovement {
  const pattern = exercise?.movementPattern?.trim().toLowerCase()
  const primary = exercise?.primaryMuscles ?? (exercise?.primaryMuscle ? [exercise.primaryMuscle] : [])
  const muscle = primary[0]
  const regionForPrimaryMuscle: BodyRegion = muscle && PUSH_MUSCLES.has(muscle)
    ? 'upper'
    : muscle && PULL_MUSCLES.has(muscle)
      ? 'upper'
      : muscle && LOWER_MUSCLES.has(muscle)
        ? 'lower'
        : muscle && CORE_MUSCLES.has(muscle)
          ? 'core'
          : 'other'
  let group: MovementGroup
  let region: BodyRegion

  if (pattern === 'push horizontal' || pattern === 'push vertical') {
    group = 'push'
    region = 'upper'
  } else if (pattern === 'pull horizontal' || pattern === 'pull vertical') {
    group = 'pull'
    region = 'upper'
  } else if (pattern === 'squat' || pattern === 'hinge' || pattern === 'lunge') {
    group = 'legs'
    region = 'lower'
  } else if (pattern === 'core') {
    group = 'core'
    region = 'core'
  } else if (pattern === 'carry') {
    group = 'other'
    region = regionForPrimaryMuscle
  } else if (pattern === 'isolation') {
    if (muscle && PUSH_MUSCLES.has(muscle)) {
      group = 'push'
      region = 'upper'
    } else if (muscle && PULL_MUSCLES.has(muscle)) {
      group = 'pull'
      region = 'upper'
    } else if (muscle && LOWER_MUSCLES.has(muscle)) {
      group = 'legs'
      region = 'lower'
    } else if (muscle && CORE_MUSCLES.has(muscle)) {
      group = 'core'
      region = 'core'
    } else {
      group = 'other'
      region = 'other'
    }
  } else {
    group = 'other'
    region = 'other'
  }

  return { group, region }
}

function addDays(date: string, days: number) {
  const value = new Date(dateValue(date) + days * DAY_MS)
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
}

function weekStartsInRange(start: string, end: string) {
  const starts: string[] = []
  for (let week = startOfWeek(start); dateValue(week) <= dateValue(end); week = addDays(week, 7)) {
    starts.push(week)
  }
  return starts
}

function windowStart(range: ProgressRange, activeBlock: TrainingBlock | null, today: string) {
  if (range === 'block') return activeBlock?.startDate ?? addDays(today, -27)
  return addDays(today, range === '4weeks' ? -27 : -83)
}

function windowEnd(range: ProgressRange, activeBlock: TrainingBlock | null, today: string) {
  if (range !== 'block' || !activeBlock) return today
  const blockEnd = addDays(activeBlock.startDate, activeBlock.weeks * 7 - 1)
  return dateValue(today) < dateValue(blockEnd) ? today : blockEnd
}

function mean(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
}

function rangeContains(date: string, start: string, end: string) {
  return dateValue(date) >= dateValue(start) && dateValue(date) <= dateValue(end)
}

function sessionE1rmPoints(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  start: string,
  end: string
): E1rmPoint[] {
  const allSessions = groupExerciseSessions(entries).filter((session) => session.exerciseId === exerciseId)
  const allValues = allSessions.map((session) => ({
    date: session.date,
    value: sessionE1RM(session.sets),
    isDeload: isDeloadWeek(findEntryBlock(blocks, session), session.date),
  }))
  let bestEver = -Infinity
  const bestDates = new Set<string>()
  for (const point of allValues) {
    if (point.isDeload || point.value === null) continue
    if (point.value > bestEver) {
      bestDates.add(point.date)
      bestEver = point.value
    }
  }
  return allValues
    .filter((point) => point.value !== null && rangeContains(point.date, start, end))
    .map((point) => ({
      date: point.date,
      value: point.value as number,
      isBestEver: bestDates.has(point.date),
    }))
}

function trendForLift(sessions: Array<{ date: string; value: number }>): { changePercent: number | null; trend: LiftTrend } {
  if (
    sessions.length < PROGRESS_THRESHOLDS.minimumTrendSessions
    || dateValue(sessions[sessions.length - 1].date) - dateValue(sessions[0].date)
      < PROGRESS_THRESHOLDS.minimumTrendSpanDays * DAY_MS
  ) {
    return { changePercent: null, trend: 'not-enough-data' }
  }
  const firstMean = mean(sessions.slice(0, 2).map((session) => session.value))
  const lastMean = mean(sessions.slice(-2).map((session) => session.value))
  if (firstMean === null || firstMean === 0 || lastMean === null) {
    return { changePercent: null, trend: 'not-enough-data' }
  }
  const changePercent = Number((((lastMean / firstMean) - 1) * 100).toFixed(10))
  const band = PROGRESS_THRESHOLDS.trendFlatPercent
  return {
    changePercent,
    trend: changePercent > band ? 'improving' : changePercent < -band ? 'declining' : 'flat',
  }
}

function currentBlockWeek(activeBlock: TrainingBlock | null, today: string) {
  if (!activeBlock) return 0
  const week = blockWeek(activeBlock, today)
  if (week !== null) return week
  return dateValue(today) >= dateValue(addDays(activeBlock.startDate, activeBlock.weeks * 7))
    ? activeBlock.weeks
    : 0
}

function distinctSessionDays(sessions: Array<{ date: string }>) {
  return [...new Set(sessions.map((session) => session.date))]
}

function weekStreak(entries: ProgressEntry[], today: string) {
  const activeWeek = startOfWeek(today)
  const loggedWeeks = new Set(groupExerciseSessions(entries)
    .filter((session) => session.date <= today)
    .map((session) => startOfWeek(session.date)))
  let week = loggedWeeks.has(activeWeek) ? activeWeek : addDays(activeWeek, -7)
  if (!loggedWeeks.has(week)) return 0
  let streak = 0
  while (loggedWeeks.has(week)) {
    streak += 1
    week = addDays(week, -7)
  }
  return streak
}

function recentWeekStarts(today: string, count: number) {
  const current = dateValue(startOfWeek(today))
  const currentDate = new Date(current)
  const currentWeek = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, '0')}-${String(currentDate.getUTCDate()).padStart(2, '0')}`
  return Array.from({ length: count }, (_, index) => addDays(
    currentWeek,
    -7 * (count - index - 1)
  ))
}

function weekStartForIndex(block: TrainingBlock, week: number) {
  return addDays(block.startDate, (week - 1) * 7)
}

function repPersonalRecords(entries: ProgressEntry[], blocks: TrainingBlock[], start: string, today: string): RepPr[] {
  const history = groupExerciseSessions(entries)
  const bestByLoad = new Map<string, number>()
  const events: RepPr[] = []
  for (const session of history) {
    const deload = isDeloadWeek(findEntryBlock(blocks, session), session.date)
    const sets = workingSets(session.sets)
    for (const set of sets) {
      const key = `${session.exerciseId}:${set.weight}`
      const previousBest = bestByLoad.get(key) ?? 0
      if (!deload && previousBest > 0 && set.reps > previousBest && rangeContains(session.date, start, today)) {
        events.push({ exerciseId: session.exerciseId, date: session.date, weight: set.weight, reps: set.reps, previousBest })
      }
      if (!deload) bestByLoad.set(key, Math.max(previousBest, set.reps))
    }
  }
  return events
}

function weekForDate(activeBlock: TrainingBlock | null, date: string) {
  return activeBlock ? blockWeek(activeBlock, date) : null
}

function volumeForSets(sets: ProgressSet[]) {
  return workingSets(sets).reduce((total, set) => total + set.weight * set.reps
    + (set.drop ? set.drop.weight * set.drop.reps : 0), 0)
}

function sumBlockVolume(entries: ProgressEntry[], blocks: TrainingBlock[], block: TrainingBlock, weeks: number) {
  return groupExerciseSessions(entries).reduce((total, session) => {
    if (findEntryBlock(blocks, session)?.id !== block.id) return total
    const week = blockWeek(block, session.date)
    return week !== null && week <= weeks ? total + volumeForSets(session.sets) : total
  }, 0)
}

function rirByBlockWeek(entries: ProgressEntry[], block: TrainingBlock, lastWeek: number) {
  return Array.from({ length: lastWeek }, (_, index) => {
    const week = index + 1
    const inWeek = entries.filter((entry) => blockWeek(block, entry.date) === week)
    const sets = inWeek.flatMap((entry) => workingSets(entry.sets))
    const withRir = sets.filter((set) => Number.isFinite(set.rir))
    return {
      week,
      mean: mean(withRir.map((set) => set.rir as number)),
      coverage: sets.length ? withRir.length / sets.length : 0,
      setCount: sets.length,
      rirSetCount: withRir.length,
    }
  })
}

export function calculateProgressInsights(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  activeBlock: TrainingBlock | null,
  today: string,
  range: ProgressRange = 'block'
) {
  const start = windowStart(range, activeBlock, today)
  const end = windowEnd(range, activeBlock, today)
  const sessions = groupExerciseSessions(entries)
  const rangeSessions = sessions.filter((session) => rangeContains(session.date, start, end))
  const liftSessions = new Map<string, Array<{ date: string; value: number }>>()
  for (const session of rangeSessions) {
    if (isDeloadWeek(findEntryBlock(blocks, session), session.date)) continue
    const value = sessionE1RM(session.sets)
    if (value === null) continue
    liftSessions.set(session.exerciseId, [...(liftSessions.get(session.exerciseId) ?? []), { date: session.date, value }])
  }

  const compoundIds = [...liftSessions].filter(([id, points]) => {
    const exercise = exerciseFor(exercises, id)
    return exercise?.mechanic === 'compound'
      && MAIN_MOVEMENT_PATTERNS.has(exercise.movementPattern?.trim().toLowerCase() ?? '')
      && points.length >= PROGRESS_THRESHOLDS.mainLiftMinimumSessions
      && (exercise.equipment?.trim().toLowerCase() !== 'bodyweight'
        || points.some(({ date }) => sessions.some((session) => session.exerciseId === id && session.date === date && session.sets.some((set) => set.weight > 0))))
  }).map(([id]) => id)
  const mainLiftIds = new Set(compoundIds)
  if (compoundIds.length < 2) {
    for (const [id, points] of liftSessions) {
      const exercise = exerciseFor(exercises, id)
      if (exercise?.mechanic === 'isolation' && points.length >= PROGRESS_THRESHOLDS.mainLiftMinimumSessions) {
        mainLiftIds.add(id)
      }
    }
  }

  const lifts: LiftInsight[] = [...mainLiftIds].map((exerciseId) => {
    const points = liftSessions.get(exerciseId) ?? []
    const trend = trendForLift(points)
    return {
      exerciseId,
      sessions: points.length,
      points: sessionE1rmPoints(entries, blocks, exerciseId, start, end),
      ...trend,
    }
  }).sort((a, b) => a.exerciseId.localeCompare(b.exerciseId))
  const eligibleLifts = lifts.filter((lift) => lift.changePercent !== null)
  const improvingLifts = eligibleLifts.filter((lift) => lift.trend === 'improving')
  const averageChangePercent = mean(eligibleLifts.map((lift) => lift.changePercent as number))
  const bestMover = [...eligibleLifts].sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity))[0] ?? null
  const worstMover = [...eligibleLifts].sort((a, b) => (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity))[0]
  const noNewBest = [...mainLiftIds].flatMap((exerciseId) => {
    const history = sessions
      .filter((session) => session.exerciseId === exerciseId && session.date <= today && !isDeloadWeek(findEntryBlock(blocks, session), session.date))
      .map((session) => ({ date: session.date, value: sessionE1RM(session.sets) }))
      .filter((point): point is { date: string; value: number } => point.value !== null)
    let best = -Infinity
    let bestIndex = -1
    history.forEach((point, index) => {
      if (point.value > best) {
        best = point.value
        bestIndex = index
      }
    })
    const sessionsSince = history.length - bestIndex - 1
    const daysSince = bestIndex >= 0 ? (dateValue(today) - dateValue(history[bestIndex].date)) / DAY_MS : 0
    return sessionsSince >= PROGRESS_THRESHOLDS.noNewBestSessions
      && daysSince >= PROGRESS_THRESHOLDS.noNewBestDays
      ? [{ exerciseId, sessionsSince, bestValue: best, bestDate: history[bestIndex].date }]
      : []
  })
  const mostImproved = [...eligibleLifts]
    .filter((lift) => lift.trend === 'improving'
      && lift.sessions >= PROGRESS_THRESHOLDS.mostImprovedMinimumSessions)
    .sort((a, b) => (b.changePercent ?? 0) - (a.changePercent ?? 0)
      || b.sessions - a.sessions
      || a.exerciseId.localeCompare(b.exerciseId))[0] ?? null

  const records = personalRecords(entries, blocks)
    .filter((record) => rangeContains(record.date, start, end) && record.badges.length)
  const repPrs = repPersonalRecords(entries, blocks, start, end)
  const latestWeek = startOfWeek(today)
  const completedWeekStart = addDays(latestWeek, -7)
  const currentWeeklySets = weeklySets(entries, blocks, exercises, completedWeekStart, activeBlock)
  const previousWeekly = recentWeekStarts(addDays(completedWeekStart, -7), 3)
    .map((week) => weeklySets(entries, blocks, exercises, week, null))
  const groupByMuscle: Record<string, WeeklyMuscleSets['groups'][number]['muscleGroup']> = {
    Chest: 'Chest',
    'Upper Chest': 'Chest',
    Lats: 'Back',
    'Upper Back': 'Back',
    'Side Delts': 'Shoulders (side and rear)',
    'Rear Delts': 'Shoulders (side and rear)',
    'Front Delts': 'Front delts',
    Biceps: 'Biceps',
    Triceps: 'Triceps',
    Quads: 'Quads',
    Hamstrings: 'Hamstrings',
    Glutes: 'Glutes',
    Calves: 'Calves',
    Abs: 'Core',
    Obliques: 'Core',
  }
  const primaryGroups = new Set(
    (activeBlock?.days.flatMap((day) => day.exercises.map((item) =>
      exerciseFor(exercises, item.exerciseId)
    )) ?? []).flatMap((exercise) => {
      const primary = exercise?.primaryMuscles ?? (exercise?.primaryMuscle ? [exercise.primaryMuscle] : [])
      return primary.map((muscle) => groupByMuscle[muscle] ?? 'Other')
    })
  )
  const weeklyMuscles = currentWeeklySets.groups.map((group) => ({
    muscleGroup: group.muscleGroup,
    thisWeek: group.done,
    previousThreeWeekAverage: mean(previousWeekly.map((week) =>
      week.groups.find((item) => item.muscleGroup === group.muscleGroup)?.done ?? 0
    )) ?? 0,
    commonRange: primaryGroups.has(group.muscleGroup),
  }))

  const volumeWeeks = recentWeekStarts(today, 6)
  const weeklyVolume = volumeWeeks.map((weekStart) => {
    const end = addDays(weekStart, 6)
    const workoutVolumes = new Map<string, number>()
    for (const session of sessions.filter((item) => rangeContains(item.date, weekStart, end))) {
      const key = `${session.date}:${session.dayKey ?? ''}`
      workoutVolumes.set(key, (workoutVolumes.get(key) ?? 0) + volumeForSets(session.sets))
    }
    const total = [...workoutVolumes.values()].reduce((sum, value) => sum + value, 0)
    const sessionCount = workoutVolumes.size
    return { weekStart, total, sessionCount, perSession: sessionCount ? total / sessionCount : 0 }
  })
  const currentWeekVolume = weeklyVolume[weeklyVolume.length - 1]
  const firstWeekVolume = weeklyVolume.find((week) => week.sessionCount > 0)
  const volumePerSessionChange = firstWeekVolume && currentWeekVolume.sessionCount && firstWeekVolume.perSession > 0
    ? ((currentWeekVolume.perSession / firstWeekVolume.perSession) - 1) * 100
    : null

  const blockWeekNumber = currentBlockWeek(activeBlock, today)
  const previousBlock = activeBlock
    ? [...blocks].filter((block) => block.startDate < activeBlock.startDate).sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
    : null
  const currentTonnage = activeBlock && blockWeekNumber > 0
    ? sumBlockVolume(entries, blocks, activeBlock, blockWeekNumber)
    : null
  const previousTonnage = previousBlock && blockWeekNumber > 0
    ? sumBlockVolume(entries, blocks, previousBlock, blockWeekNumber)
    : null

  const topSetLoads = [...mainLiftIds].flatMap((exerciseId) => {
    const meanTopLoad = (block: TrainingBlock) => {
      const values = sessions
        .filter((session) => session.exerciseId === exerciseId && findEntryBlock(blocks, session)?.id === block.id)
        .map((session) => Math.max(...workingSets(session.sets).map((set) => set.weight), 0))
        .filter((value) => value > 0)
      return mean(values)
    }
    const current = activeBlock ? meanTopLoad(activeBlock) : null
    const previous = previousBlock ? meanTopLoad(previousBlock) : null
    return current !== null && previous !== null && previous > 0
      ? [{ exerciseId, current, previous, changePercent: ((current / previous) - 1) * 100 }]
      : []
  })
  const averageTopSetLoadChange = mean(topSetLoads.map((item) => item.changePercent))

  const lastFourWeeksStart = addDays(today, -27)
  let pushSets = 0
  let pullSets = 0
  let upperSets = 0
  let lowerSets = 0
  for (const session of sessions.filter((item) => rangeContains(item.date, lastFourWeeksStart, today))) {
    const movement = classifyMovementPattern(exerciseFor(exercises, session.exerciseId))
    const count = workingSets(session.sets).length
    if (movement.group === 'push') pushSets += count
    if (movement.group === 'pull') pullSets += count
    if (movement.region === 'upper') upperSets += count
    if (movement.region === 'lower') lowerSets += count
  }
  const pushPullTotal = pushSets + pullSets
  const pushPullNote = pushPullTotal >= PROGRESS_THRESHOLDS.pushPullMinimumSets
    && pushSets > pullSets * PROGRESS_THRESHOLDS.pushPullRatio
    ? 'push-dominant'
    : pushPullTotal >= PROGRESS_THRESHOLDS.pushPullMinimumSets
      && pullSets > pushSets * PROGRESS_THRESHOLDS.pushPullRatio
      ? 'pull-dominant'
      : null

  const blockEntries = activeBlock
    ? entries.filter((entry) => findEntryBlock(blocks, entry)?.id === activeBlock.id)
    : []
  const rirWeeks = activeBlock ? rirByBlockWeek(blockEntries, activeBlock, blockWeekNumber) : []
  const firstRirWeek = rirWeeks[0]
  const lastRirWeek = rirWeeks[rirWeeks.length - 1]
  const rirChange = firstRirWeek?.mean !== null && firstRirWeek?.mean !== undefined
    && lastRirWeek?.mean !== null && lastRirWeek?.mean !== undefined
    && firstRirWeek.coverage >= PROGRESS_THRESHOLDS.rirMinimumCoverage
    && lastRirWeek.coverage >= PROGRESS_THRESHOLDS.rirMinimumCoverage
    && Math.abs(lastRirWeek.mean - firstRirWeek.mean) >= PROGRESS_THRESHOLDS.rirChangeThreshold
    ? lastRirWeek.mean - firstRirWeek.mean
    : null

  const blockSessions = sessions.filter((session) => findEntryBlock(blocks, session)?.id === activeBlock?.id)
  const sessionsPerBlockWeek = activeBlock
    ? Array.from({ length: blockWeekNumber }, (_, index) => ({
      week: index + 1,
      done: new Set(blockSessions.filter((session) => blockWeek(activeBlock, session.date) === index + 1)
        .map((session) => `${session.date}:${session.dayKey ?? ''}`)).size,
      planned: activeBlock.days.length,
    }))
    : []

  const weekdayCounts = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    sessions: distinctSessionDays(sessions
      .filter((session) => rangeContains(session.date, addDays(today, -83), today))
      .filter((session) => new Date(dateValue(session.date)).getUTCDay() === weekday)).length,
  }))
  const loggedDates = new Set(sessions.map((session) => session.date))
  const gridStart = addDays(startOfWeek(today), -77)
  const consistencyGrid = Array.from({ length: 84 }, (_, index) => {
    const date = addDays(gridStart, index)
    return { date, hasSession: date <= today && loggedDates.has(date) }
  })
  const windowWeeks = Math.max(0, Math.round((dateValue(end) - dateValue(start) + 1) / (7 * DAY_MS)))
  const plannedSessions = activeBlock
    ? range === 'block'
      ? Math.max(0, Math.min(blockWeekNumber, activeBlock.weeks) * activeBlock.days.length)
      : windowWeeks * activeBlock.days.length
    : 0
  const rangeEntries = entries.filter((entry) => rangeContains(entry.date, start, end))
  const weeklyAdherence = weekStartsInRange(start, end)
    .map((week) => adherence(rangeEntries, blocks, week).week.sessionsDone)
  const sessionCount = new Set(rangeSessions.map((session) => session.date)).size
  const sessionsDone = Math.min(sessionCount, weeklyAdherence.reduce((total, done) => total + done, 0))
  const sessionsPlanned = range === 'block' && activeBlock
    ? plannedSessions
    : activeBlock
      ? plannedSessions
      : windowWeeks * 6

  const recentStart = addDays(today, -PROGRESS_THRESHOLDS.recentRecordDays + 1)
  const recentRecordsCount = records.filter((record) => rangeContains(record.date, recentStart, today))
  const recentRepPrs = repPrs.filter((record) => rangeContains(record.date, recentStart, today))

  return {
    rangeStart: start,
    rangeEnd: end,
    lifts,
    eligibleLifts,
    improvingCount: improvingLifts.length,
    averageChangePercent,
    bestMover,
    worstMover: worstMover?.changePercent !== null
      && worstMover?.changePercent !== undefined
      && worstMover.changePercent < -PROGRESS_THRESHOLDS.trendFlatPercent
      ? worstMover
      : null,
    flatLifts: eligibleLifts.filter((lift) => lift.trend === 'flat'),
    noNewBest,
    mostImproved,
    records,
    prCount: records.length,
    repPrs,
    recentRecordsCount: recentRecordsCount.length + recentRepPrs.length,
    sessionsDone,
    sessionsPlanned,
    streakWeeks: weekStreak(entries, today),
    weeklyMuscles,
    commonRange: {
      min: PROGRESS_THRESHOLDS.commonRangeMinimumSets,
      max: PROGRESS_THRESHOLDS.commonRangeMaximumSets,
    },
    weeklyVolume,
    volumePerSessionChange,
    consistencyGrid,
    currentTonnage,
    previousTonnage,
    topSetLoads,
    averageTopSetLoadChange,
    pushPull: {
      push: pushSets,
      pull: pullSets,
      note: pushPullNote,
      total: pushPullTotal,
    },
    upperLower: {
      upper: upperSets,
      lower: lowerSets,
      total: upperSets + lowerSets,
    },
    rirWeeks,
    rirChange,
    sessionsPerBlockWeek,
    weekdayCounts,
    activeBlockWeek: blockWeekNumber,
  }
}

export function mostFrequentWeekdays(weekdayCounts: Array<{ weekday: number; sessions: number }>) {
  const maximum = Math.max(0, ...weekdayCounts.map((item) => item.sessions))
  return maximum === 0 ? [] : weekdayCounts.filter((item) => item.sessions === maximum)
}

export type ProgressInsights = ReturnType<typeof calculateProgressInsights>
export type InsightMuscle = WeeklyMuscleSets['groups'][number]['muscleGroup']
