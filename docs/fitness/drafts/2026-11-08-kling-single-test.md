---
title: Kling single test clip, blended founder character (incline dumbbell curl)
status: draft            # draft | approved | rejected
author: pt-fitness-expert
created: 2026-11-08
approved_by:
approved_on:
exercises: [dumbbell-curl-incline]
---

## Summary
One 5-second 1:1 Kling test clip with the new blended founder character ("the man from the reference
element"). The exercise is `dumbbell-curl-incline`. It is useful to the app and is the one most likely to work
first time. The movement text comes only from the approved `posture_tips` in
`docs/fitness/approved/catalogue-v2/arms-core.json`. The prompt applies the lessons from the 38 earlier takes:
a simple timeline, one rep tied to the clock, redundant position anchors, one "NOT", a range anchor, no console
and a wide frame.

## Exercises

### Dumbbell Curl (Incline) (`dumbbell-curl-incline`)
- **Primary / secondary muscles:** Biceps / Forearms.
- **Why this one:**
  - **Simple kit.** Only a common adjustable bench and two small hex dumbbells: no machine, no console, no
    cable, no plates with raised letters.
  - **Stable position.** He sits leaning back. That is far less likely to flip than a face-down or chest-on-pad
    setup, and the face stays visible all the time.
  - **Two phases only.** Up, then down. The motion is short and continuous, with no long hold that invites a
    second rep.
  - **Easy to judge.** The two classic faults are elbows drifting forward and the grip turning into a hammer
    curl. Both are easy to spot from a 40° front-side view.
  - **Fills a gap.** We have no arm clip yet, and biceps curls are among the most-viewed exercises.
- **Rejected alternatives:**
  - `standing-db-lateral-raises` and `cable-lateral-raise`: in earlier takes the hands overshot shoulder height.
  - `dumbbell-chest-supported-row`: face-down positions flip.
  - `romanian-deadlift`: plates tend to get raised letters, and the barbell may be swapped for an EZ bar.
  - `rope-low-cable-oh-tricep-extensions`: the cable setup and the facing direction are often confused.
- **Camera:** front-side view from his left, about 40° off straight-front, lens at seated chest height. It
  shows the face, both arms and the elbow path against the bench.
- **[PT choice]:** back pad at about 50° (inside the 45-60° tip). Both arms curl together. The top position is
  dumbbells in front of the shoulders with the upper arms still vertical. Lowering takes 2.5 s.

```prompt
Realistic video, square frame, of the man from the reference element: athletic man about 30, short dark hair, short dark beard. No tattoos, no jewellery, no earrings, no watch, no wristbands, no cap. He wears a plain black t-shirt, plain black shorts, plain black socks and plain black shoes, with no logos, stripes or text. Plain gym, dark matte wall, no mirrors, no machines, no screens, no other people. Soft even light on his face and body. Static camera on a tripod, no movement, no zoom, no cuts. Wide shot: his whole body from head to feet and the whole bench in frame, with empty margin on every side. Camera in front of him and to his left, about 40 degrees off straight-front, lens at seated chest height; his face and both arms clearly visible. Equipment: one plain black adjustable bench, back pad reclined to about 50 degrees, and two small plain black hexagonal dumbbells with smooth heads, no numbers. Position: he sits on the seat and leans back with his back, shoulders and head resting on the pad, chest facing up and forward, NOT chest against the pad. Feet flat on the floor in front of the bench. Arms hang straight down beside the bench, palms facing forward. Slow, continuous movement: 0-0.5 s still; 0.5-2 s he curls both dumbbells up together until they are in front of his shoulders; 2-2.5 s still at the top; 2.5-5 s he lowers them slowly until both arms are fully straight. Exactly one repetition: the clip ends the moment the arms are straight again, so the last frame matches the first. Form: upper arms stay vertical and still, elbows pointing at the floor, never moving forward; palms stay turned forward and up, never turning inward; head and shoulders stay on the pad; legs and torso stay still. No text, no captions, no logos, no music.
```

Kling settings: 5 s, 1:1, reference element = blended founder character.

**Check**

Critical (any fail = reject):
- (critical) Exactly one repetition. The clip ends as the arms reach straight, with no second curl starting.
- (critical) His back, shoulders and head are on the inclined pad, facing forward. He is not chest-down on the
  pad (spider curl), not on a preacher bench, not on a flat bench.
- (critical) The upper arms stay vertical with the elbows pointing at the floor. The elbows do not swing
  forward during the curl.
- (critical) Palms face forward/up all the way (underhand grip). No hammer grip and no wrist rotation.
- (critical) He reads as the reference character: same face, short dark hair, short beard. No tattoos, no
  watch, no earrings, no jewellery, no cap.

Other checks:
- Full range: arms fully straight at the bottom, both at the start and at the end. At the top the dumbbells
  are in front of the shoulders, not a half curl. They do not overshoot by pulling the elbows up.
- Both arms move together. The lowering (about 2.5 s) is clearly slower than the curl (about 1.5 s).
- The first and last frames match: arms straight and hanging, same body position.
- Head, feet and the whole bench are in frame with margin on every side, and nothing is cut off.
- Plain black hex dumbbells with no numbers or letters. No logos on the shoes or clothes. No machine, console
  or screen in the background. No mirrors and no other people.
- Feet stay flat on the floor. Legs and torso stay still, with no rocking.
- Camera is static. The view is front-side from his left; the face and both arms are visible.

## ⚠️ Open decisions
- ⚠️ REVISAR: the lowering is 2.5 s, while the approved tip says "lower over 3 seconds". The 3 s eccentric was
  shortened so the clip fits a simple 4-phase timeline in 5 s with no slow phase that invites a second rep.
  Accept 2.5 s for the video, or use 0-0.5 still / 0.5-1.5 up / 1.5-2 top / 2-5 down (3 s down, but a faster
  curl).
- ⚠️ REVISAR: the clip ends on the last frame of the lowering, not on a still hold. This follows the
  "ends the moment the weight returns" lesson. If the app loop needs a still last frame, add 0.3 s still at
  the end and shorten the lowering.
- ⚠️ REVISAR: the description of the blended character (about 30, short dark hair, short beard) is generic on
  purpose so it doesn't fight the reference element. If the element already locks the face well, these words
  can be cut.

## Sources
- Approved posture tips for `dumbbell-curl-incline`: `docs/fitness/approved/catalogue-v2/arms-core.json`.
- Earlier prompt style and Check lists: `docs/fitness/drafts/2026-11-08-kling-video-prompts-20.md`.
- Failure lessons from 38 earlier Kling takes (caller's notes).
