export function nextWorkoutGroupIndex(completed: readonly boolean[], currentIndex: number) {
  for (let index = currentIndex + 1; index < completed.length; index += 1) {
    if (!completed[index]) return index
  }
  return -1
}

export type WorkoutChipState = 'current' | 'done' | 'upcoming'

export function workoutChipState(isComplete: boolean, isCurrent: boolean): WorkoutChipState {
  if (isCurrent) return 'current'
  return isComplete ? 'done' : 'upcoming'
}

export function shouldCollapseCompletedLogger(
  isWorkoutMode: boolean,
  completedAt: string | undefined,
  today: string,
  isExpanded: boolean
) {
  return isWorkoutMode && completedAt?.slice(0, 10) === today && !isExpanded
}

export type DayWorkoutStatus = {
  state: 'not-started' | 'in-progress' | 'done'
  done: number
  total: number
  /** Latest date (YYYY-MM-DD) this day was logged in the week, if any. */
  lastDate?: string
}

type DayLogEntry = { exerciseId: string; date: string; blockId?: string; dayKey?: string }

/**
 * PO 2026-10-18: the Today button says Start / Continue (n of N) / Completed for this day this week.
 * Counts the same way as the weekly progress bar: an exercise of this block day logged in the week.
 */
export function dayWorkoutStatus(
  exerciseIds: readonly (string | undefined)[],
  entries: readonly DayLogEntry[],
  scope: { blockId: string; dayKey: string; weekStart: string; weekEnd: string }
): DayWorkoutStatus {
  const dayEntries = entries.filter((entry) =>
    entry.blockId === scope.blockId &&
    entry.dayKey === scope.dayKey &&
    entry.date.slice(0, 10) >= scope.weekStart &&
    entry.date.slice(0, 10) <= scope.weekEnd
  )
  const total = exerciseIds.length
  const done = exerciseIds.filter((id) => id && dayEntries.some((entry) => entry.exerciseId === id)).length
  const lastDate = dayEntries.map((entry) => entry.date.slice(0, 10)).sort().pop()
  const state = done === 0 ? 'not-started' : total > 0 && done >= total ? 'done' : 'in-progress'
  return { state, done, total, lastDate }
}
