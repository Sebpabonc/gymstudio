---
title: Progress section: evidence-informed insights
status: approved
author: pt-fitness-expert
created: 2026-10-04
approved_by: Sebas (decisions 1-2); 3-4 delegated to Tech Lead
approved_on: 2026-10-04
exercises: [incline-dumbbell-press, machine-chest-press-incline, cable-fly-low-to-high, plate-loaded-t-bar-row-chest-supported, pull-up]
---

> **PO decisions (2026-10-04)**
> 1. Strength chart shows **A days by default**, B days behind a toggle — yes.
> 2. The app **suggests actions** based on the user's history and progress — yes.
> 3. *(Delegated, Tech Lead)* Drop sets are logged as **one set row with a main part and a drop part**
>    (`{ reps, weight, drop: { reps, weight } }`), not as two separate sets. Analytics use only the main part
>    for e1RM and count the pair as 1 set.
> 4. *(Delegated, Tech Lead)* No RIR/"reps left" input for now — avoid extra taps mid-workout; revisit after
>    a few weeks of using the insights.
> Each logged entry also records its `blockId` and `dayKey` automatically (fixes A/B detection).


> Scope: what the **Progress** section should show, and how to calculate it from data the app
> already has. Today Progress lists the last 5 sessions of one exercise (top weight and total volume).
> This draft proposes how to turn that into progress you can actually use. It covers the fitness logic
> only. The Tech Lead decides how to build it.

## 1. Summary

These are ranked by how much they help someone on a 6-day A/B split that changes method every 6 weeks.

1. **Strength trend per exercise (estimated 1RM)**: one line per lift showing whether you are getting stronger, with block boundaries marked and a one-line takeaway.
2. **Personal records (PRs)**: weight PR, rep PR at a given weight, and estimated-1RM PR, shown as badges on the session and the exercise.
3. **"Ready to progress" and stall alerts**: tells you when you hit every prescribed rep (add weight next time) and when a lift has gone 3 weeks without improving (with a suggested fix).
4. **Block report card**: start vs end of each 6-week block, % change per lift and a single headline per block, so the blocks can be compared.
5. **Weekly hard sets per muscle**: sets per muscle group per week against an evidence-based 10–20 set range, with low/high flags and a planned-vs-done comparison.
6. **Plan adherence**: sessions done vs planned (6/week, 36/block) and the share of prescribed reps you actually hit.
7. **Muscle balance (optional)**: push vs pull and quads vs hamstrings weekly sets, flagged only when clearly lopsided.

## 2. Recommended insights

### Shared rules (apply to every insight below)

These rules make the numbers fair. Every insight depends on them, so get them right first.

**R1. Sessions.** A *session* is all entries logged on the same local calendar date. A *week* is the
Monday–Sunday week (blocks start on Mondays). Assign a session to a block when
`block.start_date ≤ date < start_date + weeks × 7`. Its *block week* is 1–6.

**R2. A day vs B day.** A and B days use the **same exercises**, so the exercise list alone cannot
tell them apart. Infer the day type in this order:
1. Use the stored day key, if the app starts saving it (see section 4, item 1). This is the best option.
2. Otherwise use sequence. Within a block week, the first session matching a day pair
   (Chest-Back, Arms or Lower Body) is **A** and the second is **B**.
3. As a fallback, compare the logged reps with the A and B prescriptions for that exercise and pick
   the closer one. For example, logged reps of about 12 when A prescribes 12 and B prescribes 15 means A.

Always compare **A with A and B with B**. Never average them together. B days are planned to use
lighter weights, so mixing them makes progress look like a zig-zag.

**R3. Which sets count as working sets.**
- **Warm-ups.** Ignore any set whose weight is below 50% of that session's heaviest set for the same
  exercise. Do not apply this rule to bodyweight exercises, where weight is 0.
  The light first set of an ascending pyramid is usually above 50% of the top set (in the
  strategy example 40 kg is 73% of 55 kg), so it still counts.
