---
title: Removing the RIR prompt, and fitness rules for Big Done + independent superset cards
status: approved
author: pt-fitness-expert
created: 2026-11-01
approved_by: Sebas (PO) removed the prompt ("si quitalo"); fitness rules decided by the PT (PO: "lo que el PT decide")
approved_on: 2026-11-01
exercises: []            # applies to every planned exercise; no catalogue content changes
---


> **Status 2026-11-01:** approved as written EXCEPT §5.3 (rest). The PO explicitly asked for a 2:00 rest with a Profile
> setting (2026-10-18), so **the Profile value keeps winning** and the card shows that same value until the PO decides
> on the PT's recommendation (`rest_seconds` wins). T134/T135 are parked until then; the 10 s superset switch applies.
> Spanish text in this doc still needs the PO's eye on the live app. Edit-rate review after one real week stays open.

## Summary
The prompt can go with **no change to the engine and no replacement rule**. Every engine path already handles a
missing answer, and old answers fade out by themselves. Progress does need text changes: W5 must go, and the
"nothing to review" text would become false.

For the logging redesign, the main rule is: **a careless Done repeats the truth or holds the load. It should never
add progress that did not happen.** The one exception is a target at a newly raised load, a small risk that cannot be
fully removed (section 5.1). A careless Done on a repeated miss can also lower the load one step, which errs on the safe side.

The numbers in the test cases come from reading the code. I did not run them. If an engine case fails, send it back
to the PT rather than changing the expected value.

The PO's decision to remove the prompt is already taken. This reverses option B in
`approved/2026-10-18-rir-prompt-review.md`. The fitness rules below stay a draft until recorded as approved.

## Exercises
None. No catalogue content changes.

## 1. Engine fallback when no new RIR arrives

**Verdict: safe. No engine change.**

| Where | With no RIR | How old answers age out |
|---|---|---|
| Pyramid hold, `src/trainer/engine.ts:916` (`short <= 0 && topSet.rir !== 0`) | Top set at target gets +1 step (pre-RIR behaviour, test E1). The next session self-corrects: 1 rep short holds (L920), 2+ short twice takes -5% (L924). | Reads only the latest pyramid session's top set, so an old 0 holds the load once, then is replaced by the next session. Keep the check. |
| Calibration residual, `src/trainer/calibration.ts:67` | `d = r_eq − r_tgt`, learning from reps only. | Half-life 42 days (L34), dropped after 120 days (L35, L93). Sebas's last answer is on or before 19 Oct, so its weight halves by about 30 Nov and it is last counted on 16 Feb 2027. Answers logged later by other users expire 120 days after they were logged. |
| `speedTier`, `calibration.ts:157-159` | Same residual, reps only, on sets away from the recommended load. | Same 120-day limit. |
| `effectiveReserve`, `engine.ts:139` | Unaffected. It reads the plan's target (`RESERVE_REPS`, 1 for pyramid tops) and the offset, never a logged answer. | Not applicable. |
| Est. max effort note, `src/progress/estMax.ts:116` | `null` unless both compared sets have RIR. | Retired in the UI (section 2). |
| Watch W4/W5, `src/progress/comparison.ts:185-195` | **W5 fires as the catch-all. This must change.** | Both retired (section 2). |
| "Last 3 sessions at 0 RIR", `src/screens/ProgressScreen.tsx:539-542` | Never fires once one new session is logged. | Retired (section 2). |
| Effort chart, `src/progress/insights.ts:288-302`, `:506-514` | **Already not on screen.** `rirWeeks` and `rirChange` are computed, but no screen reads them and no component uses `progress.rir.*` or `.progress-rir-*`. The 2026-10-18 review listed it as live. | Nothing to hide. Deleting the dead code is the Tech Lead's call. |

**Honest limits**
- Calibration's downward signal now comes only from missed reps. Someone who hits the target at true failure reads
  `d = 0` where a "0" answer gave `d = −2` on that set. It learns more slowly and loads will not back off until reps
  are actually missed.
