# 启动 / 登录 架构与模块说明（发版记录）

> 文档状态：**登录/启动专题当前权威**。2026-07-18 已与相关源码重新对照；版本号和发版状态仅是历史记录。全项目授权规则以 [`../AGENTS.md`](../AGENTS.md) 和 [`index.md`](index.md) 为准。
>
> 本文记录「本地登录页 + 远程主应用」这套架构的模块划分、关键信号、各登录流程、关键配置、测试矩阵,以及踩过的坑。**以后再动登录/启动这块,先读这份。**

最后更新:1.0.1 (build 10) 提交审核时。

---

## 1. 整体架构

iOS App 用 Capacitor 打包,但 **`capacitor.config.ts` 已去掉 `server.url`**,所以:

- App 启动**先加载本地打包页** `capacitor-www/index.html`(地址 `capacitor://localhost`)→ **秒开,不联网**。这就是登录页。
- 登录成功后,**导航到远程主应用** `https://www.yamajitaku.com`(Vercel 部署的 Next.js),通过 `allowNavigation` 允许。

**两个域、两套会话存储(关键)**:

| | 本地登录页 | 远程主应用 |
|---|---|---|
| 域 | `capacitor://localhost` | `www.yamajitaku.com` |
| 会话存储 | localStorage(Supabase 客户端) | cookie(@supabase/ssr) |
| `window.Capacitor` | **有**(可调插件,如 Browser) | **无**(allowNavigation 页面不注入桥) |

> ⚠️ 远程页面里 **没有 `window.Capacitor`**。判断“是否在新版 App 本地登录架构内”只能用 `window.name` / `yj_local_app` cookie，不能用 `Capacitor.isNativePlatform()` 或 User-Agent。旧版兼容代码现有的 User-Agent 用途可以保留，但不能扩展为新版检测条件。

---

## 2. 关键信号（标记）

这套系统靠几个跨页面的信号协调,**改动前务必理解每个信号的来源和消费者**:

| 信号 | 谁设置 | 谁读取 | 作用 |
|---|---|---|---|
| `window.name = "yamajitaku-native"` | 本地页加载时 | `app-login-redirect.tsx`(前缀匹配) | 标记「这是新版 App」,跨域跳转后仍保留 |
| `window.name = "yamajitaku-native-splashed"` | `handoff()`(本地已显示 Splash 时) | `splash-screen.tsx`(已删,见下) | 曾用于关远程 Splash;现远程 Splash 已删,此值仅 `app-login-redirect` 前缀匹配仍兼容 |
| `yj_local_app` cookie | `/auth/callback`(当 URL 带 `local=1`) | `login/page.tsx`(服务端) | 新版专属;让远程 `/login` 服务端重定向回本地登录页 |
| URL `local=1` | `handoff()` 跳 `/auth/callback` 时 | `/auth/callback` | 触发种 `yj_local_app` cookie |
| URL `login=1` | 退出/「显示登录」跳回本地时 | 本地页 head 脚本 + 主脚本 | 强制显示登录页(不查 session、不显示 Splash)、清本地 session |
| URL `access_token`/`refresh_token` | OAuth 回跳:AppDelegate 加载本地页时带上 | 本地页 head + 主脚本 | OAuth 回跳:本地 `setSession`(存本地)+ handoff |
| localStorage `sb-*-auth-token` | Supabase 客户端登录后自动存 | 本地页 head 脚本(同步检测) | 重开时自动登录的依据 |

> 🔑 **核心约定:判断「是否新版 App」只认 `window.name` 或 `yj_local_app` cookie,绝不能用 User-Agent**——因为线上**旧版 App 也带 `YamajitakuApp` 这个 UA**,用 UA 会误伤旧版用户(让旧版跳到它没有的本地页 → 卡死)。

---

## 3. 模块划分

每个模块单一职责,模块间只通过「session」和上面的「标记」交互。

| 模块 | 文件 | 职责 |
|---|---|---|
| **M1 启动判定** | `capacitor-www/index.html`(head 脚本) | 冷启动决定:`login=1`→登录页;`access_token`→OAuth 处理;localStorage 有 session→Splash+自动登录;否则→登录页 |
| **M2 邮箱登录** | `index.html`（email 表单 + submit） | `signInWithPassword` → 拿到 session → handoff |
| **M-注册** | `index.html`（signup 表单 + submit） | `signUp` → 有 session 则 handoff;无 session(确认已关→邮箱已注册)则提示去登录 |
| **M3 OAuth 登录** | `index.html` `oauth()` + `ios/App/App/AppDelegate.swift` | `Browser.open`(SFSafariViewController)→ 深链接 → AppDelegate 加载**本地页**(带 token)→ 本地 `setSession` + handoff。**`open` 前先 `Browser.close()` 重置状态** |
| **M4 交接 + Splash** | `index.html` `handoff()` + `#splash` | 显示**唯一**的本地 Splash → 跳 `/auth/callback?...&local=1`。**远程 Splash 已从 layout 删除**,杜绝双 Splash |
| **M5 退出 → 回登录** | `app/auth/callback/route.ts` + `app/(auth)/login/page.tsx` + `src/components/app-login-redirect.tsx` | 退出/会话失效跳 `/login`:有 `yj_local_app` cookie → 服务端重定向 `capacitor://localhost/?login=1`;客户端 `window.name` 兜底 |
| **M6 旧版隔离** | 上述各处的标记判断 | 新版行为只对带标记的新版生效,旧版/网页走原逻辑 |

---

## 4. 各登录流程（端到端）

