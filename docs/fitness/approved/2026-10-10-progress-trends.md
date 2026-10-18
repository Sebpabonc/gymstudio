---
title: Progress trends (per-lift strength trend, reps-at-load, overload rate, volume, consistency, effort, block comparison, verdicts)
status: approved
author: pt-fitness-expert
created: 2026-10-10
approved_by: Sebas (PO), 2026-10-10
approved_on: 2026-10-10
exercises: [back-squat, romanian-deadlift, barbell-bench-press, incline-dumbbell-press, cable-lat-pulldown-underhand-grip, smith-machine-shoulder-press, dumbbell-curl-incline, ez-bb-preacher-curls, standing-db-lateral-raises, cable-lateral-raise, cable-rear-delt-fly, high-cable-fly]
---

## Summary
The PO asked for trends and a deeper analysis on Progress v2. This draft defines the **trend** layer
on top of the two approved documents. "Interpretation" below means
`docs/fitness/approved/2026-10-10-progress-interpretation.md` and "Thresholds" means
`docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`. Every computation is deterministic,
has a minimum-data rule and test cases. It describes the past only. It never prescribes and never
contradicts the AI Trainer engine (`src/trainer/engine.ts`).

**Design principle:** the official verdict (improving / about the same / lower) stays the **Thresholds
§1 rule** (mean of last 2 vs first 2 sessions, ±2%, ≥ 4 non-deload sessions, ≥ 14 days). Everything
new here (smoothed line, slope, kg/week) is **supporting display**. It cannot create a second,
conflicting verdict.

Shared definitions (reused, not redefined): working set = `workingSets()`; session e1RM =
`sessionE1RM()` (Epley, best working set, main part only, only sets ≤ 12 reps); equivalent session
(Interpretation §1.1); equipment step (Interpretation §2.2: dumbbells 2 kg, else 2.5 kg); deload =
block week 6; week = Monday–Sunday.

---

## 1. Per-lift strength trend (e1RM, sets ≤ 12 reps)

### 1.1 Series
- One point per **non-deload session** of the exercise that has ≥ 1 working set with 1–12 reps and
  load > 0: `y = sessionE1RM()`, `x = date`.
- **Day keys:** e1RM already adjusts for reps, so the e1RM series uses **all day keys of the same
  block** (A and B together), unlike the per-set deltas, which stay equivalent-only.
  ⚠️ REVISAR: if A and B days use very different rep ranges (for example 6–8 vs 10–12), e1RM from
  higher reps usually reads slightly lower and makes the line zig-zag. Alternative: one line per day
  key. I recommend one line, with points marked A/B, and revisit if it zig-zags in real data.
- Deload sessions are shown as hollow points, excluded from every calculation.
- Implausible sets (reps > 50, or 0 kg on a weighted exercise) are excluded (Interpretation §3).

### 1.2 Smoothed line
- **3-session moving average** (trailing): `ma_i = mean(y_{i-2}, y_{i-1}, y_i)`. Drawn only from the
  3rd point on. Raw points stay visible; the line is lighter-weight context.
- Why trailing MA and not something fancier: easy to explain ("average of your last 3 sessions"), and
  one bad day moves it only a third as much.

### 1.3 Rate of change (slope)
- **Ordinary least-squares slope** of `y` on `x` (days), over the non-deload points in the window
  (default window: current block; option "last 8 weeks").
- `kg_per_week = slope_per_day × 7`, rounded to 0.1 kg.
- `pct_per_week = kg_per_week / mean(y) × 100`, rounded to 0.1%.
- **Shown only when** the Thresholds §1 minimum holds (≥ 4 points, ≥ 14 days span). Otherwise:
  "Not enough data yet".
- **Direction consistency guard:** the slope text must never contradict the verdict. If the verdict is
  "About the same" the rate is shown as "About the same (±{|pct|}%/week)" without an arrow. If the
  verdict and the slope sign disagree (possible with odd data), hide the rate and show only the
  verdict.

### 1.4 Confidence wording by sample size
| Non-deload points (and span) | Label next to the rate |
|---|---|
| < 4 or < 14 days | rate hidden, "Not enough data yet" |
| 4–5 | "Early estimate" |
| 6–9 and ≥ 28 days | "Based on {n} sessions" |
| ≥ 10 and ≥ 42 days | "Solid trend ({n} sessions)" |

