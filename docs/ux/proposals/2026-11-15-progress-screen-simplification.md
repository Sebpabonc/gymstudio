# Progress screen simplification: glanceable first, details on tap

- Date: 2026-11-15 · Author: UXer · Status: **proposal, needs PO approval**
- Mockup (375 px, Overview during a block and at block end): `docs/ux/proposals/2026-11-15-progress-screen-simplification.html`
- Trigger: Sebas finished a 6-week block and finds the analysis screens "too much info, hard to read".
- Scope: the **Progress** screen (tabs Overview, Trends, Muscles, Consistency, and the lift detail it opens).
  The post-workout "Exercise insights" summary is out of scope; the Tech Lead is already simplifying it
  (one headline such as "Better on 4 of 6 exercises", one line per exercise, details on tap). This proposal
  applies the same pattern to Progress so the two screens feel like one product.
- Role boundaries: every metric and verdict below comes from the PT-approved specs
  (`docs/fitness/approved/2026-10-09-progress-insight-thresholds.md`, `2026-10-10-progress-interpretation.md`,
  `2026-10-10-progress-trends.md`, `progress-insights.md`). This proposal **moves, merges, hides and rewords**;
  it adds no new fitness rule. Items that change what a rule shows are marked **PT review**.

---

## 1. What a user sees today (audit at 375 px)

Method: live app `https://sebpabonc.github.io/gymstudio/?demo=1` (generated 6-month demo history: 4 past
blocks plus the current block, week 4 of 6), browser at 375 x 812. Counts are from the rendered panel text
(non-empty lines, numeric tokens) and the panel height. Code: `src/screens/ProgressScreen.tsx`, copy:
`src/i18n/sections/progress.ts` + `progressV3.ts`.

| Screen | Height | ≈ phone screens | Text lines | Numbers | Charts |
|---|---|---|---|---|---|
| Overview | 914 px | 1.1 | 34 | 20 | 0 |
| Trends | 3,974 px | 4.9 | 154 | 124 | 8 mini charts + 4 chips + 15-row table |
| Muscles | 3,713 px | 4.6 | 240 | 251 | 11 gauges + 11 x 4-week bar charts |
| Consistency | 1,092 px | 1.3 | 35 | 54 | 12 dot rows |
| Lift detail (Bench) | 2,330 px | 2.9 | 98 | 145 | 1 chart + weekly bar chart + 8 session cards |

Roughly **600 numbers across the four tabs**. A lifter at the end of a block needs about five.

### 1.1 Overview (`ProgressScreen.tsx:792-842`)
Shows: status word ("Progressing") with an info icon; "8 of 8 main lifts improving · 0 about the same · 0 lower";
"Last 4 weeks: 100% plan adherence · 13-week streak"; "Your lifts" (8 rows: verdict + rate, for example
"Improving · +5.2 kg/week"); "Next session" (grouped watch notes, for example heading "Hit every target rep",
then "Barbell Bench Press · All sets reached 10 reps at 105 kg.").

Problems:
1. **No block context.** Nothing says "Week 4 of 6" or "Block 6 done", although blocks are how the app is organised.
   The only block label is the plan name above the tabs ("Upper / Lower · 4 Days").
2. **"+5.2 kg/week" is hidden jargon.** It is the slope of *estimated* strength (Epley e1RM, Trends §1.3), but it
   reads as "my bench goes up 5.2 kg every week". His real top set went 92.5 kg x 8 to 105 kg x 10 in four
   weeks. The number he recognises (kg x reps) is never on Overview.
3. **Zero noise.** "· 0 about the same · 0 lower" is two numbers that say nothing.
4. **"Next session" duplicates Today** and its heading can read as the opposite of its evidence ("Hit every target
   rep" above "All sets reached 10 reps"). Prescriptions belong to the AI Trainer card on Today (engine precedence,
   Trends §9). On Progress it is a second, weaker copy.
5. **Status word needs an info icon to explain itself** ("Status reflects the majority…"). A sentence that says what
   happened needs no explainer.

### 1.2 Trends (`ProgressScreen.tsx:844-942`)
Shows, top to bottom: "Last 4 weeks vs previous 4" (4 chips: training days, plan adherence, main-lift strength %,
"Beat last time" %); range control (4w / 8w / Block / All); "Strength trend · main lifts" (8 cards: verdict,
"kg/week · Early estimate", mini chart); legend caption; "Block over block" table (15 rows x 4 columns + %);
caption; "All exercises" list (15 rows, verdict only).

