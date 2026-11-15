import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { MuscleGroup, ProgressEntry, ProgressLiftSession, ProgressSet } from './types'
import { blockWeek, dateValue, dateWeekday, exerciseFor, workingSets } from './utils'
import { equipmentStep, progressLiftSessions } from './trends'
import { muscleCredits } from './muscles'
import { classifyMovementPattern } from './insights'

/*
 * Block story (PO 2026-11-15, Progress redesign): what happened in one block, as plain facts the screens can say
 * in a sentence. Rules: PT spec docs/fitness/approved/2026-11-15-progress-story-insights.md (section numbers below).
 */

const DAY_MS = 86_400_000

export const STORY_RULES = {
  /** §1.2: a new Est. max best must beat the previous one by at least this much (kg). */
  newBestMargin: 0.5,
  /** §1.1: a lift is on the Est. max track when an eligible set (1–12 reps) is in at least this share of sessions. */
  estMaxShare: 0.5,
  estMaxMaxReps: 12,
  /** §1.2: load track, the new best set needs at least this share of the previous best's reps. */
  loadTrackReps: 0.8,
  /** §2: "Not logged lately" after this many days, with this many training days logged after it. */
  notLoggedDays: PROGRESS_THRESHOLDS.noNewBestDays,
  notLoggedOtherDays: 3,
  /** §2: "New best recently" window, days of non-deload training. */
  recentDays: 14,
  /** §2: "Holding" is the approved no-new-best rule (Thresholds §2). */
  holdingSessions: PROGRESS_THRESHOLDS.noNewBestSessions,
  holdingDays: PROGRESS_THRESHOLDS.noNewBestDays,
  /** §4.2 T2: lowest day group under this share and this many points below the highest. */
  dayGroupShare: PROGRESS_THRESHOLDS.adherenceStreakRate,
  dayGroupGap: 0.25,
  /** §4.2 T2: ", none after {date}" when the group's last log is at least this many days before the block's last day. */
  noneAfterDays: 14,
  /** §4.2 T3: show the weekly sets change from this share. */
  setsChange: 0.25,
  /** §6: weekday rhythm needs this many complete weeks; "most regular day" from this share. */
  rhythmWeeks: 3,
  regularShare: 0.5,
  /** §6: first day type with this many planned weeks in a row not logged. */
  unloggedRun: 2,
} as const

export type StorySet = { weight: number; reps: number; date: string; dayKey: string | null; e1rm: number | null }

export type LiftGroup = 'not-logged' | 'recent' | 'holding' | 'early' | 'other'

export type LiftLine =
  | { code: 'S1'; date: string }
  | { code: 'S2'; set: StorySet }
  | { code: 'S3'; heavy: number; date: string; load: number; sessions: number }
  | { code: 'S4'; best: StorySet; latest: StorySet; aboutSame: boolean }
  | { code: 'S5'; best: StorySet; sessions: number }
  | { code: 'S6' }
  | { code: 'S7'; best: StorySet }

export type LiftStory = {
  exerciseId: string
  group: LiftGroup
  track: 'est-max' | 'load'
  start: StorySet
  best: StorySet
  sessions: number
  newBests: number
  /** Est. max (or top load on the load track) of each non-deload session, oldest first. */
  series: number[]
  line: LiftLine
}

export type StoryWeek = { week: number; deload: boolean; complete: boolean; sets: number; days: boolean[] }

export type StoryDayType = { key: string; name: string; logged: number; planned: number; lastDate: string | null }

export type StoryDayGroup = { name: string; logged: number; planned: number; lastDate: string | null }

export type StoryMuscle = { group: MuscleGroup; early: number | null; late: number | null }

export type BlockStory = {
  block: TrainingBlock
  /** Current week (1-based), or null once the block is over. */
  week: number | null
  finished: boolean
  /** Reference date R: today, or the block's last day once it is over. */
  referenceDate: string
  sessionsLogged: number
  sessionsPlanned: number
  totalSets: number
  newBests: number
  lifts: LiftStory[]
  weeks: StoryWeek[]
  dayTypes: StoryDayType[]
  dayGroups: StoryDayGroup[]
  /** Weeks with at least one session on each weekday, Sunday first, counted over complete weeks. */
  weekdays: number[]
  completeWeeks: number
  /** §6 first day type with 2+ planned weeks in a row not logged. */
  firstUnlogged: { day: StoryDayType; week: number } | null
  muscles: StoryMuscle[]
  /** Weeks in each period (§5.1): early = first 2 complete non-deload weeks, late = the rest. */
  earlyWeeks: number[]
  lateWeeks: number[]
  pushSets: number
  pullSets: number
  upperSets: number
  lowerSets: number
}

