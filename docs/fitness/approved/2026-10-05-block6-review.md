---
title: Block 6 review and proposal (history analysis, critique, new Block 6)
status: approved
approved_by: Tech Lead on PO delegation (Sebas asked to update Block 6 for 5 Oct)
approved_on: 2026-10-05
author: pt-fitness-expert
created: 2026-10-05
approved_on:
exercises: [incline-dumbbell-press, plate-loaded-t-bar-row-chest-supported, dumbbell-bench-press, cable-lat-pulldown-underhand-grip, high-cable-fly, machine-pullover, standing-db-lateral-raises, smith-machine-shoulder-press, cable-lateral-raise, reverse-pec-deck-fly, dumbbell-curl-incline, rope-low-cable-oh-tricep-extensions, ez-bb-preacher-curls, cable-crunch, plate-loaded-pendulum-squat, romanian-deadlift, dumbbell-bulgarian-split-squat, seated-leg-curl-toes-dorsiflexed-neutral, leg-extensions-toes-dorsiflexed-neutral, standing-calf-raises-toes-neutral]
---

## Summary

I analysed Sebas's five coached blocks (16 Feb to late Sep 2026), his body-composition log and his
nutrition plan, then checked the approved Block 6 against his history and the UXer evidence brief
(`docs/ux/proposals/2026-10-05-hypertrophy-evidence-brief.md`). The proposed Block 6
(`2026-10-05-block6-proposed.json`) keeps the same split, the same method (`flat-pyramid`), the same
id and the same day keys. The main changes:

- volume is set per muscle (12–20 weekly sets, at most 10 per session)
- extra side-delt, rear-delt and hamstring work
- one stretch-biased exercise for every muscle
- antagonist supersets instead of same-muscle supersets
- longer rest on the main lifts
- an effort ramp (RIR 3 down to RIR 0–1) with a lighter week 6
- shorter leg days, because his leg days were the ones he skipped most

All exercise ids exist in the approved catalogue. No catalogue additions are needed.

---

## 1. History analysis (blocks 1–5)

### 1.1 How I read the spreadsheet

- Excel turned some cells into dates. I read `2010-10-10` as reps "10-10-10", `2026-10-06` as a drop
  set "10→6 kg", `2026-12-08` as "12→8", and so on.
- A `*` marks a note or PR. Examples: block 1 prone leg curl "35*" (load cut from 42.5), block 2
  chest press "60-30*" (big jump), block 5 overhead press "28*".
- Every row in every block was prescribed at **RPE 10**, which means failure on every set.
- ⚠️ REVISAR: **load units are unclear for barbells and some machines.** Examples: flat bench
  "40 kg × 6", 30° bench "34 × 8", RDL "10→30", EZ preacher "9→12", dips "37.5", "weighted
  chin-ups 60→80".
  - These are probably plates only, per side, or machine-specific numbers.
  - The numbers below compare a lift only with itself, so the trends hold either way.
  - Sebas should confirm the convention so the starting weights in section 4 make sense.
- Block 3 has an extra empty week column between week 2 and week 3. The body-weight log also has a
  gap from 21 May to 14 Jun. This probably means a break of 1–3 weeks inside block 3 ⚠️ REVISAR.

### 1.2 Body composition and nutrition (context only, not advice)

| Date | Body weight | Est. body fat (skinfolds) | Est. lean mass |
|---|---|---|---|
| 12 Feb | 70.6 kg | 19.2% | ~57.0 kg |
| 5 Mar | 72.4 kg | 17.3% | ~59.9 kg |
| 16 Jul (peak) | 81.9 kg | 21.5% | ~64.3 kg |
| 13 Aug | 77.8 kg | 19.7% | ~62.5 kg |
| 25 Aug (last log) | 77.1 kg | — | — |

- Calories rose from 2,562 to 3,381 kcal across the gaining phase. Protein was fixed at 213 g, about
  2.7 g/kg. Creatine was taken daily.
- A cut started around 30 Jul. That means **block 5 (from 17 Aug) was trained in a calorie deficit.**
- Skinfold estimates are rough. Even so, the trend suggests real lean mass was gained from Feb to Jul
  (about +5 kg), with a small loss during the cut.
- ⚠️ REVISAR (PO): is he still in a deficit from tomorrow? Growth is clearly slower in a deficit
  (Murphy & Koehler 2022). Nutrition targets belong to his coach or a dietitian, not to this plan.

