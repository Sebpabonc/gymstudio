---
title: Progression engine - PT spec (rules for src/trainer/engine.ts)
status: approved
author: pt-fitness-expert
created: 2026-10-07
approved_by: Sebas (PO)
approved_on: 2026-10-07
exercises: [incline-dumbbell-press, dumbbell-bench-press, smith-machine-bench-press, barbell-bent-over-row, back-squat, wide-grip-chest-press, dip, cable-straight-arms-pull-downs]
---

## Summary
This spec says how the app decides every weight it recommends. It replaces the open questions of the first
review with one PT rule per problem. The Tech Lead implements it only after Sebas approves it.
Straight sets keep today's logic (Epley e1RM, ~2 RIR, real weight steps, +10% / 2-step cap). Everything
below changes or adds rules for the other techniques. The test cases at the end show the exact expected numbers.

Already decided by Sebas (inputs to this spec): dumbbell step 2 kg, dumbbell weight logged per hand,
round **up** only with medium/high confidence, week 1 is full intensity, only week 6 deloads.

## Definitions used by every rule
- **Step** (load increment): dumbbell / kettlebell 2 kg; machine and cable stacks **5 kg**; barbell,
  Smith machine, plate-loaded, belt/added load on bodyweight work 2.5 kg; bodyweight with no added load: reps only.
- **Set tag** (new, per logged set): `main` (default), `mini` (rest-pause / myo-reps mini-set), `partial`.
  Drop parts stay nested in their set as `drop: {weight, reps}` (current format).
- **Progression sets** = sets tagged `main`, up to the **planned** set count, in logged order. Only these
  are used for e1RM, "hit/missed" checks and the mode weight. `mini`, `partial`, the nested `drop` and any
  rows beyond the planned set count are ignored.
- **Excluded sessions** (never used for capacity or for "missed twice"): week-6 deload sessions, and the
  second exercise of a double-angle pair (see R5).
- **Per-set guardrail**: a set's new load may not exceed its own last load by more than
  `max(1 step, min(+10%, 2 steps))`, rounded down to the step. Outlier rule (one step only) unchanged.
- **Epley ratio** between rep counts at a given RIR: `load(r, rir) = e1RM / (1 + (r + rir) / 30)`.

## Rules (one per problem, most important first)

### R1 - Reverse pyramid / heavy top set ("4","6","6","6", "5","6","6","6", and 8·10·12·15)
The top set (heaviest, fewest reps) progresses on **its own history**, never from the back-off load.
1. Top set load next time:
   - top set reps **≥ target** (and logged rir is not 0) → **+1 step**
   - top set reps = target with logged rir 0, or 1 rep short → **same load**
   - 2+ reps short in **two sessions in a row** → **-5%, rounded down** (first time: same load)
2. Other sets:
   - If all non-top sets have the **same reps** (top set + back-off format) → back-off = **90% of the new top-set load, rounded down** to the step.
   - Otherwise (8·10·12·15) → each set = `top × (1 + (topReps + 1)/30) / (1 + (reps + 2)/30)`, rounded to nearest, then the per-set guardrail, then "fewer reps never lighter".
3. First time with no top-set history: top-set load = `load(topReps, 1 RIR)` from capacity, rounded up only with medium/high confidence; then step 2.

### R2 - Ascending pyramid (14·12·10, 15·12·10·8, "12","10","8","6")
Same top-set logic as R1 (the heaviest set is the last one).
1. Heaviest set: same three outcomes as R1.1 (hit target → +1 step; ≤1 short → same; 2+ short twice → -5%).
2. Lighter sets = `heaviest × (1 + (minReps + 1)/30) / (1 + (reps + 2)/30)`, rounded to **nearest**, per-set guardrail, monotonic.
   This puts the heaviest set at ~1 RIR and the build-up sets at ~2 RIR or easier (fixes R9).
3. The heaviest set is **not** rounded up a second time (it is already last load + step, or from rule R1.3).

### R3 - Drop-sets, rest-pause, myo-reps
- **Drop-set**: progress on the main part only (main weight × main reps vs target, straight-set rules).
  Recommended drop load = **75% of the recommended main load, rounded down** to the step (= a 25-30% cut,
  inside the approved 20-30%). The drop's reps never count as missed reps and never feed e1RM.
- **Rest-pause / myo-reps**: only `main` sets count (for myo-reps, the activation set). `mini` sets are ignored.
- Legacy rows without tags: any rows beyond the planned set count are treated as `mini` and ignored.

### R4 - Week-6 deload (confirms Sebas's rule)
- **Same weights as the last non-deload session, half the sets (round up)**, reps at the **bottom** of the
  range, stop ~3 reps before failure. No top set, no drop/rest-pause/myo-reps that week.