No statistical p-values or confidence intervals in the UI; they mislead with this little data.

### 1.5 Deloads and exercise swaps
- **Deload:** excluded from the MA, slope, verdict and bests; drawn hollow with label "Deload".
- **Gap ≥ 21 days** between two points: the line is broken (no MA across the gap); slope still uses all
  points. Label: "Break of {d} days".
- **Exercise swap** (new `exerciseId`, for example `barbell-bench-press` → `incline-dumbbell-press`):
  **separate series, never merged**. Different exercises and equipment are not comparable in kg. The
  new lift starts with a Baseline (Interpretation §1.2).
- **Block change, same exercise:** series continues; a vertical marker shows the block boundary.

### Test cases
| # | Input (non-deload e1RM kg, dates) | Expected |
|---|---|---|
| 1a | 60, 61, 62, 63 on days 0, 7, 14, 21 | slope 1.0 kg/wk; mean 61.5 → 1.6%/wk; verdict (61→62.5 = +2.46%) improving; "Early estimate" |
| 1b | 60, 61, 62 on days 0, 7, 14 | rate hidden; "Not enough data yet" |
| 1c | 60, 60, 60.5, 60.5 over 21 d | verdict about the same (+0.83%); rate shown as "About the same (±0.2%/week)", no arrow |
| 1d | 60, 61, 48 (deload), 62, 63 | deload hollow, excluded; same result as 1a |
| 1e | Sessions only with 15-rep sets | no e1RM series; lift uses section 2 instead |
| 1f | 60 (day 0) … 63 (day 35, after 28-day gap) | line broken at gap; slope uses all points |
| 1g | Swap bench → incline DB press | two separate series; incline starts at Baseline |
| 1h | MA for 60, 63, 60 | MA point 3 = 61.0 |

---

## 2. High-rep lifts (sessions mostly > 12 reps): reps at load and load steps

Applies when the exercise has **no** e1RM-eligible set in ≥ 50% of its sessions in the window
(typical for his raises, flies and 15–20-rep curls).

### 2.1 Reps-at-load trend
- Series per **equivalent session** (same block + dayKey, Interpretation §1.1).
- `top_load` = heaviest working-set load (main part). `reps_at_top` = **total reps of all working sets
  at `top_load`** (within one equipment step).
- Chart: load as a step line, reps-at-top as bars. Text: "{w} kg: {r1} → {r2} total reps".
- Only compare reps between sessions with the same `top_load` (within one step). When the load changes,
  the reps bars restart (load change is the progress, see 2.2).

### 2.2 Load progression (step count)
- `load_steps = (top_load_last − top_load_first) / equipment_step`, rounded down, over the last
  **N = 4 weeks** (and over the block).
- Text: "+{k} load steps in 4 weeks ({w1} → {w2} kg)" or "Same load for 4 weeks, reps {r1} → {r2}".
- Minimum data: ≥ 3 equivalent non-deload sessions across ≥ 14 days.
- Verdict for these lifts (feeds section 9): improving if `load_steps ≥ 1` with reps-at-top in the last
  session ≥ (first session reps-at-top at the old load × 0.8), **or** same load with reps-at-top up ≥ 10%;
  lower if same load and reps-at-top down ≥ 10%, or load down ≥ 1 step without reps-at-top up ≥ 10%;
  otherwise about the same.
  ⚠️ REVISAR: the ±10% reps band is my proposal (≈ 1–2 reps per set on 3×15); it plays the role of the
  ±2% e1RM band.

### Test cases
| # | Input (equivalent sessions) | Expected |
|---|---|---|
| 2a | lateral raise 8 kg 3×15 (45) → 8 kg 15,15,17 (47) → 8 kg 3×17 (51), 21 d | same load, 45 → 51 = +13% → improving |
| 2b | cable fly 15 kg 3×15 → 17.5 kg 15,14,13 (42) over 21 d | +1 step, 42 ≥ 36 → improving |
| 2c | 8 kg 45 → 8 kg 44 → 8 kg 43 (21 d) | −4.4% → about the same |
| 2d | 2 sessions only | hidden, "Not enough data yet" |
| 2e | dumbbell 10 → 12 kg | 1 step (2 kg) |

