import { Exercise, TrainingBlock } from '../types'
import { MuscleGroup, ProgressEntry, WeeklyMuscleSets } from './types'
import { dateValue, exerciseFor, groupExerciseSessions, startOfWeek, workingSets } from './utils'

const GROUP_MUSCLES: Record<MuscleGroup, string[]> = {
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

const FLAGGED_GROUPS = new Set<MuscleGroup>([
  'Chest',
  'Back',
  'Shoulders (side and rear)',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
])

function groupCredits(exercise: Exercise | undefined) {
  const credits = new Map<MuscleGroup, number>()
  if (!exercise) return credits
  const primary = exercise.primaryMuscles ?? (exercise.primaryMuscle ? [exercise.primaryMuscle] : [])
  const secondary = exercise.secondaryMuscles ?? (exercise.secondaryMuscle ? [exercise.secondaryMuscle] : [])
  for (const [group, muscles] of Object.entries(GROUP_MUSCLES) as Array<[MuscleGroup, string[]]>) {
    const isPrimary = muscles.some((muscle) => primary.includes(muscle))
    const isSecondary = !isPrimary && muscles.some((muscle) => secondary.includes(muscle))
    if (isPrimary) credits.set(group, 1)
    else if (isSecondary) credits.set(group, 0.5)
  }
  return credits
}

function bandForSets(sets: number): WeeklyMuscleSets['groups'][number]['band'] {
  if (sets < 6) return 'low'
  if (sets < 10) return 'light'
  if (sets <= 20) return 'in-range'
  return 'high'
}

function addExerciseSets(
  totals: Map<MuscleGroup, number>,
  exerciseId: string,
  sets: number,
  exercises: Exercise[]
) {
  for (const [group, credit] of groupCredits(exerciseFor(exercises, exerciseId))) {
    totals.set(group, (totals.get(group) ?? 0) + sets * credit)
  }
}

function plannedBlockForWeek(blocks: TrainingBlock[], weekStart: string) {
  const weekEnd = dateValue(weekStart) + 6 * 24 * 60 * 60 * 1000
  return blocks.find((block) => {
    const blockStart = dateValue(block.startDate)
    const blockEnd = blockStart + block.weeks * 7 * 24 * 60 * 60 * 1000
    return blockStart <= weekEnd && blockEnd > dateValue(weekStart)
  }) ?? null
}

export function weeklySets(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  week: string
): WeeklyMuscleSets {
  const weekStart = startOfWeek(week)
  const weekEnd = dateValue(weekStart) + 7 * 24 * 60 * 60 * 1000
  const done = new Map<MuscleGroup, number>()
  const planned = new Map<MuscleGroup, number>()
  for (const session of groupExerciseSessions(entries)) {
    const value = dateValue(session.date)
    if (value < dateValue(weekStart) || value >= weekEnd) continue
    const count = workingSets(session.sets).length
    addExerciseSets(done, session.exerciseId, count, exercises)
  }

  const block = plannedBlockForWeek(blocks, weekStart)
  if (block) {
    for (const day of block.days) {
      for (const exercise of day.exercises) {
        addExerciseSets(planned, exercise.exerciseId, exercise.sets, exercises)
      }
    }
  }

  const groups = Object.keys(GROUP_MUSCLES) as MuscleGroup[]
  return {
    weekStart,
    groups: groups.map((muscleGroup) => {
      const doneSets = done.get(muscleGroup) ?? 0
      return {
        muscleGroup,
        done: doneSets,
        planned: planned.get(muscleGroup) ?? 0,
        band: bandForSets(doneSets),
        flagged: FLAGGED_GROUPS.has(muscleGroup),
      }
    }),
  }
}
