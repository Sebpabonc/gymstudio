---
title: Suggested start card, short copy (first exposure)
status: approved
author: pt-fitness-expert
created: 2026-11-07
approved_by: Sebas (PO)
approved_on: 2026-11-07
exercises: [dumbbell-bench-press, back-squat, wide-grip-chest-press, lat-pulldown]
---

## Summary
PO feedback (2026-11-07): the first-exposure "Suggested start" card (7 lines, #423) is too long. This draft cuts it to the
headline plus 2 short lines and keeps the three points that matter for safety and clean data: warm-ups are not logged,
about 3 reps in reserve, and change the weight freely. It changes only the card text in section 3 ("Card text on the first
exposure") of `approved/2026-11-07-first-session-starting-weights.md`. The numbers, rules, exceptions and safety notes there stay.

## Exercises
No catalogue or engine changes. The ids above are only used in the examples below.

## 1. The new card (when a suggested weight is shown)

Always 3 lines, in this order:

1. **Headline**: one of the headline keys in section 2. The unit ("per dumbbell", "total, including the bar") appears only
   in the headline, and only for that equipment.
2. **Warm-up**: `workout.trainer.firstSession.warmupShort`
3. **Effort + adjust**: `workout.trainer.firstSession.effortAdjust`

Nothing else is shown when a suggested weight is present. No "same weight", pyramid or reverse-pyramid line, no
"adjust" line, no "log one dumbbell / total" line and no "next target" line.

Example, `dumbbell-bench-press`, intermediate, 3 × 10:
> Suggested start: 12 kg per dumbbell.
> Warm up with 1-3 lighter sets first. Don't log them.
> Aim for 10 reps with about 3 to spare. Change the weight if needed.

Example, `wide-grip-chest-press`, intermediate, pyramid 15-12-10-8:
> Suggested weights are filled in for each set, up to 25 kg.
> Warm up with 1-3 lighter sets first. Don't log them.
> Aim for 15-8 reps with about 3 to spare. Change the weight if needed.

(`{target}` is whatever `trainerRangeLabel` gives today. No change to how the target is built.)

## 2. Exact strings

### Body lines (NEW)

| Key | EN | ES |
|---|---|---|
| `workout.trainer.firstSession.warmupShort` **NEW** | Warm up with 1-3 lighter sets first. Don't log them. | Calienta primero con 1 a 3 series más ligeras. No las registres. |
| `workout.trainer.firstSession.effortAdjust` **NEW** | Aim for {target} reps with about 3 to spare. Change the weight if needed. | Haz {target} reps y que te queden unas 3 de sobra. Cambia el peso si hace falta. |

### Headlines

Existing keys stay unchanged:

| Key | When | EN | ES |
|---|---|---|---|
| `suggested` | Straight / superset / deload, equipment not below | Suggested start: {weight} kg. | Peso sugerido para empezar: {weight} kg. |
| `suggestedDumbbell` | Dumbbell | Suggested start: {weight} kg per dumbbell. | Peso sugerido para empezar: {weight} kg por mancuerna. |
| `suggestedKettlebell` | Kettlebell | Suggested start: {weight} kg per kettlebell. | Peso sugerido para empezar: {weight} kg por pesa rusa. |
| `suggestedBar` | Barbell, EZ bar, hex bar | Suggested start: {weight} kg total, including the bar. | Peso sugerido para empezar: {weight} kg en total, con la barra incluida. |
| `suggestedSets` | Pyramid / reverse pyramid, other equipment | Suggested weights are filled in for each set, up to {weight} kg. | Ya tienes un peso sugerido para cada serie, hasta {weight} kg. |
| `suggestedDrop` | Drop set, other equipment | Suggested start: {weight} kg, then about {drop} kg for the drop. | Peso sugerido para empezar: {weight} kg y luego unos {drop} kg para la bajada. |

NEW headline variants, so the unit is still stated on pyramid and drop-set cards now that the separate "log one dumbbell /
log the total" line is gone (today those two headlines do not say the unit):

| Key | When | EN | ES |
|---|---|---|---|
| `suggestedSetsDumbbell` **NEW** | Pyramid / reverse pyramid, dumbbell | Suggested weights per dumbbell are filled in for each set, up to {weight} kg. | Ya tienes un peso sugerido por mancuerna para cada serie, hasta {weight} kg. |
| `suggestedSetsBar` **NEW** | Pyramid / reverse pyramid, barbell / EZ bar / hex bar | Suggested totals, including the bar, are filled in for each set, up to {weight} kg. | Ya tienes un peso total sugerido, con la barra incluida, para cada serie, hasta {weight} kg. |
| `suggestedDropDumbbell` **NEW** | Drop set, dumbbell | Suggested start: {weight} kg per dumbbell, then about {drop} kg for the drop. | Peso sugerido para empezar: {weight} kg por mancuerna y luego unos {drop} kg para la bajada. |
| `suggestedDropBar` **NEW** | Drop set, barbell / EZ bar / hex bar | Suggested start: {weight} kg total with the bar, then about {drop} kg for the drop. | Peso sugerido para empezar: {weight} kg en total con la barra y luego unos {drop} kg para la bajada. |

"When" uses the same `firstSessionLoad` / kettlebell checks the card uses today. The ES text is informal "tú", has no
gendered adjectives about the user, and contains no English.

### Not changed
- Excluded exercises (assisted machines, uncatalogued; spec 2.5) keep their current card (`effortFind`, `adjustFind`,
  technique line, unit line, `log`). Nothing is prefilled there, so the pyramid line and the unit line still do a job.
- Bodyweight / band card (`firstSession.bodyweight`, one line) is unchanged.
- `workout.firstDay.intro`, `workout.firstDay.pain` and the medical notice are unchanged and still shown where they are today.
- Old keys (`warmup`, `effort`, `same`, `adjust`, `dumbbell`, `barbell`, `log`, `pyramid`, `reversePyramid`) stay in the
  dictionaries if the excluded card still uses them. The Tech Lead decides which ones become unused.

## 3. Why each removed point is safe to drop

| Removed line | Why it is safe |
|---|---|
| "Start light and add a little weight over…" (wording of the warm-up line) | The new warm-up line keeps both parts that matter, 1-3 lighter sets and "don't log them" (F10), and only drops the description of how to ramp. |
| "It should let you finish {target} reps with about 3 more left in you." | Kept in shorter form in the effort + adjust line, which still gives the target and the about-3-reps margin (F9). |
| "Use that weight on every set." | The same weight is already prefilled in every set, so the screen shows it without the sentence. |
| Pyramid / reverse-pyramid line ("Add/take off about 10%…") | With a suggested start the per-set weights are already filled in, so the user does not need to work out the 10% steps. |
| "Too heavy or too light after your warm-up? Change it. That's normal today." | Merged into "Change the weight if needed", and the warm-up line just before it already places the check after the warm-up. |
| "Log the weight of one dumbbell." | The headline already says "per dumbbell" (also on the new pyramid and drop-set variants), and the prefilled number is per dumbbell. The F13 check (confirm above 60 kg) still catches a typo. |
| "Log the total weight, including the bar." | The bar headline already says "total, including the bar", and the prefilled number is that total. |
| "Your next target will start from what you log." | This explains the engine and does not affect safety. The engine follows the logged weight either way, and the "Change the weight" line already tells the user to log what they really lifted. |

## Decisions (PO 2026-11-07)
The PO approved the 3-line card with "about 3 to spare", and the 4 headline variants are implemented.
`{target}` stays as `trainerRangeLabel` gives it.

### Original open points
1. ⚠️ REVISAR (PO): the card stays at 3 lines (headline + 2). Showing only the headline plus the warm-up line is shorter,
   but it drops the 3-reps-in-reserve margin, which I consider a safety point for new lifters (F9). I do not recommend it.
2. ⚠️ REVISAR (PO): "with about 3 to spare" / "unas 3 de sobra" replaces "about 3 more left in you". I think it reads
   faster for regular gym-goers. If you prefer the old wording, use "Aim for {target} reps with about 3 more left in you."
   / "Haz {target} reps y que aún te queden unas 3 más."
3. ⚠️ REVISAR (Tech Lead): the 4 new headline variants only matter if dumbbell or barbell pyramids/drop sets exist in a
   template. If none do today, they can still be added so the unit is never lost later. Your call on keys and implementation.
4. ⚠️ REVISAR (Tech Lead): for pyramids `{target}` can show a wide range (for example "15-8"). If that reads oddly, use the
   heaviest set's reps instead, which matches spec 2.4. Wording is unchanged either way.
5. Approval effect: this replaces the "Card text on the first exposure" table (suggested cases only) and test cases L1-L3
   in `approved/2026-11-07-first-session-starting-weights.md`. New expected orders:
   - L1 (straight dumbbell, EN and ES): `suggestedDumbbell`, `warmupShort`, `effortAdjust`. No English in ES.
   - L2 (pyramid, machine): `suggestedSets`, `warmupShort`, `effortAdjust`. Dumbbell pyramid: `suggestedSetsDumbbell` first.
   - L3 (drop set): `suggestedDrop` (or the `Dumbbell` / `Bar` variant) with both numbers, `warmupShort`, `effortAdjust`.
   - L4 (excluded exercise) unchanged.
   - New L5: no suggested-start card has more than 3 lines, in either language.

## Sources
- Helms ER et al. (2016). Application of the repetitions in reserve-based RPE scale for resistance training. *Strength
  Cond J* 38(4):42-49. Basis for keeping the about-3-reps-in-reserve line.
- Halperin I et al. (2022). Accuracy in predicting repetitions to task failure in resistance exercise. *Sports Med*
  52:377-390. New lifters misjudge effort, so the margin stays in the short version.
- GymStudio approved documents: `2026-11-07-first-session-starting-weights.md` (section 3 card text, L1-L4),
  `2026-11-01-first-run-and-same-day-start.md` (F9 effort, F10 warm-ups not logged, F13 typo limits).
  Code read: `src/trainer/presentation.ts` (card line order), `src/i18n/sections/workout.ts` (EN and ES strings).
