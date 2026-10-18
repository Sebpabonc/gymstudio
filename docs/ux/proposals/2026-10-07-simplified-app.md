# GymStudio Simple — a very simplified app (proposal)

Status: **proposal** (UXer, 2026-10-07). Needs PO approval before any Issue is written.
Prototype: `docs/ux/proposals/2026-10-07-simplified-app-prototype.html` (375 px, clickable, EN/ES).
Contributors: UXer (lead), PT view, Tech Lead constraints, Socialer (marketing hero).

## Problem (evidence from the current app)
`src/components/WorkoutPlan.tsx` is ~3,400 lines and the Today screen stacks many things around the one
job that matters mid-set (log weight × reps). Today a lifter can see, on one scroll:
training-block card and badges, block insights, day tabs with counters, calendar/history rows, exercise
cards with origin badges, the AI Trainer card (Last time / Original today / Recommended / Why / Accept /
Keep original), set rows with Previous column, "same as set 1", steppers, complete-set buttons, an RIR
prompt (0 / 1–2 / 3+ / Skip), a set hint, rest start button, technique chips, tips/cues, notes field,
superset round grids, swipe hints, toasts and a session summary. Each is useful; together they compete.
With sweaty hands, 60–90 s of rest and a phone on a bench, every extra element costs attention.

Noise mid-set (useful, but not now): block insights, calendar, origin badges, "Original today" line,
technique chips, cues/tips, notes, swap, full history, RIR prompt on every set, Previous column for
every set.

## Principles
1. **One thing per screen** — one exercise at a time ("Next up"), like Future/Ladder's guided flow.
2. **One primary action** — the big ✓ "Log set". Everything else is secondary or hidden.
3. **Progressive disclosure** — details live behind a single **More** sheet (NN/g: defer secondary
   features to reduce error and learning cost).
4. **The AI decides, then explains in one line** — the target is pre-filled; the user can change it.
5. **Big targets, thumb zone** — ≥ 48 px controls, primary action at the bottom (Apple HIG / Material).