- **Drop sets ("12+12", "15+15", "20+20").** The current data model has no "drop" flag, so the part
  after the drop shows up as a separate, lighter set. When the planned technique is `drop-set` and
  the user logged about twice the planned number of sets, pair them in order: each heavier set is
  followed by a lighter one about 15–35% lower. The heavier part is the **parent set**, the lighter
  part is the **drop**.
  - Volume (insight 5): parent plus drop counts as **1 set**.
  - Strength (insights 1–4): use **only the parent set**. A drop is done while already fatigued, so
    it says nothing reliable about strength.
  - If the pairing is unclear, treat all sets as normal sets for volume but leave the lighter half
    out of strength.
  - ⚠️ REVISAR: some coaches count a drop set as roughly 1.5 sets. Counting it as 1 is the
    conservative choice.
- **Pyramids** (ascending, reverse and flat) need no special handling. Each logged set is a working
  set, and the strength formula below automatically picks the most informative set.
- **Supersets.** Each exercise in the pair is logged and counted separately, as normal.

**R4. Bodyweight exercises** (`equipment: bodyweight`, logged weight = 0, such as `pull-up`). Skip the
estimated 1RM, because without bodyweight it cannot be calculated. Track **best reps in a set** and
**total reps** instead. Weighted versions logged with added kg (for example block 7's weighted dips and
pull-ups) can use added-weight PRs, but no estimated 1RM until bodyweight is recorded (section 4).

**R5. Minimum data.** Do not draw a trend line until there are at least **3 sessions** of that exercise
for the same day type. A new exercise's first session is a **baseline**, not a PR.

---

### Insight 1: Strength trend per exercise (estimated 1RM)

**What it shows.** For each exercise, one number per session that answers "am I stronger than
before?" even when weights and reps both changed. This replaces "top weight" as the main line.

**Why it matters.** Progressive overload, meaning gradually doing more weight or more reps over time,
is the main driver of long-term gains. Comparing raw weights is misleading when reps change: 60 kg × 8
and 55 kg × 12 are hard to compare by eye. An estimated 1RM (the most you could lift once) turns both
into one comparable number.

**Calculation.**
- For every working set (R3) of a loaded exercise with **1 ≤ reps ≤ 12**, compute the Epley estimate:
  `e1RM = weight × (1 + reps / 30)`. When reps = 1, `e1RM = weight`.
- The session's value is the **highest e1RM among its sets**. In practice that is:
  - in a reverse pyramid, usually set 1 (for example 8 × 60 kg gives 60 × 1.267 = 76.0 kg, which beats
    10 × 55 kg at 73.3 kg)
  - in an ascending pyramid, usually the last, heaviest set
  - in flat sets, all sets have the same weight, so the set with the most reps wins (4 × 12 at 20 kg
    gives 20 × 1.4 = 28.0 kg)
  - in a drop set, only the parent set
- **Sets above 12 reps.** Rep-max formulas lose accuracy beyond roughly 10–12 reps. If a session has
  no set at 12 reps or fewer (common on B days, which use 12–20 reps), **leave e1RM empty** for that
  session and show the "best set" (weight × reps) instead. Those sessions still count for PRs
  (insight 2) and the reps-hit rate (insight 6).
- Round to 0.5 kg for display.
- Using Brzycki (`weight × 36 / (37 − reps)`) instead is fine. It gives exactly the same answer as
  Epley at 10 reps and slightly lower values for heavier, lower-rep sets. Pick one formula and never
  mix them.

**Fair comparisons.**
- **Within a block:** the same exercise on the same day type (A vs A) is the cleanest comparison and
  the default view.
- **Across blocks:** the same exercise id only. Exercises often change between blocks. Different
  exercises (for example a machine press and a dumbbell press) are **never** compared, even when they
  share a movement pattern, because machines and free weights load the muscle differently.
- **Method changes:** a 6-rep strength block tends to produce higher e1RM values than a 12–15-rep
  block for the same person. The jump at a block boundary therefore partly reflects the formula and
  the rep range, not only real strength. Mark block boundaries on the chart and do not call a drop at
  a boundary a "regression".
