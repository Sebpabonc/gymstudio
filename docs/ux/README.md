# UX & AI improvement (UXer)

UXer is the process-improvement team agent (`.claude/agents/uxer.md`): UX research, design
proposals and AI-first product ideas, based on the current app and external research.

```
Sebas asks  →  UXer researches & proposes (docs/ux/proposals/)  →  Sebas approves
            →  moved to docs/ux/approved/  →  Tech Lead designs (architecture, cost, security)
            →  Issues for Copilot  →  QAer verifies  →  Sebas accepts
```

| Folder | Meaning |
|---|---|
| `proposals/` | UXer drafts — ideas with evidence, impact/effort, risks. Not committed work. |
| `approved/` | Approved by Sebas (date + what was approved). Can become Issues. |

## AI direction (PO, 2026-10-04)
GymStudio should be **AI-heavy**: personalised training powered by an LLM (the PO mentioned
ChatGPT). Guardrails the Tech Lead will enforce for any AI feature:
- The model is called **only from a server-side function** (Supabase Edge Function) — no API key
  in the app; per-user rate limits and spend caps.
- Answers are **grounded** in approved content (catalogue, training blocks, PT strategy) and the
  user's own history; fitness-only scope; **no medical advice**; the user approves any plan change.
- Privacy: send the minimum data needed; explain to the user what is shared; opt-in.
- Provider-agnostic gateway so OpenAI/ChatGPT or Claude can be used or switched.
