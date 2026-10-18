import { type Language, localeFor, translate } from '../i18n/translate'
import { WorkoutEntry } from '../types'
import { workoutMaxWeight } from './workoutSets'

export type CompletionScope = {
  date: string
  blockId?: string
  dayKey?: string
}

type DatedEntry = Pick<WorkoutEntry, 'exerciseId' | 'date' | 'loggedAt'>

/**
 * PO 2026-10-07: when an exercise has several logs on one date, the latest saved one counts.
 * Entries without `loggedAt` rank oldest; ties keep the first one seen (history is newest-first).
 */
export function latestPerExerciseDate<T extends DatedEntry>(entries: T[]): T[] {
  const latest = new Map<string, T>()
  for (const entry of entries) {
    const key = `${entry.exerciseId}:${entry.date.slice(0, 10)}`
    const current = latest.get(key)
    if (!current || (entry.loggedAt ?? 0) > (current.loggedAt ?? 0)) latest.set(key, entry)
  }
  return entries.filter((entry) => latest.get(`${entry.exerciseId}:${entry.date.slice(0, 10)}`) === entry)
}

/** Another day slot of the same block already holding a log of this exercise on this date. */
export function findSameDayDuplicate(
  history: WorkoutEntry[],
  exerciseId: string,
  scope: CompletionScope
): WorkoutEntry | undefined {
  if (!scope.blockId) return undefined
  return history.find(
    (entry) =>
      entry.exerciseId === exerciseId &&
      entry.sets.length > 0 &&
      entry.date === scope.date &&
      entry.blockId === scope.blockId &&
      !!entry.dayKey &&
      entry.dayKey !== scope.dayKey
  )
}

export function findCompletedEntry(entries: WorkoutEntry[], scope: CompletionScope): WorkoutEntry | undefined {
  return entries.find(
    (entry) =>
      entry.date === scope.date &&
      (entry.blockId ?? undefined) === (scope.blockId ?? undefined) &&
      (entry.dayKey ?? undefined) === (scope.dayKey ?? undefined)
  )
}

/** Monday–Sunday week containing `date` (ISO yyyy-mm-dd). */
export function weekBounds(date: string) {
  const value = Date.parse(`${date}T00:00:00Z`)
  const weekday = new Date(value).getUTCDay()
  const start = new Date(value - (weekday === 0 ? 6 : weekday - 1) * 86_400_000)
  const end = new Date(start.getTime() + 6 * 86_400_000)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

/**
 * PO 2026-10-07: the plan shows the active week. An exercise counts as done for its day if it was logged for that
 * block/day any time this Monday–Sunday week (latest wins); next Monday every day starts empty again.
 */
export function findWeekCompletion(entries: WorkoutEntry[], scope: CompletionScope): WorkoutEntry | undefined {
  const { start, end } = weekBounds(scope.date)
  return entries
    .filter((entry) =>
      entry.date >= start && entry.date <= end &&
      (entry.blockId ?? undefined) === (scope.blockId ?? undefined) &&
      (entry.dayKey ?? undefined) === (scope.dayKey ?? undefined))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.loggedAt ?? 0) - (a.loggedAt ?? 0))[0]
}

export function summarizeCompletedEntry(entry: WorkoutEntry, language: Language = 'en') {
  const count = entry.sets.length
  const top = workoutMaxWeight(entry.sets)
  const base = translate(language, count === 1 ? 'workout.set.one' : 'workout.set.other', { count })
  return top > 0 ? translate(language, 'workout.completed.top', { sets: base, weight: top }) : base
}

export function formatLoggedTime(timestamp: number, language: Language = 'en') {
  return new Date(timestamp).toLocaleTimeString(localeFor(language), {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function findNextPendingIndex(done: boolean[], currentIndex: number): number {
  for (let offset = 1; offset <= done.length; offset += 1) {
    const index = (currentIndex + offset) % done.length
    if (index !== currentIndex && !done[index]) return index
  }
  return -1
}

export type PrefillSelection = {
  entry: WorkoutEntry
  basis: 'same-day' | 'other-day' | 'latest'
}

export function getDayKeyType(dayKey?: string): 'A' | 'B' | undefined {
  const match = dayKey?.match(/(?:^|-)([ab])$/i)
  return match ? match[1].toUpperCase() as 'A' | 'B' : undefined
}

function getPairedDayKey(dayKey: string) {
  const type = getDayKeyType(dayKey)
  if (!type) return undefined
  const suffix = dayKey.slice(-1)
  const replacement = type === 'A' ? 'B' : 'A'
  return dayKey.replace(/[ab]$/i, suffix === suffix.toUpperCase() ? replacement : replacement.toLowerCase())
}

export function findPrefillSelection(
  entries: WorkoutEntry[],
  exerciseId: string,
  dayKey?: string
): PrefillSelection | undefined {
  const latestFirst = entries
    .filter((entry) => entry.exerciseId === exerciseId && entry.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
  if (dayKey) {
    const sameDay = latestFirst.find((entry) => entry.dayKey === dayKey)
    if (sameDay) return { entry: sameDay, basis: 'same-day' }
    const pairedDayKey = getPairedDayKey(dayKey)
    if (pairedDayKey) {
      const otherDay = latestFirst.find((entry) => entry.dayKey === pairedDayKey)
      return otherDay ? { entry: otherDay, basis: 'other-day' } : undefined
    }
  }
  const latest = latestFirst[0]
  return latest ? { entry: latest, basis: 'latest' } : undefined
}

export function findPrefillEntry(entries: WorkoutEntry[], exerciseId: string, dayKey?: string): WorkoutEntry | undefined {
  return findPrefillSelection(entries, exerciseId, dayKey)?.entry
}

export function upsertScopedEntry(
  history: WorkoutEntry[],
  entry: WorkoutEntry,
  scope: CompletionScope
): { history: WorkoutEntry[]; entry: WorkoutEntry } {
  const sameSlot = (item: WorkoutEntry) =>
    item.exerciseId === entry.exerciseId && findCompletedEntry([item], scope) !== undefined
  const existing = history.find(sameSlot)
  const saved = { ...entry, ...(existing ? { id: existing.id } : {}), loggedAt: Date.now() }
  const nextHistory = [saved, ...history.filter((item) => !sameSlot(item))].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return { history: nextHistory, entry: saved }
}