- **Lighter weeks:** block 8 week 1 is a planned lighter week. Show it as a hollow dot and leave it
  out of baselines, PRs and stall checks.

**Phone display.**
- A line chart with one dot per session. Default series: **A days**, with a toggle to show B days as
  a second, lighter line.
- Shaded vertical bands per block, labelled with the block number and method ("B6 · Flat").
- Default window: **current block and the previous one** (about 12 weeks). Toggles: 6 months and All.
- A big number on top for the latest e1RM, and below it the change vs block week 1 (or week 2 after a
  lighter week).
- Generated takeaway (one line, plain English) from templates such as:
  - "Incline Dumbbell Press: est. 1RM +6% this block (28.0 → 29.7 kg)."
  - "Leg Press: holding steady for 3 weeks. See tips."
  - "New exercise this block: first session sets your baseline."
- Tapping a dot shows the session's sets.

**When it can mislead.**
- High-rep sets, sets taken far from failure, and different tempo or range of motion all add noise.
  Small changes of ±2% from one session to the next are noise, so show the trend, not daily swings.
- On machines, the stack numbers are only comparable on the **same machine**. A different gym breaks
  the line.
- Supersets and drop sets earlier in the session make later lifts look weaker. Session order is the
  same within a block, so this cancels out within a block but not across blocks.
- e1RM is an **estimate**. Label it "est. 1RM" and never present it as a weight to try. A real 1RM
  test is not part of this program.

---

### Insight 2: Personal records (PRs)

**What it shows.** Badges when you beat your own best on an exercise.

**Why it matters.** PRs are the most motivating and easiest-to-understand proof that you are
progressing. In a block program they also confirm that the method is working.

**Calculation.** Compare each session (working parent sets only, R3) against **all earlier sessions of
the same exercise id**. Ignore lighter weeks and the baseline session (R5).

| PR type | Rule |
|---|---|
| **Weight PR** | Heaviest weight ever lifted for at least the prescribed minimum reps, or at least 1 rep if there is no plan. |
| **Rep PR** | More reps than ever before **at this weight or heavier**. For example, 12 reps at 30 kg when the previous best at 30 kg or more was 10 reps. |
| **e1RM PR** | Highest session e1RM ever (insight 1 rules, sets of 12 reps or fewer). |
| **Bodyweight rep PR** | Most reps in one set of a bodyweight exercise. |

- Show at most **3 badges per session**. Priority: e1RM PR, then weight PR, then rep PR.
- Ignore a PR that beats the previous best by less than 0.5 kg (rounding artifact).

**Phone display.**
- A small trophy badge on the session in history and on the matching dot in the strength chart.
- A "Recent PRs" list at the top of Progress covering the last 30 days, newest first. Each row reads,
  for example, "Rep PR: T-Bar Row, 12 × 40 kg (prev. 10)".
- Takeaway: "3 PRs this week, all on Chest-Back A."

**When it can mislead.**
- Early in an exercise's history almost every session is a PR (beginner and learning effects). The
  baseline rule and a minimum of 3 previous sessions keep this down.
- A switch to a lower-rep block creates "free" weight PRs. That is fine to celebrate, but the block
  report card (insight 4) gives the fairer comparison.
- Logging errors (a typo of 200 instead of 20 kg) create fake PRs that block real ones forever. Let
  the user edit or dismiss a PR, and ask "Did you mean 20 kg?" when a set is more than 30% above the
  previous best.

---

### Insight 3: "Ready to progress" and stall (plateau) detection

**What it shows.**
- A positive nudge when you have earned a weight increase.
- A warning, with a suggested action, when a lift has stopped improving.

**Why it matters.** The approved strategy already has a clear progression rule: when you hit **every
rep of every set** with good form, add the smallest step next time. If you miss reps, keep the weight
and beat it by one rep. The app can apply this rule for you. Spotting stalls early prevents weeks of
wasted sessions.

