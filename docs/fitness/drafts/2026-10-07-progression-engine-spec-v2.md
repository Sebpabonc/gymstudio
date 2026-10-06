---
title: Progression engine - PT spec v2 (amendment to the approved 2026-10-07 spec, from the block-6 replay)
status: draft
author: pt-fitness-expert
created: 2026-10-07
approved_by:
approved_on:
exercises: [incline-dumbbell-press, dumbbell-bench-press, plate-loaded-t-bar-row-chest-supported, cable-lat-pulldown-underhand-grip, high-cable-fly, cable-straight-arms-pull-downs, cable-crunch, smith-machine-shoulder-press, dumbbell-curl-incline, rope-low-cable-oh-tricep-extensions, ez-bb-preacher-curls, reverse-pec-deck-fly, standing-db-lateral-raises, cable-lateral-raise]
---

## Summary
Replaying Sebas's real logs through the engine for block 6, week 1 (today 2026-10-07) showed seven
results a coach would not give: +80 % on the reverse pec deck, +20 % on the cable crunch, lower loads after
a rep-range change even when the reps had already been done at the old load, "increase reps" with no extra
reps, a reverse pyramid built from straight-set history, and +1 step after a session where not all sets used
the working load. This amendment changes R8 and the "exceeded target" check, and adds rules R12-R18.
Everything not listed here stays as approved in `docs/fitness/approved/2026-10-07-progression-engine-spec.md`
(R1-R11, T1-T29) and in today's approved PT changes (coarse-step guard on rep-range conversion, never 0 kg,
two misses drop one step).

Replay assumptions (same as the engine): Epley e1RM from logged reps, no logged RIR, reps capped at 15;
steps are dumbbell 2, barbell / Smith / plate-loaded 2.5, machine / cable 5 unless changed by R12.

## Exercises
No new exercises and no new technique cues. All ids already exist in the catalogue.

## Changes to approved rules

| Approved rule | Change | New rule |
|---|---|---|
| Definitions, "Step" | Step can come from an exercise setting or from logged loads; unverified default machine/cable steps get a jump cap | R12 |
| "Unchanged: rep-range conversion through capacity" | Conversion may not drop below the load that matches what was already done | R13 |
| Straight-set "exceeded target" (every set ≥ max + 3) and R8 trigger | "Too easy" = all sets at the top of the range and at least half of them 3+ reps above it | R14 |
| R7 / R8 / increase_reps everywhere | The reps shown must be more than last time | R15 |
| R8 | Cable crunch (trunk flexion) progresses reps first, max one step | R16 |
| R1 / R2 (pyramid history) | A pyramid-tagged session with one load on every set is straight-set history | R17 |
| Straight-set "reached top → +1 step" | Add load only when every working set used the working load | R18 |

## New rules (in engine order)

