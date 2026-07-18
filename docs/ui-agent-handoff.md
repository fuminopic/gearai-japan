# 山支度 / YAMAJITAKU —— UI 设计交接文档（给 fable5）

> 文档状态：**历史UI任务交接快照**。其中测试数量、Tier计划和禁区是当时任务范围，不是所有UI任务的永久规则。当前规则见 [`../AGENTS.md`](../AGENTS.md) 与 [`index.md`](index.md)。
>
> 你(fable5)接手本项目的 **UI / 视觉设计** 工作。你能读取仓库、改代码、跑构建。
> **你的职责边界:只做「展示层」——容器 / 卡片 / 按钮 / 徽章 / 空状态 / 间距 / 配色 / 文案样式。**
> 不碰数据、状态、算法、后端、原生配置(下面有明确禁区清单)。
> **上手第一步:先读 `docs/phase-1-4-checkpoint.md`,再动任何代码。**

---

## 0. 项目坐标
| 项 | 值 |
| --- | --- |
| 本地仓库 | `/Users/fumi/Documents/Codex/2026-06-01/prd-prd-1-senior-software-architect` |
| GitHub | `github.com/fuminopic/gearai-japan`（分支 `main`） |
| 线上 | `https://www.yamajitaku.com`（Vercel，经明确授权 push `main` 后自动部署） |
| 技术栈 | Next.js(App Router) + React + TypeScript + Tailwind |
| 界面语言 | **日文**（所有面向用户的文案一律日文） |
| 产品 | 面向日本登山者的装备准备 App:选山 → 自动生成清单 → 管理装备 → 出发前打勾 |

**上线速度**:改「登录后页面」= 网页,push 后几分钟全员生效、免审核。（开屏/启动/登录外壳/iOS 设置属原生,要审核——但那些**不是你的范围**。）

---

## 1. 当前工程基线（Phase 1-4 已完成，勿破坏）
- build ✅ / typecheck ✅ / lint ✅（**30 warnings，0 errors**）/ test ✅（**241 passed**）/ Vercel ✅。
- 这 30 条 warnings 是**有意保留**的良性项（`<img>`/`next/image`、hook deps 等），**不要为了清零去动图片组件、hook deps、大组件或核心算法**。
- `main` 与 `origin/main` 同步。接手前务必先 `git pull --ff-only` 同步。

---

## 2. 现有 UI 设计系统（你要基于它做，不要另起炉灶）

### 共享 primitives（在 `src/components/ui/`，用 `@/components/ui` 统一导入）
`Button` / `Card` / `Notice` / `EmptyState` / `LoadingBlock` / `Badge`
- 已接入:`ai/history`、`help`、loading pages、`recommendation-detail`、`recommendation-history-list`、`stat-card`。
- **新页面优先复用这 6 个**,保持全站视觉一致;确有缺口再考虑新增 primitive（新增前先说明理由）。

### 已定型的视觉规范（首页已按此实现，改动需与之协调）
- 字体:**D-DIN**（SIL OFL 1.1），工具类 `.font-din`（数字/度量场景用）。
- 首页头图:顶部绿色渐变;安全区用 `calc(max(env(safe-area-inset-top),20px)+206px)`（Safari 与原生的安全区差异已在此吸收，别改这个公式）。
- 完成度仪表盘:半环形，绿色渐变 `#1F7950 → #81AB44`，数字入场动画（浅灰→黑）。
- 底部导航:苹果「液态玻璃」质感（毛玻璃 + 滑动高亮 + 点击后图标变渐变绿）。
- 绿色主色系参考:`#4E914A`（按钮）、`forest-700`（强调文字/链接）。

> 注意:仪表盘、底部导航、首页头图这些**已经做好且含状态/恢复逻辑**，属于下面的禁区，**不要重构**；如需微调视觉，先和用户确认再单独立项。

---