- The reason text for a hold from an old "0" says "Some reps were below…" (`slightly_below_target`, L923), which isn't
  quite accurate when the target was hit. It can only appear once per pyramid and clears by itself, so leave it.

**Stored data:** keep `rir` on old sets, in `types.ts` and in the sync validator (`src/utils/sync.ts:60`). Never delete
or rewrite old answers. New sets simply have no `rir` key.

## 2. Texts to remove or reword

After release, **no user-facing text should ask about RIR or report a logged RIR.** Showing old answers would refer to
a question the app no longer asks, so old answers stay as data only.

**Remove (both dictionaries, plus `WATCH_KEYS`, the `code` union and `WATCH_PRIORITY` in `comparison.ts`):**

| Key | EN today | ES today |
|---|---|---|
| `workout.insight.watch.W5`, `progress.v3.watch.W5` | Tip: log reps in reserve on your last set. | Consejo: registra las repeticiones en reserva en tu última serie. |
| `workout.insight.watch.W4`, `progress.v3.watch.W4` | Last set was logged at 0 reps in reserve. | La última serie se registró con 0 repeticiones en reserva. |
| `progress.v3.worth.rir` | The last three equivalent sessions ended at 0 RIR. | Las últimas tres sesiones equivalentes terminaron en 0 RIR. |
| `workout.insight.estMax.effort` | (reps left in the tank: {now} today vs {before}) | (reps en reserva: {now} hoy vs {before}) |
| `workout.rir.question` | Reps left in the tank? | ¿Cuántas reps más podías hacer? |
| `workout.rir.hint` | Last set only. Helps set your next weight. | Solo la última serie. Ayuda a ajustar tu próximo peso. |
| `workout.rir.zero` / `.oneTwo` / `.threePlus` | 0 · max / 1–2 / 3+ | 0 · al máximo / 1–2 / 3+ |
| `workout.rir.saved` | Got it, your next target will use this. | Listo, tu próximo objetivo lo tendrá en cuenta. |

Tech Lead's call: the unused `progress.rir.*` keys, and `progress.section.effort` if it is confirmed unused.
`src/i18n/i18n.test.ts:73-80` pins the `workout.rir.*` texts and must change with them.

**Reword (this one is easy to miss).** `progress.v3.summary.empty` only shows when there are no watch items
(`ProgressScreen.tsx:882-884`). W5 was the catch-all that kept that list full. Without it, someone with months of
history would be told their first session is a baseline.

| Key | EN new | ES new |
|---|---|---|
| `progress.v3.summary.empty` | Nothing to review right now. New lifts start as a baseline. | Nada para revisar por ahora. Los ejercicios nuevos empiezan como base. |

**Keep:** coaching guidance such as `workout.weekNote.intro`, `workout.weekNote.deload`, and block notes like "1-2 reps
left". These tell you how hard to train and don't ask for an answer.

**Superseded when this is approved:** R-RIR1 to R-RIR6 in the 2026-10-18 review; W4/W5 and the "Log RIR" advice in
`2026-10-10-progress-interpretation.md`; the RIR parts of the thresholds (§5), trends (§6-7) and X6 specs. In
`docs/ux/proposals/2026-11-01-effortless-logging.md`, the RIR line in the pop-up and §9 question 3 no longer apply.
`docs/marketing/2026-10-07-promo-30s-storyboard.md` and `docs/marketing/2026-10-18-marketing-plan.md` still show the
prompt.

## 3. Is a safety signal lost?

**A small one, and no replacement rule is needed.** The prompt's only direct effect on a weight was holding a pyramid
top set after a "0". That hold had limited reach:
- It never fired on reverse pyramids (test E4), and it never applied to straight sets, which don't read RIR.
- It depended on an answer given on 26 of 127 logged exercises overall, and on none of the last 39.

