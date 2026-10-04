---
title: Decline-bench ab angles and angle_degrees review (issue #93)
**Status:** approved — Tech Lead on PO delegation (2026-10-04). Block 9 keeps -20 for progression; block 2 reverse crunch note accepted.
author: pt-fitness-expert
created: 2026-10-04
approved_by:
approved_on:
exercises: [reverse-crunch-decline, crunch-decline, decline-sit-up, ez-bb-preacher-curls, single-db-preacher-curls, machine-preacher-curl, machine-chest-press-incline, seated-leg-curl-toes-dorsiflexed-neutral, machine-seated-leg-curl-single-leg, machine-seated-calf-raise, wide-grip-cable-row, single-hand-cable-unilateral-rows, wide-grip-supp-seated-row, neutral-grip-supp-rows, unilateral-supp-rows-reverse-grip, plate-loaded-low-row]
---

## Summary
Three decline-bench ab exercises (6 rows in `approved/training-blocks/blocks.json`) are done on an
adjustable decline bench but have `angle_degrees: null`, so the app shows no angle chip. This draft
proposes one angle per row, confirms that the fixed-machine/cable exercises correctly stay `null`, and
proposes a validator rule so this can't slip through again.

## 1. Recommended angles for decline-bench ab exercises

Same angle on the A and B day of a block: B days only add reps, and keeping the bench setting
identical makes the two days comparable. Difficulty increases across the year (block 2 → 5 → 9) by
moving from a gentle decline to a moderate one; load (a plate) is the other lever.

| Block | Block id | Day key | Code | Exercise id | Current | Recommended `angle_degrees` | Proposed `notes` (≤ 80 chars) | Coaching reason |
|---|---|---|---|---|---|---|---|---|
| 2 | `block-2026-03-30-hypertrophy-reverse-pyramid` | `lower-body-a` | F1 | `reverse-crunch-decline` | `null` | **-15** | `Curl your hips up off the pad; lower your legs slowly.` | 20-rep sets: a gentle decline keeps the hips curling (abs) instead of the legs swinging (hip flexors); low lower-back stress for less advanced lifters. |
| 2 | `block-2026-03-30-hypertrophy-reverse-pyramid` | `lower-body-b` | F1 | `reverse-crunch-decline` | `null` | **-15** | `Curl your hips up off the pad; lower your legs slowly.` | Same as A day; higher reps, same setting so progress is comparable. |
| 5 | `block-2026-08-17-hypertrophy-reverse-pyramid` | `lower-body-a` | F1 | `crunch-decline` | `null` | **-15** | keep `Hold a plate on your chest.` | The plate already adds load; a moderate decline keeps the neck and lower back comfortable while the abs work hard for 15 reps. |
| 5 | `block-2026-08-17-hypertrophy-reverse-pyramid` | `lower-body-b` | F1 | `crunch-decline` | `null` | **-15** | keep `Hold a plate on your chest.` | Same as A day; 20-rep sets with a plate, so the angle stays moderate. |
| 9 | `block-2027-02-08-hypertrophy-reverse-pyramid-iii` | `lower-body-a` | F1 | `decline-sit-up` | `null` | **-20** | keep `Hold a plate on your chest when bodyweight gets easy.` | Later block, more trained lifter: a slightly steeper decline adds range and resistance without load; still short of steep settings that load the lower back. |
| 9 | `block-2027-02-08-hypertrophy-reverse-pyramid-iii` | `lower-body-b` | F1 | `decline-sit-up` | `null` | **-20** | keep `Hold a plate on your chest when bodyweight gets easy.` | Same as A day; 20 reps at bodyweight is a solid hypertrophy stimulus at this angle. |

General coaching rationale (for the PO, not for the app):
- Steeper decline = harder rep (more of the body works against gravity) and more hip-flexor pull,
  which tends to arch and stress the lower back. For hypertrophy-focused 15–20 rep sets, -15 to -20
  is enough; steeper settings (-30 and beyond) are better saved for low-rep, advanced work.
- Neck safety (crunch, sit-up): the load is held on the chest, not behind the head, so the neck is
  never pulled; this is already covered by the catalogue posture tips, so it isn't repeated in notes.
- Proposed note for the reverse crunch fills the empty `notes` field with the most common mistake
  (swinging the legs instead of curling the pelvis). Crunch and sit-up notes stay as they are; they
  add information the chips don't show.
- If someone feels lower-back pain during these, they should reduce the decline or stop and get it
  checked by a qualified professional.

## 2. Fixed machines, pads and cables: do they need an angle?

All of these are currently `null` in `blocks.json`; that is correct for every one.

| Exercise (id) | Needs angle? | Reason |
|---|---|---|
| EZ-Bar Preacher Curl (`ez-bb-preacher-curls`) | No | The preacher pad angle is built into the bench; the user only sets seat height. |
| Dumbbell Preacher Curl, Single-Arm (`single-db-preacher-curls`) | No | Same fixed preacher pad. ⚠️ REVISAR: only if Sebas's gym does it over an adjustable bench back. |
| Machine Preacher Curl (`machine-preacher-curl`) | No | Fixed machine path and pad; nothing to set except seat height. |
| Machine Chest Press (Incline) (`machine-chest-press-incline`) | No | The incline is the machine's fixed pressing path; the name already says incline. |
| Machine Seated Leg Curl (`seated-leg-curl-toes-dorsiflexed-neutral`) | No | Fixed seat; setup is back-pad and knee alignment, not a bench angle. |
| Machine Seated Leg Curl, Single-Leg (`machine-seated-leg-curl-single-leg`) | No | Same machine, same reason. |
| Machine Seated Calf Raise (`machine-seated-calf-raise`) | No | Fixed seat and knee pad; there is no bench to incline. |
| Cable Seated Row, Wide Grip (`wide-grip-cable-row`) | No | Cable row on a fixed flat seat with a foot plate; torso angle is a technique cue. |
| Cable Seated Row, Single-Arm (`single-hand-cable-unilateral-rows`) | No | Same cable station, same reason. |
| Machine Chest-Supported Row (`wide-grip-supp-seated-row`, `neutral-grip-supp-rows`, `unilateral-supp-rows-reverse-grip`) | No | Fixed chest pad on a machine; not an adjustable bench. |
| Plate-Loaded Low Row (`plate-loaded-low-row`) | No | Fixed-path plate-loaded machine. |

For contrast: `dumbbell-chest-supported-row` uses an adjustable bench and correctly already has
an angle (30 or 45) in blocks 7 and 9.

## 3. Proposed validator rule (plain English, for the Tech Lead)

For every exercise in a block, look up its catalogue entry:

1. **Angle required:** if the exercise's `name_en` contains "Decline" or "Incline" **and** its
   `equipment` is not `machine` or `cable`, then `angle_degrees` must not be `null`.
   (This catches the three ab exercises, whose equipment is `bodyweight`, and exempts
   `machine-chest-press-incline`.)
2. **Sign must match the name:** if `name_en` contains "Decline", `angle_degrees` must be below 0
   (between -45 and -1). If it contains "Incline", it must be above 0 (between 1 and 89).
3. **Smith machine is not exempt:** Smith-machine incline/decline presses use an adjustable bench
   under the bar, so they still need an angle. ⚠️ REVISAR: the Tech Lead should confirm how Smith
   exercises are recorded in the catalogue `equipment` field so the exemption doesn't catch them.
4. Optional, as a warning rather than an error: flag any exercise with `equipment` `machine` or
   `cable` that has a non-null `angle_degrees` (likely a data-entry mistake), unless the PT
   documents a reason.

## ⚠️ Open decisions
- ⚠️ REVISAR: Decline ab benches are often labelled by notch, not in degrees. -15 and -20 are
  typical low/middle settings; Sebas should confirm his gym's bench reaches these, or we pick the
  nearest setting.
- ⚠️ REVISAR: Should block 9's sit-up use -20 (progression, recommended) or stay at -15 to match
  blocks 2 and 5 for simplicity?
- ⚠️ REVISAR: Single-arm dumbbell preacher curl: confirm it is done on a fixed preacher bench.
- PO decision: accept the new note for the reverse crunch (block 2), or leave it empty.

## Sources
- NSCA, *Essentials of Strength Training and Conditioning* (4th ed.): exercise technique and
  trunk-flexion guidance (general reference, not quoted).
- McGill, S., *Low Back Disorders* (3rd ed.): spine loading in sit-ups and hip-flexor contribution
  (general reference, not quoted).
- GymStudio `docs/fitness/training-blocks-spec.md` (angle_degrees rules) and
  `docs/fitness/approved/catalogue-v2/*.json` (exercise names and equipment).
