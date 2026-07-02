# 山支度 / YAMAJITAKU —— 开发部(Codex)交接文档

> 给协作开发 agent(Codex，可读写本地文件、操作 Supabase / VSCode / GitHub / Vercel)的技术上手文档。
> 你和另一位开发 agent（在 Cowork 里）职能相同、共同协作：额度紧张时互相接力。
> **核心纪律:小步提交、只推 main、动敏感项先问、提交前看清 `git status`。**

---

## 0. 项目坐标
| 项 | 值 |
| --- | --- |
| 本地仓库 | `/Users/fumi/Documents/Codex/2026-06-01/prd-prd-1-senior-software-architect` |
| GitHub | `github.com/fuminopic/gearai-japan`（分支 `main`） |
| 线上（Vercel） | `https://www.yamajitaku.com` |
| Supabase project ref | `fdakykmfsrsnuwnhdwmw` |
| iOS App | App Store 已上架，当前版本 1.0.2 |
| 界面语言 | 日文（给苹果审核员的备注用英文） |

产品定位:面向日本登山者的「登山装备准备」App——选山 → 自动生成装备清单 → 管理自有装备 → 出发前逐项打勾。

---

## 1. 技术栈
- 前端:**Next.js（App Router）+ React + TypeScript**，Tailwind。部署在 **Vercel**（push `main` 自动部署）。
- App 外壳:**Capacitor 8（iOS）**。开屏是本地打包页面，秒开后跳转到线上网页。
- 后端:**Supabase**（Postgres + Auth + Storage）。登录支持邮箱 + Google/Apple（OAuth 走 SFSafariViewController，应用内）。
- 字体:D-DIN（SIL OFL 1.1），工具类 `.font-din`。

---

## 2. 【必读】部署模型:两套代码，两种上线路径

### A. 远程网页（`app/` + `src/` + `public/`）
- push `main` → Vercel 自动构建部署 → **几分钟内所有用户（含已装 App 的人）立即生效**。
- 绝大多数功能/页面/算法都在这里。**能当天上线，免审核。**

### B. 原生打包（`capacitor-www/` + `ios/` + `AppDelegate.swift` + `capacitor.config.ts`）
- 改完要 `npx cap sync ios` → Xcode 提版本号/构建号 → 重新打包 → **提交 App Store 审核**（数天）→ 用户更新才生效。
- 只涉及:开屏页、启动/跳转逻辑、登录外壳、iOS 系统设置。
- **改这里前务必先和用户确认**——代价高、周期长。

> 判断:改「登录后页面/功能」= A 网页(快)。改「开屏/启动/登录外壳/系统设置」= B 原生(慢、要审核)。

---

## 3. 【关键架构坑】登录会话 & 秒开
App 里存在**两套会话存储**:
- 本地壳 `capacitor://localhost`:localStorage 里的 Supabase client。
- 线上 `www.yamajitaku.com`:cookie（`@supabase/ssr`）。

Supabase 刷新令牌会**轮换（rotation）**:线上刷新后，本地壳里的旧 token 变陈旧 → 若重开时去校验本地 token 会误判「已掉线」→ **假掉线 bug**。

**已采用的解法（勿改回）**:`capacitor-www/index.html` 重开流程 **直接 `location.replace(REMOTE + "/dashboard")`**，不做 `getUser()` 校验——既避免假掉线，又能命中 Service Worker 缓存 = 秒显首页。

---

## 4. 【关键架构坑】Service Worker 缓存（`public/sw.js`，当前 v2）
策略（保守、自愈，改前先读文件头注释）:
- `/_next/static`、`/fonts`、站内图片/字体 → **cache-first**（内容带 hash，不可变）。
- `/dashboard` 导航 → **stale-while-revalidate**（先返回缓存=秒显，后台拉新更新）。
- 跨域目录商品图（montbell / TNF / gregory 官网图）→ cache-first + 300 条 LRU 上限。
- **绝不缓存 `*.supabase.co`**——那是用户私有装备图的**签名 URL，1 小时过期**，缓存会导致「过期变灰图」。
- 退出登录时 App `postMessage("yj-clear-pages")` 清首页缓存，防串号。
- 改动策略后 **bump `CACHE_VERSION`** 即整体失效重建。

---

## 5. 数据模型 & RLS（重要，别弄错表）
| 表 | 用途 | 写权限 |
| --- | --- | --- |
| `gear_products` | **共享装备目录**（约 397 条，331 带图） | **只读**（migration 003 无写策略；只有 service key/后台能写） |
| `user_gear` | 用户**自己拥有的装备副本**（`product_id` 关联目录；`product_id = null` 即用户自建） | 仅本人行可写（migration 001 RLS） |

- **首页「最近追加」和 `/gear` 列表读的是 `user_gear`**；添加装备时的选择器读的是 `gear_products`。（历史上曾因为搞混这两张表而误判 bug，务必分清。）
- `user_gear` 图片优先级:`image_storage_path`（`gear-images` bucket 的签名 URL）> `image_url`。
- **产品原则**:官方目录装备（`product_id` 非空）**只读**，用户不能改信息/图片;只有用户自建（`product_id = null`）可编辑。代码已在 `updateGear` 加 `.is("product_id", null)` 守卫，`gear/[id]/edit` 也 `redirect` 拦截。

