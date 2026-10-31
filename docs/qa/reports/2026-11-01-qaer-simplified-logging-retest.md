# QAer retest — simplified workout logging (PR #382)

## Retest — 2026-11-01

Build: PR #382 head `7b456ee466abf207090431d82637a7146362c2ec` (checkout `/Users/sebpabon/wt382`, equal to the PR head), `npm run build` + `vite preview` on port 4194 via `with_server.py`. App code is the same as `31a094f` (the prefill fix); the two later commits change only tests and the replay script. Previous report: `2026-11-01-qaer-simplified-logging.md`, tested at `99cd355`.

Browser: headless Chromium (Playwright) with touch and mobile emulation, fresh context per run, no sign-in. Viewports: 375×812 and 390×844 (main), plus 393×852, 402×874, 430×932, 360×780, 375×667, 768×1024, 1280×800 for the Completed layout. EN and ES.

Screenshots: `/private/tmp/claude-501/-Users-sebpabon-workout-tracker/21728d60-bc91-431a-a2db-310179711718/scratchpad/qa2/shots/` (outside the repo, temporary). Filenames below are relative to that folder.

## Verdict: NOT ready

The blocker is fixed and the prefill fix works, but two majors remain, both quick to reproduce:

- **R1:** M1 is only partly fixed. On a short Completed screen, Back to Today can still be under the tab bar or under Undo. A tap on it can **undo the logged set** or open Progress.
- **R2:** a new regression from the m1 fix. In Fix a logged set, clearing a field and typing appends the digits, so `85` becomes `8570` kg and `6` becomes `65` reps, saved at once.

Blocker: 0 · Major: 2 (R1, R2) · Minor: 2 new (R3, R4), plus older minors still open.

## Health

| Check | Result |
|---|---|
| `npm test` at `7b456ee` | 1056 passed, 89 files |
| `npm run build` | OK |
| `validate-catalogue.py`, `validate-blocks.py` | OK |
| PR CI `verify` | pass |
| Console errors or page errors | None in any full-day or workout run (stock demo EN and ES, served plan EN and ES, guest weeks 1, 5, 6) |

## Items from the first run

| Item | Result | Evidence |
|---|---|---|
| **B1** Double-tap on superset Done | **PASS** | See below |
| **M1** Completed: Back to Today and Undo | **PARTIAL, FAIL on short screens** | Normal case fixed; see R1 |
| **M2** Today cards | **PASS** | See below |
| **M3** Rest reaching zero | **PASS** | See below |
| **M4** Swap in Workout mode | **PASS** | See below |
| **m1** Fix-a-logged-set display | **PASS for the display, new bug** | Shown value now equals saved value; see R2 |

### B1: pass
- At both 375 and 390, on C1 (Dumbbell Shoulder Press): mouse double-click, two Playwright touch taps 120 ms apart, two raw CDP touch taps 120 ms apart, and three taps 150 ms apart each saved **exactly one set** (`26 × 8` on C1). The card moved to C2 with the 10 s strip and no pop-up.
- The guard does not swallow a legitimate tap. C1 then C2 with a real gap of 660, 692, 729, 782, 907 and 1082 ms: both saved, then the 2:00 rest.
- A tap at 295 or 495 ms is ignored with no feedback, as designed. Tapping again after 600 ms saves it.
- Moving to the next exercise and tapping Done about 730 ms or more after "Start next set now" saved. Shorter gaps there were not measured.
- Screenshots: `b1-dbl-375.png`, `b1-touch-375.png`, `b1-dbl-390.png`, `b1-touch-390.png`.

### M1: normal case fixed
With Trend open after a full day at 375 and 390 (EN and ES):
- No clipped content: nothing extends past the screen. Trend is open on all 8 exercises.
- `elementFromPoint` hits Back to Today (y 608–660 at 375, 640–692 at 390) and Undo (y 679–723, 711–755).
- A real touch tap on Undo removes the last set and returns to it. A real touch tap on Back to Today goes to Today, which then offers View or edit.
- Screenshots: `m1-375-None-bottom.png`, `m1-375-None-top.png`, `m1-390-es-bottom.png`.

The short-screen case fails; see R1.

