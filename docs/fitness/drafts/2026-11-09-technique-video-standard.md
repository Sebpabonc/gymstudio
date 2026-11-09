---
title: Exercise technique video standard and production-route view (fitness side)
status: draft            # draft | approved | rejected
author: pt-fitness-expert
created: 2026-11-09
approved_by:             # Sebas, when approving
approved_on:
exercises: [barbell-bench-press, machine-chest-press-incline, dumbbell-fly-incline, dumbbell-fly, barbell-t-bar-row, neutral-grip-lat-pulldown, dumbbell-chest-supported-row, barbell-overhead-press, cable-lateral-raise, dumbbell-curl-incline, ez-bar-overhead-triceps-extension, cable-curl-straight-bar, cable-triceps-pushdown-reverse-grip, dumbbell-rear-delt-fly-chest-supported, barbell-front-squat, leg-extensions-toes-dorsiflexed-neutral, smith-machine-hip-thrust, machine-seated-leg-curl-single-leg, leg-press-calf-raises-toes-neutral, decline-sit-up]
---

## Summary
This sets the technique standard every exercise clip must meet, whichever way Marketing makes it
(AI video, a filmed trainer, or licensed 3D). The app format comes from issue #442: a 5 s silent loop,
one rep, side view, shown under the exercise name, with a slow-motion option. It covers the
must-show checklist, sorts the current plan's 20 exercises (and the catalogue in broad terms) by how
well AI handles them, and gives my view on the route. **My view: film real reference clips for anything
outside the "easy" group.** AI text-to-video passed 8 of 20 and fails in ways that teach wrong technique.
Integration and cost are for the Tech Lead and the PO. Style and brand belong to Marketing and UXer.

The illustration spec (`docs/fitness/drafts/2026-10-06-exercise-illustration-spec.md`) still applies
for muscles, equipment details and the "must not show" list. This document adds the rules that only
matter for motion.

---

## 1. The standard every clip must meet

### 1.1 Global pass/fail checklist (applies to every clip)
Each item is pass/fail. One fail means the clip is rejected or sent back. Items marked **(auto-reject)**
are never accepted as "close enough", because they teach the wrong exercise or an unsafe habit.

**A. Rep and loop**
1. **Exactly one rep (auto-reject).** One concentric and one eccentric phase, no extra partial rep and
   no "bounce" that looks like a second rep. Exception: alternating movements (see 1.4).
2. **Loop seam.** The first and last frames match: same joint positions, same equipment position and
   no visible jump when the loop restarts.
3. **Start position matches the catalogue/block.** For example, presses start at lockout (barbell) or at
   the stretch (dumbbells, block notes). See column "Frame 1" in section 3.

**B. Range of motion**
4. **Full prescribed range (auto-reject if short or excessive).** The rep reaches the catalogue end
   points. It never stops short of the stretch and never goes past the cap (for example, lateral raises
   stop at shoulder height).
5. **Fixed joints stay fixed (auto-reject).** Joints meant to stay still do not move: upper arms on curls
   and extensions, torso on raises and pulldowns, hips on leg curls and extensions. Tolerance: about
   10° of drift. Anything clearly visible in the frame strip fails.

**C. Tempo**
6. **Controlled tempo inside 5 s.** Target split (±0.3 s per phase):

   | Phase | Target |
   |---|---|
   | Hold at frame 1 | 0.3-0.5 s |
   | Lifting (concentric) | 1.0-1.5 s, smooth, no jerk |
   | Pause at turnaround | 0.3-0.5 s (1 s if the block note asks for a squeeze, e.g. pushdown lockout) |
   | Lowering (eccentric) | 2.0-2.5 s, visibly slower than the lift |
   | Settle back to frame 1 | 0.3-0.5 s |

   For exercises that start at the stretch, the order is: stretch hold → lift → pause → lower. For barbell
   presses and squats it is: top → lower → bottom → lift → top. Either order fills about 5 s.
7. **No momentum.** No hip drive, torso swing, kick or bounce at the bottom unless the exercise calls for it
   (none of the current 20 do).

**D. Equipment fidelity**
8. **Correct equipment type (auto-reject).** It is the machine or implement named by the id, not a look-alike
   (see 3.1 for the signature features of each). A chest fly is not a rear-delt fly. A leg extension is not a leg curl.
