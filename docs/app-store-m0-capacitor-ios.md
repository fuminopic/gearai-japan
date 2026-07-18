# App Store M0: Capacitor iOS Shell

> Document status: **historical M0 snapshot**. Current authorization rules are in [`../AGENTS.md`](../AGENTS.md), and current auth/launch architecture is in [`auth-launch-architecture.md`](auth-launch-architecture.md).

## Scope

M0 packages the existing production web app as a Capacitor iOS shell.

- App name: `山支度`
- Bundle ID: `com.yamajitaku.app`
- Remote content: `https://yamajitaku.com`
- Deployment model: Vercel-hosted Next.js web app inside a native iOS WebView

The main app experience does not show a Safari address bar or browser chrome.

## Completed Configuration

- Capacitor 8 added to the project.
- iOS platform generated under `ios/`.
- `capacitor.config.ts` points the native shell to `https://yamajitaku.com`.
- iOS display name is `山支度`.
- iOS bundle identifier is `com.yamajitaku.app`.
- App icon uses the supplied 1024 x 1024 source image.
- Photo library permission text:
  - `装備の写真を選択してアップロードするため`
- Camera permission text:
  - `装備の写真を撮影して登録するため`
- WKWebView back/forward history gesture is enabled.

## OAuth Login Acceptance Notes

The current app uses Supabase OAuth from the existing web app.

- Apple OAuth should be tested in the iOS shell.
- Google OAuth must be tested on a real device because Google may reject embedded WebView OAuth with a disallowed user-agent policy.
- If Google blocks WebView OAuth, M0 needs a small follow-up: open OAuth through an iOS system authentication/browser session and return to the app through a Universal Link or custom URL scheme.

Do not mark OAuth as accepted until Google and Apple login are tested through TestFlight on a real iPhone.

## Splash Screen Proposal

Recommended M0 splash:

- Background: brand green `#14724E`
- Center: 山支度 mountain logo/icon, sized around 34-38% of screen width
- Optional label under icon: `YAMAJITAKU`
- No marketing copy, no subtitle, no decorative gradients

Reason: it is reliable, App Store-safe, and matches the tool-like product direction without adding a new visual concept.

## TestFlight Prerequisites

The local machine currently needs:

- Full Xcode installed and selected with `xcode-select`
- Apple Developer account signed into Xcode
- App Store Connect app record for bundle ID `com.yamajitaku.app`
- Signing Team selected in Xcode
- Archive created from `ios/App/App.xcodeproj`

After those are ready, upload through Xcode Organizer or `xcodebuild`/Transporter.
