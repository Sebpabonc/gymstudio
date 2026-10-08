# GymStudio Simple v2: keep every feature, make every feature visible (proposal)

Status: **proposal** (UXer, 2026-10-08). Needs PO approval before any Issue is written.
Prototype: `docs/ux/proposals/2026-10-08-simplified-app-v2-prototype.html` (375 px, clickable, EN/ES, light + dark).
Builds on: `2026-10-07-simplified-app.md` (v1).

## PO feedback that drives v2
- He likes v1's calm, but wants **more visibility and detail**.
- He uses the current app's features daily and only finds them **because he already knows where they are**.
  Example: tapping an exercise name opens a Google Images search. A new user would never guess that.
- Goal: a **middle ground**. Keep everything the current app does, make it simpler to scan, and make every
  feature discoverable: visible affordances, icons *with* labels, first-use hints, no mystery taps.

## Design principles (v2)
1. **No mystery taps.** Every tappable thing looks tappable and says what it does (icon + word). Text that
   happens to be a link (exercise name) gets an explicit button next to it instead.
2. **Whole workout visible, one exercise in focus.** Today shows the full exercise list (v1 hid it). Tapping
   a row opens the focused view with **all sets visible** (v1 showed one set at a time).
3. **Show the plan in the row.** Each row shows code (A1/B1), sets × reps, technique badge and progress
   (2/4 sets) so the PO can read the day at a glance, like the plan spreadsheet.
4. **Gestures are shortcuts, never the only way.** Swipe-to-delete keeps working, but each row also has a
   visible delete action (NN/g: hidden gestures have low discoverability).
5. **Teach once, then get out of the way.** One-line first-use hints (dismissible, remembered per device)
   for: name/Google, swipe-to-delete, swap, technique badges, "Same as set 1".
6. **AI decides, explains, and the user stays in control.** Target + one-line why is always visible;
   "Keep original" sits right next to it, not in a hidden menu.

