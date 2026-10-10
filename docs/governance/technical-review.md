# Technical review and activation

## Operating model

Sebas is Domain Lead (product/domain acceptance); Mate is Crew Lead (coordination,
evidence and blockers); Claude Code is Tech Lead (design and independent technical
review); Copilot is Developer. Existing PT, UX and marketing product approvals remain.
The Domain Lead must not be the routine technical PR reviewer.

Technical approval is an actual GitHub APPROVED review of the current head SHA,
with findings and validation evidence, submitted by an independently authenticated,
verified authorized identity. A role name or comment does not establish the reviewer.
No self-approval, fabricated reviews, owner-identity impersonation or auto-merge.
If Claude implements a PR, it needs another authorized independent technical reviewer;
the supplied single-reviewer gate intentionally blocks until that arrangement exists.

## Observed access (2026-10-10)

- Main snapshot: `e6ec459b2a9cc510489c166494ee6564e0107394`.
- Connector identity: `Sebpabonc`, numeric ID `329340881` (Domain Lead).
- Repository metadata advertises admin/push rights, but the integration returns
  403 `Resource not accessible by integration` for branch protection reads,
  issue creation and branch creation. Advertised rights do not prove token scopes.
- Rulesets endpoint returned an empty list. Classic branch protection is unknown;
  do not claim main is protected based only on README text.
- Existing workflows: CI/verify (catalogue, blocks, types, Vitest, Vite build),
  and Pages deployment on pushes to main. No Claude review workflow or CODEOWNERS
  is present in the inspected snapshot. Claude Code CLI is absent on this host.
- No separate Claude login, numeric identity, reviewer permission or active Claude
  authorization has been verified. No approval was submitted by this work.
- Some open Copilot PRs request Sebpabonc as reviewer. Do not remove the only pending
  reviewer until a verified replacement exists; then Mate handles reassignment.

## Gate provided in this branch

`scripts/technical-review.py` validates configured login AND numeric user ID,
repository write/maintain/admin permission, author independence, latest effective
review decision, nonempty review evidence and exact head SHA. Missing settings,
API failures, stale approval, dismissal or changes requested produce failure.
It paginates reviews and PRs. It creates `tech-lead/approval` commit statuses.
It cannot prove that an account ran Claude: the account/app connection must first
be independently verified and its credentials restricted to the review process.
Nonempty evidence is only a minimum: Claude must actually assess it.

The workflow executes only trusted default-branch code, never PR code, using a
read token plus status-write permission. It runs on PR target events, manual
request and a five-minute schedule to refresh approvals/dismissals. GitHub schedules
can be delayed. This supplemental status is NOT a replacement for native required
reviews: native review protection must block revoked approval immediately. Require
strict/up-to-date CI so shared head-SHA status cannot replace PR-specific review.
The workflow becomes available only after authentic approval and merge of this
bootstrap change. Until then review is manual and the PR stays unmerged.

## Activation by an authorized GitHub administrator / Claude operator

1. Connect Claude Code with the official GitHub App or a dedicated review identity.
   Verify the installed app/account, repository scope and authenticated numeric ID;
   verify write access and ability to submit a real APPROVED review independent of
   the PR author. Standard action comments alone are not approvals. Never reuse
   Sebpabonc's identity or put secrets in this repository.
2. Configure repository variables `CLAUDE_REVIEWER_LOGIN` and `CLAUDE_REVIEWER_ID`
   only with the verified reviewer login and numeric ID. Keep them unset until verified.
   An admin-scoped connection is needed to inspect/edit protection and variables;
   Claude runtime authorization/API credentials may be required separately.
3. Add a real CODEOWNERS entry `* @<verified-login>` only after permission verification.
   Do not commit that placeholder. Enable required code-owner review so another
   account's approval cannot substitute for the designated technical reviewer.
4. Protect main: PR required, >=1 approval, dismiss stale reviews, last push approved
   by someone other than its pusher, all conversations resolved, required `verify`
   and `tech-lead/approval` checks with strict/up-to-date checks. Apply to admins,
   no bypass, no force pushes or deletion. Restrict status producer to the expected
   GitHub App where supported. Preserve existing protections; inspect before editing.
5. Test missing configuration, approval, dismissal and new-commit behavior on a
   disposable PR. Verify actual GitHub merge blocking. Do not test by merging to main.
6. Reassign routine reviewer requests from Sebpabonc to the verified Claude identity.
   Technical review remains Claude's responsibility; product decisions remain Sebas's.

Protection changes are repository settings, not activated by merging a documentation
PR. This branch intentionally does not invent CODEOWNERS identities, credentials,
a Claude action secret or an automatic APPROVE step. No production migration or
application deployment is authorized by installing these instructions.

## Official references

- Claude Code connection/setup: https://code.claude.com/docs/en/github-actions
- GitHub protection: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- Skill provenance: `docs/governance/skills.md`.

## Connection update (2026-10-10)

The user installed ChatGPT Codex Connector on Sebpabonc, installation 169841101,
with selected repository access. Branch creation and issue #287 creation now succeed.
The earlier 403 observations above are historical; publication access is resolved.
Independent Claude review identity and native protection activation remain unverified.
