---
title: Progress interpretation rules (early weeks, per-exercise signals, best marks, volume, "watch next session")
status: approved
author: pt-fitness-expert
created: 2026-10-10
approved_by: Sebas (PO) — delegated "do what you consider best", 2026-10-10
approved_on: 2026-10-10
exercises: [incline-dumbbell-press, barbell-bench-press, cable-lat-pulldown-underhand-grip, back-squat, romanian-deadlift, cable-rear-delt-fly, standing-db-lateral-raises, cable-lateral-raise, ez-bb-preacher-curls, dumbbell-curl-incline, high-cable-fly, smith-machine-shoulder-press, lat-pulldown]
---

## Summary
The PO has about one week of block logs (from 2026-10-05). The Progress screen should tell him
which comparisons are already valid, what changed since the last equivalent session, and what to
log to unlock more. This draft sets deterministic rules and test cases for that. It stays consistent
with the approved thresholds (`docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`,
called "Thresholds" below). It adds no new trend verdicts. Every recommendation still comes from the
AI Trainer engine (`src/trainer/engine.ts`). Progress only describes what happened.

Shared definitions (reused, not redefined): working set = `workingSets()`; session e1RM =
`sessionE1RM()` (Epley, best working set); deload = block week 6.

---

## 1. What is valid with only 1 week

### 1.1 Equivalent session (the only valid comparison unit)
Two sessions are **equivalent** when all of these are true:
- same `exerciseId`, and
- same `blockId` **and** same `dayKey` (for example `arms-a` vs `arms-a`, never `arms-a` vs
  `arms-b`), and
- neither session is a deload week, **unless** both are.

A/B days of the same block often have different rep targets and techniques. In his data, Arms A uses
about 12 reps and Arms B about 15–20 reps for the same curls and raises. So they are **not**
equivalent, even for the same exercise.

Legacy entries with `blockId: null` / `dayKey: null` (before 2026-10-05) are equivalent only to
other null-day entries of the same exercise. They still count for best marks (section 3) with the
label "outside the block".

⚠️ REVISAR: should A and B days of the same exercise be comparable when the block's rep target is
the same on both days? I recommend **no** for now (simpler, and safe). Revisit when blocks define
per-day targets that the Progress screen can read.

### 1.2 First session = baseline
- The first logged equivalent session is labelled **"Baseline"**. It is never a "PR", "best" or
  "new record", and it gets no up/down arrow.
- The first log of an exercise ever (all days) is also not a best mark (see section 3).

### 1.3 Hidden until data is enough (from Thresholds, restated)
| Conclusion | Minimum before it can show |
|---|---|
| Improving / flat / declining (e1RM trend) | ≥ 4 non-deload sessions **and** ≥ 14 days span |
| "No new best in N sessions" | best set ≥ 4 non-deload sessions ago **and** ≥ 21 days ago |
| Most improved lift | same as the trend rule, and delta > +2% |
| Push:pull note | last 4 weeks, ≥ 20 classified sets |
| RIR change text | |Δ| ≥ 1.0 and coverage ≥ 30% in both weeks |
| e1RM % change shown as a trend | never from fewer than 4 sessions |

With 1 week, **none** of these may show. Never use "stalling", "plateau", "regressing", "falling
behind" or "overtraining". These need more data, and some imply a diagnosis.

What **can** show after 1 week: Baseline labels, session-vs-previous-equivalent deltas (section 2)
when an equivalent pair exists, raw weekly sets per muscle with the approved "Common range" band,
and the unlock checklist (section 6).

### Test cases
| # | Input | Expected |
|---|---|---|
| 1a | `incline-dumbbell-press` 10-05 `chest-back-a` and 10-08 `chest-back-b` | not equivalent → each is a Baseline; no delta |
| 1b | `dumbbell-curl-incline` 10-06 `arms-a` (10×12) and 10-09 `arms-b` (10×15) | not equivalent → no "reps up" claim |
| 1c | `cable-lat-pulldown-underhand-grip` `chest-back-a` 10-05 and 10-09 | equivalent → section 2 comparison allowed |
| 1d | Exercise with 3 equivalent sessions in 9 days | deltas allowed; trend hidden ("Not enough data yet") |
| 1e | `lat-pulldown` 09-29 (null day) and a block-day session | not equivalent; 09-29 counts only for best marks |
| 1f | First ever session of `back-squat` | "Baseline", no best badge |

