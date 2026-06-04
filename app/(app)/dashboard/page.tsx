import { Backpack, CircleDollarSign, Gauge, Layers3 } from "lucide-react";
import Link from "next/link";

import { StatCard } from "@/components/stat-card";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import { formatJpy, formatWeight } from "@/lib/utils/format";

export default async function DashboardPage() {
  const summary = await getDashboardSummary();

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-forest-700">GearAI Japan</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-ink">
            マイギア
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            装備の重量、価値、持っているものをひと目で確認できます。
          </p>
        </div>
        <Link
          href="/gear/new"
          className="inline-flex items-center justify-center rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
        >
          装備を追加
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="装備数"
          value={`${summary.totalCount.toLocaleString("ja-JP")} 点`}
          detail={`所有 ${summary.ownedCount} / 欲しい ${summary.wishlistCount}`}
          icon={<Backpack className="h-5 w-5" />}
        />
        <StatCard
          label="パック重量"
          value={formatWeight(summary.totalPackWeightG)}
          detail="ベース + 消耗品"
          icon={<Gauge className="h-5 w-5" />}
        />
        <StatCard
          label="総価値"
          value={formatJpy(summary.totalValueJpy)}
          detail="価格入力済み装備の合計"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <StatCard
          label="ベース重量"
          value={formatWeight(summary.baseWeightG)}
          detail="消耗品・着用品を除く重量"
          icon={<Layers3 className="h-5 w-5" />}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1.1fr]">
        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">重量タイプ</h2>
          <div className="mt-5 space-y-4">
            {[
              ["base", summary.baseWeightG],
              ["consumable", summary.consumableWeightG],
              ["worn", summary.wornWeightG],
              ["total", summary.totalWeightG]
            ].map(([type, weight]) => (
              <div key={type} className="flex items-center justify-between border-b border-stone-100 pb-3 last:border-0 last:pb-0">
                <span className="text-sm font-medium text-stone-600">
                  {type === "total"
                    ? "総重量"
                    : weightTypeLabels[type as keyof typeof weightTypeLabels]}
                </span>
                <span className="text-sm font-semibold text-ink">
                  {formatWeight(Number(weight))}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-white p-5 shadow-soft">
          <h2 className="text-lg font-semibold text-ink">カテゴリー別重量</h2>
          <div className="mt-5 space-y-4">
            {summary.categoryWeights.length === 0 ? (
              <p className="text-sm text-stone-500">所有装備を追加すると表示されます。</p>
            ) : (
              summary.categoryWeights.map((category) => (
                <div key={category.categoryId}>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-stone-700">{category.nameJa}</span>
                    <span className="font-semibold text-ink">{formatWeight(category.weightG)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-lg bg-stone-100">
                    <div
                      className="h-full rounded-lg bg-forest-500"
                      style={{
                        width: `${Math.max(
                          8,
                          (category.weightG / Math.max(summary.totalWeightG, 1)) * 100
                        )}%`
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-ink">最近の装備</h2>
          <Link href="/gear" className="text-sm font-semibold text-forest-700">
            すべて見る
          </Link>
        </div>
        <div className="mt-4 divide-y divide-stone-100">
          {summary.recentGear.length === 0 ? (
            <p className="py-4 text-sm text-stone-500">装備はまだ登録されていません。</p>
          ) : (
            summary.recentGear.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.name}</p>
                  <p className="mt-1 text-xs text-stone-500">
                    {[
                      item.gear_categories?.name_ja ?? "その他",
                      item.gear_subcategories?.name_ja,
                      statusLabels[item.status]
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">
                  {formatWeight(Number(item.weight_grams))}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
