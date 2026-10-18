# Simple "Find an exercise" and "Create your own exercise"

- **Date:** 2026-10-18
- **Author:** UXer
- **Status:** Proposal, prototype only. Do not implement until the PO approves.
- **Prototype:** `docs/ux/proposals/2026-10-18-simple-find-and-create.html` (375 px, EN/ES, Before | After, clickable)
- **Builds on:** `2026-10-18-workout-mode-aligned.md` (big logger, ⋯ More), `2026-10-18-declutter-audit.md`
  (E1–E5), `2026-10-07-simplified-app.md`, `2026-10-09-progress-and-create-exercise.md` (§2 "Make your plan")
- **Fitness content used (approved only):** names, body region, primary muscles and equipment from
  `docs/fitness/approved/catalogue-v2/*.json`; short squeeze cues from
  `docs/fitness/approved/2026-10-18-short-squeeze-cues.md` (`src/data/shortSqueezeCues.ts`). No new
  technique text or classification is introduced. "Last time" values in the prototype are sample data.

## 1. What the user sees today (inventory)

Checked on a local production build (`npm run build` + `vite preview`, `?demo=1`, 375 × 812, not signed
in), with the webapp-testing helper. No console errors.

### 1.1 Exercises › Find an exercise (`src/App.tsx:367-645`)

Top to bottom, before you type anything:

| # | Element | Source | Note |
|---|---|---|---|
| 1 | Mode switch: **Find an exercise / Build a custom day** | `App.tsx:368-385` | Kept (E5). |
| 2 | Label "Search exercise" | `App.tsx:480` | It sits above the chips, not the input. |
| 3 | **9 region chips** (All, Chest, Back, Shoulders, Arms, Legs, Glutes, Core, Full Body) | `App.tsx:481-493`, `exerciseFilters.ts:7` | One row, scrolls sideways: 489 px of chips in a 311 px row. Arms/Legs and the rest are cut off. |
| 4 | Search input "Bench press, squat, row..." | `App.tsx:494-503` | The results dropdown shows only after you type or pick a chip. |
| 5 | A **pre-selected exercise** (Barbell Bench Press by default, `App.tsx:199-212`) with the label "Exercise" (E1) | `App.tsx:522` | The page opens on an exercise you didn't pick. |
| 6 | Exercise name = **link to Google Images ↗** | `App.tsx:524-540` | The biggest text on the page leaves the app (same issue as T4). |
| 7 | "Primary muscles" and "Secondary muscles" groups (E2) | `App.tsx:545-565` | Still two headings. |
| 8 | Squeeze cue card (long catalogue cue) + "+" for posture tips | `App.tsx:575-583` | Good content, but it uses the long cue, not the approved short cue. |
| 9 | "Last max" tile | `App.tsx:585-590` | This is what #341 (E3) kept. |
| 10 | **"Track it as you go"**: set table (Set, Previous, kg −/+, Reps, ✓, ×) × 2, "+ Add set", Notes textarea, **Log workout** | `App.tsx:594-630` | A full logger is always open, even when you only wanted to look something up. The weight input is **26 px wide** and the ×/✓ buttons are 32–36 px. |
| 11 | "See full progress ›" | `App.tsx:633-641` | 32 px tall. |

Result: **32 interactive controls on one screen**, and none of them is "what you probably want".
Search results (`ExerciseSearchSuggestions.tsx`) show the name plus "Region · muscle · muscle" (for example
"Back · Upper Back · Lats"). They don't show equipment, so the 24 matches for "row" (barbell, cable,
dumbbell, single-arm…) look alike. With no match you only see "No exercises found.", with no way to
create one.

> #341 merged E3 (duplicate history removed). **E1 (the "Exercise" label) and E2 (merging primary and
> secondary muscles) are still in the code** (`App.tsx:522`, `:548-556`). This proposal includes them.

### 1.2 Create your own exercise (only inside "Build a custom day")

Path: Exercises › **Build a custom day** › **+ Add exercise** › **"Can't find it? Create custom"**. That is
4 taps before you can type a name (`WorkoutPlan.tsx:3139`, `:3211`, `:2399`).

