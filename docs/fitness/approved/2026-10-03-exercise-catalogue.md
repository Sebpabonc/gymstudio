---
title: Catálogo canónico de ejercicios (fuente única de verdad)
status: approved         # draft | approved | rejected
author: pt-fitness-expert
created: 2026-10-03
approved_by: Sebas (preguntas 1–2); 3–10 delegadas por Sebas a la recomendación del PT/Tech Lead
approved_on: 2026-10-03
exercises: [barbell-bench-press, incline-barbell-bench-press, decline-bb-press, incline-dumbbell-press, db-press-neutral-grip, close-grip-bench-press, close-grip-decline-press, plate-loaded-chest-press-wide-grip, wide-grip-chest-press, mid-cable-fly, high-cable-fly, decline-dumbbell-fly, close-grip-dips, dumbbell-shoulder-press, db-oh-press-neutral-grip, neutral-grip-pin-loaded-shoulder-press, wide-grip-shoulder-press-machine, plate-loaded-wide-grip-shoulder-press-machine, lateral-raises-machine, standing-db-lateral-raises, db-60-y-raises, lat-pulldown, neutral-grip-lat-pulldown, single-arm-lat-pulldown, reverse-grip-lats-machine, neutral-grip-weighted-chin-ups, reverse-grip-chin-up-weighted, seated-cable-row, wide-grip-cable-row, wide-grip-supp-seated-row, neutral-grip-supp-rows, unilateral-supp-rows-reverse-grip, single-hand-cable-unilateral-rows, bb-bent-over-reverse-grip-rows, wide-grip-cable-chest-pulls, cable-straight-arms-pull-downs, db-pull-overs, romanian-deadlift, hor-back-extensions-glutes-dominant, weighted-45-back-extensions, back-squat, heels-elevated-hb-squats, hack-squat-machine, leg-press-quad-dominant, db-walking-lunges-long-steps, ffe-db-split-squats, leg-extensions-toes-dorsiflexed-neutral, prone-leg-curl-toes-dorsiflexed-neutral, seated-leg-curl-toes-dorsiflexed-neutral, leg-press-calf-raises-toes-neutral, standing-calf-raises-toes-neutral, ez-bb-preacher-curls, single-db-preacher-curls, hammer-curls, db-spider-hammer-curls, db-curls-offset-grip, standing-db-offset-grip-curls, standing-dumbbell-curl, low-cable-ropes-curls, cable-rope-tricep-extensions, v-bb-cable-tricep-extensions, rope-low-cable-oh-tricep-extensions, hanging-leg-raises-weighted, v-up]
---

## Registro de aprobación (2026-10-03)

- **1. Números = grados de inclinación:** Sí (Sebas).
- **2. "30/45 BB (Bench) Press" = press inclinado con barra:** Sí (Sebas).
- **3–10:** Sebas delegó: *"aprueba basado en lo que mejor creas; más adelante se cambiará toda la lista"*.
  Se adopta la propuesta tal como está escrita en las tablas: 3 → banco inclinado;
  4 → barra hexagonal; 5 → tirón horizontal (tipo remo); 6 → máquina con apoyo de pecho;
  7 → máquinas separadas; 8 → posición de pies como modificador; 9 → Sí; 10 → barra libre.
- Las marcas ⚠️ REVISAR quedan como notas para la futura revisión completa del catálogo.

## Resumen

Propuesta de un catálogo único de ejercicios que reemplaza las tres listas actuales
(`exerciseLibrary.ts`, el plan importado del Excel en `workoutPlan.ts` y `sixDayProgram`
en `WorkoutPlan.tsx`). Cada plan y cada serie registrada apuntarían a un `id` de este
catálogo; todo lo que es "cómo se hace hoy" (ángulo, técnica, carga) pasa a ser un
**modificador del plan**, no parte del nombre.

