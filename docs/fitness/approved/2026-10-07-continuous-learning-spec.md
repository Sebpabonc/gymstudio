---
title: AI Trainer continuous learning - per-user calibration, global learning, evidence watch, interaction quality
status: approved
author: pt-fitness-expert
created: 2026-10-07
approved_by: Sebas (PO)
approved_on: 2026-10-07
exercises: []            # applies to every exercise handled by the progression engine
---

## Summary
The progression engine (rules R1-R11, draft `2026-10-07-progression-engine-pt-review.md`) treats every
user the same. This spec lets it learn continuously at four speeds: (1) **per-user calibration** after
every logged exercise, deterministic and bounded; (2) **global learning** in a weekly anonymised batch that
only *flags* rules for PT review; (3) an **evidence watch** that keeps the rules aligned with published
science; (4) **interaction quality** metrics on the trainer's messages. Calibration may only adjust *how
hard the user's effort target is read* (an effective RIR) inside the existing rules. It can never change
rules, guardrails, deload, step sizes or the max increase. Nothing in levels 2-4 changes app behaviour
without Sebas's approval.

## Definitions
- **Exposure**: one exercise in one logged session that has a `trainer_recommendations` row with a
  `result_entry_id`, status `accepted` or `kept_original` (not `ignored`, not `shown` without a result).
- **Excluded exposures** (never used for calibration): week-6 deload sessions; the second exercise of a
  double-angle pair (R5); incomplete sessions per R6; exposures whose recommendation was a "return after a
  break" reduction (R11 -10%); bodyweight exercises with no added load (reps-only, see C-rule 7).
- **Progression sets**: as in the engine spec (`main` sets, up to the planned count, logged order).
- **Target**: the engine's recommended weight `w_rec`, reps `r_tgt` and intended RIR `rir_tgt` per set
  (R1/R2/R9: heaviest set ~1 RIR, others ~2 RIR).
- **Age** of an exposure: days between its session date and today.
- **Decay weight**: `a = 0.5 ^ (age / 42)` (half-life 6 weeks = one block). Exposures older than
  120 days are dropped.

## 1. Per-user live calibration

Runs after every logged exercise (on save of the entry linked by `result_entry_id`). Pure function,
no AI, same input gives same output. Stored per user as a small JSON summary (Tech Lead decides where).

### 1.1 Residual per set ("how many reps did the user have vs. what I expected")
For each progression set `i` of an exposure:
1. Equivalent reps at the recommended weight (handles `kept_original` and small edits) using Epley:
   `e_i = w_act * (1 + r_act / 30)`; `r_eq = 30 * (e_i / w_rec) - 30`. If `w_act == w_rec`, `r_eq = r_act`.
2. If the set has a logged `rir`: `d_i = (r_eq + rir_logged) - (r_tgt + rir_tgt)`.
   If not: `d_i = r_eq - r_tgt` (rir assumed equal to target).
3. Clamp `d_i` to **[-5, +5]**.

Exposure residual `d = mean(d_i)` over its progression sets.

Note: without RIR logging, a user who stops exactly at the target shows `d = 0` even if they had more
in the tank. This makes calibration under-estimate "beating" targets, which is the safe direction.

### 1.2 Personal offset `O` (C-rule 1)
`O_raw = sum(a_k * d_k) / sum(a_k)` over the eligible exposures in the chosen scope (1.4).
`n` = number of eligible exposures (counted, not weighted), and they must span **at least 3 different
session dates over at least 10 days**.
- `n < 4` -> no calibration (`O = 0`).
- Ramp: `O = O_raw * min(1, (n - 2) / 4)` -> n=4: 50%, n=5: 75%, n>=6: 100%.
- Clamp `O` to **[-3, +3]** reps, then round to the nearest 0.5.