### 1.3 Adherence (sessions with logged loads)

| Block | Method | Upper sessions logged | Lower sessions logged | Total | Notes |
|---|---|---|---|---|---|
| 1 | Flat 12/15 + supersets | 24/24 | 12/12 | ~100% | Core (V-ups) never logged |
| 2 | Reverse pyramid + drop sets | 23/24 | 11/12 | ~94% | Week 3 Arms B and Lower B missed |
| 3 | Strength 6/8 | ~21/24 | 10/12 | ~86% | Probable break mid-block; week 6 B days mostly empty |
| 4 | Ascending pyramid + supersets | ~23/24 | **8/12** | ~86% | Lower A weeks 5–6 and Lower B weeks 2 and 6 missed |
| 5 | Reverse pyramid + drop sets (in a cut) | ~18/24 | **3/12** | **~58%** | Lower B never logged; almost nothing in week 6 |

**Patterns:**

- Adherence falls block after block, and **lower-body days are always the first to go.** Lower Body B
  (day 6 of the week) is the most skipped session.
- Core work was essentially never logged in any block.
- Weeks 5–6 are where sessions start to disappear.

### 1.4 Main lifts: what progressed and what stalled

The table uses A-day top sets, comparing week 1 with the best week of each block. "Plateau wk3" means
no gain after week 3.

| Lift | Blk 1 | Blk 2 | Blk 3 | Blk 4 | Blk 5 | Verdict |
|---|---|---|---|---|---|---|
| 45° DB press (neutral) | 26→32 × 12 | — | — | 26→30 × 10 | — | **Stalled across blocks.** Est. 1RM about 45 kg in block 1 vs 40 kg in block 4 |
| 30° BB bench (top set × 8) | — | 32→34 | — | — | 30→32.5 | **Slightly down** (in the cut) |
| Flat BB bench × 6 | — | — | 30→40, plateau wk3 | — | — | Quick gain, then flat |
| Machine chest press | — | 40→67.5 (drop) | — | top set 45 × 8, plateau wk3 | — | Progresses well on machines |
| Wide-grip lat pulldown | — | 60→70 × 12 | — | — | 70→80 × 8 | **Steady progress** (est. 1RM +3%) |
| Neutral pulldown / single-arm pulldown | 55→65 × 10 | — | — | top set 24→37 | — | Progress |
| Chest-supported rows | — | 45→50 × 8 | 50→55 × 6, plateau wk3 | 45→52.5, then 40 | — | Gains, then plateau |
| Shoulder press (machines) | 40→47.5 × 12 | — | 45→50 × 6, plateau wk3 | top set 45→52.5 | — | Progress, then plateau |
| DB overhead press | 18→24 × 10 (60°) | — | — | 26→28 × 10 (75°) | 26→30 × 8 (60°) | Slow, steady |
| DB lateral raise (standing) | 12→16 × 12 | — | — | 12→14 × 15 | — | **Flat for 5 months** |
| Curls (offset / preacher / incline) | 12→16 × 12 | preacher 9→12 | 9→14 × 8 | 7.5→15 × 10 | preacher 10→14 | Good gains within each block, little carry-over between blocks |
| Triceps (skull crusher / pushdown / overhead) | 7.5→12 | pushdown 10→12 | overhead 11→14 | 12→16 | pushdown 20→22.5 | Progress within each block |
| Leg press (45°) | 140→145, plateau wk3 | — | — | — | — | Stalled |
| Squat variants (high-bar heels-up / hack) | — | 24→32 | hack 30→45 | 25→32.5 | hack 35, unchanged for 3 wks | **Flat since block 2**; hack est. 1RM down from 54 to 44 |
| Leg extension | 47.5→52.5 | 52.5→57.5 | — | 47.5→42.5 | — | **Down since block 2** |
| Leg curls (lying / seated) | 40→42.5, then 35* | seated 37.5→42 | lying 42→47.5→45 | seated, values inconsistent | lying 40 (drop) | **Flat for 7 months** |
| Back extension (horizontal) | — | 60→80 | — | — | 60→70 | Down (cut, missed sessions) |
| Calves | leg press 40→100 | standing 100→110 | none | **none** | 1 session | Trained irregularly |

### 1.5 Weekly direct sets per muscle in past blocks

The table counts direct sets planned per week, A + B days. Actual volume was lower in blocks 4–5
because of missed sessions.