---

## 3. Progressive overload rate (context, not a target)

### 3.1 Computation
- For each **complete week**, take every exercise session that has a previous **equivalent** session.
- Use the Interpretation §2.4 session verdict. `progressed` = Improved. `held` = Held. Excluded from the
  denominator: Target changed, Traded, Baseline, deload weeks.
- `overload_rate = progressed / (progressed + held + dropped + mixed)`.
- Show weekly bars plus a rolling 4-week value. Minimum: ≥ 8 comparable exercise sessions in the
  4-week window; otherwise hidden.
- Wording: "Last 4 weeks: {p}% of exercises beat last time (load or reps)."

### 3.2 Realistic range (shown as context only)
Shown in a tooltip, never as a goal, never coloured:
"For lifters with a year or more of training, beating the last equivalent session about a third to
half of the time is common. Newer lifters often see more. Weeks with no gain are normal."
- Rationale: double progression on fixed rep ranges means a load increase every few sessions, with rep
  gains between. Strength gains slow as training age increases (NSCA; Helms et al., *Muscle and Strength
  Pyramids*; Rippetoe & Kilgore novice/intermediate model).
- ⚠️ REVISAR: there is **no meta-analytic figure** for "share of sessions that progress". The 33–50% is
  a coaching heuristic from double-progression maths, not a study result. Option: hide the range text
  and show the number only. I recommend showing it, worded as "common", to prevent worry.
- Never compare his rate with "other users" or call a low rate a problem.

### Test cases
| # | Input (4 weeks) | Expected |
|---|---|---|
| 3a | 6 improved, 8 held, 2 dropped, 2 mixed, 3 traded | 6/18 = 33% |
| 3b | 7 comparable | hidden |
| 3c | Deload week with 5 "dropped" | excluded entirely |
| 3d | Target changed ×4 | not in denominator |

---

## 4. Volume trends

### 4.1 Weekly hard sets per muscle
- Count per Thresholds §7 (1 per primary, 0.5 per secondary; drop part = 0 extra).
- Trend: weekly values plus a **rolling 4-week mean** (needs 4 complete weeks; before that, weekly bars
  only). Band "Common range 10–20" stays as approved.
- Current incomplete week: "This week so far" (Interpretation §4.3), not used in the rolling mean.
- Deload week: shown, labelled, excluded from the rolling mean.

### 4.2 Tonnage per exercise
- Per exercise per session (Interpretation §4.1), weekly sum per exercise. **Never** summed across
  exercises or muscles. Shown only in the exercise detail, as secondary info.

### 4.3 Session density
- Only if a session has start and end timestamps (or first and last set timestamps) and ≥ 3 working
  sets: `density = working sets / minutes`. ⚠️ REVISAR (Tech Lead): current entries seem to have no
  reliable timestamps; then this is hidden entirely. No rest-time conclusions either way.

### Test cases
| # | Input | Expected |
|---|---|---|
| 4a | Glutes 12, 14, 10, 16 (4 complete weeks) | rolling mean 13.0 |
| 4b | 3 complete weeks | weekly bars, no rolling mean |
| 4c | Week 6 deload 6 sets | shown "Deload week", excluded from mean |
| 4d | No timestamps | density hidden |

### 4.4 PO question (2026-10-10): should total volume (kg × reps) be the main metric?
**Short answer: no as the main dose metric per muscle; yes as a per-exercise trend.**

What each metric tells you:
- **Hard sets per muscle** (sets taken within ~0–4 RIR) is the dose metric hypertrophy research uses and
  supports. Muscle growth is similar across a wide load range (~6–30 reps) when sets go close to failure, so
  a set of 6 heavy and a set of 15 light count about the same for growth even though their tonnage differs a
  lot (Schoenfeld 2017 / 2021 load meta-analyses; Baz-Valle 2022; Pelland 2024 dose-response uses sets).
