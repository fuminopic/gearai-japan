import type { Metadata, Viewport } from "next";

import { SwRegister } from "@/components/sw-register";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "山支度 | YAMAJITAKU",
    template: "%s | 山支度"
  },
  description: "登山準備を、もっとシンプルに。",
  openGraph: {
    title: "山支度 | YAMAJITAKU",
    description: "登山準備を、もっとシンプルに。",
    siteName: "山支度",
    locale: "ja_JP",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "山支度 | YAMAJITAKU",
    description: "登山準備を、もっとシンプルに。"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FAFAFA",
  colorScheme: "light"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>
        <SwRegister />
        {children}
      </body>
    </html>
  );
}