| Muscle | Blk 1 | Blk 2 | Blk 3 | Blk 4 | Blk 5 |
|---|---|---|---|---|---|
| Chest | 23 | 20 | 16 | 20 | 20 |
| Back (lats + upper back) | **31** | 20 | **32** | 20 | 20 |
| Side delts | 6 | 6 | **0** | 6 | 6 |
| Rear delts | **0** | **0** | **0** | **0** | **0** |
| Front delts (presses) | 14 | 8 | 8 | 14 | 8 |
| Biceps | 8 | 14 | 8 | 12 | 14 |
| Triceps | 16 | 14 | 16 | 12 | 14 |
| Quads | 20 | 14 | 16 | 20 | 14 |
| Hamstrings (curls + RDL) | 12 | 6 | 8 | 12 | 6 |
| Glutes / back extensions | lunges | 8 | 8 | split squats | 8 |
| Calves | 8 | 8 | **0** | **0** | 8 |
| Core | 8 (not logged) | 8 (not logged) | 8 (not logged) | 8 (barely logged) | 8 (not logged) |

### 1.6 Findings

**Weak points and imbalances:**

- **Side delts.** Only 6 direct sets a week, 0 in block 3, and the lateral-raise weight hasn't moved
  in 5 months. 16 kg lateral raises for 12 reps at this body weight suggests momentum: a "strict
  form" cue is needed.
- **Rear delts.** No direct work in 33 weeks.
- **Hamstrings.** Only 6–12 direct sets a week, mostly lying curls, and the weight has been flat
  since February. The seated curl stretches the hamstrings more and grows them more (Maeo 2021).
- **Legs overall.**
  - Quad lifts have been flat or falling since block 2.
  - The real cause is probably adherence (lower-body sessions dropped from 12/12 to 3/12) plus
    constant exercise changes.
  - Volume is unlikely to be the cause.
- **Chest pressing.** The incline dumbbell press hasn't improved in 5 months, even though he gained
  about 7 kg of body weight between the two blocks that used it.
- **Calves and core.** Calves were left out in two blocks, and core was never tracked.
- **Back is the strong point.** It improved in every block, and its volume was at or above the
  others.

**What worked best for him:**

- **Block 1** (flat sets of 12/15, supersets, moderate loads) gave the steadiest week-to-week gains
  on almost every lift and had full adherence.
- **Machines and cables** (chest press, pulldowns, shoulder press machines) let him add load almost
  every week.
- **New exercises** gave fast gains in weeks 1–3.

**What did not work:**

- **Failure on every set (RPE 10), 6 days a week, with no planned lighter week in 33 weeks.** Most
  lifts stop improving around week 3–4, and sessions start disappearing in weeks 4–6. This fits
  accumulated fatigue. The heavy strength block (block 3) plateaued by week 3 on every main lift.
- **Training block 5 in a deficit.** Strength dipped and adherence collapsed.

---

## 2. Critique of the current approved Block 6

| Area | Current Block 6 | Issue (history + evidence) |
|---|---|---|
| Chest volume | 13 direct sets per Chest-Back day, 26 a week (about 29 counting the pullover) | Above the ~10 hard sets per muscle per session where returns flatten (Pelland 2024; brief rule 2). Chest is not his limiting factor, effort and fatigue are. |
| Triceps volume | 16 direct + about 14 indirect from 3 presses and the pullover, about 30 a week | Far above 20. Skull crushers plus all the pressing is also a lot of elbow stress. |
| Side and rear delts | 6 lateral sets + 6 rear-delt sets a week (side delts about 10 counting presses) | His most obvious lagging area gets the least work. |
| Hamstrings | 12 a week (RDL + seated curl) | Acceptable, but he is lagging and both lifts sit in one 10-second superset after quad work. |
| Calves | Seated calf raise both days | A bent knee takes the gastrocnemius out of the movement. A straight-knee raise with a stretch pause works better for growth (Kassiano 2023). |
| Triceps exercise choice | Flat skull crusher + straight-bar pushdown | No overhead work. Overhead extensions grew the triceps about 1.4× more than pushdowns (Maeo 2023). |
| Supersets | Same muscle (press + fly, pulldown + pullover, curl + curl, skull crusher + pushdown, split squat + extension, RDL + curl) | Same-muscle pairs cut the reps on the second exercise. Antagonist pairs save the same time without that cost (Krzysztofik 2019; brief section 6). |
| Rest | 90 s on main compounds | The brief and Singer 2024 favour 2–3 min on compounds. |
| Rep ranges | A 10–12, B 12–15, with 10–20 on accessories | Fine for growth. A-day main lifts can be heavier (8), which also fits the strategy's flat-pyramid table and leads into block 7. |
| Effort / progression | "RPE 9", the same every week, no ramp | His history shows stalls in weeks 3–4 at constant maximal effort. An RIR ramp (3 → 0–1) is recommended (brief rule 9). |
| Week 6 | Normal week | No lighter week in 33 weeks, and every block shows week 4–6 drop-off. Block 7 starts heavy (6s) with no lighter week. |
| Session length | Leg days: 7 exercises incl. 2 supersets + core | Leg days are the ones he skips. They should be the shortest sessions. |
| Good parts kept | 30° incline press (angle rotation), flat DB press, high-to-low fly, chest-supported T-bar, underhand pulldown, machine pullover, Smith press at 75°, cable lateral, reverse pec deck, 45° incline curl, pendulum squat, Bulgarian split squat, seated leg curl, cable crunch | — |

