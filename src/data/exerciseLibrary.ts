import { Exercise } from '../types'

export const exerciseLibrary: Exercise[] = [
  {
    id: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    primaryMuscle: 'Chest',
    secondaryMuscle: 'Triceps',
    notes: 'Classic compound press for upper-body strength.',
    tips: [
      'Mantén la espalda ligeramente arqueada y los pies bien apoyados en el suelo.',
      'Los omóplatos deben estar retraídos y bajos durante la fase de empuje.',
      'Baja el peso controlando el recorrido sin dejar caer los codos.'
    ]
  },
  {
    id: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    primaryMuscle: 'Chest',
    secondaryMuscle: 'Shoulders',
    notes: 'Great for upper chest volume and control.',
    tips: [
      'Ajusta la incline para que la espalda quede pegada al banco sin elevar la cabeza.',
      'Los codos van en un ángulo de 30° a 45° para proteger hombros.',
      'Prensa con control y no permitas que los brazos se abran demasiado.'
    ]
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    primaryMuscle: 'Back',
    secondaryMuscle: 'Biceps',
    notes: 'Vertical pulling movement for back width.',
    tips: [
      'Mantén la espalda neutra y la barbilla ligeramente hacia abajo.',
      'Tira con el pecho hacia la barra sin encorvar la zona lumbar.',
      'Al subir, intenta llevar los codos hacia abajo y atrás, no solo hacia adelante.'
    ]
  },
  {
    id: 'seated-cable-row',
    name: 'Seated Cable Row',
    primaryMuscle: 'Back',
    secondaryMuscle: 'Mid-back',
    notes: 'A stable row for back thickness and posture.',
    tips: [
      'Mantén la espalda recta y el pecho elevado durante todo el movimiento.',
      'Trae la manija hacia el abdomen sin redondear la zona baja.',
      'No uses el impulso del cuerpo; controla la fase de retorno.'
    ]
  },
  {
    id: 'back-squat',
    name: 'Back Squat',
    primaryMuscle: 'Legs',
    secondaryMuscle: 'Glutes',
    notes: 'Main lower-body strength movement.',
    tips: [
      'Mantén la mirada al frente y la caja torácica elevada.',
      'Los pies deben estar firmes y la rodilla debe seguir la dirección del dedo del pie.',
      'No dejes que la espalda redondee en la bajada; empuja el piso con fuerza.'
    ]
  },
  {
    id: 'romanian-deadlift',
    name: 'Romanian Deadlift',
    primaryMuscle: 'Hamstrings',
    secondaryMuscle: 'Glutes',
    notes: 'Focus on hinge pattern and posterior chain.',
    tips: [
      'Mantén la espalda neutra y los hombros hacia abajo durante todo el movimiento.',
      'Los rodillas deben estar ligeramente flexionadas y no bloqueadas.',
      'Haz la bajada con el torso casi paralelo al suelo y sin redondear la zona lumbar.'
    ]
  },
  {
    id: 'dumbbell-shoulder-press',
    name: 'Dumbbell Shoulder Press',
    primaryMuscle: 'Shoulders',
    secondaryMuscle: 'Triceps',
    notes: 'Great for overhead pressing strength.',
    tips: [
      'Mantén la cintura y el core activados para evitar balanceo.',
      'Los codos no deben caer hacia fuera; guárdalos ligeramente adelantados.',
      'Empuja hacia arriba sin archar la espalda ni levantar la pelvis.'
    ]
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    primaryMuscle: 'Hamstrings',
    secondaryMuscle: 'Calves',
    notes: 'Isolation for hamstrings and knee flexion.',
    tips: [
      'Mantén la pelvis estable y la espalda pegada al asiento.',
      'Haz la flexión para que el movimiento venga del talón y no del tronco.',
      'No levantes la cadera ni hiperextensiones la espalda en la parte baja.'
    ]
  }
]
