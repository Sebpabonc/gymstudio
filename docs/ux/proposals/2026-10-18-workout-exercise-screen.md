# Workout mode exercise screen: three simpler layouts

- **Date:** 2026-10-18
- **Author:** UXer
- **Status:** Proposal and prototype only. Nothing gets built until the PO approves.
- **Prototype:** `docs/ux/proposals/2026-10-18-workout-exercise-screen.html`. It shows a 390 px phone with an EN/ES switch. Tabs: **Current**, **A**, **B** (recommended) and **C**. Every button in it works, including Log set, rest, Skip, +15s, the reps-left question, the insight and Completed.
- **Trigger:** the PO sent an iPhone screenshot of Workout mode (Day 6 · Legs B, Barbell Back Squat swapped in for the Plate-Loaded Pendulum Squat) with the note "I'm not comfortable, I want proposals".
- **Builds on:** `2026-10-18-workout-mode-aligned.md` (big logger, insight after each exercise, Completed screen) and `2026-10-18-declutter-audit.md` (W1, W4 and W5 are approved but not built yet).
- **Fitness content:** none is new. The prototype only uses text the app already shows: the short squeeze cue (`docs/fitness/approved/2026-10-18-short-squeeze-cues.md`), the full cue and posture tips (`catalogue-v2/legs-glutes.json`, `back-squat`), and the plan note (`training-blocks/blocks.json`). Demo weights are made up. The only new wording is UI wording: "Tips & technique" / "Consejos y técnica" and "Add note" / "Agregar nota".

## 1. Problem: what is uncomfortable on today's screen

Sources: the PO's screenshot, and my own run at 390×844 (`npm run build` + `vite preview`, `?demo=1`, no sign-in).

| # | What you see | Why it hurts mid-set | Evidence |
|---|---|---|---|
| P1 | **Four icons with no words** under the name (magnifier, arrows, pencil, ⓘ) | You have to guess what each one does. Two of them look like other things: the magnifier reads as "search the app", the pencil as "edit the set". Each is 40 px, smaller than the 44 px minimum. | `WorkoutExerciseActions.tsx:37-41`, `styles.css:9414-9419` (40×40) |
| P2 | **ⓘ Technique does the same job as tapping the squeeze cue** | The squeeze sheet already holds Today, Last time, the full cue, the posture tips and the plan notes. So one icon is a second door into the same room. | `WorkoutPlan.tsx:3519-3549` (cue sheet sections) |
| P3 | **Two targets**: "SET 1 OF 3 · Target 75×15" in the header, plus a Target column in the table | You read the same number twice, and when they disagree you stop trusting the AI Trainer (W5). | `WorkoutPlan.tsx:4061-4066`, `:4095` |
| P4 | **A permanent hint**: "Tap an exercise to jump · rose line = superset" | It's an instruction you only need once, and it takes a full row (two rows in ES) above the card. Not built yet (W1). | `WorkoutPlan.tsx:3427` |
| P5 | **A "−" collapse button** next to the name | You move between exercises with the chips in Workout mode, so collapsing the card you're doing is never what you want. The whole header is also a `div` with a click handler, so a tap near the name can collapse the card by accident. | `WorkoutPlan.tsx:3758-3762`, `:3827-3841` |
| P6 | **Chips "Pyramid / Quads / Glutes" plus the plan note** take up 2 rows | The muscles add nothing mid-set (W4). Pyramid only matters because of the plan note, yet the two are shown apart. | `WorkoutPlan.tsx:3969-3977` |
| P7 | **Stepper − / + are 36 px wide** | They're below 44 px, and they're the controls you tap most, with sweaty hands. | `styles.css:8716-8722` (36 px) |
| P8 | **Undo is 32 px tall** | Below 44 px. | `styles.css:3150-3151` |
| P9 | **The sticky chip area covers the top of the card** after you scroll | On my run, "Barbell Bench Press" was half hidden under the chip row. | `styles.css:7203-7240`; screenshot from the local run |
| P10 | **The rest timer floats** as a pill over the content | It covered "Back to Today" on the Completed screen. It's far from where your thumb just tapped "Log set", and it doesn't say which set is next. | `styles.css:1879-1897` (`position:absolute`) |

The root cause is that the screen has no single primary action. Ten things compete above the "Log set" button.

## 2. Opportunity and outside evidence