---

## 3. Proposed Block 6

### 3.1 Rationale

1. **Same split, same keys, same method.** Six days with each muscle trained twice a week. The
   evidence brief says frequency adds little once volume is equal. The split is kept because it
   spreads volume so no session goes above about 10 sets per muscle.
2. **Volume per muscle sits in the 12–20 fractional-set range** (brief rule 1). Lagging muscles
   (side delts, hamstrings, upper/incline chest) are at the higher end. Back, his best responder,
   stays at about 18. No muscle gets more than 10 direct sets in one session.
3. **Fewer sets on the main lifts, but better ones.** Main lifts get 3 sets with 2.5–3 min rest
   instead of 4 sets with 90 s.
4. **Every muscle has a stretch-biased exercise** (brief rule 6):
   - chest: 30° incline and flat dumbbell press, high-to-low cable fly with a deep stretch
   - lats: underhand pulldown with a full stretch, machine pullover
   - side delts: cable lateral raise from behind the body
   - biceps: 45° incline curl and preacher curl
   - triceps: overhead cable extension
   - quads: deep pendulum squat and leg extension
   - hamstrings: seated leg curl with the torso leaning forward, RDL
   - glutes: Bulgarian split squat
   - calves: straight-knee raise with a 2-second pause at the bottom
5. **Antagonist supersets** replace same-muscle supersets: chest press + pulldown, cable fly +
   pullover, lateral raise + reverse pec deck, curl + overhead extension, preacher curl + cable
   crunch, leg curl + leg extension. Main lifts are never in a superset.
6. **Shorter leg days.** Core moves to the Arms days, so leg days are 6 exercises, about 60 minutes.
   This deliberately changes the approved strategy ("core sits at the end of lower-body days").
   ⚠️ REVISAR (PO).
7. **Fewer barbell and failure risks.** The heavy skull crusher is dropped. There are no drop sets,
   and no failure on squats, RDLs or free-weight presses (brief rule 4).

### 3.2 Exercise changes vs the approved Block 6

| Day | Approved | Proposed | Why |
|---|---|---|---|
| Chest-Back | Pec deck (3 sets) | **Removed** | Brings chest down from 13 to 9 sets per session |
| Chest-Back | Incline press 4 sets, T-bar 4 sets | 3 sets each, 150 s rest | Quality over quantity; time for longer rest |
| Chest-Back | Flat DB press + cable fly superset; pulldown + pullover superset | Flat DB press + pulldown; cable fly + pullover | Antagonist pairs |
| Chest-Back | — | **Standing DB lateral raise** (`standing-db-lateral-raises`), 3 sets | Side-delt priority, 4 times a week |
| Arms | EZ-bar curl (standing) | **EZ-bar preacher curl** (`ez-bb-preacher-curls`) | Loads the biceps in the stretch; he has history on it (block 2) |
| Arms | EZ skull crusher (0°) + straight-bar pushdown | **Cable overhead triceps extension** (`rope-low-cable-oh-tricep-extensions`), 4 sets | Best-evidence triceps exercise; triceps total was too high and hard on the elbows |
| Arms | Cable lateral 3 + reverse pec deck 3 | 4 + 4 | Side- and rear-delt priority |
| Arms | — | **Cable crunch** (moved from leg days), paired with the preacher curl | Core actually gets done; leg days get shorter |
| Legs | DB RDL in a superset with the leg curl | **Barbell RDL** (`romanian-deadlift`) on its own, 150 s | Heavy hinge needs rest; finer load steps; he has history on it (block 1) |
| Legs | Single-leg leg extension | **Leg extension** (`leg-extensions-toes-dorsiflexed-neutral`), both legs, paired with the leg curl | Saves about 4 min; long history on it |
| Legs | Seated leg curl 3 sets | 4 sets, torso leaning forward | Hamstring priority; bigger stretch at the hip |
| Legs | Seated calf raise 4 sets | **Standing calf raise** (`standing-calf-raises-toes-neutral`), 5 sets with a 2 s pause | Works the gastrocnemius in its stretched position |
| Legs | Cable crunch | Moved to Arms days | See above |

