---
title: First-session starting weights (suggested start from the first-run answers)
status: approved
author: pt-fitness-expert
created: 2026-11-07
approved_by: Sebas (PO) asked for it on 2026-11-07 ("siempre un peso general sugerido en la primera sesión") and delegated the details ("hazlo todo"); open decisions take the PT recommendations
approved_on: 2026-11-07
exercises: [back-squat, dumbbell-bench-press, leg-extensions-toes-dorsiflexed-neutral, machine-leg-extension-single-leg, cable-lateral-raise, barbell-bench-press, incline-barbell-bench-press, barbell-deadlift, hex-bar-deadlift, barbell-good-morning, barbell-overhead-press, barbell-bent-over-row, dumbbell-romanian-deadlift, dumbbell-goblet-squat, dumbbell-bulgarian-split-squat, dumbbell-shoulder-press, standing-db-lateral-raises, dumbbell-farmers-carry, kettlebell-swing, kettlebell-turkish-get-up, ez-bar-curl, lat-pulldown, single-arm-lat-pulldown, cable-face-pull, cable-crunch, seated-leg-curl-toes-dorsiflexed-neutral, standing-calf-raises-toes-neutral, wide-grip-chest-press, plate-loaded-chest-press-wide-grip, leg-press-quad-dominant, smith-machine-squat, machine-assisted-pull-up, machine-dip-assisted, band-assisted-pull-up, push-up]
---

> **Status 2026-11-07:** approved under the PO's request. Open decisions resolved by the Tech Lead from the PO's own logs:
> Smith machine weights are the total with the bar (his Smith shoulder press is logged at 20-25 kg); plate-loaded weights are
> plates added (his leg press is logged at 120-150 kg, T-bar row at 30-42.5 kg). Values, hex bar and stack minimums as written.
> **Back to the PT:** S39 expects 22.5 after 20 × 8, 8, 8, but the approved light-load rule R8 gives 20 kg with more reps;
> the engine keeps R8 until the PT amends one of them.

## Summary
PO decision (2026-11-07): the first time a user does a loaded exercise, the app shows a general suggested starting weight
instead of an empty field. This replaces **F1** and the "no estimates" part of **F2** in
`approved/2026-11-01-first-run-and-same-day-start.md` section 3. Everything else there stays (F3-F13, warm-ups, effort,
Baseline). The number comes from a fixed table: equipment, exercise class and experience level. It is set on the light side
on purpose, so that a small, untrained person can do it with reps to spare. It is a starting point to change, never a test.
Stronger users will find it light and change it. That is expected, and the engine follows what they log.

Still not allowed (F2 stays for these): bodyweight ratios, estimates from other exercises, and numbers chosen by the AI.

## Exercises
No catalogue content changes. The ids above appear in the test cases. Every catalogue exercise is classified by the rule in
section 2.2 from its existing fields.

## 1. Inputs

| Input | Source | Used? |
|---|---|---|
| Experience `beginner` / `intermediate` / `advanced` | First-run answer / Profile | **Yes**: picks the table column. Missing → `beginner` |
| Catalogue `equipment` | `catalogue-v2/*.json` | **Yes**: picks the table and the minimum |
| `movement_pattern`, `mechanic`, `body_region`, `primary_muscles`, `laterality` | `catalogue-v2/*.json` | **Yes**: exercise class (2.2) and unilateral rule (2.4) |
| Planned rep target, `technique`, per-set reps (`setReps`), deload flag | Plan day | **Yes**: rep adjustment (2.3), pyramids, drop sets, deload (4) |
| Goal | First run | **No**. Same number for all four goals |
| Activity level | First run | **No**. It describes life outside the gym, not strength |
| Session length, days per week | First run | **No** |
| Where you train (`full_gym` / `basic_gym` / `home`) | First run | **No direct effect**. It already chose the exercises, and the exercise's own equipment drives the number |
| Sex, body weight, age | Not collected | Never ask for them. The table is set so it does not need them |