- **Icons need words.** NN/g's icon research found that only a few icons (home, print, search in a field) are understood without a label, and that a visible text label is the safest fix (https://www.nngroup.com/articles/icon-usability/). That matches P1.
- **Progressive disclosure:** show the few things needed now and put the rest one tap away (https://www.nngroup.com/articles/progressive-disclosure/). Mid-set, you need the weight, the reps and the Log button. Technique is a "sometimes" item.
- **Touch targets:** Apple HIG says at least 44×44 pt (https://developer.apple.com/design/human-interface-guidelines/accessibility). Material says 48×48 dp (https://m3.material.io/foundations/designing/structure).
- **One-handed reach:** most phone use is one-thumbed, and the lower-middle of the screen is the easiest area to reach (Hoober, https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php).
- **Category pattern.** Strong (https://www.strong.app/) and Hevy (https://www.hevyapp.com/features/) both show one row per set (previous · weight · reps · check). They keep secondary actions such as replace, notes and how-to off the main surface, and the rest timer starts on its own after a set is logged. GymStudio already does better on the coaching side (prefilled target, squeeze cue, insight after each exercise). What it lacks is their calm hierarchy.

## 3. Proposals

Every proposal keeps the things the PO asked to keep: the language switch in Workout mode, the Boxes card, the squeeze cue that opens the details sheet when tapped, the big prefilled logger, the 2:00 rest, the insight after each exercise, and the Completed screen. Every proposal also builds the approved **W1** (no permanent hint), **W4** (only a non-default technique is shown, no muscle chips) and **W5** (one target).

The language switch becomes **one round 44 px button at the end of the chip row**. It shows the other language ("ES" while in English, "EN" while in Spanish). This frees the room the hint row used to take, and all 6 chips fit at 390 px without scrolling. If the PO wants the two-part EN | ES pill exactly as it is today, it can stay, but chip 6 then scrolls out of view (decision D2).

### A · Labelled tools: "Same screen, but every tool says what it does"

```
┌──────────────────────────────────────┐
│ ‹ Exit   Day 6 · Legs B · 1/6  0:16 Finish│
│ [1][2][3][4]–[5][6]              (ES)│  ← hint gone; one language button
├──────────────────────────────────────┤
│ Barbell Back Squat                   │  ← no "−"
│ Instead of Plate-Loaded… · Undo      │
│ [ ⓘ      ][ ⇄    ][ ✎    ][ ⌕     ]  │  ← 4 equal buttons, icon + word, 52 px
│ [Technique][ Swap ][ Notes][ Google ]│
│ ▌SQUEEZE · Spread the floor, … ›     │  ← tap = details sheet (unchanged)
│ PYRAMID Add weight each set as reps  │  ← technique + plan note on one line
│ drop; never grind to failure.        │
│ ┌ SET 1 OF 3 ─────────────────────┐  │  ← no second target
│ │ kg [− 75 +]     Reps [− 15 +]   │  │  ← 44 px steppers
│ │ [          Log set 1          ] │  │
│ └─────────────────────────────────┘  │
│ #  Last time · Thu 15 Oct   Today    │  ← Target + Done merged into "Today"
│ 1▐ 90×8                     75×15    │
│ 2  90×8                     80×12    │
└──────────────────────────────────────┘
Rest: the logger box turns into the rest box in the same spot.
```

- **Header:** same as today, minus the hint row.
- **Tools:** the same 4 tools, each labelled. Technique opens the squeeze sheet. Notes opens the note field inline. Swap and Google work as today.
- **Squeeze cue:** unchanged.
- **Chips / plan note:** only a non-default technique label, shown in front of the plan note. Muscle chips are gone.
- **Logger / table:** one target, shown as the prefilled values. The table has 3 columns: #, Last time, Today. Today shows the target until the set is done, then the logged value with ✓.
- **Rest state:** the logger box turns into the rest box in the same place: "✓ Set 1 logged · Next: set 2 · 80×12", a big 2:00, and [+15s] [Skip]. After the last set come the reps-left question, then the insight, then Continue ›.
- **Effort: S.** CSS plus small JSX changes. **Downside:** it is still the screen with the most chrome on it, and Technique still duplicates the cue.

### B · Logger first (recommended): "One thing to do: log the set"

```
┌──────────────────────────────────────┐
│ ‹ Exit     Day 6 · Legs B      Finish│
│              0:16                    │  ← timer under the title
│ [1][2][3][4]–[5][6]              (ES)│  ← position = the current chip
├──────────────────────────────────────┤
│ Barbell Back Squat          [⇄ Swap] │  ← Swap is a word button; "−" removed
│ Instead of Plate-Loaded… · Undo      │
│ ▌SQUEEZE · Spread the floor, … ›     │  ← the one door to details:
│ ▌Tips & technique ›                  │    Today, last time, full cue, posture
│                                      │    tips, plan notes, [Search on Google]
│ ┌ SET 1 OF 3              Pyramid ┐  │
│ │ Add weight each set as reps…    │  │  ← plan note sits with the set it shapes
│ │ kg [− 75 +]     Reps [− 15 +]   │  │
│ │ [          Log set 1          ] │  │  ← the only filled button on screen
│ └─────────────────────────────────┘  │
│ #  Last time · Thu 15 Oct   Today    │
│ 1▐ 90×8                     75×15    │
│ 2  90×8                     80×12    │
│ 3  90×8                     85×10    │
│ ✎ Add note                           │  ← notes at the end, where you'd write
└──────────────────────────────────────┘
Rest (same box, same spot):
│ ┌ ✓ Set 1 logged · Next: set 2 · 80×12 ┐
│ │              2:00                    │
│ │ [  +15s  ]   [ Skip (filled) ]       │
```

- **Header:** "‹ Exit · Day 6 · Legs B · Finish", with the elapsed time small under the title. "1/6" goes away because the highlighted chip already shows it. The title has room in ES too.
- **Tools, with no icon row:**
  - **Swap:** a labelled button next to the name, in place of the useless "−". Swapping is the one tool you decide on before you start the exercise, so it belongs by the name.
  - **Technique and Google:** inside the squeeze sheet. The cue now has a second line, "Tips & technique ›". The sheet ends with a full-width "Search on Google" button.
  - **Notes:** an "Add note" link under the set table. Notes get written after the sets, not before.
- **Squeeze cue:** bigger and more clearly tappable. It's the one door to every detail.
- **Chips / plan note:** the technique label (only when it isn't the default) and the plan note move into the logger header, next to the set they describe. There are no chips.
- **Logger / table:** the logger is the hero. "Log set N" is the only filled button. The table has 3 columns and shows one target.
- **Rest state:** the logger box becomes the rest box in exactly the same spot, so your thumb is already over **Skip**. It names the next set and its target. After the last set: reps-left question, then insight, then Continue ›, then Completed at the end.
- **Effort: M.** It moves Swap, Notes and Google, and it adds the Google button and the "Tips & technique" line to the sheet. It reuses the existing sheet and rest logic, and the data stays the same.

### C · Thumb dock: "Logger and rest live where your thumb already is"

```
┌──────────────────────────────────────┐
│ ‹ Exit     Day 6 · Legs B      Finish│
│ ▬▬▬ ─── ─── ─── ─── ───              │  ← thin progress bar
│ [1][2][3][4]–[5][6]              (ES)│
├──────────────────────────────────────┤  (scrolls)
│ Barbell Back Squat                   │
│ Instead of … · Undo                  │
│ Technique · Swap · Notes · Google    │  ← text-only links, 44 px tall
│ ▌SQUEEZE · Spread the floor, … ›     │
│ Add weight each set as reps drop; …  │
│ #  Last time · Thu 15 Oct   Today    │
│ 1▐ 90×8                     75×15    │
├══════════════════════════════════════┤  (pinned)
│ SET 1 OF 3                   Pyramid │
│ kg [− 75 +]     Reps [− 15 +]        │
│ [            Log set 1             ] │
└──────────────────────────────────────┘
Rest: the dock becomes "✓ Set 1 logged · Next: set 2 · 80×12 / 2:00 / [+15s][Skip]".
```

- **Header:** a thin progress bar shows how far through the day you are at a glance.
- **Tools:** one text row: "Technique · Swap · Notes · Google".
- **Squeeze cue and plan note:** in the scrolling part.
- **Logger:** pinned at the bottom and always reachable. **Table:** in the scrolling part.
- **Rest state:** the dock turns into the rest timer.
- **Effort: M–L.** A fixed dock has to work with the iOS keyboard, the safe area, the bottom nav (hidden in Workout mode), supersets (two rounds) and the reps-left prompt.
- **Downside:** on a 375 px-tall-content phone the dock uses about 40% of the screen, so the set table and cue get squeezed. It is also the biggest change from the "Boxes" look the PO just chose.

## 4. Recommendation: B, Logger first

B is the only option that removes the icon row completely without hiding the tools behind a "⋯" (the PO disliked both). Each tool ends up as a word in the place you'd look for it: Swap by the name, Technique and Google in the cue sheet, Notes after the sets. B also keeps the Boxes card and fixes the hierarchy: one filled button, and the rest timer appears where you just tapped. If the PO wants the smallest possible change first, **ship A as step 1**. Its pieces (W1, W4, W5, 44 px targets, the rest box in place, the merged table) are all part of B anyway.

## 5. Impact / effort

| Rank | Item | In | Impact | Effort | Dependencies |
|---|---|---|---|---|---|
| 1 | One target (W5) + merged "Today" column | A B C | High (trust) | S | Tech Lead: the engine stays the single source |
| 2 | Remove the permanent hint (W1), use one language button | A B C | Med | S | PO D2 |
| 3 | 44 px steppers, Undo and tools | A B C | High (mid-set use) | S | — |
| 4 | Rest box in place of the logger, naming the next set | A B C | High | S–M | — |
| 5 | Hide default technique and muscle chips (W4); plan note joins the set | A B C | Med | S | PT FYI (labels only) |
| 6 | Remove the "−" collapse and the clickable header `div` in Workout mode | A B C | Med | S | — |
| 7 | Tools as words: Swap by the name, Technique + Google in the sheet, Notes after the table | B | High | M | New UI strings (EN/ES) |
| 8 | Labelled 4-button tool row | A | Med | S | — |
| 9 | Pinned thumb dock | C | Med | M–L | Tech Lead (iOS keyboard, safe area, supersets) |
| 10 | Fix the sticky chip area covering the card title (P9) | all | Med | S | — |

**Quick wins (S):** 1–6, 8 and 10. **Bigger bets:** 7 (B) and 9 (C).

## 6. Risks

- **Technique becomes less visible in B.** It moves from its own icon to the second line of the cue. To limit this, the line says "Tips & technique ›" in plain words, and tapping the cue was already the PO's chosen path.
- **The language button changes shape** (a two-part pill becomes one round button). This needs the PO's yes (D2). The 2026-10-18 decision was to keep the toggle, and it is kept, only smaller.
- **Supersets:** the same rules apply to `SupersetLogger.tsx`. Each exercise in the round gets the Swap word button and a cue line. Notes go under the round, and the rest box replaces the round logger. The Tech Lead should check this before the issue is written.
- **No fitness content changes.** The PT only needs an FYI for hiding default technique chips (already in W4).

## 7. How to measure success

- **Taps to log a full exercise** (3 sets, accepting the prefilled values): today it's 3 taps plus scrolling to Skip. The goal is 3 Log taps plus 2 Skip taps, all in the same thumb spot.
- **Target position:** "Log set" stays above the fold at 375×667 (iPhone SE) and 390×844 in EN and ES.
- **No targets under 44 px** in Workout mode (QAer check).
- **PO acceptance:** in a real session, the PO can say what every control does without tapping it.
- **Fewer accidental collapses or swaps** (QAer week flow).

## 8. Web Interface Guidelines audit

- **Source:** vendored Vercel `command.md`, commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`. SHA-256 `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`, checked on 2026-10-18 and matching `docs/governance/skill-checksums.json`. I treated it as reference material only.
- **Files reviewed (read-only):** `src/components/WorkoutPlan.tsx`, `WorkoutExerciseActions.tsx`, `SqueezeCue.tsx`, `src/styles.css`.

```text
## src/components/WorkoutExerciseActions.tsx
:36 - <span role="group" onClick> — span with click handler (stopPropagation only); prefer no handler on wrapper
:37-41 - icon-only buttons have aria-label ✓, but no visible label; title tooltip useless on touch
## src/components/WorkoutPlan.tsx
:3758-3762 - <div className="planned-exercise-header" onClick> — div click handler; collapse also on the toggle button
:3427 - permanent instruction text (W1)
:4091 + :4119 - column headers aria-hidden + row button aria-label "Set 1 · Target" overrides the visible numbers; screen readers lose last-time/target values
:4061-4066 + :4095 - same target rendered twice (W5)
## src/styles.css
:9414-9419 - .workout-tool 40×40 < 44 px target
:8716-8722 - stepper buttons 36 px wide < 44 px
:3150-3151 - .exercise-swap-origin button min-height 32px < 44 px
:7203-7240 - sticky bar + overview cover the top of the current card after scroll (sticky must not cover content/focus)
:1879-1897 - rest pill position:absolute overlaps Completed "Back to Today"
:7547,:7556 (and :8520) - touch-action: manipulation + tap highlight set ✓; :7559-7565 focus-visible ✓; tabular-nums on progress ✓
## src/components/SqueezeCue.tsx
✓ pass (button + aria-haspopup="dialog", aria-modal sheet, labelled close)
```

## 9. Decisions for the PO (plain English)

1. **D1: Which direction?** A (same screen, tools get words), B (the logger comes first, the tools become words where you'd look, recommended) or C (the logger is pinned at the bottom). Or A now and B next.
2. **D2: Language switch:** is it OK to show it as one round "ES"/"EN" button at the end of the chip row, so all 6 exercise numbers fit? Or should we keep the two-part pill?
3. **D3: B only:** is it OK that Technique and Google live inside the squeeze-cue sheet ("Tips & technique ›") instead of having their own buttons?
4. **D4: The "−" collapse button:** OK to remove it in Workout mode?
