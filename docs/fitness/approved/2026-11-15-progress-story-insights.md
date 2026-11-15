---
title: Progress "story" insights (Lifts groups and story lines, block recap headline and takeaways, Muscles periods, Consistency rhythm)
status: approved
author: pt-fitness-expert
created: 2026-11-15
approved_by: Tech Lead (PO delegated content approvals to the crew on 2026-11-15)
approved_on: 2026-11-15
exercises: [barbell-bench-press, back-squat, romanian-deadlift, leg-press-quad-dominant, incline-dumbbell-press, standing-db-lateral-raises, cable-face-pull, smith-machine-shoulder-press]
---

## Summary
The Tech Lead is rebuilding Progress (Overview, Lifts, Muscles, Consistency) around short "story" lines,
following the UX proposal `docs/ux/proposals/2026-11-15-progress-screen-simplification.md`. This draft
reviews the proposed rules and wording, keeps every approved threshold, and adds only these new rules:
lift groups, story-line templates, block takeaways, the Muscles period comparison and the Consistency rhythm.
Every new rule comes with exact numbers and test cases. Nothing here prescribes training. The AI Trainer
engine and the approved block text stay the only sources of "what to do".

Approved specs referenced: **Thresholds** = `2026-10-09-progress-insight-thresholds.md`, **Interpretation** =
`2026-10-10-progress-interpretation.md`, **Trends** = `2026-10-10-progress-trends.md`, **Insights** =
`progress-insights.md`, **A/B** = `2026-10-18-ab-days-and-progression.md`. Where these conflict, the newest
approved spec wins (for example Thresholds §7 "no warnings" replaces the older Insights §5 Low/High labels and
the "Possible fatigue" flag).

Shared definitions (reused, not redefined): working set = `workingSets()`; Est. max = `sessionE1RM()` (Epley,
best working set, main part only, ≤ 12 reps; A/B X2); equipment step = 2 kg dumbbells, 2.5 kg everything else
(Interpretation PO decision 5); deload = block week 6; week = Monday–Sunday; implausible sets excluded
(Interpretation §3).

**Block 6 calendar used in the examples:** week 1 = 5–11 Oct, week 2 = 12–18 Oct, week 3 = 19–25 Oct,
week 4 = 26 Oct–1 Nov, week 5 = 2–8 Nov, week 6 (deload) = 9–15 Nov. Block 7 starts Mon 16 Nov.
⚠️ REVISAR (Tech Lead): I did not have the real export. Numbers in the tests are illustrative or come from the
brief. Replay them on the real Block 6 history (read-only, not committed) before release.

---

## 1. Lifts: what counts as "best" (decision)

**Decision: rank sets by Est. max, not by heaviest load.** Display the set itself in kg × reps.

Why:
- Heaviest load ignores reps. On a lift with heavy A days and lighter B days, "heaviest" would always pick the
  A day and would call 40 × 5 better than 37.5 × 10, even though the second set is stronger by estimate.
- Est. max is already the approved number for comparing A and B days (A/B X2, Trends §1.1 PO decision). Using
  it again here means the "best" in the story matches the trend line and the verdict.
- Example from the brief: 32 × 8 → 32 × 1.267 = **40.5 kg**; 26 × 12 → 26 × 1.4 = **36.4 kg**. So 32 × 8 is the
  best set.

### 1.1 Two tracks (from Trends §2)
- **Est. max track:** the lift has an Est. max-eligible set (1–12 reps, load > 0) in ≥ 50% of its block sessions.
  Session best set = the working set with the highest Est. max. Sessions without an eligible set are skipped
  for this lift's bests and session counts.
- **Load track (high-rep lifts):** all other loaded lifts (for example lateral raises and face pulls at 15–20
  reps). Session best set = the heaviest working set (main part). Ties within one step → the set with more reps.
- **Bodyweight, no added load:** best = most reps in one set (Interpretation §3). Loaded bodyweight lifts use
  added kg only (Trends PO decision).

### 1.2 New best (one rule for every screen)
A session sets a **new best** when **all** of these are true:
- it is not the lift's first session in the block (that one is the **Start / Baseline**, Interpretation §1.2),
- it is not a deload session,
- Est. max track: Est. max beats the previous best by **≥ 0.5 kg** (a tie is not new, Thresholds §2; under
  0.5 kg is rounding, Insights §2),