## 3. 【硬性禁区】绝对不要触碰的文件 / 逻辑
即使是为了「视觉好看」也不行。要动其中任何一个，**先停下问用户**：
- `src/components/trip-planning-ui.tsx`
- `src/components/gear-form.tsx`
- `src/lib/plan-checklist.ts`
- `src/lib/actions/*`
- `src/lib/data/*`
- `public/sw.js`
- Supabase / RLS / migration
- auth / OAuth / callback（含 `login` / `signup` 页面）
- localStorage / cache / Service Worker
- checklist / Dashboard / Hero 的**状态恢复逻辑**
- `package.json` / eslint 配置 / tsconfig
- iOS / Capacitor 配置

**衍生含义**:`app/(app)/dashboard`、`app/(app)/plan`、`gear/new`、`gear/[id]/edit`、`login`、`signup` 这些页面因为绑定了上面的禁区逻辑，**本轮 UI 工作不动**。

---

## 4. UI 整改计划（安全推进顺序）

**原则**:只在「展示层页面」推广既有 primitives、统一视觉。每步**一个文件**、可验证、可回退。只替换展示层，不动 props 契约、数据获取、form action、任何 state/effect。

**Tier A — 最低风险（纯静态/展示，优先）**
1. `app/privacy/page.tsx`、`app/terms/page.tsx` — 法务静态页，套 `Card` 统一排版。
2. `app/(app)/profile/insurance/page.tsx` — `Card`/`Badge`/`Notice`。
3. `app/(app)/admin/data-quality/page.tsx` — `Card`/`Badge`/`EmptyState`。

**Tier B — 低风险（读取展示为主，改前逐个确认无状态）**
4. `app/(app)/profile/page.tsx` — 资料展示 → `Card`/`Badge`。
5. `app/(app)/gear/[id]/page.tsx` — 本地 `SummaryPill/DetailRow/InfoCard` 归一到 `Card`/`Badge`；**不动** `deleteGear` 表单与 `isCatalog` 只读判定。
6. `app/(app)/gear/page.tsx`（+ `gear-list.tsx`）— 列表卡片 → `Card`/`Badge`/`EmptyState`；只动纯展示部分。
7. `app/(app)/ai/page.tsx` — 只改**页面外壳**（标题/说明/容器）；**不动** `ai-recommendation-form` 内部逻辑。

**Tier C — 暂缓（含表单/敏感面，不在本计划内）**
`profile/edit`、`profile/password`（表单）、`login`/`signup`（auth 禁区）。需要时单独立项 + 先补测试。

---

## 5. 工作纪律（每一步都要遵守）
1. **一次只做一个文件的一个小改动**；禁止自动大范围重构。
2. 改前**声明本步改哪个文件、要做什么视觉变化**。
3. 每步必须跑并全绿：
   ```
   npm run build && npm run typecheck && npm run lint && npm test
   git status && git diff --stat
   ```
4. 只做**纯展示**改动，**行为零变化**；不改 props/数据/表单逻辑/状态。
5. 单文件**小 commit**；**不要自己 push**；commit 后**等用户人工确认**，由用户决定何时 push、push 后看 Vercel。
6. **提交前逐文件确认再 `git add`**，禁止 `git add -A`（历史上曾误提交 `tmp/` 90MB）。
7. lint warnings **不追求归零**；不碰 `next/image`、hook deps、大组件、核心算法。
8. 与另一位开发 agent 协作时：接手前 `git pull` 看对方最新提交，**别同时改同一文件**。

---

## 6. 上手清单（按顺序）
```bash
cd "/Users/fumi/Documents/Codex/2026-06-01/prd-prd-1-senior-software-architect"
git fetch origin && git checkout main && git pull --ff-only
git status
cat docs/phase-1-4-checkpoint.md      # 必读:基线、暂停项、禁区、规则
cat docs/dev-checklist.md             # 开发前检查清单
ls src/components/ui                  # 看现有 primitives
```
读完 checkpoint 后，从 Tier A 第 1 项开始，一次一个文件推进。**任何涉及第 3 节禁区的需求，先问用户，不要自作主张。**
