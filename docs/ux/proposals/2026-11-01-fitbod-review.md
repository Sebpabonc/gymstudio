# Fitbod competitor review, head to toe, and GymStudio vs Fitbod

- **Status:** research proposal (UXer), not approved. No GymStudio code, content or data changed. The AI created no account, signed in to nothing and bought nothing; the PO's own account and trial were used.
- **Date:** 2026-11-01 (file name, as requested). All sources read 2026-10-31. **Updated after an on-device session on 2026-10-31 (§0A).**
- **After this report:** PR #382 (Big Done) merged on 2026-11-01 and is live. Where this report says it is open, read it as live. Its tap counts still come from the proposal and were not recounted against Fitbod.
- **Readable report for the PO (Spanish):** [`2026-11-01-fitbod-review.html`](2026-11-01-fitbod-review.html)
- **Summary in one line:** Fitbod wins before and around the workout (guided first run, demos, equipment, reminders, store page), but it also asks for an account before showing any workout. GymStudio can win inside the workout and in trust (one tap, a plan that stays put, a reason for each number, plain wording), if the launch blockers are closed first.

## 0. How to read this: evidence levels

The first pass could not use the app. The on-device session added **[H]**, and it overrides any weaker label on the same point. Every claim carries one of these labels.

| Label | Meaning |
|---|---|
| **[H]** | **Verified on device:** I saw it myself in the app on the PO's iPhone, 2026-10-31 |
| **[V]** | Verified on Fitbod's own public pages or its App Store listing, read directly |
| **[S]** | From a third party that used the app or its video (independent reviewer, screen-recording breakdown) |
| **[C]** | From a competitor or a low-confidence source. Treat as a lead, not a fact |
| **[D]** | Needs someone to use the app on a device. Still open after the session (§12) |

### Blocked or unavailable

| Source | What happened | What I used instead |
|---|---|---|
| Fitbod help center via the fetch tool | HTTP 403 | Read in the desktop browser pane as an ordinary public page. Worked |
| Reddit (`r/fitbod`) | Blocked by both tools | Second-hand summary of named threads (fitnessaitrends), marked [C]. **No Reddit thread was read directly** |
| Google Play listing | Page content was not returned | Android rating and Data Safety are **unverified** |
| kimola review report | HTTP 410 | Not used |
| App Store keyword field | Never public | Only name, subtitle and description are evidence. Third-party keyword tools not used |

### Stopped on purpose

I opened Fitbod's web quiz (`join.fitbod.me/home`) and read the first question. I did not answer it, so I did not walk the quiz. The onboarding order past question 1 is [S] or [D].

### Fitbod's public numbers disagree with each other

Do not repeat any of these as fact.

| Claim | Values found |
|---|---|
| Exercises | 800+ (algorithm blog), 1000+ (App Store), 1,500+ (help), 1,600+ (2026 blog) |
| Logged workouts behind the algorithm | 71M, 87M, 100M, 120M, 150M, 400M, depending on the page |
| Full muscle recovery | 48–72 h window (2022 blog) vs up to 7 days (help, Sep 2026) |
| Trial | 7 days with plan opt-in (help, FAQ) vs "3 free workouts" (TechRadar 2023, GGR) vs "no free trial" (screensdesign) |

## 0A. On-device session, 2026-10-31

**How:** Fitbod on the PO's iPhone through iPhone Mirroring on his Mac. English interface, because the phone is in English. The PO created the account and started the trial himself; the app showed 7 days left and 0 workouts. I logged test sets in a workout I then discarded, and walked the questionnaire signed out, up to the sign-up screen.

### What the session corrects

| Topic | First report said | Seen on device [H] |
|---|---|---|
| Account | Fitbod shows a workout before any commitment | **It asks for an account after the questions, before any workout is shown.** The sign-up line says it is needed to reach your plan |
| Questionnaire | 14 or about 30 steps; web quiz opens with age | **11 answers to reach sign-up** on the path I took. It opens with the goal. No age question before sign-up |
| Before sign-up | Projected strength gains shown | Not shown on this path |
| Taps, 3-set exercise | About 4–5 | **5 without a warm-up, 6 with one:** open, one per set, then Done |
| Weight change | Whether it carries was unknown | **It carries at once to all later sets, as you type.** Not to the warm-up |
| After the last set | Unknown | **Does not move on.** It offers an optional effort rating and Done, then returns to the list |
| Rest timer | Starts after logging a set | **The switch was off** on this account until I turned it on. Times differ by lift (2:00 press, 1:15 raises and curls) |
| Rest away from the app | Only if you find a setting | **A Live Activity keeps counting and then shows the next set.** The rest-ended notification switch was on. The alert itself was not observed |
| Log All Sets | Logs what you did not confirm | **It asks first**, with an option to stop asking. The concern stays, but it is not a silent action |
| Supersets | Exact flow unknown | **One set, then the partner opens at once; after the partner, the rest; then back to the first lift.** Each tap saves. Same idea as our layout A |
| AI inside the app | No public sign of a chat or LLM | **There is one:** an AI chat for injuries and limitations (beta), under My Plan. I read it and sent nothing |
| Price | $15.99 a month, $95.99 a year | **The paywall on this account showed $24.99 a month and $149.99 a year**, in US dollars. Store and FAQ figures differ; the reason is unknown |
| Paywall | Before the first workout, exact behaviour unknown | **After log-in: plan summary, then paywall. Its X closes it** and the app works, with the trial banner still showing 7 days |
| Name of the estimate | Renamed to Estimated Strength | **The Focus Exercises card still says Est. 1 Rep Max.** The rename is not on this surface |
| Tabs | Names vary between articles | **Workout, Body, Targets, Log.** Body has Results and Recovery |

### Confirmed

- **Button words:** Log Set and Log All Sets. Log All disappears on the last set. Log Set never repeats the values. In a superset the button also says that the next exercise follows.
- **Undo:** no Undo button appeared. Tapping a logged row reopens it for editing in place. Tapping the green marker does nothing.
- **Why this weight:** no per-exercise reason in the exercise sheet, How-To, History, More, Replace, rest sheet or effort rating. The only explanation is a generic card on the Workout tab saying starting weights are estimates that your updates will refine. This is a new account with no logs, so a reason could still appear later.
- **Account deletion:** Log → gear → scroll to Help → Permanently Delete Account → one alert, which warns that the subscription is not cancelled. It does not say what will be deleted. I cancelled it.

### New things worth knowing

