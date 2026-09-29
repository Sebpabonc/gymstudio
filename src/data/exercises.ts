import { Exercise } from '../domain/types'

/**
 * TEMPORARY test library.
 *
 * To load the full list later, replace this array (or import it from a JSON
 * file) keeping the same shape. Rules:
 *  - `id` must be unique and must never change once you have logged it,
 *    because workout history references exercises by id.
 *  - `primaryMuscle` / `secondaryMuscle` must be one of the MuscleGroup values.
 *  - `aliases` are optional extra search terms (English names, gym slang…).
 */
export const exerciseLibrary: Exercise[] = [
  { id: 'barbell-bench-press', name: 'Press de banca con barra', primaryMuscle: 'Pecho', secondaryMuscle: 'Tríceps', aliases: ['bench press', 'press banca'] },
  { id: 'incline-dumbbell-press', name: 'Press inclinado con mancuernas', primaryMuscle: 'Pecho', secondaryMuscle: 'Hombros', aliases: ['incline db press', 'incline dumbbell press'] },
  { id: 'lat-pulldown', name: 'Jalón al pecho', primaryMuscle: 'Espalda', secondaryMuscle: 'Bíceps', aliases: ['lat pulldown', 'polea al pecho'] },
  { id: 'seated-cable-row', name: 'Remo sentado en polea', primaryMuscle: 'Espalda', secondaryMuscle: 'Bíceps', aliases: ['seated cable row', 'cable row'] },
  { id: 'barbell-row', name: 'Remo con barra', primaryMuscle: 'Espalda', secondaryMuscle: 'Bíceps', aliases: ['barbell row', 'bent over row'] },
  { id: 'pull-up', name: 'Dominadas', primaryMuscle: 'Espalda', secondaryMuscle: 'Bíceps', aliases: ['pull up', 'chin up'], notes: 'Peso = lastre añadido. Usa 0 si es solo peso corporal.' },
  { id: 'back-squat', name: 'Sentadilla con barra', primaryMuscle: 'Cuádriceps', secondaryMuscle: 'Glúteos', aliases: ['back squat', 'squat'] },
  { id: 'leg-press', name: 'Prensa de piernas', primaryMuscle: 'Cuádriceps', secondaryMuscle: 'Glúteos', aliases: ['leg press'] },
  { id: 'romanian-deadlift', name: 'Peso muerto rumano', primaryMuscle: 'Isquiotibiales', secondaryMuscle: 'Glúteos', aliases: ['romanian deadlift', 'rdl'] },
  { id: 'leg-curl', name: 'Curl femoral', primaryMuscle: 'Isquiotibiales', aliases: ['leg curl', 'hamstring curl'] },
  { id: 'hip-thrust', name: 'Hip thrust con barra', primaryMuscle: 'Glúteos', secondaryMuscle: 'Isquiotibiales', aliases: ['empuje de cadera'] },
  { id: 'calf-raise', name: 'Elevación de talones de pie', primaryMuscle: 'Pantorrillas', aliases: ['calf raise', 'gemelos'] },
  { id: 'dumbbell-shoulder-press', name: 'Press de hombro con mancuernas', primaryMuscle: 'Hombros', secondaryMuscle: 'Tríceps', aliases: ['shoulder press', 'press militar'] },
  { id: 'lateral-raise', name: 'Elevaciones laterales', primaryMuscle: 'Hombros', aliases: ['lateral raise'] },
  { id: 'barbell-curl', name: 'Curl de bíceps con barra', primaryMuscle: 'Bíceps', secondaryMuscle: 'Antebrazos', aliases: ['barbell curl', 'biceps curl'] },
  { id: 'triceps-pushdown', name: 'Extensión de tríceps en polea', primaryMuscle: 'Tríceps', aliases: ['triceps pushdown', 'pushdown'] },
]

const byId = new Map(exerciseLibrary.map((exercise) => [exercise.id, exercise]))

if (import.meta.env.DEV && byId.size !== exerciseLibrary.length) {
  console.error('[exercises] Duplicate exercise ids found in exerciseLibrary')
}

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id)
}
