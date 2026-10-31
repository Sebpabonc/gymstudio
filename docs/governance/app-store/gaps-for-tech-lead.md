# Gaps for the Tech Lead (DRAFT)

Governancer, 2026-10-31; updated with the PO's answers of 2026-11-01. App changes needed for the store documents to be true. Tracking issue: #384.
Severity: **S1** blocks submission or makes a document false; **S2** fix before public release; **S3** soon after.
Items marked **New** were not in issue #384.

| # | Sev | Gap | Owner |
|---|---|---|---|
| G1 | S1 | In-app account deletion | TL |
| G2 | S1 | **New.** AI calls bypass consent, and "Not now" is ignored | TL |
| G3 | S1 | **New.** No way to withdraw AI consent | TL, UXer |
| G4 | S1 | Build Sign in with Apple (PO decided 2026-11-01) | TL |
| G5 | S1 | Hosted policy, US health policy and support URLs, in-app links, terms and 18+ step | TL |
| G6 | S1 | **New.** No production email provider, so sign-ups cannot confirm. PO said later: must be before launch | PO + TL |
| G7 | S1 | New-user path unproven; bundled fallback exposes the private program | TL, QAer |
| G8 | S1 | Bundle ID, team, App IDs | TL + PO |
| G9 | S1 | **New.** Untrue statements in app and listing. Exact strings below | TL, Socialer, PT |
| G10 | S1 | **New.** Forgot password does not let anyone set a new password | TL |
| G11 | S2 | **New.** Data minimisation in `block_plan` | TL |
| G12 | S2 | **New.** Google Images in an in-app browser; affects the truthful age answer and rights | TL |
| G13 | S2 | Privacy manifest and report | TL |
| G14 | S2 | **New.** Export compliance key | TL |
| G15 | S2 | **New.** Build requirements and bundle details; iPhone only | TL |
| G16 | S2 | **New.** Delete items, purge soft deletes, export | TL |
| G17 | S2 | **New.** Retention jobs; periods decided | TL |
| G18 | S2 | **New.** AI budget, unused gateway features | TL |
| G19 | S2 | Verify provider settings | PO login, TL |
| G20 | S2 | **New.** Health notice and AI labels in the app | TL, PT, UXer |
| G21 | S3 | **New.** Tidy unused data | TL |
| G22 | S3 | **New.** Update documents before adding monitoring or analytics | TL |
| G23 | S2 | **New.** Public repo: what gets committed | TL |
| G24 | S3 | **New.** Live Activity English-only, Lock Screen name | TL |
| G25 | S2 | **New.** Local data stays after sign-out | TL, PO |
| G26 | S1 | **New.** Countries where the AI provider is not offered; store availability | PO, TL |

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

PO decided 2026-11-01: **add Sign in with Apple.** Design and consequences: `app-store-connect-answers.md` section 6. The Apple relay needs a registered email source, which ties to G6.

## G5. URLs, links, terms and age step (S1)

**Does GitHub Pages work? Yes for now.** `gh-pages.yml` publishes `dist/`. Vite has no `public/` folder yet; adding
`public/legal/` copies files to `dist/legal/` and also into the iOS bundle (harmless). Proposed:
`https://sebpabonc.github.io/gymstudio/legal/privacy.en.html`, `privacy.es.html`, `terms.en.html`, `terms.es.html`,
`support.en.html`, `support.es.html`, `consumer-health-data.en.html`, `consumer-health-data.es.html`. These URLs are now written in the drafts; the PO accepts Pages for now (domain later). Static HTML, no scripts, no bundle needed. Generate from the approved Markdown, in the languages the PO confirms (Brazil would need Portuguese).

Limit: GitHub says Pages may not be used to run "your online business" if "primarily directed at either facilitating
commercial transactions or providing commercial software as a service"
(`https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits`, read 2026-10-31). Policy pages
for a free app look fine; a paid Pro or landing page should move to a custom domain. The URL also shows the PO's GitHub
user name.

In the app (EN and ES):
- Profile: Privacy policy, Terms, Support, Delete account, and a **separate** link "Consumer Health Data Privacy Policy (US)" / "Política de datos de salud del consumidor (EE. UU.)" (RCW 19.373.010(16), .020(1)(b): in-app settings link, plus the App Store download page). Also on the login screen. Opened with `openExternal`.
  The bottom tab is labelled "You" while the documents say "Profile → …": once built, align the policy, terms, support page and
  review notes with the exact labels, in both languages.
- Sign-up: terms acceptance and 18+ confirmation before account creation, including Google and Apple paths.
  Record version and timestamp. This does **not** count as health or AI consent (RCW 19.373.010(6)(b): not through general terms); those stay separate (G2, `ai-disclosure.md` F). Health and sharing consents must be recorded per person, with version.