What still protects the user:
- Missed reps already act as the failure signal: hold at 1 short, -5% after two sessions at 2+ short (`engine.ts:920-927`).
- Straight sets have `drop_off_across_sets`, `below_target_twice` and the calibration limits (L1180-1212, L1229).
- The increase is capped by the guardrail, so a wrong +1 step gets corrected within a session or two.
- `progress.v3.worth.dropped` and `worth.noBest` still flag lifts that stall.

**Rejected: inferring failure from reps.** A set that lands exactly on target looks the same whether it was easy or
all-out, so a hold based on it would mostly penalise normal, honest progress. Close-to-failure training works well
without going all-out each time (Refalo 2023). Our replay step (`scripts/trainer-replay.ts`) should still be run under
the AI Trainer checklist.

## 4. What the current data means for prefill

**Every rep target in approved `blocks.json` and `templates/` is an exact number per set.** There are no "6-8" strings.
Ranges appear only when the engine recommends one (R14), or when per-set targets differ. So exact targets are the normal
case, and on those, hitting the target earns +1 step (`engine.ts:1165`, `:1179`). That matters more than the 6-8 example.

## 5. Rules for the logger

### 5.1 (a) What the logger prefills

Weight: the load the card already shows as today's target. Reps, per set, in this order:

| # | Situation | Prefilled reps |
|---|---|---|
| P1 | Deload week | The deload's prescribed reps |
| P2 | Same load as the comparable session at this set | **Exactly last time's reps, never +1, even when below target** |
| P3 | New load or no comparable set, exact target | The target |
| P4 | New load or no comparable set, range | **The lowest of the range** |

**Comparable session:** the latest non-deload session of this exercise with the same rep target and the same tempo
flag, leaving out today's entry for this slot. A/B days therefore never feed each other.

**Why not always the highest of a range?** A careless Done would record top-of-range and earn a false load increase.

**Why not always the lowest?** Someone who did 7 last time would be recorded at 6: a false "Lower" in Progress and a
negative calibration residual that can pull loads down.

**Why last time's reps at the same load?** A careless Done reproduces the last result, so the recommendation doesn't
move. Prefilling the target after a miss would turn 6, 6, 6 into a false hit and a load increase. The exception is a
repeated miss of 2+ reps: a careless Done counts as a second miss and lowers the load one step (T117). I accept that
because it errs on the safe side, the user sees it, and the next real session corrects it.

**Remaining risk (P3).** After a load increase, a careless Done records a target hit that may not have happened, and
next session goes up another step. I rejected prefilling target−1: every honest success would cost an extra tap per
set and false misses would drag calibration down. Instead, the weight on the button is real and has to be physically
lifted, each increase is capped, and the card flags the moment:

| Key (proposed) | EN | ES |
|---|---|---|
| `workout.run.newWeightCheck` (only when P3 applies and the load went up) | New weight: check your reps | Peso nuevo: revisa tus reps |

⚠️ REVISAR: track the edit rate from the first real week. If sets at raised loads are almost never edited and then
targets start being missed, the PT will propose an engine rule. None is proposed now, because holding load after
honest hits has a real cost.

**Button**

| Case | EN | ES |
|---|---|---|
| Weighted | Done · 37.5 kg × 8 | Hecho · 37,5 kg × 8 |
| Bodyweight, no added load | Done · 12 reps | Hecho · 12 reps |
| Drop set | Done · 40 kg × 12 → 30 kg × 12 | Hecho · 40 kg × 12 → 30 kg × 12 |
| Weight is 0 on a weighted exercise (Done disabled, nothing saved) | Enter weight | Ingresa el peso |

**Two code paths to fix, since the button must save exactly what it shows:**
- `Number(currentReps) || getDefaultRepTarget(exercise)` (`WorkoutPlan.tsx:2143`, `:2303`) silently turns 0 reps into
  the target, which is a false hit. Done must be disabled at 0 reps instead.
- `selectCompletedSets` (`src/utils/workoutSets.ts:70-73`) saves all sets when none are ticked. Workout mode must never
  reach that path.

