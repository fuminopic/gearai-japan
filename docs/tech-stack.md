# 山支度技术栈

状态：依据当前仓库文件的只读核对，最后复核：2026-07-18。

版本优先采用 `package-lock.json` 的已锁定版本；括号内为 `package.json` 声明范围。外部平台、运行时和签名状态若仓库未保存，则不作推测。

## 技术栈总览

| 层级 | 技术 | 当前版本或范围 | 用途 | 主要位置 | 影响 |
| --- | --- | --- | --- | --- | --- |
| Web 前端 | Next.js | 15.5.18（`^15.3.0`） | App Router Web 应用、路由与 Server Actions | `app/`、`next.config.mjs` | Web、加载远程站点的 iOS App |
| Web 前端 | React / React DOM | 19.2.6（`^19.0.0`） | 页面与交互组件 | `app/`、`src/components/` | Web、iOS WebView 内容 |
| Web 前端 | TypeScript | 5.9.3（`^5.8.3`） | 严格类型检查 | `tsconfig.json`、`src/`、`app/` | 开发流程、Web |
| UI 与样式 | Tailwind CSS | 3.4.19（`^3.4.17`） | 样式与主题 | `tailwind.config.ts`、`app/globals.css` | Web、iOS WebView 内容 |
| UI 与样式 | PostCSS / Autoprefixer | 8.5.15 / 10.5.0 | Tailwind CSS 构建处理 | `postcss.config.mjs` | Web 构建 |
| UI 与样式 | Lucide React | 0.468.0 | 图标 | `src/components/`、`app/(app)/` | Web、iOS WebView 内容 |
| UI 与样式 | clsx / tailwind-merge | 2.1.1 / 2.6.1 | 组合及合并样式 class | `src/lib/utils/format.ts` | Web、iOS WebView 内容 |
| iOS | Capacitor Core / CLI / iOS | 8.4.1 | Web 应用的 iOS 容器与同步流程 | `capacitor.config.ts`、`ios/`、`package.json` | iOS、开发流程 |
| iOS | Capacitor Browser / Splash Screen | 8.0.3 / 8.0.1 | OAuth 浏览器交互与启动界面 | `capacitor.config.ts`、`ios/App/` | iOS |
| iOS | Swift | 工程设置 `5.0` | 原生 AppDelegate 与 Capacitor 容器 | `ios/App/App/AppDelegate.swift`、`ios/App/App.xcodeproj/project.pbxproj` | iOS |
| 数据库与后端 | Supabase JS / SSR | 2.106.2 / 0.6.1 | 浏览器与服务端会话、业务数据访问 | `src/lib/supabase/`、`src/lib/data/` | Web、iOS WebView 内容、开发流程 |
| 数据库与后端 | PostgreSQL SQL migrations | 数据库版本仓库内无法确认 | 表结构与数据演进 | `supabase/migrations/` | 数据库、开发流程 |
| 数据库与后端 | Authentication / Storage / RLS | 服务版本仓库内无法确认 | 会话、私有装备图片、行级数据权限 | `src/lib/actions/auth.ts`、`supabase/migrations/001_initial_schema.sql`、`supabase/migrations/032_user_gear_private_image_storage.sql` | Web、iOS WebView 内容、数据库 |
| AI | OpenAI Node SDK | 4.104.0（`^4.96.0`） | 对规则引擎结果补充日文说明 | `src/lib/actions/ai.ts` | Web、iOS WebView 内容 |
| 分析 | PostHog JS | 1.400.1（`^1.400.1`） | 客户端事件与身份识别 | `src/lib/analytics.ts` | Web、iOS WebView 内容 |
| 部署与版本管理 | Git / GitHub | Git 版本仓库内无法确认 | 本地版本历史与远程代码托管 | `.git/`、Git remote `origin` | 开发流程、Web 发布 |
| 部署与版本管理 | Vercel | 平台版本仓库内无法确认 | Next.js 项目部署 | `.vercel/project.json`、`docs/auth-launch-architecture.md` | Web、加载远程站点的 iOS App |
| iOS 分发 | Xcode / TestFlight / App Store Connect | 工具与平台版本仓库内无法确认 | 原生 build、测试和商店分发 | `ios/App/App.xcodeproj/`、`docs/auth-launch-architecture.md` | iOS 发布 |
| 开发与质量 | npm | lockfile v3 | 依赖与脚本执行 | `package.json`、`package-lock.json` | 开发流程 |
| 开发与质量 | Node.js 内置测试运行器 | Node 版本仓库内无法确认 | 测试执行 | `package.json`、`tests/*.test.mjs` | 开发流程 |
| 开发与质量 | ESLint / eslint-config-next | 9.39.4 / 15.5.18 | 静态检查 | `eslint.config.mjs`、`package.json` | 开发流程 |

## 已核实的运行边界

- `src/lib/actions/ai.ts` 仅在存在 `OPENAI_API_KEY` 时调用 OpenAI；没有该环境变量时，保留规则引擎输出，不调用 API。
- `capacitor.config.ts` 的 `webDir` 是 `capacitor-www`，iOS 工程的最低部署目标为 iOS 15.0，原生资源变更需要 `npx cap sync ios`、Xcode build 与新的分发流程才进入新二进制。
- `src/lib/supabase/client.ts` 与 `src/lib/supabase/server.ts` 分别建立浏览器和服务端 Supabase 客户端；migration 已为核心表启用 RLS，并为私有装备图片配置 Storage policy。
- `next.config.mjs` 启用 typed routes，并为 `sw.js` 设置即时更新的缓存响应头。

## 仓库内无法确认

- Node.js、Xcode、Vercel、Supabase PostgreSQL 服务与 App Store Connect 的实际运行版本。
- Vercel 当前部署状态、环境变量、运行区域与生产访问权限。
- Supabase 生产数据、schema 的已执行状态、实际 RLS 策略状态与数据库备份。
- iOS 签名、证书、TestFlight build、App Store 审核和已上架版本。

这些信息需在获得相应授权后，通过实际平台或受控发布流程单独核对；不能由本文件推断。