- Load track: load is ≥ 1 step above the previous best load **and** the reps of that set are ≥ 80% of the
  previous best set's reps (same idea as the Trends §2.2 × 0.8 rule), **or** same load (within one step) with
  more reps.

A and B days are pooled (one series per `exerciseId` for the block). Exercise swaps stay separate series
(Trends §1.5).

| # | Input | Expected |
|---|---|---|
| B1 | 32 × 8 vs 26 × 12 (Est. max track) | 32 × 8 is best (40.5 vs 36.4 kg) |
| B2 | Best 32 × 8 (40.5); next 34 × 6 (40.8) | not a new best (+0.3 kg < 0.5) |
| B3 | Best 40 × 8 (50.7); next 42.5 × 7 (52.4) | new best 42.5 × 7 |
| B4 | `standing-db-lateral-raises` best 12 × 15; next 14 × 10 | not a new best (10 < 0.8 × 15 = 12) |
| B5 | Same lift, best 12 × 15; next 14 × 12 | new best 14 × 12 (12 ≥ 12) |
| B6 | First block session 92.5 × 8 | Start, never "new best" |
| B7 | Deload session with a higher Est. max | ignored |

---

## 2. Lifts: groups (story order)

One row per planned lift. Groups are checked **in this order**; a lift goes into the first group that matches.
Window = the current block. Reference date **R** = today; for a finished block, R = the block's last day
(deload days count as calendar time only, Thresholds §2).

| Order | Group (on-screen title) | Rule |
|---|---|---|
| 1 | **Not logged lately** | Lift is in the block plan; its last non-deload session is ≥ 21 days before the last non-deload training day of the block window; **and** ≥ 3 other training days were logged after the lift's last session. |
| 2 | **New best recently** | A new best (§1.2) in the last 14 days of non-deload training. Finished 6-week block = weeks 4–5. During a block = the 14 days up to today, minus deload days. |
| 3 | **Holding** | Thresholds §2 exactly: ≥ 4 non-deload sessions after the best **and** ≥ 21 days from the best to R. |
| 4 | **Too early to tell** | Fewer than 2 sessions of the lift in the block (Start only). |
| 5 | **Other lifts** | Everything else (for example best 15–20 days ago, or fewer than 4 sessions since). |

Every row also keeps its approved verdict chip (Trends §9: Improving / About the same / Lower / Not enough data
yet). The group describes **bests**; the chip describes the **trend**. They are separate facts and never merged
into one word.

**Decisions vs the brief:**
- **"Stalled: no new best for 3+ weeks" → replaced by the approved Thresholds §2 rule**, titled "Holding".
  Reasons: (1) one definition across Overview, Lifts and "Worth a look"; (2) "3+ weeks" alone can be only
  3 sessions for a lift trained once a week, which normal day-to-day variation easily produces; (3)
  "stalled/stalling" is a banned word (Thresholds §2, Interpretation §1.3, Trends §9). "Holding" is the
  approved neutral chip name (Insights §3).
- **"Still climbing" → "New best recently".** One new best is a fact about one session. "Climbing" claims a
  trend, and the trend verdict needs ≥ 4 sessions over ≥ 14 days (Thresholds §1). A lift can even have a recent
  best while its verdict is "About the same".
- **"Stopped logging" → "Not logged lately".** It is factual, and it does not suggest he quit on purpose. It
  needs "other days were logged" (≥ 3 training days), so a full week off appears on Consistency instead of
  flagging every lift.

| # | Input (Block 6, finished, R = 15 Nov) | Expected group |
|---|---|---|
| G1 | `back-squat` last logged 18 Oct; last non-deload training day 8 Nov (21 d); 9 training days after 18 Oct | Not logged lately |
| G2 | Same, last logged 20 Oct (19 d) | not group 1 → next rule |
| G3 | Last logged 18 Oct, but only 2 training days logged after it | not group 1 (pause, not this lift) |
| G4 | `barbell-bench-press` new best 105 × 10 on 2 Nov (week 5) | New best recently |
| G5 | Best 25 Oct (week 3), then 4 non-deload sessions; 25 Oct → 15 Nov = 21 d | Holding |
| G6 | Best 19 Oct, 5 sessions after (some tie 32 × 8) | Holding (ties are not new) |
| G7 | Best 25 Oct, then 3 sessions | Other lifts |
| G8 | 1 session in the block | Too early to tell |
| G9 | New best 2 Nov **and** verdict About the same | New best recently + chip "About the same" (both shown, no merged word) |