**Answers to the other PT questions in the proposal (§9):**
- Auto-logging when rest ends: **no**.
- Sets logged seconds apart: **treat as normal evidence.** Logging several at the end is honest behaviour, so no weak-evidence rule.

### 5.2 (b) Carrying changes to later sets

Applies only when the week's prescription is `straight`, `superset` or `drop-set`, **and** all sets have the same rep
target, **and** all planned loads are equal. Never on pyramids.

| Value | Rule |
|---|---|
| **Weight** | A change on any set carries, up or down, to all later unlogged sets the user has not edited by hand. Logged sets never change. |
| **Reps** | **Never carry up. They carry down only:** a later set at the same load prefills `min(its own prefill, reps of the latest set logged today)`. |

If the user changes the weight without having edited reps on that set, re-run 5.1 for it with the new load.

Reps don't carry up because of fatigue: copying a set 1 of 8 onto sets 2 and 3 could turn 8, 7, 6 into a false 8, 8, 8
and a load increase. The cost is an extra tap when every set really improves, which I accept.

Implementation note: `setWeightTouched` is set from `weight !== 0` (`WorkoutPlan.tsx:1488`), not from a user edit, and
`copyWeightToUntouchedSets` only works from set 1 (`workoutSets.ts:54`). That likely explains proposal finding 7.
"Touched" must mean edited by the user.

| Key (proposed), shown once on the first carry | EN | ES |
|---|---|---|
| `workout.run.weightCarried` | Applied to the next sets | Aplicado a las siguientes series |

### 5.3 (c) Which rest wins

**The exercise's `rest_seconds` wins. The Profile value is only the fallback** for exercises with no rest of their own.
The block's rest is a training decision per exercise (longer on heavy compounds, in line with Singer 2024 and
Schoenfeld 2016), while Profile is one number for everything. Workout mode currently ignores the block
(`WorkoutPlan.tsx:2104`, `:4275`, `SupersetLogger.tsx:148`), and the `?? 90` fallback at L2202 and L4275 should become
the Profile value.

- **Card, pop-up, Live Activity:** one number, in minutes: `Rest 2:30` / `Descanso 2:30`, instead of `150 s`.
- **+15 s:** changes the current rest only and is not remembered.
- **Last set of an exercise:** that exercise's rest. **Last exercise of the day:** no timer (as now, `WorkoutPlan.tsx:1865`).
- **Rest ending never logs anything.**

Sebas will notice the change: rest now varies by exercise rather than always using his Profile value.

| Key | EN new | ES new |
|---|---|---|
| `profile.restBetweenSets` | Rest when the plan sets none | Descanso cuando el plan no indica uno |
| `profile.restBetweenSetsHelp` | Plan workouts use each exercise's own rest. This time applies only to exercises without one. | Los entrenamientos del plan usan el descanso de cada ejercicio. Este tiempo solo aplica a ejercicios que no lo tienen. |

### 5.4 (d) Supersets as independent cards

**Rest**
- After every exercise except the last in the pair: a fixed ~10 s strip, with no pop-up and no Live Activity. Use the fixed value rather than reading the first exercise's `rest_seconds`, since `scripts/validate-blocks.py` doesn't enforce 10.
- After the last exercise in the pair: its `rest_seconds`, in the full pop-up.
- If C1 has 2+ more logged sets than C2 (for example the second machine is taken, and the block allows doing both as straight sets), stop the jump to C2 and use C2's `rest_seconds` as the full rest after C1.

**Evidence: each exercise stands on its own.** No engine change, and a half-finished superset does count, limited by
R6.

| Logged | C1 next time | C2 next time |
|---|---|---|
| C1 3/3, C2 0/3 | Normal rules. The work is real. | No new evidence, recommendation unchanged, not a "miss" (`src/trainer/evidence.ts:45`). |
| C1 3/3, C2 2/3 | Normal rules. | R6: at most same load. Missed reps still count. |
| C1 2/3, C2 2/3 | R6 | R6 |