## 2. The rule

### 2.1 When it applies
Only on a **first exposure**: the same condition that gives `collect_data` / `no_history` today (no usable history for this
exercise, including the F6 case where every logged set is 0 kg). From the second exposure the normal engine runs unchanged.
It applies to every loaded equipment type (F3 list). Not to `bodyweight` or `band` (reps only, F7), and not to the excluded
exercises in 2.5.

### 2.2 Exercise class
Check these in order and use the first match:

| Order | Class | Catalogue condition |
|---|---|---|
| 1 | `small` | Every `primary_muscles` entry is `Side Delts` or `Rear Delts` (lateral raises, rear-delt work, face pulls, upright rows) |
| 2 | `carry` | `movement_pattern` = `carry` |
| 3 | `core` | `movement_pattern` = `core` |
| 4 | `iso_lower` | `mechanic` = `isolation` and `body_region` is `Legs` or `Glutes` |
| 5 | `iso_upper` | `mechanic` = `isolation` (any other region) |
| 6 | `squat` | `movement_pattern` = `squat` |
| 7 | `hinge` | `movement_pattern` = `hinge` |
| 8 | `lunge` | `movement_pattern` = `lunge` |
| 9 | `push_h` | `push horizontal` |
| 10 | `push_v` | `push vertical` |
| 11 | `pull` | `pull horizontal` or `pull vertical` |

One id override: `barbell-good-morning` uses B 20, I 20, A 30 (it loads the lower back at long leverage, so it gets less than other hinges).

Dumbbell or kettlebell + `laterality` `unilateral` + class `squat` or `hinge` (for example a single-leg RDL) → use the `lunge` row.

### 2.3 Starting-load table (kg)
Columns: B = beginner, I = intermediate, A = advanced. Each value is already on the equipment grid.

**Barbell and smith machine** (total, including the bar. Minimum 20, step 2.5)

| Class | B | I | A |
|---|---|---|---|
| squat | 20 | 40 | 60 |
| hinge | 20 | 40 | 60 |
| lunge | 20 | 20 | 30 |
| push_h | 20 | 30 | 40 |
| push_v | 20 | 25 | 30 |
| pull | 20 | 30 | 40 |
| iso_upper, iso_lower, small, core, carry | 20 | 20 | 25 |

**EZ bar** (total, including the bar. Minimum 10, step 2.5): upper body, core and small: B 10, I 15, A 20. Lower body (squat, hinge, lunge, iso_lower): B 10, I 20, A 30.

**Hex bar** (total, including the bar. Minimum 20, step 2.5): every class B 30, I 40, A 60.

**Dumbbell** (per dumbbell. Minimum 2, step 2) and **kettlebell** (per kettlebell. Same values, minimum 4, step 2). For goblet
and sumo squats and kettlebell swings, the one weight held is the logged weight.

| Class | B | I | A |
|---|---|---|---|
| squat (goblet, sumo) | 8 | 12 | 16 |
| hinge | 6 | 10 | 14 |
| lunge | 4 | 8 | 12 |
| push_h | 6 | 10 | 14 |
| push_v | 4 | 8 | 10 |
| pull | 8 | 12 | 16 |
| iso_upper | 4 | 6 | 8 |
| iso_lower | 4 | 8 | 10 |
| small | 2 | 4 | 6 |
| core | 4 | 8 | 10 |
| carry | 8 | 12 | 16 |

**Cable** (stack number. Minimum 2.5, step 2.5)

| Class | B | I | A |
|---|---|---|---|
| squat | 10 | 15 | 20 |
| hinge | 10 | 20 | 25 |
| lunge | 5 | 10 | 15 |
| push_h | 10 | 15 | 20 |
| push_v | 5 | 10 | 15 |
| pull | 20 | 30 | 40 |
| iso_upper | 5 | 10 | 12.5 |
| iso_lower | 2.5 | 5 | 7.5 |
| small (per arm) | 2.5 | 5 | 7.5 |
| core, carry | 10 | 15 | 20 |

