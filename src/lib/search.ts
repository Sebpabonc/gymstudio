import { Exercise } from '../domain/types'

/** Lowercase and strip accents so "Jalón" matches "jalon". */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

interface IndexedExercise {
  exercise: Exercise
  name: string
  aliases: string[]
  haystack: string
}

export type SearchIndex = IndexedExercise[]

/** Pre-normalizes the library once so every keystroke is a cheap scan. */
export function buildSearchIndex(exercises: Exercise[]): SearchIndex {
  return exercises.map((exercise) => {
    const name = normalizeText(exercise.name)
    const aliases = (exercise.aliases ?? []).map(normalizeText)
    const muscles = [exercise.primaryMuscle, exercise.secondaryMuscle ?? ''].map(normalizeText)
    return { exercise, name, aliases, haystack: [name, ...aliases, ...muscles].join(' | ') }
  })
}

/**
 * Case- and accent-insensitive partial search.
 * Every word in the query must appear somewhere (name, alias or muscle).
 * Name matches rank above alias matches, which rank above muscle-only matches.
 */
export function searchExercises(index: SearchIndex, query: string): Exercise[] {
  const q = normalizeText(query)
  if (!q) return []
  const tokens = q.split(' ')

  const results: { exercise: Exercise; score: number }[] = []
  for (const entry of index) {
    if (!tokens.every((token) => entry.haystack.includes(token))) continue

    let score = 4
    if (entry.name.startsWith(q)) score = 0
    else if (entry.name.split(' ').some((word) => word.startsWith(q))) score = 1
    else if (entry.name.includes(q)) score = 2
    else if (entry.aliases.some((alias) => alias.includes(q))) score = 3

    results.push({ exercise: entry.exercise, score })
  }

  return results
    .sort((a, b) => a.score - b.score || a.exercise.name.localeCompare(b.exercise.name, 'es'))
    .map((r) => r.exercise)
}