---

## 3. Lifts: row content and story lines

**Row:** name · **Start → Best** in kg × reps · small trend line · one story line · verdict chip.
- Start = best set of the lift's first non-deload block session. Best = best set by §1.
- If Best = Start: show "{Start} (no new best yet)".
- Trend line: Est. max per session (Est. max track) or the top-load step line (load track), A and B pooled, deload
  points hollow (Trends §1.1/§2.1). No % or kg/week on the row. The rate stays in the lift detail as
  "Estimated strength: +X kg/week" with its confidence label (Trends §1.3–1.4); the PT is fine with that.
- **Week 1 note:** when the approved block text says week 1 is lighter (for example "about 3 reps before failure,
  no extras" or "no top set"), add one ⓘ line under the list: "Week 1 was lighter by plan, so Start → Best
  includes that step up." This quotes the plan and gives no advice.

**Story-line templates** (first match wins; dates as "D Mon"):

| Code | Condition | Text |
|---|---|---|
| S1 | Group Not logged lately | "Not logged since {date}. {Day name} logged {n} times since." (second sentence only if n ≥ 1) |
| S2 | Group New best recently | "New best {w} kg × {r} on {date}." |
| S3 | Heaviest load used in exactly 1 session, followed by ≥ 2 sessions all ≥ 1 step lighter, with ≥ 1 of them on the same day key | "{w} kg once ({date}); {w2} kg in the {n} sessions since." |
| S4 | Group Holding, and every later session's best set is ≥ 1 step lighter than the best | "Best {w} kg × {r} on {date}. Since then: {w2} kg × {r2}{note}." `{note}` = " (about the same estimated strength)" when the latest Est. max is within ±3% of the best (A/B X4 band), otherwise empty |
| S5 | Group Holding (other cases) | "Best {w} kg × {r} on {date}; no new best in the {n} sessions since." |
| S6 | Too early to tell | "1 session so far (baseline)." |
| S7 | Other lifts | "Best {w} kg × {r} on {date}." |

Corrections to the brief's examples:

| Brief | Problem | Corrected |
|---|---|---|
| "Stuck at 32 kg × 8 since 19 Oct (5 sessions)" | "Stuck" is a verdict close to the banned "stalling". It also reads as "every session was 32 × 8". | S5: "Best 32 kg × 8 on 19 Oct; no new best in the 5 sessions since." |
| "Best was 40×8 on 26 Oct; back to 37.5×10 since" | 37.5 × 10 (Est. max 50.0) is within 1.3% of 40 × 8 (50.7). "Back to" suggests going backwards when it is about the same. | S4: "Best 40 kg × 8 on 26 Oct. Since then: 37.5 kg × 10 (about the same estimated strength)." |
| "Tried 14 kg once, back to 12 kg since" | "Tried" guesses intent (it could have been planned). | S3: "14 kg once (2 Nov); 12 kg in the 3 sessions since." |

| # | Input | Expected |
|---|---|---|
| L1 | Bench Start 92.5 × 8, Best 105 × 10 on 2 Nov | "92.5 × 8 → 105 × 10", S2 "New best 105 kg × 10 on 2 Nov." |
| L2 | Best 40 × 8 on 26 Oct; then 37.5 × 10, 37.5 × 10, 37.5 × 9, 37.5 × 10 (4 sessions, 20 d to R) | not Holding (< 21 d) → Other lifts, S7 "Best 40 kg × 8 on 26 Oct." |
| L3 | Same as L2 but best 19 Oct (27 d to R) | Holding, S4 with "(about the same estimated strength)" |
| L4 | Best 40 × 8 (50.7); since: 35 × 8 (44.3, −12.6%) | S4 without the note |
| L5 | Lateral raise 14 kg on 2 Nov only; then 12, 12, 12 kg (same day key once) | S3 "14 kg once (2 Nov); 12 kg in the 3 sessions since." |
| L6 | Best 32 × 8 on 19 Oct; 5 later sessions incl. two 32 × 8 | S5 "…no new best in the 5 sessions since." |
| L7 | Only Start session; Best = Start | "92.5 × 8 (no new best yet)", S6 |

---

## 4. Overview: block recap headline, takeaways, best gain

### 4.1 Headline
**Rule:** "Improving on {X} of {Y} main lifts". Y = main lifts (Thresholds §3) **with a verdict** (Trends §9
step 1 passed: Est. max track ≥ 4 non-deload sessions over ≥ 14 days; load track ≥ 3 equivalent sessions over
≥ 14 days). X = those with verdict Improving.
- **Correction:** the brief's Y = "lifts with 2+ sessions" conflicts with Interpretation §1.3 (no trend
  conclusion from fewer than 4 sessions). A lift with 2–3 sessions would count as "not stronger" with no real
  evidence. Lifts without a verdict appear only under "Too early to tell" or with the chip "Not enough data yet".
