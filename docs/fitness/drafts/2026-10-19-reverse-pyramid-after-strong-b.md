---
title: Reverse pyramid after a strong B day - cross-day top set and back-off floors (amendment R25)
status: draft
author: pt-fitness-expert
created: 2026-10-19
approved_by:
approved_on:
exercises: [plate-loaded-t-bar-row-chest-supported]
---

## Summary
Mon 19 Oct, block 6 (`block-2026-10-05-hypertrophy-flat-pyramid-ii`), Chest & Back A, B1
`plate-loaded-t-bar-row-chest-supported`, reverse pyramid 8 / 10 / 12. Thu 15 Oct (B, 3 x 10) he did
35 x 12 x 3. Today the engine gave **35 x 8, 32.5 x 10, 30 x 12**. The code followed the approved rules exactly.
The problem is a **rule gap**: R21-R23 (cross-day evidence, achieved-load floor, same-day boost) were approved
only for straight sets and ascending pyramids, so a reverse pyramid never sees the strong B day. This draft adds
R25 so reverse pyramids use that evidence. Today should have been **37.5 x 8, 35 x 10, 35 x 12**.

## Exercises
### Chest-supported T-bar row, plate-loaded (`plate-loaded-t-bar-row-chest-supported`)
- Plate-loaded: step **2.5 kg** (R12a). No technique-cue changes.

## 1. Trace: what the approved rules produce today
Inputs: planned setReps [8, 10, 12], top set = 8 reps (index 0). Latest session (R20) = Thu 15 Oct B,
35 x 12 x 3 (target 10, single load).

1. `src/trainer/engine.ts` `applyApprovedFloors`: `floorsApply = !pyramid || ascendingPyramid`. A reverse
   pyramid is a pyramid but not ascending, so **R21, R22, R22b and R23 are all skipped**. That follows the approved
   text (R21: "straight sets / pyramid"; R22: pyramid set or straight sets; T53-T63 only cover ascending
   pyramids), but no approved rule says what a reverse pyramid should do with cross-day evidence.