### 1.3 How the engine uses `O` (C-rule 2)
Only one input changes: the RIR used in the Epley load formula.
`rir_eff = clamp(rir_tgt - O, 0, rir_tgt + 3)`
`load = e1RM / (1 + (r_tgt + rir_eff) / 30)`, then the engine's normal step rounding, then the
**per-set guardrail** (unchanged) applied last. So a positive `O` (user beats targets) raises load,
a negative `O` lowers it; it can never push a set past 0 RIR in the formula.

### 1.4 Scope hierarchy (C-rule 3)
Use the most specific scope with `n >= 4`:
1. this exercise (`exercise_id`) **and** same technique bucket;
2. this exercise, any technique;
3. same movement pattern (catalogue v2 pattern: horizontal push, vertical pull, squat, hinge, etc.)
   and same technique bucket;
4. same movement pattern, any technique;
5. user-wide (requires `n >= 6`).
Technique buckets: `straight`, `reverse-pyramid` (R1), `ascending-pyramid` (R2), `intensity`
(drop-set / rest-pause / myo-reps, R3). This is how the engine learns whether a user responds
differently to pyramids vs straight sets.

### 1.5 Progression speed tier (C-rule 4)
Hit = every progression set reached `r_tgt` at `w_rec` (or `d >= 0` when the weight was edited).
`H` = decay-weighted hit rate in the same scope (needs `n >= 6`).
- `H >= 0.75` -> **normal** (engine as written).
- `0.40 <= H < 0.75` -> **normal**.
- `H < 0.40` -> **steady**: after any load increase, require **2 consecutive hit sessions** before the
  next increase (instead of 1). Explanation says so.
There is no "fast" tier: faster progress already comes from a positive `O`, and the max increase is a
guardrail calibration may not touch. ⚠️ REVISAR (see decision D3).

### 1.6 Fatigue across sets (C-rule 5)
For straight-set exposures where all progression sets used the same load:
`f = (reps_set1 - reps_lastSet) / (sets - 1)` (reps per set lost). `F` = decay-weighted mean of `f`,
needs `n >= 4`.
- `F >= 1.5` -> user fades fast. Effect: the "missed" check (engine) is judged on the **first set
  plus the mean of the rest** with 1 rep tolerance on the last set only; loads are not lowered.
  The trainer may suggest "rest a little longer between sets (2-3 min)" in the explanation.
- `F < 1.5` -> no effect.
Fatigue never raises a load.

### 1.7 Acceptance (C-rule 6)
`A` = decay-weighted share of `accepted` among `accepted + kept_original + ignored`.
Acceptance is **not** used to change loads (that would teach the engine the user's comfort zone instead
of their capacity). It is used only for (a) explanation tone (if `A < 0.4` with `n >= 6`, the explanation
leads with the reason, then the number), and (b) the global metrics in section 2.
`kept_original` results still feed `O` via the equivalent-reps conversion in 1.1, which is where the
real information is.

### 1.8 What calibration may NEVER change (C-rule 7)
- Rules R1-R11 and their order; technique selection; set and rep schemes from the plan.
- Week-6 deload (R4) loads and set counts; deload exposures are never inputs.
- Step sizes, rounding, the per-set guardrail, the outlier rule, the max increase per session.
- The R11 return-after-break reduction.
- Bodyweight with no added load: `O` is computed for display only, never changes the reps target (v1).
- Any rep target, set count, exercise choice or rest prescription.
- It never acts on pain/injury notes; those keep the "see a professional" path.

### 1.9 Decay and reset (C-rule 8)
- Half-life 42 days; drop after 120 days (so a long break naturally fades calibration).
- After a break of more than 28 days with no logged sessions, calibration is paused (`O = 0`) for the
  first 2 sessions back, then resumes with all non-dropped data.
- User can reset "what the trainer has learned about me" from settings. ⚠️ REVISAR D6.

