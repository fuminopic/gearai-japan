# Development Checklist

Document status: **current authority**. The task definition and high-risk gates are in [`codex-task-contract.md`](codex-task-contract.md).

Use this checklist before making or committing changes to 山支度 / YAMAJITAKU.

## Before Development

- Run `git status --short --branch` and understand the current worktree.
- Do not start from a dirty worktree unless the existing changes are understood.
- Classify the task as low, medium, or high risk and record the required parts of the task contract.
- Confirm which actions are authorized: local edit, local commit, push, merge, deploy, and production execution are separate.
- Do not change Supabase schema, OAuth settings, production config, or native iOS packaging without explicit approval.

## Before Commit

- Do not run `git add -A`.
- Stage files intentionally, one logical change at a time.
- Run `git diff --stat` and confirm only intended files are included.
- Match verification to risk:
  - Documentation or copy only: validate links/format, inspect the diff, and search affected wording. No build or full test is required.
  - Normal code or bug fix: run targeted tests plus relevant lint/typecheck; expand when the impact surface requires it.
  - Core rules, auth, database, safety, native, or release: run the full relevant test/build/manual matrix after targeted checks.
- Do not run build and typecheck concurrently when both depend on generated `.next/types` state.
- Do not commit `tmp/`, `build/`, `*.patch`, `.DS_Store`, temporary images, generated reports, or local Xcode derived data.

## Commit Discipline

- Keep each commit small enough to review and roll back independently.
- Mention verification results when reporting the change.
- Report local commit, push, deploy, and production execution as separate states.