---

## 2. Per-exercise progression signals (session vs previous equivalent session)

### 2.1 Comparable sets
Compare **working sets only**. Pair them by set position (set 1 with set 1, and so on).
- **Straight sets** (same planned load and reps on every set): compare position by position.
- **Pyramids / different loads per set** (for example `back-squat` 80×8, 72×10, 70×12): compare
  position by position. **Never** sum or average across positions. Each position has its own
  planned load and reps.
- **Drop sets**: compare only the **main (top) part** of each set. The `drop` part is shown as
  information and ignored for the verdict and for best marks (fatigue makes drops noisy).
- **Supersets**: each exercise is compared on its own. Superset pairing is not a signal.
- **Different rep target** between the two sessions (block changed the target): verdict =
  "Target changed", no improved/dropped label.

### 2.2 Equipment tolerance (rounding)
A load difference is "same load" when `|Δkg| < smallest step for that equipment`:
| Equipment | Step |
|---|---|
| Dumbbells | 2 kg (matches AI Trainer plan) |
| Barbell / Smith / plate-loaded | 2.5 kg |
| Cable / selectorized machine | 2.5 kg ⚠️ REVISAR: some stacks use 5 kg or odd steps (his 6.25 kg pec deck) |
| Bodyweight | load ignored, reps only |

Logged values like 6.25 vs 6 are treated as the same load (below one step).

### 2.3 Per-set verdict
For each paired set (A = previous, B = current):
- **Improved**: load up by ≥ 1 step with reps ≥ A.reps − 1, **or** same load with reps ≥ A.reps + 1.
- **Held**: same load, same reps (±0).
- **Dropped**: same load with reps ≤ A.reps − 1, **or** load down by ≥ 1 step with reps not higher
  than A.reps + 1.
- **Traded**: load up with reps down by 2 or more, or load down with reps up by 2 or more → shown as
  "Heavier, fewer reps" or "Lighter, more reps". No verdict.

Note: "load up, reps −1" counts as improved because it is a normal progression step in double
progression. ⚠️ REVISAR: the PO may prefer this to count as Traded.

### 2.4 Session verdict for the exercise
- **Extra set** at the same load and with reps ≥ the target counts as improved. An extra set alone
  never offsets dropped sets.
- Session = **Improved** if ≥ 1 set improved and none dropped.
- **Dropped** if ≥ 1 set dropped and none improved.
- **Held** if all sets held.
- **Mixed** otherwise ("Some sets up, some down").
- One fewer working set than before = shown as a fact ("2 sets vs 3 last time"), never a "drop".

### Test cases
| # | Previous → current (working sets) | Expected |
|---|---|---|
| 2a | 30×12, 30×12, 30×12 → 32.5×12, 32.5×12, 32.5×12 (barbell) | Improved (load up) |
| 2b | 22.5×12 ×3 → 22.5×15 ×3 (cable, same day key) | Improved (reps up) |
| 2c | 65×10, 60×11, 65×11 → same | Held |
| 2d | 30×12, 30×12, 30×8 → 30×12, 30×12, 30×12 | Improved (set 3 +4 reps) |
| 2e | 26×12 → 28×10 (dumbbell, 1 step, reps −2) | Traded, "Heavier, fewer reps" |
| 2f | 26×12 → 28×11 | Improved |
| 2g | 6.25×15 → 6×15 (machine) | Held (below one step) |
| 2h | Drop set 6×12 + drop 4×12 → 6×12 + drop 4×15 | Held (drop part ignored) |
| 2i | Pyramid 80×8, 72×10, 70×12 → 80×9, 72×10, 70×11 | Mixed |
| 2j | 3 sets → 4 sets, 4th at same load and target reps | Improved (extra set) |
| 2k | Target 12 → target 15 between the sessions | "Target changed", no verdict |

---

## 3. Best marks

Three kinds, per exercise, from **working sets** (main part only, never drops, never deload):
1. **Heaviest weight** for a given rep count (or more): "Heaviest for 10+ reps: 32.5 kg".
2. **Most reps** at a given weight (same step tolerance as 2.2): "Most reps at 22.5 kg: 15".
3. **Best e1RM** (Epley; only sets with ≤ 12 reps count, because Epley is unreliable above that).
   ⚠️ REVISAR: a 12-rep cap leaves many of his isolation sets (15–20 reps) without an e1RM. That is
   intended. Those lifts show marks 1 and 2 only.

