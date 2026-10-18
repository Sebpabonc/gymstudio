---
title: Volume progression on A/B days - should total kg x reps always rise, and what the app should show
status: approved
author: pt-fitness-expert
created: 2026-10-18
approved_by: Sebas (PO) — "ok ok, sí a todo, implementa" (all PT recommendations)
approved_on: 2026-10-18
exercises: [smith-machine-shoulder-press, incline-dumbbell-press, dumbbell-bench-press, standing-db-lateral-raises]
---


> **PO decision 2026-10-18:** every ⚠️ REVISAR item is resolved with the PT's recommended option. Spanish
> wording in this doc is approved as written. Tech Lead notes: drop-set work counts in total weight moved
> (Trends §4.4 and current `volumeForSets()`); cross-exercise totals stay hidden.

## Summary
The PO asked (2026-10-18): "The volume of A and B should always keep increasing. A is heavier with fewer
reps and B has more reps, but total volume (kg x reps x sets) should always be pushing higher so there can
be more growth, right?" Short answer: **partly**. Doing more work over a block is good, and his total
kg x reps will usually trend up from week 1 to week 5. But it is not the thing that makes muscle grow, and it
should not go up every session or every week. This draft explains why, says which comparisons are fair on
A/B days, and proposes exact display rules (V1-V10) with test cases. It changes no engine rule and no
recommended load. It fits option A of the UXer plain-wording proposal
(`docs/ux/proposals/2026-10-18-plain-strength-wording.md`).

No new exercises and no new technique cues. Ids used: `smith-machine-shoulder-press`,
`incline-dumbbell-press`, `dumbbell-bench-press`, `standing-db-lateral-raises`.

Terms used (plain words in brackets):
- **Volume load** (total kg x reps, "total weight moved") = sum of kg x reps over working sets.
- **Hard sets** ("sets that count") = working sets ending about 0-4 reps short of failure.

---

## 1. Evidence: is "volume load must always rise" a sound hypertrophy goal?

### 1.1 What the research counts as "volume"
- The hypertrophy dose-response studies count **hard sets per muscle per week**, not kg x reps.
  More weekly hard sets give more growth on average, with smaller gains per extra set at higher volumes
  (Schoenfeld, Ogborn & Krieger 2017; Pelland et al. 2024; Baz-Valle et al. 2022).
- Growth is similar across a wide load range (about 6-30 reps) **when sets are taken close to failure**
  (Schoenfeld et al. 2017 low- vs high-load meta-analysis; Schoenfeld et al. 2021 repetition continuum;
  Morton et al. 2016 in trained men; Lasevicius et al. 2018). So a hard set of 8 on A and a hard set of 14 on
  B are about the **same growth dose**, even though the B set moves far more total kg.
- Volume load (kg x reps) is a **workload** measure (Haff 2010; Scott et al. 2016). It is useful for "did I
  do more work on this lift than before?", but it does not predict growth well when rep ranges differ.

### 1.2 What "progressive overload" actually needs
- The muscle needs a reason to keep adapting: the **same number of hard sets done with more performance**
  (more reps at a weight, or more weight at the target reps) at a similar effort. Plotkin et al. 2022
  found similar growth whether people progressed by adding load or by adding reps.
- When performance goes up at fixed sets, volume load goes up too. So rising volume load is often a
  **result** of progress, not the goal itself.

### 1.3 Why volume load cannot (and should not) rise every time
1. **Weight jumps lower it for a while.** Double progression: when the load goes up one step, reps drop,
   and kg x reps is often lower that session. Real example: Smith press B, 22.5 kg x 12 x 3 = 810 kg; next B
   (hypothetical, test V-T1) 25 kg x 10, 10, 9 = 725 kg (-10%). He is stronger (best set adjusted for reps
   +6%), but moved less total weight. That is normal and good.
2. **It only goes up within limits.** With fixed sets and rep ranges, kg x reps can only rise as fast as
   reps and loads rise. For an advanced lifter that is a few percent per week at best, with flat weeks.
3. **The block is built to rise, then drop.** Weeks 1-5 go from about 3 reps in reserve to about 1, so
   reps and loads usually climb and kg x reps tends up. Week 6 is a deload (half the sets in the engine,
   rule R4): total kg x reps drops a lot **on purpose**, so fatigue can clear and the next block starts
   fresh (Bell et al. 2023 deload consensus; Coleman et al. 2024).
4. **Chasing the number backfires.** Ways to "force" kg x reps up without getting stronger: adding junk
   sets, shortening the range of motion, slower rest-pause reps counted as full reps, or lighter weights
   for many more reps. Adding sets every week also raises fatigue faster than growth past a point
   (approved 2026-10-18 A/B spec, section 1). The engine does not add sets, and should not.
