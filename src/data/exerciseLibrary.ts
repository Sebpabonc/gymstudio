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
  ,
  {
    id: 'bb-bench-press',
    name: 'BB Bench Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'bb-bent-over-reverse-grip-rows',
    name: 'BB Bent Over Reverse Grip Rows',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'bb-press',
    name: 'BB Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'bb-rdl',
    name: 'BB RDL',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'cable-rope-tricep-extensions',
    name: 'Cable Rope Tricep Extensions',
    primaryMuscle: 'Triceps',
    tips: [
      'Mantén los codos estables y no los dejes abrir.',
      'Controla la fase excéntrica para mayor tensión muscular.'
    ],
  },
  {
    id: 'cable-straight-arms-pull-downs',
    name: 'Cable Straight Arms Pull Downs',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'calf',
    name: 'Calf',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'chin',
    name: 'Chin',
    primaryMuscle: 'General',
    tips: [
      'Mantén postura neutra y core activo.',
      'Controla el movimiento; evita balanceos y uso de impulso.'
    ],
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'close-grip-decline-press',
    name: 'Close Grip Decline Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'close-grip-dips',
    name: 'Close Grip Dips',
    primaryMuscle: 'Triceps',
    tips: [
      'Mantén los codos estables y no los dejes abrir.',
      'Controla la fase excéntrica para mayor tensión muscular.'
    ],
  },
  {
    id: 'close-grip-press',
    name: 'Close Grip Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'db-60-y-raises',
    name: 'Db 60 Y Raises',
    primaryMuscle: 'General',
    tips: [
      'Mantén postura neutra y core activo.',
      'Controla el movimiento; evita balanceos y uso de impulso.'
    ],
  },
  {
    id: 'db-curls-offset-grip',
    name: 'Db Curls Offset Grip',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'db-oh-press-neutral-grip',
    name: 'Db OH Press Neutral Grip',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'db-press-neutral-grip',
    name: 'Db Press Neutral Grip',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'db-pull-overs',
    name: 'Db Pull Overs',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'db-spider-hammer-curls',
    name: 'Db Spider Hammer Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'db-walking-lunges-long-steps',
    name: 'Db Walking Lunges Long Steps',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'decline-bb-press',
    name: 'Decline BB Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'ez-bb-preacher-curls',
    name: 'EZ BB Preacher Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'ffe-db-split-squats',
    name: 'FFE Db Split Squats',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'hack-squat-machine',
    name: 'Hack Squat Machine',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'hack-squats',
    name: 'Hack Squats',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'hammer-curls',
    name: 'Hammer Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'hanging-leg-raises-weighted',
    name: 'Hanging Leg Raises Weighted',
    primaryMuscle: 'Core',
    tips: [
      'Activa el core y evita arquear la espalda.',
      'Respira y estabiliza antes de iniciar cada repetición.'
    ],
  },
  {
    id: 'heels-elevated-hb-squats',
    name: 'Heels Elevated HB Squats',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'hor-back-extensions-glutes-dominant',
    name: 'Hor. Back Extensions Glutes Dominant',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'lateral-raises-machine',
    name: 'Lateral Raises Machine',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'leg-extensions-toes-dorsiflexed-neutral',
    name: 'Leg Extensions Toes Dorsiflexed Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'leg-extensions-toes-dorsiflexed-out',
    name: 'Leg Extensions Toes Dorsiflexed Out',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'leg-press-calf-raises-neutral',
    name: 'Leg Press Calf Raises Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'leg-press-calf-raises-toes-neutral',
    name: 'Leg Press Calf Raises Toes Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'leg-press-quad-dominant',
    name: 'Leg Press Quad Dominant',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'low-cable-ropes-curls',
    name: 'Low Cable Ropes Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'neutral-grip-db-oh-press',
    name: 'Neutral Grip Db OH Press',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'neutral-grip-pin-loaded-shoulder-press',
    name: 'Neutral Grip Pin Loaded Shoulder Press',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'neutral-grip-supp-rows',
    name: 'Neutral Grip Supp. Rows',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'neutral-grip-weighted-chin-ups',
    name: 'Neutral Grip Weighted Chin Ups',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'plate-loaded-chest-press-wide-grip',
    name: 'Plate Loaded Chest Press Wide Grip',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'plate-loaded-wide-grip-shoulder-press-machine',
    name: 'Plate Loaded Wide Grip Shoulder Press Machine',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'prone-leg-curl-toes-dorsiflexed-neutral',
    name: 'Prone Leg Curl Toes Dorsiflexed Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'prone-leg-curls-toes-dorsiflexed-neutral',
    name: 'Prone Leg Curls Toes Dorsiflexed Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'reverse-grip-chin-up-weighted',
    name: 'Reverse Grip Chin Up Weighted',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'reverse-grip-lats-machine',
    name: 'Reverse Grip Lats Machine',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'rope-low-cable-oh-tricep-extensions',
    name: 'Rope Low Cable OH Tricep Extensions',
    primaryMuscle: 'Triceps',
    tips: [
      'Mantén los codos estables y no los dejes abrir.',
      'Controla la fase excéntrica para mayor tensión muscular.'
    ],
  },
  {
    id: 'seated-leg-curl-toes-dorsiflexed-neutral',
    name: 'Seated Leg Curl Toes Dorsiflexed Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'seated-leg-curls-toes-dorsiflexed-neutral',
    name: 'Seated Leg Curls Toes Dorsiflexed Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'seated-leg-curls-toes-dorsiflexed-out',
    name: 'Seated Leg Curls Toes Dorsiflexed Out',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'single-db-preacher-curls',
    name: 'Single Db Preacher Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'single-hand-cable-unilateral-rows',
    name: 'Single Hand Cable Unilateral Rows',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'standing-calf-raises-toes-neutral',
    name: 'Standing Calf Raises Toes Neutral',
    primaryMuscle: 'Legs',
    tips: [
      'Mantén el core activo y la mirada al frente.',
      'Empuja con los talones y controla la profundidad.'
    ],
  },
  {
    id: 'standing-db-lateral-raises',
    name: 'Standing Db Lateral Raises',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'standing-db-offset-grip-curls',
    name: 'Standing Db Offset Grip Curls',
    primaryMuscle: 'Biceps',
    tips: [
      'Evita balancear el cuerpo; aísla el bíceps con control.',
      'Mantén el codo cerca del torso durante el curl.'
    ],
  },
  {
    id: 'straight-bb-straight-arms-pull-downs',
    name: 'Straight BB Straight Arms Pull Downs',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'unilateral-supp-rows-reverse-grip',
    name: 'Unilateral Supp. Rows Reverse Grip',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'v-bb-cable-tricep-extensions',
    name: 'V BB Cable Tricep Extensions',
    primaryMuscle: 'Triceps',
    tips: [
      'Mantén los codos estables y no los dejes abrir.',
      'Controla la fase excéntrica para mayor tensión muscular.'
    ],
  },
  {
    id: 'weighted-45-back-extensions',
    name: 'Weighted 45 Back Extensions',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'wide-grip-cable-chest-pulls',
    name: 'Wide Grip Cable Chest Pulls',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'wide-grip-cable-row',
    name: 'Wide Grip Cable Row',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  },
  {
    id: 'wide-grip-chest-press',
    name: 'Wide Grip Chest Press',
    primaryMuscle: 'Chest',
    tips: [
      'Mantén omóplatos retraídos y pecho alto.',
      'Controla la bajada y evita hiperextender los codos.'
    ],
  },
  {
    id: 'wide-grip-shoulder-press-machine',
    name: 'Wide Grip Shoulder Press Machine',
    primaryMuscle: 'Shoulders',
    tips: [
      'No eleves los hombros hacia las orejas; estabiliza el núcleo.',
      'Controla el recorrido y evita movimientos bruscos.'
    ],
  },
  {
    id: 'wide-grip-supp-seated-row',
    name: 'Wide Grip Supp. Seated Row',
    primaryMuscle: 'Back',
    tips: [
      'Tira con el pecho y evita redondear la zona lumbar.',
      'Siente la carga en la espalda, no solo en los brazos.'
    ],
  }
]
