# Typography system: one compact type scale for GymStudio

- **Status:** proposal (UXer), not approved
- **Date:** 2026-10-18
- **Asked by:** Sebas (PO). He wants every font, including the capital-letter labels (KG, REPS, SERIE 1 DE 3, ÚLTIMA VEZ, HOY, PLAN DE 6 SEMANAS…), to be smooth and aligned, with one clear hierarchy, and he likes the "B · Compact" prototype.
- **Prototype:** [`2026-10-18-typography-system.html`](2026-10-18-typography-system.html). Phone at 390 px, EN/ES, three variants (Current, Compact, Compact + fewer capitals) on five screens (Today, Workout exercise, Workout · superset, Exercises search + sheet, Progress); superset has toggles for "✓ per exercise / Log round" and "side by side / two rows".
- **Builds on:** [`2026-10-18-workout-type-scale.html`](2026-10-18-workout-type-scale.html) (option B), [`2026-10-18-workout-mode-aligned.md`](2026-10-18-workout-mode-aligned.md) and [`2026-10-18-declutter-audit.md`](2026-10-18-declutter-audit.md).
- **Scope:** proposal and prototype only. No code, content or data changes.

## 1. Summary

The app has no type system. Across 16 screens and states I measured **33 different font sizes (8.6 to 34 px), 5 weights, 17 letter-spacings, 44 line-heights and 171 distinct text styles**. About 45 labels are in capitals, in 8 different capital styles. Workout mode feels heavy and big (cue 16 px bold, values 28 px, log button 16.8 px with wide tracking). The rest of the app is too small: most text is 12.2 px, and 24 kinds of text, including the Exercises body-part chips and most Progress details, are **8.6 px, below the 11 px floor** that Apple and Material set. The exercise name is never the strongest text on its card.

**Proposal:** one compact scale with **7 roles** (Title 28, Card title 22, Headline 17, Body 15, Caption 13, Label 11, Numeric 20). Use only three weights (400/600/700) and the iOS system font. **Allow capitals in one place only:** short section labels, in one style. Every other capital becomes sentence case: "Set 3 of 3", "kg", "Reps", "Last time", "Today", "6-week plan · 4 days/week". **Recommended variant: "Compact + fewer capitals".**

## 2. Audit (evidence from the app)

**Method.** I ran a local production build (`npm run build`, then `npx vite preview` through `.claude/skills/webapp-testing/scripts/with_server.py`) in `?demo=1` without signing in. I used Playwright Chromium at 390×844 in EN and ES. Screens covered: Today (collapsed + expanded block), Workout mode (single exercise, logger, set table, insight sheet, superset, Completed summary), rest dock, Exercises (list, search "squat"/"sentadilla", exercise sheet), Progress (Overview, Trends, Muscles, Consistency) and You. For every visible text node I read the computed `font-size`, `font-weight`, `letter-spacing`, `line-height`, `text-transform`, `font-family` and `font-variant-numeric`, plus element rectangles. That gave 4,430 samples.

### 2.1 Numbers

| Measure | Rendered | In `src/styles.css` |
|---|---|---|
| Distinct font sizes | **33** (8.64, 9.28, 9.92, 10.24, 10.4, 10.56, 10.88, 11.2, 11.52, 11.68, 11.84, 12, 12.16, 12.48, 12.8, 13.12, 13.6, 13.76, 14.08, 14.4, 15.2, 16, 16.8, 17.02, 17.6, 18.4, 19.2, 20.8, 21.6, 24, 27.2, 28.8, 34) | 329 `font-size` declarations, 56 distinct values (265 rem, 11 px, 2 clamp) |
| Weights | 5 (500, 600, 700, 800, 900) | — |
| Letter-spacing | 17 values (−1.36 px to +2.02 px) | 16 distinct values; `0.08em` ×16, `0.12em` on primary buttons |
| Line-heights | 44 values | body 1.45 everywhere, so small text gets loose leading and large text gets tight leading |
| Uppercase | 182 samples, 45 unique labels | 29 `text-transform: uppercase` rules, plus capitals typed straight into i18n strings (`workout.run.currentSet` = `SET {set} OF {total}` / `SERIE {set} DE {total}`, `src/i18n/sections/workout.ts:147, 551`) |
| Selectors defined more than once | 94 (e.g. `.training-block-name` at `styles.css:2401` and `:5220`, `.selected-day-name`, `.week-progress-label` ×2, `.planned-set-column-headers` ×2) | later rules override earlier ones, which is why sizes drift |
| Distinct sizes per screen | Today 17 · Workout 14 · Completed 22 · Exercises 11–14 · Progress 11–12 · You 13 | NN/g suggests about 3 sizes for a clear hierarchy |

### 2.2 Root causes

