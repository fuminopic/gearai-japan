import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "GearAI Japan",
  description: "日本の登山・キャンプ装備を管理し、重量と予算を把握するAIプラットフォーム。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

