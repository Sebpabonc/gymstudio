# GymStudio data inventory (DRAFT)

- **Prepared by:** Governancer, 2026-10-31. Not legal advice. Working document in English.
- **Sources:** repo at `main` (72c02eb) and a read-only schema check of the production Supabase project on
  2026-10-31 (table and column metadata and row counts only; no user content was read).
- **Rule:** if the app changes what it collects, update this file first, then the policy and the App Privacy answers.
- `⚠️ VERIFY` = could not be confirmed from code or official sources. `Gn` = item in `gaps-for-tech-lead.md`.

## 1. Summary

| Question | Answer | Evidence |
|---|---|---|
| Analytics SDK? | **None** | No analytics dependency in `package.json`, `ios/App/Podfile`, `src/`, `index.html` |
| Advertising or tracking? | **None.** No ad SDK, no ATT prompt, no IDFA | Same; `ios/App/App/Info.plist` has no tracking usage key |
| Crash reporting? | **None today.** Planned in issue #384. Adding it changes this file, the label and the manifest | Same |
| HealthKit, Motion, location, camera, contacts, photos, microphone? | **None.** No usage-description keys | `ios/App/App/Info.plist` |
| Push or local notifications? | **None.** No notification plugin; the app never asks for notification permission | `package.json`, `ios/App/Podfile`, `src/` |
| AI provider | **OpenAI**, Chat Completions API, default model `gpt-4o-mini` (`OPENAI_MODEL` secret can override) | `supabase/functions/ai-gateway/index.ts` |
| Cookies on the web app | The code sets none. Session and data use `localStorage` | `src/lib/supabaseClient.ts`, `src/utils/storage.ts` |
| Other third-party network calls from the app | Supabase only. No remote fonts or images. Google Images opens only when the user taps a link | grep of `https://` in `src/`, `index.html` |

## 2. Modes of use

| Mode | What leaves the device |
|---|---|
| **Demo** (`?demo=1`) | Nothing personal. Generated sample data in `gym-studio.demo.*` keys (`src/utils/demoMode.ts`, `src/demo/`). AI off (`WorkoutPlan.tsx` `trainerWhy`, `AuthProvider.getClient`) |
| **Guest** (signed out) | Workout data stays in `localStorage`. Anonymous requests read the catalogue, so Supabase sees the IP address. AI, feedback, goals, measurements and personal plans need an account |
| **Account** | Everything in section 3 syncs to Supabase |

## 3. Data on the server (Supabase Postgres, RLS per user)

All listed tables have `ON DELETE CASCADE` to `auth.users` (confirmed in production), so deleting the auth user removes
them. See G1 for the one foreign key that needs a test. Retention today: **no automatic deletion anywhere**.

| Data | Table / column | Source | Purpose | Linked | Retention today | Sent to OpenAI? |
|---|---|---|---|---|---|---|
| Email, password hash (Supabase), confirmation and sign-in timestamps | `auth.users` | Sign-up | Account, sign-in, password email | Yes | Until account deleted | **No** |
| Name, email, avatar and picture URL, Google subject ID, email-verified flags (Google users) | `auth.users.raw_user_meta_data`, `auth.identities.identity_data` | Google | Sign-in; name shown in Profile | Yes | Until account deleted | **No** |
| Name, avatar URL | `profiles` | Trigger | Profile. **0 rows in production with 2 users** (G21) | Yes | Until account deleted | No |
| Internal user ID (UUID) | `auth.users.id`, all `user_id` columns | Generated | Link rows to the account | Yes | Until account deleted | **Yes, in `block_plan`** (G11) |
| IP address, user agent, session times | `auth.sessions` (columns confirmed) and platform logs | Automatic | Security, session management | Yes | ⚠️ VERIFY platform log period | No |
| Workout logs: exercise, date, sets (reps, weight, drop, RIR, timestamp), block and day, plan target | `workout_entries` | User | Core function, sync | Yes | Until account deleted. **Deleting a log only sets `deleted_at`**; the row stays (G16) | **Yes**, except notes (section 5) |
| Workout notes (free text) | `workout_entries.notes` | User | Core function | Yes | Same | **No**: no gateway query selects it |
| Own exercises: name, body region, equipment, notes | `user_exercises` | User | Core function | Yes | Until account deleted; soft delete | **Name and notes no** |
| Body measurements: weight, steps, calories per date | `body_metrics` | User, manual only | Progress, plan | Yes | Until account deleted. No in-app delete (G16) | **Yes: last 14 days in `block_plan`** |
| Training goal: goal (including `fat_loss`), days, experience, activity, session length, equipment, **free-text notes up to 500 characters** | `training_goals` | User | Build the plan | Yes | Until account deleted | **Yes, whole row in `block_plan`** |
| Personal plans (current and previous) | `user_plans` | App + AI | Plan | Yes | Inactive plans kept indefinitely | **Yes** |
| Permanent exercise swaps | `exercise_swaps` | User | Plan | Yes | Until removed | Reflected in the plan |
| Trainer recommendations: shown load, reason, evidence, accepted/kept/ignored, result | `trainer_recommendations` | App + user action | Rebuild and calibrate recommendations per user (`fetchCalibrationRecommendations`, last 120 days) | Yes | Until account deleted | Not this table; the same numbers go in `trainer_explain` |
| AI usage ledger: feature, model, tokens, cost, time. **No question or answer text** | `ai_usage` | Edge function | Daily limit, spend cap | Yes | Until account deleted | No |
| Feedback: type, message (1,000 characters), app version, screen, language | `feedback` | User | Support, product | Yes | Until account deleted | No |
| Unused tables, empty in production: `workout_programs`, `workout_sessions`, `workout_sets`, `user_exercises_legacy` | | | None | | | No |