1. **The font is not the one we think.** `body { font-family: Inter, 'Segoe UI', sans-serif }` (`styles.css:53`), but Inter is never loaded (no `@font-face` and no font link in `index.html`). On an iPhone or Mac this falls back to generic `sans-serif` (Helvetica), not SF Pro, so the app does not feel iOS-native and renders differently on each device.
2. **The base sizes are tiny and inconsistent.** In the root tokens, `--font-body: 0.76rem` (12.16 px), `--font-section: 0.65rem` (10.4 px) and `--font-caption: 0.54rem` (**8.64 px**) (`styles.css:27-33`). `--font-caption` is used in 28 places, including `.region-chip` (`:1002`), `.chip` (`:1317`), `.technique-chip` (`:3081`) and `.pv3-caption` (`:7741`).
3. **Workout mode overrides everything** with larger one-off sizes (cue 16/700, name 17/500, value 28, log button 16.8/800 + 0.12em). Inside the exercise card the name (17 px, regular weight, grey) is weaker than the cue (16 px bold, white), the KG value (28 px) and the button. This matches Sebas's complaint that "everything competes".
4. **Tracking on buttons.** `.primary-button { font-size: .78rem; font-weight: 800; letter-spacing: .12em }` (`styles.css:1746-1756`) gives "Log set 3", "Back to Today", "Log it" and "Save goal" a spaced-out look. Small secondary buttons ("View or edit", "Finish") get 0.08em. Lowercase text should not be letter-spaced (Butterick).

### 2.3 Every label in capitals (EN / ES) and where it appears

| Label | Where | Current style |
|---|---|---|
| GYM STUDIO (wordmark) | All tabs, header + compact bar | 34 px / 800 and 12.8 px / 800 |
| TRAIN WITH INTENT / ENTRENA CON INTENCIÓN | All tabs, above wordmark | 9.9 px / 500 / +0.14em |
| 6-WEEK PLAN · 4 DAYS/WEEK / PLAN DE 6 SEMANAS · 4 DÍAS/SEMANA | Today, pill next to calendar | 9.3 px / 700 / +0.08em |
| SET 3 OF 3 / SERIE 3 DE 3 | Workout logger heading | 14.4 px / 700, capitals typed in the i18n string |
| KG, REPS | Workout logger field labels | 12.8 px / 700 / +0.06em |
| #, LAST TIME + date, TODAY / ÚLTIMA VEZ + fecha, HOY | Workout set-table header | 11.5 px / 700 / +0.06em; the date sits on a second line under LAST TIME only |
| SUPERSET / SUPERSERIE | Superset card, label above the tools | 11.5 px / 700 / +0.04em (the "Superset" chip on Today is 8.6 px *Capitalized*) |
| TODAY, LAST TIME, SQUEEZE, POSTURE TIPS / HOY, ÚLTIMA VEZ, APRIETA, CONSEJOS DE POSTURA | Insight (tips) sheet section headings | 12.8 px / 700 / +0.04em, rose |
| MAIN LIFTS · THIS BLOCK, SINCE THE LAST EQUIVALENT SESSION, CONSISTENCY · WEEKLY SETS BY MUSCLE, LAST 4 WEEKS VS PREVIOUS 4, STRENGTH TREND · MAIN LIFTS, BLOCK OVER BLOCK, ALL EXERCISES, WEEKLY SETS BY MUSCLE, CONSISTENCY (+ ES: EJERCICIOS PRINCIPALES · ESTE BLOQUE, DESDE LA ÚLTIMA SESIÓN EQUIVALENTE, …) | Progress card headings | 10.4 px / 700 / +0.08em, muted. Some are 5–6 words long. |
| EN / ES | Language toggle | 12 px / 700 (codes; fine) |

That makes 8 different capital styles (sizes 9.3 to 14.4 px and tracking 0 to 0.14em), and some of them are long phrases.

### 2.4 Alignment problems measured

1. **Three left edges on Today.** Page text starts at x=16, text inside the day card at x=29 (13 px padding, off the 4/8 grid) and the exercise names inside the nested exercise boxes at x=42. Workout mode adds a fourth edge: the logger content starts at x=44 while the card text starts at x=29.
2. **Set-table header rows have different heights.** "LAST TIME" carries the date on a second line (35 px tall) while "#" and "TODAY" are one line (17 px), all top-aligned. The header looks broken, and the values below don't sit on one rhythm with the headings.
3. **A tool label overflows its box.** "Technique" is 78 px wide inside a 77 px box (`scrollWidth > clientWidth`). "Técnica" fits only because the word is shorter.
4. **Block header baseline.** "Upper / Lower · 4 Days" is 13.8 px / 700 and "Week 4 of 6" next to it is 9.9 px / 600. They are centred, not baseline-aligned, so the small text floats.
5. **Duplicate title on Progress.** The header says "Progress" (16 px) and the card under it says "Progress" again (27 px). The screen title of other tabs ("Today", "Exercises", "You") is a 16 px line under a 34 px wordmark, so the brand outranks the screen.
6. **Superset names are smaller than their cue.** "C1 · Dumbbell Shoulder Press (Seated)" is 12.2 px, while the cue under it is 16 px bold.
7. **Timer digits jump.** `.workout-mode-elapsed` (no rule) and `.rest-timer-time` (`styles.css:1906`) have no `tabular-nums`, so "1:58 → 1:57" shifts width. The set table, stats and Progress numbers already use tabular numerals.
8. **Locale slip (not typography, but visible next to it).** In ES the Today done badge says "mejor 82.5 kg" with a decimal point, while workout mode says "82,5". I'm flagging it for the Tech Lead.