2. `recommendPyramid` top set, one of two paths (both give 35; the Tech Lead's replay shows which one ran):
   - **R1.1** (Mon 12 Oct A logged as a real reverse pyramid): top = last A top load + 1 step if 8 reps were hit.
     Only the A session is read; the Thu B session is ignored.
   - **R1.3 + R17b** (no real reverse-pyramid session): capacity load(8, 1 RIR) is about 37.5, but R17b caps
     every set at the latest single-load working load (35). Exceptions (a) "two single-load sessions at 35 that
     reached the top" and (b) R14 tooEasy (needs 13+ reps on half the sets with target 10) are not met. Top = **35**.
3. Back-off sets (R1.2, reps 10 and 12 are different, so the Epley formula is used, not 90%):
   - 10: 35 x 1.3 / 1.4 = 32.5 -> nearest **32.5**
   - 12: 35 x 1.3 / 1.467 = 31.0 -> nearest **30**
4. R12b / per-set caps do not bind. Result **35 / 32.5 / 30**, which matches what he logged.

**Verdict: the rules were followed, and the result is too conservative (rule gap).**

## Is it right for hypertrophy?
No, not this time. Thu 35 x 12 x 3 gives an Epley e1RM of 35 x 1.4 = **49 kg**, and he did 12 reps on every set
of a 10-rep target. At the week-3 effort plan (about 1-2 reps in reserve), 8 reps fits **about 36.5-37.5 kg**
(49 / 1.333 = 36.75 at 2 RIR; 49 / 1.3 = 37.7 at 1 RIR). Today's sets work out to e1RMs of 44.3 / 43.3 / 42.0,
all well below what he showed three days earlier. So the top set was probably 4-5+ reps from failure, and 30 x 12
was lighter than a load (35) he already did for 12 reps on three sets, the last two of them fatigued. One easy
session costs no muscle and does no harm, but it is not the planned stimulus, and the app should not ask for less
than he has proven he can do.

## 2. Proposed rule change - R25 (reverse pyramids)
Engine order: after R1 / R17 / R17b, before R12b and the 0 kg floor. R4 deload, R11 long break and the R1.1 miss
rule (2+ short twice -> -5%) keep priority; when one of them applies, R25 does not run.

**R25a - Top set uses cross-day evidence.**
- Latest session (R20, any day) at working load `lastWeight`, `rSeries` = median reps (R21). Reps are capped at
  12 for the e1RM (approved estimate cap): `e1RM = lastWeight x (1 + min(rSeries, 12) / 30)`.
- `crossTop = roundDown(e1RM / (1 + (topReps + 1) / 30), step)` (the 1 RIR of R1.3).
- `top = max(R1 result, crossTop)`, then the R12b cap vs the latest session's working load:
  `max(1 step, min(+10 %, 2 steps))`, rounded down.
- **R17b exception (c), new:** the R17b "no higher than the last single load" cap is lifted when the latest session
  had **every progression set >= its target.max + 2** (the same "earned" signal as R8 / R23).
- **Top floor:** never below the heaviest load of any set with reps >= topReps in the last 28 days (R22 single-set proof).

**R25b - Back-off sets: lighter, but never below what he has already done.**
- Start from R1.2 (the Epley formula, or 90% of top for the top + back-off format).
- Floor for a back-off set with rep target `t`: the heaviest load in the last 28 days (non-deload) of a set with
  reps >= `t` that was **not the first working set of its session**, or a straight-sets session where every working
  set reached `t` (R22 straight rule). This uses fatigued sets as proof, because back-off sets are done tired.
- Shape cap: every back-off set <= `top - 1 step`, and fewer reps never lighter (monotonic). The top set stays the heaviest.
- R23 same-day boost applies per set as for ascending pyramids (previous same-`dayKey` set reps >= target + 2 ->
  +1 step, capped at the latest session's load for that set).

**Today with R25:** e1RM 49 -> crossTop 49 / 1.3 = 37.7 -> **37.5**. R12b: 35 + roundDown(max(2.5, min(3.5, 5))) =
37.5, so it fits; +2.5 kg = +7.1%. R17b exception (c): 12 >= 10 + 2 on every set -> cap lifted. Back-off 10:
formula 37.5 x 1.3 / 1.4 = 34.8 -> 35; floor 35 (Thu sets 2-3, 35 x 12); shape cap 35 -> **35**. Back-off 12:
formula 33.2 -> 32.5; floor 35; shape cap 35 -> **35**.
**Expected: 37.5 x 8, 35 x 10, 35 x 12, increase_weight.**

### Test cases (T64+)
| # | Rule | Input | Expected |
|---|---|---|---|
| T64 | R25a/b | Today's case: RP [8,10,12], step 2.5, latest Thu B 35 x 12 x 3 (target 10) | **37.5 / 35 / 35**, increase_weight (now 35 / 32.5 / 30) |
| T65 | R25 just hit | Variant: latest B 35 x 10 x 3 (target 10) | crossTop 35 x 1.333 / 1.3 = 35.9 -> 35; no exception (c); back-off 10: floor 35, shape cap 32.5 -> 32.5; 12: 30 -> **35 / 32.5 / 30**, maintain |
| T66 | R12b over R25 | Variant: latest B 35 x 15 x 3 | e1RM capped at 12 reps = 49 -> 37.5; R12b 37.5 -> **37.5 / 35 / 35** (never more than one step here) |
| T67 | T46 unchanged | `plate-loaded-t-bar-row-chest-supported` RP [8,10,12], last RP-tagged 30 x 12, 30 x 12, 30 x 8 | rSeries 12 -> crossTop 32.3 -> 30; no (c) (set 3 is 8 < 12 + 2); back-offs floor 30, shape cap 27.5 -> **30 / 27.5 / 27.5** (as approved) |
| T68 | R4 over R25 | T64 inputs, week-6 deload | R4 deload back-off loads; R25 not applied |
| T69 | Miss over R25 | Top set 2+ reps short in two RP sessions in a row | R1.1 -5% rounded down; R25 floors not applied |
| T70 | 28-day window | The 35 x 12 proof was 35 days ago or in a deload | Ignored -> back-off floors fall back to R1.2 |
| T71 | R25b first-set rule | Only proof: 37.5 x 10 as the first set of a session; today's top 37.5 | Not a back-off proof; back-off 10 = min(formula, top - 1 step) = 35 |
| T72 | R24 | Day B "Next (Mon)" preview after Thu 15 Oct | Shows the same **37.5 / 35 / 35** |

Consistency: ascending pyramids (T53, T58, T61) and straight sets are unchanged. R25 only touches reverse pyramids.
Invariants: no 0 kg, only real 2.5 kg steps, no jump above R12b.

## 3. Plain explanation for Sebas
On Thursday you did 35 kg for 12 reps on every set, which is more than planned. Today the app only looked at your
last heavy-day row and ignored Thursday, because the rule that uses "your latest session, any day" was only
switched on for normal sets and normal pyramids, not for heaviest-first pyramids. So it gave you 35 / 32.5 / 30,
which is lighter than what you have already done. It should have been 37.5 x 8, then 35 x 10 and 35 x 12. One
lighter day costs you nothing; the fix makes sure it does not happen again.

## ⚠️ Open decisions
- ⚠️ REVISAR: Approve R25 (cross-day top set + back-off floors for reverse pyramids). Recommended: yes.
- ⚠️ REVISAR: Back-off shape cap "at most top - 1 step" (recommended; keeps it heavy-to-light) vs. allowing a
  back-off set equal to the top set when that load is proven.
- ⚠️ REVISAR: The block note says "about 10% lighter each set". With R25, back-offs can be less than 10% lighter
  (37.5 -> 35 -> 35). Suggest changing the note to "Heaviest set first, then lighter for more reps." (content
  change, needs PO approval).
- ⚠️ REVISAR: The Tech Lead should replay the real export (Mon 5 / 12 Oct A logs) to confirm which top-set path
  (R1.1 or R1.3 + R17b) ran today. The verdict is the same either way.

## Sources
- Epley B. (1985) *Poundage Chart* (e1RM).
- Schoenfeld BJ et al. (2021) Loading recommendations for muscle strength, hypertrophy, and local endurance: a
  re-examination of the repetition continuum. *Sports* 9(2):32 (effort close to failure across rep ranges).
- Helms ER et al. (2016) RIR-based RPE scale. *Strength Cond J* 38(4):42-49.
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (load increments, double progression).
- Approved: `docs/fitness/approved/2026-10-07-progression-engine-spec.md` (R1),
  `docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md` (R12, R17, R17b, T46),
  `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md` (R20-R24),
  `docs/fitness/approved/2026-10-18-ab-days-and-progression.md`.