## G6. Email provider (S1)

`supabase/config.toml` has no SMTP. Supabase's default service: "Supabase Auth will refuse to deliver messages to addresses
that are not part of the project's team", at 2 messages per hour, and is meant for development
(`https://supabase.com/docs/guides/auth/auth-smtp`, read 2026-10-31). Email confirmation is on, so **a new email user cannot
activate an account** unless custom SMTP is set in the dashboard. ⚠️ VERIFY dashboard. Needs a provider, a sending domain
(PO), and an entry in the policy. A domain also solves the support address.

**PO said 2026-11-01: domain and mail provider later, personal email for now.** Personal email is fine for support. The provider can't wait until after launch: confirmation, reset, inactive-account warnings (G17) and Apple relay mail all depend on it, and App Review tests email sign-up. Options: provider before submission (recommended), or launch with Apple and Google only and hide email sign-up (`LoginScreen`), adjusting review notes, Terms and policy. PO question 4.

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
  and came from `docs/reference/workout-plan.xlsx`. The PO confirmed permission to use them (2026-11-01); whether it covers public distribution is question 5.
  **Still remove from the public bundle:** the Terms now say no human trainer writes or reviews a user's plan, and that is only true once a new user can't get these blocks.
  ⚠️ VERIFY `docs/fitness/approved/templates/` were not derived from the coach blocks.
- `?demo=1` uses a PT template, fine.

## G8. Bundle ID and team (S1)

Xcode: `com.sebgymstudio.app` and `.RestTimerWidget`, team `9KR7BRV6Z3` (personal). `capacitor.config.json`:
`com.gymstudio.app`. The ID cannot change after the first upload. Recommendation: try to register `com.gymstudio.app`
under the paid team, since it matches the brand; IDs are global, so it may be taken, otherwise use `com.sebgymstudio.app`.
Then align `capacitor.config`, the widget prefix (must start with the parent ID), and enable the capabilities.
A deep link scheme `gymstudio` is already in Supabase's allow-list and doesn't depend on the ID.

## G9. Untrue statements in the app and listing (S1)

PO answer 2026-11-01: **there is no human trainer behind the content.** Use "AI trainer" everywhere, never "personal trainer". The rules are reviewed by the app's AI specialist agent (`.claude/agents/pt-fitness-expert.md`) and approved by the owner (`docs/fitness/README.md`). Also guideline 2.3 and consumer law. Tech Lead applies A to D; Socialer applies E (PT checks prompts and "learns"; prompt changes affect trainer sentences, so follow the AGENTS.md trainer checklist). Internal code comments saying "PT" and `origin: 'pt'` values can stay: users don't see them.

### A. App dictionaries (`src/i18n/sections/`), exact replacements

| Key (file) | EN today | EN new | ES today | ES new |
|---|---|---|---|---|
| `profile.goal.copy` (`profile.ts`) | Your PT plan is built from this. | Your plan is built from this. | Tu plan de entrenamiento se basa en esto. | No change |
| `workout.block.pt` (`workout.ts`), badge at `WorkoutPlan.tsx:2981` | PT | App plan | PT | Plan de la app |
| `workout.block.coach` (`workout.ts`), same badge | Coach | My plan | Entrenador | Mi plan |
| `workout.block.origin.pt` (no caller found) | Designed by the PT | Delete the key, or: From the app's rules | Diseñado por el PT | Eliminar, o: Según las reglas de la app |
| `workout.block.origin.coach` (no caller found) | Designed by your coach | Delete the key, or: Your own plan | Diseñado por tu entrenador | Eliminar, o: Tu propio plan |
| `workout.ai.coachThinking` (`workout.ts`) | Coach is thinking… | AI trainer is thinking… | El entrenador está pensando… | El entrenador con IA está pensando… |
| `workout.ai.summary` (`workout.ts`) | AI coach summary | AI trainer summary | Resumen con IA | No change |
| `login.benefit3` (`app.ts`) | Your synced data is private to your account. | Your data is separated from other users' data. | Tus datos sincronizados son privados de tu cuenta. | Tus datos están separados de los de otros usuarios. |
| `login.privacyBody` (`app.ts`) | Workout history stays on this device while you're signed out. Synced history is only visible to your account. | Signed out, your workouts stay on this device. With an account, they are stored with our hosting provider, Supabase, and only sent to OpenAI if you turn on AI. Read the Privacy Policy. | Tu historial de entrenamientos se queda en este dispositivo mientras no has iniciado sesión. El historial sincronizado solo lo ve tu cuenta. | Sin sesión, tus entrenamientos se quedan en este dispositivo. Con una cuenta, se guardan con nuestro proveedor de alojamiento, Supabase, y solo se envían a OpenAI si activas la IA. Lee la Política de privacidad. |
| `ai.error.dailyLimit` (`app.ts`) | You've used today's 40 questions. Try again tomorrow. | You've reached today's AI limit. Try again tomorrow. | Ya usaste tus 40 preguntas de hoy. Inténtalo de nuevo mañana. | Llegaste al límite de IA de hoy. Inténtalo de nuevo mañana. |

