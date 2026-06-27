import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yamajitaku.app",
  appName: "山支度",
  webDir: "capacitor-www",
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
      // webview. launchShowDuration is only a safety net in case the web
      // bundle never loads (e.g. offline) — it auto-hides after 10s.
      launchShowDuration: 10000,
      launchAutoHide: true,
      backgroundColor: "#FAFAF8",
      showSpinner: false,
      iosSplashResourceName: "Splash",
      splashFullScreen: true,
      splashImmersive: false
    }
  }
};

export default config;