Every mark stores **value, date, dayKey, set position**. It is displayed with date and context, for
example "15 reps at 22.5 kg, 10-08, Chest & Back B".

**When a mark is meaningful:**
- Not from the first ever session of that exercise (that is the baseline).
- A new mark must be **strictly greater** than the previous one (a tie is not new).
- The "New best" badge needs at least 1 earlier session of the exercise (any day key).
- Bodyweight with no added load: only "most reps".
- Implausible values (reps > 50, or weight 0 on a weighted exercise) are not used for marks and are
  flagged for review. In his data, `lat-pulldown` on 09-29 has 83 reps at 0 kg (likely a typo).

### Test cases
| # | Input | Expected |
|---|---|---|
| 3a | `barbell-bench-press` first ever 35×12 on 10-08 | no badge (baseline) |
| 3b | Next session 32.5×10 on 10-09 | no new e1RM best (Epley 35×12 = 49.0 > 32.5×10 = 43.3) |
| 3c | `cable-straight-arms-pull-downs` 22.5×12 → 22.5×15 | "Most reps at 22.5 kg: 15" new best |
| 3d | Same value repeated | no badge (tie) |
| 3e | `cable-rear-delt-fly` drop 4×12 | ignored for marks |
| 3f | `lat-pulldown` 0 kg × 83 | excluded, flagged as possible entry error |
| 3g | Set of 20 reps | no e1RM; counts for "most reps" only |

---

## 4. Volume

### 4.1 Definitions
- **Tonnage (load volume)** = Σ (reps × kg) over working sets, main part only. Shown per exercise
  per session, as secondary information only.
- **Hard sets per muscle** = working sets weighted 1 per primary muscle and 0.5 per secondary muscle
  (catalogue-v2 `primary_muscles` / `secondary_muscles`), shown against the approved "Common range"
  10–20 band. This is the **main** volume number.

### 4.2 Limitations (shown as an info tooltip, not as warnings)
- Tonnage ignores bodyweight exercises (load 0) and misreads assisted machines.
- Machines, cables and free weights are not comparable in kg (pulleys, cams and stacks differ).
  Tonnage is compared **only within the same exercise**, never summed across exercises or muscles.
- Drop sets: the drop part is excluded from tonnage and counts 0 extra hard sets.
  ⚠️ REVISAR: some coaches count a drop as +0.5 set. I recommend 0 for simplicity.
- More volume does not mean more progress. Higher-rep days naturally show more tonnage.
- Sets without RIR are assumed to be hard (working sets). Warm-ups must be excluded by
  `workingSets()`.

### 4.3 Weekly comparison
- Week = Monday–Sunday, aligned to the block week.
- Compare hard sets per muscle week vs week **only for complete weeks** (the earlier week finished
  and the current week ≥ 4 of the planned days logged). Otherwise show "This week so far: {n} sets".
- Deload week is shown but labelled "Deload week", with no comparison to the week before.
- Wording: "Glutes: 12 sets (last week 10)". No "up/down good/bad", no colours.

### Test cases
| # | Input | Expected |
|---|---|---|
| 4a | `romanian-deadlift` 3×10×50 | tonnage 1500 kg |
| 4b | `cable-rear-delt-fly` 3× (6×12 + drop 4×12) | tonnage 216 kg; 3 sets (no drop credit) |
| 4c | Week 1 complete, week 2 has 2 of 5 days | "This week so far", no comparison |
| 4d | Tonnage of leg press vs back squat | never compared or summed |
| 4e | Exercise with primary Glutes, secondary Hamstrings, 3 sets | Glutes +3, Hamstrings +1.5 |

---

## 5. "Watch next session" observations

Purely factual, at most **3 per day**, per exercise of the next planned day, based only on the last
equivalent session. They describe; the AI Trainer engine prescribes. If the engine already shows a
recommendation for that exercise, the observation must not contradict it and must not add a new
load or rep number.

Allowed observations (exact templates):
| Code | Condition | Text |
|---|---|---|
| W1 | last set reps < target min | "Last time: last set was {r} reps (target {t})." |
| W2 | all sets ≥ target max at the same load | "Last time: all sets reached {t} reps at {w} kg." |
| W3 | same load in the last 2 equivalent sessions | "Same load ({w} kg) in the last 2 sessions." |
| W4 | last-set RIR = 0 | "Last set was logged at 0 reps in reserve." |
| W5 | no RIR logged last time | "Tip: log reps in reserve on your last set." |
| W6 | only a baseline exists | "First comparison next time (baseline {date})." |