- **Coach voice in the first run.** Questions arrive like messages from a coach, answers are chips on the right, and each answer gets a short reply. Equipment is a preselected list you review. Saying you do not know your strength gets a promise to calibrate from the first workouts. The notification request sells a benefit (a preview on training days), and "maybe later" is a real choice.
- **Attribution question** at the end, including AI assistants as a source.
- **One tip per feature.** A dismissible card appears the first time you reach Recovery, Set Targets or supersets.
- **Workout tab:** header with exercise and muscle count, Switch, duration and gym chips. Switch offers the days of a split with their key lift, muscle groups, saved workouts or from scratch.
- **More menu per exercise:** notes, add warm-up, **kg or lb for that exercise**, recommend more, less or never, delete.
- **Warm-ups** were added on the barbell lifts I opened, not on dumbbell raises or curls.
- **How-To:** two camera angles, playback speed, other names for the exercise, tabs for instructions, target and equipment. The video also plays at the top of the logging sheet.
- **Replace** gave odd options for a rear-delt raise: Turkish get-up and handstand push-up, which fits the review complaints about illogical choices.
- **Settings:** export workout data, app icon, gift pass, and no language option in the parts I saw.
- **My Plan:** goal, injuries chat, location, equipment (70 selected), bodyweight-only, workouts per week, duration, experience, split, variability, focus exercises, warm-up sets, circuits and supersets, timed intervals, units, **Workout Insights (beta, on)**, cardio.
- **Calibrate Strength:** a button with a red dot, and a screen after the paywall offering a 5-minute check with no equipment: plank, squat, push-up. It can be skipped. I did not run it.
- **Plan summary after log-in:** goal, days per week, level and gym, then the training week with the first workout marked.
- **Plate calculator:** draws the plates per side for the set's weight; bars and plates can be edited.
- **Other surfaces:** milestones (volume, workouts, calories), a 14-day guest pass, empty workout report, optional Health Profile (Apple Health or manual: gender, date of birth, height).
- **Small flaws:** milestone volume shows lb while the plan is in kg; weekly goal shows 3 days while the plan says 4; the summary shows 0m for a 45-second workout.

### Saving a workout (one test workout, with the PO's OK)

- **Flow:** stop button → sheet with duration, exercises, volume and calories, plus Apple Health, Strava and Fitbit switches → Log Workout → summary with confetti, muscle figure, calories, volume, sets, Share and Done → a screen about unlocking the weekly streak → Log tab. **No second paywall appeared**, with the trial active, and a single exercise was enough to save.
- **No reason given:** nothing explained the weight or the next workout after saving.
- **Generic celebration:** the confetti was not tied to any achievement, and no record card appeared on this first workout.
- **The next workout changed without explanation:** still called Upper Body Day, with other exercises. Close-grip bench went from 8 reps at 32.5 kg to 10 reps at 35 kg. I do not know which change caused what, because the plan and the date had also changed. Strength Calibrate left the top bar.
- **Progress reacts at once:** Benchmark Lifts shows a calculated 57.2 kg as a one-rep estimate, from 42.5 kg × 8 with 2 reps left. Recovery colours the chest and lists it with the time since. Targets rose to 9%. Exercise History shows the effort answer, warm-up, working sets and the estimate.
- **Past workouts stay editable:** sets, effort answer and added exercises.

### Two things that surprised me

- **Discarding a workout kept my edits.** The next planned workout still had the test weight, the superset and the new order. This is the opposite risk to the regeneration trap in §3: test values can survive a discard.
- **The collapsing tab bar is a trap.** On scroll, the tab bar shrinks to one button and Start Workout widens into that space. I tapped where Log had been and started a workout by accident. It asks before discarding an empty one.

### Limits and honesty

- **Effects on the PO's phone:** a drag meant to scroll moved Dip in the list; I set a test weight of 30 kg, built a superset, turned the rest timer on and started two workouts. I discarded both workouts, and restored 25 kg, the order, the unbundled lifts and the timer. I logged out to reach the first run, and he logged back in.
- **Left in place, with the PO's OK:** one test workout dated 1 Nov 2026, one exercise, Barbell Bench Press 8 × 42.5 kg. It affects Fitbod's estimates for that lift.
- **Not reversed, possibly:** after he logged back in, the plan shows build muscle, 4 days, intermediate and large gym, which match my test answers, and the next workout changed from 9 exercises to Lower Body Day. I cannot tell whether those answers overwrote his or were already the same. He should check My Plan.
- **One unexplained notice:** on the first Log Set, iPhone Mirroring said the iPhone camera was not available from the Mac. It did not recur. I did not count it as Fitbod behaviour.
- **Not reached:** see §12. Nothing of Fitbod's was saved in the repo; screens are described in my own words.

## 1. Positioning, price, platforms, reviews, retention

### Positioning and how they talk about AI

- **Promise:** a strength-only plan that adapts, so you always know the next workout. Website tagline is about less planning and more progress. Audience is said to be all levels, with intermediate and advanced lifters highlighted **[V]**.
- **AI language splits by surface** **[V]**:
  - App Store subtitle: "AI Personal Trainer & Workouts". Description repeats "AI workouts".
  - Website and algorithm article: "proprietary, science-backed algorithm", plus machine learning on behaviour. The word AI barely appears.
  - Terms: says Fitbod does not act as a personal trainer. Privacy policy: does not mention AI.
- **What it is, technically:** workouts look rule-based. SensAI, a competitor, calls it rules-based ML **[C]**. **[H]** The app does have an AI chat for injuries and limitations (beta), which suggests changes to the plan, warns that chats may be recorded by Fitbod and its providers, and links to a help article saying it is not medical advice. The Sept 2026 help articles describe a scoring system over history, recovery and equipment, with a trademarked "mStrength" layer that deliberately varies heavy and light days **[V]**.
- **Lesson for us:** an injury chat is exactly the medical boundary in `docs/ux/README.md`. Any similar idea goes to the PT and the Tech Lead first, and should not be copied by default. "AI" sells in the store title, but their legal text denies the personal trainer. That gap is exactly what `docs/governance/app-store/` G9 forbids for us.

### Price, trial, paywall

- **[H] $24.99/month, $149.99/year on the in-app paywall for this account.** **$15.99/month, $95.99/year** on the FAQ page and App Store. Older $12.99, $79.99 and legacy tiers are still listed **[V]**. The home page shows no price **[V]**. Regional prices vary.
- **Trial:** 7 days, you must opt into a plan to start, and it rolls into paid unless cancelled **[V]**. Apple cancellations need 24 hours' notice **[V]**.
- **Paywall timing:** a video breakdown shows onboarding and the first generated workout are free. Paywall appears once the workout exists and before it starts (yearly plan highlighted), with a second paywall after the workout summary framed around 90-day predictions **[S, one source]**. A Mexican review dated 24 March (year not shown) complains of being sent to payment before exploring, and the developer answers with the trial **[V, one review]**. Exact behaviour **[D]**. **[H]** No payment or trial screen appears before sign-up. After log-in on the PO's account: plan summary, then a paywall with yearly and monthly tabs, four benefits and no mention of the trial; the X closes it. No second paywall after saving a workout, with the trial active. A brand-new sign-up may differ.

### Platforms, integrations, languages

- iPhone (iOS 18+), Android, Apple Watch (watchOS 10+), Wear OS, iOS widget, Mac and Vision compatibility listing, web for quiz and billing **[V]**. Web cannot run workouts ("used only for onboarding") **[V]**.
- Apple Health, Health Connect, Fitbit, Strava **[V]**.
- **Languages: English, Spanish, Portuguese** **[V]**. The app follows the device language, falling back to English; changing it means device settings and logging out and in **[V]**. The Mexico listing is really localised, with its own name ("Fitbod: Rutinas Personalizadas") and subtitle ("Rutinas Fitness y Fuerza") and a Spanish description **[V]**. The quality of the Spanish inside the app **[D]**: not checked, because the phone is in English.

### Ratings and what people say