Why the last row: automatic `trainer_explain` calls count, so users can hit it with few questions. `docs/architecture/ai-gateway.md` still says 20 per day. `help.ai.consent` and `ai.consent.body` ("Nothing else") go with G2 and `ai-disclosure.md`.

Existing "AI Trainer" labels (`workout.trainer.title`) stay. The rule sentences in the first person ("I moved the load up") stay, as the AI Trainer's voice, with the labels in G20.

### B. AI prompts (`supabase/functions/ai-gateway/index.ts`), so the model never claims to be a person

| Prompt | Today | New |
|---|---|---|
| `TRAINER_PROMPT` | You are the user's personal trainer inside GymStudio. | You are the user's AI trainer inside GymStudio. |
| `TRAINER_PROMPT` | like a real PT standing next to them | in a direct, practical tone |
| `GENERAL_PROMPT` | You are GymStudio's training coach inside a gym-tracking app. | You are GymStudio's AI trainer inside a gym-tracking app. You are software: never claim to be a human or a certified trainer. |
| `GENERAL_PROMPT` | plan itself is designed by the PT | plan itself comes from the app's rules |
| `PLAN_PROMPT` | You are GymStudio's coach preparing the user's next session of a given day of their PT plan. | You are GymStudio's AI trainer preparing the user's next session of a given day of their plan. |
| `PLAN_PROMPT` | the PT owns the plan | the app's rules own the plan |
| `BLOCK_PROMPT` | You are GymStudio's PT personalising | You are GymStudio's AI trainer personalising |
| `BLOCK_PROMPT` | already built from a PT template with the approved rules | already built from an app template with the approved rules |
| `SUGGESTION_PROMPT`, `SESSION_PROMPT` | You are GymStudio's coach inside a gym-tracking app. | You are GymStudio's AI trainer inside a gym-tracking app. |
| `FEEDBACK_PROMPT` | You are GymStudio's coach. | You are GymStudio's AI trainer. |
| Exercise prompt | you may suggest what to discuss with their coach | you may suggest they ask a qualified professional |

Check the top of the file for any other "coach" in prompts. The five features with no caller (G18) can be removed instead.

### C. Name "GymStudio" (PO 2026-11-01)

| File | Today | New |
|---|---|---|
| `ios/App/App/Info.plist` `CFBundleDisplayName`; `capacitor.config.json` `appName`; `index.html` title; `src/App.tsx:166`, `:202` wordmarks | Gym Studio | GymStudio |
| `index.html` description | Gym Studio tracking app for exercise logs and progress | GymStudio tracking app for exercise logs and progress |
| `ios/App/RestTimerWidget/Info.plist` | Gym Studio Rest Timer | GymStudio Rest Timer |

### D. Sentences that must stay out

Never in app, listing, site or video: "personal trainer", "entrenador personal", "written by a trainer", "designed by the PT", a real person's coaching, credentials, or "reviewed by a professional". The only allowed mention of certified trainers is the disclaimer in Terms section 5.

### E. Marketing (owner: Socialer; PT for fitness claims; nothing published without PO)

App Store listing, `docs/marketing/2026-10-18-marketing-plan.md` §8. Lengths checked: name 21/30 and 24/30; promo 134/170 and 153/170.

