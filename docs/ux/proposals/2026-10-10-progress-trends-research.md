# Progress trends: research and the Progress v3 structure

- Date: 2026-10-10 · Author: UXer · Status: **research and information architecture, needs PO approval**
- Trigger: the PO reviewed Progress v2 (`2026-10-10-progress-v2.md` + `.html`) and asked for trends and a deeper analysis.
- Fitness numbers (thresholds, rates, how much data is "enough") come from the PT draft
  `docs/fitness/drafts/2026-10-10-progress-trends.md`. This document refers to them as `PT-TREND-n`
  placeholders and does not invent any rules.
- No prototype yet, as requested.

## 1. Why v2 is not enough

v2 fixed week 1 by comparing each session with the previous one. It does not answer the PO's question
after several weeks: **"Over time, am I getting stronger, doing enough work, and showing up?"** The
trend layer is missing:
- Strength is shown as first-vs-latest e1RM with no minimum (`strengthTrend.ts:47-62`). This is noisy
  and has no rate.
- Weekly sets per muscle (`weeklySets.ts`) covers one week, so you can't see a direction across weeks.
- Consistency is a streak count with no "planned vs done per week" history.
- Nothing marks block boundaries, deloads, exercise swaps or PRs on a chart, so a dip looks like a failure.

## 2. How leading apps show progress (summary)

Sources: official docs, app-store listings and reviews (links in §7). Each row cites what was checked
on 2026-10-10. "Could not verify" means no source described the screen itself.

| App | What it shows | Chart types and ranges | When there's little data | Good | Bad |
|---|---|---|---|---|---|
| **Hevy** | Per-exercise best set / e1RM / volume, volume per muscle over time, workout frequency, muscle heat map | Line and bar charts; 30 days, 3 months, year, all time (longer ranges are Pro) | Charts show only a few points; no explanation | Muscle volume over weeks is easy to read; one tap from exercise to chart | A lot of raw charts and no takeaway sentence |
| **Strong** | Per-exercise graphs (best set, e1RM, volume), records, workouts per week | Line charts; charts are a paid feature | Empty chart | Clean records list | No per-muscle trends and no interpretation |
| **Fitbod** | Estimated strength per lift, a 0-100 per-muscle score (mStrength), an overall Strength Score, muscle recovery | Lines plus scores | Scores appear with the first workouts | One number answers "am I improving?" | The scores are opaque, so users can't check how they're calculated |
| **JuggernautAI** | Third-party sources say it has an analytics dashboard with strength gains (e1RM), volume distribution and recovery/fatigue metrics, built from sets logged with weight, reps and RPE | Chart types and ranges: **could not verify** | **Could not verify** | Includes RPE-based fatigue as well as strength | A Garage Gym Reviews review calls the dashboard confusing at first. A good warning against packing too much in |
| **RP Hypertrophy** | RP's own material: track weekly sets per muscle against volume landmarks (minimum / optimal / maximum effective volume). The app adjusts each week from pump, soreness and performance feedback. Mesocycles run 4-6 weeks, then a deload | Progress UI: **could not verify** from official screenshots or docs | Starts from a planned volume, not from history | Ties the muscle-volume view to the mesocycle and its deload (= our blocks) | Couldn't find a visual trend described anywhere |
| **Alpha Progression** | App Store listing: after each workout it shows records for weight, reps, volume, estimated 1RM and 10RM, best per muscle group. Charts cover strength, volume, sets per muscle, workouts per week, bodyweight and measurements. CSV export | Graphs over time; ranges **could not verify** | Charts are Pro-only (developer site) | Right-after-workout records give value from session 1 | Charts are behind the paywall; a long list of separate charts |
| **Boostcamp** | App Store listing and official site: performance/strength charts, muscle-volume tracking, streaks, personal/exercise records, lifetime stats, muscle heat map | Ranges **could not verify** | Streaks and records work early | Streaks plus records as early rewards | A review recommends the paid plan to get the full progress charts |
| **Apple Health/Fitness Trends** | Arrow cards comparing the 90-day average with the 365-day average. Grouped into "Keep it going", "Worth a look" (with tips) and "Needs more data". Detail shows the past year with the last 90 days highlighted. Needs about 180 days of data before it starts (MacStories, Macworld) | Two-band bar/line with the average highlighted; shown only once there is enough data | Hidden until enough data exists | Plain-language trend sentence plus a period comparison. **Best pattern to borrow.** | Not tied to any goal |
| **Garmin Training Status** | Garmin manual: status words (Productive, Maintaining, Recovery, Detraining, Peaking, Overreaching, Unproductive, Strained), each with one sentence of meaning and advice. Based on VO2 max trend, acute load and HRV. An activity's load counts in acute load for about 10 days | Status plus load charts | **"No Status"** until several activities over two weeks | A status word with a plain explanation and a next step. A clear model for our status word | Many states; it relies on cardio metrics we don't have |
| **Whoop** | Trends view: week/month/6 months vs your own baseline | Line plus a band for your normal range | Calibration period | Compares you with your own baseline, not with others | Paywalled |

## 3. Data-viz guidance for trend charts

