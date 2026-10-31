# Gaps for the Tech Lead (DRAFT)

Governancer, 2026-10-31. App changes needed for the store documents to be true. Tracking issue: #384.
Severity: **S1** blocks submission or makes a document false; **S2** fix before public release; **S3** soon after.
Items marked **New** were not in issue #384.

| # | Sev | Gap | Owner |
|---|---|---|---|
| G1 | S1 | In-app account deletion | TL |
| G2 | S1 | **New.** AI calls bypass consent, and "Not now" is ignored | TL |
| G3 | S1 | **New.** No way to withdraw AI consent | TL, UXer |
| G4 | S1 | Login option under guideline 4.8 | PO decides, TL |
| G5 | S1 | Hosted policy and support URLs, in-app links, terms and age step | TL |
| G6 | S1 | **New.** No production email provider, so sign-ups cannot confirm | PO + TL |
| G7 | S1 | New-user path unproven; bundled fallback exposes the private program | TL, QAer |
| G8 | S1 | Bundle ID, team, App IDs | TL + PO |
| G9 | S1 | **New.** Untrue statements inside the app ("PT", "only visible to your account") | PO, PT, TL |
| G10 | S1 | **New.** Forgot password does not let anyone set a new password | TL |
| G11 | S2 | **New.** Data minimisation in `block_plan` | TL |
| G12 | S2 | **New.** Google Images in an in-app browser can raise the age rating | TL |
| G13 | S2 | Privacy manifest and report | TL |
| G14 | S2 | **New.** Export compliance key | TL |
| G15 | S2 | **New.** Build requirements and bundle details | TL |
| G16 | S2 | **New.** Delete items, purge soft deletes, export | TL |
| G17 | S2 | **New.** Retention jobs | PO decides, TL |
| G18 | S2 | **New.** AI budget, unused gateway features | TL |
| G19 | S2 | Verify provider settings | PO login, TL |
| G20 | S2 | **New.** Health notice and AI labels in the app | TL, PT, UXer |
| G21 | S3 | **New.** Tidy unused data | TL |
| G22 | S3 | **New.** Update documents before adding monitoring or analytics | TL |
| G23 | S2 | **New.** Public repo: what gets committed | TL |
| G24 | S3 | **New.** Live Activity English-only, Lock Screen name | TL |
| G25 | S2 | **New.** Local data stays after sign-out | TL, PO |

---

## G1. Account deletion (S1)

Apple: "If your app supports account creation, you must also offer account deletion within the app" (5.1.1(v)); see
`https://developer.apple.com/support/offering-account-deletion-in-your-app/`, read 2026-10-31. No email or support flow
is allowed for a non-regulated app.

Design constraints found:
1. **Server-side only.** New Edge Function (service role stays server-only). Derive the user from the JWT; never accept a
   user ID in the body. Call `auth.admin.deleteUser(id)`.
2. **Cascade coverage is good.** All public tables with a user reference cascade from `auth.users` (confirmed in production).
3. **Test the one RESTRICT.** `workout_entries_user_exercise_fkey` is `ON DELETE RESTRICT` to `user_exercises`, and both
   tables also cascade from `auth.users`. RESTRICT is checked immediately, so success depends on trigger firing order. In
   production the `workout_entries` cascade trigger (`RI_ConstraintTrigger_a_17992`) sorts before `user_exercises`
   (`…_18287`), so it should succeed, **by accident of OID order**. A dump and restore could reorder them. Either delete
   entries first explicitly in the function, or change the constraint in a migration. Test with a throwaway account that
   has a custom exercise with logs. I did not run a delete.
4. **Stop sync first.** A deleted user's access token stays valid until expiry, and dirty entries would upsert, fail with a
   foreign-key error and be quarantined. Dispose the scheduler, delete, then sign out locally.
5. **Wipe device data for that user:** all `gym-studio.user.<uuid>.*` keys, `sb-*`, and the shared `guest-claimed` key,
   which stores the user ID. Decide on shared `training-blocks` cache. Other devices keep local data until they sign in
   again and fail; the policy and support page say so.
6. **Providers without a password.** Google and Apple users have none, so confirm with a typed word or a fresh sign-in.
7. **Sign in with Apple (if G4 = yes):** "should use the Sign in with Apple REST API to revoke user tokens". The Supabase
   Apple guide read today does not cover revocation, so this is your design: probably obtain a fresh authorization code at
   deletion and call Apple's revoke endpoint from the function, using the `.p8` key as a server secret. ⚠️ VERIFY.
