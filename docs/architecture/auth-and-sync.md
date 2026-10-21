# Authentication and sync (ADR, 2026-10-04)

## Product decisions (PO, delegated to Tech Lead where noted)

- **Sign-in methods:** email + password, and **Continue with Google** (PO request).
- **Account is optional:** the app stays offline-first and fully usable signed out. Signing in
  backs up and syncs history across devices. *(Tech Lead)*
- **Sign-up is open;** every user only sees their own data (RLS). Revisit before a public
  launch (abuse limits, terms, privacy policy). *(Tech Lead)*
- **Existing local history is uploaded** to the account on the first sign-in, never discarded.
  *(Tech Lead)*
- Demo mode (`?demo=1`) never signs in or syncs.

## Architecture

```
React app ── src/lib/supabaseClient.ts (lazy, anon key only)
   │
   ├── src/auth/AuthProvider.tsx   session state (supabase.auth), signIn/signUp/signOut/Google
   ├── src/screens/LoginScreen.tsx, ProfileScreen.tsx
   └── src/utils/sync.ts           push/pull workout history  ⇄  public.workout_entries (RLS)
                                   push/pull owned exercises   ⇄  public.user_exercises (RLS)
            ▲
   src/utils/storage.ts (localStorage stays the source the UI reads; sync runs behind it)
```

- **Supabase Auth** with PKCE. `site_url` = `https://sebpabonc.github.io/gymstudio/`; redirect
  URLs include the Pages URL and `http://localhost:5173` (see `supabase/config.toml`, pushed
  with `supabase config push` after reviewing `supabase config diff`).
- **Profiles:** `public.profiles` (001_init) is created by the `on_auth_user_created` trigger.
- **History in the cloud:** `public.workout_entries` (migration 012): one row per logged
  exercise and date, `sets` as jsonb, client-generated `id`, `updated_at` set to **server time on insert and update** by a
  trigger (migration 013), `deleted_at` for soft deletes. RLS: a user can only read/insert/update rows with
  their own `user_id`.
  - Why not the normalized `workout_sessions` / `workout_sets` tables from 001_init: the app's
    unit of work is "one exercise logged on one day"; syncing it as one row keeps offline
    merge simple and atomic. Per-set analytics are computed client-side. The old tables stay
    unused (empty) and can be dropped later.
- **Sync algorithm (last-write-wins by `updated_at`):**
  1. Local entries carry `updatedAt` and a `dirty` flag (set on every local change).
  - Pulls are paginated (Supabase returns at most 1000 rows per request) and use
    `updated_at >= lastPulledAt` (merge is idempotent), so no row is skipped.
  2. On sign-in, on app start (if signed in), after each save, and when the browser goes back
     online: push dirty entries (upsert by `id`), then pull rows with
     `updated_at >= lastPulledAt`, merge by `id` (newer `updatedAt` wins; `deleted_at` removes
     locally), save `lastPulledAt`.
  3. First sign-in on a device: all local entries are dirty → uploaded.
  4. Validate dates, exercise ids, sets and optional field shapes before upload. Push in
     batches of at most 25; if a batch fails, retry its rows individually. Invalid rows
     and Postgres `23xxx`, `22xxx` or `42501` rejections are quarantined without blocking
     other logs or pulls. Quarantine is an optional `syncError: {code, message, at}` in
     the existing per-entry sync metadata, not workout history or the database schema;
     metadata without this field continues to load unchanged. Editing a log clears its
     quarantine, and its Profile **Retry** action clears it and re-validates.
  5. Network/server failures remain dirty and retry with exponential backoff (10 seconds
     up to 5 minutes). A 401/expired JWT refreshes the session once and retries the request;
     an unsuccessful refresh asks the user to sign in again. Profile shows pending logs,
     reasons, and **Retry now**; a pending-count badge sits beside the sync dot.
- **User-created exercises:** definitions are saved through `src/utils/storage.ts` and sync to
  `public.user_exercises` (migration 033), scoped to the signed-in user. A new definition gets
  one `custom-<uuid>` id at creation; existing name-based ids are retained and uploaded with
  that same id on first sync. Sync pushes definitions in batches of 25 before dependent
  workout entries, then pulls definitions by their own `updated_at` cursor. Definition rows
  rejected by constraints are quarantined in local sync metadata; linked entries stay dirty
  and are skipped until their definition is synced. Entry uploads use `user_exercise_id` and
  set `exercise_id` to null; pulls map the user exercise id back to the app's `exerciseId`.
  The app does not provide deletion or editing of exercise definitions yet.
- **Google OAuth:** needs a Google Cloud OAuth client (owner's Google account). Client ID and
  secret are entered by the owner in the Supabase dashboard; the secret is never committed.
  On iOS (Capacitor) OAuth redirects need a custom URL scheme — tracked separately.

## Security

- Only the anon key ships in the client; RLS enforces isolation.
- No service-role key anywhere in the repo or client.
- Passwords: minimum 8 characters; email confirmation stays enabled.