### 1.10 Explanation (C-rule 9)
Calibration appears only when it changed the load by at least one step versus the uncalibrated result.
Templates (EN source; numbers inserted by code, never by AI):
- `O > 0`: "You usually beat my targets by about {|O|} reps on {scope}, so I've set today {delta} kg higher."
- `O < 0`: "My targets have been a bit ambitious for you on {scope}, so today is {delta} kg lighter."
- Guardrail capped it: append "...but I'm keeping the jump to {cap} kg to stay safe."
- Steady tier: "Let's lock this weight in for two good sessions before moving up."
- Fatigue: "Your reps drop quite a bit across sets; resting 2-3 minutes between sets may help."
`{scope}` = exercise name, or "{pattern} exercises", or "most exercises". The AI sentence writer
(phase 4) may rephrase but must keep the numbers; the existing numbers validator applies.
Confidence label: n 4-5 = "early read", n >= 6 = shown without hedge.

## 2. Global learning across users (weekly batch)

- Runs weekly, server-side, over `trainer_recommendations` + linked entries. Output is **aggregates only**:
  no user ids, no free text, no dates finer than ISO week. Each cell must contain **>= 20 distinct users
  and >= 100 exposures**, otherwise it is suppressed.
- Cells: rule (R1-R11) x technique bucket x movement pattern x equipment step class.
- Metrics per cell: hit rate; mean and median residual `d`; share of `O` clamped at +/-3; acceptance /
  kept_original / ignored shares; mean direction of `kept_original` edits (heavier/lighter, in steps);
  "missed twice" rate after an increase; deload completion rate.
- **Flag for PT review** when any holds for 2 consecutive weeks:
  hit rate < 60% or > 90%; |median d| >= 1.5 reps; acceptance < 50%; kept_original edits lighter
  in > 30% of exposures; > 15% of users clamped at an offset bound.
- A flag creates a review item (PT draft in `docs/fitness/drafts/`). **Rules never change automatically.**
  Path: flag -> PT analysis + proposed rule edit + new test cases -> Sebas approves -> Tech Lead moves to
  `approved/` -> Issue -> implementation.
- Global data is never used to set an individual's load (no cross-user calibration in v1).

## 3. Evidence watch

**Cadence (recommendation): monthly light scan + quarterly review**, plus ad hoc when a major position
stand or large meta-analysis is published. Weekly is too noisy for strength science; most relevant
changes come from meta-analyses that appear a few times a year.

### 3.1 Sources
- Position stands/guidelines: ACSM (progression models in resistance training; updates), NSCA position
  statements, ISSN where relevant, WHO physical activity guidelines.
- Journals: Sports Medicine, Medicine & Science in Sports & Exercise, Journal of Strength and Conditioning
  Research, European Journal of Sport Science, International Journal of Sports Physiology and Performance,
  Journal of Sports Sciences, Strength and Conditioning Journal.
- Preprints (lower grade, watch only): SportRxiv.
- Search topics: RIR/RPE accuracy and autoregulation, load progression, proximity to failure,
  set/rep schemes and pyramids, drop-sets/rest-pause, deloads, detraining after breaks, 1RM prediction
  equations, velocity/RIR self-report accuracy in trained vs novice lifters.

### 3.2 Evidence grades
- **A**: position stand or systematic review/meta-analysis of RCTs.
- **B**: individual RCT with adequate size, or consistent controlled trials.
- **C**: observational, small or short trials, expert consensus.
- **D**: preprint, single case, opinion.
Rule change requires **A, or two independent B** pointing the same way. C/D are logged only.

### 3.3 `docs/fitness/evidence-log.md` format (one entry per item, newest first)
```
### EV-YYYY-NNN - <short title>
- Date logged: YYYY-MM-DD
- Citation: <authors, year, journal, DOI/URL>
- Type / grade: <meta-analysis | RCT | position stand | ...> / <A-D>
- Finding (own words, 1-3 lines): ...
- Rules affected: <R#, C-rule #, or none>
- Recommendation: <no change | monitor | propose change>
- Status: logged | proposed (draft link) | approved by Sebas YYYY-MM-DD | rejected
```
Changes follow the normal path: PT draft -> Sebas -> approved/ -> Issue. The evidence log itself is a PT
draft artifact until Sebas approves moving it out of drafts. ⚠️ REVISAR D8.