**Calculation.**
- **Ready to progress.** For an exercise on a given day type, compare the latest session's working
  sets with the plan for that block and day (blocks.json `reps`). For drop sets, use the parent part
  ("12+12" means 12). If **all planned sets were logged and every set reached at least the prescribed
  reps**, show "Ready to add weight". Suggest +1–2.5 kg for upper-body exercises and +2.5–5 kg for
  lower-body exercises (by `body_region`). For pyramids, apply this per set.
- **Stall.** Using only sessions inside the current block and **from block week 3 on** (weeks 1–2
  are for learning new exercises and finding the right weights):
  - **Stalled:** the best e1RM (or best reps for bodyweight, or best reps at the same weight for
    sets above 12 reps) has **not beaten the previous best by more than 1% in the last 3 sessions of
    the same day type** (about 3 weeks).
  - **Dropping:** the last 2 sessions are both at least 5% below the block best.
- **Broad stall.** If **3 or more key lifts stall in the same week** while adherence (insight 6) is
  high, flag "Possible fatigue" instead of individual stalls.

**Suggested actions (fitness logic for the app's tips, in this order).**
1. "Aim for **one more rep** at the same weight before adding load." Adding reps is valid progressive
   overload, and evidence suggests it builds muscle about as well as adding weight.
2. "Use a smaller weight step (1 kg or the next dumbbell) if your gym allows it."
3. "Check that rests match the plan." The block insights give 60–120 s, or about 2 minutes in
   strength blocks.
4. For a broad stall: "Many lifts stalled at once. Sleep, food and stress usually matter more than the
   program. A new block starts in N weeks." Mid-block, do not suggest changing exercises. The block
   rotation already handles that.
5. Always add: "If a lift causes pain, stop that exercise and see a qualified professional."

**Phone display.**
- A small "Action" card at the top of Progress with at most 3 items. A green arrow means ready to add
  weight; amber means stalled. Example: "Pendulum Squat (Lower A): you hit all 4 × 12. Add 2.5–5 kg
  next time."
- A stalled exercise gets an amber "Holding" chip on its chart. Do not use red, because in a 6-week
  block a plateau is normal, not a failure.

**When it can mislead.**
- Missing data (an exercise not logged) looks like a stall. Only count sessions where the exercise was
  actually logged.
- Users who deliberately hold a weight (for technique) will see nudges. Make them dismissible.
- The rep-hit rule assumes good form and RPE 9 or easier. Without logged RIR (section 4) the app
  cannot check effort, so phrase it as a suggestion ("you hit every rep; consider adding…"), not an
  order.

---

### Insight 4: Block report card (block-over-block comparison)

**What it shows.** For each finished block, how much each lift improved from start to end, plus one
headline number. It also shows how blocks with different methods compare.

**Why it matters.** The program is built around 6-week blocks that alternate volume, intensity and
strength methods. The real question is "did this block move me forward?" Whole blocks are a much less
noisy unit than single weeks.

**Calculation.**
- For each exercise and day type in the block:
  - **Start** = best session value in block weeks 1–2. In block 8, which has a lighter week 1, use
    week 2 only.
  - **End** = best session value in weeks 5–6.
  - Using the best of two weeks evens out a single bad day.
  - **Change % = (End − Start) / Start × 100.**
  - Value = e1RM where available (sets of 12 reps or fewer); otherwise best reps at the most-used
    weight, or best reps for bodyweight exercises.
- **Block headline** = the **median** change % across exercises with valid start and end values. The
  median is used so one outlier does not dominate. Also show the count, for example "9 of 12 lifts
  improved".
- **Key lifts** = the first exercise (code A1, or the first exercise of the session) of each A day.
  These are the main compound lifts. List them first.
- **Across blocks:** compare block headlines side by side (block 1 +X%, block 2 +Y%…), labelled with
  the method. Compare the same exercise's end values between blocks only when the exercise id
  repeats.
- ⚠️ REVISAR: blocks with new exercises show bigger gains (people improve fast on new movements), so
  "% change" favours blocks with many new exercises. Show a small "new exercises" count next to each
  headline.

**Phone display.**
- One card per block, newest first. Header: "Block 5 · Reverse pyramid · +5% median, 10/12 lifts up".
- Expanded view: a list of exercises with start → end, % change, and an up, flat or down arrow, with
  key lifts on top.
- A compact bar chart of the median change per block, with bars labelled by method.
- Takeaway examples:
  - "Block 5 was your best block for upper body (+7%)."
  - "Lower body gained most in the strength block."
- For the current block, show "Week 3 of 6, so far +3%" and mark it as in progress.

**When it can mislead.**
- Strength blocks naturally show bigger e1RM jumps. The method label next to each number is
  essential.
- Volume blocks may show small strength change while still building muscle, which strength numbers
  cannot measure. Add a fixed footnote: "Volume blocks build muscle even when strength numbers move
  less."
- Fewer than 2 sessions in the start or end window means "not enough data", not 0%.

---

### Insight 5: Weekly hard sets per muscle group

**What it shows.** How many challenging working sets each muscle group got this week, compared with an
evidence-based range and with what the block planned.

**Why it matters.** Weekly sets per muscle is the most useful single measure of training dose for
muscle growth. Research shows a dose-response: more weekly sets generally means more growth, with
diminishing returns at high volumes. Recent analyses also support counting work for secondary muscles
as a fraction of a set.

**Ranges used** (per muscle group, per week, for hypertrophy in trained lifters):

| Fractional sets/week | Label |
|---|---|
| fewer than 6 | **Low**: probably below what this program intends |
| 6–9 | **Light** |
| **10–20** | **In range** (target band) |
| more than 20 | **High**: fine short-term if you are recovering well; watch for stalls |

⚠️ REVISAR: these bands follow the literature (at least 10 sets/week clearly beats fewer; benefits
taper above about 20). Individual tolerance varies a lot, so these are guides, not rules.

**Calculation.**
- **Hard set** = a working set (R3) on any exercise. All sets in this program are prescribed close to
  failure (RPE about 9). Without logged RIR, the app assumes logged working sets are hard. Count a
  drop set as 1. Count block 8 week 1 sets normally, since they are still about 3 reps from failure,
  which is close enough to count.
- For each set, credit **1.0** to every display group containing a **primary** muscle and **0.5** to
  every group containing only a **secondary** muscle. A set credits a group **at most once**. For
  example, an exercise with both Chest and Upper Chest as primaries gives Chest 1.0, not 2.0.
- Display groups mapped from catalogue `primary_muscles` and `secondary_muscles`:

| Display group | Catalogue muscles | Flagged against the range? |
|---|---|---|
| Chest | Chest, Upper Chest | yes |
| Back | Lats, Upper Back | yes |
| Shoulders (side and rear) | Side Delts, Rear Delts | yes |
| Front delts | Front Delts | no (pressing covers them; show only) |
| Biceps | Biceps | yes |
| Triceps | Triceps | yes |
| Quads | Quads | yes |
| Hamstrings | Hamstrings | yes |
| Glutes | Glutes | yes |
| Calves | Calves | yes |
| Core | Abs, Obliques | yes (⚠️ REVISAR: some lifters prefer a lower 6–10 target) |
| Other | Traps, Forearms, Lower Back, Hip Flexors, Adductors, Abductors | no (show only) |

- **Planned sets.** Run the same calculation on the block's planned week from blocks.json (sets per
  exercise × muscles), so each muscle shows "done vs planned".
