import { type Language, localeFor, translate } from '../i18n/translate'
import { WorkoutEntry } from '../types'
import { workoutMaxWeight } from './workoutSets'

export type CompletionScope = {
  date: string
  blockId?: string
  dayKey?: string
}

export function findCompletedEntry(entries: WorkoutEntry[], scope: CompletionScope): WorkoutEntry | undefined {
  return entries.find(
    (entry) =>
      entry.date === scope.date &&
      (entry.blockId ?? undefined) === (scope.blockId ?? undefined) &&
      (entry.dayKey ?? undefined) === (scope.dayKey ?? undefined)
  )
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
  const saved = existing ? { ...entry, id: existing.id } : entry
  const nextHistory = [saved, ...history.filter((item) => !sameSlot(item))].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )
  return { history: nextHistory, entry: saved }
}
