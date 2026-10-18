---
title: Review of the post-exercise "Reps left in the tank?" (RIR) prompt
status: draft            # draft | approved | rejected
author: pt-fitness-expert
created: 2026-10-18
approved_by:
approved_on:
exercises: []            # applies to every planned exercise; no catalogue content changes
---

## Summary
The PO asked whether the prompt ("Reps left in the tank?" / "¿Cuántas te quedaban?", buttons
0 / 1–2 / 3+ / Skip) is worth keeping. It does useful work in a few places, mainly the "0" answer,
which stops a load increase after a set taken to failure. When users skip it, the engine still
works and stays safe. The real problem is that users can't see what the answer does.
**Recommendation: (B) keep it, but make its value visible and make it cost less attention.**
No change to the engine is proposed.

## 1. What the answer is used for today

How it is captured (`src/components/WorkoutPlan.tsx` ~L3519-3523, ~L3882-3904): the prompt shows
**once per exercise, after the exercise is logged** (today's entry). It is not shown after every set.
The answer is saved as `rir` on the **final logged set** only. Mapping: `0` → 0, `1–2` → **2**,
`3+` → 3. Skip hides the prompt for that entry and saves nothing (`rir` stays undefined).

| Where | Rule (approved spec) | What the answer changes | If skipped (`rir` undefined) |
|---|---|---|---|
| `src/trainer/engine.ts` ~L524, pyramid top set (progression spec R1.1/R2.1) | Top set hit its target reps **and** `rir !== 0` → +1 step; hit target at rir 0 → same load | Answering **0** holds the load instead of adding a step. This is the only answer that directly changes a recommended weight. | Treated as "not 0" → +1 step. This is the same behaviour as before RIR existed (spec v2: "no logged RIR"). Guardrails (+10% / 2-step cap, R12b) still apply. |
| `src/trainer/calibration.ts` L67 (continuous-learning spec 1.1) → `effectiveReserve` in `engine.ts` L128-129 (spec 1.3) | Set residual `d = r_eq + rir − (r_tgt + rir_tgt)`; without rir `d = r_eq − r_tgt` | Applies to the last set only. On straight sets (`rir_tgt` 2): `1–2` = no signal, `0` = −2 reps, `3+` = +1 rep on that one set. This is averaged over all sets, decayed, ramped (needs ≥ 4 exposures) and clamped to ±3. So it can move a load by about one step over several weeks. | `rir` assumed equal to target, so the calibration only learns from reps. Spec note: a user who stops exactly at target looks "on plan" even if they had more left, so it learns more slowly but never more aggressively. Safe. |
| `src/progress/estMax.ts` L105-108 (A/B spec X6) | Both compared best sets have RIR and differ by ≥ 2 → "(effort: RIR {now} vs {before})" | Explains a lower Est. max on an easier day. | Note not shown. Est. max itself is unchanged. |
| `src/progress/comparison.ts` L185-195 (progress-interpretation W4/W5) | W4: last set RIR 0 → "Last set was logged at 0 reps in reserve." W5: none → "Tip: log reps in reserve on your last set." | W4 fact. | The W5 tip appears, nudging the user to answer. |
| `src/progress/insights.ts` ~L293 (thresholds §5, trends §6) | Weekly average RIR + chart only when coverage ≥ 30% | Effort trend chart. | Hidden below 30% coverage. |
| `src/screens/ProgressScreen.tsx` ~L483 (trends §7 "worth a look") | Last 3 equivalent sessions at RIR 0 and verdict not Improving | Flags possible grinding/overreaching. | Never triggers. |

### Does the engine degrade safely without it? Yes.
- Every engine path has a no-RIR default that matches the pre-RIR, already approved behaviour
  (spec v2 assumes "no logged RIR"). The AI Trainer invariants (never 0 kg, guardrail caps,
  no "no data") don't depend on RIR.
- The only safety benefit lost is that **a set taken to failure (0) on a pyramid top set** gets +1 step
  instead of being held. The jump caps limit this, but it is the case where the answer matters most.
- Calibration learns more slowly and more conservatively. Progress loses the effort chart, X6 note,
  W4 fact and the "3 sessions at 0 RIR" flag. It shows the W5 tip instead.

### Gap found while reviewing (no change proposed here)
⚠️ REVISAR: RIR is saved on the **last** set, but `engine.ts` L511/L524 reads it from the pyramid's
**top (heaviest) set**. For an ascending pyramid (e.g. 12/10/8) that is the same set, so it works.
For a **reverse pyramid** (e.g. 6/8/10, top set first) the top set never has RIR. The "hold at 0"
rule therefore never fires there, and the engine behaves as if Skip were pressed. This is safe (pre-RIR
behaviour plus guardrails), but the answer has less effect than users would expect. Options for the PO/Tech Lead:
(a) leave as is; (b) on reverse pyramids, word the prompt "Heaviest set: reps left?" and save it on
the top set. Recommendation: (a) for now, and revisit with the reverse-pyramid audit.

## 2. Recommendation: (B) keep, make the value clear

Why not (C) remove:
- Evidence: RIR-based autoregulation is mainstream practice. It works at least as well as fixed
  percentages for strength and lets load follow day-to-day readiness (Helms 2016; Zourdos 2016;
  Graham & Cleather 2021). The approved programme depends on an effort ramp (RIR 3 → 1 across
  weeks 1-5), and this prompt is the only way the app can see whether that ramp is followed.
- Accuracy: self-rated RIR is typically off by about 1-2 reps. It is **most accurate close to
  failure** and on lower-rep sets, and gets better with practice (Halperin 2022). So the most
  reliable answer is the one that matters most to the engine: **"0"**. The coarse 0 / 1–2 / 3+
  buttons match what people can actually tell apart, and nothing finer should be asked.
- Removing it would also remove W4, X6, the effort chart and the overreaching flag, and leave a W5
  tip that asks for data the user can no longer enter.

Why not (A) keep as is:
- Users don't see what the answer does, so it feels like homework. "¿Cuántas te quedaban?" is
  also ambiguous (how many what?).
- "Skip" makes 4 small targets, and a user holding a phone in one hand between sets has to dismiss
  it on purpose.

What (B) changes (UI copy and dismissal only; the engine and data are unchanged):
1. **When:** unchanged. Once per exercise, after it is logged, about the last set.
2. **Explain the value in one line** under the question.
3. **Make "0" self-explanatory** with a short label.
4. **No explicit Skip button.** The prompt quietly dismisses (counts as skipped, nothing saved)
   when the user starts the next exercise or leaves Workout mode. There is no timer: rest is when
   people answer, and a countdown would hide it while they are still catching their breath.
   ⚠️ REVISAR (PO/UX): if a visible way out is still wanted, keep a small "×" instead of a
   "Skip" text button.
5. **Brief confirmation** after a tap: the buttons collapse to a one-line acknowledgement.

## 3. Exact wording and rules

### English (source)
| Key (existing or proposed) | Text |
|---|---|
| `workout.rir.question` | Reps left in the tank? |
| `workout.rir.hint` (NEW) | Last set only. Helps set your next weight. |
| `workout.rir.zero` | 0 · max |
| `workout.rir.oneTwo` | 1–2 |
| `workout.rir.threePlus` | 3+ |
| `workout.rir.saved` (NEW) | Got it, your next target will use this. |
| `workout.rir.skip` | Remove if rule 4 is approved (or replace with an "×" icon, aria-label "Dismiss"). |

### Spanish (DRAFT, needs PO approval)
| Key | Text |
|---|---|
| `workout.rir.question` | ¿Cuántas reps más podías hacer? |
| `workout.rir.hint` | Solo la última serie. Ayuda a ajustar tu próximo peso. |
| `workout.rir.zero` | 0 · al máximo |
| `workout.rir.oneTwo` | 1–2 |
| `workout.rir.threePlus` | 3+ |
| `workout.rir.saved` | Listo, tu próximo objetivo lo tendrá en cuenta. |

### Rules
- R-RIR1: Show once per exercise entry logged today, when its final set has no `rir` (as today).
- R-RIR2: Save the answer on the final logged set: `0` → 0, `1–2` → 2, `3+` → 3 (unchanged).
  ⚠️ REVISAR (low priority): `1–2` saved as 2 is conservative for straight sets (target 2 → no signal),
  but on an ascending-pyramid top set (target 1) it adds +1 rep to that one set's residual. The effect is
  tiny after averaging and the ramp. Keep for now.
- R-RIR3: Starting the next exercise, finishing the workout or leaving Workout mode dismisses an
  unanswered prompt for that entry (same as today's Skip: nothing saved).
- R-RIR4: Never block logging, rest timer or navigation. The prompt is inline and optional.
- R-RIR5: Superset: ask once per exercise after its last round, same as today. No extra prompts.
- R-RIR6: W5 "Tip: log reps in reserve on your last set." stays as is.

### Test cases
Engine behaviour does not change. These cases pin the current behaviour so a UI refactor can't
change it by accident (add them if they're missing):

| # | Input | Expected |
|---|---|---|
| E1 | Ascending pyramid 12/10/8, last pyramid top set 8 reps at target, `rir` undefined | top +1 step, `reached_top_of_range` |
| E2 | Same, top set `rir` 0 | top same load, `slightly_below_target` (maintain) |
| E3 | Same, top set `rir` 3 | top +1 step |
| E4 | Reverse pyramid 6/8/10, top (first) set hit target, last set `rir` 0 | top +1 step (documents the gap above) |
| E5 | Calibration straight set, target 10 @ 2 RIR, logged 60 × 10 at w_rec 60, `rir` undefined | d = 0 |
| E6 | Same, `rir` 2 (button 1–2) | d = 0 |
| E7 | Same, `rir` 0 | d = −2 |
| E8 | Same, `rir` 3 | d = +1 |
| E9 | Invariants suite with every `rir` removed from history | all invariants pass |

UI acceptance (QAer, 375 px): the prompt shows once after the last set of an exercise; one tap saves and
shows the confirmation; starting the next exercise without answering hides it and saves nothing;
the prompt never covers the set inputs or rest timer.

## ⚠️ Open decisions
- PO: approve option B (vs. C remove).
- PO: drop the "Skip" button in favour of auto-dismiss on moving on, or keep a small "×".
- PO: approve the Spanish wording above.
- Tech Lead/PO: reverse-pyramid RIR placement (leave as is vs. ask about the heaviest set).
- Low priority: `1–2` stored as 2.

## Sources
- Helms ER, Cronin J, Storey A, Zourdos MC. Application of the repetitions in reserve-based RPE scale for resistance training. Strength Cond J. 2016;38(4):42-49.
- Zourdos MC et al. Novel resistance training-specific RPE scale measuring repetitions in reserve. J Strength Cond Res. 2016;30(1):267-275.
- Halperin I et al. Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. Sports Med. 2022;52:377-390.
- Graham T, Cleather DJ. Autoregulation by "repetitions in reserve" leads to greater improvements in strength over a 12-week training program than fixed loading. J Strength Cond Res. 2021;35(9):2451-2456.
- Refalo MC et al. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis. Sports Med. 2023;53:649-665.
- Approved GymStudio specs: 2026-10-07-progression-engine-spec.md (R1.1/R2.1), 2026-10-07-continuous-learning-spec.md (1.1, 1.3), 2026-10-10-progress-interpretation.md (W4/W5), 2026-10-09-progress-insight-thresholds.md (§5), 2026-10-10-progress-trends.md (§6-7), 2026-10-18-ab-days-and-progression.md (X6).
