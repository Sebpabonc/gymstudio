# Progress insights + "Make your plan" redesign — UXer proposal (2026-10-09)

Status: **draft, needs PO approval**. Prototype: `2026-10-09-progress-and-create-exercise-prototype.html` (375 px, EN/ES, sample data).
Visual language unchanged: dark surfaces (`--bg-dark #0f0f10`), rose accent (`--brand #8d5e63`, `--nav-active #c99ca1`), tokens from `src/styles.css`.

## 1. Progress screen

### Current problems (evidence: `src/screens/ProgressScreen.tsx`, `src/progress/*`)
1. **The top does not answer "am I progressing?"** The headline (`progress-headline`) is a weekly sessions count + PR count. It says *how much you showed up*, not *whether you are getting stronger*.
2. **Insights are hidden behind collapsed cards.** Five `SectionCard`s (Suggestions, Consistency, Strength trend, Sessions, …); only Strength trend opens by default and it shows **one exercise at a time**, chosen through a search picker. To see whether you progressed you must pick lifts one by one.
3. **Good computations exist but are not surfaced.** `strengthTrend`, `personalRecords`, `weeklySets` (per muscle), `adherence`, `blockReports` already exist in `src/progress/`; the UI shows only fragments (a takeaway line, adherence %, a raw set table).
4. **Raw data dominates.** The set-history table and session list (with delete controls) take most of the vertical space; that is a log, not an insight.
5. **Suggestions mix fitness advice** ("add weight", "plateau", "fatigue") into Progress, which duplicates the AI Trainer card on Today.

### Redesign (top to bottom)
```
+-----------------------------------+
| Progress            [Block 3 v]   |  scope: This block | 4 wks | 12 wks
| HERO: "Stronger on 5 of 7 lifts"  |
|  +6.2% avg e1RM vs block start    |
|  [ PRs 4 ] [ Sessions 11/12 ] [ Streak 5 wk ]
+-----------------------------------+
| Insights (3-5 cards, ranked)      |
|  ▲ Hip thrust +9.8% e1RM  ~~spark~~|
|  ★ 4 PRs this block               |
|  ▬ Shoulder press flat 4 sessions |  (PT to approve wording/threshold)
|  ■ Glutes 18 sets/wk vs 14 avg    |
+-----------------------------------+
| Main lifts (list, tap = detail)   |
|  Hip thrust   102 kg e1RM  +12% ~~|
|  RDL           88 kg       +5%  ~~|
+-----------------------------------+
| Weekly sets per muscle (bars:     |
|   this week vs avg of prev 3)     |
+-----------------------------------+
| Consistency: 12-week dot grid     |
+-----------------------------------+
| History (collapsed: sessions log) |
+-----------------------------------+
```
- Tapping a lift opens a **lift detail sheet**: e1RM line chart with PR dots, best set per session, and the existing set history table (deletion stays here and in the exercise Progress, unchanged).
- Suggestions move out of Progress (AI Trainer on Today owns "what to do next"). Progress = what happened.
- An optional "Explain my progress" AI button (existing `ai-explanation` component) may summarise the insight cards in words; it must only restate computed numbers.

### Insight catalogue (exact computations; all deterministic)
Definitions used throughout:
- **Working set** = existing `workingSets()` (excludes warm-ups; drops are not counted as separate sets).
- **Session e1RM** = existing `sessionE1RM()` = max over working sets of Epley `w × (1 + r/30)` (r = 1 → w). Drops ignored.
- **Window**: scope selector — *This block* (block start → today), *Last 4 weeks*, *Last 12 weeks*. Weeks are Monday-based as in `weeklySets`.
- **Main lifts**: exercises in the active block/plan that appear in ≥ 3 sessions in the window. (PT may later mark official "main lifts" in the catalogue — **PT to approve**.)