function epley(weight: number, reps: number) {
  return weight * (1 + reps / 30)
}

function eligible(set: ProgressSet) {
  return set.weight > 0 && set.reps >= 1 && set.reps <= STORY_RULES.estMaxMaxReps
}

function sessionBest(session: ProgressLiftSession, track: 'est-max' | 'load', step: number): StorySet | null {
  const sets = workingSets(session.sets.filter((set) => set.weight > 0 && set.reps > 0))
  let best: StorySet | null = null
  for (const set of sets) {
    if (track === 'est-max' && !eligible(set)) continue
    const candidate: StorySet = {
      weight: set.weight,
      reps: set.reps,
      date: session.date,
      dayKey: session.dayKey,
      e1rm: eligible(set) ? epley(set.weight, set.reps) : null,
    }
    if (!best) best = candidate
    else if (track === 'est-max' ? (candidate.e1rm ?? 0) > (best.e1rm ?? 0)
      : candidate.weight > best.weight + step / 2 || (Math.abs(candidate.weight - best.weight) < step && candidate.reps > best.reps)) best = candidate
  }
  return best
}

function beats(candidate: StorySet, best: StorySet, track: 'est-max' | 'load', step: number) {
  if (track === 'est-max') return (candidate.e1rm ?? 0) >= (best.e1rm ?? 0) + STORY_RULES.newBestMargin
  return (candidate.weight >= best.weight + step && candidate.reps >= best.reps * STORY_RULES.loadTrackReps)
    || (Math.abs(candidate.weight - best.weight) < step && candidate.reps > best.reps)
}

export type LiftContext = {
  referenceDate: string
  recentFrom: string
  lastTrainingDay: string
  trainingDates: string[]
  planned: boolean
  step: number
}

export function liftStory(sessions: ProgressLiftSession[], context: LiftContext): LiftStory | null {
  const training = sessions.filter((session) => !session.deload)
  if (!training.length) return null
  const eligibleSessions = training.filter((session) => session.sets.some(eligible)).length
  const track = eligibleSessions / training.length >= STORY_RULES.estMaxShare ? 'est-max' : 'load'
  const bests = training
    .map((session) => sessionBest(session, track, context.step))
    .filter((set): set is StorySet => Boolean(set))
  if (!bests.length) return null
  const start = bests[0]
  let best = start
  let bestIndex = 0
  const bestDates: string[] = []
  bests.forEach((set, index) => {
    if (index > 0 && beats(set, best, track, context.step)) {
      best = set
      bestIndex = index
      bestDates.push(set.date)
    }
  })
  const last = bests[bests.length - 1]
  const reference = dateValue(context.referenceDate)
  const sessionsSince = bests.length - 1 - bestIndex
  const daysSinceBest = (reference - dateValue(best.date)) / DAY_MS
  const daysBeforeLastTraining = (dateValue(context.lastTrainingDay) - dateValue(last.date)) / DAY_MS
  const otherDaysAfter = context.trainingDates.filter((date) => date > last.date).length

  let group: LiftGroup
  if (context.planned && daysBeforeLastTraining >= STORY_RULES.notLoggedDays && otherDaysAfter >= STORY_RULES.notLoggedOtherDays) group = 'not-logged'
  else if (bestDates.some((date) => date >= context.recentFrom)) group = 'recent'
  else if (bests.length < 2) group = 'early'
  else if (sessionsSince >= STORY_RULES.holdingSessions && daysSinceBest >= STORY_RULES.holdingDays) group = 'holding'
  else group = 'other'

  // §3 story lines.
  let line: LiftLine
  const later = bests.slice(bestIndex + 1)
  const heaviest = Math.max(...bests.map((set) => set.weight))
  const heavyIndexes = bests.flatMap((set, index) => Math.abs(set.weight - heaviest) < 0.001 ? [index] : [])
  const afterHeavy = heavyIndexes.length === 1 ? bests.slice(heavyIndexes[0] + 1) : []
  if (group === 'not-logged') line = { code: 'S1', date: last.date }
  else if (group === 'recent') line = { code: 'S2', set: best }
  else if (group === 'early') line = { code: 'S6' }
  else if (track === 'load'
    && afterHeavy.length >= 2
    && afterHeavy.every((set) => set.weight <= heaviest - context.step)
    && afterHeavy.some((set) => set.dayKey === bests[heavyIndexes[0]].dayKey)
    && new Set(afterHeavy.map((set) => set.weight)).size === 1) {
    line = { code: 'S3', heavy: heaviest, date: bests[heavyIndexes[0]].date, load: afterHeavy[0].weight, sessions: afterHeavy.length }
  } else if (group === 'holding' && later.length > 0 && later.every((set) => set.weight <= best.weight - context.step)) {
    const aboutSame = track === 'est-max' && last.e1rm !== null && best.e1rm !== null
      && Math.abs(last.e1rm / best.e1rm - 1) <= 0.03
    line = { code: 'S4', best, latest: last, aboutSame }
  } else if (group === 'holding') line = { code: 'S5', best, sessions: sessionsSince }
  else line = { code: 'S7', best }

  return {
    exerciseId: sessions[0].exerciseId,
    group,
    track,
    start,
    best,
    sessions: bests.length,
    newBests: bestDates.length,
    series: bests.map((set) => (track === 'est-max' ? set.e1rm ?? set.weight : set.weight)),
    line,
  }
}

