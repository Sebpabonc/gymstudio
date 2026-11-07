# Kling text-to-video prompts: 5-exercise pilot

Owner: Socialer. Status: **draft for the PO's Kling test (2026-11-07)**. Pilot and route context:
`docs/marketing/exercise-videos.md`. Clip spec: `.claude/agents/socialer.md` ("Exercise technique videos").

Movement text uses only the approved `posture_tips` in `docs/fitness/approved/catalogue-v2/*.json`, written as
what the camera sees. Nothing here is a new fitness claim. **The PT approves the technique of every clip before use.**

## How to use
1. Kling, **Text to Video**. Paste the **Prompt** (it already contains the style block) and the **Negative prompt**.
2. Settings, the same for all 5:
   - Duration: **5 s**
   - Aspect ratio: **1:1** (make 9:16 later from the approved take, or rerun the same prompt at 9:16)
   - Mode: **highest quality available** (Professional / Master, whatever the plan shows)
   - Creativity vs relevance (or "CFG"): slide **toward relevance** (about 0.7-0.8 if it is a number)
   - Camera movement: **none / static**, if the option is shown
3. Make 2-3 takes per exercise. Keep the best one and save it outside git (scratchpad), named with the catalogue id,
   e.g. `barbell-bench-press_kling_take2.mp4`.
4. Check the take with the checklist below, then record it in `docs/marketing/video-assets.md` (service, plan,
   date, prompt used, licence terms of the plan). Only a paid plan that grants commercial use counts for the app.

## Shared style block (already pasted into every prompt below)
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
```

---

## 1. barbell-bench-press (Barbell Bench Press)

**Prompt**
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
Side view of a flat bench press in a power rack with safety arms set. The athlete lies on the flat bench with eyes under the bar, both feet planted flat on the floor, glutes, upper back and head touching the bench, shoulder blades pinched down and back, a slight arch in the lower back. Hands grip a plain steel barbell with plain plates, just wider than shoulder width. Start: arms straight, bar held over the shoulders. The athlete lowers the bar slowly over about 2-3 seconds to the lower chest, elbows angled about 45 degrees from the torso, forearms vertical at the bottom, the bar touches the chest lightly without bouncing, then presses the bar up and slightly back to finish over the shoulders with straight arms. Feet, hips and head stay still the whole time.
```

**Negative prompt**
```
extra limbs, extra fingers, distorted hands, hands passing through the bar, bent or melting barbell, bouncing the bar off the chest, elbows flared out to the sides at 90 degrees, hips lifting off the bench, head lifting, feet sliding or lifting, wrists bent far back, uneven bar, spotter, other people, mirror reflections, camera movement, zoom, cuts, fast jerky motion, multiple repetitions, text, captions, watermark, logos
```

**Check when it comes back**
- Eyes under the bar at the start; feet planted; glutes, upper back and head stay on the bench.
- Grip just wider than shoulders; forearms vertical at the bottom.
- Lowering takes about 2-3 s to the lower chest; touches without bouncing.
- Elbows about 45-70 degrees from the torso, not flared to 90.
- Bar finishes over the shoulders; start and end frames match. Safety arms visible.

---

## 2. lat-pulldown (Cable Lat Pulldown, Wide Grip)

**Prompt**
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
Side view of a plain lat pulldown cable machine with a long straight bar and an unbranded weight stack. The athlete sits with the thigh pad snug over the thighs, feet flat on the floor, gripping the bar overhand, wider than the shoulders. Start: arms straight overhead, bar at the top. The torso leans back only a few degrees with the chest up and the lower back neutral. The athlete pulls the bar down in front of the face to the upper chest, holds for one second, then lets the bar rise slowly over 2-3 seconds back to straight arms overhead. The torso stays at the same small lean the whole time; the bar always stays in front of the head.
```

**Negative prompt**
```
extra limbs, extra fingers, distorted hands, hands passing through the bar, bar pulled behind the neck, torso rocking or swinging back, leaning far back, standing up, thighs lifting from the pad, weight stack slamming, cable disappearing or bending, rounded lower back, other people, mirror reflections, camera movement, zoom, cuts, fast jerky motion, multiple repetitions, text, captions, watermark, logos
```

**Check when it comes back**
- Thigh pad snug; overhand grip wider than the shoulders.
- Small backward lean, chest up, lower back neutral; no rocking.
- Bar comes to the upper chest in front of the face, never behind the neck.
- About a one-second pause at the bottom, then a slow 2-3 s rise to full stretch.
- Cable and stack move together (no floating bar); start and end frames match.

---

## 3. dumbbell-romanian-deadlift (Dumbbell Romanian Deadlift)

**Prompt**
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
Side view of a dumbbell Romanian deadlift. The athlete stands tall with feet hip-width apart, holding one plain dark dumbbell in each hand in front of the thighs, shoulders pulled back. The athlete pushes the hips back slowly over 2-3 seconds, the back stays flat and straight, and the dumbbells slide down close along the front of the legs to the shins. The descent stops before the back would round. Then the athlete drives the hips forward to stand tall again, dumbbells staying close to the legs, shoulders back.
```

