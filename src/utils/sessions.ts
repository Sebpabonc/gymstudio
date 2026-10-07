import type { WorkoutEntry } from '../types'

export type LoggedSession = { key: string; date: string; blockId?: string; dayKey?: string; entries: WorkoutEntry[] }

/** Logged sessions = entries grouped by date + block + day, newest first (PO 2026-10-07: delete a whole session at once). */
export function groupSessions(history: WorkoutEntry[]): LoggedSession[] {
  const map = new Map<string, LoggedSession>()
  for (const entry of history) {
    const date = entry.date.slice(0, 10)
    const key = `${date}|${entry.blockId ?? ''}|${entry.dayKey ?? ''}`
    const session = map.get(key) ?? { key, date, blockId: entry.blockId, dayKey: entry.dayKey, entries: [] }
    session.entries.push(entry)
    map.set(key, session)
  }
  return [...map.values()].sort((a, b) => b.date.localeCompare(a.date) || a.key.localeCompare(b.key))
}

/** Entries logged today for one plan day (Today: "Delete today's logs for this day"). */
export function todaysEntriesForDay(history: WorkoutEntry[], today: string, blockId: string, dayKey: string) {
  return history.filter((entry) => entry.date.slice(0, 10) === today && entry.blockId === blockId && entry.dayKey === dayKey)
}
