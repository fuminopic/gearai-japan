# Development Checklist

Use this checklist before making or committing changes to 山支度 / YAMAJITAKU.

## Before Development

- Run `git status --short --branch` and understand the current worktree.
- Do not start from a dirty worktree unless the existing changes are understood.
- Do not change Supabase schema, OAuth settings, production config, or native iOS packaging without explicit approval.

## Before Commit

- Do not run `git add -A`.
- Stage files intentionally, one logical change at a time.
- Run `git diff --stat` and confirm only intended files are included.
- Run:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
- Do not commit `tmp/`, `build/`, `*.patch`, `.DS_Store`, temporary images, generated reports, or local Xcode derived data.

## Commit Discipline

- Keep each commit small enough to review and roll back independently.
- Mention verification results when reporting the change.
