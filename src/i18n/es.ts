import { app } from './sections/app'
import { workout } from './sections/workout'
import { progress } from './sections/progress'
import type { Dictionary } from './en'

export const es: Dictionary = {
  ...app.es,
  ...workout.es,
  ...progress.es,
}