## 4. Interaction quality

Measured weekly (aggregate, same privacy rules as section 2), split by explanation template and by
"calibration mentioned yes/no":
- **Acceptance after explanation**: accepted / shown, and change vs. weeks before a wording change.
- **Edits**: share of `kept_original` and size of edit in steps; edits lighter after a calibration-up
  message are a signal the message oversells.
- **Why follow-ups**: share of recommendations followed within the same session by a chat message asking
  why / "too heavy" / "too light" (classified by a simple keyword list EN+ES; no chat text leaves the user's
  data, only the count).
- **Outcome after acceptance**: hit rate of accepted recommendations (a message that is accepted but then
  missed is persuasive but wrong).
- **Readability**: explanation length <= 25 words, one number per sentence, no jargon without plain
  meaning (RIR is shown as "reps left in the tank").

PT wording loop: when a template has acceptance >= 10 points below the average, or why-follow-ups > 20%,
the PT writes 2 alternative wordings (EN + ES) in a draft; Sebas approves; Tech Lead may A/B them
(that is a product/tech decision). No wording is generated live without the numbers validator.

## 5. Deterministic test cases (calibration)

Common setup unless stated: barbell, step 2.5, rounding down to step, e1RM 100, straight sets, target
8 reps at `rir_tgt = 2`, last load 75 (per-set guardrail from 75 = max(2.5, min(7.5, 5)) = +5 -> max 80).
Uncalibrated load: 100 / (1 + 10/30) = 75.0 -> **75**. All exposures meet the 3-dates/10-days rule.

| # | Rule | Input | Expected |
|---|---|---|---|
| C1 | 1.2, 1.3 | 6 exposures, ages 0-35 d, each d = +2 | O_raw 2, ramp 1, **O = +2**; rir_eff 0; 100/(1+8/30) = 78.95 -> **77.5**; explanation "beat my targets by about 2 reps ... 2.5 kg higher" |
| C2 | 1.2 ramp | 4 exposures, each d = +2 | ramp (4-2)/4 = 0.5 -> **O = +1**; rir_eff 1; 100/1.3 = 76.9 -> **75**; no load change, so no calibration sentence |
| C3 | 1.2 min | 3 exposures, each d = +4 | n < 4 -> **O = 0**, load **75** |
| C4 | 1.2, 1.3 | 6 exposures, each d = -2 | **O = -2**; rir_eff 4; 100/(1+12/30) = 71.4 -> **70**; "a bit ambitious ... 5 kg lighter" |
| C5 | clamps | 6 exposures, raw set residuals +7 each | per-set clamp -> d = +5; O clamp -> **O = +3**; rir_eff = max(0, 2-3) = **0**; load **77.5** |
| C6 | guardrail last | e1RM 120, last 75, O = +2 | 120/(1+8/30) = 94.7 -> 92.5, guardrail max 80 -> **80**; sentence appends "keeping the jump to 5 kg" |
| C7 | decay | 3 exposures d = +3 at age 0 d, 3 exposures d = 0 at age 42 d | weights 1 and 0.5: O_raw = 9 / 4.5 = **+2.0**; n = 6 -> **O = +2** |
| C8 | RIR logged | Target 10 reps @ 2 RIR, w_rec 60; logged 60 x 10, rir 4 (single set) | d = (10+4) - (10+2) = **+2** |
| C9 | kept_original | Target 60 x 8 @ 2 RIR; logged 65 x 8, no rir | e = 65 x (1+8/30) = 82.33; r_eq = 30 x (82.33/60) - 30 = 11.17; d = **+3.17** |
| C10 | exclusions | 6 exposures d = +2, of which 2 are week-6 deload and 1 is a double-angle second exercise | eligible n = 3 -> **O = 0** |
| C11 | scope fallback | Exercise has 2 exposures (d = +3); horizontal-push pattern has 6 exposures (d = +1 each, straight) | exercise n < 4 -> pattern+bucket scope: **O = +1**; rir_eff 1 -> **75** (no sentence) |
| C12 | technique bucket | User: straight-set exposures 6 x d = +2; reverse-pyramid exposures on same exercise 5 x d = -1 | Reverse-pyramid day uses bucket scope: O_raw -1 x ramp 0.75 = -0.75 -> round to nearest 0.5 -> **O = -1** (half rounds away from zero, ⚠️ REVISAR D2); straight-set day uses **O = +2** |
| C13 | deload untouched | Week 6, O = +3 | Deload output identical to engine T13/T14 (**no calibration**) |
| C14 | fatigue | 4 straight exposures at one load: reps 12,10,8 each | f = (12-8)/2 = **2.0**, F = 2.0 >= 1.5 -> fatigue flag on; loads unchanged; rest suggestion shown |
| C15 | speed tier | 6 exposures, hits in 2 (decay-weighted H = 0.33) | **steady tier**: after the next increase, 2 hit sessions needed before another |
| C16 | bodyweight | Push-ups, no added load, O = +2 | Reps target **unchanged**; O shown only in stats (v1) |
| C17 | break pause | Last session 35 days ago, O = +2 stored | First 2 sessions back: **O = 0** (R11 applies); 3rd session: O recomputed with decayed data |

