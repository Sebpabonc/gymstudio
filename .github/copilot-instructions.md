# Copilot instructions — GymStudio

Read and follow `AGENTS.md` at the repository root. It defines your role
(Developer), what you may decide on your own, and when you must escalate.

Essentials:
- Work only from a GitHub Issue; implement what it asks, inside its technical approach.
- Use a branch (`feat/<issue>-<slug>` or `fix/<issue>-<slug>`), never commit to `main`.
- All persistence goes through `src/utils/storage.ts`; no new direct `localStorage` calls.
- Never change an existing exercise `id`.
- Add or update tests (Vitest, `*.test.ts` next to the code). Run `npm test` and `npm run build` before opening the PR.
- Fill in the pull request template, including `Closes #<issue>`.
- If the task requires an architectural, data-model, security or product decision
  not covered by the issue, stop and comment with the `needs-tech-lead` label instead of improvising.
