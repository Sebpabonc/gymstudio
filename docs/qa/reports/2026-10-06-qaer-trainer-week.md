# QA report — AI Trainer week flow (demo) — 2026-10-06

- Scope: focused pass (prevention plan step 4). Live app `https://sebpabonc.github.io/gymstudio/?demo=1`, 375 px only.
- Plan in demo: Upper / Lower · 4 Days, Week 4 of 6. Logged Day 1 (Upper A) fully, then opened Day 3 (Upper B, "Wed").
- No sign-in, no real data touched.

## Result

| Area | Result |
|---|---|
| Trainer card before exercise (Last time / Original today / Recommended / Why / Accept / Keep original) | Pass (shown when history exists; "Not enough data" only for exercises with no demo history) |
| Accept fills weights (straight sets) | Pass (Bench 67.5 kg x3; Triceps E1 25 kg x3) |
| Accept per-set (pyramid) / drop weight (drop-set) | Not tested — demo plan has no pyramid or drop-set |
| Set hint after strong set | Pass ("11 reps at 40 kg — consider 42.5 kg for the next set", Use 42.5 kg) |
| "Reps left in the tank?" prompt | Pass |
| Done card "Next (Wed)" line | Pass with copy issue (F1) |
| End-of-day "Today's performance" | Pass; volume 7,035 kg verified by hand; one display issue (F3) |
| Paired day uses today's logs | Pass — Day 3 cards show Last time = today's sets, no "Not enough data", no 0 kg |
| Day counters keep counts | Pass — D1 stays 8/8 after switching to D3/D2/D4 |
| 0 kg / off-step weights | None seen in recommendations |
| Old rule text on preset days | Not seen |
| Layout overflow at 375 px | None (scrollWidth 375 on D1–D4) |
| EN/ES mixing | Plan/day names stay English in ES (F4) |
| Console errors | None in buffer (see notes) |

## Findings

### F1 [P3] Done card / summary "Why" says "today's N-rep target" but means the next day's target
Steps: Day 1, log T-Bar Row 40 kg x 11·8·8 (target 8).
Expected: "...to fit Wednesday's 10-rep target" (the target the Next line is for).
Actual: "Next (Wed): 35 kg × 10 — I adjusted the load from 40 kg to fit today's 8-rep target." Number and day both wrong in context (8 is today's, 10 is Wed's). Same for Bench (60 kg × 10, "today's 8-rep") and EZ-Bar Curl ("today's 12-rep"). On Day 3's own pre-exercise card the text is correct ("today's 10-rep target").
Where: `workout.trainer.reason.converted_rep_range` in `src/i18n/sections/workout.ts` (+ ES); the Done card passes the logged day's target as `{todayTarget}`.

### F2 [P3] "Next dumbbell or plate is a big jump" shown for cable exercises
Steps: Day 1, log Cable Lat Pulldown, Cable Lateral Raise, Cable Overhead Triceps Ext, Cable Face Pull.
Expected: wording fits a cable stack (or a generic "next step").
Actual: "At 35.5 kg the next dumbbell or plate is a big jump, so build reps first". Also questionable for a 35.5 kg stack (a 2.5 kg step is ~7%).
Where: `workout.trainer.reason.light_load_add_reps` in `src/i18n/sections/workout.ts`; reason selection in the trainer engine (`src/plans/` / progression logic).

### F3 [P3] Lat Pulldown pre-fill and summary disagree on weights
Steps: Day 1, open superset C "Log rounds". C2 rows pre-fill 35.5 / 33 / 30.5 kg on a straight 3 x 10 prescription while the trainer card says "Recommendation matches the original: 35.5 kg × 10". Log rounds unchanged.
Expected: pre-fill equals the recommended 35.5 kg for every round (or the card explains the descending load); summary reflects per-set weights.
Actual: logged 35.5/33/30.5; Done card and Today's performance show "35.5 kg × 10 · 10 · 10" (top weight only), and Day 3 bases "35.5 kg × 12" on it. Volume correctly uses 990 kg (actual weights).
Where: superset round pre-fill in `src/components/WorkoutPlan.tsx` (or its superset logger); summary line formatter.

### F4 [P3] ES: plan and day names stay English
Steps: switch to ES on Day 1.
Actual: "Upper / Lower · 4 Days", "Día 1 · Upper A", "Upper body · heavy" untranslated next to Spanish UI. Template content — needs PT-approved translation or explicit exception.
Where: template `tpl-4d-upper-lower-gym` (`docs/fitness/approved/templates/`).

### Observations (not filed)
- Summary arrows: T-Bar Row shows "↓" although the user beat the target (11·8·8 vs 8); the arrow reflects the next load going down for a higher rep target, which reads like a regression. Product decision.
- Demo history is ~110 days old ("It has been 110 days since your last session") while the demo plan says Week 4 of 6, so every first card in demo shows a large stale-gap reduction (Bench 85 → 67.5, Triceps 36.5 → 25 kg, -31%). Demo data realism only.
- Bench "Previous" column shows "—" while the trainer card shows Last time 85 kg × 8·8·8·8 (Previous appears to be per same day only).
- The console buffer reported ~7,500 earlier messages dropped (none errors in what remained). Worth a check for noisy logging in demo.

## Not tested
- Pyramid and drop-set Accept behaviour (no such exercise in the demo plan).
- 768 px and desktop widths (focused 375 px pass).
- "Keep original" button action; Undo on the summary.