| # | Insight | Computation | Sentence template | Chart | Threshold? |
|---|---|---|---|---|---|
| 1 | Hero: lifts improving | For each main lift: `delta = mean(e1RM of last 2 sessions) / mean(e1RM of first 2 sessions in window) − 1`. Improving if delta > +1%, declining if < −1%, else flat. Count improving / total. | "Stronger on {n} of {m} lifts" | none | ±1% noise band — **PT to approve** |
| 2 | Average strength change | Mean of `delta` over main lifts (unweighted). | "+{x}% average e1RM since {window start}" | none | no |
| 3 | PRs this window | Count of `personalRecords()` events (weight, reps-at-weight, e1RM) dated in window; list top 3 by e1RM gain. | "{n} PRs this block — best: {lift} {w}×{r}" | star list | no |
| 4 | Sessions done vs planned | `adherence()` sessionsDone / sessionsPlanned for window. | "{d} of {p} planned sessions" | dot grid | no |
| 5 | Weekly streak | Consecutive weeks (ending this or last week) with sessionsDone ≥ sessionsPlanned (or ≥ 1 if no plan). | "{n}-week streak" | none | definition of "complete week" — PO decision |
| 6 | Best mover | Main lift with max `delta`. | "{lift} up {x}% ({a}→{b} kg e1RM)" | sparkline of session e1RM | no |
| 7 | Worst mover | Main lift with min `delta` (only if < −1%). | "{lift} down {x}% since {date}" | sparkline | noise band — **PT to approve** |
| 8 | Flat lift ("no new best") | Lift whose best session e1RM has not been exceeded for the last **N** sessions (N = 3 proposed). Purely factual: "no new best in N sessions". The word "stalling" and any advice are **PT to approve**. | "{lift}: no new best in {N} sessions" | sparkline with flat band | N — **PT to approve** |
| 9 | Weekly sets per muscle | `weeklySets()` done sets per muscle this week vs mean of the previous 3 complete weeks. Show top 6 muscles. | "Glutes {a} sets this week (avg {b})" | paired bars | targets/ranges — **PT to approve** (show no "target" until approved) |
| 10 | Volume load trend | Σ(weight × reps) of working sets (+ drops) per week, last 8 weeks. | "Weekly volume {x}% vs 4-week avg" | column chart | no |
| 11 | Reps-hit rate | Existing adherence metric `repsHit`. | "Hit planned reps in {x}% of sets" | none | no |

Ranking of insight cards (deterministic): PR (if any in last 7 days) → best mover → flat lift → worst mover → muscle with largest |this week − avg|. Max 4 cards. Empty states: < 2 sessions of a lift → lift hidden from movers; no history → "Log 2 sessions of a lift to see its trend."

### Extended insight catalogue (v2, PO "more of the same", 2026-10-09)
Shown as sections below Weekly sets: **Strength**, **Volume**, **Effort and habits**. Same rules: deterministic, sentence + small chart, no advice.