**Machine, pin-loaded** (stack number. Minimum 5, step 2.5)

| Class | B | I | A |
|---|---|---|---|
| squat (leg press) | 30 | 50 | 70 |
| hinge | 20 | 30 | 40 |
| lunge | 10 | 20 | 30 |
| push_h | 15 | 25 | 35 |
| push_v | 10 | 15 | 25 |
| pull | 20 | 30 | 40 |
| iso_upper | 10 | 15 | 20 |
| iso_lower | 15 | 25 | 35 |
| small | 5 | 7.5 | 10 |
| core, carry | 10 | 20 | 25 |

**Plate-loaded** (plates added, not counting the sled or arms. Minimum 5, step 2.5)

| Class | B | I | A |
|---|---|---|---|
| squat (leg press, hack, pendulum, belt squat) | 20 | 40 | 60 |
| hinge | 20 | 40 | 60 |
| lunge | 10 | 20 | 30 |
| push_h | 10 | 20 | 30 |
| push_v | 10 | 15 | 20 |
| pull | 10 | 20 | 30 |
| iso_lower | 20 | 30 | 40 |
| iso_upper, small, core, carry | 5 | 10 | 15 |

### 2.4 Adjustments (apply in this order)
1. **Unilateral on cable, machine or plate-loaded:** if `laterality` = `unilateral` and the class is not `small` or `lunge`,
   halve the value and round **down** to the step. (`small` and `lunge` values are already per arm or per leg.)
2. **High-rep targets:** if the rep target is **13 or more**, subtract one step. The target is the lowest number of the
   range, or for pyramids the reps of the heaviest set. Targets of 12 or fewer, including 3-6 rep strength targets, keep the
   table value, which leaves more margin.
3. **Minimum:** never below the equipment minimum. Never 0.
4. **Grid:** round down to the step (dumbbell and kettlebell 2 kg, everything else 2.5 kg). Every table value is already on the grid.

Goal, activity level, session length and days per week never change the number.

### 2.5 Excluded: keep the current F1 behaviour (empty field, "find your weight" text)
- `machine-assisted-pull-up`, `machine-dip-assisted`, and any future exercise whose name contains "Assisted" on `machine`
  equipment. A higher number is easier, so a "light" number would be the hardest setting.
- Exercises with no catalogue entry, or missing `equipment` / `movement_pattern` / `mechanic`.

### 2.6 Why these numbers
They sit near the low end of what a lighter, less-trained adult can lift for 8-12 reps with about 3 reps left. I sanity-checked
them against common strength-standard tables at the light end. A typical member will find most of them light. That is the
intended direction of error: a too-light start fixes itself in one session, because the user changes the field and the engine
follows the logged weight, while a too-heavy start is the real risk. ⚠️ REVISAR: the values are coaching judgement, not figures from a study.

## 3. How it is shown

- **Weight field:** prefilled with the number (straight sets, supersets, deload) or per set (pyramids, section 4). The user can
  edit it. Done is enabled because the field is no longer empty. F5 still applies if the user clears the field or types 0.