- **Weeks.** Calendar weeks, Monday–Sunday. Flag only **completed** weeks. The current week shows
  "so far" plus the planned sets for the remaining days.

**Phone display.**
- A horizontal bar per muscle group. A shaded band marks 10–20, and a thin tick marks the planned
  value.
- Bars are coloured by label: grey for Low or Light, green for In range, amber for High.
- A week selector with arrows, defaulting to this week (last week if this week has fewer than 3
  sessions). A secondary view shows a 6-week sparkline per muscle for the block.
- Takeaway examples:
  - "Rear and side delts: 7 sets this week, below the 10–20 range. Block 6 adds rear-delt work on Arms days."
  - "All main muscles in range this week."

**When it can mislead.**
- Fractional counting is an approximation. A row's real biceps work depends on grip and effort.
- Without RIR, a set stopped 6 reps from failure counts the same as a set taken to failure.
- One missed session can drop a muscle below the range for that week. Look at the 2-week average
  before reacting, and never trigger an alert from one low week.
- "More is better" is only true up to the point you can recover from. Never show "add sets" as an
  automatic recommendation.

---

### Insight 6: Plan adherence and consistency

**What it shows.** Whether you are doing the plan: sessions completed, and how much of the prescribed
work you actually did.

**Why it matters.** Consistency is the biggest predictor of results. Adherence also explains the other
charts: a "stall" with 60% adherence is a scheduling problem, not a training problem.

