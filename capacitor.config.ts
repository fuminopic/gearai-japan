import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.yamajitaku.app",
  appName: "山支度",
  webDir: "capacitor-www",
  server: {
    url: "https://yamajitaku.com",
    cleartext: false
  },
  appendUserAgent: "YamajitakuApp",
  ios: {
    contentInset: "automatic",
    scrollEnabled: true
  }
};

export default config;
