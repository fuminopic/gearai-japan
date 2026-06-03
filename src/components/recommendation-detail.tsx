import Link from "next/link";

import type {
  AIRecommendationRecord,
  AIRecommendedItem,
  MissingAnalysisItem
} from "@/lib/types";
import { formatJpy, formatWeight } from "@/lib/utils/format";

type RecommendationDetailProps = {
  record: AIRecommendationRecord;
};

export function RecommendationDetail({ record }: RecommendationDetailProps) {
  const missing = record.missing_analysis;
  const owned = record.owned_analysis;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-semibold text-forest-700">推薦結果</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
          {record.input.mountain_name}
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {record.output.trip_summary}
        </p>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-white p-4 shadow-soft">
          <p className="text-sm text-stone-500">推定総重量</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatWeight(record.output.estimated_total_weight_g)}
          </p>
        </div>
        <div className="rounded-lg bg-white p-4 shadow-soft">
          <p className="text-sm text-stone-500">推定予算</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatJpy(record.output.estimated_total_budget_jpy)}
          </p>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">所有装備の分析</h2>
        {owned && (owned.owned_items.length > 0 || owned.maybe_owned_items.length > 0) ? (
          <div className="mt-4 space-y-3">
            {owned.owned_items.map((item) => (
              <div key={`${item.recommended_name}-${item.matched_user_gear_id}`} className="rounded-lg bg-forest-50 p-3">
                <p className="text-sm font-semibold text-forest-900">
                  {item.recommended_name}
                </p>
                <p className="mt-1 text-xs text-forest-700">
                  所有装備: {item.matched_user_gear_name}
                </p>
              </div>
            ))}
            {owned.maybe_owned_items.map((item) => (
              <div key={`${item.recommended_name}-${item.matched_user_gear_id}`} className="rounded-lg bg-trail-50 p-3">
                <p className="text-sm font-semibold text-stone-800">
                  {item.recommended_name}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  確認候補: {item.matched_user_gear_name}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-stone-500">一致する所有装備は見つかりませんでした。</p>
        )}
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">不足装備</h2>
        {missing ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs text-red-700">追加重量目安</p>
                <p className="mt-1 font-semibold text-red-900">
                  {formatWeight(missing.estimated_missing_weight_g)}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs text-red-700">追加予算目安</p>
                <p className="mt-1 font-semibold text-red-900">
                  {formatJpy(missing.estimated_missing_budget_jpy)}
                </p>
              </div>
            </div>
            <MissingGroup title="必須" items={missing.missing_required_items} />
            <MissingGroup title="推奨" items={missing.missing_recommended_items} />
            <MissingGroup title="任意" items={missing.missing_optional_items} />
          </>
        ) : (
          <p className="mt-3 text-sm text-stone-500">不足装備の分析はありません。</p>
        )}
      </section>

      <RecommendationItems title="必須装備" items={record.output.required_items} />
      <RecommendationItems title="推奨装備" items={record.output.recommended_items} />
      <RecommendationItems title="任意装備" items={record.output.optional_items} />

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">リスク注意</h2>
        <div className="mt-4 space-y-3">
          {record.output.risk_warnings.map((warning, index) => (
            <p key={index} className="rounded-lg bg-stone-50 p-3 text-sm leading-6 text-stone-700">
              {warning.message}
            </p>
          ))}
        </div>
        <p className="mt-4 rounded-lg bg-forest-50 p-3 text-sm leading-6 text-forest-900">
          {record.output.safety_note}
        </p>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold text-ink">予算コメント</h2>
        <p className="mt-3 text-sm leading-6 text-stone-700">{record.output.budget_comment}</p>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/ai"
          className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-700"
        >
          新しく作成
        </Link>
        <Link
          href="/ai/history"
          className="rounded-lg bg-forest-700 px-5 py-3 text-center text-sm font-semibold text-white"
        >
          履歴へ
        </Link>
      </div>
    </div>
  );
}

function RecommendationItems({
  title,
  items
}: {
  title: string;
  items: AIRecommendedItem[];
}) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-soft">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={`${title}-${item.name}`} className="rounded-lg border border-stone-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.reason}</p>
              </div>
              <span className="rounded-lg bg-stone-50 px-2 py-1 text-xs font-semibold text-stone-600">
                {priorityLabel(item.priority)}
              </span>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              {formatWeight(item.estimated_weight_g)} / {formatJpy(item.estimated_price_jpy)}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function priorityLabel(priority: AIRecommendedItem["priority"]) {
  if (priority === "high") {
    return "高";
  }

  if (priority === "medium") {
    return "中";
  }

  return "低";
}

function MissingGroup({ title, items }: { title: string; items: MissingAnalysisItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-5">
      <h3 className="text-sm font-semibold text-stone-700">{title}</h3>
      <div className="mt-2 space-y-2">
        {items.map((item) => (
          <div key={`${item.group}-${item.name}`} className="rounded-lg border border-red-100 bg-red-50 p-3">
            <p className="text-sm font-semibold text-red-900">{item.name}</p>
            <p className="mt-1 text-xs leading-5 text-red-700">{item.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
