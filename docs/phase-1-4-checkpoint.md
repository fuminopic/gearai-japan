# Phase 1-4 技术整理 Checkpoint

本文档记录 YAMAJITAKU / 山支度 当前技术整理基线，方便后续继续开发时快速理解已完成内容、暂停内容、剩余风险和 Codex 工作规则。

## 1. 当前项目状态

- Phase 1-4 completed.
- Phase 5-6 not started / paused.
- Manual production smoke test passed.
- Vercel passed.
- `main` 与 `origin/main` 同步。

## 2. 当前工程基线

- build: pass.
- typecheck: pass.
- lint: pass, 30 warnings / 0 errors.
- test: pass, 241 tests passed.
- Vercel: pass.
- manual smoke test: pass.

## 3. Phase 1 完成内容

- 工程基准稳定化。
- `lint` / `build` / `typecheck` / `test` 流程稳定。
- `.gitignore` 强化。
- 增加 `docs/dev-checklist.md`。
- 防止 `tmp/`、`build/`、`*.patch`、`.DS_Store`、`XcodeDerivedData/` 等误提交。

## 4. Phase 2 完成内容

- 建立 domain type 出口。
- 整理 `gear` / `mountain` / `trip` / `recommendation` / `dashboard` 类型边界。
- 收口 data row types。
- 增加 data error helper。
- 将部分低风险 `select("*")` 改为 explicit select。

## 5. Phase 3 完成内容

- Dashboard HTML 不再被 Service Worker 缓存。
- 建立 scoped localStorage helper。
- `trip-plan-meta` / `checked-slots` / `checklist-only` 支持 user scope / schemaVersion / TTL / legacy fallback。
- Plan / Dashboard / Hero 状态恢复链路更一致。

## 6. Phase 4 完成内容

新增 shared UI primitives:

- `Button`
- `Card`
- `Notice`
- `EmptyState`
- `LoadingBlock`
- `Badge`

已低风险接入:

- `stat-card`
- loading pages
- help page
- recommendation history
- recommendation detail
- ai history

本阶段未拆大组件。

## 7. 当前暂停内容

- 不继续清 lint warnings。
- 不处理 React Hook deps。
- 不替换 `next/image`。
- 不拆 `src/components/trip-planning-ui.tsx`。
- 不拆 `src/components/gear-form.tsx`。
- 不改 `src/lib/plan-checklist.ts`。
- 不改 `src/lib/actions/*`。
- 不改 `src/lib/data/*`。
- 不改 Service Worker。

## 8. 当前剩余 lint warnings

当前 lint 状态:

- 30 warnings / 0 errors.

剩余类型:

- `<img>` / `next/image` warnings.
- `trip-planning-ui` unused / hook deps.
- actions intentional omit.
- requirement engine unused params.
- `plan-checklist` unused internal value.

说明：这些不阻塞当前开发，不建议为了数字强行清零。尤其不要在 release 前为了消除 warning 改 hook deps、图片组件、大组件或核心算法。

## 9. Phase 5 / Phase 6 后续建议

- Phase 5A: TripPlanningUI 拆分前测试补强。
- Phase 5B: GearForm 拆分前测试补强。
- Phase 6A: Image optimization / `next/image`.
- Phase 6B: Hook deps cleanup.
- Phase 6C: Requirement / checklist engine cleanup.
- Phase 6D: Actions fallback payload cleanup.

## 10. 今后 Codex 工作规则

- 每次只做一个小任务。
- 明确允许修改文件。
- 禁止自动大范围重构。
- 不要直接 push。
- 每次必须运行：
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm test`
  - `git status`
- commit 后等待人工确认。
- push 后等待 Vercel 通过。
- 高风险文件必须先补测试再改。

高风险区域:

- `src/components/trip-planning-ui.tsx`
- `src/components/gear-form.tsx`
- `src/lib/plan-checklist.ts`
- `src/lib/actions/*`
- `src/lib/data/*`
- `public/sw.js`
- Supabase / migration / RLS