- Pyramids: keep the **first ceil(n/2) per-set loads and reps** of the pyramid (ascending: the lighter sets;
  reverse pyramid: skip the top set and use the back-off sets).
- Deload sessions are **excluded** from capacity and from "missed twice".

### R5 - Double angle (C1 harder angle, C2 easier angle, same dumbbells)
- C2's recommended load = **C1's recommended load today**; C2 reps = "max reps, stop at ~1 RIR"; no progression rule of its own.
- C2 sessions are **excluded** from that exercise's capacity on other days.
- If the same exercise id appears twice in one day, each entry is kept as its own session (not merged).

### R6 - Incomplete sessions
If fewer progression sets were logged than planned, the result is **at most "same load"** (no increase).
Missed-reps rules still apply to the sets that were logged.

### R7 - Bodyweight
- No added load (weight 0): **progress reps only**. When all sets reach **target max + 2** in two sessions in a row,
  recommend "add 2.5 kg" (action increase_weight, weight 2.5). Never show "increase weight" with 0 kg.
- With added load (belt, vest): normal straight-set rules with a 2.5 kg step (always rounded).

### R8 - Light loads (small dumbbells, machine/cable stacks)
If **one step is more than 10% of the current load**, add reps before load:
- Stay at the same load until all sets reach **target max + 2**, then add 1 step and reset the target to the **bottom of the range**.
- Machine and cable default step is 5 kg (most stacks). ⚠️ REVISAR: later, a per-machine step setting would be better; not needed now.

### R9 - Effort in pyramids
Covered by R1/R2: only the heaviest set is set at ~1 RIR; other sets at ~2 RIR. No extra rounding up on the heaviest set.

### R10 - Partials and tempo
- `partial` sets are ignored (only full reps count).
- Sessions of a slot whose notes prescribe **tempo** are compared only with earlier tempo sessions of that slot and are **excluded** from capacity for normal-tempo days.

### R11 - Small fixes
- Confidence with a single session must read the **latest** session (sorted), not `history[0]` of the raw input.
- Long break: 22-56 days → **-10%**, more than 56 days → **-20%**, rounded down; pyramids apply it **per set**.

## Unchanged (PT confirms)
Epley with reps capped at 15; ~2 RIR for straight sets in weeks 1-5; rep-range conversion through capacity
with the guardrail measured against the last load; outlier rule (one step only); 2 kg dumbbell step; round up only with medium/high confidence.

## Test cases (exact expected numbers)
All "last session" dates are 7 days before today unless stated; week 2-5 unless stated.