**邮箱登录(M2→M4):**
本地登录页 → `signInWithPassword` → `handoff()`(显示本地 Splash + `window.name=-splashed`) → 跳 `/auth/callback?local=1` → 远程 `setSession`(cookie)+ 种 `yj_local_app` cookie → `/dashboard`。

**OAuth 登录(M3→M4):**
本地页 `oauth()` → `Browser.close().then(open(SFSafari))` → 用户授权 → `yamajitaku://auth/callback?tokens` → **AppDelegate 把 token 拼成 `capacitor://localhost/?tokens` 加载本地页** → 本地页 `setSession`(存 localStorage,保证重开不重登)→ `handoff()` → `/auth/callback` → `/dashboard`。

**重开自动登录(M1→M4):**
冷启动 → 本地页 head 脚本同步读 localStorage `sb-*-auth-token` → 有则显示 Splash + `handoff()` → `/dashboard`(`getUser` 校验失败则退回登录页并清本地 session)。

**退出账号(M5):**
远程 `signOut`(scope global,吊销 refresh token)→ 跳 `/login` → 服务端检测 `yj_local_app` cookie → `redirect("capacitor://localhost/?login=1")` → 本地页 head 看到 `login=1` → 直接显示登录页(不查 session、不显示 Splash)+ 清本地 session。

---

## 5. 关键配置（改前必看）

**Supabase(后台,改动需谨慎):**
- **Authentication → Sign In/Providers → Email → 「Confirm email」= 关闭**。这样注册即拿到 session、直接进主页。**开启会破坏注册流程**(signUp 无 session → 跳 /dashboard 失败,且确认邮件在手机上体验差)。

**`capacitor.config.ts`:**
- **没有 `server.url`**(启动加载本地 webDir)。
- `allowNavigation: ["yamajitaku.com", "www.yamajitaku.com"]`。
- `backgroundColor: "#FAFAF8"`(启动/跳转间隙底色,非黑)。
- `ios.contentInset: "never"`(edge-to-edge,登录页铺满;安全区交给 CSS `env()`)。
- `plugins.SplashScreen.launchShowDuration: 0`(原生启动屏不撑住;Splash 由 Web 本地页负责)。

**本地页打包资源** `capacitor-www/`:`index.html` + `supabase.js`(UMD)+ `auth-mountain-bg.jpg` + logo。Supabase URL / publishable anon key 直接写在 index.html(都是公开值)。

---

## 6. 部署 / 构建（哪些要 push,哪些要重 build）

App **运行时加载远程站点**,所以:

| 改了什么 | 生效方式 | 影响范围 |
|---|---|---|
| `app/`、`src/`(远程 Next 应用) | `git push` → Vercel 部署 | **新版 + 旧版都受影响**(都加载远程) |
| `capacitor-www/`、`AppDelegate.swift`、`capacitor.config.ts`、storyboard | `npx cap sync ios` → Xcode 重 build → 新 build 号 → 上传 | 只影响**新 build**(打进 App 包) |

> ⚠️ 远程文件只有 push 并完成 Vercel 部署后才会影响用户；每次 push 和部署仍必须获得明确授权，本地修改或提交不自动包含该授权。
> ⚠️ build 号必须比已上传的大且唯一(查 TestFlight/Organizer)。

---

## 7. 回归测试矩阵（每次动登录都跑一遍,真机)

| | 全新登录 | 杀 App 重开 | 退出账号→再登 |
|---|---|---|---|
| **邮箱** | 秒开登录页 → 登录 → 单 Splash → 主页 | 自动进主页、不重登 | 直达本地登录页 → 再登成功 |
| **Google** | OAuth → 有 Splash → 主页 | 自动进主页、不重登 | 直达本地登录页 → 按钮可点 → 再登 |
| **Apple** | 同上 | 同上 | 同上 |

外加:
- 新規登録 → **本地**注册框(不跳远程落地页)→ 新邮箱直接进主页;已注册邮箱提示去登录。
- 启动到登录页之间:无 40 秒白屏、无「splash→白→splash」双 Splash。

---

## 8. 踩过的坑 / 教训

1. **远程页无 `window.Capacitor`** → 判断新版 App 要用 `window.name`(跨域保留)或 `yj_local_app` cookie，不能用 `isNativePlatform()` 或 UA。
2. **不能用 User-Agent 区分新旧版**(旧版同样带 `YamajitakuApp`)→ 用 `window.name` / `yj_local_app` cookie。
3. **远程文件需经授权 push 并部署后才会影响 App**；只完成本地修改时，必须明确报告尚未上线，不能把“生效条件”误写成push授权。
4. **双 Splash「splash→白→splash」反复出现**:根因是「本地 Splash + 远程 Splash」靠脆弱信号协调。最终**删掉远程 Splash**,只留本地一个 → 结构上不可能再双。
5. **OAuth 是一条独立路径**(SFSafari + 原生深链接),曾导致一连串只在 OAuth 出现的问题(没 Splash / 按钮失灵 / 不持久)。最终**让 OAuth 回跳也经过本地页**(AppDelegate 加载 `capacitor://localhost`),和邮箱共用 M4,收口。
6. **Browser 插件「已开着就拒绝再开」**:OAuth 回跳是原生 dismiss Safari,插件状态没清 → 第二次 `open()` 被忽略。**`open` 前先 `close()`**。
7. **跨 scheme 跳转 `https → capacitor://localhost` 可用**(用于退出回本地、OAuth 回跳)。
8. **Supabase「Confirm email」必须关**,否则注册流程断。

---

## 9. 工作方式约定

按模块来:**一次只改一个模块、改完给出验证方式、确认通过再下一个**。模块间只通过 session + 标记交互,不互读内部状态。避免「改一个、碰坏另一个」。
