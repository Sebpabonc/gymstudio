# AGENTS.md — GymStudio operating model

Single source of truth for every AI agent and human working in this repository
(Claude, GitHub Copilot, QA). Tool-specific files (`CLAUDE.md`,
`.github/copilot-instructions.md`) only point here and add tool-specific notes.

## Product

GymStudio is a mobile-first gym app: look up exercises, follow a workout plan,
log sets (weight × reps) and see progress. Web app today, iOS app via Capacitor.
The app UI is **bilingual (English / Spanish)** with an EN | ES toggle in the header (PO decision 2026-10-05; `src/i18n/`). Approved fitness content (tips, cues, block texts) and all repo docs are English; Spanish content translations need PT approval.

## Roles and authority

| Role | Who | Owns | Does not |
|---|---|---|---|
| Product Owner | Sebas | Product direction, scope, UX, business rules, product acceptance | Write code, run commands, open or merge PRs |
| Tech Lead / Architect | Claude | Technical design, architecture, issues with tasks + acceptance criteria, PR review, merging, unblocking Copilot | Make product decisions silently |
| Developer | GitHub Copilot | Implementing issues inside the approved design, tests, small refactors needed by the task | Redesign architecture |
| QA ("QAer") | Claude QA agent (`.claude/agents/qaer.md`), run when Sebas says "QAer" | End-to-end functional, design-consistency and content checks on the live app (`docs/qa/README.md`); writes `docs/qa/reports/`, files `qa` issues | Change code, content or data; sign in |
| UX & AI team ("UXer") | Claude agent (`.claude/agents/uxer.md`) | UX research, design and AI-first product proposals in `docs/ux/proposals/` (see `docs/ux/README.md`) | Change code/content/data; decide architecture or cost |
| PT / Fitness Expert | Specialist agent | Drafting fitness knowledge (technique, cues, classifications) | Modify code or app data directly |

## How work flows

1. Sebas states a business requirement.
2. Claude turns it into a GitHub Issue (template: *Feature*) with technical
   approach, tasks, acceptance criteria, dependencies and test requirements.
3. Copilot implements it on a branch named `feat/<issue>-<slug>` or
   `fix/<issue>-<slug>` and opens a Pull Request that says `Closes #<issue>`.
4. CI must pass. Claude reviews the PR against the issue and this file, then
   squash-merges it and reports the outcome to Sebas in product language.
5. Sebas accepts the result at product level (the live app). **Nothing is pushed directly to `main`.**

## Copilot: decide vs. escalate

You may decide: names, internal helpers, straightforward component structure,
small refactors inside the files the task touches, extra tests.

Stop and escalate (comment on the issue/PR and tag it `needs-tech-lead`) before:
- adding a new architectural layer, library or framework, or replacing one
- changing the data model or anything stored in `localStorage` keys/shapes
- changing persistence, authentication, API or security design
- cross-cutting refactors or touching many unrelated files
- anything the issue does not cover, or when the issue seems wrong

If the issue is ambiguous about **product behaviour**, ask; do not guess.

## Architecture (current state)

```
src/
  App.tsx                 main screen
  components/WorkoutPlan  workout plan + calendar
  data/                   exercise library (static), base workout plan
  utils/storage.ts        all reads/writes of exercises and history (localStorage)
  types.ts                domain types
ios/                      Capacitor iOS project (generated web assets are not versioned)
docs/reference/           source material (original plan spreadsheet, branding)
```

Rules:
- **Persistence goes through `src/utils/storage.ts`.** Do not add new direct
  `localStorage` calls in components. (`WorkoutPlan.tsx` still has one — known debt.)
  This boundary is what will let us move to Supabase without rewriting screens.
- **Never change an exercise `id` once it may have logs**; history references it.
- Keep domain logic (calculations, classification) in plain functions outside
  components so it can be tested.
- Don't break mobile: the build uses relative paths (`base: './'`) so it works on
  GitHub Pages and inside Capacitor. Test layouts at phone width.

Direction (not built yet): Supabase replaces `localStorage` behind the storage
boundary; users own workouts/sessions/sets; the exercise catalogue is shared
reference data. Child records inherit ownership through their parent — not every
table needs `user_id`. Row Level Security enforces user isolation.

## Database (Supabase)

- Project is linked via `supabase/config.toml`; schema changes live **only** in
  `supabase/migrations/` (numbered, never edited after being applied).
