"use client";

import { usePathname } from "next/navigation";

import { isBrandShellPath } from "@/components/app-chrome";

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

  // タブの外(ギア詳細・編集・プロフィール各種など)は共通ヘッダーを持つ。
  // 行き先と同じ形を先に描いておけば、スピナーを挟まずに中身だけが
  // 差し変わる。ここでスピナーを出すと、せっかくタブ間で消した
  // 「ぐるぐる」が二次画面で戻ってしまう。
  return <SecondaryPageSkeleton />;
}

function SecondaryPageSkeleton() {
  return (
    <div className="space-y-5" aria-hidden="true">
      <section className="flex items-center gap-3">
        <div className="h-11 w-11 shrink-0 rounded-xl bg-white shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="h-[11px] w-16 rounded-full bg-black/5" />
          <div className="mt-2 h-5 w-40 max-w-full rounded-full bg-black/5" />
        </div>
      </section>
      <div className="h-56 rounded-[20px] bg-white shadow-sm" />
      <div className="h-40 rounded-[20px] bg-white shadow-sm" />
    </div>
  );
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

