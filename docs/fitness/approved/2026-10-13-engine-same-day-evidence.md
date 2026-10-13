---
title: Progression engine - achieved-load floor on rep-range changes, A/B split evidence (amendment R20-R24)
status: approved
author: pt-fitness-expert
created: 2026-10-13
approved_by: Sebas (PO)
approved_on: 2026-10-13
exercises: [incline-dumbbell-press, dumbbell-bench-press, smith-machine-shoulder-press]
---

## Summary
In block-2026-10-05 (A = low reps, B = high reps or pyramid) the engine converts the most recent session
(Epley) to the next day's rep range and can recommend loads **below what Sebas already lifted** for those reps.
PO decisions 2026-10-13: the most recent session of the exercise (any day) is the primary evidence; a
rep-range change starts from the last load only when at least half the sets reached the new target, with the
load recalculated from the whole series; loads already achieved are a floor; pyramid sets are filled upward.
This amendment adds R20-R24. R1-R19 stay as approved; R13 is restated (same math) in R21.

## Exercises
No new exercises, no new technique cues. Ids: `incline-dumbbell-press` (dumbbell, step 2),
`dumbbell-bench-press` (dumbbell, step 2), `smith-machine-shoulder-press` (Smith, step 2.5).

## Problem (real logs, block-2026-10-05)
| Exercise | Most recent (any day) | Previous same day | Engine now |
|---|---|---|---|
| incline-dumbbell-press, Day B Thu 15 Oct, pyramid 14/12/10 | Mon 12 Oct (6-8): 30×10, 30×8, 30×8 | Thu 8 Oct: 28×14, 28×12, 28×12 | 24/26/28 (below 28, already done for every target) |
| smith-machine-shoulder-press, Day B Fri 16 Oct (3×10) | Mon 13 Oct (8): 25×10, 25×8, 25×8 | Fri 9 Oct: 22.5×12 ×3 | 22.5×10 (no progression after +2 reps on every set) |
| dumbbell-bench-press, Day B (3×12) | Day A (10): 30×12, 30×10, 30×10 | not supplied | 28×12, decrease_weight |

## Rules (engine order: after R12a, R5, R4, R11; before R12b and the 0 kg floor)

### R20 - Primary evidence = most recent session, any day
The most recent non-deload session of the exercise, regardless of `dayKey`, is the primary evidence.
R4 deload and R11 long break keep priority over R20-R23.

### R21 - Rep-range change: whole-series recalculation (restates R13)
On the conversion path (today's rep target differs from the last session's):
- `n` = number of progression sets in the last session at the working load `lastWeight`;
  `rSeries` = **median** reps of those sets (even count = mean of the middle two). Using the median of the
  whole series means one strong first set cannot carry the result.
- `e1RMseries = lastWeight × (1 + rSeries/30)`.
- `floor(t)` for a rep target `t`:
  - if `rSeries ≥ t` (equivalently, at least half the sets reached `t`) → `floor(t) = lastWeight`
    (start from the last load, adjust reps);
  - else → `floor(t) = roundDown(e1RMseries / (1 + t/30), step)`.
- Result = `max(conversionResult, floor(t))`. For straight sets `t = target.min`; for a pyramid, `t` = each
  set's target. This is exactly the approved R13 math, now also applied per pyramid set; R19 still runs on a
  miss with a coarse step; R17b's cap `min(load, lastWeight)` stays.

### R22 - Achieved-load floor (any day, 28 days)
For each set with rep target `t`, unless deload (R4), long break (R11) or a miss-drop rule (two misses / R19)
applies today:
- **Pyramid set:** `floor = heaviest load of any single set with reps ≥ t` in the last 28 days, non-deload sessions.
- **Straight sets:** `floor = heaviest load at which every working set of one session reached ≥ t` (same window).
- Result = `max(result, floor)`. Not cut by R12b (that load was already lifted for those reps).

### R22b - Pyramid fill (built pyramids)
When a pyramid is built from straight history (R1.3), after R21/R22: going from the low-rep (heaviest) set
toward the high-rep sets, each set is at least `next set − 1 step`. Never above the next set (shape stays
non-decreasing toward the low-rep set). Example: 24/26/30 → **26/28/30**.

### R23 - Same-day history as a secondary boost
If a previous session with the same `dayKey` in the block exists and, judged alone with today's targets, it earns
+1 step (R8, R14, or reached top; pyramids per set: reps ≥ target + 2), then `boost = sameDayLoad + step`, capped at
the most recent session's load for that set. Result = `max(result, boost)`, then R12b and the 0 kg floor.
Never lowers a load.

### R24 - One evidence path for every screen
- "Next (day)", the day card and the next-week preview call the same `recommend` with that day's targets.
- **Previous column:** the most recent session of the exercise, any day (e.g. `Mon 13 Oct: 25×10·8·8`).
  No extra same-day line (PO 2026-10-13).
- UI wording (Tech Lead): when the load is below the latest load only because the rep target went up, say
  "adjusted to N reps", not "decrease".

## Expected outputs for the real cases (whole-series computation)

