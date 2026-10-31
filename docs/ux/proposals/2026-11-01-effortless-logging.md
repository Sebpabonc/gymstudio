# Effortless logging: one tap per set, a clear rest, simpler supersets

> **PO 2026-11-01:** remove the "Reps left in the tank?" prompt from the workout flow (0 of 39 entries answered since 19 Oct). PT to confirm the fallback and the Progress tip before implementation.

> **PO 2026-11-01:** remove the per-set table (# · Last time · Today) from the proposed screens: the Trend by set chart already shows it. The logger keeps one line "Last time: 24 kg × 12"; correcting a logged set moves to a "Fix a logged set" button under the chart.

- **Status:** proposal (UXer), not approved. No code, content or data changed.
- **Date:** 2026-11-01
- **Prototype:** [`2026-11-01-effortless-logging.html`](2026-11-01-effortless-logging.html). 390 px phone, EN/ES, tabs "Today (current)" + 3 concepts, superset layouts A/B/C, live tap counter, lock-screen preview.
- **PO feedback (2026-11-01):** make logging automatic and intuitive; the rest timer should look like a pop-up and be clear about what to do; supersets are confusing, and independent exercises are allowed; keep the progress view inside the exercise.
- **Limits:** tested in Chromium at 390×844 in the local build with `?demo=1` (clock set to a training Monday, today's entries cleared, ES mainly; EN screens spot-checked). Not tested on an iPhone. Research was cut short at the PO's request, so a few competitor details are marked unconfirmed. The concepts share one card, so later feedback can slot in.

## 1. Recommendation

**Concept 1 "Big Done" + superset layout A (independent cards) + the rest pop-up.** The set table and "Trend by set" stay on every card.

The surprise from the test: **today's single-exercise logging is already 3 taps for 3 sets.** More taps are not the main problem. The problems are that the app does not explain itself, the superset screen, a dangerous button, and a rest that does not say what is happening. So the fix is mostly clarity, not fewer taps.

## 2. Top confusions found

| # | Finding | Evidence |
|---|---|---|
| 1 | **"Registrar ejercicio" logs sets you did not do.** With nothing ticked, one tap saved all 3 prefilled sets and moved on. It sits below the chart with no explanation. This pollutes history and the trainer's evidence. | Reproduced. `src/utils/workoutSets.ts:70-73` returns all sets when none are ticked; button at `WorkoutPlan.tsx:4364-4372` |
| 2 | **Supersets lose work.** Ticks live only in memory until the last round or "Terminar superserie". Reloading after round 1: back to Round 1 of 3, nothing saved. Single exercises save every set. | Reproduced. `SupersetLogger.tsx:154, :314` vs `WorkoutPlan.tsx:2105` |
| 3 | **C2 is off screen.** Opening a superset, C2's ✓ is at y≈1011 on an 844 px screen, because C1's tools, notes and trend come first. "Ronda 1 de 3" appears twice, "Superserie" three times, and the rest says "Serie 1 registrada" for a round. | Measured |
| 4 | **After ticking C1 the cursor jumps into C2's weight box.** On a phone this probably opens the keyboard (not verified on a device). | `SupersetLogger.tsx:153` |
| 5 | **Rest looks like any other box.** It replaces the logger, the layout jumps, and the timer is the smallest thing in it. A big "Terminar superserie" button sits under a superset rest. | `RestTimer.tsx`, `WorkoutPlan.tsx:4107` |
| 6 | **Nothing tells him rest ended on iPhone.** The app only calls `navigator.vibrate`, which iOS Safari does not implement. No sound, no haptic plugin. "Rest done" shows for 3 s and vanishes. The Live Activity shows "Go" with no alert and hard-coded English. | `RestTimer.tsx:48-60`; `RestTimerLiveActivity.swift:22, 36, 56` |
| 7 | **A changed weight does not carry over.** +2.5 on set 1 gave 87,5 / 85 / 85, so the same change costs 3 extra taps. | Reproduced |
| 8 | **The insight and RIR vanish after 3 s.** The bar runs out and the app jumps to the next exercise. The approved RIR review says there is no timer and rest is when people answer. The insight can also read as a contradiction: "PR de reps" + "↓ Menor" + "Serie 1: +2,5 kg" + "−7%". | `WorkoutPlan.tsx:2259`; `2026-10-18-rir-prompt-review.md` rule 4 |
| 9 | **Fixing a mistake is hidden.** Undo appears only during rest; after Skip it is gone (the toast seems hidden by `styles.css:7221`). The way out is tapping a row (unlabelled), a stepper, then "Registrar serie 1" again, which restarts the rest. Until then the table shows the new number with a ✓ though it is not saved. | Reproduced |
| 10 | **Only the builder knows:** set rows are tappable; chips 1–8 have no labels and 7–8 sit under the EN button; "Salir" keeps progress while "Terminar" ends; rose chip pairs mean superset; "Hecho · 2 series" shows on an unfinished exercise; tapping the timer pauses it. | Walkthrough |
| 11 | **Two loggers.** "+" on Today opens a second, different logger (columns, ✓, "Igual que la serie 1", "Iniciar descanso", "Registrar ejercicio"). | Walkthrough |
| 12 | **The rest number disagrees.** Today's card says 150 s for the T-bar row; the timer gives 2:00, the single setting in You. | `WorkoutPlan.tsx:2104`, `storage.ts:324-333` |

## 3. Tap counts

Rest running out costs 0 taps; Skip adds 1 per rest. Counted by script against the live build and the prototype.

| 3-set exercise | As planned | One set changed | Weight changed on all 3 |
|---|---|---|---|
| Today | 3 | 4 | 6 |
| **1 Big Done** | **3** | **4** | **4** (carries, straight sets only) |
| 2 Check list | 3 | 5 | 5 |
| 3 One question | 3 | 5 | 5 |

| 3-round superset, as planned | Taps | Scrolling | Honors C1 → ~10 s → C2 on screen |
|---|---|---|---|
| Today | 6 | about 1 per round | Small text under C1, off screen from C2 |
| **A Independent cards** | **6** | 0 | Yes |
| B Card + round | 6 | 0 | Yes |
| C Combined, simplified | 3 | 0 | Instruction text only |

Full 8-exercise demo day: 25 taps today without Skip (1 start, 6 sets, 18 ticks), 39 skipping every rest. Layout A stays at 25; layout C would be 16.

| Job | Today | Proposed | What is unclear today |
|---|---|---|---|
| Find today's workout | 0 | 0 | On a rest day (Saturday) it opens next week: "Semana 5" beside "Semana 4 de 6" |
| Start | 1 | 1 | Fine |
| Log a set | 1 | 1 | "Registrar serie" vs "Registrar ejercicio" |
| Change a weight | 1 per set | 1, then carries | Nothing says whether later sets follow |
| Rest | 0 | 0 | See finding 5 |
| Next exercise | 0, after 3 s | 0, when rest ends | Jumps while you read |
| Finish | 0 at the end; 2 early | Same | Salir vs Terminar |
| Fix a mistake | 3+, restarts rest | 1 Undo, or 2 tap row + stepper | Finding 9 |
| Superset round | 2 + scroll | 2 | Findings 2–4 |
| See progress | 1 tab; trend in the exercise | Same | Kept, see §6 |
| Swap | 1 + pick | Same | Fine |

## 4. What "automatic" honestly means

The app cannot know what you lifted, so "automatic" means **everything except the confirmation**.

| Automatic | Your one job |
|---|---|
| Values prefilled from the plan | Tap **Done** when the set is done |
| Saved at every Done, including supersets | Change a number only if it differs |
| Rest starts by itself; ends with vibration and sound; next set ready | |
| Jump to the partner, the next exercise, then Completed | |
| A changed value carries to later sets of a straight exercise | |
| Undo instead of "are you sure?" | |

**Must never be automatic: logging a set the user did not confirm.** Auto-logging when rest ends is not acceptable unless the PT agrees: a skipped set, or lighter weight, would enter history as done and feed the trainer false evidence. Also remove the "log everything" button in workout mode (finding 1).

**Risk of one tap (for the PT):** people may tap Done without correcting. Targets like 6–8 prefill the lowest number, so someone doing 8 would record 6 and the trainer would see less than they did. Mitigation: the button repeats the values ("Done · 37.5 kg × 8"). The PT should choose the prefill. Measure how often values are edited.

## 5. Three concepts (all in the prototype)

| Concept | How it works | For | Against |
|---|---|---|---|
| **1 Big Done** (recommended) | Today's card, with a big button that states what it saves | Smallest change, cheapest change-a-value, always clear | Steppers stay on screen |
| **2 Check list** | The table is the logger: rows with kg, reps, ✓, as in Strong and Hevy | One view of all sets; pyramids read well | Small targets, 2 taps to edit, new pattern |
| **3 One question** | "Did you do this? 37.5 kg × 8" → Yes, done / Change | Calmest; a beginner cannot go wrong; fits an AI-coach voice | Extra tap on every change; hides that values are editable |

Pyramids: each set keeps its own target and does not carry (example in the prototype: reverse pyramid 37.5×8, 35×10, 35×12 from approved R25).

**Rest pop-up (every concept).** A card rising from the bottom over a dimmed screen, not full-bleed:

```
┌───────────────────────────────┐
│ ◷ Rest                 Hide ▾ │
│             1:58              │  biggest thing on screen
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬   │
│  ✓ Set 1 logged · 37.5 kg × 8 │
│ ┌ Next ─────────────────────┐ │
│ │ Set 2 · 35 kg × 10        │ │
│ │ When time runs out your   │ │  shown once per session
│ │ phone vibrates and sounds │ │
│ └───────────────────────────┘ │
│  [ +15 s ]        [ Undo ]    │
│  [   Start next set now    ]  │  thumb zone
└───────────────────────────────┘
```

- **Time runs out:** vibration + sound, the card turns green and says "Go", shows what is next, then closes after 3 s with the next set ready. It never logs anything.
- **Hide:** tap Hide or outside. A slim bar stays pinned at the bottom while scrolling ("1:56 · Rest · Next: Set 2 · 35 kg × 10 · Open"), so the table and trend are readable during rest.
- **Leaving the screen:** the existing dock pill in the app; Live Activity and Dynamic Island when locked, using the same words: "Rest", "Next: 35 kg × 10", and "Go" at zero.
- **After the last set of an exercise:** the pop-up also carries the insight in one line and "Reps left in the tank?". The finished exercise stays behind it, so Hide shows its finished chart. It moves on when rest ends.
- **Compared with today:** today's box fills the logger's slot, shrinks the time and scrolls away. NN/g reserves modals for justified interruptions, so this one blocks nothing and hides with one tap.

## 6. Superset logging

| | A Independent cards (recommended) | B Card + round | C Combined, simplified |
|---|---|---|---|
| What you see | One exercise, exactly like a single one, plus "Superset with Lat Pulldown · then 10 s" | Same card, plus "Round 2 of 3 · C1 ✓ → C2" | Both exercises and one "Done · round 1" |
| New ideas to learn | None; "Set 2 of 3" as usual | "Round" | "Round", plus a C1/C2 instruction to read |
| After Done on C1 | Jumps to C2 at once | Same | Nothing until the pair is done |
| Own cue, tools, table, trend | Yes | Yes | Long card, two charts |
| Taps, 3 rounds | 6 | 6 | 3 |

**Why A.** It removes the superset screen altogether: a first-timer who can log one exercise can already log a superset. C has half the taps and wins on raw speed, but it is the "confusing" screen he complained about, and it logs C1 only after C2 is finished. Cost of A: 3 more taps per superset. B is the fallback if he misses seeing the round.

**Rule kept, no PT change:** C1 → ~10 s → C2, normal rest after the pair. The ~10 s must not look like a rest: it is a thin dashed line inside the card ("Now C2 · 9 s · Undo"), with no pop-up, no big clock, no buttons to press, no Live Activity. You can tap Done whenever you like. The full pop-up only comes after C2.

**Chips show the pair:** `✓  [ 2 ⇄ 3 ]  Superset 1/3`. The two numbers share a dashed outline with a link icon. Tap to look at either one. Replaces today's hyphen and rose colour, which only a builder can read.

**Trend stays visible (PO, keep it).** The set table (last time vs today) and "Trend by set" stay on every card: while logging, under the hidden pop-up, on each independent superset card, and on Completed. Today's bars are dashed and turn solid as you log. Open/closed preference stays as it is. Layout A also solves the chart pushing C2 off screen, since each exercise has its own card and its chart sits under its own logger.

## 7. Ranked fixes

| # | Fix | Impact | Effort | Needs |
|---|---|---|---|---|
| 1 | Remove "Registrar ejercicio" from workout mode; never log unticked sets | Very high, protects data | S | TL |
| 2 | Save supersets per set | Very high | M | TL |
| 3 | Independent superset cards (A), jump + 10 s strip, paired chips | Very high | M | TL |
| 4 | Rest pop-up with Hide and pinned bar | Very high | M | TL |
| 5 | Real end-of-rest alert on iPhone; Live Activity says what's next, in ES too | High | M | TL (permission, native build) |
| 6 | "Done · 37.5 kg × 8" button; hide "Same as set 1" etc. | High | S | Copy |
| 7 | Carry changes to later straight sets | High | S | PT, TL |
| 8 | RIR and insight inside the rest pop-up, no 3 s timer | High | S | PT check |
| 9 | Undo always reachable; tap a logged row to edit, saves at once, no new rest | High | S | TL |
| 10 | Stop moving focus into inputs | Medium | S | |
| 11 | App-wide list below | Medium | M | |

**Quick wins:** 1, 6, 8, 10. **Bigger:** 2, 3, 4, 5.

## 8. App-wide intuitiveness list

- **Remove:** the second logger on Today ("+" becomes a read-only preview); "Iniciar descanso" and "Registrar rondas" on Today; EN/ES in workout mode; the welcome card (NN/g: tutorials have not been shown to improve performance, and contextual tips work better).
- **Rename:** "‹ Salir" → "‹ Hoy" (saved automatically); "Ver o editar" → "Revisar"; "Mantener abierto" goes with the timer. "Mixto", "PR de reps" and "series efectivas" need plainer words (PT).
- **Label:** every "+" on Today and the block header; chips get a caption for the current exercise; the title stops cutting off "Día 1 · Tren superior…".
- **States:** rest day says "Rest day · Next: Mon · Upper A" instead of a next-week preview; "2 of 3 sets" instead of "Hecho" on an unfinished exercise.
- **One-line hints only, once each:** first rest ("When time runs out…"), first partner jump. No tours.
- **Drop the hidden tap-to-pause.** +15 s and Hide cover it. Otherwise it needs a label.

## 9. For the PT (no engine change proposed)

1. Which reps to prefill for a range like 6–8 (lowest, last time, or ask)?
2. Does a changed value carry to later sets on straight sets? Pyramids stay per set in this design; is that right? Drop sets are not designed yet and keep today's fields until reviewed.
3. RIR inside the rest pop-up. Does it fit R-RIR3 and R-RIR5? For a superset it asks about both exercises after the last round; the last exercise of the day asks on Completed, while R-RIR3 says finishing dismisses it, so that needs a yes or no.
4. Should sets logged seconds apart count as weak evidence? Only a question; engine untouched.
5. Auto-logging at rest end stays a no unless the PT says otherwise.
6. Timer 2:00 vs the block's `rest_seconds` (finding 12): which one wins?

## 10. For the Tech Lead

- **When data is saved today:** single sets persist at once (`logWorkoutSet` `WorkoutPlan.tsx:2074-2106` → `logPlannedExercise` → `saveWorkoutHistory:2201`, marks entries dirty for sync). Verified: 1 set in `gym-studio.demo.history` after the first log. Supersets persist only at the end via `logSuperset` / `createSupersetEntries`.
- **Independent cards:** entries are already per exercise, so option A could reuse the single path with no new shape: one `WorkoutEntry` per exercise, growing by set. `getLoggedSupersetRounds` (`supersets.ts:33`) can still derive rounds from `Math.min(set counts)`. To check: uneven counts; `target` and `saveTrainerResult` as written in `logSuperset`; partial entries showing as "done" (`findExerciseCompletion`); trainer evidence reading a half-done entry; `upsertScopedEntry` under frequent writes; whether a half-round mid-sync is safe. Your call on `SupersetLogger.tsx` and `createSupersetEntries` afterwards. No `localStorage` shape change is intended, so this should stay within the storage boundary.
- **Alert:** `navigator.vibrate` does nothing on iOS. Options: Capacitor Haptics in the foreground; a scheduled local notification with sound at `endAt` when backgrounded (needs permission, and JS timers suspend, so the 3 s clear in `RestTimer.tsx:48` may not run). Live Activity alert or local notification is your decision.
- **Live Activity:** `exercise` could carry the "next" text; localize "Rest", "Rest paused", "Go". Today's label for a superset is both names joined. The 10 s strip should not start one.
- **Undo:** `undoLastLog` clears all drafts (`WorkoutPlan.tsx:2056`), by reading the code, not tested across exercises; typed values elsewhere may be lost. After the last set of an exercise, no Undo shows during the insight.
- **Tests:** `src/trainer/invariants.test.ts` is unaffected unless prefill changes. A trainer-visible change would go through the AI Trainer release checklist.

## 11. Web Interface Guidelines audit

- **Source:** vendored `.claude/skills/web-design-guidelines/command.md`, Vercel commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`, audited 2026-10-31. SHA-256 verified: `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`. Rules treated as reference only. Scope: logging components only, not a full compliance claim.
- `src/components/SupersetLogger.tsx:153`: focus moved to an input on mobile (autoFocus rule).
- `src/components/WorkoutPlan.tsx:4202-4207`: `<button role="row">` overrides button semantics (semantic HTML first).
- `src/components/SetTrendChart.tsx:127-137`: bars 10 px wide with a tap action, under any comfortable target size; `:107` handlers on `<g>`.
- `src/components/WorkoutPlan.tsx:2259`: content auto-dismisses after 3 s with no pause by default; the "Keep open" button is the only control.
- `src/components/RestTimer.tsx:74-90`: timer is a button whose action shows only in `aria-label`.
- `src/components/WorkoutSetInputs.tsx`, `WorkoutExerciseActions.tsx`: labels pass.

## 12. Impact, risks, measuring

- **Expected impact:** no accidental bulk logging, no lost supersets, and a first-timer can complete a superset without explanation. Taps do not drop much, on purpose.
- **Risks:** careless Done taps (§4); a pop-up on every set could annoy (Hide could be remembered; PO to say after trying it); more screen changes in supersets (the partner line explains the jump); the prototype's rest is 10× faster by default and uses sample numbers.
- **Measure:** QAer superset flow at 375 px with no instructions; 0 unconfirmed sets; 0 lost sets on reload; edit rate per set; rest skipped vs run out; RIR answer rate before and after; Sebas's verdict after one real week.

## 13. Decisions for Sebas

1. Logging: **Big Done** (recommended), Check list or One question?
2. Supersets: **independent cards A** (recommended, 3 more taps per superset), with round indicator B, or combined C?
3. Rest pop-up: after every set (recommended, try it in the prototype), and is "Hide" enough?
4. Remove "Registrar ejercicio" from workout mode? (Recommended, yes.)
5. May the app ask for notification permission, so rest can alert you with the phone locked? (Recommended, yes.)
6. Should Today become view-only, with logging only after "Empezar"? (Recommended, yes.)

## Sources

Summarised in my own words. Hevy: [workout settings](https://www.hevyapp.com/features/workout-settings/) (Smart Superset Scrolling, rest timer, keep awake, prefilled values), [track workouts](https://www.hevyapp.com/features/track-workouts/), [supersets](https://www.hevyapp.com/features/what-are-supersets/). Strong: [rest timer](https://help.strongapp.io/article/231-rest-timer) (auto-start at set completion; article is old), [first workout](https://help.strongapp.io/article/229-my-first-workout), [App Store notes](https://apps.apple.com/us/app/strong-workout-tracker-gym-log/id464254577) (Live Activity). Fitbod: [Apple Watch](https://help.fitbod.me/hc/en-us/articles/360006499194-Apple-Watch) (superset logging on Watch not confirmed). Apple Watch: [custom workouts, Up Next view](https://support.apple.com/guide/watch/create-a-custom-workout-apd66fcd5c5c/watchos) (strength-set logging not confirmed). Gymkee: [superset flow](https://gymkee.com/it/help/coach/creare-superserie-triserie-circuiti-amrap-emom-tabata-ecc/) (moves to the next exercise after a set; rest after the last). NN/g: [app onboarding](https://www.nngroup.com/articles/mobile-app-onboarding/), [instructional overlays](https://www.nngroup.com/articles/mobile-instructional-overlay/), [modal vs nonmodal](https://www.nngroup.com/articles/modal-nonmodal-dialog/). Undo vs confirm: [GNOME HIG](https://developer.gnome.org/hig/patterns/feedback/dialogs.html). iOS vibration: [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate) (limited availability), [third-party note on iOS](https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari). Capacitor: [Haptics](https://capacitorjs.com/docs/apis/haptics), [Local Notifications](https://capacitorjs.com/docs/apis/local-notifications). Apple's Live Activities guideline page could not be read by my tools, so it is not relied on here; the Tech Lead should check it.