- **Tonnage (volume load = kg × reps)** is a workload measure (Haff 2010; Scott 2016). It is a good
  "am I doing more work on this lift?" signal, but it does not predict growth well across different exercises.

Why summing tonnage across exercises per muscle misleads:
- Rep range: 3 × 5 @ 100 kg = 1500 kg; 3 × 15 @ 40 kg = 1800 kg; similar growth stimulus, light work "wins".
- Machines / cables / leverage: a leg press moves far more kg than a squat; a cable stack number is not real
  kg. Swapping one exercise changes the muscle total without changing the stimulus.
- Bodyweight moves (pull-ups, dips, push-ups) log 0 kg or partial load → tonnage near 0 for real hard work.
- Drop sets / back-off sets inflate reps at low loads; dumbbells (per hand vs total) are logged inconsistently.

When tonnage IS useful:
- Same exercise over time (same machine/setup): rising weekly tonnage with steady sets = more work done.
- Block vs block on the same exercise list (§8), as a context number.

**Recommendation (what to show):**
1. Per muscle: **weekly hard sets stays the primary metric** (as in Progress v3).
2. Per exercise (lift detail): **weekly tonnage trend** chart, secondary to e1RM / reps-at-load.
3. Optional per-muscle tonnage: only as **% change vs its own 4-week baseline**, never an absolute kg total and
   never compared between muscles, with caveat text: "Total kg depends on rep range and exercise choice;
   sets are the better growth measure." ⚠️ REVISAR (PO): include this optional view or not (PT leans: not in v1).

Exact computation:
- `setTonnage = load_kg × reps` for working sets only (warm-ups excluded). Dumbbells: use the logged value
  as-is, consistently per exercise (no ×2). Bodyweight with no added load: tonnage not computed (exercise
  shows "Tonnage not tracked for bodyweight"); added load only (e.g. +10 kg dip) is ⚠️ REVISAR (PT suggests
  added load only, labelled).
- Drop-set parts count toward tonnage (real work) but not toward hard sets (§4.1).
- `weeklyExerciseTonnage = Σ setTonnage` of that exercise in the ISO week; deload weeks shown and labelled,
  excluded from baselines. Trend needs ≥ 3 complete weeks; otherwise bars only.
- Exercise swapped mid-block (different id): new line, no join.
- Optional muscle trend: `muscleTonnage(w) = Σ setTonnage` of exercises where the muscle is **primary** only;
  `baseline = mean of previous 4 complete non-deload weeks`; `change% = round((muscleTonnage(w) − baseline)
  / baseline × 100)`. Hidden if baseline weeks < 4, if exercise list differs from baseline weeks, or baseline = 0.

| # | Input | Expected |
|---|---|---|
| 4e | Bench week: 3 × 8 @ 80, 1 warm-up 10 @ 40 | 1920 kg (warm-up excluded) |
| 4f | Same exercise weeks 1800, 1920, 2040 | trend shown, rising |
| 4g | 2 complete weeks only | bars only, no trend |
| 4h | Pull-up, bodyweight, no added load | tonnage hidden with note; hard sets still counted |
| 4i | Drop set 60 × 10 then 45 × 8 | tonnage 960; hard sets 1 |
| 4j | Muscle baseline 4000, 4200, 3800, 4000; this week 4400 | +10% vs baseline |
| 4k | Muscle view request with leg press replaced by squat in week 5 | per-muscle % hidden (exercise list changed) |
| 4l | Any screen | no absolute per-muscle kg total, no cross-muscle comparison |

---

## 5. Consistency trend
- **Sessions per week:** distinct training days per week (a day with ≥ 1 working set). Chart weekly,
  plus rolling 4-week mean.
- **Plan adherence %** (per complete week) = planned days logged (matching dayKey) / planned days in
  that week. Extra unplanned sessions do not raise it above 100%. Deload weeks count normally.
- **Longest streak:** longest run of consecutive **weeks** with adherence ≥ 75% (weeks, not days, so
  rest days never break it). Also show the current streak.
- Wording neutral: "4 of 5 planned days (80%)". No guilt language, no "missed" in red.

