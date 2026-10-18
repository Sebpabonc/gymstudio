---
title: A/B days and progression - is a lighter B day right, and how to compare with "last time" regardless of A or B
status: approved
author: pt-fitness-expert
created: 2026-10-18
approved_by: Sebas (PO) — "termina todo", PT recommendations
approved_on: 2026-10-19
exercises: [incline-dumbbell-press, smith-machine-shoulder-press, dumbbell-bench-press]
---

## Summary
The PO asked (2026-10-18) whether B days being lighter than A days is right, and wants every exercise
compared with the previous time it was done, whatever the day. Short answer: a heavy A day plus a lighter,
higher-rep B day is a valid, evidence-backed design for hypertrophy, and "lighter" is not "softer" when the
effort (reps in reserve) is the same. But the PO's instinct is partly right. Every day type must keep
progressing, and the app should show one cross-day number so "vs last time" always makes sense. This
draft proposes that number (an estimated 1-rep max, "Est. max"), exact rules so it does not mislead, the
wording, design options for the block, and test cases from his real logs.

No new exercises and no new technique cues. Ids used: `incline-dumbbell-press`,
`smith-machine-shoulder-press`, `dumbbell-bench-press`.

---

## 1. Is a heavy/light (A/B) split valid for his goal?

**Goal and context:** hypertrophy, advanced lifter, 6 days a week, each muscle twice a week
(`block-2026-10-05-hypertrophy-flat-pyramid-ii`). A = lower reps, heavier (for example incline press
3 × 8). B = same exercises, higher reps, lighter (for example incline pyramid 14 / 12 / 10).

**Yes, it is valid.** What the evidence says, in plain words:
- **Muscle growth happens across a wide rep range when sets are taken close to failure.** Meta-analyses
  (Schoenfeld et al. 2017; Schoenfeld et al. 2021 "repetition continuum") found similar hypertrophy with
  lighter and heavier loads when effort is high. Heavier loads build more maximal strength. So a 14-rep set
  at 1-2 reps in reserve is a full growth stimulus, not a "rest" set.
- **Changing reps and load within the week (daily undulating periodization, DUP) works.** Rhea et al. 2002
  found DUP improved strength more than linear periodization in trained men. For hypertrophy, the
  Grgic et al. 2017 meta-analysis found **no difference** between DUP and linear models. So DUP is not
  magic for size, but it is not worse either. Moesgaard et al. 2022 reached a similar conclusion:
  periodization (including undulating) helps strength, with no clear extra effect on hypertrophy when
  volume is equal.
- **Why B is lighter by design:**
  1. *Rep-range variety:* both ends of the hypertrophy range get trained, and the strength from A days
     carries over to B days (and the other way round, through work capacity).
  2. *Fatigue and joint management:* two heavy days per muscle per week on presses and squats add up,
     on top of 6 sessions a week. A lighter B day lets the same muscle get hard sets with less joint
     and connective-tissue stress, so the next A day is not done tired.
  3. *Technique and stretch work:* higher-rep B sets suit slower eccentrics (for example the 3-second
     lowering on the Smith press B day) and the last-set extras.

**Why "lighter" does not mean "no progress":** the effort plan is the same on both days (week 1 about
3 reps in reserve, rising to about 1 by week 5). A B day is "soft" **only** if the sets end far from
failure. That is the real thing to check, not the kg.

**Where the PO is right (honest note from his logs):** in week 1 the B loads were too conservative.
Smith press B, Fri 9 Oct: 22.5 kg × 12 on all 3 sets with a target of 10. Exceeding the target by 2 reps
on every set means the sets were easier than planned. The approved engine amendment (R23 same-day boost,
2026-10-13) already corrects this (B recommendation went to 25 kg × 10). So: B was lighter by design,
**and** in week 1 it was also lighter than it should have been. Both statements are true.

