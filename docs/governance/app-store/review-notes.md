# Notes for Apple's reviewer (DRAFT)

Governancer, 2026-10-31; updated 2026-11-01. Paste the text between the rules into App Store Connect → App Review Information → Notes, after every condition below is true. Guideline 2.3.1(a):
"generic descriptions will be rejected"; 2.1(a): "include demo account info (and turn on your back-end service!) if your app includes a login."

## Conditions before pasting

- G1 to G10 and G26 in `gaps-for-tech-lead.md` are done. If the PO launches without email sign-up (question 4), rewrite the sign-in and deletion paragraphs.
- QAer has run the exact path below on a real device, on any weekday (G7).
- AI monthly budget is enough for review (G18).

## Demo account procedure (no credentials in this repo, ever)

**Owner: PO, with Tech Lead.**
1. Choose a dedicated email address the PO controls, not personal. Create the account through the normal sign-up, confirm by email, with a strong unique password. Store it in the PO's password manager.
2. In the app, on the account: fill goals, generate and publish a plan, allow AI, and log at least 3 sessions on different dates with invented data, so Progress and recommendations show real content.
3. Check that the plan is Current, not Upcoming, on the review date; start before a Monday if needed (G7). ⚠️ VERIFY. Any seeding must be done by the Tech Lead for that user only.
4. Type the email and password **only** in App Store Connect → App Review Information → Sign-in required. Keep it active through the review; don't change the password. Rotate after approval.
5. Do not reuse the owner's account: it holds his private program and real data.

## Text to paste

---

GymStudio is a training log and planner for gym-goers aged 18 and over: look up exercises, follow a 6-week plan, log sets (weight and reps), and see progress. English and Spanish (toggle in the header). iPhone only. Free, no purchases. "AI trainer" is the name of a software feature; no human trainer is involved.

SIGN-IN
Demo account: provided in the Sign-In Information fields above. It has a plan and sample workouts. You can also tap "Try the demo without an account" on the sign-in screen; demo mode uses sample data and sends nothing. Sign in with Apple and Sign in with Google are available too.

CORE FEATURES
1. Today tab: the current plan, weekly progress and exercises.
2. Tap Start workout, open an exercise, and log weight and reps. The app shows "Today: X kg x Y" for each exercise, calculated by rules from recent sets. Tap the cue to see why.
3. Progress tab: trends, weekly sets per muscle, consistency.
4. You tab (Profile): goals, measurements, My plan (Generate my plan), Privacy & AI, Privacy Policy, Terms, Support, Delete account.
5. Sparkle button: Ask AI and Feedback.
[QAer: replace with exact labels after #381.]

ACCOUNT DELETION (5.1.1(v))
Profile > Delete account. Please test with a new account, not the demo account. To create one, use email sign-up; a confirmation email is required.

AI FEATURES AND DATA SHARING (5.1.2(i))
AI is optional and off until the user accepts a permission sheet that names OpenAI and lists what is sent. AI features: explaining a load, personalising a plan within rule limits, and answering training questions. Withdraw at Profile > Privacy & AI. The OpenAI key is server-side only. With AI off, the app uses rule-based text and plans. Loads are always calculated by app rules, never by the model.

HEALTH (1.4.1)
GymStudio is not a medical app. It does not diagnose or treat, and uses no HealthKit or sensors. Steps, calories and body weight are typed in by the user. AI answers tell users to stop and see a professional about pain or injury. A health notice appears on first run.

LIVE ACTIVITY
Starting a rest in Workout mode shows a countdown on the Lock Screen and Dynamic Island (iOS 16.2+, Live Activities on). To test: log a set, start rest, lock the phone. It runs locally with no push, and only shows the timer and exercise name. It ends when the rest ends or is skipped.

PERMISSIONS
The app does not request notifications, location, camera, contacts, photos, HealthKit or tracking permission. [If rest alerts ship before submission, replace this: explain when notifications are requested, in the words of the prompt.]

NETWORK AND OFFLINE
Logging works offline. Sign-in, sync, plans and AI need a connection. Backend: Supabase. No special network or hardware is needed.

Contact for review: Sebastian Pabon, js.pabonc979@gmail.com. [PO: phone in the App Store Connect contact fields only, never here]

---

## Notes to self (do not paste)

- **Notification permission:** the app has none today. `src/` has only `navigator.vibrate`, and issue #384 mentions "rest alerts". If alerts are added, the Live Activity stays separate: it needs no permission prompt; notifications would. Explain purpose before the prompt; never require it. Update this file, the inventory, and the label if a push service is added.
- **4.2 risk (minimum functionality):** the app is a web app in Capacitor and the same app is live on GitHub Pages. Mention native value truthfully: Live Activity, offline logging, native sign-in, if built.
- **Screenshots** must show the final UI (#381/#382 still WIP); `docs/marketing/2026-10-18-app-store-screenshots.html` are mockups.
- Keep the demo-mode link working under `capacitor://` (G7).
- iPhone only (PO): `TARGETED_DEVICE_FAMILY` must be changed first, or review may run on iPad (G15).
- Availability and OpenAI's country list: G26. The reviewer may be anywhere; the AI still works, since calls leave from the server.
