---
title: First-run questions, same-day start and first-session weights
status: draft
author: pt-fitness-expert
created: 2026-11-01
approved_by:
approved_on:
exercises: [back-squat, barbell-bench-press, dumbbell-goblet-squat, dumbbell-bench-press, dumbbell-romanian-deadlift, push-up, romanian-deadlift, hex-bar-deadlift, dumbbell-bulgarian-split-squat, seated-leg-curl-toes-dorsiflexed-neutral, standing-calf-raises-toes-neutral, leg-press-quad-dominant, barbell-hip-thrust]
---

## Summary
A new user can start today, safely, on any day of the week. The first run asks six required questions (the PO added activity
level on 2026-11-01), and the experience, equipment and activity options must say what they mean. The plan's week 1 starts on the day of the first logged set, so there is no partial
week and Monday means nothing special. The app recommends rest days when the plan calls for them, and it never invents a
first-time weight: the user finds it, stopping about 3 reps short of failure, and the engine's guardrail applies from then on.

All numbers in the test cases come from reading the code. I did not run them. If an engine case fails, send it back to the
PT rather than changing the expected value. Screens and architecture stay with UXer and the Tech Lead.

## Exercises
No catalogue content changes. The ids above are named in the test cases. Expected day-one exercises come from the approved
templates and `personalizeTemplate`.

## 1. Questions

**Decision: 6 questions (PO decision, 2026-11-01).** `selectTemplate` needs 3 answers to choose a template (experience, days,
equipment), and `personalizeTemplate` uses 3 more to set the volume (goal, session length, activity level). The PO chose to ask
activity level, which overrides my earlier recommendation to skip it and default to `moderate`. All six reuse the Profile values.

| # | Question | Values (existing keys) | What it decides | Safety role |
|---|---|---|---|---|
| 1 | Goal | `muscle`, `fat_loss`, `strength`, `general` | Sets, reps, rest | Low |
| 2 | Experience | `beginner`, `intermediate`, `advanced` | 4-day cap, simpler lifts, lower volume | **Highest** |
| 3 | Days per week | `3`, `4`, `5`, `6` | Split | Medium |
| 4 | Where you train | `full_gym`, `basic_gym`, `home` | Template kit | **High**: the workout must be possible today |
| 5 | Session length | `45`, `60`, `75`, `90` | Exercises and sets | Low |
| 6 | Activity level (existing labels: EN Low / Moderate / High; ES Bajo / Moderado / Alto) | `low`, `moderate`, `high` | `high`: one set fewer on leg accessories, never below 2. `low`, `moderate`: base | Low |

All six are required. There are no silent defaults and no preselected options, because a wrong equipment answer gives a workout
the user cannot do, and an activity answer the user never gave would look like theirs.

### Three answers need a helper line
These labels are too vague for what depends on them. The stored values do not change.

| Option | EN | ES |
|---|---|---|
| `beginner` | New to lifting, under 6 months of regular training, or back after 3+ months off. | Empiezas con pesas, llevas menos de 6 meses entrenando con regularidad o vuelves después de 3 meses o más sin entrenar. |
| `intermediate` | 6+ months of regular training, and you know the main lifts. | 6 meses o más entrenando con regularidad y conoces los ejercicios principales. |
| `advanced` | 3+ years of structured training, and comfortable with heavy barbell lifts. | Más de 3 años de entrenamiento estructurado y dominas los ejercicios pesados con barra. |
| `full_gym` | Barbells, machines, cables and dumbbells. | Barras, máquinas, poleas y mancuernas. |
| `basic_gym` | Dumbbells, a bench, cables and a pulldown. | Mancuernas, un banco, poleas y jalón. |
| `home` | Dumbbells and an adjustable bench. | Mancuernas y un banco ajustable. |
| `low` | Outside your workouts, you don't move much and do little sport or cardio. | Fuera de tus entrenamientos, te mueves poco y casi no haces deporte ni cardio. |
| `moderate` | Outside your workouts, you move fairly often, with some walking, sport or cardio. | Fuera de tus entrenamientos, te mueves con frecuencia: caminas o haces algo de deporte o cardio. |
| `high` | Outside your workouts, you have a physical job, play sports regularly or do lots of cardio. | Fuera de tus entrenamientos, tienes un trabajo físico, practicas deportes con regularidad o haces mucho cardio. |

Why: overstating experience is the biggest risk here. It removes the 4-day cap and brings back barbell squats and bench
presses. Someone returning after a long break also needs to count as a beginner. The prototype's "At home" also hides the
fact that `tpl-*-db` needs dumbbells and a bench. "Activity level" alone does not say that gym training is left out.