**What "always pushing harder" should mean for an advanced lifter:** not more kg every single session.
That is not realistic at his level, and forcing it leads to grinding and form breakdown. It means:
- each day type beats its own last session (more reps at the same load, or more load at the target reps),
- effort rises through the block as planned (RIR 3 → 1 from week 1 to week 5),
- the estimated max trends up across the block (weeks, not sessions),
- volume stays in the productive range (about 18 weekly sets for chest and back already). Adding sets
  every week is **not** recommended: more volume helps up to a point (Schoenfeld et al. 2017
  dose-response), but beyond that fatigue rises faster than growth, and week 6 is a deload for that reason.

---

## 2. What "always progressing" means in the app

Two layers, both shown. Neither replaces the other.

### 2.1 Layer 1 - same day type (unchanged, approved 2026-10-10)
A vs previous A, B vs previous B, set by set (Improved / Held / Dropped / Traded / Mixed). This is the
**verdict**, because it compares like with like. No change.

### 2.2 Layer 2 - "vs last time" any day (NEW): Est. max
The engine already uses the most recent session of any day as its main evidence (approved R20), and the
"Previous" column already shows it (R24). What is missing is a fair **result** line comparing the two.
Rules:

**X1 - Which session is "last time".** The most recent non-deload session of the same `exerciseId`,
any `dayKey`, within the last 28 days (same window as R22). If none: no line. A deload session is only
compared with another deload session.

**X2 - The number.** Session Est. max = Epley e1RM of the **best working set** with **≤ 12 reps**, main
part only (drops ignored), implausible sets excluded. This is exactly the approved `sessionE1RM()` with
the approved 12-rep cap. Epley: `kg × (1 + reps / 30)`. Shown to 0.5 kg.

**X3 - When the line may show.** Both sessions must have at least one working set with ≤ 12 reps.
If either session has only sets above 12 reps (for example lateral raises at 15 / 20), **no cross-day
line**: show only Layer 1 and the text "Different rep range on A and B days - compared with last {A|B}."
(Reason: Epley is unreliable above about 12 reps; Reynolds et al. 2006.)

**X4 - Neutral band.** Converting between rep ranges has an error of a few percent, so:
| Δ Est. max | Label |
|---|---|
| ≥ +3% | "Up" (with the %) |
| between −3% and +3% | "About the same" |
| ≤ −3% | "Lower" (see X5) |

⚠️ REVISAR: 3% band (recommended). A tighter band (2%) shows more "Up"/"Lower" but more of it is noise.

**X5 - No misleading drops across A/B.** When the two sessions are on **different day types** and Est.
max is lower:
- show the number in neutral style (no red, no down arrow),
- add: "B days use lighter loads by design - see B vs last B above." (or "A" accordingly),
- the word "Lower" is only used if the Layer 1 verdict for this session is also Dropped or Mixed.
Same day type and lower → normal "Lower" label (consistent with Layer 1).

**X6 - Effort note.** If the two compared best sets both have RIR logged and differ by ≥ 2, append
"(effort: RIR {now} vs {before})". This makes "softer" visible when it is real.

**X7 - Weekly best (the "always progressing" number).** Per exercise, the highest session Est. max of
the block week (Monday-Sunday), A and B together. Shown as "This week's best Est. max: 40.0 kg (last week
39.2 kg)". Same 3% band. Only for complete weeks (both day types of that exercise logged); otherwise "This
week so far". This is the fairest single "am I getting stronger" number because it does not depend on
whether the last session was A or B. The trend verdict still needs ≥ 4 sessions and ≥ 14 days (approved
Thresholds).

**X8 - Not used across days:** tonnage (B days always show more tonnage because of more reps) and
per-set verdicts. Tonnage stays a same-exercise, same-day-type fact.

⚠️ REVISAR (future option, not recommended now): an RIR-adjusted Est. max, `kg × (1 + (reps + RIR) / 30)`,
would be fairer across days, but RIR is not logged on every set yet, so sessions would mix adjusted and
unadjusted numbers. Revisit when RIR coverage on the best set is ≥ 80%.