**incline-dumbbell-press, Day B Thu 15 Oct, pyramid [14, 12, 10], step 2**
- Latest Mon: 30×10, 30×8, 30×8 → rSeries = 8, e1RMseries = 30 × 1.267 = 38.0. Half-reached rule: 8 < 10/12/14 for all sets.
- R1.3 conversion: 24 / 26 / 28. R21 floors: 14 → 38.0/1.467 = 25.9 → 24; 12 → 38.0/1.4 = 27.1 → 26; 10 → 38.0/1.333 = 28.5 → 28.
- R22 (single set proof): 14 → 28 (Thu 28×14); 12 → 28 (Thu 28×12); 10 → 30 (Mon 30×10).
- R22b: 28/28/30 already satisfies fill. R23: Thu set 3 28×12 vs 10 → boost 30 (cap 30), no change.
- R17b cap 30, R12b OK. Top = lastWeight → `maintain` (set 3 is +1 step vs Thu 8 Oct).
- **Expected: 28 / 28 / 30 kg × 14 / 12 / 10.** Day A "Next (Thu)" shows the same.

**smith-machine-shoulder-press, Day B Fri 16 Oct (3×10), step 2.5**
- Latest Mon: 25×10, 25×8, 25×8 → rSeries = 8 < 10 (only 1 of 3 sets reached 10 → not half) → R21 floor
  25 × 1.267 / 1.333 = 23.75 → 22.5. Conversion also 22.5.
- R22 straight: no session with all sets ≥ 10 at 25 → 22.5.
- R23: Fri 9 Oct 22.5×12 ×3; 2.5/22.5 = 11 % → R8; every set ≥ 12 → boost 25 (cap 25).
- R18 all at one load, R12b OK.
- **Expected: 25 kg × 10 (3 sets), maintain vs 25** (reason same-day boost). Previous: `Mon 13 Oct: 25×10·8·8`.

**dumbbell-bench-press, Day B (3×12), step 2**
- Latest Day A: 30×12, 30×10, 30×10 → rSeries = 10 < 12 (1 of 3 reached 12 → not half) → floor
  30 × 1.333 / 1.4 = 28.57 → 28. Conversion (low) 26 → max = 28.
- R22 straight: no session with all sets ≥ 12 at 30 → 28.
- R23: depends on the Thu 8 Oct Day B bench log (Tech Lead replay). If it earned +1 step at 28 → boost 30 (cap 30) → 30.
  If not, or no session → **28**.
- **Expected without a qualifying same-day session: 28 kg × 12, shown as "adjusted to 12 reps".**
- **T37 does not change (28).**

## Test cases (T53+)
| # | Rule | Input | Expected |
|---|---|---|---|
| T53 | R20-R22 | `incline-dumbbell-press` pyramid [14,12,10]; latest 30×10, 30×8, 30×8 (6-8); Thu 8 Oct 28×14, 28×12, 28×12 | **28/28/30**, maintain (now 24/26/28) |
| T54 | R21/R23 | `smith-machine-shoulder-press` 3×10; latest 25×10, 25×8, 25×8 (8); same-day 22.5×12 ×3 | **25×10**, maintain (now 22.5) |
| T55 | R21 half rule | Variant: latest 25×10, 25×10, 25×8, no same-day | rSeries 10 ≥ 10 → **25×10**, maintain |
| T56 | R21 | Variant: latest 25×10, 25×8, 25×8, no same-day | **22.5×10** |
| T57 | R21 (= T37) | `dumbbell-bench-press` today 12, last 30×12, 30×10, 30×10 | **28×12** (T37 unchanged) |
| T57b | R23 | Variant: plus same-day 28×12 ×3 (reached top, 7 % → not R8) | boost 30 → **30×12** |
| T58 | R22b | T53 without the Thu 8 Oct session | R21 24/26/28, R22 set 3 → 30, fill → **26/28/30** |
| T59 | R4 over R22 | T53 inputs, deload week | R4 deload loads; floors not applied |
| T60 | R22 window | Floor candidate 32×10 logged 35 days ago or in a deload | ignored → T53 unchanged |
| T61 | R24 | Mon 12 Oct Day A "Next (Thu)" for incline | **28/28/30 × 14/12/10**, identical to T53 |
| T62 | R24 | Previous column, Smith Fri 16 Oct | `Mon 13 Oct: 25×10·8·8` only |
| T63 | Miss over R21/R22 | `standing-db-lateral-raises` T50 inputs | R19 → **10×20** unchanged |

Consistency: T1-T52c keep their values (R21 = R13 math; R22 floors are at or below their results; R22b only
on R1.3-built pyramids - T46: 30/27.5/27.5 already within one step, T52: max 26 unchanged). Invariants hold.

## Open decisions
All answered by the PO 2026-10-13: half-the-sets rule with whole-series recalculation; pyramid fill
(26/28/30); 28-day window and one-set proof per pyramid set; no same-day line under Previous.
Remaining for the Tech Lead only: reason names (`same_day_boost`, `achieved_floor`) and the Thu 8 Oct bench log for the T57/T57b branch.

## Sources
- Epley B. (1985) *Poundage Chart* (e1RM).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments).
- Helms E. et al., *The Muscle and Strength Pyramid: Training*, 2nd ed.
- `docs/fitness/approved/2026-10-07-progression-engine-spec.md`, `docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md`.
