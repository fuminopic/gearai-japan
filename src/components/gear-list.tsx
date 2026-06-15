import { Edit3, Search, Trash2 } from "lucide-react";
import Link from "next/link";

import { SubmitButton } from "@/components/submit-button";
import { deleteGear } from "@/lib/actions/gear";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import type { GearCategory, GearFilters, UserGear } from "@/lib/types";
import { calculateSavingsJpy } from "@/lib/utils/asset";
import { formatJpy, formatWeight } from "@/lib/utils/format";

type GearListProps = {
  gear: UserGear[];
  categories: GearCategory[];
  brands: string[];
  filters: GearFilters;
};

export function GearList({ gear, categories, brands, filters }: GearListProps) {
  const gearGroups = groupGearByCategory(gear, categories);

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

        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <label className="block">
            <span className="text-xs font-semibold text-stone-500">所有状態</span>
            <select
              name="status"
              defaultValue={filters.status ?? "all"}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
            >
              <option value="all">すべて</option>
              <option value="owned">所有</option>
              <option value="wishlist">欲しい</option>
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500">カテゴリー</span>
            <select
              name="category"
              defaultValue={filters.category ?? ""}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
            >
              <option value="">すべて</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name_ja}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500">ブランド</span>
            <select
              name="brand"
              defaultValue={filters.brand ?? ""}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
            >
              <option value="">すべて</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-stone-500">並び順</span>
            <select
              name="sort"
              defaultValue={filters.sort ?? "newest"}
              className="mt-1 w-full rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm"
            >
              <option value="newest">新しい順</option>
              <option value="weight">重い順</option>
              <option value="price">高い順</option>
            </select>
          </label>
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
        <div className="space-y-5">
          <div className="rounded-lg border border-forest-100 bg-forest-50 px-4 py-3">
            <p className="text-sm font-semibold text-forest-800">
              カテゴリー別に表示中
            </p>
            <p className="mt-1 text-xs text-forest-700">
              ブランド・カテゴリーで絞り込みできます
            </p>
          </div>

          {gearGroups.map((group) => (
            <section key={group.id} className="space-y-3">
              <div className="flex items-end justify-between gap-3 rounded-lg bg-stone-100 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{group.name}</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {group.count.toLocaleString("ja-JP")}件 /{" "}
                    {formatWeight(group.weightGrams)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {group.items.map((item) => (
                  <GearCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GearCard({ item }: { item: UserGear }) {
  const savingsJpy = calculateSavingsJpy(item.msrp_jpy, item.purchase_price_jpy);

  return (
    <article className="rounded-lg bg-white p-4 shadow-soft">
      <div
        className={
          item.image_url
            ? "grid gap-4 sm:grid-cols-[6.5rem_minmax(0,1fr)]"
            : "grid gap-4"
        }
      >
        {item.image_url ? (
          <Link
            href={`/gear/${item.id}`}
            className="flex h-32 w-full items-center justify-center rounded-lg border border-stone-100 bg-stone-50 p-2 sm:h-28"
          >
            <img
              src={item.image_url}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </Link>
        ) : null}

        <div className="min-w-0">
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
            <span className="shrink-0 rounded-lg bg-forest-50 px-3 py-1 text-xs font-semibold text-forest-700">
              {statusLabels[item.status]}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
            <div>
              <p className="text-stone-400">重量</p>
              <p className="font-semibold text-ink">
                {formatWeight(getGearWeightGrams(item))}
              </p>
            </div>
            <div>
              <p className="text-stone-400">MSRP</p>
              <p className="font-semibold text-ink">
                {item.msrp_jpy === null ? "-" : formatJpy(item.msrp_jpy)}
              </p>
            </div>
            <div>
              <p className="text-stone-400">購入価格</p>
              <p className="font-semibold text-ink">
                {item.purchase_price_jpy === null ? "-" : formatJpy(item.purchase_price_jpy)}
              </p>
            </div>
            <div>
              <p className="text-stone-400">節約</p>
              <p className="font-semibold text-ink">
                {savingsJpy === null ? "-" : formatJpy(savingsJpy)}
              </p>
            </div>
            <div>
              <p className="text-stone-400">タイプ</p>
              <p className="font-semibold text-ink">
                {weightTypeLabels[item.weight_type]}
              </p>
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
        </div>
      </div>
    </article>
  );
}

function groupGearByCategory(gear: UserGear[], categories: GearCategory[]) {
  const categoryOrder = new Map(
    categories.map((category, index) => [category.id, category.sort_order ?? index])
  );
  const groups = new Map<
    string,
    {
      id: string;
      name: string;
      sortOrder: number;
      items: UserGear[];
      count: number;
      weightGrams: number;
    }
  >();

  for (const item of gear) {
    const groupId = item.category_id || "other";
    const current = groups.get(groupId) ?? {
      id: groupId,
      name: item.gear_categories?.name_ja ?? "その他",
      sortOrder: categoryOrder.get(groupId) ?? Number.MAX_SAFE_INTEGER,
      items: [],
      count: 0,
      weightGrams: 0
    };

    current.items.push(item);
    current.count += 1;
    current.weightGrams += getGearWeightGrams(item);
    groups.set(groupId, current);
  }

  return [...groups.values()].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name, "ja");
  });
}

function getGearWeightGrams(item: UserGear) {
  return Number(
    item.measured_weight_grams ?? item.official_weight_grams ?? item.weight_grams
  );
}
