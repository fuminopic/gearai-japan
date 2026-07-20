"use client";

import { Check, X } from "lucide-react";
import { useEffect, useState } from "react";

// 初回だけ出す3ステップの案内。オンボーディング3ページ目(必要な装備を自動で
// 整理 → マイパック → 出発前確認)の流れを、実際の画面上でもう一度示す。
//
// 表示状態は localStorage のみ。オンボーディングの完了状態(user_metadata)と
// 違い、これは「見た目のヒントを閉じたか」だけなので、端末ローカルで足りる。
// サーバーに列を足す必要もない。
const DISMISSED_KEY = "yj_gear_step_hint_dismissed";

type Step = {
  label: string;
  done: boolean;
};

export function GearStepHint({
  hasGear,
  hasPackItems
}: {
  hasGear: boolean;
  hasPackItems: boolean;
}) {
  // SSR とクライアントで出し分けるとちらつくので、判定が済むまで描画しない。
  const [status, setStatus] = useState<"unknown" | "visible" | "hidden">("unknown");

  useEffect(() => {
    try {
      setStatus(window.localStorage.getItem(DISMISSED_KEY) ? "hidden" : "visible");
    } catch {
      // プライベートモードなどで localStorage が使えない場合は出しておく。
      setStatus("visible");
    }
  }, []);

  // 3ステップすべて終わっていれば、案内としての役目は終わり。
  const steps: Step[] = [
    { label: "ギアを登録", done: hasGear },
    { label: "パックに入れる", done: hasPackItems },
    { label: "計画で確認", done: false }
  ];

  if (status !== "visible" || (hasGear && hasPackItems)) {
    return null;
  }

  return (
    <section className="relative rounded-[20px] bg-white px-4 py-3.5 shadow-sm">
      <button
        type="button"
        aria-label="この案内を閉じる"
        onClick={() => {
          try {
            window.localStorage.setItem(DISMISSED_KEY, "1");
          } catch {
            // 保存できなくても閉じる動作は行う。
          }
          setStatus("hidden");
        }}
        className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-gray-300 transition active:scale-95"
      >
        <X aria-hidden className="h-4 w-4" strokeWidth={2.5} />
      </button>

      <p className="mb-3 text-[12px] font-bold text-ink">3ステップで出発前の確認まで</p>

      <div className="flex items-start">
        {steps.map((step, index) => (
          <div key={step.label} className="contents">
            {index > 0 ? <span className="mt-3 h-px flex-1 bg-gray-100" /> : null}
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  step.done
                    ? "bg-[#14724e] text-white"
                    : "border border-gray-200 bg-white text-gray-400"
                }`}
              >
                {step.done ? <Check aria-hidden className="h-3 w-3" strokeWidth={3} /> : index + 1}
              </span>
              <span
                className={`text-[10px] font-bold ${
                  step.done ? "text-[#14724e]" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