9. **Setup details are visible and correct:** bench angle within ±5° of the block/catalogue value, pulley
   height, attachment (rope, V-handle, straight bar, EZ bar), grip type and width, pad positions, foot
   position, and whether one or both sides work.
10. **Physically plausible load:** plates on both sides with collars on barbells, cables taut through the
    whole rep, and handles that stay attached. No objects merging, no extra hands or fingers, nothing passing through the body.
11. **Safety setup shown where the block requires it:** safety pins or arms on bench press and front squat,
    and a landmine or corner anchor on the T-bar row.

**E. Person and scene**
12. **Clean presenter (auto-reject for text):** plain clothes with no logos or text. No watch, jewellery or
    visible tattoos. Proper training shoes. The same presenter across the library (Marketing's call).
13. **No text, numbers or brand names** anywhere in the frame: plates, consoles, walls or clothes.
14. **Neutral head and neck** and a natural face. No exaggerated strain expressions.

**F. Camera**
15. **Locked-off camera:** no pan, zoom or cut. Level horizon. The whole working chain is in frame for
    the full rep (for example, bar plus feet on a squat).
16. **Correct angle for the pattern** (1.2). Camera height is at about the moving joint (hip height for squats
    and hinges, bench height for presses).
17. **Slow-motion ready:** the source must play smoothly at 0.5x. Filmed footage: 60 fps minimum, 120 fps
    preferred. AI or 3D: at least 30 fps native. ⚠️ REVISAR: at 24 fps, AI clips will look choppy at 0.5x
    unless the Tech Lead adds frame interpolation, which is a technical decision.

### 1.2 Camera angle per movement pattern
Issue #442 says "side view". Side view is correct for most exercises, but for a few the key error cannot be
judged from the side. The illustration-spec rule still holds: **if the key error can't be seen from
this angle, the angle is wrong for this exercise.**

| Pattern | Angle | Key thing the angle must show |
|---|---|---|
| Squat (barbell, Smith, hack, pendulum) | Side 90° | Depth, torso angle, knee travel, heels down |
| Hinge (RDL, back extension, hip thrust) | Side 90° | Neutral spine, hips moving back/up, shin angle |
| Lunge / split squat / step-up | Side 90°, working leg nearest camera | Stride length, front shin, rear knee |
| Horizontal push (bench, chest press, fly) | Side 90°, camera at bench height or slightly above (~15-20°) | Bench angle, bar/DB path over chest, elbow angle |
| Vertical push (overhead press) | Side 90° | Bar path close to the face, stacked lockout, no lean back |
| Horizontal pull (rows, chest-supported) | Side 90° | Torso angle, elbows past ribs, chest stays on pad |
| Vertical pull (pulldowns, pull-ups) | **Side 90° for the lean, or front-quarter 45°** | Side view caught the 35° lean. 45° also shows grip and elbow path. Pick one per id. |
| Curls, triceps extensions, pushdowns, leg curl/extension, calves | Side 90° | Fixed upper arm or thigh, joint angle at each end |
| Lateral raises (DB, cable, machine) | **Front 0° or front-quarter 30°** | Hand height vs shoulder, arms in the scapular plane. Side view can't show how high the arm goes. |
| Rear-delt fly (any) | **Rear-quarter 45° from above, or front-quarter 45°** | Arms sweep out to the sides, not forward; no shrug |
| Cable fly (high/mid/low) | **Front-quarter 45°** | Arc direction, fixed elbow bend |
| Core (sit-up, crunch, leg raise, ab wheel) | Side 90° | Spinal curl vs hip flexion, low back position |

⚠️ REVISAR: three patterns (lateral raises, rear-delt flys, cable flys) need a front or 45° view, which
differs from #442's "side view". In the current plan that is 2 exercises (`cable-lateral-raise`,
`dumbbell-rear-delt-fly-chest-supported`). Across the catalogue it is about 20 ids. My recommendation is to
allow these exceptions.

### 1.3 One rep vs two
- **Default: one rep**, always.
- **Unilateral done one side at a time** (single-leg curl, one-arm cable lateral raise): one rep of one
  side, working side nearest the camera. The app text says "each side". Mirrored clips are not needed.
