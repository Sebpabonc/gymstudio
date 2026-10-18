---
title: Default sets, reps and rest for a user-created exercise
status: approved
author: pt-fitness-expert
created: 2026-10-18
approved_by: Sebas (PO) — "lo que el PT / researcher decide" (PT recommendations)
approved_on: 2026-10-18
exercises: []            # applies to user-created (non-catalogue) exercises; no catalogue ids involved
---


> **PO decision 2026-10-18:** delegated to the PT; every ⚠️ REVISAR item takes the PT's recommended option (keep 10–15 for bodyweight; this rule covers user-created exercises only). Tech Lead: the builder rest picker must offer the Profile values (60–180 s).

## Summary
When a user adds their own (non-catalogue) exercise to a custom day, the builder pre-fills a
prescription the user can always change. Today it is 3 sets × 8–10 reps, 90 s rest
(`startAddingCustomExercise`, `src/components/WorkoutPlan.tsx`). I propose **3 sets**, a rep range
picked by a 3-way rule (equipment + Core), and **rest = the user's Profile "Rest between sets"
(default 2:00)**. Simple, safe for regular gym-goers, and consistent with the 2:00 rest the PO chose.

## Exercises

This document has no catalogue exercises. It defines one rule for user-created exercises.

### Rule: default prescription for a user-created exercise
- **Sets:** always **3**.
- **Rep range** (first matching row wins):

  | # | Condition | Default reps | Why |
  |---|---|---|---|
  | 1 | Muscle group = **Core**, or Equipment = **Bodyweight** | **10–15** | Core and bodyweight moves are usually done for higher reps; there is no load to drop, so a slightly higher range is easier to hit with good form. |
  | 2 | Equipment = **Barbell** | **6–10** | Barbell lifts are usually the heaviest, most technical moves of the day; a slightly lower range matches how mainstream programs use them. |
  | 3 | Anything else (Dumbbell, Machine, Cable, Other, or equipment not chosen yet) | **8–12** | The standard general-purpose hypertrophy/strength range for novice-to-intermediate lifters. |

- **Muscle group does not change the default**, except Core (row 1). Chest, Back, Shoulders, Arms,
  Legs and Glutes all follow the equipment rule. Splitting further adds complexity without a clear
  benefit, since the user can change it with one tap.
- **Rest:** pre-fill with the user's Profile setting "Rest between sets" (`loadRestBetweenSets()`,
  options 60/90/120/150/180 s, default **120 s = 2:00**). Do not vary rest by equipment or muscle.
  ⚠️ REVISAR (Tech Lead): the builder's rest picker only offers 60/90/120 s; it should offer the same
  5 options as Profile, or a 150/180 s Profile value cannot be shown. Workout mode already uses the
  Profile value for the rest timer, so this mainly makes the plan line honest.
- **Change from today:** 8–10 → 8–12 (row 3) and 90 s → Profile rest (2:00 by default). 3 sets stays.
- **Notes:**
  - These are starting points, not progression rules. The AI Trainer must not recommend loads for a
    user-created exercise from this document (and never for Equipment = Other) without a separate,
    approved PT rule.
  - If the user later edits equipment or muscle group, do **not** silently rewrite sets/reps they
    already saved. Defaults apply only when the exercise is first added to a day.
  - No pain/injury guidance is implied. If an exercise causes pain, the user should stop and see a
    qualified professional.

### Test cases (the "3 sets · X reps · rest" line shown when adding to a custom day)

| # | Muscle group | Equipment | Profile rest | Expected default |
|---|---|---|---|---|
| T1 | Chest | Barbell | not set | 3 × 6–10, 120 s |
| T2 | Back | Cable | not set | 3 × 8–12, 120 s |
| T3 | Legs | Machine | 90 s | 3 × 8–12, 90 s |
| T4 | Arms | Dumbbell | 180 s | 3 × 8–12, 180 s |
| T5 | Core | Cable | not set | 3 × 10–15, 120 s (Core beats equipment) |
| T6 | Core | Barbell | not set | 3 × 10–15, 120 s (row 1 wins over row 2) |
| T7 | Back | Bodyweight | 60 s | 3 × 10–15, 60 s |
| T8 | Glutes | Other | not set | 3 × 8–12, 120 s |
| T9 | Shoulders | (not chosen yet / legacy exercise with no equipment) | not set | 3 × 8–12, 120 s |
| T10 | Legs | Barbell | 150 s | 3 × 6–10, 150 s (picker must be able to show 150 s) |
| T11 | User edits T1 to 4 × 5, then changes equipment to Dumbbell | — | — | Stays 4 × 5 (no silent rewrite) |

## ⚠️ Open decisions
- ⚠️ REVISAR (PO): Bodyweight 10–15 fits push-ups, crunches, lunges, but is too high for many people
  on pull-ups or dips. Accept it (user changes it), or use 8–12 for bodyweight too and keep 10–15 for
  Core only? My recommendation: keep 10–15; most user-created bodyweight moves are the easier ones.
- ⚠️ REVISAR (PO): Should a **catalogue** exercise added to a custom day use the same rule (using its
  catalogue equipment)? This draft only covers user-created exercises, as asked; I would support
  using the same rule for both so the builder behaves the same way.
- ⚠️ REVISAR (Tech Lead): builder rest options (60/90/120 s) vs Profile options (60–180 s), see above.
- Barbell 6–10 is a deliberate, small difference from 8–12. If the PO prefers one single default for
  everything, use **3 × 8–12, Profile rest** for all rows except Core/Bodyweight; that is also safe.

## Sources
- American College of Sports Medicine (2009). Position Stand: Progression models in resistance
  training for healthy adults. *Med Sci Sports Exerc* 41(3):687–708 (moderate loads ~8–12 reps and
  multiple sets for novice/intermediate hypertrophy; longer rest for heavier multi-joint lifts).
- Schoenfeld BJ et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in
  resistance-trained men. *J Strength Cond Res* 30(7):1805–1812.
- Singer A et al. (2024). Give it a rest: a systematic review with Bayesian meta-analysis on the
  effect of inter-set rest interval duration on muscle hypertrophy. *Front Sports Act Living* 6.
  (Rests above ~60 s show a small advantage; little difference beyond ~90 s.)
- Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW (2017). Strength and hypertrophy adaptations between
  low- vs. high-load resistance training: a systematic review and meta-analysis. *J Strength Cond Res*
  31(12):3508–3523 (similar hypertrophy across rep ranges when sets are taken close to failure).
- Schoenfeld BJ, Ogborn D, Krieger JW (2017). Dose-response relationship between weekly
  resistance training volume and increases in muscle mass. *J Sports Sci* 35(11):1073–1082.
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (Haff & Triplett, 2016),
  program design chapter (rep and rest assignments by training goal).
- App context read: `src/components/WorkoutPlan.tsx` (`startAddingCustomExercise`, rest picker),
  `src/utils/storage.ts` (`loadRestBetweenSets`, default 120 s),
  `docs/ux/proposals/2026-10-18-simple-find-and-create.md` §4 step 5,
  `docs/ux/proposals/2026-10-18-workout-mode-aligned.md` §3.5 (PO: rest 2:00).
