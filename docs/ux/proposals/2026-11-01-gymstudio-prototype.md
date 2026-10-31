# GymStudio prototype: Fitbod's good ideas on the current app

- **Status:** proposal (UXer). PO approved two parts on 2026-11-01: see `docs/ux/approved/2026-11-01-reason-and-questions-first.md`. The rest is not approved. No app code, content or data changed.
- **Date:** 2026-11-01
- **Prototype (private link, the PO can share it):** https://claude.ai/artifact/XZeKFk4YzJGt5PKz4Xv5bh
- **Evidence:** `2026-11-01-fitbod-review.md`, verified on device in PR #393.
- **PO request:** build a prototype from the good things in Fitbod, using what GymStudio has now.

## How it is built

The prototype runs the deployed GymStudio bundle (`index-a3588a01.js`, which includes Big Done from PR #382) in demo mode. A small overlay, [`2026-11-01-gymstudio-prototype-overlay.js`](2026-11-01-gymstudio-prototype-overlay.js), adds only what this proposal changes, with a dotted outline that can be switched off. Today, Exercises, Progress, You, Big Done, technique, rest and supersets are the real screens. The overlay is a prototype, not code to merge.

- **Clock:** fixed at Monday 2 Nov 2026 so it always opens on a workout to start. Today's demo entries are cleared once for the same reason.
- **Content:** catalogue, reasons and weights come from the app and approved files. The two reason sentences reuse approved strings from `src/i18n/sections/workout.ts`.

## Problem and opportunity

The on-device review showed three things:

- Fitbod earns its sign-up with quick questions, and shows a workout right after. We show a nearly empty sign-in screen, and a plan that starts next Monday.
- Fitbod gives no per-exercise reason on a new account, even after a saved workout. Ours exists, but it sits behind a tap.
- Fitbod teaches with one tip per feature, and has exits from the day and a plate calculator. We have a welcome card and neither of the other two.

## What the prototype changes

| Screen | Change | Idea from Fitbod | What we do differently | Rec. |
|---|---|---|---|---|
| First run | 5 chat-style questions, reminder, account, AI question, plan summary, today's workout | Questions first, in a coach's voice | 5 instead of 11, medical notice in view, AI asked once with a real no, no paywall, starts today | 1, 2, 7 |
| Today | Reason line and two exits under Start | Exits from the day | The reason is always visible; changes are for today only and the plan never regenerates | 5, 6 |
| Today | One dismissible tip; no welcome card | One tip per feature | Same idea, in our words | 12 |
| Log | Reason above the set (Big Done already states what the button saves) | One big log button | Theirs repeats no values and gives no reason | 5 |
| Log | Plate calculator on barbell lifts; no Google button | Plate calculator | Our own drawing, and no outside site | 4, 15 |
| Finish | Achievement card with real numbers, above the current summary | Quick finish | A real achievement instead of generic confetti | 11 |
| Progress | One tip; hides "+x kg/week" | One tip per feature | Real sets, no locked score | 9, 12 |
| You | Delete account, saying what is deleted | In-app deletion | Two taps and a clear list; simulated here | 2 |

**Deliberately left out:** Fitbod's hexagons, bold italics, body map and videos; workouts that regenerate; Log All; compulsory effort questions; streaks; the injury chat.

## Impact, effort and order

| Change | Impact | Effort | Depends on | When |
|---|---|---|---|---|
| Reason line on Today and Log | Very high | S | PT, engine reason codes | Launch |
| Delete account and AI question | Very high, required | M | Governance, Tech Lead, #384 | Launch |
| Questions first, workout today | Very high | M | PT for the first day, Tech Lead for moving answers into the account | Launch |
| Tips instead of welcome card | Medium to high | S | None | Launch |
| Remove Google button | Medium, also helps G12 | S | Images decision | Launch |
| Achievement on finish | Medium | S | PT | v1.1 |
| Hide "+x kg/week" | Medium | S | PT, Tech Lead | Quick win |
| Short on time, machine taken | High | M | PT rules, plan overrides | v1.1 |
| Plate calculator | Medium | S–M | Tech Lead, available plates | Later |

## Simulated in the prototype

- Account creation, AI choice and reminders do nothing.
- Short on time marks the last exercises and machine taken adds a label. The workout itself does not change.
- Delete account deletes nothing.
- The short-on-time rule is an example, and the alternatives use a simple match on area, movement and main muscle. **The PT decides both.**
- The Today reason uses a fixed 85 kg × 6, the value the demo's logger shows for Barbell Bench Press. Other days show no reason on Today.

## Found in the current app while building

For the Tech Lead and QAer:

- **Technique wraps:** in English, the "Technique" tool label broke as "Techniqu / e" at 390 px on the build before Big Done. Not rechecked on the current one.
- **Mixed message on finish:** moving from 82.5 to 85 kg shows as "Mixed" and "Below last time (−7%)", from a comparison across A and B days. Worth a PT look.
- **Reason source:** the overlay picks the sentence from the numbers on screen. The real line should use the engine's reason code.

## Risks

- **Fitbod look-alike:** dark, rose and a big button. Keep our muted rose, plain type and plan bar.
- **Answers before account:** they must survive sign-up, and no model call happens before consent.
- **Mid-week start:** a safety and programming question for the PT.
- **Prototype drift:** it runs a copy of today's bundle, so it will not follow later releases.

## How to measure

| Change | Measure |
|---|---|
| Questions first | % finishing the questions; % seeing a workout the same day; % logging a first set |
| Reason line | 5-second test: "why this weight?", at least 4 of 5 correct |
| Exits | Uses per workout; sessions finished against started |
| Tips | Dismissed against ignored; fewer "how do I" questions |

## Checks

Tested locally at 390 × 844 in EN and ES on the earlier bundle: full first run, Today exits, logging, plates, finish, Progress and You. Re-run on the current bundle in ES with a headless browser: first run, reason, plates, rest and finish, with no horizontal overflow and no console errors. Not tested on an iPhone. The PO confirmed that the published link opened before this refresh. The Web Interface Guidelines audit was not re-run, because no app code changes here.
