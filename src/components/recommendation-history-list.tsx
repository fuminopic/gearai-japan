import { ChevronRight } from "lucide-react";
import Link from "next/link";

import {
  RecommendationDeleteAllButton,
  RecommendationDeleteButton
} from "@/components/recommendation-delete-controls";
import type { AIRecommendationRecord } from "@/lib/types";
import {
  accommodationStyleLabels,
  seasonLabels,
  weatherRiskLabels
} from "@/lib/i18n/labels";
import { formatWeight } from "@/lib/utils/format";

type RecommendationHistoryListProps = {
  records: AIRecommendationRecord[];
};

export function RecommendationHistoryList({ records }: RecommendationHistoryListProps) {
  if (records.length === 0) {
    return (
      <section className="rounded-lg bg-white p-6 text-center shadow-soft">
        <p className="text-lg font-semibold text-ink">過去の推薦履歴はまだありません</p>
        <p className="mt-2 text-sm leading-6 text-stone-500">
          現在は山行計画のチェックリストを主に利用してください。
        </p>
        <Link
          href="/plan"
          className="mt-5 inline-flex rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          山行計画を作成
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <RecommendationDeleteAllButton />
      {records.map((record) => (
        <article key={record.id} className="rounded-lg bg-white p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-lg font-semibold text-ink">{record.input.mountain_region}</p>
              <p className="mt-1 text-sm text-stone-500">
                {record.input.month}月 / {record.input.days}日 /{" "}
                {seasonLabels[record.input.season]} /{" "}
                {weatherRiskLabels[record.input.weather_risk]} /{" "}
                {accommodationStyleLabels[record.input.accommodation_style]}
              </p>
            </div>
            <Link href={`/ai/recommendations/${record.id}`}>
              <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-stone-400" />
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-stone-500">推定重量</p>
              <p className="mt-1 font-semibold text-ink">
                {formatWeight(record.output.estimated_total_weight_g)}
              </p>
            </div>
            <div className="rounded-lg bg-stone-50 p-3">
              <p className="text-stone-500">必須装備</p>
              <p className="mt-1 font-semibold text-ink">
                {record.output.required_items.length.toLocaleString("ja-JP")} 点
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href={`/ai/recommendations/${record.id}`}
              className="rounded-lg border border-stone-200 px-4 py-2 text-center text-sm font-semibold text-stone-700"
            >
              詳細
            </Link>
            <RecommendationDeleteButton id={record.id} />
          </div>
        </article>
      ))}
    </div>
  );
}