- `public.exercises` is the **global exercise catalogue** (text ids = app ids,
  read-only for users via RLS). Its data comes from
  `docs/fitness/approved/catalogue-v2/*.json` (spec: `docs/fitness/catalogue-v2-spec.md`,
  checked in CI by `scripts/validate-catalogue.py`) and is turned into a migration with
  `python3 scripts/catalogue-v2-seed.py` — never hand-edit seed SQL.
- Training blocks (`training_blocks`, `training_block_days`, `training_block_exercises`) are
  Sebas's private program (`owner_id`; only the owner can read them, migration 028) built from `docs/fitness/approved/training-blocks/blocks.json`
  (spec: `docs/fitness/training-blocks-spec.md`, validated in CI by `scripts/validate-blocks.py`,
  seeded with `python3 scripts/training-blocks-seed.py`).
- Personal plans: `public.user_plans` (one active per user, RLS own rows). Built in `src/plans/`:
  PT template (`docs/fitness/approved/templates/`) → `personalizeTemplate` (approved rules) → AI `block_plan`
  → `applyAiAdjustments` (keeps only rule-safe changes). A user with an active plan follows it; others keep the global blocks.
- User data: `public.workout_entries` (synced workout history) and `public.profiles`, RLS by
  `auth.uid()`. Auth + sync design: `docs/architecture/auth-and-sync.md`. The old
  `workout_sessions` / `workout_sets` tables are unused.
- The browser may only use the public `anon` key (`VITE_SUPABASE_URL`,
  `VITE_SUPABASE_ANON_KEY`). Never commit or ship the `service_role` key.
- Copilot does not create or apply migrations unless the issue explicitly says so;
  the Tech Lead applies migrations to the remote project.

## Fitness knowledge

Fitness content (technique, cues, muscle targeting) is never turned into app
behaviour just because an agent wrote it. See `docs/fitness/README.md`.

- **PT / Fitness Expert** is a Claude subagent: `.claude/agents/pt-fitness-expert.md`.
  It writes only to `docs/fitness/drafts/` using `docs/fitness/TEMPLATE.md`.
- Flow: PT draft → Sebas approves the content → Tech Lead moves it to
  `docs/fitness/approved/` (status `approved`, approver + date) → Tech Lead writes
  the Issue → Copilot implements.
- Copilot must never implement fitness content that is not in `approved/`.

## Security

- Never commit secrets. Use `.env.local` (ignored) and `VITE_` variables only
  for values that are safe to expose in the browser.
- Never put privileged keys (e.g. Supabase `service_role`) in client code.
- Treat any user data isolation question as a Tech Lead decision.

## Commands

```bash
npm install          # dependencies
npm run dev          # local app at http://localhost:5173
npm test             # unit tests (Vitest)
npm run typecheck    # TypeScript check
npm run build        # typecheck + production build
npm run mobile:sync  # build + copy into the iOS project
```

## AI Trainer release checklist (PO 2026-10-07, after the 0 kg / missing-data bugs)

Any change that can affect a recommended load or what the trainer card shows:
1. **PT owns the rule.** Fitness rules come from an approved PT spec (`docs/fitness/approved/`) with exact test cases;
   the Tech Lead/Copilot never invent progression rules. Engine changes get a PT pre-merge review.
2. **Invariants pass** (`src/trainer/invariants.test.ts`): never 0 kg for a weighted exercise, never a non-existent
   weight, never a jump above the PT guardrail, never "no data" with recent sessions — for every planned exercise.
3. **Real-history replay**: export the PO's entries read-only to a local file (never committed) and run
   `npx vite-node scripts/trainer-replay.ts <entries.json> [today]`; the PT reviews anything unusual before release.
4. **Single source**: preset plans get every recommendation from `src/trainer/engine.ts` (no old rules on any screen).
5. **QAer week flow** before trainer releases: at 375 px, log a day, open the paired day the same day, mid-week
   counters, a pyramid, a cable/light load, a superset.
6. **Tell the PO what to check**: every install on his phone comes with 2–3 lines on what changed and what to look at.

## Definition of done

- Acceptance criteria in the issue are met.
- `npm test` and `npm run build` pass (CI green).
- New logic has tests; bugs get a regression test.
- Works at phone width; no new console errors.
- No secrets, no generated files (`dist/`, `node_modules/`, `ios/App/App/public`) committed.
- Docs/this file updated if the architecture or workflow changed.
