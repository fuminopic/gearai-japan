"use client";

import { useRef, useState } from "react";

import { completeOnboarding, skipOnboarding } from "@/lib/actions/onboarding";
import {
  FinalCheckIllustration,
  GearSortIllustration,
  MyGearIllustration,
  PlanIllustration,
  WelcomeIllustration
} from "@/components/onboarding-illustrations";
import { SubmitButton } from "@/components/submit-button";

// 新規ユーザー向けオンボーディング(5ページ)。
// 表示判定はサーバー側(/dashboard → /onboarding)で行い、ここは表示専用。
// 「スキップ」「山行計画をつくる」はどちらも server action で
// user_metadata に終了状態を保存してから遷移する。

type Slide = {
  id: string;
  title: string;
  description: string;
  Illustration: (props: { className?: string }) => React.ReactNode;
};

const SLIDES: Slide[] = [
  {
    id: "welcome",
    title: "山行準備を、もっと確実に",
    description:
      "山支度は、登山の持ち物準備を支えるアプリです。複雑になりがちな山の準備を、順番に進められる形に整えます。",
    Illustration: WelcomeIllustration
  },
  {
    id: "plan",
    title: "山を選ぶだけで、準備が始まる",
    description:
      "山と日程、季節、日帰りや山小屋泊などのスタイルを選ぶだけ。条件に合わせた山行計画がすぐにできあがります。",
    Illustration: PlanIllustration
  },
  {
    id: "gear-sort",
    title: "必要な装備を、自動で整理",
    description:
      "計画に必要な持ち物は自動でリストアップ。「所持」「不足」「要確認」に整理され、用意すべきものがひと目でわかります。",
    Illustration: GearSortIllustration
  },
  {
    id: "my-gear",
    title: "マイ装備を、ひとつにまとめる",
    description:
      "手持ちの装備をブランドやカテゴリーごとに登録。重さを記録すれば、ザック全体の重量構成まで把握できます。",
    Illustration: MyGearIllustration
  },
  {
    id: "final-check",
    title: "出発前に、最後の確認",
    description:
      "出発の前に、ヘッドライトや防寒着、水分などを一つずつ確認。持ち忘れを防ぎ、落ち着いて山へ向かえます。",
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
            <div className="flex min-h-[180px] flex-1 items-center justify-center py-2">
              <Illustration className="h-auto w-full max-w-[300px] max-[359px]:max-w-[252px]" />
            </div>

            <div className="min-h-[128px] shrink-0 text-center">
              <h1 className="text-[21px] font-bold leading-snug tracking-normal text-ink max-[359px]:text-[19px] min-[390px]:text-[22px]">
                {slide.title}
              </h1>
              <p className="mx-auto mt-3 max-w-[320px] text-sm font-semibold leading-relaxed text-stone-600">
                {slide.description}
              </p>
            </div>
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
                山行計画をつくる
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