- **Exposures:** incomplete entries are already excluded from calibration (`src/trainer/exposures.ts:37`). They count once the entry reaches the planned sets.
- **Same day:** today's entry never feeds its own slot's recommendation. A partial entry from another day done today does count, under R6 (`evidence.ts:46`).
- **Undo:** undoing an entry's only set removes the entry.
- **Set-by-set saves** use the single-exercise path, which already writes `target` and the trainer result (`WorkoutPlan.tsx:2178-2195`).

**"Done" labels:** an exercise is complete only when its logged main sets reach the planned count. Fix the non-workout
default in `findExerciseCompletion` (`WorkoutPlan.tsx:1116-1121`), which treats any entry as complete.

| State | EN | ES |
|---|---|---|
| Partial exercise | 2 of 3 sets | 2 de 3 series |

- A pair's ✓ needs both exercises complete. A round counts only when both are logged (`getLoggedSupersetRounds` already does this).
- The day isn't complete with partials. Ending early keeps what was logged and never fills in the rest.

**Also fix W2.** `meetsEveryTarget` (`comparison.ts:170-172`) checks only logged sets, so 2 of 3 sets on target would
say "all sets reached". W2 must also require the planned set count.

⚠️ REVISAR (already in the code, not caused by this change, not run): on a partial ascending pyramid, `heaviestOf`
(`engine.ts:903`) falls back to the heaviest logged set, so 40×12, 45×10 of a 12/10/8 could base the next top set on 45
rather than the earlier 50. I will review this with the replay and propose a fix if confirmed.

### 5.5 (e) Drop sets and myo-reps

**Drop sets: one tap saves both parts** as one set with the nested `drop`. There is no rest between the parts, so a
second tap makes no sense mid-effort.
- **Prefill:** main part by 5.1, using the first number of `12+12`. Drop weight is the engine's `dropWeight` when there is one (R3, 75% rounded down), rather than last time's drop first (`WorkoutPlan.tsx:1474`). Drop reps use the second number.
- **Carry:** changing the main weight recalculates later unedited drops at 75% rounded down. A hand-edited drop weight carries to later unlogged sets.
- **Drop not done:** setting drop reps to 0 saves **no `drop` field**. Today `|| getDefaultDropRepTarget` would overwrite 0 (`WorkoutPlan.tsx:2148`, `:2308`).
- **Evidence:** unchanged. The drop never feeds progress, e1RM or misses (R3), and a careless drop value affects volume only.
- **Rest:** the exercise's rest after the drop.

**Myo-reps, rest-pause, partials: log the main set only.** They stay out of the one-tap flow and no mini rows are
created, because `mini` and `partial` work never counts as evidence (R3, R10) and logging each one would be many taps
during a very hard effort. The accepted cost is that this extra work doesn't count in volume.
- Tap Done **after** the extras, so rest starts when the set is truly over.
- On the last set only, when the week's note names one of these extras (reuse the pattern in `src/plans/weekPrescription.ts:5`, without `top set`) and says last or final set. Week 1 and deload notes already replace them, so no hint appears there.

| Key (proposed) | EN | ES |
|---|---|---|
| `workout.run.extraThenDone` | Finish the last-set extra in the note, then tap Done. Log only the main set's full reps. | Termina el extra de la última serie (ver nota) y luego toca Hecho. Registra solo las reps completas de la serie principal. |

## 6. Test cases

Barbell step 2.5 kg, cable step 5 kg. Careless means Done with the prefilled values untouched.