| # | Insight | Computation | Chart | Flag |
|---|---|---|---|---|
| 12 | e1RM trend with best-ever marker | Per main lift: session e1RM series; mark session i if e1RM_i > max(e1RM_0..i-1) over **all** history (not only window). Sentence when the latest session is a best-ever. | line + dots | — |
| 13 | Rep PRs at the same weight | For each (exercise, weight) pair: a working set with reps > max reps previously logged at that exact weight. Count in window; list top 3 by rep gain. | text list | — |
| 14 | Top-set load, this vs last block | Per main lift present in both blocks: mean over sessions of the heaviest working-set weight; average % change across lifts. | split bar | — |
| 15 | Most improved this block | Main lift (≥ 3 sessions in block) with max `delta` (#1 method) within the block. | sparkline | min sessions = 3 — PT to approve |
| 16 | Volume per session trend | Per session Σ(weight × reps) of working sets incl. drops; weekly mean over last 6 weeks; % = last week vs first week. | columns | — |
| 17 | Block tonnage vs previous | Σ(weight × reps) in current block weeks 1..k vs previous block weeks 1..k (k = current block week) — like-for-like. | split bar | — |
| 18 | Push vs pull balance | Working sets in window grouped by catalogue movement pattern (push/pull). Show counts only. | split bar | needs catalogue pattern field (Tech Lead/PT); any "balanced" judgement — PT to approve |
| 19 | Upper vs lower balance | Working sets by body region from catalogue primary muscle mapping, last 4 weeks; %. | split bar | region mapping + any target ratio — PT to approve |
| 20 | RIR / effort trend | Mean `rir` of working sets where rir is logged, per block week; show coverage % of sets with RIR. Hide if coverage < 30%. | columns | interpretation of RIR change — PT to approve |
| 21 | Sessions per block week | sessionsDone per block week (distinct date+dayKey) vs planned days. | columns | — |
| 22 | Day-of-week consistency | Count of distinct session dates per weekday, last 12 weeks; name top 2 weekdays. | columns | — |
| 23 | Session duration trend | Last minus first logged-set timestamp per session; weekly median. **Not computable today** (entries store date only) — needs per-set timestamps (Tech Lead, data-model change). | columns | data dependency |

Ranking adds #12 (if best-ever in last 7 days) and #13 to the PR slot; others live in their sections, never in the hero.

### Expected impact / effort
- Answers "am I progressing?" in one glance; removes 3 taps + search per lift. Effort **M** (UI rework; logic mostly exists — new: delta per lift, streak, volume-load, ranking). No backend, no cost.

## 2. "Make your plan" (create exercise)

### What it is today (`WorkoutPlan.tsx` ~l.2387, `.custom-plan-builder`)
A plan-mode tab "Make your plan" showing, all at once:
1. a native `<select>` with the whole catalogue (hundreds of options, alphabetical, no muscle filter, no images) + "Add from library";
2. a **7-field free-text form** (Name, Sets, Reps, Rest, Muscle, Goal, Tip) all `type="text"` — numbers typed as text, no validation, no steppers;
3. an "Add exercise" button and a flat list of names with "Remove".

### Problems
- Two competing ways to add (library vs manual) shown simultaneously; the manual form dominates the screen.
- 7 text fields = ~20 taps and keyboard switches; "Goal" and "Tip" are unclear and invite fitness content that the PT has not approved.
- Hint copy "Create and save exercises manually." does not say what happens next.
- No days: the custom plan is one flat list, no reorder, no edit, keyed by name (renaming breaks).
- No preview of what you built (sets × reps) in the list.

### Redesign
```
Make your plan
[ Day A ] [ Day B ] [ + ]          <- days as chips
+-----------------------------------+
| 1 Hip thrust      4 × 8-10   ⋮ ≡ |  tap = edit sheet, ≡ drag
| 2 RDL             3 × 10     ⋮ ≡ |
+-----------------------------------+
[ + Add exercise ]  (primary)
```
**Add exercise sheet** (one flow):
1. Search field (autofocus) + muscle chips (Glutes, Legs, Back, Chest, Shoulders, Arms, Core). Results show name + muscle; recent/used first.
2. Tap a result → **Sets/Reps step**: steppers for Sets (default 3) and Reps (default 8–10 as two steppers), Rest chips (60/90/120 s). Defaults come from the PT template if the exercise is in one. "Add to Day A".
3. Not in the list? Bottom link "Can't find it? Create custom" → only **Name + Muscle** (chip) then the same Sets/Reps step. "Goal" and "Tip" are removed (tips are PT content).
- Edit = same sheet prefilled; delete from the sheet (with undo toast).
- Custom exercises get a stable generated id (Tech Lead: data model, `localStorage`/Supabase shape change → `needs-tech-lead`).

Effort **M** (UI) + **S–M** Tech Lead (ids, days in custom plan). Impact: add an exercise in ~4 taps instead of ~20; no unapproved content.

## 3. Impact / effort ranking
| Rank | Item | Impact | Effort |
|---|---|---|---|
| 1 | Progress hero + insight cards (#1–#6) | High | M |
| 2 | Main-lifts list with sparklines + detail sheet | High | M |
| 3 | Make your plan: single "Add exercise" sheet with search + steppers | High | M |
| 4 | Weekly sets per muscle vs previous weeks (#9) | Med | S (logic exists) |
| 5 | Flat-lift / worst-mover insights (#7–#8) | Med | S, blocked on PT |
| 6 | Custom plan days + reorder | Med | M + Tech Lead |
| 7 | AI "Explain my progress" over computed insights | Med | S (component exists) |

Quick wins: move Suggestions out of Progress, open main lifts by default, collapse the session log, remove Goal/Tip fields, replace text inputs with steppers.

## 4. Open decisions
**PO**: (a) Default scope — this block or last 4 weeks? (b) Streak definition — all planned sessions or ≥ 1 session per week? (c) Remove Suggestions from Progress (Trainer card owns advice)? (d) Drop "Goal" and "Tip" from custom exercises? (e) Does "Make your plan" need days, or one list is enough?
**PT to approve**: noise band (±1%), flat-lift N (3 sessions) and its wording, which lifts are "main lifts", any per-muscle weekly set ranges (none shown until approved), default sets/reps/rest for custom exercises.
**Tech Lead**: stable ids + days for custom plans (storage shape change), where insight computations live (`src/progress/insights.ts`, pure + tested).

## 5. Measuring success
- PO answers "am I progressing?" from the first screen without scrolling (5-second test).
- Taps to add an exercise to a custom plan: ~20 → ≤ 5.
- Progress-tab opens per week and lift-detail opens (local analytics if/when available).

## Sources
- NN/g, dashboards and preattentive attributes: https://www.nngroup.com/articles/dashboards-preattentive/
- Hevy progress/stats features (per-exercise e1RM graphs, muscle distribution): https://www.hevyapp.com/features/
- Strong app exercise charts and PRs: https://www.strong.app/
- Apple HIG, charts: https://developer.apple.com/design/human-interface-guidelines/charts
- Material 3, bottom sheets: https://m3.material.io/components/bottom-sheets/overview

## PO decisions (2026-10-09): "Apruebo todo"
- Default range: current block. Streak: a week counts with at least 1 session.
- Remove Suggestions from Progress (the AI Trainer decides loads).
- Custom exercises: name + muscle only (no Goal/Tip). Custom plans get days.
- All insights #1–#23 approved; thresholds marked "PT to approve" wait for the PT.
