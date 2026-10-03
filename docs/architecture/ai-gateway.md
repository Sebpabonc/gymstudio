# AI gateway

All AI features go through one Supabase Edge Function, `ai-gateway`
(`supabase/functions/ai-gateway/index.ts`). The app never holds an LLM key.

| Item | Decision (PO, 2026-10-04) |
|---|---|
| Provider | OpenAI. Key in the Supabase secret `OPENAI_API_KEY`; model via `OPENAI_MODEL` (default `gpt-4o-mini`). |
| Budget | USD 20/month hard limit in the OpenAI dashboard; the gateway stops at USD 15 (`AI_MONTHLY_CAP_USD`) as a safety margin. |
| Per user | 20 requests/day (`AI_DAILY_LIMIT`). Signed-in users only (no guest/demo calls). |
| Ledger | `public.ai_usage` (migration 019): tokens + cost per call; users can read only their own rows; only the function writes. |
| Grounding | Approved catalogue row (muscles, posture tips, squeeze cue) + the caller's last 5 sessions of that exercise (read with the caller's JWT, so RLS applies). |
| Guardrails | Fitness-only, no medical advice (pain/injury → stop and see a professional), no plan changes, ≤120 words, English. |

## API
`POST /functions/v1/ai-gateway` with the user's session (`supabase.functions.invoke`):
```json
{ "feature": "ask_exercise", "exerciseId": "barbell-bench-press", "question": "Where should I feel this?" }
```
200 → `{ "answer": "...", "remainingToday": 19 }`.
Errors: 401 `sign_in_required`, 400 `invalid_question` (max 300 chars) / `invalid_exercise` /
`unknown_feature`, 404 `exercise_not_found`, 429 `daily_limit` / `monthly_budget_reached`,
502 `ai_unavailable`, 503 `ai_not_configured`.

## Deploy
`supabase db push` (migration 019) and `supabase functions deploy ai-gateway`.
