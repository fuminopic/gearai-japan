import Link from "next/link";
import { History, Sparkles } from "lucide-react";

import { SubmitButton } from "@/components/submit-button";
import { createRecommendation } from "@/lib/actions/ai";
import {
  accommodationStyleLabels,
  experienceLabels,
  seasonLabels,
  weatherRiskLabels
} from "@/lib/i18n/labels";

type AIRecommendationFormProps = {
  error?: string;
};

const mountainRegions = [
  "富士山",
  "北アルプス",
  "南アルプス",
  "八ヶ岳",
  "谷川岳"
];

export function AIRecommendationForm({ error }: AIRecommendationFormProps) {
  const currentMonth = new Date().getMonth() + 1;

  return (
    <div className="space-y-5">
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-forest-700">Rule Engine + AI</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            装備推薦
          </h1>
        </div>
        <Link
          href="/ai/history"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-semibold text-stone-700"
        >
          <History className="h-4 w-4" />
          履歴
        </Link>
      </section>

      <form action={createRecommendation} className="space-y-4">
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        ) : null}

        <section className="rounded-lg bg-white p-5 shadow-soft">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-stone-700">山域</span>
              <input
                name="mountain_region"
                required
                list="mountain-region-options"
                className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                placeholder="例: 富士山"
              />
              <datalist id="mountain-region-options">
                {mountainRegions.map((region) => (
                  <option key={region} value={region} />
                ))}
              </datalist>
            </label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-stone-700">季節</span>
                <select
                  name="season"
                  defaultValue="summer"
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                >
                  {Object.entries(seasonLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

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
                <span className="text-sm font-medium text-stone-700">天候リスク</span>
                <select
                  name="weather_risk"
                  defaultValue="stable"
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                >
                  {Object.entries(weatherRiskLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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

              <label className="block">
                <span className="text-sm font-medium text-stone-700">宿泊</span>
                <select
                  name="accommodation_style"
                  defaultValue="day_hike"
                  className="mt-2 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
                >
                  {Object.entries(accommodationStyleLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
        </section>

        <SubmitButton
          pendingLabel="推薦を作成中..."
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-4 text-base font-semibold text-white disabled:opacity-60"
        >
          <Sparkles className="h-5 w-5" />
          推薦を作成
        </SubmitButton>
      </form>
    </div>
  );
}
