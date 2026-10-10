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

## Supplemental review status

`scripts/technical-review.py` validates configured login AND numeric user ID,
GitHub user account type, repository write/maintain/admin permission, author
independence, latest effective review decision, nonempty review evidence and exact
head SHA. App/bot accounts, missing settings, API failures, stale approvals,
dismissals or changes requested fail closed. The configured login and ID must be
verified outside this workflow; matching a user profile does not prove that Claude
performed the review. Nonempty evidence is only a minimum: the actual diff and
validation evidence must be independently assessed.

The workflow executes only trusted default-branch code, never PR code, using a
read token plus status-write permission. It publishes the
`tech-lead/approval` commit status on PR target events, manual request and a
five-minute schedule; schedules can be delayed. This status is **advisory only**.
A status name does not bind its producer to the verified Tech Lead identity, and
this repository has not demonstrated a protection rule that does so. Do not make
this context a required check or treat it as approval unless an administrator
verifies that GitHub binds the required status to the trusted producer. Even then,
it supplements rather than replaces native independent-review protections.

Native protected-branch rules are authoritative: require PRs, dismiss stale
approvals, require approval of the most recent reviewable push by someone other than
its pusher, and require CODEOWNERS review only after a verified independent user is
listed in CODEOWNERS. Require up-to-date branches and CI independently. The status
workflow becomes available only after authentic approval and merge of this bootstrap
change. Until native protections are activated, this repository has no demonstrated
automated merge block; review is manual and the PR stays unmerged.

The gate currently uses the workflow's default `GITHUB_TOKEN`; it does not have or
use reviewer credentials. The collaborator-permission endpoint can reject this
token for insufficient API permissions. That error intentionally yields failure;
do not expand workflow permissions just to make this advisory status pass.

## Activation by an authorized GitHub administrator / Claude operator

1. Use a dedicated GitHub machine-user account (GitHub `User`, not an App bot) as
   reviewer only after an authorized operator independently verifies its ownership,
   account login and numeric ID, repository membership and write access. It must be
   independent of each PR author and use its own authenticated GitHub session to
   submit an actual APPROVED review. The Claude runtime must be explicitly authorized
   to act as that account; a Claude role assignment or GitHub App installation alone
   does not supply that identity or make an App bot an eligible approver.
2. Verify the account through GitHub's user API (`id`, `login`, `type: User`) and
   collaborator permission endpoint. Configure `CLAUDE_REVIEWER_LOGIN` and
   `CLAUDE_REVIEWER_ID` only after both checks and the independent account/runtime
   authorization are confirmed. A 403, 404, missing permission, identity mismatch or
   any API error fails closed. The workflow token currently lacks an explicitly
   granted Administration permission; the gate may therefore remain failing on
   collaborator-permission lookup. Do not add permissions or secrets in this change.
3. Add a real CODEOWNERS entry `* @<verified-machine-user>` only after verification;
   do not commit a placeholder. Enable required code-owner review so another
   account's approval cannot substitute for the designated technical reviewer.
4. Inspect existing rules before activation. Require PRs, at least one approval,
   dismiss stale reviews, require approval of the most recent reviewable push by
   someone other than its pusher, resolve conversations, require up-to-date CI, and
   apply protections to admins without bypass, force-push or deletion. Do not require
   `tech-lead/approval` unless GitHub can be shown to bind the required check to the
   trusted producer; status-name matching alone is not sufficient.
5. Test unsupported bot, same-author, revoked/stale approval, latest push and API
   failure behavior on a disposable PR. Verify actual native merge blocking. Do not
   test by merging to main.
6. Reassign routine reviewer requests from Sebpabonc only after the independent
   machine-user reviewer is verified. Technical review remains Claude's
   responsibility; product decisions remain Sebas's.

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
