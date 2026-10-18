# Round-based superset logger (workout mode)

- Date: 2026-10-10 · Author: UXer · Status: proposal (needs PO approval)
- Prototype: `docs/ux/proposals/2026-10-10-superset-logger.html` (Before/After, EN/ES, 2- and 3-exercise)
- Trigger: PO feedback 2026-10-10 — supersets "still don't add up" and logging is not user-friendly.

## Problems found (evidence)

| # | Problem | Where |
|---|---|---|
| P1 | Each superset exercise renders as a full stacked card (title, Done chip, Next box, chips, meta, 5 action buttons, Today line, cue card) *and* the group then adds a separate "Log rounds" box — two places to log the same work, very long scroll at 375 px. | `src/components/WorkoutPlan.tsx:3727-3738` (`{cards}` then `superset-log-box`) |
| P2 | The rounds logger is collapsed behind a `+` toggle (`supersetLogOpen`), so in the gym the primary job is hidden by default. | `WorkoutPlan.tsx:622`, `:3754-3764` |
| P3 | One tick per *round*, not per exercise: the UI cannot reflect "do C1, rest ~10 s, then C2". There is no C1→C2 hand-off or mini timer. | `WorkoutPlan.tsx:3790-3822` |
| P4 | Rest after the round always uses the last exercise's rest; the approved intra-pair `rest_seconds: 10` on C1 is never used. | `WorkoutPlan.tsx:3812-3815`; `docs/fitness/approved/training-blocks/blocks.json` (e.g. C1 `dumbbell-bench-press` rest 10, C2 `cable-lat-pulldown-underhand-grip` rest 120) |
| P5 | No "Round X of N" in the header; current round is not highlighted, so it is hard to tell where you are. | `WorkoutPlan.tsx:3727-3731` (header shows only chip + instruction) |
| P6 | Round completion is derived from `Math.min(setCounts)`, which is right for saved data, but the in-session state is round-only (`completedSupersetSets[group.key]: boolean[]`), so a half-done round (C1 done, C2 not) is not representable. | `src/utils/supersets.ts:33-36`, `WorkoutPlan.tsx:3700` |

## Proposal

One compact card per superset; rounds are the primary UI and are always open in workout mode.

```
┌ Superset · C1 + C2            Round 2 of 3 ┐
│ C1 · Flat dumbbell bench press         [⋯] │  ⋯ = Google, Swap, Notes,
│     Today: 24 kg × 10                      │      History, Technique
│ C2 · Underhand lat pulldown            [⋯] │
│     Today: 50 kg × 10                      │
│ Do C1, rest ~10 s, then C2; rest after pair│
│ R1 ✓ 24×10 · 50×10                (tap=edit)│
│╔ Round 2 ═════════════════════════════════╗│
│║ C1 [ 24 ] [ 10 ] [✓]                     ║│
│║    Last: 22×10                           ║│
│║    Go to C2 · 8s                         ║│
│║ C2 [ 50 ] [ 10 ] [✓]   <- focused        ║│
│║    Last: 45×10                           ║│
│╚══════════════════════════════════════════╝│
│ Round 3 (dimmed, prefilled)                │
└────────────────────────────────────────────┘
          [ Rest · Round 3        1:54 ]  (existing rest bar)
```

### Behaviour
1. In workout mode the superset group replaces the per-exercise cards (`{cards}`) with this card; plan mode can keep today's layout.
2. Header: `Superset · <codes> · Round n of N`, N = `max(getDefaultSetCount)` (as today). When all rounds are done: "✓ Done".
3. Each exercise: name + "Today: kg × reps" (trainer engine recommendation for the current round — single source, `src/trainer/engine.ts`). Secondary actions behind one `⋯` per exercise (aria-expanded).
4. Rounds: current round highlighted (rose border + soft fill); future rounds dimmed but editable-prefilled; completed rounds collapse to one line `R1 ✓ 24×10 · 50×10`; tapping reopens for edit.
5. Per-exercise tick. Ticking exercise *i* (not last) moves focus to exercise *i+1*'s kg input and shows an inline mini timer using exercise *i*'s `restSeconds` (10 s from the approved block). Not a blocking overlay; no sound required.
6. Ticking the last exercise completes the round, collapses it, advances the current round and starts the full rest bar via existing `onStartRest(last.restSeconds, ...)`.
7. Last time per exercise per round in small text under the row (from `previousSetsByExercise` / `getPreviousWorkoutSetRow`, already computed); tap = copy, as today.
8. Pyramids / per-set loads: each round row has its own kg/reps (already `setWeights[setIndex]`, `repsPerSet[setIndex]`). 3-exercise supersets: same row pattern, mini timer after each non-last exercise. Uneven set counts: an exercise with fewer sets shows "—" in later rounds and is not required for round completion.
9. When every round is complete, save automatically (as today) — no separate "Finish" button needed except for partial saves.