| Step | What you see | Source |
|---|---|---|
| Builder | "Make your plan · MANUAL", hint "Organize your plan into days and add exercises.", day tabs + "+", Rename day, Delete day, empty text, + Add exercise | `WorkoutPlan.tsx:3043-3150` |
| Add sheet | Title, Close, search box, 8 muscle chips (All + 7), **all 227 exercises** listed (recent first), "Can't find it? Create custom" | `:3175-3214`, `:965` |
| Create sheet | Title "Create custom exercise", Close, **Exercise name**, 7 muscle chips **with no visible label** (required), Sets stepper, Minimum reps stepper, Maximum reps stepper, Rest (60/90/120 s), "Add to Day A". **11 controls**, no equipment field, and the button stays disabled with no explanation until a muscle is picked | `:3217-3305` |

What happens to the data (code read, not changed):
- The builder stores the exercise **only by name and muscle** in the custom plan (`gym-studio.custom-plan`,
  `storage.ts:87`). There is no `exerciseId` (`WorkoutPlan.tsx:2449-2459`).
- An exercise id is created **the first time you log it**: `upsertExerciseRecord` makes an id from the name
  (for example `hack-squat`, or `hack-squat-custom` if that clashes) (`storage.ts:956-975`, called from
  `WorkoutPlan.tsx:2045`, `:2207`). It is then saved to local storage (`storage.ts:953`).
- Until then it **doesn't show up in Find an exercise**. After that it shows up with `primaryMuscle` = the
  region word (for example "Legs") and **no `bodyRegion`**. So the region chips never match it
  (`exerciseFilters.ts:51`).
- There are **two different search engines**. Find uses `filterExercises` (accent-insensitive, matches
  muscles, understands abbreviations such as "rdl" and "db"). The builder sheet uses plain
  `includes` on names (`WorkoutPlan.tsx:965-975`). "rdl" works in one and not in the other.
- No equipment is recorded, but the app uses equipment for logging rules (`filterLoggableSets(...,
  equipment)`, `App.tsx:290`) and the trainer's load steps. A custom bodyweight or dumbbell exercise is
  treated as unknown.

## 2. Opportunity

The best-known loggers make "find" and "create" one flow:

- **Strong and Hevy** (product knowledge, not re-verified today): the exercise picker opens on a search
  box with recent exercises underneath. Results are one-line rows with the name and the muscle or equipment.
  Filters are a single control. When nothing matches, "Create exercise" is right there, with the name you
  typed already filled in. Their create form asks for the name, the equipment or type, and the main muscle.
  Everything else is optional.
