# Gym Studio

App to log gym workouts, look up exercises (with posture tips) and follow your plan.

- Tech: React, TypeScript, Vite, Capacitor (iOS), Supabase
- Exercise catalogue: Supabase (`public.exercises`), cached on the device for offline use
- Workout history: `localStorage` on the device (cloud sync comes with user accounts)
- Live app: https://sebpabonc.github.io/gymstudio/

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the public Supabase URL and anon key (optional)
npm run dev      # http://localhost:5173
npm test         # unit tests
npm run build    # typecheck + production build into dist/
```

Without `.env.local` the app still runs, using the bundled exercise list.

Open `https://sebpabonc.github.io/gymstudio/?demo=1` to preview six months of isolated demo workout history.

To try it on a phone: `npm run dev -- --host` and open the Mac's IP from the phone (same Wi-Fi).

## Logging a workout

Today is a plan preview. Choose **Start workout**, adjust kg/reps if needed, and tap **Done** for each set.
Every tap saves immediately, including each exercise in a superset. Exit keeps progress; finishing early never
fills in missing sets. Use **Fix a logged set** to correct a saved set without restarting rest.

Rest shows what comes next. Hide keeps a pinned countdown; reaching zero alerts you but never logs a set.
The exercise's rest duration wins, with the Profile value used when the plan has none.

## iOS

```bash
npm run mobile:sync      # web build + copy into ios/ (copied files are not versioned)
npm run mobile:open:ios  # open the project in Xcode
```

After adding native plugins, the Tech Lead runs Capacitor sync / CocoaPods installation before building in Xcode.
Rest alerts ask for notification permission when rest first starts; declining does not prevent logging.
Verify notification sound on a locked iPhone, foreground haptics, cancellation on skip/Undo, and the localized
“Next” text in the Live Activity before release. The web uses an audio beep and vibration where supported.

## Structure

```
src/
  App.tsx                 main screen
  components/WorkoutPlan  workout plan and calendar
  data/                   bundled exercise library (offline fallback) and base plan
  lib/supabaseClient.ts   lazy-loaded Supabase client (public anon key only)
  utils/storage.ts        all persistence: catalogue fetch/cache, exercises, history
  types.ts                domain types
supabase/migrations/      database schema and catalogue seed (numbered SQL)
docs/fitness/             fitness knowledge: drafts → approved (exercise catalogue v2)
scripts/                  catalogue validation and seed generation
ios/                      Capacitor native project
docs/reference/           source material (original plan spreadsheet, branding)
```

## Contributing

Ways of working (roles, Issue → PR flow, when to escalate) are in [AGENTS.md](AGENTS.md).

- Every change starts from an Issue, is built on a branch and reaches `main` through a Pull Request.
- `main` is protected: CI (catalogue validation, typecheck, tests, build) must pass.
