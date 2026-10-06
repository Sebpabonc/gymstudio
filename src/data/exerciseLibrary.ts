import { Exercise } from '../types'

export async function loadExerciseLibrary() {
  const [armsCore, back, chestShoulders, legsGlutes] = await Promise.all([
    import('../../docs/fitness/approved/catalogue-v2/arms-core.json'),
    import('../../docs/fitness/approved/catalogue-v2/back.json'),
    import('../../docs/fitness/approved/catalogue-v2/chest-shoulders.json'),
    import('../../docs/fitness/approved/catalogue-v2/legs-glutes.json'),
  ])
  const catalogue = [...armsCore.default, ...back.default, ...chestShoulders.default, ...legsGlutes.default]
  const exerciseLibrary: Exercise[] = catalogue.map((exercise) => ({
    id: exercise.id,
    name: exercise.name_en,
    nameEs: exercise.name_es || undefined,
    bodyRegion: exercise.body_region,
    primaryMuscles: exercise.primary_muscles,
    secondaryMuscles: exercise.secondary_muscles,
    equipment: exercise.equipment,
    movementPattern: exercise.movement_pattern,
    postureTips: exercise.posture_tips,
    squeezeCue: exercise.squeeze_cue,
    primaryMuscle: exercise.primary_muscles[0],
    secondaryMuscle: exercise.secondary_muscles[0],
    mechanic: exercise.mechanic as Exercise['mechanic'],
  }))
  const aliases = Object.fromEntries(
    catalogue.flatMap((exercise) => exercise.aliases.map((alias) => [alias, exercise.id]))
  ) as Record<string, string>

  return { exerciseLibrary, aliases }
}
