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