- **Alternating movements** (walking lunges, alternating curls): one left plus one right counts as "one
  cycle" and is allowed if it fits in 5 s at the target tempo. Otherwise show one side.
- Never two reps "to show the rhythm". In the AI tests, the second rep is exactly what hid ROM errors.

### 1.4 Equipment fidelity: what makes an id "the same exercise"
A clip may cover only its own id. If the variant shown changes any of the following, it is the wrong
exercise (same rules as the illustration spec 2.2):
bench angle class, grip type, pulley height/direction, body position (standing/seated/lying/prone),
equipment type, unilateral vs bilateral, or a foot position encoded in the id (e.g. `toes-dorsiflexed`).

---

## 2. Which exercises AI can handle

### 2.1 Why AI fails where it does (from the 20-clip Kling test, 8 passed)
- **Uncommon equipment is "corrected" to a common one.** The model has seen far more chest flys,
  presses, sleds and leg extensions than rear-delt flys, chest-supported rows, landmine T-bars and seated
  leg curls. It swaps toward the common one. Prompting does not reliably fix this.
- **Fine joint angles drift toward the "average" exercise.** Lateral raises went above the shoulder.
  Curl elbows came forward. The pulldown leaned back about 35°. These are exactly the errors coaches
  correct, so a clip that shows them teaches the error.
- **Rep count and tempo are not controllable.** A slow 5 s clip leaves time that the model fills with a
  second rep.
- **Scene noise** (watches, tattoos, console text) needs extra takes but is not a technique risk.

### 2.2 The current plan's 20 exercises
Source: the latest block in `blocks.json`, `block-2027-02-08-hypertrophy-reverse-pyramid-iii` (20 unique
ids). The test failures (T-bar, chest-supported row, rear-delt fly, seated leg curl, lateral raise, curls)
match this list.

