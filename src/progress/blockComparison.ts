import type { Exercise, TrainingBlock } from '../types'
import { dateValue, findEntryBlock, groupExerciseSessions, isDeloadWeek, sessionE1RM, workingSets } from './utils'
import { equipmentStep, sameLoad } from './trends'
import { PROGRESS_THRESHOLDS } from './thresholds'
import type { ProgressEntry } from './types'

export type BlockLiftComparison = {
  exerciseId: string
  start: number | null
  end: number | null
  previousEnd: number | null
  changePercent: number | null
  previousChangePercent: number | null
  newInBlock: boolean
  highRep: boolean
  differentRepTarget: boolean
  sessionCount: number
}

function planFor(block: TrainingBlock | undefined, exerciseId: string) {
  return block?.days.flatMap((day) => day.exercises).find((exercise) => exercise.exerciseId === exerciseId) ?? null
}

function modePoints(sessions: ReturnType<typeof groupExerciseSessions>) {
  const counts = new Map<string, number>()
  for (const session of sessions) {
    const key = `${session.blockId ?? ''}:${session.dayKey ?? ''}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  const key = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0]
  return key ? sessions.filter((session) => `${session.blockId ?? ''}:${session.dayKey ?? ''}` === key) : sessions
}

function highRepSamples(sessions: ReturnType<typeof groupExerciseSessions>, exercise: Exercise | undefined) {
  const samples = sessions.map((session) => {
    const sets = workingSets(session.sets).filter((set) => set.reps >= 1 && set.reps <= 50)
    const load = Math.max(...sets.map((set) => set.weight), 0)
    const reps = sets.filter((set) => sameLoad(set.weight, load, equipmentStep(exercise))).reduce((total, set) => total + set.reps, 0)
    return { load, reps }
  })
  return samples
}

function blockSamples(entries: ProgressEntry[], blocks: TrainingBlock[], block: TrainingBlock, exerciseId: string) {
  return groupExerciseSessions(entries)
    .filter((session) => session.exerciseId === exerciseId && findEntryBlock(blocks, session)?.id === block.id)
    .filter((session) => !isDeloadWeek(block, session.date))
}

function endMean(values: number[]) {
  return values.length < 2 ? null : values.slice(-2).reduce((sum, value) => sum + value, 0) / Math.min(2, values.length)
}

export function blockLiftComparisons(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  activeBlock: TrainingBlock | null
): BlockLiftComparison[] {
  if (!activeBlock) return []
  const orderedBlocks = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate))
  const blockIndex = orderedBlocks.findIndex((block) => block.id === activeBlock.id)
  const previousBlock = orderedBlocks[blockIndex - 1]
  const currentIds = new Set([
    ...(activeBlock.days.flatMap((day) => day.exercises.map((item) => item.exerciseId))),
    ...entries.filter((entry) => findEntryBlock(blocks, entry)?.id === activeBlock.id).map((entry) => entry.exerciseId),
  ])
  return [...currentIds].sort().map((exerciseId) => {
    const exercise = exercises.find((item) => item.id === exerciseId)
    const current = blockSamples(entries, blocks, activeBlock, exerciseId)
    const previous = previousBlock ? blockSamples(entries, blocks, previousBlock, exerciseId) : []
    const currentEligible = current.filter((session) => sessionE1RM(session.sets) !== null)
    const previousEligible = previous.filter((session) => sessionE1RM(session.sets) !== null)
    const highRep = current.length > 0 && currentEligible.length < current.length / 2
    let currentStart: number | null = null
    let currentEnd: number | null = null
    let previousEnd: number | null = null
    let currentChange: number | null = null
    let previousChange: number | null = null
    let differentRepTarget = false
    if (highRep) {
      const currentMode = modePoints(current)
      const previousMode = modePoints(previous)
      const currentSamples = highRepSamples(currentMode, exercise)
      const previousSamples = highRepSamples(previousMode, exercise)
      currentStart = currentSamples[0]?.load ?? null
      currentEnd = currentSamples[currentSamples.length - 1]?.load ?? null
      previousEnd = previousSamples[previousSamples.length - 1]?.load ?? null
      differentRepTarget = Boolean(planFor(previousBlock, exerciseId) && planFor(activeBlock, exerciseId)
        && planFor(previousBlock, exerciseId)?.reps.join(',') !== planFor(activeBlock, exerciseId)?.reps.join(','))
      if (
        currentStart !== null && currentEnd !== null && currentStart > 0
        && currentMode.length >= PROGRESS_THRESHOLDS.comparisonMinimumSessions
        && dateValue(currentMode[currentMode.length - 1].date) - dateValue(currentMode[0].date)
          >= PROGRESS_THRESHOLDS.comparisonMinimumSpanDays * 86_400_000
        && !differentRepTarget
      ) {
        currentChange = ((currentEnd / currentStart) - 1) * 100
      }
      if (previous.length >= 2 && previousEnd !== null) {
        const previousStart = previousSamples[0]?.load
        previousChange = previousStart ? ((previousEnd / previousStart) - 1) * 100 : null
      }
    } else {
      const currentValues = current.map((session) => sessionE1RM(session.sets)).filter((value): value is number => value !== null)
      const previousValues = previous.map((session) => sessionE1RM(session.sets)).filter((value): value is number => value !== null)
      currentStart = currentValues.length ? currentValues.slice(0, 2).reduce((sum, value) => sum + value, 0) / Math.min(2, currentValues.length) : null
      currentEnd = endMean(currentValues)
      previousEnd = endMean(previousValues)
      if (
        currentValues.length >= PROGRESS_THRESHOLDS.minimumTrendSessions
        && dateValue(current[current.length - 1].date) - dateValue(current[0].date) >= PROGRESS_THRESHOLDS.minimumTrendSpanDays * 86_400_000
        && currentStart
      ) currentChange = ((currentEnd as number) / currentStart - 1) * 100
      if (previousEnd && currentEnd && currentChange !== null) previousChange = ((currentEnd / previousEnd) - 1) * 100
    }
    return {
      exerciseId,
      start: currentStart,
      end: currentEnd,
      previousEnd,
      changePercent: currentChange,
      previousChangePercent: previousChange,
      newInBlock: previous.length === 0,
      highRep,
      differentRepTarget,
      sessionCount: highRep ? modePoints(current).length : currentValuesCount(current),
    }
  })
}

function currentValuesCount(sessions: ReturnType<typeof groupExerciseSessions>) {
  return sessions.filter((session) => sessionE1RM(session.sets) !== null).length
}