- **NN/g, "Search: visible and simple"** (https://www.nngroup.com/articles/search-visible-and-simple/):
  make search an open box people can type into right away, and don't hide it behind options.
- **NN/g, "Progressive disclosure"** (https://www.nngroup.com/articles/progressive-disclosure/): show the
  few options most people need. Move the rest one step away, so the main path stays easy and the advanced
  path still exists.
- **NN/g, "Placeholders in form fields are harmful"**
  (https://www.nngroup.com/articles/form-design-placeholders/): every field needs a visible label (the
  current muscle chips have none).
- **Apple HIG, Sheets** (https://developer.apple.com/design/human-interface-guidelines/sheets): use a sheet
  for a short, focused task that people can dismiss easily. This fits "look at an exercise" and "create an
  exercise".
- **Material 3, Chips** (https://m3.material.io/components/chips/overview): filter chips are a compact
  single-choice set, and a single row works best when every option fits or the row clearly scrolls.

Our own direction already says the same: one primary action, big targets, details behind ⋯
(`2026-10-18-workout-mode-aligned.md`, D4).

## 3. Proposal: Find an exercise

```
┌───────────────────────────────────────┐
│ Exercises                             │
│ [ Find an exercise ][ Build a custom day ]
│ ┌ 🔍 Search 227 exercises…        × ┐ │ ← one box, 52 px, 16 px text (no iOS zoom)
│ [All][Chest][Back][Shoulders][Arms]→  │ ← ONE row, 8 chips (Full Body: by search)
│ IN TODAY'S PLAN                       │ ← shown before typing
│ [≡] Barbell Bench Press          ›    │
│     Chest · Barbell                   │ ← name + main muscle + equipment icon/word
│ [≡] Barbell Bent-Over Row        ›    │
│ RECENT                                │
│ [▭] Dumbbell Bench Press         ›    │
│ ⊕ Create your own exercise            │
└───────────────────────────────────────┘
typing "hack squat", no match:
│ RESULTS · 0   No match for "hack squat".
│ ⊕ Create "hack squat"                 │ ← name already filled in on the next sheet
```

Steps:
1. **Open the tab**: the search box and chips are at the top. Below them: *In today's plan* (the active
   block day's exercises) and *Recent* (the last logged distinct exercises; the builder already sorts this
   way, `WorkoutPlan.tsx:960-975`). **No exercise is pre-selected and no logger is open.**
2. **Type or tap a chip**: the lists are replaced by *Results · n* (rows). Use the existing
   `filterExercises` for both Find and the builder (one search engine).
3. **Each row** shows: equipment icon, the name (one line, truncated), and a second line with the
   **first primary muscle · equipment** (catalogue `primary_muscles[0]`, `equipment`). Tapping a row opens
   the exercise sheet.
4. **Exercise sheet** (bottom sheet, `role="dialog"`):
   - The title is plain text (not a Google link). Below it: "Chest · also Triceps, Front Delts · Barbell".
     This is E2 merged into one line, using only catalogue fields.
   - The **approved short squeeze cue** when one exists (`shortSqueezeCues.ts`, EN/ES). Otherwise the
     catalogue `squeeze_cue` (ES from `docs/fitness/approved/es/`). Otherwise nothing.
   - **Last time**: best set of the last session + date ("82.5 × 10 kg · Mon 12 Oct"), or "Not logged yet".
   - **Primary: Log it** opens the same big kg/reps logger as Workout mode, pre-filled with last time.
   - **Secondary: Add to today / Swap into plan.** *Add to today* adds it as an extra exercise to today's
     session. *Swap into plan* asks which of today's exercises it replaces, for today only, and reuses
     the existing swap flow (`swapTarget`).
   - **⋯ More**: full technique tips, See on Google ↗, Full progress, Add a note.
5. **Close**: swipe down, tap outside, ×, or Esc. You go back to the same list with your search kept.

What is removed or merged vs today:

| Today | After | Why |
|---|---|---|
| Pre-selected Bench Press with a full logger | Removed; lists of plan/recent exercises instead | You see what you probably want, and nothing is logged by accident |
| "Search exercise" label above the chips | The input's own accessible label + a visible placeholder | One less line |
| 9 chips | 8 chips (Full Body found through search: 7 exercises) | Keeps the "one row" rule; **PO decision** |
| Region · muscle · muscle subtitle | Main muscle · equipment | Tells apart the 24 "row" variants |
| "Exercise" label (E1), Primary/Secondary groups (E2) | One line | Already approved in the declutter audit |
| Name = Google link | Plain title; Google in ⋯ | No accidental exits |
| Long cue card | Short approved cue; long tips in ⋯ | Readable mid-set |
| Last max tile + "Track it as you go" table + Notes + Log workout | "Last time" line + **Log it** (big logger sheet) | One logger design across the app |
| "See full progress ›" | ⋯ More › Full progress | Rarely used mid-session |
| "No exercises found." | "No match" + **Create "…"** | A dead end becomes the create path |

## 4. Proposal: Create your own exercise

```
┌ Create your exercise              [×] ┐
│ Name                                  │
│ [ Hack squat                       ]  │ ← pre-filled from the search text
│  Already in the list: … — Use it      │ ← only if the name matches (no duplicates)
│ Main muscle group                     │
│ [Chest][Back][Shoulders][Arms][Legs]  │
│ [Glutes][Core]                        │
│ Equipment                             │
│ [Barbell][Dumbbell][Machine][Cable]   │
│ [Bodyweight][Other]                   │
│ You can change this later.            │
│ ▸ More options (optional)             │ ← note only
│ [         Create exercise          ]  │
└───────────────────────────────────────┘
→ toast: "Hack squat" created. It now shows up in search.  (row tagged "Yours")
```

Steps:
1. You can start from **⊕ Create "…"** (no-match), **⊕ Create your own exercise** (bottom of the
   lists), or the builder's add sheet (same component).
2. **Three fields, one sheet**: Name (pre-filled, `autocomplete="off"`, max 60 characters), **Main muscle
   group** (the same 7 region options the builder already uses, `WorkoutPlan.tsx:255`, now with a visible
   label), and **Equipment** (6 options that map to catalogue `equipment` values, plus Other).
3. **Sensible defaults**: nothing is pre-selected for muscle or equipment, because a wrong default is
   worse than a tap. If the name matches a catalogue or custom exercise, the sheet says so and offers
   "Use it" instead of creating a duplicate.
4. **Create** saves it and closes the sheet. The toast confirms, and the exercise is immediately in search,
   *Recent* and the region chip, tagged **Yours**. Opening it shows the same sheet as any other exercise
   (no cue, no Google link).
5. **Sets / reps / rest are no longer part of creating an exercise.** They belong to a *plan*. When you add
   any exercise to a custom day, the builder shows one line, "3 sets · 8–10 reps · 90 s rest — Change",
   pre-filled with today's code defaults (`WorkoutPlan.tsx:2386-2393`). The steppers open only on
   *Change*. **PT to approve these defaults** (open since 2026-10-09).

What is removed or merged: the sets/min/max/rest steppers leave the create sheet (they move behind
*Change* in the builder). "Create custom exercise" becomes "Create your exercise". The disabled button now
shows its reason (a duplicate notice; the button only turns active when all 3 fields are filled). Create
is reachable from Find, not only from the builder.

## 5. Ids, legacy ids and sync (Tech Lead must decide; flagged)

- **Never change an exercise id once it may have logs.** Today a custom exercise's id is the name slug,
  created at first log (`storage.ts:960`). Renaming the exercise later must **not** change its id. Old slug
  ids (and legacy catalogue ids such as `back-squat` for "Barbell Back Squat", handled via aliases,
  `storage.ts:1000+`) must keep working forever.
- **Proposal (Tech Lead to design):** create the id **once, when you tap Create** (for example
  `custom-<uuid>`, in a namespace that can never clash with the catalogue). Store `bodyRegion` +
  `primaryMuscle` + `equipment` so filters and logging rules work. Keep existing slug ids as they are and
  don't migrate them.
- **Sync risk (please verify):** `public.workout_entries.exercise_id` has a foreign key to
  `public.exercises(id)` (`supabase/migrations/012_workout_entries.sql:10`, the same in
  `031_trainer_data.sql:11`). `public.exercises` is the global catalogue and users can only read it. So a
  signed-in user's logs of a **custom exercise most likely fail to sync** and land in the sync quarantine
  (`sync.ts:153`, `:231`). The custom exercise definitions (`storage.ts:953`) and the custom plan
  (`storage.ts:87`) are **local only**, so they won't appear on another device. `auth-and-sync.md` doesn't
  mention custom exercises. This needs a Tech Lead design (for example a per-user `user_exercises` table
  with RLS, and an FK change or a separate reference) before we promote "Create" from Find.
  Until then, the sheet could say "Saved on this phone" (**PO decision**).

## 6. Web Interface Guidelines audit (read-only)

- **Source:** vendored `.claude/skills/web-design-guidelines/command.md`, official Vercel repository commit
  `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`. **SHA-256 verified** on 2026-10-18:
  `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234` (matches
  `docs/governance/skill-checksums.json`). The rules were treated as reference material only.

```
src/App.tsx:496 - search input lacks autocomplete="off"/enterkeyhint; placeholder uses "..." not "…" (src/i18n/sections/app.ts:23)
src/App.tsx:480 - visible label sits above the chips, away from the input it labels
src/App.tsx:481 - chip row overflows (489/311 px) with no visible scroll affordance
src/App.tsx:525 - primary heading is an external link (leaves the app); move to ⋯
src/App.tsx:633 - "See full progress" target is 32 px tall (< 44 px)
src/components/ExerciseSetTable.tsx - kg input renders 26 px wide at 375 px; ✓/× 32–36 px wide
src/styles.css:1058 - .result-item children have no min-width:0/ellipsis; long names wrap to 2–3 lines
src/components/WorkoutPlan.tsx:3177 - builder search input lacks autocomplete="off"
src/components/WorkoutPlan.tsx:3221 - name input lacks autocomplete="off", name, maxLength
src/components/WorkoutPlan.tsx:3226 - required muscle chips have no visible label (aria-label only)
src/components/WorkoutPlan.tsx:3299 - submit disabled with no inline reason
src/styles.css:7484 - sheets have overscroll-behavior: contain (pass)
```

The prototype follows these rules: labelled fields, 44 px minimum targets, 16 px inputs, `…`
placeholders, `autocomplete="off"`, truncated rows (`min-width:0`), `overscroll-behavior: contain` on
sheets, `:focus-visible` rings, Esc closes sheets, and `aria-live` toasts.

## 7. Ranking (impact / effort)

| # | Change | Impact | Effort | Depends on |
|---|---|---|---|---|
| 1 | No pre-selected exercise; show *In today's plan* + *Recent* before typing | High | S | — |
| 2 | Result rows: main muscle · equipment (+ icon), one line, truncated | High | S | catalogue fields exist |
| 3 | Exercise sheet: short cue, last time, **Log it** (big logger), ⋯ More (Google, tips, progress) | High | M | reuse Workout-mode logger |
| 4 | E1 + E2 (still open after #341) | Med | S | — |
| 5 | One search engine (`filterExercises`) for Find and the builder | Med | S | — |
| 6 | No-match → **Create "…"**; create sheet with 3 fields, visible labels, duplicate check | High | M | #7 for synced users |
| 7 | Stable custom ids at creation + `bodyRegion`/`equipment` + cloud sync of custom exercises | High (data safety) | L | **Tech Lead** (schema, RLS, FK), migration |
| 8 | Builder: sets/reps/rest as one "Change" line with defaults | Med | S | **PT** approves defaults |
| 9 | *Add to today* / *Swap into plan* from the sheet | Med | M | Tech Lead (extra exercise in a block session; `blockId/dayKey` on the entry) |
| 10 | 8 chips (Full Body via search) | Low | S | PO |

**Quick wins (display only, no data model):** 1, 2, 4, 5, 10, plus the a11y fixes in §6.
**Bigger bets:** 3 and 9 (new sheet flows), 6 + 7 together (create from Find, safe ids, sync).

## 8. Expected impact and how to measure

- Find screen: 32 → about 12 controls before typing. Logging an exercise you already know takes
  2 taps (row → Log it) instead of search + pick + scroll to the table.
- Create: 4 taps to reach + 11 controls → 1 tap from a failed search + 3 fields. Name pre-filled.
- Measure (no new tracking needed for a first look): number of custom exercises created per user,
  duplicate custom names (should drop to 0), logs started from Exercises vs Workout mode, and sync
  quarantine entries with an FK error (should be 0 after #7).
- QAer check at 375 px EN/ES: search "rdl" in both places, create → find → log → sign in → second device.

## 9. Risks

- **Two loggers.** "Log it" from Exercises and Workout mode must be the same component. Otherwise we
  re-create the "three places to log" problem (declutter audit, bigger bet).
- **Promoting Create before sync is fixed** means more custom logs that never reach the cloud (§5).
- **Equipment "Other"** has no catalogue value. The Tech Lead picks how to store it, and the trainer must
  not recommend loads for it without a PT rule.
- **Custom exercises have no cue or tips.** That is correct (we don't invent technique), but the sheet
  looks thinner. Don't fill it with generated text.
- No AI here on purpose. A later "Did you mean…?" match (fuzzy match against catalogue aliases) is
  deterministic and needs no LLM.

## 10. Decisions for Sebas (plain words)

1. **Opening the tab:** OK that Exercises opens on a search box plus "today's plan" and "recent", with no
   exercise and no logger already open?
2. **Main button on an exercise:** should it be **Log it**? The alternatives are *Add to today* and
   *Swap into plan*, which would sit next to it as smaller buttons.
3. **Chips:** OK to show 8 chips in one row and drop "Full Body" (you can still search it)?
4. **Creating an exercise asks only name, muscle group and equipment.** Sets, reps and rest are asked only
   when you add it to a custom day. Agree?
5. **Until cloud sync works for your own exercises**, should we let you create from Find anyway with a
   "Saved on this phone" note, or wait for the Tech Lead fix first?
6. **Wording:** "Create your exercise" / "Crea tu ejercicio" and the "Yours / Tuyo" tag. OK?

**For the PT:** approve the default sets/reps/rest for exercises you add yourself (today 3 × 8–10, 90 s).
**For the Tech Lead:** the id strategy, the custom-exercise sync/FK issue, and how "Add to today" is stored.
