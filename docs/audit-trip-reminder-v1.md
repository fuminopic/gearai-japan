# 审计报告：Trip Reminder V1（本地通知）—— 不改代码

目标：山行出发**前一天 20:00**，用 iOS 本地通知提醒用户确认装备 checklist。
技术方向：`@capacitor/local-notifications`，**不做 server push**。
本文只审计现状与给出方案，**未修改任何代码**。

---

## 结论速览
| 检查项 | 结论 |
| --- | --- |
| 1. 是否 Capacitor iOS App | ✅ 是（Capacitor 8，`ios/` 工程，`appId com.yamajitaku.app`）。插件**尚未安装**。 |
| 2. 通知逻辑接在哪 | 客户端 webview（Next.js 远程站点），**新建** `src/lib/trip-reminder.ts` + 一个客户端挂载点。 |
| 3. create/update/delete 时 schedule/cancel | 推荐**幂等 reconcile**（按 planId 派生固定通知 id）。直接 hook 会碰禁区文件。 |
| 4. 点击通知跳转 | `LocalNotifications` 监听 → 打开 `/plan?id=<planId>&focus=checklist`（路由已支持）。 |
| 5. 是否改 DB schema | ❌ **不用**。`trip_plans.planned_date` 已存在（migration 037）。 |
| 6. 是否影响 Web | ❌ 不影响（全部用 `Capacitor.isNativePlatform()` 守卫，Web 端 no-op）。 |
| 7. 真机测试 | 见第 7 节。**需新原生构建 + App Store 审核。** |
| 8. 给 Codex 的最小指令 | 见第 8 节。 |

> ⚠️ **三个必须让用户先拍板的点**（都属既定禁区/流程）：
> 1. 这**不是纯网页改动**：装插件要 `npx cap sync ios` + Xcode 出新构建 + **App Store 审核**才能上线。
> 2. 装 `@capacitor/local-notifications` 会改 **`package.json`**（禁区）→ 需授权。
> 3. 最干净的接入点在 **`trip-planning-ui.tsx`**（禁区）→ 要么授权小改，要么用第 3 节的 reconcile 绕开。

---

## 1. 当前项目是否已是 Capacitor iOS App
是。`capacitor.config.ts` 中 `appId: com.yamajitaku.app`、`webDir: capacitor-www`、`ios` 段齐全；`ios/App` Xcode 工程存在；已装 `@capacitor/core@8`、`ios`、`browser`、`splash-screen`。
**关键架构**：App 启动本地壳后**导航到远程站点** `www.yamajitaku.com`（在 `server.allowNavigation` 内）。`allowNavigation` 域名**保留 Capacitor 桥**，所以插件 JS 在远程站点里可用——这也意味着**调用插件的 JS 必须打包进 Next.js 远程应用**（不是 `capacitor-www` 那个登录壳）。

## 2. 应该在哪些文件接入通知逻辑
- **新建 `src/lib/trip-reminder.ts`**（客户端工具）：`requestPermission()` / `scheduleTripReminder(planId, plannedDate)` / `cancelTripReminder(planId)` / `reconcileTripReminders(plans)`。全部用 `Capacitor.isNativePlatform()` 守卫，非原生直接 return。插件**动态 `import()`**，避免 SSR/Web 报错。
- **新建 `src/components/trip-reminder-sync.tsx`**（`"use client"`）：挂载时注册「点击通知」监听 + 首次触发权限申请 + 调 reconcile。
- **挂载点**：`app/(app)/layout.tsx`（**不在禁区**）。它是纯副作用组件，Web 端 no-op，风险低。
- **复用现成**：`src/lib/trip-plan-local-meta.ts` 已按 `planId+userId` 存 `plannedDate`（Phase 3）；`social-auth-buttons.tsx` 已有 `Capacitor.isNativePlatform()` 检测范式，照抄即可。
- **不要碰**：`src/lib/actions/trip-plans.ts` 是**服务器 action**（跑在 Vercel，无桥，无法 schedule）；`trip-planning-ui.tsx`、`plan-checklist.ts` 属禁区。

## 3. 创建/更新/删除计划时如何 schedule / cancel
计划的写入发生在**服务器 action**（无桥）和**客户端 `trip-planning-ui.tsx`**（禁区）。为**不碰禁区**，推荐**幂等 reconcile**而非逐事件 hook：
- 通知 id = 由 `planId`(UUID) 派生的稳定 32-bit 整数（`LocalNotifications` 要求整数 id）。
- `reconcileTripReminders(plans)`：对每个「未来 + 有 `planned_date`」的计划，确保存在一条排在 **`planned_date` 前一天 20:00 本地时间**的通知；对 `getPending()` 里已不存在/日期已变的计划通知，`cancel()` 掉。
- **触发时机**：`TripReminderSync` 在 `app/(app)/layout.tsx` 挂载时、以及计划列表变化时跑一次。天然覆盖 create/update/delete（新增→补排，改期→重排，删除→取消），**无需改任何写入代码**。
- 数据来源：reconcile 需要「用户计划列表 + planned_date」。现成可用的是 `trip-plan-local-meta`（客户端已存）。若要覆盖全部计划，需要一个只读的客户端可取列表——**优先用现有 local meta**，不足再评估（不新增 data 层禁区改动）。

