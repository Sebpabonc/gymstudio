---
title: AI-first personal training roadmap
status: proposal
author: UXer
date: 2026-10-04
related: docs/ux/proposals/2026-10-04-ux-audit.md, docs/ux/README.md (AI guardrails)
---

# AI-first personal training — roadmap

> Proposal only. The AI provider, architecture, security and cost are **Tech Lead** decisions.
> Fitness content and rules are **PT** decisions. Priorities and approval belong to **Sebas**.
> This document describes capabilities and trade-offs. It doesn't pick a vendor.

## 1. Vision

GymStudio becomes a **personal trainer in your pocket that already knows your plan and your
history**. Between sets it answers "how do I do this better?" using your PT's own cues. After a
session it tells you what went well and what to aim for next time. It explains every suggestion
in plain English, and it never changes your plan without your OK. Over time it drafts your next
6-week block for the PT and Sebas to approve. It stays grounded: it only talks about training,
only uses approved content and your own data, gives no medical advice, and it's opt-in.

**Why GymStudio can do this better than a generic chatbot:** we already hold the three things a
coach needs. (1) An **approved exercise catalogue** with posture tips, squeeze cues and bench
angles. (2) **PT-designed 6-week blocks** with a written strategy (methods, A/B days, progression
rules). (3) The user's **logged history** with `blockId`/`dayKey`, plus an analytics engine
(e1RM, PRs, stall and "ready to progress" detection) defined in `progress-insights.md`. The AI
mostly needs to **explain and personalise**. It doesn't need to invent training science.

## 2. What the AI can do — phased

Common rules for every feature (see §4 for details): server-side call only, grounded context,
fitness-only scope, no medical advice, opt-in, minimum data, the user approves any change, and
every answer offers "Was this helpful? 👍/👎".

### Phase 1 — low risk, high value (read-only, explains what exists)

#### 1.1 "Ask about this exercise" (technique Q&A)

- **User value:** quick, specific help between sets ("my shoulders hurt on incline press — am I
  flaring my elbows?" → the answer stays on technique and points to the stop/see-a-professional
  rule). It replaces searching YouTube mid-session.
- **UX flow:**
  1. On any exercise card, a **"Ask"** chip sits next to Posture tips.
  2. A bottom sheet opens with **3 suggested questions** generated from the catalogue fields
     (e.g. "Where should I feel this?", "What angle should the bench be?", "How do I make it
     easier on my shoulders?") and a text box (voice input via the keyboard).
  3. The answer comes back in 2–4 short sentences. It quotes the matching posture tip or squeeze
     cue as a highlighted chip ("From your PT's tips"), and ends with "Source: catalogue · Incline
     DB press".
  4. If the question is off-topic or medical, a fixed reply: "I can help with technique and your
     plan. For pain or injury, stop the exercise and see a qualified professional."
  ```
  ┌ Ask about Dumbbell Bench Press (30°) ───────┐
  │ [Where should I feel it?] [Bench angle?]    │
  │ [Easier on my shoulders?]                   │
  │ ┌─────────────────────────────────────────┐ │
  │ │ Keep forearms vertical and lower to the │ │
  │ │ sides of your chest in 2–3 s…           │ │
  │ │ 📌 From your PT: "Don't let the         │ │
  │ │    dumbbells drift toward your head"    │ │
  │ └─────────────────────────────────────────┘ │
  │ Was this helpful?  👍  👎                    │
  │ [ Type a question…                     🎤 ] │
  └─────────────────────────────────────────────┘
  ```
- **Data it needs:** the exercise's catalogue row (name, muscles, equipment, angle, posture tips,
  squeeze cue), the method of the current block, and the user's last set for that exercise
  (optional, e.g. "you did 15 × 44 kg"). **No personal identifiers.**
