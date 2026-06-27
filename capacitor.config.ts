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
      // No branded splash at launch. The launch screen is just the brand
      // background; the app goes straight to the login (or home) page. The
      // branded splash (logo, 1.5s + fade) is shown by the web app AFTER login,
      // on entry to the authenticated area — not at process launch.
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#FAFAF8",
      showSpinner: false
    }
  }
};

export default config;