**Bench angles.** These are unchanged: incline press 30°, flat DB press 0°, Smith press 75°, incline
curl 45°.

- The main chest press keeps the 30 → 0 → 45 → 0 rotation.
- The flat 0° skull crusher drops out, so triceps get overhead work in both blocks 6 and 7.
- ⚠️ The Tech Lead would need to update the "Bench angle strategy" table in `strategy.md` if this is
  approved.

### 3.3 The sessions

The table shows A-day reps and rest. B days use the same exercises with B reps.

| Code | Exercise (id) | Sets | A reps | B reps | Rest | Angle |
|---|---|---|---|---|---|---|
| **Chest-Back** (~60 min) | | | | | | |
| A1 | `incline-dumbbell-press` | 3 | 8 | 10 | 150 s | 30° |
| B1 | `plate-loaded-t-bar-row-chest-supported` | 3 | 8 | 10 | 150 s | — |
| C1 / C2 | `dumbbell-bench-press` / `cable-lat-pulldown-underhand-grip` | 3 | 10 | 12 | 10 s / 120 s | 0° / — |
| D1 / D2 | `high-cable-fly` / `machine-pullover` | 3 | 12 | 15 | 10 s / 90 s | — |
| E1 | `standing-db-lateral-raises` | 3 | 15 | 20 | 60 s | — |
| **Arms** (~57 min) | | | | | | |
| A1 | `smith-machine-shoulder-press` | 3 | 8 | 10 | 150 s | 75° |
| B1 / B2 | `cable-lateral-raise` / `reverse-pec-deck-fly` | 4 | 15 | 20 | 10 s / 75 s | — |
| C1 / C2 | `dumbbell-curl-incline` / `rope-low-cable-oh-tricep-extensions` | 4 | 12 | 15 | 10 s / 90 s | 45° / — |
| D1 / D2 | `ez-bb-preacher-curls` / `cable-crunch` | 3 | 12 | 15 | 10 s / 60 s | — |
| **Lower Body** (~60 min) | | | | | | |
| A1 | `plate-loaded-pendulum-squat` | 3 | 8 | 10 | 180 s | — |
| B1 | `romanian-deadlift` | 3 | 10 | 12 | 150 s | — |
| C1 | `dumbbell-bulgarian-split-squat` (per leg) | 3 | 10 | 12 | 90 s | — |
| D1 / D2 | `seated-leg-curl-toes-dorsiflexed-neutral` / `leg-extensions-toes-dorsiflexed-neutral` | 4 | 12 | 15 | 10 s / 90 s | — |
| E1 | `standing-calf-raises-toes-neutral` | 5 | 15 | 20 | 60 s | — |

Session times include about 8 minutes of warm-up (general warm-up plus 1–2 ramp-up sets on each main
lift). They assume about 45 s per working set.

### 3.4 Weekly sets per muscle (A + B)

Fractional counting follows the evidence brief and the approved progress-insights doc: direct
(primary) sets count 1, indirect (secondary) sets count 0.5. "Current" is the approved Block 6
counted the same way.