**Not stored on the server:** AI questions and AI answers. The gateway does not save them. The answer is cached on the
device only for AI Trainer sentences. Error logging prints the OpenAI status and error body
(`console.error('openai_error', …)`); ⚠️ VERIFY that an OpenAI error body can never echo prompt content.

Non-personal shared data: `exercises` (catalogue), `training_blocks*` (the owner's private program, RLS owner-only).

## 4. Data on the device (`localStorage` in the iOS WebView or browser)

Signed-in keys are `gym-studio.user.<uuid>.*`; guest keys are `gym-studio.*`; demo keys are `gym-studio.demo.*`
(`src/utils/storage.ts`).

| Data | Key | Notes |
|---|---|---|
| Supabase session tokens | `sb-*` (`persistSession: true`) | Removed on sign-out by Supabase client |
| Workout history and sync metadata | `history`, `sync-metadata` | **Not removed on sign-out** (G25) |
| Own exercises, custom plan, active block, cached plan | `exercises`, `custom-plan`, `active-block-id`, `active-user-plan` | Same |
| Today-only swaps, cached AI sentences (last 100) | `exercise-swaps`, `trainer-explanations` | Same |
| AI consent choice | `ai-consent.ask-exercise` | Device only; the server does not see it (G2, G3) |
| Rest timer state, rest preference, UI preferences, language, welcome flag, app-open counter | various | Never sent; counter is local, not analytics |
| Catalogue and block caches | `catalogue`, `training-blocks` | Non-personal; block cache holds the owner's program (G7) |

iCloud: the project has no entitlements file, no CloudKit and no iCloud Drive. ⚠️ VERIFY whether `Library/WebKit`
localStorage is included in the user's iCloud device backup, and judge it against guideline 5.1.3(ii) (G13).

### Native features

| Feature | Data | Leaves device? |
|---|---|---|
| Live Activity (`RestTimerActivityPlugin.swift`, `RestTimerWidget`) | End time, paused seconds, exercise name, shown on Lock Screen and Dynamic Island | No. `pushType: nil`, no server, no App Group. A user-created exercise name is visible on the Lock Screen |
| In-app browser (`@capacitor/browser`) | Google sign-in page; Google Images search | To Google, on user tap (G12) |
| Deep link `gymstudio://auth-callback` | One-time auth code | Device to Supabase |
| Vibration on rest end | None | `navigator.vibrate` in `RestTimer.tsx`. ⚠️ VERIFY: likely has no effect in iOS WKWebView |

## 5. What goes to OpenAI, exactly

All calls: app → Supabase Edge Function `ai-gateway` → `https://api.openai.com/v1/chat/completions`. The API key is
server-only. OpenAI sees the Supabase server's IP address, not the user's. The request has no `user` field and sets no
`store` parameter. Email and name are never included.

| Feature | Called from today | Trigger | Data sent | Consent check today |
|---|---|---|---|---|
| `general_chat` | `HelpAndAi.tsx` | User asks | Question (300 characters), date, current plan, last 30 log rows (exercise ID, date, sets) | **Client-side, per device/account**; no server-side consent record |
| `trainer_explain` | `WorkoutPlan.tsx:866-873` | **Automatic** when a recommendation renders for a signed-in user | Exercise name, action, reason, confidence, recommended and original loads, last session date, weight, reps, target, days ago, estimated 1RM, sessions used | **Client-side, per device/account**; template shown unless enabled |
| `block_plan` | `src/plans/buildMyPlan.ts:38` | User taps "Generate my plan" | Goal, days per week, experience, activity level, session length and equipment; last 14 days of body metrics; compact day keys and exercise codes, IDs, sets and rest; alternatives from the catalogue. No `user_id` or free-text notes. | **Client-side, per device/account**; rules plan used unless enabled |
| `ask_exercise`, `explain_suggestion`, `session_summary`, `exercise_feedback`, `next_session_plan` | **No caller in `src/`** | Deployed and reachable with a valid session | Exercise data, last 5 to 60 log rows, the supplied plan or question | Client-side gateway gate; no server-side consent record (G18) |

**Provider terms, read 2026-10-31** (`https://developers.openai.com/api/docs/guides/your-data`): API data is not used for
training unless the customer opts in; abuse-monitoring logs are kept up to 30 days; Chat Completions keeps no application
state apart from prompt-caching data up to 24 hours. ⚠️ VERIFY in the OpenAI dashboard (PO login): data-sharing opt-in is
off and the Data Processing Addendum is accepted. Regional inference exists only for the US, Europe and UAE, so assume US.

Deployed gateway: production `ai-gateway` version 8, updated 2026-10-06 09:44 UTC, matching the date of the last repo
change (`e8373cc`, 2026-10-06). ⚠️ VERIFY contents are identical before relying on section 5.

## 6. Who processes the data

| Company | Role | Data | Location | Basis to verify |
|---|---|---|---|---|
| **Supabase** (Supabase Pte. Ltd.) | Database, auth, Edge Functions, logs | Everything in section 3 | Project URL `gxcxnttbzechusggtxfz.supabase.co`. ⚠️ VERIFY **region** in dashboard | DPA v1 of 2026-08-01 forms part of the terms, includes SCCs (`https://supabase.com/legal/dpa`). Subprocessors: `https://supabase.com/legal/customer-resources/subprocessor-list` |
| **OpenAI** | AI text | Section 5 | Assume US | ⚠️ VERIFY DPA accepted |
| **Google** | Optional sign-in; Google Images when tapped | Identity data | Global | Google OAuth client owned by the PO |
| **Apple** | App distribution; Sign in with Apple once built (G4) | Apple's own App Store data; name and email or relay address | Global | Apple terms |
| **GitHub Pages** | Hosts the web app and, planned, the policy pages | Visitor IP in server logs. ⚠️ VERIFY: the limits page does not describe logging | US | The iOS app loads its assets from its bundle, not from Pages |
| **Email provider** | Auth emails | Email address, message | ⚠️ **None configured in repo** (G6) | Add to the policy when chosen |

Staff access: the owner can read all rows through the Supabase dashboard (service role). So in-app text saying data is "only
visible to your account" is not accurate (G9).

## 7. Backups

Supabase: Pro 7 days, Team 14 days, Enterprise up to 30 days of daily backups; Free has no automatic backups
(`https://supabase.com/docs/guides/platform/backups`, read 2026-10-31). The docs do not address deletion from backups;
restoring a backup brings back rows that existed then. ⚠️ VERIFY plan. The policy says deleted data may remain in backups
until they expire.

## 8. Rights support today

| Right | In the app today | Gap |
|---|---|---|
| Delete account | **No** | G1 |
| Withdraw AI consent | **No.** Once chosen, the choice cannot be changed | G3 |
| Access, portability (export) | No. By email only | G16 |
| Correct | Yes for logs and goals; by email for name and email | |
| Delete single items | Logs yes (soft). Measurements, goals, feedback: no | G16 |
