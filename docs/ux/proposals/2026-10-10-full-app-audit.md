# Full app audit — 2026-10-10

Status: proposal (needs PO approval) · Author: UXer · Scope: `main` @ 4048a8c, local `?demo=1` at 375 px, EN + ES.

Guideline source: Vercel Web Interface Guidelines, vendored `.claude/skills/web-design-guidelines/command.md`,
commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`, SHA-256 verified locally 2026-10-10
(`d246b026…0234`, matches). Rules treated as reference only.

Method note: the browser pane rendered screenshots unreadably small, so screen evidence comes from
DOM measurements (page text, computed font sizes, hit-target sizes) taken in the running app.
PO constraints respected: no re-proposal of the reverted Today header; text must not look
squeezed; boxes equal size; visible but simple.

## 1. Guideline findings (verified in code)

### P1
- `src/styles.css` (48 rules at 0.56–0.68rem, e.g. :261, :312, :875, :989, :1425, :1504) - most text is below 12 px. Live Today screen at 375 px: 48 of 75 visible text elements under 12 px; "PT" badge 8.96 px, block label 9.28 px, "Week 4 of 6" 9.92 px. Root cause of "squeezed" feeling.
- `src/components/SwipeToDelete.tsx:27` - Delete button is `tabIndex={-1}` until swiped, so the action is gesture-only (doc comment at :8 says keyboard users get it via focus; they do not). Needs a tap/keyboard alternative (e.g. long-press menu or visible trash like Progress uses).
- `src/styles.css:431` - `outline: none` on account inputs; replacement is `:focus` (:436), not `:focus-visible`. Only 3 `:focus-visible` rules in the whole stylesheet (:2958, :3559, :6234) — most buttons/chips have no visible keyboard focus.

### P2
- `src/components/WorkoutPlan.tsx:2629`, `:3602`; `src/screens/ProgressScreen.tsx:802` - backdrop `<div onClick>` without `role="presentation"` (others at :2130, :2397, :3591 have it). Fine to keep as backdrop but mark consistently; Escape must close each sheet.
- `src/styles.css` (no `overscroll-behavior` anywhere) - sheets/dialogs (custom plan, swap, session summary, AI help) scroll-chain into the page on iOS. Add `overscroll-behavior: contain`.
- `src/components/WorkoutPlan.tsx:2654`, `:2697` - `autoFocus` inside the custom-plan sheet opens the iOS keyboard on sheet open, covering half the sheet. Avoid on mobile.
- `index.html:1-13` - no `<meta name="theme-color">` and no `color-scheme: dark` (dark-only app): iOS status bar/scrollbars/native inputs render light-mode chrome.
- Only `src/screens/ProgressScreen.tsx:479` uses `Intl`; volumes render as raw numbers ("2720 kg" seen in Exercises). Use `Intl.NumberFormat(language)` → "2,720" / "2.720".
- `src/styles.css:3258` only - `touch-action: manipulation` is applied to one component; set it on `button, a, input` globally (double-tap delay on the +/− steppers).

### P3
- `src/styles.css` (only :6970, :7010) - `tabular-nums` missing on set tables, kg/reps columns, counters (`0/8`, `0/3 rounds`), rest timer; digits jitter as values change.
- No `text-wrap: balance` on headings (e.g. "Day 1 · Upper A", exercise names) — widows on 2-line names.
- `src/App.tsx:393` - header shows "GYM STUDIO" + page title twice in the DOM/reading order (visible brand block + hidden duplicate); screen readers hear the title twice. Verify only one is exposed.
- Exercise thumbnails "See … on Gymvisual" are 30 px tall hit targets (measured 185×30, 115×30) — below 44 px.

Checked and passing: no `transition: all`; zoom not blocked; inputs 16 px (no iOS zoom), `inputMode` set on numeric fields; login has `autoComplete`; delete on Progress has confirm + 5–8 s undo; reduced-motion handled in 4 places; safe-area insets used; no horizontal overflow at 375 px; no icon buttons without labels on Today.

## 2. Top 10 proposals (ranked by impact ÷ effort)

| # | Proposal | Impact | Effort | Needs |
|---|---|---|---|---|
| 1 | Type scale floor | High | S | PO (look) |
| 2 | Focus + touch polish | Med | S | — |
| 3 | Guest Profile: one clear "sign in" card | High | S | PO |
| 4 | Swipe-delete with tap alternative | Med | S | — |
| 5 | Number formatting + tabular digits | Med | S | — |
| 6 | Sheets behave like native sheets | Med | S | — |
| 7 | Workout mode "next set" focus | High | M | PO, PT (rest cues) |
| 8 | Equal-size day/stat tiles system | Med | M | PO |
| 9 | Progress loading/empty states | Med | M | Tech Lead |
| 10 | AI coach "why this weight" inline | High | L | PO, PT, Tech Lead (cost/provider) |

1. **Type scale floor.** Problem: half the Today screen is 9–11 px; this is what reads as "squeezed". Evidence: P1 finding above. Change: 4-step scale only — 12 / 14 / 16 / 20+ px; nothing under 12 px; uppercase labels 12 px with letter-spacing instead of shrinking. Where text no longer fits, drop the secondary line rather than shrink it ("visible but simple").
2. **Focus + touch polish.** Global `:focus-visible` ring using the brand accent, `touch-action: manipulation` on controls, `-webkit-tap-highlight-color` set. Invisible to Sebas day to day, removes tap delay on steppers.
3. **Guest Profile.** Problem: signed-out "You" tab shows the full goal form, plan and measurements forms, all disabled, each with its own "Sign in to save" line (3 repeats). Change: one card at top ("Sign in to save your goal, plan and measurements" + button), forms collapsed below as a preview.
4. **Swipe-delete alternative.** Make the row's delete reachable without swipe (trash icon like Progress `ProgressScreen.tsx:337`, same confirm + undo). Keeps one delete pattern app-wide.
5. **Numbers.** `Intl.NumberFormat` for volumes/kg per language; tabular digits on all numeric columns, counters and timer.
6. **Sheets.** `overscroll-behavior: contain`, no autoFocus on open, Escape/backdrop closes all, consistent `role="presentation"` backdrop.
7. **Workout mode "next set" focus.** Mid-session the screen lists every exercise with equal weight. Highlight the current exercise/set, auto-scroll to it after logging, collapse finished ones to one line ("Bench ✓ 4×8 85 kg"). Benchmark: Strong/Hevy keep the active set in view and start the rest timer on ✓ ([Hevy](https://www.hevyapp.com/features/), [Strong](https://www.strong.app/)). Rest durations from approved block data only.
8. **Equal-size tiles.** One tile component (fixed height, same padding, label 12 px, value 16 px) reused for day chips (D1–D4), Last max / Last volume, Progress stats. Directly answers "boxes should be equal size" without redesigning the reverted header layout.
9. **Progress states.** Progress showed only "Loading progress…" on first open in demo. Add skeleton tiles matching final layout and a friendly empty state with one next action ("Log your first set on Today").
10. **AI "why" inline.** The trainer engine already decides loads; add a one-tap "Why?" under a recommended weight that shows the engine's reason in plain language (LLM explains, engine decides — per approved AI Trainer plan). Grounded in history + approved rules, no medical advice, user can override. Provider/cost is a Tech Lead decision.

## 3. Quick wins — one Copilot PR (CSS/markup only, no data model)
- Raise all `font-size` < 0.75rem in `src/styles.css` to 0.75rem (then visual QA at 375 px).
- Global `:focus-visible` outline; replace `.account-form input:focus` with `:focus-visible`.
- `touch-action: manipulation` + `-webkit-tap-highlight-color: transparent` on `button, a, input, summary`.
- `overscroll-behavior: contain` on all sheet/dialog containers.
- `font-variant-numeric: tabular-nums` on set tables, counters, rest timer.
- `text-wrap: balance` on h1–h3 and exercise names.
- `<meta name="theme-color" content="<app bg>">` and `:root { color-scheme: dark }`.
- Remove `autoFocus` at `WorkoutPlan.tsx:2654`, `:2697`.
- Add `role="presentation"` to backdrops at `WorkoutPlan.tsx:2629`, `:3602`, `ProgressScreen.tsx:802`.
- Exercise image link min-height 44 px.

## 4. Decisions for Sebas
1. **Bigger text, less of it?** OK to set 12 px as the smallest text everywhere, even if a few secondary lines (e.g. dates, method names) get hidden behind a tap?
2. **Signed-out "You" tab:** show one "Sign in" card instead of three greyed-out forms?
3. **Workout mode:** should the app jump to the next set after you tick one, and shrink finished exercises to one line?
4. **Equal tiles:** OK to use one standard tile size for day chips and stats across Today, Exercises and Progress?
5. **AI "Why?" button:** want it next to recommended weights? (Tech Lead will cost the AI provider before building.)

## Measuring success
Text under 12 px = 0 (DOM check at 375 px); QAer week flow passes with no "squeezed" notes; taps to log a set unchanged or fewer; PO acceptance on phone.

## Approved scope (PO, 2026-10-10)
- YES: decision 1 (12 px minimum, 12/14/16/20 scale), 2 (single "Sign in" card on signed-out You), 3 (workout mode jumps to next set, finished exercises collapse to one line), 4 (one equal-size tile for day chips and stats).
- YES quick wins: #2 focus/tap polish, #4 tap-to-delete with confirm + undo, #5 locale number formatting + tabular digits, #6 native-like sheets (no autoFocus keyboard, contained scroll, consistent backdrops).
- NO: #10 AI "Why?" (PO doesn't miss the trainer card).
- Gate: PO reviews the before/after prototype `docs/ux/proposals/2026-10-10-full-app-before-after.html` before any issue is written. Measured at 375 px: Before smallest text 8.64 px, After 12.00 px (EN and ES).

## PO update (2026-10-10)
After seeing the before/after prototype: **keep the current font sizes** (no 12 px minimum / type-scale change). Everything else in the approved scope stands.
