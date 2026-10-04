# QAer report: 2026-10-04 (full pass)
Build: a00973e (main) · Live: https://sebpabonc.github.io/gymstudio/ (`?demo=1` for every write) · Viewports: 375×667, 390×844, desktop 1280×800 (768 skipped at the PO's request)

Scope: the full `docs/qa/README.md` checklist, plus everything that changed today: the collapsing header and dock, the Today day/block flow, the card hierarchy, the set table, supersets, the rest timer, the Exercises tab, Progress and You.
Measurements come from `getBoundingClientRect`, `getComputedStyle` and `elementFromPoint` in Chromium device emulation. All writes were made in demo mode. I did not sign in.

Test-environment notes:
- The demo store already held 21 entries logged on 4 Oct by an earlier run today. I removed the `gym-studio.demo.*` keys (demo data only) and reloaded, which reseeded a clean demo (742 entries, last one 26 Sep).
- A second app tab (`tab-2`, not mine) was open on the same origin while I tested. Once, a running rest timer was missing from storage and did not survive a reload. I could not reproduce this in isolation, so it is not reported as a bug (it was probably the other tab writing the shared key).
- **4 Oct 2026 falls in the gap between Block 5 (ended 27 Sep) and Block 6 (starts 5 Oct).** That shapes several Progress results (see #145).

## Summary
| Area | Result | Notes |
|---|---|---|
| Health | ✅ | 180/180 tests, both validators OK (227 exercises, 9 blocks), build OK, CI and Pages deploy green for a00973e; no console errors in demo or normal mode |
| Header + dock | ✅ | Header collapses to a 48 px sticky bar; dock is 228×60 at the bottom; full-bleed at 375/390/1280 (desktop content column 640 px, centred); dock hides (opacity 0, pointer-events none) while a number field is focused |
| Today (block/day) | ✅ | Opens on Block 6, Day 1 "Today"; D1–D6 tabs show n/7 and `aria-pressed`; block header +/− works; Change block sheet lists all 9 blocks (Completed/Upcoming); Escape closes it |
| Hierarchy / squeeze cue | ✅ | Open card gets a pink border and glow; squeeze cue box fully visible in all 42 cards (6 days × 7), with no clamp or overflow |
| Set table | ⚠️ | All behaviours work (see Passed checks). −/+ steppers are 30 px wide (#147) |
| Supersets | ⚠️ | Rounds, ✓ per round, B1/B2 rows, Copy round 1, Notes, Finish all work, with no overflow at 375. Counter resets to "0/3 rounds" after Finish while showing Done (#144) |
| Rest timer | ✅ | ✓ starts it at the prescribed rest (90 s / 60 s); +15s, pause/resume ("PAUSED") and Skip work; survives tab switches and reload |
| End-of-day summary | ❌ | Sheet appears on the last log with "Sign in to use AI" (disabled in demo), but the rest pill and dock cover it at 375 (#143). "Next session" is wrong in the gap week (#145) |
| Exercises | ⚠️ | Search by name, muscle and equipment plus all 9 chips work; "Logged · 1 set · top 90 kg" (singular); last max updates. Set table is inconsistent with Today (#146) |
| Progress | ⚠️ | Headline, strength trend (A/B/All), 14.5 px chart labels, PR rows OK. In the gap week: Suggestions empty, Consistency says Block 5, Weekly sets "0 planned" (#145). "Why?" / "Ask AI why" could not be shown in the UI |
| You / Account | ✅ | Demo card with no gap (card at y 134); signed-out screen shows email/password, Show, Forgot password?, Continue with Google, inputs at 16 px |
| Design consistency | ⚠️ | One round +/− control everywhere, English only. Exercises vs Today set tables differ (#146); dock layered over modals (#143) |
| Data & content | ✅ | Validators pass; every Block 6 card has a squeeze cue; angles shown ("Incline 30°") |

P1: 0 · P2: 1 · P3: 4

## Findings
### [P2] Today: dock and rest pill cover the Session complete and Change block sheets on phones: #143
- Where: Today → Session complete sheet and Change block sheet, 375×667.
- Steps: 1. Demo mode, 375×667. 2. Log the last open exercise or superset of a day while a rest timer runs. 3. Session complete opens.
- Expected: the modal sits above the app chrome, and its AI button and Undo toast are tappable.
- Actual: sheet y 232–655, AI button y 507–551, rest pill y 519–573 on top. `elementFromPoint` at the button centre returns the pill's "+15s". The dock (y 595–655) covers the Undo toast. In Change block, Block 9's card (bottom 603) is partly under the dock (top 595), and the dock stays tappable while the `aria-modal` dialog is open.

### [P3] Supersets: "Log rounds" resets to "0/3 rounds" after Finish superset while the superset shows Done: #144
- Where: Today → superset → Log rounds, 375 and 390.
- Steps: 1. Day 3 C1/C2, open Log rounds. 2. Tick rounds 1 and 2 ("2/3 rounds"). 3. Finish superset.
- Expected: the counter reflects the logged rounds or Done.
- Actual: the superset and both cards show "✓ Done · 2 sets", but the toggle reads "0/3 rounds" (also after reload).

### [P3] Gap week before a block starts: screens disagree on the current block: #145
- Where: Today summary and Progress, any viewport, on 4 Oct.
- Steps: 1. Complete Day 1, then Day 2 on Today. 2. Open Progress.
- Expected: one consistent "current block" rule.
- Actual: Session complete says "Next session: Day 1 · Chest-Back A" after both days, because `nextUnloggedDay` ignores entries dated before the block start. Consistency says "This week · Block 5", Weekly sets shows "0 planned" for every muscle, and Suggestions is empty (`progressSuggestions` returns [] when no block contains today). As a result, the "Why?" and "Ask AI why" UI can't be seen this week.

### [P3] Exercises: "Track it as you go" shows a ✓ column but rows only have a remove ×: #146
- Where: Exercises, 390×844 (same at other widths).
- Expected: headers match the row controls, and the pattern matches Today (Previous · kg −/+ · Reps · ✓).
- Actual: the header has "✓" but each row ends with "×" (Remove set N). There are no ✓ buttons and no −/+ steppers.

### [P3] Today: −/+ weight steppers are 30 px wide: #147
- Where: Today set table and superset rows, 375×667, all six days.
- Actual: the "Decrease/Increase Set N weight in kilograms" buttons are 30×44 px (46–52 per day); every other control is at least 40 px.

## Observations (no issue filed)
- "Log exercise" with no ticks saves every row, copying set 1's weight into untouched rows: typing 20 kg in sets 1–2 of a 4-set exercise saved 4 × 20 kg. This matches the #96 design. If the PO meant "only rows I typed", that's a product decision.
- With ticks, only the ticked sets are saved (Pec Deck: 2 of 3 rows ticked → 2 sets). Superset Finish with no ticks saved all 3 rounds.
- Re-opening an exercise that was logged today shows today's sets in "Previous". Logging again replaces today's entry (no duplicate), and Undo restores the earlier entry.
- The weekly headline counts sessions per date, so completing Day 1 and Day 2 on the same date shows "1 of 6 sessions".
- Exercises tab logs show no PR message (90 kg vs 85 kg previous best). PR badges and the PR toast exist only on Today.
- The undo toast lasts about 5 s.
- Supabase catalogue count was not queried directly; it was covered by `validate-catalogue.py` only.

## Passed checks
- Health: `npm test` 180/180, `validate-catalogue.py` OK (227), `validate-blocks.py` OK (9 blocks), `npm run build` OK, CI and Pages deploy for a00973e green; no console messages (demo and normal).
- No horizontal overflow on Today (all 6 days, every card and Log rounds panel open), Exercises, Progress and You at 375, 390 and 1280; `scrollWidth` equals the viewport.
- Header: expanded brand header 110 px, collapses to a 48 px sticky bar with a 0.96 opaque background.
- Dock: Today/Exercises/Progress/You with `aria-current="page"`; hidden while a set input or the search field has focus, back on blur.
- Today opens on today's day (D1 "Today") of the upcoming Block 6; Change block bottom sheet is `role=dialog aria-modal`, lists Blocks 1–9 with dates, method, Coach/PT and status.
- Hierarchy: day panel → exercise cards (open card border `rgba(201,156,161,.45)` plus glow) → inner panels (squeeze cue box, set table, Posture tips +, Progress +, "Sign in to ask AI", Start rest, Notes).
- Squeeze cue fully visible in all 42 Block 6 cards (`scrollHeight == clientHeight`, no line clamp).
- Set table: Previous · kg (−/+, 2.5 kg step) · Reps · ✓; inputs 16 px with `inputmode` decimal/numeric; "Same as set 1" disabled until set 1 has a weight, then copies to all rows; ✓ has `aria-pressed` and starts the rest timer; all-zero log shows "Enter at least one set".
- Undo toast (`role=status`, `aria-live=polite`): "Dumbbell Bench Press (Incline) logged · 4 sets · Undo"; Undo restores the earlier state.
- PR: logging 29.5 kg × 12 on Machine Seated Leg Curl (previous best 27 kg) showed the "e1RM PR · Weight PR · Rep PR" chips on the card and "New e1RM PR · New weight PR 29.5 kg · New rep PR 🎉" in the toast.
- Logging the last exercise of a day opens the next exercise automatically, and when the day is complete it shows "Session complete" (duration, sets, volume, PRs, next session, "Sign in to use AI" disabled in demo).
- Supersets: "Log rounds n/3 rounds" toggle with `aria-expanded`; one ✓ per round; B1/B2 rows with Previous (tap to copy) · kg −/+ · Reps; "Copy round 1 weights to all"; Notes with one labelled field per exercise; Finish superset saves the ticked rounds.
- Rest timer pill: 90 s after a ✓, +15s (1:23 → 1:38), tap time to pause ("PAUSED", stored as `pausedRemainingMs`) and resume, Skip; persists across tabs and reload (`endAt` in `gym-studio.demo.rest-timer`).
- Exercises: search "row" 24, "cable" 36, "smith" 9, "barbell" 34, "hamstrings" 37 results, "zzzz" → "No exercises found."; chips Chest 29 / Back 45 / Shoulders 27 / Arms 35 / Legs 46 / Glutes 19 / Core 19 / Full Body 7 (matches the catalogue); search input labelled "Search exercise"; "Logged · 1 set · top 90 kg"; Last max 85 → 90 kg; Previous performance "4 Oct · 1 set"; local date 2026-10-04.
- Progress: "This week: 0 of 6 sessions · 0 PRs · in progress" (clean demo) and "… 2 PRs" after logging; strength trend A/B/All toggles (`aria-pressed`) change points (14/16/30) and the takeaway; chart labels 14.5 px; PR rows show full names (no squeeze); Block report card has content for Blocks 2–5 and a sensible empty state for Block 6; every section uses the round +/− with "Expand/Collapse <section>" names.
- You: demo card directly under the header (no gap); signed-out screen renders sign-in and create-account tabs, email/password (`autocomplete` email/current-password), Show, Forgot password?, Continue with Google.
- Desktop 1280×800: full-bleed shell, no phone frame (radius 0), 640 px content column centred, dock centred.