| Field | EN new | ES new |
|---|---|---|
| Name | GymStudio: AI Trainer | GymStudio: Entrenador IA (no change) |
| Promotional text | Know what to lift today. GymStudio sets each exercise's weight from your last sets, using the app's training rules, and tells you why. | Sabe qué levantar hoy. GymStudio ajusta el peso de cada ejercicio según tus últimas series, con las reglas de entrenamiento de la app, y te dice por qué. |
| Description, first line | Stop guessing your weights. GymStudio is a training app with an AI trainer that learns from every set. | Deja de adivinar tus pesos. GymStudio es una app de entrenamiento con un entrenador con IA que aprende de cada serie. |
| Description, "know what to lift" | Every exercise shows today's weight and reps, calculated from your last sessions with the app's training rules. AI can explain them in plain words. Tap to see why: "Last time you reached the top of the 8-rep target at 40 kg, so I moved the load up." | Cada ejercicio muestra el peso y las repeticiones de hoy, calculados a partir de tus últimas sesiones con las reglas de entrenamiento de la app. La IA puede explicarlos en palabras simples. Toca para ver por qué: "La última vez alcanzaste el máximo del objetivo de 8 repeticiones con 40 kg, así que subí el peso." |
| Description, plan | With a free account, answer a few questions and get a 6-week plan for 3 to 6 days a week, at the gym or with dumbbells. Your week is one bar, so you always know what's next. | Con una cuenta gratis, responde unas preguntas y recibe un plan de 6 semanas de 3 a 6 días por semana, en el gimnasio o con mancuernas. Tu semana es una barra: siempre sabes qué sigue. |
| Description, cues bullet | • Technique cues and posture tips for every exercise in the library | • Técnica y consejos de postura para cada ejercicio de la biblioteca |
| Description, language | Switch language any time. Log offline; sign in with Apple, Google or email to sync. | Cambia de idioma cuando quieras. Registra sin conexión; inicia sesión con Apple, Google o correo para sincronizar. |
| Description, end | GymStudio does not give medical advice. Check with a doctor before starting a new training program. Its AI trainer is software and its answers can be wrong. AI is optional and uses OpenAI. For ages 18 and over. Privacy: https://sebpabonc.github.io/gymstudio/legal/privacy.en.html US consumer health data policy: https://sebpabonc.github.io/gymstudio/legal/consumer-health-data.en.html | GymStudio no ofrece consejo médico. Consulta a un médico antes de empezar un nuevo programa de entrenamiento. Su entrenador con IA es un programa y sus respuestas pueden tener errores. La IA es opcional y usa OpenAI. Para mayores de 18 años. Privacidad: https://sebpabonc.github.io/gymstudio/legal/privacy.es.html Política de datos de salud de EE. UU.: https://sebpabonc.github.io/gymstudio/legal/consumer-health-data.es.html |

Localisation: Spanish (Mexico) only, not Spain (EU left out). "learns from every set": PT confirms, or use "adapts to your sets" / "se adapta a tus series".

Everywhere else in `docs/marketing/` (plan, `2026-10-18-promo-15s.html`, `-promo-30s.html`, `-app-store-screenshots.html`, `2026-10-07-*`, `2026-10-10-rollout-and-monetization.md`):

| Find | Replace |
|---|---|
| Train with an AI Personal Trainer that learns from every set. | An AI trainer that learns from every set. |
| Entrena con un entrenador personal con IA que aprende de cada serie. / Entrena con un Entrenador Personal IA que aprende de cada serie. | Un entrenador con IA que aprende de cada serie. |
| GymStudio is a personal trainer that learns from every set. | GymStudio has an AI trainer that learns from every set. |
| using rules written by a personal trainer / with rules written by a trainer | using the app's training rules |
| con reglas escritas por un entrenador / con reglas escritas por un entrenador personal | con las reglas de entrenamiento de la app |
| 6-week plans built from a personal trainer's templates. / builds your 6-week plan from a personal trainer's templates / A plan built from a personal trainer's templates. | 6-week plans built from the app's training templates. |
| Planes de 6 semanas creados a partir de plantillas de un entrenador personal. / a partir de plantillas de un entrenador personal / Un plan creado con plantillas de un entrenador personal. | Planes de 6 semanas creados con las plantillas de entrenamiento de la app. |
| **A real plan, written by a trainer** (pillar 4) | **A real plan** |
| Rules written by a personal trainer (landing "Trust") | Clear training rules, prepared with an AI specialist and approved by the owner. No human trainer reviews your plan. |
| A personal trainer writes the rules / Un entrenador personal escribe las reglas (post 19) | How the rules get made: an AI specialist drafts them, the owner approves them / Cómo se hacen las reglas: un especialista de IA las redacta y el dueño las aprueba |
| "AI Personal Trainer" (honesty rule, §1), "PT-written rules" | "AI trainer", "the app's rules" |

Also update the §14 row "rules written by a personal trainer" and §13 contact email (js.pabonc979@gmail.com). Marketing text naming a real training result or user needs its own check (5.1.3).

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
web". With the 18+ decision the final rating no longer depends on it, but the answer must stay truthful and it affects content rights. Recommendation: open these links in the system browser, not in-app, and keep the sign-in sheet.
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
- Name: PO chose "GymStudio" (2026-11-01). Strings in G9 C.
- `package.json` is 0.1.0, feedback sends that; Xcode says 1.0.
- **iPhone only** (PO 2026-11-01): set `TARGETED_DEVICE_FAMILY = "1"` on both targets. Today it is `"1,2"`, so Apple would review on iPad and require iPad screenshots.
- Icon: one `AppIcon-512@2x.png`; brand undecided.

