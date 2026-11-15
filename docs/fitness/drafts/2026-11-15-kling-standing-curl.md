---
title: Kling prompt, standing dumbbell curl (Seb, Omni reference)
status: draft            # draft | approved | rejected
author: pt-fitness-expert
created: 2026-11-15
approved_by:
approved_on:
exercises: [standing-dumbbell-curl]
---

## Summary
One 5-second 1:1 Kling 4.0 Omni reference prompt for `standing-dumbbell-curl`, using the reference element
"Seb" (the real Seb, with his own arm and leg tattoos, which stay in). The movement text comes only from the
approved entry in `docs/fitness/approved/catalogue-v2/arms-core.json` (posture tips + squeeze cue). The look
matches last week's liked clips: dark matte black studio, dark rubber floor, soft studio light, all-black kit,
one hex-dumbbell rack against the back wall for depth.

Today's failed takes are addressed directly:
- **Hammer-grip drift:** the dumbbells are hexagonal. The underhand grip is described at the start, the bottom
  (palms forward, handles left-to-right), the top (palms facing him, handles still horizontal) and the end,
  plus one "NOT a hammer curl, dumbbells never vertical".
- **Watch appearing:** "bare wrists, no watch, no bracelet" is in the first sentence.
- **Tempo / one rep:** both arms together; 0.5 s still, 1.5 s up, 0.5 s hold, 2.5 s down; the last frame
  matches the first.
- **Camera:** three-quarter front from his left, about 30 degrees, so both palms and both elbows are visible.
  Never a side profile. Whole body in frame, static tripod.

## Exercises

### Dumbbell Curl (Standing) (`standing-dumbbell-curl`)
- **Primary / secondary muscles:** Biceps / Forearms.
- **Camera:** three-quarter front from his left, about 30 degrees off straight-front, lens at chest height.
  From this angle you can judge grip orientation (palms forward vs. facing in), elbow drift and torso lean.
  The right-arm tattoo is still visible as an identity check.
- **[PT choice]:** feet hip-width; both arms together; top position is the dumbbells in front of the
  shoulders with the upper arms still at his sides; knees soft and still.

```prompt
Realistic video, square frame, of Seb, the man from the reference element: same face, short dark beard, his real arm and leg tattoos kept as in the reference, bare wrists, no watch, no bracelet, no jewellery, no cap. Plain black t-shirt, plain black shorts, plain black socks, plain black shoes, no logos or text. Dark matte black studio, dark rubber floor, soft even studio light on his face and body, no mirrors, no screens, no other people. Behind him against the wall, a black hex dumbbell rack, never in front of him. Static camera on a tripod, no movement, no zoom, no cuts. Three-quarter front view from his left, about 30 degrees off straight-front, lens at chest height; both palms and both elbows clearly visible; never a side profile. Whole body head to feet in frame, margin on every side. He holds two plain black hexagonal dumbbells, no numbers, with an underhand grip for the whole rep. Start: standing tall, feet hip-width, arms straight at his sides, palms facing forward, each handle running left-to-right, the hex heads on the left and right of each hand. NOT a hammer curl, dumbbells never vertical. Exactly one repetition, both arms together: 0-0.5 s still; 0.5-2 s he curls both dumbbells up to the front of his shoulders, palms now facing him, handles still horizontal left-to-right; 2-2.5 s still at the top, biceps squeezed; 2.5-5 s he lowers both slowly until the arms are fully straight, palms facing forward again. The lowering is slower than the curl. The clip ends the moment the arms are straight, so the last frame matches the first. Underhand grip from first to last frame; wrists never rotate. Elbows stay pinned at his sides, never moving forward; torso upright and still, no leaning back, no swinging; legs still. No text, no captions, no logos, no music.
```

Kling settings: Kling 4.0 Omni reference, 5 s, 1:1, reference element = "Seb".
Length: about 1,790 characters (under the 1,900 limit).

**Check**
- (critical) Underhand grip for the whole rep. At the bottom the palms face forward and the handles run
  left-to-right; at the top the palms face him. It never becomes a hammer grip (dumbbells vertical, palms
  facing in), and the wrists do not rotate.
- (critical) The dumbbells are hexagonal and plain black, with no numbers or letters.
- (critical) Exactly one repetition. Both arms curl together, and no second curl starts.
- (critical) Bare wrists: no watch, bracelet or wristband in any frame.
- (critical) He reads as Seb: same face and beard, his real arm and leg tattoos present, no cap, no jewellery.
- Elbows stay at his sides through the curl; they don't drift forward, and the torso doesn't lean back or swing.
- Full range: arms fully straight at the start and end, dumbbells in front of the shoulders at the top (not
  a half curl). There is a short visible hold at the top.
- Tempo: the lowering (about 2.5 s) is clearly slower than the curl (about 1.5 s). The last frame matches
  the first.
- Camera is a static three-quarter front view; both palms and both elbows are visible; it is never a pure
  side profile. Head and feet are in frame with margin.
- Look: dark matte black studio, dark rubber floor, all-black kit with no logos. The dumbbell rack is only
  against the back wall, never in front of him. No mirrors, screens or other people.

## ⚠️ Open decisions
- ⚠️ REVISAR: the curl takes about 1.5 s. The approved tip says "about 1 second". It was slowed so the video
  model keeps the grip stable through the lift. Accept this for the video, or change it to 0.5-1.5 s up and
  1.5-2.5 s hold.
- ⚠️ REVISAR: the top hold is 0.5 s. The approved squeeze cue says "a one-second hold". With 2.5 s for the
  lowering, a 1 s hold doesn't fit in 5 s. Accept the shorter hold for the video, or shorten the lowering to
  2 s (still inside the approved 2-3 s).
- ⚠️ REVISAR: the clip ends on the last frame of the lowering, not on a still hold, as in the 2026-11-08
  single-test prompt. If the app loop needs a still last frame, take 0.3 s from the lowering.

## Sources
- Approved entry for `standing-dumbbell-curl` (posture tips, squeeze cue):
  `docs/fitness/approved/catalogue-v2/arms-core.json`.
- Prompt style and Check-list format: `docs/fitness/drafts/2026-11-08-kling-single-test.md` and
  `docs/fitness/drafts/2026-11-08-kling-video-prompts-20.md`.
- Failure lessons from today's takes (hammer-grip drift, watch, tempo, camera): the caller's notes.