- **Guardrails:** a system prompt restricts it to this exercise and general technique. The answer
  must be grounded in the supplied tips (and say "your PT's tips don't cover that; ask your
  trainer" when they don't). Fixed medical refusal. Limited answer length. Requests are logged
  for PT review of 👎 answers.
- **Cost drivers:** about 1.5–3k input tokens (catalogue row + system prompt + strategy excerpt)
  and 150–300 output tokens per question. Expect 0–5 questions per session. Prompt caching of the
  fixed system prompt cuts repeat cost where the provider supports it.
- **Success metric:** at least 25% of active users ask at least one question per week, at least
  80% 👍, and zero answers flagged as medical advice in PT review.

#### 1.2 Post-workout summary

- **User value:** a short, motivating recap right after the last exercise (the session summary
  sheet from UX audit P5): what improved, PRs, what to aim for next time, and adherence. This is
  Strava's "Athlete Intelligence" idea for lifting.
- **UX flow:**
  1. When the last exercise of the day is logged (or the user taps "Finish session"), the summary
     sheet opens. Numbers (sets, volume, PRs) are computed **locally** and shown immediately.
  2. Below them, a 3-bullet **AI recap** loads (with a skeleton while loading):
     "✅ Incline DB press: +1 rep on all sets vs last A day. 🏅 Weight PR on cable fly (45 kg).
     🎯 Next Chest-Back A: try 24 kg on set 1 — you hit every rep."
  3. Each bullet has a "Why?" link that shows the data behind it (the sets compared).
  4. The recap is saved with the session so it isn't regenerated (and costs nothing to re-open).
- **Data it needs:** today's entries (exercise names, sets), the previous comparable session per
  exercise (same `dayKey`), the outputs of the existing analytics engine (PRs, ready-to-progress,
  stall flags) and the block/week. All of this is already stored or computed client-side.
- **Guardrails:** the model only **narrates facts computed by our code**. Numbers in the text
  must match the supplied data (post-check, otherwise fall back to the template text). No new
  exercises or plan changes are suggested in Phase 1. Encouraging but not sycophantic (NN/g
  warns about chatbot sycophancy).
- **Cost drivers:** about 2–5k input tokens and 150–250 output tokens, once per session (about 6
  per user per week). This is the most predictable cost item.
- **Success metric:** at least 60% of sessions open the summary, at least 70% 👍, and more
  "ready to progress" suggestions actually followed next session (compare before/after).

#### 1.3 "Why this suggestion?" explanations

- **User value:** every suggestion in Progress ("Ready to add 2.5 kg", "Stalled for 3 weeks")
  gets a plain-English reason and a next step, so the user trusts it and acts on it.
- **UX flow:** tap **Why?** on a suggestion → an inline explanation (2 sentences) plus the 3 data
  points behind it ("Last 2 B days: 15/15/15 at 22.5 kg, RPE not recorded") and an action ("Use
  24 kg next time", which sets the next session's prefilled weight, building on the in-flight
  prefill work).
- **Data it needs:** the suggestion object from the analytics engine (rule id, exercise, recent
  sets), plus the PT rule text from `progress-insights.md` / `strategy.md`.
- **Guardrails:** explanations are **template-first**. An LLM only rephrases a template filled
  with our numbers, or adds context from the PT rule text. Fallback: show the template if the AI
  is off or fails. This feature works with no AI at all, and AI just makes it friendlier.
- **Cost drivers:** about 1–2k input tokens and 80–150 output tokens. Cache the result per
  suggestion id, so it's generated at most once.
- **Success metric:** "Use next time" tap rate on suggestions ≥30% (vs a baseline without "Why").

### Phase 2 — personalised adjustments (the user approves every change)

#### 2.1 Weight / rep recommendation per set

- **User value:** the prefilled value for each set (in-flight prefill uses *last time's* weight)
  becomes the *recommended* load, based on your last
  comparable sessions and the PT progression rules (add 1–2.5 kg upper / 2.5–5 kg lower when all
  reps were hit, otherwise beat the reps).
- **UX flow:** the set row shows `24 kg ↑ suggested` with a ⓘ that opens "why". The user taps ✓
  to accept or edits the value. Rejections are remembered ("you kept 22.5 kg 3 times; I'll
  suggest smaller steps").
- **Data:** history per exercise and `dayKey`, the block method, and catalogue equipment (for
  dumbbell steps of 2 kg vs plate steps of 2.5 kg).
- **Guardrails:** **the recommendation itself is computed by deterministic code** from the PT's
  rules. The AI only explains it and handles edge cases in text. Caps: never more than +5% load
  per session, and never during a planned lighter week (block 8 week 1).
- **Cost:** near zero if rules-based. The AI only runs on "Why?".
- **Success metric:** acceptance rate of suggested loads ≥60%. More progression per block
  (block report card) compared with previous blocks.

#### 2.2 Plateau fixes

- **User value:** when a lift stalls for 3+ weeks (rule already defined), the app offers 2–3
  **PT-approved options**: hold the weight and add a rep, a micro-load, a technique focus, or
  "keep it — a new block starts in N weeks".
- **UX flow:** stall card → "See options" → choose one → it's applied to the next session only →
  confirmation "Applied to next Chest-Back A. Undo".
- **Data:** stall flag, last 4–6 sessions, weeks left in the block.
- **Guardrails:** options come from a **closed list approved by the PT**. The AI ranks them and
  explains the choice and can't invent new interventions. Mid-block it never swaps exercises
  (PT rule).
- **Cost:** about 2–3k in / 200 out, only when a stall happens (rare).
- **Success metric:** at least 50% of stalled lifts improve within 2 weeks of an applied option.

#### 2.3 Swap an exercise for available equipment

- **User value:** "the pec deck is taken" → get 2–3 equivalent alternatives from the catalogue
  (same primary muscle, similar movement and angle), with the starting weight estimated from
  history if available.
- **UX flow:** exercise card "⋯" → **"Swap for today"** → the user picks a reason (busy / not
  available / uncomfortable) → sees the alternatives with "why this one" → **Swap for today
  only** or **Suggest to PT for the plan**. The swapped entry is logged against the substitute
  exercise id (never mixing ids, per the analytics rules).
- **Data:** catalogue (muscles, equipment, movement pattern, angle), the current block day, and
  the user's history for the candidates.
- **Guardrails:** candidates are **filtered by code** from the catalogue (no invented exercises).
  The AI only ranks and explains. "Uncomfortable/pain" shows the medical disclaimer and still
  offers only gentler variants. Permanent plan changes need PT/PO approval.
- **Cost:** about 2–4k in / 200 out per swap. Infrequent.
- **Success metric:** at least 80% of swaps accepted, and no drop in adherence on swap days.

### Phase 3 — generative coaching (human approval in the loop)

#### 3.1 AI-drafted next training block (for PT and PO approval)

- **User value:** at week 5 of a block, the app drafts the next 6-week block based on the
  strategy rotation (volume → strength → pyramid → reverse pyramid), the block report card
  (which lifts progressed or stalled), weekly-sets balance and equipment preferences.
- **UX flow:**
  1. Week 5 card: "Your next block draft is ready for review."
  2. The draft is written in the **same JSON format as `blocks.json`** and validated by
     `scripts/validate-blocks.py`. It is shown as a diff vs the current block ("chest press
     angle 30° → 0°, new: barbell row").
  3. **Approval chain:** the PT agent reviews it (writes to `docs/fitness/drafts/`) → Sebas
     approves → the Tech Lead seeds it. In the app: "Draft → PT reviewed → Approved → Active".
  4. The user can comment on the draft ("I don't have a hack squat").
- **Data:** strategy doc, all approved blocks, catalogue, block report card, weekly-sets history,
  user equipment notes.
- **Guardrails:** output must pass schema validation and catalogue-id checks. It is **never
  auto-activated**. Volume per muscle stays within the PT's 10–20 sets/week range unless the PT
  overrides it.
- **Cost:** large prompts (about 20–40k input, 5–10k output) but only **once per 6 weeks per
  user**. It may need a more capable model tier.
- **Success metric:** PT accepts the draft with ≤5 edits, and the next block's report card is at
  least as good as the previous one.

#### 3.2 Conversational coach

- **User value:** one place to ask anything about *your* training ("Why is Tuesday so long?",
  "I'm travelling next week with only dumbbells", "Am I doing enough for my rear delts?").
- **UX flow:** a "Coach" entry on Today/Progress opens a chat with **context chips** showing what
  it can see ("Block 6 · week 2", "Last 4 weeks of history", "Catalogue"). The user can remove a
  chip to share less. Answers that propose changes render as **action cards** ("Apply: swap
  Wednesday to dumbbell-only version — Review") that go through the Phase 2 approval flows.
- **Data:** a retrieval layer over the catalogue, strategy, blocks and a compact history summary
  (aggregates, not raw rows where possible).
- **Guardrails:** scope classifier (fitness/training only), medical and nutrition-claims refusal,
  no changes without an approval card, a per-user daily message cap, and a conversation retention
  limit (e.g. 30 days, the user can delete).
- **Cost:** the least predictable. About 3–8k input per turn (context + history summary) and
  200–400 output. Usage can spike, so it needs a hard monthly cap and a daily per-user limit.
- **Success metric:** weekly active coach users ≥30% of active users, ≥75% 👍, and most applied
  action cards are kept (not undone).

### Phase summary

| Feature | Phase | User value | Risk | Effort | Cost profile |
|---|---|---|---|---|---|
| Ask about this exercise | 1 | High (in gym) | Low | M | Small per call, user-driven |
| Post-workout summary | 1 | High (motivation) | Low | M | Predictable, ~6/user/week |
| "Why this suggestion?" | 1 | Medium-High (trust) | Very low | S | Tiny, cached |
| Weight/rep recommendation | 2 | Very high | Medium | M | Near zero (rules-based) |
| Plateau fixes | 2 | Medium | Medium | M | Rare |
| Equipment swap | 2 | High (in gym) | Medium | M | Occasional |
| Next-block draft | 3 | High | Higher (needs PT) | L | Large but every 6 weeks |
| Conversational coach | 3 | High | Highest | L | Unpredictable, needs caps |

## 3. Architecture notes for the Tech Lead

These are UX-side requirements, not a design. The Tech Lead owns the decisions.

```
App (React/Capacitor)                          Supabase
  │  POST /functions/v1/ai  (user JWT)            │
  └──────────────────────────────────────► Edge Function "ai-gateway"
                                                  │ 1. verify JWT, AI opt-in flag, rate limit,
                                                  │    monthly spend cap (per user + global)
                                                  │ 2. build grounded context server-side
                                                  │    (catalogue, block, history via RLS-scoped
                                                  │    client using the user's JWT)
                                                  │ 3. call provider adapter ──► OpenAI | Anthropic | …
                                                  │ 4. validate output (schema, numbers, scope)
                                                  │ 5. log usage (tokens, cost, feature, 👍/👎)
                                                  ▼
                                        ai_usage / ai_feedback tables (RLS)
```

- **No API key in the app, ever.** Provider keys live in Supabase secrets. The Edge Function
  forwards the **user's JWT** so database reads stay under RLS (don't read user data with the
  service-role key).
- **Provider-agnostic adapter:** one internal interface (`generate({feature, system, context,
  schema})`) with adapters per vendor. Feature configs choose a model tier (small/fast for Q&A
  and summaries, larger for block drafts). Switching vendors is a config change plus an eval run.
- **Feature-level prompts as versioned files** in the repo (reviewed like code), with a small
  **evaluation set** per feature (e.g. 30 technique questions, 20 sessions) that runs before
  changing the model or prompt. PT reviews the eval answers.
- **Structured outputs:** summaries and suggestions return JSON (bullets with `type`, `exerciseId`,
  `numbers`) that the app renders. Free text only inside fields. This makes number checks and
  fallbacks easy.
- **Caching:** cache by `(feature, inputs hash)`. Summaries are stored with the session, and
  explanations are stored per suggestion id. Use provider prompt caching for the fixed system
  prompt and catalogue excerpts where available.
- **Offline-first:** every AI surface has a non-AI fallback (template text, local numbers). AI
  requests are never queued for later when offline. Show "Available when online" instead.
- **Rate limits and caps:** per user per day (e.g. 30 questions), per feature, a **per-user
  monthly cap**, and a **global monthly budget**. Hitting a cap turns AI features off gracefully
  ("AI coach is resting until the 1st") while the rest of the app keeps working.
- **Privacy:** opt-in toggle in "You" with a plain explanation of what is sent. Only the minimum
  context is sent (no email, no name, no user id — use a pseudonymous request id). Choose
  provider settings that **don't use API data for training** and limit retention (check each
  vendor's current data-usage terms). Users can delete their AI history. A privacy policy update
  is needed before a public launch (already flagged in the auth ADR).
- **Demo mode:** AI either uses canned responses or is disabled, so the demo never spends budget
  or sends data.
- **Observability:** `ai_usage` (feature, model, tokens in/out, latency, cost estimate) and
  `ai_feedback` (👍/👎, optional reason). A weekly cost-per-active-user report for Sebas.

### Provider trade-offs (neutral)

| Dimension | What to compare |
|---|---|
| Quality on our tasks | Run the same eval sets (technique Q&A, summaries, block drafts) on each candidate. Pick per feature, not globally. |
| Cost | Price per million input/output tokens per model tier, prompt-caching discounts, batch pricing for non-urgent jobs (block drafts). See the vendors' pricing pages. |
| Latency | Time to first token for in-gym Q&A (target under 2 s). Streaming support. |
| Structured output | Native JSON-schema / tool-calling reliability. |
| Data policy | Training on API data (default off?), retention period, region, zero-retention options, DPA availability. |
| Ecosystem | Deno/TypeScript SDKs usable in Supabase Edge Functions, rate limits on the account tier. |
| Familiarity | Sebas mentioned ChatGPT. Both major vendors are usable through the same gateway, so this need not be a lock-in decision. |

## 4. Guardrails (all phases)

1. **Grounding:** the context is built server-side from approved content and the user's own
   data. Answers cite the source ("From your PT's tips", "Based on your last 2 B days"). If the
   answer isn't in the sources, say so.
2. **Scope:** training, technique, the plan and progress only. Refuse diet prescriptions,
   supplements, injuries, diagnoses and other topics politely.
3. **No medical advice:** fixed copy reused from the strategy doc ("Any sharp pain … stop and see
   a qualified professional"). Pain keywords trigger it.
4. **User approval:** the AI never writes to the plan or history. It produces *proposals* that the
   user (Phase 2) or the PT and Sebas (Phase 3) approve. Every applied change can be undone.
5. **Numbers come from code:** loads, PRs and percentages are computed deterministically, and the
   LLM narrates them. Output numbers are checked against the inputs.
6. **Privacy and consent:** opt-in, minimum data, pseudonymous, deletable, and explained in one
   screen.
7. **Tone:** concise, factual, encouraging without flattery. No "AI personality" that pretends to
   be human (NN/g: users trust AI that seems smart rather than sentient).
8. **Feedback loop:** 👍/👎 on every answer, a weekly PT review of 👎 answers, and prompt fixes
   through PRs.

## 5. Risks

| Risk | Mitigation |
|---|---|
| Wrong or unsafe technique advice | Grounding in PT tips, medical refusal, eval set reviewed by the PT, 👎 review loop |
| Hallucinated numbers in summaries | Numbers computed in code + post-check + template fallback |
| Cost overrun (especially the chat coach) | Phase order (predictable features first), per-user/day limits, global monthly cap with graceful off-switch, caching |
| Privacy concerns / regulatory | Opt-in, minimal pseudonymous data, vendor no-training settings, privacy policy before public launch |
| Over-reliance / users ignore PT plan | AI explains the plan instead of replacing it. Plan changes go through PT/PO approval |
| Vendor lock-in or outage | Provider-agnostic gateway, per-feature model config, non-AI fallbacks |
| Latency in the gym | Small/fast tier for Q&A, streaming, precomputed summaries while the last set is logged |
| Sycophantic or generic answers | Structured outputs, banned-phrase checks, eval rubric that includes "specific to this user" |

## 6. Decisions for Sebas

1. **Provider:** start with OpenAI (ChatGPT models), Anthropic (Claude), or have the Tech Lead run
   the same small eval on both and recommend one per feature? The gateway keeps it switchable.
2. **Monthly AI budget cap:** what is the most GymStudio should spend on AI per month while it's
   just you (and later per active user)? When the cap is reached, AI features pause and the app
   keeps working without them.
3. **Which phase first:** recommended is **Phase 1** (exercise Q&A + post-workout summary + "why"
   explanations), because it's read-only, low risk and useful in the gym from day one. Or do you
   want to jump to Phase 2 weight recommendations?
4. **Consent and privacy:** AI is opt-in, with a one-screen explanation of what is shared (no
   name or email). OK?
5. **Block drafting (Phase 3):** should AI-drafted blocks always go through the PT agent before
   reaching you, as today's training blocks do? (Recommended: yes.)

## 7. Sources

- WHOOP Coach powered by OpenAI (personalised, conversational coaching on member data; opt-out in settings): <https://www.whoop.com/us/en/press-center/whoop-unveils-the-new-whoop-coach-powered-by-openai/>
- Strava Athlete Intelligence (AI post-activity summaries): <https://www.techradar.com/health-fitness/strava-s-powerful-ai-insights-are-here-athlete-intelligence-is-now-available-in-beta>
- Fitbit Gemini personal health coach ("Ask Coach"): <https://blog.google/products/fitbit/hands-on-personal-health-coach-features/>, <https://9to5google.com/2025/10/27/fitbit-coach-preview/>
- Apple Workout Buddy (Apple Intelligence, in-workout spoken insights incl. strength training): <https://9to5mac.com/2025/06/09/watchos-26/>
- Hevy Trainer (generated programs with built-in progression): <https://www.hevyapp.com/announcing-hevy-trainer/>, <https://help.hevyapp.com/hc/en-us/articles/38385724273047-Hevy-Trainer-Explained-How-It-Builds-Your-Workout-Program>
- Fitbod (algorithmic recommendations, recovery model, progression): <https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout>, <https://fitbod.me/blog/how-fitbods-ai-knows-exactly-when-you-should-lift-heavier-and-when-to-recover/>
- JEFIT AI coach (premium adaptive workouts): <https://apps.apple.com/us/app/workout-tracker-gym-log-exercise-trainer-by-jefit/id449810000>
- Future (human coach + chat, the benchmark for "coach that knows you"): <https://www.livestrong.com/article/13771941-future-personal-training-app-review>
- NN/g, Explainable AI in chat interfaces: <https://www.nngroup.com/articles/explainable-ai/>
- NN/g, Sycophancy in generative-AI chatbots: <https://www.nngroup.com/articles/sycophancy-generative-ai-chatbots/>
- NN/g, Designing AI products and features (study guide): <https://www.nngroup.com/articles/designing-ai-study-guide/>
- NN/g, New users need support with generative-AI tools: <https://www.nngroup.com/articles/new-AI-users-onboarding/>
- Supabase Edge Functions with secrets / AI providers: <https://supabase.com/docs/guides/ai-tools/ai-prompts/edge-functions>, <https://supabase.com/docs/guides/ai/examples/openai>
- Vendor pricing and data-usage pages (to compare, not endorsements): <https://openai.com/api/pricing/>, <https://openai.com/enterprise-privacy/>, <https://www.anthropic.com/pricing>, <https://privacy.anthropic.com/>