5. **The next block changes it by design.** The PO approved narrowing the A/B gap next block (B main lifts at
   10-12 reps instead of 12-15). B's kg x reps will probably be **lower** than this block's B, with the same
   growth stimulus. Comparing block to block in kg x reps would wrongly look like a step back.

### 1.4 Verdict
- **Sound as a long-run tendency, not as a rule.** Over weeks 1-5 of a block, total kg x reps per exercise
  will usually rise. Every session or every week: no.
- **The best "keep pushing" signal for growth** is: same hard sets per muscle (already about 18/week for chest
  and back), plus the **best set getting stronger** (more reps or more kg) at the planned effort.

---

## 2. A vs B: what to compare with what

| Comparison | Fair? | Why |
|---|---|---|
| Volume load, A session vs B session | **No** | B always "wins" (more reps). Incline: B Thu 8 Oct 28 x 14, 12, 12 = 1064 kg vs A Mon 12 Oct 30 x 10, 8, 8 = 780 kg. That says nothing about progress. (Already ruled out, approved X8.) |
| Volume load, A vs last A, B vs last B | Yes, as a **fact** | Same rep target, same exercise. But it can dip after a weight jump (1.3.1), so it is not a verdict. |
| Weekly volume load per exercise, A + B together vs last complete week | Yes, as **context** | One number per week that does not depend on which day was last. Already in the lift detail ("Weekly total volume (kg x reps)", approved 2026-10-10 trends 4.4). |
| Strength by best set (Epley behind the scenes), any day | Yes, the **headline** | Approved X1-X7; UXer option A shows it as real sets. |
| Hard sets per muscle per week | Yes, the **dose** | Approved Thresholds 7 and Interpretation 4. |

### When a flat or lower week is fine (plain list for the PO)
- The weight went up this week (fewer reps at the new weight is the normal first step).
- Deload week (week 6), or the first week after a deload or a break.
- A day was missed or a set was skipped (fewer sets = less total, not less strength).
- Strength (best set) went up or stayed the same, even if total kg x reps went down.
- First week of a new block with different rep targets.
- Ordinary day-to-day variation (sleep, food, stress) of a few percent.

Worth a closer look (the app already handles this through approved rules, no new alarm): the same day type
drops on most sets for about 3 sessions in a row while the best set does not improve (approved trends 9,
"Worth a look", factual only).

---

## 3. Rules for the app (proposed)

Shared definitions reused, not redefined: working set = `workingSets()`; equipment step (Interpretation 2.2);
deload = block week 6; week = Monday-Sunday; complete week for an exercise = every planned day type of that
exercise logged (same as X7). No change to `src/trainer/engine.ts` or any recommended load (AI Trainer
checklist item 4).

**V1 - Volume load.** `sessionVolumeLoad = sum(kg x reps)` over working sets of one exercise in one session,
warm-ups excluded, implausible sets excluded (Interpretation 3). Drop-set parts **included** (as approved in
trends 4.4 and as `volumeForSets()` already does). Bodyweight without added load: not computed (existing
text). `weeklyVolumeLoad` = sum of `sessionVolumeLoad` for that `exerciseId` in the week, A and B together.

**V2 - Never compared.** A session vs B session; different exercises; sums across exercises or muscles; a
deload week vs a normal week; across blocks when the rep target changed (show "Different rep target").

**V3 - The headline stays strength.** In Workout mode and on the Completed screen, the "keep pushing" line is
the approved strength line (X1-X6) in UXer option A wording ("Stronger than last time ... 25 kg x 10 vs
22.5 kg x 12"). **No volume-load line in Workout mode** (keeps the screen clean; avoids a red-looking dip
after a weight jump).

**V4 - Weekly line in the lift detail (complete weeks only).** Compare `weeklyVolumeLoad` with the previous
complete non-deload week. Band:
| Change | Label |
|---|---|
| >= +5% | "More than last week" |
| between -5% and +5% | "About the same as last week" |
| <= -5% | "Less than last week" (never red, never a down arrow; add V5 note when one applies) |

Reason for +/-5% (not 3%): one extra rep on one set moves a weekly total of about 1,400 kg by about 2%, and
logging differences are bigger than in the best-set number. Incomplete week: "This week so far: {b} kg
({n} of {m} days)", no comparison.

**V5 - Context notes for a lower week (first match only, all factual):**
| Code | Condition (same week, this exercise) | Note |
|---|---|---|
| N1 | Deload week | "Deload week: less on purpose." (no comparison shown) |
| N2 | Top working load rose by >= 1 equipment step in any session vs the matching day last week | "Heavier weight this week - fewer reps at a new weight is normal." |
| N3 | Fewer working sets than last week | "{s} sets this week vs {t} last week." |
| N4 | First complete week after a deload or a gap >= 21 days | "First week back after a break." |
| N5 | Weekly best set is "stronger" or "same strength" (X7) | "Your best set held or improved." |
None of the notes may say "weaker", "went backwards", "too easy", "you should", or mention fatigue,
recovery, sleep or health.

