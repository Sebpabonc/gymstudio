# Aligned Workout mode: big logger, per-exercise insight, "Completed" screen

- **Date:** 2026-10-18
- **Author:** UXer
- **Status:** Proposal, prototype only. Do not implement until the PO approves.
- **Prototype:** `docs/ux/proposals/2026-10-18-workout-mode-aligned.html` (375 px, EN/ES, clickable)
- **Builds on:** #304 (simplified Workout mode), #308 (round-based superset card),
  `2026-10-07-simplified-app-prototype.html`, `2026-10-09-integrated-prototype.html`
- **Fitness rules used (approved only):** `docs/fitness/approved/2026-10-10-progress-interpretation.md`
  (sections 1.1, 1.2, 2.1–2.4, 4.1–4.2, 5) and `docs/fitness/approved/2026-10-13-engine-same-day-evidence.md` (R24).

## 1. Problem (what the live app shows today)

Checked at 375 px on `?demo=1`, after tapping Start workout (Day 1, ES):

1. **The set you are logging is below the fold.** Before the first set row you see the top bar, the chips,
   tags, five tool buttons (Google, Swap, Notes, History, Technique), the "Today" target, the squeeze cue
   and "Same as set 1 / Start rest". The first kg/reps row starts around y ≈ 680 of 812, and the
   two-button footer covers the rest of the screen.
2. **The title is cut off.** The EN|ES toggle in the workout bar leaves no room for the day name
   ("Tren superior A · 1/" in ES). `WorkoutPlan.tsx:2968-2994`.
3. **Nothing happens when you finish an exercise.** The row collapses with a ✓. You only get feedback
   in the session summary at the end.
4. **The summary arrows are not about today's performance.** In `src/trainer/summary.ts:32-38`
   (`actionTrend`), ↑/→/↓ comes from the engine's *next* action (increase or decrease), not from how
   today went compared with last time. The PT's approved comparison rules already exist in code
   (`src/progress/comparison.ts:52` `compareLiftSessions`, `:103` `latestEquivalentComparisons`,
   `:136` `watchObservations`), but Workout mode doesn't use them.
5. **The summary sums tonnage across exercises** ("Volume kg", `WorkoutPlan.tsx:4146`). The approved
   PT rule 4.2 says tonnage is compared *only within the same exercise* and never summed across
   exercises. The main volume number should be hard sets per muscle (4.1).
6. **The summary is a dismissable sheet over the plan**, titled "Today's performance". It never says
   "Completed".

## 2. Opportunity

Strong and Hevy show a *Workout complete* screen with a list of exercises and records. Fitbod and
Future add short, factual feedback per exercise. GymStudio already has rules approved by our PT that
are better grounded than either: equivalent sessions, Improved/Same/Lower/Mixed, Baseline, and W1–W6.
We can show them **at the moment each exercise ends**. That is when you are most motivated, it costs
no extra taps, and no LLM is needed. It is a deterministic, explainable insight, which matches the AI
direction (the engine decides, text explains).

## 3. Proposal

### 3.1 One Workout mode (current structure + simple feel)

```
┌───────────────────────────────────────┐
│ ‹ Exit   Chest & Back A · 2/7    12:04│ ← timer replaces EN|ES (moved to ⋯)
│ [1✓][2][3]–[4][5]–[6][7]              │ ← chips kept; rose dash = superset
├───────────────────────────────────────┤
│ B1  Reverse pyramid              [⋯]  │ ← one More button (Technique, History,
│ Plate-Loaded T-Bar Row                │   Swap, Notes, Google, Language)
│ Heaviest set first, then lighter…     │
│ ▌Today: 45×10                    AI   │ ← engine target for this set
│ ┌ SET 2 OF 3 ──────── Target 45×10 ┐  │
│ │ KG [ −   45   + ]  REPS [ − 10 + ]│  │ ← big logger (56 px controls, 26 px values)
│ │ [        ✓ Log set 2           ] │  │   pre-filled with today's target
│ └──────────────────────────────────┘  │
│ #  LAST TIME · MON 12 OCT  TARGET DONE│ ← all sets visible, compact (40 px rows)
│ 1  50×8                    52.5×8 ✓   │   tap a done row to edit it
│ 2▐ 45×10                   45×10  —   │ ← current row highlighted
│ 3  40×12                   40×12  —   │
│ DONE · 1                              │
│ [✓ A1 · DB Bench Press (incline)  ↑ ] │ ← finished rows below, with their arrow
├───────────────────────────────────────┤
│ Rest · Next: set 3   2:30  [+15s][Skip]│ ← starts by itself after each log
│ [Finish] [Next › Dumbbell Bench Press]│
└───────────────────────────────────────┘
```