- **US:** 4.8 of 5, about 289K ratings, Apple Editors' Choice, #36 in Health & Fitness Top Free, age rating 9+ **[V]**. **Mexico:** 4.7, about 1.5K ratings **[V]**.
- **Independent:** Garage Gym Reviews 3.9/5. Setup, equipment and variety 5/5, but instruction 3/5, progressive overload 3/5 and customer service 3.5/5. The tester found AI workouts underwhelming for Olympic lifting and said users must guess the purpose of a session **[S]**. TechRadar 2023: design 5/5, with a limited trial and some bugs **[S]**.
- **Release cadence:** about weekly (25 versions shown, Apr to Oct), notes almost always the generic "bug fixes and improvements", and one release shipped with an unfilled `{version}` placeholder **[V]**.

| What people love | Source |
|---|---|
| Video demos and form help: the most common praise, about 10 of 26 sampled | justuseapp sample [C], App Store [V] |
| Not having to plan: about 9 of 26 | same |
| Equipment and gym profiles (home vs gym) | App Store [V], GGR [S] |
| Variety that keeps it fresh | App Store [V] |
| Value compared with a human trainer | App Store [V] |

| What people hate | Source |
|---|---|
| Subscriptions and billing: unexpected charges, hard cancel (about 15%, method unstated) | onclarity AI summary [C] |
| Same workouts repeating (about 10%); oddly, others complain of too much change | onclarity [C], fitnessaitrends [C] |
| Apple Watch: timer freezes, sync issues, sets vanishing | App Store [V], justuseapp [C]; timer limit confirmed by help [V] |
| Lost edits: changes reset | justuseapp [C]; mechanism confirmed by help [V] |
| Illogical sessions: order, pairing, weights that do not exist on the rack | justuseapp [C], fitnessaitrends [C]; Dr. Muscle [C, competitor] |
| No multi-week plan to follow | fitnessaitrends quoting r/fitbod [C] |
| Price rises | onclarity [C], App Store [V] |

**Sample caveat:** review summaries are small or AI-generated. Treat percentages as direction, not measurement.

### Retention hooks [V]

Scheduled workout preview notification; weekly goal with streak (no grace, resets to 0); Weekly Set Targets ring per muscle; Workout Report weekly on Monday and monthly on Tuesday by notification and email; Year in Review; records; Max Effort Days as recurring events; shareable workout cards for Instagram; Clubs (beta, gym leaderboards and automatic feed); percentile ranking ("Top X% of Fitbodders like you", rolling out, shown only to the top 40%).

## 2. First run

| Step | Fitbod | Evidence |
|---|---|---|
| Welcome | Full-screen video, short tagline, Start and Log In | [H] |
| Order in the app | Goal → training routine → years training → where you train → equipment review → do you know your strength → days per week → workout preview notification → calories → how you heard → (App Store) how you found it → **sign-up** | [H] |
| Length | **11 answers to sign-up** on this path. The "yes, I know my strength" branch was not walked | [H] |
| Web quiz | Opens with an age band; different from the app, which asks no age before sign-up | [V], [H] |
| Equipment | Preselected from where you train; weights per type editable, with search | [H] |
| Motivation before sign-up | Short coach replies. No strength projection on this path, unlike the video breakdown | [H], [S] |
| Sign-up moment | **After the questions, before any workout:** Apple, Google, email or existing account. Small print says signing up accepts the policy and terms | [H] |
| First workout | Seen only on the PO's account afterwards: 9 exercises with starting weights and a card saying they are estimates. New users get conservative weights seeded from data on similar users | [H], [V] |
| Help during it | One dismissible card per feature, the first time you reach it | [H] |
| Calibration | "A few weeks" or 10 to 15 sessions until it feels personal | [C] |

**GymStudio today (measured 390×844 ES, local build, no sign-in):**

1. Welcome card with three generic sentences.
2. "Entendido" leaves a nearly empty screen: `Inicia sesión para crear tu plan`, plus Demo (`src/i18n/sections/app.ts:331`).
3. With an account: Profile goals → Generate plan → starts **next Monday** (`src/plans/buildMyPlan.ts:33`). A new user who downloads on Tuesday cannot train today from their plan. See G7: production has 0 published plans.

**Still the largest gap, but not the one the first report described.** Fitbod also asks for an account before showing a workout. What differs is what comes first and what comes after: it earns the sign-up with 11 quick answers in a coach's voice, and the workout is there straight after. We ask for an account on a nearly empty screen, then questions, then a wait until Monday.

## 3. How a workout is generated, and how you change it

| Topic | Fitbod (all [V] unless marked) | GymStudio |
|---|---|---|
| Unit of planning | A new session each time. Optional **Focus Exercises**: one big lift a day, 4-week phases. Variability control, "More Consistent" keeps 70–80% week to week | 6-week block, fixed days, A/B days |
| Inputs | Goal, experience, equipment (hard filter), split, duration, variety, explicit and implicit feedback, recovery % | Block/template, history, approved engine rules |
| Recovery | 0–100% per muscle from recent training, up to 7 days, adjustable by hand, connected-app activity counted. No formula, and they admit it is an estimate | Not modelled. Plan structure spaces muscles |
| Sets and reps | Goal sets the range (lower for strength, moderate for muscle, higher for fat loss). mStrength varies heavy and light on purpose | Approved block prescriptions, A/B defined by PT |
| Weight | Estimated Strength (projected 1RM). Blog names Epley. Conservative for new exercises. Reduces after a break | Engine from last sessions with explicit rules and invariants |
| Calibration | RiR after sets, optional. Max Effort Days: ramp-ups then two AMRAP sets, automatic, hideable, not triggerable | RiR removed (0 of 39 answered). No AMRAP tests |
| Duration | 15 to 90 min; about 7 exercises per hour; publishes real timing ranges | 45, 60, 75, 90 in Profile goals |
| Equipment | Multiple gym locations with name, editable increments, shareable; bodyweight mode | Three levels: full, basic, home. Swap on exercise |
| Units | lbs and kg | **kg only** (no `lb` in `src/`) |

**Changing a workout [V]:**

- **Swap menu:** other day in split, muscle focus (including "recovered muscles"), saved workouts, from scratch, on-demand (iOS).
- **Session mods:** today's duration and equipment only.
- **Per exercise:** swipe left for Replace or Delete; filters like best replacement or never logged; long-press to reorder; more, less or never recommend (less means about 20–40% fewer).
- **On device [H]:** the same trap has a mirror image. Weight, superset and order edits made in a workout I then discarded were still in the next planned workout. I did not trigger a regeneration.
- **The trap:** edits before Start are not saved. A settings change, or a **workout importing in the background from Apple Health or Strava**, regenerates the workout and wipes them. It has its own help article, and review complaints match.

**Lesson:** Fitbod has moved toward us. Focus Exercises and "More Consistent" exist because people wanted repetition they could measure. A plan that stays put is a real difference, not a limitation, as long as the exceptions (machine taken, short on time) have an easy path.

## 4. Logging during a workout, compared with Big Done

Fitbod evidence: **on device [H]**, plus help articles [V] and the fourth store screenshot [V, marketing image]. On device the screen matches that image, including the two bottom buttons. Big Done figures still come from the proposal and PR #382, which is open.

**Described screen (their screenshot 4, described, not reproduced):** exercise video banner, name, How-To chip, a row of chips (rest time, history, replace, plate tool), a vertical list of sets with reps and weight fields, a green shield on done sets, the current set framed and labelled, future sets dimmed, "+ Add Set", then two bottom buttons, "Log All Sets" and a primary rose button partly hidden behind the Watch in the image (the Watch itself shows "Log Set").