1. **Sparklines** (Tufte, verified): word-sized lines with as much data and as little decoration as possible. Mark the
   latest value with a dot, optionally add a grey "normal range" band, and use no frames. Aim for slopes of about 45°.
   When comparing lifts, put them on a common index (e.g. % of the block's starting value), not each scaled to its own min/max.
2. **Small multiples**: the same chart repeated per lift or muscle, with the same scale per row. Readers
   compare shapes faster than they read numbers. Use this for muscles.
3. **Smoothing**: raw e1RM per session is noisy (rep ranges change inside a pyramid). Show raw points
   faintly plus a moving average or trend line in bold. The window size is `PT-TREND-1`.
4. **Uncertainty**: show fewer than `PT-TREND-2` sessions as "Building trend (n of N)", not as a slope.
   Never print a % change from 2 points. A light range band is fine; don't show statistics jargon.
5. **Annotations**: vertical markers for block start, deload, exercise swap and PR on the time axis.
   NN/g (verified): use position and length (lines, bars) for quantities, not colour, gauges, radar or pie charts.
   Put the critical information on one screen you can read at a glance.
6. **Period comparison**: "last 4 weeks vs the 4 before", shown as two bars or a delta chip, with the
   same-length windows (Apple Health pattern). For blocks, compare like with like: block N vs block
   N-1, week by week.
7. **A takeaway first**: each chart starts with one sentence in plain language, and the chart backs it
   up. The rule for the sentence comes from the PT.
8. **Rate, not just change**: "+1.2 kg/week" is easier to act on than "+7 %", and it is comparable
   across time ranges. The formula is `PT-TREND-3` (e.g. a slope over e1RM or top-set load).
9. **Accessibility**: don't rely on colour alone (use an arrow plus a word), meet text contrast, give
   charts an `aria-label` with the takeaway, and use `tabular-nums` for numbers (Vercel guidelines, below).

### Evidence quality
- **Strong evidence (official docs/manuals):** Garmin Training Status manual, Tufte, NN/g, RP's own volume guidance.
- **Medium (app-store listings and the developer's own claims):** Hevy, Fitbod, Alpha Progression, Boostcamp. These describe
  features but not exact screens or ranges.
- **Medium (reputable press):** Apple Trends (MacStories/Macworld). Apple's own guide page didn't load usable content.
- **Weak:** JuggernautAI (third-party profiles plus one review). RP Hypertrophy's progress *screens* (no official
  description found). We did not install or use these apps. A hands-on check would need the PO's own trial accounts.
- **Takeaway:** the patterns we adopt (status word, comparing recent vs baseline, a "needs more data" state, volume per
  muscle by mesocycle week, word-sized trend lines) each have at least one strong or medium source.

## 4. Trend patterns GymStudio should adopt

| Trend | Shown as | Data rule (PT) | Little-data state |
|---|---|---|---|
| Strength per lift | Sparkline plus "+x kg/wk" chip; detail: points, smoothed line, annotations | e1RM or top-set metric, smoothing, minimum sessions, which lifts count: `PT-TREND-1..4` | "Building trend · 2 of N sessions", plus the v2 last-vs-previous comparison |
| Volume per muscle | Small-multiple weekly bars with the target band shaded | Sets per muscle and band limits: `PT-TREND-5` (existing weeklySets bands are pending PT confirmation) | Week 1 bar plus the band |
| Consistency | Week strip: planned vs done per week (e.g. 5/6), plus a streak | What counts as a done day: `PT-TREND-6` | Current week only |
| Block over block | Same week of block N vs block N-1 per main lift | Comparable-exercise mapping across swaps: `PT-TREND-7` | Hidden until a second block exists |
| Period comparison | "Last 4w vs previous 4w" delta chips for strength, sets and sessions | Window length and minimum: `PT-TREND-8` | Hidden until 8 weeks exist; explain why |
| Annotations | Markers: block start, deload week, swap, PR | Deload definition: `PT-TREND-9` | Always shown |
| Overall status | One word plus a reason (Progressing / Holding / Dipping / Building) | Rules for each word: `PT-TREND-10` | "Building" until the minimum is reached |

**Avoid:** opaque composite scores (Fitbod style) unless the PT defines them and we explain them; %
changes based on too few points; separate charts for every metric with no takeaway.

## 5. Proposed Progress v3 structure

The screen has a top segmented control: **Overview · Trends · Muscles · Consistency**. Per-lift detail is
a pushed screen. The app's current type scale and card style stay the same (no new font sizes).

```
OVERVIEW (answers "am I progressing?" at a glance)
┌───────────────────────────────┐
│ Block II · week 3 of 6        │
│ Progressing  ▲                │  ← status word + 1-line reason (PT-TREND-10)
│ 5 of 6 main lifts trending up │
├───────────────────────────────┤
│ Bench press    ╱╲╱‾•  +1.0kg/wk│  ← sparkline + rate chip, tap → lift detail
│ Squat          _/‾‾•  +1.5kg/wk│
│ Pulldown       ‾‾‾‾•  holding  │
│ RDL            building 2/4    │
├───────────────────────────────┤
│ This week  ▮▮▮▮▮▯ 5/6 days    │
│ Muscles on target 7 of 9      │
├───────────────────────────────┤
│ Last session vs previous (v2)│  ← keep v2 card for week-1 value
└───────────────────────────────┘

TRENDS   [4w | 8w | Block | All]
┌───────────────────────────────┐
│ Last 4w vs previous 4w        │
│ Strength +3%  Sets +8  Days = │  ← delta chips (PT-TREND-8)
├───────────────────────────────┤
│ Strength trend (main lifts)   │
│  •·•·•━━━━━━━•  |B2  ★PR  ⇄swap│  ← raw faint, smoothed bold, markers
├───────────────────────────────┤
│ Block over block (same week)  │
│ Bench  B1 w3 62.5 → B2 w3 67.5│
└───────────────────────────────┘

LIFT DETAIL (pushed)
 Title, takeaway sentence, rate/week
 Chart: e1RM points + smoothed line + annotations, range toggle
 Best sets / PRs list · session list (date + plan day, existing rows)

MUSCLES
 Small multiples: one row per muscle, weekly set bars over range,
 target band shaded, label "on target / below / above" + arrow

CONSISTENCY
 Week strip per week of block (done/planned), streak,
 missed-day list per week; no guilt copy
```

How it behaves with little data: every module has a "Building" state with an n-of-N counter, and the v2
session comparison stays visible until trends unlock. So week 1 is never an empty screen.

## 6. Impact / effort

| # | Item | Impact | Effort | Depends on |
|---|---|---|---|---|
| 1 | Overview status + lift sparklines + rate chip | High | M | PT-TREND-1..4, 10 |
| 2 | Building-trend states (no % from 2 points) | High | S | PT-TREND-2 |
| 3 | Annotations (block, deload, swap, PR) | High | S-M | PT-TREND-9; swap data in history (Tech Lead) |
| 4 | Muscles small multiples over weeks | Med-High | M | PT-TREND-5 |
| 5 | Consistency week strip | Med | S | PT-TREND-6 |
| 6 | Period comparison 4w vs 4w | Med (grows with time) | S | PT-TREND-8 |
| 7 | Block over block | Med (after block 2, about mid-November) | M | PT-TREND-7 |
| 8 | AI one-line explanation of the trend (engine decides, LLM explains) | Med | M | Tech Lead/cost; existing AI guardrails |

How we'll measure success: the PO can say in 5 seconds whether he's progressing; he opens Progress
weekly; no misread dips after deloads (checked in a QAer review).

### Web Interface Guidelines check
The rules are the vendored `.claude/skills/web-design-guidelines/command.md` from vercel-labs commit
`4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`, checked on 2026-10-10. The SHA-256 matches
(`d246b026…0234`). I applied the relevant rules as requirements for v3: numbers use
`font-variant-numeric: tabular-nums`; charts have an accessible name and text alternative; colour is
never the only signal; the segmented control and range toggle are real buttons with a visible focus
state; reduced motion is respected for chart animations. I didn't run a file:line audit of the current
Progress source in this pass. The earlier full-app audit (#290) covers it.

## 7. Sources
- Hevy, gym progress features: https://www.hevyapp.com/features/gym-progress/
- Fitbod, estimated strength: https://fitbod.me/blog/estimated-strength/
- Fitbod, insights: https://fitbod.me/blog/fitbod-insights-feature/
- Comparison of Fitbod, Strong, Jefit and Hevy (JEFIT blog, vendor-written): https://www.jefit.com/blog/fitbod-vs-strong-vs-jefit-vs-hevy
- Hevy review: https://repreturn.com/?p=1625
- Apple Health trends / Training Load summary: https://www.wareable.com/apple/turn-your-apple-watch-into-whoop
- Apple Trends: https://www.macstories.net/stories/activity-trends-in-ios-13/ and https://www.macworld.com/article/233093/ios-13-and-apple-watch-activity-trends-give-you-the-big-picture.html (Apple support guide page fetched but had no usable content)
- Garmin Training Status Levels (manual): https://www8.garmin.com/manuals/webhelp/fenix66s6xpro/EN-US/GUID-6F81BF5B-B49A-4506-95E2-0F4A04D8B319.html ; Garmin blog: https://www.garmin.com/en-AU/blog/?p=3240 (the garmin.com technology page had no usable content)
- Tufte, sparklines: https://www.edwardtufte.com/notebook/sparkline-theory-and-practice-edward-tufte/
- NN/g, dashboards: https://www.nngroup.com/articles/dashboards-preattentive/
- RP volume landmarks: https://rpstrength.com/training-volume-landmarks-muscle-growth/
- Alpha Progression App Store: https://apps.apple.com/us/app/gym-workout-alpha-progression/id1462277793 ; developer blog: https://alphaprogression.com/en/blog/documenting-training-progression
- Boostcamp App Store: https://apps.apple.com/us/app/boostcamp-gym-workout-fitness/id1529354455 ; review: https://www.garagegymreviews.com/boostcamp-review
- JuggernautAI App Store: https://apps.apple.com/ca/app/id1515756471 ; profile: https://startup-seeker.com/company/jugg~io
