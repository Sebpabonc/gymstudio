---
title: Engine watch items from the R25 replay - like-for-like labels, recent-miss cap, miss counting, crunch on B days, first session (amendment R26-R30)
status: approved
author: pt-fitness-expert
created: 2026-10-20
approved_by: Sebas (PO) — "que haga lo mejor para mi progreso" (fitness decisions delegated to the PT)
approved_on: 2026-10-20
exercises: [cable-lat-pulldown-underhand-grip, incline-dumbbell-press, cable-crunch, standing-calf-raises-toes-neutral, reverse-pec-deck-fly, plate-loaded-pendulum-squat]
---


> **PO decision 2026-10-20:** fitness choices delegated to the PT; R26–R30 and T73–T93 approved as written.
> Product/equipment questions (pendulum vs back squat slot, pec deck vs cable rear delt fly, 1.25 kg add-on)
> are asked separately and do not block R26–R30. Tech Lead: reason code `recent_miss_cap`; ES strings follow.

## Summary
The PO handed the 7 watch items from the R25 replay (block 6, week 3, today Tue 20 Oct 2026) to the PT with
"do what is best for my progress". I traced each one through `src/trainer/engine.ts` and the approved specs. Two
are real rule gaps that ask for loads he cannot hit yet: incline B 32 x 10, and crunch B 30 x 15. Three are correct
numbers with misleading labels (lat pulldown B, incline A, calves B). One is fine as it is (reverse pec deck +2.5 kg).
One needs a first-session protocol instead of an empty "collect data" (pendulum squat). This draft adds R26-R30 and
T73-T93. **Loads change only for items 2 and 4.** All other changes are action labels and wording.

Fitness choices were delegated to the PT by the PO (2026-10-20). Only the two product/equipment questions at the end
need Sebas.

## Exercises
No new exercises and no new technique cues. Steps (R12a): `incline-dumbbell-press` 2 kg; `cable-lat-pulldown-underhand-grip`,
`cable-crunch`, `standing-calf-raises-toes-neutral`, `reverse-pec-deck-fly`, `plate-loaded-pendulum-squat` 2.5 kg.

## Verdicts at a glance
| # | Item | Verdict | Rule | Next session |
|---|---|---|---|---|
| 1 | Lat pulldown B: decrease + same_day_boost | (a) number right, label wrong | R26 | Thu 22 Oct: **67.5 x 12 x 3**, increase vs last B (65) |
| 2 | Incline B pyramid top 32 x 10 | (b) rule gap | R27 | Thu 22 Oct: **28 / 30 / 30 x 14 / 12 / 10**, maintain |
| 3 | Incline A 6 vs 8 = "slightly below" | (a) load right, label wrong; plus a miss-counting gap | R28 | Mon 26 Oct: **32 x 8 x 3**, maintain, "below target, repeat the load" |
| 4 | Crunch B 30 x 15 | (b) bug (R16 bypassed) | R27 + R29 | Thu 22 Oct: **27.5 x 16-17 x 3**, increase reps |
| 5 | Calves B 110 -> 92.5 | (a) number right, label wrong | R26 | Sat 24 Oct: **92.5 x 20 x 5**, increase vs last B (90) |
| 6 | Reverse pec deck 6.25 -> 8.75 | (c) fine as is | - | Today Tue 20 Oct: **8.75 x 12 x 3**, drop **5 x 12** |
| 7 | Pendulum squat no history | (b) gap: no guidance | R30 | Wed 21 Oct: no kg; first-session protocol |

---

## Item 1 - Lat pulldown, Chest & Back B, C2 (`cable-lat-pulldown-underhand-grip`)
**His numbers.** Latest (Mon 19 Oct, A, target 10): 70x10, 70x10, 70x8. Last B (Thu 15 Oct, target 12): 65x12 x 3.
Today's B target: 12 x 3.