| # | Input | Expected |
|---|---|---|
| 5a | 5 planned, 4 logged | 80% |
| 5b | 5 planned, 6 logged (1 extra) | 100%, 6 sessions |
| 5c | Weekly adherence 100, 80, 60, 100, 100 | longest streak 2 weeks (wk1–2) ties wk4–5 → 2; current 2 |
| 5d | Current week incomplete | not in adherence or streak yet |

---

## 6. Effort trend (RIR)
- **Coverage** per week = last working sets with RIR logged / all last working sets (one per exercise
  per session).
- **Average last-set RIR** per week, shown only when coverage ≥ 30% (Thresholds §5); change text only
  under the approved Thresholds §5 rule.
- Optionally the share of last sets at RIR 0 per week (fact only).
- Note in tooltip: self-rated RIR is usually off by 1–2 reps, more so on high-rep sets and far from
  failure (Zourdos 2016; Helms 2016).

| # | Input | Expected |
|---|---|---|
| 6a | 20 last sets, 12 with RIR (mean 1.5) | coverage 60%, "1.5" |
| 6b | coverage 25% | average hidden, coverage shown with unlock tip |

---

## 7. Relationships worth showing (and not)

**Allowed (side by side, same time axis, no causal wording):**
- Weekly hard sets of a muscle (rolling 4 weeks) next to the e1RM / reps-at-load trend of that muscle's
  main lift (Thresholds §3, first primary muscle). Caption: "Shown together for context."
- Adherence % next to a lift's trend.
- Average RIR next to a lift's trend.

**Must NOT be implied or computed:**
- No correlation coefficients, "because", "led to" or "drove" text. With one person and a few weeks,
  any correlation is noise and the causes overlap (sleep, food, technique, rep targets).
- Never "more volume = more progress" or "you need more sets". Dose-response is a group average with
  smaller returns at higher volumes (Schoenfeld 2017; Pelland 2024).
- Never tonnage vs strength (tonnage rises naturally with high-rep days).
- Never infer muscle growth from strength or tonnage.
- Never link anything to fatigue, recovery, injury, overtraining or health.

---

## 8. Block-over-block comparison
- **Within block:** per lift, `start` = mean e1RM of the first 2 non-deload sessions of the block,
  `end` = mean of the last 2 (same as Thresholds §1). For high-rep lifts: top load and reps-at-top in
  the first vs last equivalent session.
- **Vs previous block:** compare `end` of the current block with `end` of the previous block for the
  **same exerciseId** only. If the lift was not in the previous block: "New in this block".
- Minimum: each block needs ≥ 2 non-deload sessions of the lift; % change shown only if the within-block
  minimum (≥ 4 sessions, ≥ 14 days) holds in the current block.
- Rep-target caution: if the block's rep target for the lift changed between blocks, show the numbers
  with "Different rep target" and no verdict for high-rep lifts (e1RM lifts still compare).
- Wording: "Bench e1RM: block start 60 → block end 64 (+6.7%). Previous block end: 58."

| # | Input | Expected |
|---|---|---|
| 8a | Block 2: 60, 60, 63, 65; Block 1 end 58 | start 60, end 64, +6.7%; vs previous +10.3% |
| 8b | Lift absent in block 1 | "New in this block" |
| 8c | Block 2 has 3 sessions | numbers shown, no % |
| 8d | Lateral raise target 12 → 20 between blocks | "Different rep target", no verdict |

---

## 9. Summary verdict per lift
One label per lift, computed in this order:
1. Not enough data (Thresholds §1 minimum or §2.2 minimum not met) → **"Not enough data yet"**.
2. e1RM lifts → Thresholds §1: **Improving** (> +2%), **About the same**, **Lower** (< −2%).
   High-rep lifts → §2.2 rule.
3. **"Worth a look"** tag (extra, at most one reason shown, factual), when any of:
   - Thresholds §2 "no new best in 4 sessions and 21 days";
   - verdict Lower for 2 consecutive completed weeks of evaluation;
   - last 3 equivalent sessions Dropped or Mixed;
   - last-set RIR 0 in the last 3 equivalent sessions **and** verdict not Improving.
   Text template: "{lift}: {fact}." e.g. "Bench: no new best in 4 sessions (best 64 kg on 10-20)."