**V6 - Block trend (the "always progressing" view, over weeks).** From 3 complete non-deload weeks in the
current block: "Week 1 -> week {n}: {a} -> {b} kg ({+/-p}%)". Same +/-5% band and words as V4. Deload week shown
as a labelled bar, not in the comparison. This is the number that should usually rise over a block; it is not
a target.

**V7 - Same day type, session fact (lift detail session table only).** Next to the approved per-session
verdict, show "Total: {b} kg (last {A|B}: {a} kg)" with no label. If N2 applies, append "heavier weight". The
approved verdict (Improved / Held / Dropped / Traded / Mixed) stays the judgement.

**V8 - High-rep lifts.** For lifts where every set is above 12 reps (for example lateral raises, approved C5),
the weekly A+B volume load is the **only** cross-day weekly number. V4-V6 apply as they are (no Epley needed).

**V9 - No targets, no prescriptions.** Never "beat {x} kg", "add a set", or a goal line on the chart. The
engine never uses volume load to change sets or loads.

**V10 - Plain wording (fits UXer option A, one name).** Use "Total weight moved (kg x reps)" everywhere
instead of "volume", "tonnage" or "volume load". Spanish versions will be written after the PO approves the
English text.

Info text (sheet or tooltip, English source):
"Total weight moved = kg x reps of your working sets, A and B days added together. It usually goes up over a
block, but not every week: a heavier weight means fewer reps at first, and deload weeks are lower on purpose.
For muscle growth, the sets you take close to failure matter more than this total. Your best set shows if
you are getting stronger."

---

## 4. Test cases

Real values come from the logs quoted in the approved 2026-10-13 and 2026-10-18 specs. Values marked
(hyp.) are hypothetical until the Tech Lead replays a fresh read-only export.

| # | Rule | Input | Expected |
|---|---|---|---|
| V-T1 | V1, V7, N2 | `smith-machine-shoulder-press` B Fri 9 Oct 22.5 x 12, 12, 12 (810 kg) -> B Fri 16 Oct (hyp.) 25 x 10, 10, 9 (725 kg) | Session table: "Total: 725 kg (last B: 810 kg), heavier weight". Verdict stays the approved one (Traded). Strength line (option A): "Stronger than last time ... 25 kg x 10 vs ..." per X-rules. No "Less" label at session level. |
| V-T2 | V2 | `incline-dumbbell-press` A Mon 12 Oct 30 x 10, 8, 8 (780 kg) vs B Thu 8 Oct 28 x 14, 12, 12 (1064 kg) | Never compared; no line. |
| V-T3 | V4, N2 | Smith week 1: A Tue 6 Oct (hyp.) 22.5 x 10 x 3 = 675 + B 810 = 1485. Week 2: A Tue 13 Oct 25 x 10, 8, 8 = 650 + B (hyp.) 725 = 1375 | -7.4% -> "Less than last week" + N2 "Heavier weight this week - fewer reps at a new weight is normal." Neutral style. |
| V-T4 | V4 band | Weekly 1400 -> 1430 (+2.1%) | "About the same as last week". |
| V-T5 | V4 band | Weekly 1375 -> 1500 (+9.1%) | "More than last week". |
| V-T6 | V4 boundary | 1400 -> 1470 (+5.0% exactly) | "More than last week" (>= +5%). 1400 -> 1330 (-5.0%) -> "Less than last week". |
| V-T7 | V4 incomplete | Week 3, only A logged (650 kg), B not yet | "This week so far: 650 kg (1 of 2 days)", no comparison. |
| V-T8 | N1, V2 | Week 6 deload, half the sets | "Deload week: less on purpose."; not compared with week 5. Week 7 not compared with week 6 (N4 applies to week 7 vs week 5 only if Tech Lead keeps last non-deload week as baseline; see open decision). |
| V-T9 | N3 | Week has 5 working sets vs 6 last week, same loads, -12% | "Less than last week" + "5 sets this week vs 6 last week." |
| V-T10 | N5 | Lower week, no weight jump, no fewer sets, weekly best set "same strength" | "Less than last week" + "Your best set held or improved." |
| V-T11 | V6 | Smith weeks 1-5 complete: 1485, 1375, 1450, 1530, 1560 | From week 3: "Week 1 -> week 3: 1485 -> 1450 kg, about the same"; at week 5: "1485 -> 1560 kg (+5%)", "More". |
| V-T12 | V8 | `standing-db-lateral-raises` A 10 x 15 x 3 (450) + B 8 x 20 x 3 (480) = 930 -> next week 960 (+3.2%) | No strength line (C5); weekly: "About the same as last week". |
| V-T13 | V1 drops | Set 60 x 10 + drop 45 x 8 | 960 kg (drop included), 1 hard set. |
| V-T14 | V1 bodyweight | Pull-up, no added load | Not computed; existing "Tonnage not tracked..." text (rename per V10). |
| V-T15 | V2 block change | Next block B at 10-12 reps (approved option D); B total lower than last block | No block-over-block volume verdict; "Different rep target". |
| V-T16 | V3 | Any Workout mode / Completed screen | No volume-load line; only the approved strength line. |
| V-T17 | V9 | Any screen | No "beat {x} kg", no goal line, engine outputs identical with and without these rules (T1-T63 unchanged). |

