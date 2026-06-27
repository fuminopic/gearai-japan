import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yamajitaku.app",
  appName: "山支度",
  webDir: "capacitor-www",
  // Brand background for the webview/window so the cold-launch gap before the
  // first paint is the brand cream colour, never a black or white flash.
  backgroundColor: "#FAFAF8",
  server: {
    url: "https://www.yamajitaku.com",
    allowNavigation: ["yamajitaku.com", "www.yamajitaku.com"],
    cleartext: false
  },
  appendUserAgent: "YamajitakuApp",
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  },
  plugins: {
    SplashScreen: {
      // Hold the native splash until the web app signals first paint
      // (SplashScreen.hide()), so the remote page load never shows a blank
      // webview. launchShowDuration is only a backstop in case the web bundle
      // never loads (e.g. fully offline). It is deliberately generous so a slow
      // network never prematurely reveals a half-loaded page — the web layer
      // hides it far sooner on any working connection.
      launchShowDuration: 20000,
      launchAutoHide: true,
      launchFadeOutDuration: 300,
      backgroundColor: "#FAFAF8",
      showSpinner: false,
      // iOS shows the LaunchScreen storyboard (configured to display the
      // "Splash" image full-screen) — no iOS-specific resource name needed.
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
