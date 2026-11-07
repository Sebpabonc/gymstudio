# Type and size system (one look on every screen)

- Date: 2026-11-07 · Author: UXer · Status: **approved by PO 2026-11-07** (Tech Lead implements directly)
- PO words: "the font is not consistent", "boxes don't have the same width and height", "not aligned";
  addition: "Simplify the insights part: a lot of stuff, few real insights."
- Evidence: computed styles measured at 375 px on `localhost:5173` (`?demo=new` and `?demo=1`), plus `src/styles.css`.
- Already done today, not repeated: first-run CTAs 48 px, centred answer cards, account secondary links 15/700.

## Root cause (fix this first, most of the rest disappears)

The app runs **two type systems**. The base is the legacy `--font-body: 0.76rem` (12.16 px, `styles.css:29`,
applied on `body` at `styles.css:73-79`). The newer `--type-*` scale (15 px body, `styles.css:36-61`) only
reaches screens through scoped overrides: workout mode (`:10462`), Find (`:10836`), Progress (`:10881`),
You/account (`:10914`). Anything outside those scopes is 12 px: **Today, first run, the welcome card, the
AI sheet, login back links**. That is why moving between tabs feels like moving between apps.

**Fix:** make the `body` rule use the type tokens (`font: var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui)`),
point `--font-body` at `var(--type-body-size)` and `--font-caption`/`--font-section` at caption/label, and then delete the
scoped `:is(...)` blocks one by one as each screen is checked. Also remove the comment-rule at `:10411` that
says "Today keeps its existing type sizes": the PO decision of 2026-11-07 replaces it.

## 1. Type scale (6 roles, all existing tokens)

| Role | Token | Size / line-height | Weight | Tracking | Use |
|---|---|---|---|---|---|
| Screen title | `--type-title-*` | 28 / 34 | 700 | -0.02em | the one `h1` per tab (Today, Exercises, Progress, You, first run) |
| Focus title | `--type-card-*` | 22 / 28 | 700 | -0.01em | the single thing on screen: first-run question, workout-mode exercise name, sheet header |
| Card title | `--type-headline-*` | 17 / 22 | 600 | -0.01em | every card/list title: exercise names on Today and Find, collapsible headers, Progress card titles |
| Body | `--type-body-*` | 15 / 20 | **500** (change token from 400: 500 is what users see today on the 15 px screens; 400 reads thin on dark) | 0 | text, inputs (16 px for iOS zoom, keep `styles.css:113-117`), list rows |
| Caption / label | `--type-caption-*`, `--type-label-*` | 13 / 18; caps label 12 / 14 | 400 / 600 | 0; caps 0.06em | meta lines, hints, chips, tab-bar text; uppercase only for section labels (`.t-section`) |
| Button | new `--type-button-*` = body size | 15 / 20 | 700 | **0**, no uppercase | every button and button-styled link |

Numbers keep `--type-num-*` (20 / 24 / 700, tabular). Allowed weights: 400, 500, 600, 700 (drop 800 except the
wordmark; drop 650 in `WorkoutLogging.css:53-54`).

## 2. Box and control sizes (add as tokens on `:root`)

| Token | Value | Applies to |
|---|---|---|
| `--control-h` | 48 px | primary button, secondary button when stacked with a primary, text inputs, search field |
| `--control-h-inline` | 44 px | inline secondary/small buttons, chips, segmented tabs, icon buttons (44x44 circle) |
| `--hit-min` | 44 px | every tappable thing; smaller visuals get padding or a `::after` hit area |
| `--radius-control` | 12 px | buttons, inputs, nested boxes' controls |
| `--radius-card` / `--pad-card` | 20 px / 16 px | every top-level card (`.card`, `.pv3-card`, day plan, training block, AI sheet body) |
| `--radius-inner` / `--pad-inner` | 14 px / 12 px | boxes inside a card (exercise rows, set table, cue box, "why this weight") |
| `--choice-h` | 56 px min, radius 16 | first-run answer cards and any full-width choice row |
| pill | radius 999 | chips, region filters, language toggle |
| `--gap-stack` / `--gap-in-card` / `--gap-cards` | 8 / 12 / 16 px | between stacked controls / between items inside a card / between cards |

Primary buttons are full width inside cards; secondary stacked under a primary is full width and the same height.

## 3. Inconsistencies found, ranked by visibility