The activity helpers follow `templates/README.md` section 2.4: its heading ("outside the gym") and its description of `high`
(physical job, sports, lots of cardio). The approved rules do not describe `low` or `moderate` or give numeric cut-offs, so that
wording is my judgement and has no numbers. They say "your workouts" rather than "the gym" because `home` users answer them too.

### Activity level: what the answer does
The approved rule does not change (`templates/README.md` section 2.4, `personalizeTemplate`).

- **`low`, `moderate`:** the rule plan is the same for both.
- **`high`:** one set fewer on each leg accessory. Main lifts (`A1`, `B1` straight sets) are not touched, and the 2-set minimum
  still applies. No template has more than 3 sets, so only a 3-set leg accessory can drop, and only to 2.
- **Who sees no change on `high`:** beginners and goals `fat_loss` and `general`, because their accessories are already at 2 sets.
  So `high` changes the rule plan only for intermediate and advanced users with goal `muscle` or `strength`.
- **The rest of the `high` rule** (week 1 about 3 reps from failure, the week-6 deload) already applies to every user.
- **Do not promise** that the plan fits the user's lifestyle or job. For most answers it changes nothing.

**Safety: no conclusion in this draft changes.** A wrong answer has a small effect either way. Overstating costs one set on some
leg accessories. Understating gives the base volume, which is what my earlier `moderate` default would have given. Experience and
equipment remain the answers that matter most for safety. The test cases do change: see Q7 and Q16 to Q23.

### What not to ask
| Item | Decision | Reason |
|---|---|---|
| Age | Do not ask | The Terms say 18+, and the unticked sign-up box (`ai-disclosure.md` section G) confirms it **before** the account, so before the first workout. No rule changes by age, so the answer would only be stored data. |
| Injuries or health | Do not ask | No approved rule uses the answer, so asking would imply the plan accounts for it. It is also health data. The notice in section 5 covers this. |
| Sex, bodyweight | Do not ask | No approved rule uses them, and I reject bodyweight-ratio weights (section 3). |
| Activity level | **Ask** (question 6, PO decision, 2026-11-01). Still editable in Profile | Overrides my earlier recommendation not to ask. There is no `moderate` default in the first run. |
| Notes | Do not ask | Optional, and never used by the plan rules. |

### Two rule changes for day one
Both change results of the approved rules, so the PO must approve them.

1. **Beginner + `strength`: main lifts keep the template's reps for the first block.** Today the rule gives a beginner 3 × 5 on
   a goblet squat they have never done, with no history to set the load. Novice guidance favours moderate loads and higher
   reps (ACSM 2009), and beginners still gain strength on them. The longer rest stays.
2. **Beginner + 75 or 90 min: no extra sets.** Today session length runs after the beginner cap, so accessories can go from 2 to
   3 sets, against the template rule of 2. A beginner who chooses 75 or 90 gets the 60-minute plan. They can use the spare
   time to find weights and rest.

### AI must not undo the safety rules
The first plan must be complete with no model call, and `buildMyPlan` already falls back to it. When AI is on,
`applyAiAdjustments` only checks that a swap has the same primary muscle. The gateway limits the options it offers to equipment
already in the plan, but the validator does not check that, and neither checks experience. A beginner's
`dumbbell-bench-press` could therefore become `barbell-bench-press`.

**Rule:** an AI swap must use the same equipment type as the exercise it replaces, and a beginner can never receive an
exercise from the left column of the beginner swap list. Sets may not go above the beginner limits.

## 2. Mid-week start

**Decision: week 1 starts on the date of the first logged set, whatever the weekday. The first session is always the
template's Day 1 (position 1).** There is no partial week: every plan week is 7 days from that date, and the block is 6 full
weeks with the deload in week 6.

Before anything is logged, Today keeps showing Day 1 and the clock does not run. Someone who answers at 23:30, or waits until
Thursday, loses nothing.

### Recommended rhythm
This is the rhythm the templates already approve, counted from the first session. These are the earliest recommended days, not
appointments. A late session moves the rest along.

