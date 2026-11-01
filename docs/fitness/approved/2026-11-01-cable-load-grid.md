---
title: Cable loads stay on the 2.5 kg grid - off-grid logs count at the load below (amendment R31, T157-T182)
status: approved
author: pt-fitness-expert
created: 2026-11-01
approved_by: Sebas (PO) confirmed the loads do not exist ("no existen"); fitness rules decided by the PT (PO: "todo lo que el PT diga, sigamos su consejo")
approved_on: 2026-11-01
exercises: [cable-lateral-raise, rope-low-cable-oh-tricep-extensions, cable-rear-delt-fly, reverse-pec-deck-fly]
---

> **Status 2026-11-01:** approved under the PO's standing instruction above; he has not read this document line by line.
> PT pre-merge review passed. Changes from the draft, each accepted by the PT:
> - T159 confidence is `low`: at grid loads the sessions spread 8.07 %, over the 8 % limit.
> - On a 2.5 kg main load the drop stays at 2.5 kg (no lighter pin), so `dropWeight` is never 0.
> - The off-grid line is also added below the reason when the card has no same-day comparison.
> - On cable, the T179 jump guardrail is measured from the grid load.
> - The open decisions below stay open: 25 kg stands for rope on B day. The Spanish line is still pending from the PT.

## Summary
The PO confirmed on 2026-11-01 that his cables have no 6 kg or 26 kg, yet the engine recommends both. The step is
already 2.5 kg (R12a), but the off-grid values come from his own logs through the R22 proof floor and the "keep the
offset" behaviour. This draft adds **R31**: for equipment `cable` only, the engine reads every logged load at the
**grid load at or below it**, and clamps every result to the grid. Logs and "last time" stay as he wrote them.
Machines and all other equipment keep R12a unchanged.

All results below are hand-traced through `src/trainer/engine.ts` (main at 15d34bd) with his real entries (block 6,
replay of 2026-11-01). They were not run; the Tech Lead must confirm them with the tests and a replay.

## Exercises
No new exercises and no new technique cues. All are equipment `cable`, step 2.5. `cable-rear-delt-fly` currently runs
in the `reverse-pec-deck-fly` slot (swap), so its targets and set counts below come from that slot:
Arms A drop-set 12+12 x 3, Arms B 20 x 4.

## Decisions at a glance
| # | Question | PT decision |
|---|---|---|
| 1 | Off-grid value on a cable: up or down? | **Down, on every path.** See R31b |
| 1 | Does an off-grid log count as proof? | **Yes, at the grid load below, with its real reps.** 6 x 21 proves 5 x 21; 26 x 15 proves 25 x 15; 28 proves 27.5; 4 proves 2.5 |
| 2 | The four cases | See the table below |
| 3 | Machines | **No change.** R12a stays: 6.25 on a machine was real, so 6.25 -> 8.75 (T30). The PO's confirmation covers cables only |
| 4 | "Last time" with an off-grid log | **Unchanged.** Last 6 x 10 shows 6 x 10. It is his real log and history is not edited |

**Why down.** Only the grid load below is certain. He wrote 6 kg on a cable with no 6 kg, so the real load was another
pin, and I cannot tell which. Crediting the load above would treat an unproven load as proof. Ignoring the log would
throw away real reps and, on the rear delt fly, all its main-set history. Rounding down costs one step at most, and
reaching the top of the range earns that step back.

### The four cases
| Case | Today | R31 result | Action, reason | Was |
|---|---|---|---|---|
| `cable-lateral-raise`, Arms A | 15 x 4 | **5 kg x 15-15** | `decrease_weight`, `recent_miss_cap` | 6 x 15-15 |
| `rope-low-cable-oh-tricep-extensions`, Arms B | 15 x 4 | **25 kg x 15-15** | `decrease_weight`, `converted_rep_range` | 26 x 15-15 |
| `cable-rear-delt-fly`, Arms A | 12+12 x 3 | **5 kg x 12-12, drop 2.5 kg** | `maintain`, `light_load_add_reps` | 6 x 12-12 |
| `cable-rear-delt-fly`, Arms B | 20 x 4 | **5 kg x 20-20** | `increase_weight`, `converted_rep_range` | 6 x 20-20 |