**Trace.** The rep range changed (10 -> 12), so the engine converts. Capacity (high confidence) gives 62.5, and the R13/R21
floor gives 70 x 1.333 / 1.4 = 66.7 -> **65**. R22 floor: 65 (B 65x12 x 3). R23: last B reached the top (12) -> boost
65 + 2.5 = **67.5**, capped at the latest load (70). Action compares 67.5 with the latest load 70 -> `decrease_weight`;
reason `same_day_boost`. Also, the `same_day_boost` text fills `{weight}` with the latest load, so it would read
"supports 70 kg" while recommending 67.5.

**Verdict (a).** 67.5 x 12 is the right load: +1 step on the B day after hitting the top, and close to Monday's
strength (70x10 = Est. max 93.3; 67.5x12 = 94.5, so it is a real push at the planned 1-2 reps in reserve). The label
is wrong, because the action is measured against an A-day load at a different rep target. The "Previous" column
(R24) also shows the A day, so the card says "decrease" while he is actually going up.

### R26 - Like-for-like action on a rep-range change
**R26a - Action reference.** When today's rep target differs from the latest session's (R20):
- If a session with the **same `dayKey` in this block** exists within 28 days (the R23 lookup), `action` compares the
  final load (the top set for pyramids) with **that session's** working load (its top set for pyramids):
  higher -> `increase_weight`, equal -> the rule's own action (for example `increase_reps`, `maintain`), lower ->
  `decrease_weight`.
- If there is no such session and the load is below the latest load **only because the rep target went up**
  (conversion, R21; no miss rule, deload or long break), `action` = `maintain` (same as the approved R19 precedent).
  The R24 wording "adjusted to N reps" stays.
- Deload (R4), long break (R11) and miss-drops (two misses, R19, R28b) keep their own actions.

**R26b - Wording.** When R26a uses a same-day reference, the card shows one comparison line before the reason:
"vs last {Day name} ({Ddd D Mon}: {w} kg x {reps}): up {n} kg" / "same weight" / "down {n} kg". The
`same_day_boost` reason must use the **same-day session's** load and reps, never the latest load. New EN text:
"Last {Day name} you did {sameDayReps} at {sameDayWeight} kg, so today goes up to {newWeight} kg."
The Previous column stays as approved (R24, latest any day). Spanish text follows once the English is approved.

**Loads do not change.** Only the action label and the text change.

## Item 2 - Incline DB press, Chest & Back B, A1 pyramid 14/12/10 (`incline-dumbbell-press`)
**His numbers.** Last B pyramid (Thu 15 Oct): 28x14, 30x12, 30x10. Latest (Mon 19 Oct, A, target 8): 32x6, 32x6, 32x6.

**Trace.** `recommendPyramid` R2.1 reads only the last real pyramid: the top set 30x10 hit 10 -> +1 step = **32**.
Lighter sets by R2.2 plus the per-set caps: 28 and 30. R21/R22 only act as **floors** (26/26/28 and 28/30/30), so they
cannot lower anything. R23 does not fire. Result **28 / 30 / 32**, `increase_weight`.

**Verdict (b), rule gap.** Two days earlier, 32 kg gave 6 reps on all three sets against an 8-rep target (Est. max
38.4). Asking 32 x 10 as the third set of a pyramid means about 4 more reps than he managed fresh at that load. He
would most likely get 6-7 reps, miss the set, and log a "miss" that is the plan's fault. The approved rules use
cross-day evidence to raise loads (R20-R25), but nothing lets a fresh miss at a load stop a bigger rep demand at
that same load.

### R27 - Recent-miss cap (all set types)
Engine order: after R1/R2/R17/R21-R23/R25 and the R29 crunch rule, before R12b and the 0 kg floor. R4, R11 and the
miss-drop rules keep priority.
- Take the latest non-deload session `L` (R20, any day, within 28 days). For each load `W` used in `L`: `W` **missed**
  if at least half of `L`'s progression sets at `W` ended **2 or more reps below** their own planned reps (straight
  sets: `target.min`; pyramids: each set's planned reps).