- If Y = 0: "Not enough data yet for a block verdict."
- "Improving on" vs "Stronger on": the PT prefers **"Improving on"**. It matches the verdict label, and load-track
  lifts improve by reps at the same load, which is not strictly "stronger". "Stronger on" is acceptable if the PO
  prefers the existing key. ⚠️ REVISAR (PO).

| # | Input | Expected |
|---|---|---|
| H1 | 8 main lifts; 6 with a verdict, 4 Improving; 2 with 3 sessions | "Improving on 4 of 6 main lifts"; the 2 others "Too early to tell" |
| H2 | 8 main lifts, all with 2–3 sessions | "Not enough data yet for a block verdict." |
| H3 | 7 of 8 Improving, 1 About the same | "Improving on 7 of 8 main lifts" (no "0 lower" count) |

### 4.2 Takeaways (max 3, in this order, each shown only if its rule passes)

**T1 Strength (always, when Y ≥ 1):** "{n} new bests this block." n = number of lift-sessions with a new best
(§1.2), max 1 per lift per session, deload and Start excluded. If n = 0: "No new bests this block." (neutral, no
styling).

**T2 Day type not logged:** group days by name without A/B (for example "Lower Body" = Lower Body A + B). For
each group: logged / planned across all block weeks (deload counts normally, Trends §5). Show the **lowest**
group when its share is **< 75%** (the approved streak threshold) and it is at least 25 points below the
highest group.
- Text: "{Group} days: {logged} of {planned} logged." Add ", none after {date}" when the group's last logged day
  is ≥ 14 days before the block's last day and other days were logged after it.
- **Correction:** "No leg day after 18 Oct: 8 of 12 leg sessions missed" → "Lower Body days: 4 of 12 logged,
  none after 18 Oct." The word "missed" is guilt language (Trends §5). Counting what was logged is neutral and
  says the same thing.

**T3 Weekly sets change:** total working sets per complete non-deload week (drop set = 1 set, warm-ups
excluded). Early = mean of weeks 1–2; Late = mean of weeks 3–5 (generally: the first 2 non-deload weeks vs the
remaining non-deload weeks). Show when |Late − Early| / Early **≥ 25%**. Means of more than one week are rounded
to the nearest 5 and prefixed "about".
- Text: "Weekly sets: about {a} in weeks 1–2, about {b} in weeks 3–5."
- **Correction:** "Weekly volume fell by two thirds: 140 sets in week 1, about 50 from week 4" → use the same
  periods as Muscles (§5) so both tabs agree, say "sets" (not "volume", which the specs also use for tonnage),
  and give the numbers without a fraction verdict. Never link T3 to T1 or to strength ("because", "led to",
  Trends §7).

**Not allowed in takeaways:** advice ("train legs more", "add sets"), causes (fatigue, recovery, sleep, motivation),
comparisons with other people.

**Deload line (recap):** "Week 6 was the planned deload (half the sets), so it is left out of these numbers."
This replaces the UX draft "Week 6 was a deload: lighter on purpose." It is accurate to the approved block text
and also explains why the numbers exclude it.

