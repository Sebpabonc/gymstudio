import type { PlannedExercise } from '../types'

const INTRO_NOTE = 'Week 1: straight sets, 3-second lowering, 2-3 reps in reserve.'
const DELOAD_NOTE = 'Deload: same weights, half the sets, 3+ reps in reserve.'
const TECHNIQUE_NOTE = /\b(?:rest[\s-]?pause|myo[\s-]?reps?|partials?|top[\s-]?set)\b/i

function hasHeavyTopSet(exercise: PlannedExercise, week: number) {
  const firstRep = exercise.reps[0]?.match(/\d+/)?.[0]
  return exercise.technique === 'reverse-pyramid' &&
    exercise.reps.length > 1 &&
    firstRep !== undefined &&
    (week === 6 || Number(firstRep) <= 5)
}

export function prescriptionForWeek(
  exercise: PlannedExercise,
  week: number
): PlannedExercise & { weekNote?: string } {
  const prescription = { ...exercise, reps: [...exercise.reps] }
  if (week !== 1 && week !== 6) return prescription

  const isDeload = week === 6
  const weekNote = isDeload ? DELOAD_NOTE : INTRO_NOTE
  const removeTopSet = hasHeavyTopSet(exercise, week)
  let reps = [...exercise.reps]

  if (removeTopSet) {
    reps = isDeload
      ? reps.slice(1)
      : [reps[1], ...reps.slice(1)]
  }

  const removeIntensityTechnique = exercise.technique === 'drop-set'
  if (removeIntensityTechnique) {
    reps = reps.map((rep) => rep.split('+', 1)[0].trim())
  }
  if (isDeload) reps = reps.slice(0, Math.ceil(exercise.sets / 2))

  return {
    ...prescription,
    sets: isDeload ? Math.ceil(exercise.sets / 2) : exercise.sets,
    reps,
    technique: removeIntensityTechnique ? 'straight' : exercise.technique,
    ...(exercise.notes && TECHNIQUE_NOTE.test(exercise.notes) ? { notes: weekNote } : {}),
    weekNote,
  }
}