### 2.3 Wording (exact templates, English source)
| Code | When | Text |
|---|---|---|
| C1 | X1-X4, Up | "Est. max vs last time ({Day name}, {Ddd D Mon}): {a} → {b} kg (+{p}%)" |
| C2 | About the same | "Est. max vs last time ({Day name}, {Ddd D Mon}): {b} kg, about the same" |
| C3 | Different day type, lower | "Est. max vs last time ({Day name}, {Ddd D Mon}): {a} → {b} kg. {A\|B} days use lighter loads by design - see {B\|A} vs last {B\|A} above." |
| C4 | Same day type, lower | "Est. max vs last time ({Day name}, {Ddd D Mon}): {a} → {b} kg (−{p}%)" |
| C5 | X3 not met | "Different rep range on A and B days - compared with last {A\|B}." |
| C6 | X7 | "This week's best Est. max: {b} kg (last week {a} kg)" |

Info tooltip for "Est. max": "An estimate of the most you could lift once, worked out from your best set
of 12 reps or fewer. It lets A and B days be compared fairly. It is not a test, and you never need to
lift it."

Not allowed: "you are getting weaker", "you went backwards", "B was too easy" (unless X6 RIR data shows
it, and then only the RIR fact).

Spanish versions will be written when the PO approves the English text.

---

## 3. Should the block design change? Options for the PO

Today is the end of week 2 (week 3 starts Mon 19 Oct; week 6 deload is 9-15 Nov).