References: NN/g Progressive Disclosure (https://www.nngroup.com/articles/progressive-disclosure/),
Apple HIG Layout (https://developer.apple.com/design/human-interface-guidelines/layout),
Material 3 touch targets (https://m3.material.io/foundations/designing/structure),
Hevy / Strong (fast set logging with prefilled previous values), Future and Ladder (one-exercise-at-a-time
coach view).

## The 4 screens
```
1 TODAY (Next up)            2 REST (auto)          3 FINISH              4 PROGRESS
┌───────────────────┐     ┌──────────────┐     ┌───────────────┐    ┌───────────────┐
│ Push D4   ▓▓▓░ 3/7│     │    1:30      │     │ Workout done  │    │ This week 3/4 │
│ Shoulder press    │     │   (ring)     │     │ ↑ Shoulder ... │    │ ↑ 5  → 1  ↓ 1 │
│ 12 kg × 10–12     │     │ Next: set 2  │     │ → Incline ...  │    │ Top lifts      │
│ "Beat last time   │     │ 12 kg × 10–12│     │ ↓ Lateral ...  │    │  ▁▃▅▇ trend   │
│  by 4 reps"       │     │ +30s  Skip   │     │ Next D1: ...   │    │ Recent sessions│
│ Set 1 of 3 ●○○    │     └──────────────┘     │ [Done]         │    └───────────────┘
│ [−] 12 kg [+]     │
│ [−] 10 reps [+]   │
│ [   ✓ Log set   ] │
│ More ·   Next ›   │
└───────────────────┘
```
1. **Today** — header: day name + compact progress bar (3/7 exercises). One card: exercise name, AI target
   (`12 kg × 10–12`), one-line why, set dots, a single set logger (weight − +, reps − +, ✓). Swipe or "Next ›"
   moves to the next exercise. **More** opens the sheet.
2. **Rest** — starts automatically after ✓ (duration from the plan), shows the next set's target, +30 s and Skip.
3. **Finish workout** — appears after the last set (or from "Finish" in the header): one row per exercise with
   ↑ (beat target) → (on target) ↓ (short), and "Next time" target from the engine.
4. **Progress** — minimal: week count, ↑ → ↓ totals, top lifts with a sparkline, recent sessions.

**More sheet** (one place for everything else): technique tips and squeeze cue (approved PT content),
Swap ⟳, Notes, History (last sessions), "Keep original" (the plan's load instead of the AI target),
and "Reps left in the tank?" as an optional rating.

Bottom nav shrinks to **Today · Progress · Profile** (Profile keeps sign-in, plan, language).

## What moves / hides vs current
| Current element | Simple app |
|---|---|
| AI Trainer card (Last / Original / Recommended / Why / Accept) | Target pre-filled = accepted by default; one-line why; "Keep original" in More |
| All set rows visible + Previous column | One active set; previous shown in the why line and in More › History |
| RIR prompt after every set | Optional in More (or only on the last set) — needs PT decision |
| Set hint ("consider 14 kg") | Kept, as a small banner that updates the weight stepper |
| Rest "Start rest" button | Automatic after ✓ |
| Technique chips, tips, cues, notes, swap | More sheet |
| Block card, insights, calendar | Progress / Profile |
| Day tabs D1–D6 | Day picker on tap of the header title |
| Supersets | Card shows "A1 / A2" and alternates automatically (designed later) |

## Department contributions
- **PT:** mid-set the lifter needs target load × rep range, one reason, rest, and a fast log. Cues are useful
  *before* the first set — show the squeeze cue once in More, not on every set. All numbers come from
  `src/trainer/engine.ts` (approved specs v1 + v2: dumbbell 2 kg, machine 2.5 kg steps). Prototype example:
  last 10 kg × 14·14·14 target 10 → 12 kg × 10–12 (`original_too_easy`).
- **Tech Lead:** keep engine (recommendation + why + accept), set logging through `storage.ts`, rest timer,
  Progress, EN/ES dictionaries; no new backend, no data-model change. Mostly a new presentation layer
  over existing logic — can ship behind a "Simple mode" toggle for A/B with the current Today.
- **Socialer:** the Today card + auto rest + Finish ↑→↓ is the 3-shot hero for the 30 s promo
  (`docs/marketing/2026-10-07-promo-30s-storyboard.md`); fewer elements = cleaner frames.
- **UXer:** flow, principles, prototype.

## Impact / effort
| # | Item | Impact | Effort |
|---|---|---|---|
| 1 | One-exercise "Next up" card with single set logger | High | M |
| 2 | Auto rest timer after ✓ | High | S |
| 3 | AI target pre-filled (accept by default, one-line why) | High | S |
| 4 | More sheet (tips, cue, swap, notes, history) | Medium | M |
| 5 | Finish summary ↑ → ↓ | Medium | S (exists, reuse) |
| 6 | Minimal Progress | Medium | M |
| 7 | Simple mode toggle (keep classic view) | Medium | S |

Quick wins: 2, 3, 5. Bigger bets: 1, 4, 6.

## Risks
- Power users lose overview of all sets → keep a "See all sets" link in More and the classic view toggle.
- Accept-by-default could hide that the AI changed the load → the why line always states the change.
- Supersets/pyramids need their own one-card patterns (pyramid shows per-set targets in the dots).
- RIR data drops if prompt is optional → engine already works without RIR (spec v2 assumption).

## How to measure
Taps per logged set (target ≤ 2 when accepting the target), time from opening the app to first set logged,
% sets logged during the session (vs after), workouts finished, PO feedback after 1 week.

## Decisions for Sebas
1. Ship as **Simple mode** (toggle, classic kept) or **replace** the current Today?
2. AI target **accepted by default** (one tap less) or still require "Accept"?
3. "Reps left in the tank?" — **optional in More**, only on the last set, or remove? (PT to confirm)
4. Bottom nav **Today · Progress · Profile** — OK to move the block/calendar out of Today?
5. Use this flow as the **marketing hero**?