| Task, 3-set exercise | Fitbod, counted on device [H] | Big Done (proposal, PR #382 not merged) |
|---|---|---|
| Reach the exercise | 1, tap in the list | 0, moves on by itself |
| As planned, 3 sets | 3 × Log Set, plus 1 if it added a warm-up | **3** |
| Leave the exercise | 1, Done. It returns to the list | 0 |
| Effort question | After the last set, 0 to 4+; Done works without answering | None (removed by PO) |
| **Total, as planned** | **5, or 6 with a warm-up** (3 with Log All and its confirmation, plus Done, not counted exactly) | **3** |
| Change weight on all 3 | Tap the field and type once; later sets change at once. No steppers on screen. Mirroring hides the iPhone keyboard, so its layout [D] | **4**, stepper and carry (straight sets) |
| What the button says | Log Set, without values | States it: `Done · 37.5 kg × 8` |
| Log all at once | Yes, with a confirmation you can turn off | **No, on purpose** |
| See all sets while logging | Yes, list on screen; video above | One line "Last time", chart below (PO decision) |
| Fix a set | Tap the logged row and edit in place. No Undo button. Swipe to delete and the Log tab not tried | Undo, or "Fix a logged set" |

| Topic | Fitbod | Big Done / GymStudio |
|---|---|---|
| Rest | **[H]** One switch, off here until turned on; working and warm-up tabs; time wheel in 5 s steps. A bottom sheet with countdown, −10, +10, pause and close covers the log buttons, without dimming the sets. Time varies by lift | Exercise value wins, Profile as fallback (PT approved, #383) |
| End-of-rest alert | **[H]** Live Activity counts down away from the app, then shows the next set's reps and weight. Rest-ended notification switch on; in-app sounds on. Whether it alerts on a locked phone, and vibration, **[D]** | Pop-up, haptics, notification, Live Activity in EN/ES (PR #382, to confirm on device) |
| Rest on Watch | Screen dim pauses the timer, notification may not fire, Always On unsupported **[V]**; users report freezes **[V]** | No Watch |
| Supersets | **[H]** Built in 4 taps: menu, tick two, save. Card with "1 of 2" and a button that says the next exercise follows. Log one set, the partner opens at once with no timer. After the partner, the rest sheet; closing it returns to the first lift with the next set active. **6 taps for 3 rounds, plus opening it.** No Log All on this screen. Only the first round was logged | Independent cards, jumps to partner, thin 10 s strip, 6 taps for 3 rounds, saved each tap |
| Normalise weights | One weight across a superset, iOS only **[V]** | Not available |
| Watch | Log, adjust, add sets, rest, heart rate. iPhone needed to start, swap and save **[V]** | None |
| Workout clock | Large timer on top, tap to pause **[V]** | Not assessed |
| Undo | **[H]** No button seen; edit the row instead | Undo in rest pop-up |
| Offline | Workout runs once generated; **videos do not work offline** **[V]** | Logging offline |

**Conclusions:**

1. **We were right about the big button.** The best known AI gym app also ends in one big log button. Ours says more because it repeats the values.
2. **Our lead is larger than the first estimate, on taps and flow:** 3 against 5 or 6, because Fitbod makes you open each exercise and close it. Not asking effort and not requiring typing still help. **Alerting is no longer a clear lead:** Fitbod has a Live Activity too.
3. **Do not reintroduce "Log All".** Fitbod asks before doing it, which is safer than ours was, but our finding 1 showed it pollutes history, and the engine needs true evidence.
4. **PT question, already open:** one-tap logging risks confirming numbers not done. Fitbod's guidance says to edit values because the algorithm learns from them, which is the same risk. Measure edit rate after launch.
5. **Layout A is the right superset design.** Fitbod reaches almost the same flow on device: one card, one set, straight to the partner, the rest only after the pair. Ours keeps the PT's roughly 10 s prompt, which theirs does not have.

## 5. Progress

| Surface | Fitbod [V] | GymStudio |
|---|---|---|
| Top number | **Overall Strength Score**: average of muscle scores, no unit, not in kg. **Locked** until each main muscle has 6 logged sets, usually at least 3 workouts; the app simply says to log 3 workouts [H] | No single score. "Progresando: 8 de 8 ejercicios principales mejorando" |
| Per muscle | **mStrength** score plus trend lines | Weekly sets by muscle, range 10–20 |
| Per lift | **Estimated Strength** in help; **"Est. 1 Rep Max" on the Focus Exercises card [H]**: a projected 1RM, shown as a weight. Can **drop if you do not log the lift**. Benchmark lifts chosen for you | Real best sets, "Mejor serie: 72,5 kg × 8 → 82,5 kg × 10" |
| Records | Automatic; strength record card with trophy | Weight, reps, strongest set |
| Recovery map | Body tab, Recovery side: full-body figure you can turn, days since the last workout, count of fresh muscle groups [H]. Tap a muscle for history. **Their most recognisable screen**, second in the store | None |
| Volume | Targets tab: hexagon ring split into push, pull and legs, each with sets to go, and past weeks as small rings [H]. Workout Report comparing periods | Volume, weekly sets |
| Dips explained | Says a drop or lighter weight is recalibration, not an error | "Más ligero a propósito" by day type (approved copy) |
| Comparison | Top X% percentile, age, gender, bodyweight required, shown only if top 40% | None |

**Compared with our plain-strength wording (2026-10-18):**

- Fitbod hit the same problem and renamed "Projected 1-Rep Max" to **Estimated Strength** in its articles. Same number, softer name. **The app's card still calls it an estimated 1 rep max [H]**, so the rename is only partial.
- We went further: no estimated number on main screens, just real sets. The risk the older proposal flagged remains: **"Strength Score" means something else at Fitbod**, so avoid that name.
- **Leftover in our app:** Progress Overview still shows **"+4,5 kg/semana"** under each main lift (`src/screens/ProgressScreen.tsx:156-157`, approved as supporting display in `docs/fitness/approved/2026-10-10-progress-trends.md` §1.3). A lifter reads this as weight added to the bar each week, and the value is a slope of the trend, not sets. It conflicts with the PO's decision. The row also has three lines before the chart. PT and TL should decide.

**What they do better:** one visual people can read in a second (heat map, ring), and rewards for coming back (report, streak). **What we do better:** the number is what you actually lifted.

## 6. Exercise library

| Topic | Fitbod [V] | GymStudio |
|---|---|---|
| Count | "1000+" to "1,600+" (see §0) | 227 approved |
| Media | Video at the top of the logging sheet; How-To with two angles, playback speed, other names, tabs for instructions, target and equipment [H]. GIFs removed; **no offline video** | Text tips and cues. Image link opens **Google Images** (`src/components/ExerciseFinder.tsx:12`), which also raises the age rating (G12) |
| Browse | All, By Muscle and Categories tabs, filters, search, multi-select with grouping as a superset [H]; categories incl. bodyweight, cardio, mobility, pregnancy | Search; muscle chips; "today's plan", recents |
| Custom exercises | Name, muscles, reps or timed, one or two sides, equipment. **Details cannot be edited** (delete and recreate). Algorithm does not adapt recommendations for them. Cannot be shared | Create your exercise with stable IDs (#362, to verify with a real account, #361) |
| Sharing | Workout link that adapts to the recipient; gym equipment link | None |
| Preferences | More, less, never | None visible at library level |

Form videos are their single most praised thing. The earlier proposal (`2026-10-06-exercise-illustrations.md`) is parked; this review is new evidence to revive it. Do not use or imitate their videos.

## 7. Design

Evidence: **the app on device [H]**, store screenshots [V, marketing], TechRadar and GGR [S]. Seen through iPhone Mirroring at low frame rate, so smoothness and haptics in the hand **[D]**.

- **Navigation [H]:** four bottom tabs: Workout, Body, Targets, Log. No Clubs tab on this account. Settings live under **Log**, an odd place. On scroll the tab bar collapses to one button, and Start Workout takes the freed space, which caused a real mis-tap. Saved workouts sit inside Switch, which fits complaints about finding them [C].
- **Hierarchy [H]:** the exercise list comes first, each exercise opens as a sheet. Video on top, chips below, sets in the middle, actions at the bottom. Sheets for everything: rest, menus, replace.
- **Type:** bold italic for exercise names, strong capital headlines in store images, monospaced-style numbers in fields. Numbers stand out.
- **Colour:** near-black with one saturated rose-red, green for done, gold for records. Close to our dark and rose. **Our rose is more muted, theirs more energetic.** Do not move closer: brand confusion.
- **Shape:** the hexagon recurs in the logo, set markers and the weekly ring. A single distinctive shape is why it feels designed. **Hexagon use is theirs; do not copy.**
- **Tone:** direct, encouraging, emoji in help. Our calm tone stands apart.
- **Why it feels premium:** real photography and video, an anatomical figure as hero, a single accent, and few decorative elements. Density is the cost: one reviewer says the workout screen would overwhelm first-timers without tooltips [S]; on device, the one-tip-per-feature cards do most of that work [H]. Generic confetti at the end, not tied to achievements [S, H].

## 8. Trust, compliance and the store listing

| Topic | Fitbod | For our launch (#384) |
|---|---|---|
| Privacy label | Track: usage data. Linked: health and fitness, contact, support content, IDs, usage incl. advertising data, diagnostics. "Not verified by Apple" text [V] | Ours can honestly be much smaller. Keep it true |
| Health data | HealthKit: reads date of birth, heart rate, height, sex, weight, workouts. Says not used for marketing. Asks for all permissions for reliability [V] | No HealthKit today |
| Ads | Advertising partners, cookies, interest-based ads; does not sell under CCPA; ignores Do Not Track [V] | None. A real selling point once consent is fixed |
| AI disclosure | Privacy policy (updated 2024) does not mention AI [V] | We send data to OpenAI: must disclose and ask (G2, 5.1.2(i)). **Do not mirror their silence** |
| Disclaimers | Terms: not medical advice, consult a professional, own risk, not a personal trainer. FAQ: does not diagnose injuries [V] | Health notice draft in `ai-disclosure.md` §E, PT pending |
| Age | Store rating 9+, but Terms say not for under 18 [V] | Decide minimum age and keep rating and Terms aligned. Do not copy the mismatch |
| Deletion | In app: Log → Settings → Help → Permanently Delete Account, near the bottom of a long list, one alert that warns it does not cancel the subscription and does not list what is deleted [H]. Also by email or website [V] | Not built (G1). Put it in Profile → Privacy & AI, two taps, and say what happens |
| Terms | Last stated update 2022; New York, arbitration, class waiver [V]. Refund: full within 10 days of first purchase, per the Terms [V] | Lawyer |
| Support | Email; large help center; "Ask a trainer" by email; feedback site for voting [V] | Support page draft; one person, so set honest times |

### App Store listing as a model

**Text [V]:**

- **Name** "Fitbod: Gym & Fitness Planner", brand then category keywords. **Subtitle** "AI Personal Trainer & Workouts".
- **Description order:** award line; four short paragraphs of benefits; "Fitbod Features" with subheads AI-Generated Workouts, 1000+ Exercises, Integrations; subscription terms; privacy, terms, California, support links; social links. Repeats goal words (build muscle, gain strength, lose weight), which is keyword coverage.
- **Mexico localises the name itself** rather than translating, to reach "rutinas".

**Screenshots, in order [V], 10 in total, described:** dark, one short capital headline, real UI in a phone frame.

| # | Message (paraphrase or few words) | Shows |
|---|---|---|
| 1 | Smart workouts built for you, plus award laurels and review count | Today's Push Day list |
| 2 | User quote about guesswork, plus 5 stars | **Muscle body map** |
| 3 | Customize your equipment | Equipment checklist |
| 4 | Know how much to lift | Exercise screen and Watch |
| 5 | Progress with confidence | New strength record card |
| 6 | Hit your weekly goals | Weekly Set Targets ring |
| 7 | Track your progress | Strength score and muscle trends |
| 8 | Learn proper technique | Exercise video and instructions |
| 9 | Find alternative exercises | Replace list |
| 10 | User quote about having a trainer without the price | Full photo of a lifter |

**What to take for ours:** one idea per image, first three images do the selling, social proof only once real. **What we can't take:** award, ratings, testimonials (nothing real yet; `docs/marketing/...plan.md` §12 forbids fakes), any caption wording.

**Note on our draft listing:**

- "GymStudio: AI Personal Trainer" conflicts with G9 (PO: AI trainer, never personal trainer). It is the same wording as Fitbod's subtitle. That is a second reason to change it.
- Our lead caption "Know what to lift today" is close to their #4 "Know how much to lift". Lead with what only we say, the reason: **"Today's weight, and why"** / **"El peso de hoy, y por qué"** (PT).
- Draft 8-image order, for Socialer and PT to adapt: (1) today's weight and why; (2) one big Done; (3) a rest that tells you what's next; (4) your 6-week plan; (5) supersets without confusion; (6) your best sets, in plain words; (7) technique cues; (8) fully in Spanish and English (Spanish store: first position candidate). Must be final UI (Big Done merged).
- **Check:** whether Spanish (Mexico) metadata also indexes in the US store. I recall yes but did not verify it.

## 9. GymStudio vs Fitbod

### Where we are already better

| Advantage | Confidence | Caveat |
|---|---|---|
| **A reason for each weight**: "reached the top of the 8-rep target at 40 kg, so I moved the load up" | **Medium to high:** none on the exercise, How-To, History, More, Replace, rest, effort or summary screens, even after one saved workout, only a generic card about starting weights [H]. GGR: users must guess the purpose | **Workout Insights (beta) is on and showed nothing after one workout:** it may need more sessions [D]. Ours sits behind a tap on the cue sheet |
| **A plan that stays put**: 6 weeks, A/B days, comparable results | High | Needs "machine taken" and "short on time" exits |
| **Honest variation**: A/B is named and explained. Fitbod also alternates heavy and light, but users ask why | High | Do not claim Fitbod has no variation |
| **Logging**: 3 taps against 5 or 6 [H], no RiR, no keyboard for common changes, button states values | Medium until PR #382 merges and is tested | **Superset saving per tap is not a lead:** Fitbod does it too [H] |
| **Plain progress**: real sets, not an estimated 1RM or a unitless score | High | "+4,5 kg/semana" leftover |
| **Clear rest alert** if PR #382 holds on device | **Downgraded:** Fitbod has a Live Activity with the next set and a rest-ended notification switch [H] | Ours can still say what is next on the pop-up. Compare once the lock-screen alert is checked |
| **Privacy posture**: no ads, no tracking | True in code today; **consent is not** (G2) | Fix before claiming |
| **Price**: free at launch (Governancer recommendation) | PO decision | Cost control for AI |

**Correction to the brief: Spanish is not a clear advantage.** Fitbod ships Spanish, with a well localised Mexico listing. What is ours: an in-app EN/ES toggle (theirs needs device settings and re-login), and PT-approved Spanish tips. The Mexico rating count (about 1.5K vs 289K) suggests a thinner market where a Spanish-first app could stand out. Inside-app Spanish quality **[D]**. Say "Spanish from day one", never "the only".

**Correction on "AI-first":** at launch we are "rules decide, AI explains", and the AI sends data only after consent. In a comparison this is a trust feature, not a technology lead.

### Where they beat us

Ranked by how much a new user would notice.

1. First run: a guided set of questions, then a workout straight after sign-up, in a coach's voice.
2. Exercise demos.
3. Equipment fit: multiple gyms, real increments, pounds.
4. Exits from today's plan: time, equipment, swap with filters.
5. Rewards for coming back: reminders, report, ring, records.
6. Store page: 10 images, proof, depth.
7. Platforms: Android, Watch, Health, Strava, widget.
8. Scale: cold-start weights from aggregate data on similar users. We cannot copy this at launch.
9. Help center: plain Q&A for each "why".
10. Plate calculator, warm-up sets, saved workouts.

### Gaps, launch vs nice to have

| Must for launch | Should for launch | Nice later |
|---|---|---|
| New user reaches a usable workout today (G7) | In-app demos or at least removing Google Images (G12) | Apple Health, then Watch |
| Account deletion, AI consent, withdraw, privacy links (G1, G2, G3, G5) | Reason visible on the card | Body map, plate tool |
| Listing rewrite (G9), final-UI screenshots | "Short on time" and "machine taken" | Saved workouts, sharing, more/less/never |
| Big Done merged, QAer flow on device | Workout-day reminder, plain help page | Android |
| Decide units: kg only means limiting or warning for US | Short post-workout record moment | Report |

### What NOT to copy

- **"AI Personal Trainer"** in name while Terms deny it. G9 forbids it.
- **Workouts that regenerate and erase edits**, especially from a background import.
- **Fully new prescriptions each session.** Our plan is the differentiator.
- **"Log All Sets"**: logs what you did not confirm, even with its confirmation, which can be switched off.
- **Edits that survive a discarded workout**, and a tab bar that collapses so a start button takes its place.
- **Replacement lists with unrelated moves.** Ours should stay within what the PT approved.
- **Compulsory effort ratings.** Fitbod says it works without them, and ours went unanswered.
- **Automatic AMRAP tests.** Fitness and safety call for the PT. Not by default.
- **Recovery percentages presented as fact.** They admit it is an estimate and give no formula. Any "recovered" wording is a PT and safety decision.
- **A unitless score locked behind conditions**, and the name "Strength Score".
- **Percentile rank**: needs age, gender and bodyweight, only flatters the top 40%, and needs a population we do not have.
- **Streak that resets to 0 with no grace.** It punishes planned rest; we have deloads.
- **Clubs that post workouts automatically.** Conflicts with our privacy stance.
- **Trial rollover without clear reminders.** Billing is their top complaint. Exactly when their paywall appears after sign-up was not walked.
- **Data claims with no method** ("internal analysis", millions of workouts). Our marketing checklist forbids them.
- **Pregnancy category, HSA/FSA, injury language.** Medical boundary; US-specific.
- **Ad-linked data, hidden deletion, silent AI in the policy.**

**Protected content and trademarks.** Do not use: the Fitbod name in our keywords or metadata, "mStrength", their logo, the hexagon system, any caption or tagline, video, screenshots, body-map artwork, or help text. Any public comparison needs verified facts at date of publication and the PO's approval, per `docs/marketing/2026-10-18-marketing-plan.md` §12. This document describes their screens; it does not reproduce them.

## 10. Ranked recommendations

Tags: **[PT]** fitness rule or claim. **[AI]** touches `docs/ux/README.md` guardrails. **[TL]** architecture or cost. **[GOV]** Governancer. **[PO]** decision or money.

| # | Recommendation | Impact | Effort | Tags | When |
|---|---|---|---|---|---|
| 1 | **Questions first, workout today:** 5 short questions in a coach's voice, then account, then today's workout (not next Monday). A preview without account becomes a later differentiator, since Fitbod does not offer one | Very high | M for the base, L for the preview | PT, TL, GOV | Base at launch, preview later |
| 2 | **Close trust blockers with a better path than theirs**: Profile → Privacy & AI: delete, AI switch, links; AI asked for once with a real "no" | Very high, required | M (tracked) | AI, TL, GOV | Launch |
| 3 | **Rewrite listing**: name and subtitle without "personal trainer", 8 images, lead with the reason, ES localised | High | S | PT, GOV, PO | Launch |
| 4 | **Exercise visuals in-app; remove Google Images** | High, most praised Fitbod feature | M + cost | PT, PO, TL, GOV | Removal for launch, images right after |
| 5 | **Show the reason on the Big Done card**: one line above Done, tap for more. **Moved up:** on device Fitbod shows no reason, so this is our clearest visible difference | Very high, differentiator | S | PT, AI | Launch |
| 6 | **Two exits from today**: "Short on time" and "Machine taken" | High | M | PT, TL | v1.1 |
| 7 | **Workout-day reminder + weekly recap** in app, opt-in. Say "4 of 6 weeks", no harsh resets. Ask during the first run, naming the benefit, with a real "later" | High, retention | M | TL, PO, GOV | v1.1 |
| 8 | **Units and increments**: lb option; dumbbell steps set per gym. Fitbod even switches kg or lb per exercise [H]; a user-level choice is enough for us | High for US, medium otherwise | L | PT, TL | Before any US push |
| 9 | **Progress clean-up**: remove or reword "+x kg/semana"; shorten rows | Medium | S | PT, TL | Quick win |
| 10 | **Plain help page** in EN/ES: how is my weight chosen, why is today lighter, what is sent to AI. Feed Ask AI from it | Medium | S | PT, AI, GOV | Launch |
| 11 | **Specific win moment**: "Strongest set on bench: 82.5 × 10" on Completed, optional clean share card. Fitbod's summary was generic confetti on a first workout [H], so this stands out | Medium | S–M | PT | v1.1 |
| 12 | **First-week hints**, one short dismissible card per feature, the first time it is reached, instead of a welcome card. **Moved up within launch work:** on device this carries most of Fitbod's teaching | Medium to high | S | | Launch |
| 13 | **Body visual of this week's sets**: no recovery %, approved weekly-set data only, own art | Medium, appeal | M | PT, PO | Later |
| 14 | **More / less / never** for exercises in a plan | Medium | M | PT, TL | Later |
| 15 | **Plate calculator** | Medium, gym usefulness | S–M | TL | Later |
| 16 | **Apple Health**, write-only first; then Watch | Medium to high | L | GOV, TL | After TestFlight |
| 17 | **Finish the hands-on checks** the AI cannot do (§12). The first session is done | Medium | S | PO | During the trial |

**Quick wins:** 3, 5, 9, 10, 12, 17. **Bigger bets:** 1 (preview), 4, 6, 7, 8.

**What moved after the session:** 1 changes shape, because Fitbod also requires an account. 5 and 12 move up. 7 and 8 gain a concrete pattern. The clear rest alert drops as an advantage, and layout A for supersets is confirmed. 11 gains support. A plan that stays put gains support too, since the next workout changed without explanation.

**Expected impact and measurement:**

| # | Measure |
|---|---|
| 1 | % of installs seeing a workout same day; % finishing the questions; % reaching first logged set (plan target: activation ≥50%); QAer new-user flow at 375 px on a weekday |
| 3 | Store conversion after launch; PT/PO approval of every claim |
| 4 | Tips opened per session; PT correctness check of each image |
| 5 | 5-second test: "why this weight?", at least 4 of 5 correct |
| 6 | Swaps per workout; sessions finished vs started |
| 7 | Week-4 retention (target ≥30%); notification opt-in rate |
| 9 | PO reads a row and explains it |

### Risks

- **#1 is not only UI.** Rule-based plan on device, then moving it into an account. Start date is a PT question: which day first, and is a mid-week start safe? No model call before consent. No account means no sync, and our guest data flow must hold.
- **#4 cost and correctness:** a wrong image is a safety and trust problem. Licences must be read by the TL before purchase.
- **#6 "short on time" is a fitness rule.** Which sets go first is the PT's decision. It must keep engine invariants and the AI Trainer release checklist.
- **#7 notifications** need a permission prompt, honest copy and quiet defaults.
- **Copying risk:** a dark rose gym app with a big log button will look similar to Fitbod. Our reason line and plan bar must be first on screen.
- **Evidence risk:** Fitbod's logging is now counted on device, but only on a new account with no history. Big Done figures still come from the proposal until PR #382 is tested.

### Suggested concept for #1, wireframe

```
Step 1-5 (one per screen)         Result, no account yet
┌──────────────────────────┐      ┌──────────────────────────────┐
│ ¿Cuántos días entrenas?  │      │ Tu plan de 6 semanas         │
│ [ 3 ] [ 4 ] [ 5 ] [ 6 ]  │  →   │ 4 días · Gimnasio completo   │
│                          │      │ Hoy: Tren superior A          │
│ Objetivo · Experiencia   │      │ · Press banca · 3 × 6-8      │
│ Equipo · Duración        │      │ · Remo en T  · 3 × 8         │
│                          │      │ [ Empezar hoy ]              │
│ Nota: no es consejo      │      │ Guardar: crea tu cuenta      │
│ médico                   │      │ Por qué estos pesos…          │
└──────────────────────────┘      └──────────────────────────────┘
```

No personal data leaves the phone at this stage, and no AI is called. Questions match the fields already in Profile, so we ask once. Weights for first sessions need an approved start-up approach from the PT (we may have no history, and we have no population data).

## 11. Decisions for Sebas

1. **Ask the questions before the account, and show today's workout right after it?** (Recommended yes for launch. A preview with no account at all can wait: Fitbod does not offer one either, so it would be a later differentiator.)
2. **Can a new plan start today instead of next Monday?** (Recommended yes, PT decides the first day.)
3. **Store name without "personal trainer", and lead with "the reason"?** You already said AI trainer. Confirm the listing change.
4. **Which countries first?** Without pounds, the US launch is weak. Option: Spanish-speaking markets plus kg countries first, US later.
5. **Revive exercise images for launch, with a budget?** Earlier estimate US$300 to 1,000, needs a quote. (Recommended yes, or at minimum remove Google Images.)
6. **Free at launch, no paywall?** Fits Governancer's recommendation and avoids their main complaint. (Recommended yes.)
7. **Can you do the last checks in §12 during your trial?** About 10 minutes. Then cancel the trial at least 24 hours before it ends.

## 12. Hands-on checklist: status after the session

| # | Check | Status |
|---|---|---|
| 1 | Onboarding order and count | **Done [H]** on one path, up to sign-up |
| 1b | When the paywall appears and whether it can be skipped | **Done [H]** after log-in on an existing account: skippable. A brand-new sign-up is open |
| 2 | Taps to log; does a weight change carry | **Done [H]** |
| 3 | Does it move on; Undo; button words | **Done [H]** |
| 4 | Superset, set by set | **Done [H]** for the first round. Final round not logged |
| 5 | Per-exercise "why this weight" | **Done [H]** after one saved workout: none. Open with more history and Workout Insights |
| 6 | Rest timer locked, alert and sound | **Part:** Live Activity seen counting and then showing the next set. Alert on a locked phone is open |
| 7 | Spanish quality | **Open:** the phone is in English and I did not change a device setting |
| 8 | Tabs, motion, density | **Done [H]**, at Mirroring's frame rate. Haptics cannot be felt, open |
| 9 | Delete account path | **Done [H]**, cancelled at the alert |
| 10 | Finishing a workout: summary, second paywall, how the next workout adapts | **Done [H]** with one test workout. Record card, unlocked strength score and adaptation over several sessions are open |
| 11 | The other questionnaire path ("I know my strength") and the last superset rounds | **Open** |
| 12 | Injury chat and strength check in use | **Not run on purpose:** the chat would need health details, and the check logs results |

**For the PO, about 10 minutes:** check that My Plan is right; during one real rest, lock the phone and note whether it vibrates or alerts; after 3 real workouts, tell me what the score and any insights say. Optional: in iPhone Settings, set Fitbod's language to Spanish, and tell me so I can review it.

Also unverified: Google Play rating and Data Safety; direct Reddit threads; Watch behaviour in real use; keyword field; actual revenue or install figures (third-party numbers conflict and are not repeated).

## 13. Local GymStudio check

Build from `main` (b1b0095) via `npm run build`, `npx vite preview` through `with_server.py`, 390×844, ES, `?demo=1` and clean guest context, not signed in, no page errors caught. A shifted clock on a training Monday made the demo show the day as already logged, so workout-mode logging was judged from `2026-11-01-effortless-logging.md` and PR #382's description, not from a new run. GymStudio itself was not re-tested on an iPhone in this session. App Store pages, screenshots and Fitbod's app were viewed only; nothing of theirs is saved in the repo.

## 14. Web Interface Guidelines audit

- **Source:** vendored `.claude/skills/web-design-guidelines/command.md`, Vercel commit `4ecfb9fb8d1d3b7009674869b3aaee2f904042e1`, audited 2026-10-31. SHA-256 checked locally, matching: `d246b026f4f29b5823a9cc857f9edf3d2507002e055e32040cadeaf3b38e0234`. Treated as reference only.
- **Scope:** surfaces in this comparison, on `main`. Not a full compliance claim. PR #382 may change logger lines.

```text
src/screens/ProgressScreen.tsx:1056 - week column value only in title=; no touch equivalent
src/screens/ProgressScreen.tsx:1066 - block name only in title=
src/screens/ProgressScreen.tsx:1106 - block name only in title=
src/screens/ProgressScreen.tsx:156-157 - "+x kg/week" unexplained abbreviation-style label (Content & Copy: specific labels)
src/components/WorkoutPlan.tsx:2167 - focus moved into weight input on mobile (autoFocus rule)
src/components/SupersetLogger.tsx:77 - focus moved into input on mobile
src/components/SupersetLogger.tsx:153 - focus moved into input on mobile
src/i18n/sections/app.ts:331 - guest empty state states a requirement, no benefit or next-step reason (error/empty copy)
src/styles.css:7498-7499 - .set-trend-bar:focus outline none; has stroke replacement, but uses :focus, not :focus-visible
src/i18n/LanguageProvider.tsx:25 - pass: html lang follows the toggle
src/screens/ProgressScreen.tsx:851 - pass: lift rows are real buttons with labels
```

## 15. Sources (all read 2026-10-31)

**Fitbod, official:** [home](https://fitbod.me/) · [FAQs](https://fitbod.me/faqs/) · [privacy policy](https://fitbod.me/privacy-policy/) · [terms](https://www.fitbod.me/terms-conditions) · [web quiz, first screen](https://join.fitbod.me/home) · [App Store US](https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543) and [reviews view](https://apps.apple.com/us/app/fitbod-gym-fitness-planner/id1041517543?see-all=reviews) · [App Store MX](https://apps.apple.com/mx/app/fitbod-gym-fitness-planner/id1041517543)

**Fitbod blog (self-published):** [algorithm](https://fitbod.me/blog/fitbod-algorithm) · [AI in fitness](https://fitbod.me/blog/the-future-of-ai-in-fitness-how-fitbod-is-redefining-personalized-training/) · [metrics and scores](https://fitbod.me/blog/how-fitbod-tracks-your-strength-progress-with-real-time-metrics-and-scores/) · [Estimated Strength](https://fitbod.me/blog/estimated-strength/) · [Insights](https://fitbod.me/blog/fitbod-insights-feature/) · [better workout tab](https://fitbod.me/blog/a-better-workout-tab/) · [5 features](https://fitbod.me/blog/5-fitbod-features-most-reviews-overlook-but-real-users-love/) · [vs Gravl](https://fitbod.me/blog/fitbod-vs-gravl-strength-training-app-review/)

**Fitbod help center (read in browser pane):** [Getting started](https://help.fitbod.me/hc/en-us/articles/30721771750039-Getting-Started-with-Fitbod-A-New-User-s-Guide) · [How it creates a workout](https://help.fitbod.me/hc/en-us/articles/360004429814) · [Sets, reps, weight](https://help.fitbod.me/hc/en-us/articles/43489869175063-How-does-Fitbod-decide-my-sets-reps-and-weight) · [Choosing exercises](https://help.fitbod.me/hc/en-us/articles/43489509474455) · [Recovery](https://help.fitbod.me/hc/en-us/articles/43492170863895) · [Adapting](https://help.fitbod.me/hc/en-us/articles/43492523917207) · [Duration](https://help.fitbod.me/hc/en-us/articles/43488199311767) · [Algorithm Q&A](https://help.fitbod.me/hc/en-us/articles/16254175592215-Fitbod-s-Algorithm-Q-A) · [My Plan](https://help.fitbod.me/hc/en-us/articles/34336407191191-My-Plan) · [Customizing today](https://help.fitbod.me/hc/en-us/articles/38318585683991) · [Why a workout changed](https://help.fitbod.me/hc/en-us/articles/42333470514455-Why-did-my-workout-change-Understanding-workout-refreshes) · [Editing workouts](https://help.fitbod.me/hc/en-us/articles/360006335593-Editing-Workouts-in-Fitbod) · [Exercise details](https://help.fitbod.me/hc/en-us/articles/30721437384215-How-to-Navigate-the-Exercise-Details-Screen) · [Fields explained](https://help.fitbod.me/hc/en-us/articles/29486697282711-Exercise-Details-Screen-Sets-Reps-and-Weight-Fields-Explained) · [Rest timer](https://help.fitbod.me/hc/en-us/articles/360006340194-Rest-Timer) · [Supersets](https://help.fitbod.me/hc/en-us/articles/360006427813-Circuits-Supersets) · [RiR](https://help.fitbod.me/hc/en-us/articles/360033133174-Reps-in-Reserve-RiR-Formerly-Exertion-Rating-RPE) · [Max Effort Day](https://help.fitbod.me/hc/en-us/articles/360033675553) · [Focus Exercises](https://help.fitbod.me/hc/en-us/articles/35301260960663) · [Variability](https://help.fitbod.me/hc/en-us/articles/29976242163223-Exercise-Variability) · [More/less/exclude](https://help.fitbod.me/hc/en-us/articles/9093233634711) · [Custom exercises](https://help.fitbod.me/hc/en-us/articles/28062570249623-Custom-Exercises) · [Sharing](https://help.fitbod.me/hc/en-us/articles/360006427453-Sharing-a-Workout-Gym-Location-Settings) · [Plate calculator](https://help.fitbod.me/hc/en-us/articles/360007700013-Plate-Calculator) · [Metrics and records](https://help.fitbod.me/hc/en-us/articles/12732749777047) · [Weekly set targets](https://help.fitbod.me/hc/en-us/articles/24739986755223-Weekly-Set-Targets) · [Streaks](https://help.fitbod.me/hc/en-us/articles/360013245993) · [Workout report](https://help.fitbod.me/hc/en-us/articles/16436302450711) · [Percentile, Progress section](https://help.fitbod.me/hc/en-us/sections/1500000536822-Progress-Performance-Tracking) · [Clubs](https://help.fitbod.me/hc/en-us/articles/38657483026967-Clubs) · [Apple Watch](https://help.fitbod.me/hc/en-us/articles/360006499194-Apple-Watch) · [Apple Health](https://help.fitbod.me/hc/en-us/articles/360047357794-Apple-Health) · [Trial](https://help.fitbod.me/hc/en-us/articles/30542136101527-How-the-Trial-Works) · [Delete account, Account section](https://help.fitbod.me/hc/en-us/sections/1500000606861-Account-Management) · [Languages](https://help.fitbod.me/hc/en-us/articles/26850917322519-Is-Fitbod-available-in-other-languages) (search excerpt)

**Independent:** [Garage Gym Reviews](https://www.garagegymreviews.com/fitbod-review) (updated 25 Sep 2026) · [TechRadar](https://www.techradar.com/health-fitness/fitbod-app-review) (Aug 2023, price outdated) · [screensdesign breakdown](https://screensdesign.com/showcase/fitbod-gym-fitness-planner) · [Reteno flows](https://gallery.reteno.com/flows/app-screens-fitbod) (limited)

**Low confidence, competitors or AI summaries:** [SensAI](https://www.sensai.fit/blog/fitbod-review-2026) (competitor) · [Dr. Muscle](https://dr-muscle.com/fitbod-workout-app-review/) (competitor) · [onclarity](https://www.onclarity.com/leaderboard/insight/fitbod) (AI summary, no method) · [justuseapp](https://justuseapp.com/en/app/1041517543/fitbod-gym-fitness-planner/reviews) (aggregator, 26 undated reviews) · [fitnessaitrends](https://fitnessaitrends.com/blog/is-fitbod-still-worth-it-2026/) (anonymous, summarises r/fitbod) · [apppricinglab](https://www.apppricinglab.com/iap/apple/1041517543) (snapshot Mar 2026)

**Internal:** `docs/ux/proposals/2026-11-01-effortless-logging.md`, `2026-10-18-plain-strength-wording.md`, `2026-10-06-exercise-illustrations.md`, `docs/ux/README.md`, `docs/governance/app-store/` (README, ai-disclosure, gaps-for-tech-lead), `docs/marketing/2026-10-18-marketing-plan.md`, issue #384, PR #382.