Rules for all wording:
- Never "stalling", "plateau", "regressing", "overtraining", "you should", and no load/rep numbers
  except quoted engine output.
- **Engine precedence:** if the AI Trainer engine has a current recommendation for the lift (e.g.
  "+2.5 kg" or "repeat"), the Progress verdict may sit beside it but must not suggest a different
  action. The "Worth a look" tag links to the engine's card, it never adds advice.
- "Lower" right after a deload or a gap ≥ 21 days gets "(after a break)".

| # | Input | Expected |
|---|---|---|
| 9a | e1RM +3% over 4 sessions/21 d | Improving |
| 9b | e1RM −2.5%, previous week evaluation also Lower | Lower + "Worth a look" |
| 9c | High-rep lift, +1 step | Improving |
| 9d | Engine says "increase", verdict About the same | both shown; no contradicting text |
| 9e | 3 sessions only | Not enough data yet |
| 9f | Lower, first session after 4-week gap | "Lower (after a break)", no Worth-a-look from this alone |

---

## ⚠️ Open decisions
- ⚠️ REVISAR: e1RM line mixes A and B days of the same block (recommended), or one line per day key?
- ⚠️ REVISAR: ±10% reps-at-top band for high-rep lifts.
- ⚠️ REVISAR: show the "about a third to half" overload context text (coaching heuristic, not a study figure) or the number only.
- ⚠️ REVISAR: streak threshold 75% weekly adherence.
- ⚠️ REVISAR (Tech Lead): timestamps for density; block rep targets readable by Progress for §8.
- ⚠️ REVISAR: "Worth a look" tag at all, or verdict labels only (safer, quieter).
- With his data (~1 block week), almost all of this is hidden for 3–4 weeks. The prototype should show the
  "Not enough data yet" and unlock states as the first real view.

## Sources
- Approved: `docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`, `docs/fitness/approved/2026-10-10-progress-interpretation.md`.
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci 2017.
- Pelland JC et al. The resistance training dose-response: meta-regressions on weekly volume and frequency for hypertrophy and strength (SportRxiv 2024).
- Zourdos MC et al. Novel resistance training-specific RPE scale measuring repetitions in reserve. J Strength Cond Res 2016.
- Helms ER et al. Application of the repetitions in reserve-based RPE scale for resistance training. Strength Cond J 2016.
- Helms E, Morgan A, Valdez A. The Muscle and Strength Pyramid: Training (progression by training age).
- Reynolds JM et al. Prediction of 1RM from multiple-RM testing. J Strength Cond Res 2006 (e1RM error at higher reps).
- Baz-Valle E et al. A systematic review of the effects of different resistance training volumes on muscle hypertrophy. J Hum Kinet 2022.
- Schoenfeld BJ et al. Strength and hypertrophy adaptations between low- vs high-load resistance training: a systematic review and meta-analysis. J Strength Cond Res 2017; Schoenfeld BJ et al. Loading recommendations for muscle strength, hypertrophy, and local endurance: a re-examination of the repetition continuum. Sports 2021.
- Haff GG. Quantifying workloads in resistance training: a brief review. UK Strength Cond Assoc 2010.
- Scott BR et al. Training monitoring for resistance exercise: theory and applications. Sports Med 2016.
- NSCA Essentials of Strength Training and Conditioning, 4th ed.; Rippetoe M, Kilgore L. Practical Programming for Strength Training (novice vs intermediate progression rates).

## PO decisions (2026-10-10)
- e1RM trend line mixes A and B days of the same block, with A/B point markers (comparisons stay same-day only).
- High-rep band ±10%; overload rate shown as a number only (no rule-of-thumb text); streak = weeks with ≥75% adherence; keep the factual "Worth a look" tag.
- Per-exercise weekly total volume (kg × reps) trend in the lift detail: yes. Per-muscle tonnage: not in v1.
- Loaded bodyweight exercises: count added kg only, labelled.
- Overall status word (Tech Lead default, PO-approved): Building if fewer than 2 main lifts have a verdict; Progressing if ≥ half of verdicts are improving and improving > lower; Dipping if lower > improving; otherwise Holding.
The ⚠️ REVISAR notes above are resolved by this section.