Priority: W1 > W2 > W3 > W4 > W6 > W5.

Not allowed: "you should…", "increase/decrease to X" (unless it quotes the engine's own output),
"you are stalling", any reference to pain, injury, fatigue, recovery, sleep or health.

### Test cases
| # | Input | Expected |
|---|---|---|
| 5a | `plate-loaded-t-bar-row-chest-supported` 10-05: 12, 12, 8 (target 12) | W1 "last set was 8 reps (target 12)" |
| 5b | `barbell-bench-press` last set RIR 0 | W4 |
| 5c | `cable-lat-pulldown-underhand-grip` same 65 kg on 10-05 and 10-09 | W3 |
| 5d | Engine recommends +2.5 kg | no observation states a different number |
| 5e | 4 eligible observations | top 3 by priority |

---

## 6. What to log to unlock comparisons

Shown as a checklist on Progress (per item, done/not done):
1. **Complete a second session of each plan day** (`chest-back-a`, `chest-back-b`, `arms-a`,
   `arms-b`, `lower-body-a`, …) → unlocks section 2 deltas for that day.
2. **Log RIR on the last working set** of each exercise → unlocks W4 and the RIR chart (coverage
   ≥ 30% per week for the Thresholds rule).
3. **Use the same plan day key** (do not log a Chest & Back A exercise under B) → keeps sessions
   equivalent.
4. **4 sessions over ≥ 14 days** of a lift → unlocks the trend (about week 3–4 of the block for A/B
   lifts done once per week).
5. **Log the drop part inside the set** (as he already does) rather than as a separate set.

Unlock dates are estimates and should be shown as "after about N more sessions", not as dates.

Observed in his data: RIR is logged on most last sets since 10-07 (good). No exercise yet has 2
equivalent sessions except possibly the Chest & Back A lat pulldown (see open question 1).

---

## ⚠️ Open decisions
- ⚠️ REVISAR: **Possible duplicate entry**. `cable-lat-pulldown-underhand-grip` on 10-09 under
  `chest-back-a` has exactly the same sets as 10-05 (65×10, 60×11, 65×11) and no timestamps, and
  10-09 was also logged as Arms B. Was this a real session or a copied log? If copied, the first
  "Held" verdict would be misleading. The Tech Lead should check, and the PO should confirm.
- ⚠️ REVISAR: A vs B days comparable when targets match? (I recommend no.)
- ⚠️ REVISAR: "load up, reps −1" = improved (my recommendation) or traded?
- ⚠️ REVISAR: cable/machine step size per gym (2.5 kg default; his stacks show 6.25 kg and 22.5 kg).
- ⚠️ REVISAR: drop sets count 0 extra hard sets (recommended) or 0.5.
- ⚠️ REVISAR: e1RM only for sets of ≤ 12 reps.
- ⚠️ REVISAR: the `lat-pulldown` 09-29 0 kg × 83 entry looks like an entry error. Should the PO fix
  or delete it?

## Sources
- Thresholds approved 2026-10-10: `docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`.
- Helms ER et al. Application of the repetitions in reserve-based RPE scale. Strength Cond J 2016.
- Schoenfeld BJ et al. Dose-response of weekly training volume and muscle mass. J Sports Sci 2017.
- Reynolds JM et al. Prediction of one repetition maximum strength from multiple repetition maximum
  testing. J Strength Cond Res 2006 (accuracy drops at higher reps).
- NSCA Essentials of Strength Training and Conditioning, 4th ed. (progression, double progression).

## PO decisions (2026-10-10, delegated to Tech Lead recommendations)
1. No comparison between A and B days; equivalent = same exercise + blockId + dayKey, non-deload.
2. "Load up, reps −1" counts as Improved.
3. e1RM only from sets of ≤12 reps; higher-rep lifts are tracked by kg × reps.
4. A drop set counts as one hard set (no extra).
5. Equipment steps: dumbbells 2 kg, everything else 2.5 kg (PO decision 2026-10-07).
6. The 2026-10-09 chest-back-a bench/lat entries and the 2026-09-29 0 kg × 83 entry are to be removed by the PO in the app (likely copies/typos).
The ⚠️ REVISAR notes above are resolved by this section.