### M2: pass
- Each of the 8 cards expanded with Trend open at 375 and 390: no content past the screen, and "−" is at x 281–325 (375) and x 296–340 (390) and tappable. The only element reported past the edge is the Help and AI pulse ring (right edge 376–378 at 375 px), a decoration that causes no page scroll.
- The card with one expanded (T-bar row) stays the only expanded one after returning from a partial workout, and again after a second return. After a completed day, all stay collapsed.
- Log rows inside the card's Progress section: the delete control is at x 270–314 (375), x 285–329 (390) and tappable. No overflow.
- Screenshots: `m2-exp-375.png`, `m2-card-375.png`, `m2-after-partial.png`, `m2-after-complete.png`, `m2-del-375.png`.

### M3: pass
Observed in real time after fast-forwarding to the last 2 seconds:
- The card turns green (`rgb(22, 36, 27)`, border `rgb(127, 197, 143)`) and says "Go" (ES "Ya"), with what is next. It closes about 2.9 s later (timed by polling every 500 ms).
- Next set ready ("Set 2 of 3", Done · 85 kg × 6); nothing logged by the timer.
- After an exercise's last set it moves to the next exercise, and Done works there.
- The hidden bar also goes green and then closes.
- +15s during "Go" returns to a countdown and the card stays open. Returning after 10 minutes finds no pop-up, next set ready, nothing logged.
- Screenshots: `m3-go-2.png`, `m3-after.png`, `m3-moved.png`, `m3-bar-go.png`, `m3-es.png`.

### M4: pass
- Swap opens a visible sheet at 375 and 390 (EN and ES), and its buttons are tappable.
- "Just today": the card becomes Dumbbell Bench Press, "Enter weight" until a weight is typed, then saves under `dumbbell-bench-press`. Today then lists the swapped exercise.
- Cancel closes the sheet and leaves the exercise unchanged. "Always" also swaps.
- Screenshots: `m4-sheet-375.png`, `m4-after-375.png`, `m4-after-390.png`.

### m1: pass for the display
Clearing the weight, typing 0, clearing the reps, typing 0 reps and typing 7.5 reps all leave the field on the saved value, and the set is unchanged. Tap and type directly works (`82.5`, `5`), the stepper works, ES `82,5` saves as 82.5. The way this was fixed causes R2.

## Added check: increase_reps

Plan served by interception, history seeded in the test browser. The engine's action was read by calling `recommend()` directly with the same inputs (`vite-node`), since the app does not show it during a workout. Run both with and without a raised `target` stored on last session's entries.

| Exercise, target | Last session | Engine says | Untouched Done saved |
|---|---|---|---|
| Barbell Bench Press, 8-12 | 60 × 9, 9, 9 | `increase_reps` `within_range`, 10-11 | **60 × 9, 9, 9** |
| Cable Lat Pulldown, 6-8 (T112) | 37.5 × 7, 7, 7 | `increase_reps` `within_range`, 8-9 | **37.5 × 7, 7, 7** |
| Cable Face Pull, 12 (T118) | 10 × 13, 13, 13 | `increase_reps` `light_load_add_reps`, 14-15 | **10 × 13, 13, 13** |
| Push-Up, 10-15 | 0 × 12, 12, 12 | `increase_reps` `bodyweight_add_reps`, 13-14 | **12, 12, 12** |

**PASS**: last session's reps are saved, not the raised number, at 375 EN. The first run without a stored `target` also passed at 390 ES.

Note for the PT: a session with rising reps (20 × 8, 9) prefills 8, 8, while the card says "Last time: 20 kg × 9" on set 2. This looks like the cap in T130, but T130's case is a lower-than-prefill log. Worth a look.

## What the first run left out

