import { TrainingBlock, WorkoutEntry } from '../types'
import { PersonalRecordType } from '../progress/types'
import { personalRecords } from '../progress/personalRecords'
import { CompletionScope, findCompletedEntry } from './completedExercises'
import { workoutVolume } from './workoutSets'

export type UndoSnapshot = {
  loggedEntryId: string
  exerciseId: string
  scope: CompletionScope
  previousEntries: WorkoutEntry[]
}

export type SessionSummary = {
  duration: string
  sets: number
  volume: number
  prs: Array<{ exerciseId: string; badges: PersonalRecordType[] }>
}

export type SessionStart = {
  scopeKey: string
  timestamp: number
}

export function sessionDurationMs(start: SessionStart | null, scopeKey: string, endedAt: number) {
  return Math.max(0, endedAt - (start?.scopeKey === scopeKey ? start.timestamp : endedAt))
}

export function captureUndoSnapshots(
  history: WorkoutEntry[],
  loggedEntries: WorkoutEntry[],
  scope: CompletionScope
): UndoSnapshot[] {
  return loggedEntries.map((entry) => ({
    loggedEntryId: entry.id,
    exerciseId: entry.exerciseId,
    scope,
    previousEntries: history.filter(
      (item) => item.exerciseId === entry.exerciseId && findCompletedEntry([item], scope)
    ),
  }))
}

export function undoLoggedEntries(history: WorkoutEntry[], snapshots: UndoSnapshot[]) {
  return snapshots.reduce((nextHistory, snapshot) => {
    if (!nextHistory.some((entry) => entry.id === snapshot.loggedEntryId)) return nextHistory

    return [
      ...nextHistory.filter(
        (entry) =>
          entry.exerciseId !== snapshot.exerciseId ||
          !findCompletedEntry([entry], snapshot.scope)
      ),
      ...snapshot.previousEntries,
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, history)
}

export function getPersonalRecordBadges(
  entry: WorkoutEntry,
  history: WorkoutEntry[],
  blocks: TrainingBlock[]
): PersonalRecordType[] {
  const scopedHistory = history.filter(
    (item) =>
      item.date !== entry.date ||
      (item.blockId === entry.blockId && item.dayKey === entry.dayKey)
  )
  const records = personalRecords(scopedHistory, blocks)
  return records.find((record) => record.exerciseId === entry.exerciseId && record.date === entry.date)?.badges ?? []
}

export function createSessionSummary(
  entries: WorkoutEntry[],
  durationMs: number,
  history: WorkoutEntry[],
  blocks: TrainingBlock[]
): SessionSummary {
  const durationMinutes = Math.max(1, Math.round(durationMs / 60_000))
  const badgesByExercise = new Map<string, Set<PersonalRecordType>>()

  for (const entry of entries) {
    const badges = getPersonalRecordBadges(entry, history, blocks)
    if (badges.length === 0) continue
    const exerciseBadges = badgesByExercise.get(entry.exerciseId) ?? new Set<PersonalRecordType>()
    badges.forEach((badge) => exerciseBadges.add(badge))
    badgesByExercise.set(entry.exerciseId, exerciseBadges)
  }

  return {
    duration: `${durationMinutes} min${durationMinutes === 1 ? '' : 's'}`,
    sets: entries.reduce((total, entry) => total + entry.sets.length, 0),
    volume: Math.round(entries.reduce((total, entry) => total + workoutVolume(entry.sets), 0) * 10) / 10,
    prs: Array.from(badgesByExercise, ([exerciseId, badges]) => ({ exerciseId, badges: [...badges] })),
  }
}

export function getPersonalRecords(history: WorkoutEntry[], blocks: TrainingBlock[]) {
  return personalRecords(history, blocks)
}
