import { Exercise, ExerciseTip } from '../types'
import { getMuscleSearchTermsEs, localizeMuscle } from '../i18n/muscles'
import { dictionaries } from '../i18n/translate'
import type { Language, TranslationKey } from '../i18n/translate'

export const ALL_BODY_REGIONS = 'All'

const bodyRegionOrder = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Glutes', 'Core']

const equipmentTranslationKeys: Record<string, TranslationKey> = {
  band: 'workout.swap.equipment.band',
  barbell: 'workout.swap.equipment.barbell',
  bodyweight: 'workout.swap.equipment.bodyweight',
  cable: 'exercises.equipment.cable',
  dumbbell: 'exercises.equipment.dumbbell',
  'ez-bar': 'exercises.equipment.ezBar',
  'hex-bar': 'workout.swap.equipment.hexBar',
  kettlebell: 'workout.swap.equipment.kettlebell',
  machine: 'workout.swap.equipment.machine',
  'plate-loaded': 'workout.swap.equipment.plateLoaded',
  'smith-machine': 'workout.swap.equipment.smithMachine',
  other: 'exercises.equipment.other',
}

export function equipmentLabel(equipment: string | undefined, language: Language = 'en') {
  const key = equipmentTranslationKeys[equipment ?? 'other']
  return key ? dictionaries[language][key] : equipment ?? dictionaries[language]['exercises.equipment.other']
}

const exerciseSearchAbbreviations: Record<string, string[]> = {
  rdl: ['romanian', 'deadlift'],
  sldl: ['stiff', 'leg', 'deadlift'],
  ohp: ['overhead', 'press'],
  db: ['dumbbell'],
  bb: ['barbell'],
  ez: ['ez', 'bar'],
  bss: ['bulgarian', 'split', 'squat'],
  lpd: ['lat', 'pulldown'],
}

function normalizeExerciseSearchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '')
}

function getExerciseSearchTerms(query: string) {
  return query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => normalizeExerciseSearchText(word))
    .filter(Boolean)
    .flatMap((word) => exerciseSearchAbbreviations[word] ?? [word])
}

function localizeBodyRegion(region: string | undefined, language: Language) {
  if (!region || language !== 'es') return region
  return dictionaries.es[`region.${region}` as TranslationKey] ?? region
}

export function getAvailableBodyRegions(exercises: Exercise[]) {
  const presentRegions = new Set(exercises.map((exercise) => exercise.bodyRegion).filter(Boolean))
  return [ALL_BODY_REGIONS, ...bodyRegionOrder.filter((region) => presentRegions.has(region))]
}

export function filterExercises(exercises: Exercise[], query: string, bodyRegion = ALL_BODY_REGIONS) {
  const searchTerms = getExerciseSearchTerms(query)
  const matchesAll = (values: Array<string | undefined>) => {
    const text = normalizeExerciseSearchText(values.filter(Boolean).join(' '))
    return searchTerms.every((term) => text.includes(term))
  }

  // Rank: name match first, then primary muscle / body region, then secondary-muscle-only matches.
  const ranked: Array<{ exercise: Exercise; tier: number }> = []
  for (const exercise of exercises) {
    if (bodyRegion !== ALL_BODY_REGIONS && exercise.bodyRegion !== bodyRegion) continue
    if (!searchTerms.length) {
      ranked.push({ exercise, tier: 0 })
      continue
    }

    const primary = exercise.primaryMuscles ?? [exercise.primaryMuscle]
    const secondary = exercise.secondaryMuscles ?? (exercise.secondaryMuscle ? [exercise.secondaryMuscle] : [])
    const nameValues = [
      exercise.name,
      exercise.nameEs,
      exercise.equipment,
      ...(exercise.equipment ? [equipmentLabel(exercise.equipment, 'en'), equipmentLabel(exercise.equipment, 'es')] : []),
    ]
    const primaryValues = [
      ...nameValues,
      ...primary,
      ...primary.flatMap(getMuscleSearchTermsEs),
      exercise.bodyRegion,
      localizeBodyRegion(exercise.bodyRegion, 'es'),
    ]
    const allValues = [...primaryValues, ...secondary, ...secondary.flatMap(getMuscleSearchTermsEs)]

    if (matchesAll(nameValues)) ranked.push({ exercise, tier: 0 })
    else if (matchesAll(primaryValues)) ranked.push({ exercise, tier: 1 })
    else if (matchesAll(allValues)) ranked.push({ exercise, tier: 2 })
  }

  return ranked
    .map((item, index) => ({ ...item, index }))
    .sort((a, b) => a.tier - b.tier || a.index - b.index)
    .map((item) => item.exercise)
}

export function getExerciseSubtitle(exercise: Exercise, language: Language = 'en') {
  const primaryMuscles = exercise.primaryMuscles ?? [exercise.primaryMuscle]
  const additionalMuscles = primaryMuscles.filter(
    (muscle) => muscle.trim().toLowerCase() !== exercise.bodyRegion?.trim().toLowerCase()
  )
  return [
    localizeBodyRegion(exercise.bodyRegion, language),
    ...additionalMuscles.map((muscle) => localizeMuscle(muscle, language)),
  ]
    .filter(Boolean)
    .join(' · ')
}

export function getExerciseResultSubtitle(exercise: Exercise, language: Language = 'en') {
  const primaryMuscle = exercise.primaryMuscles?.[0] || exercise.primaryMuscle
  return [
    localizeBodyRegion(localizeMuscle(primaryMuscle, language), language),
    equipmentLabel(exercise.equipment, language),
  ].filter(Boolean).join(' · ')
}

export function getExerciseTips(exercise: Exercise): Array<string | ExerciseTip> {
  return exercise.postureTips !== undefined ? exercise.postureTips : exercise.tips ?? []
}
