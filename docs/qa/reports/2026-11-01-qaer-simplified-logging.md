# QAer report — simplified workout logging (PR #382) — 2026-11-01

Build: PR #382 head `99cd355a6b614a020757e74be890195a6212e8b8` (worktree `/Users/sebpabon/wtqa`), local `vite preview` on port 4193 · `?demo=1`, no sign-in · Headless Chromium (Playwright), touch and mobile emulation · Viewports: 375×812, 390×844, 375×667 (fold check), 768×1024, 1280×800 · EN and ES.

Screenshots: `/private/tmp/claude-501/-Users-sebpabon-workout-tracker/21728d60-bc91-431a-a2db-310179711718/scratchpad/qa/shots/` (outside the repo; temporary). Filenames below are relative to that folder.

## Verdict: NOT ready

One blocker and four majors. Three of the majors are on the normal path of every workout (Completed, Today, rest ending). Core saving is solid: every Done saved exactly what the button showed, including through reloads, Undo and ES decimals.

## How it was tested (limits)

- **Clock:** the test browser clock was set to Monday 2 Nov 2026 10:00 so a training day is "today", and rest and strip countdowns were fast-forwarded. Entries for the current week were dropped from `gym-studio.demo.history` in the test browser only. The real clock (Saturday 31 Oct) was also checked once.
- **Pyramids and drop sets:** the demo plan (`tpl-4d-upper-lower-gym`) has none. To test them, the browser intercepted that template file and served the approved days of "Size · Straight Sets, Stretch Focus" from `blocks.json`. Nothing in the repo changed, but this is a test setup, not a stock demo path.
- **Weights in recommendations** build on generated demo history, not real history, so odd values such as 27 kg dumbbells (25 + 2 in the seed) say little.
- **Not a device:** Chromium emulation only. Safe areas, the keyboard and native features were not exercised.

## Summary

| Area | Result | Notes |
|---|---|---|
| Health | ✅ | `npm test` 997 passed, 1 skipped; both validators OK; build OK; PR CI `verify` green; no console errors or warnings in any run |
| 1. Full day with Done only | ❌ | Saving correct; double-tap logs an extra superset set (B1); Completed broken (M1) |
| 2. Rest pop-up | ⚠️ | Contents and controls good; does not close or move on at zero (M3) |
| 3. Trend by set | ⚠️ | On every card, preference kept; open chart causes M1 and M2 |
| 4. Today view-only | ❌ | No logging controls, but expanded cards overflow (M2); Swap dead in Workout mode (M4) |
| 5. Trainer week flow | ✅ | No 0 kg, paired day sane, counters correct (see Passed) |
| 6. New-user clarity and design | ⚠️ | Minors below; no page-level horizontal scroll, but content is clipped (M1, M2) |
| Exercises, Progress smoke | ✅ | Search, Create your exercise and Progress work |

Blocker: 1 · Major: 4 · Minor: 13

## Blocker

### B1 [P1] Double-tap on a superset's Done logs a second set the user never confirmed
- **Where:** Workout mode, first exercise of a superset (C1). 375 px, EN. Reproduced with mouse double-click and with two touch taps 120 ms apart.
- **Steps:** 1. Open exercise 3 (Dumbbell Shoulder Press, superset with Cable Lat Pulldown). 2. Double-tap "Done · 26 kg × 8" near the middle of the button.
- **Expected:** One set saved on C1, and the card moves to C2 with the 10 s strip. The spec says logging a set the user did not confirm must never happen.
- **Actual:** Both are saved: `dumbbell-shoulder-press` 26×8 and `lat-pulldown` 35×8. The strip is skipped and the full rest pop-up opens. C2's Done lands under the same finger: C1's button is at y 686–750, C2's at y 658–722. There is no guard against a second tap.
- **Why blocker:** a false set enters history and trainer evidence. Undo works if the user notices, but the pop-up gives little reason to. A double-tap on a single exercise is safe (one set saved) because the pop-up covers the button.
- **Screenshot:** `s4-dbl.png`

## Major

### M1 [P2] Completed screen: Back to Today and Undo sit under the tab bar, and content is clipped — regression
- **Where:** Completed, after a full day and after Finish early. 375 and 390 px, EN and ES layout.
- **Steps:** 1. Finish a day with Trend by set open (the default for a new user). 2. Read the screen. 3. Scroll to the end and tap the middle of "Back to Today". 4. Try Undo at the bottom.
- **Expected:** Everything readable, Back to Today returns to Today, Undo tappable (5 s).
- **Actual:**
  - The tab bar is visible on Completed and covers both buttons (`elementFromPoint` hits the nav).
  - **Tapping the middle of Back to Today opens Progress** (375 and 390). With the Trend closed, only about 58 px on the left edge of the button is free. With it open, the label itself is off-centre and off-screen.
  - **Undo cannot be tapped:** it is at y 743–787, behind the nav at y 740–800. It only worked when clicked by script, and then restored the last set correctly.
  - With Trend open, the content is 521 px wide on a 375 px screen. "Completed ✓" is off-centre, the third metric box is cut, and insight lines are cut mid-sentence. Closing the Trend fixes the width only.
  - The Today tab does nothing here, as Today is already the active tab.