Order inside `recommend` for straight sets (pyramid order in R17):
1. Resolve the step (**R12a**), before anything else.
2. Existing: follower (R5), deload (R4), no history, long break (R11), pyramid branch (R1/R2 with **R17**).
3. Existing: bodyweight (R7).
4. Light loads (R8), using the **R14** "too easy" trigger and **R16** for crunch.
5. Rep-range conversion (existing, including today's coarse-step guard), then the **R13** floor.
6. Normal straight-set steps, using the **R14** "too easy" check.
7. Calibration (approved continuous-learning rules).
8. **R12b** jump cap, then **R18** "all sets at the working load".
9. Existing 0 kg floor (today's approved rule).
10. **R15** rep display for every `increase_reps` result.

### R12 - Real machine steps and a jump cap (replay item 1)
**R12a - Step resolution** (machine and cable only), first match wins:
1. **Configured step** for this exercise id (a per-exercise setting Sebas fills in; see ⚠️ REVISAR 2).
2. **Inferred step**: the largest value in {5, 2.5, 1.25} that divides **every** load ever logged for this
   exercise (main sets, drops included). Example: 6.25 → 1.25; 12.5 and 15 → 2.5; 22.5 → 2.5; 25, 60, 65 → 5.
3. **Default** 5 kg.
A step from 1 or a smaller step from 2 counts as **verified**. A 5 kg step from 2 or 3 is **unverified** (it may just be the default).
Dumbbells, barbells, Smith and plate-loaded keep their fixed steps (2 / 2.5); no inference.

**R12b - Jump cap** (machine/cable with an **unverified** step only): if
`(newLoad - lastWeight) / lastWeight > 0.15`, keep `lastWeight`, action `increase_reps`
(reason `light_load_add_reps`). Applied after every other rule that can add load (R8, normal steps,
conversion's "original too easy", calibration). A verified step is always allowed (otherwise the lightest
pin could never progress).

### R13 - Rep-range conversion never drops below what was already done (replay item 2)
Applies when today's range differs from the last session's (the existing conversion path), after
today's coarse-step guard (which still runs first and wins when one step is > 10 % of the load).
- `rDone` = **median** reps of the last session's progression sets that used the working load
  (mode load; even count = mean of the two middle values).
- If `target.min ≤ rDone`: `floor = lastWeight`.
- Else: `floor = roundDown(lastWeight × (1 + rDone/30) / (1 + target.min/30), step)` (same effort as
  last time, at today's reps).
- Result = `max(conversionResult, floor)`, then the existing guardrail (cap above last load).
Reason stays `converted_rep_range`; action from the final load vs `lastWeight`.

### R14 - "Too easy" when half the sets beat the top by 3+ (replay item 3)
`tooEasy = complete AND every progression set ≥ target.max AND count(sets ≥ target.max + 3) ≥ ceil(n / 2)`
(n = planned sets).
- Replaces "every set ≥ max + 3" in the straight-set "exceeded target" check (same capacity jump and guardrail as today).
- R8 trigger becomes: `every set ≥ target.max + 2` **OR** `tooEasy`. R8's +1 step and reset to the bottom of the range are unchanged.
- Never for bodyweight with no load (R7 unchanged).

### R15 - "Increase reps" must ask for more reps (replay item 4)
For every `increase_reps` result: `mLast` = the **lowest** reps among the last session's progression sets at the recommended load
(all progression sets if none match).
`reps = { min: max(target.min, mLast + 1), max: max(target.min, mLast + 2) }`.
This is what T19 (13-14), T22 (16-17) and T24 ("needs 14") already describe; the engine must show it.

### R16 - Cable crunch: reps first, at most one step (replay item 5)
For `cable-crunch` (and later other trunk-flexion exercises, ⚠️ REVISAR 6):
- Add load only when `every set ≥ target.max + 2` (R8 logic) for **any** step size; never the capacity "exceeded" jump.
- Increase = exactly +1 step; R12b also applies when the step is unverified.
- Otherwise `increase_reps` (R15).

### R17 - Uniform "pyramid" history is straight-set history (replay item 6)
A past session tagged `pyramid` / `reverse-pyramid` whose progression sets all used **one load** is not
pyramid history (the user did straight sets). R1.1 / R2.1 skip it; if no real pyramid session remains, the
pyramid is built with **R1.3** from capacity (and that session still counts for capacity).
If the R1.3 top-set load equals the last working load, the action is `maintain` (not `increase_weight`).
R4 deload and R11 long break keep using that session's loads as logged.

### R18 - Add load only when every working set used the working load (replay item 7)
Straight sets only (pyramids and drop parts are lighter by design):
`allAtLoad = every progression set weight ≥ workingWeight(last progression sets)`.
If `allAtLoad` is false and the result would be above `lastWeight`: recommend `lastWeight` on all sets,
action `maintain`, new reason `consolidate_load` (name for the Tech Lead to confirm). Decreases are not affected.

## Test cases (exact numbers, Sebas's real logs unless marked "variant")
Today 2026-10-07, last session 7 days ago, week 1 (full intensity), one session of history unless stated.

| # | Rule | Input | Expected |
|---|---|---|---|
| T30 | R12b | `reverse-pec-deck-fly` drop "12+12", target 12, no step setting, logged loads only 6.25 → inferred step **1.25 (verified)**. Last 6.25×15 ×4 | R8: 1.25/6.25 = 20 % > 10 %, all 15 ≥ 14 → **7.5**, reps 12; drop 0.75×7.5 = 5.6 → **5**. (Today's replay gave 11.25 = +80 %.) |
| T31 | R12b | Same, but step forced to an **unverified** 5 | 11.25 = +80 % > 15 % → **6.25**, increase_reps, reps **16-17** (R15); drop 0.75×6.25 = 4.7 → 0 → 0 kg floor → **5** |
| T32 | R12a | `high-cable-fly` target 12, last 12.5×13, 15×12, 12.5×12 → inferred step **2.5** | Working 12.5; 2.5/12.5 = 20 % → R8; not all ≥ 14, not tooEasy → **12.5**, increase_reps **13-14** (R15, mLast 12 from the 12.5 sets) |
| T33 | R12a | `cable-straight-arms-pull-downs` target 12, last 22.5×12 ×3 → step **2.5** | 11 % > 10 % → R8 → **22.5**, increase_reps **13-14** |
| T34 | R12/R16 | `cable-crunch` drop "10+10", target 10, last 25×12 ×3, step unverified 5 | R16: 12 ≥ 12 → +1 step = 30 → R12b: +20 % > 15 % → **25**, increase_reps **13-14**; drop 0.75×25 = 18.75 → **15**. (Replay gave 30.) |
| T35 | R16 | Same with configured step 2.5 | 12 ≥ 12 → **27.5**, reps 10; drop 0.75×27.5 = 20.6 → **20** |
| T36 | R16 | Variant: same, step 2.5, last 25×11 ×3 | 11 < 12 → **25**, increase_reps **12-13** (normal rules would have given 27.5) |
| T37 | R13 | `dumbbell-bench-press` today 12, last target 10, last 30×12, 30×10, 30×10 | e1RM (42+40+40)/3 = 40.67, low → load(12, 2) = 27.7 → down 26. rDone = 10 < 12 → floor 30×1.333/1.4 = 28.57 → **28**. Result **28** decrease_weight (replay gave 26) |
| T38 | R13 | `cable-lat-pulldown-underhand-grip` today 12, last target 10, last 65×10, 60×11, 65×11 (step 5, 5/65 = 7.7 %) | Working 65; e1RM avg of all sets ≥ 58.5 = (86.67+82+86.67)/3 = 85.1 → load(12, 2) = 58.0 → down 55. rDone at 65 = median(10, 11) = 10.5 → floor 65×1.35/1.4 = 62.7 → **60**. Result **60** (replay gave 55) |
| T39 | R13 | `plate-loaded-t-bar-row-chest-supported` today 10, last 30×12, 30×12, 30×8 (target differs) | conversion 40.67/1.4 = 29.05 → down 27.5; rDone = median(12, 12, 8) = 12 ≥ 10 → floor **30**. Result **30**, maintain (replay gave 27.5) |
| T40 | R14 | `rope-low-cable-oh-tricep-extensions` target 12, 4 sets, last 20×12, 20×12, 20×15, 20×15, step unverified 5 | tooEasy (all ≥ 12; 2 of 4 ≥ 15) → R8 +5 = 25 → R12b +25 % → **20**, increase_reps **13-14** |
| T41 | R14 | Same with configured step 2.5 | 12.5 % > 10 % → R8; tooEasy → **22.5**, reps **12** |
| T42 | R14 | Variant: `incline-dumbbell-press` target 8, last 26×12, 26×12, 26×9 | Old check: not every set ≥ 11 → reached_top. New: 2 of 3 ≥ 11 → exceeded_target: e1RM (36.4+36.4+33.8)/3 = 35.53, low → load(8, 2) = 26.65 → down 26; max(26, 28) = 28; guardrail 28.6 → **28**, reason **exceeded_target** (same load; with 2 kg steps the guardrail decides) |
| T43 | R15 | `dumbbell-curl-incline` target 12, last 10×12 ×3 (2/10 = 20 % → R8) | **10**, increase_reps **13-14** (replay showed 12-12) |
| T44 | R15 | `ez-bb-preacher-curls` target 12, 4 sets, last 6×12 ×4 | **6**, increase_reps **13-14** |
| T45 | R15 | `cable-lateral-raise` today 20, last target 15, last 5×15, 5×14, 5×15, 5×14 | Coarse guard (approved) → **5**, increase_reps; R15: max(20, 15) .. max(20, 16) = **20-20** (same as today's approved test) |
| T46 | R17 | `plate-loaded-t-bar-row-chest-supported` reverse-pyramid [8, 10, 12], last session tagged reverse-pyramid but 30×12, 30×12, 30×8 | Uniform → R1.3: e1RM 40.67, low → load(8, 1) = 31.3 → down **30**; 10: 30×1.3/1.4 = 27.9 → **27.5**; 12: 30×1.3/1.467 = 26.6 → **27.5** → **30 / 27.5 / 27.5**, action maintain (replay gave 32.5/30/30) |
| T47 | R18 | `smith-machine-shoulder-press` target 8, last 20×10, 22.5×10, 22.5×10 | Working 22.5; set 1 at 20 → **22.5** on all 3 sets, maintain, consolidate_load (replay gave 25) |
| T48 | R18 | `cable-lat-pulldown-underhand-grip` target 10 (same range), last 65×10, 60×11, 65×11 | Set 2 at 60 → **65**, maintain (replay gave 70) |
| T49 | R18 | Control: `dumbbell-bench-press` target 10, last 30×12, 30×10, 30×10 | All at 30 → **32** reached_top (unchanged) |

### Consistency with approved tests
- **T1-T29 unchanged.** Checked one by one against R12-R18:
  - Machine/cable with default step: T10 (40→45, +12.5 %), T12 (50→55, +10 %), T25 (45→50, +11 %) stay under the 15 % cap; T11, T24 do not increase. Their loads (40, 45, 50) are multiples of 5, so R12a keeps step 5.
  - R14: T22 (15,15,15 vs max 15: none ≥ 18), T24, T29 (none ≥ max + 3) - same result. Bodyweight T19/T20 not affected.
  - R15 matches the aims already written in T19, T22, T24.
  - R17: T5, T6 (non-uniform pyramid history), T7, T8 (no pyramid history) and deload/long-break T13, T14, T26 unchanged.
  - R18: every T case with straight sets uses one load per session. Drop-sets (T10-T12) compare main parts only.
- **Today's approved changes:** the cable lateral raise conversion (5 kg, increase_reps, never 0) is T45, unchanged; two misses on a coarse step still drop exactly one step (R13 does not run on that path); the 0 kg floor stays last (T31).
- **Existing engine tests:** "Monday 10×14 → Thursday 12" (original_too_easy, 12 kg) is unchanged (R13 does not run on that path; R12b not relevant to dumbbells). "30×10 (8-10) → 12-15": conversion load(12,2) = 27.3 → 28 (medium, nearest); R13 floor 30×1.333/1.4 = 28.57 → 28 → still **28**, converted_rep_range.
- Calibration tests: R12b/R18 run after calibration; all calibration tests use one load per session and 2.5 kg steps, so no change expected. ⚠️ REVISAR 8: Tech Lead to confirm by running the suite.

## ⚠️ Open decisions (PT recommendation in bold)
1. ⚠️ REVISAR: Approve R12-R18 and the changes to R8 / "exceeded target" → **approve**.
2. ⚠️ REVISAR - machine facts I need (each sets a configured step, R12a.1). **Recommendation: answer what you know; anything left uses inference + the 15 % cap.**
   - `reverse-pec-deck-fly`: 6.25 kg means a 1.25 kg add-on. Is the smallest change 1.25 kg?
   - Cable tower used for `high-cable-fly`, `cable-straight-arms-pull-downs`, `cable-lateral-raise`, `rope-low-cable-oh-tricep-extensions`, `cable-crunch`: your logs show 12.5 and 22.5, so it seems to move in 2.5 kg. Same tower for all of them? Smallest step 2.5?
   - `cable-lat-pulldown-underhand-grip` stack: 5 kg steps (your 60/65)? Any add-on weight?
   - Leg machines in lower-body A/B (`plate-loaded-pendulum-squat`, `seated-leg-curl-toes-dorsiflexed-neutral`, `leg-extensions-toes-dorsiflexed-neutral`, `standing-calf-raises-toes-neutral`): stack step or plates?
3. ⚠️ REVISAR - dumbbell facts: does your gym have only even sizes (10, 12, 14...) or also odd / 1 kg / 2.5 kg jumps above 10 kg? **Keep 2 kg unless you tell me otherwise** (T23 relies on it).
4. ⚠️ REVISAR: `ez-bb-preacher-curls` logged at 6 kg. Is that the plates only (bar not counted) or the whole bar? **Recommend logging the total including the bar**; the step stays 2.5 until you confirm.
5. ⚠️ REVISAR: jump cap 15 % for unverified machine/cable steps → **yes**. (10 % would block T10/T25; 20 % would let the crunch jump 25→30.)
6. ⚠️ REVISAR: R16 only for `cable-crunch` now; extend to other ab exercises when they enter the program → **yes**.
7. ⚠️ REVISAR: T46 gives the T-bar top set 30 × 8 when you already did 30 × 12. That is because one mixed session is low confidence (round down). **Accept it for one week**; the top set then goes +2.5 on its own history (R1.1).
8. ⚠️ REVISAR: R18 also means a logged warm-up set counted as a working set blocks the increase. **Recommend logging warm-ups apart (or not at all)**, not changing the rule.
9. Engine changes still need a PT test-case review before merge (approved rule) → **yes**.

## Sources
- Epley B. (1985) *Poundage Chart*, Boyd Epley Workout (e1RM formula).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments, the "2-for-2" style rule behind R14).
- Helms E., Morgan A., Valdez A., *The Muscle and Strength Pyramid: Training*, 2nd ed. (reps-first progression on small increments).
- `docs/fitness/approved/2026-10-07-progression-engine-spec.md` (R1-R11, T1-T29).
- Replay output, block 6 week 1, 2026-10-07 (scratchpad `replay.txt`, Tech Lead).