## ⚠️ Open decisions (PT recommendation in bold)
- ⚠️ REVISAR D1 - Minimum evidence: **4 exposures over 3 dates / 10 days, full strength at 6.** Fewer is
  noise; more delays the feeling that the trainer learns.
- ⚠️ REVISAR D2 - Offset bounds and rounding: **+/-3 reps, nearest 0.5 with halves away from zero.**
  Alternative: +/-2 reps for users with fewer than 3 months of logs (novices misjudge RIR more).
- ⚠️ REVISAR D3 - Speed tier: **only a "steady" tier, no "fast" tier.** The max increase stays a hard rule.
- ⚠️ REVISAR D4 - Fatigue effect: **forgiving last-set misses only, never lowering loads.** Alternative
  would be per-set back-off loads; more complex, less evidence for regular gym-goers.
- ⚠️ REVISAR D5 - Acceptance never moves loads: **yes.** Otherwise the engine learns comfort, not capacity.
- ⚠️ REVISAR D6 - User reset button and visibility of "what the trainer learned": **yes, both.**
  Transparency builds trust; reset is the escape hatch.
- ⚠️ REVISAR D7 - Global cohort threshold: **>= 20 users and >= 100 exposures per cell.** Lower risks
  re-identification; higher means no signal for a while with a small user base.
- ⚠️ REVISAR D8 - Evidence cadence: **monthly light scan + quarterly review**, rule changes only on
  grade A or two independent B.
- ⚠️ REVISAR D9 - Calibration sentence: **show only when the load moved by at least one step.**
- ⚠️ REVISAR D10 - Should C-rule 2 also apply to bodyweight reps targets (e.g. +2 reps)? **Not in v1.**

## Sources
- Epley B. (1985) Poundage Chart, Boyd Epley Workout (1RM estimation formula).
- American College of Sports Medicine (2009). Progression models in resistance training for healthy adults. Med Sci Sports Exerc 41(3):687-708.
- Helms ER et al. (2016). Application of the repetitions in reserve-based RPE scale for resistance training. Strength Cond J 38(4):42-49.
- Halperin I et al. (2022). Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. Sports Med 52:377-390 (RIR self-estimates are imprecise, better closer to failure; supports clamping and treating untested "exact hit" as conservative).
- Refalo MC et al. (2023). Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med 53:649-665.
- Zourdos MC et al. (2016). Novel resistance training-specific RPE scale measuring repetitions in reserve. J Strength Cond Res 30(1):267-275.
- Bell L et al. (2023). Deloading practices in strength and physique sports: a cross-sectional survey. Sports Med Open 9:? ⚠️ REVISAR: verify exact citation before approval.
- Sweeney L. (2002) k-anonymity: a model for protecting privacy (basis for the minimum cohort size).