| # | Input | Expected |
|---|---|---|
| T1a | 9 new bests across lifts (2 on the same lift, same session counts once) | "9 new bests this block." |
| T2a | Chest-Back 12/12, Arms 11/12, Lower Body 4/12, last 18 Oct, block end 15 Nov | "Lower Body days: 4 of 12 logged, none after 18 Oct." |
| T2b | Lowest group 9/12 (75%) | hidden (not < 75%) |
| T2c | All groups 6/12 (50%) | hidden (no group ≥ 25 points below the highest; the whole-block number shows on Consistency) |
| T3a | Weeks 1–2: 140, 130; weeks 3–5: 60, 50, 45; week 6: 30 | 135 vs 51.7 (−62%) → "Weekly sets: about 135 in weeks 1–2, about 50 in weeks 3–5." Week 6 ignored |
| T3b | 120, 118 vs 110, 105, 100 | −12% → hidden |
| T3c | Week 5 incomplete (block in progress) | Late = weeks 3–4 only; text says "weeks 3–4" |

### 4.3 Best gain tile
- **Which lift:** Thresholds §6 "Most improved lift" (≥ 4 non-deload sessions, ≥ 14 days, verdict Improving,
  highest delta; tie-breaks as §6). Hidden if none qualifies. For load-track lifts, use the Trends §2.2 verdict
  and rank them after Est. max lifts. ⚠️ REVISAR: keeps one ranking; the alternative is to exclude load-track
  lifts from the tile.
- **What it shows:** "{lift}: {Start} → {Best}". Then:
  - same reps on Start and Best → "(+{p}% load at the same reps)", p = Best kg / Start kg − 1, rounded to 1%;
  - different reps → "(+{d}% estimated strength)", d = the §6 delta.
- **Correction:** the brief's "% load change at same reps" as the **selection** rule would conflict with
  Thresholds §6. It is also undefined when reps differ, which is most lifts. It is fine as the **display** when
  reps match.

| # | Input | Expected |
|---|---|---|
| BG1 | §6 winner `leg-press-quad-dominant` 85 × 10 → 97.5 × 10 | "Leg press: 85 × 10 → 97.5 × 10 (+15% load at the same reps)" |
| BG2 | §6 winner bench, 92.5 × 8 → 105 × 10, §6 delta +9.4% | "… (+9% estimated strength)" |
| BG3 | No lift has ≥ 4 sessions and > +2% | tile hidden |

---

## 5. Muscles: period comparison, push/pull, upper/lower

### 5.1 Hard sets per week, early vs late
- Count: Thresholds §7 (1 per primary, 0.5 per secondary; drop part = 0 extra). Muscles shown = primary muscle of
  ≥ 1 plan exercise (Thresholds §7). Y = that count (13 in Block 6 per the brief).
- Periods: Early = mean of complete weeks 1–2; Late = mean of complete non-deload weeks 3–5. Deload excluded. A
  period needs ≥ 1 complete week, otherwise only the other period is shown.
- "In the common range" = 10 ≤ mean ≤ 20, unrounded, inclusive.
- Headline: "In the common range (10–20 sets a week): {a} of {Y} muscles in weeks 1–2, {b} of {Y} in weeks 3–5."
- Fixed ⓘ text (from the Thresholds §7 evidence): "The range is a common reference, not a target. Fewer sets still
  build muscle, and needs vary from person to person."
- Order rows in plan order (not sorted by below/above). No colours, no "low/high" words, no warnings. The UX
  "Common range" band stays.
- **Correction:** the brief's "6 of 13 muscles in range in weeks 1–2, 0 of 13 in weeks 3–5" is acceptable as a
  count, but leading with "0 of 13" without the ⓘ reads as a problem, which Thresholds §7 rules out. Use the
  headline above, with the ⓘ always present.

| # | Input | Expected |
|---|---|---|
| M1 | Glutes 12, 14 → 13 (in); weeks 3–5: 6, 4, 5 → 5 | counts in Early, not in Late; no warning text |
| M2 | Mean exactly 10.0 / 20.0 / 20.5 | in / in / not in (above, no text) |
| M3 | 6 of 13 in Early, 0 of 13 in Late | "In the common range (10–20 sets a week): 6 of 13 muscles in weeks 1–2, 0 of 13 in weeks 3–5." + ⓘ |
| M4 | Block in progress, week 4 incomplete | Late = week 3 only, label "week 3" |

