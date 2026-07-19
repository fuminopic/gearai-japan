"use client";

import { useRef, useState } from "react";

import { completeOnboarding, skipOnboarding } from "@/lib/actions/onboarding";
import {
  FinalCheckIllustration,
  MyGearIllustration,
  PlanIllustration,
  WelcomeIllustration
} from "@/components/onboarding-illustrations";
import { SubmitButton } from "@/components/submit-button";

// 新規ユーザー向けオンボーディング(4ページ)。
// 表示判定はサーバー側(/dashboard → /onboarding)で行い、ここは表示専用。
// 「スキップ」「さっそく始めよう！」はどちらも server action で
// user_metadata に終了状態を保存してから遷移する。

type Slide = {
  id: string;
  /** タイトル行。2要素の場合は意図した位置(読点)で改行する。 */
  title: string[];
  /**
   * 本文は「1行ぶん」を1要素として保持する(全ページ2行に統一)。
   * 各行は inline-block で描画するため、折り返しは必ず行の境目で起き、
   * 「登 / 録」「チェ / ック」のように語の途中で切れない。
   * 最長行は25文字。この長さが2行に収まるよう本文の文字サイズを決めている。
   */
  description: string[];
  Illustration: (props: { className?: string }) => React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    title: ["山へ行く前の不安を、なくす。"],
    description: [
      "山支度は、山行計画から装備確認までを",
      "ひとつにつなぐ、登山前準備アプリです。"
    ],
    Illustration: WelcomeIllustration
  },
  {
    id: "plan",
    title: ["条件を選ぶだけで、", "山行計画が完成"],
    description: [
      "山・季節・スタイル・予定日を選ぶだけ。",
      "山行に合わせた装備リストを自動で作成します。"
    ],
    Illustration: PlanIllustration
  },
  {
    id: "my-gear",
    title: ["装備も重量も、まとめて管理"],
    description: [
      "持っている装備をブランド・カテゴリー別に登録。",
      "総重量や装備構成も確認できます。"
    ],
    Illustration: MyGearIllustration
  },
  {
    id: "final-check",
    title: ["出発前の抜け漏れを、", "ひと目で確認"],
    description: [
      "ヘッドライトや防寒着、水分などを一つずつチェック。",
      "忘れ物を防ぎ、落ち着いて出発できます。"
    ],
    Illustration: FinalCheckIllustration
  }
];

const SWIPE_THRESHOLD_PX = 48;

export function OnboardingCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const isLast = index === SLIDES.length - 1;
  const slide = SLIDES[index];
  const { Illustration } = slide;

  const goTo = (nextIndex: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, nextIndex));
    if (clamped === index) {
      return;
    }
    setDirection(clamped > index ? 1 : -1);
    setIndex(clamped);
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    const touch = event.touches[0];
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    const touch = event.changedTouches[0];
    if (!start || !touch) {
      return;
    }

    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    // 縦スクロール優勢のジェスチャーは無視する
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy) * 1.2) {
      return;
    }

    goTo(dx < 0 ? index + 1 : index - 1);
  };

  return (
    <main className="flex min-h-[100dvh] select-none flex-col bg-[#FAFAF8] text-ink">
      <style>{`
        @keyframes yj-onboarding-in {
          from { opacity: 0; transform: translateX(var(--yj-onboarding-dx)); }
          to { opacity: 1; transform: none; }
        }
      `}</style>

      <div className="mx-auto flex w-full max-w-[430px] flex-1 flex-col px-6 pb-[max(env(safe-area-inset-bottom),20px)] pt-[max(env(safe-area-inset-top),16px)] max-[359px]:px-5">
        {/* 上部バー: スキップのみ(タイトルや戻るは置かない) */}
        <div className="flex h-12 shrink-0 items-center justify-end">
          <form action={skipOnboarding}>
            <SubmitButton
              pendingLabel="スキップ"
              className="-mr-2 px-2 py-2 text-sm font-bold text-stone-500 transition active:scale-[0.97] disabled:opacity-60"
            >
              スキップ
            </SubmitButton>
          </form>
        </div>

        {/* スライド本体(左右スワイプ対応) */}
        <section
          className="flex flex-1 flex-col"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
        >
          <div
            key={slide.id}
            className="flex flex-1 flex-col animate-[yj-onboarding-in_260ms_ease-out]"
            style={{ "--yj-onboarding-dx": `${direction * 28}px` } as React.CSSProperties}
          >
            {/* 「イラスト+タイトル+本文」をひとつのグループとして、上下の可変
                スペーサーで Skip とインジケーターの間の視覚的中央に置く。
                上を僅かに軽くして光学的な中央に寄せる。高さが足りない端末では
                スペーサーが自然に潰れ、コンテンツは欠けない。 */}
            <div className="flex-[0.85]" aria-hidden />

            {/* イラストは正方形。小画面でも本文とボタンを圧迫しない上限に抑える */}
            <div className="flex shrink-0 items-center justify-center pb-3 pt-1">
              <Illustration className="h-auto w-full max-w-[250px] max-[359px]:max-w-[200px]" />
            </div>

            <div className="min-h-[128px] shrink-0 text-center">
              <h1 className="text-[21px] font-bold leading-snug tracking-normal text-ink max-[359px]:text-[19px] min-[390px]:text-[22px]">
                {slide.title.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </h1>
              {/* 本文は全ページ2行に固定する。最長行(25文字)が1行に収まるよう、
                  画面幅ごとに文字サイズを切り替える(390px以上=13px /
                  360〜389px=12px / 360px未満=11px)。 */}
              <p className="mx-auto mt-3 max-w-[360px] text-[13px] font-semibold leading-relaxed text-stone-700 max-[389px]:text-[12px] max-[359px]:text-[11px]">
                {slide.description.map((line) => (
                  <span key={line} className="inline-block">
                    {line}
                  </span>
                ))}
              </p>
            </div>

            <div className="flex-1" aria-hidden />
          </div>
        </section>

        {/* ページインジケーター */}
        <div className="flex shrink-0 items-center justify-center gap-2 py-5">
          {SLIDES.map((item, dotIndex) => (
            <button
              key={item.id}
              type="button"
              onClick={() => goTo(dotIndex)}
              aria-label={`${dotIndex + 1}ページ目を表示`}
              aria-current={dotIndex === index ? "true" : undefined}
              className={`h-2 rounded-full transition-all duration-300 ${
                dotIndex === index ? "w-6 bg-[#14724e]" : "w-2 bg-stone-300"
              }`}
            />
          ))}
        </div>

        {/* 下部ボタン: 途中は「次へ」、最後は計画作成へ */}
        <div className="shrink-0">
          {isLast ? (
            <form action={completeOnboarding}>
              <SubmitButton
                pendingLabel="準備中..."
                className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#14724e] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-60"
              >
                さっそく始めよう！
              </SubmitButton>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#14724e] text-[15px] font-bold text-white shadow-sm transition active:scale-[0.98]"
            >
              次へ
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
