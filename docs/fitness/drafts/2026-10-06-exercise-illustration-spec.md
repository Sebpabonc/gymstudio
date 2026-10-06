---
title: Exercise technique illustration spec (pilot: block 6)
status: draft            # draft | approved | rejected
author: pt-fitness-expert
created: 2026-10-06
approved_by:
approved_on:
exercises: [incline-dumbbell-press, plate-loaded-t-bar-row-chest-supported, dumbbell-bench-press, cable-lat-pulldown-underhand-grip, high-cable-fly, cable-straight-arms-pull-downs, cable-crunch, smith-machine-shoulder-press, dumbbell-curl-incline, standing-db-lateral-raises, cable-lateral-raise, rope-low-cable-oh-tricep-extensions, ez-bb-preacher-curls, reverse-pec-deck-fly, plate-loaded-pendulum-squat, romanian-deadlift, dumbbell-bulgarian-split-squat, seated-leg-curl-toes-dorsiflexed-neutral, leg-extensions-toes-dorsiflexed-neutral, standing-calf-raises-toes-neutral]
---

## Summary
Fitness-content spec for one standard technique illustration per exercise (clean 3D figure,
start and end side by side, target muscles highlighted). It defines what a correct image must
show, what it must never show, when variants need their own image, a JSON-ready checklist
(filled for the 20 unique exercises in block 6 as the pilot), and alt-text rules. Sourcing
and visual style belong to the UXer team; integration belongs to the Tech Lead.

## 1. What every illustration must show

### 1.1 Frames
- **Default: 2 frames, left = start, right = end.** "Start" is where the set begins (usually
  the stretched or lowered position for presses/pulls, standing tall for hinges/squats);
  "end" is the turnaround point of the rep.
- **Add a mid frame (3 frames)** only when the path is not obvious from the two ends:
  - the bar/hands travel in an arc or change direction (e.g. RDL hip-hinge path is fine with 2;
    a clean or Turkish get-up needs 3+, out of scope for now);
  - a body segment must stay fixed while another moves and the end frame alone hides it
    (e.g. straight-arm pulldown: elbow stays nearly straight the whole way).
- Same camera, same scale, same figure in all frames; equipment must not move position
  between frames unless it moves in real life.
- Optional thin arrow showing direction of movement (concentric). No text inside the image.

### 1.2 Camera angle by movement pattern
| Pattern | Default camera | Why |
|---|---|---|
| Squat (incl. machine squats) | Side view (90°), slightly front-quarter (~30°) acceptable | Shows depth, torso angle, knee travel over toes |
| Hinge (RDL, deadlift, good morning) | Pure side view (90°) | Spine line and hip-back motion are the whole lesson |
| Lunge / split squat | Side view; front-quarter if knee tracking is the key cue | Shows stride length, front shin angle, rear knee |
| Push horizontal (bench, fly on bench) | Side view at bench height, slightly elevated (~20° above) | Shows bench angle, bar/DB path over the chest, elbow angle |
| Push vertical (overhead/shoulder press) | Front-quarter (~30-45°) | Shows bar path relative to face and elbow position |
| Pull horizontal (rows) | Side view | Shows torso angle, elbow path past the ribs |
| Pull vertical (pulldown, pull-up) | Front-quarter (~30-45°) or rear-quarter for lats | Shows grip width and elbows travelling down to the ribs |
| Isolation | Plane of the motion: side view for curls/extensions/leg curl/leg ext/calves; front view for lateral raises; rear-quarter for rear-delt flys; front-quarter for cable flys | Joint angle must be readable |
| Core | Side view | Shows spine flexion vs hip flexion |
| Carry | Front-quarter, mid-stride | Shows upright torso, shoulders level, load at sides |

Rule: if the key error for an exercise (section 2) cannot be judged from the chosen angle,
the angle is wrong for that exercise.

### 1.3 Equipment details that must be visible
- **Bench work:** bench angle in degrees matches the exercise (flat 0°, low incline 15-30°,
  standard incline 30-45°, decline about -15 to -30°, upright/shoulder press 75-90°).
  The angle must be visibly correct in side view; the checklist states the target value.
- **Cables:** pulley height (low = near floor, mid = chest, high = above head) and the
  attachment (single handle, rope, straight bar, wide bar, V-handle).
