import { Edit3, Search, Trash2 } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { deleteGear } from "@/lib/actions/gear";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import type { GearCategory, GearFilters, UserGear } from "@/lib/types";
import { formatJpy, formatWeight } from "@/lib/utils/format";

type GearListProps = {
  gear: UserGear[];
  categories: GearCategory[];
  filters: GearFilters;
};

export function GearList({ gear, categories, filters }: GearListProps) {
  return (
    <div className="space-y-5">
      <form className="rounded-lg bg-white p-4 shadow-soft">
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <Search className="h-5 w-5 text-stone-400" />
          <input
            name="q"
            defaultValue={filters.q}
            className="w-full bg-transparent py-1 text-base outline-none"
            placeholder="装備名・ブランドで検索"
          />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <select
            name="status"
            defaultValue={filters.status ?? "all"}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
          >
            <option value="all">すべて</option>
            <option value="owned">所有</option>
            <option value="wishlist">欲しい</option>
          </select>

          <select
            name="category"
            defaultValue={filters.category ?? ""}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
          >
            <option value="">カテゴリーを選択</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_ja}
              </option>
            ))}
          </select>

          <select
            name="sort"
            defaultValue={filters.sort ?? "newest"}
            className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
          >
            <option value="newest">新しい順</option>
            <option value="weight">重い順</option>
            <option value="price">高い順</option>
          </select>
        </div>

        <button className="mt-3 w-full rounded-lg bg-ink px-4 py-3 text-sm font-semibold text-white">
          絞り込む
        </button>
      </form>

      {gear.length === 0 ? (
        <section className="rounded-lg bg-white p-6 text-center shadow-soft">
          <p className="text-lg font-semibold text-ink">まだ装備がありません</p>
          <p className="mt-2 text-sm leading-6 text-stone-500">
            まずはバックパック、レインウェア、ヘッドライトなどから登録してみましょう。
          </p>
          <Link
            href="/gear/new"
            className="mt-5 inline-flex rounded-lg bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
          >
            装備を追加
          </Link>
        </section>
      ) : (
        <div className="space-y-3">
          {gear.map((item) => (
            <article key={item.id} className="rounded-lg bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    href={`/gear/${item.id}`}
                    className="block truncate text-lg font-semibold text-ink"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-stone-500">
                    {[
                      item.brand,
                      item.model,
                      item.gear_categories?.name_ja,
                      item.gear_subcategories?.name_ja
                    ]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <span className="rounded-lg bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
                  {statusLabels[item.status]}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <p className="text-stone-400">重量</p>
                  <p className="font-semibold text-ink">
                    {formatWeight(
                      Number(item.measured_weight_grams ?? item.official_weight_grams ?? item.weight_grams)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">価格</p>
                  <p className="font-semibold text-ink">
                    {formatJpy(
                      Number(item.purchase_price_jpy ?? item.msrp_jpy ?? 0)
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-stone-400">タイプ</p>
                  <p className="font-semibold text-ink">{weightTypeLabels[item.weight_type]}</p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Link
                  href={`/gear/${item.id}/edit`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-stone-200 px-4 py-2 text-sm font-semibold text-stone-700"
                >
                  <Edit3 className="h-4 w-4" />
                  編集
                </Link>
                <form action={deleteGear.bind(null, item.id)} className="flex-1">
                  <SubmitButton
                    pendingLabel="削除中..."
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" />
                    削除
                  </SubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
