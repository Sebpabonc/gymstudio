import { app } from './sections/app'
import { workout } from './sections/workout'
import { progress } from './sections/progress'

export const en = {
  ...app.en,
  ...workout.en,
  ...progress.en,
}

export type TranslationKey = keyof typeof en
export type Dictionary = Record<TranslationKey, string>