**Calculation.**
- **Sessions done vs planned:** distinct session dates in the week ÷ 6, and in the block ÷ 36. Cap the
  week at 6/6, and count extra sessions separately.
- **Exercises done:** planned exercises logged ÷ planned exercises, per session.
- **Reps hit rate:** for each planned set (blocks.json `sets` and `reps`; for drop sets the parent part
  only), compare it with the matching logged set in order. Missing sets count as missed. Hit means
  logged reps ≥ prescribed reps.
  `hit rate = sets hit ÷ planned sets`, reported per session, per week and per block.
- **Reading the hit rate** (practical guide):
  - 70–95% is healthy. You are pushing near your limit and progressing.
  - Consistently 100% probably means the weights are too light (combine with insight 3's "ready to
    progress").
  - Below 60% for 2 weeks probably means the weights jumped too fast or recovery is poor.
  - ⚠️ REVISAR: these thresholds are coaching judgement, not research-derived.
- Missed days do not break the sequence, because the plan says to continue with the next day.
  Adherence measures sessions per week, not specific calendar days.

**Phone display.**
- A compact **6-dot row per week** (one dot per planned day, A1, A2, A3, B1, B2, B3). Filled means done,
  hollow means not yet. Stack 6 rows to show the whole block.
- A ring or percentage for "Block: 31 of 36 sessions (86%)".
- The reps hit rate as a small number with a trend arrow.
- Takeaway examples:
  - "5 of 6 sessions this week; you hit 88% of prescribed reps."
  - "Lower Body B missed 2 weeks in a row."
- Avoid "streak" pressure mechanics (see section 3).

**When it can mislead.**
- If the user logs only some exercises, adherence looks worse than reality. Show "logged" rather than
  "done" in tooltips.
- A deliberate lighter week (block 8 week 1, skipping the last set) should be compared with its own
  reduced plan, not the full plan.

---

### Insight 7 (optional): Muscle balance

**What it shows.** Whether opposing muscle groups get roughly comparable work.

**Why it matters.** Balanced pushing and pulling is commonly recommended for shoulder health and
posture, and the split was designed (chest paired with back) to keep it balanced. This insight
confirms the logged reality matches the design.

**Calculation** (weekly fractional sets from insight 5, averaged over the last 4 weeks):
- **Push vs pull:** sets from `push horizontal` + `push vertical` exercises vs `pull horizontal` +
  `pull vertical` exercises, by `movement_pattern`. Count primary sets only.
  - Target ratio, pull to push: **1.0 to 1.5**. Flag if pull falls below 0.8× push.
- **Quads vs hamstrings:** Quads sets vs Hamstrings sets. Flag if Hamstrings fall below about 0.6× Quads.
- ⚠️ REVISAR: both ratios are common coaching conventions, not hard evidence thresholds. Show them as
  information, not warnings.
- Use **sets, not strength ratios.** Comparing e1RM across different exercises is not valid (insight 1).

**Phone display.**
- Two simple split bars (Push | Pull, Quads | Hamstrings) with a "balanced" or "leaning push" label.
- Show these inside the weekly sets screen, not as a main card.

**When it can mislead.**
- Exercises with mixed patterns (`isolation`, `core`, `carry`) are ignored, so the ratio is only part
  of the picture.
- Short windows exaggerate imbalance, which is why the window is 4 weeks.

---

### Also considered: volume load trend (sets × reps × weight)

Show **only per exercise, within a block, and as a secondary line** (toggle on the strength chart).
Volume load is useful to see that a volume block really added work. It is misleading as a headline:
- it rises just by doing more sets
- it cannot compare a 6-rep block with a 15-rep block
- it gives bodyweight exercises a value of 0

If shown, compute it from working sets including drop parts, and label it "Volume load (kg)".

### Suggested Progress screen order (phone)

1. **This block** card: week X of 6, sessions, PR count, and the single best takeaway.
2. **Actions**: ready to progress and stalls (at most 3).
3. **Recent PRs**.
4. **Exercises** list. Each row has a mini sparkline, the latest e1RM and the block % change. Tap a
   row for the full chart (insight 1).
5. **Weekly sets per muscle** (insight 5, with balance from insight 7).
6. **Consistency** (insight 6).
7. **Blocks** report cards (insight 4).

## 3. What NOT to show

| Don't show | Why |
|---|---|
| **Total tonnage (kg lifted) as a headline or for the whole session** | It mostly measures how many sets you did and in which rep range. It jumps between blocks for reasons unrelated to progress, and bodyweight exercises count as 0. |
| **e1RM from sets above 12 reps, drop-set parts, or warm-ups** | The formula is unreliable there and would create fake PRs and fake drops. |
| **e1RM presented as "your max"** | It is an estimate. Presenting it as a target could push someone into an unplanned max attempt. |
| **Comparisons between different exercises** (machine press vs dumbbell press, two different machines) | Loads are not comparable across equipment. |
| **Day-to-day or week-to-week % change as a headline** | It is mostly noise (sleep, food, A vs B day). Trends over 3+ sessions or whole blocks are meaningful. |
| **A and B days averaged together** | The B day's planned lighter weights look like regression. |
| **Calories burned** | No heart rate or time data. Any number would be invented. |
| **"Muscle recovery %" heat maps or "fatigue scores"** | There is no validated way to compute them from this data. |
| **Strength standards or "rank vs other lifters"** | They need bodyweight, sex and tested 1RMs. Without them they are misleading and can discourage. |
| **Streaks that reset on one missed day** | The plan explicitly says to continue with the next day. Streak pressure rewards training when you should rest. |
| **Red "failure" styling for plateaus** | Plateaus inside a 6-week block are normal. Use neutral or amber wording. |

## 4. Data we should start capturing

All optional, ranked by insight unlocked per unit of user effort.

1. **Session tag (block id, day key, A/B), saved automatically when logging from the plan.**
   - Effort: zero.
   - Unlocks: exact A vs B comparisons, exact adherence and reps-hit rate, and no guesswork in R2.
2. **Set type flag: warm-up / working / drop**, ideally recording a drop as a part attached to its
   parent set.
   - Effort: one tap, and only when it is not the default.
   - Unlocks: correct volume and strength numbers for drop-set blocks (2, 5 and 9). Removes the
     pairing heuristic in R3.
3. **RIR (reps in reserve) for the last set of each exercise**: quick chips 0 / 1 / 2 / 3+.
   - Effort: low.
   - Unlocks: true hard-set counting, RIR-adjusted e1RM (more accurate at lower effort), and a real
     check of the "RPE 9 or easier" progression rule. Stalls can then be told apart from sandbagging
     (deliberately easy sets).
4. **Bodyweight, once a week (optional)**.
   - Unlocks: an e1RM for bodyweight and weighted-bodyweight lifts (pull-ups, dips: bodyweight +
     added kg) and a relative-strength trend.
   - Show it to the user only if they choose to.
5. **Session start and end time (automatic)**.
   - Unlocks: session duration and density. This has low value for progress; it is mainly useful
     for planning.

## 5. ⚠️ Decisions for Sebas

1. **A vs B in the strength chart.** Should the chart show **A days only by default** (cleanest
   strength signal) with B days behind a toggle, or both lines always?
2. **Coaching nudges.** Should the app give **actions** ("add 2.5 kg next time", "stalled: try one
   more rep"), or only describe progress?
3. **Drop-set logging.** Is it OK to change how drop sets are logged (the drop attached to its parent
   set) so the numbers are accurate? Without this the app has to guess.
4. **Effort input.** Do you want a one-tap **RIR on the last set** of each exercise? It is optional,
   but it makes the weekly-sets and progression insights much more reliable.

## Sources

- Schoenfeld BJ, Ogborn D, Krieger JW (2017). Dose-response relationship between weekly resistance
  training volume and increases in muscle mass: a systematic review and meta-analysis. *J Sports Sci*
  35(11):1073–1082. Higher weekly set counts are associated with greater hypertrophy; 10+ sets/week
  per muscle outperformed lower volumes.
- Pelland JC, Remmert JF, Robinson ZP, et al. (2024). The resistance training dose-response:
  meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and
  strength gain. *SportRxiv* preprint. Supports counting indirect (secondary) sets fractionally and
  shows diminishing returns at high volumes.
- Baz-Valle E, Balsalobre-Fernández C, Alix-Fages C, Santos-Concejero J (2022). A systematic review of
  the effects of different resistance training volumes on muscle hypertrophy. *J Hum Kinet* 81:199–210.
  Reports about 12–20 weekly sets per muscle as a practical range for trained people.
- Schoenfeld BJ, Ogborn D, Krieger JW (2016). Effects of resistance training frequency on measures of
  muscle hypertrophy: a systematic review and meta-analysis. *Sports Med* 46(11):1689–1697. Training
  each muscle twice a week is well supported.
- Epley B (1985). *Poundage Chart*. Boyd Epley Workout, Lincoln, NE. Source of the
  weight × (1 + reps/30) estimate.
- Brzycki M (1993). Strength testing: predicting a one-rep max from reps-to-fatigue. *JOPERD*
  64(1):88–90.
- LeSuer DA, McCormick JH, Mayhew JL, Wasserstein RL, Arnold MD (1997). The accuracy of prediction
  equations for estimating 1-RM performance in the bench press, squat, and deadlift. *J Strength Cond
  Res* 11(4):211–213.
- Reynolds JM, Gordon TJ, Robergs RA (2006). Prediction of one repetition maximum strength from
  multiple repetition maximum testing and anthropometry. *J Strength Cond Res* 20(3):584–592.
  Prediction accuracy drops as reps increase, which is why e1RM is capped at 12 reps here.
- Helms ER, Cronin J, Storey A, Zourdos MC (2016). Application of the repetitions in reserve-based
  rating of perceived exertion scale for resistance training. *Strength Cond J* 38(4):42–49.
- Zourdos MC, Klemp A, Dolan C, et al. (2016). Novel resistance training-specific rating of perceived
  exertion scale measuring repetitions in reserve. *J Strength Cond Res* 30(1):267–275.
- Refalo MC, Helms ER, Trexler ET, Hamilton DL, Fyfe JJ (2023). Influence of resistance training
  proximity-to-failure on skeletal muscle hypertrophy: a systematic review with meta-analysis.
  *Sports Med* 53(3):649–665. Sets need to be reasonably close to failure to count as hard.
- Plotkin D, Coleman M, Van Every D, et al. (2022). Progressive overload without progressing load? The
  effects of load or repetition progression on muscular adaptations. *PeerJ* 10:e14142. Adding reps
  and adding weight produced similar hypertrophy.
- American College of Sports Medicine (2009). Position stand: Progression models in resistance training
  for healthy adults. *Med Sci Sports Exerc* 41(3):687–708. Progressive overload principles and
  load-increment guidance.
- GymStudio approved training strategy and blocks:
  `docs/fitness/approved/training-blocks/strategy.md`, `blocks.json`. Progression rule, A/B rep
  schemes, block 8 lighter week.
