# Integrated prototype: prod Today + simplified Workout mode (draft, 2026-10-09)

Status: **draft for PO review**. Prototype: `2026-10-09-integrated-prototype.html` (self-contained, 375 px first).
PO direction (2026-10-09, clarified): Today stays exactly as production; the simplified design appears only once the workout starts.

## Today = production replica (unchanged)
- Big header: TRAIN WITH INTENT / GYM STUDIO / Today, calendar button, "6-WEEK PLAN · 4 DAYS/WEEK" pill.
- Block card: Upper / Lower · 4 Days · Week 4 of 6, MY PLAN · PT tag, Full plan, +.
- Day tabs D1–D4 with x/y done.
- Full exercise cards as in `WorkoutPlan.tsx`: code (A1…), name linking to an image search ↗, Swap button, Done badge, collapse −, technique and muscle chips, sets · reps · rest line, set table (Set / Previous / kg / reps / ✓), "Next" target card with why, technique tip, Notes and Log exercise. Supersets are grouped in a bracket.
- **Only addition:** a clear **"▶ Start workout · <day>"** button under the day tabs (it becomes "Resume workout" once something is logged).

## Workout mode = simplified v2 (new)
- Focused screen, bottom nav hidden; top bar: ✕ Exit · "Upper A · 1/8" · EN/ES.
- Mini overview: numbered 1…8 chips (current in rose, done in green, rose top line = superset); tap to jump.
- One exercise in focus: name + ⓘ Technique, muscles · sets · rest; labelled actions Search on Google / Swap / Notes / History.
- AI target + why with AI / Original toggle; set table Last time / Target / kg / Reps / ✓ (all sets visible).
- Ticking a set fills target values and starts the rest bar automatically (+15s, Skip).
- Done (auto-advances to the next exercise) / Done · Edit; "Next › <exercise name>" button.
- Finish workout → summary with ↑ → ↓ vs last time → **Back to Today** (the full prod Today, with done counters updated).
- Progress tab: minimal list with a visible Delete button and an Undo toast.

## Placeholders (not real behaviour)
- Weights, Previous/Last time, history and AI targets are illustrative. In the app they must come from `src/trainer/engine.ts` (see the AI Trainer release checklist). The "why" text must come from the engine.
- Plan data: approved PT template `tpl-4d-upper-lower-gym.json` (blocks.json has no Upper/Lower block). Names and tips come from catalogue-v2. Muscle chips and technique text stay English in ES mode until the PT approves translations.

## Open decisions for the PO
1. Does logging on the Today cards stay possible, or does logging happen only in Workout mode? Two ways to log may confuse users.
2. Should Start workout be sticky (always visible while scrolling Today) or sit only under the day tabs?
3. Exiting mid-workout: keep the logged sets and show "Resume workout" (as prototyped), or ask for confirmation?
4. Should the AI / Original toggle be per exercise or one global setting?
5. Should Done auto-advance to the next exercise (as prototyped), or should the user always tap Next?

## PO decisions (2026-10-09)
Sebas answered "yes to all":
1. Sets stay loggable on the Today cards and in Workout mode.
2. Start workout stays reachable while scrolling Today.
3. Exiting mid-workout keeps logged sets and shows "Resume workout" (no confirm).
4. AI / Original switch is per exercise.
5. Done moves straight to the next exercise.
Step 1 shipped in #271: the Start workout button and a focused mode that reuses the prod cards (prod design unchanged).
