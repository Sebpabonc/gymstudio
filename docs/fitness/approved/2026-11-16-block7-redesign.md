---
title: Block 7 redesign after session 1 (3 back exercises, supersets back, max 4 sets)
status: approved
author: pt-fitness-expert
created: 2026-11-16
approved_by: Tech Lead (PO delegated content approvals to the crew on 2026-11-15)
approved_on: 2026-11-16
exercises: [smith-machine-bench-press, plate-loaded-chest-press-incline, neutral-grip-weighted-chin-ups, neutral-grip-supp-rows, high-cable-fly, cable-straight-arms-pull-downs, ez-bb-preacher-curls, rope-low-cable-oh-tricep-extensions, barbell-overhead-press-seated, dumbbell-lateral-raise-seated, reverse-pec-deck-fly, barbell-curl, barbell-jm-press, cable-bayesian-curl, dumbbell-overhead-triceps-extension, back-squat, romanian-deadlift, dumbbell-lunge-reverse, seated-leg-curl-toes-dorsiflexed-neutral, leg-extensions-toes-dorsiflexed-neutral, smith-machine-calf-raise, ab-wheel-rollout]
---

## Summary
Block 7 (`block-2026-11-16-strength-hypertrophy-ii`) is rebuilt after Sebas's first session (Chest-Back A, Mon
16 Nov). His feedback is treated as requirements. The new plan has 3 back exercises on each Chest-Back day (vertical
pull, horizontal row, straight-arm pulldown). Supersets come back on all six days, as in Block 6. No exercise has more
than 4 sets, and each day has 7-8 entries. The block keeps its identity: a reverse-pyramid top set on each A day's
main lift, 6-8 reps on A days and 8-10 on B days, the week-1 and deload rules, the arm emphasis (22 direct sets per
week), and the seated leg curl. Weekly sets: chest 20, back 20, biceps 22, triceps 22, quads 20, hamstrings 14.
It uses the exercises he chose today (plate-loaded incline press, chest-supported neutral row, neutral-grip chin-up),
so the app already has a starting weight for them. The replacement days are in
`docs/fitness/drafts/2026-11-16-block7-days.json`, ready to paste into the block's `"days"`.

## What changes, at a glance

| Day | Before (approved, after migration 040) | After |
|---|---|---|
| Chest-Back A/B | 7 entries, 1 superset (arms), 2 back exercises (barbell row, wide pull-up), dips | 8 entries, 3 supersets, 3 back exercises; barbell row, wide pull-up, incline DB press and dips removed |
| Arms A/B | 6 entries, 1 superset | 7 entries, 3 supersets; rear-delt work added; JM press B pyramid → straight 10s |
| Lower Body A/B | 6 entries, 1 superset (calf + abs) | 7 entries, 2 supersets; leg extension added (with leg curl); lunge 4 → 3 sets; leg curl 4 → 3 (A) / B drop-set → last-set drop |

Removed from Block 7 plan entries only (ids and history untouched): `barbell-bent-over-row`, `pull-up-wide-grip`,
`incline-dumbbell-press`, `dip`. Added to Block 7: `plate-loaded-chest-press-incline`, `neutral-grip-weighted-chin-ups`,
`neutral-grip-supp-rows` (all three logged today), `high-cable-fly`, `cable-straight-arms-pull-downs`,
`reverse-pec-deck-fly`, `leg-extensions-toes-dorsiflexed-neutral` (all four have Block 6 logs).

## The new days (weeks 2-5; week 1 and week 6 rules below)

Superset = first exercise, about 10 s, second exercise, then the listed rest. Rest = after the set.

### Chest-Back A (heavy), 8 entries, 26 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `smith-machine-bench-press` | 4 × 4/6/8/10 | reverse-pyramid | 180 | 0 | Top set of 4 at 1-2 reps in reserve, then about 10% lighter. |
| B1 | `plate-loaded-chest-press-incline` | 3 × 8 | superset | 10 | null | Lower until you feel a deep chest stretch; press up over the upper chest. |
| B2 | `neutral-grip-weighted-chin-ups` | 3 × 8 | superset | 90 | null | Add a belt if easy; use the assisted machine if reps fall short. |
| C1 | `neutral-grip-supp-rows` | 4 × 8 | straight | 120 | null | Let the handles pull your shoulder blades forward, then drive elbows back. |
| D1 | `high-cable-fly` | 3 × 10 | superset | 10 | null | Arms open slightly behind you. Last set: rest-pause, 15 s, 2 mini-sets. |
| D2 | `cable-straight-arms-pull-downs` | 3 × 10 | superset | 75 | null | Same cable tower as the fly; let your arms rise high to stretch the lats. |
| E1 | `ez-bb-preacher-curls` | 3 × 10 | superset | 10 | null | Lower until the elbow is almost straight; never bounce at the bottom. |
| E2 | `rope-low-cable-oh-tricep-extensions` | 3 × 10 | superset | 75 | null | Elbows bend fully overhead; stop 1-2 reps short for the next Arms day. |

