import type { Exercise, TrainingBlock } from '../types'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { MuscleGroup, ProgressEntry } from './types'
import { dateValue, exerciseFor, findBlockForDate, isDeloadWeek, startOfWeek, workingSets } from './utils'
import { progressLiftSessions } from './trends'

const DAY_MS = 24 * 60 * 60 * 1000

const MUSCLE_NAMES: Record<MuscleGroup, string[]> = {
  Chest: ['Chest', 'Upper Chest'],
  Back: ['Lats', 'Upper Back'],
  'Shoulders (side and rear)': ['Side Delts', 'Rear Delts'],
  'Front delts': ['Front Delts'],
  Biceps: ['Biceps'],
  Triceps: ['Triceps'],
  Quads: ['Quads'],
  Hamstrings: ['Hamstrings'],
  Glutes: ['Glutes'],
  Calves: ['Calves'],
  Core: ['Abs', 'Obliques'],
  Other: ['Traps', 'Forearms', 'Lower Back', 'Hip Flexors', 'Adductors', 'Abductors'],
}

export type MuscleWeek = {
  weekStart: string
  complete: boolean
  deload: boolean
  values: Record<MuscleGroup, number>
}

export type MuscleTrend = {
  weeks: MuscleWeek[]
  groups: MuscleGroup[]
  averages: Partial<Record<MuscleGroup, number>>
}

function blankValues(): Record<MuscleGroup, number> {
  return {
    Chest: 0,
    Back: 0,
    'Shoulders (side and rear)': 0,
    'Front delts': 0,
    Biceps: 0,
    Triceps: 0,
    Quads: 0,
    Hamstrings: 0,
    Glutes: 0,
    Calves: 0,
    Core: 0,
    Other: 0,
  }
}

function muscleCredits(exercise: Exercise | undefined) {
  const primary = exercise?.primaryMuscles ?? (exercise?.primaryMuscle ? [exercise.primaryMuscle] : [])
  const secondary = exercise?.secondaryMuscles ?? (exercise?.secondaryMuscle ? [exercise.secondaryMuscle] : [])
  const credits: Partial<Record<MuscleGroup, number>> = {}
  for (const [group, names] of Object.entries(MUSCLE_NAMES) as Array<[MuscleGroup, string[]]>) {
    if (names.some((name) => primary.includes(name))) credits[group] = 1
    else if (names.some((name) => secondary.includes(name))) credits[group] = 0.5
  }
  return credits
}

function primaryPlanGroups(block: TrainingBlock | null, exercises: Exercise[]) {
  const groups = new Set<MuscleGroup>()
  for (const plan of block?.days.flatMap((day) => day.exercises) ?? []) {
    for (const [group, credit] of Object.entries(muscleCredits(exerciseFor(exercises, plan.exerciseId)))) {
      if (credit === 1) groups.add(group as MuscleGroup)
    }
  }
  return [...groups]
}

export function muscleTrend(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  activeBlock: TrainingBlock | null,
  today: string
): MuscleTrend {
  const sessions = progressLiftSessions(entries, blocks)
  const thisWeek = startOfWeek(today)
  const firstDate = sessions[0]?.date
  const firstWeek = firstDate ? startOfWeek(firstDate) : thisWeek
  const weeks: MuscleWeek[] = []
  for (let cursor = dateValue(firstWeek); cursor <= dateValue(thisWeek); cursor += 7 * DAY_MS) {
    const weekStart = new Date(cursor).toISOString().slice(0, 10)
    const values = blankValues()
    const weekSessions = sessions.filter((session) => session.date >= weekStart && session.date < new Date(cursor + 7 * DAY_MS).toISOString().slice(0, 10))
    for (const session of weekSessions) {
      const count = workingSets(session.sets).length
      for (const [group, credit] of Object.entries(muscleCredits(exerciseFor(exercises, session.exerciseId)))) {
        values[group as MuscleGroup] += count * (credit ?? 0)
      }
    }
    const block = findBlockForDate(blocks, weekStart)
    weeks.push({
      weekStart,
      complete: weekStart < thisWeek,
      deload: weekSessions.length > 0
        ? weekSessions.every((session) => session.deload)
        : Boolean(block && isDeloadWeek(block, weekStart)),
      values,
    })
  }
  const completeWeeks = weeks.filter((week) => week.complete && !week.deload).slice(-PROGRESS_THRESHOLDS.muscleAverageWeeks)
  const averages: Partial<Record<MuscleGroup, number>> = {}
  if (completeWeeks.length === PROGRESS_THRESHOLDS.muscleAverageWeeks) {
    for (const group of Object.keys(blankValues()) as MuscleGroup[]) {
      averages[group] = completeWeeks.reduce((total, week) => total + week.values[group], 0) / completeWeeks.length
    }
  }
  return {
    weeks,
    groups: primaryPlanGroups(activeBlock, exercises),
    averages,
  }
}

export const MUSCLE_CHART_MAXIMUM = PROGRESS_THRESHOLDS.muscleChartMaximum
export const MUSCLE_COMMON_RANGE = {
  min: PROGRESS_THRESHOLDS.muscleCommonRangeMin,
  max: PROGRESS_THRESHOLDS.muscleCommonRangeMax,
}
