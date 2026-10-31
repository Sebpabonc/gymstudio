import type { TrainingBlock, WorkoutEntry, WorkoutSet } from '../types'
import { blockWeek, findEntryBlock, plannedExerciseForEntry } from '../progress/utils'
import { prescriptionForWeek } from '../plans/weekPrescription'
import type { CompletionScope } from './completedExercises'
import { equipmentStep, roundToStep } from '../trainer/engine'

function mainRepRange(target: string) {
  const values = target.split('+', 1)[0].match(/\d+/g)?.map(Number) ?? []
  return { min: Math.min(...values), max: Math.max(...values) }
}

/** Approved logging rules §5.1: repeat actual reps at the same load, otherwise use the target floor. */
export function prefillLoggedReps({
  target,
  weight,
  previous,
  deload = false,
}: {
  target: string
  weight: number
  previous?: Pick<WorkoutSet, 'weight' | 'reps'>
  deload?: boolean
}) {
  const prescribed = mainRepRange(target).min
  if (!deload && previous && previous.weight === weight && previous.reps > 0) return previous.reps
  return Number.isFinite(prescribed) && prescribed > 0 ? prescribed : 8
}

export function findComparableLoggingEntry(
  history: WorkoutEntry[],
  exerciseId: string,
  target: { min: number; max: number },
  tempo: boolean,
  scope: CompletionScope,
  blocks: TrainingBlock[],
): WorkoutEntry | undefined {
  return history
    .filter((entry) => {
      if (entry.exerciseId !== exerciseId || !entry.sets.some((set) => !set.tag || set.tag === 'main')) return false
      if (entry.date.slice(0, 10) > scope.date.slice(0, 10)) return false
      if (entry.date.slice(0, 10) === scope.date.slice(0, 10) &&
        entry.blockId === scope.blockId && entry.dayKey === scope.dayKey) return false
      const block = findEntryBlock(blocks, entry)
      const planned = block ? plannedExerciseForEntry(block, entry) : null
      const week = block ? blockWeek(block, entry.date) ?? 1 : 1
      if (week === 6) return false
      if (/\btempo\b/i.test(planned?.notes ?? '') !== tempo) return false
      const ranges = planned ? prescriptionForWeek(planned, week).reps.map(mainRepRange) : []
      // "Same target" means the plan's target: entry.target holds that day's engine range, which R15 raises.
      const previousTarget = ranges.length ? {
        min: Math.min(...ranges.map((range) => range.min)),
        max: Math.max(...ranges.map((range) => range.max)),
      } : entry.target?.reps
      return previousTarget?.min === target.min && previousTarget.max === target.max
    })
    .sort((a, b) => b.date.localeCompare(a.date))[0]
}

export function canCarryWorkoutLoad(technique: string | undefined, targets: string[], weights: number[]) {
  return ['straight', 'superset', 'drop-set'].includes(technique ?? 'straight') &&
    targets.length > 0 && weights.length > 0 &&
    targets.every((target) => target === targets[0]) &&
    weights.every((weight) => weight === weights[0])
}

export function roundDownWorkoutDrop(weight: number, equipment?: string) {
  // Approved logger T133 uses 5 kg machine drops; the progression engine keeps its own steps.
  const drop = roundToStep(weight * 0.75, equipment === 'machine' ? 5 : equipmentStep(equipment), 'down')
  // Preserve existing light-load behavior when 5 kg rounding would erase the drop.
  return drop > 0 ? drop : roundToStep(weight * 0.75, equipmentStep(equipment), 'down')
}

export function carryWorkoutWeight(
  weights: number[],
  touched: boolean[],
  done: boolean[],
  sourceIndex: number,
  weight: number,
) {
  return weights.map((current, index) =>
    index === sourceIndex || (index > sourceIndex && !touched[index] && !done[index]) ? weight : current
  )
}

/** Reps only carry down, and only to unedited, unlogged sets at the same load. */
export function capUnloggedReps(
  reps: number[],
  weights: number[],
  done: boolean[],
  touched: boolean[],
  sourceIndex: number,
) {
  return reps.map((current, index) =>
    index > sourceIndex && !done[index] && !touched[index] && weights[index] === weights[sourceIndex]
      ? Math.min(current, reps[sourceIndex])
      : current
  )
}