- **Compared with live:** on the live app's Finish-early path at 375 px, Back to Today is not covered (y 692, tappable). 768 and 1280 px have no overflow.
- **Screenshots:** `t3-completed-top.png`, `t3c-completed-bottom.png`, `t2-completed-closed.png`, `live-completed.png`

### M2 [P2] Today: an expanded exercise card overflows the phone screen and its collapse button is off-screen — regression
- **Where:** Today, any expanded card with Trend open. 375 and 390 px. Fine at 768 and 1280 px.
- **Steps:** 1. Tap "+" on Barbell Bench Press.
- **Expected:** Card fits; "−" can be tapped to collapse.
- **Actual:**
  - The card contents run to x≈528 inside a card ending at x≈342. **The "−" is at x=484, out of reach**, so the card cannot be collapsed. Live has it at x=297.
  - Next-target text, the squeeze cue, the chart and the Progress row are cut off. The last history bars cannot be seen. Inner padding is gone.
  - Delete rows in Progress also extend past the screen (the delete control's right edge is x=472).
  - Closing the Trend inside Workout mode, or on the card, restores the width.
- **Made worse by:** on returning from Workout mode, **all exercise cards open by themselves** (8 of 8 at partial and after completing). A reload collapses them. The page is about 4000 px of clipped content.
- **Screenshots:** `v1-expanded.png`, `v3b.png`, `v6-live-expanded.png`

### M3 [P2] Rest reaching zero does not close or move on
- **Where:** Rest pop-up and pinned bar. 375 px, EN. Observed in real time for 10 s after zero, and again on the last set of an exercise.
- **Steps:** 1. Tap Done. 2. Let the countdown reach zero without touching anything.
- **Expected (spec §5):** The card turns green and says "Go", shows what is next, then closes after 3 s with the next set ready. After an exercise's last set, it moves on when rest ends.
- **Actual:** The text changes to "Go", but the card keeps its colour (`rgb(24, 23, 25)`) and stays open indefinitely, still offering +15s. Nothing moves until "Start next set now". The hidden bar likewise stays on "Go". Nothing is logged at zero, which is correct.
- **Note:** the proposal's 0-tap rest becomes 1 tap per set. The Tech Lead and PO should confirm whether this was changed on purpose.
- **Screenshots:** `r7-go.png`, `r7b-go-last.png`, `r5-bar-after.png`

### M4 [P2] Swap in Workout mode does nothing — also on live
- **Where:** Workout mode, Swap tool. 375 px.
- **Steps:** 1. Start a workout. 2. Tap Swap on an exercise with no sets logged.
- **Expected:** The swap sheet opens.
- **Actual:** No visible response. The sheet is in the page but hidden (`.exercise-swap-backdrop` is `display: none` under `.plan-card.workout-mode-active`). **The live app behaves the same**, so this is not new. It matters more now that logging happens only in Workout mode. Swap from an expanded Today card works, and the swapped exercise logs correctly ("Enter weight" until a weight is typed, then saved).
- **Screenshots:** `x1-swap.png`, `x3-live-swap.png`

## Minor

| # | Finding | Where | Expected → Actual |
|---|---|---|---|
| m1 | Fix a logged set shows values not saved | Fix, 375 px | Clear the weight or type 0 reps: the field shows blank/0, while the set stays 90.5×6. After Close, the current set's button can read "Enter weight" until reload (`c3-fix-empty.png`, `c5-closed.png`) |
| m2 | Decimal reps accepted | Reps field | Typing 7.5 saves `reps: 7.5`. Whole numbers expected. 999 kg × 999 reps is also accepted with no warning |
| m3 | Rest disappears on return | Today → Continue during rest | Pill shows 2:28 on Today, but on returning to the workout neither pop-up nor bar shows. A reload during rest also drops the countdown (the set stays saved) |
| m4 | Tap outside does not hide the pop-up | Rest pop-up | Spec: tap Hide or outside. Only Hide works |
| m5 | Pop-up lacks spec elements | Rest pop-up | No progress bar and no once-per-session "When time runs out…" hint |
| m6 | Superset jargon and mixed signals | C1/C2 cards | "Now C2 · 10 s": a new user does not know "C2". C1's card also shows "Rest 0:10", which reads like a rest, plus a separate "Superset" label |
| m7 | Insight text contradicts itself (proposal finding 8, still present) | Pop-up, Completed | 85×6 ×3 vs 82.5×8 ×3 says "Some sets up, some down — Set 1: +2.5 kg · Set 2: +2.5 kg". "Lower" appears beside only "Set 1: +1.5 kg" |
| m8 | "today" on a next-session note | Completed day, Today card | Under "Next (Wed): 85 kg × 10" it says "so today goes up to 85 kg" |
| m9 | "Techniq/ue" breaks mid-word | 4-tool row, 375 px | Whole word expected; fits only once Swap goes away after the first set (`a1-start.png`). ES "Técnica" fits |
| m10 | Pinned bar polish | Hidden rest | Long names cut the next set's values ("Next: Plate-Loaded T-Bar Row (Chest…", `c9-hidden-after-last.png`). Bar floats about 77 px above the screen bottom with an empty gap. Controls are not trapped: all scroll clear |
| m11 | Drop-set Done below the fold | Drop set, 375×812 | Button starts at y 815, so each set needs a scroll (`p3-drop.png`). The main and drop steppers also share the same aria-labels |
| m12 | Type scale and small details | Workout mode | Off-scale: steppers 21.6 px, Trend and Notes 12.16 px, weight 500, countdown weight 750. Two carets on "▼ Trend by set ▾". Selected chip's number is low contrast. Today's chart label "A" crosses the dashed box, whose right edge is clipped |
| m13 | Targets under 44 px | Various | Delete-log Undo 32 px, Create-exercise chips 36 px, week arrows 32×32. Not checked whether these predate this PR. Workout mode and the pop-up have none under 44 px |

## Passed checks

**Logging and saving**
- Full days with Done only at 375 px EN and 390 px ES: stock demo (24 sets) and the real block with a reverse pyramid, superset and drop set (21 sets). Each Done added exactly one set in `localStorage`, equal to the button's values.
- Pyramid 24×14, 26×12, 27×10 and reverse pyramid 75.5×8, 73×10, 67.5×12 keep per-set targets, and a change on one set does not carry.
- Straight sets: weight carries up and down to later sets with "Applied to the next sets"; logged sets do not change; reps do not carry up.
- Drop set: one Done saves main + `drop`; main weight change carries and recalculates the drop (24 → 17.5); drop reps 0 saves no `drop`.
- 0 reps, empty or 0 weight: Done is disabled; "Enter weight" shows; nothing saved. No "Log exercise" button, no per-set table, no RIR prompt anywhere, and no "reserve"/"tank" text on Progress. New sets checked have no `rir`.
- "New weight: check your reps" shows on a raised load with an exact target (T-bar) and not on a range (T113 path).

**Reload and Undo**
- Reload mid-exercise, during rest and mid-superset: sets kept. Continue resumes at the right set, including C2 after C1, and C1 set 2 after a full round.
- Undo from pop-up, bar and strip removes the right set and returns to it. Undoing an entry's only set removes the entry. Undo on C2 returns to C2.
- Fix a logged set saves at once, starts no new rest, and survives reload. Finish early keeps what was logged.

**Rest and supersets**
- Pop-up shows what was logged, what is next (next exercise after a last set) and the exercise's rest: 2:30, then 2:00 / 1:00 per exercise. +15 s applies to the current rest only. Hide + Open work. Done works while a rest is hidden and restarts rest for the new set.
- Strip: thin dashed line, counts 10 → 0, disappears without a pop-up, Done still ready, nothing logged. Full rest after C2 only. C1 twice without C2: no jump, full rest (T149). Completed appears on its own with no timer after the last set.
- Trend on each card incl. superset cards and Completed; closed preference carries across cards, reload and Completed.

**Today and trainer flow**
- Today has no inputs; "+" only expands. Start → Continue → Completed + View or edit states are correct. Swap on Today works; log deletion works from Progress with confirmation and Undo.
- Week flow at 375 px: logged Upper A, opened Upper B the same day (bench 85×10, "Last time: 85×6·6·6"), counters 8/8, 0/8 and "1 of 4 days done" stay correct and Day 1 stays completed. Surveyed all days of both plans (over 60 exercises): no 0 kg, no blank. Cable/light loads and supersets gave sane values. Invariant tests pass in `npm test`.

**Language and layout**
- ES: "Hecho · 27,5 kg × 13", typed `27,5` and `28.5` both save correctly as a number, Spanish rest and strip copy, no English found in ES Completed.
- `document.scrollWidth` equals the viewport everywhere (no page scroll), and 768 / 1280 px layouts are fine, including Completed. Focus does not jump into an input after Done.
- Exercises: search and "Create your exercise" work (created, shown as "Yours"). Progress: no NaN or undefined.

## Not tested

- Real-history replay (AI Trainer checklist item 3): needs the PO's exported entries.
- Rest fallback to Profile (T135), since the rest setting is not visible in demo mode; so the new Profile text was not seen either.
- Bodyweight button (T123), deload prefill (T122), myo-rep hint (T153–T154), Technique and Notes tool contents, and sync with a signed-in account.

## Known open with Copilot (not re-reported)

Decimal drop-weight entry, resumed Completed summary, downward rep caps, permanent "everything is saved" line, "Continue · 0 of 8" wording, missing unit tests.

## Needs a real iPhone

- Notification permission prompt: timing, wording, and behaviour if refused.
- End-of-rest alert in foreground and locked: haptic, sound, and local notification at the right moment.
- Live Activity and Dynamic Island: "Rest", next set, "Go", in EN and ES; none for the 10 s strip.
- Lock screen and backgrounding: timer accuracy on return, and whether the pop-up state is correct.
- Double-tap (B1) on a real touchscreen, and Safari/WKWebView double-tap handling.
- Tab bar and pinned bar against the safe area; the numeric keyboard (comma/decimal, reps field); Done reachability with the keyboard open.
