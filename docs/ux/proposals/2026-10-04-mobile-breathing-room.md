# Mobile breathing room: a roomier, calmer phone UI (2026-10-04)

**Author:** UXer · **Status:** Proposal, waiting for a PO decision ·
**Mockups:** [`2026-10-04-mobile-breathing-room-mockups.html`](./2026-10-04-mobile-breathing-room-mockups.html)

> Proposal only. Nothing here is committed work until Sebas approves it. This proposal keeps the
> approved header (Option 2, large GYM STUDIO title that collapses) and tab bar (Option 3, floating
> icon dock) from [`approved/2026-10-04-header-and-tabbar.md`](../approved/2026-10-04-header-and-tabbar.md).
> It builds on the approved audit ([`approved/2026-10-04-ux-audit.md`](../approved/2026-10-04-ux-audit.md)),
> mainly P1 (faster set entry) and the touch-target item (#9). It does not add or remove information.

## 1. PO request

> "The interface in mobile seems very squeezed — make it more interface friendly."

The goal is a UI that feels **roomier, calmer and easier to use mid-workout**, without losing any
information.

## 2. Summary: top 5 changes, ranked

| # | Change | Why | Effort |
|---|---|---|---|
| 1 | **Real type scale**: body 15 px, labels 13 px, inputs 17 px, no text under 12 px; sentence-case labels instead of tiny UPPERCASE | Body text is 12.2 px. Labels are 8.3–9.9 px. Every input is under 16 px, so iOS zooms the page when you tap one | S–M |
| 2 | **One level of cards**: the day becomes a flat list of exercise rows with 16 px gutters, not cards inside cards inside cards | Today nests up to 6 boxes. A set input starts 74 px from the screen edge. A superset exercise uses only 73% of the screen width | M |
| 3 | **Set log as a table**: one 52 px row per set (Set · Previous · kg · reps · ✓), shown as soon as the exercise opens | The expanded Pec Deck card is 890 px tall (1.3 screens) for 3 sets. Each set is its own bordered box with UPPERCASE labels | M |
| 4 | **Compact block header and a D1–D6 day selector**: one block line, then six equal day buttons with the day name written below | The block is described twice (banner + card). The 2 × 3 day grid uses 133 px with 9.3 px text that wraps. The first exercise starts below the fold at 375 × 667 | S–M |
| 5 | **Use the full phone**: remove the decorative phone frame on all phones (up to 500 px wide), hide the fake notch, stop the hero from stretching | On a 430 px iPhone Pro Max the app is drawn inside a 390 × 844 "phone" with 20 px side margins and rounded corners. Short screens (You) get ~110 px of empty space above the title | S |

**Quick wins (S, CSS only):** #5, the 16 px input floor, the type tokens, the 16 px gutter, chip and
toggle sizes, the Progress list.
**Bigger changes (M, markup + CSS):** flattening Today (#2), the set table (#3), the day selector
and block header (#4), the superset group.

## 3. Evidence (live demo, 4 Oct 2026)

**Method.** I used `https://sebpabonc.github.io/gymstudio/?demo=1` in my own browser tab at 375 × 667,
390 × 844 and 430 × 932. I walked Today (block card, day tabs, an expanded planned exercise, a superset,
the set log, and the rest timer via "Start rest", then Skip), Exercises, Progress and You. I measured
with read-only DOM queries and screenshots. I logged no sets and did not sign in. I read the CSS from the
deployed version (`origin/main`, `src/styles.css`, which is newer than the local checkout).

### 3.1 Text is too small

The base font comes from `--font-body: 0.76rem` (12.2 px). Small labels use `--font-caption: 0.54rem`
(8.6 px) and many hard-coded rem values below 0.6.

| Element | CSS | Rendered |
|---|---|---|
| Body text | `body { font-size: var(--font-body) }` | **12.2 px** |
| Chips (muscles, technique, region filter) | `.chip`, `.region-chip { font-size: var(--font-caption) }` | **8.6 px**, 27 px tall |
| Field labels ("SEARCH EXERCISE", "PRIMARY MUSCLES") | `.field-label` | **8.6 px**, uppercase, 0.14em tracking |
| Metric labels ("SETS", "REPS", "REST") | `.metric-pill span { font-size: 0.52rem }` | **8.3 px** |
| Set labels ("REPS", "WEIGHT", "READY") | `.planned-set-field-pair label { 0.56rem }` | **9.0 px** |
| Day tabs ("Day 1 · Chest-Back A") | `.day-tab { font-size: 0.58rem }` | **9.3 px**, wraps to 2 lines |
| "Start rest", "Log this exercise" | `.rest-start-button { 0.68rem }`, `.small-button` | **10.9 px** |
| Progress screen | | **28 of 115** text elements under 10 px |

For comparison, the iOS default body size is 17 pt and Apple's minimum is 11 pt. Material 3 uses
14–16 sp for body text and 11–12 sp for the smallest labels.

### 3.2 Inputs trigger iOS zoom

iOS Safari (and the Capacitor WebView) zooms the page when you focus a field whose text is under 16 px.

| Input | Rendered font | Height |
|---|---|---|
| Planned set reps / weight (`.planned-set-field-pair input { 0.82rem }`) | **13.1 px** | 40 px |
| Free-log reps / weight (Exercises tab) | **9.9 px** | 36 px |
| Notes textarea | 12.2 px | 53–75 px |
| Exercise search (`.search-input { 0.96rem }`) | 15.4 px | 48 px |

All four are under 16 px. So in the iOS app, every tap on a weight field zooms the page and leaves it
shifted. This is the most "squeezed"-feeling moment mid-set.

### 3.3 Cards inside cards

Today stacks up to six bordered, padded boxes:

```
.card.plan-card            14px 12px padding, radius 22
 └ .day-plan-card          12px padding, radius 18
    └ .superset-group      10px padding, radius 16
       └ .planned-exercise-card   12px padding, radius 14
          └ .planned-progress-box (Set log)  10px padding, radius 12
             └ .planned-set-row   8px 10px padding, radius 10
```

- A set input starts at **x = 74 px**, so 20% of a 375 px screen is spent on nested frames.
- An exercise inside a superset is **275 px** wide out of 375 (73%).
- The expanded card adds more boxes: three metric tiles, a Posture tips box, a Set log box and a
  Progress box. Each has its own border and an UPPERCASE title.
- Every box has a 1 px `--line` border at 14% white. The result is many thin lines in a small space,
  which reads as clutter.

### 3.4 Height and scrolling at 375 × 667

| What | Measured |
|---|---|
| Top of the first exercise row | **y = 772 px**, below the fold. Even with the welcome card dismissed it sits at ~580 px, behind the dock (594 px). |
| Block info | Shown twice: "Next block starts Mon 5 Oct · Block 6 · Hypertrophy Flat Pyramid II" banner (63 px), then the Block 6 card with "Pinned block · Starts Mon 5 Oct" (90 px) |
| Day tabs | 2 × 3 grid of 104 × 71 px buttons, 133 px total |
| Expanded Pec Deck Fly (3 sets) | **890 px** tall, about 1.3 screens |
| Superset E1 + E2 with E1 expanded (set log closed) | **714 px**. "Superset" appears 3 times: badge, chip and "Superset: back to back…" line, plus the "Do E1, rest ~10 s…" sentence |
| Whole Today page | 2,629 px |
| Progress | 6 sections, each its own 74 px card with a 12 px gap: 516 px just for headings |
| Rest timer running | Dock (60 px) + timer pill (54 px) + gaps cover **~150 px**, 22% of the screen |

### 3.5 Small or fiddly targets

- Expand "+" / "−" toggles: **29 × 28 px**.
- Set log / Progress toggles: **26 × 25 px**.
- Chips: 27 px tall.
- Apple asks for at least 44 × 44 pt, and Material for 48 × 48 dp.
- Getting to a set input still takes 2 taps: expand the exercise, then "Set log +".

### 3.6 The app doesn't use the whole phone

- `@media (max-width: 420px)` is the only rule that makes the app full-screen.
- At **430 × 932** (iPhone 15/16 Pro Max and Plus), the app is drawn as a **390 × 844 decorative
  phone** with 20 px side margins, 44 px top and bottom, and 34 px rounded corners on a grey background.
  That loses 40 px of width and 88 px of height.
- On every size, `.phone-frame::after` draws a fake notch pill at the top. On a real phone it sits on
  top of the collapsed header and covers part of "GYM STUDIO · Today".
- `.app-content` is a grid without `align-content: start`. On short screens (You, Progress while
  loading, Today before the plan loads), the hero stretches to 207 px, leaving ~110 px of empty space
  above the wordmark.
- **For QAer to confirm:** after a programmatic scroll, the transparent sticky bar sometimes shows a
  half-faded "GYM STUDIO" on top of the content ("6-WEEK BLOCK" chip, superset sentence).

### 3.7 Visual noise

- About 15 different UPPERCASE letter-spaced labels on one expanded exercise: SET LOG, PROGRESS,
  POSTURE TIPS, LOG THIS EXERCISE, SETS, REPS, REST, WEIGHT, READY, NOTES, and more.
- Section titles, field labels and buttons all look alike, so nothing leads the eye.
- Chips repeat information that is already on screen ("Straight Sets" chip + "Straight sets: same reps
  and weight every set"; "Chest" chip on a chest day).

## 4. What best-in-class apps and guidelines do

- **Apple HIG.**
  - Default body text is 17 pt, with Dynamic Type. Layout margins are 16–20 pt.
  - Grouped ("inset") lists hold settings-like content: one rounded container with hairline row
    separators, not one card per row.
  - Minimum target is 44 × 44 pt.
  - https://developer.apple.com/design/human-interface-guidelines/typography ·
    https://developer.apple.com/design/human-interface-guidelines/layout ·
    https://developer.apple.com/design/human-interface-guidelines/lists-and-tables ·
    https://developer.apple.com/design/human-interface-guidelines/accessibility
- **Material 3.**
  - Spacing follows a 4 dp grid (8 dp for most gaps). Compact screens use 16 dp margins.
  - Type scale: body large 16, body medium 14, label large 14, label small 11.
  - Targets are 48 dp.
  - Lists are preferred over cards for homogeneous items; cards are for distinct, mixed content.
  - https://m3.material.io/foundations/layout/understanding-layout/spacing ·
    https://m3.material.io/styles/typography/type-scale-tokens ·
    https://m3.material.io/components/lists/guidelines ·
    https://m3.material.io/components/cards/guidelines
- **NN/g.**
  - Cards work for browsing heterogeneous content. Nesting them adds visual weight without adding
    meaning.
  - Use a clear visual hierarchy and fewer competing elements.
  - https://www.nngroup.com/articles/cards-component/ ·
    https://www.nngroup.com/articles/visual-hierarchy-ux-definition/
- **Hevy and Strong.**
  - The workout is one scrolling list. Each exercise is a header row, then a plain **table** of sets
    (Set · Previous · kg · Reps · ✓) at full width.
  - There are no borders around each set. Rows are about 44–52 px with large numbers. The only accent
    is the tick, and a completed row turns green/tinted.
  - Previous performance sits inline in its own column.
  - https://www.hevyapp.com/features/track-workouts/ · https://www.strong.app/ ·
    store screenshots: https://screensdesign.com/apps/hevy-workout-tracker-gym-log/
- **Apple Fitness and Nike Training Club.**
  - Generous margins, large bold titles and big numbers, and one idea per row.
  - Secondary detail (tips, history) is one tap away behind a plain row with a chevron.
  - https://www.apple.com/apple-fitness-plus/ · https://www.nike.com/ntc-app
- **iOS input zoom.** Fields under 16 px zoom on focus. The fix is a 16 px floor, not
  `maximum-scale=1`, which blocks pinch zoom and fails WCAG 1.4.4.
  - https://css-tricks.com/16px-or-larger-text-prevents-ios-form-zoom/ ·
    https://weblog.west-wind.com/posts/2023/Apr/17/Preventing-iOS-Textbox-Auto-Zooming-and-ViewPort-Sizing

The competitor notes are based on recent public app versions, product pages and store screenshots.
Check them against current builds before quoting them externally.

## 5. Principles

1. **One level of card nesting, at most.** Screens are lists of sections. Inside a section, use rows,
   hairline dividers and spacing, never another bordered box. Supersets use a side rail, not a box.
2. **16 px gutters** on every screen edge (`--gutter`). Inner padding is 16 px for sections and
   12 px for rows.
3. **An 8-point spacing scale** (4 for fine-tuning): 4, 8, 12, 16, 24, 32. No 3, 5, 6, 9, 10, 14 or
   18 px values.
4. **Readable text.**
   - Body 15 px, secondary text 13 px, and nothing under 12 px.
   - Numbers you read mid-set (weights, reps, the timer) are 20–22 px.
5. **Inputs are 17 px and 48 px tall**, so iOS never zooms. Add `inputmode="decimal"` for weight and
   `inputmode="numeric"` for reps.
6. **Full-width rows instead of boxed tiles.** Three "SETS / REPS / REST" tiles become one line:
   "3 × 15 · flat · rest 60 s".
7. **Fewer chips.** Show chips only for filters you tap. Descriptive facts become plain text in the
   meta line.
8. **Sentence-case labels.** Use UPPERCASE only for the wordmark and at most one small eyebrow per
   screen.
9. **Targets of 44 px minimum, 48 px preferred.** Small icons get a larger invisible hit area.
10. **Use the whole phone.** No decorative frame or notch on real devices. Respect safe areas.

## 6. Proposed design tokens (exact values)

Add these to `:root`. Keep the existing colour tokens (`--bg-dark`, `--text`, `--muted`, `--brand`,
`--line`, `--nav-active`, …). Phase out `--font-body: 0.76rem`, `--font-section: 0.65rem` and
`--font-caption: 0.54rem`.

```css
:root {
  /* spacing: 4-pt base, 8-pt rhythm */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --gutter: 16px;            /* screen edge padding */
  --row-min: 52px;           /* list / set row height */
  --tap-min: 44px;           /* minimum touch target */

  /* type scale (px, so it does not drift with the old rem values) */
  --text-caption: 12px;      /* timestamps, chart axes. Minimum anywhere */
  --text-label: 13px;        /* field labels, meta lines, section labels (sentence case, 600) */
  --text-body: 15px;         /* default body, buttons */
  --text-row-title: 17px;    /* exercise names in rows, list row titles (600) */
  --text-title: 20px;        /* block name, day name, expanded exercise name (700) */
  --text-number: 22px;       /* weights, reps, timer, stats (700, tabular-nums) */
  --text-headline: 24px;     /* Progress headline */
  --text-display: 34px;      /* GYM STUDIO wordmark (unchanged) */
  --text-input: 17px;        /* every input / textarea / select: >= 16 prevents iOS zoom */
  --leading-tight: 1.2;
  --leading-body: 1.45;

  /* shape */
  --radius-section: 16px;    /* was 22 on .card */
  --radius-control: 12px;    /* inputs, buttons, day buttons */
  --radius-pill: 999px;

  /* surfaces (from the existing palette) */
  --surface-1: rgba(255, 255, 255, 0.05);   /* section background (= current .card) */
  --surface-2: rgba(255, 255, 255, 0.08);   /* input / pressed row */
  --divider: rgba(255, 255, 255, 0.08);     /* hairline between rows (lighter than --line) */
}
```

| Role | Now | Proposed |
|---|---|---|
| Body | 12.2 px | 15 px |
| Field / section labels | 8.6–11.5 px UPPERCASE, tracked | 13 px sentence case, 600, `--muted` |
| Chips | 8.6 px, 27 px tall | 13 px, 36 px tall (44 px hit area), filters only |
| Exercise name (row) | 17 px | 17 px (unchanged), with the meta line at 13 px |
| Set inputs | 13.1 px, 40 px tall | 17 px, 48 px tall |
| Primary button | 10.9 px UPPERCASE, 38 px | 16 px sentence case, 52 px |
| Screen gutter | 12 px (`.app-content`), plus 12–14 px per nested card | 16 px, once |
| Section radius | 22 / 18 / 16 / 14 / 12 / 10 px | 16 px for sections, 12 px for controls |

## 7. Per-screen changes

Wireframes are in the mockups file (Now vs Proposed, 375 px).

### 7.1 App shell (all screens) — S
- Full-bleed below **500 px**: change `@media (max-width: 420px)` to `500px` for the
  `.app-shell` / `.phone-frame` rules. Better still, only draw the decorative frame at
  `(min-width: 501px) and (hover: hover)`.
- Hide `.phone-frame::after` (the fake notch) whenever the app is full-bleed.
- Add `align-content: start` to `.app-content` so the hero never stretches.
- Make the collapsed `.brand-bar` background solid with blur before its title fades in (fixes the
  ghosting in §3.6).
- Global input floor: `input, textarea, select { font-size: max(16px, var(--text-input)); }`.

### 7.2 Today: block header — S
- **Now:** a card that holds a calendar icon, a "6-WEEK BLOCK" chip and an empty skeleton bar, then
  the "Next block starts" banner, then the Block 6 card with "PT", "Pinned block · Starts Mon 5 Oct"
  and "+". That's 3 boxes and about 230 px.
- **Proposed:** no box, about 72 px.
  - Line 1, caption: `Block 6 · Week 1 of 6 · PT`.
  - Line 2, 20 px title: `Hypertrophy Flat Pyramid II`, with a `›` chevron that opens the block details
    and "Change block" (bottom sheet, as the audit's P7 says).
  - Before the start date, line 1 reads `Block 6 · starts Mon 5 Oct` and replaces the separate banner.
- Information kept: block number, name, origin (PT), start date, details, change block.

### 7.3 Today: day selector — S–M
- **Now:** 2 × 3 grid, 104 × 71 px buttons, 9.3 px text that wraps, 133 px tall.
- **Proposed (recommended, option A):** one row of six equal 48 px buttons `D1 … D6`, about 52 px
  wide each on a 343 px line.
  - Each button shows the day number (15 px, 700) and a small progress arc or bar underneath
    (3/7 = partly filled, done = full).
  - Today's day gets a `--brand-soft` fill plus a dot. The selected day gets a 2 px `--nav-active`
    outline.
  - Below the row, the selected day is written in full as the section title: **Day 1 · Chest-Back A**
    (20 px) with `Chest & back · heavy · 3 of 7 done` (13 px) and a thin progress bar.
- **Option B:** a horizontally scrolling row of pills with the full names ("D1 Chest-Back A").
  - Readable, but only about 2.5 days fit on screen, so the user has to scroll to see which days
    are done.
- **Option C:** keep the 2 × 3 grid, but at 13 px with short names ("Chest-Back A") and 56 px height.
  - Least change, but still 120 px.
- Height: 133 px → about 52 px + the 48 px day title. The day name moves from the button into the title.

### 7.4 Today: exercise rows (collapsed) — M
- **Now:** every exercise is a bordered card (60–105 px) inside the day card.
- **Proposed:** one section (`--surface-1`, radius 16, 16 px padding) holds the day's exercises as
  **rows separated by hairlines** (`--divider`).
- Row layout, minimum 64 px:
  ```
  [A1]  Dumbbell Bench Press                     ›
        Incline 30° · 4 × 12 · rest 90 s
  ```
  - The code badge is a 28 px circle with 12 px text.
  - The name is 17 px / 600.
  - The meta line is 13 px `--muted`.
  - The whole row is the tap target (no separate 29 px "+").
- **Completed:** a ✓ replaces the badge, the name is at 70% opacity, and the meta line becomes the
  summary ("3 sets · top 5 kg"). The "✓ Done" pill goes away.
- Information kept: code, name, variant/angle, sets × reps, rest, done state, summary.

### 7.5 Today: superset group — S–M
- **Now:** a bordered tinted box with a "Superset" badge, a "✓ Done" pill, the instruction, then
  bordered child cards, then a bordered "SET LOG" box.
- **Proposed:** no box. A 3 px `--brand` **rail** on the left joins B1 and B2.
  - A small header row: `Superset · B1 + B2 · rest 90 s after the pair` (13 px).
  - The child rows are the same as §7.4.
  - The instruction "rest ~10 s between" appears once, in the header.
  - The superset chip and "Superset: back to back…" line inside each exercise are removed.
  - The combined set log (from #64) opens under the pair with the same table as §7.7.

### 7.6 Today: expanded exercise — M
- **Now:** chips row, technique sentence, Squeeze box, Posture tips box + Ask AI button, three
  SETS/REPS/REST tiles with "Start rest", then the collapsed Set log box, then the Progress box.
  890 px tall.
- **Proposed** (order follows the mid-set task). It expands inline in the same section:
  1. **Name** (20 px) + `Incline 30° · Straight sets · rest 90 s` (13 px). This replaces the 3 tiles
     and 2 chips.
  2. **Cue**, one line: `Squeeze — drive with your inner arms…` (15 px, with a 3 px amber left
     border instead of a box). Tap to read the rest.
  3. **Set table**, open immediately (§7.7). No "Set log +" tap.
  4. **Log exercise**: a full-width 52 px primary button, 16 px sentence case.
  5. **Plain link rows** (48 px, chevron): `Technique tips ›` · `History & progress ›` · `Ask AI ›`.
     Notes become an "Add note" link that expands a 17 px textarea.
- Rest: "Start rest" moves into the set table. Ticking a set starts the rest timer (already
  automatic since #109), and a small `Rest 90 s` link in the table footer starts it manually.
- Estimated height for 3 sets: about 520 px, down from 890.

### 7.7 Set log rows — M (compatible with audit P1 steppers)
- Column header once, 12 px muted sentence case: `Set   Previous   kg   Reps   ✓`.
- Rows are 52 px with a hairline between them and **no border per set**:
  ```
  1    12 × 22     [ 22 ]   [ 12 ]   ( ✓ )
  2    12 × 22     [ 22 ]   [ 12 ]   ( ✓ )
  ```
  - Set number: 15 px / 700.
  - Previous: 13 px muted. Tapping it copies the value in.
  - Inputs: 64–72 px wide, 48 px tall, 17 px text, centred.
  - ✓: a 44 px circle. A ticked row gets a `--brand-soft` tint.
- Drop sets add an indented sub-row. Pyramid targets show in the reps placeholder ("12", "10", "8").
- "Ready · 0 kg" for untouched sets becomes the placeholder (prefilled weight, or `—`).

### 7.8 Rest timer — S
- Keep the floating pill above the dock (approved Option 3), but let it **hug the dock**: the same
  228 px width, 8 px above it, and 48 px tall.
- When the timer runs, `.app-content.with-rest-timer` adds exactly that height to the bottom padding
  (it partly does today).
- Timer digits: 22 px tabular. Actions: `+15 s` and `Skip` as 44 px text buttons.

### 7.9 Progress — S
- **Now:** headline card, then 6 separate 74 px accordion cards with UPPERCASE titles and 44 px "+"
  circles.
- **Proposed:**
  - Keep the **headline** card ("This week: 1 of 6 sessions · 1 PR · in progress", 24 px) with the
    D1–D6 dots, labelled at 12 px.
  - The six sections become **one grouped list** of 56 px rows, each with a right-aligned summary and
    a chevron:
    - Suggestions · 3
    - Consistency · 1 of 6
    - Strength trend · +19%
    - Personal records · 1 new
    - Weekly sets by muscle
    - Block report card
  - An opened section expands inline under its row, with the chart at full section width.
  - The A / B / All toggle becomes a 36 px segmented control. The exercise picker is a full-width 48 px
    row.
- Height for six closed sections: 516 → 336 px. All information stays.

### 7.10 Exercises (lookup + exercise card) — S–M
- **Search:** 17 px input, 48 px tall. Region chips are 13 px text, 36 px tall, in one scrolling row
  (filters stay chips).
- **Exercise card:**
  - Name 24 px.
  - Muscles as text, not chips: `Chest · also Triceps, Front delts` (13 px).
  - The Squeeze cue uses the §7.6 one-liner.
  - "Last max 85 kg · Last volume 2,720 kg" becomes one stats row with 22 px numbers.
  - Posture tips and Ask AI become link rows.
- **Previous performance:** one line, `18 Jun · 4 sets · 8 × 85 kg each`, instead of four boxed chips.
- **Free log (Track it as you go):** uses the same set table as §7.7, so its 9.9 px / 36 px inputs
  and the 42 px "Remove" button per set go away. Remove becomes swipe-left or an overflow menu.

### 7.11 You — S
- With `align-content: start`, the hero no longer stretches.
- Demo mode and account items become a grouped list (48 px rows).

## 8. Impact / effort

| # | Change | Impact | Effort | Depends on |
|---|---|---|---|---|
| 1 | Full-bleed ≤ 500 px, hide fake notch, `align-content: start`, header ghost fix | High (Pro Max users get +40 px width, +88 px height) | S | — |
| 2 | 16 px input floor + `inputmode` | High (no iOS zoom mid-set) | S | — |
| 3 | Type + spacing tokens, sentence-case labels, 12 px minimum | High | S–M (token swap + replacing hard-coded rem values in about 120 rules) | — |
| 4 | Progress as one grouped list | Medium | S | — |
| 5 | Block header line + D1–D6 selector | High (first exercise visible without scrolling) | S–M | PO choice A/B/C |
| 6 | Flat exercise rows (Today) | High | M | — |
| 7 | Superset rail | Medium | S–M | #64 combined logging |
| 8 | Expanded exercise reorder + link rows | High | M | — |
| 9 | Set table (Previous · kg · reps · ✓) | Very high | M | Audit P1 (steppers/tick), prefill |
| 10 | Exercises card + free log on the same set table | Medium | M | #9 |
| 11 | Rest pill hugging the dock | Low–Medium | S | #109 |

Suggested order: 1 → 2 → 3 → 4 (one CSS-only PR or two), then 5 + 6 + 7 (Today structure), then
8 + 9 (exercise and set table, together with audit P1), then 10 and 11.

## 9. Risks and mitigations

- **"Flatter" can look plainer.** Keep the premium feel through the dark palette, the bold wordmark,
  the brand rail for supersets, large numbers and one accent colour. The mockups show this.
- **Bigger text means more scrolling** in some places. The flattening and the removed duplicates save
  more than the larger type adds (Today, the expanded exercise and Progress all get shorter).
- **Tests that query visible UPPERCASE text or class names** (e.g. "SET LOG") will need updating.
  Prefer role/name queries.
- **Dynamic Type.** Using px keeps today's look predictable. A later step can map the tokens to
  `rem` so iOS text-size settings scale them (Tech Lead decision).
- **iOS Capacitor build.** Check the safe areas and the 16 px input floor on a device.

## 10. How to measure success

- At 375 × 667 with the welcome card dismissed, **the first exercise row is fully visible** above the
  dock.
- **No text under 12 px** and **no input under 16 px**. QAer can check this with a DOM query.
- An expanded 3-set exercise fits in **one screen** (≤ 600 px) with the set table visible.
- At most **one bordered container** between the screen and any input.
- At 430 × 932 the app fills the viewport edge to edge.
- The PO's verdict on the mockups and then the build: "roomy, calm, easy mid-set".

## 11. Decisions for the PO

1. **Day selector:** A (D1–D6 buttons + full day name below, recommended), B (scrolling named pills)
   or C (keep the grid, bigger text)?
2. **Exercise list style:** flat rows inside one section (recommended), or keep a card per exercise
   but only one level deep?
3. **Base text size:** 15 px (recommended, a balance between density and readability), or 17 px like
   iOS default (roomier, more scrolling)?
4. **Expanded exercise order:** set table first, with technique tips, history and Ask AI as link rows
   underneath. Is it OK that the Squeeze cue shrinks to one line (tap to read more)?
5. **"Previous" column in the set table** (last session's weight × reps, like Hevy/Strong). Yes or
   no? It uses data the app already has (prefill).
6. **Fewer chips:** OK to turn descriptive chips (muscle, technique) into plain text and keep chips
   only for filters?

The Tech Lead will decide the implementation details (px vs rem tokens, breakpoints, component
structure). The PT has nothing to change here, because no fitness content changes.