- **Grip:** type (overhand/pronated, underhand/supinated, neutral, EZ angled) and width
  (narrow = inside shoulders, shoulder width, wide = clearly outside shoulders).
- **Stance:** feet width, foot position on platforms, split-stance length, which leg works.
- **Machines:** pad positions that define the movement (shin pad above ankle, thigh pad on
  lower thigh, chest pad, back pad), and the user's joint aligned with the machine pivot.
- **Free weights:** load type correct (barbell with plates, EZ bar, pair of dumbbells,
  single dumbbell).

### 1.4 Muscle highlighting
- Source of truth: the catalogue fields `primary_muscles` and `secondary_muscles`
  (`docs/fitness/approved/catalogue-v2/*.json`). Do not invent extra muscles.
- **Primary:** strong highlight (full-saturation accent colour). **Secondary:** light highlight
  (same hue, about 35-45% opacity, or a lighter tint). Everything else neutral.
- Highlight only on the visible side of the body; if a primary muscle is hidden by the camera
  angle (e.g. lats in pure front view), the angle should change rather than drop the highlight.
- Highlight the same muscles in both frames.
- Region mapping: "Upper Chest" = clavicular pec only; "Chest" = whole pec; "Upper Back" =
  traps (mid/lower) + rhomboids; "Lower Back" = spinal erectors; "Side/Front/Rear Delts" =
  that head only; "Calves" = gastrocnemius + soleus; "Abs" = rectus abdominis.

## 2. Accuracy rules

### 2.1 An image must NOT show (global)
- Rounded lower back under load (hinges, rows, squats, carries).
- Knees caving inward on squats, lunges, leg press.
- Heels lifting on squats/lunges (except calf raises).
- Elbows flared to 90° from the torso on presses; target roughly 45-70°.
- Wrists bent far back under a press or curl load.
- Neck cranked up or chin jutting forward.
- Shrugged shoulders on lateral raises, flys and pulldowns.
- Locked-out hyperextended knees or elbows bearing load.
- Momentum cues (swinging torso, leaning back on curls/raises/pulldowns beyond a slight lean).
- Unsafe equipment state: dumbbells resting on the face/neck, missing collars on loaded
  barbells, cable attachment missing, wrong pulley height, wrong bench angle.
- Range of motion shorter than the catalogue/blocks prescribe (block 6 is stretch-focused:
  start frames must show the full stretch).
- Footwear-less or unsafe gym context; mirrored text or brand logos.

### 2.2 Variants: when one image is enough vs a separate image
**Separate image required** when the variant changes any of:
- bench angle class (flat vs incline vs decline vs upright);
- grip type that changes the working muscle or joint path (underhand vs overhand pulldown,
  neutral vs pronated press, EZ vs straight bar if the catalogue lists them as separate ids);
- pulley height or direction (high-to-low vs low-to-high fly);
- body position (standing vs seated vs lying vs kneeling);
- equipment (barbell vs dumbbell vs Smith vs machine vs cable);
- unilateral vs bilateral (the figure looks different and the cue for stability differs).

**One image may cover** (via text, not the picture):
- small grip-width changes within the same grip type;
- foot angle cues that are hard to see (e.g. "toes dorsiflexed/neutral" ids show the foot
  position, but small toe-angle changes do not need another image);
- tempo, pauses, partials, drop sets, rest-pause (techniques, not technique images).

Rule of thumb: **one image per catalogue `id`**. If two ids would produce an identical
picture, flag them to the PO rather than reusing silently.

**Unilateral exercises:** show the working side nearest the camera; note in alt text that
it is done one side at a time.

## 3. Per-exercise checklist format

```json
{
  "exercise_id": "string, existing catalogue id",
  "frames": ["start: ...", "end: ..."],
  "camera": "side | front | rear | front-quarter | rear-quarter (+ note)",
  "highlighted_primary": ["from catalogue primary_muscles"],
  "highlighted_secondary": ["from catalogue secondary_muscles"],
  "equipment_notes": "bench angle, cable height, attachment, grip type/width, stance, pads",
  "must_avoid": ["specific errors the image must not show"],
  "alt_text": "one short sentence, see section 4"
}
```

### 3.1 Pilot set: block 6 (20 unique exercises)

