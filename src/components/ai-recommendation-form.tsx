import Link from "next/link";
import { History, Sparkles } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { createRecommendation } from "@/lib/actions/ai";
import { experienceLabels } from "@/lib/i18n/labels";

type AIRecommendationFormProps = {
  error?: string;
};

export function AIRecommendationForm({ error }: AIRecommendationFormProps) {
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">AI装備推薦</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            山行に必要な装備を確認
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            天気APIは使わず、山域・季節・日数・経験レベルから保守的に提案します。
          </p>
        </div>
        <Link
          href="/ai/history"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
        >
          <History className="h-4 w-4" />
          履歴
        </Link>
      </section>

      <form action={createRecommendation} className="space-y-5">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="rounded-lg bg-white p-5 shadow-soft">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">山名</span>
              <input
                name="mountain_name"
                required
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例: 富士山"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">月</span>
                <input
                  name="month"
                  type="number"
                  min="1"
                  max="12"
                  required
                  defaultValue={currentMonth}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-stone-700">日数</span>
                <input
                  name="days"
                  type="number"
                  min="1"
                  required
                  defaultValue={1}
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-4 py-3">
              <span>
                <span className="block text-sm font-medium text-stone-700">テント泊</span>
                <span className="text-xs text-stone-500">キャンプ装備を含める</span>
              </span>
              <input
                name="is_camping"
                type="checkbox"
                className="h-5 w-5 accent-forest-700"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">予算（円）</span>
              <input
                name="budget_jpy"
                type="number"
                min="0"
                defaultValue={50000}
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-stone-700">経験レベル</span>
              <select
                name="experience_level"
                defaultValue="beginner"
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
              >
                {Object.entries(experienceLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <SubmitButton
          pendingLabel="推薦を作成中..."
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          AI推薦を作成
        </SubmitButton>
      </form>
    </div>
  );
}

