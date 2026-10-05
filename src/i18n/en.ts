import { app } from './sections/app'
import { workout } from './sections/workout'
import { progress } from './sections/progress'
import { profile } from './sections/profile'

export const en = {
  ...app.en,
  ...workout.en,
  ...progress.en,
  ...profile.en,
}

export type TranslationKey = keyof typeof en
export type Dictionary = Record<TranslationKey, string>
