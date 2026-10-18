# Declutter audit: what to remove, hide or merge on every screen

- **Date:** 2026-10-18
- **Author:** UXer
- **Status:** Proposal only. Nothing changes until the PO approves. Then the Tech Lead writes the issues.
- **Prototype:** `docs/ux/proposals/2026-10-18-declutter-audit.html` (375 px, Before/After, EN/ES, clickable)
- **PO request:** "revisa toda la app y remueve la seccion de info that is not required". His example was the
  EN/ES toggle that sat alone in each exercise's ⋯ More panel, which PR #337 has since moved.
- **Builds on (no re-proposals):** `2026-10-10-full-app-audit.md` (approved scope), and
  `2026-10-18-workout-mode-aligned.md`, which covers the Workout mode layout, the Completed screen and the
  auto-rest. This audit only lists **what to take away**. It does not redesign those flows.

## 0. Method and evidence

- **Build:** `main` @ `b6708f7`, run locally with `vite` and `?demo=1`, plus signed-out with no demo.
  Viewport 375×812, Chromium (Playwright). EN and ES. **No sign-in.**
- **Walked:** Today (week 4 and the week-5 preview), the expanded exercise card, the superset card,
  the calendar, the block card, Workout mode (with ⋯ More open, Finish → confirm), Exercises (lookup and detail),
  Progress (Overview, Trends, Muscles, Consistency), You (demo and signed-out), the Help & AI sheet,
  and the welcome/sign-in screen.
- **Note on the demo:** every day in demo week 4 is already logged. "Finish now" goes straight back to Today,
  so I could not reach the Completed/summary sheet. That screen is covered in the 10-18 Workout mode proposal.
- **Measured "weight" of each screen** (words of visible text in `.app-content` / scroll height in px):

| Screen | EN words | ES words | Scroll height |
|---|---|---|---|
| Today (cards collapsed) | 231 | 259 | 2163 px (2.7 screens) |
| Today, one card expanded | 286 | 328 | 2415 px |
| Workout mode | 302 | 331 | 1856 px |
| Workout mode with ⋯ More open | 343 | 369 | 2120 px. The **Log set button moves from y = 545 to y = 809, which is off-screen** |
| Exercises (detail) | 169 | 172 | 1949 px |
| Progress, Overview | 358 | **426** | 1846–1977 px |
| You (demo) | 117 | 123 | 1762 px |