- For today's sets: any set with load >= `W` **and** a rep target above the reps done at `W` (the median) is capped
  at `max(step, W - step)`.
- If the top set is capped, the lighter sets are recalculated from the capped top (R1.2 / R2.2) before the floors.
- **Proof wins.** The R22/R25b floors still apply after the cap. A load he has already lifted for those reps in the
  last 28 days is never cut.
- Reason `recent_miss_cap` (new code; the Tech Lead names it). EN text: "Last time {W} kg gave {reps} reps (target
  {target}), so I kept the heaviest set at {newWeight} kg. Beat your last reps first."

**Today with R27.** W = 32 missed (6 <= 8 - 2). The 10-rep set (32, and 10 > 6) is capped to **30**. Recalculated from
30: 14 -> 26, 12 -> 28. Floors: 14 -> 28 (28x14), 12 -> 30 (30x12), 10 -> 30 (30x10). **28 / 30 / 30**, maintain (top
equals last B top 30; R26a).
Once the A day gets 32 x 7+ (no 2-rep miss), the cap lifts and the B top set goes to 32 again.

## Item 3 - Incline DB press, Chest & Back A, A1 3 x 8
**His numbers.** Mon 19 Oct: 32x6 x 3 (target 8). Previous A (Mon 12 Oct): 30x10, 30x8, 30x8.

**Trace.** Same range, straight sets. None reached 8, none was 3+ short (`belowBy3` = 0), so the straight-set logic
returns `maintain`, `slightly_below_target`. R22 floor is 30, no change. Result 32 x 8, maintain.

**Verdict (a), plus a gap.** Keeping 32 is right. He has done 30 x 10, so 32 is the correct next load. Steady 6/6/6
with no drop-off means he can build reps there, and the block rule is "1-2 short, keep the weight". But 2 short on
every set (25% of the target) is not "slightly". The pyramid rule already makes this split (1 short = slightly,
2+ short = below target). Two more gaps showed up while tracing his **next** A session:
- With an A/B split, the latest session before the next A will be Thursday's B pyramid. The straight-set "missed
  twice" check compares the two most recent sessions of **any** day, so two A misses in a row are never seen, and
  he could sit at 32 x 6 forever.
- R18 ("add load only when every set used the working load") reads a B **pyramid** as a mixed-load session and would
  send the next A back to 30 x 8 (`consolidate_load`) after a B day of 28/30/30. Pyramids are mixed by design.

### R28 - Miss labels and A/B-aware miss counting
**R28a - Label.** For straight sets (and R7, R8, R16), use `shortfall = target.min - median(reps of the progression
sets)`. If shortfall <= 1 and some set is below target -> `slightly_below_target`. If shortfall >= 2 (without
triggering a drop) -> `below_target_once` ("repeat the load before changing it"). Loads do not change. This matches
the approved pyramid thresholds (R1.1).

**R28b - Two misses are counted on same-target sessions.** Every straight-set "two sessions in a row" check (the
approved 3+-short-on-2+-sets -> -7.5% rule and the coarse-step `missedBy3` check) uses `S1` = the latest session with
today's target, and `S2` = the session before it with the same target (same `dayKey`, within 42 days), not the
adjacent any-day session. Added rule for 2-rep stalls: if `S1` and `S2` used the same working load `W`, both have
shortfall >= 2, and total reps in `S1` <= total reps in `S2` -> `max(step, W - step)`, reason
`below_target_twice`, R22 floors skipped (miss-drop). If both rules apply, the larger drop wins.

**R28c - R18 only reads straight-set sessions.** R18 `consolidate_load` applies only when the latest session was
planned as straight sets (or was a pyramid logged at one load, R17). A real pyramid session never triggers it.

## Item 4 - Cable crunch, Chest & Back B, E1 3 x 15 (`cable-crunch`)
**His numbers.** Latest (Mon 19 Oct, A, drop-set 10+10, main parts): 30x6, 30x6, 27.5x10. Last B (Thu 15 Oct,
target 15): 27.5x15 x 3. Earlier A (12 Oct): 27.5x8 x 3.

