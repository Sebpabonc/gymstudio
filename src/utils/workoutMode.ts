export function nextWorkoutGroupIndex(completed: readonly boolean[], currentIndex: number) {
  for (let index = currentIndex + 1; index < completed.length; index += 1) {
    if (!completed[index]) return index
  }

  return -1
}

export function nextSupersetLoggingStep(
  completed: readonly [number, number],
  planned: readonly [number, number],
  position: 0 | 1,
): { position: 0 | 1; thinSwitch: boolean } | undefined {
  const partner = position === 0 ? 1 : 0
  const partnerPending = completed[partner] < planned[partner]
  if (position === 0 && partnerPending && completed[0] - completed[1] < 2) {
    return { position: 1, thinSwitch: true }
  }
  if (position === 1 && partnerPending) return { position: 0, thinSwitch: false }
  if (completed[position] < planned[position]) return { position, thinSwitch: false }
  if (partnerPending) return { position: partner, thinSwitch: false }
  return undefined
}

export function resumeSupersetLoggingPosition(completed: readonly [number, number], planned: readonly [number, number]): 0 | 1 | undefined {
  if (completed[0] >= planned[0]) return completed[1] < planned[1] ? 1 : undefined
  if (completed[1] >= planned[1]) return 0
  return completed[1] < completed[0] ? 1 : 0
}

export function supersetSwitchSeconds(until: number, now: number) {
  return Math.max(0, Math.min(10, Math.ceil((until - now) / 1000)))
}

export function nextWorkoutLoggingSet(done: readonly boolean[], planned: number, cached?: number) {
  const pending = done.slice(0, planned).findIndex((complete) => !complete)
  return Math.max(0, Math.min(planned - 1, pending >= 0 ? pending : cached ?? planned - 1))
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

type DayLogEntry = { exerciseId: string; date: string; blockId?: string; dayKey?: string; sets?: readonly { tag?: string }[] }

/**
 * PO 2026-10-18: the Today button says Start / Continue (n of N) / Completed for this day this week.
 * Counts the same way as the weekly progress bar: an exercise of this block day logged in the week.
 */
export function dayWorkoutStatus(
  exerciseIds: readonly (string | undefined)[],
  entries: readonly DayLogEntry[],
  scope: { blockId: string; dayKey: string; weekStart: string; weekEnd: string },
  plannedSetCounts?: readonly number[]
): DayWorkoutStatus {
  const dayEntries = entries.filter((entry) =>
    entry.blockId === scope.blockId &&
    entry.dayKey === scope.dayKey &&
    entry.date.slice(0, 10) >= scope.weekStart &&
    entry.date.slice(0, 10) <= scope.weekEnd
  )
  const total = exerciseIds.length
  const done = exerciseIds.filter((id, index) => id && dayEntries.some((entry) =>
    entry.exerciseId === id && (!plannedSetCounts ||
      (entry.sets?.filter((set) => !set.tag || set.tag === 'main').length ?? 0) >= plannedSetCounts[index])
  )).length
  const lastDate = dayEntries.map((entry) => entry.date.slice(0, 10)).sort().pop()
  const hasPartial = dayEntries.some((entry) => exerciseIds.includes(entry.exerciseId))
  const state = total > 0 && done >= total ? 'done' : done > 0 || hasPartial ? 'in-progress' : 'not-started'
  return { state, done, total, lastDate }
}
