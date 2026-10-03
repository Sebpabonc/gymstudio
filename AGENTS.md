# AGENTS.md — GymStudio operating model

Single source of truth for every AI agent and human working in this repository
(Claude, GitHub Copilot, QA). Tool-specific files (`CLAUDE.md`,
`.github/copilot-instructions.md`) only point here and add tool-specific notes.

## Product

GymStudio is a mobile-first gym app: look up exercises, follow a workout plan,
log sets (weight × reps) and see progress. Web app today, iOS app via Capacitor.
The UI is bilingual (Spanish/English display names).

## Roles and authority

| Role | Who | Owns | Does not |
|---|---|---|---|
| Product Owner | Sebas | Product direction, scope, UX, business rules, product acceptance | Write code, run commands, open or merge PRs |
| Tech Lead / Architect | Claude | Technical design, architecture, issues with tasks + acceptance criteria, PR review, merging, unblocking Copilot | Make product decisions silently |
| Developer | GitHub Copilot | Implementing issues inside the approved design, tests, small refactors needed by the task | Redesign architecture |
| QA | Claude / Copilot / Sebas | Verifying acceptance criteria and regressions before merge | — |
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

## Fitness knowledge

Fitness content (technique, cues, muscle targeting) is never turned into app
behaviour just because an agent wrote it. Flow: PT draft → `docs/fitness/drafts/`
→ Sebas approves → moved to `docs/fitness/approved/` → Claude designs the
integration → Copilot implements. Create these folders when the first draft exists.

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

## Definition of done

- Acceptance criteria in the issue are met.
- `npm test` and `npm run build` pass (CI green).
- New logic has tests; bugs get a regression test.
- Works at phone width; no new console errors.
- No secrets, no generated files (`dist/`, `node_modules/`, `ios/App/App/public`) committed.
- Docs/this file updated if the architecture or workflow changed.
