import { useSyncExternalStore } from 'react'
import { createLocalStorageRepository } from './localStorageRepository'
import { WorkoutRepository } from './repository'

export const repository: WorkoutRepository = createLocalStorageRepository()

/** Re-renders the calling component whenever saved data changes. Returns a version number for memo deps. */
export function useRepositoryVersion(): number {
  return useSyncExternalStore(repository.subscribe, repository.getVersion)
}