## Data mapping (no data-model change)
- Inputs stay in the existing per-exercise drafts (`updatePlanSetValue(exercise, setIndex, ...)`).
- In-session tick state becomes per cell: `completedSupersetSets[group.key]: boolean[][]` (round × exercise) — UI state only, not persisted shape. Round complete = `row.every(Boolean)`; feeds the existing `logSuperset(exercises, key, roundsCompleted, times)`.
- Saving is unchanged: `createSupersetEntries` (`src/utils/supersets.ts:51`) still writes one `WorkoutEntry` per exercise with its sets; `getLoggedSupersetRounds` still derives rounds from saved set counts. No `localStorage`/Supabase shape change. (Tech Lead to confirm whether in-progress state is persisted anywhere; if so, keep the old shape or migrate.)
- Intra-pair timer reads the existing `restSeconds` of the non-last exercise.

## Impact / effort

| Item | Impact | Effort |
|---|---|---|
| Compact card replaces stacked cards in workout mode, rounds open by default | High | M |
| Per-exercise tick + auto-focus + 10 s mini timer | High | S–M |
| "Round n of N" + highlighted current round + collapsed done rounds | High | S |
| Secondary actions behind `⋯` | Medium | S |
| 3-exercise / uneven sets handling | Medium | S |

Quick win if needed first: open the rounds box by default, add "Round n of N", hide the per-exercise cards in workout mode.

## Dependencies & risks
- PT: confirm the intra-pair 10 s guidance should be shown as a timer (it is already approved text in the block summary).
- Tech Lead: state shape change is UI-only; check trainer recommendations per round for pyramids; i18n keys in both dictionaries.
- Risk: auto-focus opening the keyboard after each tick may annoy when values are already correct — tick should work without editing; focus the field but don't force-select on mobile (TL to test on iOS).
- Risk: accidental tick — keep untick, and done rounds editable.

## Success measures
- Scroll length of a superset at 375 px: today ~3+ screens → target ≤ 1 screen.
- Taps to log a 3-round pair with prefilled values: target 6 (one per exercise per round).
- PO acceptance in a real session; QAer week-flow superset check passes.

## Research notes
- Strong and Hevy log supersets as linked exercises with per-set ticks and the rest timer starting after the last exercise of the link (Hevy help: https://help.hevyapp.com/ ; Strong: https://help.strongapp.io/). Our proposal keeps that per-set tick model but groups visually by round, which matches how the PT prescribes the pair.
- NN/g on progressive disclosure (https://www.nngroup.com/articles/progressive-disclosure/): hide secondary actions (Google, Swap, History) behind one control.
- Apple HIG minimum hit target 44×44 pt (https://developer.apple.com/design/human-interface-guidelines/accessibility) — all inputs and ticks in the prototype are 44 px tall.

## Web Interface Guidelines check
- Source: `.claude/skills/web-design-guidelines/command.md` (Vercel, commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`), SHA-256 verified `d246b026…0234` on 2026-10-10.
- `WorkoutPlan.tsx:3790-3822` — icon-only "✓" button has aria-label + aria-pressed (ok); keep this per exercise.
- `WorkoutPlan.tsx:3754` — logger toggle uses aria-expanded (ok) but hides the primary task; remove in workout mode.
- `WorkoutPlan.tsx:3888-3896` — reps `<input type="number" inputMode="numeric">` with aria-label (ok); kg inputs should use `inputMode="decimal"` for 2.5 steps.
- New mini timer and rest bar: announce with `aria-live="polite"`, use tabular numbers (done in prototype).
- Auto-focus on tick is acceptable only as a direct result of user action (guidelines discourage unsolicited autofocus on mobile).

## PO decisions (2026-10-10): approved
1. Replace stacked cards with the one-card round logger in workout mode only.
2. The C1→C2 gap is shown as an on-screen countdown only (no vibration/sound).
3. A fully logged superset saves automatically (as today).