| Option | What changes | Pros | Cons |
|---|---|---|---|
| **A. Keep the design, add the cross-day Est. max (section 2)** - *recommended* | Nothing in the block. App adds Layer 2 lines and the weekly best. Engine keeps R20-R23 (B loads already follow A's results). | Evidence-backed; no mid-block disruption; logs stay comparable; answers "vs last time" honestly. | Two numbers on the card to understand (verdict + Est. max). |
| B. Link B loads to A explicitly | B load each week = last A Est. max converted to B reps at the planned RIR. | Every A gain shows up in B automatically. | Mostly what R20-R22 already do; a full link would let one bad A day pull B down. Needs a new engine spec. |
| C. Same rep range on both days (for example 8-12 on A and B) | Remove the heavy/light split. | Every session directly comparable; "more kg each time" easier to see. | Loses rep-range variety; two heavy days per muscle → more joint stress and fatigue across 6 days; mid-block change breaks comparisons. |
| D. Narrow the gap on main lifts, next block | Main compounds B at 10-12 instead of 12-15 / pyramids to 14; isolation lifts stay high-rep. | B loads only about 5-7% lighter than A, so the cross-day Est. max (≤ 12 reps) applies to every main lift; still some variety. | Only for the next block (from week 7); a little more joint load on B days. |
| E. Alternate which day is heavy each week | A heavy in odd weeks, B heavy in even weeks. | Variety. | Confusing to log; breaks same-day-type comparisons; no evidence it helps hypertrophy. Not recommended. |

**Recommendation:** Option A now, plus Option D when the next block is planned. Do **not** change this
block mid-way: three more hard weeks with stable exercises and rep targets give the cleanest progress
data, and the engine already pushes B loads up from A results.

⚠️ REVISAR: PO chooses A / B / C / D / E (recommended A now + D for the next block).

---

## 4. Test cases from his real logs

Source of the numbers: the real logs quoted in the approved engine amendment
(`docs/fitness/approved/2026-10-13-engine-same-day-evidence.md`). ⚠️ REVISAR: the history export given
for this task (`entries3.json` in the session scratchpad) was **not found**, so the week-3 sessions
(Thu 15 / Fri 16 Oct) and the Day B dumbbell bench log are marked "hypothetical". The Tech Lead should
rerun these cases on the real export (read-only, not committed) before release.

Dates: 2026-10-05 is a Monday, so Chest & Back A = Mon, Shoulders & Arms A = Tue, Chest & Back B = Thu,
Shoulders & Arms B = Fri. (The 2026-10-13 spec calls the Smith A session "Mon 13 Oct"; 13 Oct is a
Tuesday.)

### Incline dumbbell press (`incline-dumbbell-press`, dumbbell step 2)
- Thu 8 Oct (B, pyramid): 28×14, 28×12, 28×12 → best ≤ 12-rep set 28×12 → **39.2 kg** (28×14 is above the cap).
- Mon 12 Oct (A, 3×8): 30×10, 30×8, 30×8 → best 30×10 → **40.0 kg**.

### Smith machine shoulder press (`smith-machine-shoulder-press`, step 2.5)
- Fri 9 Oct (B, target 10): 22.5×12 ×3 → **31.5 kg**.
- Tue 13 Oct (A, target 8): 25×10, 25×8, 25×8 → best 25×10 → **33.3 kg** (shown 33.5).

### Dumbbell bench press (`dumbbell-bench-press`, step 2)
- Mon 12 Oct (A, target 10): 30×12, 30×10, 30×10 → best 30×12 → **42.0 kg**.

| # | Rule | Input | Expected |
|---|---|---|---|
| CD1 | X1-X4, C2 | Incline, Mon 12 Oct A vs last time Thu 8 Oct B: 39.2 → 40.0 (+2.0%) | "Est. max vs last time (Chest & Back B, Thu 8 Oct): 40.0 kg, about the same". Layer 1: "Baseline" or vs previous A per approved rules. |
| CD2 | X1-X4, C1 | Smith, Tue 13 Oct A vs Fri 9 Oct B: 31.5 → 33.3 (+5.8%) | "Est. max vs last time (Shoulders & Arms B, Fri 9 Oct): 31.5 → 33.5 kg (+6%)" |
| CD3 | X1, X4 (hypothetical) | Smith, Fri 16 Oct B 25×10, 25×10, 25×9 vs Tue 13 Oct A (33.3) | 33.3 → 33.3, 0% → C2 "about the same". Layer 1 vs last B (22.5×12 ×3): load +1 step, reps −2 → "Traded, Heavier, fewer reps" (approved 2.3). Last-B Est. max 31.5 → 33.3 = +5.8%: shown as the B-vs-B context, which is real progress the Traded label hides. |
| CD4 | X5, C3 (hypothetical) | DB bench, Thu 15 Oct B 28×12 ×3 (the engine's own T57 load) vs Mon 12 Oct A 42.0 | 42.0 → 39.2 (−6.7%), different day type → neutral C3: "…42.0 → 39.0 kg. B days use lighter loads by design - see B vs last B above." Never "Lower" unless Layer 1 is Dropped/Mixed. |
| CD5 | X5 same type, C4 (hypothetical) | DB bench, next A 30×10, 30×9, 30×9 vs previous A 42.0 | 30×10 = 40.0 → −4.8%, same day type → C4 "(−5%)"; Layer 1 Dropped. |
| CD6 | X7, C6 | Incline, week 2 has A (40.0) and B Thu 15 Oct (hypothetical 28×14, 28×12, 30×10 → best 30×10 = 40.0) | Week 2 best 40.0. Week 1 best = max(Mon 5 Oct A, 39.2). Needs the 5 Oct log (Tech Lead replay). |
| CD7 | X6 (hypothetical) | Smith B best set RIR 3 vs A best set RIR 1 | Append "(effort: RIR 3 vs 1)". |
| CD8 | X3, C5 | `standing-db-lateral-raises` A 15 reps vs B 20 reps, all sets > 12 | No Est. max line; C5 "Different rep range on A and B days - compared with last A." |
| CD9 | X1 window | Last session of the exercise 35 days ago | No cross-day line. |
| CD10 | X1 deload | Week 6 session vs week 5 session | No cross-day line (deload only vs deload). |
| CD11 | X2 rounding | 25×10 = 33.33 | Shown "33.5 kg"; % computed on unrounded values. |

Consistency: Layer 1 test cases (1a-5e, approved 2026-10-10) and engine cases T1-T63 are unchanged. The
cross-day line is description only. It never changes a recommended load (AI Trainer checklist item 4,
single source).

---

## ⚠️ Open decisions
- ⚠️ REVISAR: Add Layer 2 "Est. max vs last time" (any day) next to the same-day verdict? (Recommended: yes.)
- ⚠️ REVISAR: Neutral band 3% (recommended) vs 2%.
- ⚠️ REVISAR: Show the weekly best Est. max (X7) on Progress? (Recommended: yes, it is the clearest
  "always progressing" number.)
- ⚠️ REVISAR: Name on screen: "Est. max" (recommended) vs "e1RM" (shorter, but jargon).
- ⚠️ REVISAR: Block design option (recommended: keep this block = Option A; narrow the A/B gap on main
  lifts in the next block = Option D).
- ⚠️ REVISAR: The history export for this task was missing; week-3 cases are hypothetical until the Tech
  Lead replays real data.
- ⚠️ REVISAR: RIR-adjusted Est. max kept as a future option (when RIR is logged on ≥ 80% of best sets).

## Sources
- Rhea MR, Ball SD, Phillips WT, Burkett LN. A comparison of linear and daily undulating periodized
  programs with equated volume and intensity for strength. J Strength Cond Res. 2002;16(2):250-255.
- Grgic J, Mikulic P, Podnar H, Pedisic Z. Effects of linear and daily undulating periodized resistance
  training programs on measures of muscle hypertrophy: a systematic review and meta-analysis. PeerJ.
  2017;5:e3695.
- Moesgaard L, Beck MM, Christiansen L, et al. Effects of periodization on strength and muscle
  hypertrophy in volume-equated resistance training programs: a systematic review and meta-analysis.
  Sports Med. 2022;52(7):1647-1666.
- Schoenfeld BJ, Grgic J, Ogborn D, Krieger JW. Strength and hypertrophy adaptations between low- vs.
  high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res.
  2017;31(12):3508-3523.
- Schoenfeld BJ, Grgic J, Van Every DW, Plotkin DL. Loading recommendations for muscle strength,
  hypertrophy, and local endurance: a re-examination of the repetition continuum. Sports. 2021;9(2):32.
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training
  volume and increases in muscle mass: a systematic review and meta-analysis. J Sports Sci.
  2017;35(11):1073-1082.
- American College of Sports Medicine. Progression models in resistance training for healthy adults
  (position stand). Med Sci Sports Exerc. 2009;41(3):687-708 (progressive overload).
- Helms ER et al. Application of the repetitions in reserve-based rating of perceived exertion scale for
  resistance training. Strength Cond J. 2016;38(4):42-49 (effort, RIR).
- Reynolds JM, Gordon TJ, Robergs RA. Prediction of one repetition maximum strength from multiple
  repetition maximum testing and anthropometry. J Strength Cond Res. 2006;20(3):584-592 (e1RM accuracy
  falls at higher reps).
- Epley B. Poundage Chart. 1985 (e1RM formula).
- Approved GymStudio rules: `docs/fitness/approved/2026-10-10-progress-interpretation.md`,
  `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md`,
  `docs/fitness/approved/training-blocks/blocks.json` (block-2026-10-05-hypertrophy-flat-pyramid-ii).

## PO decisions (2026-10-19, PT recommendations)
1. Add the any-day "Est. max vs last time" line next to the same-day verdict (descriptive only).
2. ±3% "about the same" band. 3. Show "This week's best Est. max" on Progress. 4. Label "Est. max" (ES "Máx. est.").
5. Keep this block; next block narrows A/B gap on main lifts (B at 10–12) — PT to draft the block change.
6. Re-run cases on a fresh read-only export before release. 7. RIR-adjusted Est. max stays a future option.