## 3. Best practices (external research, summarised)

- **Apple HIG, Typography / Dynamic Type** ([developer.apple.com/design/human-interface-guidelines/typography](https://developer.apple.com/design/human-interface-guidelines/typography)). The iOS default ("Large") sizes are Large Title 34, Title 1 28, Title 2 22, Title 3 20, Headline 17 semibold, Body 17, Callout 16, Subheadline 15, Footnote 13, Caption 1 12, Caption 2 11. 11 pt is the smallest default size. Avoid light weights at small sizes. Use the system font (SF Pro), whose tracking is tuned per size. On the web you reach it with `-apple-system, BlinkMacSystemFont`.
- **Material 3 type scale** ([m3.material.io/styles/typography/type-scale-tokens](https://m3.material.io/styles/typography/type-scale-tokens)). It has 15 roles in 5 families (display, headline, title, body, label) × 3 sizes, named as tokens (`--md-sys-typescale-body-medium-size`, … per [Material Web docs](https://github.com/material-components/material-web/blob/main/docs/theming/typography.md)). The small end matches HIG: body around 14–16, label small 11. The lesson for us is to name roles and reuse them rather than set sizes per component.
- **NN/g.** Use few sizes for a clear hierarchy ([Good Visual Design](https://www.nngroup.com/articles/good-visual-design/), [5 Principles of Visual Design](https://www.nngroup.com/articles/principles-visual-design/)). Keep defaults reasonably large, because acuity varies and declines with age ([Legibility, Readability, Comprehension](https://www.nngroup.com/articles/legibility-readability-comprehension/)). For **glanceable** reading, as with a phone on a bench between sets, bigger text and regular width help, and capitals helped single words at very small sizes. The article itself warns against using all-caps for longer text ([Typography for Glanceable Reading](https://www.nngroup.com/articles/glanceable-fonts/)). For GymStudio that means making the few things you glance at mid-set big (the values and the name), not putting them in capitals.
- **All caps.** Research generally finds mixed case faster to read for running text, and Nielsen's *Usability Engineering* puts the uppercase cost at about 10% (summarised at [Wikipedia: All caps](https://en.wikipedia.org/wiki/All_caps)). Accessibility guides note that capitals lose word-shape cues ([Carleton University](https://carleton.ca/webaccessibility/appropriate-use-of-lower-and-upper-case-letters/)). Practical rule: use capitals only for very short labels.
- **Tracking.** Add about 5–12% letter-spacing to capitals and none to lowercase ([Butterick, Practical Typography](https://practicaltypography.com/letterspacing.html)). So 0.06em is right for an 11 px capital label, and 0.12em on "Log set 3" is wrong.
- **Vercel Web Interface Guidelines** (vendored snapshot, see §8): use tabular numbers for number columns and comparisons, `text-wrap: balance`/`pretty` on headings, `…` rather than `...`, and preload any critical web font with `font-display: swap` (or don't use one).
- **Line height 1.2–1.5 and a 4/8 px grid** (HIG layout, Material 8 dp grid). Larger text gets tighter leading (1.2) and small text looser (1.35–1.4).

## 4. Proposal: the compact type scale (7 roles)

Base: the PO's favourite **B · Compact** (name 22 bold, tools 11 with the icon above, cue 14, values 22, log button 15 with no wide tracking, table 14), aligned to the nearest HIG step so it reads as native iOS. Two changes from B: Body moves 14 → 15 (HIG Subheadline; the cue and table read better mid-set), and Numeric moves 22 → 20 so the exercise name (22) is strictly the largest text on the card.

| # | Role | Size / line-height | Weight | Tracking | Colour | Case | Use |
|---|---|---|---|---|---|---|---|
| 1 | **Title** | 28 / 34 px | 700 | −0.02em | text | Sentence | Screen title: Today, Exercises, Progress, You; the "Finished · 8/8" Completed headline |
| 2 | **Card title** | 22 / 28 px | 700 | −0.01em | text | Exercise name (as written) | Exercise name on the workout exercise card; exercise sheet / insight sheet title |
| 3 | **Headline** | 17 / 22 px | 600 | −0.01em | text | Sentence | List and box items (exercise name on Today boxes and search results), section headings ("Day 1 · Upper A", "Exercise insights"), Progress card titles, block name |
| 4 | **Body** | 15 / 20 px | 400 (600 = *Body strong*) | 0 | text | Sentence | Paragraphs, cue text, set-table rows, notes. *Body strong* for **all buttons** ("Log set 3", "Log it"), emphasised values ("47.5 kg × 10"), "Set 3 of 3" |
| 5 | **Caption** | 13 / 18 px | 400 (600 for selected) | 0 | muted | Sentence | Meta lines (muscle · equipment), dates, helper text, table column headers, field labels (kg, Reps), tabs/segmented controls, chips, done badge, week labels |
| 6 | **Label** | 11 / 14 px | 600 | +0.06em when uppercase, else 0 | rose (section) or muted | **Uppercase only for section labels** | (a) Section label, the only capitals in the app; (b) word under a tool icon (Technique, Swap, Notes, Google) and the tiny "Superset" tag, sentence case |
| 7 | **Numeric** | 20 / 24 px | 700 | 0, `tabular-nums` | text | — | Stepper values (82.5, 8), stat tiles (3/24, 1 min), Progress numbers. Timers use Body strong + `tabular-nums` |

Rules:
- **Only three weights: 400, 600, 700.** Drop 500, 800 and 900. Bold (700) is reserved for Title, Card title and Numeric, which avoids the "heavy all-bold blocks" Sebas dislikes.
- **Font:** `-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Remove the unloaded `Inter`. The brand wordmark stays a logo, not a text role.
- **Minimum 11 px**, used only by Label. Running text never goes below 13.
- **Hierarchy guarantee:** on any card the exercise name is the largest text there. The screen Title (28) sits above every card (22 / 17).
- **Numbers:** `font-variant-numeric: tabular-nums` on every number that changes or sits in a column (set table, steppers, timers, stats, Progress).
- **Headings:** `text-wrap: balance` on Title, Card title and Headline, so long Spanish names ("Extensión de tríceps sobre la cabeza en polea") wrap evenly.

### 4.1 When capitals are allowed (the uppercase rule)

> **Capitals only for a section label:** a group label of **3 words or fewer** placed *above* a group of content, in the Label style (11 px / 600 / +0.06em, rose or muted). Never on buttons, values, units, table headers, badges, sentences or anything longer than 3 words. Capitals come from CSS (`text-transform`), never typed into i18n strings.
>
> Exempt: the GYM STUDIO wordmark (logo), language codes EN/ES, and set codes like C1/C2 and S1–S3.

| Current capitals | Becomes (EN / ES) | Role |
|---|---|---|
| SET 3 OF 3 / SERIE 3 DE 3 | Set 3 of 3 / Serie 3 de 3 (i18n string changes to sentence case) | Body strong |
| KG / REPS | kg / Reps (SI unit symbol is lowercase) | Caption |
| # · LAST TIME (date) · TODAY / ÚLTIMA VEZ (fecha) · HOY | Set · Last time · Today / Serie · Última vez · Hoy, one line; the date moves to the caption above the table ("Last time · Wed 14 Oct") | Caption |
| 6-WEEK PLAN · 4 DAYS/WEEK / PLAN DE 6 SEMANAS · 4 DÍAS/SEMANA | 6-week plan · 4 days/week / Plan de 6 semanas · 4 días/semana | Caption |
| TRAIN WITH INTENT / ENTRENA CON INTENCIÓN | Removed from working screens (kept for splash/marketing). PO decision. | — |
| SUPERSET / SUPERSERIE (in the card) | Superset / Superserie tag | Label (sentence) |
| MAIN LIFTS · THIS BLOCK, SINCE THE LAST EQUIVALENT SESSION, … (Progress card headings) | Main lifts · this block / Ejercicios principales · este bloque, sentence case | Headline |
| TODAY · LAST TIME · SQUEEZE · POSTURE TIPS (sheet sections) | **Stay in capitals.** They are short section labels: HOY · ÚLTIMA VEZ · APRIETA · CONSEJOS DE POSTURA | Label (uppercase) |
| Short Progress group labels like "CONSISTENCY", "ALL EXERCISES" | May stay as section labels if they sit *above* a list; otherwise Headline | Label / Headline |
| "Log set 3", "Back to Today", "View or edit" (tracked) | Same words, no extra tracking | Body strong |

Result: about 45 labels in capitals across 8 styles become about 6 section labels in one style.

### 4.2 Alignment rules

1. **One text edge per card.** Page gutter 16 px, card padding 16 px, and text inside a card always starts at the card padding. A nested panel (logger, cue, sheet section) is a tinted area whose *text* lines up with the card text. It does not add a second inset. On Today, drop the extra wrapper padding around the exercise boxes so names start at the same x as "Day 1 · Upper A" plus one card padding (two edges in total, 16 and 32, instead of 16/29/42).
2. **8 px grid.** Spacing values are 4, 8, 12, 16, 24 and 32 only. Replace 13, 14, 10 and 6 px paddings. Rows and buttons are at least 44 px high (HIG touch target).
3. **Label/value pairs.** In the logger the field label sits in a fixed 48 px column and is centred against the 44 px stepper (already correct, keep it). In inline pairs ("Week 4 of 6" next to the block name, "Just now" next to an insight title) align **baselines** (`align-items: baseline`), not centres.
4. **Tables.** One-line headers, bottom-aligned (`align-items: end`). Header text starts at the same x as its column values. Numbers use `tabular-nums`. The set number column is 24 px.
5. **Left-aligned text** everywhere except the Completed hero and numbers inside steppers and stat tiles.
6. **Icon-over-word tools** (from B). A 20 px icon above an 11 px word, centred, in a 52 px tall box, so no word can overflow ("Technique" / "Técnica").
7. **No duplicate titles.** Each tab shows its Title once. The wordmark lives in a slim top bar (Headline-size logo) with EN|ES and the sync dot.

### 4.3 Workout · superset: a compact, aligned round (PO priority, 2026-10-18)

**Evidence.** Sebas's phone screenshot (ES, "Día 6 · Piernas B", D1/D2) and the same screen in the demo (C1/C2), from `src/components/SupersetLogger.tsx`. His verdict: "está horrible".
1. Each exercise is a tall block of about 230 px. The kg stepper and reps stepper are stacked, and a lone ✓ sits below them (`.superset-workout-inputs` maps `['weight','reps']` vertically, then `.complete-set-button`).
2. The `#` and `Última vez` columns take about 45% of the width. The last-time cell is `date · value` and wraps to 2 lines ("jue 15 oct · / 30×12").
3. **Every** round is rendered open, with its own table header, including future rounds. The current round is titled with `workout.run.currentSet` ("SERIE 1 DE 4") while the others use `workout.round.label` ("Ronda 2"), so the same thing has two names, one of them in capitals.
4. The ES decimal shows "27.5". The stepper is `<input type="number" value={set[field]}>`, which always shows a point. The last-time text uses `formatNumber` and shows "32,5", so the two disagree on the same screen. Bug for the Tech Lead.
5. The approved instruction "Haz D1, descansa ~10 s, luego D2; descansa al final del par." is 8.6–10.6 px. An empty "Agrega una nota" textarea sits open above the round. In the demo, the names (12 px) are smaller than the cue (16 px bold), and each exercise repeats a "SUPERSERIE" label and a full tools row.

**Proposal (prototype screen "Workout · superset")**

```
┌ Superset  C1 + C2                       Round 2 of 3 ┐  Label tag · Headline · Caption (baseline)
│ Do C1, rest ~10 s, then C2; rest after the pair.     │  Caption 13 (approved text, shown once)
│ ✓ Round 1   C1 24×10 · C2 33.5×10                    │  done round = one line
│ [C1] Dumbbell Shoulder Press (Seated)             ›  │  Headline 17 (tap › = tips/technique sheet)
│      Last time 24×10 · Mon 12 Oct                    │  Caption, ONE line
│      ◎ Biceps toward ears, squeeze front delts       │  approved short cue, Caption rose
│ kg              Reps                                 │  Caption labels
│ [− 24 +]        [− 10 +]                     [✓]     │  44 px steppers, values 17 tabular, ✓ 44 px
│ Go to C2 · 9s                                        │  existing hand-off (approved ~10 s rule)
│ [C2] Cable Lat Pulldown (Wide Grip)               ›  │
│      Last time 33.5×10 · Mon 12 Oct                  │
│ [− 33.5 +]      [− 10 +]                     [✓]     │
│ ┄ Round 3   C1 24×10 · C2 33.5×10 ┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄  │  next round = one dashed line
│ [Notes]  [Swap]                                      │  notes closed until tapped
└──────────────────────────────────────────────────────┘
```

- **One block per exercise:** code badge + name (Headline 17/600), last time on **one** caption line, then kg | Reps side by side and **one ✓ per exercise** (recommended). This keeps the approved flow and the existing hand-off: tick C1 → "Go to C2 · 10s" → tick C2 → rest after the pair. The alternative in the prototype is one **"Log round 2"** button (new UI copy, EN/ES) under both exercises.
- **Consistent with the single logger:** the same stepper component, the same "kg"/"Reps" caption labels and the same tabular values. Values are 17 px (not 20) so nothing on the card outranks the exercise name. A prototype toggle also shows the "two rows (like single)" layout (kg row + Reps row, ✓ to the right). It is about 40 px taller per exercise.
- **Only the current round is open.** Done rounds collapse to "✓ Round 1 C1 24×10 · C2 33,5×10". The next round is a dashed one-line preview. Use one name for the thing: "Round 2 of 3" / "Ronda 2 de 3" (the existing key `workout.superset.roundOf`), not "SERIE 2 DE 3".
- **No table header** inside the round. The `#` and "Last time" columns go away because the code badge and the one-line caption replace them.
- **Notes and tools** sit in one row at the bottom, and the tips/technique sheet opens from the › on each name. No empty textarea. PO decision: is the per-exercise › enough, or does he want the 4-tool row per exercise back?
- **ES decimals:** show "27,5" in the stepper (display with `formatNumber`, input `inputmode="decimal"` that accepts a comma). The Tech Lead decides the implementation.
- Height in the prototype: the whole superset card (2 exercises, 3 rounds) fits in about one screen. Today one exercise of one round already takes about 230 px, and four rounds are open.

## 5. Token list for the Tech Lead (CSS custom properties)

```css
:root {
  --font-ui: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* role: size / line-height / weight / tracking */
  --type-title-size: 1.75rem;    --type-title-lh: 2.125rem;  --type-title-weight: 700;    --type-title-track: -0.02em;
  --type-card-size: 1.375rem;    --type-card-lh: 1.75rem;    --type-card-weight: 700;     --type-card-track: -0.01em;
  --type-headline-size: 1.0625rem; --type-headline-lh: 1.375rem; --type-headline-weight: 600; --type-headline-track: -0.01em;
  --type-body-size: 0.9375rem;   --type-body-lh: 1.25rem;    --type-body-weight: 400;     --type-body-strong-weight: 600;
  --type-caption-size: 0.8125rem; --type-caption-lh: 1.125rem; --type-caption-weight: 400;
  --type-label-size: 0.6875rem;  --type-label-lh: 0.875rem;  --type-label-weight: 600;    --type-label-caps-track: 0.06em;
  --type-num-size: 1.25rem;      --type-num-lh: 1.5rem;      --type-num-weight: 700;

  --text: #f3f3f1;          /* unchanged */
  --text-muted: #c8c7c4;    /* = current --muted */
  --text-section: #c99ca1;  /* = current --nav-active, section labels */

  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-6: 24px; --space-8: 32px;
}
/* one class per role; components use the class or the tokens, never a raw font-size */
.t-title    { font: var(--type-title-weight) var(--type-title-size)/var(--type-title-lh) var(--font-ui); letter-spacing: var(--type-title-track); text-wrap: balance; }
.t-card     { font: var(--type-card-weight) var(--type-card-size)/var(--type-card-lh) var(--font-ui); letter-spacing: var(--type-card-track); text-wrap: balance; }
.t-headline { font: var(--type-headline-weight) var(--type-headline-size)/var(--type-headline-lh) var(--font-ui); letter-spacing: var(--type-headline-track); text-wrap: balance; }
.t-body     { font: var(--type-body-weight) var(--type-body-size)/var(--type-body-lh) var(--font-ui); }
.t-body-strong { font-weight: var(--type-body-strong-weight); }
.t-caption  { font: var(--type-caption-weight) var(--type-caption-size)/var(--type-caption-lh) var(--font-ui); color: var(--text-muted); }
.t-label    { font: var(--type-label-weight) var(--type-label-size)/var(--type-label-lh) var(--font-ui); }
.t-section  { /* the ONLY uppercase style */ composes: t-label; text-transform: uppercase; letter-spacing: var(--type-label-caps-track); color: var(--text-section); }
.t-num      { font: var(--type-num-weight) var(--type-num-size)/var(--type-num-lh) var(--font-ui); font-variant-numeric: tabular-nums; }
```

(`composes` is pseudo-code. The Tech Lead picks plain duplication, a shared selector or utilities.) Sizes are in `rem` so a later Dynamic Type hookup on iOS (Capacitor) can scale the whole scale from the root. That is a Tech Lead decision.

Suggested guardrail (Tech Lead to decide): a CI check (stylelint `declaration-property-value-allowed-list`, or a small script) that rejects any `font-size`, `font-weight` or `letter-spacing` outside the tokens, and any new `text-transform: uppercase` outside `.t-section`.

## 6. Mapping: current class → new role (main screens)

| Screen | Current class (`src/styles.css` line) | Now (px / weight) | New role |
|---|---|---|---|
| All tabs | `.brand-wordmark` (:268) | 34 / 800 caps | Logo in slim top bar (17 px, 700); not a text role |
| All tabs | `.brand-tagline` (:261) | 9.9 / 500 caps +0.14em | Removed on working screens (PO decision) |
| All tabs | `.brand-header h1` (:277) / `.brand-bar-screen` | 16 / 600 | **Title** |
| Today | `.plan-badge` (:2068) | 9.3 / 700 caps | Caption (sentence) |
| Today | `.training-block-name` (:2401, :5220) | 13.8 / 700 | Headline |
| Today | `.training-block-status` (:2407, :5227) | 9.9 / 600 | Caption, baseline-aligned |
| Today | `.week-progress-head` span / strong | 12.8 / 500, 700 | Caption / Body strong |
| Today | `.week-progress-label` (:8527, :8578) | 11.5 / 500–700 | Caption (selected 600) |
| Today | `.selected-day-name` (:5287) | 14.4 / 700 | Headline |
| Today | `.day-focus-label` (:4766, :5293) | 10.2 / 500 | Caption |
| Today | `.planned-exercise-main-name` (:3162) | 17 / 500 grey | Headline (box) / **Card title** (workout card) |
| Today | `.planned-exercise-detail-name` | 12.2 / 500 | Caption |
| Today | `.done-badge` (:4743) | 12 / 700 | Caption (✓ Done in 600) |
| Today | `.technique-chip` "Superset" (:3081) | **8.6** / 700 | Label (sentence) |
| Today | superset instructions `p` | 10.6 / 500 | Caption |
| Today | `.secondary-button.small-button` (:3658) | 10.9 / 500 +0.08em | Body strong, no tracking |
| Workout | `.workout-mode-progress` (:7142, :7222) | 14.4 / 700 | Body strong (top bar; fits "Día 1 · Tren superior A · 1/8" on one line) |
| Workout | `.workout-mode-elapsed` (no rule) | 12.2 / 500 | Caption + `tabular-nums` |
| Workout | `.workout-tool span` (:9402) | 11.5 / 700, overflows | Label (sentence), icon above |
| Workout | `.cue-card-text` (:9738) | 16 / 700 | Body strong (B: 14 → 15) |
| Workout | `.workout-mode-current-set` (:8675) + i18n `SET {set} OF {total}` | 14.4 / 700 caps | Body strong, "Set 3 of 3" |
| Workout | `.workout-mode-big-field` label (:8689) | 12.8 / 700 caps | Caption ("kg", "Reps") |
| Workout | `.workout-mode-big-field .set-stepper input` (:8712) | 28 / 800 | **Numeric** 20 |
| Workout | `.workout-mode-log-set` (:8725) + `.primary-button` (:1746) | 16.8 / 800 +0.12em | Body strong, no tracking |
| Workout | `.planned-set-column-headers` (:3288, :5471) | 11.5 / 700 caps, 2-line | Caption, one line |
| Workout | `.set-table-*` rows | 16 / 500–700 | Body (today's logged value Body strong), tabular |
| Workout | `.workout-mode-plan-note strong` "SUPERSET" (:9441) | 11.5 / 700 caps | Label tag (sentence) |
| Workout | `.superset-compact-header` (:8636) C1/C2 names | 12.2 / 700 | Headline |
| Workout | `.superset-compact-instructions` (:9104) | **8.6** | Caption |
| Insight sheet | `.cue-sheet-header h3` (:9352) | 17.6 / 700 | Card title |
| Insight sheet | `.cue-sheet-section h4` (:9367) | 12.8 / 700 caps | **Section label** (the allowed capitals) |
| Insight sheet | list items / paragraphs | 12.2 / 500 | Body |
| Completed | `.workout-completed-header h2` (:8953) | 24 / 700 | Title |
| Completed | stat `strong` | 18.4 / 700 | Numeric |
| Exercises | `.region-chip` (:1002) | **8.6** / 700 | Caption (selected 600) |
| Exercises | `.find-list-heading` (:1146) | 13.6 / 700 | Section label ("RESULTS · 15") or Headline |
| Exercises | `.result-name` (:1078) | 12.2 / 700 | Headline |
| Exercises | `.result-meta` (:1218) | 11.5 / 500 | Caption |
| Exercises | `.find-last-time` (:1172) | 12.2 | Caption label + Body strong value |
| Exercises | sheet `.primary-button` / `.secondary-button` | 12.5 / 800 +0.12em, 12.2 / 500 | Body strong |
| Progress | `.pv3-page-heading h2` (:7733) | 27.2 / 700 (duplicate) | Title (shown once) |
| Progress | `.pv3-tabs button` (:7771) | 12.2 / 500 | Caption (active 600) |
| Progress | `.pv3-status-word` (:7815) | 16.8 / 700 | Headline |
| Progress | `.pv3-card h3` (:7797) | 10.4 / 700 caps | Headline (sentence) |
| Progress | `.pv3-lift-copy strong` (:7856) | 12.2 / 700 | Body strong |
| Progress | `.pv3-lift-copy small`, `.pv3-caption` (:7741) | **8.6** / 500 | Caption |
| Rest dock | `.rest-timer-time` (:1906) | 14.1 / 700, proportional | Body strong + `tabular-nums` |
| You | `.collapsible-card-header h2` | 16.8 / 700 | Headline |
| You | `.profile-choice`, `legend` | 11.7 / 700, 11.5 / 700 | Caption (selected 600) / Caption 600 |

## 7. Variants in the prototype and recommendation

| Variant | What it is | Pros | Cons |
|---|---|---|---|
| **Current** | Measured live values | — | 33 sizes, 8.6 px text, 8 capital styles |
| **Compact** | The 7-role scale everywhere, keeping today's capitals but with all of them in the single Label style | Smallest visual change; capitals at least match | Still about 45 capital labels: KG/REPS, SET 3 OF 3, table headers, Progress headings |
| **Compact + fewer capitals** (recommended) | Same scale; capitals only for short section labels; everything else sentence case | Calmest and most native; the name and numbers lead; easiest Spanish; fewer rules to keep consistent | Small copy change in i18n (`currentSet` string); PO must accept losing TRAIN WITH INTENT on working screens |

**Recommendation: Compact + fewer capitals**, with the compact superset round (§4.3) as the first piece of work. It keeps everything Sebas liked about B (compact boxes, icon-over-word tools, the big name, no spaced-out button text) and applies it to all tabs. It also removes the two things he flagged: the shouty capital notes and the uneven sizes.

## 8. Web Interface Guidelines check (Vercel skill)

- **Source:** `.claude/skills/web-design-guidelines/command.md`, official Vercel `web-interface-guidelines` commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`. The local snapshot was vendored on 2026-10-10 and audited on 2026-10-18.
- **Checksum:** `shasum -a 256` gives `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`. This matches `docs/governance/skill-checksums.json` and the SKILL.md. **Verified.** I treated the rules as reference material only.
- Findings (Typography section, `command.md:62-69`; Performance, `command.md:91`):
  - `src/styles.css:53`: `Inter` is declared but never loaded (no `@font-face`, no `<link rel="preload" as="font">`), so the text falls back to an uncontrolled font. Fix: use the system stack (recommended) or load and preload the font with `font-display: swap`.
  - `src/styles.css:1906` (`.rest-timer-time`) and `.workout-mode-elapsed` (no rule; `src/components/WorkoutPlan.tsx:3411`): counting timers lack `font-variant-numeric: tabular-nums` (rule: tabular numbers for comparisons).
  - `src/styles.css`: `text-wrap: balance` is used once (`:7570`). The exercise-name, sheet and screen headings don't use it, which leaves widows in long ES names. Fix: apply it on the Title, Card title and Headline roles.
  - `src/i18n/sections/app.ts:25, 241`: search placeholders end in `...` ("Bench press, squat, row...", "Press de banca, sentadilla, remo..."). The rule asks for `…`.
  - `src/styles.css:1746-1756` (`.primary-button` letter-spacing 0.12em on mixed-case text): not a Vercel rule, but against typographic practice (Butterick). It is listed with the other fixes in §4.
- This is a typography-focused check, not a full audit. It doesn't claim compliance with the other guideline sections.

## 9. Impact, effort, dependencies, risks, measurement

| Item | Impact | Effort | Notes |
|---|---|---|---|
| A. Tokens + system font + remove 8.6 px sizes (root vars, `body`) | High | S | Global, low risk; fixes the tiny text everywhere at once |
| S. **Superset round redesign** (§4.3: one block per exercise, kg/Reps side by side, one ✓, only current round open, Round x of y, ES decimal fix) | **High** (PO: "está horrible") | M | `SupersetLogger.tsx` render + CSS; keeps the tick / hand-off logic; Tech Lead fixes the decimal input; QAer superset flow at 375 px |
| B. Workout mode on the scale (name 22, cue 15, values 20, button 15, table 15, tools icon-over-word, sentence-case labels) | High | S | Mostly done in prototype B; `currentSet` i18n string to sentence case in EN and ES |
| C. Uppercase rule (remove 23 of 29 uppercase rules; one `.t-section`) | High | S | Copy-only plus CSS; check ES strings |
| D. Today + Exercises on the scale, one text edge per card, 8 px grid | Medium–High | M | Touches card paddings; QAer at 375/390 px |
| E. Progress on the scale (headings sentence case, captions 13) | Medium | M | Largest CSS area (`pv3-*`) |
| F. Guardrail lint for font values | Medium (prevents regression) | S | Tech Lead decision |
| G. Tabular timers, `text-wrap: balance`, `…` | Low–Medium | S | Quick wins |

- **Dependencies:** no PT content. All text in the prototype is existing approved app text. The ES `currentSet` copy change is UI wording, not fitness content. Tech Lead designs the token rollout and decides on the lint. Cost: none.
- **Risks:** (1) larger body text (12 → 15 outside workout mode) makes lists longer. Mitigation: the compact roles, plus removing the tagline and duplicate titles, recover the space. (2) Long Spanish names wrap to 2–3 lines at 22 px. Mitigation: `text-wrap: balance` and line-height 1.27; the prototype shows "Extensión de tríceps…". (3) Cascade conflicts from 94 duplicated selectors. Mitigation: migrate screen by screen and delete the old rules in the same PR.
- **Measure success:** (1) distinct rendered font sizes **≤ 8** (from 33) and capital labels **≤ 6** (from about 45), measured with the same Playwright computed-style script; (2) zero text below 11 px; (3) the exercise name is the largest text on the workout card (automated check: max font-size inside `.planned-exercise-card` belongs to the name); (4) Sebas's acceptance on his phone; (5) QAer design-consistency section passes at 375 px in EN and ES.

## 10. Decisions for the PO

1. **Pick the variant:** "Compact + fewer capitals" (recommended) or "Compact".
2. **Brand header:** OK to replace the big GYM STUDIO wordmark + TRAIN WITH INTENT with a slim top bar and a 28 px screen title ("Today", "Progress")?
3. **Units:** OK to show "kg" (lowercase, the official symbol) and "Reps" instead of KG / REPS?
4. **Superset round:** one ✓ per exercise (recommended; keeps the C1 → ~10 s → C2 hand-off) or one "Log round" button? Fields side by side (recommended) or two rows like the single logger? Is the › per exercise (opens tips/technique) enough instead of a full tools row per exercise?
5. **Body size outside workout mode** goes from about 12 to 15 px. Text gets more readable and lists slightly longer. OK?