```json
[
  {
    "exercise_id": "incline-dumbbell-press",
    "frames": ["start: dumbbells lowered beside upper chest, deep stretch, elbows ~45-60° from torso", "end: arms extended over upper chest, dumbbells close but not touching"],
    "camera": "side, slightly elevated",
    "highlighted_primary": ["Upper Chest"],
    "highlighted_secondary": ["Front Delts", "Triceps"],
    "equipment_notes": "Adjustable bench at 30°; pronated or slight-neutral grip; feet flat on floor; shoulder blades back against bench.",
    "must_avoid": ["bench steeper than 45° (turns into a shoulder press)", "elbows flared to 90°", "hips lifted off the bench", "dumbbells stopping well above the chest"],
    "alt_text": "Dumbbells pressed up from the upper chest on a 30-degree incline bench."
  },
  {
    "exercise_id": "plate-loaded-t-bar-row-chest-supported",
    "frames": ["start: arms long, shoulder blades pulled forward by the weight, chest on pad", "end: handles pulled to lower ribs, elbows behind torso, shoulder blades squeezed"],
    "camera": "side",
    "highlighted_primary": ["Upper Back", "Lats"],
    "highlighted_secondary": ["Rear Delts", "Biceps"],
    "equipment_notes": "Chest-supported plate-loaded T-bar machine; chest firmly on the pad; feet on platform; show the grip used (neutral or wide pronated handles).",
    "must_avoid": ["chest lifting off the pad", "neck cranked up", "shrugging toward the ears", "jerking with the lower back"],
    "alt_text": "Chest on the pad, handles rowed from straight arms to the lower ribs."
  },
  {
    "exercise_id": "dumbbell-bench-press",
    "frames": ["start: dumbbells at mid-chest level, deep stretch, forearms vertical", "end: arms extended over the chest"],
    "camera": "side, slightly elevated",
    "highlighted_primary": ["Chest"],
    "highlighted_secondary": ["Triceps", "Front Delts"],
    "equipment_notes": "Flat bench, 0°; pronated grip; feet flat; slight natural arch, glutes on the bench.",
    "must_avoid": ["elbows flared to 90°", "excessive arch with hips off the bench", "wrists bent back", "dumbbells drifting over the face"],
    "alt_text": "Dumbbells pressed up from the chest on a flat bench."
  },
  {
    "exercise_id": "cable-lat-pulldown-underhand-grip",
    "frames": ["start: arms fully extended overhead, lats stretched, thighs under pad", "end: bar at upper chest, elbows down at the ribs"],
    "camera": "front-quarter (or rear-quarter so lats are visible)",
    "highlighted_primary": ["Lats"],
    "highlighted_secondary": ["Biceps", "Upper Back"],
    "equipment_notes": "High pulley, straight or short bar; underhand (supinated) grip about shoulder width; thigh pad snug; slight backward lean (~10-15°) only.",
    "must_avoid": ["pulling behind the neck", "leaning back far / rowing the weight", "shrugged shoulders", "overhand grip (different exercise)"],
    "alt_text": "Seated, palms facing you, bar pulled from overhead down to the upper chest."
  },
  {
    "exercise_id": "high-cable-fly",
    "frames": ["start: arms open slightly behind the body line, soft elbows, staggered stance", "end: hands meet in front of the lower chest/upper abs"],
    "camera": "front-quarter",
    "highlighted_primary": ["Chest"],
    "highlighted_secondary": ["Front Delts"],
    "equipment_notes": "Two pulleys set high (above head); single D-handles; staggered stance one step forward of the towers; fixed slight elbow bend.",
    "must_avoid": ["elbows bending and straightening (turns into a press)", "torso hunched far forward", "shoulders rolled forward at the end"],
    "alt_text": "From open arms, cables pulled down and together in front of the body."
  },
  {
    "exercise_id": "cable-straight-arms-pull-downs",
    "frames": ["start: arms high in front, near straight, slight hip hinge, lats stretched", "mid: arms at shoulder height, elbows still nearly straight", "end: hands at thighs"],
    "camera": "side",
    "highlighted_primary": ["Lats"],
    "highlighted_secondary": ["Triceps", "Rear Delts"],
    "equipment_notes": "High pulley; straight bar or rope; overhand grip shoulder width; standing with slight hinge.",
    "must_avoid": ["elbows bending (turns into a pushdown)", "rounded back", "torso swinging"],
    "alt_text": "Arms kept straight, bar swept from overhead down to the thighs."
  },
  {
    "exercise_id": "cable-crunch",
    "frames": ["start: kneeling, hips high, spine long, rope by the head", "end: spine curled, elbows toward thighs, hips stay still"],
    "camera": "side",
    "highlighted_primary": ["Abs"],
    "highlighted_secondary": ["Obliques"],
    "equipment_notes": "High pulley; rope attachment held beside the head; kneeling facing the stack.",
    "must_avoid": ["hips sitting back to the heels (hip flexion instead of spinal flexion)", "pulling with the arms", "neck yanked down"],
    "alt_text": "Kneeling with a rope by the head, spine curled down toward the knees."
  },
  {
    "exercise_id": "smith-machine-shoulder-press",
    "frames": ["start: bar at chin level, forearms vertical", "end: arms extended overhead, bar over mid-head"],
    "camera": "front-quarter",
    "highlighted_primary": ["Front Delts"],
    "highlighted_secondary": ["Side Delts", "Triceps"],
    "equipment_notes": "Bench at 75° under the Smith bar so the bar passes just in front of the face; pronated grip slightly wider than shoulders; feet flat.",
    "must_avoid": ["bar lowered behind the neck", "lower back arched off the pad", "elbows flared straight out to the sides at 90°", "bench flat or bench too far from the bar"],
    "alt_text": "Seated at 75 degrees, Smith bar pressed from chin height to overhead."
  },
  {
    "exercise_id": "dumbbell-curl-incline",
    "frames": ["start: arms hanging straight down behind torso line, palms forward", "end: dumbbells curled to shoulder height, elbows still pointing down"],
    "camera": "side",
    "highlighted_primary": ["Biceps"],
    "highlighted_secondary": ["Forearms"],
    "equipment_notes": "Bench at 45°; supinated grip; back and head on the pad.",
    "must_avoid": ["elbows swinging forward", "shoulders rolling off the pad", "half range at the bottom"],
    "alt_text": "Lying back on a 45-degree bench, dumbbells curled from straight arms."
  },
  {
    "exercise_id": "standing-db-lateral-raises",
    "frames": ["start: dumbbells at the sides, slight elbow bend", "end: arms raised to shoulder height, elbows leading, slightly in front of the body"],
    "camera": "front",
    "highlighted_primary": ["Side Delts"],
    "highlighted_secondary": [],
    "equipment_notes": "Pair of dumbbells; neutral-to-pronated grip; feet hip width; slight forward lean acceptable.",
    "must_avoid": ["hands above shoulder height with shrug", "torso swinging", "wrists higher than elbows by a lot", "straight locked arms"],
    "alt_text": "Standing, dumbbells raised out to the sides to shoulder height."
  },
  {
    "exercise_id": "cable-lateral-raise",
    "frames": ["start: hand at the opposite hip, cable crossing behind the body, slight lean away", "end: arm at shoulder height out to the side"],
    "camera": "front",
    "highlighted_primary": ["Side Delts"],
    "highlighted_secondary": [],
    "equipment_notes": "Low pulley, single D-handle in the hand farthest from the machine; cable routed behind the body (block 6 note); free hand holds the frame.",
    "must_avoid": ["torso leaning to swing the weight", "shrugging", "elbow bending into a row"],
    "alt_text": "One arm at a time, low cable raised out to the side to shoulder height."
  },
  {
    "exercise_id": "rope-low-cable-oh-tricep-extensions",
    "frames": ["start: elbows fully bent overhead, rope behind the head, triceps stretched", "end: arms extended overhead, rope ends apart"],
    "camera": "side",
    "highlighted_primary": ["Triceps"],
    "highlighted_secondary": [],
    "equipment_notes": "Low pulley, rope; facing away from the stack in staggered stance; upper arms beside the head.",
    "must_avoid": ["elbows flaring wide", "lower back arching hard", "upper arms moving forward/back a lot"],
    "alt_text": "Facing away from a low cable, rope extended from behind the head to overhead."
  },
  {
    "exercise_id": "ez-bb-preacher-curls",
    "frames": ["start: arms almost straight on the pad, slight bend kept", "end: bar curled toward the shoulders, upper arms still on pad"],
    "camera": "side",
    "highlighted_primary": ["Biceps"],
    "highlighted_secondary": ["Forearms"],
    "equipment_notes": "Preacher bench; EZ bar on the angled inner grips (semi-supinated); armpits snug on top of the pad.",
    "must_avoid": ["elbows hyperextended at the bottom", "upper arms lifting off the pad", "hips/shoulders heaving"],
    "alt_text": "Arms on a preacher pad, EZ bar curled up from nearly straight arms."
  },
  {
    "exercise_id": "reverse-pec-deck-fly",
    "frames": ["start: arms forward at shoulder height, near straight, chest on pad", "end: arms swept back to the body line"],
    "camera": "rear-quarter (elevated)",
    "highlighted_primary": ["Rear Delts"],
    "highlighted_secondary": ["Upper Back"],
    "equipment_notes": "Pec deck set to reverse position; handles at shoulder height; neutral or pronated grip; chest on the pad.",
    "must_avoid": ["shrugging", "arms going far past the body line", "chest coming off the pad"],
    "alt_text": "Chest on the pad, arms swept back from the front to the sides."
  },
  {
    "exercise_id": "plate-loaded-pendulum-squat",
    "frames": ["start: standing tall in the pads, knees soft", "end: deep squat, knees forward over toes, back flat on pad"],
    "camera": "side",
    "highlighted_primary": ["Quads"],
    "highlighted_secondary": ["Glutes", "Adductors"],
    "equipment_notes": "Plate-loaded pendulum squat; shoulder pads on; feet mid-platform, about hip width.",
    "must_avoid": ["knees caving in", "heels lifting", "lower back peeling off the pad at the bottom", "knees locked at the top"],
    "alt_text": "In the pendulum machine, a deep squat with knees travelling forward."
  },
  {
    "exercise_id": "romanian-deadlift",
    "frames": ["start: standing tall, bar at the thighs", "end: hips pushed back, bar at mid-shin or just below knee, spine neutral"],
    "camera": "side",
    "highlighted_primary": ["Hamstrings", "Glutes"],
    "highlighted_secondary": ["Lower Back", "Forearms"],
    "equipment_notes": "Barbell with plates and collars; overhand grip just outside the thighs; feet hip width; knees softly bent and fixed.",
    "must_avoid": ["rounded back", "bar drifting away from the legs", "knees bending into a squat", "head cranked up"],
    "alt_text": "Holding a barbell, hips pushed back with a flat back to lower it past the knees."
  },
  {
    "exercise_id": "dumbbell-bulgarian-split-squat",
    "frames": ["start: standing on front leg, rear foot laces-down on bench", "end: rear knee near the floor, slight forward torso lean"],
    "camera": "side (working leg nearest camera)",
    "highlighted_primary": ["Quads", "Glutes"],
    "highlighted_secondary": ["Adductors", "Hamstrings"],
    "equipment_notes": "Flat bench behind at about knee height; dumbbells at the sides; front foot far enough forward that the heel stays down.",
    "must_avoid": ["front knee caving in", "front heel lifting", "rear knee slamming the floor", "stance so short the front knee is far past toes with heel up"],
    "alt_text": "Rear foot on a bench, dumbbells at the sides, front leg lowered into a deep split squat."
  },
  {
    "exercise_id": "seated-leg-curl-toes-dorsiflexed-neutral",
    "frames": ["start: legs nearly straight, toes pulled up, torso leaning slightly forward", "end: heels pulled under the seat"],
    "camera": "side",
    "highlighted_primary": ["Hamstrings"],
    "highlighted_secondary": ["Calves"],
    "equipment_notes": "Seated leg-curl machine; knee aligned with the pivot; thigh pad snug; ankle pad just above the heel; toes dorsiflexed and pointing straight up.",
    "must_avoid": ["hips lifting off the seat", "knee out of line with the pivot", "toes pointed"],
    "alt_text": "Seated, toes pulled up, heels curled down and under the seat."
  },
  {
    "exercise_id": "leg-extensions-toes-dorsiflexed-neutral",
    "frames": ["start: knees deeply bent, pad on lower shin", "end: legs extended, quads squeezed, toes up"],
    "camera": "side",
    "highlighted_primary": ["Quads"],
    "highlighted_secondary": [],
    "equipment_notes": "Leg-extension machine; knee aligned with the pivot; shin pad just above the ankle; toes dorsiflexed and neutral; hands on side handles.",
    "must_avoid": ["hips lifting off the seat", "knee out of line with the pivot", "kicking/swinging"],
    "alt_text": "Seated, toes pulled up, legs extended from deeply bent knees."
  },
  {
    "exercise_id": "standing-calf-raises-toes-neutral",
    "frames": ["start: heels dropped below the step, deep calf stretch", "end: up on the balls of the feet, heels high"],
    "camera": "side",
    "highlighted_primary": ["Calves"],
    "highlighted_secondary": [],
    "equipment_notes": "Standing calf-raise machine; shoulder pads on; balls of feet on the platform edge, toes straight ahead, hip width.",
    "must_avoid": ["knees bending to bounce", "rolling to the outside of the foot", "half range (no heel drop)"],
    "alt_text": "Standing under shoulder pads, heels lowered below the step then raised high."
  }
]
```

