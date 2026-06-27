import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yamajitaku.app",
  appName: "山支度",
  webDir: "capacitor-www",
  // The app now boots the bundled local login page (capacitor-www) instantly,
  // instead of loading the remote site first. The login page navigates to the
  // remote app (allowNavigation) after authentication. White launch background.
  backgroundColor: "#ffffff",
  server: {
    allowNavigation: ["yamajitaku.com", "www.yamajitaku.com"],
    cleartext: false
  },
  appendUserAgent: "YamajitakuApp",
  ios: {
    // Edge-to-edge: let the web content fill the full screen on every device,
    // and handle the notch / home-indicator with CSS env() safe-area insets
    // (the app already uses viewport-fit=cover). "automatic" instead reserves a
    // safe-area band that exposed the webview background as a blank strip.
    contentInset: "never",
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