| Check | Result | Evidence |
|---|---|---|
| T134 exercise rest wins over Profile | **PASS** | Bench `rest_seconds` 150 with Profile 150 or 60: card "Rest 2:30" |
| T135 Profile fallback | **PASS in Workout mode** | Exercise served with no `rest_seconds`: Profile 90, 150, 60 give card and pop-up 1:30, 2:30, 1:00. Today cards show no rest label, so "out of Workout mode" had nothing to compare |
| T123 Bodyweight | **PASS with R3** | Push-Up and Dip: "Done · 12 reps", "✓ Logged · 12", saved weight 0 |
| T122 Deload prefill | **PASS** | Week 6, Shoulders & Arms B: Smith press last 40 × 12 prefills 40 × 10; half the sets (2 of 3 or 4); same loads; the deload note shows |
| T153 Myo hint | **PASS** | Week 5: EZ-Bar Preacher Curl and Reverse Pec Deck Fly show "Finish the last-set extra…" on set 4 of 4 only; one main set saved per Done, no mini rows. EN and ES (`Termina el extra…`) |
| T154 No hint in week 6 or week 1 | **PASS** | Week 6 and week 1: not shown on the same exercises |
| Full day with Done only | **PASS** | 24 of 24 sets at 375 EN and 390 ES, each tap added exactly one set, no console errors. Also a 19-set served plan and guest days |
| AI consent sheet, demo | **PASS** | Watched with a page observer through full days: it never appeared. Help and AI is hidden in Workout mode. Outside it, Help says "Sign in to use AI" with no sheet. No AI requests |
| AI consent sheet, guest | **PASS** | Never appeared in three guest workouts, no `functions/v1` requests. The Profile AI toggle was not found on the demo You screen; the guest You screen was not checked |

Also rechecked from the first report:
- **m2:** 7.5 reps now disables Done (the label still reads "Done · 85 kg × 7.5"). No upper limit remains: 8570 kg was accepted.
- **m3:** returning to the workout during rest now brings back the pop-up. Reload during rest was not rechecked.
- **m4:** tapping outside hides the pop-up.
- **m6:** the strip now names the exercise ("Now Cable Lat Pulldown (Wide Grip) · 10 s").
- **m12:** the duplicate caret is gone. Chart label "A" still crosses the dashed box.
- **Still present:** m7 ("Some sets up, some down — Set 1: +2.5 kg · Set 2: +2.5 kg", `m1-375-None-bottom.png`) and m5 (no progress bar).
- **m9:** "Technique" no longer breaks mid-word, but its text touches the button edges (`b-en-9.png`).
- Not rechecked: m8, m10, m11, m13.

## New findings

### R1 [P2] Completed: on a short screen, Back to Today sits under the tab bar or under Undo, and a tap can undo the set
Remainder of M1.