**Lateral raise: 5, not 7.5.** The last session was 7.5 x 8 on all four sets against a 13-15 target, 5 reps below its
minimum. Asking 7.5 x 15 nearly doubles those reps, and R27 already caps that load. The Est. max from 7.5 x 8 is 9.5 kg,
which gives 6.3 kg at 15 reps with no reps to spare, and that rounds down to 5. He has proof at 5 for far more than 15
(21, 21, 19, 19 logged at "6").

**Rope: 25.** The approved rules give 25 from this history: R21 floor 25, R22 proof 25. See the first open decision for
27.5.

**Rear delt fly, Arms B: 5.** The same-day session (4 x 21 x 4, read as 2.5) reached 20 on all sets, so R23 supports
2.5 + 2.5 = 5. The approved coarse-step guard (T51) keeps the latest load, also 5. He may fall short of 20. If so, the
approved rules hold the load and build reps first.

## Rule

### R31 - Cable loads stay on the 2.5 kg grid
**Scope:** `equipment === 'cable'` exactly. A configured per-exercise step (R12a) defines the grid if one is set; none
is set today. Every other equipment skips R31, including `machine`.

**R31a - Read logs at the grid load below.** At the start of `recommend`, before R5, R4 and R11, and before the 0 kg
floor reads the history, build a working copy of the history with each logged main-set load replaced by:
```
gridLoad(w) = w <= 0 ? w : max(step, roundToStep(w, step, 'down'))
```
Reps, dates, targets and tags are untouched. All rules read this copy, so capacity, working load, proof, misses and
comparisons all use grid values. A log below 2.5 kg reads as 2.5 (the lowest grid load, never 0). `drop` loads in
history are not read by any rule and stay as logged.

**R31b - What this does on each path.** No path needs its own rounding once R31a is in place:
| Path | Rule | Result on a cable | Example |
|---|---|---|---|
| Base weight (keep the load) | R6, R8, R16, stay rules | Grid load below the log | last 6 -> 5 |
| Add a step | R1, R2, R8, reached top | Grid load + 1 step | last 26 -> 25 + 2.5 = 27.5 (was 28.5) |
| Jump cap | R12b, `setCap` | Measured from the grid load | 25 -> at most 27.5 |
| Proof floor | R21, R22, R25 | Proof counts at the grid load below | 26 x 15 proves 25 x 15 |
| Same-day boost and its cap | R23 | Both read at the grid load | same-day 26, latest 28: min(27.5, 27.5) = 27.5 (was 28) |
| Miss cap and miss drops | R19, R27, R28b | Grid load - 1 step, minimum 1 step | two misses at 26 -> 22.5 (was 23.5) |
| Drop weight | R3 | 75 % of the final main load, rounded down (no change) | main 25 -> 17.5 |
| Pyramid and reverse pyramid sets | R1, R2, R17, R22b, R25 | Each set read at its grid load | 26 top -> 27.5 next (was 28.5) |
| Deload | R4 | Grid load below the log | last 6 -> 5 |
| Long break | R11 | -10 % or -20 % of the grid load, rounded down | last 28 -> 22.5 (was 25) |
| 0 kg floor | Global floor | At least 2.5 | last logged 1 -> 2.5 |

**R31c - Final clamp.** As the last step of `recommend` on a cable, apply `gridLoad` to `weight`, every `setWeights`
value and `dropWeight`. This covers inputs that do not come from history, such as a double-angle `followLoad` (R5). With
R31a in place it should do nothing else, and the invariant (T179) is what proves that.

**R31d - Logs stay as logged.** R31 never writes to history.
- `evidence.lastWeight`, `evidence.lastReps`, `evidence.sameDayWeight`, `evidence.recentMiss.weight` and the Previous
  column (R24) show the **logged** value.