**Easy for AI (7):** common equipment, big visible joints, and a ROM that is hard to get badly wrong.
| id | Why easy | Still check |
|---|---|---|
| `barbell-bench-press` | Most-seen lift; standard rack | Safety arms, bar touches lower chest, wrists stacked |
| `dumbbell-fly` | Flat bench, simple arc | Elbow bend stays fixed (not a press) |
| `barbell-overhead-press` | Common standing press | Bar path close to face, no lean back, plates/collars |
| `machine-chest-press-incline` | Any incline press machine reads correctly | Handles start beside the chest, not overhead |
| `cable-curl-straight-bar` | Common, side view easy | Elbows pinned, no hip swing |
| `leg-extensions-toes-dorsiflexed-neutral` | AI knows this machine (it even made one where it shouldn't) | Toes pulled up, hips on seat, full lockout |
| `decline-sit-up` | Simple bodyweight on decline bench | Feet hooked, decline visible, controlled lowering |

**Risky for AI (9):** the equipment is fine, but the lesson depends on an angle, grip or small ROM.
Expect several takes, and review them frame by frame.
| id | Risk |
|---|---|
| `dumbbell-fly-incline` | Block uses a 15° low incline; AI defaults to 30-45° |
| `neutral-grip-lat-pulldown` | Torso lean must stay ≤10-15° (failed at ~35°); neutral V/parallel handle often becomes a straight bar |
| `cable-lateral-raise` | Must stop at shoulder height (failed), one arm, low pulley, cable behind the body |
| `dumbbell-curl-incline` | 60° bench, arms hanging behind torso, elbows fixed (failed: drift forward) |
| `ez-bar-overhead-triceps-extension` | EZ bar shape (AI draws straight bars), elbows pointing up and not flaring, seated upright |
| `cable-triceps-pushdown-reverse-grip` | Underhand grip is the whole point; AI tends to show overhand. Elbows pinned, 1 s lockout |
| `barbell-front-squat` | Front-rack bar on the shoulders with high elbows; AI tends to turn it into a back squat. Pins required |
| `smith-machine-hip-thrust` | Smith (not free barbell), upper back on bench, shins vertical at the top, ribs down, no low-back arch |
| `leg-press-calf-raises-toes-neutral` | Only the ankles move; AI tends to turn it into a leg press with bending knees |

**Should be filmed (4):** uncommon equipment that AI swaps, or a setup that is itself the lesson.
| id | Why |
|---|---|
| `barbell-t-bar-row` | Landmine/corner-anchored bar plus V-handle under the plates, about 45° torso. AI made it a sled |
| `dumbbell-chest-supported-row` | Lying face-down on a 45° bench. AI turned it into a press (it reads "bench plus dumbbells" as pressing) |
| `dumbbell-rear-delt-fly-chest-supported` | Face-down on a 30° bench, arms sweeping out to the sides. AI made a chest fly (face-up) |
| `machine-seated-leg-curl-single-leg` | Seated curl machine, one leg, thigh pad. AI made a leg extension (the opposite movement) |

⚠️ REVISAR: the Kling notes list the 8 passes by take number (5, 6, 8, 12, 13 trimmed, 14v1, 17, 18). I don't
have the number-to-id mapping, so I could not check that every pass falls in my "easy" or "risky" group.
Marketing should send the mapping. Any passed clip still needs to go through the section 1 checklist,
because the earlier review used a shorter checklist.

### 2.3 The catalogue in broad terms (about 227 ids)
This is an estimate from the `equipment` and `movement_pattern` fields plus the names, not a per-id audit.
- **Easy for AI (about 30-35%):** standard barbell and dumbbell presses and squats, push-ups, planks
  and simple bodyweight core, common machines (leg press, leg extension, chest press, lat pulldown with
  a straight bar), and straight-bar or rope cable curls and pushdowns.
- **Risky for AI (about 40%):**
  - ids defined by an angle (incline/decline degrees, 45° vs horizontal back extensions, 60° Y-raises);
  - ids defined by a grip (neutral, reverse, offset, underhand, EZ vs straight);
  - ids defined by a cable path (behind-the-body laterals, Bayesian curls, high/mid/low flys);
  - fixed-joint isolations (all curls, lateral raises, skull crushers, kickbacks, overhead extensions);
  - hinges (spine position: RDL, good morning);
  - foot-position ids (`toes-dorsiflexed`, `heels-elevated`);
  - alternating or unilateral free-weight work.
- **Should be filmed (about 25-30%):**
  - all **plate-loaded** machines (pendulum squat, hack squat, plate-loaded rows, pulldowns, presses,
    chest-supported T-bar), because they look different from brand to brand and AI blends them;
  - **uncommon selectorised machines** (reverse pec deck, seated/prone/standing leg curls, hip-thrust
    machine, lateral-raise machine, preacher machine);
  - all **face-down "chest-supported" dumbbell work** and **landmine** work;
  - **hanging/loaded bodyweight** (weighted chin-ups and dips with a belt, hanging leg raises, ab wheel),
    where the body path and the load attachment both matter;
  - **pairs of ids that differ only by a small detail.** AI cannot be trusted to show the difference, and
    if it can't, the two clips would be identical.

---

## 3. Per-exercise must-show sheet (current plan)

Columns: frame 1 / turnaround / camera / equipment signature (what proves it's the right machine) /
auto-reject. Bench angles come from `angle_degrees` in the block.

| id | Frame 1 → turnaround | Camera | Equipment signature | Auto-reject |
|---|---|---|---|---|
| `barbell-bench-press` | Lockout over shoulders → bar on lower chest | Side, bench height | Flat bench in rack, safety arms set, plates + collars | Bar bouncing off chest; hips lifting; flared 90° elbows |
| `machine-chest-press-incline` | Handles beside upper chest (stretch) → arms extended | Side | Incline seat with back pad, converging or fixed handles | Shoulders rolling off pad; lockout snap |
| `dumbbell-fly-incline` | Arms open at chest level (stretch) → DBs above upper chest | Side, slightly above | Bench at **15°** | Bench ≥30°; elbows bending into a press |
| `dumbbell-fly` | Arms open (stretch) → DBs above chest | Side, slightly above | Flat bench 0° | Elbows bending/straightening; DBs below shoulder line with straight arms |
| `barbell-t-bar-row` | Arms straight, torso ~45° → handle at lower chest | Side | Bar end anchored (landmine/corner), V-handle under plates, straddle stance | Sled/machine shown; rounded back; torso rising to upright |
| `neutral-grip-lat-pulldown` | Arms straight overhead (stretch) → handle at upper chest | Side (or 45°) | High pulley, **neutral/parallel handle**, thigh pad | Lean >15°; straight bar; pulling behind neck |
| `dumbbell-chest-supported-row` | Face-down on **45°** bench, arms hanging → elbows back toward hips | Side | Prone on incline bench, two DBs | Lying face-up; pressing motion; chest lifting off pad |
| `barbell-overhead-press` | Bar at upper chest/collarbone → lockout over mid-foot | Side | Standing, barbell with plates + collars | Big lean back; bar path far in front of face |
| `cable-lateral-raise` | Hand by the hip, cable behind body → arm at shoulder height | Front or front-quarter 30° | Low pulley, single D-handle, one arm, free hand on frame | **Hand above shoulder**; shrug; torso lean to swing |
| `dumbbell-curl-incline` | Arms hanging straight behind torso (stretch) → DBs at shoulder height | Side | Bench at **60°** (block), supinated grip | **Elbows drifting forward**; wrist rotation; shoulders off pad |
| `ez-bar-overhead-triceps-extension` | EZ bar behind head, elbows bent (stretch) → arms extended overhead | Side | Seated upright (90°) with back support, **zig-zag EZ bar** | Straight bar; elbows flaring wide; low-back arch |
| `cable-curl-straight-bar` | Arms straight → bar at shoulders | Side | Low pulley, straight bar | Elbows moving forward; hip swing |
| `cable-triceps-pushdown-reverse-grip` | Forearms at ~90° → full lockout, 1 s hold | Side | High pulley, straight/EZ bar, **underhand grip** | Overhand grip; elbows drifting; leaning over the bar |
| `dumbbell-rear-delt-fly-chest-supported` | Face-down on **30°** bench, arms hanging → arms out to the sides at shoulder line | Rear-quarter 45° from above (or front-quarter 45°) | Prone on bench, light DBs, slight fixed elbow bend | Face-up chest fly; rowing (elbows bending a lot); shrug |
| `barbell-front-squat` | Standing, bar in front rack → thighs at least parallel | Side, hip height | Squat rack with **safety pins set**, bar on front delts, elbows high | Back-squat bar position; elbows dropping; heels lifting |
| `leg-extensions-toes-dorsiflexed-neutral` | Knees bent ~90° or more → legs extended | Side | Leg-extension machine, shin pad above ankle, knee at pivot | Toes pointed; hips lifting; kicking |
| `smith-machine-hip-thrust` | Hips low, upper back on bench → hips fully extended, shins vertical | Side | **Smith bar** across hips (pad), bench behind | Free barbell; low-back hyperextension at top; feet too far |
| `machine-seated-leg-curl-single-leg` | One leg nearly straight → heel pulled under seat | Side, working leg near camera | **Seated** curl machine, thigh pad on top, roller behind the ankle | Leg extension shown; both legs working; hips lifting |
| `leg-press-calf-raises-toes-neutral` | Heels lowered, balls of feet on sled edge → full plantar flexion | Side | Plate-loaded leg press, knees nearly straight and fixed | **Knees bending (a leg-press rep)**; feet fully on the platform; safety stops removed |
| `decline-sit-up` | Lying back on decline, feet hooked → torso up to about vertical | Side | Decline bench with foot hooks | Flat-floor crunch; yanking the neck; dropping fast |

---

## 4. Recommendation on route (technique accuracy only)

| Criterion | AI text-to-video | Filmed real trainer | Licensed 3D (mocap) | AI "restyle" of filmed clip (Motion Control) |
|---|---|---|---|---|
| Correct equipment | Poor for uncommon machines | Exact (it's the real gym) | Only if the vendor has that exact machine | Usually kept from the source; check every frame |
| Joint angles / ROM | Drifts to the average | As good as the trainer | Good if motion-captured, uneven if hand-animated | Mostly kept, but drift is possible |
| One rep, tempo | Not controllable | Fully controllable | Controllable | Copies the source |
| Slow-mo quality | 24-30 fps, choppy | 60-120 fps, smooth | Any fps | Limited by the generator's output |
| Consistency (same look) | Medium | High within one shoot | Very high | High |
| PT review effort | High (many takes, frame-by-frame) | Low (review on set, re-shoot right away) | Medium (check vendor set once) | Medium (compare against the source) |

**My recommendation:**
1. **Film real reference clips** with one trainer in one gym. The camera is locked off at 60-120 fps, side
   view, plus a second camera at 45° or front for the exceptions in 1.2. This is the only route where
   I can guarantee the "should be filmed" and "risky" groups are correct. It also gives ground-truth
   reference footage for any later AI or 3D work. A PT (or this checklist) should be present or reviewing
   live during the shoot, so faults are re-shot on the day.
2. **AI text-to-video only for the "easy" group**, with the section 1 checklist and a hard limit of 2 takes.
   If both fail, the exercise moves to the filming list. Do not use it for the "should be filmed" group.
3. **AI restyle of a filmed clip** (the Motion Control recipe from the lat pulldown) is acceptable as a way to
   get a consistent presenter. It is reviewed like a new clip, frame by frame against the source, because
   the generator can still drift.
4. **Licensed 3D** is acceptable for free-weight and bodyweight exercises if the motion is motion-captured
   and the vendor's clip matches the id exactly (bench angle, grip, cable path). It is unlikely to cover our
   plate-loaded and uncommon machines. Ask the vendor for their machine list before buying.

### 4.1 What I need to review each clip quickly
Marketing should send one package per clip:
1. **The final clip at native fps** (plus its fps, length and resolution).
2. **Frame strip, 11 evenly spaced frames** (the current Swift extraction), **plus 4 key frames:**
   first, last (loop seam), the turnaround (end of range), and the middle of the lowering phase.
3. **A first-vs-last overlay** (50% opacity), so I can see the loop seam at a glance.
4. **A 0.5x slow-motion render**, the way the app will play it.
5. **The filled checklist header:** id, block `angle_degrees`, camera angle used, prompt or shoot notes,
   take number, and Marketing's own pre-check of items 1, 8, 12 and 13 (rep count, right equipment, no
   text or jewellery). Clips that fail the pre-check never reach me.

My verdict per clip: **Pass / Fix (item numbers) / Reject (item numbers)**. With this package, a
clean clip takes about 1-2 minutes to review.

---

## Exercises
The 20 current-plan exercises are covered in sections 2.2 and 3. This draft changes no posture tips. The
catalogue `posture_tips` stay the source for the on-screen cues under each video.

## ⚠️ Open decisions
- ⚠️ REVISAR: allow front or 45° camera exceptions to #442's "side view" for lateral raises, rear-delt
  flys and cable flys (about 20 catalogue ids, 2 in the current plan).
- ⚠️ REVISAR: pulldowns, side view (shows lean) or 45° (shows grip and elbows)? I lean to side view for
  pulldowns because the lean was the failure we saw. PO to confirm.
- ⚠️ REVISAR: slow motion with 24 fps AI footage will be choppy. Should we accept it, ask the Tech Lead
  for interpolation, or require 60 fps (filming only)?
- ⚠️ REVISAR: map the 8 passed Kling takes to ids and re-check them against this full checklist before
  any goes in the app.
- ⚠️ REVISAR: the catalogue percentages in 2.3 are estimates. A per-id classification of all 227 ids can be
  a follow-up draft if the PO wants the full filming list.
- ⚠️ REVISAR: a filmed trainer needs a signed release, and a new person needs consent for any AI
  restyle. That is Governancer/PO territory, not fitness.
- Safety note for the app copy (unchanged): videos show technique only. If an exercise causes pain, stop
  and see a qualified professional.

## Sources
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed., exercise technique chapters (start/end
  positions, controlled tempo, spotting and safety setup).
- ACE Exercise Library, https://www.acefitness.org/resources/everyone/exercise-library/
- ExRx.net exercise directory, https://exrx.net/Lists/Directory
- GymStudio internal: `docs/fitness/approved/catalogue-v2/*.json`, `docs/fitness/approved/training-blocks/blocks.json`
  (block 9), `docs/fitness/drafts/2026-10-06-exercise-illustration-spec.md`, `docs/marketing/exercise-videos.md`,
  and the Kling 20-clip test notes (2026-11-08).
