"use client";

import { usePathname } from "next/navigation";

import { isBrandShellPath } from "@/components/app-chrome";
import { LoadingBlock } from "@/components/ui/loading-block";

// タブ切り替え中の見た目。
//
// 以前はどの画面でも中央にスピナーを出していたため、ホーム⇄マイギアの
// 切り替えが「緑バンド → 白背景+スピナー → 緑バンド」と二度切り替わって
// いた。行き先が緑バンドを持つ画面なら、同じ寸法のバンドと背景だけを先に
// 描いておく。カードは実データが届いた瞬間に差し込まれるので、画面が
// 入れ替わった感じがなくなる。
export default function AppLoading() {
  const pathname = usePathname();

  if (isBrandShellPath(pathname)) {
    // ホームだけバンドが高い(206px)。他は150px。
    return <BrandShellSkeleton bandPx={pathname === "/dashboard" ? 206 : 150} />;
  }

  return <AppLoadingFallback />;
}

function BrandShellSkeleton({ bandPx }: { bandPx: number }) {
  return (
    <main className="brand-shell min-h-screen bg-[#E5EBE9]" aria-hidden="true">
      <div
        className="w-full bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
        style={{ minHeight: `calc(max(env(safe-area-inset-top), 20px) + ${bandPx}px)` }}
      />
    </main>
  );
}

export function AppLoadingFallback() {
  // Subtle in-app loading indicator only — no brand logo here. The branded
  // splash is owned by the native splash screen at launch; showing the logo
  // again during in-app navigation (e.g. right after login) looked like a
  // second splash.
  return <LoadingBlock aria-hidden="true" />;
}