function average(values: number[]) {
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : null
}

function isoDate(value: number) {
  return new Date(value).toISOString().slice(0, 10)
}

function dayGroupName(name: string) {
  return name.replace(/\s+[AB]$/i, '').trim()
}

export function blockStory(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  block: TrainingBlock,
  exercises: Exercise[],
  today: string
): BlockStory {
  const start = dateValue(block.startDate)
  const end = start + block.weeks * 7 * DAY_MS
  const finished = dateValue(today) >= end
  const referenceDate = finished ? isoDate(end - DAY_MS) : today
  const currentWeek = finished ? block.weeks : blockWeek(block, today) ?? 1
  const sessions = progressLiftSessions(entries, blocks)
    .filter((session) => session.blockId === block.id && dateValue(session.date) >= start && dateValue(session.date) < end)
    .filter((session) => workingSets(session.sets).length > 0)
  const days = [...block.days].sort((a, b) => a.position - b.position)
  const plannedIds = new Set(days.flatMap((day) => day.exercises.map((exercise) => exercise.exerciseId)))

  const weeks: StoryWeek[] = []
  for (let week = 1; week <= currentWeek; week += 1) {
    const weekSessions = sessions.filter((session) => blockWeek(block, session.date) === week)
    const logged = new Set(weekSessions.map((session) => session.dayKey))
    weeks.push({
      week,
      deload: weekSessions.length ? weekSessions.every((session) => session.deload) : week === PROGRESS_THRESHOLDS.deloadWeek,
      complete: finished || week < currentWeek,
      sets: weekSessions.reduce((total, session) => total + workingSets(session.sets).length, 0),
      days: days.map((day) => logged.has(day.key)),
    })
  }
  const complete = weeks.filter((week) => week.complete)

  const dayTypes: StoryDayType[] = days.map((day, index) => {
    const dates = sessions.filter((session) => session.dayKey === day.key).map((session) => session.date).sort()
    // The week in progress only counts days already logged, so nothing reads as not logged before it is due.
    const logged = weeks.filter((week) => week.days[index]).length
    const openWeekLogged = weeks.some((week) => !week.complete && week.days[index])
    return { key: day.key, name: day.name, logged, planned: complete.length + (openWeekLogged ? 1 : 0), lastDate: dates[dates.length - 1] ?? null }
  })
  const groupMap = new Map<string, StoryDayGroup>()
  for (const day of dayTypes) {
    const name = dayGroupName(day.name)
    const group = groupMap.get(name) ?? { name, logged: 0, planned: 0, lastDate: null }
    group.logged += day.logged
    group.planned += day.planned
    if (day.lastDate && (!group.lastDate || day.lastDate > group.lastDate)) group.lastDate = day.lastDate
    groupMap.set(name, group)
  }

  let firstUnlogged: BlockStory['firstUnlogged'] = null
  dayTypes.forEach((day, index) => {
    for (let week = 0; week + STORY_RULES.unloggedRun <= complete.length; week += 1) {
      const run = complete.slice(week, week + STORY_RULES.unloggedRun)
      if (run.every((item) => !item.days[index])) {
        if (!firstUnlogged || week + 1 < firstUnlogged.week) firstUnlogged = { day, week: week + 1 }
        return
      }
    }
  })

  const weekdays = [0, 0, 0, 0, 0, 0, 0]
  for (const week of complete) {
    const seen = new Set(sessions.filter((session) => blockWeek(block, session.date) === week.week).map((session) => dateWeekday(session.date)))
    for (const day of seen) weekdays[day] += 1
  }

  const trainingDates = [...new Set(sessions.filter((session) => !session.deload).map((session) => session.date))].sort()
  const lastTrainingDay = trainingDates[trainingDates.length - 1] ?? referenceDate
  // §2: finished block → weeks 4–5 (the 14 days before the deload); during a block → the last 14 days.
  const deloadStart = start + (PROGRESS_THRESHOLDS.deloadWeek - 1) * 7 * DAY_MS
  const recentEnd = finished ? Math.min(deloadStart, end) : dateValue(today) + DAY_MS
  const recentFrom = isoDate(recentEnd - STORY_RULES.recentDays * DAY_MS)
  const byLift = new Map<string, ProgressLiftSession[]>()
  for (const session of sessions) byLift.set(session.exerciseId, [...(byLift.get(session.exerciseId) ?? []), session])
  const lifts = [...byLift.entries()]
    .map(([id, liftSessions]) => liftStory(liftSessions, {
      referenceDate,
      recentFrom,
      lastTrainingDay,
      trainingDates,
      planned: plannedIds.has(id),
      step: equipmentStep(exerciseFor(exercises, id)),
    }))
    .filter((story): story is LiftStory => Boolean(story))

  // §5.1 muscles: 1 per primary, 0.5 per secondary; rows = primary muscle of a plan exercise, in plan order.
  const trainingWeeks = complete.filter((week) => !week.deload)
  const earlyWeeks = trainingWeeks.slice(0, 2).map((week) => week.week)
  const lateWeeks = trainingWeeks.slice(2).map((week) => week.week)
  const groupSets = (week: number) => {
    const totals = new Map<MuscleGroup, number>()
    for (const session of sessions.filter((item) => blockWeek(block, item.date) === week)) {
      const count = workingSets(session.sets).length
      for (const [group, credit] of Object.entries(muscleCredits(exerciseFor(exercises, session.exerciseId)))) {
        totals.set(group as MuscleGroup, (totals.get(group as MuscleGroup) ?? 0) + count * (credit ?? 0))
      }
    }
    return totals
  }
  const perWeek = new Map(trainingWeeks.map((week) => [week.week, groupSets(week.week)]))
  const groups: MuscleGroup[] = []
  for (const day of days) {
    for (const planned of day.exercises) {
      for (const [group, credit] of Object.entries(muscleCredits(exerciseFor(exercises, planned.exerciseId)))) {
        if (credit === 1 && group !== 'Other' && !groups.includes(group as MuscleGroup)) groups.push(group as MuscleGroup)
      }
    }
  }
  const periodMean = (group: MuscleGroup, period: number[]) => average(period.map((week) => perWeek.get(week)?.get(group) ?? 0))
  const muscles = groups.map((group) => ({ group, early: periodMean(group, earlyWeeks), late: periodMean(group, lateWeeks) }))

  // §5.2: whole working sets in the non-deload weeks.
  let pushSets = 0
  let pullSets = 0
  let upperSets = 0
  let lowerSets = 0
  for (const session of sessions.filter((item) => !item.deload)) {
    const movement = classifyMovementPattern(exerciseFor(exercises, session.exerciseId))
    const count = workingSets(session.sets).length
    if (movement.group === 'push') pushSets += count
    if (movement.group === 'pull') pullSets += count
    if (movement.region === 'upper') upperSets += count
    if (movement.region === 'lower') lowerSets += count
  }

  return {
    block,
    week: finished ? null : currentWeek,
    finished,
    referenceDate,
    sessionsLogged: weeks.reduce((total, week) => total + week.days.filter(Boolean).length, 0),
    sessionsPlanned: complete.length * days.length + weeks.filter((week) => !week.complete).reduce((total, week) => total + week.days.filter(Boolean).length, 0),
    totalSets: weeks.reduce((total, week) => total + week.sets, 0),
    newBests: lifts.reduce((total, lift) => total + lift.newBests, 0),
    lifts,
    weeks,
    dayTypes,
    dayGroups: [...groupMap.values()],
    weekdays,
    completeWeeks: complete.length,
    firstUnlogged,
    muscles,
    earlyWeeks,
    lateWeeks,
    pushSets,
    pullSets,
    upperSets,
    lowerSets,
  }
}