1. **Two body sizes (12 vs 15 px).** See root cause. `styles.css:29`, `:73-79`, scoped `:10462`, `:10836`, `:10881`, `:10914`.
2. **Screen title 16 px on Today, 28 px elsewhere.** `.app-shell:not(.active-tab-today) .brand-header h1` `:10455`.
   Fix: drop `:not(.active-tab-today)` (also catches first run "Your plan", measured 16/600). Same for `.brand-tagline` `:10450`.
3. **Primary button text is a different font style.** `.primary-button` `:2173-2183` = 12.48 px / 800 / 0.12em tracking,
   next to secondary at 15/700/0. Heights vary: 48 (first run), 44 (`.profile-data-save`, AI "Sign in"), "Got it" on
   `.welcome-card` is 155x44, not full width. Fix: button role + `min-height: var(--control-h)`; `.welcome-card .primary-button { width: 100% }`.
4. **Exercise name has three sizes.** Today `.planned-exercise-main-name` `:3584-3596` = `calc(var(--font-body)*1.4)` = 17.02 px/500;
   Find `.result-name` 17/600; workout mode `.effortless-name` is **15 px** although `WorkoutLogging.css:8-14` asks for 22 px,
   because `.plan-card.workout-mode-active :is(... h2 ...)` `:10462` wins. Fix: Today and Find use card-title (17/600);
   add `.plan-card.workout-mode-active .effortless-name` with the focus-title tokens (or drop `h2` from `:10462`).
5. **Card titles in five sizes.** First run `.first-run .card h2` (no rule, 12.16/700) vs `h3` "Train safely" 15/700 (`:723`);
   `.welcome-card h2` 16 px (`:913`); `.account-screen h2` 1.2rem (`:460`, measured 16.8) vs collapsible headers 17/600 (`:10929`);
   `.selected-day-name` 14.4 px (`:5754`); `.training-block-name` 13.76 px (`:5687`). Fix: all card-title role.
6. **Choice and chip text 12 px.** `.profile-choice` `:1133` (You: goal/days/level chips), `.toggle-button`/`.expand-toggle`
   `:1859-1872` (12/700/0.04em), `.small-button` `:4080` (12 px, 0.08em), `.help-ai-tabs button` `:4955`, `.help-ai-chip` `:5026`
   (12 px **and 36 px tall**), `.plan-badge` `:2495` (12/700/0.08em, 36 px), `.region-chip` 13 px `:1377`. Fix: chips and badges
   caption 13/600, tracking 0, height `--control-h-inline`; first-run answer cards body 15/600 (sub-line caption).
7. **Card padding and radius differ per screen.** `.card` 14/12 r22 (`:1344`), `.pv3-card` 14/12 r20 (`:8283`), day plan 16 r20,
   `.training-block-card` 12 r20, collapsed exercise card 12/14 r14 (`:10420`), `.account-screen` 18 (`:417`). Fix: `--pad-card` 16
   and `--radius-card` 20 on every top-level card; nested boxes `--pad-inner`/`--radius-inner`. Text edges then line up at 16 px.
8. **Inputs: four heights, three radii, two weights.** `.account-form input` 44/r10 (`:518`), You date input 45/400 and number/textarea 700,
   `.search-input` 52/r12 (`:1412`), `.help-ai-composer textarea` 44/r14 (`:5098`), `.chat-input-row input` r10 (`:1961`).
   Fix: 48 px, r12, 16 px/500 for all.
9. **Touch targets below 44 px.** `.week-progress-back` "This week" is 78x23 (`min-height: 0` at `:9168-9172`); `.text-button` 32 (`:4593`);
   `.help-ai-chip` 36. Fix: visual can stay compact, hit area 44 via padding or `::after { inset: -11px 0 }`.
10. **AI chat sheet text sizes.** `.help-ai-message` 0.8rem (`:5054`), `.help-ai-hint` and `.help-ai-error` 0.76rem (`:5015`, `:5124`),
    `.chat-reply` 0.8rem (`:1979`), sign-in text 12.16 px. Fix: messages body 15/20; hint, error and footnote caption 13.
11. **Login screen.** `.account-back`/`.forgot-password` 0.76rem (`:467-479`), `.account-mode-tabs button` 0.76rem (`:490`),
    `.account-label` 12/700 (`:512`). Fix: back/forgot = button role; tabs = button role at 44; labels caption 13/600.
