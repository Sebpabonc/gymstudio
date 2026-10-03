// GymStudio AI gateway (Supabase Edge Function).
// The only place the app talks to an LLM: the OpenAI key lives in the Supabase secret
// OPENAI_API_KEY and never reaches the client. Enforces sign-in, a per-user daily limit and a
// global monthly spend cap, and grounds every answer in the approved catalogue + the user's own
// history. See docs/architecture/ai-gateway.md.
import { createClient } from 'npm:@supabase/supabase-js@2'

const MODEL = Deno.env.get('OPENAI_MODEL') ?? 'gpt-4o-mini'
// USD per 1M tokens [input, output]. Unknown models fall back to a conservative price.
const PRICES: Record<string, [number, number]> = {
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-4.1-mini': [0.4, 1.6],
}
const FALLBACK_PRICE: [number, number] = [2.5, 10]
// App-side cap stays below the USD 20 hard limit set in the OpenAI dashboard.
const MONTHLY_CAP_USD = Number(Deno.env.get('AI_MONTHLY_CAP_USD') ?? '15')
const DAILY_LIMIT_PER_USER = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '20')
const MAX_QUESTION_CHARS = 300
const MAX_OUTPUT_TOKENS = 400

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SYSTEM_PROMPT = `You are GymStudio's exercise coach inside a gym-tracking app.
Answer the user's question about ONE exercise, using the exercise data and the user's recent
sets provided. Rules:
- Fitness and training technique only. If asked about anything else, say you can only help with
  this exercise.
- No medical advice. If the user mentions pain, injury or a medical condition, tell them to stop
  the exercise and see a qualified professional; do not diagnose or prescribe.
- Stay consistent with the provided posture tips and squeeze cue; do not invent different
  technique. If the data does not cover the question, say so briefly.
- Do not change the user's training plan; you may suggest what to discuss with their coach.
- Reply in English, plain text, at most 120 words, short sentences or up to 4 bullet points.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json(503, { error: 'ai_not_configured' })

  const authHeader = req.headers.get('Authorization') ?? ''
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  // Caller-scoped client: RLS applies, so it can only read the caller's own history.
  const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  // Service client: only for the usage ledger (no client-side writes allowed there).
  const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: userData } = await userClient.auth.getUser()
  const user = userData?.user
  if (!user) return json(401, { error: 'sign_in_required' })

  let body: { feature?: string; exerciseId?: string; question?: string }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  if (body.feature !== 'ask_exercise') return json(400, { error: 'unknown_feature' })
  const question = (body.question ?? '').trim()
  const exerciseId = (body.exerciseId ?? '').trim()
  if (!question || question.length > MAX_QUESTION_CHARS) {
    return json(400, { error: 'invalid_question', maxChars: MAX_QUESTION_CHARS })
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(exerciseId)) return json(400, { error: 'invalid_exercise' })

  // Limits: per-user daily count and global monthly spend.
  const now = new Date()
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const { count: usedToday, error: countError } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', dayStart.toISOString())
  if (countError) return json(500, { error: 'usage_unavailable' })
  if ((usedToday ?? 0) >= DAILY_LIMIT_PER_USER) {
    return json(429, { error: 'daily_limit', limit: DAILY_LIMIT_PER_USER })
  }
  const { data: monthRows, error: spendError } = await admin
    .from('ai_usage')
    .select('cost_usd')
    .gte('created_at', monthStart.toISOString())
  if (spendError) return json(500, { error: 'usage_unavailable' })
  const monthSpend = (monthRows ?? []).reduce((sum, row) => sum + Number(row.cost_usd), 0)
  if (monthSpend >= MONTHLY_CAP_USD) return json(429, { error: 'monthly_budget_reached' })

  // Grounding: approved catalogue entry + the caller's last sessions of this exercise.
  const { data: exercise } = await userClient
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .maybeSingle()
  if (!exercise) return json(404, { error: 'exercise_not_found' })
  const { data: history } = await userClient
    .from('workout_entries')
    .select('date, sets')
    .eq('exercise_id', exerciseId)
    .is('deleted_at', null)
    .order('date', { ascending: false })
    .limit(5)

  const context = {
    exercise: {
      name: exercise.name_en,
      primaryMuscles: exercise.primary_muscles ?? [exercise.primary_muscle],
      secondaryMuscles: exercise.secondary_muscles,
      equipment: exercise.equipment,
      movementPattern: exercise.movement_pattern,
      postureTips: exercise.posture_tips,
      squeezeCue: exercise.squeeze_cue,
    },
    recentSessions: history ?? [],
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'system', content: `Data (JSON):\n${JSON.stringify(context)}` },
        { role: 'user', content: question },
      ],
    }),
  })
  if (!openaiResponse.ok) {
    console.error('openai_error', openaiResponse.status, await openaiResponse.text())
    return json(502, { error: 'ai_unavailable' })
  }
  const completion = await openaiResponse.json()
  const answer: string = completion.choices?.[0]?.message?.content?.trim() ?? ''
  const inputTokens: number = completion.usage?.prompt_tokens ?? 0
  const outputTokens: number = completion.usage?.completion_tokens ?? 0
  const [inPrice, outPrice] = PRICES[MODEL] ?? FALLBACK_PRICE
  const costUsd = (inputTokens * inPrice + outputTokens * outPrice) / 1_000_000

  const { error: logError } = await admin.from('ai_usage').insert({
    user_id: user.id,
    feature: 'ask_exercise',
    model: MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: costUsd,
  })
  if (logError) console.error('usage_log_failed', logError.message)

  return json(200, {
    answer: answer || 'Sorry, I could not answer that. Try rephrasing your question.',
    remainingToday: Math.max(0, DAILY_LIMIT_PER_USER - (usedToday ?? 0) - 1),
  })
})
