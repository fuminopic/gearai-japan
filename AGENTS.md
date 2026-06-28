# AGENTS.md — 给 AI 助手 / codex 的工作指令

## 动登录 / 启动 / OAuth / Splash 之前,先读这个

**`docs/auth-launch-architecture.md`** —— 这套「本地登录页 + 远程主应用」架构的模块划分、关键信号、登录流程、配置、踩过的坑。**改这块前必读,否则极易「改一个、碰坏另一个」。**

## 工作方式（重要）

- **按模块来**:一次只改一个模块,改完给出验证方式,确认通过再下一个。模块间只通过 session + 标记交互,不互读内部状态。
- **不确定就先在源码层面确认,不要瞎猜**(改不可测的原生/远程时尤其)。

## 几条绝不能违反的规则

1. **判断「是否在新版 App 内」只用 `window.name`(前缀 `yamajitaku-native`)或 `yj_local_app` cookie,绝不能用 User-Agent**——线上旧版 App 也带 `YamajitakuApp` UA,用 UA 会让旧版用户登录卡死。
2. **改了 `app/` 或 `src/`(远程 Next 应用)必须 `git push`**——App 运行时加载远程站点,不 push 等于没生效。
3. **改了 `capacitor-www/`、`AppDelegate.swift`、`capacitor.config.ts`、storyboard → 需 `npx cap sync ios` + Xcode 重 build + 新 build 号**(只影响新二进制)。
4. **Splash 只保留本地页那一个**(`capacitor-www/index.html` 的 `#splash`)。远程 layout 里不要再加 SplashScreen,否则「splash→白→splash」双 Splash 会回来。
5. **Supabase 的「Confirm email」保持关闭**,否则注册流程会断。
6. 不要擅自改 Supabase 数据结构 / OAuth 配置 / Vercel 生产配置,需先确认。

## 部署

- 远程(`app/`、`src/`)→ `git push` → Vercel 自动部署。
- 本地包(`capacitor-www/` 等)→ `npx cap sync ios` → Xcode Archive → 上传(build 号要比已上传的大且唯一)。