- **Engine output:** `action` `collect_data`, `reason` `no_history`, `weight` = starting load, plus a flag such as
  `firstSessionSuggested: true` (the name is the Tech Lead's choice). `firstSessionProtocol` and `firstSessionLoad` as today.
- **The AI explains, it does not choose.** The LLM may not change or invent this number.

### Card text on the first exposure, in this order
New and changed keys are marked. The others stay as approved.

| Key | When | EN | ES |
|---|---|---|---|
| `workout.trainer.firstSession.suggested` **NEW** | Straight, superset, deload; equipment not in the next three rows | Suggested start: {weight} kg. | Peso sugerido para empezar: {weight} kg. |
| `workout.trainer.firstSession.suggestedDumbbell` **NEW** | `dumbbell` | Suggested start: {weight} kg per dumbbell. | Peso sugerido para empezar: {weight} kg por mancuerna. |
| `workout.trainer.firstSession.suggestedKettlebell` **NEW** | `kettlebell` | Suggested start: {weight} kg per kettlebell. | Peso sugerido para empezar: {weight} kg por pesa rusa. |
| `workout.trainer.firstSession.suggestedBar` **NEW** | `barbell`, `ez-bar`, `hex-bar` | Suggested start: {weight} kg total, including the bar. | Peso sugerido para empezar: {weight} kg en total, con la barra incluida. |
| `workout.trainer.firstSession.suggestedSets` **NEW** | Pyramid, reverse pyramid | Suggested weights are filled in for each set, up to {weight} kg. | Ya tienes un peso sugerido para cada serie, hasta {weight} kg. |
| `workout.trainer.firstSession.suggestedDrop` **NEW** | Drop set | Suggested start: {weight} kg, then about {drop} kg for the drop. | Peso sugerido para empezar: {weight} kg y luego unos {drop} kg para la bajada. |
| `workout.trainer.firstSession.warmup` | All loaded | (unchanged) Start light and add a little weight over 1-3 easy warm-up sets. Don't log these. | (unchanged) |
| `workout.trainer.firstSession.effort` **CHANGED** | All loaded | It should let you finish {target} reps with about 3 more left in you. | Debería permitirte completar {target} reps y que aún te queden unas 3 más. |
| `workout.trainer.firstSession.same` | Straight, superset | (unchanged) Use that weight on every set. | (unchanged) |
| `workout.trainer.firstSession.pyramid` / `.reversePyramid` | Pyramid / reverse pyramid | (unchanged) | (unchanged) |
| `workout.trainer.firstSession.adjust` **CHANGED** | All loaded | Too heavy or too light after your warm-up? Change it. That's normal today. | ¿Muy pesado o muy ligero después de calentar? Cámbialo. Hoy es normal. |
| `workout.trainer.firstSession.dumbbell` / `.barbell` | As today | (unchanged) | (unchanged) |
| `workout.trainer.firstSession.log` | All loaded | (unchanged) Your next target will start from what you log. | (unchanged) |
| `workout.trainer.firstSession.bodyweight` | Bodyweight, band | (unchanged) | (unchanged) |

The excluded exercises (2.5) keep the current text, including the old effort line ("Choose a weight that lets you finish
{target} reps…"). The Tech Lead can keep that string under a new key, for example `effortFind`.

**Changed intro line** (`workout.firstDay.intro`):
- EN: These first weights are general suggestions from your answers, not a test. Today may take a little longer.
- ES: Estos primeros pesos son sugerencias generales según tus respuestas, no una prueba. Hoy puede tomar un poco más de tiempo.

The ES text uses no gendered adjectives about the user. "Muy pesado / muy ligero" describes the weight, not the person.
Do not write "safe", "right for you", "personalised to your strength" or "guaranteed". The number is general, not individual.

## 4. Exceptions

| Case | Rule |
|---|---|
| `bodyweight`, `band` (for example `push-up`, `band-assisted-pull-up`) | Reps only, no kg (F7, unchanged) |
| Assisted machines, uncatalogued exercises | No number. Current F1 behaviour (2.5) |
| **Ascending pyramid** (`pyramid`, for example 15-12-10-8) | The **heaviest set** (fewest reps) gets the table value, adjusted by 2.4 using that set's reps. Each earlier set = the next set − max(1 step, 10% of the next set rounded down to the step), never below the minimum. `weight` = heaviest set; `setWeights` = all sets. No set is heavier than the straight-set number for the same reps |
| **Reverse pyramid** (`reverse-pyramid`, for example 8-10-12-15) | The **first (heaviest) set** gets the table value. Each later set = the previous set − max(1 step, 10% rounded down to the step), never below the minimum |
| **Drop set** (`drop-set`, for example "12+12") | The main load is the table value for the main reps. The drop is the existing rule R3: 75% rounded down, never below the minimum. If that equals the main load (the main load is already at the minimum), show the same number |
| **Superset** | Each exercise gets its own number on its own. Nothing is shared. F11 (rest as needed the first time) stays |
| **Deload week, first exposure** | The table value with no extra reduction, because it is already light. Deload sets (half, rounded up) and reps (bottom of the range) as R4. Pyramids in a deload: use the derived per-set values for the sets R4 keeps |
| **Double-angle follower** (R5) | Unchanged. It follows the leading exercise's load |
| **Guest log moved into an account** (F19) | Exercises with history use the normal rules. Only exercises without history get the table |

## 5. Safety

- **Effort cue stays:** about 3 reps left, at every level (F9). The changed effort line still says it.
- **Warm-ups stay:** 1-3 easy warm-up sets, not logged (F10).
- **F13 typo limits stay**: confirm before saving above 60 kg (dumbbell), 48 (kettlebell), 80 (EZ bar), 150 (cable, machine),
  200 (barbell, hex bar, smith), 400 (plate-loaded). No table value comes near them.
- **Second exposure:** the normal engine runs with the logged weights, including the guardrail
  `max(1 step, min(+10%, 2 steps))`. The suggestion is never used as history. If the user logs something other than the
  suggestion, only the logged weight counts.
- **The first logged session is "Baseline", never a PR.**
- **Pain:** the approved `workout.firstDay.pain` line and the medical notice stay. If a movement hurts, stop it and see a
  qualified professional.

## 6. Test cases
Unless stated, the case is a first exposure with no history, a straight set, not a deload, goal `muscle` and activity `moderate`.

| # | Input | Expected |
|---|---|---|
| S1 | Beginner, `back-squat` (barbell, squat), 3 × 8 | **20** (empty bar). Text `suggestedBar` "Suggested start: 20 kg total, including the bar." |
| S2 | Beginner, `dumbbell-bench-press` (dumbbell, push_h), 3 × 10 | **6** per dumbbell. Text `suggestedDumbbell` |
| S3 | Beginner, `leg-extensions-toes-dorsiflexed-neutral` (machine, iso_lower), 3 × 12 | **15** |
| S4 | Same as S3, 3 × 15 (Lower B) | **12.5** (13+ reps: −1 step) |
| S5 | Beginner, `cable-lateral-raise` (cable, small, unilateral), 3 × 15 | **2.5** (2.5 − 2.5 → minimum 2.5. Not halved because it is `small`) |
| S6 | Intermediate, `barbell-bench-press`, 3 × 8 | **30** |
| S7 | Advanced, `barbell-deadlift` (barbell, hinge), 3 × 5 | **60** |
| S8 | `home`, beginner, `dumbbell-romanian-deadlift` (dumbbell, hinge), 2 × 10 | **6** per dumbbell. Intermediate: **10**. Advanced: **14** |
| S9 | `push-up`, any level | No kg anywhere, reps prefilled with the target, bodyweight line (F7) |
| S10 | Intermediate, `wide-grip-chest-press` (machine, push_h), `pyramid` 15-12-10-8 | `weight` **25**, `setWeights` **[17.5, 20, 22.5, 25]**. Text `suggestedSets` "…up to 25 kg." + pyramid line |
| S11 | Beginner, `plate-loaded-chest-press-wide-grip`, `pyramid` 15-12-10-8 | `weight` **10**, `setWeights` **[5, 5, 7.5, 10]** |
| S12 | Intermediate, `incline-barbell-bench-press`, `reverse-pyramid` 8-10-12-15 | `setWeights` **[30, 27.5, 25, 22.5]**. Beginner: **[20, 20, 20, 20]** |
| S13 | Beginner, `wide-grip-chest-press`, `drop-set` "12+12" | Main **15**, drop **10**. Intermediate: main 25, drop **17.5** |
| S14 | Intermediate, `lat-pulldown` (cable, pull), **deload week**, planned 3 × 10 | `weight` **30**, sets **2**, reps **10**, `deload_week` behaviour, never null, never 0 |
| S15 | Beginner superset: `dumbbell-shoulder-press` 3 × 10 + `lat-pulldown` 3 × 10 | **4** per dumbbell and **20**, set independently |
| S16 | Beginner, `dumbbell-goblet-squat`, 3 × 10 | **8**. Advanced: **16** |
| S17 | Intermediate, `dumbbell-bulgarian-split-squat` (lunge), 2 × 10 | **8** per dumbbell |
| S18 | Beginner, `standing-db-lateral-raises` (dumbbell, small), 3 × 15 | **2** (2 − 2 → minimum 2) |
| S19 | Beginner, `kettlebell-swing` (kettlebell, hinge), 3 × 15 | **4** (6 − 2 = 4, minimum 4). Intermediate 3 × 12: **10** |
| S20 | Beginner, `kettlebell-turkish-get-up` (core) | **4** |
| S21 | Beginner, `ez-bar-curl` (ez-bar, iso_upper), 3 × 12 | **10**. 3 × 15: **10** (7.5 is below the minimum) |
| S22 | Advanced, `hex-bar-deadlift`, 3 × 8 | **60** |
| S23 | Intermediate, `leg-press-quad-dominant` (plate-loaded, squat), 3 × 10 | **40** plates added |
| S24 | Beginner, `smith-machine-squat` | **20** |
| S25 | Beginner, `single-arm-lat-pulldown` (cable, pull, unilateral), 3 × 10 | **10** (20 halved) |
| S26 | Beginner, `machine-leg-extension-single-leg` (machine, unilateral), 3 × 12 | **7.5** (15 halved) |
| S27 | Beginner, `cable-face-pull` (small because primary is Rear Delts), 3 × 15 | **2.5**. Intermediate 3 × 15: **2.5** (5 − 2.5) |
| S28 | Beginner, `cable-crunch` (core), 3 × 12 | **10** |
| S29 | Beginner, `seated-leg-curl-toes-dorsiflexed-neutral`, 3 × 12 | **15** |
| S30 | Beginner, `standing-calf-raises-toes-neutral` (machine, iso_lower), 3 × 15 | **12.5** |
| S31 | Intermediate, `barbell-good-morning`, 3 × 10 | **20** (override) |
| S32 | Advanced, `barbell-overhead-press`, 3 × 8 | **30** |
| S33 | Beginner, `barbell-bent-over-row`, 3 × 10 | **20** |
| S34 | Beginner, `dumbbell-farmers-carry` | **8** per dumbbell |
| S35 | `machine-assisted-pull-up` or `machine-dip-assisted`, any level | `weight` null, empty field, current "find your weight" text (2.5) |
| S36 | `band-assisted-pull-up` | Reps only |
| S37 | Intermediate `barbell-bench-press` 3 × 8, each goal × each activity level × each session length | **30** in every combination |
| S38 | Experience missing (no profile), `dumbbell-bench-press` 3 × 10 | **6** (beginner column) |
| S39 | S1 logged as 20 × 8, 8, 8, then the next Lower A (target 8) | Normal engine: **22.5**, `reached_top_of_range`. First session is labelled Baseline, no PR |
| S40 | S1, but the user changes the field to 60 and logs 60 × 8, 8, 8 | Next: **62.5**. The suggestion (20) is never used as history |
| S41 | First exposure, the user types 250 on a barbell exercise | F13 confirmation before saving |
| S42 | First exposure, the user clears the field | F5: Done disabled, "Enter weight" |
| S43 | Exercise logged before only at 0 kg (F6), beginner `back-squat` 3 × 8 | Treated as a first exposure: **20** |
| S44 | AI on, first exposure | The number equals the table value. The AI cannot change it |
| S45 | Invariant over all 8 templates × every experience, equipment and activity value, no history | Every loaded exercise gets a number ≥ the equipment minimum, on the grid, never 0, never above the F13 limit. Bodyweight and band never show kg. Excluded exercises stay null |
| L1 | First-time straight dumbbell card, EN and ES | Order: suggestedDumbbell, warmup, effort (changed), same, adjust (changed), dumbbell, log. No English in ES |
| L2 | First-time pyramid card | suggestedSets, warmup, effort, pyramid, adjust, log |
| L3 | First-time drop-set card | suggestedDrop with both numbers |
| L4 | Excluded exercise card | Old text and old effort line, no "Suggested start" |

The expected values are worked out by hand from this table and have not been run in code. If a case fails, send it back to
the PT. Do not change the expected value.

## ⚠️ Open decisions
1. ⚠️ REVISAR (PO): the table values are my coaching judgement and deliberately light. Stronger users will find them light
   and change them. Confirm that this direction of error is acceptable.
2. ⚠️ REVISAR (PO): the smith machine uses the barbell numbers, logged as the total including the bar (like barbells). Smith
   bars vary (some are counterbalanced). How do you log smith exercises today: total, or plates only?
3. ⚠️ REVISAR (PO): plate-loaded numbers are **plates added**, not counting the sled or arms. Confirm this matches how you log
   leg press, hack squat and T-bar row.
4. ⚠️ REVISAR (PO): hex bars weigh about 20-30 kg depending on the gym. I used a minimum of 20 and a beginner value of 30, so the
   value can be loaded on most hex bars.
5. ⚠️ REVISAR (Tech Lead): the machine minimum (5) and cable minimum (2.5) assume common stacks. Some gyms start higher. The
   user changes the field. No gym-specific setting is proposed.
6. ⚠️ REVISAR (Tech Lead): the class rule uses `primary_muscles`, `body_region` and `laterality`. If the engine does not get
   these fields yet, it needs them from the catalogue. No new catalogue data is needed.
7. Approval effect: when approved, this replaces F1 and the "no estimates" part of F2 in `approved/2026-11-01-…` section 3 and
   the matching test cases F1-F4 and F7 (weight null → table value). F5, F6 and F8-F20 stay. T92 and the L1 wording test change.
8. AI Trainer release checklist applies: PT pre-merge review, invariants (S45), replay, and the QAer week flow with a
   first-time exercise on each equipment type.

## Sources
- American College of Sports Medicine (2009). Position Stand: Progression models in resistance training for healthy adults.
  *Med Sci Sports Exerc* 41(3):687-708. Light-to-moderate loads and higher reps for novices.
- Haff GG, Triplett NT (eds.) (2016). *Essentials of Strength Training and Conditioning*, 4th ed., NSCA. Assigning loads to
  untrained clients by conservative trial and adjustment instead of max testing.
- Helms ER et al. (2016). Application of the repetitions in reserve-based RPE scale for resistance training. *Strength Cond J*
  38(4):42-49. The basis of the "about 3 reps left" margin.
- Halperin I et al. (2022). Accuracy in predicting repetitions to task failure in resistance exercise. *Sports Med* 52:377-390.
  New lifters misjudge effort, so the margin and a light start matter.
- Common published strength-standard tables (for example ExRx.net), used only as a rough check that the values sit at the light
  end for lighter, less-trained adults. No values were copied.
- GymStudio approved documents: `2026-11-01-first-run-and-same-day-start.md` (F1-F13), `2026-10-07-progression-engine-spec.md`
  (R3 drop set, R4 deload, R5, guardrail), `catalogue-v2-spec.md`. Code read: `src/trainer/engine.ts`
  (`firstSessionProtocol`, `firstSessionWeight`, `equipmentStep`, deload branch), `src/i18n/sections/workout.ts`,
  `docs/fitness/approved/templates/tpl-4d-upper-lower-gym.json`, `docs/fitness/approved/training-blocks/blocks.json`.