### RIR removal
| # | Input | Expected |
|---|---|---|
| T101 | Pyramid 12/10/8, last 40×12, 45×10, 50×8, no RIR | Top 52.5, `reached_top_of_range` |
| T102 | Same, top set has an old `rir` 0 | Top 50, `slightly_below_target` (old answer respected once) |
| T103 | Newest session as T101, older session as T102 | Top 52.5 (old answer no longer read) |
| T104 | Reverse pyramid 6/8/10, top on target, no RIR | Top +1 step |
| T105 | Straight 60×10, target 10, recommended 60, no RIR; invariants suite with no RIR in history (E5, E9) | d = 0; all invariants pass |
| T106 | Exposures with `rir`, all 121+ days old; then one group at exactly 120 days | Offset 0, scope null; the 120-day group still counts |
| T107 | Est. max: previous `rir` 3, current none | `effort` null, no note |
| T108 | Session with previous, not W1/W2/W3, no `rir`; same with old `rir` 0 | No watch item either way. Today's card has no watch line; Progress shows the new `summary.empty` |
| T109 | Three equivalent sessions at `rir` 0, not improving; separately, 2+ dropped or mixed verdicts | No worth flag; `worth.dropped` still shows |
| T110 | Removed keys; old set with `rir` through load and sync; new set logged | Keys absent in EN and ES; old value intact; new set has no `rir` key |
| T111 | 375 px: log the last set of an exercise, single and superset | No prompt anywhere |

### Prefill
| # | Input | Expected |
|---|---|---|
| T112 | Range 6-8, recommended 37.5, last 37.5 × 7, 7, 7 | Prefill 7, 7, 7. Careless: next load stays 37.5 |
| T113 | Range 6-8, recommended 40, last 37.5 × 8, 8, 8 | Prefill 6, 6, 6. Careless: next load stays 40 |
| T114 | Range 6-8, no history | Prefill 6, never 8 |
| T115 | Exact 8, recommended 40, last 37.5 × 8, 8, 8 | Prefill 8 + `newWeightCheck`. Careless: next 42.5 (pins the known risk) |
| T116 | Exact 8, same load 37.5, last 8, 7, 6 | Prefill 8, 7, 6. Careless: next 37.5, no chip |
| T117 | Exact 8, same load 37.5, last 6, 6, 6 | Prefill 6, 6, 6, never 8. Careless: next 35, `below_target_twice` (two identical misses; one step down, never up) |
| T118 | Cable 10 kg, exact 12, last 13, 13, 13 | Prefill 13. Careless: stays 10, `light_load_add_reps` |
| T119 | Pyramid 12/10/8, all loads raised | Prefill 12, 10, 8 |
| T120 | Reverse pyramid, set 1 same load (last 5, target 6), set 2 new load (target 8) | Prefill 5, then 8 |
| T121 | Last session on the other day: target 12, same weight; today's target 8 | Prefill 8, not 12 |
| T122 | Deload week | Prescribed reps, ignoring last time |
| T123 | Bodyweight, no added load | "Done · 12 reps"; 0 kg never shown |
| T124 | Weighted exercise at 0 kg; any exercise at 0 reps | Done disabled, nothing saved, reps not replaced by target |
| T125 | Recommended 40, last 37.5 × 7, user sets 37.5, reps untouched; then the same with reps typed | Reps become 7; typed reps stay |

### Carry
| # | Input | Expected |
|---|---|---|
| T126 | Straight 85, 85, 85; set 1 → 87.5 | 87.5, 87.5, 87.5 |
| T127 | Set 1 logged at 85; set 2 → 87.5 | 85 ✓, 87.5, 87.5 |
| T128 | Set 3 edited by hand to 80; set 1 → 87.5 | 87.5, 87.5, 80 |
| T129 | Prefill 7, 7, 7; set 1 logged at 8 | Set 2 stays 7 |
| T130 | Prefill 8, 7, 6; set 1 logged at 5 | Sets 2 and 3 prefill 5, 5 |
| T131 | Pyramid or reverse pyramid; straight with differing per-set reps or loads | No carry |
| T132 | Superset: C1 set 1 weight changed | C1's later sets follow; C2 unchanged. R5 double-angle unchanged |
| T133 | Machine drop-set, main 40 → 45 on set 1 | Later mains 45; drops 33.75 → 30 (T10); hand-edited drop stays |

