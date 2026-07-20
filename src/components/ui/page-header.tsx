import { ArrowLeft } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

// 二次画面(タブの外)の共通ヘッダー。
//
// これまでは各ページが自前で書いていたため、見出しが 26/28/30/34px と
// バラバラで、戻るの見た目も「文字のピル」「ArrowLeft の丸ボタン」
// 「ChevronLeft の丸ボタン」の3種類あった。ギア編集にはそもそも戻る
// 導線が無かった。ここに集約して、どのページから入っても同じ位置・
// 同じ大きさで戻れるようにする。
//
// 表示だけを持つ。フォームの送信やデータ取得には関与しない。

type PageHeaderProps = {
  /** 戻り先。ページごとに「どこから来たか」が違うので必ず明示する。 */
  backHref: Route;
  /** 戻るボタンの読み上げ文言。「マイギアへ戻る」など行き先を入れる。 */
  backLabel: string;
  title: string;
  eyebrow?: string;
  /** 保存ボタンなど、右端に置く操作。 */
  action?: ReactNode;
};

export function PageHeader({
  backHref,
  backLabel,
  title,
  eyebrow,
  action
}: PageHeaderProps) {
  return (
    <section className="flex items-center gap-3">
      <Link
        href={backHref}
        aria-label={backLabel}
        data-guarded-back=""
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-stone-800 shadow-sm transition active:scale-95"
      >
        <ArrowLeft aria-hidden className="h-5 w-5" />
      </Link>
      <div className="min-w-0 flex-1">
        {eyebrow ? (
          <p className="text-[11px] font-bold leading-none text-[#14724e]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-1 truncate text-[20px] font-bold leading-tight tracking-normal text-ink">
          {title}
        </h1>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}