### Chest-Back B (volume), 8 entries, 26 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `smith-machine-bench-press` | 4 × 8 | straight | 120 | 0 | Lower the bar to mid-chest in 2-3 seconds every rep. |
| B1 | `plate-loaded-chest-press-incline` | 3 × 10 | superset | 10 | null | (as A) |
| B2 | `neutral-grip-weighted-chin-ups` | 3 × 10 | superset | 90 | null | (as A) |
| C1 | `neutral-grip-supp-rows` | 4 × 10 | straight | 90 | null | (as A) |
| D1 | `high-cable-fly` | 3 × 12 | superset | 10 | null | Last set: add 4-6 half reps with arms wide open. |
| D2 | `cable-straight-arms-pull-downs` | 3 × 12 | superset | 75 | null | (as A) |
| E1 | `ez-bb-preacher-curls` | 3 × 12 | superset | 10 | null | (as A) |
| E2 | `rope-low-cable-oh-tricep-extensions` | 3 × 12 | superset | 75 | null | (as A) |

Order logic: the heavy press goes alone first. Then the incline press is paired with the chin-up (push + vertical
pull, like Block 6's dumbbell bench + underhand pulldown). The row goes alone so it can be loaded heavily. The fly is
paired with the straight-arm pulldown (Block 6's pair, same cable tower). The arm finisher closes the session.

### Arms A (heavy), 7 entries, 28 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `barbell-overhead-press-seated` | 4 × 4/6/8/10 | reverse-pyramid | 180 | 90 | Top set of 4 at 1-2 reps in reserve, then about 10% lighter. |
| B1 | `dumbbell-lateral-raise-seated` | 4 × 10 | superset | 10 | 90 | Last set: myo-reps, 3 mini-sets of 4, 5 breaths rest. |
| B2 | `reverse-pec-deck-fly` | 4 × 12 | superset | 75 | null | Arms long and wide; move from the shoulders, no shrugging. |
| C1 | `barbell-curl` | 4 × 8 | superset | 10 | null | Elbows stay at your sides; no swinging. |
| C2 | `barbell-jm-press` | 4 × 6 | superset | 90 | 0 | If your elbows ache, use 8 reps; never grind a heavy set. |
| D1 | `cable-bayesian-curl` | 4 × 10 | superset | 10 | null | Reps per arm. Last set: add 4-6 half reps in the stretch. |
| D2 | `dumbbell-overhead-triceps-extension` | 4 × 10 | superset | 75 | 90 | Let the dumbbell sink low behind your head for a full stretch. |

### Arms B (volume), 7 entries, 28 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `barbell-overhead-press-seated` | 4 × 8 | straight | 120 | 90 | Lower the bar in 3 seconds every rep. |
| B1 | `dumbbell-lateral-raise-seated` | 4 × 12 | superset | 10 | 90 | Strict, no swinging; lead with the elbows. |
| B2 | `reverse-pec-deck-fly` | 4 × 15 | superset | 75 | null | (as A) |
| C1 | `barbell-curl` | 4 × 10 | superset | 10 | null | (as A) |
| C2 | `barbell-jm-press` | 4 × 10 | superset | 90 | 0 | Smooth reps; if your elbows ache, go lighter. |
| D1 | `cable-bayesian-curl` | 4 × 12 | superset | 10 | null | (as A) |
| D2 | `dumbbell-overhead-triceps-extension` | 4 × 12 | superset | 75 | 90 | (as A) |

Arm pairs are biceps + triceps (antagonists). The delt pair is side delts + rear delts: two light isolation moves
that barely compete. Rear delts had no direct work in Block 7 (the audit graded that Practical). Four sets are added
here because the superset absorbs them at almost no time cost.

### Lower Body A (heavy), 7 entries, 25 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `back-squat` | 4 × 5/6/8/10 | reverse-pyramid | 180 | null | Safety pins set. Top set of 5, 1-2 reps in reserve, never grind. |
| B1 | `romanian-deadlift` | 4 × 8 | straight | 120 | null | Lower in 3 seconds to a strong hamstring stretch. |
| C1 | `dumbbell-lunge-reverse` | 3 × 8 | straight | 90 | null | Reps are per leg. |
| D1 | `seated-leg-curl-toes-dorsiflexed-neutral` | 3 × 8 | superset | 10 | null | Lean your chest forward. Last set: rest-pause, 15 s, then 2 mini-sets. |
| D2 | `leg-extensions-toes-dorsiflexed-neutral` | 3 × 10 | superset | 90 | null | Toes pulled up; slow through the deep bend. |
| E1 | `smith-machine-calf-raise` | 4 × 10 | superset | 10 | null | Pause 2 s at the bottom of every rep. |
| E2 | `ab-wheel-rollout` | 4 × 12 | superset | 60 | null | Roll out further as you get stronger. |

### Lower Body B (volume), 7 entries, 25 hard sets
| Code | exercise_id | Sets × reps | Technique | Rest | Angle | Notes |
|---|---|---|---|---|---|---|
| A1 | `back-squat` | 4 × 8 | straight | 120 | null | Safety pins set; stop 1-2 reps short on every set. |
| B1 | `romanian-deadlift` | 4 × 10 | straight | 120 | null | Hips back to a strong hamstring stretch; keep the spine neutral. |
| C1 | `dumbbell-lunge-reverse` | 3 × 10 | straight | 90 | null | Reps are per leg. |
| D1 | `seated-leg-curl-toes-dorsiflexed-neutral` | 3 × 10 | superset | 10 | null | Lean forward. Last set: drop the weight about 25% and keep going. |
| D2 | `leg-extensions-toes-dorsiflexed-neutral` | 3 × 12 | superset | 90 | null | (as A) |
| E1 | `smith-machine-calf-raise` | 4 × 12 | superset | 10 | null | (as A) |
| E2 | `ab-wheel-rollout` | 4 × 12 | superset | 60 | null | (as A) |

The squat and RDL stay alone (heavy, high-fatigue lifts, never in a superset). Leg curl + leg extension is the
Block 6 antagonist pair. The leg extension also covers the rectus femoris, which squats and lunges barely grow.

### Week rules (unchanged)
- **Week 1** (this week): no top set (do A1 at the back-off weight for all sets), no extras (skip rest-pause,
  myo-reps, half reps, last-set drop), stop with 2-3 clean reps left. Supersets are done as written; they are a
  structure, not an extra. Chest-Back A week 1 is already done (today, old layout). Arms A tomorrow is the first
  day on the new layout.
- **Weeks 2-5:** full plan, 1-2 reps in reserve.
- **Week 6 (deload):** half the sets, rounded up (4 → 2, 3 → 2), no top sets, no extras.

## Weekly direct sets (weeks 2-5, all 6 days done)

"Direct" = the muscle is the main target. Fractional = indirect work counted as half a set (Pelland 2026 method).

| Muscle | Before (approved, Opt. B) | After | Per session (max) | At ~4 sessions/week (× 0.67) | Supported range? |
|---|---|---|---|---|---|
| Chest | 20 | **20** (Smith 8, incline 6, fly 6) | 10 | ~13 | Yes |
| Back (lats + upper back) | 16 | **20** (chin 6, row 8, straight-arm 6) | 10 | ~13 | Yes |
| Side delts | 8 | **8** (+ ~4 fractional from OHP) | 4 | ~5 | Acceptable (unchanged) |
| Rear delts | 0 (+~8 fractional) | **8** (+ ~7 fractional from rows/chins) | 4 | ~5 | Yes |
| Biceps | 22 | **22** (Arms 8 + 8, CB 3 + 3) | 8 | ~15 | Yes, upper end |
| Triceps | 22 | **22** (Arms 8 + 8, CB 3 + 3) | 8 | ~15 | Yes, upper end |
| Quads | 16 | **20** (squat 8, lunge 6, extension 6) | 10 | ~13 | Yes |
| Hamstrings | 15 | **14** (RDL 8, seated curl 6) | 7 | ~9 | Yes (≥10 planned) |
| Calves / abs | 8 / 8 | **8 / 8** | 4 | ~5 | Unchanged |

Every muscle stays at or below 10 direct sets per session, under the ~11-set point where the per-session data stop
showing a detectable gain (Remmert 2025, preprint).

## Estimated minutes per day (weeks 2-5)

Method (same as the approved trim doc, Practical): about 45 s of work per set (75 s for per-arm or per-leg sets), the
prescribed rest after every set, 10 s between superset partners, about 1.5 min to set up each exercise, and a warm-up
of 8 min (A days, ramp sets for the top set) or 6 min (B days).

| Day | Before | After | Hard sets before → after |
|---|---|---|---|
| Chest-Back A | ~75 | **~72** | 24 → 26 |
| Chest-Back B | ~68 | **~64** | 24 → 26 |
| Arms A | ~72 | **~72** | 24 → 28 |
| Arms B | ~66 | **~66** | 24 → 28 |
| Lower Body A | ~75 | **~74** | 24 → 25 |
| Lower Body B | ~68 | **~68** | 23 → 25 |

Supersets let him do 1-4 more hard sets per day in the same or a little less time. Week 1 days run about 5 minutes
shorter (no top set ramp-up, no extras). Deload days run about 35-40 minutes.

## Decisions and evidence grades

| # | Decision | Grade | Evidence and reasoning |
|---|---|---|---|
| 1 | Weekly sets: chest 20, back 20, arms 22, quads 20, hamstrings 14 | **Strong** | More weekly hard sets give more growth, with diminishing returns; 10+ beats fewer (Schoenfeld 2017; Pelland 2026). Back goes 16 → 20, restoring the volume Option B gave up, without any exercise going above 4 sets. |
| 2 | Max 10 direct sets per muscle per session | **Moderate** | Per-session meta-regression: gains keep rising with diminishing returns, no detectable benefit past ~11 fractional sets per session (Remmert 2025, preprint, little high-volume data). |
| 3 | Supersets on all six days (antagonist or non-competing pairs) | **Strong** (equivalent growth, shorter sessions) | Meta-analysis of 19 studies: supersets gave similar hypertrophy and strength to traditional sets in less time. Agonist-antagonist pairs even allowed more reps, while same-muscle pairs reduced volume load. Supersets raised perceived effort and lactate (Zhang 2025). So only opposite or non-competing muscles are paired here; heavy squats, RDLs, top sets and the main row stay alone. |
| 4 | No exercise above 4 sets; volume spread over 3 exercises per muscle group | **Moderate / Practical** | Growth follows hard sets per muscle, not sets per exercise (Schoenfeld 2017). Moderate variation helps regional growth, but excessive rotation does not (Kassiano 2022). The 4-set cap itself is the PO's preference (Practical). It does not conflict with any Strong evidence. |
| 5 | 3 back exercises: neutral chin-up (vertical), chest-supported row (horizontal), straight-arm pulldown (lat, long length) | **Moderate / Practical** | Variation across movement planes is coaching consensus, and growth is regional (Kassiano 2022, Moderate). The straight-arm pulldown loads the lats in a stretched, overhead position. Lengthened-position training has Moderate support for other muscles (Maeo 2021; Pedrosa 2023); there is no direct lat study (Practical for the lats). |
| 6 | Plate-loaded incline press and machine chest-supported row instead of the incline DB press and barbell row | **Moderate** (equivalence) / **Practical** (choice) | Free-weight and machine training gave no significant difference in hypertrophy (Haugen 2023 meta-analysis; only 5 hypertrophy studies, so precision is limited). He chose these machines today and has logs on them. The chest-supported row also takes the lower back out of the Chest-Back days, so it is fresher for the squat and RDL on the Lower Body days (Practical). |
| 7 | Dips removed | **Practical** | Chest volume is kept by the fly (6 weekly sets replace the dips' 4). The fly also loads the pec in a stretch and is easier on the shoulders and elbows to progress. No study compares the two for growth. |
| 8 | Keep the heavy reverse-pyramid top set (4-5 reps) on each A-day main lift, alone with 180 s rest | **Strong** | Hypertrophy is similar across loads when sets are hard, but heavy loads build more 1RM strength (Lopez 2021). Rest beyond 60 s gives a small benefit for growth (Singer 2024), and 3 min beat 1 min on multi-joint lifts (Schoenfeld 2016, Moderate). |
| 9 | A days 6-8 on compounds (10-12 on isolations), B days 8-10 (12-15 on isolations) | **Strong** | Same load-range equivalence as #8. Isolation moves keep 10+ reps because heavy low-rep flies, raises and curls mostly add joint stress, not growth (Practical for that last part). |
| 10 | Arm emphasis kept: 22 direct biceps and triceps sets, stretch-biased moves | **Strong** (volume) / **Moderate** (exercise choice) | Volume as #1. Overhead triceps work beat neutral-arm work (Maeo 2023). Preacher curls loaded at long length grew more (Pedrosa 2023). The finisher stays on the Chest-Back days, which he never misses (approved arm-emphasis doc). |
| 11 | JM press B: pyramid 14-12-10-8 → straight 4 × 10 inside a superset | **Strong** (equivalent) | Pyramids give no extra growth over straight sets (Angleri 2017). A pyramid does not fit a superset well (load changes every set). |
| 12 | Leg curl B: drop-set every set → drop on the last set only | **Strong** (equivalent) | Drop sets give similar growth to traditional sets (Sødal 2023). The last-set drop keeps the technique and fits the superset. |
| 13 | Seated leg curl kept; leg extension added | **Moderate** | The seated, hip-flexed curl grew hamstrings more than the prone curl (Maeo 2021). Squats did not grow the rectus femoris (Kubo 2019), so a leg extension covers it. |
| 14 | Lunge 4 → 3 sets, leg curl 4 → 3 (A) | **Practical** (volume part **Strong**) | Frees room for the extension without pushing quads past 10 per session. Hamstrings stay at 14 a week, inside the supported range. |
| 15 | Direct rear-delt work added (4 sets each Arms day) | **Practical** | There is no study comparing direct and indirect rear-delt work. It is cheap in time (superset) and it balances the extra pressing. If Arms days feel too long, this is the first thing to cut (2 sets). |
| 16 | Superset rest: 10 s between, 75-90 s after the pair | **Moderate** | Each muscle effectively rests about 2.5-3 minutes between its own sets, above the ~90 s point where extra rest stops helping (Singer 2024). |
| 17 | 1-2 reps in reserve on weeks 2-5; extras on the last set only | **Strong** | Growth improves as sets get closer to failure (Robinson 2024). True failure adds nothing over 1-2 RIR (Refalo 2023, 2024). |
| 18 | Week 1 and deload rules unchanged | **Moderate / Practical** | As approved (Coleman 2024; Bell 2023). |
| 19 | Exercise order (delts before arms on Arms days) | **Strong** (order is neutral for growth) | Hypertrophy is similar whatever the order; exercises done first gain a little more strength (Nunes 2021). Delts stay second, as in the approved block. |

## Replacement texts (summary and insights)

**Summary** (about 210 characters, limit 260):
> A 6-week strength block: one heavy top set of 4-5 reps on each A-day main lift, 6-8 reps on A days and 8-10 on B days, 3 back exercises per chest-back day, supersets on every day, and no exercise above 4 sets.

**Goal** (about 370 characters):
> Get stronger on the big lifts while you keep building muscle. Muscle grows about the same from 5 to 30 reps when sets are hard, but heavier sets build more strength, so a small dose of heavy 4-5 rep work sits on top of 6-12 rep sets. Total hard sets per week is what drives growth: about 20 for chest, back, biceps, triceps and quads, and 14 for hamstrings.

**How it works** (about 545 characters):
> Each A day opens alone with a reverse pyramid: one heavy top set (4 reps on the Smith bench and seated overhead press, 5 on the back squat), then lighter sets of 6, 8 and 10, with 3 minutes rest. After that, most work is done in supersets of two muscles that don't compete, like the incline press with chin-ups or leg curls with leg extensions: first exercise, about 10 seconds, second exercise, then the full rest. Chest-back days have three back exercises: chin-ups, a chest-supported row and straight-arm pulldowns. No exercise has more than 4 sets.

**A days vs B days** (about 330 characters):
> A days are heavier: the top set and 6-8 reps on the main lifts, and 10-12 reps on cables and isolation moves. B days use the same exercises in the same order, a bit lighter, with straight sets of 8-10 on the main lifts and 12-15 on isolation moves. A days build maximum strength; B days add volume for growth. Track and progress A and B days separately.

**How to progress** (about 445 characters):
> Top sets: stop with 1-2 reps left and add the smallest step once you hit the target cleanly; back-off sets follow. Other sets: same weight for every set, and add a step when every set hits its reps. In a superset, progress each exercise on its own. Week 1: no top set (do it as a back-off set) and no extras. Weeks 2-5: full plan. Week 6 is always a deload: half the sets, no top sets, no extras.

**What to expect** (about 320 characters):
> Supersets make sessions denser: about 65-75 minutes, with fewer long waits, but you will breathe harder. The heavy top sets still get full rest. Your back is now trained from three angles every chest-back day. By week 5 your top sets should be clearly heavier than in week 2.

**Key tips** (about 400 characters):
> Warm up before every top set with 3-4 ramp sets (for example 50% x 8, 70% x 4, 85% x 2). Set up both stations of a superset before you start; if one is taken, do both as straight sets with normal rest. Use safety pins or a spotter, never grind or fail a heavy set, and skip the top set if sleep or joints are bad. If a lift hurts, stop and see a qualified professional.

All bodies are between 40 and 600 characters, in English, with no medical advice. The spec asks for 2-4 sentences. "How to progress" has 7 short sentences, the same structure as the approved text. The validator only checks length.

## Validator check (by hand, against `scripts/validate-blocks.py` and the spec)
- 6 days, keys in order `chest-back-a, arms-a, lower-body-a, chest-back-b, arms-b, lower-body-b`; focus labels 19-25
  characters (limit 28).
- Codes match `^[A-H][1-3]$`, unique per day; every paired letter (B, D, E on Chest-Back; B, C, D on Arms; D, E on
  Lower) uses `superset`. Every other technique has an unpaired code.
- `reps` length = `sets` everywhere; straight sets have identical reps; reverse pyramids rise (4-6-8-10, 5-6-8-10);
  no pyramid or drop-set entries remain, so those rules do not apply.
- All 22 `exercise_id`s exist in `docs/fitness/approved/catalogue-v2/*.json`; no catalogue additions needed.
- Angles: required ones are set (Smith bench 0, seated OHP 90, seated lateral raise 90, seated DB overhead extension
  90, JM press 0). `plate-loaded-chest-press-incline` is `null`: it is a plate-loaded machine with a fixed path, so
  the validator exempts it, and a null angle cannot fail the "incline must be positive" rule. Machine row, cables,
  preacher, legs: `null`.
- Notes ≤ 80 characters (longest: 74), English, none repeat the angle, technique or sets/reps.
- Block-level fields (id, number, start_date, method, weeks, origin) are untouched. The summary is about 210 characters.
  Insights keep the 6 required titles in order.

## Exercises
All ids exist in the approved catalogue. No NEW ids. Posture tips: see the approved catalogue entries (unchanged).

### Plate-Loaded Chest Press, Incline (`plate-loaded-chest-press-incline`)
- **Primary / secondary muscles:** upper chest / front delts, triceps.
- **Notes:** Replaces the 30° incline dumbbell press. He did 4 × 10 at 32.5 kg today, so A days (8 reps) should start
  a step heavier, B days (10 reps) at about today's weight.

### Pull-Up, Neutral Grip (`neutral-grip-weighted-chin-ups`)
- **Primary / secondary muscles:** lats / biceps, upper back.
- **Notes:** Replaces the wide-grip pull-up. Bodyweight 5 × 8 today. A days 3 × 8 can take a small belt load once all
  sets are clean. B days 3 × 10 at bodyweight; use the assisted machine for the last set if needed.

### Machine Chest-Supported Row, Neutral Grip (`neutral-grip-supp-rows`)
- **Primary / secondary muscles:** upper back / lats, rear delts, biceps.
- **Notes:** Replaces the barbell row. 5 × 10 at 40 kg today. B days 4 × 10 start at about 40 kg; A days 4 × 8 a step
  heavier.

### Cable Fly, High to Low (`high-cable-fly`) and Cable Straight-Arm Pulldown (`cable-straight-arms-pull-downs`)
- **Primary / secondary muscles:** chest (mid/lower) / front delts; lats / long head of triceps, rear delts.
- **Notes:** Back from Block 6 as the same superset, on the same cable tower. Block 6 logs exist.

### Reverse Pec Deck Fly (`reverse-pec-deck-fly`)
- **Primary / secondary muscles:** rear delts / mid traps, rhomboids.
- **Notes:** Back from Block 6 (logs exist). Here as straight sets inside the delt superset, no drop set.

### Machine Leg Extension (`leg-extensions-toes-dorsiflexed-neutral`)
- **Primary / secondary muscles:** quads (including rectus femoris).
- **Notes:** Back from Block 6 (logs exist), paired with the seated leg curl as in Block 6.

### Unchanged in role
`smith-machine-bench-press`, `ez-bb-preacher-curls`, `rope-low-cable-oh-tricep-extensions`,
`barbell-overhead-press-seated`, `dumbbell-lateral-raise-seated`, `barbell-curl`, `barbell-jm-press`,
`cable-bayesian-curl`, `dumbbell-overhead-triceps-extension`, `back-squat`, `romanian-deadlift`,
`dumbbell-lunge-reverse`, `seated-leg-curl-toes-dorsiflexed-neutral`, `smith-machine-calf-raise`, `ab-wheel-rollout`.
Codes and some set counts change (see the tables).

## ⚠️ Open decisions
- ⚠️ REVISAR (Tech Lead): this changes sets, codes and techniques on lifts the trainer card shows. Per the AI Trainer
  release checklist: run the invariants and a real-history replay (today's logs on the three new Chest-Back ids are
  the first Block 7 data). The PT reviews before merge.
- ⚠️ REVISAR (Tech Lead): `neutral-grip-weighted-chin-ups` was logged at bodyweight (no added load). Check that the
  "never 0 kg for a weighted exercise" invariant treats this bodyweight exercise correctly and does not force a load
  or show "no data".
- ⚠️ REVISAR (Tech Lead): two techniques change type: JM press B (pyramid → superset) and leg curl B (drop-set →
  superset with a last-set drop in the note). Check that the engine does not expect pyramid or drop-set rows for
  these ids in Block 7, and that a superset first exercise with a last-set extra (rest-pause, myo-reps) displays well.
- ⚠️ REVISAR (Tech Lead): codes shift on every day. `docs/fitness/approved/es/blocks.json` notes are keyed by
  `day/code`, so the Spanish notes for Block 7 must be rewritten, or the validator will flag unknown codes. The
  summary and the 6 insights also need Spanish versions. The PT can write them on request.
- ⚠️ REVISAR (Tech Lead): `strategy.md` lines to update: the Block 7 bullet (exercise list, "5-6 exercises", "no
  supersets"), the chest-back trim bullet, and the bench-angle table. The upper-chest press is now a fixed-angle
  machine, so the table should say "plate-loaded incline machine" for Block 7.
- ⚠️ REVISAR (PT check-in, week 3): if the Arms days run long or the rear delts feel redundant, cut the reverse pec deck
  to 2 sets first. If his lower back or knees are tired going into the next session, cut the lunge to 2 sets before
  touching anything else. Pain means: stop the exercise and see a qualified professional.
- ⚠️ REVISAR (gym logistics): the incline press machine and the chin-up station, and the preacher bench and low
  cable, need to be close enough for a 10 s change. If not, rest up to 30 s between partners. Nothing else changes.
- Evidence caveats: Remmert 2025 is a preprint. Haugen 2023 has only 5 hypertrophy studies. Maeo 2021/2023, Pedrosa
  2023 and Kubo 2019 are single RCTs. There is no direct lat study for the straight-arm pulldown. The rear-delt
  addition, the dip removal and the 4-set cap are Practical (coaching judgement and PO preference).

## Sources
- Approved inputs: `docs/fitness/approved/training-blocks/blocks.json` (Blocks 6-7), `training-blocks/strategy.md`,
  `docs/fitness/training-blocks-spec.md`, `scripts/validate-blocks.py`, `2026-11-15-block7-chest-back-trim.md`,
  `2026-11-15-block7-arm-emphasis.md`, `2026-11-15-blocks-7-9-evidence-audit.md`.
- PO session data, Mon 16 Nov 2026 (as reported by the Tech Lead): Smith bench 37.5 × 8, 35 × 10, 32.5 × 12, 30 × 15;
  plate-loaded incline press 4 × 10 at 32.5 kg; chest-supported neutral row 5 × 10 at 40 kg; neutral-grip chin-up
  bodyweight 5 × 8.
- Zhang X, Weakley J, Li H, Li Z, García-Ramos A. Superset versus traditional resistance training prescriptions: a
  systematic review and meta-analysis exploring acute and chronic effects on mechanical, metabolic, and perceptual
  variables. Sports Med 2025. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12011898/
- Haugen ME, Vårvik FT, Larsen S, et al. Effect of free-weight vs. machine-based strength training on maximal
  strength, hypertrophy and jump performance: a systematic review and meta-analysis. BMC Sports Sci Med Rehabil
  2023;15:103. https://doaj.org/article/a7282dba5e674176bde2a8239832d2f7
- Schoenfeld BJ, Ogborn D, Krieger JW. Dose-response relationship between weekly resistance training volume and
  increases in muscle mass. J Sports Sci 2017;35(11):1073-1082.
- Pelland JC et al. The resistance training dose response: meta-regressions exploring the effects of weekly volume
  and frequency on muscle hypertrophy and strength gain. Sports Med 2026;56(2):481-505.
- Remmert JF et al. Is there too much of a good thing? Meta-regressions of the effect of per-session volume on
  hypertrophy and strength. SportRxiv preprint, 2025. https://sportrxiv.org/index.php/server/preprint/view/537
- Lopez P et al. Resistance training load effects on muscle hypertrophy and strength gain: systematic review and
  network meta-analysis. Med Sci Sports Exerc 2021;53(6):1206-1216. https://pubmed.ncbi.nlm.nih.gov/33433148/
- Robinson ZP et al. Exploring the dose-response relationship between estimated resistance training proximity to
  failure, strength gain, and muscle hypertrophy: a series of meta-regressions. Sports Med 2024;54(9):2209-2231.
- Refalo MC et al. Influence of resistance training proximity-to-failure on skeletal muscle hypertrophy: a
  systematic review with meta-analysis. Sports Med 2023;53(3):649-665.
- Refalo MC et al. Similar muscle hypertrophy following eight weeks of resistance training to momentary muscular
  failure or with repetitions-in-reserve in resistance-trained individuals. J Sports Sci 2024;42(1):85-101.
- Singer A et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest
  interval duration on muscle hypertrophy. Front Sports Act Living 2024;6:1429789.
  https://pubmed.ncbi.nlm.nih.gov/39205815/
- Schoenfeld BJ et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained
  men. J Strength Cond Res 2016;30(7):1805-1812.
- Kassiano W et al. Does varying resistance exercises promote superior muscle hypertrophy and strength gains? A
  systematic review. J Strength Cond Res 2022;36(6):1753-1762. https://pubmed.ncbi.nlm.nih.gov/35438660/
- Maeo S et al. Greater hamstrings muscle hypertrophy but similar damage protection after training at long versus
  short muscle lengths. Med Sci Sports Exerc 2021;53(4):825-837. https://pubmed.ncbi.nlm.nih.gov/33009197/
- Maeo S et al. Triceps brachii hypertrophy is substantially greater after elbow extension training performed in
  the overhead versus neutral arm position. Eur J Sport Sci 2023.
- Pedrosa GF et al. Training in the initial range of motion promotes greater muscle adaptations than at final in
  the arm curl. Sports 2023. https://pmc.ncbi.nlm.nih.gov/articles/PMC9960616
- Kubo K, Ikebukuro T, Yata H. Effects of squat training with different depths on lower limb muscle volumes. Eur J
  Appl Physiol 2019;119:1933-1942.
- Sødal LK et al. Effects of drop sets on skeletal muscle hypertrophy: a systematic review and meta-analysis. Sports
  Med Open 2023;9:66.
- Angleri V, Ugrinowitsch C, Libardi CA. Crescent pyramid and drop-set systems do not promote greater strength
  gains, muscle hypertrophy, and changes on muscle architecture compared with traditional resistance training in
  well-trained men. Eur J Appl Physiol 2017;117:359-369.
- Nunes JP et al. What influence does resistance exercise order have on muscular strength gains and muscle
  hypertrophy? A systematic review and meta-analysis. Eur J Sport Sci 2021;21(2):149-157.
- Coleman M et al. Gaining more from doing less? The effects of a one-week deload period during supervised
  resistance training on muscular adaptations. PeerJ 2024;12:e16777.
- Bell L et al. Integrating deloading into strength and physique sports training programmes: an international Delphi
  consensus approach. Sports Med Open 2023;9:87.

## Applied (Tech Lead, 2026-11-16)
Applied as written (migration 041); Spanish texts by the Tech Lead. Arms A tomorrow is the first day on the new layout.