## G16. Delete items and export (S2)

- Logs: soft-deleted rows stay forever, and `workout_entries` and `user_exercises` have no DELETE policy. Add a purge after **30 days** (PO), and
  check another device can't resurrect a purged row. The policy says 30 days.
- Measurements, goals: add delete in Profile (RLS already allows). Feedback: by email.
- Export: JSON or CSV in Profile. GDPR portability; also reduces support work. Until then, by email within the legal period.

## G17. Retention (S2)

Today nothing expires. PO decided 2026-11-01: **inactive accounts 24 months** with warning email first (needs G6; define "inactive" as last sign-in or sync), **feedback 24 months**, **AI usage 12 months**. Previous plans: until the account is deleted, pending PO approval. Job: `pg_cron` or Edge schedule. Deleting `ai_usage` older than 12 months doesn't affect the monthly cap. An inactive-account deletion must run the same flow as G1 (Apple revoke included).

## G18. AI budget and leftovers (S2)

- Global cap USD 15 per month (`AI_MONTHLY_CAP_USD`) and automatic calls: a public launch or even review could hit
  `monthly_budget_reached`. Check fallback paths and raise before review.
- Remove or disable the five features with no caller, or re-add callers under consent. Fewer paths means simpler disclosure.
- Update `docs/architecture/ai-gateway.md`.

## G19. Provider settings to verify (S2)

Supabase region, plan and backups, DPA acceptance, leaked-password protection, log retention; OpenAI data-sharing off, DPA,
retention; Google OAuth consent screen uses final policy and terms URLs; Google provider tokens not stored.

**Agent access:** development agents have Supabase tools that can run SQL on production. ⚠️ VERIFY they never read other users' rows; if they can or do, the AI vendor behind them becomes a recipient and the policy must say so. Recommendation: read-only metadata only, in writing.

## G20. Health notice and AI labels (S2)

- 1.4.1 says apps "should remind users to check with a doctor". Today only "Not medical advice" in chat and the login-free
  listing. Add a first-run notice and before starting a plan (copy from `ai-disclosure.md`, after PT review).
- Label AI text: "AI Trainer" sentence and "Personalised by AI" exist; add a mark on the sentence itself, since a template and
  an AI sentence look identical. EU AI Act: not targeted, as the EU is left out; recheck before any EU launch.
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
The PO approved his name (Sebastian Pabon) and email for public pages (2026-11-01). **Never commit his address, city or phone.** Public documents say "Australia" only. Consider whether review notes belong in
the repo at all (they contain no credentials). Migration 028 already contains the PO's user UUID.

## G24. Live Activity (S3)

Widget text "Rest", "Rest paused", "Go" is English only; the default exercise label is "Rest". Lock Screen shows exercise names;
disclosed in the policy.

## G25. Local data after sign-out (S2)

Sign-out keeps `gym-studio.user.<uuid>.*`. On a shared device another person can't read it through the UI, but it stays. Decide:
wipe on sign-out if everything is synced, or ask. Documents currently state it stays until the app is removed.

## G26. AI provider countries and store availability (S1)

OpenAI's list (`https://developers.openai.com/api/docs/supported-countries`, read 2026-10-31) has **no Hong Kong, China, Macau, Venezuela or Cuba**, and warns about "Accessing or offering access to our services outside of the countries and territories listed". All other named launch countries are listed. ⚠️ I did not check every Latin American and Caribbean country: compare the final list against this page.

The call leaves from Supabase's server, so it would technically work, but that does not make offering it acceptable and could lose the OpenAI account.

- **Recommended:** leave Hong Kong, Venezuela, Cuba, mainland China and Macau out of App Store availability (PO question 2).
- **Alternative:** disable AI by storefront or location. Not built; adds a location signal the policy says we don't use.
- In App Store Connect: "Specific Countries or Regions", final list only, and **leave "future countries" unticked**, so EU or other countries aren't added by accident.
- **The web app is not geo-limited.** GitHub Pages stays reachable from the EU and any other country, and it has AI and accounts. Do not target excluded countries: no EU prices, ads or Spain-specific Spanish. PO should know this is the limit of "EU left out".
- If Brazil stays: Portuguese versions of policy, terms, support, consent copy (A, C, E, F, G of `ai-disclosure.md`).
- Korea and Japan get English-only UI; users there accept English consent. ⚠️ VERIFY consent validity if those markets grow.