- Action and comparison logic uses the **grid** value. Today `applyLikeForLikeAction` reads `evidence.sameDayWeight`, so
  it needs the grid value kept separately (field name is the Tech Lead's choice).
- Est. max, Progress, trends, volume and calibration inputs keep reading the real log. No rule here changes them.
- When the reference load shown on the card is off-grid, replace the "up/down {n} kg" text (R26b) with this line, so
  the card never reads "same weight" next to 6 and 5.
  EN: "You logged {logged} kg. This cable moves in 2.5 kg steps, so I count it as {grid} kg."
  Spanish follows once the English is approved.

**Machines (explicit):** R12a stays exactly as approved for `machine` and every non-cable equipment. Odd logged loads
keep their offset (6.25 -> 8.75).

**Order in `recommend`:** resolve the step (R12a) -> **R31a** -> existing order unchanged -> 0 kg floor -> **R31c**.

## Test cases (T157+)
Today 2026-11-01, block 6, equipment `cable`, step 2.5, unless stated. T157-T161 use his real history.

**H-LAT** (`cable-lateral-raise`):
10-27 arms-a target 13-15: 7.5x8 x4; 10-24 arms-b 21-22: 6x21, 6x21, 6x19, 6x19; 10-16 arms-b 20: 6x20 x4;
10-13 arms-a 13-15: 6x13 x4; 10-09 arms-b 20: 5x20, 5x20, 5x18, 5x18; 10-06 arms-a no target: 5x15, 5x14, 5x15, 5x14.

**H-ROPE** (`rope-low-cable-oh-tricep-extensions`):
10-27 arms-a 12: 27.5x12 x4; 10-24 arms-b 15: 27.5x15, 27.5x15, 27.5x13, 27.5x16; 10-16 arms-b 15: 26x15 x4;
10-13 arms-a 10-12: 28x10, 25x10, 25x10, 25x10; 10-09 arms-b 15: 20x15 x4; 10-06 arms-a no target: 20x12, 20x12, 20x15, 20x15.

**H-RD** (`cable-rear-delt-fly`):
10-27 arms-a 10-12: 6x10 x3 (drop 2.5x12); 10-23 arms-b 21-22: 4x21 x4; 10-16 arms-b 20: 4x20 x4;
10-13 arms-a 12: 4x12, 6x12, 4x12 (drop 2.5x12); 10-09 arms-b 20: 6x18, 4x20, 4x20; 10-06 arms-a: 6x12 x3 (drop 4x12).

| # | Rule | Input | Expected |
|---|---|---|---|
| T157 | R31a, R27 | H-LAT, `arms-a`, target 15, 4 sets | **5 x 15-15**, `decrease_weight`, `recent_miss_cap`, confidence `low`; `evidence.lastWeight` 7.5. Trace: R8 path stays at 7.5, R27 caps to 5, R21 floor 6.33 -> 5, R22 proof 5 |
| T158 | R31a, R19 | H-LAT, `arms-b`, target 20, 4 sets | **5 x 20-20**, `maintain` (was `decrease_weight`, against 6), `converted_rep_range`; `evidence.sameDayWeight` 6 |
| T159 | R31a, R21 | H-ROPE, `arms-b`, target 15, 4 sets | **25 x 15-15**, `decrease_weight`, `converted_rep_range`, confidence `medium` |
| T160 | R31a, R3 | H-RD, `arms-a`, drop-set, target 12, 3 sets | **5 x 12-12**, `dropWeight` **2.5**, `maintain`, `light_load_add_reps`; `evidence.lastWeight` 6, `lastReps` [10, 10, 10] |
| T161 | R31a, R15, R26 | H-RD, `arms-b`, straight, target 20, 4 sets | **5 x 20-20**, `increase_weight`, `converted_rep_range` (5 vs same-day grid load 2.5) |
| T162 | Add a step | Variant: last 26x15 x4, target 15, same range | **27.5**, `increase_weight`, `reached_top_of_range` (never 28.5) |
| T163 | Base weight, Q4 | Variant: last 6x10 x3, target 12, same range | **5 x 12**, `maintain`, `below_target_once`; `evidence.lastWeight` **6**, `lastReps` [10, 10, 10] |
| T164 | R12b, R14 | Variant: last 26x18 x4, target 15, same range | R14 too easy -> **27.5**, `exceeded_target` (never 28.5) |
| T165 | R28b | Variant: `arms-a` target 15; 10-27 and 10-20 both 26x12 x4 at target 15 | **22.5**, `decrease_weight`, `below_target_twice` (never 23.5) |
| T166 | R27 | Variant: last 6x8 x4, target 13-15, today 15, no other history | **2.5 x 15**, `decrease_weight`, `recent_miss_cap`; `evidence.recentMiss` weight **6**, newWeight **2.5**. An on-grid 5x8 gives the same load today |
| T167 | R23 boost | Variant: `arms-b` target 15, 4 sets; 10-27 arms-a target 10: 30x10 x4; 10-24 arms-b target 15: 26x15 x4 | Boost 25 + 2.5 = **27.5** (never 28.5), `increase_weight`, `same_day_boost` |
| T168 | R23 cap | Variant: same as T167, latest 28x10 x4 | Boost min(27.5, 27.5) = **27.5** (never 28) |
| T169 | R3 drop | Variant: drop-set, target 12, 3 sets, last 26x10 x3 | Main **25**, drop 18.75 -> **17.5**, `maintain`, `below_target_once` |
| T170 | R2, pyramid | Variant: pyramid [15, 12, 10], target 10-15, last pyramid 20x15, 23x12, 26x10 | **22.5 / 25 / 27.5**, `increase_weight`, `reached_top_of_range` |
| T171 | R1, R25 | Variant: reverse pyramid [8, 10, 12], target 8-12, last reverse pyramid 26x8, 23x10, 21x12 | **27.5 / 25 / 22.5**, `increase_weight` |
| T172 | R4 | Variant: deload, target 15, 4 sets, last 6x15 x4 | **5**, 2 sets, reps 15-15, `deload`, `deload_week` |
| T173 | R11 | Variant: target 12, last 28x12 x3 on 2026-10-02 (30 days) | 27.5 x 0.9 = 24.75 -> **22.5**, `regress`, `long_break` |
| T174 | Lowest load | Variant: target 20, last 1x20 x3, same range | **2.5**, `increase_reps`, reps 21-22; `evidence.lastWeight` 1 |
| T175 | R31c, R5 | Variant: `followLoad` 6, no history | **5**, `maintain`, `double_angle` |
| T176 | R12a config | Variant: `step` 1.25 configured, target 12, last 6.25x12 x3 | Grid is 1.25: **6.25**, `increase_reps`, reps 13-14 |
| T177 | Machine control | `reverse-pec-deck-fly`, `machine`, drop-set, target 12, last 6.25x15 x4 (= T30) | **8.75**, drop **5** (unchanged) |
| T178 | Machine control | Variant: `machine`, target 12, last 6.25x10 x3, same range | **6.25**, `maintain` (not rounded) |
| T179 | **Invariant** | Extend `src/trainer/invariants.test.ts`: for every planned exercise with equipment `cable` in blocks 6-9, add histories at off-grid loads **[1, 4, 6, 26, 28, 28.75]** to the existing patterns, plus mixed-load sessions such as 28, 25, 25, 25; deload on and off | **No cable recommendation off the 2.5 grid:** `weight`, every `setWeights` value and `dropWeight` are multiples of 2.5 and greater than 0. All existing invariants still pass. `dropWeight` must be added to the check; today it is not checked |
| T180 | R31d, Q4 | Any off-grid history, after `recommend` | Input history is deep-equal to before the call. Previous column shows the logged load (`6 kg x 10`). Progress and Est. max values are unchanged |
| T181 | Prefill | T163 inputs, logger prefill (T112-T113 rules) | Recommended 5 differs from previous 6, so prefill is the target floor **12**, not last reps 10 |
| T182 | No collateral | H-ROPE, `arms-a`, target 12, 4 sets; plus every approved test with equipment `cable` (T12, T32-T35, T38, T40, T41, T45, T48, T73, T76, T87-T89, T118) | H-ROPE: **30 x 12**, `increase_weight`, `reached_top_of_range` (same as the replay). Approved tests stay unchanged: the ones I read use on-grid loads only; the test run must confirm all of them |

## Plain explanation for Sebas
- **Your history stays as you wrote it.** If you logged 6 kg, "last time" still says 6 kg.
- **The app only recommends weights your cables have.** A logged 6 counts as 5, 26 as 25, 28 as 27.5 and 4 as 2.5.
- **Next sessions:**
  - Cable lateral raise: 5 kg x 15 (A) and 5 kg x 20 (B).
  - Rope overhead extension, B day: 25 kg x 15.
  - Cable rear delt fly: 5 kg x 12, drop 2.5 kg (A), and 5 kg x 20 (B).
- **What to log:** the weight on the pin and the reps you actually did. If 5 kg x 15 feels easy, keep going and log your
  real reps, because that is what earns the next step.

## ⚠️ Open decisions
- ⚠️ REVISAR (PT call, PO may overrule): **rope B day, 25 or 27.5.** 25 is my decision here because the approved rules
  give it and R31 should only fix the grid. But he did 27.5 x 15, 15, 13, 16 on this same day eight days ago, so many
  coaches would repeat 27.5. The cost of 25 is about one session: a clean 4 x 15 returns him to 27.5. The same gap (a
  near-miss on the same day does not hold the load after a rep-range change) affects all equipment, so if it matters it
  needs its own rule and replay.
- ⚠️ REVISAR (watch item, no rule now): **cable lateral raise.** 5 kg gives about 19-21 reps and 7.5 kg gives 8, and the
  15-rep target sits between them. 5 x 15 will leave reps in reserve. After 17+ reps on all sets, R8 sends him back to
  7.5 x 15, which he may miss, and R27 would then cap him at 5 again. Watch this in the next replay. If it repeats, the
  fix is a plan change for this exercise, not a load rule.
- ⚠️ REVISAR (product, PO): should the logger warn when a typed cable load is off the grid? R31 does not need it, and it
  would keep new off-grid logs out of his history. PT view: a light hint at most, never a block, because he may use a
  different cable at another gym.
- ⚠️ REVISAR (equipment assumption): the grid is multiples of 2.5 kg starting at 2.5. The PO confirmed the 2.5 kg step
  and that 6 and 26 do not exist, not every pin on every stack. A stack with another step or an add-on needs a configured
  step (R12a, T176).
- Tech Lead: engine change needs the PT pre-merge review and the replay (AGENTS.md checklist). Please also check that no
  path outside `recommend` puts a logged off-grid load in front of him as a suggestion, such as personal plans
  (`src/plans/`) or logger defaults. I did not trace those. Spanish strings follow once the English is approved.

## Sources
- `src/trainer/engine.ts`, `src/trainer/invariants.test.ts`, `src/trainer/presentation.ts`,
  `src/utils/effortlessLogging.ts` (read, not changed).
- Replay and entries export from the Tech Lead's session scratchpad, 2026-11-01 (not committed).
- Approved: `docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md` (R12a, R12b, R19, T30, T51),
  `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md` (R20-R24),
  `docs/fitness/approved/2026-10-19-reverse-pyramid-after-strong-b.md` (R25),
  `docs/fitness/approved/2026-10-20-engine-watch-items.md` (R26-R30),
  `docs/fitness/approved/2026-11-01-remove-rir-prompt.md` (ends at T156, so R31 and T157 are the next free numbers).
- Epley B. (1985) *Poundage Chart* (e1RM).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments).
- Helms E., Morgan A., Valdez A., *The Muscle and Strength Pyramid: Training*, 2nd ed. (reps-first progression on small increments).