References: NN/g, Progressive Disclosure (https://www.nngroup.com/articles/progressive-disclosure/);
NN/g, Icon Usability: icons need text labels (https://www.nngroup.com/articles/icon-usability/);
NN/g, Contextual Help / instructional overlays (https://www.nngroup.com/articles/mobile-instructional-overlay/);
Apple HIG Gestures: always provide a visible alternative (https://developer.apple.com/design/human-interface-guidelines/gestures);
Material 3 touch targets 48 dp (https://m3.material.io/foundations/designing/structure).
Competitors: Hevy and Strong show the whole workout as a list with every set row and a "Previous" column
visible, and an explicit exercise menu (instructions, replace, notes); Fitbod shows a labelled "Swap" and an
exercise info sheet with video. v2 borrows the list + visible set table + labelled menu pattern.

## Feature inventory
Discoverability today: **High** = visible with a label; **Medium** = visible but unlabelled or below the
fold; **Low** = hidden (gesture, link-styled text, or nested).

| # | Feature | Where it is today | Discoverable today | Where it goes in v2 | Visible affordance in v2 |
|---|---|---|---|---|---|
| 1 | Today's day + day tabs D1–D6 | Today, top tabs | High | Today header: "Day 1 · Chest-Back A" + day chips row | Chips with names, "Today" dot |
| 2 | Active block card, week of 6, deload note | Today top card | High | Today header line "Block 8 · Week 3 of 6" → taps open block sheet | Chevron + "About block" |
| 3 | Block insights (goal, how it works, tips) | "About this block" | Medium | Block sheet (from header) | "About block" button |
| 4 | Change / pin block, date-based block | Block chooser | Low | Block sheet → "Change block" | Labelled button |
| 5 | Calendar / program timeline / work done on a date | Calendar row | Medium | Progress → "Calendar" tab | Tab label |
| 6 | Exercise list for the day | Today, stacked cards | High | Today list (compact rows) | Row: code, name, sets×reps, badge, x/y |
| 7 | **Name → Google Images** | Tap exercise name (link styled as text, small icon) | **Low** | Focused view: "How to do it" row with **"See on Google"** button | Image icon + label; first-use hint |
| 8 | Bench angle / seat (Incline 45°) | Chip on card | High | Row subtitle + focused view chip | Chip |
| 9 | Technique: pyramid / reverse / drop set / superset | Small chips | Medium (unexplained) | Badge on row and focused view; **tap badge = one-line explanation** from approved block text | Badge with "i" |
| 10 | Superset pairing (A1/A2, rounds grid, "Finish superset") | Superset card, "Log rounds" | Medium | Rows grouped with a bracket "Superset · rest 10 s between"; focused view shows both exercises in rounds | Bracket + label |
| 11 | Drop set second weight/reps | Extra inputs per set | Medium | Set row shows "+ drop" sub-row | Labelled sub-row |
| 12 | **AI Trainer target + Why + confidence** | Trainer card on exercise | High (but busy) | Focused view top: "Target 12.5 kg × 10" + "Why" line + confidence dot | Always visible |
| 13 | Accept / **Keep original** | Trainer card buttons | Medium | Segmented control "AI target / Original" next to target | Two labelled options |
| 14 | Previous (last session) per set | Previous column | Medium (column, unlabelled meaning) | Set table column "Last time" | Column header |
| 15 | Target per set (pyramid reps) | Set inputs prefilled | Low | Set table column "Target" | Column header |
| 16 | Weight × reps steppers, mark set done | Set rows | High | Set table rows, big ✓ per set | ✓ button |
| 17 | "Same as set 1" / copy previous set | Small link | Low | Chip under set 1 when set 2 is empty | Labelled chip |
| 18 | Set hint ("consider 14 kg") | Banner after set | High | Same, inline banner "Use 14 kg" | Button |
| 19 | RIR "Reps left in the tank?" | After each set | High (noisy) | After the **last set** of an exercise only (pending PT) | Chips 0 / 1–2 / 3+ / Skip |
| 20 | Rest timer (+30 s, pause, skip) | "Start rest" button | Medium | Auto-starts after ✓, docked bar at bottom; "Start rest" stays for manual | Docked bar with labels |
| 21 | Swap exercise (Just today / Always) | Dumbbell icon with swap badge | **Low** (icon only) | Focused view action bar: **"Swap"** with label; swapped rows show "Instead of …" | Icon + label |
| 22 | Squeeze cue, posture tips, PT tips | Tips section | Medium | Focused view "How to do it" section (collapsed, labelled) | Section header |
| 23 | Exercise notes / comments | Notes field | Medium | Focused view "Notes" action | Icon + label |
| 24 | **Edit a done exercise** | Re-open done card | Low | Done rows show "Done · Edit" | Labelled "Edit" |
| 25 | Exercise progress (history per exercise) | "Progress" in card | Medium | Focused view action "History" → mini table + swipe | Icon + label |
| 26 | **Swipe to delete a log (Undo)** | Progress set history, swipe left | **Low** (one hint line) | Same gesture + visible trash icon per row + first-use hint | Trash icon |
| 27 | Delete whole session (Undo) | Progress sessions | Medium | Progress → session row "Delete" in its menu | Labelled |
| 28 | Weekly counters (sessions this week, sets by muscle) | Progress top + weekly sets chart | Medium | Today header mini-counter "This week 2/4" + Progress | Counter chip |
| 29 | Session summary (PRs, volume, next targets + why) | After logging all | Medium (only after) | "Finish workout" button always visible at the list bottom → summary | Primary button |
| 30 | PR toasts | Toast | High | Same + PR badge on the row | Badge |
| 31 | Progress suggestions + "Ask AI why" | Progress | Medium | Progress top card | Labelled button |
| 32 | Strength search / trends | Progress | Medium | Progress "Exercises" tab with search | Tab |
| 33 | Make your plan / custom exercise | Mode toggle | Low | Profile → "My plan" | Labelled row |
| 34 | Help & AI button, feedback | Floating button | Medium | Header "?" with label "Help" | Icon + label |
| 35 | Language EN/ES, sign-in, AI consent, data | Header / Profile | High | Unchanged | — |
| 36 | Week notes (Week 1 intro, deload) | Today | High | Banner under header, dismissible per week | Banner |

## Kept / merged / moved
- **Kept as-is:** engine targets and why, set logging, rest timer logic, swap logic, Progress data, Undo.
- **Merged:** Trainer card (Last / Original / Recommended / Why / Accept / Keep) → one "Target" block with
  a two-option toggle. Previous column + target → one set table with headers.
- **Moved:** Calendar → Progress tab. Block chooser/insights → block sheet from the header. Custom plan → Profile.
- **Made visible:** Google search, swap, edit done, swipe-delete, technique meaning, "Same as set 1".
- **Removed:** nothing.

## Screens (prototype)
```
TODAY (list)                     FOCUSED EXERCISE                 REST (docked)
┌──────────────────────────┐    ┌──────────────────────────┐    ┌──────────────────────────┐
│ Block 8 · Wk 3/6   2/4 ▸ │    │ ‹ All exercises    A1 1/6│    │ ...set table...          │
│ D1 Chest-Back A  [chips] │    │ Incline barbell bench    │    │                          │
│ A1 Incline bench  4×12-6 │    │ [Pyramid i] [Incline 45°]│    │──────────────────────────│
│    Pyramid  ✓ Done·Edit  │    │ [Search on Google] [Swap]│    │ Rest 1:42  +30s  Pause   │
│ ┌ Superset · 10 s ──────┐│    │ Target 62.5 kg × 12-10-… │    │ Next: set 3 · 65 kg × 8  │
│ │B1 Decline DB press 0/3││    │ Why: reached every set…  │    └──────────────────────────┘
│ │B2 Decline fly      0/3││    │ (AI target | Original)   │
│ └───────────────────────┘│    │ Set Last  Target  kg reps│
│ C1 Pulldown  Pyramid 0/4 │    │ 1  60×12  12      62.5 12 ✓
│ [   Finish workout    ]  │    │ 2  60×10  10      65   10 ✓
└──────────────────────────┘    │ How to do it ▾ Notes History│
                                └──────────────────────────┘
```

## Impact / effort
| Change | Impact | Effort | Notes |
|---|---|---|---|
| Labelled "Search on Google" + "Swap" + "Edit" buttons | High | S | Pure presentation; reuse existing handlers |
| Visible trash icon + first-use swipe hint in Progress | High | S | SwipeToDelete already exists |
| Technique badge explanation sheet | High | S | Text from approved blocks.json insights |
| Set table headers "Last time / Target" | High | S | Data exists (`getPreviousWorkoutSetRow`) |
| Target block with AI/Original toggle | High | M | Replaces trainer card layout; engine unchanged; AI Trainer release checklist applies |
| Today compact list + focused view | High | M | New layout over existing state; mid-file refactor of WorkoutPlan.tsx |
| Auto rest + docked timer | Medium | S/M | Timer exists; auto-start needs PO yes |
| First-use hints system | Medium | S | Needs a storage key → Tech Lead (via storage.ts) |
| Calendar to Progress, custom plan to Profile | Medium | M | Navigation change |
| RIR only on last set | Medium | S | PT decision |

## Dependencies
- **PT:** technique explanations (reuse approved block "How it works" text); RIR only on last set?;
  any new copy for the "How to do it" section must be approved (today: squeeze cue + posture tips only).
- **Tech Lead:** first-use hint flags through `storage.ts` (new key); split WorkoutPlan.tsx into list +
  focused components; no backend or data-model change otherwise. Trainer-card changes follow the AI Trainer
  release checklist in AGENTS.md (QAer week flow at 375 px).
- **Cost:** none (no new AI calls).

## Risks
- More visible = more on screen. Mitigation: compact rows, details only in the focused view.
- Auto-starting rest may annoy when not resting (between superset exercises). Mitigation: within a
  superset, rest only after the last exercise of the round (uses plan `rest_seconds`).
- Moving calendar may break the PO's habit. Mitigation: header link "Calendar" on Today for one release.

## How to measure
- PO walkthrough: find each of the 10 "hidden" features (#7, 9, 13, 17, 21, 24, 25, 26, 27, 33) without help.
  Target: 10/10 for a new tester, under 10 s each.
- Taps to log a 4-set exercise ≤ current.
- Swap, Google search and Edit usage counts (local analytics only if Tech Lead approves).

## Decisions for the PO (with recommendation)
1. **Today layout: full list + focused exercise** (recommended) vs v1 one-at-a-time vs today's stacked cards.
2. **Auto-start rest after ✓** — recommended yes, with "Start rest" kept for manual use.
3. **RIR question only after the last set** — recommended yes (PT to confirm).
4. **First-use hints** (one line, shown once, "Got it") — recommended yes; or a "Show tips again" switch in Profile.
5. **Calendar moves to Progress** — recommended yes, with a temporary link on Today.
6. **Ship as "Simple mode" toggle first** (A/B against current Today for 2 weeks) — recommended yes.