8. **Confirm completion.** Apple: tell the person how long it takes and confirm when complete. Immediate is simplest.
9. **Owner safety.** `training_blocks.owner_id` is `ON DELETE CASCADE`: if the PO deletes his own account, blocks 1 to 9
   vanish and his `workout_entries` go with him. Consider a guard or backup.
10. **Spend ledger.** Deleting `ai_usage` rows lowers the month's global spend sum, so the cap undercounts. Small. Choose
    between accepting it and anonymising cost rows; if anonymising, the policy must say so.
11. **Backups** per `data-inventory.md` section 7; the policy text depends on the Supabase plan.
12. **If Pro exists later:** warn that billing continues through Apple and point to subscription management.

Acceptance: EN and ES flow in Profile, reachable in two taps; all rows gone (query by user ID); throwaway test for email,
Google and Apple accounts; QAer verifies on a device.

## G2. AI consent is bypassed (S1)

Apple: "You must clearly disclose where personal data will be shared with third parties, including with third-party AI, and
obtain explicit permission before doing so." (5.1.2(i)).

Today:
- `WorkoutPlan.tsx:866-873` `trainerWhy` calls `explainTrainerRecommendation` for every signed-in user with no consent check.
- `src/plans/buildMyPlan.ts:38` sends goals and measurements on "Generate my plan" with no consent check or notice.
- The chat consent copy promises "Nothing else" (`help.ai.consent`), which is untrue in practice, given the two calls above.
- A user who taps "Not now" still has data sent. **This is the most serious finding in this review.**

Required:
1. One consent gate in `invokeAiGateway` on the client, plus a server check in the gateway, so no path can skip it.
2. Store consent server-side with version and timestamp (GDPR Art. 7(1) requires being able to show it). The `localStorage`
   key does not prove anything and does not follow the user across devices. Schema change: TL, load the Postgres skill.
3. Without consent: AI Trainer shows the template sentence (already implemented as fallback); plan uses `source: 'rules'`
   (already implemented as fallback); chat shows the off state.
4. Existing users re-consent; the old `enabled` value does not count because the old copy was narrower.
5. Copy and placement in `ai-disclosure.md`.

## G3. Withdraw consent (S1)

Apple 5.1.1(ii): "an easily accessible and understandable way to withdraw consent". Today, `AiConsentPrompt` shows only when
the choice is null and nothing clears it, so a decline is permanent and an accept is permanent. Add Profile → Privacy & AI.

## G4. Login option (S1)