| First session | 3 days | 4 days | 5 days | 6 days | Week 2 starts | Week 6 (deload) starts | Block ends |
|---|---|---|---|---|---|---|---|
| Mon 2 Nov | Mon Wed Fri | Mon Tue Thu Fri | Mon Tue Thu Fri Sat | Mon to Sat | 9 Nov | 7 Dec | 13 Dec |
| Tue 3 Nov | Tue Thu Sat | Tue Wed Fri Sat | Tue Wed Fri Sat Sun | Tue to Sun | 10 Nov | 8 Dec | 14 Dec |
| Wed 4 Nov | Wed Fri Sun | Wed Thu Sat Sun | Wed Thu Sat Sun Mon | Wed to Mon | 11 Nov | 9 Dec | 15 Dec |
| Thu 5 Nov | Thu Sat Mon | Thu Fri Sun Mon | Thu Fri Sun Mon Tue | Thu to Tue | 12 Nov | 10 Dec | 16 Dec |
| Fri 6 Nov | Fri Sun Tue | Fri Sat Mon Tue | Fri Sat Mon Tue Wed | Fri to Wed | 13 Nov | 11 Dec | 17 Dec |
| Sat 7 Nov | Sat Mon Wed | Sat Sun Tue Wed | Sat Sun Tue Wed Thu | Sat to Thu | 14 Nov | 12 Dec | 18 Dec |
| Sun 8 Nov | Sun Tue Thu | Sun Mon Wed Thu | Sun Mon Wed Thu Fri | Sun to Fri | 15 Nov | 13 Dec | 19 Dec |

Saturday and Sunday need no special rule, and Monday does not reset anything.

### Rest between sessions
A session counts as soon as one set is logged. The gap runs from that date to the next recommended date.

| Template | Next session | Minimum gap |
|---|---|---|
| 3 days | Any next day | 2 days (one rest day) |
| 4 days | Upper A to Lower A, Upper B to Lower B, Lower B to Upper A | 1 day |
| 4 days | Lower A to Upper B | 2 days |
| 5 days | Upper to Lower, Push to Pull, Pull to Legs, Legs to Upper | 1 day |
| 5 days | Lower to Push | 2 days |
| 6 days | Any next day | 1 day |
| Any | Same plan day again (a partial session, or a repeat after a week rollover) | 2 days |

These gaps also apply across a week boundary.

- **The next day, inside the gap:** recommend rest and name the next session and its date.
- **Recommendation, not a lock.** A user who still wants to train gets the next plan day, at the same effort. The gap then runs
  from that session. Training on consecutive days at about 3 reps from failure is not dangerous for most healthy adults, and a
  lock would only push people to train outside the plan.
- **Never suggest a second session on the same day**, and no make-up sessions: days not done when the week ends are dropped
  (the current `nextUnloggedDay` behaviour).

Why rest matters most now: soreness is usually worst after unaccustomed work, and it drops after the first exposures (repeated
bout effect, McHugh 2003). This is why week 1 also has the biggest margin from failure.

### Is it safe in every case?
With these rules, yes for the programming, on every weekday. The app **cannot** know about three things:

- **Medical status.** The notice in section 5 handles it. The app does not screen.
- **Recent training elsewhere.** A user may have trained hard yesterday. The first-session wording tells them they can start
  tomorrow, and the plan waits.
- **Honest answers.** The helper lines reduce this risk but do not remove it. The effort limit of about 3 reps from failure
  still applies at every level.

### Rejected alternatives
| Option | Result | Why not |
|---|---|---|
| Backdate the start to this week's Monday | Rejected as unsafe | A Sunday Day 1 is followed on Monday by week 2 Day 1: the same session 24 hours later, at week 2 effort. The deload arrives after only 4 weeks and a day. |
| Starter sessions, then week 1 next Monday | Acceptable fallback, not specified | Up to 6 more days before the deload, week 1 stacks on top of them, and Sunday to Monday still needs its own rule. If needed, it comes back to the PT for exact rules. |

### For the Tech Lead
Fitness rules do not depend on how this is built, but rolling weeks conflict with code that assumes Monday. `blockWeek`,
`nextUnloggedDay` and `summary.ts` next-occurrence dates already count from `startDate`. These parts do not (the list may be
incomplete):

- `weekBounds` is Monday to Sunday, and `currentWeekComplete` and the week bar use it (`WorkoutPlan.tsx:981-987`, `:3003-3010`).
- `dayDate` labels unlogged days from Monday by position (`WorkoutPlan.tsx:3016`), so a 3-day plan reads Mon, Tue, Wed. That
  contradicts the rest rule, and it can show past dates.
- `summary.ts:57` falls back to weekday = position.

**Scope:** this covers a user's first plan. `buildMyPlan` from Profile stays on `nextMonday` unless the PO decides otherwise
(see Open decisions).

