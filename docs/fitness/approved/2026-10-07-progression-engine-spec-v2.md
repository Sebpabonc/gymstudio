---
title: Progression engine - PT spec v2 (amendment to the approved 2026-10-07 spec, from the block-6 replay)
status: approved
author: pt-fitness-expert
created: 2026-10-07
approved_by: Sebas (PO)
approved_on: 2026-10-07
exercises: [incline-dumbbell-press, dumbbell-bench-press, plate-loaded-t-bar-row-chest-supported, cable-lat-pulldown-underhand-grip, high-cable-fly, cable-straight-arms-pull-downs, cable-crunch, smith-machine-shoulder-press, dumbbell-curl-incline, rope-low-cable-oh-tricep-extensions, ez-bb-preacher-curls, reverse-pec-deck-fly, standing-db-lateral-raises, cable-lateral-raise, wide-grip-chest-press]
---

## Summary
Replaying Sebas's real logs for block 6, week 1 (today 2026-10-07) showed seven results a coach would not
give: +80 % on the reverse pec deck, +20 % on the cable crunch, lower loads after a rep-range change even
when those reps had already been done at the old load, "increase reps" without more reps, a reverse pyramid
built from straight-set history, and +1 step after a session where not every set used the working load.
This amendment sets the machine/cable step to **2.5 kg** (Sebas's equipment answer), changes R8 and the
"exceeded target" check, and adds R12-R19. Everything else stays as approved in
`docs/fitness/approved/2026-10-07-progression-engine-spec.md` and in today's approved PT changes
(coarse-step guard on rep-range conversion, never 0 kg, two misses drop one step).

Engine assumptions: Epley e1RM from logged reps, no logged RIR, reps capped at 15.

## Equipment facts (answered by Sebas, 2026-10-07)
- Machines and cable stacks (reverse pec deck, cable tower, lat pulldown, chest press, leg machines): **2.5 kg** steps.
- Dumbbells: **2 kg** steps (even sizes only).
- Barbell, Smith, plate-loaded, added load on bodyweight work: 2.5 kg (unchanged).
- EZ-bar is logged as the **total including the bar**.
- Warm-up sets are logged **separately** (or not at all), never as main sets.

## Exercises
No new exercises and no new technique cues. All ids already exist.

## Changes to approved rules

| Approved rule | Change | New rule |
|---|---|---|
| Definitions, "Step": machine/cable 5 kg | Machine/cable **2.5 kg**; optional per-exercise step setting; final jump cap stated | R12 |
| "Unchanged: rep-range conversion through capacity" | Conversion may not drop below the load that matches what was already done | R13 |
| Straight-set "exceeded target" (every set ≥ max + 3) and R8 trigger | "Too easy" = all sets at the top of the range and at least half 3+ reps above it | R14 |
| R7 / R8 / any increase_reps | The reps shown must be more than last time | R15 |
| R8 | Cable crunch progresses reps first, at most one step | R16 |
| R1 / R2 (pyramid history) | A pyramid-tagged session with one load on every set is straight-set history | R17 |
| Straight-set "reached top → +1 step" | Add load only when every working set used the working load | R18 |
| Today's coarse-step guard on rep-range conversion | Higher rep target after a missed session may drop exactly one step | R19 |

## New rules (in engine order)

Order inside `recommend` for straight sets:
1. Resolve the step (**R12a**).
2. Existing: follower (R5), deload (R4), no history, long break (R11), pyramid branch (R1/R2 with **R17**).
3. Existing: bodyweight (R7).
4. Light loads (R8), using the **R14** trigger, and **R16** for the crunch.
5. Rep-range conversion (existing, including today's coarse-step guard with **R19**), then the **R13** floor.
6. Normal straight-set steps, with **R14** as the "exceeded target" check.
7. Calibration (approved continuous-learning rules).
8. **R12b** jump cap, then **R18**.
9. Existing 0 kg floor.
10. **R15** reps shown for every `increase_reps` result.

### R12 - Real steps and the final jump cap (replay item 1)
**R12a - Step:** a configured per-exercise step wins if set (none needed today). Otherwise dumbbell / kettlebell
**2**; machine / cable **2.5**; barbell / Smith / plate-loaded / added load **2.5**. No inference from logs.
Odd logged loads (e.g. 6.25 on the pec deck, an add-on or the machine's start weight) are kept and the
step is added to them: 6.25 → 8.75.

**R12b - Final jump cap:** one session's increase is at most
`max(1 step, min(+10 %, 2 steps))` above the last working load, rounded down to the step (the approved
guardrail, now applied as the **last** check after R8, conversion's "original too easy" and calibration).
When one step is > 10 % of the load, R8 already allows exactly **one step** and only after the reps
condition. No separate 15 % cap: with the real 2.5 kg step it would block the smallest possible change (see the old REVISAR 5).

### R13 - Rep-range conversion never drops below what was already done (replay item 2)
Runs on the existing conversion path, after today's coarse-step guard (which wins when one step is > 10 %).
- `rDone` = **median** reps of the last session's progression sets at the working load (even count = mean of the middle two).
- If `target.min ≤ rDone`: `floor = lastWeight`.
- Else: `floor = roundDown(lastWeight × (1 + rDone/30) / (1 + target.min/30), step)`.
- Result = `max(conversionResult, floor)`, then R12b. Reason `converted_rep_range`; action from final load vs `lastWeight`.

### R14 - "Too easy" when half the sets beat the top by 3+ (replay item 3)
`tooEasy = complete AND every progression set ≥ target.max AND count(sets ≥ target.max + 3) ≥ ceil(n / 2)`.
- Replaces "every set ≥ max + 3" in the straight-set "exceeded target" check (same capacity jump, then R12b).
- R8 trigger becomes `every set ≥ target.max + 2` **OR** `tooEasy` (still +1 step, reps reset to the bottom of the range).
- Not used for bodyweight with no load (R7 unchanged).

### R15 - "Increase reps" must ask for more reps (replay item 4)
`mLast` = lowest reps among the last session's progression sets at the recommended load (all sets if none match).
`reps = { min: max(target.min, mLast + 1), max: max(target.min, mLast + 2) }`.

### R16 - Cable crunch: reps first, at most one step (replay item 5)
For `cable-crunch` (other trunk-flexion exercises when they join the program):
add load only when `every set ≥ target.max + 2`, exactly +1 step, never the capacity "exceeded" jump;
otherwise `increase_reps` (R15).

### R17 - Uniform "pyramid" history is straight-set history (replay item 6)
A past session tagged `pyramid` / `reverse-pyramid` whose progression sets all used **one load** is skipped by
R1.1 / R2.1; with no real pyramid session left, the pyramid is built with **R1.3** (the session still counts
for capacity). If the R1.3 top load equals the last working load, the action is `maintain`.
R4 and R11 keep using that session's loads as logged.

### R17b - Pyramid built from straight history (PT pre-merge review, 2026-10-07)
When R1.3 builds a pyramid and the most recent session was single-load (any tag), no pyramid set may go above that
session's working load unless (a) the two most recent sessions were both single-load at that load and both
reached the top of their own range, or (b) the most recent session was R14 tooEasy. Cap every R1.3 load with
`min(load, lastWeight)`, then R12b and the 0 kg floor; top = lastWeight → `maintain`.
Tests: **T52** incline DB pyramid [14,12,10], last 26×12 ×3 (target 12) → max 26, non-decreasing, maintain;
**T52b** last 26×15 ×3 → top 28; **T52c** two sessions 26×12 ×3 → top 28.

### R18 - Add load only when every working set used the working load (replay item 7)
Straight sets only. `allAtLoad = every progression set weight ≥ workingWeight(last progression sets)`.
If false and the result is above `lastWeight`: `lastWeight` on all sets, action `maintain`, reason
`consolidate_load` (Tech Lead to confirm the name). Decreases are not affected. Warm-ups are logged
separately, so they do not trigger this rule.

### R19 - Coarse step + higher rep target after a miss drops one step (gym report 2026-10-07, D5 B2)
Runs inside today's coarse-step guard (one step > 10 % of the load). Drop **exactly one step** only if all hold:
1. today's `target.min` > last session's target;
2. last session **missed**: any progression set below its target, even by one rep (Sebas: "si faltaron, faltaron");
3. `e1RM = lastWeight × (1 + mean reps/30)`, `L = e1RM / (1 + (target.min + 2)/30)` (2 RIR), and `L ≤ lastWeight − step/2`.
Result: `lastWeight − step` (then the 0 kg floor), reps = today's target, action `maintain` at the new load
(reason `converted_rep_range`). Otherwise the guard is unchanged: `lastWeight`, `increase_reps` (R15).
No tolerance band: when the session was complete, the load stays even if L is just under the midpoint.

## Changed expected values in approved tests (machine/cable step 5 → 2.5)

| # | Input (unchanged) | Old expected | New expected | Why |
|---|---|---|---|---|
| T10 | `wide-grip-chest-press` drop "12+12", last main 40×14 (drop 30×12) ×3 | main 45, reps 12; drop 30 | main **42.5**, reps 12; drop 0.75×42.5 = 31.9 → **30** | 2.5/40 = 6.25 % ≤ 10 % → not R8; 14 ≥ 12 → +1 step |
| T11 | Same, last main 40×12 (drop 30×10) | main 40 (needs 14), drop 30 | main **42.5**, drop **30**; drop reps still not "missed" | not R8; 12 ≥ 12 → +1 step |
| T12 | `cable-straight-arms-pull-downs` drop "12+12", last main 50×12 | main 55; drop 40 | main **52.5**; drop 0.75×52.5 = 39.4 → **37.5** | step 2.5 |
| T24 | Machine, last 45×12 ×3, target 10-12 | 45, increase_reps (needs 14) | **47.5**, reached_top_of_range | 2.5/45 = 5.6 % → not R8 |
| T25 | Same, last 45×14 ×3 | 50, reps 10 | **47.5**, reps 10-12 | not R8; 14 < 15 → not tooEasy → +1 step |

All other approved tests (T1-T9, T13-T23, T26-T29) are unchanged: none uses a machine/cable step.
R8 stays covered by dumbbell T22/T23 and by T30-T33, T40-T41, T43-T44 below.
Today's coarse-step test (cable lateral raise 5 kg) stays meaningful: 2.5/5 = **50 %** > 10 % → still coarse → 5 kg, increase_reps (T45).
Engine unit tests that hard-code a 5 kg machine/cable step must be updated by the Tech Lead to these values.

## New test cases (Sebas's real logs unless marked "variant")
Today 2026-10-07, last session 7 days ago, week 1, one session of history unless stated.

| # | Rule | Input | Expected |
|---|---|---|---|
| T30 | R8/R12 | `reverse-pec-deck-fly` drop "12+12", target 12, last 6.25×15 ×4 | 2.5/6.25 = 40 % → R8; all 15 ≥ 14 → **8.75**, reps 12; drop 0.75×8.75 = 6.6 → **5** (replay gave 11.25) |
| T31 | R8/R15 | Variant: same, last 6.25×13 ×4 | not ≥ 14, not tooEasy → **6.25**, increase_reps **14-15** |
| T32 | R8/R15 | `high-cable-fly` target 12, last 12.5×13, 15×12, 12.5×12 | working 12.5; 20 % → R8; → **12.5**, increase_reps **13-14** (mLast 12) |
| T33 | R8/R15 | `cable-straight-arms-pull-downs` target 12, last 22.5×12 ×3 | 11 % → R8 → **22.5**, increase_reps **13-14** |
| T34 | R16 | `cable-crunch` drop "10+10", target 10, last 25×12 ×3 | 12 ≥ 12 → **27.5**, reps 10; drop 0.75×27.5 = 20.6 → **20** (replay gave 30) |
| T35 | R16 | Variant: same, last 25×11 ×3 | 11 < 12 → **25**, increase_reps **12-13** (normal rules would give 27.5) |
| T36 | R12b | Variant: `incline-dumbbell-press` target 8, last 26×15 ×3, high confidence (3 sessions 26×15) | capacity load(8, 2) = 26×1.5/1.333 = 29.25 → up 30; cap max(2, min(2.6, 4)) = 2.6 → 28.6 → **28** |
| T37 | R13 | `dumbbell-bench-press` today 12, last target 10, last 30×12, 30×10, 30×10 | e1RM 40.67, low → 27.7 → 26; rDone 10 < 12 → floor 30×1.333/1.4 = 28.57 → **28** (replay 26) |
| T38 | R13 | `cable-lat-pulldown-underhand-grip` today 12, last target 10, last 65×10, 60×11, 65×11 | e1RM 85.1, low → 58.0 → down 57.5; rDone 10.5 → floor 65×1.35/1.4 = 62.7 → **62.5** (replay 55) |
| T39 | R13 | `plate-loaded-t-bar-row-chest-supported` today 10, last 30×12, 30×12, 30×8 (target differs) | conversion 29.05 → 27.5; rDone 12 ≥ 10 → **30**, maintain (replay 27.5) |
| T40 | R14 | `rope-low-cable-oh-tricep-extensions` target 12, 4 sets, last 20×12, 20×12, 20×15, 20×15 | 12.5 % → R8; tooEasy (2 of 4 ≥ 15) → **22.5**, reps **12** (replay 20, increase_reps 12-12) |
| T41 | R14/R15 | Variant: same, last 20×12, 20×13, 20×14, 20×14 | not all ≥ 14, only 0 ≥ 15 → **20**, increase_reps **13-14** |
| T42 | R14 | Variant: `incline-dumbbell-press` target 8, last 26×12, 26×12, 26×9 | 2 of 3 ≥ 11 → exceeded_target: e1RM 35.53 low → 26.65 → 26; max(26, 28) → cap 28.6 → **28**, reason **exceeded_target** |
| T43 | R15 | `dumbbell-curl-incline` target 12, last 10×12 ×3 | 20 % → R8 → **10**, increase_reps **13-14** (replay 12-12) |
| T44 | R15 | `ez-bb-preacher-curls` target 12, 4 sets, last 6×12 ×4 (total incl. bar) | 2.5/6 = 42 % → R8 → **6**, increase_reps **13-14** |
| T45 | R15 | `cable-lateral-raise` today 20, last target 15, last 5×15, 5×14, 5×15, 5×14 | 2.5/5 = 50 % → coarse guard → **5**, increase_reps **20-20** (unchanged) |
| T46 | R17 | `plate-loaded-t-bar-row-chest-supported` reverse-pyramid [8, 10, 12], last tagged reverse-pyramid 30×12, 30×12, 30×8 | R1.3: load(8, 1) = 31.3 → down **30**; 10: 27.9 → **27.5**; 12: 26.6 → **27.5** → **30 / 27.5 / 27.5**, maintain (replay 32.5/30/30) |
| T47 | R18 | `smith-machine-shoulder-press` target 8, last 20×10, 22.5×10, 22.5×10 | set 1 at 20 → **22.5** ×3, maintain, consolidate_load (replay 25) |
| T48 | R18 | `cable-lat-pulldown-underhand-grip` target 10 (same range), last 65×10, 60×11, 65×11 | set 2 at 60 → **65**, maintain (replay 70) |
| T49 | R18 | Control: `dumbbell-bench-press` target 10, last 30×12, 30×10, 30×10 | all at 30 → **32**, reached_top (unchanged) |
| T50 | R19 | `standing-db-lateral-raises` today 20, last target 15, last 12×15, 12×14, 12×14 (step 2) | 17 % coarse; missed; e1RM 17.73, L 10.23 ≤ 11 → **10** ×20 (engine gave 12×20) |
| T51 | R19 | `dumbbell-curl-incline` today 15, last target 12, last 10×12 ×3 (step 2) | 20 % coarse; no miss → **10**, increase_reps 15 (L 8.94 ignored) |

R19 leaves T45 unchanged: missed, but L = 7.42/1.733 = 4.28 > 3.75 → **5**.

Changes vs the earlier v2 draft: T30 8.75 (was 7.5 with a 1.25 step), T31 now a reps-first variant
(the "unverified 5 kg" case is gone), T34 27.5 / drop 20 (was 25), T35 = old T36, T36 = new guardrail case,
T38 62.5 (was 60), T40 22.5 (was 20), T41 = new variant. The 15 % cap and step inference are removed.

### Consistency notes
- R14 does not change T22, T24, T25, T29 (no set ≥ max + 3). R15 matches T19 (13-14), T22 (16-17).
- R17 leaves T5-T8, T13, T14, T26 unchanged (non-uniform or no pyramid history).
- R18: every approved straight-set test uses one load per session; drop-sets compare main parts only.
- Engine test "30×10 (8-10) → 12-15": conversion 27.3 → 28 (medium, nearest); R13 floor 28.57 → 28 → still **28**.
- Today's rules: two misses on a coarse step still drop exactly one step; 0 kg floor stays last (T30 drop, T45).

## Open decisions
None left. Sebas answered the equipment facts, the jump cap ("whatever is optimal": the approved
guardrail as the final cap, no extra 15 % cap) and asked to use the PT recommendation on the rest
(R16 only for `cable-crunch` for now; T46's conservative 30 × 8 accepted for one week; EZ-bar total incl. bar;
warm-ups logged separately). Engine changes still need a PT test-case review before merge.

## Sources
- Epley B. (1985) *Poundage Chart*, Boyd Epley Workout (e1RM formula).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments).
- Helms E., Morgan A., Valdez A., *The Muscle and Strength Pyramid: Training*, 2nd ed. (reps-first progression on small increments).
- `docs/fitness/approved/2026-10-07-progression-engine-spec.md` (R1-R11, T1-T29).
- Replay output, block 6 week 1, 2026-10-07 (Tech Lead scratchpad `replay.txt`).
