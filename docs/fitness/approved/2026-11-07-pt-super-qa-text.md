---
title: PT super-QA 2026-11-07 - wording fixes and the custom-plan next-target minimum path
status: approved
author: pt-fitness-expert
created: 2026-11-07
approved_by: PT super-QA 2026-11-07 (PT's own replacement text, applied as written). PO sign-off still pending for the beginner lines in the templates and the gender-neutral catalogue/template edits.
approved_on: 2026-11-07
---

# PT super-QA 2026-11-07

All texts below are the PT's exact replacement wording from the super-QA review. No other
approved wording changed.

## Custom plans: next-target card (minimum path)

Custom plans still use `src/progress/nextTarget.ts` (preset plans use the AI Trainer engine).
Two changes only, no other rule change:

1. Bodyweight or band exercises without added load (0 kg) never get a kg target. The card shows
   `workout.trainer.reason.bodyweight_add_reps` (add reps first) and no "Next: … kg" label, and
   the weight field is not prefilled with a new load (F7, `2026-11-01-first-run-and-same-day-start.md` §3).
2. Increases and reductions use the equipment step from `src/trainer/engine.ts` `equipmentStep`
   (dumbbell/kettlebell 2 kg, everything else 2.5 kg) and land on that grid, instead of a fixed
   +1 / +2.5 / +5 kg. Example: an 8 kg dumbbell lateral raise goes to 10 kg, never 9 kg.

3. PT pre-merge review: the reduce explanation (`workout.nextTarget.why.reduce`) says
   EN "Two or more sets were at least 3 reps short; lower the weight by 5–10%, at least one step (2 kg for dumbbells and kettlebells, 2.5 kg for everything else)."
   ES "Dos o más series quedaron al menos 3 reps por debajo del objetivo; baja el peso un 5–10 %, como mínimo un salto (2 kg en mancuernas y kettlebells, 2,5 kg en todo lo demás)."
4. Band work without added load (engine and custom plans) uses `workout.trainer.reason.no_load_add_reps`:
   EN "No added load: add reps before adding weight ({reps} last time)." ES "Sin carga añadida: suma repeticiones antes de agregar peso ({reps} la última vez)."

## Why this weight (PT pre-merge review, workout-mode branch)

- The reason describes the session the engine used (the latest, any plan day). When that is another plan day than today's,
  a line goes first: EN "Based on your last session: {dayName}, {date}." ES "Según tu última sesión: {dayName}, {date}."
- "Last time:" under the sets keeps the same-target session; when it is another plan day it reads
  EN "Last {dayName}: {weight} kg × {reps}" ES "Último {dayName}: {weight} kg × {reps}".
- A rep-target change with the same top load says EN "Kept {weight} kg for today's {todayTarget}-rep target."
  ES "Mantuve {weight} kg para el objetivo de {todayTarget} repeticiones de hoy." A lower load keeps "I adjusted the load from…".

## Templates (`templates/*.json`, `es/templates.json`)

- "How to progress" / "Cómo progresar" (all templates) ends with the beginner line:
  EN "New to lifting? Stay about 3 reps from failure in weeks 1-2 and about 2 in weeks 3-5."
  ES "¿Recién empiezas con pesas? Quédate a unas 3 reps del fallo en las semanas 1-2 y a unas 2 en las semanas 3-5."
- "Key tips" where it allows failure (4d upper/lower gym, 5d upper/lower + PPL gym):
  EN "Only the last set of machine, cable or isolation work may go to failure, and not in your first months; never grind squats, RDLs or presses."
  ES "Solo la última serie de máquinas, poleas o aislamiento puede llegar al fallo, y no en tus primeros meses; nunca lleves al fallo sentadillas, peso muerto rumano ni presses."
- ES dumbbell templates: "baja el peso en 3 segundos" became "haz la bajada más lenta, en 3 segundos".
- ES 6-day templates: "Si te sientes agotado…" became "Si sientes mucho cansancio por más de unos días, aplica antes el enfoque de la semana 6."
- ES decimals use a comma: "1-2,5 kg", "2,5-5 kg", "2,5-3 minutos".

## ES catalogue (`es/catalogue-legs-glutes.json`)

- plate-loaded-pendulum-squat tip 5: "Usa el seguro de la máquina al entrar y salir para que la carga nunca te deje sin salida."
- smith-machine-hip-thrust tip 5: "Gira la barra para desengancharla solo cuando tengas la cadera bien colocada debajo."

## App strings (`src/i18n/sections/`)

- Week notes: deload EN "Deload: same weights, half the sets, stop with 3 or more reps left in you." /
  ES "Descarga: mismo peso, la mitad de las series; detente cuando aún te queden 3 reps o más.";
  week 1 EN "Week 1: straight sets, 3-second lowering, stop with about 3 reps left in you." /
  ES "Semana 1: series rectas, bajada de 3 segundos; detente cuando aún te queden unas 3 reps."
- No safety or result promises: `workout.trainer.calibration.capped` and `profile.plan.beginnerNote`.
- ES terms: hard sets = "series efectivas", working sets = "series de trabajo"; "tirón" (not
  "tracción"); "Más bajo"; "ligero" (not "liviano"); "entrenamiento"; "Creando tu plan…";
  gender-neutral welcome lines; PT-approved `same_day_boost` and `recent_miss_cap`.