function roundFive(value: number) {
  return Math.round(value / 5) * 5
}

export type StoryTakeaway =
  | { kind: 'bests'; count: number }
  | { kind: 'day-group'; group: StoryDayGroup; noneAfter: string | null }
  | { kind: 'sets'; early: number; late: number; earlyWeeks: number[]; lateWeeks: number[]; earlyAbout: boolean; lateAbout: boolean }

/** §4.2: up to three takeaways, in spec order. T1 needs a lift verdict (`hasVerdict`). */
export function storyTakeaways(story: BlockStory, hasVerdict: boolean): StoryTakeaway[] {
  const takeaways: StoryTakeaway[] = []
  if (hasVerdict) takeaways.push({ kind: 'bests', count: story.newBests })

  const shares = story.dayGroups.filter((group) => group.planned > 0).map((group) => ({ group, share: group.logged / group.planned }))
  if (shares.length > 1) {
    const lowest = [...shares].sort((a, b) => a.share - b.share)[0]
    const highest = Math.max(...shares.map((item) => item.share))
    if (lowest.share < STORY_RULES.dayGroupShare && highest - lowest.share >= STORY_RULES.dayGroupGap) {
      const blockLastDay = dateValue(story.referenceDate)
      const last = lowest.group.lastDate
      const laterLogs = story.dayTypes.some((day) => day.lastDate && last && day.lastDate > last)
      const noneAfter = last && laterLogs && (blockLastDay - dateValue(last)) / DAY_MS >= STORY_RULES.noneAfterDays ? last : null
      takeaways.push({ kind: 'day-group', group: lowest.group, noneAfter })
    }
  }

  const setsFor = (weeks: number[]) => average(weeks.map((week) => story.weeks.find((item) => item.week === week)?.sets ?? 0))
  const early = setsFor(story.earlyWeeks)
  const late = setsFor(story.lateWeeks)
  if (early && late !== null && Math.abs(late - early) / early >= STORY_RULES.setsChange) {
    takeaways.push({
      kind: 'sets',
      early: story.earlyWeeks.length > 1 ? roundFive(early) : early,
      late: story.lateWeeks.length > 1 ? roundFive(late) : late,
      earlyWeeks: story.earlyWeeks,
      lateWeeks: story.lateWeeks,
      earlyAbout: story.earlyWeeks.length > 1,
      lateAbout: story.lateWeeks.length > 1,
    })
  }
  return takeaways.slice(0, 3)
}

/** §6 weekday rhythm: weekdays logged in every complete week, else the most regular day at ≥ 50%. */
export function weekdayRhythm(story: BlockStory) {
  const weeks = story.completeWeeks
  if (weeks < STORY_RULES.rhythmWeeks) return null
  const order = [1, 2, 3, 4, 5, 6, 0]
  const every = order.filter((day) => story.weekdays[day] === weeks)
  if (every.length) return { kind: 'every' as const, days: every, weeks, count: weeks }
  const top = order.reduce((best, day) => (story.weekdays[day] > story.weekdays[best] ? day : best), 1)
  return story.weekdays[top] / weeks >= STORY_RULES.regularShare
    ? { kind: 'regular' as const, days: [top], weeks, count: story.weekdays[top] }
    : null
}
