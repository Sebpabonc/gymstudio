import { groupSupersets } from './supersets'

export type SuperSimpleStep = {
  exerciseIndex: number
  setIndex: number
}

type PlannedExercise = {
  name: string
  code?: string
  technique?: string
  sets?: string
}

function setCount(exercise: PlannedExercise) {
  return Math.max(1, Number.parseInt(exercise.sets ?? '1', 10) || 1)
}

export function buildSuperSimpleSteps(exercises: PlannedExercise[]): SuperSimpleStep[] {
  return groupSupersets(exercises).flatMap((group) => {
    if (!group.isSuperset) {
      const { exerciseIndex } = group.items[0]
      return Array.from({ length: setCount(exercises[exerciseIndex]) }, (_, setIndex) => ({
        exerciseIndex,
        setIndex,
      }))
    }

    const rounds = Math.max(...group.items.map(({ exerciseIndex }) => setCount(exercises[exerciseIndex])))
    return Array.from({ length: rounds }, (_, setIndex) =>
      group.items.flatMap(({ exerciseIndex }) =>
        setIndex < setCount(exercises[exerciseIndex]) ? [{ exerciseIndex, setIndex }] : []
      )
    ).flat()
  })
}

export function firstPendingSuperSimpleStep(
  steps: SuperSimpleStep[],
  completedSetCounts: number[]
): number {
  return steps.findIndex(({ exerciseIndex, setIndex }) => setIndex >= (completedSetCounts[exerciseIndex] ?? 0))
}
