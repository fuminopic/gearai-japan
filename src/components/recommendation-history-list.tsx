import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { AIRecommendationRecord } from "@/lib/types";
import {
  accommodationStyleLabels,
  seasonLabels,
  weatherRiskLabels
} from "@/lib/i18n/labels";
import { formatJpy, formatWeight } from "@/lib/utils/format";

type RecommendationHistoryListProps = {
  records: AIRecommendationRecord[];
};

export function RecommendationHistoryList({ records }: RecommendationHistoryListProps) {
  if (records.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 text-center shadow-soft">
        <p className="text-lg font-semibold text-ink">推薦履歴はまだありません</p>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          山名と日数を入力して、最初の装備推薦を作成しましょう。
        </p>
        <Link
          href="/ai"
          className="mt-5 inline-flex rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          AI推薦へ
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((record) => (
        <Link
          key={record.id}
          href={`/ai/recommendations/${record.id}`}
          className="block rounded-lg bg-white p-4 shadow-soft"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">{record.input.mountain_region}</p>
              <p className="mt-1 text-sm text-stone-500">
                {record.input.days}日 /{" "}
                {seasonLabels[record.input.season]} /{" "}
                {weatherRiskLabels[record.input.weather_risk]} /{" "}
                {accommodationStyleLabels[record.input.accommodation_style]}
              </p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-stone-400" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-stone-500">推定重量</p>
              <p className="mt-1 font-semibold text-ink">
                {formatWeight(record.output.estimated_total_weight_g)}
              </p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-stone-500">推定予算</p>
              <p className="mt-1 font-semibold text-ink">
                {formatJpy(record.output.estimated_total_budget_jpy)}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
