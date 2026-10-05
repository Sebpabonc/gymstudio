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
// Automatic coach calls (per-exercise feedback + next-session plan) also count, so allow more per day.
const DAILY_LIMIT_PER_USER = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '40')
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

const SUGGESTION_PROMPT = `You are GymStudio's coach inside a gym-tracking app.
Explain in plain English WHY the app made the given suggestion for this exercise, using only the
user's recent sessions and the exercise data provided (e.g. reps hit at the top of the range, a
stalled e1RM, missed reps). Rules: fitness only; no medical advice (pain or injury: stop and see a
qualified professional); do not invent numbers that are not in the data; do not change the plan.
Reply in at most 80 words, plain text, 2-3 short sentences.`

const SESSION_PROMPT = `You are GymStudio's coach inside a gym-tracking app.
Summarise the user's workout for the given day from the data provided: what went well (compare
with the previous session of each exercise, mention personal bests if the numbers show them),
and ONE clear focus for next time. Rules: fitness only; no medical advice (pain or injury: stop
and see a qualified professional); do not invent numbers; encouraging but factual.
Reply in at most 120 words, plain text, up to 4 short bullet points starting with "- ".`

const GENERAL_PROMPT = `You are GymStudio's training coach inside a gym-tracking app.
Answer the user's training question using the data provided: their current training block (days and
exercises with sets, reps and rest) and their recent logged sessions. Rules: fitness and training only
(politely decline anything else); no medical advice (pain or injury: stop and see a qualified
professional); never invent numbers not in the data; you may suggest what to try next session but the
plan itself is designed by the PT. Reply in at most 150 words, plain text, short sentences or up to
5 bullet points starting with "- ".`

const FEEDBACK_PROMPT = `You are GymStudio's coach. The user just logged one exercise. Using the plan target,
the sets just logged, the app's rule-based recommendation and the previous sessions of this exercise, write
ONE short coaching note (max 2 sentences, max 40 words): what went well or what to fix, and the concrete
target for next time. Agree with the rule-based recommendation unless the history clearly shows a better
option; never change the exercise; no medical advice.`

const PLAN_PROMPT = `You are GymStudio's coach preparing the user's next session of a given day of their PT plan.
For EACH planned exercise propose the weight and reps per set for next time, starting from the app's
rule-based target and adjusting only within +/-10% using the user's history (trend, missed reps, rest of
the week). Never add, remove or swap exercises; the PT owns the plan. Reply ONLY with JSON:
{"summary": "<1-2 sentences>", "exercises": [{"code": "A1", "weight": 25, "reps": [8, 8, 8], "note": "<max 15 words>"}]}`