See `app-store-connect-answers.md` section 6. PO picks: add Sign in with Apple (issue #384's plan) or hide Google on iOS.

## G5. URLs, links, terms and age step (S1)

**Does GitHub Pages work? Yes for now.** `gh-pages.yml` publishes `dist/`. Vite has no `public/` folder yet; adding
`public/legal/` copies files to `dist/legal/` and also into the iOS bundle (harmless). Proposed:
`https://sebpabonc.github.io/gymstudio/legal/privacy.en.html`, `privacy.es.html`, `terms.en.html`, `terms.es.html`,
`support.en.html`, `support.es.html`. Static HTML, no scripts, no bundle needed. Generate from the approved Markdown.

Limit: GitHub says Pages may not be used to run "your online business" if "primarily directed at either facilitating
commercial transactions or providing commercial software as a service"
(`https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits`, read 2026-10-31). Policy pages
for a free app look fine; a paid Pro or landing page should move to a custom domain. The URL also shows the PO's GitHub
user name.

In the app (EN and ES):
- Profile: Privacy policy, Terms, Support, Delete account. Also on the login screen. Opened with `openExternal`.
  The bottom tab is labelled "You" while the documents say "Profile → …": once built, align the policy, terms, support page and
  review notes with the exact labels, in both languages.
- Sign-up: terms acceptance and minimum-age confirmation before account creation, including Google and Apple paths.
  Record version and timestamp.

## G6. Email provider (S1)

`supabase/config.toml` has no SMTP. Supabase's default service: "Supabase Auth will refuse to deliver messages to addresses
that are not part of the project's team", at 2 messages per hour, and is meant for development
(`https://supabase.com/docs/guides/auth/auth-smtp`, read 2026-10-31). Email confirmation is on, so **a new email user cannot
activate an account** unless custom SMTP is set in the dashboard. ⚠️ VERIFY dashboard. Needs a provider, a sending domain
(PO), and an entry in the policy. A domain also solves the support address.

## G7. New-user path and the private program (S1)

Read from code:
- New signed-in user: `fetchTrainingBlocks` gets `[]`, so "Create your plan" → Profile goals → `buildMyPlan` → Publish.
- **Production has 0 rows in `user_plans`**, so no real account has published a personal plan. QAer must verify end to end on
  a device before the review account is made.
- `nextMonday(today)`: a new plan starts next Monday, so the block shows as Upcoming. Check what a reviewer sees on any
  weekday, including logging today. ⚠️ VERIFY.
- Guest (no plan) sees only Sign in or Demo, and `href="?demo=1"` needs testing under `capacitor://`. ⚠️ VERIFY.
- **Bundled fallback:** when the fetch throws or Supabase is unavailable and no cache exists, `storage.ts:741` imports
  `docs/fitness/approved/training-blocks/blocks.json`. So a new user offline on first launch can see the PO's private 9-block
  program, contradicting migration 028. The file also ships in every public bundle. Blocks 1 to 5 have `origin: 'coach'`
  and may come from a third party's plan (`docs/reference/workout-plan.xlsx`), a content-rights question for the PO.
  Recommendation: remove from the public bundle.
- `?demo=1` uses a PT template, fine.

## G8. Bundle ID and team (S1)

Xcode: `com.sebgymstudio.app` and `.RestTimerWidget`, team `9KR7BRV6Z3` (personal). `capacitor.config.json`:
`com.gymstudio.app`. The ID cannot change after the first upload. Recommendation: try to register `com.gymstudio.app`
under the paid team, since it matches the brand; IDs are global, so it may be taken, otherwise use `com.sebgymstudio.app`.
Then align `capacitor.config`, the widget prefix (must start with the parent ID), and enable the capabilities.
A deep link scheme `gymstudio` is already in Supabase's allow-list and doesn't depend on the ID.

## G9. Untrue statements in the app (S1)

- `login.benefit3` "Your synced data is private to your account", `login.privacyBody` "Synced history is only visible to your
  account": the owner has dashboard access, and data goes to Supabase and OpenAI. Proposed in `ai-disclosure.md`.
- `workout.block.origin.pt` "Designed by the PT", `profile.goal.copy` "Your PT plan", the prompts ("the plan itself is designed
  by the PT"), and the listing's "rules written by a personal trainer": the PT is `.claude/agents/pt-fitness-expert.md`, an AI
  agent, with the PO approving (`docs/fitness/README.md`). Unless a qualified human reviews this content, it misrepresents
  the source. Needs PO answer (question 9) and PT rewording. Also guideline 2.3.
- `ai.error.dailyLimit` "You've used today's 40 questions": automatic `trainer_explain` calls count, so users can hit it with
  few questions. `docs/architecture/ai-gateway.md` still says 20 per day.

## G10. Forgot password (S1)

`src/` has no `PASSWORD_RECOVERY` handler and no `updateUser` call (grep, 2026-10-31). A recovery link cannot lead to a form
to set a new password. On iOS, `redirectTo` is `capacitor://localhost/…`, which is not in `additional_redirect_urls`, so it
falls back to `site_url`, and PKCE's verifier lives in the WebView, not in Safari. QAer to confirm. Fix for web and native.
The same native-versus-Safari concern applies to the confirmation link, which also has no `emailRedirectTo`.

## G11. Minimise `block_plan` (S2)

`index.ts:206` uses `training_goals.select('*')`, which sends `user_id` and notes. Select named columns, drop `user_id`.
Notes (500 characters) may contain injuries or conditions; either stop sending them or say so at the point of entry
(copy in `ai-disclosure.md`). Also drop `id`, `at` from sets where not needed. Consider sending `store: false` explicitly.

## G12. Google Images in-app (S2)

`openExternal` uses `Browser.open` (Safari view) from `exerciseImages.ts` links in `ExerciseFinder.tsx` and `WorkoutPlan.tsx`.
Apple's age-rating item "Unrestricted web access" is "Users can navigate to any webpage within the app or freely browse the
web", which rates 16+. Recommendation: open these links in the system browser, not in-app, and keep the sign-in sheet.
Long term: licensed images (parked). This also simplifies the content-rights answer.

## G13. Privacy manifest (S2)

Issue #384 lists it as a blocker. Strictly, Apple requires approved reasons when an executable uses a required-reason API. My
source scan found none in `ios/App/App/*.swift`, `RestTimerWidget`, `Shared`, Capacitor, Cordova, `CapacitorApp`,
`CapacitorBrowser`; Capacitor and Cordova ship empty manifests; App and Browser ship none. Still add the files (content in
`app-store-connect-answers.md` section 9) because they are cheap and the label should match. **Run Xcode's Privacy Report on an
archive** to confirm; source grep is not proof. Check iCloud backup of WebKit storage against 5.1.3(ii).

## G14. Export key (S2)

Add `ITSAppUsesNonExemptEncryption` = `false` to both Info.plist files if confirmed: HTTPS via system stack only, no
CryptoKit or CommonCrypto in app Swift.

## G15. Build and bundle (S2)

- Apple requires Xcode 26 and the iOS 26 SDK for uploads since 2026-04-28 and an iOS 13 minimum since 2026-09-09
  (`https://developer.apple.com/news/upcoming-requirements/`, read 2026-10-31). Test Capacitor 6.2.2 with them.
- `Info.plist` `UIRequiredDeviceCapabilities` has `armv7`; the app is arm64-only in practice. Check validation; switch to `arm64`.
- Display name "Gym Studio" against listing name "GymStudio". PO spelling decision.
- `package.json` is 0.1.0, feedback sends that; Xcode says 1.0.
- `TARGETED_DEVICE_FAMILY = "1,2"`: iPad is on, so Apple reviews and requires iPad screenshots. Decide, or set to iPhone only.
- Icon: one `AppIcon-512@2x.png`; brand undecided.

## G16. Delete items and export (S2)

- Logs: soft-deleted rows stay forever, and `workout_entries` and `user_exercises` have no DELETE policy. Add a purge after N
  days once all devices have synced. The policy says what N is.
- Measurements, goals: add delete in Profile (RLS already allows). Feedback: by email.
- Export: JSON or CSV in Profile. GDPR portability; also reduces support work. Until then, by email within the legal period.

## G17. Retention (S2)

Today nothing expires. Once the PO decides: job (`pg_cron`, Edge schedule) for inactive accounts with warning email, purge old
`user_plans`, `trainer_recommendations`, `ai_usage`, `feedback`. Policy has the `[PO: …]` values.

## G18. AI budget and leftovers (S2)

- Global cap USD 15 per month (`AI_MONTHLY_CAP_USD`) and automatic calls: a public launch or even review could hit
  `monthly_budget_reached`. Check fallback paths and raise before review.
- Remove or disable the five features with no caller, or re-add callers under consent. Fewer paths means simpler disclosure.
- Update `docs/architecture/ai-gateway.md`.

## G19. Provider settings to verify (S2)

Supabase region, plan and backups, DPA acceptance, leaked-password protection, log retention; OpenAI data-sharing off, DPA,
retention; Google OAuth consent screen uses final policy and terms URLs; Google provider tokens not stored.

## G20. Health notice and AI labels (S2)

- 1.4.1 says apps "should remind users to check with a doctor". Today only "Not medical advice" in chat and the login-free
  listing. Add a first-run notice and before starting a plan (copy from `ai-disclosure.md`, after PT review).
- Label AI text: "AI Trainer" sentence and "Personalised by AI" exist; add a mark on the sentence itself, since a template and
  an AI sentence look identical. EU AI Act transparency duties: ⚠️ VERIFY with lawyer.
- `fat_loss` goal with calories tracking: PT reviews the wording and the minimum-age decision.

## G21. Tidy (S3)

Drop empty tables `workout_programs`, `workout_sessions`, `workout_sets`, `user_exercises_legacy`. `profiles` has 0 rows with 2
users although the trigger is enabled: check. Stop storing `avatar_url` and `picture` if unused (5.1.1(iii)).

## G22. Monitoring and analytics (S3)

Issue #384 plans crash monitoring and a sync-health alert; marketing plan §10 KPIs (activation, retention, NPS) imply analytics
that do not exist. Any such SDK or server tracking changes the inventory, label ("Analytics", "Crash Data"), manifest, policy and
possibly consent. Update first, ship second.

## G23. Public repository (S2)

The repo is **public**. Everything committed under `docs/governance/` is public, including `questions-for-po.md` and placeholders.
Do not commit his real name, address, phone or answers until he decides they are public. Consider whether review notes belong in
the repo at all (they contain no credentials). Migration 028 already contains the PO's user UUID.

## G24. Live Activity (S3)

Widget text "Rest", "Rest paused", "Go" is English only; the default exercise label is "Rest". Lock Screen shows exercise names;
disclosed in the policy.

## G25. Local data after sign-out (S2)

Sign-out keeps `gym-studio.user.<uuid>.*`. On a shared device another person can't read it through the UI, but it stays. Decide:
wipe on sign-out if everything is synced, or ask. Documents currently state it stays until the app is removed.