## 4. Alt-text rules
- One sentence, max about 15 words, plain language, no exercise name repetition needed
  (the name is already on screen).
- Describe: body position, equipment/setup that matters, and the motion from start to end.
- Mention unilateral ("one arm at a time", "front leg") and the key angle only if it is
  the point of the variant (e.g. "30-degree incline").
- No muscle lists, no coaching or safety claims, no "image of".
- Examples:
  - Good: "Dumbbells pressed up from the chest on a flat bench."
  - Good: "Holding a barbell, hips pushed back with a flat back to lower it past the knees."
  - Bad: "Image of a man doing a dumbbell bench press working chest, triceps and shoulders."
  - Bad: "Perfect safe form to build a bigger chest."
- Spanish alt text will be produced as a separate translation draft when requested.

## Notes
- Block 6 note for `cable-lateral-raise` says the cable runs behind the body; the catalogue
  tip says low pulley, far hand. Both fit together; the image follows the block (cable behind).
- `seated-leg-curl-toes-dorsiflexed-neutral` and `leg-extensions-toes-dorsiflexed-neutral`
  ids encode foot position; images must show toes pulled up.
- If any illustration is used while a user reports pain, the app copy elsewhere already says
  to stop and see a qualified professional; images carry no medical message.

## ⚠️ Open decisions
- ⚠️ REVISAR: Smith machine shoulder press: block uses 75°, catalogue name says only "Seated".
  Should the standard image be 75° (matches the block) or 90° (more common)? Recommend 75°.
