# Fitness knowledge

Fitness-domain content (technique, posture tips, muscles, safety) follows an approval
flow. Nothing here reaches the app without going through these steps:

```
PT / Fitness Expert  →  drafts/  →  Tech Lead approves  →  approved/  →  Tech Lead designs  →  Copilot implements
```

| Folder | Who writes | Meaning |
|---|---|---|
| `drafts/` | PT agent (`.claude/agents/pt-fitness-expert.md`) | Proposal. **Not true for the app.** |
| `approved/` | Tech Lead, after its review (PO 2026-11-15: approvals go through the crew, not to Sebas) | Approved knowledge; can become an Issue or a database seed. |

- The exercise catalogue lives in `approved/catalogue-v2/*.json` and follows
  [catalogue-v2-spec.md](catalogue-v2-spec.md). CI validates it with `scripts/validate-catalogue.py`.
- Other documents use [TEMPLATE.md](TEMPLATE.md). When approved, a document moves to
  `approved/`, its status becomes `approved`, and who approved it and when is recorded.
- All content is written in **English** (the app is English-only).
