import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import type {
  AIRecommendationRecord,
  AIRecommendedItem,
  MissingAnalysisItem
} from "@/lib/types";
import { accommodationStyleLabels } from "@/lib/i18n/labels";
import { weightTypeLabels } from "@/lib/i18n/labels";
import { formatWeight } from "@/lib/utils/format";

type RecommendationDetailProps = {
  record: AIRecommendationRecord;
};

export function RecommendationDetail({ record }: RecommendationDetailProps) {
  const missing = record.missing_analysis;
  const owned = record.owned_analysis;
  const missingRequiredCount = missing?.missing_required_items.length ?? 0;

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-semibold text-forest-700">過去の記録</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
          旧推薦の詳細
        </h1>
        <p className="mt-2 text-lg font-semibold text-ink">
          {record.input.mountain_region}
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {accommodationStyleLabels[record.input.accommodation_style]} /{" "}
          {record.input.days}日
        </p>
      </section>

      <Notice
        tone="success"
        className="border border-forest-100 p-4 font-normal leading-6 text-forest-900"
      >
        現在は山行計画のチェックリストを主に利用してください。新しい準備確認は山行計画から作成できます。
      </Notice>

      <section className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <p className="text-sm text-stone-500">推定総重量</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {formatWeight(record.output.estimated_total_weight_g)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-stone-500">不足必須</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {missingRequiredCount.toLocaleString("ja-JP")} 点
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-stone-500">記録項目</p>
          <p className="mt-2 text-2xl font-semibold text-ink">
            {getRecommendedItemCount(record).toLocaleString("ja-JP")} 点
          </p>
        </Card>
      </section>

      <Card className="p-5">
        <p className="text-sm leading-6 text-stone-700">{record.output.trip_summary}</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">当時の判断メモ</h2>
        <div className="mt-4 grid gap-3">
          {[...record.output.mountain_rules, ...record.output.season_rules].map(
            (rule) => (
              <p key={rule} className="rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
                {rule}
              </p>
            )
          )}
          <p className="rounded-lg bg-forest-50 p-3 text-sm text-forest-900">
            熊リスク: {record.output.bear_risk_level} /{" "}
            {record.output.bear_risk_reason}
          </p>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">当時の所持装備照合</h2>
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
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold text-ink">不足装備</h2>
        {missing ? (
          <>
            <div className="mt-4 grid gap-2">
              <div className="rounded-lg bg-red-50 p-3">
                <p className="text-xs text-red-700">追加重量目安</p>
                <p className="mt-1 font-semibold text-red-900">
                  {formatWeight(missing.estimated_missing_weight_g)}
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
      </Card>

      <RecommendationItems title="必須として記録" items={record.output.required_items} />
      <RecommendationItems title="推奨として記録" items={record.output.recommended_items} />
      <RecommendationItems title="任意として記録" items={record.output.optional_items} />

      <Card className="p-5">
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
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/plan"
          className="rounded-lg border border-stone-200 bg-white px-5 py-3 text-center text-sm font-semibold text-stone-700"
        >
          山行計画を作成
        </Link>
        <Link
          href="/ai/history"
          className="rounded-lg bg-forest-700 px-5 py-3 text-center text-sm font-semibold text-white"
        >
          過去の履歴へ
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
    <Card className="p-5">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <article key={`${title}-${item.name}`} className="rounded-lg border border-stone-100 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">{item.name}</p>
                <p className="mt-1 text-sm leading-6 text-stone-600">{item.reason}</p>
              </div>
              <Badge className="bg-stone-50 py-1">
                {priorityLabel(item.priority)}
              </Badge>
            </div>
            <p className="mt-3 text-xs text-stone-500">
              {item.rule_basis} / {item.subcategory} /{" "}
              {weightTypeLabels[item.weight_type]} /{" "}
              {formatWeight(item.estimated_weight_g)}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}

function getRecommendedItemCount(record: AIRecommendationRecord) {
  return (
    record.output.required_items.length +
    record.output.recommended_items.length +
    record.output.optional_items.length
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