**Negative prompt**
```
rounded back, hunched shoulders, dumbbells drifting away from the legs, dumbbells hanging forward, dumbbells touching the floor, squatting down instead of hinging, extra limbs, extra fingers, distorted hands, dumbbells merging with hands, feet sliding or moving, heels lifting, fast jerky motion, other people, mirror reflections, camera movement, zoom, cuts, multiple repetitions, text, captions, watermark, logos
```

**Check when it comes back**
- Feet hip-width and still; one dumbbell per hand in front of the thighs at the start.
- Movement is the hips going back (a hinge), not a squat.
- Dumbbells stay close to the legs all the way to the shins; they never hang forward.
- Back stays flat; it never rounds at the bottom. This is the most likely AI failure.
- Shoulders back; about 2-3 s down; start and end frames match.

---

## 4. leg-extensions-toes-dorsiflexed-neutral (Machine Leg Extension)

**Prompt**
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
Side view of a plain seated leg extension machine with an unbranded weight stack. The athlete sits with the back against the back pad, hands gripping the side handles, hips down on the seat. The knee is lined up with the machine's pivot point and the padded roller rests on the front of the lower legs just above the ankles. Start: knees bent, roller low. The athlete straightens both legs all the way up in about one second, holds the legs straight at the top for one second, then lowers the roller slowly over 2-3 seconds back to the start. The back and hips stay on the pads the whole time.
```

**Negative prompt**
```
swinging the weight up, roller dropping fast, hips lifting off the seat, back leaving the pad, roller on the shins or feet, knees not aligned with the machine pivot, legs passing through the pad, machine parts bending or melting, extra limbs, extra legs, distorted hands, weight stack slamming, other people, mirror reflections, camera movement, zoom, cuts, multiple repetitions, text, captions, watermark, logos
```

**Check when it comes back**
- Knee in line with the machine pivot; roller just above the ankle.
- Back on the pad, hands on the handles, hips stay down.
- Full extension in about 1 s, about a 1 s hold at the top, slow 2-3 s lowering.
- No swing up, no roller drop; the machine looks like a real, working machine.
- Start and end frames match.

---

## 5. push-up (Push-Up)

Camera note: side view first. If side takes hide the body line (an arm blocks it), rerun with the camera turned
45 degrees: replace "Side view of a push-up" with "45-degree front-side view of a push-up".

**Prompt**
```
Realistic video of one adult athlete with an athletic build, short neat hair, plain dark charcoal t-shirt and plain dark shorts, dark training shoes, no logos or text on clothing. Modern gym with a dark, uncluttered background, matte dark walls, no mirrors, no other people, no brand logos. Soft, even studio lighting, no harsh shadows. Static camera on a tripod at hip height, no camera movement, no zoom, no cuts. Full body always in frame. Realistic speed. The athlete performs exactly one slow, controlled repetition, starting and ending in the same position so the clip loops. No text, no captions, no music.
Side view of a push-up on a plain dark gym floor mat. Start: high plank, hands on the floor slightly wider than the shoulders, arms straight, legs extended, balanced on the toes, glutes and abs tight, body in one straight line from head to heels. The athlete lowers the whole body as one piece over about 2 seconds until the chest nearly touches the floor, then pushes back up to straight arms. The straight head-to-heels line stays the same the whole time: hips do not sag and do not pike up.
```

**Negative prompt**
```
sagging hips, hips piking up, bent body, knees touching the floor, head dropping, chest crashing to the floor, hands sliding, feet sliding, extra limbs, extra fingers, distorted hands, hands sinking into the floor, arms bending backwards, fast jerky motion, other people, mirror reflections, camera movement, zoom, cuts, multiple repetitions, text, captions, watermark, logos
```

**Check when it comes back**
- Hands slightly wider than the shoulders; legs extended into a plank.
- Straight line head to heels for the whole clip; no sagging or piking hips.
- About 2 s down until the chest nearly touches the floor; back up to straight arms.
- Hands and feet stay planted; start and end frames match.

---

## Not in these prompts, on purpose
- Squeeze cues and safety notes (spotter, knee irritation, dropping to knees) are app text, not things to film.
- No new cues beyond the posture tips (for example no knee-angle instructions for the RDL). If a clip shows
  something the tips don't cover, the PT decides whether it is acceptable.

## For the PO
- Use a paid Kling plan whose terms grant commercial use; free-tier output can't go in the app.
- Record the plan name and the date you read its terms, for `docs/marketing/video-assets.md`.
- Clips go to the PT for technique approval before anything else happens with them.
