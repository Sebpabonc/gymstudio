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
     `updated_at > lastPulledAt`, merge by `id` (newer `updatedAt` wins; `deleted_at` removes
     locally), save `lastPulledAt`.
  3. First sign-in on a device: all local entries are dirty → uploaded.
  4. Failures are silent and retried; the UI shows a small sync status in Profile.
- **Google OAuth:** needs a Google Cloud OAuth client (owner's Google account). Client ID and
  secret are entered by the owner in the Supabase dashboard; the secret is never committed.
  On iOS (Capacitor) OAuth redirects need a custom URL scheme — tracked separately.

## Security

- Only the anon key ships in the client; RLS enforces isolation.
- No service-role key anywhere in the repo or client.
- Passwords: minimum 8 characters; email confirmation stays enabled.