**Guideline source.** The Vercel Web Interface Guidelines snapshot vendored at
`.claude/skills/web-design-guidelines/command.md`, from upstream commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`.
I verified its SHA-256 locally on 2026-10-18: `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`.
It matches `docs/governance/skill-checksums.json`. I used the rules as reference material only.
The relevant ones here are Content & Copy (specific labels, no redundancy), Touch & Interaction, and
Navigation (an external link must not look like a title). The type-scale findings from 10-10 are left out,
because the PO chose to keep the current font sizes.

**Short file references** used below: `WorkoutPlan.tsx`, `SetTrendChart.tsx`, `SupersetLogger.tsx` and `HelpAndAi.tsx` are in `src/components/`.
`App.tsx` is `src/App.tsx`. `ProgressScreen.tsx`, `LoginScreen.tsx` and `ProfileDataSections.tsx` are in `src/screens/`.
`app.ts`, `workout.ts` and `progressV3.ts` are in `src/i18n/sections/`. A bare `:NNNN` means a line in `WorkoutPlan.tsx`
unless the table row names another file.

**External grounding (summarised in my own words):**
- NN/g on progressive disclosure: show what most people need for the current task, and put advanced or rare
  options one step away. It works only if the split between the two levels is right.
  https://www.nngroup.com/articles/progressive-disclosure/
- NN/g on minimalist design: every extra unit of information competes with the relevant ones and lowers their
  visibility (Nielsen heuristic #8). https://www.nngroup.com/articles/aesthetic-minimalist-design/
- NN/g on instructional overlays and coach marks: persistent instruction text gets ignored. A one-time hint at
  the moment of need works better. https://www.nngroup.com/articles/mobile-instructional-overlay/
- Apple HIG, Settings: put preferences people set once and rarely change in a settings area, not in the main UI.
  https://developer.apple.com/design/human-interface-guidelines/settings
- Strong and Hevy (benchmark): the in-workout screen shows the exercise name, a set table (previous | kg | reps | ✓)
  and a rest timer. Tags, muscles and history sit one tap away (exercise ⋯ menu or detail).
  https://www.strong.app/ · https://www.hevyapp.com/features/

## 1. The customer test applied to every item

> *A lifter between sets, sweaty, one thumb, 1-second glance.* At that moment, does this help them
> lift, log or rest? If not, it goes away from that screen. It is never deleted from the app, and never
> deleted from the data.

- **Engine data is never removed.** Every "Remove" below removes **a piece of display only**. Trainer inputs and
  outputs (targets, reasons, RIR, history, technique, rest) stay in storage and in `src/trainer/`. Most of them
  stay reachable one tap away.
- **PT review.** An item marked **PT** touches approved fitness wording: cues, block texts, technique labels or
  progress-interpretation text. Hiding or shortening it needs the PT's OK first, and any new short wording must
  come from the PT.
- **Actions:** **Remove** (gone from this screen), **More** (behind ⋯ More, ⓘ or a tap), **Merge** (two things
  become one), **Settings** (moves to You), **Keep**.
- **Priority:** **P1** = clear clutter on the main jobs, small effort. **P2** = worth doing. **P3** = polish.

## 2. Inventory

### 2.1 Global header and navigation

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| G1 | Three stacked lines on every tab: "TRAIN WITH INTENT" tagline, a huge "GYM STUDIO" wordmark, then the page title ("Today"). About 100 px. `App.tsx:398-402`, `app.ts:11` | It is branding, repeated on all 4 tabs. The bottom nav already shows which tab you are on. It pushes the plan down by a whole card. | **Remove** the tagline. **Merge** the wordmark and page title into the one-row compact header that already appears on scroll ("GYM STUDIO · Today"). Keep the tagline on the welcome card and in marketing. | P1 |
| G2 | A "Boxes layout / Sheet layout" icon pair in the header. `App.tsx:368-385` | This is a design experiment switch (the sheet prototype parked on 10-05). The icons have no text, and it changes nothing about training. | **Remove** from the header. The PO picks one layout. If both must stay, put it under **Settings** in You ("Card style"). | P1 |
| G3 | EN \| ES toggle in the header on every tab, plus a second copy in the Workout mode bar since #337. `App.tsx:350`, `WorkoutPlan.tsx:3332` | Language is set once (Apple HIG). In Workout mode at 375 px, the toggle floats over the chip row and the "8" chip, and it pushes the hint to two lines. In ES the title is still cut off ("Día 1 · Tren superior A · …"). | **Settings**: one Language row in You, plus the toggle on the welcome/sign-in screen for first use. In Workout mode, **remove** it entirely. It is not a mid-set action. *PO decision, because #337 just placed it there.* | P1 |
| G4 | A small coloured dot next to the toggles (sync status), with no text. `App.tsx:386-395` | A constant dot with no label carries no meaning for the user. | **Keep, but only when something needs attention** (pending uploads, an error, or "Sign in to back up"). Hide it when everything is synced. | P3 |
| G5 | The floating ✦ Help & AI button. For guests it opens "Ask AI / Send feedback" with an almost empty "Sign in to use AI" panel. `HelpAndAi.tsx` | It shows an empty tab before you can do anything. | **Keep the button.** For guests, open it on *Send feedback*, with a single "Ask AI: sign in" line. (This links to the parked AI-help decision.) | P3 |

### 2.2 Today

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| T1 | A "6-WEEK PLAN · 4 DAYS/WEEK" badge next to the calendar icon. `WorkoutPlan.tsx:2561-2564` | It duplicates the block card right below it ("Upper / Lower · 4 Days · Week 4 of 6"). Signed out with no plan, it says "6 DAYS/WEEK", which is wrong and misleading. | **Remove.** Move the calendar icon into the block card row. | P1 |
| T2 | The block card, when opened, shows Change block, a date range, the method ("Flat Pyramid"), a paragraph, **and** a nested "About this block +" disclosure. `WorkoutPlan.tsx:2804` | That is two levels of "about". Change block is a once-every-6-weeks action, but it is the first thing you see. | **Merge** everything into one disclosure, in this order: dates · method · description · *Change block* (last, as a text button). **PT** (block text untouched, only reordered). | P2 |
| T3 | Day header "Day 1 · Upper A" with a second line "Upper body · heavy". `WorkoutPlan.tsx:2996` | "Upper" is said twice. Only "heavy" is new. | **Merge** into one line: "Day 1 · Upper A · heavy". **PT** (day focus text comes from blocks.json). | P2 |
| T4 | The exercise **name is a link to Google Images** (↗), with a swap icon and an expand "+" on every card. `WorkoutPlan.tsx:3716`, `:587` | Tapping the biggest text on the card leaves the app, which mid-workout means losing your place. The Google search is already in ⋯ More in Workout mode (a duplicate). Swap is rare. | **More:** the name becomes plain text (tap = expand). "See on Google" and Swap move inside the expanded card or ⋯ More. | P1 |
| T5 | "✓ Done · 3 sets · top 82.5 kg" on every card, **plus** "✓ Done" on each superset group. `:3762`, `:4605` | Supersets show a double "Done". "top" is jargon. | **Merge:** one quiet line per card ("✓ 3 × 82.5 kg"). The superset group shows Done only in its header. | P2 |
| T6 | "Do C1, rest ~10 s, then C2; rest after the pair." under **every** superset (3 times a day). `workout.ts:375`, `WorkoutPlan.tsx:4606` | It is the same sentence three times. After the first week you know what a superset is. | **More:** the header becomes "Superset ⓘ"; tap ⓘ for the sentence. **PT** (instruction wording). | P2 |
| T7 | "Start rest" inside each superset box and "Same as set 1 · Start rest" in the expanded card on **Today**. `:4044`, `:4612` | The rest timer belongs to training (Workout mode). On the plan view it is an orphan button. | **Remove from Today.** Keep it in Workout mode. | P1 |
| T8 | The expanded card shows the "Next (Mon): 85 kg × 6–8" box, a reason sentence, then a meta line "3 sets · 8·8·8 reps · 150 s rest". `:3866-3876`, `:3923` | **The two lines disagree** (6–8 vs 8·8·8). The reason sentence is long ("…I have moved the load up"). "150 s" reads worse than "2:30". | **Merge** into one target line: "3 × 6–8 · 85 kg · rest 2:30". The reason goes behind "Why?" (same engine text, one tap). Tech Lead: one source for the target (AI Trainer checklist item 4). | P1 |
| T9 | Technique, bench angle and muscle chips on every expanded card ("Straight Sets · Flat bench · Chest"). `:3915-3922` | "Straight sets" is the default and tells you nothing. Muscles belong in the exercise detail. | **Keep only a non-default technique chip** (Pyramid, Drop set, Superset). Muscles and bench angle go to **More**. **PT** (technique labels are PT classifications; display only). | P2 |
| T10 | Next-week preview: "Projected from your current performance" over three identical rows (Set 1/2/3 · 85 kg × 6–8). `:3852` | Three identical rows say one thing. | **Merge:** "Projected · 3 × 85 kg × 6–8". Keep per-set rows only when the sets differ (pyramids). Engine data unchanged. | P2 |
| T11 | "You are viewing another week. Go back to “This week” to train." next to a "This week" pill. `:3000` | The pill already does this. | **Remove** the sentence; keep the pill. | P3 |

### 2.3 Workout mode

The layout redesign is in `2026-10-18-workout-mode-aligned.md`. These are the removals that also apply to
today's build.

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| W1 | Permanent hint "Tap an exercise to jump · rose line = superset" under the chips. It takes 2 lines in ES. `WorkoutPlan.tsx:3331`, `workout.ts:155` | Permanent instruction text gets ignored (NN/g). Chips already look tappable. | **Remove.** Optional: show it once as a first-run tip. | P1 |
| W2 | EN \| ES toggle in the top area (see G3). | It overlaps the chip row at 375 px. | **Remove** from Workout mode. | P1 |
| W3 | "✓ Done · 3 sets · top 82.5 kg" pill in the current exercise header. | It repeats the "Done" column of the set table right below. | **Remove** in Workout mode. | P2 |
| W4 | Technique, bench angle and muscle chips above the logger. | They have no value mid-set, and they push the logger down. | **More**, except a non-default technique (see T9). **PT** (labels). | P1 |
| W5 | In ⋯ More, the banner "Today: 85 kg × 6–8", while the logger header says "SET 3 OF 3 · Target 82.5×8". `:3988`, `SupersetLogger.tsx:156` | **Two different targets on one screen.** It is confusing and erodes trust in the AI Trainer. | **Remove** the banner. The target lives only in the logger header. Tech Lead: confirm the single engine source (AI Trainer checklist item 4). | P1 |
| W6 | The same squeeze cue in **three** places: the short "SQUEEZE ·" line (tap opens the long cue), a long cue card with "+" in More, and a "ⓘ Technique" button. | They all say the same thing. | **Keep the short line**, which already opens the long cue on tap. **Merge** the More cue card into the Technique button. **PT** (cue texts unchanged). | P2 |
| W7 | A "Notes" button in More **and** an always-visible empty Notes textarea at the bottom of the card. `:4416` | It is two controls for one rare action. The empty box adds about 110 px. | **Merge:** keep the button. The textarea opens on tap and stays open when a note exists. | P2 |
| W8 | History appears **four** ways: the "Last time" column, "Trend by set" chart, a "History" button, and a "Progress +" section at the card bottom. `:4359`, `:3630` | It is the same past data four ways. | **Keep** the Last time column and Trend by set (collapsed by default). **Remove** the "Progress +" section and the History button from Workout mode; the full history is in Progress. | P1 |
| W9 | "Bars from 0 kg" caption under the trend chart. `SetTrendChart.tsx:54`, `workout.ts:209` | It explains the axis, which already starts at 0. | **Remove** (keep it for screen readers only). | P3 |
| W10 | Finished-exercise rows: some show "→ 3×8 · 73 kg", others only an arrow, with no legend. | They are inconsistent. | **Keep the arrow** and make all rows the same (arrow + short result). The meaning is defined in the 10-18 proposal. | P3 |

### 2.4 Exercises (lookup and detail)

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| E1 | The "Exercise" label above the exercise name. `App.tsx` detail card | It is a redundant label. | **Remove.** | P3 |
| E2 | Two headed groups, "Primary muscles" and "Secondary muscles". | Two headings for 3 chips. | **Merge:** "Chest · also Triceps, Front delts". | P3 |
| E3 | **Four history blocks:** LAST MAX + LAST VOLUME tiles, a "Previous performance" card (the same 3 sets), a "Previous" column in "Track it as you go", and a "Progress" list of 5 sessions with "kg volume" + "See full progress". `App.tsx:624-710` | It is the same data four times. "Volume 2475 kg" is summed tonnage, which lifters rarely read. | **Keep** the Last max tile and the Previous column. **Remove** the "Previous performance" card. **Replace** the Progress list with the "See full progress" link. **Move** Last volume to the Progress detail. | P1 |
| E4 | The long squeeze cue card. | This is the right home for technique. | **Keep.** | — |
| E5 | A "Find an exercise \| Build a custom day" switch. | It is needed. | **Keep.** | — |

*Bug for QAer/Tech Lead, found in passing:* in "Track it as you go" the kg field shows a clipped "0" at 375 px.

### 2.5 Progress

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| P1 | "Progress" three times: the header h1, the in-screen h2 and the tablist label. The block name sits beside the h2. `ProgressScreen.tsx:1233` | It is a repeated title. | **Remove** the in-screen h2. The block name becomes a small subtitle. | P2 |
| P2 | Status card explainer "Status reflects the majority of eligible main-lift verdicts, not a recommendation." `ProgressScreen.tsx:757`, `progressV3.ts:18` | It is a disclaimer in jargon, on the first card. | **More** (ⓘ on the status card). **PT** (approved interpretation wording). | P2 |
| P3 | Each main lift shows **three lines**: "Est. max: 91.8 → 110.0 kg", "This week's best Est. max: 110.0 kg (last week 110.0 kg, about the same)", "+4.5 kg/week". That is 8 lifts = 24 lines. | It is the densest part of the app. In ES the Overview alone has 426 words. | **Merge** to one line per lift: "110 kg est. max · +4.5 kg/wk" + sparkline. The week-vs-week line goes into the lift detail. **PT** (Est. max wording). | P1 |
| P4 | Footnote "High-rep lifts show reps at the top load; the line restarts when the load changes." `:811` | It is a chart footnote that is always visible. | **More** (ⓘ). **PT**. | P3 |
| P5 | "SINCE THE LAST EQUIVALENT SESSION": 1 / 14 / 3 tiles plus three "Last time: all sets reached 10 reps…" lines. | "Equivalent session" is jargon. The lines repeat Today's Next box. Next to "8 of 8 improving" it reads as a mixed message. | **Merge:** a shorter title, "vs last time" (**PT** wording). Keep the tiles; tap a tile to see the list. | P2 |
| P6 | Overview "Consistency · weekly sets by muscle" card (adherence, "3 of 4 complete non-deload weeks", 57% line). `:827-846` | It duplicates the Consistency and Muscles tabs. "Non-deload" is jargon. | **Merge** into one line on Overview: "100% of planned days · 3-week streak". The rest stays in the tabs. | P2 |
| P7 | Trends: "Early estimate" on **all 8** rows. Empty tiles ("—", "Not enough data yet: 0"). "Main-lift e1RM". `:888`, `progressV3.ts:36` | It repeats the same caveat on every row, the tiles are empty, and "e1RM" is jargon. | Show "Early estimate" **once** as the section caption. **Hide** empty tiles. Rename e1RM to "Est. max" (**PT**). | P1 |
| P8 | Trends legend "Faint points = each session · bold line = …" and a block-over-block "Previous block end" column showing "New in this block" on every row. `:888`, `:905` | It is a permanent legend and an empty column. | **More** (ⓘ) for the legend. **Hide** the column when no row has a previous block. | P2 |
| P9 | Muscles: two legend lines at the top, then for **each of 10 muscles** "↑ 10–20 Common range", "3 of 4 complete non-deload weeks" and the block name under W1. `:951-978` | The same three strings appear 10 times, so the screen is about 3300 px long. | Say them **once** at the top. The shaded band speaks for itself. **PT** (the common range is PT content; keep it once). | P1 |
| P10 | Consistency: a "CONSISTENCY" heading twice, and the block name repeated on every week row. `:1022-1043` | It repeats. | **One heading**. Show the block name only when it changes. | P2 |

### 2.6 You, sign-in and demo

| ID | What it shows now | Why it's not needed | Proposal | Pri |
|---|---|---|---|---|
| Y1 | Demo You: the full goal form open, with "Your PT plan is built from this." and "Sign in to save your goal", then "My plan: Sign in…" and "Measurements: Sign in…". That is three sign-in lines. `ProfileDataSections.tsx` | The PO approved a **single** sign-in card on 10-10. Signed-out users get it; demo users do not. | **Merge** into one card: "Sign in to save your goal, plan and measurements". Collapse the forms. | P1 |
| Y2 | "My goal" shows "+" while the form is open. | The icon does not match the state. | Show "−" when open (polish). | P3 |
| Y3 | Sign-in: "← Back to Today", "Create your account" with 3 bullets, a migration paragraph ("After sign-in, choose whether to move your local workouts…") and a "Privacy note" disclosure, all **before** the email field. `LoginScreen.tsx:85,95,107` | The bottom nav already goes back. The migration choice is explained at the moment it happens (`GuestDataPrompt`). The form sits below the fold. | **Remove** the back link. **Keep** one benefit line ("Back up your workouts and use any device"). **Move** the migration paragraph to the post-sign-in prompt. **Move** the privacy note to a small link under the button. | P1 |
| Y4 | "Demo mode · Demo data — not your real history · Exit demo". | It is needed. | **Keep.** | — |
| Y5 | The welcome card ("Welcome to GymStudio" + 3 bullets + Got it / Try the demo). | It shows only on first launch. | **Keep.** | — |

## 3. Top 10 removals (ranked by impact on the one-hand, mid-set customer ÷ effort)

| Rank | ID | Change | Impact | Effort | Needs |
|---|---|---|---|---|---|
| 1 | W5 + T8 | One target only: remove the "Today: 85 × 6–8" banner and the conflicting meta line | High (trust) | S | Tech Lead (single engine source) |
| 2 | W8 + E3 | Remove duplicate history blocks (Workout "Progress +"/History; Exercises "Previous performance"/Progress list) | High | S | — |
| 3 | W1 | Remove the permanent chip hint | Med | S | — |
| 4 | G2 | Remove the layout (boxes/sheet) toggle from the header | Med | S | PO picks a layout |
| 5 | G3 + W2 | Language → You › Settings; none in Workout mode | Med | S | PO (reverses #337 placement) |
| 6 | G1 + T1 | Remove the tagline and the plan badge; one-row header | High (≈150 px back on every tab) | S | PO (look) |
| 7 | T4 | The exercise name stops being a Google link; Google and Swap go behind More | High (no accidental exits) | S | — |
| 8 | W4 + T9 | Hide default-technique, bench and muscle chips | Med | S | PT FYI |
| 9 | P3 + P7 + P9 | Progress: one line per lift; say repeated captions once; hide empty tiles | High (Progress ~40% shorter) | M | PT (wording) |
| 10 | Y1 + Y3 | Single sign-in card in demo; lighter sign-in screen | Med | S | — |

**Quick wins (one Copilot PR each, display only, no data model):** 1, 2, 3, 4, 6, 7, T7, T11, W3, W7, W9, E1, E2.
**Needs a decision or PT first:** 5 (PO), 8, 9, T2, T3, T6, W6, P2, P4, P5 (PT wording).
**Bigger bet (not in this list, flagged for later):** three places can log sets for the same planned exercise
(Today expanded card, Workout mode, Exercises › "Track it as you go"). Making Workout mode the only logger for
planned exercises would cut the most clutter of all, but it changes behaviour. It needs a PO decision and a
Tech Lead design. Effort L.

## 4. Expected impact

Rough estimates from the prototype; the numbers will be confirmed by QAer.

- Today, collapsed: about 231 → 150 words; the first exercise card moves up by about 150 px.
- Workout mode: the Log set button stays above the fold even with ⋯ More open, because More no longer contains
  the target, the cue card or the textarea.
- Progress Overview: about 358 → 200 words (EN) and 426 → 230 (ES). Muscles is about 3300 → 2000 px.
- No accidental exits to Google from the title. No conflicting targets.

## 5. Risks

- **Discoverability.** Things behind ⋯ More or ⓘ get used less. That is intended for rare items. I am not hiding
  anything the PO uses weekly; the PO should confirm for Notes and Trend by set.
- **Trust in the AI Trainer.** Hiding the "Why?" sentence could make targets feel arbitrary. It stays one tap away,
  and the PO said on 10-10 he doesn't miss the trainer card.
- **PT wording.** Shortened progress captions must not change their meaning (the PT 5 boundary: describe, don't
  prescribe). The PT writes every new short string.
- **Tests.** Some unit tests assert on these strings or classes (for example `WorkoutPlan.test.tsx:109` counts
  `rest-start-button`). The Tech Lead's issues must update them deliberately.

## 6. How to measure success

- A QAer DOM check at 375 px in EN and ES: word count and scroll height per screen, against the table in §0
  (target −30 % on Today, Workout and Progress).
- In Workout mode, the Log set button's `y` stays below 812 with ⋯ More open.
- Zero screens show two different targets for the same set (a new QAer checklist line).
- Taps to log a set are unchanged or fewer. The PO accepts it on his phone after a real session.

## 7. Decisions for Sebas (plain English)

1. **Language switch:** OK to put EN/ES in You › Settings (and on the welcome screen), and take it out of the
   workout screen completely? You change language once, not mid-set.
2. **Layout switch (boxes/sheet icons at the top):** which one do you want to keep? Then we remove the switch.
3. **Header:** OK to drop "TRAIN WITH INTENT" and the "6-WEEK PLAN" badge, and use a one-row "GYM STUDIO · Today" header?
4. **Exercise names:** OK that tapping a name opens the card instead of Google? "See on Google" stays in ⋯ More.
5. **History in a workout:** keep only "Last time" + "Trend by set", and send everything else to Progress?
6. **Progress:** OK with one line per lift and with the explanations moved behind ⓘ? (The PT rewrites the short texts.)
7. **Later, bigger:** should Workout mode be the *only* place to log a planned exercise? Today would then show the
   plan, and Exercises would be for looking things up and extra lifts.