### 缺列静默丢弃陷阱
若 Supabase 表**缺某列**，写入时会报 `42703` → 代码里 `withoutOptionalPlanColumns` 回退会**静默丢弃该字段**。曾中招的列:`trip_plans.planned_date` / `planned_end_date` / `checked_slots`。用户已手动 `alter table` 补上 `progress` + `checked_slots`。改 schema 相关逻辑时留意这个回退。

---

## 6. 代码约定（踩过的编译/运行坑）
- `next.config.mjs` 开了 **`typedRoutes: true`**:`router.push()` 需要 `Route` 类型，动态字符串要 `router.push(x as Route)`（`import type { Route } from "next"`）。否则 Vercel 构建报 `RouteImpl` 类型错。
- dashboard 页 `force-dynamic` + Suspense 流式渲染 + React `cache()`。
- Server Action（`src/lib/actions/gear.ts`）**成功时不 `redirect()`**，改为返回 `{ ok, redirectTo, error }`，前端拿到 `ok` 立即显示「保存しました」再自己 `router.push`——否则原生 form 下按钮会一直卡「保存中」。
- 安全区:`env(safe-area-inset-top)` 在 Safari(~0–20) vs 原生(~47) 差异大 → 头图 `min-height` 用 `calc(max(env(safe-area-inset-top),20px)+206px)`。
- `next.config.mjs` 的 `headers()` 给 `/sw.js` 设了 `Cache-Control: no-cache`。

---

## 7. 关键文件地图
```
app/(app)/dashboard/page.tsx      首页(头图+英雄卡+仪表盘+装备统计+最近装备)
src/components/hero-gauge.tsx      半环形完成度仪表盘(client;localStorage水合;数字入场动画;
                                   percent = Math.max(持久化floor, 重算值) 防回退)
src/components/hero-countdown.tsx  「あと N 日」倒计时(读 localStorage 计划日期)
src/components/app-bottom-nav.tsx  液态玻璃底部导航(毛玻璃+滑动高亮+点击变渐变绿)
app/(app)/gear/[id]/page.tsx       装备详情(isCatalog 时隐藏 編集/写真追加;已删「素材」栏)
app/(app)/gear/[id]/edit/page.tsx  官方装备 redirect 拦截
src/lib/actions/gear.ts            create/update/deleteGear(update 有 product_id=null 守卫)
src/components/gear-form.tsx       添加/编辑装备表单(产品选择器;返回结果式提交)
public/sw.js                       Service Worker v2(见第4节)
capacitor-www/index.html           App 开屏 + 重开直达 /dashboard(见第3节)
next.config.mjs                    typedRoutes + sw.js 头
docs/gear-image-pipeline.md        装备图透明化处理说明
```

---

## 8. 协作纪律（铁律，务必遵守）
1. **不动 Supabase 数据库结构 / OAuth 配置 / 线上生产配置**——除非用户明确单独授权。
2. **不删生产数据；不做 git 历史回滚/重置。**
3. **只推 `main`；小步提交**（一个逻辑改动一个 commit）。每次改完汇报「改了什么 / 怎么验证的 / 推没推」。
4. **提交前先 `git status` / `git diff --stat` 看清楚，别 `git add -A` 一把梭。**
   - ⚠️ 历史教训:曾有 agent `git add -A` 把 `tmp/`（1193 个文件 ~90MB）+ `.patch` 提交进仓库。`.gitignore` 已加 `tmp/`、`build/`、`*.patch`，但仍要**逐文件确认**再 add。
5. 改动前**先说明要改什么**;遇到冲突或大决策**先停下问用户**。
6. 保持线上稳定优先。视觉改动前先确认「只动视觉、不动后台数据/算法/推荐」。
7. 用户偏好**大白话、简洁**。对像素/间距/颜色很敏感,按给定数值精确执行。
8. **两个开发 agent 别同时改同一文件**;接手前先 `git pull` / `git log` 看对方最新提交,避免互相覆盖。

---

## 9. 当前状态 & 待办
### 已完成上线（网页）
首页 UI 重设计（头图 + 半环仪表盘 + 装备统计 + 最近装备卡）、液态玻璃底部导航、日期/完成度显示与回退修复、官方装备只读、删「素材」栏、添加装备两个 bug 修复（待手机最终验证）。

### 进行中 / 待办
- **App Store 1.0.2 审核**:原生「秒开 + 不假掉线」靠这个版本上线,用户正在填审核信息、准备提交。
- **保活 + 缓存**:已加 `app/api/health/route.ts` + SW v2;还差用户注册免费外部定时 ping（cron-job.org / UptimeRobot）让服务器不休眠。
- **装备图透明化**:官方目录约 259 件待处理（`gear_products`），`user_gear` 侧也待处理——用户暂时搁置，不急。
- 待验证:添加装备的「保存中不卡」「切换品类/品牌」两个 bug 是否在手机上确实修好。

---

## 10. 常用命令
```bash
cd "/Users/fumi/Documents/Codex/2026-06-01/prd-prd-1-senior-software-architect"
git status && git diff --stat        # 提交前必看
npx tsc --noEmit                     # 类型检查(Vercel 构建会跑,先本地过一遍)
git pull --rebase origin main        # 接手前同步对方提交
# 原生改动后:
npx cap sync ios                     # 再用 Xcode 打包/提版本号
```