const BLOCK_PROMPT = `You are GymStudio's PT personalising a 6-week training block for one user. You get the user's
goals and measurements, the rule-based plan (already built from a PT template with the approved rules) and a
list of allowed alternative exercises. Personalise it: you may swap an exercise ONLY for an alternative with
the same primary muscle, change sets by at most 1 (range 2-4), change rest (30-300 s) and add short notes.
Keep the split, days and codes. No medical advice; fat loss mainly comes from a calorie deficit and steps.
Then write a summary (max 60 words) explaining why the plan fits them, and 3-6 insights (title max 40 chars,
body max 50 words). Reply ONLY with JSON:
{"summary": "...", "insights": [{"title": "...", "body": "..."}],
 "exercises": [{"dayKey": "upper-a", "code": "A1", "exerciseId": "...", "sets": 3, "restSeconds": 120, "note": "<max 12 words>"}]}
List only the exercises you change.`

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
type Feature = 'ask_exercise' | 'explain_suggestion' | 'session_summary' | 'general_chat' | 'exercise_feedback' | 'next_session_plan' | 'block_plan'

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

  let body: {
    feature?: string
    exerciseId?: string
    question?: string
    suggestion?: string
    date?: string
    blockId?: string
    dayKey?: string
    language?: string
    logged?: unknown
    target?: unknown
    recommendation?: unknown
    plan?: unknown
  }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  const feature = body.feature as Feature
  if (!['ask_exercise', 'explain_suggestion', 'session_summary', 'general_chat', 'exercise_feedback', 'next_session_plan', 'block_plan'].includes(feature)) {
    return json(400, { error: 'unknown_feature' })
  }
  const exerciseId = (body.exerciseId ?? '').trim()
  const question = (body.question ?? '').trim()
  const suggestion = (body.suggestion ?? '').trim()
  const date = (body.date ?? '').trim()
  if ((feature === 'ask_exercise' || feature === 'general_chat') && (!question || question.length > MAX_QUESTION_CHARS)) {
    return json(400, { error: 'invalid_question', maxChars: MAX_QUESTION_CHARS })
  }
  if (feature === 'explain_suggestion' && (!suggestion || suggestion.length > MAX_QUESTION_CHARS)) {
    return json(400, { error: 'invalid_suggestion', maxChars: MAX_QUESTION_CHARS })
  }
  if ((feature === 'ask_exercise' || feature === 'explain_suggestion' || feature === 'exercise_feedback') && !ID_RE.test(exerciseId)) return json(400, { error: 'invalid_exercise' })
  if (feature === 'session_summary' && !DATE_RE.test(date)) return json(400, { error: 'invalid_date' })
  const language = body.language === 'es' ? 'es' : 'en'

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

  // Grounding: approved catalogue data + the caller's own history (read with the caller's JWT, so RLS applies).
  const describe = (exercise: Record<string, unknown>) => ({
    id: exercise.id,
    name: exercise.name_en,
    primaryMuscles: exercise.primary_muscles ?? [exercise.primary_muscle],
    secondaryMuscles: exercise.secondary_muscles,
    equipment: exercise.equipment,
    movementPattern: exercise.movement_pattern,
    postureTips: exercise.posture_tips,
    squeezeCue: exercise.squeeze_cue,
  })
  let systemPrompt = SYSTEM_PROMPT
  let userMessage = question
  let context: Record<string, unknown>

  if (feature === 'block_plan') {
    const plan = body.plan as { days?: Array<{ exercises?: Array<{ exerciseId?: string }> }> } | undefined
    if (!plan || !Array.isArray(plan.days) || JSON.stringify(plan).length > 15000) return json(400, { error: 'invalid_plan' })
    const { data: goals } = await userClient.from('training_goals').select('*').maybeSingle()
    if (!goals) return json(400, { error: 'goals_required' })
    const { data: metrics } = await userClient
      .from('body_metrics')
      .select('date, weight_kg, steps, calories')
      .order('date', { ascending: false })
      .limit(14)
    const ids = [...new Set(plan.days.flatMap((day) => (day.exercises ?? []).map((exercise) => String(exercise.exerciseId))))]
    const { data: used } = await userClient.from('exercises').select('id, primary_muscles, equipment').in('id', ids.slice(0, 60))
    const muscles = [...new Set((used ?? []).map((exercise) => exercise.primary_muscles?.[0]).filter(Boolean))]
    const kit = [...new Set((used ?? []).map((exercise) => exercise.equipment).filter(Boolean))]
    const { data: alternatives } = await userClient
      .from('exercises')
      .select('id, name_en, primary_muscles, equipment')
      .in('equipment', kit)
      .limit(400)
    context = {
      goals,
      recentMetrics: metrics ?? [],
      plan,
      alternatives: (alternatives ?? [])
        .filter((exercise) => muscles.includes(exercise.primary_muscles?.[0]))
        .map((exercise) => ({ id: exercise.id, name: exercise.name_en, primaryMuscle: exercise.primary_muscles?.[0] })),
    }
    systemPrompt = BLOCK_PROMPT
    userMessage = 'Personalise my plan.'
  } else if (feature === 'next_session_plan') {
    const plan = body.plan
    if (!plan || JSON.stringify(plan).length > 6000) return json(400, { error: 'invalid_plan' })
    const { data: recent } = await userClient
      .from('workout_entries')
      .select('exercise_id, date, sets, day_key')
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(40)
    context = { plan, recentSessions: recent ?? [] }
    systemPrompt = PLAN_PROMPT
    userMessage = 'Prepare my next session.'
  } else if (feature === 'general_chat') {
    const todayIso = new Date().toISOString().slice(0, 10)
    const { data: blocks } = await userClient
      .from('training_blocks')
      .select('id, number, name, start_date, weeks')
      .lte('start_date', todayIso)
      .order('start_date', { ascending: false })
      .limit(1)
    const block = blocks?.[0]
    const { data: planRows } = block
      ? await userClient
          .from('training_block_exercises')
          .select('day_key, code, exercise_id, sets, reps, rest_seconds, technique')
          .eq('block_id', block.id)
      : { data: [] }
    const { data: recent } = await userClient
      .from('workout_entries')
      .select('exercise_id, date, sets')
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(30)
    // Users with a personal plan (user_plans) are coached on that plan instead of the owner-only blocks.
    const { data: userPlan } = await userClient
      .from('user_plans')
      .select('start_date, block')
      .eq('active', true)
      .maybeSingle()
    context = userPlan
      ? { today: todayIso, personalPlan: userPlan.block, planStart: userPlan.start_date, recentSessions: recent ?? [] }
      : { today: todayIso, block, plan: planRows ?? [], recentSessions: recent ?? [] }
    systemPrompt = GENERAL_PROMPT
  } else if (feature === 'session_summary') {
    let query = userClient
      .from('workout_entries')
      .select('exercise_id, date, sets, block_id, day_key')
      .eq('date', date)
      .is('deleted_at', null)
    if (body.blockId) query = query.eq('block_id', body.blockId)
    if (body.dayKey) query = query.eq('day_key', body.dayKey)
    const { data: todays } = await query.limit(20)
    if (!todays?.length) return json(404, { error: 'no_session' })
    const ids = [...new Set(todays.map((entry) => entry.exercise_id))]
    const { data: exercises } = await userClient.from('exercises').select('*').in('id', ids)
    const { data: earlier } = await userClient
      .from('workout_entries')
      .select('exercise_id, date, sets')
      .in('exercise_id', ids)
      .lt('date', date)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(60)
    const previous = ids.map((id) => earlier?.find((entry) => entry.exercise_id === id) ?? null)
    context = {
      date,
      exercises: (exercises ?? []).map(describe),
      session: todays,
      previousSessionPerExercise: previous.filter(Boolean),
    }
    systemPrompt = SESSION_PROMPT
    userMessage = 'Summarise this workout.'
  } else {
    const { data: exercise } = await userClient.from('exercises').select('*').eq('id', exerciseId).maybeSingle()
    if (!exercise) return json(404, { error: 'exercise_not_found' })
    const { data: history } = await userClient
      .from('workout_entries')
      .select('date, sets')
      .eq('exercise_id', exerciseId)
      .is('deleted_at', null)
      .order('date', { ascending: false })
      .limit(feature === 'explain_suggestion' ? 8 : 5)
    context = { exercise: describe(exercise), recentSessions: history ?? [] }
    if (feature === 'exercise_feedback') {
      const extra = { logged: body.logged, target: body.target, recommendation: body.recommendation }
      if (JSON.stringify(extra).length > 3000) return json(400, { error: 'invalid_feedback' })
      context = { ...context, ...extra }
      systemPrompt = FEEDBACK_PROMPT
      userMessage = 'Give me my coaching note.'
    }
    if (feature === 'explain_suggestion') {
      systemPrompt = SUGGESTION_PROMPT
      userMessage = `The app suggested: "${suggestion}". Why?`
    }
  }

  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_completion_tokens: feature === 'block_plan' ? 2000 : feature === 'next_session_plan' ? 900 : MAX_OUTPUT_TOKENS,
      ...(feature === 'next_session_plan' || feature === 'block_plan' ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: systemPrompt },
        ...(language === 'es'
          ? [{ role: 'system', content: 'Reply in natural Latin American Spanish (same rules and length limits). Keep exercise names as given.' }]
          : []),
        { role: 'system', content: `Data (JSON):\n${JSON.stringify(context)}` },
        { role: 'user', content: userMessage },
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
    feature,
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
