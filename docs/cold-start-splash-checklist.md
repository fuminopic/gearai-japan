# iOS 冷启动 / Splash 体验修复 — 执行 Checklist

> 目标:打开 App **0 秒出品牌 Splash**,全程**无白屏、无加载页**,Splash 撑住加载、内容就绪后淡出。
> 架构前提:iOS App 通过 Capacitor `server.url` 直接加载远程 `https://www.yamajitaku.com`,所以 **Web/UI 改动经 Vercel 即时生效、不过审**;只有**原生**改动(Splash 插件 / storyboard / capacitor.config)需要 Xcode 重建 + App Store 重新提交。

## 根因

冷启动(会话过期场景)在第一个像素出现前,要串行跑完:

1. 原生启动屏其实是**空白白屏 + 蓝 X 占位图**(没引用品牌 logo),一闪即消失。
2. WebView 露出**自身白底**,联网拉远程页。
3. 远程页走 `/ → /dashboard → /login` **3 次整页跳转 + 3~4 次 Supabase 鉴权调用**,外加 Vercel 冷启动。
4. 直到 `/login` 渲染,才出第一帧 → 再轮到 Web Splash。

`loading.tsx` / Web Splash 都是「那张还没加载出来的网页」的一部分,**盖不住前面这段白屏**。

## 已完成的改动(本地 commit,未推送)

| commit | 层 | 内容 |
| --- | --- | --- |
| `d9c0b38` | 原生 | LaunchScreen 全屏显示 Splash;`Splash.imageset` 换成品牌 logo + #FAFAF8 米底;capacitor.config 加 SplashScreen 插件(撑住不自动隐藏) |
| `834bb7e` | Web | 新增 `NativeSplashHider`(首屏画出后才 `SplashScreen.hide()`);原生平台关闭 Web Splash 避免双重闪;加 `@capacitor/splash-screen` 依赖 |
| `e002307` | 原生+Web | Splash 安全阈值加固(慢网络不提前露馅 + Web 侧兜底定时器) |
| `5284f28` | Web | 提速 A:入口 `app/page.tsx` 一次鉴权直接落位,未登录冷启动从 3 跳降到 2 跳 |

设计原则:**过审只交付「铁定能盖住启动」的原生地基**(可在 Xcode 真机先验证再提交);**真正可能反复调的「速度」放在 Vercel 免费迭代,不再过审**。

## 部署步骤(顺序很重要)

```bash
cd "<repo>"

# ① 装依赖(更新 package-lock,Vercel 构建必需)
npm install
npm run typecheck      # 应当干净(装好依赖后缺模块报错消失)
npm run build          # 确认 web 构建通过

# ② 提交 lock
git add package-lock.json
git commit -m "Lock @capacitor/splash-screen dependency"

# ③ 推送 → Vercel 自动部署(web 部分,对老版本 App 也安全)
git push origin main

# ④ 同步进 iOS 工程
npx cap sync ios
npx cap open ios
```

**⑤ Xcode 实测**(真机/模拟器):确认「0 秒品牌 Splash → 撑住加载 → 淡出进内容,无白屏无加载页」。
**亲眼确认 OK 后**,再 build number +1 → Archive → 提交审核。

回滚:Web 用 `git revert <commit>` + 重新部署;原生用 `git revert d9c0b38`,或不提交新构建、保留上一个已审版本。

## 保活(打掉 Vercel 冷启动)

零代码、零登录风险。挂免费监控**每 5 分钟 ping**:

```
https://www.yamajitaku.com/login
```

(`/login` 渲染轻、不查 Supabase,正好保活冷路径。)
- Vercel Pro → 可用 Vercel Cron;
- 否则 cron-job.org / UptimeRobot 等免费服务,5 分钟间隔。

## 量数据再决策

部署 + 保活生效后,设备上用 **Safari Web 检查器**量冷启动(分别量「刚用过」和「放置半小时再开」),看时间花在:

- 冷启动 → 保活/Edge 解决
- 鉴权往返(getSession/getUser)→ 提速 C
- 会话过期重新鉴权 → 提速 E(会话时长,属 Supabase 配置,需授权)

**哪块大打哪块**,不盲目堆叠有风险的改动。

## 待评估(尚未动,需逐项确认 / 部分需过审或 Supabase 授权)

- **B 本地秒开入口**:App 开局先加载本地即时页,首屏与网络彻底解耦(收益最大,需过审)。
- **C 精简鉴权往返** / **D Edge + 预热**:动会话刷新内部 / 运行时,**改错可能影响线上登录**,须在预览环境实测登录后再上线。
- **E 延长会话存活**:Supabase 配置,需明确授权。
- **OAuth ③ token 进 URL**:安全加固(deep link 把 access/refresh token 放在 query → 进日志),建议改用 fragment。