### 5.2 Push vs pull, upper vs lower
- Classification: Thresholds §8. Whole working sets, not fractional.
- Block window: weeks 1–5 (non-deload) instead of "last 4 weeks", because the last 4 calendar weeks of a finished
  block include the deload. ⚠️ REVISAR (PO): a small adaptation of Thresholds §4; the ≥ 20 sets and > 2.0 / < 0.5
  rules stay unchanged.
- Text: "Weeks 1–5: {p} push sets vs {q} pull sets." Note only if push + pull ≥ 20 **and** ratio > 2.0 or < 0.5:
  "Pushing sets are more than double pulling sets in weeks 1–5." (or the reverse).
- Upper vs lower: **percentages only, never a note** (Thresholds §4). **Correction:** the brief asked for a
  neutral note on upper vs lower share. That conflicts with the approved spec, so it is dropped. If leg days were
  not logged, T2 already says so as a fact.
- Never mention posture, shoulder health, injury or risk (Thresholds §4). The older Insights §7 "shoulder health"
  rationale and pull:push target are superseded.

| # | Input (weeks 1–5) | Expected |
|---|---|---|
| P1 | push 90, pull 80 | counts only |
| P2 | push 60, pull 25 (2.4) | counts + "Pushing sets are more than double pulling sets in weeks 1–5." |
| P3 | push 12, pull 4 | counts only (< 20) |
| P4 | upper 78%, lower 22% | "Upper 78% · Lower 22%", no note |

---

## 6. Consistency

- **Per day type:** "{Day name}: {logged} of {planned}" per `dayKey`, all 6 weeks (deload counts normally,
  Trends §5). Extra sessions never push it above planned.
- **Weekday rhythm** (needs ≥ 3 complete weeks): weekdays with ≥ 1 logged session in **every** complete week of
  the block → "You trained {Mon, Tue and Thu} every week ({n} of {n})." If none qualifies, show the weekday with
  the most weeks when it is ≥ 50% of weeks: "Most regular day: Monday ({k} of {n} weeks)." Otherwise hidden.
  **Correction:** "all 6 weeks" → "every week (6 of 6)", so the text also works when the block is not finished.
- **First day to go unlogged:** the first `dayKey` (by calendar) with **2 or more planned weeks in a row** not
  logged. Tie → plan order. Text: "{Day name}: not logged from week {w}." Hidden if no day type qualifies.
  **Correction:** "which day type slipped first" → this factual wording; "slipped" implies fault.
- Wording stays neutral: no red, no "missed", no streak pressure (Insights §3, Trends §5).

| # | Input | Expected |
|---|---|---|
| C1 | Mon, Tue, Thu logged in all 6 weeks; Fri in 4 | "You trained Mon, Tue and Thu every week (6 of 6)." |
| C2 | No weekday every week; Monday 4 of 6 | "Most regular day: Monday (4 of 6 weeks)." |
| C3 | Best weekday 2 of 6 | rhythm hidden |
| C4 | Lower Body A not logged weeks 3–6, Lower Body B not logged weeks 4–6 | "Lower Body A: not logged from week 3." |
| C5 | Arms B not logged in week 2 only | nothing (not 2 weeks in a row) |
| C6 | Lower Body A: 2 of 6 | "Lower Body A: 2 of 6" |

---

## 7. Advice boundary

- Progress describes. Prescriptions come only from the AI Trainer engine (Trends §9 engine precedence) or the
  approved block text, quoted closely and labelled as the plan.
- Block 7 preview line, corrected to match the approved text: "Block 7, week 1: no top set yet (do it as a
  back-off set) and no extras." The brief's "Week 1 has no heavy top set" is a fair paraphrase. The corrected
  version adds the plan's own instruction and nothing else.
- Banned everywhere on these screens: "stalled/stalling", "stuck", "plateau", "regressing", "missed", "slipped",
  "you should", "train X more", "add sets", and any mention of fatigue, recovery, sleep, injury, pain, posture or
  health.
- The optional "Explain my block" AI may only restate these facts and the approved block text, and must keep the
  existing disclaimer.

---

## Corrected wording list (summary)

