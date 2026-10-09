---
title: Progress insight thresholds (insights #1, #7, #8, #9, #15, #18, #19, #20)
status: approved (Sebas, 2026-10-10)
author: pt-fitness-expert
created: 2026-10-09
approved_by:
approved_on:
exercises: []            # rules apply by catalogue fields, no per-exercise content
---

## Summary
Sets the fitness thresholds the approved insight-first Progress screen
(`docs/ux/proposals/2026-10-09-progress-and-create-exercise.md`) is waiting on. Every rule is
deterministic, uses existing catalogue-v2 fields (`movement_pattern`, `mechanic`,
`primary_muscles`), and gives only neutral, factual wording with no advice and no medical claims.

Shared definitions (unchanged from the proposal): working set = `workingSets()`; session e1RM =
`sessionE1RM()` (Epley, best working set). **Deload session** = a session in a week the block or
plan marks as deload. If the data has no deload flag, nothing is excluded (see open decisions).

---

## 1. "Flat" e1RM band (insights #1, #7)

**Rule:** `delta = mean(e1RM last 2 sessions) / mean(e1RM first 2 sessions in window) − 1`.
- Improving: `delta > +2.0%`. Declining: `delta < −2.0%`. Otherwise: flat.
- **Minimum data:** at least 4 non-deload sessions of that lift in the window, and at least 14 days
  between the first and last of them. With fewer, show the lift as "Not enough data yet" and leave it
  out of the improving/flat/declining count.
- Deload sessions are left out of both the "first 2" and the "last 2" means.

**Why ±2% and not ±1%:** session-to-session variation in a working set (sleep, warm-up, rep-count
rounding) is usually around 2–4% for trained lifters. Epley also adds error at higher reps. One
extra rep at 10 reps moves e1RM about 2.5%. At ±1%, one good or bad day would flip the verdict.
With a 2-session mean at each end and ±2%, only a real trend shows. ⚠️ REVISAR: the PO may prefer
±1.5% for lighter isolation lifts. I recommend one band for every lift, to keep it simple.

**Wording:** "Up {x}%", "Down {x}%", "About the same (within ±2%)". Do not use "stalling",
"regressing" or "plateau".

| # | Input (session e1RM, kg, in order; days span) | Expected |
|---|---|---|
| 1a | 100, 100, …, 103, 103 (4 sessions, 21 d) | delta +3.0% → improving |
| 1b | 100, 102, 101, 103 (21 d) | mean 101 → 102 = +0.99% → flat |
| 1c | 100, 100, 98, 97 (21 d) | −2.5% → declining (#7 eligible) |
| 1d | 100, 100, 97.9, 98.1 (21 d) | −2.0% exactly → flat (strict inequalities) |
| 1e | 100, 104, 106 (3 sessions) | not enough data, excluded from counts |
| 1f | 4 sessions in 10 days | not enough data (< 14 d) |
| 1g | 100, 100, 80 (deload), 103, 103 | deload ignored → +3.0% improving |

## 2. "No new best in N sessions" (insight #8)

**Rule:** N = **4** non-deload sessions of that lift. The flag shows when the lift's best session
e1RM (all history) was set more than 4 non-deload sessions ago **and** at least 21 days ago.
Deload sessions do not count toward N, and a deload session can never be the "best".
- Condition: count of non-deload sessions strictly after the best-ever session ≥ 4, and days since
  the best-ever ≥ 21.
- A tie with the best is not a new best (must be strictly greater).

**Why 4, not 3:** with 1–2 sessions of a lift per week, 3 sessions can be just 10 days. Normal
day-to-day variation and planned lighter weeks often run that long without a new best. 4 sessions
plus 21 days stays factual and appears far less often for no reason.

**Wording (factual only):** "{lift}: no new best in {N} sessions (best {w} kg e1RM on {date})."
No advice, and no "stalling". The AI Trainer on Today owns "what to do next".

| # | Input (e1RM after best-ever session; days since best) | Expected |
|---|---|---|
| 2a | best 100, then 98, 99, 97, 100 (4 sessions; 24 d) | flag (100 ties, not a new best) |
| 2b | best 100, then 98, 99, 97 (3 sessions; 20 d) | no flag |
| 2c | best 100, then 98, 85 (deload), 99, 97 (3 non-deload; 25 d) | no flag |
| 2d | best 100, then 98, 99, 97, 98 (4 sessions; 16 d) | no flag (< 21 d) |
| 2e | best 100, then 98, 99, 101 | no flag (new best = 101) |

## 3. Main lifts

**Rule:** an exercise is a main lift in the window when **all** of these are true:
- `mechanic == "compound"`, and
- `movement_pattern` is one of `push horizontal`, `push vertical`, `pull horizontal`,
  `pull vertical`, `squat`, `hinge`, `lunge`, and
- equipment is not `bodyweight` with no added load (bodyweight e1RM is not meaningful), and
- it has ≥ 3 sessions in the window (proposal rule, kept as is).

Fallback: if the window has fewer than 2 such lifts, also count isolation exercises with ≥ 3 sessions,
so the hero is never empty for an isolation-heavy plan. This uses fields that already exist, so no
explicit id list is needed. ⚠️ REVISAR: if the PO wants specific lifts pinned (for example
`back-squat`, hip thrust), that would need a new `main_lift: true` catalogue field. That is a
Tech Lead data-model decision.

| # | Input | Expected |
|---|---|---|
| 3a | `back-squat` (compound, squat, barbell), 4 sessions | main lift |
| 3b | Leg extension (isolation), 5 sessions, 3 compound main lifts present | not main |
| 3c | `bodyweight-squat`, 6 sessions, no added load | not main |
| 3d | Plan has 1 compound lift (≥3 sessions) + 2 isolation lifts (≥3 sessions) | fallback: all 3 shown |
| 3e | Compound `hinge` lift, 2 sessions | not main (< 3 sessions) |

## 4. Push vs pull, upper vs lower (insights #18, #19)

**Classification:** see section 8.
**Rule:** show counts and percentages only. A neutral note appears when **both** of these are true:
- the window is the last 4 weeks, with ≥ 20 classified working sets on each side combined, and
- push:pull is above 2.0 or below 0.5 (one side has more than twice the sets of the other).

Upper vs lower: **no ratio verdict**. Many valid programs, such as glute-focused or
upper-body-focused blocks, are deliberately uneven. Show percentages only.

**Why:** coaching guidance generally favours pulling volume at least equal to pushing volume for
general gym-goers. The research does not support a specific "correct" ratio, so only a large gap
(> 2:1) is worth a factual mention.

**Wording (neutral, no health claims):** "Last 4 weeks: {p} push sets vs {q} pull sets." With the
note: "Pushing sets are more than double pulling sets in the last 4 weeks." (or the reverse). Never
mention posture, shoulder health, injury or risk.

| # | Input (push, pull working sets, last 4 wk) | Expected |
|---|---|---|
| 4a | 40, 38 | counts only, no note |
| 4b | 45, 20 | ratio 2.25 → note "Pushing sets are more than double…" |
| 4c | 20, 10 | ratio exactly 2.0 → no note |
| 4d | 12, 4 (16 total) | < 20 sets → counts only, no note |
| 4e | upper 30%, lower 70% | percentages only, never a note |

## 5. Average RIR change (insight #20)

**Meaning:** RIR (reps in reserve) is how many more reps the lifter felt they had left. A lower
mean RIR means sets were taken closer to failure. It does not mean stronger or weaker, and
self-rated RIR is often off by 1–2 reps.

**Rule:** show the weekly mean RIR as a number and chart only. **No verdict**, no "good/bad", and
no change text unless |change| ≥ 1.0 RIR between the first and last block week, both with coverage
≥ 30% (hide otherwise, as the proposal says).

**Wording:** "Average reps in reserve: {a} → {b} (sets felt {closer to / further from} failure)."

| # | Input (mean RIR wk1 → wk4; coverage) | Expected |
|---|---|---|
| 5a | 2.5 → 1.4; 60% / 55% | "2.5 → 1.4 (sets felt closer to failure)" |
| 5b | 2.0 → 2.6; 60% / 50% | numbers only, no change text (< 1.0) |
| 5c | 3.0 → 1.0; 60% / 20% | insight hidden (coverage < 30%) |
| 5d | 1.0 → 2.5; 40% / 40% | "1.0 → 2.5 (sets felt further from failure)" |

## 6. Most improved lift (insight #15)

**Rule:** minimum **4 non-deload sessions** in the block and ≥ 14 days span. This matches section 1,
so the same lift data is used everywhere. The lift must also be "improving" (delta > +2%). If no
lift qualifies, hide the card.

| # | Input | Expected |
|---|---|---|
| 6a | A: 4 sessions +6%; B: 5 sessions +4% | A |
| 6b | A: 3 sessions +12%; B: 4 sessions +3% | B (A has too few sessions) |
| 6c | All qualifying lifts ≤ +2% | card hidden |
| 6d | Tie A +5.0%, B +5.0% | the one with more sessions; if still tied, alphabetical |

## 7. Weekly sets per muscle: target range (insight #9)

**Recommendation:** show a **light reference band of 10–20 hard sets per muscle per week**, labelled
"Common range", not "target". There is no red or green colouring and no warnings.
- Count rule (fractional): a working set counts 1 for each primary muscle and 0.5 for each
  secondary muscle.
- Show the band only for muscles that are a primary muscle of at least one exercise in the
  user's plan.

**Evidence:** meta-analyses (Schoenfeld et al. 2017; Pelland et al. 2024) show more muscle growth
with more weekly sets, with smaller gains per extra set at higher volumes. Around 10 or more sets
per muscle per week is a common evidence-informed range for growth. Gains above about 20 are less
clear, and individual responses vary. Below 10 still works, so the wording must not suggest that
falling short is a problem.
⚠️ REVISAR: the PO may prefer no band at all (counts only, as the proposal currently shows). That is
also acceptable.

| # | Input (glutes this week; primary/secondary sets) | Expected |
|---|---|---|
| 7a | 12 primary + 4 secondary | 14 sets, inside common range |
| 7b | 6 primary + 2 secondary | 7 sets, bar below band, no warning text |
| 7c | 22 primary | 22 sets, above band, no warning text |

## 8. Movement-pattern classification (push / pull / legs / core)

The catalogue **already** has `movement_pattern` for all 227 exercises, so no per-id list is needed.
Map it like this (derived, no new field):

| `movement_pattern` | Group | Region |
|---|---|---|
| push horizontal, push vertical | push | upper |
| pull horizontal, pull vertical | pull | upper |
| squat, hinge, lunge | legs | lower |
| core | core | core (not in upper vs lower) |
| carry | other (excluded from push/pull) | by primary muscle (below) |
| isolation | by first primary muscle: | |
| ↳ Chest, Upper Chest, Front Delts, Side Delts, Triceps | push | upper |
| ↳ Lats, Upper Back, Traps, Rear Delts, Biceps, Forearms | pull | upper |
| ↳ Quads, Hamstrings, Glutes, Adductors, Abductors, Calves | legs | lower |
| ↳ Abs, Obliques, Hip Flexors | core | core |
| ↳ Lower Back | legs | lower |

Notes: Side Delts are counted as push by convention (lateral raises are commonly grouped with
pressing days). Insight #18 uses push vs pull only. Legs and core sets are excluded from that ratio.

| # | Input | Expected |
|---|---|---|
| 8a | pattern `push vertical` | push / upper |
| 8b | pattern `isolation`, primary `[Biceps]` | pull / upper |
| 8c | pattern `isolation`, primary `[Side Delts]` | push / upper |
| 8d | pattern `hinge` | legs / lower |
| 8e | pattern `isolation`, primary `[Hamstrings]` | legs / lower |
| 8f | pattern `core` | core, excluded from both ratios |

## ⚠️ Open decisions
- ⚠️ REVISAR: Is there a deload flag in blocks/plans data? If not, deload exclusion has no effect
  until the Tech Lead adds one. Thresholds still work without it.
- ⚠️ REVISAR: ±2% band (my recommendation) vs ±1% (proposal).
- ⚠️ REVISAR: N = 4 + 21 days (my recommendation) vs N = 3 (proposal).
- ⚠️ REVISAR: show the 10–20 sets "Common range" band, or counts only.
- ⚠️ REVISAR: an optional `main_lift` catalogue field if the PO wants pinned lifts (Tech Lead decision).

## Sources
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci 2017.
- Pelland JC et al. The resistance training dose-response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gain (SportRxiv preprint, 2024).
- Helms ER et al. Application of the repetitions in reserve-based RPE scale for resistance training. Strength Cond J 2016 (RIR accuracy).
- Epley B. Poundage chart, Boyd Epley Workout, 1985 (e1RM formula); NSCA Essentials of Strength Training and Conditioning, 4th ed. (1RM estimation error, program balance).

## PO approval (2026-10-10)
Sebas approved the PT recommendations: ±2% flat band; N = 4 non-deload sessions + 21 days; show the 10–20 sets "Common range" band; main lifts auto-selected (no pinning for now). Deload = block week 6 (already marked in `src/trainer/exposures.ts`). The ⚠️ REVISAR notes above are resolved by this section.
