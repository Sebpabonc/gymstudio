# QAer report — 2026-10-04 (mobile layout & density audit)
Build: 7045df7 (main) · Live: https://sebpabonc.github.io/gymstudio/?demo=1 · Viewports: 375×667 (iPhone SE), 390×844 (iPhone 14/15), 430×932 (Pro Max)

Scope: focused run requested by the PO ("the interface on mobile seems very squeezed"). Measured, not eyeballed:
all numbers below come from `getBoundingClientRect` / `getComputedStyle` in the live app (Chromium device emulation,
DPR 2). Walked Today (block card, day tabs, expanded exercise, set log, superset set log, rest timer), Exercises
(search, exercise card, "Track it as you go" log card), Progress (every section expanded) and You (demo card and the
signed-out sign-in screen — no sign-in attempted). All writes happened in demo mode. No console errors.

Not covered: drop sets (no drop-set exercise exists in the current Block 6 days), real-device behaviour (iOS zoom and
safe-area findings are derived from computed CSS and documented iOS rules, not observed on a device), 768 px / desktop.

## Summary
| Area | Result | Notes |
|---|---|---|
| App shell (header, dock, frame) | ❌ | Pro Max gets a 390×844 framed "phone mockup"; fake notch drawn on real phones; 14 px strip of content above the collapsed header (#112) |
| Inputs (all screens) | ❌ | 12 of 12 measured inputs are under 16 px, so iOS Safari zooms on focus (#113) |
| Today | ❌ | 4–6 nested boxes, 74 px of chrome per side at the set log, 72 of 107 text nodes < 12 px, 17 of 26 tap targets < 44 px (#114) |
| Exercises | ❌ | Log card inputs 9.92 px text; each set row 228 px tall at ≤ 420 px; filter chips 27 px tall (#115) |
| Progress | ⚠️ | Chart labels render at 8.1 px; 39 text nodes < 10 px; PR rows squeeze names to 115 px (#116) |
| You | ⚠️ | Demo card screen stretches: 110 px empty gap above the header (#117) |
| Horizontal overflow | ✅ | None at any width (the body-region chip row scrolls inside its own container by design) |
| Elements hidden by dock / rest pill | ✅ | Bottom padding grows to 152 px while the pill is shown; last content is reachable. Pill and dock don't overlap (22 px gap) |

P1: 0 · P2: 5 · P3: 1 (+ design notes for UXer, no issues)

## Measurements

### Global chrome
| Metric | 375×667 | 390×844 | 430×932 |
|---|---|---|---|
| App area (frame) | 375×667 full-bleed | 390×844 full-bleed | **390×844 framed, 20 px side margins, 44 px top / 44 px bottom gutter, 34 px corner radius** |
| Expanded header bottom (GYM STUDIO + tagline + screen name) | 137 px | 137 px | 137 px (inside frame) |
| Collapsed header bar | y 15–63 (14 px of scrolling content visible above it) | y 15–63 | same, inside frame |
| Fake "Dynamic Island" (`.phone-frame::after`, 120×26, z-index 5) | drawn at y 8–34 | drawn | drawn |
| Floating dock | 228×60 at y 594 (73 px from bottom) | y 771 | y 815 |
| Rest timer pill | 187×54 at y 518 | y 695 | — |
| Bottom chrome while resting (pill + dock) | 149 px = 22% of screen | 149 px = 18% | — |
| Top + bottom chrome while scrolled and resting | 63 + 149 = 212 px = 32% of 667 | 25% of 844 | — |

### Today
| Metric | 375×667 | 390×844 | 430×932 |
|---|---|---|---|
| Y of first exercise row (A1 code), welcome card dismissed | 589 (dock starts at 594: name not visible) | 577 (visible, dock at 771) | 576 in frame |
| Same, first run with welcome card | 783 (needs a scroll of ~250 px) | — | — |
| Nesting (boxed levels around text) | main > plan card > day-plan card > exercise card > set-log box > set row = **5 boxes**; superset exercise: plan card > day-plan > superset group > exercise card = 4 | same | same |
| Left offset of set-log input (chrome per side) | **74 px** (12 + 13 + 13 + 13 + 11 + 11) | 74 px | 94 px from viewport (74 + 20 frame margin) |
| Exercise card inner width | 271 px (72% of viewport) | 286 px | 286 px |
| Superset exercise name width | 212 px (57% of viewport) | — | — |
| Set-log reps / weight input | 110×40, **13.12 px** text | 117×40, 13.12 px | 117×40, 13.12 px |
| Day-tab label lines (Day 1…6) | **2,1,2,2,1,2** at 10.56 px; "Today" tag 8 px | 1,1,2,1,1,2 | 1,1,2,1,1,2 |
| Day-tab gap | 6 px × 6 px | 6 px | 6 px |
| "POSTURE TIPS" label | wraps to 2 lines | 1 line | 1 line |
| Reps prescription "12 · 12 · 12 · 12" | 3 lines | 3 lines | 3 lines |
| Text nodes < 12 px / < 10 px (exercise + set log open) | **72 / 30 of 107** | 72 / 30 | 72 / 30 |
| Tap targets < 44 px | **17 of 26** | 17 of 26 | 17 of 26 |
| Block title "Hypertrophy Flat Pyramid II" | 2 lines (squeezed by PT badge + "Pinned block / Starts Mon 5 Oct" + toggle) | 2 lines | 2 lines |

Smallest Today text: "Today" tag 8 px; Superset / technique chips 8.64 px; set-log "REPS"/"KG" labels 8.96 px; "+" in set-log toggle 8.96 px; block number / "6-WEEK BLOCK" 9.28 px; exercise codes A1/B1 9.92 px; "PT" badge 9.92 px; "Pinned block" 10.24 px; superset set titles 10.88 px.
Small targets: exercise expand "+" 29×28 (×7), set-log toggle 26×25, calendar 30×30, Posture tips header 123×30.

### Exercises
| Metric | 375×667 | 390×844 | 430×932 |
|---|---|---|---|
| Search input text | 15.36 px (below 16) | same | same |
| Body-region chips | 27 px tall, 8.64 px text | same | same |
| "Track it as you go" reps/weight inputs | 323×36, **9.92 px** text | same | — |
| Height of one logged set row | **228 px** (Set label, Reps, Weight and a full-width Remove stacked) | 228 px | 57 px (one row) |
| Text nodes < 12 px / < 10 px | 39 / 25 of 74 | same | same |
| Tap targets < 44 px | 19 of 24 | same | same |
| Inputs under 16 px | 6 of 6 | 6 of 6 | 6 of 6 |

### Progress (all sections expanded)
| Metric | 375×667 | 390×844 |
|---|---|---|
| Page height | 2,848 px | 2,839 px |
| Strength trend chart axis / band labels (rendered) | **8.1 px** | 8.4 px |
| Text nodes < 12 px / < 10 px | 51 / 39 of 127 | same |
| Smallest text | chart labels 8 px; "D1…D6", "This week · Block 5", PR badges, weekly-sets "8 done / 0 planned · Light", legends 8.64 px; A/B/All 8.96 px | same |
| Personal-records name column | 115–134 px when a row has two badges ("Cable Fly (Mid / Height)" wraps) | 121–134 px |
| Tap targets < 44 px | 0 of 11 ✅ | 0 |

### You
| Metric | 375×667 |
|---|---|
| Demo mode: header pushed down | header starts at y 124 instead of 27 (`.app-content` is a grid whose rows stretch to fill 665 px) |
| Sign-in inputs (email / password) | 12.16 px text, 44 px tall |
| Email field position | y 556 (below "Welcome back", 3 bullets, a privacy paragraph and the Sign in / Create account switch) |

## Findings

### [P2] App shell: Pro Max gets a framed 390×844 mockup, a fake notch is drawn on real phones, and content shows above the collapsed header — #112
- Where: all screens; 430×932 for the frame, all widths for the notch and header strip.
- Steps: 1. Open the app at 430×932 (or any width > 420 px). 2. Open it at 375×667 and scroll Today.
- Expected: on a phone the app fills the screen edge to edge; no decorative device chrome; nothing scrolls visibly above a sticky header.
- Actual:
  - `.phone-frame` only goes full-bleed under `@media (max-width: 420px)`. At 430 px it renders the desktop "phone mockup": 390×844 box at x 20 / y 44, 1 px border, 34 px radius, gray gutters. The largest iPhone gets *less* usable width (388 px) than a 390 px phone.
  - `.phone-frame::after` (120×26 dark pill, z-index 5) is drawn at the top of the app at every width — a fake Dynamic Island on top of the real one / status bar. (Device check needed for exact overlap on iOS.)
  - The collapsed `.brand-bar` is `position: sticky; top: 0` inside `main` which has `padding-top: 14px`, so it sticks at y 15. Scrolling content is visible in the 14 px strip above it (screenshot: block card and superset chips visible above "GYM STUDIO Today"). The bar is also `pointer-events: none`, so taps in its area hit the cards underneath.
  - 1 px frame border remains at the screen edges at ≤ 420 px.

### [P2] All text inputs are below 16 px, so iOS Safari zooms the page when you tap them — #113
- Where: Today set log, superset set log, notes; Exercises search, log card and notes; You sign-in form.
- Steps: tap any reps/weight field on an iPhone.
- Expected: inputs use at least 16 px text, so iOS does not zoom.
- Actual (computed): set-log reps/weight 13.12 px; Exercises log card reps/weight 9.92 px; search 15.36 px; notes textareas 12.16 px; email/password 12.16 px. 12 of 12 measured inputs are under 16 px. iOS Safari zooms any focused input under 16 px; the user then has to pinch back out mid-workout.

### [P2] Today: content is boxed 4–6 levels deep and most labels are 8–11 px, so the plan feels squeezed on a phone — #114
- Where: Today, 375×667 (most things also at 390/430).
- Steps: open Today, expand A1, open its Set log; open the B superset Set log.
- Expected: readable text (≥ 12 px for secondary labels, ≥ 14–16 px for primary values), tap targets ≥ 44 px, labels that fit on one line, the first exercise visible without scrolling on a small phone.
- Actual:
  - Nesting: plan card > day-plan card > (superset group >) exercise card > set-log box > set row. Each level adds a 1 px border + 10–12 px padding, so the set-log inputs start 74 px from each edge: 227 px left for two inputs on a 375 px screen. Six vertical border lines are visible on the left edge (screenshot).
  - 72 of 107 text nodes are < 12 px and 30 are < 10 px (list in the measurements table: "Today" 8 px, chips 8.64 px, REPS/KG 8.96 px, codes 9.92 px …).
  - 17 of 26 tap targets are < 44 px: expand "+" 29×28 on every exercise, set-log toggle 26×25, calendar 30×30, Posture tips header 30 px tall. Day tabs are 6 px apart.
  - Wrapping: at 375 px 4 of 6 day tabs wrap to two lines with an orphan letter ("Day 1 · Chest-Back / A", "Lower Body / A"); at 390/430 two still wrap. "POSTURE TIPS" wraps at 375. The reps prescription "12 · 12 · 12 · 12" takes 3 lines in its stat tile at every width while the Sets tile shows a single "4" in the same height.
  - Above the fold: at 375×667 the first exercise row starts at y 589 and the dock at y 594, so no exercise is visible on open (783 px on first run with the welcome card).

### [P2] Exercises: the "Track it as you go" log card uses 9.92 px inputs and stacks every set to 228 px tall — #115
- Where: Exercises tab, 375 and 390 px.
- Steps: open Exercises, select any exercise, scroll to "Track it as you go".
- Expected: a compact set row (Set n · reps · weight · remove) with readable inputs, like the Today set log.
- Actual: under `@media (max-width: 420px)` `.set-row` becomes a single column, so each set is a stack of "Set 1" pill, REPS label, input, WEIGHT label, input and a full-width "Remove" button = 228 px per set (57 px at 430 px). The reps/weight inputs show 9.92 px text in a 36 px tall field. Body-region filter chips are 27 px tall with 8.64 px text; 19 of 24 tap targets on the screen are < 44 px. Field labels (Search exercise, Primary muscles, Notes) are 8.64 px uppercase.

### [P2] Progress: chart labels render at 8 px and several sections use 8.64 px text — #116
- Where: Progress, all sections expanded, 375 and 390 px.
- Steps: open Progress and expand every section.
- Expected: chart axis/band labels and secondary lines readable on a phone (≥ 11–12 px rendered).
- Actual: Strength trend SVG text (82 kg / 73 kg / 64 kg, B2…B5, dates) renders at 8.1 px (375) / 8.4 px (390). 39 of 127 text nodes are < 10 px: day dots "D1…D6", "This week · Block 5", "8 done / 0 planned · Light", PR badges, chart legends (8.64 px). In Personal records, rows with two badges squeeze the exercise name to 115–134 px ("Cable Fly (Mid / Height)" wraps) and the badges form a ragged column (single-badge rows align right, two-badge rows don't). Tap targets on Progress are all ≥ 44 px.

### [P3] You: in demo mode the screen stretches, leaving a 110 px gap above the header — #117
- Where: You tab, demo mode, 375×667.
- Steps: open `?demo=1`, tap You.
- Expected: header at the top (y 27) as on the other tabs.
- Actual: header starts at y 124 and the demo card is 235 px tall for three lines. `.app-content` is `display: grid` with default `align-content` (stretch), so with little content the rows stretch to fill the 665 px scroll area.

## Design notes for UXer (no issues filed — product/design choices)
- Welcome card pushes the plan ~194 px down on first run; consider a smaller banner or putting it after the day's plan.
- Block card squeezes the title onto two lines because "PT", "Pinned block / Starts Mon 5 Oct" and the toggle sit on the same row; the "Next block starts" banner repeats the same date.
- 3×2 day-tab grid uses 133 px of height on every open; a single scrollable row or "Today: Day 1" summary would free space.
- Uppercase letter-spaced micro-labels (0.7–1.4 px tracking at 8.6–11.5 px) are used everywhere (SET LOG, POSTURE TIPS, field labels) — they read as dense on a phone.
- Completed exercises are dimmed grey, which reduces contrast of the most-scanned text during a workout.
- Progress headline ("This week: 1 of 6 sessions · 1 PR · in progress" + D1–D6 dots) repeats the Consistency section's dots right below it.
- The sign-in screen puts the email field at y 556 on a 667 px phone (behind "Welcome back", bullets, a privacy paragraph and a mode switch); "← Back to Today" duplicates the dock.
- Weekly sets by muscle shows "0 planned" for every muscle this week (gap week between Block 5 and Block 6) while still drawing the 10–20 band; likely the same gap-week cause as #77/#85 — Tech Lead to confirm.

## Passed checks
- No horizontal page overflow at 375 / 390 / 430.
- Rest timer pill doesn't cover the dock (22 px gap); the scroll area adds 152 px bottom padding while it is shown, so the last card stays reachable.
- Progress expand/collapse toggles and buttons are all ≥ 44 px.
- Rest pill buttons are 44 px tall.
- No console errors in demo or signed-out mode.
- English only; no Spanish text seen.
