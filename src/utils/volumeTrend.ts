import type { WorkoutEntry } from '../types'
import { workoutVolume } from './workoutSets'

export interface VolumePoint {
  date: string
  volume: number
}

/** Total volume (kg × reps, drops included) per session, oldest first, last `limit` sessions. */
export function volumeTrendPoints(entries: WorkoutEntry[], limit = 8): VolumePoint[] {
  return [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-limit)
    .map((entry) => ({ date: entry.date, volume: workoutVolume(entry.sets) }))
}

/** % change from the first to the last point; null with fewer than 2 points or a zero start. */
export function volumeTrendChange(points: VolumePoint[]): number | null {
  if (points.length < 2) return null
  const first = points[0].volume
  const last = points[points.length - 1].volume
  if (first <= 0) return null
  return Math.round(((last - first) / first) * 100)
}