Problems:
1. **Three different "how much stronger" numbers for the same lifts on one tab.** "Main-lift strength +0.4%"
   (4 weeks vs previous 4), "+5.2 kg/week" (slope), "+13.5%" (block start to end). Each is correct under its own
   rule; together they contradict each other for a reader.
2. **Each main lift appears three times** on Trends (trend card, table row, All exercises row) and a fourth time
   on Overview.
3. **"Early estimate" on every card**, while Overview states "Improving" without any caveat.
4. **The table misleads at a glance.** The bold "+13.5%" sits next to "Previous block end 102.5 kg x 10" but measures
   start to end of *this* block (92.5 x 8 → 105 x 10). Against the previous block he is only slightly up.
5. **Range control in the middle.** It controls the cards under it but not the card above it.
6. **Empty chart.** Cable Face Pull (high-rep lift) renders an empty chart box with only "Early estimate".
7. **Captions carry the explanation** ("Faint points = each session · bold line = 3-session average · hollow = deload
   (not counted).") because the charts are too small to read on their own.

### 1.3 Muscles (`ProgressScreen.tsx:944-1035`)
Shows: range control; two legend captions ("Bars = hard sets (primary muscle 1, secondary ½)…", "Columns: 0–30…");
then for each of 11 muscles: a gauge with axis 0/10/20/30 and the 4-week average, a sentence repeating the same
number ("Chest: 6 sets/week (4-week average), below the common range."), and a 4-column weekly bar chart with value,
week label and date.

Problems:
1. **The same number is shown three times per muscle** (gauge marker, sentence, bars), 11 times over: 240 lines.
2. **Weekly bars carry almost no information** for a fixed PT plan: in the demo every week is 6, 6, 6, 6 for chest.
   They change only when a session is skipped.
3. **The useful answer is buried**: of 11 muscles, 7 are in the common range, 4 below (chest, front delts, calves,
   core), 1 above (side/rear shoulders). Nothing says that in one line.
4. **Visual bug**: the "↑ 10–20 Common range" label overlaps the "0" axis tick (`styles.css:8770-8784`).

### 1.4 Consistency (`ProgressScreen.tsx:1037-1119`)
Shows: 3 tiles (current streak 13 weeks, longest streak 13 weeks, adherence 4 weeks 100%); 12 week rows grouped by
block ("Week 5 · ●●●● · 4 of 4 planned days (100%)"); "Session log" (expandable, with Delete).

Problems:
1. **Current and longest streak are the same number** most of the time, and both already appear on Overview.
2. **"4 of 4 planned days (100%)" repeated 11 times**; the dots already say it.
3. **Plan adherence appears on three tabs** (Overview line, Trends chip, Consistency tile).
4. **Session log (with delete) is a data-management tool** hidden at the bottom of a statistics tab.

### 1.5 Lift detail (`ProgressScreen.tsx:1121-1270`)
Takeaway sentence + rate + confidence; chart; two legend captions; "Total weight moved" card with weekly bars, two
summary sentences and a 70-word explanation; "Last 8 sessions" with every set, the previous set, a total line and a
"Compared with previous equivalent session: date" line. 145 numbers. The session history is good and is what a
lifter checks; the tonnage card is explicitly secondary in the PT specs (Interpretation §4.1, Insights "What NOT to
show") but takes a full screen.

---

## 2. Outside evidence (summarised)

- **Progressive disclosure** (NN/g): show the few things most people need first, move the rest to a secondary
  step; this makes products easier to learn and less error-prone.
  <https://www.nngroup.com/articles/progressive-disclosure/>
- **Hevy Monthly Report**: a recap of the last completed period (workouts, top exercises, muscles, records) is a
  separate, occasional moment, not something squeezed into the everyday stats screen.
  <https://www.hevyapp.com/features/monthly-report/> · Year in Review: <https://www.hevyapp.com/features/year-in-review/>
- **Hevy sets per muscle**: a single weekly figure per muscle against a range, with history behind a tap.
  <https://www.hevyapp.com/features/sets-per-muscle-group-per-week/>
- **Apple HIG, Charts**: a chart should support one clear message, and its key takeaway should also be available
  as text; avoid adding marks that do not help that message.
  <https://developer.apple.com/design/human-interface-guidelines/charts>
- Our own direction: PT Insights spec already suggested a "This block" card with the single best takeaway first
  (`progress-insights.md`, "Suggested Progress screen order"); the Tech Lead's new workout summary uses
  "headline, one line per item, details on tap".

---

## 3. The one question each tab answers

| Tab | Question for a lifter at the end of a block | Answer format |
|---|---|---|
| **Overview** | "Did this block work, and where do I stand?" | One headline sentence + one row per main lift (start → now, kg x reps) + at most one "worth a look" |
| **Lifts** (today "Trends") | "How is *this* lift moving?" | A list; tap a lift for the chart and session history |
| **Muscles** | "Is any muscle getting clearly less or more work than usual ranges?" | One summary line + one row per muscle (number + band) |
| **Consistency** | "Am I showing up?" | One sentence + a compact block calendar |

---

## 4. Keep / merge / hide / remove

| Item (today) | Decision | Why |
|---|---|---|
| Status word + "X of Y improving" | **Keep, merge** into one headline: "Improving on 7 of 8 main lifts". Status word becomes a small chip. Drop zero counts. | Same rule (Trends §9 + PO status rule), fewer words |
| Adherence + streak line on Overview | **Keep, shorten** to "15 of 16 planned days" for the block | One number that matters at block level |
| "+X kg/week" on Overview rows | **Move** to lift detail, labelled "Estimated strength: +X kg/week". | Hidden e1RM jargon (PT review: wording) |
| Overview lift rows | **Reword** to start → now best set ("92.5 x 8 → 105 x 10") + verdict icon | Uses Trends §8 numbers he can recognise |
| "Next session" on Progress | **Remove** (Today/AI Trainer owns it) or replace by one link "Next workout on Today ›" | Engine precedence; duplicate |
| Worth-a-look reasons | **Promote** to Overview, max 1–2 lines | Already approved (Trends §9), currently only in the detail screen |
| 4-week vs previous-4 chips | **Remove** from Trends; "Beat last time" goes to block recap only | Third conflicting strength %; overload rate is context only (Trends §3) |
| 8 mini charts on Trends | **Hide behind tap** (detail screen). List rows get a tiny sparkline at most (optional) | 8 charts → 0 charts on first view |
| Block-over-block table | **Merge** into lift rows and block recap; full table behind "Compare blocks ›" | Removes the misleading % placement |
| "All exercises" list | **Merge** with main lifts into one list: "Main lifts" then "Other exercises" (collapsed) | Removes duplicate rows |
| Range control 4w/8w/Block/All | **Keep only in lift detail and Muscles**; default Block | Overview and Lifts are block-scoped by default |
| Muscle gauge + sentence + 4 bars | **One row per muscle**: name, 4-week average, band marker. Weekly bars behind tap | Number shown once instead of three times |
| Muscle legend captions | **Replace** with one "ⓘ How sets are counted" disclosure | Jargon ("primary 1, secondary ½") on demand |
| Consistency tiles (current/longest/adherence) | **One sentence**: "13 weeks in a row at 75%+ of planned days" + longest only if different | Duplicate numbers |
| Weekly rows "4 of 4 planned days (100%)" | **Compact calendar**: one row per block, one dot per planned day; text only on tap | 12 repeated sentences |
| Session log with delete | **Move** to Profile → "My data" (or keep, collapsed, at the very bottom). PO decision | Data management is not insight |
| Lift detail tonnage card | **Collapse** by default ("Total weight moved ›"), keep note inside | Secondary metric per PT specs |
| Lift detail "Last 8 sessions" | **Keep**, show newest 3, "Show all" for more; drop the "Compared with… date" line (verdict chip already says it) | The most useful detail stays |
| Captions explaining chart marks | **One "ⓘ" per chart** | Text on demand |

---

## 5. Before / after per tab

### 5.1 Overview (during a block)

```
BEFORE                                   AFTER
-------------------------------------    -------------------------------------
Upper / Lower · 4 Days                   Block 6 · Week 4 of 6
[Overview][Trends][Muscles][Consist.]    [Overview][Lifts][Muscles][Consist.]
Progressing                  (i)         Improving on 8 of 8 main lifts
8 of 8 main lifts improving ·            15 of 16 planned days · 4 new bests
0 about the same · 0 lower
Last 4 weeks: 100% plan adherence ·      MAIN LIFTS        start → now
13-week streak                           Bench press   92.5×8 → 105×10   ▲
Your lifts                               T-bar row     82.5×8 → 92.5×10  ▲
Barbell Bench Press                      Shoulder press  28×10 → 32×12   ▲
Improving · +5.2 kg/week          ›      Lat pulldown  37.5×10 → 42.5×12 ▲
Plate-Loaded T-Bar Row ...               Face pull       45×15 → 50×20   ▲
Improving · +4.5 kg/week          ›      Back squat      55×8 → 62.5×8   ▲
... (8 rows)                             RDL           72.5×10 → 82.5×10 ▲
Next session                             Leg press       85×10 → 97.5×10 ▲
Hit every target rep                     
Barbell Bench Press · All sets ...       WORTH A LOOK (only if any)
... (3 rows)                             RDL: no new best in 4 sessions
                                         (best on Nov 2)                ›
34 lines · 20 numbers                    ≈ 14 lines · 1 headline number
```

Rules: headline = Thresholds/Trends verdict counts (only lifts with a verdict; "Not enough data yet" lifts listed
below with "–" and no arrow). Row numbers = Trends §8 within-block best set of first vs latest session
(PT review: §8 defines start/end as the mean e1RM of 2 sessions for the % and best set for display; we show only
the best sets, no %). Arrow/icon follows the verdict, never the raw numbers (so a "Traded" or "About the same" lift
never shows ▲). Neutral styling, no red (Insights "What NOT to show").

### 5.2 Overview at block end: **Block recap** (new)

Shown on Overview from the day the last planned day of the block is logged (or the block end date passes) until
the first session of the next block, then kept under "Past blocks ›".

```
-------------------------------------
BLOCK 6 DONE · 6 weeks
Stronger on 7 of 8 main lifts
23 of 24 planned days · 9 new bests
Week 6 was a deload: lighter on purpose.

Biggest gain   Leg press  85×10 → 97.5×10
Worth a look   Back squat: about the same

[ See every lift ›]   [ Compare with Block 5 › ]
[ Ask AI to explain my block ]  (optional, see 7)

Next: Block 7 starts Mon 16 Nov  [ View plan › ]
-------------------------------------
```

Sources: verdict counts (Trends §9), adherence (Trends §5), "Biggest gain" = Most improved lift (Thresholds §6:
≥ 4 sessions, ≥ 14 days, > +2%, hidden if none), "Compare with Block 5" = Trends §8 block-over-block table,
deload = block week 6 (Interpretation, Thresholds PO approval). "New bests" = count of best marks
(Interpretation §3). Copy is a draft; Spanish copy needs translation review.

### 5.3 Lifts (rename of Trends)

```
BEFORE (4.9 screens)                     AFTER (≈ 1.5 screens)
4 comparison chips                       Block 6 · range: Block ▾ (in detail)
range control                            MAIN LIFTS
8 cards with mini chart + rate           Bench press      Improving    ›
legend caption                           T-bar row        Improving    ›
Block-over-block table (15 rows)         ...
caption                                  OTHER EXERCISES (7)          ▾
All exercises (15 rows)                  [ Compare blocks › ]  (full table)
```

Tap a lift → detail (5.5). The table stays available, but behind one tap, with the % column relabelled
"this block" and the previous-block column described in its own words (PT §8 wording: "Previous block end").

### 5.4 Muscles

```
BEFORE (4.6 screens, 251 numbers)        AFTER (≈ 1.2 screens)
2 legend captions                        Weekly sets, 4-week average   (i)
per muscle: gauge, sentence, 4 bars      7 of 11 muscles in the common range
                                         (10–20 sets a week)
                                         Chest          6  |·  [====]     |
                                         Back          15  |   [==·=]     |
                                         Shoulders     21  |   [====] ·   |
                                         ... (11 rows, one line each)
                                         tap a row → weekly bars for that muscle
```

Order: plan order (default) — **not** sorted by "outside range" unless the PT agrees, because Thresholds §7 says
falling short must not look like a problem and there are no warnings. The summary line is factual and neutral
(PT review).

### 5.5 Consistency

```
BEFORE                                   AFTER
3 tiles (13 / 13 / 100%)                 13 weeks in a row at 75%+ of planned days
12 rows "Week n ●●●● 4 of 4 (100%)"      Block 6  ●●●● ●●●● ●●●○ ●●●● ●●●● ●●●●
Session log                              Block 5  ●●●● ●●●● ●●●● ●●●● ●●●● ●●●●
                                         Block 4  ...
                                         tap a week → "Week 3: 3 of 4 planned days"
```

Longest streak shown only when it differs from current. Neutral wording, no "missed" in red (Trends §5).

### 5.6 Lift detail

Order: (1) takeaway sentence in kg x reps ("Bench press: improving. Best set 92.5 kg × 8 → 105 kg × 10 this block.");
(2) chart with one "ⓘ" for legend and the e1RM note; (3) "Estimated strength: +5.2 kg/week · Early estimate" as a
small line under the chart; (4) last 3 sessions (sets with previous set beside them, verdict chip), "Show all";
(5) collapsed "Total weight moved ›". Range control stays here.

---

## 6. Prioritised changes (issue-sized)

Impact: how much easier the screen gets for Sebas. Effort: S ≤ 1 day, M 2–3 days, L ≥ 1 week (Copilot + review).

| # | Change | Impact | Effort | Needs |
|---|---|---|---|---|
| 1 | Overview headline: merge status + counts into "Improving on X of Y main lifts", drop zero counts, add "Block N · Week W of 6" | High | S | PO copy OK |
| 2 | Overview lift rows show start → now best set (kg x reps) + verdict icon; move kg/week to detail as "Estimated strength" | High | S–M | **PT review** (display of §8 numbers, rate wording) |
| 3 | Remove "Next session" from Progress (or one link to Today) | Med | S | PO decision |
| 4 | Promote max 2 "Worth a look" lines to Overview | Med | S | none (already approved rule) |
| 5 | Trends → "Lifts": one list (main + collapsed others); remove 4-week chips, mini charts and the always-on table; table behind "Compare blocks ›" | High | M | PO decision on chips |
| 6 | Muscles: one row per muscle + one summary line; weekly bars on tap; legend in "ⓘ"; fix label overlap | High | M | **PT review** (summary line wording, order) |
| 7 | Consistency: one streak sentence + block dot calendar; text on tap | Med | S–M | none |
| 8 | Lift detail: collapse tonnage, show 3 sessions + "Show all", drop duplicate comparison line, legends behind "ⓘ" | Med | S | PT FYI (tonnage stays available) |
| 9 | **Block recap card** on Overview at block end, plus "Past blocks" list | High (the moment he is in) | M–L | **PT review** (recap copy, deload line, new-bests count), Tech Lead (when a block counts as done) |
| 10 | Move session log (delete) to Profile → My data | Low–Med | S | PO decision |
| 11 | Optional: "Ask AI to explain my block" on the recap, reusing the existing grounded "Ask AI why" | Med | M | Tech Lead (prompt, cost), PT (allowed claims) |
| 12 | Optional: tab state in the URL so Back and refresh keep the tab | Low | S | Tech Lead |

**Quick wins** (S, no PT gate): 1, 3, 4, 7, 10. **Biggest bet**: 9 (block recap) together with 2 and 5.
Suggested order: 1 → 2 → 4 → 3 → 5 → 6 → 9 → 7 → 8 → 10 → 11.

---

## 7. AI angle (optional, guarded)

The recap is the best moment for AI: "Explain my block" returns 3 short sentences built **only** from the recap
numbers, approved verdicts and the next block's plan (no new loads, no medical claims, engine owns prescriptions,
disclaimer "AI answers can be wrong. Not medical advice." already exists in `progress.ai.disclaimer`). It reuses the
existing server-side AI path and daily question limit; provider stays a Tech Lead/PO choice (`docs/ux/README.md`).

---

## 8. Risks

- **Hiding detail Sebas sometimes wants.** Mitigation: everything removed from first view stays one tap away.
- **Rule drift while rewording.** Mitigation: every row cites its spec section; PT reviews items 2, 6, 9 before merge.
- **Recap timing edge cases** (block ended with missed days, plan changed mid-block, deload skipped). Tech Lead
  defines "block done"; recap must still render with partial data ("21 of 24 planned days").
- **Consistency with the workout summary.** The workout summary says "Better on 4 of 6 exercises" (session vs last
  time); Progress says "Improving on 7 of 8 main lifts" (block trend). Different words on purpose: different time
  frames and rules. PO to confirm.

## 9. How we measure success

- First view of each tab fits in ≤ 1.5 phone screens (today: up to 4.9). Numbers on first view: Overview ≤ 20,
  other tabs ≤ 40 (today Muscles 251).
- Sebas can answer "Did the block work? Which lift is behind?" in under 10 seconds from Overview (5-minute hallway
  test at his next block end).
- No PT rule changed: existing progress unit tests still pass; new tests cover the recap.
- Qualitative: Sebas stops describing Progress as "too much info".

---

## 10. Decisions needed

**PO (Sebas)**
1. Approve the direction: glanceable Overview + block recap, details behind taps.
2. Rename "Trends" to "Lifts"? (Recommended.)
3. Remove "Next session" from Progress (Today already has it)? (Recommended: yes, replace with one link.)
4. Where should the session log with Delete live: Progress (collapsed, bottom) or Profile → My data?
5. Remove the "Last 4 weeks vs previous 4" chips entirely, or keep them inside the recap only? (Recommended: recap only.)
6. Headline words: "Improving on 7 of 8 main lifts" vs "Stronger on 7 of 8 main lifts" (existing key `progress.hero.lifts`).
7. Short lift names on Progress rows ("Bench press" instead of "Barbell Bench Press")? The mockup uses short names so start → now fits on one line at 375 px; real catalogue names would wrap or truncate. Short names would be new content (catalogue field or display rule): Tech Lead + PT wording.

**PT**
1. Overview rows show within-block first vs latest best set (kg x reps) without a %; OK under Trends §8?
2. Rate wording "Estimated strength: +X kg/week" in detail only; OK under Trends §1.3–1.4 (confidence label stays with it)?
3. Muscles summary line "7 of 11 muscles in the common range (10–20 sets a week)" and keeping plan order (not sorted by
   below/above); compatible with Thresholds §7 "no warnings"?
4. Block recap copy: deload line, "Biggest gain" (Thresholds §6), "new bests" count (Interpretation §3), and what the
   optional AI explanation may and may not say.

**Tech Lead**
1. Definition of "block done" for the recap and where past recaps are stored (derived on the fly is preferred; no
   new tables needed).
2. Effort check on items 5, 6, 9; cost/limits for item 11.

---

## Appendix A. Web Interface Guidelines audit (read-only)

- Source: Vercel `web-interface-guidelines` `command.md`, vendored at
  `.claude/skills/web-design-guidelines/command.md`, official commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`.
- SHA-256 verified 2026-11-15: `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`
  (matches `docs/governance/skill-checksums.json`). Rules treated as reference only.

Findings relevant to this proposal:

- `src/screens/ProgressScreen.tsx:539-540` - tab and range are `useState` only; refresh/back lose the tab (Navigation & State: URL reflects state).
- `src/screens/ProgressScreen.tsx:401-432` + `src/styles.css:8770-8784` - gauge band label overlaps the "0" axis tick at 375 px (Content Handling); the gauge is removed in item 6 anyway.
- `src/screens/ProgressScreen.tsx:170-235` - Face Pull mini chart renders an empty box with no text (Content Handling: handle empty states).
- `src/screens/ProgressScreen.tsx:797-800` - info disclosure uses the glyph "ⓘ" as the summary with `aria-label`; OK, but on its own it explains a status that could just be a sentence (Content & Copy).
- `src/screens/ProgressScreen.tsx:1256-1262` - total and "Compared with…" render as adjacent `<small>` without a separator, giving "heavier weightCompared with…" in extracted text; screen readers read them as one run (Content Handling).
- `src/screens/ProgressScreen.tsx:1077-1088` - the same "{done} of {planned} planned days ({percent}%)" string is both the dots' `aria-label` and visible text; screen readers hear it twice per week (Accessibility: avoid redundant labelling).
- `src/screens/ProgressScreen.tsx:896-917` - block table on 375 px relies on `data-label` stacked cells; good fallback, but the % sits in the "Best set" cell next to "Previous block end", which visually suggests the wrong comparison (Content & Copy).
- Positive: tabs use `role="tablist"`, `aria-selected`, roving `tabIndex` and arrow keys (`ProgressScreen.tsx:1294-1310`); charts have `role="img"` + `aria-label` with a text takeaway; numbers use `formatNumber` (Intl); focus-visible styles exist globally (`styles.css:8090-8096`); delete has confirm + undo.

## Appendix B. Side observations (for QAer / Tech Lead, not part of this proposal)

- Demo data goes stale: an older generated demo history in the browser (756 entries) made Progress show
  "Building your baseline · 1 of 4 sessions" because the demo block dates move with today while stored history does
  not. Clearing the demo storage regenerated it. A visitor returning to `?demo=1` on a later week may see an empty
  Progress.
- Lift detail says "This week so far: 5,670 kg (2 of 2 days)" while the week is still open, then "Week 1 → week 3";
  the "2 of 2" counts only days planned so far, which reads as complete.