| Métrica | Valor |
|---|---|
| Ejercicios canónicos | **64** (56 reutilizan un id existente + 8 `NEW`) |
| Ids existentes de la librería fusionados como alias | **14** de 70 (más el alias legado `bb-bench-press`, ya migrado en #4) |
| — duplicados reales (mismo ejercicio, otro nombre) | 8: `bb-rdl`, `hack-squats`, `neutral-grip-db-oh-press`, `prone-leg-curls-toes-dorsiflexed-neutral`, `seated-leg-curls-toes-dorsiflexed-neutral`, `leg-press-calf-raises-neutral`, `straight-bb-straight-arms-pull-downs`, `close-grip-press` ⚠️ |
| — nombres vagos asignados a un ejercicio | 3: `calf`, `chin`, `leg-curl` ⚠️ |
| — variantes que pasan a modificador | 3: `bb-press` (ángulo) ⚠️, `leg-extensions-toes-dorsiflexed-out`, `seated-leg-curls-toes-dorsiflexed-out` (posición de pies) ⚠️ |
| Ejercicios nuevos (`NEW`) | **8** |
| Nombres distintos mapeados (3 fuentes) | 148 (librería 70 · plan 64 · six-day 14) |
| Preguntas para Sebas | **10** |

**Reglas aplicadas**

- **Ejercicio distinto** cuando cambia de forma relevante la biomecánica o el músculo objetivo:
  plano vs inclinado vs declinado, cambio de agarre que cambia el énfasis (supino/neutro/ancho),
  máquina vs peso libre, máquina de discos vs máquina de pines, unilateral vs bilateral.
- **Modificador de plan** (se guarda en la prescripción o en la serie, no en el catálogo):
  ángulo específico en grados (30°, 45°, 60°, 75°), técnica de serie (drop sets, etc.),
  carga añadida ("Weighted" = lastre), tempo, posición de pies (neutral / hacia afuera),
  longitud de zancada, accesorio intercambiable cuando no cambia el ejercicio.
- **Ids existentes nunca se renombran.** Algunos ids conservan palabras que ahora son
  modificadores (p. ej. `neutral-grip-weighted-chin-ups`, `db-60-y-raises`,
  `leg-press-quad-dominant`); el `id` se mantiene por el historial y el **nombre** canónico
  queda limpio.
- **Error de importación detectado:** el `standardizeExerciseName` de `workoutPlan.ts`
  convierte "30 BB Bench Press" en "30 lb Barbell Bench Press" (y lo mismo con 45/60/75).
  Esos números casi seguro son **grados del banco/asiento**, no libras ⚠️ REVISAR (pregunta 1).
- Músculos: conjunto fijo en inglés (Chest, Lats, Upper Back, Front Delts, Side Delts,
  Rear Delts, Biceps, Triceps, Forearms, Quads, Hamstrings, Glutes, Calves, Core, Lower Back).
  Se proponen como listas (la app hoy solo guarda un `secondaryMuscle`; eso lo decide el Tech Lead).

## Catálogo propuesto

### Pecho y empuje horizontal

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `barbell-bench-press` | Barbell Bench Press | Press de banca con barra | Chest | Triceps, Front Delts | barbell | push horizontal | `bb-bench-press` (legado) |
| `incline-barbell-bench-press` **NEW** | Incline Barbell Bench Press | Press inclinado con barra | Chest | Front Delts, Triceps | barbell | push horizontal | `bb-press` ⚠️ REVISAR |
| `decline-bb-press` | Decline Barbell Bench Press | Press declinado con barra | Chest | Triceps, Front Delts | barbell | push horizontal | — |
| `incline-dumbbell-press` | Incline Dumbbell Press | Press inclinado con mancuernas | Chest | Front Delts, Triceps | dumbbell | push horizontal | — |
| `db-press-neutral-grip` | Incline Dumbbell Press (Neutral Grip) | Press inclinado con mancuernas (agarre neutro) | Chest | Front Delts, Triceps | dumbbell | push horizontal | — |
| `close-grip-bench-press` | Close-Grip Bench Press | Press de banca agarre cerrado | Triceps | Chest, Front Delts | barbell | push horizontal | `close-grip-press` ⚠️ REVISAR |
| `close-grip-decline-press` | Close-Grip Decline Bench Press | Press declinado agarre cerrado | Triceps | Chest, Front Delts | barbell ⚠️ REVISAR (¿Smith?) | push horizontal | — |
| `plate-loaded-chest-press-wide-grip` | Plate-Loaded Chest Press (Wide Grip) | Press de pecho en máquina de discos (agarre ancho) | Chest | Front Delts, Triceps | plate-loaded | push horizontal | — |
| `wide-grip-chest-press` | Machine Chest Press (Wide Grip) | Press de pecho en máquina (agarre ancho) | Chest | Front Delts, Triceps | machine ⚠️ REVISAR | push horizontal | — (posible fusión, pregunta 7) |
| `mid-cable-fly` **NEW** | Cable Fly (Mid Height) | Aperturas en polea a media altura | Chest | Front Delts | cable | isolation | — |
| `high-cable-fly` **NEW** | High-to-Low Cable Fly | Aperturas en polea alta (de arriba hacia abajo) | Chest | Front Delts | cable | isolation | — |
| `decline-dumbbell-fly` **NEW** | Decline Dumbbell Fly | Aperturas declinadas con mancuernas | Chest | Front Delts | dumbbell | isolation | — |
| `close-grip-dips` | Close-Grip Dip | Fondos en paralelas agarre cerrado | Triceps | Chest, Front Delts | bodyweight | push vertical | — |

### Hombros

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `dumbbell-shoulder-press` | Seated Dumbbell Shoulder Press | Press de hombros con mancuernas | Front Delts | Side Delts, Triceps | dumbbell | push vertical | — |
| `db-oh-press-neutral-grip` | Dumbbell Overhead Press (Neutral Grip) | Press de hombros con mancuernas (agarre neutro) | Front Delts | Side Delts, Triceps | dumbbell | push vertical | `neutral-grip-db-oh-press` |
| `neutral-grip-pin-loaded-shoulder-press` | Shoulder Press Machine (Neutral Grip) | Press de hombros en máquina de pines (agarre neutro) | Front Delts | Side Delts, Triceps | machine | push vertical | — |
| `wide-grip-shoulder-press-machine` | Shoulder Press Machine (Wide Grip) | Press de hombros en máquina (agarre ancho) | Front Delts | Side Delts, Triceps | machine ⚠️ REVISAR | push vertical | — (posible fusión, pregunta 7) |
| `plate-loaded-wide-grip-shoulder-press-machine` | Plate-Loaded Shoulder Press (Wide Grip) | Press de hombros en máquina de discos (agarre ancho) | Front Delts | Side Delts, Triceps | plate-loaded | push vertical | — |
| `lateral-raises-machine` | Machine Lateral Raise | Elevaciones laterales en máquina | Side Delts | — | machine | isolation | — |
| `standing-db-lateral-raises` | Dumbbell Lateral Raise | Elevaciones laterales con mancuernas | Side Delts | — | dumbbell | isolation | — |
| `db-60-y-raises` | Incline Dumbbell Y-Raise | Elevaciones en Y con mancuernas en banco inclinado | Side Delts | Rear Delts, Upper Back | dumbbell | isolation | — |

### Espalda

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `lat-pulldown` | Lat Pulldown (Wide Grip) | Jalón al pecho (agarre ancho) | Lats | Upper Back, Biceps | cable | pull vertical | — |
| `neutral-grip-lat-pulldown` **NEW** | Lat Pulldown (Neutral Grip) | Jalón al pecho (agarre neutro) | Lats | Upper Back, Biceps | cable | pull vertical | — |
| `single-arm-lat-pulldown` **NEW** | Single-Arm Lat Pulldown | Jalón a una mano | Lats | Upper Back, Biceps | cable | pull vertical | — |
| `reverse-grip-lats-machine` | Reverse-Grip Lat Pulldown Machine | Jalón en máquina (agarre supino) | Lats | Biceps, Upper Back | machine | pull vertical | — |
| `neutral-grip-weighted-chin-ups` | Neutral-Grip Pull-Up | Dominadas (agarre neutro) | Lats | Biceps, Upper Back | bodyweight | pull vertical | — |
| `reverse-grip-chin-up-weighted` | Chin-Up (Underhand Grip) | Dominadas (agarre supino) | Lats | Biceps, Upper Back | bodyweight | pull vertical | `chin` ⚠️ REVISAR |
| `seated-cable-row` | Seated Cable Row | Remo sentado en polea | Upper Back | Lats, Biceps, Rear Delts | cable | pull horizontal | — |
| `wide-grip-cable-row` | Seated Cable Row (Wide Grip) | Remo sentado en polea (agarre ancho) | Upper Back | Rear Delts, Lats, Biceps | cable | pull horizontal | — |
| `wide-grip-supp-seated-row` | Chest-Supported Row (Wide Grip) | Remo con apoyo de pecho (agarre ancho) | Upper Back | Rear Delts, Lats, Biceps | machine ⚠️ REVISAR | pull horizontal | — |
| `neutral-grip-supp-rows` | Chest-Supported Row (Neutral Grip) | Remo con apoyo de pecho (agarre neutro) | Upper Back | Lats, Biceps | machine ⚠️ REVISAR | pull horizontal | — |
| `unilateral-supp-rows-reverse-grip` | Single-Arm Chest-Supported Row (Underhand Grip) | Remo a una mano con apoyo de pecho (agarre supino) | Lats | Upper Back, Biceps | machine ⚠️ REVISAR | pull horizontal | — |
| `single-hand-cable-unilateral-rows` | Single-Arm Cable Row | Remo a una mano en polea | Lats | Upper Back, Biceps | cable | pull horizontal | — |
| `bb-bent-over-reverse-grip-rows` | Reverse-Grip Barbell Bent-Over Row | Remo inclinado con barra (agarre supino) | Lats | Upper Back, Biceps, Lower Back | barbell | pull horizontal | — |
| `wide-grip-cable-chest-pulls` | Wide-Grip Cable Pull to Chest ⚠️ REVISAR | Jalón en polea al pecho (agarre ancho) ⚠️ REVISAR | Upper Back | Rear Delts, Lats, Biceps | cable | pull horizontal ⚠️ REVISAR | — |
| `cable-straight-arms-pull-downs` | Straight-Arm Cable Pulldown | Jalón con brazos rectos en polea | Lats | Triceps | cable | isolation | `straight-bb-straight-arms-pull-downs` |
| `db-pull-overs` | Dumbbell Pullover | Pullover con mancuerna | Lats | Chest, Triceps | dumbbell | isolation | — |

### Bisagra de cadera / cadena posterior

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `romanian-deadlift` | Romanian Deadlift (Barbell) | Peso muerto rumano con barra | Hamstrings | Glutes, Lower Back | barbell | hinge | `bb-rdl` |
| `hor-back-extensions-glutes-dominant` | Horizontal Back Extension (Glute Focus) | Hiperextensión horizontal (enfoque glúteo) | Glutes | Hamstrings, Lower Back | bodyweight | hinge | — |
| `weighted-45-back-extensions` | 45° Back Extension | Hiperextensión a 45° | Lower Back | Glutes, Hamstrings | bodyweight | hinge | — |

Nota: aquí "45°" sí forma parte del nombre porque el banco de hiperextensión a 45° es un
equipo estándar distinto del horizontal (90°). "Weighted" es lastre → modificador.

### Piernas

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `back-squat` | Barbell Back Squat | Sentadilla trasera con barra | Quads | Glutes, Lower Back | barbell | squat | — |
| `heels-elevated-hb-squats` | Heels-Elevated Squat ⚠️ REVISAR (High-Bar o Hex Bar) | Sentadilla con talones elevados | Quads | Glutes | barbell ⚠️ REVISAR (o hex-bar) | squat | — |
| `hack-squat-machine` | Hack Squat (Machine) | Sentadilla hack en máquina | Quads | Glutes | plate-loaded | squat | `hack-squats` |
| `leg-press-quad-dominant` | Leg Press | Prensa de piernas | Quads | Glutes | plate-loaded | squat | — |
| `db-walking-lunges-long-steps` | Dumbbell Walking Lunge | Zancadas caminando con mancuernas | Quads | Glutes, Hamstrings | dumbbell | lunge | — |
| `ffe-db-split-squats` | Front-Foot-Elevated Dumbbell Split Squat | Sentadilla dividida con pie delantero elevado (mancuernas) | Quads | Glutes | dumbbell | lunge | — |
| `leg-extensions-toes-dorsiflexed-neutral` | Leg Extension | Extensión de cuádriceps en máquina | Quads | — | machine | isolation | `leg-extensions-toes-dorsiflexed-out` ⚠️ REVISAR |
| `prone-leg-curl-toes-dorsiflexed-neutral` | Lying Leg Curl | Curl femoral acostado | Hamstrings | Calves | machine | isolation | `prone-leg-curls-toes-dorsiflexed-neutral`, `leg-curl` ⚠️ REVISAR |
| `seated-leg-curl-toes-dorsiflexed-neutral` | Seated Leg Curl | Curl femoral sentado | Hamstrings | Calves | machine | isolation | `seated-leg-curls-toes-dorsiflexed-neutral`, `seated-leg-curls-toes-dorsiflexed-out` ⚠️ REVISAR |
| `leg-press-calf-raises-toes-neutral` | Leg Press Calf Raise | Elevación de talones en prensa | Calves | — | plate-loaded | isolation | `leg-press-calf-raises-neutral`, `calf` ⚠️ REVISAR |
| `standing-calf-raises-toes-neutral` | Standing Calf Raise | Elevación de talones de pie | Calves | — | machine | isolation | — |

Notas: "Quad Dominant" (pies bajos en la plataforma), "Toes Dorsiflexed Neutral/Out"
(posición de pies), "Long Steps" (zancada larga) y "45" de la prensa pasan a modificadores.

### Brazos

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `ez-bb-preacher-curls` | EZ-Bar Preacher Curl | Curl predicador con barra Z | Biceps | Forearms | ez-bar | isolation | — |
| `single-db-preacher-curls` | Single-Arm Dumbbell Preacher Curl | Curl predicador a una mano con mancuerna | Biceps | Forearms | dumbbell | isolation | — |
| `hammer-curls` | Dumbbell Hammer Curl | Curl martillo con mancuernas | Biceps | Forearms | dumbbell | isolation | — |
| `db-spider-hammer-curls` | Spider Hammer Curl | Curl martillo araña (boca abajo en banco inclinado) | Biceps | Forearms | dumbbell | isolation | — |
| `db-curls-offset-grip` | Incline Dumbbell Curl (Offset Grip) ⚠️ REVISAR | Curl inclinado con mancuernas (agarre descentrado) | Biceps | Forearms | dumbbell | isolation | — |
| `standing-db-offset-grip-curls` | Standing Dumbbell Curl (Offset Grip) | Curl de pie con mancuernas (agarre descentrado) | Biceps | Forearms | dumbbell | isolation | — |
| `standing-dumbbell-curl` **NEW** | Standing Dumbbell Curl | Curl de pie con mancuernas | Biceps | Forearms | dumbbell | isolation | — |
| `low-cable-ropes-curls` | Cable Rope Hammer Curl | Curl martillo en polea baja con cuerda | Biceps | Forearms | cable | isolation | — |
| `cable-rope-tricep-extensions` | Cable Rope Triceps Pushdown | Extensión de tríceps en polea con cuerda | Triceps | — | cable | isolation | — |
| `v-bb-cable-tricep-extensions` | V-Bar Cable Triceps Pushdown | Extensión de tríceps en polea con barra V | Triceps | — | cable | isolation | — |
| `rope-low-cable-oh-tricep-extensions` | Overhead Cable Triceps Extension (Rope) | Extensión de tríceps sobre la cabeza en polea con cuerda | Triceps | — | cable | isolation | — |

### Core

| id | name (EN) | nombre (ES) | primary muscle | secondary muscles | equipment | movement pattern | aliases (old ids) |
|---|---|---|---|---|---|---|---|
| `hanging-leg-raises-weighted` | Hanging Leg Raise | Elevación de piernas colgado | Core | — | bodyweight | core | — |
| `v-up` **NEW** | V-Up | Abdominales en V (V-ups) | Core | — | bodyweight | core | — |

## Mapeo de nombres existentes

Leyenda de modificadores: **ángulo** (grados del banco/asiento/máquina), **técnica**
(drop sets…), **carga** (lastre/peso añadido), **pies** (posición de los pies),
**paso** (longitud de zancada). Los nombres del plan se listan tal como están en
`rawWorkoutPhases` / `workoutExercises` (antes de `standardizeExerciseName`).

### Fuente: library (`rawExerciseLibrary`, 70 ids)

| source | original name | → canonical id | modifiers | confidence |
|---|---|---|---|---|
| library | Barbell Bench Press (`barbell-bench-press`) | `barbell-bench-press` | — | alta |
| library | Incline Dumbbell Press (`incline-dumbbell-press`) | `incline-dumbbell-press` | — | alta |
| library | Lat Pulldown (`lat-pulldown`) | `lat-pulldown` | — | alta |
| library | Seated Cable Row (`seated-cable-row`) | `seated-cable-row` | — | alta |
| library | Back Squat (`back-squat`) | `back-squat` | — | alta |
| library | Romanian Deadlift (`romanian-deadlift`) | `romanian-deadlift` | — | alta |
| library | Dumbbell Shoulder Press (`dumbbell-shoulder-press`) | `dumbbell-shoulder-press` | — | alta |
| library | Leg Curl (`leg-curl`) | `prone-leg-curl-toes-dorsiflexed-neutral` | — | baja ⚠️ REVISAR |
| library | BB Bent Over Reverse Grip Rows | `bb-bent-over-reverse-grip-rows` | — | alta |
| library | BB Press (`bb-press`) | `incline-barbell-bench-press` | ángulo (venía de "45 BB Press") ⚠️ | media |
| library | BB RDL (`bb-rdl`) | `romanian-deadlift` | — | alta |
| library | Cable Rope Tricep Extensions | `cable-rope-tricep-extensions` | — | alta |
| library | Cable Straight Arms Pull Downs | `cable-straight-arms-pull-downs` | — | alta |
| library | Calf (`calf`) | `leg-press-calf-raises-toes-neutral` | — | baja ⚠️ REVISAR |
| library | Chin (`chin`) | `reverse-grip-chin-up-weighted` | — | baja ⚠️ REVISAR |
| library | Close Grip Bench Press | `close-grip-bench-press` | — | alta |
| library | Close Grip Decline Press | `close-grip-decline-press` | — | alta |
| library | Close Grip Dips | `close-grip-dips` | — | alta |
| library | Close Grip Press (`close-grip-press`) | `close-grip-bench-press` | — | media ⚠️ REVISAR |
| library | Db 60 Y Raises | `db-60-y-raises` | ángulo 60° ⚠️ | alta |
| library | Db Curls Offset Grip | `db-curls-offset-grip` | (venía de "60 Db Curls…": ángulo 60° ⚠️) | media |
| library | Db OH Press Neutral Grip | `db-oh-press-neutral-grip` | — | alta |
| library | Db Press Neutral Grip | `db-press-neutral-grip` | — | alta |
| library | Db Pull Overs | `db-pull-overs` | — | alta |
| library | Db Spider Hammer Curls | `db-spider-hammer-curls` | — | alta |
| library | Db Walking Lunges Long Steps | `db-walking-lunges-long-steps` | paso: largo | alta |
| library | Decline BB Press | `decline-bb-press` | — | alta |
| library | EZ BB Preacher Curls | `ez-bb-preacher-curls` | — | alta |
| library | FFE Db Split Squats | `ffe-db-split-squats` | — | alta |
| library | Hack Squat Machine | `hack-squat-machine` | — | alta |
| library | Hack Squats (`hack-squats`) | `hack-squat-machine` | — | alta |
| library | Hammer Curls | `hammer-curls` | (venía de "45 Hammer Curls": ángulo 45° ⚠️) | alta |
| library | Hanging Leg Raises Weighted | `hanging-leg-raises-weighted` | carga: lastre | alta |
| library | Heels Elevated HB Squats | `heels-elevated-hb-squats` | — | media ⚠️ REVISAR |
| library | Hor. Back Extensions Glutes Dominant | `hor-back-extensions-glutes-dominant` | — | alta |
| library | Lateral Raises Machine | `lateral-raises-machine` | — | alta |
| library | Leg Extensions Toes Dorsiflexed Neutral | `leg-extensions-toes-dorsiflexed-neutral` | pies: neutros | alta |
| library | Leg Extensions Toes Dorsiflexed Out (`leg-extensions-toes-dorsiflexed-out`) | `leg-extensions-toes-dorsiflexed-neutral` | pies: hacia afuera | media ⚠️ REVISAR |
| library | Leg Press Calf Raises Neutral (`leg-press-calf-raises-neutral`) | `leg-press-calf-raises-toes-neutral` | pies: neutros | alta |
| library | Leg Press Calf Raises Toes Neutral | `leg-press-calf-raises-toes-neutral` | pies: neutros | alta |
| library | Leg Press Quad Dominant | `leg-press-quad-dominant` | pies: enfoque cuádriceps | alta |
| library | Low Cable Ropes Curls | `low-cable-ropes-curls` | — | alta |
| library | Neutral Grip Db OH Press (`neutral-grip-db-oh-press`) | `db-oh-press-neutral-grip` | — | alta |
| library | Neutral Grip Pin Loaded Shoulder Press | `neutral-grip-pin-loaded-shoulder-press` | — | alta |
| library | Neutral Grip Supp. Rows | `neutral-grip-supp-rows` | — | alta |
| library | Neutral Grip Weighted Chin Ups | `neutral-grip-weighted-chin-ups` | carga: lastre | alta |
| library | Plate Loaded Chest Press Wide Grip | `plate-loaded-chest-press-wide-grip` | — | alta |
| library | Plate Loaded Wide Grip Shoulder Press Machine | `plate-loaded-wide-grip-shoulder-press-machine` | — | alta |
| library | Prone Leg Curl Toes Dorsiflexed Neutral | `prone-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| library | Prone Leg Curls Toes Dorsiflexed Neutral (`prone-leg-curls-toes-dorsiflexed-neutral`) | `prone-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| library | Reverse Grip Chin Up Weighted | `reverse-grip-chin-up-weighted` | carga: lastre | alta |
| library | Reverse Grip Lats Machine | `reverse-grip-lats-machine` | — | alta |
| library | Rope Low Cable OH Tricep Extensions | `rope-low-cable-oh-tricep-extensions` | — | alta |
| library | Seated Leg Curl Toes Dorsiflexed Neutral | `seated-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| library | Seated Leg Curls Toes Dorsiflexed Neutral (`seated-leg-curls-toes-dorsiflexed-neutral`) | `seated-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| library | Seated Leg Curls Toes Dorsiflexed Out (`seated-leg-curls-toes-dorsiflexed-out`) | `seated-leg-curl-toes-dorsiflexed-neutral` | pies: hacia afuera | media ⚠️ REVISAR |
| library | Single Db Preacher Curls | `single-db-preacher-curls` | — | alta |
| library | Single Hand Cable Unilateral Rows | `single-hand-cable-unilateral-rows` | — | alta |
| library | Standing Calf Raises Toes Neutral | `standing-calf-raises-toes-neutral` | pies: neutros | alta |
| library | Standing Db Lateral Raises | `standing-db-lateral-raises` | — | alta |
| library | Standing Db Offset Grip Curls | `standing-db-offset-grip-curls` | — | alta |
| library | Straight BB Straight Arms Pull Downs (`straight-bb-straight-arms-pull-downs`) | `cable-straight-arms-pull-downs` | accesorio: barra recta | media |
| library | Unilateral Supp. Rows Reverse Grip | `unilateral-supp-rows-reverse-grip` | — | alta |
| library | V BB Cable Tricep Extensions | `v-bb-cable-tricep-extensions` | — | alta |
| library | Weighted 45 Back Extensions | `weighted-45-back-extensions` | carga: lastre | alta |
| library | Wide Grip Cable Chest Pulls | `wide-grip-cable-chest-pulls` | — | baja ⚠️ REVISAR |
| library | Wide Grip Cable Row | `wide-grip-cable-row` | — | alta |
| library | Wide Grip Chest Press | `wide-grip-chest-press` | — | media ⚠️ REVISAR |
| library | Wide Grip Shoulder Press Machine | `wide-grip-shoulder-press-machine` | — | alta |
| library | Wide Grip Supp. Seated Row | `wide-grip-supp-seated-row` | — | alta |

### Fuente: plan (`rawWorkoutPhases` + `workoutExercises`, 64 nombres distintos)

| source | original name | → canonical id | modifiers | confidence |
|---|---|---|---|---|
| plan | 30 BB Bench Press | `incline-barbell-bench-press` | ángulo 30° ⚠️ (hoy se muestra como "30 lb") | media ⚠️ REVISAR |
| plan | 30 Db Press Neutral Grip | `db-press-neutral-grip` | ángulo 30° (hoy "30 lb") | alta |
| plan | 45 BB Press | `incline-barbell-bench-press` | ángulo 45° ⚠️ (hoy "45 lb") | media ⚠️ REVISAR |
| plan | 45 Db Press Neutral Grip | `db-press-neutral-grip` | ángulo 45° (hoy "45 lb") | alta |
| plan | 45 Hammer Curls Drop Sets | `hammer-curls` | ángulo 45° ⚠️; técnica: drop sets | media ⚠️ REVISAR |
| plan | 45 Leg Press Quad Dominant | `leg-press-quad-dominant` | ángulo 45° (tipo de prensa); pies: enfoque cuádriceps | alta |
| plan | 60 Db Curls Offset Grip | `db-curls-offset-grip` | ángulo 60° ⚠️ (hoy "60 lb") | media ⚠️ REVISAR |
| plan | 60 Db OH Press Neutral Grip | `db-oh-press-neutral-grip` | ángulo 60° ⚠️ (hoy "60 lb") | media |
| plan | 60 Neutral Grip Db OH Press | `db-oh-press-neutral-grip` | ángulo 60° ⚠️ | media |
| plan | 75 Db OH Press Neutral Grip | `db-oh-press-neutral-grip` | ángulo 75° ⚠️ (hoy "75 lb") | media |
| plan | 75 Neutral Grip Db OH Press | `db-oh-press-neutral-grip` | ángulo 75° ⚠️ | media |
| plan | BB Bench Press | `barbell-bench-press` | — | alta |
| plan | BB RDL | `romanian-deadlift` | — | alta |
| plan | Back Squat | `back-squat` | — | alta |
| plan | Cable Flyes | `mid-cable-fly` | — | media |
| plan | Cable Rope Tricep Extensions | `cable-rope-tricep-extensions` | — | alta |
| plan | Close Grip Bench Press | `close-grip-bench-press` | — | alta |
| plan | Close Grip Decline Press | `close-grip-decline-press` | — | alta |
| plan | Db 60 Y Raises Drop Sets | `db-60-y-raises` | ángulo 60° ⚠️; técnica: drop sets | alta |
| plan | Db Walking Lunges Long Steps | `db-walking-lunges-long-steps` | paso: largo | alta |
| plan | Decline BB Press | `decline-bb-press` | — | alta |
| plan | Decline Db Flies | `decline-dumbbell-fly` | — | alta |
| plan | EZ BB Preacher Curls | `ez-bb-preacher-curls` | — | alta |
| plan | FFE Db Split Squats | `ffe-db-split-squats` | — | alta |
| plan | Hack Squat Machine | `hack-squat-machine` | — | alta |
| plan | Hack Squats | `hack-squat-machine` | — | alta |
| plan | Heels Elevated HB Squats | `heels-elevated-hb-squats` | — | media ⚠️ REVISAR |
| plan | High Cable Flies | `high-cable-fly` | — | alta |
| plan | Hor. Back Extensions Glutes Dominant | `hor-back-extensions-glutes-dominant` | — | alta |
| plan | Incline BB Press | `incline-barbell-bench-press` | — | alta |
| plan | Lateral Raises Machine Drop Sets | `lateral-raises-machine` | técnica: drop sets | alta |
| plan | Leg Extensions Toes Dorsiflexed Neutral | `leg-extensions-toes-dorsiflexed-neutral` | pies: neutros | alta |
| plan | Leg Extensions Toes Dorsiflexed Out Drop Sets | `leg-extensions-toes-dorsiflexed-neutral` | pies: hacia afuera; técnica: drop sets | media ⚠️ REVISAR |
| plan | Leg Press Calf Raises Toes Neutral | `leg-press-calf-raises-toes-neutral` | pies: neutros | alta |
| plan | Low Cable Ropes Curls Drop Sets | `low-cable-ropes-curls` | técnica: drop sets | alta |
| plan | Middle Cable Flies Drop Sets | `mid-cable-fly` | técnica: drop sets | alta |
| plan | Neutral Grip LPD | `neutral-grip-lat-pulldown` | — | alta |
| plan | Neutral Grip Pin Loaded Shoulder Press | `neutral-grip-pin-loaded-shoulder-press` | — | alta |
| plan | Neutral Grip Supp. Rows | `neutral-grip-supp-rows` | — | alta |
| plan | Neutral Grip Weighted Chin Ups | `neutral-grip-weighted-chin-ups` | carga: lastre | alta |
| plan | Plate Loaded Chest Press Wide Grip | `plate-loaded-chest-press-wide-grip` | — | alta |
| plan | Plate Loaded Wide Grip Shoulder Press Machine | `plate-loaded-wide-grip-shoulder-press-machine` | — | alta |
| plan | Prone Leg Curl Toes Dorsiflexed Neutral | `prone-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| plan | Prone Leg Curls Toes Dorsiflexed Neutral Drop Sets | `prone-leg-curl-toes-dorsiflexed-neutral` | pies: neutros; técnica: drop sets | alta |
| plan | Reverse Grip Chin Up Weighted | `reverse-grip-chin-up-weighted` | carga: lastre | alta |
| plan | Reverse Grip Lats Machine | `reverse-grip-lats-machine` | — | alta |
| plan | Romanian Deadlift | `romanian-deadlift` | — | alta |
| plan | Seated Leg Curl Toes Dorsiflexed Neutral Drop Sets | `seated-leg-curl-toes-dorsiflexed-neutral` | pies: neutros; técnica: drop sets | alta |
| plan | Seated Leg Curls Toes Dorsiflexed Neutral | `seated-leg-curl-toes-dorsiflexed-neutral` | pies: neutros | alta |
| plan | Seated Row | `seated-cable-row` | — | media |
| plan | Single Db Preacher Curls | `single-db-preacher-curls` | — | alta |
| plan | Standing DB Curls | `standing-dumbbell-curl` | — | alta |
| plan | Standing Db Offset Grip Curls | `standing-db-offset-grip-curls` | — | alta |
| plan | Tricep Rope Pushdown | `cable-rope-tricep-extensions` | — | alta |
| plan | Unilateral Handle LPD | `single-arm-lat-pulldown` | — | alta |
| plan | Unilateral Supp. Rows Reverse Grip | `unilateral-supp-rows-reverse-grip` | — | alta |
| plan | Weighted 45 Back Extensions | `weighted-45-back-extensions` | carga: lastre | alta |
| plan | Weighted V Ups | `v-up` | carga: lastre | alta |
| plan | Wide Grip Cable Chest Pulls | `wide-grip-cable-chest-pulls` | — | baja ⚠️ REVISAR |
| plan | Wide Grip Cable Row | `wide-grip-cable-row` | — | alta |
| plan | Wide Grip Chest Press Drop Sets | `wide-grip-chest-press` | técnica: drop sets | media ⚠️ REVISAR |
| plan | Wide Grip LPD | `lat-pulldown` | — | media |
| plan | Wide Grip Shoulder Press Machine | `wide-grip-shoulder-press-machine` | — | alta |
| plan | Wide Grip Supp. Seated Row | `wide-grip-supp-seated-row` | — | alta |

### Fuente: six-day (`sixDayProgram`, 14 nombres distintos)

| source | original name | → canonical id | modifiers | confidence |
|---|---|---|---|---|
| six-day | Dumbbell Press (Neutral Grip, 45°) | `db-press-neutral-grip` | ángulo 45° | alta |
| six-day | Dumbbell Press (Neutral Grip, 30°) | `db-press-neutral-grip` | ángulo 30° | alta |
| six-day | Cable Fly (High) | `high-cable-fly` | — | alta |
| six-day | Cable Row (Wide Grip) | `wide-grip-cable-row` | — | alta |
| six-day | Lat Pulldown (Neutral Grip) | `neutral-grip-lat-pulldown` | — | alta |
| six-day | Shoulder Press Machine (Wide Grip) | `wide-grip-shoulder-press-machine` | — | media (o la de discos, pregunta 7) |
| six-day | Dumbbell Overhead Press (Neutral Grip) | `db-oh-press-neutral-grip` | — | alta |
| six-day | Lat Machine (Reverse Grip) | `reverse-grip-lats-machine` | — | alta |
| six-day | Decline Press (Close Grip) | `close-grip-decline-press` | — | alta |
| six-day | Leg Press (Quad Dominant, 45°) | `leg-press-quad-dominant` | ángulo 45°; pies: enfoque cuádriceps | alta |
| six-day | Walking Lunge (Dumbbell, Long Step) | `db-walking-lunges-long-steps` | paso: largo | alta |
| six-day | Romanian Deadlift (Barbell) | `romanian-deadlift` | — | alta |
| six-day | Calf Raise (Leg Press, Neutral) | `leg-press-calf-raises-toes-neutral` | pies: neutros | alta |
| six-day | Dumbbell Pullover | `db-pull-overs` | — | alta |

Observación: el `sixDayProgram` confirma que "30"/"45" en el press con mancuernas son
grados ("Neutral Grip, 45°"), lo que respalda leer igual los demás números iniciales.

## ⚠️ Decisiones para Sebas

1. **Números delante del nombre.** En el Excel aparecen "30 BB Bench Press", "45 BB Press",
   "45 Db Press", "60/75 Db OH Press", "60 Db Curls", "45 Hammer Curls", "Db 60 Y Raises".
   Hoy la app los muestra como libras ("30 lb …"). ¿Esos números son la **inclinación del
   banco en grados** (no peso)? **Sí / No**
2. **"30 BB Bench Press" y "45 BB Press":** ¿es press con barra en banco con el respaldo
   levantado (inclinado)? **Sí** → se registran como *Incline Barbell Bench Press* con el
   ángulo como nota. **No** → dime cómo es.
3. **Curls con número ("60 Db Curls Offset Grip", "45 Hammer Curls"):** ¿los haces
   **A)** sentado en un banco inclinado, o **B)** de pie? (Si es B, "60 Db Curls Offset Grip"
   se une con "Standing Db Offset Grip Curls").
4. **"Heels Elevated HB Squats":** ¿qué barra usas? **A)** barra hexagonal (la que te rodea,
   tipo trap bar) **B)** barra olímpica normal apoyada arriba en la espalda.
5. **"Wide Grip Cable Chest Pulls":** ¿cómo es? **A)** sentado, jalas hacia el pecho en línea
   recta horizontal (tipo remo) **B)** jalas una barra desde arriba hacia el pecho (tipo jalón)
   **C)** otra cosa (descríbela en una frase).
6. **Remos "Supp." (Neutral Grip Supp. Rows, Wide Grip Supp. Seated Row, Unilateral Supp.
   Rows):** ¿son **A)** una máquina donde apoyas el pecho en un cojín, o **B)** mancuernas/barra
   acostado boca abajo en un banco inclinado?
7. **Máquinas parecidas:** ¿"Wide Grip Chest Press" es la **misma** máquina que "Plate Loaded
   Chest Press Wide Grip"? ¿Y "Wide Grip Shoulder Press Machine" la misma que "Plate Loaded
   Wide Grip Shoulder Press Machine"? **Sí** → se unen / **No** → quedan separadas (propuesta actual).
8. **Posición de los pies** ("Toes Dorsiflexed Neutral / Out" en extensiones y curl femoral):
   **A)** guardarla como nota/variante del mismo ejercicio (recomendado: no se pierde el
   historial y la lista queda más corta) o **B)** que sean ejercicios separados.
9. **Nombres viejos vagos de la librería:** propongo "Calf" → *Leg Press Calf Raise*,
   "Chin" → *Chin-Up (agarre supino)*, "Leg Curl" → *Lying Leg Curl* (acostado),
   "Close Grip Press" → *Close-Grip Bench Press*. ¿De acuerdo? **Sí / No** (si no, dime cuál cambia).
10. **"Close Grip Decline Press":** ¿lo haces con **A)** barra libre o **B)** en máquina Smith
    (barra guiada)?

## Fuentes

- Código actual de GymStudio: `src/data/exerciseLibrary.ts`, `src/data/workoutPlan.ts`,
  `src/components/WorkoutPlan.tsx` (`sixDayProgram`), `src/utils/storage.ts`
  (alias legado `bb-bench-press` → `barbell-bench-press`).
- ExRx.net — Exercise Directory (clasificación por músculo objetivo, sinergistas y equipo):
  https://exrx.net/Lists/Directory
- NSCA, *Essentials of Strength Training and Conditioning*, 4.ª ed. (Haff & Triplett, 2016) —
  patrones de movimiento y clasificación de ejercicios.
- ACE Exercise Library: https://www.acefitness.org/resources/everyone/exercise-library/
- Redacción propia; no se copió texto de las fuentes.