Decisions:
- **D1 The current exercise is always at the top.** Finished rows move below it (today they collapse in
  plan order, above the current one, so the current card moves down the page as you go).
- **D2 One big logger for the current set or round, plus a compact table of all sets.** You keep the
  overview (#304), but only one set is "active" (10-07 super-simple).
- **D3 The rest timer starts by itself** after every log, using the block's `rest_seconds`. +15 s and
  Skip stay. After an exercise's last set, the rest label shows the next exercise's name.
- **D4 Tools go into ⋯ More**, including EN|ES. This frees the bar for the day name, position and
  elapsed time.
- **D5 Supersets (#308):** one "Round n of 3" logger with a row for C1 and a row for C2, one
  "Log round" button, and rest after both. Each exercise still gets its own insight.
- **D6 Drop set:** one main kg/reps row plus a smaller "↳ Drop part" row, logged together.
- **D7 Pyramids:** each set has its own target and its own "Last time" value. The logger pre-fills the
  load for that position.

### 3.2 Per-exercise insight (when the last set or round is logged)

- The card replaces the logger in place for **3 s**, with a thin countdown line, `role="status"` and
  `aria-live="polite"`. Then it folds into the finished row (the arrow stays) and focus moves to the
  next unfinished exercise.
- **Tap the card (or "Keep open") to pin it**. It then stays until you tap "Continue ›". This satisfies
  WCAG 2.2.1 (timing adjustable). With `prefers-reduced-motion` there is no slide-in and no countdown
  bar, but the timing is the same.
- Each card shows **the verdict, one factual line, the basis it was compared with, and at most one
  "watch" line**.
- On the **last exercise of the day**, skip the 3 s card and go straight to *Completed*. There, that
  exercise's insight is highlighted as "just now".

### 3.3 Completed screen (immediately after the last set)

```
              (✓)
         Completed ✓
     Chest & Back A · Mon 19 Oct
 [ 57:12 Duration ][ 21/21 Sets ][ 7/7 Exercises ]
   ↑3 up  →1 same  ↓1 down  ↕1 mixed  ●1 baseline
 SETS PER MAIN MUSCLE  Upper Chest 3 · Upper Back 3 · Lats 9 · Chest 6 · Abs 3
 EXERCISE INSIGHTS
  ↑ A1 Dumbbell Bench Press (incline) IMPROVED  Set 2: +1 rep at 30 kg
  ↕ B1 T-Bar Row MIXED  Some sets up, some down — set 1: +2.5 kg · set 3: −1 rep at 40 kg
     ▌Today: last set was 11 reps (target 12).
  …
  Compared with your last Chest & Back A (Mon 12 Oct), set by set, working sets only.
  A and B days are never compared. Next targets are on Today (AI Trainer).
 [            Back to Today            ]
```

- A full screen, not a sheet. "Completed ✓" only when every planned set is logged. If you tap Finish
  early, the title is **"Finished early"** and shows `5/7` exercises (see open question Q2).
- **No summed tonnage.** "Sets per main muscle" replaces it (PT 4.1). The prototype counts primary
  muscles only. Secondary muscles (+0.5) are for the Tech Lead to add from catalogue-v2.
- No engine "Next time" lines on this screen. They stay on Today, so this screen describes what
  happened and does not prescribe. That is the PT 5 boundary.

### 3.4 Examples in the prototype (Chest & Back A, block-2026-10-05, week 3)

| # | Exercise (technique) | Mon 12 Oct (equivalent) | Today | Verdict / message |
|---|---|---|---|---|
| A1 | Incline DB press (straight, step 2) | 30×10, 30×8, 30×8 | 30×10, 30×9, 30×8 | ↑ Improved · "Set 2: +1 rep at 30 kg" |
| B1 | T-bar row (**reverse pyramid**, step 2.5) | 50×8, 45×10, 40×12 | 52.5×8, 45×10, 40×11 | ↕ Mixed · "set 1: +2.5 kg · set 3: −1 rep at 40 kg" + W1 |
| C1 | DB bench flat (**superset** with C2) | 30×12, 30×10, 30×10 | 32×11, 32×10, 32×10 | ↑ Improved · "+2 kg on every set · set 1: +2 kg, 1 rep fewer" |
| C2 | Underhand pulldown (superset) | 65×10, 60×11, 65×11 | same | → Same · "Same as last time — 65×10 · 60×11 · 65×11" |
| D1 | High cable fly (superset with D2) | 15×12 ×3 | 15×12, 15×12, 15×10 | ↓ Lower · "Set 3: −2 reps at 15 kg" + W1 |
| D2 | Straight-arm pulldown (superset) | none (only Thu 15 Oct, B day) | 22.5×12 ×3 | ● Baseline · "First time logging this on Chest & Back A" + W6 |
| E1 | Cable crunch (**drop set**) | 40×10 + 30×10 | 42.5×10 + 30×8 | ↑ Improved · "+2.5 kg at the same reps" (main part only) |

Where they exist, the numbers come from the approved PT docs: incline Mon 12 Oct and Thu 15 Oct, the
pulldown 65/60/65, straight-arm 22.5×15. The rest are made-up example numbers, not engine output.


### 3.5 Update after PO feedback (2026-10-18): squeeze line, 2:00 rest, customer-experience pass

**Squeeze line, always visible.** It sits right under the exercise name and above the big logger, as
soon as the exercise opens. It is a single high-contrast line: a squeeze icon, the label
"SQUEEZE / APRIETA", and one short imperative phrase in bold white, 16.5 px.
- The text is the exact EN/ES strings from the PT draft
  `docs/fitness/drafts/2026-10-18-short-squeeze-cues.md` (EN 7 words or fewer, ES 8 or fewer). Each
  line is tagged **"draft copy" / "texto borrador"** until the PO approves that doc and the Tech Lead
  moves it to `approved/`.
- In a superset, one box holds both cues ("C1 …", "C2 …").
- The line is hidden only while the insight card is showing (the exercise is finished by then).
- **More (⋯)** now opens with the full approved `squeeze_cue` and the plan note for the current
  exercise or exercises. Both come in EN or in the approved ES (`docs/fitness/approved/es/`), followed
  by Technique, History, Swap, Notes, Google and Language.
- Follow the PT display rule: if an exercise has no short cue, show nothing there. Never cut down the
  long cue automatically.

**Rest 2:00 (PO).** The rest between sets is 2:00 for every exercise. In supersets the C1 → C2 hand-off
stays about 10 s and the 2:00 rest comes after the pair. The bar shows "REST · ✓ Set 1 logged · Next:
set 2", a large 2:00, and **Undo / +30 s / Skip**. This overrides `rest_seconds` in blocks.json
(150 s / 90 s / 75 s). The Tech Lead needs to decide whether it becomes a user setting ("Rest between
sets: 2:00") or replaces the plan values. The PT should confirm this is fine for the heavy A1/B1 lifts
(the plan had 2:30).

**Customer-experience pass: sweaty hands, a 1-second glance, between sets.**
1. **Fewer words.** Technique info is one chip ("3 × 8 · rest 2:00", "Heaviest first, then lighter",
   "C1 → 10 s → C2 · rest 2:00"). The separate "Today: target" banner is gone; the target sits in the
   logger header ("Target 30×8 · AI"). The "Last time = any day" hint is gone; the date is in the
   column header. Insight basis lines are shortened to "vs Mon 12 Oct (Chest & Back A)".
2. **Bigger targets.** Steppers are 64 px tall, values 28 px, and "Log set" is 64 px tall. Rest buttons
   are 48 px, and every control is 44 px or more. The kg field is a text field with a decimal keypad,
   so "52,5" shows correctly in Spanish.
3. **The next action is always obvious.** The screen has one primary button at a time: Log set, then
   (during rest) the timer, then **Next ›** only once the exercise is finished. The permanent
   Finish/Next footer is gone.
4. **Safety for slips.** Undo for the last logged set is in the rest bar. **Finish** moves to the top
   bar and asks first ("Finish now? 5 of 7 exercises done", with **Keep training** as the main
   button). Exit keeps progress, so it needs no confirmation.
5. **Nothing important behind the fold.** At 375×812 the name, squeeze line, logger and Log button
   are all on screen without scrolling, with the rest bar showing.


### 3.6 Trend by set (PO 2026-10-18)

This section sits under the sets table and is collapsible ("Trend by set ▾ / Tendencia por serie ▾").
It is open by default and remembers its state per device.

**Chart**
- **Bars:** grouped bars, one group per session and one bar per set position. Each bar's height is
  the weight in kg. Above each bar are two small labels: kg (muted) and reps (bold).
- **Sessions shown:** the last 5 sessions of the exercise on any day, matching the R24 "Last time"
  rule. Under each date is a day tag (A/B, plus "Deload").
- **Colour:** the same colour per set position, from S1 darkest to S3 lightest (rose ramp), with a
  legend. The ramp is ordinal (one hue). The dataviz validator passes CVD separation and 3:1 contrast
  against the dark surface. The categorical lightness and chroma checks do not apply to a one-hue
  ramp. Identity never depends on colour alone: the legend, the set order and the bar labels all
  carry it.
- **Today:** the group is outlined in rose. Bars appear as sets are logged; sets not yet logged show
  as dashed ghosts at the target weight.
- **Deload sessions:** hollow, dashed bars.

**Axis**
- A kg axis drawn to scale, with ticks every 5, 10, 15, 20, 25 or 50 kg (the smallest step that
  needs 4 ticks or fewer).
- **The baseline is 0 kg**, and the chart says so ("Bars from 0 kg"). Bar length encodes the value,
  so a cut-off axis would make a 2 kg step look like a large jump. A 26 → 30 kg change is still about
  10 px at 78 px plot height.

**Size and interaction**
- About 136 px for the plot and dates, plus a one-line legend and a caption. It sits under the table,
  so the logger stays above the fold.
- It scrolls sideways and opens scrolled to Today.
- Tap a bar to see "Mon 12 Oct (A) · S2: 30×8 kg" in the caption line (`aria-live`). Each bar also
  has a `<title>` and the SVG has a full text summary for screen readers.

**Special cases**
- Supersets show one small chart per exercise.
- Drop sets chart the main part only ("drop part not shown").

**Data**
- The incline DB press uses the brief: Mon 5 26×12 ×3, Thu 8 28×14/12/12, Mon 12 30×10/8/8,
  Thu 15 28×14, 28×12, 30×10, then today.
- The other exercises use made-up numbers that match the rest of the prototype. The cable crunch has
  a deload session on Mon 21 Sep (week 6 of the previous block) to show the hollow style.
- This is a description of history. It adds no trend verdict, so PT rule 1.3 still holds.

## 4. Insight rule mapping (exact computation)

All inputs are **working sets** (`workingSets()`), main part only for drop sets, never warm-ups.

**Step 0: Pick the comparison session (PT 1.1).** The latest earlier session with the same `exerciseId`
**and** `blockId` **and** `dayKey`, where neither session is a deload (unless both are). That is
`latestEquivalentComparisons` / `equivalentLiftSessions`. If there is none, the result is **Baseline**
(PT 1.2).
> Note: the table's **Last time** column follows R24 (the latest session on *any* day, for example
> Thu 15 Oct for the incline press). The insight compares with the latest *same-day* session
> (Mon 12 Oct). The card always prints its basis ("vs Mon 12 Oct · your last Chest & Back A") so the
> two never look contradictory. See Q1.

**Step 1: Target check (PT 2.1).** If the planned rep target for any position differs between the two
sessions, the verdict is **Target changed**: no arrow, and the message is "Rep target changed since last
time, so no comparison".

**Step 2: Per-set verdict (PT 2.3).** Pair the sets by position (set k with set k, including pyramids;
never average). `step` = 2 kg for dumbbells, 2.5 kg otherwise (PO decision 5). `same = |Δkg| < step`.
- same and Δreps ≥ +1 → improved · same and Δreps = 0 → held · same and Δreps ≤ −1 → dropped
- Δkg ≥ +step: Δreps ≥ −1 → improved (PO decision 2), otherwise traded
- Δkg ≤ −step: Δreps ≤ +1 → dropped, otherwise traded

**Step 3: Session verdict (PT 2.4).** Improved = ≥ 1 improved and none dropped. Lower = ≥ 1 dropped and
none improved. Same = every set held. Traded = every set traded. Otherwise **Mixed**. An extra set at
the same load and ≥ target reps counts as improved. Fewer sets than last time is shown as a fact
("2 sets vs 3 last time"), never as a drop.

**Step 4: Message templates** (`Δ` = per-set differences; at most 2 changed sets are listed, "set k: …"):

| Verdict | Arrow | Condition | Message (EN) |
|---|---|---|---|
| Improved | ↑ | every set +Δkg, Δreps = 0 | "+{Δkg} kg at the same reps" |
| Improved | ↑ | every set +Δkg, some reps −1 | "+{Δkg} kg on every set · set k: +{Δkg} kg, 1 rep fewer" |
| Improved | ↑ | otherwise | "Set k: +{n} rep(s) at {w} kg" / "Set k: +{Δkg} kg" |
| Same | → | all held | "Same as last time — {n}×{reps} @ {w} kg" (straight) or "— {w×r · w×r · w×r}" |
| Lower | ↓ | | "Set k: −{n} reps at {w} kg" (neutral word "Lower"; never "regressing" or "stalling") |
| Mixed | ↕ | | "Some sets up, some down — set i: … · set j: …" (existing key `progress.v3.detail.mixed`) |
| Traded | ⇄ | | "Heavier, fewer reps" / "Lighter, more reps" (PT 2.3 wording) |
| Baseline | ● | no equivalent session | "First time logging this on {day name}" |
| Target changed | none | Step 1 | "Rep target changed since last time, so no comparison" |

Basis line, always shown: "vs {date} · your last {day name} · working sets, set by set", plus
" · main part only" for drop sets.

**Step 5: At most one "watch" line (PT 5).** Use the approved priority **W1 > W2 > W3 > W4 > W6 > W5**,
evaluated on *today's* sets:
- **W1** last set reps < that set's target → "Today: last set was {r} reps (target {t})."
- **W2** every set ≥ target max at one load → "Today: all sets reached {t} reps at {w} kg."
- **W3** same single load today and in the previous equivalent session → "Same load ({w} kg) in the last 2 sessions."
- **W4** last-set RIR = 0 → "Last set was logged at 0 reps in reserve."
- **W6** Baseline → "First comparison next time (baseline {today})."
- **W5** no RIR logged → "Tip: log reps in reserve on your last set." (only if nothing else applies)

The approved W1/W2 templates start with "Last time:" because the Progress screen shows them before the
next session. In the workout they describe the session that just ended, so the prototype says
**"Today:"**. Only that prefix changes; the condition and numbers are the same. **Needs PT sign-off**
(Q4). The PO's example "2 reps short of target" is *not* used, because it is not an approved template.

The card must never contain advice ("you should…", "increase to…"), anything about pain, fatigue or
health, "PR/best" on a baseline, or a trend word. Trend words need 4 or more sessions over 14 days or
more (PT 1.3).

**Completed totals:** duration = first logged set (or Start) → last logged set. Sets = logged working
sets / planned. Exercises = fully logged / planned. Tally = count of verdicts. Sets per muscle = 1 per
primary muscle and 0.5 per secondary muscle, per working set, with a drop set counting as 1 set
(PT 4.1, PO decision 4).

## 5. Impact, effort, dependencies

| # | Item | Impact | Effort | Depends on |
|---|---|---|---|---|
| 1 | Completed screen with PT-rule insights (replace `actionTrend` arrows and summed tonnage) | High | S–M | Tech Lead: reuse `compareLiftSessions` / `watchObservations` per exercise |
| 2 | Per-exercise insight card (3 s, pinnable, folds into the row) | High | M | #1's computation; QAer week flow |
| 3 | Big current-set logger + compact table + auto rest | High | M | Copilot; current set-row data |
| 4 | Move tools and EN/ES into ⋯ More; timer in the bar | Medium | S | none |
| 5 | Current exercise at the top, finished rows below | Medium | S | none |
| 6 | "Today:" prefix for W1/W2 in Workout mode | Low | S | PT review |

Quick wins: 1, 4, 5. Bigger bet: 2 + 3 together (one coherent change to Workout mode).
No backend, no new data and no AI cost. Everything is deterministic on the device from existing entries.

## 6. Risks

- **Comparing against A-day history while "Last time" shows B-day values** can confuse. Mitigation:
  the basis line on every card, and the column header includes the date.
- **Insights arrive mid-session, so a "Lower" can feel bad.** Mitigation: neutral words and a muted
  colour (no alarm red). No advice is given, and the watch line is factual only.
- **Duplicate or typo logs** (PT open notes, 10-09 copies) produce false "Same" verdicts. Mitigation:
  the PO cleans up the data before release.
- **Auto-advance** might move focus while you still want to edit. Mitigation: tap a finished row or a
  chip to return; done rows stay editable.

## 7. How to measure success

- Taps to log one straight set: target **1** (pre-filled) and **3 or fewer** when changing kg or reps.
- The first set row is visible without scrolling at 375×812 (today it is about 680 px down and covered
  by the footer).
- The share of sessions ending on the Completed screen (Finish or last set) versus sessions abandoned
  in Workout mode.
- The PO's 2-week diary: "Did the insight match what you felt?" Count any card the PO or PT finds wrong.
- QAer: invariants. Insight verdicts match `compareLiftSessions` for every exercise in the replay
  (`scripts/trainer-replay.ts` data).

## 8. Open questions for the PO / PT / Tech Lead

- **Q1 (PO):** Should the insight compare with the last *same day* (approved PT 1.1, recommended) or
  with the latest session on any day, as the Last time column does (R24)? The prototype uses the same
  day and prints the basis.
- **Q2 (PO):** If you tap Finish before everything is logged, should the title be "Finished early · 5/7"
  (recommended) or still "Completed"?
- **Q3 (PO):** After the 3 s card, should focus jump to the next exercise by itself (recommended), or
  should it wait for "Next"?
- **Q4 (PT):** May W1/W2 use a "Today:" prefix in Workout mode (same condition and numbers)?
- **Q5 (PT/Tech Lead):** In the session tally, should Traded count as its own type or be left out?
- **Q7 (Tech Lead/PT):** Should the 2:00 rest be a user setting (recommended) or replace the plan's `rest_seconds`? Is 2:00 fine for heavy A1/B1 lifts that had 2:30?
- **Q8 (PO):** Approve the PT short squeeze cues (draft) so the "draft copy" tag can be removed.
- **Q9 (PO):** Should Trend by set start open (prototype) or collapsed? Should it show 5 sessions, or 6 (a full block of one day)?
- **Q6 (Tech Lead):** Keep tonnage per exercise in History only, and remove the session "Volume kg"
  total (PT 4.2)?

## 9. Web Interface Guidelines audit

- Source: vendored `.claude/skills/web-design-guidelines/command.md`, Vercel commit
  `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`. SHA-256 checked on 2026-10-18 =
  `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`, which matches
  `docs/governance/skill-checksums.json`. The rules were treated as reference material only.
- Findings in the current code (read-only):
  - `src/components/WorkoutPlan.tsx:2968-2994`: the workout bar title truncates at 375 px because the
    language toggle shares the row ("text containers handle long content"). Proposal: D4.
  - `src/components/WorkoutPlan.tsx:4146`: the summary shows a summed volume (a PT rule conflict, not
    a guideline issue). Proposal: 3.3.
  - `src/trainer/summary.ts:32-38`: the ↑/→/↓ labels describe the next action, not today's result. The
    aria-label "Upward trend" breaks the PT 1.3 rule against trend words. Proposal: section 4.
- The prototype follows: `aria-live="polite"` on the insight card, the Completed hero and the rest
  timer (`role="timer"`); `prefers-reduced-motion`; `tabular-nums` on numbers; `text-wrap: balance`
  on headings; `touch-action: manipulation`; `overscroll-behavior: contain` on the sheet; 44 px or
  larger targets (logger 56 px); `inputmode="decimal"`; `min-width: 0` on flex text; no horizontal
  scroll at 375 px (checked: scrollWidth = 375).

## Sources

- Strong, Hevy and Fitbod workout-complete patterns (public app-store screenshots and help centres):
  https://help.strongapp.io · https://www.hevyapp.com/features · https://fitbod.zendesk.com
- NN/g, "Visibility of System Status": https://www.nngroup.com/articles/visibility-system-status/
- W3C WCAG 2.2, SC 2.2.1 Timing Adjustable: https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable
- Apple HIG, Feedback: https://developer.apple.com/design/human-interface-guidelines/feedback

## PO decisions (2026-10-18): approved with Tech Lead recommendations
1. Rest: user setting in Profile, default 2:00 (superset C1→C2 hand-off keeps the plan's short gap).
2. PT short squeeze cues approved (docs/fitness/approved/2026-10-18-short-squeeze-cues.md).
3. Insights compare with the last same-day session (approved PT rule); watch lines may start with "Today:" (wording only); "Traded" counts as Mixed in the tally.
4. Finish early shows "Finished early · n/N".
5. After the 3 s insight card, auto-advance to the next exercise.
6. Remove the summed kg volume from the session summary; show sets per main muscle.
7. Trend-by-set chart open by default, last 5 sessions.
