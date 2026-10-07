import { formatNumber } from '../i18n/format'
import { Exercise, TrainingBlock } from '../types'
import { getExerciseDisplayName } from '../utils/storage'
import { defaultActiveBlock, trainingBlockDateStatus } from '../utils/trainingBlocks'
import { parseRepPrescription } from '../utils/workoutSets'
import { prescriptionForWeek } from '../plans/weekPrescription'
import { buildEvidence, progressionEvidence } from '../trainer/evidence'
import { progressionSets, recommend, workingWeight } from '../trainer/engine'
import { trainerReason } from '../trainer/presentation'
import { ProgressEntry, ProgressSuggestion } from './types'
import {
  defaultProgressI18n,
  blockWeek,
  dateValue,
  exerciseFor,
  findBlockForDate,
  findEntryBlock,
  getDayType,
  groupExerciseSessions,
  isDeloadWeek,
  plannedExerciseForEntry,
  ProgressI18n,
  sessionE1RM,
  workingSets,
} from './utils'

const SIX_WEEKS_MS = 42 * 24 * 60 * 60 * 1000

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

export function progressSuggestions(
  entries: ProgressEntry[],
  blocks: TrainingBlock[],
  exercises: Exercise[],
  today: string,
  { language, t }: ProgressI18n = defaultProgressI18n,
  activeBlock: TrainingBlock | null = defaultActiveBlock(blocks, today)
): ProgressSuggestion[] {
  const block = suggestionSourceBlock(blocks, activeBlock, today)
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
    const latestMainSets = progressionSets(latest.sets, latest.sets.length)
    const exercise = exerciseFor(exercises, latest.exerciseId)
    const name = exercise ? getExerciseDisplayName(exercise, language) : latest.exerciseId

    const planned = plannedExerciseForEntry(block, latest)
    const recommendationWeek = blockWeek(block, today) ?? blockWeek(block, latest.date) ?? 1
    const currentPlan = planned ? prescriptionForWeek(planned, recommendationWeek) : null
    const reps = currentPlan?.reps.flatMap(parseRepPrescription) ?? []
    const target = reps.length
      ? { min: Math.min(...reps), max: Math.max(...reps) }
      : { min: 8, max: 8 }
    const plannedSetCount = planned?.sets ?? Math.max(1, latestMainSets.length)
    const evidence = progressionEvidence(buildEvidence(entries, exerciseId, blocks, today), plannedSetCount)
    const recommendation = recommend({
      history: evidence,
      today,
      target,
      sets: plannedSetCount,
      equipment: exercise?.equipment,
      plannedWeight: workingWeight(latestMainSets) || undefined,
      deload: blockWeek(block, today) === 6,
    })
    const previousWeight = recommendation.evidence.lastWeight ?? workingWeight(latestMainSets)
    if (
      recommendation.action === 'increase_weight' &&
      recommendation.weight !== null &&
      recommendation.weight > previousWeight
    ) {
      suggestions.push({
        type: 'add-weight',
        exerciseId: latest.exerciseId,
        dayType,
        message: t('progress.suggestions.addWeight.message', {
          weight: formatNumber(language, recommendation.weight),
          reps: recommendation.reps.min === recommendation.reps.max
            ? formatNumber(language, recommendation.reps.min)
            : `${formatNumber(language, recommendation.reps.min)}–${formatNumber(language, recommendation.reps.max)}`,
          exercise: name,
          dayType,
        }),
        why: trainerReason(t, language, recommendation, target),
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
      message: t('progress.suggestions.plateau.message', { exercise: name, dayType }),
      why: t('progress.suggestions.plateau.why', { dayType }),
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
        message: t('progress.suggestions.fatigue.message'),
        why: t('progress.suggestions.fatigue.why'),
      },
    ]
  }
  return [...suggestions, ...plateauSuggestions]
}

export function suggestionSourceBlock(
  blocks: TrainingBlock[],
  activeBlock: TrainingBlock | null,
  today: string
) {
  if (!activeBlock) return null
  const status = trainingBlockDateStatus(activeBlock, today)
  if (status === 'Current') return activeBlock
  if (status !== 'Upcoming') return null
  return [...blocks]
    .filter((block) => block.startDate < activeBlock.startDate)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))[0] ?? null
}