12. **Letter-spacing noise.** Global `body` -0.01em plus tracked buttons (above). Fix: 0 for body and buttons; tracking only via tokens.

Order to implement: 1, 2, 3 (one PR, biggest visible change), then 4-6, then 7-12. Check each screen at 375 px in EN and ES (Spanish strings are ~20 % longer: chips must wrap, not clip).

## 4. Progress: fewer things, real insights

**Problem (measured, `?demo=1`):** Overview is ~2,240 px tall (about three phone screens) and repeats itself. Each lift row in
`renderOverview` (`src/screens/ProgressScreen.tsx:817-869`) can show up to six lines: verdict, "Best set: A → B", "Best set this week …
same strength as last week", kg/week, sessions-to-unlock, set count, plus a sparkline and a scale footnote. Contradictions appear
("Improving" next to "same strength as last week"). A good, actionable signal (W2 "All sets reached 10 reps at 105 kg" = ready to add
weight) is buried in a "Worth a look" list mixed with problems. For a new user the status card says
"Fewer than two main lifts have enough data …" plus a methodology sentence (`progress.v3.status.buildingReason` / `.explainer`,
`src/i18n/sections/progressV3.ts:17-18`) and every lift says "Not enough data yet" with a flat dotted sparkline.

**Keep two real insights on Overview** (both already computed, no new data or rules):
1. **"Your lifts"**: one line per main lift = name + verdict word + the single most useful number (the `rateText` kg/week when there is a
   verdict, else the `weeklyBest` line). Tap opens the existing detail. Drop from the row: `evidenceLine`, set count, sessions-to-unlock,
   `pv3-worth-tag`, and the sparkline (keep the chart in the detail view). Drop the `pv3-caption` sparkline note (`:868`).
2. **"Next session"**: the existing watch list (`watches`, from `src/progress/comparison.ts:129-188`), top 3, reworded as actions,
   W2 first ("Ready to add weight"), then W1/W3. Remove the three counters (`pv3-summary-counts`, `:873-877`).

**Cut or move:** the status card's explainer `small` (`:814`) → detail/help only; the combined "Consistency · Muscles" card (`:883-905`)
→ one line "Last 4 weeks: X % of planned days · N-week streak" under the status word, muscles and overload stay on their own tabs.
Trends (`:924-979`) shows four chips with "Previous: —" plus three footnotes: hide chips whose previous value is "—" and keep one footnote.
Muscles and Consistency: keep, but one caption each (today two-three `pv3-caption` lines at `:1033-1035`).

**Empty state (fewer than 2 lifts with a verdict, or no complete week):** one card, no verdict words, no sparklines:
```
+----------------------------------------+
| Building your baseline                 |  card title
| 3 of 4 sessions logged for your lifts. |  body (reuse progress.v3.unlock.sessions)
| Progress appears after your 4th.       |  caption
| [ This week: best set 10 kg x 8 ]      |  weeklyBest soFar, if any
+----------------------------------------+
```
New EN/ES strings need the Tech Lead (both dictionaries); wording is product copy, not fitness content.
Measure: Overview height at 375 px from ~2,240 px to under ~900 px with demo data; no lift row longer than two lines.

## Impact / effort

| Item | Impact | Effort |
|---|---|---|
| Root cause + screen title + button role (1-3) | High | S-M (one PR, wide visual diff) |
| Exercise names, card titles, chips (4-6) | High | S |
| Card/inputs/touch targets (7-9) | Medium | S-M |
| AI sheet, login, tracking (10-12) | Medium | S |
| Progress simplification (section 4) | High | M (one component, i18n keys) |

Risks: the base-size change touches every screen; review with screenshots of all tabs and the workout flow before merge.
Success: at 375 px every screen uses only the 6 roles above; no visible text below 12 px; every tappable element ≥ 44 px;
primary/secondary buttons identical in height and font on every screen.

## Web Interface Guidelines audit

Source: vendored `.claude/skills/web-design-guidelines/command.md`, Vercel commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`,
SHA-256 `d246b026…0234` **verified** on 2026-11-07 (matches the skill's documented hash). Relevant results: touch targets fail at
`styles.css:9168-9172` and `:4593`; inputs at 16 px avoid iOS zoom (`:113-117`, pass); `tabular-nums` used on set values and Progress
numbers (pass); `text-wrap: balance` on title tokens (pass, extend to card titles); `touch-action: manipulation` only on some controls
(`:3829`, `:8026`). The rules are reference material only.