| Brief | Final |
|---|---|
| Group "Still climbing" | "New best recently" |
| Group "Stalled" | "Holding" (Thresholds §2 rule) |
| Group "Stopped logging" | "Not logged lately" |
| "Stuck at 32 kg × 8 since 19 Oct (5 sessions)" | "Best 32 kg × 8 on 19 Oct; no new best in the 5 sessions since." |
| "Best was 40×8 on 26 Oct; back to 37.5×10 since" | "Best 40 kg × 8 on 26 Oct. Since then: 37.5 kg × 10 (about the same estimated strength)." |
| "Tried 14 kg once, back to 12 kg since" | "14 kg once (2 Nov); 12 kg in the 3 sessions since." |
| "Stronger on X of Y lifts" (Y = 2+ sessions) | "Improving on X of Y main lifts" (Y = main lifts with a verdict) |
| "Weekly volume fell by two thirds: 140 sets in week 1, about 50 from week 4" | "Weekly sets: about 135 in weeks 1–2, about 50 in weeks 3–5." |
| "No leg day after 18 Oct: 8 of 12 leg sessions missed" | "Lower Body days: 4 of 12 logged, none after 18 Oct." |
| "Best gain" = % load change at same reps | Lift chosen by Thresholds §6; "+p% load at the same reps" only when reps match, otherwise "+d% estimated strength" |
| "6 of 13 muscles in range in weeks 1–2, 0 of 13 in weeks 3–5" | "In the common range (10–20 sets a week): 6 of 13 muscles in weeks 1–2, 0 of 13 in weeks 3–5." + ⓘ note |
| Upper vs lower neutral note | No note, percentages only |
| "You trained Mon, Tue and Thu all 6 weeks" | "You trained Mon, Tue and Thu every week (6 of 6)." |
| "Which day type slipped first" | "{Day name}: not logged from week {w}." |
| "Week 6 was a deload: lighter on purpose." (UX) | "Week 6 was the planned deload (half the sets), so it is left out of these numbers." |
| "Week 1 has no heavy top set" | "Block 7, week 1: no top set yet (do it as a back-off set) and no extras." |

## Decisions (Tech Lead, 2026-11-15)
The PO asked that approvals go through the crew, not to him. Resolved:
- Headline: **"Improving on"** (PT recommendation).
- Push vs pull window: block weeks 1–5 for a finished block (non-deload weeks; the ≥ 20 sets and > 2.0 rules unchanged).
- Best gain tile: load-track lifts eligible, ranked after Est. max lifts. The tile itself ships later.
- First release ships §1–§3, §4.1–§4.2, §5 and §6. Deferred: the §4.3 Best gain tile, the §3 Week 1 note, the
  §7 Block 7 preview line and the second sentence of S1.
- In a block still running, the open week counts only the days already logged (nothing reads as not logged before it is due).
- Spanish copy written by the Tech Lead with the same banned-word list; the PT may refine it.

## ⚠️ Open decisions (original list, resolved above)
- ⚠️ REVISAR (PO): "Improving on" (PT recommends) or "Stronger on" for the headline.
- ⚠️ REVISAR (PO): push/pull window = block weeks 1–5 for a finished block (adapts Thresholds §4's "last 4 weeks").
- ⚠️ REVISAR (PO): load-track lifts eligible for "Best gain" (ranked after Est. max lifts) or excluded.
- ⚠️ REVISAR (Tech Lead): replay every test on the real Block 6 export; the brief's numbers (140 sets, 13 muscles,
  4 of 12 Lower Body) are not verified by the PT.
- ⚠️ REVISAR (Tech Lead): the Week 1 ⓘ note needs to know whether the block text says week 1 is lighter. Read it
  from the approved block text, or show it for every block (all approved blocks start at about 3 reps in reserve).
- Spanish versions will be written in `docs/fitness/drafts/es/` once the PO approves the English text.

## Sources
- Approved GymStudio specs: Thresholds (2026-10-09), Interpretation (2026-10-10), Trends (2026-10-10), Insights
  (2026-10-04), A/B days (2026-10-18), `docs/fitness/approved/training-blocks/blocks.json` (deload and week-1 text).
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and
  increases in muscle mass. J Sports Sci 2017.
- Pelland JC et al. The resistance training dose-response (SportRxiv 2024).
- Reynolds JM et al. Prediction of 1RM from multiple-RM testing. J Strength Cond Res 2006 (Est. max error above
  about 12 reps).
- Epley B. Poundage chart, 1985.
