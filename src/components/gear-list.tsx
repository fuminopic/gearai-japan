import {
  Archive,
  ChevronRight,
  Edit3,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Trash2,
  WalletCards,
  Weight
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

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
  const totalWeightGrams = gear.reduce((sum, item) => sum + getGearWeightGrams(item), 0);
  const totalValueJpy = gear.reduce(
    (sum, item) => sum + Number(item.purchase_price_jpy ?? item.msrp_jpy ?? 0),
    0
  );
  const selectedBrand = filters.brand ?? "";
  const visibleBrands = [
    ...new Set([selectedBrand, ...brands].filter((brand): brand is string => Boolean(brand)))
  ].sort((a, b) => a.localeCompare(b, "ja"));

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-soft">
        <div className="grid grid-cols-3 divide-x divide-stone-100">
          <InventoryStat
            icon={<Archive className="h-4 w-4" />}
            label="所有アイテム"
            value={`${gear.length.toLocaleString("ja-JP")}件`}
          />
          <InventoryStat
            icon={<Weight className="h-4 w-4" />}
            label="総重量"
            value={formatWeight(totalWeightGrams)}
          />
          <InventoryStat
            icon={<WalletCards className="h-4 w-4" />}
            label="総額"
            value={totalValueJpy === 0 ? "-" : formatJpy(totalValueJpy)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-white/70 bg-white/90 p-3 shadow-soft">
        <form className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <Search className="h-5 w-5 shrink-0 text-stone-400" />
          <input
            name="q"
            defaultValue={filters.q}
            className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none"
            placeholder="装備名・ブランドで検索"
          />
          <input type="hidden" name="status" value={filters.status ?? "all"} />
          <input type="hidden" name="brand" value={filters.brand ?? ""} />
          <input type="hidden" name="category" value={filters.category ?? ""} />
          <input type="hidden" name="sort" value={filters.sort ?? "newest"} />
          <button className="rounded-lg bg-ink px-3 py-2 text-xs font-semibold text-white">
            検索
          </button>
        </form>

        <div className="mt-4">
          <FilterLabel icon={<PackagePlus className="h-4 w-4" />} label="ブランド" />
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              href={buildGearHref(filters, { brand: undefined, category: undefined })}
              active={!selectedBrand}
            >
              すべて
            </FilterChip>
            {visibleBrands.map((brand) => (
              <FilterChip
                key={brand}
                href={buildGearHref(filters, { brand, category: undefined })}
                active={selectedBrand === brand}
              >
                {brand}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <FilterLabel
            icon={<SlidersHorizontal className="h-4 w-4" />}
            label={selectedBrand ? `${selectedBrand} のカテゴリー` : "カテゴリー"}
          />
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              href={buildGearHref(filters, { category: undefined })}
              active={!filters.category}
            >
              すべて
            </FilterChip>
            {categories.map((category) => (
              <FilterChip
                key={category.id}
                href={buildGearHref(filters, { category: category.id })}
                active={filters.category === category.id}
              >
                {category.name_ja}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-3 rounded-lg bg-stone-100 p-1 text-sm font-semibold">
            <StatusChip href={buildGearHref(filters, { status: "all" })} active={(filters.status ?? "all") === "all"}>
              すべて
            </StatusChip>
            <StatusChip href={buildGearHref(filters, { status: "owned" })} active={filters.status === "owned"}>
              所有
            </StatusChip>
            <StatusChip href={buildGearHref(filters, { status: "wishlist" })} active={filters.status === "wishlist"}>
              欲しい
            </StatusChip>
          </div>

          <form className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
            <input type="hidden" name="q" value={filters.q ?? ""} />
            <input type="hidden" name="status" value={filters.status ?? "all"} />
            <input type="hidden" name="brand" value={filters.brand ?? ""} />
            <input type="hidden" name="category" value={filters.category ?? ""} />
            <label className="text-xs font-semibold text-stone-500" htmlFor="gear-sort">
              並び順
            </label>
            <select
              id="gear-sort"
              name="sort"
              defaultValue={filters.sort ?? "newest"}
              className="bg-transparent text-sm font-semibold text-ink outline-none"
            >
              <option value="newest">新しい順</option>
              <option value="weight">重い順</option>
              <option value="price">高い順</option>
            </select>
            <button className="rounded bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
              適用
            </button>
          </form>
        </div>
      </section>

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
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <p className="text-xs font-semibold text-forest-700">装備庫</p>
              <h2 className="text-xl font-semibold tracking-normal text-ink">
                {selectedBrand ? selectedBrand : "すべてのブランド"}
              </h2>
            </div>
            <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-stone-500 shadow-sm">
              {gear.length.toLocaleString("ja-JP")}件
            </p>
          </div>

          {gearGroups.map((group) => (
            <section key={group.id} className="overflow-hidden rounded-lg border border-white/70 bg-white/90 shadow-soft">
              <div className="flex items-end justify-between gap-3 border-b border-stone-100 bg-stone-50/80 px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold text-ink">{group.name}</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {group.count.toLocaleString("ja-JP")}件 /{" "}
                    {formatWeight(group.weightGrams)}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-stone-100">
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
  const categoryLabel = item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja;
  const valueLabel =
    item.purchase_price_jpy === null
      ? item.msrp_jpy === null
        ? "-"
        : formatJpy(item.msrp_jpy)
      : formatJpy(item.purchase_price_jpy);

  return (
    <article className="bg-white px-4 py-3">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-3">
        {item.image_url ? (
          <Link
            href={`/gear/${item.id}`}
            className="flex h-16 w-16 items-center justify-center rounded-lg border border-stone-100 bg-stone-50 p-1.5"
          >
            <img
              src={item.image_url}
              alt={item.name}
              className="max-h-full max-w-full object-contain"
              loading="lazy"
            />
          </Link>
        ) : (
          <Link
            href={`/gear/${item.id}`}
            className="flex h-16 w-16 items-center justify-center rounded-lg bg-forest-50 text-forest-700"
          >
            <PackagePlus className="h-6 w-6" />
          </Link>
        )}

        <div className="min-w-0">
          <Link href={`/gear/${item.id}`} className="block min-w-0">
            <span className="block truncate text-base font-semibold text-ink">
              {item.name}
            </span>
            <span className="mt-0.5 block truncate text-sm text-stone-500">
              {[item.brand, item.model].filter(Boolean).join(" / ") || "ブランド未設定"}
            </span>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            {categoryLabel ? (
              <span className="rounded bg-forest-50 px-2 py-1 font-semibold text-forest-800">
                {categoryLabel}
              </span>
            ) : null}
            <span className="font-semibold text-stone-600">
              {formatWeight(getGearWeightGrams(item))}
            </span>
            <span className="text-stone-400">/</span>
            <span className="font-semibold text-stone-600">{valueLabel}</span>
            <span className="text-stone-400">/</span>
            <span className="font-semibold text-stone-500">
              {weightTypeLabels[item.weight_type]}
            </span>
            {savingsJpy ? (
              <span className="text-stone-400">節約 {formatJpy(savingsJpy)}</span>
            ) : null}
          </div>

          <div className="mt-3 flex gap-2 sm:hidden">
            <Link
              href={`/gear/${item.id}/edit`}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-700"
            >
              <Edit3 className="h-4 w-4" />
              編集
            </Link>
            <form action={deleteGear.bind(null, item.id)} className="flex-1">
              <SubmitButton
                pendingLabel="削除中..."
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                削除
              </SubmitButton>
            </form>
          </div>
        </div>
        <div className="hidden items-center gap-1 sm:flex">
          <span className="rounded-lg bg-forest-50 px-2.5 py-1 text-xs font-semibold text-forest-700">
            {statusLabels[item.status]}
          </span>
          <Link
            href={`/gear/${item.id}/edit`}
            className="rounded-lg p-2 text-stone-500 hover:bg-stone-100 hover:text-ink"
            aria-label={`${item.name}を編集`}
          >
            <Edit3 className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-5 w-5 text-stone-300" />
        </div>
      </div>
    </article>
  );
}

function InventoryStat({
  icon,
  label,
  value
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-3 py-4 text-center">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
        {icon}
      </div>
      <p className="mt-2 text-lg font-semibold tracking-normal text-ink">{value}</p>
      <p className="mt-0.5 text-[11px] font-medium text-stone-400">{label}</p>
    </div>
  );
}

function FilterLabel({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
      <span className="text-forest-700">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

function FilterChip({
  href,
  active,
  children
}: {
  href: Route;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-forest-700 bg-forest-700 text-white"
          : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
      }`}
    >
      {children}
    </Link>
  );
}

function StatusChip({
  href,
  active,
  children
}: {
  href: Route;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-center transition ${
        active ? "bg-white text-ink shadow-sm" : "text-stone-500 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function buildGearHref(
  filters: GearFilters,
  patch: Partial<GearFilters & { brand?: string; category?: string }>
) {
  const next = { ...filters, ...patch };
  const params = new URLSearchParams();

  if (next.q) {
    params.set("q", next.q);
  }

  if (next.status && next.status !== "all") {
    params.set("status", next.status);
  }

  if (next.brand) {
    params.set("brand", next.brand);
  }

  if (next.category) {
    params.set("category", next.category);
  }

  if (next.sort && next.sort !== "newest") {
    params.set("sort", next.sort);
  }

  const query = params.toString();
  return (query ? `/gear?${query}` : "/gear") as Route;
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
