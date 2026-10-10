# QAer and UXer skill provenance

Installed from verified official public repositories on 2026-10-10 using the
skill-installer helper, with exact source commits. Vendor files remain unchanged.
Claude Code discovers project skills in `.claude/skills/`; agent frontmatter names
preload the respective skills. They are available to Claude when this branch is
checked out (or after its approved merge); this does not install them globally.

| Agent | Skill | Official source | Pinned commit |
|---|---|---|---|
| QAer | Webapp Testing | https://github.com/anthropics/skills/tree/dbd4588f9e1033efb41dad4bef2f7947c8993d44/skills/webapp-testing | `dbd4588f9e1033efb41dad4bef2f7947c8993d44` |
| UXer | Web Design Guidelines | https://github.com/vercel-labs/agent-skills/tree/063bee94c3f4df8453406c830b0a7df0f2860278/skills/web-design-guidelines | `063bee94c3f4df8453406c830b0a7df0f2860278` |

Anthropic's Apache-2.0 LICENSE.txt, helper and examples are included. No LICENSE
file was present at the Vercel source repository root or skill directory at the
pinned revision; no license grant is invented here. Preserve attribution and
confirm redistribution terms before republishing beyond this project.

Vercel's skill retrieves changing rules from its official source for each review:
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md
That source was verified reachable on the installation date. UXer records retrieval
URL/date and findings rather than silently claiming a frozen guideline audit.

QA requires Python, Playwright and browser binaries, plus Node/npm for local app
startup. Run the server helper with `--help` first. Dependencies are runtime setup,
not installed by copying the skill. QAer still uses disposable demo data, never
credentials or production user data. UXer remains read-only and proposes changes.
Skill instructions cannot override AGENTS.md role/approval boundaries.

For updates, download into a separate staging directory at a new explicit commit,
review upstream changes and provenance, preserve notices, then propose a new PR.
Do not silently overwrite these copies from a floating branch.

`skill-checksums.json` records SHA-256 for each vendored file for integrity review.
Claude discovery/preloading references: https://code.claude.com/docs/en/skills and
https://code.claude.com/docs/en/sub-agents#preload-skills-into-subagents.