| Muscle | Direct | + indirect | **Total (proposed)** | Max per session | Current Block 6 | Target (brief) |
|---|---|---|---|---|---|---|
| Chest | 18 | +3 (pullover) | **~21** | 9 | ~29 | 12–20, top if lagging |
| Back (lats + upper back) | 18 | — | **18** | 9 | 20 | 12–16 (strong point) |
| Side delts | 14 | +3 (Smith press) | **17** | 4 | ~10 | top: lagging |
| Rear delts | 8 | +6 (rows, pulldowns) | **14** | 4 | ~13 | 12–16 |
| Front delts | 6 | +6 (chest presses) | **12** | — | ~15 | presses cover them |
| Biceps | 14 | +6 (row, pulldown) | **20** | 7 | ~23 | 12–20 |
| Triceps | 8 | +12 (presses, pullover) | **20** | 4 | ~30 | 12–20 |
| Quads | 20 | — | **20** | 10 | 20 | 12–20 |
| Hamstrings | 14 | small (split squat) | **14–15** | 7 | 12 | top: lagging |
| Glutes | 12 | +3 (pendulum) | **15** | 6 | ~16 | 12–16 |
| Calves | 10 | — | **10** | 5 | 8 (seated) | ⚠️ below 12, see open decision 5 |
| Abs | 6 | + bracing | **6** | 3 | 8 | low priority |

- The app's Progress screen merges side and rear delts into one "Shoulders" bar. It will show about
  31 and flag it amber ("High"), even though each head sits at 14–17. ⚠️ REVISAR (Tech Lead): this is
  a display artefact, not a real problem.
- Push vs pull planned sets are balanced: chest + front delts about 33, back + rear delts about 32.
- Quads vs hamstrings is 20 : 14 (0.7), which is above the 0.6 flag.

### 3.5 Progression rules

**Double progression.**

1. The rep number shown is the **top of the range**. In week 1, pick a weight you can lift for the
   target reps on set 1 with about 3 reps left in the tank.
2. When **every set** reaches the target reps with clean form at that week's effort level, add the
   smallest step **next session**:
   - upper-body compounds: +2–2.5 kg (or the next dumbbell)
   - lower-body compounds: +5 kg
   - isolation and cable work: +1–2.5 kg or one pin
3. If later sets fall 1–2 reps short, keep the weight and beat the total next week. Adding reps is
   real progress (Plotkin 2022).
4. If set 1 drops 3 or more reps below target after a weight increase, go back to the previous
   weight.
5. Progress A and B days independently. This matches the app's "Ready to progress" rule.

**Effort ramp.** RIR means "reps in reserve": how many more clean reps you could have done.

| Week | Target RIR (compounds) | Target RIR (isolation, machines, cables) | Purpose |
|---|---|---|---|
| 1 | 3 | 3 | Find weights, learn the new exercises, return from the lighter weeks / cut |
| 2 | 2 | 2 | Build |
| 3 | 1–2 | 1–2 | Build |
| 4 | 1–2 | 1 | Push |
| 5 | 1 | 0–1 (failure allowed on the **last set only**) | Peak week |
| 6 | 3+ | 3+ | **Lighter week** (default): same exercises and weights, half the sets (round up), no failure |

- Week 6 has an alternative (open decision 1): if week 5 went well, train week 6 as a normal week at
  RIR 1–2 and take the lighter week at the start of block 7.
- The brief recommends deloading based on fatigue. I chose the lighter week 6 as the default because
  his history shows performance and attendance falling in weeks 4–6 in **every** block, he has had
  no lighter week in 33 weeks, and approved block 7 starts heavy with no lighter week. A one-week
  break did not cost muscle in Coleman 2024.
- The app does not log RIR (approved decision, progress-insights). The RIR targets live only in the
  block insights text. The brief's rule 8 ("log RIR") would need the Tech Lead to revisit that
  decision.

### 3.6 Starting weights for week 1 (A days)

- These come from his last logged numbers, using the same units as his spreadsheet.
- Week 1 is set at RIR 3, so most start 10–15% below his previous best for similar reps.
- B days start about 10% lighter than A days.
- "Baseline" means a new machine: find the weight in week 1. Machine stacks are only comparable on
  the same machine.