**Trace.** The range changed (10 -> 15), so R16 (crunch: reps first, one step only after max + 2) is skipped, because it
runs only when the range is the same. 2.5/30 = 8.3%, so R8 does not apply either. Conversion -> 22.5; R22 floor -> 27.5;
**R23** boost: last B "reached top" (15) -> 27.5 + 2.5 = **30**, capped at the latest load 30 -> `maintain`,
`same_day_boost`. Result **30 x 15**.

**Verdict (b), bug.** Two problems stack up here. (1) The R23 boost gives the crunch a +1 step for just reaching 15,
which skips the approved crunch rule (R16 needs every set at max + 2 = 17). (2) Three days ago 30 kg gave 6 reps on
a 10 target. Asking 30 x 15 is more than double that. The right progression is B vs last B, reps first.

### R29 - Cable crunch uses R16 against the same-day session
For `cable-crunch` (R16 scope), when today's range differs from the latest session's and a same-`dayKey` session
exists within 28 days, R16 runs against **that session** (its loads and reps, today's target): every set >= target.max
+ 2 -> exactly +1 step; any set below target.min -> keep the load; otherwise `increase_reps` (R15 against that session).
R23 may add a step for the crunch only under the same R16 condition (every set >= target.max + 2). R27 still applies.

**Today with R29 + R27.** Same-day B 27.5x15 x 3: 15 < 17 -> 27.5, increase_reps, R15 -> **16-17**. R27: W = 30 missed
(6 <= 10 - 2), today's 15 > 6, so 30 is not allowed (it was not proposed anyway). R22 floor 27.5. **27.5 x 16-17 x 3.**
(The Chest & Back A crunch next Monday stays **30 x 10**, maintain. It is a first miss, so the approved "first time,
same load" applies, and the label becomes `below_target_once` under R28a. A second miss there drops to 27.5, by the
existing -7.5% rule counted as in R28b.)

## Item 5 - Standing calf raise, Legs B, E1 5 x 20 (`standing-calf-raises-toes-neutral`)
**His numbers.** Latest (Thu 15 Oct, A, target 15): 110x13 x 5. Last B (Sat 10 Oct, target 20): 90x20 x 5 (last set 0 RIR).

**Trace.** Range 15 -> 20, so conversion. The R21 floor 110 x 1.433 / 1.667 = 94.6 -> **92.5**. R22: 90. R23: last B
reached 20 -> 90 + 2.5 = 92.5 (equal, so no boost). Action vs latest 110 -> `decrease_weight`, `converted_rep_range`.

**Verdict (a).** 92.5 x 20 is exactly right. It is +1 step over the last B day (90 x 20 x 5, which hit the top), and
it matches the A-day strength converted to 20 reps (94.6). The "-16%" compares a 13-rep A set with a 20-rep B set.
R26 fixes the label: increase_weight vs last B (90 -> 92.5). The A-day calf result (110 x 15, maintain) gets
`below_target_once` under R28a (13 is 2 short).

## Item 6 - Reverse pec deck, Shoulders & Arms A, E1 drop-set 12+12 (`reverse-pec-deck-fly`)
**His numbers.** Only real session: Tue 6 Oct, 6.25x15 x 4 (3 planned sets count). Target 12.

**Trace.** 2.5/6.25 = 40% > 10%, so R8. Every set >= 12 + 2 -> +1 step = **8.75**, reps reset to 12. Drop =
0.75 x 8.75 = 6.6 -> **5**. This is exactly approved **T30**.

**Verdict (c), fine as is.** +40% sounds big, but it is the smallest real step (2.5 kg absolute). The trigger is
strict: he did 3 more reps than the target on every set, with identical reps across 4 sets, which shows the load
was easy. A smaller relative cap would just block the only step that exists (the reason v2 removed the 15% cap).
For hypertrophy, 8.75 kg for 8-12 hard reps is a full stimulus. If he gets fewer than 12, the approved R8 keeps
8.75 until he is back to 12 + 2. Technique note (existing cue): if the shoulders shrug or the torso rocks to finish
reps, the load is too heavy for clean rear-delt work. Keep 8.75 and stop the set there.

Observation, not a rule: he has not logged this machine since 6 Oct. The arm days show `cable-rear-delt-fly`
(4-6 kg) instead. See the open questions.

## Item 7 - Pendulum squat, Legs A (reverse pyramid 8/10/12) and Legs B (pyramid 15/12/10) (`plate-loaded-pendulum-squat`)
**Trace.** No entries, so `collect_data`, `no_history`, weight null. That is correct by the rules (R1.3 needs capacity).

**Verdict (b), gap: no guidance.** A load must **not** be taken from his back-squat history. Pendulum machines differ
in sled weight, leverage and resistance curve, so plate kg do not carry over. But "collect data" with an empty field
gives him nothing to do on his first set.

### R30 - First session on a machine or plate-loaded exercise with no history
When `collect_data` / `no_history` on a machine, plate-loaded or cable exercise, the card shows a "Find your
starting weight" protocol instead of an empty load. The engine still returns weight null, and no number is invented.
EN text (one line each):
1. "Warm up with 2-3 light sets, adding weight each time."
2. "Pick a weight you could lift for about 3 more reps than the target; first sessions stay below your limit."
3. Reverse pyramid: "Then take off about 10% for each lighter set." Pyramid: "Start light and add about 10% each set
   as the reps drop."
4. "Log the weight and how many reps you had left on the heaviest set; next time I will progress from it."
Effort cap: about 3 reps in reserve on the first exposure, whatever the block week (learning a new machine, never
grinding squats). From the second session the normal rules apply (R1.1 / R2.1; R12b allows up to 2 steps).

If he keeps doing the back squat in these slots (a product choice, see the open questions), the back squat is a
sound substitute for this block. For the Legs A reverse pyramid, the approved R25 would give about **90 x 8,
85 x 10, 80 x 12** from his 15 and 18 Oct sessions. Stop 1-2 reps short; if the 10s slow down, use 82.5. That
number is for information only until the Tech Lead wires the substitution and replays it.

---

## Test cases (T73+)
Real numbers from his block-6 log unless marked "variant". Today = the next session of that slot.

| # | Rule | Input | Expected |
|---|---|---|---|
| T73 | R26a/b | `cable-lat-pulldown-underhand-grip` B 3x12, step 2.5; latest A 70x10, 70x10, 70x8 (target 10); same-day B 65x12 x3 | **67.5 x 12**, `increase_weight` (was decrease), reason `same_day_boost`; text uses 65 kg / 12·12·12 |
| T74 | R26a | `standing-calf-raises-toes-neutral` B 5x20; latest A 110x13 x5 (target 15); same-day B 90x20 x5 | **92.5 x 20**, `increase_weight` (was decrease); comparison "vs last Legs B: up 2.5 kg" |
| T75 | R26a no ref | `dumbbell-bench-press` B 3x12 (= T57); latest A 30x12, 30x10, 30x10; no B session | **28 x 12**, `maintain` (was decrease), `converted_rep_range`, "adjusted to 12 reps" |
| T76 | R26a equal | `cable-straight-arms-pull-downs` B 3x15; latest A 27.5x12, 27.5x15, 27.5x12; same-day B 27.5x15 x3 | **27.5 x 15**, `maintain` (unchanged) |
| T77 | R27 | `incline-dumbbell-press` B pyramid [14,12,10], step 2; last pyramid 28x14, 30x12, 30x10; latest A 32x6 x3 (target 8) | **28 / 30 / 30**, `maintain`, `recent_miss_cap` (was 28/30/32) |
| T78 | R27 not met | Variant of T77: latest A 32x7 x3 | 1 short only -> **28 / 30 / 32**, `increase_weight` (unchanged R2.1) |
| T79 | R27 vs proof | Variant: last pyramid 28x14, 30x12, 32x10; latest A 32x6 x3 | R2.1 top 34 -> R27 cap 30 -> proof floor 32 (32x10) -> recalc -> **28 / 30 / 32**, `maintain`, `achieved_floor` |
| T80 | R27 scope | `incline-dumbbell-press` A 3x8; latest 32x6 x3 (target 8, same target today) | R27 not applied (rep target not higher) -> **32 x 8**, `maintain`, `below_target_once` (R28a) |
| T81 | R28a | `standing-calf-raises-toes-neutral` A 5x15; latest 110x13 x5 | **110 x 15**, `maintain`, `below_target_once` (was slightly_below_target) |
| T82 | R28a control | `cable-lat-pulldown-underhand-grip` A 3x10; latest 70x10, 70x10, 70x8 | median 10 -> **70 x 10**, `maintain`, `slightly_below_target` (unchanged) |
| T83 | R28b | Variant: incline A 3x8: A 32x6 x3, then B pyramid 28x14, 30x12, 30x10, then A 32x6, 32x6, 32x6 again | S1, S2 = the two A sessions at 32, shortfall 2, total 18 <= 18 -> **30 x 8**, `decrease_weight`, `below_target_twice` |
| T84 | R28b improving | Variant of T83: second A 32x7, 32x7, 32x6 (20 > 18) | **32 x 8**, `maintain`, `below_target_once` |
| T85 | R28c + R26 | Incline A 3x8 next Monday. Latest = hypothetical Thu 22 B 28x14, 30x12, 30x10; previous A 32x6 x3 | conversion "original too easy" -> 32; R18 **not** applied (pyramid) -> **32 x 8**, `maintain` vs last A 32, reason `below_target_once` with the A numbers (now: 30 x 8 consolidate_load) |
| T86 | R28c control | `smith-machine-shoulder-press` = T47 (straight, 20x10, 22.5x10, 22.5x10) | **22.5**, `consolidate_load` (unchanged) |
| T87 | R29 + R27 | `cable-crunch` B 3x15; latest A main 30x6, 30x6, 27.5x10 (target 10); same-day B 27.5x15 x3 | **27.5 x 16-17**, `increase_reps` (was 30 x 15) |
| T88 | R29 earned | Variant: same-day B 27.5x17 x3; latest A 30x10 x3 (no miss) | +1 step -> **30 x 15**, `increase_weight` |
| T89 | R28a on R16 | `cable-crunch` A drop-set 10+10; latest 30x6, 30x6, 27.5x10 | **30 x 10**, `maintain`, `below_target_once` (label only); drop 0.75 x 30 = 22.5 |
| T90 | unchanged | `reverse-pec-deck-fly` A drop-set 12+12 = T30: last 6.25x15 x4 | **8.75 x 12**, drop **5** (unchanged) |
| T91 | R12a config | Variant: per-exercise step 1.25 configured for the pec deck | 1.25/6.25 = 20% -> R8, 15 >= 14 -> **7.5 x 12**, drop 0.75 x 7.5 = 5.6 -> **5** |
| T92 | R30 | `plate-loaded-pendulum-squat` Legs A RP [8,10,12], no entries (back-squat entries exist) | `collect_data`, weight **null**, first-session protocol shown; no load derived from `back-squat` |
| T93 | R30 then normal | Variant: first session RP 80x8 (RIR 3), 72.5x10, 65x12 | Second session normal R1.1: 8 hit -> top **82.5**; back-offs by R1.2 / R25b |

**Effects on approved tests (Tech Lead to update assertions; loads unchanged):** action only. T53/T61
`maintain` -> `increase_weight` (top 30 vs last B 28). T54 `maintain` -> `increase_weight` (25 vs last B 22.5). T37/T57
`decrease_weight` -> `maintain`. T57b, T64, T65 unchanged. Engine tests that assert `slightly_below_target` with a
median shortfall >= 2 change to `below_target_once`. **Invariants:** R27 and R28b only lower loads, to
`max(step, W - step)` (never 0 kg, only real steps). R29 adds at most one step. No rule raises a load above R12b.

## Plain explanation for Sebas
- **Lat pulldown and calves (Thursday, Saturday):** the weights are right; they are heavier than your last B day.
  The app said "decrease" because it compared with your A day, which uses fewer reps. It will now say "up 2.5 kg vs
  last B".
- **Incline B (Thursday):** on Monday 32 kg gave you 6 reps. Asking for 32 x 10 on Thursday was too much, so the top
  set stays at 30 kg (28 / 30 / 30). Try to beat 10 reps. When you get 7 or more at 32 on an A day, the B day goes up.
- **Incline A (next Monday):** stay at 32 kg and build toward 8. If you get 6/6/6 again, the app drops to 30 kg so you
  don't stall.
- **Crunch B (Thursday):** 27.5 kg for 16-17 reps (abs progress reps first), not 30 x 15.
- **Reverse pec deck (today):** 8.75 kg is the next real step after easy 15s. Stop the set if you start shrugging.
- **Pendulum squat:** the app will guide your first session (find a weight with about 3 reps to spare) instead of
  showing a blank.

## Other replay observations (no rule change now)
- `high-cable-fly` B: 17.5 x 15 (the A day was 17.5 x 12 x 3; last B 15 x 15 x 3). Under R26 this shows as +2.5 kg
  vs last B. It is a stretch, but not unsafe. Watch it in the next replay; if he misses by 2+, R27 caps it next time.
- R23 never lets a B day go above the latest A load (for example straight-arm pulldown B stays at 27.5). That is
  intended: the A day leads, and it progresses next Monday (30 x 12).

## ⚠️ Open decisions
- ⚠️ REVISAR (product): the plan has `plate-loaded-pendulum-squat` on both leg days, but he logs `back-squat` there
  (7, 10, 15, 18 Oct). Should the slot follow the back squat he actually does (substitution), or stay pendulum? PT
  view: either is fine for this block; the back squat must not seed pendulum loads.
- ⚠️ REVISAR (product): same pattern for `reverse-pec-deck-fly`, where he logs `cable-rear-delt-fly` on arm days
  since 9 Oct. Same question.
- ⚠️ REVISAR (equipment fact): does the reverse pec deck have a 1.25 kg add-on (his 6.25 kg suggests it)? If yes,
  the Tech Lead configures step 1.25 (R12a) and the next load is 7.5 kg (T91). If no, 8.75 stays.
- Tech Lead only: names for `recent_miss_cap` and the evidence field for the same-day reference; Spanish strings are
  written by the PT after the English text is approved.

## Sources
- Epley B. (1985) *Poundage Chart* (e1RM).
- Helms ER et al. (2016) Application of the repetitions in reserve-based RPE scale. *Strength Cond J* 38(4):42-49.
- Zourdos MC et al. (2016) Novel resistance training-specific RPE scale measuring repetitions in reserve. *J Strength
  Cond Res* 30(1):267-275.
- Schoenfeld BJ et al. (2021) Loading recommendations for muscle strength, hypertrophy, and local endurance: a
  re-examination of the repetition continuum. *Sports* 9(2):32.
- American College of Sports Medicine (2009) Progression models in resistance training for healthy adults. *Med Sci
  Sports Exerc* 41(3):687-708 (progressive overload, conservative starting loads).
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (double progression, load increments).
- Helms E., Morgan A., Valdez A., *The Muscle and Strength Pyramid: Training*, 2nd ed. (reps-first progression, stall handling).
- Approved: `docs/fitness/approved/2026-10-07-progression-engine-spec.md` (R1-R11),
  `docs/fitness/approved/2026-10-07-progression-engine-spec-v2.md` (R12-R19, T30, T37, T47),
  `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md` (R20-R24, T53-T63),
  `docs/fitness/approved/2026-10-18-ab-days-and-progression.md`,
  `docs/fitness/approved/2026-10-19-reverse-pyramid-after-strong-b.md` (R25, T64-T72).