## 3. First-session weights

**Decision: the app shows no number. The user finds the weight and the engine takes over from what they log.** "First session"
means **first time per exercise**, not per user. Day 2 is mostly new exercises and follows the same rule.

| Rule | Detail |
|---|---|
| F1 No invented numbers | No usable history gives `weight: null`, `collect_data`, `no_history`. We know nothing about this person's strength. A too-light guess fixes itself in a few sessions, while a too-heavy guess is the real risk. |
| F2 No shortcuts | No bodyweight ratios, no estimates from other exercises, and no numbers from the AI (the engine's rule: the LLM never chooses numbers). |
| F3 Every loaded type gets the protocol | `barbell`, `ez-bar`, `hex-bar`, `dumbbell`, `kettlebell`, `cable`, `machine`, `plate-loaded`, `smith-machine`. Today barbell and dumbbell lifts get only "There is not enough history yet to adjust this load." |
| F4 Match the technique | Add a `straight` protocol. Today every non-reverse machine exercise gets the pyramid text ("add about 10% each set"), which contradicts the templates' "same weight on every set". The pyramid and reverse-pyramid lines stay for those techniques. |
| F5 Never 0 kg | The weight field is empty, never 0, with Done disabled ("Enter weight", approved T124). **T124 must ship before or with this.** |
| F6 Zero-load history is no history | A weighted exercise whose sets are all 0 kg counts as no history. Today 0 × 5 on a target of 8 returns 0 kg, because the global floor only runs when an earlier load is above 0. |
| F7 Bodyweight stays reps-only | `bodyweight` and `band` with no added load never show kg. |
| F8 Reps prefill | Target or lowest of the range (approved P3, P4). |
| F9 Effort | About 3 reps left, at every level. People are poor at judging this early on (Halperin 2022), so they need the margin. |
| F10 Warm-ups | Not logged, because the engine reads the first planned sets as working sets. A logged warm-up would corrupt the baseline. Adding load across a set is fine, and approved carry rule 5.2 applies. |
| F11 Supersets | The user may rest as needed while finding weights the first time. Logged sets are unaffected. |
| F12 Guardrail | With no history there is no last load to cap. From the second exposure, the existing guardrail applies with no change: `max(1 step, min(+10%, 2 steps))`. The first session stays "Baseline", never a PR. |
| F13 Typo check | A first log becomes the base for every later number, and the guardrail cannot catch a typo. Above the limits below, ask the user to confirm before saving. This is a confirmation, not a block. |

**F13 limits** (kg, per hand for dumbbells and kettlebells) ⚠️ REVISAR: these are my judgement, set above what most members
lift, and are not from a study.

| `dumbbell` | `kettlebell` | `ez-bar` | `cable`, `machine` | `barbell`, `hex-bar`, `smith-machine` | `plate-loaded` |
|---|---|---|---|---|---|
| 60 | 48 | 80 | 150 | 200 | 400 |

**Coverage gap:** `invariants.test.ts` only covers blocks 6 and above, and its 0 kg and guardrail checks only run when an earlier
load exists. New users' plans are not covered today. The suite needs all 8 templates, personalised for every experience,
equipment and activity value, with no-history cases included.

## 4. First-session wording

**Replaces** the current `workout.trainer.firstSession.*` text and the `no_history` text on these cards. `.log` asks how many reps
were left, which the approved RIR removal does not allow. All five lines are still English in the ES dictionary. Test T92 pins
the old text and must change with them.

**Once, at the top of the first workout:**

| Key (proposed) | EN | ES |
|---|---|---|
| `workout.firstDay.intro` | These first weights are your starting point, not a test. Today may take a little longer. | Estos primeros pesos son tu punto de partida, no una prueba. Hoy puede tomar un poco más de tiempo. |
| `workout.firstDay.sore` | Sore from recent training? You can start tomorrow. Your plan will wait. | ¿Tienes dolor muscular por un entrenamiento reciente? Puedes empezar mañana. Tu plan te espera. |
| `workout.firstDay.pain` | If a movement hurts, stop it and see a qualified professional. | Si un movimiento te duele, deja de hacerlo y consulta a un profesional calificado. |

**On each exercise the first time**, in this order:

| Key (proposed) | When | EN | ES |
|---|---|---|---|
| `workout.trainer.firstSession.warmup` | All loaded | Start light and add a little weight over 1-3 easy warm-up sets. Don't log these. | Empieza liviano y sube un poco el peso en 1 a 3 series fáciles de calentamiento. No las registres. |
| `workout.trainer.firstSession.effort` | All loaded | Choose a weight that lets you finish {target} reps with about 3 more left in you. | Elige un peso con el que completes {target} reps y aún te queden unas 3 más. |
| `workout.trainer.firstSession.same` | Straight, superset | Use that weight on every set. | Usa ese peso en todas las series. |
| `workout.trainer.firstSession.adjust` | All loaded | Too heavy or too light? Change it. That's normal today. | ¿Muy pesado o muy liviano? Cámbialo. Hoy es normal. |
| `workout.trainer.firstSession.dumbbell` | `dumbbell` | Log the weight of one dumbbell. | Registra el peso de una sola mancuerna. |
| `workout.trainer.firstSession.barbell` | `barbell`, `ez-bar`, `hex-bar` | ⚠️ REVISAR: Log the total weight, including the bar. | ⚠️ REVISAR: Registra el peso total, incluida la barra. |
| `workout.trainer.firstSession.log` | All loaded | Your next target will start from what you log. | Tu próximo objetivo partirá de lo que registres. |
| `workout.trainer.firstSession.bodyweight` | Bodyweight, band | Do the reps with control, and stop with about 3 more left in you. | Haz las reps con control y detente cuando aún te queden unas 3 más. |

**Do not write:** "safe", "injury-free", "right for your body", "guaranteed", "this will prevent…", or any promise about results.

## 5. Medical notice

**Replaces** the prototype's line, which mentions only injury and omits stop signs and pregnancy. It is also an edit of
`ai-disclosure.md` section E, so that **the app has a single text**.

| EN | ES |
|---|---|
| **Train safely.** GymStudio is not medical advice. Check with a doctor before you start, especially if you have a health condition or an injury, take medication, or are pregnant. Stop and get medical help if you feel chest discomfort, dizziness, faintness or unusual shortness of breath. Stop any movement that hurts. Weights are suggestions: you decide what you lift. Your plan can wait. | **Entrena con seguridad.** GymStudio no es consejo médico. Consulta a un médico antes de empezar, sobre todo si tienes una condición de salud o una lesión, tomas medicamentos o estás embarazada. Detente y busca ayuda médica si sientes molestia en el pecho, mareo, sensación de desmayo o una falta de aire inusual. Deja cualquier movimiento que te duela. Los pesos son sugerencias: tú decides qué levantas. Tu plan puede esperar. |

- **Changes from section E:** adds medication (as in Terms section 4), adds faintness and shortness of breath, adds "get medical
  help", and adds "Your plan can wait", because the same-day start must not pressure anyone to skip the doctor's visit.
- **When:** readable in full before the first answer and without a tap. It stays reachable during the questions, and also lives in
  Profile (section E).
- **No health checkbox or screening form.** Self-screening tools exist (PAR-Q+), but this one would add steps, collect health
  data and need rules we don't have. ⚠️ REVISAR: the PO and Governancer should confirm this no-screening position.

## 6. Test cases

### Questions and templates
Unless a case names an activity level, its input uses `moderate`. This is test data only: the first run has no default. Q16 to
Q21 check the rule plan with AI off, on `tpl-3d-full-body-gym`. Exercises not listed keep the same sets as `moderate`.

| # | Input | Expected |
|---|---|---|
| Q1 | Beginner, 3, `full_gym`, `muscle`, 60 | `tpl-3d-full-body-gym`, not capped. Day 1 Full Body A: A1 `dumbbell-goblet-squat`, B1 `dumbbell-bench-press`, D1 `dumbbell-romanian-deadlift` |
| Q2 | Beginner, 6, `full_gym` | `tpl-4d-upper-lower-gym`, capped, `profile.plan.beginnerNote` shown. Upper A: A1 `dumbbell-bench-press` |
| Q3 | Beginner, 5, `home` | `tpl-4d-upper-lower-db`, capped |
| Q4 | Intermediate, 5, `home` | `tpl-5d-upper-lower-ppl-db`, not capped |
| Q5 | Advanced, 6, `basic_gym` | `tpl-6d-ab-split-db`, not capped |
| Q6 | Intermediate, 4, `full_gym`, `muscle`, 60 | `tpl-4d-upper-lower-gym`. Upper A: A1 `barbell-bench-press` unchanged |
| Q7 | First run, activity level not answered | No option preselected, the questions cannot finish, no goal row saved, and `moderate` is never stored unless the user picks it |
| Q8 | Beginner, 3, `full_gym`, `strength` | A1 `dumbbell-goblet-squat` 3 × 8, B1 `dumbbell-bench-press` 3 × 8, rest at least 180 s (**today 3 × 5**) |
| Q9 | Intermediate, 3, `full_gym`, `strength` | A1 `back-squat` 4 × 5 (unchanged) |
| Q10 | Beginner, 3, `full_gym`, `muscle`, 90 | Accessories stay at 2 sets, same as 60 min (**today up to 3**) |
| Q11 | Intermediate, 3, `full_gym`, `muscle`, 90 | Extra sets still apply (unchanged) |
| Q12 | AI swaps a beginner's `dumbbell-bench-press` to `barbell-bench-press` | Swap ignored |
| Q13 | AI swaps a `dumbbell` exercise to a `machine` one for a `home` user | Swap ignored |
| Q14 | AI unavailable or declined | Rule plan is complete and today's workout still shows |
| Q15 | Any path to the first workout | 18+ box already ticked; no workout before it |
| Q16 | Intermediate, 3, `full_gym`, `muscle`, 60, `low` or `moderate` | Identical plan, equal to the base template |
| Q17 | Intermediate or advanced, 3, `full_gym`, `muscle`, 60, `high` | Full Body A: D1 `romanian-deadlift` 2 sets (from 3). Full Body B: E1 `seated-leg-curl-toes-dorsiflexed-neutral` 2 and E2 `standing-calf-raises-toes-neutral` 2 (from 3). Full Body C: C1 `barbell-hip-thrust` 2 (from 3). Stay as they are: A1 `back-squat` 3, A1 `hex-bar-deadlift` 3, A1 `leg-press-quad-dominant` 3, D1 `dumbbell-bulgarian-split-squat` 2 (already at the minimum) |
| Q18 | Intermediate, 3, `full_gym`, `strength`, 60, `high` | Full Body A: A1 `back-squat` 4 × 5, D1 `romanian-deadlift` 2 × 10 |
| Q19 | Beginner, 3, `full_gym`, `muscle`, 60, `high` | Identical to the same answers with `moderate`. D1 `dumbbell-romanian-deadlift` 2 sets. No leg accessory drops |
| Q20 | Intermediate, 3, `full_gym`, `fat_loss` or `general`, 60, `high` | Identical to the same answers with `moderate`. D1 `romanian-deadlift` 2 sets |
| Q21 | Intermediate, 3, `full_gym`, `muscle`, `high`, 75 or 90 | Full Body A, D1 `romanian-deadlift`: 75 gives 2 sets (`moderate` 3); 90 gives 3 sets (`moderate` 4) |
| Q22 | Activity level question, EN and ES | Labels Low / Moderate / High and Bajo / Moderado / Alto, each with its helper line from section 1. No English in ES |
| Q23 | `high` chosen in the first run, then Profile opened | Profile shows `high`, not the Profile form's `moderate` starting value |

### Start date and rest
| # | Input | Expected |
|---|---|---|
| W1 | First log Mon 2 Nov | `startDate` 2 Nov, Day 1, week 6 starts 7 Dec |
| W2 | First log Thu 5 Nov, 4 days | Upper A. Week 1 is 5 to 11 Nov. 9 Dec is week 5, 10 Dec is week 6 with deload, last day 16 Dec |
| W3 | First log Sat 7 Nov, 3 days | Full Body A. Sun 8 Nov: rest recommended. Mon 9 Nov: Full Body B |
| W4 | First log Sun 8 Nov, 3 days | Mon 9 Nov: rest recommended, still week 1, no reset to Day 1. Tue 10 Nov: Full Body B. Week 2 starts 15 Nov |
| W5 | First log Sun 8 Nov, 4 days | Mon 9 Nov: Lower A, no rest message. Tue 10 Nov: rest recommended. Wed 11 Nov: Upper B |
| W6 | First log Sat 7 Nov, 6 days | Sun 8 Nov: `arms-a`, no rest message |
| W7 | 5 days, Lower logged the day before | Rest recommended, then Push |
| W8 | W3, user trains anyway on Sun 8 Nov | Full Body B allowed. Next recommended date Tue 10 Nov |
| W9 | Plan built Sat 7 Nov 23:30, first log Sun 8 Nov | `startDate` 8 Nov, Day 1 |
| W10 | Plan built Mon 2 Nov, first log Thu 5 Nov | `startDate` 5 Nov, Day 1, week 1 |
| W11 | Plan built, nothing logged for 50 days | Day 1, week 1, no deload |
| W12 | Day 1 logged today, app reopened | Today stays on Day 1, Day 2 not suggested today |
| W13 | 4 days: Upper A partly logged Thu | Fri: rest recommended. Sat: Upper A again; logged exercises use normal rules, unlogged ones the first-time rule |
| W14 | 3 days, start Sat 7 Nov: A on Sat, B on Fri 13 Nov | Sat 14 Nov is week 2, next is Full Body A, rest recommended. Sun 15 Nov: Full Body A. C is dropped, no make-up |
| W15 | Log at 23:30 local on Saturday, UTC already Sunday | `startDate` is Saturday (local date) |
| W16 | Existing user regenerates a plan in Profile | Still `nextMonday` until the PO decides otherwise |

### First-session weights
Same day key and block unless stated. Barbell step 2.5 kg, dumbbell step 2 kg.

| # | Input | Expected |
|---|---|---|
| F1 | `barbell`, straight, 3 × 8, no history | `weight` null, `collect_data`, `no_history`, protocol `straight` (**today no protocol**) |
| F2 | `dumbbell`, superset, no history | As F1 |
| F3 | `machine`, straight, no history | Protocol `straight`, no "10% each set" (**today `pyramid`**) |
| F4 | `plate-loaded` reverse pyramid or `cable` pyramid, no history | Keep today's protocol; weight null (T92 weights unchanged) |
| F5 | `push-up`, no history | No kg anywhere; bodyweight line; prefill target reps |
| F6 | Day 2 of the plan, all new exercises | First-time text on each one, even with Day 1 logged |
| F7 | First exposure falls in week 6, any loaded type | `weight` null, never 0 |
| F8 | `barbell` history: only 0 × 5, target 8 | Same as F1 (**today 0 kg**) |
| F9 | Weight field at 0 or empty on a loaded exercise | Done disabled, "Enter weight", nothing saved |
| F10 | `barbell` 40 × 8, 8, 8, target 8 | 42.5, `reached_top_of_range` |
| F11 | `barbell` 40 × 14, 14, 14, target 8 | 42.5, `exceeded_target`. Never 45, even though the estimate rounds up to it |
| F12 | `barbell` 40 × 5, 5, 5, target 8 | 40, `below_target_once` |
| F13 | F12 twice in a row | 37.5, `below_target_twice` |
| F14 | `barbell` 20, 25, 25 × 8, target 8 | 25, `consolidate_load` |
| F15 | `dumbbell` 6 × 12, 12, 12, target 12 | 6, `increase_reps`, `light_load_add_reps`, reps 13-14. Never 8 yet |
| F16 | Upper A `barbell-bench-press` 40 × 8, 8, 8, then Upper B target 10 | 37.5, `converted_rep_range` |
| F17 | `barbell` 40 × 8, 8, 8, then 30 days off | 35, `long_break` |
| F18 | `dumbbell` first log 200 kg; then 30 kg | 200: confirm before saving. 30: no prompt |
| F19 | Guest log of an exercise moved into the new account | That exercise uses normal rules; others use the first-time rule |
| F20 | All 8 templates, every experience, equipment and activity value, no history and F10-F17 histories | Invariants pass: never 0 kg when loaded, only real steps, no jump above the guardrail, no "no data" with recent sessions |

### Wording
| # | Input | Expected |
|---|---|---|
| L1 | First-time machine straight card, EN and ES | Warm-up, effort, same, adjust, log, in that order. No "10%". No question about reps left |
| L2 | First-time dumbbell card | Adds the one-dumbbell line |
| L3 | ES | No English in any line from sections 4 and 5 |
| L4 | Second session with history | No first-time text; normal reason |
| L5 | Second workout day | `workout.firstDay.*` not shown again |
| L6 | Notice | Readable before the first answer, same text in Profile |

## ⚠️ Open decisions
1. ⚠️ REVISAR (PO): approve the two rule changes in section 1: beginner `strength` reps, and beginner 75 or 90 minutes. I recommend both.
2. ⚠️ REVISAR (PO): a home user with **no dumbbells** has no plan today. For launch I recommend saying what `home` needs (helper line) and offering nothing else. A bodyweight template would be a separate PT draft. Decide before launch, because this user finishes the questions and cannot do the workout.
3. ⚠️ REVISAR (Tech Lead, then PO): can rolling weeks work with the Monday-based week bar? If not, this returns to the PT for the fallback's exact rules. Backdating is not an option.
4. ⚠️ REVISAR (PO): should an existing user regenerating a plan also start the same day? I kept `nextMonday`. A rolling start would suit them too, but it is outside this change.
5. ⚠️ REVISAR (Governancer, PO): update section E with the notice in section 5, and confirm the no-screening position. Not a legal opinion.
6. ⚠️ REVISAR (PO): the experience cut-offs (6 months, 3 months off, 3 years) and the F13 limits are coaching judgement, not exact research figures. Mainstream sources describe these levels only roughly.
7. ⚠️ REVISAR (Tech Lead): I found no label in the app saying how to log a barbell or dumbbell weight. Dumbbells are per hand in the approved spec. For barbells, I assume total with the bar. Please check that against Sebas's own logs before this line ships.
8. ⚠️ REVISAR (PO): the helper lines add text to the questions. If UXer needs them shorter, the meaning must stay, especially "back after 3+ months off", "dumbbells and an adjustable bench", and that activity means outside workouts.
9. Week 1 note: `prescriptionForWeek` has a `beginnerIntro` option that no caller passes, so the week 1 note never appears. Week 1 effort for new users reaches them only through this wording and the template text. The engine does not apply the template effort ramp by week. No change proposed here; I can review it separately.
10. AI Trainer release checklist applies: PT pre-merge review, invariants (F20) and the QAer week flow, including a first-time exercise on each equipment type.
11. ⚠️ REVISAR (PO): with the approved rule, `high` changes the rule plan only for intermediate and advanced users with goal `muscle` or `strength` (section 1). Everyone else answers a required question that changes nothing in the rule plan. I did not change the rule, as instructed. A wider effect would need a new PT rule.
12. ⚠️ REVISAR (PO, Tech Lead): the "no change" results cover the rule plan only. When AI is on, `block_plan` receives `activity_level` and may change sets by 1, so it can treat `low` and `moderate` differently, and it can add back a leg set that `high` removed. `applyAiAdjustments` allows both. No rule added here. If this should be blocked, I can specify it.
13. ⚠️ REVISAR (PO): the `low` and `moderate` helper wording is my judgement. The approved rules describe only `high`.
14. For the Tech Lead: `emptyGoal` in `ProfileDataSections.tsx` starts at `moderate` (and pre-fills the other answers). The first run cannot reuse those starting values and still meet "no preselected option" (Q7, Q23).

## Sources
- American College of Sports Medicine (2009). Position Stand: Progression models in resistance training for healthy adults. *Med Sci Sports Exerc* 41(3):687-708 (novice, intermediate and advanced levels; moderate loads for novices).
- Riebe D et al. (2015). Updating ACSM's recommendations for exercise preparticipation health screening. *Med Sci Sports Exerc* 47(11):2473-2479. [Record](https://digitalcommons.uri.edu/kinesiology_facpubs/180). Screening rests on current activity, symptoms and known disease; the notice names symptoms and conditions rather than risk factors.
- [ACSM: Exercise preparticipation screening, removing barriers to initiating exercise](https://www.acsm.org/blog-detail/acsm-certified-blog/2018/02/01/exercise-preparticipation-screening-removing-barriers-initiating-exercise).
- PAR-Q+ (well-known self-screening tool), considered and not adopted. I did not review its question-level content for this draft.
- McHugh MP (2003). Recent advances in the understanding of the repeated bout effect. *Scand J Med Sci Sports* 13(2):88-97.
- Halperin I et al. (2022). Accuracy in predicting repetitions to task failure in resistance exercise. *Sports Med* 52:377-390.
- Refalo MC et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy. *Sports Med* 53:649-665.
- Approved GymStudio documents: `docs/fitness/approved/templates/README.md` and templates; `2026-10-07-progression-engine-spec.md` and v2; `2026-10-10-progress-interpretation.md`; `2026-11-01-remove-rir-prompt.md`. Draft: `docs/governance/app-store/ai-disclosure.md` (sections E, G), `terms.en.md` (sections 2, 4).
- Code read: `src/plans/` (`buildMyPlan.ts`, `personalizePlan.ts`, `weekPrescription.ts`), `src/trainer/` (`engine.ts`, `presentation.ts`, `summary.ts`, `invariants.test.ts`), `src/utils/trainingBlocks.ts`, `src/utils/profileData.ts`, `src/utils/completedExercises.ts`, `src/components/WorkoutPlan.tsx`, `src/screens/ProfileDataSections.tsx`, `src/i18n/sections/`, `supabase/functions/ai-gateway/index.ts`; proposal `docs/ux/proposals/2026-11-01-gymstudio-prototype.md`.
