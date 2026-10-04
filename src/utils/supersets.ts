import { WorkoutEntry, WorkoutSet } from '../types'
import { CompletionScope } from './completedExercises'
import { filterLoggableSets } from './workoutSets'

export type SupersetGroup<T> = {
  key: string
  isSuperset: boolean
  items: { exercise: T; exerciseIndex: number }[]
}

export function groupSupersets<T extends { code?: string; technique?: string; name: string }>(
  exercises: T[]
): SupersetGroup<T>[] {
  const groups: SupersetGroup<T>[] = []
  exercises.forEach((exercise, exerciseIndex) => {
    const letter = exercise.code?.slice(0, 1)
    const last = groups[groups.length - 1]
    const lastExercise = last?.items[last.items.length - 1].exercise
    if (
      exercise.technique === 'superset' &&
      lastExercise?.technique === 'superset' &&
      lastExercise.code?.slice(0, 1) === letter
    ) {
      last.items.push({ exercise, exerciseIndex })
      last.isSuperset = true
    } else {
      groups.push({ key: `${exercise.code ?? exercise.name}`, isSuperset: false, items: [{ exercise, exerciseIndex }] })
    }
  })
  return groups
}

export function getLoggedSupersetRounds(setCounts: number[], roundCount: number): boolean[] {
  const completedRoundCount = setCounts.length > 0 ? Math.min(...setCounts) : 0
  return Array.from({ length: roundCount }, (_, index) => index < completedRoundCount)
}

export type SupersetEntryInput = {
  exerciseId: string
  sets: WorkoutSet[]
  equipment?: string
  notes?: string
}

function createEntryId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function createSupersetEntries(
  exercises: SupersetEntryInput[],
  scope: CompletionScope,
  createId: () => string = createEntryId
): WorkoutEntry[] {
  return exercises.flatMap(({ exerciseId, sets, equipment, notes }) => {
    const loggableSets = filterLoggableSets(sets, equipment)
    if (loggableSets.length === 0) return []
    return [{
      id: createId(),
      exerciseId,
      date: scope.date,
      sets: loggableSets,
      ...(scope.blockId ? { blockId: scope.blockId } : {}),
      ...(scope.dayKey ? { dayKey: scope.dayKey } : {}),
      notes: notes?.trim() ?? '',
    }]
  })
}