- ⚠️ REVISAR: Incline dumbbell press image at 30° (block) vs a generic 30-45°. One image per id
  means block angle variations (e.g. 15°, 45°) will not be shown. Acceptable?
- ⚠️ REVISAR: Figure sex/body type: one neutral figure for all, or male and female sets? This
  affects sourcing cost (UXer).
- ⚠️ REVISAR: Should images show the stretch-focused start (block 6 style) for all blocks, or a
  neutral "standard" ROM? Recommend full ROM always; it is correct for every block.
- ⚠️ REVISAR: Secondary highlight opacity (35-45%) is a visual decision for UXer/PO.
- ⚠️ REVISAR: `seated-leg-curl` lists Calves as secondary; with toes dorsiflexed the gastrocnemius
  helps knee flexion, so keeping the light highlight is reasonable, but PO may prefer to omit it
  visually to avoid confusion.
- ⚠️ REVISAR: Licensed stock (Gymvisual-style) images may not match ids exactly (bench angle,
  cable routing, toe position). Policy proposal: reject any image failing a `must_avoid` item
  or a stated equipment note; do not accept "close enough".

## Sources
- NSCA, *Essentials of Strength Training and Conditioning*, 4th ed. (exercise technique chapters).
- ACE Exercise Library, https://www.acefitness.org/resources/everyone/exercise-library/
- ExRx.net exercise directory (movement descriptions and muscle roles), https://exrx.net/Lists/Directory
- W3C WAI alt-text guidance, https://www.w3.org/WAI/tutorials/images/
- GymStudio catalogue-v2 and block 6 (`docs/fitness/approved/`) for muscles, angles and notes.