| # | Rule | Input | Expected |
|---|---|---|---|
| T1 | R1 | `smith-machine-bench-press`, reverse-pyramid [4,6,6,6], step 2.5. Last: 100×4, 90×6, 90×6, 90×6 | Top **102.5**; back-offs 0.9×102.5 = 92.25 → **90, 90, 90** |
| T2 | R1 | Same, last top 100×3 (1 short) | Top **100**; back-offs **90** |
| T3 | R1 | Same, top 100×2 last session **and** 100×2 the session before | Top 95 (100×0.95), back-offs 0.9×95 = 85.5 → **85** |
| T4 | R1 | `barbell-bent-over-row` reverse-pyramid [8,10,12,15], step 2.5. Last: 60×8, 55×10, 50×12, 45×15 | Top **62.5**; 10 reps: 62.5×1.3/1.4 = 58.0 → **57.5**; 12 reps: 62.5×1.3/1.467 = 55.4 → **55**; 15 reps: 51.9 → guardrail from 45 (max 49.5 → 47.5) → **47.5** |
| T5 | R2 | `incline-dumbbell-press` pyramid [14,12,10], step 2. Last: 24×14, 26×12, 28×10 | Heaviest **30**; 12 reps: 30×1.367/1.467 = 27.95 → **28**; 14 reps: 30×1.367/1.533 = 26.7 → **26** → **26 / 28 / 30** |
| T6 | R2 | Same pyramid, last 24×14, 26×12, 28×8 | Heaviest **28** (first miss → same); 26.1 → **26**; 24.96 → **24** → **24 / 26 / 28** |
| T7 | R1.3/R2 | Same pyramid, no pyramid history; Day A straight 26×12 ×3 (one session, all equal → medium confidence) | e1RM 36.4; heaviest load(10, 1 RIR) = 26.6 → up → **28**; then **24 / 26 / 28** |
| T8 | R2 | Barbell pyramid [15,12,10,8], step 2.5, e1RM 50, high confidence, no pyramid history | Heaviest 50/1.3 = 38.5 → up → **40**; 10: 40×1.3/1.4 = 37.1 → **37.5**; 12: 35.5 → **35**; 15: 40×1.3/1.567 = 33.2 → **32.5** |
| T9 | R3 | `dip` with belt 10 kg, target 10, sets 3. Logged 10, 10, 10 (main) + 4, 3 (mini, or untagged extra rows) | Minis ignored → reached top → **12.5 kg** |
| T10 | R3 | `wide-grip-chest-press` drop-set "12+12", machine step 5. Last: main 40×14 (drop 30×12), 3 sets | 5 kg = 12.5% > 10% but reps ≥ 12+2 → main **45**, reps target 12; drop 0.75×45 = 33.75 → **30** |
| T11 | R3/R8 | Same, last main 40×12 (drop 30×10) | Main **40** (needs 14 reps before +5 kg); drop **30**; the drop's 10 reps are not "missed" |
| T12 | R3 | `cable-straight-arms-pull-downs` drop "12+12", step 5. Last main 50×12 | 5 = 10% (not >10%) → main **55**; drop 0.75×55 = 41.25 → **40** |
| T13 | R4 | Pyramid [14,12,10], week 6. Last non-deload: 24×14, 26×12, 28×10 | 2 sets: **24×14, 26×12**, stop ~3 reps short |
| T14 | R4 | Reverse-pyramid [4,6,6,6], week 6. Last: 100×4, 90×6 ×3 | 2 sets: **90×6, 90×6** (no top set) |
| T15 | R4 | Straight 3×(8-10), week 6, last 40×10 ×3 | **2 sets × 8 at 40** |
| T16 | R4 | Week 1 of next block. History: deload 40×8 ×2 (week 6), before that 40×10 ×3 | Deload ignored → reached top → **42.5** |
| T17 | R5 | C1 `incline-dumbbell-press` 30° recommended 26; C2 `dumbbell-bench-press` 0° | C2 **26**, max reps at ~1 RIR. Next flat-press day (other day, last 30×10 ×3 target 8-10) → **32** (C2's 26×6 ignored) |
| T18 | R6 | Straight 4 planned, logged 50×10, 50×10, target 8-10 | **50** (no increase) |
| T19 | R7 | `dip` bodyweight, weight 0, target 8-12, last 12,12,12 | **increase_reps**, weight 0 (aim 13-14) |
| T20 | R7 | Same, 14,14,14 in the last **two** sessions | **increase_weight 2.5 kg** added |
| T21 | R7 | `dip` with belt, last 10 kg ×12 ×3, target 8-12 | **12.5** (never unrounded) |
| T22 | R8 | Lateral raise dumbbell, step 2 (= 25% of 8), last 8×15 ×3, target 12-15 | **8 kg**, increase_reps (aim 16-17) |
| T23 | R8 | Same, last 8×17 ×3 | **10 kg**, reps target **12** |
| T24 | R8 | Machine stack, step 5, last 45×12 ×3, target 10-12 | **45**, increase_reps (needs 14) |
| T25 | R8 | Same, last 45×14 ×3 | **50**, reps target **10** |
| T26 | R11 | Pyramid [14,12,10], last 24×14, 26×12, 28×10, 30 days ago | -10% per set, rounded down: 21.6 → **20**, 23.4 → **22**, 25.2 → **24** |
| T27 | R11 | Straight, last 60×10, 70 days ago, step 2.5 | -20% = 48 → **47.5** |
| T28 | R10 | Straight 3×10 with a `partial` row 6 after the last set, last 50×10 ×3, target 8-10 | Partial ignored → **52.5** |
| T29 | baseline | Straight 3×(8-10), last 40×10 ×3 | **42.5** (unchanged behaviour) |

## ⚠️ REVISAR - one answer each (PT recommendation in bold)
1. Rules R1-R11 above as the progression spec → **approve**.
2. Engine changes that affect load selection need a PT test-case review before merge → **yes**.
3. Add a per-set tag `main / mini / partial` (drop stays nested) → **yes**.
4. Deload = same weights, half the sets, bottom of range, no top set / intensity techniques → **yes (confirms your rule)**.
5. Drop load = 75% of main, rounded down → **yes**.
6. Machine/cable step = 5 kg default (per-machine setting later) → **yes**.
7. Light-load rule: add reps to max+2 before a step that is >10% of the load → **yes**.
8. Heavy top set allowed from week 1 (your "week 1 = full intensity" overrides the earlier "no top set in week 1" in the approved review) → **yes**.
9. Tempo sessions compared only with tempo sessions → **yes**.
10. Long break: -10% (22-56 days), -20% (over 56 days) → **yes**.

## Sources
- Epley B. (1985) *Poundage Chart*, Boyd Epley Workout (e1RM formula).
- Zourdos M.C. et al. (2016) J Strength Cond Res 30(1): RIR-based RPE scale.
- Coleman M. et al. (2022): drop sets vs traditional sets (cited in the approved techniques review).
- `docs/fitness/approved/2026-10-06-rep-ranges-and-techniques-review.md` (top set + back-off ~10%, drop 20-30%, deload).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments).
