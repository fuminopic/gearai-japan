import type { Metadata } from "next";

import { SplashScreen } from "@/components/splash-screen";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "山支度 | YAMAJITAKU",
    template: "%s | 山支度"
  },
  description: "登山前の装備確認を10秒で。",
  openGraph: {
    title: "山支度 | YAMAJITAKU",
    description: "登山前の装備確認を10秒で。",
    siteName: "山支度",
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "山支度 | YAMAJITAKU",
    description: "登山前の装備確認を10秒で。"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <SplashScreen />
        {children}
      </body>
    </html>
  );
}
