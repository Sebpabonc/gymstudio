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

export function summarizeCompletedEntry(entry: WorkoutEntry) {
  const count = entry.sets.length
  const top = workoutMaxWeight(entry.sets)
  const base = `${count} ${count === 1 ? 'set' : 'sets'}`
  return top > 0 ? `${base} · top ${top} kg` : base
}

export function formatLoggedTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function findNextPendingIndex(done: boolean[], currentIndex: number): number {
  for (let offset = 1; offset <= done.length; offset += 1) {
    const index = (currentIndex + offset) % done.length
    if (index !== currentIndex && !done[index]) return index
  }
  return -1
}

export function findPrefillEntry(entries: WorkoutEntry[], exerciseId: string, dayKey?: string): WorkoutEntry | undefined {
  const latestFirst = entries
    .filter((entry) => entry.exerciseId === exerciseId && entry.sets.length > 0)
    .sort((a, b) => b.date.localeCompare(a.date))
  return (dayKey ? latestFirst.find((entry) => entry.dayKey === dayKey) : undefined) ?? latestFirst[0]
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
