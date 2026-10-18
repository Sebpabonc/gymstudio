import type { Exercise, TrainingBlock, WorkoutEntry } from '../types'
import { anyDayEstMaxComparison } from './estMax'
import { compareLiftSessions, watchObservations } from './comparison'
import { equivalentLiftSessions, progressLiftSessions } from './trends'
import { getDayType, workingSets } from './utils'
import type { ProgressLiftSession, SessionComparison } from './types'

export type WorkoutSetChange = {
  set: number
  previousWeight: number
  weight: number
  previousReps: number
  reps: number
}

export type WorkoutExerciseInsight = {
  exerciseId: string
  current: ProgressLiftSession
  previous: ProgressLiftSession | null
  comparison: SessionComparison
  estMaxComparison: ReturnType<typeof anyDayEstMaxComparison>
  changes: WorkoutSetChange[]
  watch: ReturnType<typeof watchObservations>[number] | null
}

export function buildWorkoutExerciseInsight(
  entry: WorkoutEntry,
  history: WorkoutEntry[],
  blocks: TrainingBlock[],
  exercise: Exercise
): WorkoutExerciseInsight {
  const date = entry.date.slice(0, 10)
  const previousEntries = history.filter((item) =>
    item.exerciseId === entry.exerciseId && item.date.slice(0, 10) < date
  )
  const current = progressLiftSessions([entry], blocks)[0]
  const equivalentSessions = progressLiftSessions(previousEntries, blocks)
    .filter((session) => equivalentLiftSessions(session, current))
  const previous = equivalentSessions[equivalentSessions.length - 1] ?? null
  const comparison = compareLiftSessions(previous, current, exercise, blocks)
  const previousSets = previous ? workingSets(previous.sets) : []
  const currentSets = workingSets(current.sets)
  const changes = currentSets.slice(0, previousSets.length).flatMap((set, index) => {
    const previousSet = previousSets[index]
    if (set.weight === previousSet.weight && set.reps === previousSet.reps) return []
    return [{
      set: index + 1,
      previousWeight: previousSet.weight,
      weight: set.weight,
      previousReps: previousSet.reps,
      reps: set.reps,
    }]
  })
  const watch = watchObservations([...previousEntries, entry], blocks, [exercise], 1)[0] ?? null
  return {
    exerciseId: entry.exerciseId,
    current,
    previous,
    comparison,
    estMaxComparison: anyDayEstMaxComparison(entry, history, blocks),
    changes,
    watch,
  }
}

export type WorkoutInsightTally = {
  improved: number
  same: number
  lower: number
  mixed: number
  baseline: number
}

export function workoutInsightTally(insights: WorkoutExerciseInsight[]): WorkoutInsightTally {
  return insights.reduce<WorkoutInsightTally>((tally, insight) => {
    const verdict = insight.comparison.verdict
    if (verdict === 'improved') tally.improved += 1
    else if (verdict === 'held') tally.same += 1
    else if (verdict === 'dropped') tally.lower += 1
    else if (verdict === 'traded' || verdict === 'mixed') tally.mixed += 1
    else if (verdict === 'baseline') tally.baseline += 1
    return tally
  }, { improved: 0, same: 0, lower: 0, mixed: 0, baseline: 0 })
}

export function workoutCompletionCounts(
  entries: WorkoutEntry[],
  plannedExercises: number,
  plannedSets: number,
  completedExerciseCount?: number
) {
  const sets = entries.reduce((total, entry) => total + workingSets(entry.sets).length, 0)
  const exercises = completedExerciseCount ?? entries.filter((entry) => entry.sets.length > 0).length
  return {
    sets,
    plannedSets,
    exercises,
    plannedExercises,
    complete: exercises >= plannedExercises && sets >= plannedSets,
  }
}

export function workoutMuscleSetTotals(entries: WorkoutEntry[], exercises: Exercise[]) {
  const totals = new Map<string, number>()
  for (const entry of entries) {
    const exercise = exercises.find((item) => item.id === entry.exerciseId)
    if (!exercise) continue
    const setCount = workingSets(entry.sets).length
    const primary = exercise.primaryMuscles?.length ? exercise.primaryMuscles : [exercise.primaryMuscle]
    for (const muscle of primary) totals.set(muscle, (totals.get(muscle) ?? 0) + setCount)
  }
  return [...totals].map(([muscle, sets]) => ({ muscle, sets })).sort((a, b) => b.sets - a.sets || a.muscle.localeCompare(b.muscle))
}

export type WorkoutTrendTarget = { weight: number; reps: number }
export type WorkoutTrendSet = WorkoutTrendTarget & { logged: boolean }
export type WorkoutTrendSession = {
  date: string
  dayType: 'A' | 'B' | null
  deload: boolean
  today: boolean
  sets: WorkoutTrendSet[]
}

export function buildWorkoutSetTrend(
  entries: WorkoutEntry[],
  blocks: TrainingBlock[],
  exerciseId: string,
  today: string,
  targets: WorkoutTrendTarget[],
  limit = 5
): WorkoutTrendSession[] {
  const sessions = progressLiftSessions(entries, blocks)
    .filter((session) => session.exerciseId === exerciseId)
  let todaySession = sessions.find((session) => session.date === today)
  if (!todaySession) {
    todaySession = {
      exerciseId,
      date: today,
      blockId: null,
      dayKey: null,
      sets: [],
      deload: false,
    }
    sessions.push(todaySession)
  }
  const selected = sessions.sort((a, b) => a.date.localeCompare(b.date)).slice(-Math.max(1, limit))
  return selected.map((session) => {
    const loggedSets = workingSets(session.sets)
    const isToday = session.date === today
    const sets = loggedSets.map(({ weight, reps }) => ({ weight, reps, logged: true }))
    if (isToday) {
      targets.slice(sets.length).forEach((target) => sets.push({ ...target, logged: false }))
    }
    return {
      date: session.date,
      dayType: getDayType({ date: session.date, dayKey: session.dayKey ?? undefined }, blocks),
      deload: session.deload,
      today: isToday,
      sets,
    }
  })
}