| Exercise | Last relevant numbers | Suggested week 1 (A) |
|---|---|---|
| Incline DB press 30° × 8 | 45° neutral 30 kg × 10 (blk 4), 32 × 12 (blk 1) | 26 kg per hand; aim for 30–32 by week 5 |
| Chest-supported T-bar row × 8 | Machine supported rows 55 × 6, 50 × 8 | Baseline |
| Flat DB press × 10 (after incline) | No flat DB history | 22–24 kg |
| Underhand pulldown × 10 | Wide 80 × 8 (blk 5), neutral 65 × 10 (blk 1) | 60 kg |
| High-to-low cable fly × 12 | High cable fly 16 × 15 (blk 1) | 12.5 kg |
| Machine pullover × 12 | DB pullover 30 × 12 (blk 1) | Baseline |
| Standing DB lateral × 15 | 14 × 15 (blk 4) | **10 kg, strict.** Deliberately lighter to remove the swing |
| Smith shoulder press 75° × 8 | DB press 60° 30 kg per hand × 8 (blk 5) | Baseline (start conservative) |
| Cable lateral (behind body) × 15 | — | Baseline (about 5 kg) |
| Reverse pec deck × 15 | — | Baseline |
| Incline curl 45° × 12 | Offset curls 15–17.5 × 10–12 (blk 4); 60° curls 14 × 8 (blk 3) | 10 kg |
| Cable overhead triceps extension × 12 | 14 × 8–10 (blk 3) | 12 kg |
| EZ preacher curl × 12 | 12 × 8, 10 × 12 (blk 2) | 10 |
| Pendulum squat × 8 | Hack 45 × 6 (blk 3), 35 × 8 (blk 5) | Baseline: bodyweight sets first, then add load slowly |
| Barbell RDL × 10 | 30 × 10 (blk 1, same convention) | 25–30 ⚠️ REVISAR units |
| Bulgarian split squat × 10 per leg | FFE split squat 16–26 × 10; lunges 20 × 8 | 14–16 kg per hand |
| Seated leg curl × 12 | 42 × 12 (blk 2) | 37.5 kg |
| Leg extension × 12 | 57.5 × 12 (blk 2), 42.5–47.5 (blk 4) | 47.5 kg |
| Standing calf raise × 15 (2 s pause) | 110 × 15 without pause (blk 2) | 80–90 kg |
| Cable crunch × 12 | — | Baseline |

---

## 4. Safety notes (general guidance, not medical advice)

- **Warm up every session.** Do 5 minutes of easy cardio, then 1–2 lighter ramp-up sets before each
  main lift.
- **Failure rules.** Never take the pendulum squat, RDL, Bulgarian split squat or dumbbell presses
  to failure. Failure is only for the last set of machine, cable and isolation exercises in weeks
  4–5.
- **Stretch-position work.** Go into the stretch slowly and under control. Never bounce out of the
  bottom of a fly, RDL, incline curl, preacher curl, overhead extension or calf raise. Use a depth
  you can control, not the maximum possible.
- **Joint-friendly options for the same muscle, if something feels uncomfortable:**
  - shoulders on pressing: switch the incline DB press to a neutral grip (`db-press-neutral-grip`)
  - elbows on overhead triceps work: switch to the V-bar pushdown (`v-bb-cable-tricep-extensions`)
  - lower back on RDL: lower the depth or use the 45° back extension
    (`weighted-45-back-extensions`)
  - knees on the split squat: use a shorter range or the dumbbell split squat
    (`dumbbell-split-squat`)
  - These swaps change what gets tracked, so keep the swap for the rest of the block.
- **Pain.** Any sharp or lasting pain means stopping that exercise and seeing a qualified
  professional (doctor or physiotherapist). This plan does not diagnose or treat injuries.
- **Recovery.** Recovery depends on sleep, food and stress as much as on the plan. If a deficit
  continues, expect to hold strength rather than set PRs. Nutrition changes belong to his coach or a
  dietitian.

---

## ⚠️ Open decisions (for Sebas)

1. **Week 6.** Choose one:
   - (a) a lighter week: same weights, half the sets, about 3 reps in reserve. This is the PT
     recommendation and what the JSON currently says.
   - (b) a normal week, followed by a lighter first week of block 7 (block 7 is already approved
     and would need a change).
2. **Nutrition status.** Is the cut over? Training in a deficit would make me lower the volume
   targets by about 20%.
3. **Priority muscles.** I assumed chest (incline) and side delts. If arms or legs matter more to
   you, I can move 2–4 sets between them.