> 备选（体验更精准但需授权）：在 `trip-planning-ui.tsx` 保存成功处直接 `scheduleTripReminder(...)`。**因该文件是禁区，须用户显式授权 + 先补测试**。

## 4. 点击通知后如何跳转
- 排程时带 `extra: { planId }`。
- 在 `TripReminderSync` 里 `LocalNotifications.addListener("localNotificationActionPerformed", e => { const id = e.notification.extra?.planId; if (id) router.push('/plan?id='+id+'&focus=checklist') })`。
- 路由**已支持**：`trip-planning-ui.tsx` 读 `searchParams` 的 `id` 与 `focus=checklist`，会定位到该计划的 checklist。**无需新增路由**。
- 监听只在原生注册；确保只注册一次（组件卸载时移除）。

## 5. 是否需要 DB schema 修改
**不需要。** `trip_plans` 已有 `planned_date`（037）、`planned_end_date`（038）。V1 排程信息只存在**设备本地**（`@capacitor/local-notifications` 的 pending 队列 + 现有 localStorage meta），**不写服务器、不动 RLS**。

## 6. 是否影响 Web 端
**不影响。** 所有入口用 `Capacitor.isNativePlatform()` 守卫，Web 端全部 no-op；插件 JS **动态 import**，只在原生执行。`TripReminderSync` 在 Web 上是空副作用。checklist / Dashboard / Hero 逻辑**零改动**。

## 7. iOS 真机测试步骤
1. `npm i @capacitor/local-notifications`（⚠️ 改 `package.json`，禁区，需授权）。
2. `npx cap sync ios`（装 pod、注册插件）。
3. Xcode 里 **bump 版本号/构建号**（本地通知需新原生二进制 → **要走 App Store 审核**才能上线生产）。
4. 真机运行，首次触发**通知权限弹窗**（拒绝路径要不崩、不影响 Web/其他功能）。
5. 造一个 `planned_date = 明天` 的计划；把「前一天 20:00」设成近未来时间验证通知按时弹出。
6. 点击通知 → App 打开到 `/plan?id=...&focus=checklist`。
7. 改期 → 通知重排；删除计划 → 通知取消；同一计划不产生重复通知（验证幂等）。
8. 退登/切换账号 → 不串号（reconcile 用 `userId` scope）。

## 8. 推荐给 Codex 的最小实现指令
> 前置：用户已授权「装 `@capacitor/local-notifications`（改 package.json）」+「本功能需新原生构建 + App Store 审核」。全程遵守 Phase 1-4 规则：一次一小步、跑 build/typecheck/lint/test、不自动 push、不 `git add -A`。

```
Trip Reminder V1（本地通知）最小实现

允许改/新建的文件（仅这些）：
- package.json               仅新增依赖 @capacitor/local-notifications（需授权）
- src/lib/trip-reminder.ts   新建：native-guarded 工具（动态 import 插件）
      requestReminderPermission()
      scheduleTripReminder(planId, plannedDate)   // 前一天 20:00 本地时间；id=hash(planId)
      cancelTripReminder(planId)
      reconcileTripReminders(plans)               // 幂等：补排/重排/取消
- src/components/trip-reminder-sync.tsx  新建："use client"，native-only
      挂载时：注册 localNotificationActionPerformed 监听（点击→router.push
      `/plan?id=${planId}&focus=checklist`）、首次申请权限、调 reconcile
- app/(app)/layout.tsx       仅新增：挂载 <TripReminderSync/>

硬性约束：
- 不做 server push；不改 DB schema / migration / RLS。
- 不改 src/lib/actions/*、src/lib/data/*、plan-checklist.ts、trip-planning-ui.tsx、
  gear-form.tsx、public/sw.js、checklist / Hero / Dashboard 状态逻辑。
- 所有插件调用用 Capacitor.isNativePlatform() 守卫；Web 端必须 no-op。
- 插件用动态 import()，避免 SSR/Web 端加载报错。
- 通知 id 由 planId 派生为稳定整数；带 extra:{planId}。
- 权限申请时机：在 plan 相关操作后触发，不在 App 冷启动打扰用户。

验收：
- Web 端行为零变化，build/typecheck/lint/test 全绿。
- 真机：前一天 20:00 弹通知；点击进对应 checklist；改期重排、删计划取消、不重复。
- 提交后等人工确认；原生部分走 cap sync + Xcode 新构建 + 审核。
```
