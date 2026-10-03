import { Exercise, TrainingBlock } from '../types'
import { ProgressEntry, ProgressSuggestion } from './types'
import {
  blockWeek,
  currentOrLatestBlock,
  dateValue,
  exerciseFor,
  findEntryBlock,
  getDayType,
  groupExerciseSessions,
  isDeloadWeek,
  plannedExerciseForEntry,
  prescribedReps,
  sessionE1RM,
  workingSets,
} from './utils'

const SIX_WEEKS_MS = 42 * 24 * 60 * 60 * 1000

function getIncrement(exercise: Exercise | undefined) {
  const equipment = exercise?.equipment?.toLowerCase() ?? ''
  const lowerBody = /lower|leg|glute/i.test(exercise?.bodyRegion ?? '')
  if (lowerBody && (/barbell|smith|machine/.test(equipment))) return 5
  if (equipment === 'dumbbell') return 2
  if (equipment === 'barbell' || equipment === 'smith-machine' || equipment === 'plate-loaded') return 2.5
  if (equipment === 'cable' || equipment === 'machine') return 2.5
  return 2.5
}

function sessionScore(sets: ProgressEntry['sets']) {
  const e1rm = sessionE1RM(sets)
  if (e1rm !== null) return e1rm
  const working = workingSets(sets)
  if (!working.length) return null
  const countByWeight = new Map<number, number>()
  for (const set of working) countByWeight.set(set.weight, (countByWeight.get(set.weight) ?? 0) + 1)
  const mostUsedWeight = [...countByWeight].sort((a, b) => b[1] - a[1])[0]?.[0]
  return Math.max(...working.filter((set) => set.weight === mostUsedWeight).map((set) => set.reps))
}

function hitTarget(
  session: ReturnType<typeof groupExerciseSessions>[number],
  block: TrainingBlock,
  previous: ReturnType<typeof groupExerciseSessions>
) {
  const plan = plannedExerciseForEntry(block, session)
  const logged = workingSets(session.sets)
  const previousSession = [...previous].reverse().find(
    (item) => item.exerciseId === session.exerciseId
      && getDayType(item, [block]) === getDayType(session, [block])
  )
  if (plan) {
    if (logged.length < plan.sets) return false
    return Array.from({ length: plan.sets }, (_, index) => {
      const target = prescribedReps(plan, index)
      return target !== null && logged[index]?.reps >= target
    }).every(Boolean)
  }
  if (!previousSession) return false
  const previousSets = workingSets(previousSession.sets)
  return logged.length >= previousSets.length && previousSets.every((set, index) => logged[index]?.reps >= set.reps)
}

export function progressSuggestions(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  today: string,
  appliedExerciseIds: ReadonlySet<string> = new Set()
): ProgressSuggestion[] {
  const block = currentOrLatestBlock(blocks, today)
  if (!block) return []
  const sessions = groupExerciseSessions(entries)
  const recentAfter = dateValue(today) - SIX_WEEKS_MS
  const recentSessions = sessions.filter((session) => {
    const entryBlock = findEntryBlock(blocks, session)
    return entryBlock?.id === block.id && dateValue(session.date) >= recentAfter && session.date <= today
  })
  const byExercise = new Map<string, typeof recentSessions>()
  for (const session of recentSessions) {
    const type = getDayType(session, blocks)
    if (!type || isDeloadWeek(block, session.date)) continue
    byExercise.set(session.exerciseId, [...(byExercise.get(session.exerciseId) ?? []), session])
  }

  const suggestions: ProgressSuggestion[] = []
  const plateauByWeek = new Map<number, number>()
  const plateauSuggestions: ProgressSuggestion[] = []

  for (const [exerciseId, exerciseSessions] of byExercise) {
    const ordered = [...exerciseSessions].sort((a, b) => a.date.localeCompare(b.date))
    const latestAnyDay = ordered[ordered.length - 1]
    if (!latestAnyDay) continue
    const dayType = getDayType(latestAnyDay, blocks)
    if (!dayType) continue
    const daySessions = ordered.filter((session) => getDayType(session, blocks) === dayType)
    const latest = daySessions[daySessions.length - 1]
    if (!latest) continue
    const exercise = exerciseFor(exercises, latest.exerciseId)
    const name = exercise?.name ?? latest.exerciseId

    if (appliedExerciseIds.has(exerciseId)) continue

    if (hitTarget(latest, block, daySessions.slice(0, -1))) {
      const increment = getIncrement(exercise)
      suggestions.push({
        type: 'add-weight',
        exerciseId: latest.exerciseId,
        dayType,
        increment,
        message: `Ready to add ${increment} kg on ${name} next ${dayType} day.`,
      })
      continue
    }

    const blockSessions = daySessions.filter((session) => blockWeek(block, session.date) !== null)
    const lastThree = blockSessions.slice(-3)
    const latestWeek = blockWeek(block, latest.date)
    if (lastThree.length < 3 || latestWeek === null || latestWeek < 3) continue

    const scores = lastThree.map((session) => sessionScore(session.sets))
    if (scores.some((score) => score === null)) continue
    const baselineSessions = blockSessions.slice(0, -3)
    const baselineScores = baselineSessions.map((session) => sessionScore(session.sets))
      .filter((score): score is number => score !== null)
    if (!baselineScores.length) continue
    const priorBest = Math.max(...baselineScores)
    if (Math.max(...scores as number[]) > priorBest * 1.01) continue

    const suggestion: ProgressSuggestion = {
      type: 'plateau',
      exerciseId,
      dayType,
      message: `${name} has held steady for 3 ${dayType}-day sessions. Aim for one more rep at the same weight before adding load.`,
    }
    plateauSuggestions.push(suggestion)
    plateauByWeek.set(latestWeek, (plateauByWeek.get(latestWeek) ?? 0) + 1)
  }

  const fatigueWeek = [...plateauByWeek.entries()]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[0] - a[0])[0]?.[0]
  if (fatigueWeek !== undefined) {
    return [
      ...suggestions,
      {
        type: 'fatigue',
        week: fatigueWeek,
        message: 'Many lifts have stalled at once. Sleep, food and stress usually matter more than the program; prioritize recovery.',
      },
    ]
  }
  return [...suggestions, ...plateauSuggestions]
}
