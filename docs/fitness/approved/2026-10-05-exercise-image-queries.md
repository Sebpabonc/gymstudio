---
title: Google Images search queries for every catalogue exercise
status: approved
approved_on: 2026-10-05
approved_by: Tech Lead on PO request (image links feature)
author: pt-fitness-expert
created: 2026-10-05
approved_by:
approved_on:
exercises: [all 227 ids in docs/fitness/approved/catalogue-v2/*.json — see the companion JSON]
---

## Summary
Sebas asked that tapping an exercise name opens a Google Images search so users can see the
movement and the machine. This draft proposes one search query per catalogue exercise.
The data is in `docs/fitness/drafts/2026-10-05-exercise-image-queries.json` (id → query).
The Tech Lead builds each link as `https://www.google.com/search?tbm=isch&q=<URL-encoded query>`.

Coverage: 227 / 227 catalogue ids (legs-glutes 65, back 45, chest-shoulders 56, arms-core 61),
each exactly once, no extra ids.

## Rules used
1. English, 3–8 words (hyphenated terms such as `push-up` count as one word).
2. Lead with what a lifter would actually type: equipment + movement + the key variant
   (grip, angle, single-arm/single-leg, rope/V-bar/straight bar, high-to-low, seated/standing).
3. Name the machine type for machine and plate-loaded exercises
   (e.g. `seated leg curl machine`, `pendulum squat machine`).
4. Leave out coaching cues and tempo words that don't change the picture
   (e.g. `toes-dorsiflexed-neutral`, `long-steps`, `glutes-dominant`, `weighted`).
5. Add `exercise` or `form` only when the name alone is ambiguous or could return unrelated
   images (e.g. `dumbbell pullover exercise bench`, `dead bug exercise`, `plank`).
6. Generic terms only: no brand names, no URLs, no quotes. Characters are lowercase letters,
   digits, spaces and hyphens.
7. Where the catalogue name differs from common gym language, use the common term so the
   results are better:
   - Hex-bar → `trap bar` (the more common generic search term for the same bar).
   - Plate-loaded leg press → `45 degree leg press machine`.
   - Barbell T-bar row → `landmine t-bar row v handle` (the free-barbell version, so results
     aren't dominated by the chest-supported machine, which has its own id).

## ⚠️ Open decisions
- ⚠️ REVISAR: `wide-grip-cable-chest-pulls` (Cable Pull to Chest, Wide Grip) → `standing cable wide grip row to chest`. This isn't a widely named exercise, so the image results may mix face pulls and seated rows.
- ⚠️ REVISAR: `hor-back-extensions-glutes-dominant` (Back Extension, Horizontal, Glute Focus) → `horizontal back extension bench glutes`. Results may mix 45-degree benches and glute-ham developers.
- ⚠️ REVISAR: `db-60-y-raises` (Dumbbell Y-Raise, Incline) → `incline bench dumbbell y raise prone`. Some results may show standing Y-raises.
- ⚠️ REVISAR: `barbell-t-bar-row` → see rule 7. The PO should confirm that this id means the landmine/free-bar version and not a T-bar row station.
- ⚠️ REVISAR: `close-grip-dips` (Dip, Close Grip) → `triceps dip parallel bars upright`. Close-grip dip images are scarce, so this uses the triceps-dip framing, which looks the same.
- ⚠️ REVISAR: the offset-grip curls (`standing-db-offset-grip-curls`, `db-curls-offset-grip`) are a niche variant, so image results will mostly show regular dumbbell curls. That's acceptable visually, but worth noting.
- Product note (not a fitness decision): Google Images results are third-party and can change.
  The images aren't vetted for correct technique, so the app's own posture tips remain the
  reference.

## Sources
- No external text used. The queries come from the approved catalogue (`name_en`, `equipment`,
  posture tips for context) and standard gym terminology.
