"use client";

import { useEffect } from "react";

// これが無いと、ギアIDが見つからない・Supabase の読み取りが落ちたときに
// Next.js の既定のエラー画面(白背景・英語)がそのまま出ていた。
//
// 原因の文面はそのまま見せない。ユーザーが取れる行動(再試行・ホームへ)だけを
// 出し、詳細は console に残す。
export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-5">
      <section className="w-full max-w-sm rounded-[20px] bg-white p-6 text-center shadow-sm">
        <p className="text-[11px] font-bold text-[#14724e]">エラー</p>
        <h1 className="mt-2 text-[20px] font-bold leading-tight tracking-normal text-ink">
          読み込めませんでした
        </h1>
        <p className="mt-3 text-sm font-semibold leading-relaxed text-stone-600">
          通信状況が不安定か、一時的な問題が起きた可能性があります。
          時間をおいて、もう一度お試しください。
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-xl bg-stone-50 px-3 py-2 font-din text-[11px] font-medium text-stone-500">
            {error.digest}
          </p>
        ) : null}
        <div className="mt-5 grid gap-2">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[#14724e] text-sm font-bold text-white transition active:scale-[0.99]"
          >
            再試行
          </button>
          <a
            href="/dashboard"
            className="inline-flex h-11 w-full items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-stone-700 transition active:scale-[0.99]"
          >
            ホームへ戻る
          </a>
        </div>
      </section>
    </main>
  );
}