Consistency: approved Layer 1 (2026-10-10), X1-X7 (2026-10-18), Thresholds and Trends rules are unchanged.
These rules are description only.

---

## ⚠️ Open decisions
- ⚠️ REVISAR: Agree that the main "keep pushing" signal is the best set (strength) plus steady hard sets, and
  that total kg x reps is context that should rise **over the block**, not every week? (Recommended: yes.)
- ⚠️ REVISAR: +/-5% band for weekly total weight moved (recommended) vs +/-3% (same as strength; more noise).
- ⚠️ REVISAR: No volume line in Workout mode (recommended) vs a small same-day-type "Total: x kg (last B: y kg)"
  line there too.
- ⚠️ REVISAR: Rename "Weekly total volume" / "tonnage" to "Total weight moved (kg x reps)" in EN, with an ES
  version after approval (recommended, matches UXer option A "one name" idea).
- ⚠️ REVISAR: Baseline after a deload: compare week 7 with week 5 (last non-deload week) or show no comparison
  for week 7. (Recommended: no comparison for the first week after a deload, note N4 only.)
- ⚠️ REVISAR (Tech Lead, consistency): approved Interpretation 4.2 says drop parts are **excluded** from tonnage,
  while approved Trends 4.4 says **included**, and `volumeForSets()` in `src/progress/insights.ts` includes them.
  This draft follows Trends 4.4 + current code. Please confirm one rule.
- ⚠️ REVISAR (Tech Lead, observation only): `src/progress/insights.ts` still computes a cross-exercise weekly
  volume per session and a whole-block tonnage (`sumBlockVolume`, `volumePerSessionChange`; i18n
  `progress.volume.blockTonnage`). I found no screen rendering them. Approved Trends 4.4 says totals must not be
  summed across exercises, so they should stay unshown.
- ⚠️ REVISAR: The week-1 Smith A session (Tue 6 Oct) and all week-3 sessions in the tests are hypothetical;
  replay on a fresh read-only export before release.

## Sources
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and
  increases in muscle mass: a systematic review and meta-analysis. J Sports Sci. 2017;35(11):1073-1082.
- Pelland JC et al. The resistance training dose-response: meta-regressions exploring the effects of weekly
  volume and frequency on muscle hypertrophy and strength gain. SportRxiv preprint, 2024.
- Baz-Valle E et al. A systematic review of the effects of different resistance training volumes on muscle
  hypertrophy. J Hum Kinet. 2022.
- Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs. high-load
  resistance training: a systematic review and meta-analysis. J Strength Cond Res. 2017;31(12):3508-3523.
- Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Loading recommendations for muscle strength, hypertrophy,
  and local endurance: a re-examination of the repetition continuum. Sports. 2021;9(2):32.
- Morton RW et al. Neither load nor systemic hormones determine resistance training-mediated hypertrophy or
  strength gains in resistance-trained young men. J Appl Physiol. 2016;121(1):129-138.
- Lasevicius T et al. Effects of different intensities of resistance training with equated volume load on muscle
  strength and hypertrophy. Eur J Sport Sci. 2018;18(6):772-780.
- Plotkin D et al. Progressive overload without progressing load? The effects of load or repetition progression
  on muscular adaptations. PeerJ. 2022;10:e14142.
- Haff GG. Quantifying workloads in resistance training: a brief review. Prof Strength Cond. 2010.
- Scott BR et al. Training monitoring for resistance exercise: theory and applications. Sports Med. 2016.
- Bell L et al. Integrating deloading into strength and physique sports training programmes: an international
  Delphi consensus approach. Sports Med Open. 2023.
- Coleman M et al. Gaining more from doing less? The effects of a one-week deload period during supervised
  resistance training on muscular adaptations. PeerJ. 2024.
- Approved GymStudio rules: `docs/fitness/approved/2026-10-18-ab-days-and-progression.md`,
  `docs/fitness/approved/2026-10-10-progress-interpretation.md`, `docs/fitness/approved/2026-10-10-progress-trends.md`,
  `docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`,
  `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md`; UXer proposal
  `docs/ux/proposals/2026-10-18-plain-strength-wording.md` (option A).