- **When:** a short Completed screen, for example Finish early after sets on one exercise. With Trend closed at phone widths, with Trend open at 768 px. With 4 sets across two exercises, or a full day, the button starts off-screen and scrolling to the end leaves it clear.
- **Steps (phone):** 1. Close Trend by set (or have it closed from before). 2. Start workout, tap Done once, then Start next set now. 3. Finish → Finish now. 4. Without scrolling, tap the middle of Back to Today.
- **Expected:** returns to Today, and the logged set stays.
- **Actual (real touch tap at the button's centre, in the default scroll position):**

| Viewport | Trend | Element at the button's centre | Result of the tap |
|---|---|---|---|
| 393×852 | Closed | Undo | **Logged set removed**, back in Workout mode |
| 402×874 | Closed | Undo | **Logged set removed**, back in Workout mode |
| 375×812 | Closed | Tab bar | **Progress opens**; same after the Undo toast has gone |
| 390×844 | Closed | Undo toast background | Nothing happens for the 5 s of the toast, then it works |
| 360×780, 430×932 | Closed | Back to Today | Works |
| 768×1024 | Open | Undo | **Logged set removed** |
| 1280×800 | Closed | Undo | **Logged set removed** |

- **Cause seen:** the Undo toast and tab bar are fixed, while the button scrolls beneath them. The screen can scroll about 92–144 px further, which uncovers the button, but nothing suggests it.
- **Why P2, not P1:** the set can be logged again and the user lands visibly back in the workout, but the tap does the opposite of what the button says. The Tech Lead may want to raise it. Real iPhone heights differ from these emulated ones because of the safe area and browser bars, so which device hits which row needs a device check.
- **Screenshots:** `q-closed-375.png`, `q-393-false.png`, `q-402-false.png`, `q-768.png`, `q-1280.png`, `u-early-closed-390.png`.

### R2 [P2] Fix a logged set: clearing a field and typing appends digits, and saves it at once — regression
Introduced by the m1 fix, which refuses an empty value.

- **Where:** Workout mode → Fix a logged set. 375 px; the same code path applies to other widths. The app's select-on-focus was exercised in Chromium only.
- **Steps:** 1. Log a set (85 × 6). 2. Open Fix a logged set. 3. Tap the reps field (the value is selected), press delete, type `5`. 4. Tap the weight field, press delete, type `70`.
- **Expected:** the field empties and reps become 5 and weight 70.
- **Actual:** delete does nothing visible and clears the selection, with the caret at the end. Typing appends: reps **65**, weight **8570**. Both saved immediately ("Set 1 · 8,570×65"). The chart scale is thrown off, and in an earlier run a mistyped weight carried to the next set's Done button and stayed after reload.
- **Also:** backspacing "85" stops at "8": the last digit cannot be removed.
- **Works:** tapping and typing straight over the selected value.
- **Suggestion for the Tech Lead:** allow an empty field while editing and save only a valid value; restore on blur.
- **Screenshots:** `fix-reps-65.png`, `fix-weight-8570.png`.

### R3 [P3] Bodyweight exercises still show 0 kg outside the button
- **Where:** Workout mode and Today, Push-Up and Dip, 375 px.
- **Expected (T123):** "0 kg never shown".
- **Actual:** the Done button and "Logged" line are right, but the card shows "Last time: 0 kg × 12", a "kg 0" field, and the pop-up shows "Next: Dip · set 1 · 0×10". The Today card shows "Last time: 0×12·12·12" and the trend chart labels 0.
- **Note:** the kg field may be intentional for adding load. The PT and Tech Lead should confirm how far T123 reaches.
- **Screenshot:** `b-en-9.png`.

### R4 [P3] Double-tap on a single exercise's Done hides the rest pop-up at once
- **Steps:** on a non-superset exercise, tap Done twice 120 ms apart, 375 px.
- **Expected:** one set, pop-up visible.
- **Actual:** one set saved (correct), but the second tap lands on the backdrop below the pop-up (Done at y 628, pop-up ends at y 587) and hides it into the bar. Rest keeps running. Side effect of the new tap-outside behaviour.
- **Screenshot:** `b1-single-dbl.png`.

## Test setup and limits

- **Clock:** browser clock set to Monday 2 Nov 2026 10:00, rest fast-forwarded, current-week entries removed from `gym-studio.demo.history` in the test browser only.
- **Served plan:** for increase_reps, rest fallback, bodyweight and the myo hint in demo, the browser intercepted `tpl-4d-upper-lower-gym` and served a test day built for these cases, with seeded history. Not a stock demo path, and nothing in the repo changed.
- **Profile rest value:** the setting is not on the demo You screen, so it was set in `localStorage`. The control itself was not exercised.
- **Deload and week 1 could not be reached in demo:** the demo plan always computes itself as week 4 (`demoBlockStartDate`). They were tested in **guest mode without `?demo=1`**, in a disposable browser context with no sign-in, using the real block "Size · Straight Sets, Stretch Focus" and seeded local history. Loads such as 40 kg are test values.
- **Rest timing** is emulated by a fake clock in headless Chromium.

## Not tested

- **Real device:** notification prompt and alerts, haptics, sound, Live Activity and Dynamic Island, lock screen and backgrounding, safe areas, the numeric keyboard, and real double-tap handling in WKWebView. R1 and R2 both need a check here.
- **Signed-in account:** sync, and the AI consent sheet for signed-in users. Reading the code, `trainerWhy` skips AI only for demo and guest, so a signed-in user with no consent choice could get the sheet when a trainer explanation is requested. Whether it can appear over a Workout mode set was **not observed** and should be checked on a signed-in device.
- **Real-history replay** (AI Trainer checklist item 3): not run by QA.
- **Technique and Notes tool contents.**
- **Week-flow items not repeated:** paired day, mid-week counters, pyramid and drop set were covered in the first run at `99cd355` and only touched here through the guest days.