4. **Core on Arms days** instead of leg days. This changes the approved strategy.
5. **Calves at 10 sets a week** (below the brief's 12). Adding 1 set per leg day costs about
   2 minutes a session.
6. **Units in the old spreadsheet** for barbells, dips and chin-ups: is the bar included, or are
   these plates per side? This affects the RDL starting weight.
7. **Block 3 break and "Laterales sin barras".** Was there a 1–3 week break in late May / early June?
   And was the cable chest pull swapped for lateral raises in weeks 5–6 (loads dropped from 50 to
   11–12)?
8. **For the Tech Lead.** The JSON keeps exactly the blocks.json shape. blocks.json has no
   `position` field, so I did not add one; order is given by the array and the codes.
   - `scripts/validate-blocks.py` could not be run from the PT sandbox. I checked its rules by
     hand: codes, superset pairing, straight-set reps, angles, note length, focus length and
     insight lengths.
   - If approved, the `strategy.md` Block 6 paragraph and the bench-angle table need updating.

## Sources

- UXer evidence brief: `docs/ux/proposals/2026-10-05-hypertrophy-evidence-brief.md`. Rules 1–10
  were followed, except the per-week set ramp (rule 9). The app plan has fixed sets, so effort is
  ramped through RIR instead.
- Schoenfeld BJ, Ogborn D, Krieger JW (2017). Dose-response relationship between weekly resistance
  training volume and muscle mass. *J Sports Sci* 35(11):1073–1082.
- Pelland JC et al. (2024). The resistance training dose-response: meta-regressions on weekly volume
  and frequency. *SportRxiv* preprint. https://sportrxiv.org/index.php/server/preprint/view/537
- Schoenfeld BJ, Ogborn D, Krieger JW (2016). Effects of resistance training frequency on muscle
  hypertrophy. *Sports Med* 46(11):1689–1697.
- Schoenfeld BJ et al. (2021). Loading recommendations for muscle strength, hypertrophy and local
  endurance. *Sports* 9(2):32.
- Refalo MC et al. (2023). Proximity-to-failure and hypertrophy: systematic review and meta-analysis.
  *Sports Med* 53(3):649–665.
- Robinson ZP et al. (2024). Exploring the dose-response relationship between estimated resistance
  training proximity to failure, strength gain and muscle hypertrophy. *Sports Med*.
- Singer A et al. (2024). Give it a rest: a systematic review with Bayesian meta-analysis on the
  effect of inter-set rest interval duration on muscle hypertrophy. *Front Sports Act Living*.
- Schoenfeld BJ et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy
  in resistance-trained men. *J Strength Cond Res* 30(7):1805–1812.
- Wolf M et al. (2023). Partial vs full range of motion resistance training: a systematic review and
  meta-analysis (lengthened partials). *Int J Strength Cond*.
- Maeo S et al. (2021). Greater hamstrings muscle hypertrophy but similar damage protection after
  training at long vs short muscle lengths (seated vs prone leg curl). *Med Sci Sports Exerc*
  53(4):825–837.
- Maeo S et al. (2023). Triceps brachii hypertrophy is substantially greater after elbow extension
  training performed in the overhead versus neutral arm position. *Eur J Sport Sci* 23(7):1240–1250.
- Kassiano W et al. (2023). Greater gastrocnemius muscle hypertrophy after partial range of motion
  training performed at long muscle lengths. *J Strength Cond Res* 37(9):1746–1753.
- Pedrosa GF et al. (2022). Partial range of motion training elicits favorable improvements in
  muscular adaptations when carried out at long muscle lengths. *Eur J Sport Sci* 22(8):1250–1260.
- Krzysztofik M et al. (2019). Maximizing muscle hypertrophy: a systematic review of advanced
  resistance training techniques and methods. *Int J Environ Res Public Health* 16(24):4897.
- Plotkin D et al. (2022). Progressive overload without progressing load? *PeerJ* 10:e14142.
- Coleman M et al. (2024). Gaining more from doing less? The effects of a one-week deload period
  during supervised resistance training on muscular adaptations. *PeerJ* 12:e16777.
- Bell L et al. (2023). Deloading practices in strength and physique sports: a cross-sectional
  survey / Delphi consensus. *Sports Med Open*.
- Helms ER et al. (2016). Application of the repetitions in reserve-based RPE scale. *Strength Cond
  J* 38(4):42–49.
- Murphy C, Koehler K (2022). Energy deficiency impairs resistance training gains in lean mass but
  not strength: a meta-analysis and meta-regression. *Scand J Med Sci Sports* 32(1):125–137.
- Input data: Sebas's coached-program export (TP_16-2-26 … TP_17-8-26, Metabolic_Analysis,
  Nutritional_Plan, Compliance_Document; scratchpad, not versioned). Approved
  `training-blocks/blocks.json`, `strategy.md`, `training-blocks-spec.md`, `progress-insights.md`.
