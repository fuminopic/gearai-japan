import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { AppMenuDrawer } from "@/components/app-menu-drawer";

// タブの外(ギア登録・詳細・編集・プロフィール各種など)の外殻。
//
// 以前は「白いスティッキーヘッダー」+「その下に戻ると見出しの行」の
// 二段構えで、タブ5画面の緑バンドとは別物だった。1階層下がるだけで
// 上部の見た目が変わるので、同じアプリに見えない。
//
// バンドは同じものを使い、中身だけ階層で変える:
//   ルート(タブ)  → ロゴ
//   1階層下(ここ) → 戻る + 見出し
//
// 寸法もタブと揃える。バンド safe+150 / カード -51 なので、カード上端は
// どの画面でも safe+99 に来る。タブと二次画面を行き来しても上部が跳ねない。
//
// 表示だけを持つ。フォームの送信やデータ取得には関与しない。

type PageShellProps = {
  /** 戻り先。ページごとに「どこから来たか」が違うので必ず明示する。 */
  backHref: Route;
  /** 戻るボタンの読み上げ文言。「マイギアへ戻る」など行き先を入れる。 */
  backLabel: string;
  title: string;
  eyebrow?: string;
  /**
   * 見出しの右に置くリンク。<form> の外に出るため、送信ボタンは渡さない。
   * (保存は各ページが本文の下に持つ)
   */
  action?: ReactNode;
  children: ReactNode;
};

export function PageShell({
  backHref,
  backLabel,
  title,
  eyebrow,
  action,
  children
}: PageShellProps) {
  return (
    <main className="secondary-shell brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
      <header
        className="relative z-10 w-full bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
        style={{ minHeight: "calc(max(env(safe-area-inset-top), 20px) + 150px)" }}
      >
        <div className="flex items-start justify-between">
          <Link
            href={backHref}
            aria-label={backLabel}
            data-guarded-back=""
            className="-ml-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95"
          >
            <ArrowLeft aria-hidden className="h-5 w-5" />
          </Link>
          <AppMenuDrawer buttonClassName="-mr-2 inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95" />
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <p className="text-[11px] font-bold leading-none text-white/85">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-1.5 truncate text-[20px] font-bold leading-tight tracking-normal text-white">
              {title}
            </h1>
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>

      <div className="relative z-20 -mt-[51px] space-y-[11px] px-4">
        {children}
      </div>
    </main>
  );
}