### Rest
| # | Input | Expected |
|---|---|---|
| T134 | `rest_seconds` 150, Profile 120 | Timer 2:30; card "Rest 2:30" / "Descanso 2:30" |
| T135 | No `rest_seconds`, Profile 90 | Timer 1:30, in and out of Workout mode |
| T136 | Superset, C2 `rest_seconds` 90 | After C1: 10 s strip, no pop-up or Live Activity. After C2: 1:30 pop-up |
| T137 | Last set of a non-final exercise; last set of the day | That exercise's rest; no timer |
| T138 | +15 s, then next set | Next rest back to prescribed value |
| T139 | Rest runs out, nothing tapped | History unchanged |

### Supersets and partial entries
| # | Input | Expected |
|---|---|---|
| T140 | C1 3/3, C2 0/3 | C1 normal rules; C2 recommendation unchanged, no miss |
| T141 | C2 2/3, both on target | C2 same load, `incomplete_session`; exposure excluded |
| T142 | C1 2/3, top of range | Same load (T18) |
| T143 | C2 2/3, reps 6, 6 on target 8 | Same load, reason from missed reps |
| T144 | Reload after C1 set 1 only | C1 has 1 set saved, C2 no entry, 0 rounds complete |
| T145 | Undo an entry's only set | Entry gone, no empty evidence |
| T146 | Exercise at 2/3; pair with one complete | "2 of 3 sets" / "2 de 3 series"; no pair ✓; day not complete |
| T147 | Partial today in this slot; partial today in another day's slot | Not used for this slot's target; used under R6 for the other |
| T148 | 2 of 3 sets on target; 3 of 3 on target | No W2; W2 |
| T149 | C1 logged twice with no C2 | Second Done: no jump, C2's `rest_seconds` as full rest |

### Drop sets and myo-reps
| # | Input | Expected |
|---|---|---|
| T150 | Drop-set, one Done | One set: 40×12 with `drop` 30×12; button shows both |
| T151 | Drop reps set to 0 | Set saved with no `drop` field; progression unchanged |
| T152 | Main 40×12, drop 30×10 (T11) | Main stays 40; the drop's reps are not "missed" |
| T153 | Last set note "Last set: myo-reps, 3 mini-sets of 5" | Hint on last set only; one main set saved, no mini rows |
| T154 | Same exercise in week 6 or beginner week 1 | No hint |
| T155 | Old entry with extra untagged rows (T9) | Rows still ignored |
| T156 | Workout mode, nothing ticked | Nothing can be saved in bulk |

## ⚠️ Open decisions
- PO: approve this draft. Fitness choices were delegated to the PT and decided above, but nothing is approved until recorded.
- ⚠️ REVISAR: review the edit rate after one real week (5.1, P3 risk).
- ⚠️ REVISAR: partial ascending pyramid fallback (5.4). I will check it with the replay.
- Tech Lead: `workout.trainer.firstSession.effort` in the ES dictionary is still English (`src/i18n/sections/workout.ts:728`). Separate from this work, and its Spanish needs PT approval.
- This changes what the trainer's evidence records, so the AI Trainer release checklist and a PT pre-merge review apply.

## Sources
- Refalo MC et al. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med. 2023;53:649-665.
- Halperin I et al. Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. Sports Med. 2022;52:377-390.
- Singer A et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. Front Sports Act Living. 2024.
- Schoenfeld BJ et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res. 2016.
- Approved GymStudio specs: 2026-10-07-progression-engine-spec.md (R1, R2, R3, R5, R6, R8, R10, R14), 2026-10-07-continuous-learning-spec.md, 2026-10-18-rir-prompt-review.md, 2026-10-10-progress-interpretation.md; training-blocks-spec.md.
- Code read at commit 6c2b00f. Proposal: docs/ux/proposals/2026-11-01-effortless-logging.md.
