import { ProgressSet } from './types'
import { sessionE1RM, workingSets } from './utils'

export function epleyOneRepMax(weight: number, reps: number) {
  if (weight <= 0 || reps < 1) return null
  if (reps === 1) return weight
  return weight * (1 + reps / 30)
}

export function bestSetE1RM(sets: ProgressSet[]) {
  return sessionE1RM(sets)
}

export function getWorkingSets(sets: ProgressSet[]) {
  return workingSets(sets)
}
