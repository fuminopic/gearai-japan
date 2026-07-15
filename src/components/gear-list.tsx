import {
  Archive,
  ChevronRight,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Weight
} from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { EmptyState } from "@/components/ui/empty-state";
import {
  compareGearBrands,
  getGearDisplayWeightGrams,
  getGearDisplayWeightLabel
} from "@/lib/gear-display";
import {
  getMajorGearCategoryCoverage,
  getRetailGearCategory,
  MAJOR_GEAR_CATEGORIES
} from "@/lib/gear-major-categories";
import { statusLabels, weightTypeLabels } from "@/lib/i18n/labels";
import { buildGearHref } from "@/lib/plan-return-to";
import type { GearFilters, UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

type GearListProps = {
  gear: UserGear[];
  summaryGear: UserGear[];
  brands: string[];
  filters: GearFilters;
  returnTo?: string | null;
};

export function GearList({
  gear,
  summaryGear,
  brands,
  filters,
  returnTo
}: GearListProps) {
  const gearGroups = groupGearByCategory(gear);
  const totalWeightGrams = summaryGear.reduce(
    (sum, item) => sum + getGearWeightGrams(item),
    0
  );
  const majorCategoryCoverage = getMajorGearCategoryCoverage(summaryGear);
  const selectedBrand = filters.brand ?? "";
  const visibleBrands = [
    ...new Set([selectedBrand, ...brands].filter((brand): brand is string => Boolean(brand)))
  ].sort(compareGearBrands);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-stone-100">
          <InventoryStat
            icon={<Archive className="h-4 w-4" />}
            label="所有アイテム"
            value={`${summaryGear.length.toLocaleString("ja-JP")}件`}
          />
          <InventoryStat
            icon={<Weight className="h-4 w-4" />}
            label="総重量"
            value={formatWeight(totalWeightGrams)}
          />
          <InventoryStat
            icon={<PackagePlus className="h-4 w-4" />}
            label="主要カテゴリー"
            value={`${majorCategoryCoverage.coveredCount} / ${majorCategoryCoverage.totalCount}`}
          />
        </div>
        <div className="border-t border-stone-100 px-4 py-3">
          {majorCategoryCoverage.missingLabels.length > 0 ? (
            <p className="text-xs font-semibold leading-5 text-stone-500">
              未登録: {majorCategoryCoverage.missingLabels.join("、")}
            </p>
          ) : (
            <p className="text-xs font-semibold text-forest-700">
              主要カテゴリーは登録済みです
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold text-forest-700">絞り込み</p>
            <p className="mt-0.5 text-sm font-medium text-stone-500">
              {gear.length.toLocaleString("ja-JP")}件を表示中
            </p>
          </div>
          {(filters.q || filters.brand || filters.category || (filters.status && filters.status !== "all")) ? (
            <Link
              href={buildFilteredGearHref(filters, {}, returnTo)}
              className="inline-flex h-8 items-center justify-center rounded-lg bg-stone-100 px-3 text-xs font-semibold leading-none text-stone-600"
            >
              解除
            </Link>
          ) : null}
        </div>

        <form className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
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
          <input type="hidden" name="returnTo" value={returnTo ?? ""} />
          <button className="inline-flex h-9 items-center justify-center rounded-lg bg-ink px-3 text-xs font-semibold leading-none text-white transition active:scale-95">
            検索
          </button>
        </form>

        <div className="mt-4">
          <FilterLabel icon={<PackagePlus className="h-4 w-4" />} label="ブランド" />
          <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 pb-1">
            <FilterChip
              href={buildFilteredGearHref(filters, { brand: undefined, category: undefined }, returnTo)}
              active={!selectedBrand}
              fixedWidth
            >
              すべて
            </FilterChip>
            {visibleBrands.map((brand) => (
              <FilterChip
                key={brand}
                href={buildFilteredGearHref(filters, { brand, category: undefined }, returnTo)}
                active={selectedBrand === brand}
                fixedWidth
                logoSurface
              >
                <BrandLogo brand={brand} compact />
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
              href={buildFilteredGearHref(filters, { category: undefined }, returnTo)}
              active={!filters.category}
            >
              すべて
            </FilterChip>
            {MAJOR_GEAR_CATEGORIES.map((category) => (
              <FilterChip
                key={category.id}
                href={buildFilteredGearHref(filters, { category: category.id }, returnTo)}
                active={filters.category === category.id}
              >
                {category.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="grid grid-cols-3 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
            <StatusChip href={buildFilteredGearHref(filters, { status: "all" }, returnTo)} active={(filters.status ?? "all") === "all"}>
              すべて
            </StatusChip>
            <StatusChip href={buildFilteredGearHref(filters, { status: "owned" }, returnTo)} active={filters.status === "owned"}>
              所有
            </StatusChip>
            <StatusChip href={buildFilteredGearHref(filters, { status: "wishlist" }, returnTo)} active={filters.status === "wishlist"}>
              欲しい
            </StatusChip>
          </div>

          <form className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
            <input type="hidden" name="q" value={filters.q ?? ""} />
            <input type="hidden" name="status" value={filters.status ?? "all"} />
            <input type="hidden" name="brand" value={filters.brand ?? ""} />
            <input type="hidden" name="category" value={filters.category ?? ""} />
            <input type="hidden" name="returnTo" value={returnTo ?? ""} />
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
            </select>
            <button className="rounded-lg bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-700">
              適用
            </button>
          </form>
        </div>
      </section>

      {gear.length === 0 ? (
        <EmptyState
          className="rounded-2xl shadow-sm"
          title="まだ装備がありません"
          description="まずはバックパック、レインウェア、ヘッドライトなどから登録してみましょう。"
          action={
            <Link
              href={buildGearHref("/gear/new", returnTo)}
              className="inline-flex rounded-xl bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
            >
              装備を追加
            </Link>
          }
        />
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
            <section key={group.id} className="space-y-2">
              <div className="flex items-end justify-between gap-3 px-1">
                <div>
                  <h2 className="text-base font-semibold text-ink">{group.name}</h2>
                  <p className="mt-1 text-xs text-stone-500">
                    {group.count.toLocaleString("ja-JP")}件 /{" "}
                    {formatWeight(group.weightGrams)}
                  </p>
                </div>
              </div>

              <div className="grid gap-2">
                {group.items.map((item) => (
                  <GearCard key={item.id} item={item} returnTo={returnTo} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function GearCard({
  item,
  returnTo
}: {
  item: UserGear;
  returnTo?: string | null;
}) {
  const retailCategory = getRetailGearCategory(item);
  const categoryLabel =
    retailCategory?.label ?? item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja;
  const weightLabel = getGearDisplayWeightLabel(item);

  return (
    <article className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition hover:border-forest-100 hover:bg-forest-50/30">
      <Link
        href={buildGearHref(`/gear/${item.id}`, returnTo)}
        className="grid grid-cols-[4rem_minmax(0,1fr)_auto] items-center gap-3 px-3 py-3 sm:px-4"
      >
        {item.image_url ? (
          <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-stone-100 bg-white p-2">
            <img
              src={item.image_url}
              alt={item.name}
              className="max-h-full max-w-full object-contain mix-blend-multiply"
              loading="lazy"
            />
          </span>
        ) : (
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-forest-50 text-forest-700">
            <PackagePlus className="h-6 w-6" />
          </span>
        )}

        <div className="min-w-0">
          <div className="flex min-w-0 items-start justify-between gap-2">
            <span className="block min-w-0 truncate text-base font-semibold text-ink">
              {item.name}
            </span>
            <span className="inline-flex h-6 shrink-0 items-center justify-center rounded-md bg-forest-50 px-2 text-[11px] font-semibold leading-none text-forest-700">
              {statusLabels[item.status]}
            </span>
          </div>
          <span className="mt-0.5 block truncate text-sm text-stone-500">
            {[item.brand, item.model].filter(Boolean).join(" / ") || "ブランド未設定"}
          </span>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            {categoryLabel ? (
              <span className="rounded-lg bg-forest-50 px-2 py-0.5 font-semibold text-forest-800">
                {categoryLabel}
              </span>
            ) : null}
            <span className="font-semibold text-stone-600">
              {weightLabel}
            </span>
            <span className="text-stone-400">/</span>
            <span className="font-semibold text-stone-500">
              {weightTypeLabels[item.weight_type]}
            </span>
          </div>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-stone-100 bg-white text-forest-700">
          <ChevronRight className="h-5 w-5" />
        </span>
      </Link>
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
      <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-forest-50 text-forest-700">
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
  children,
  fixedWidth = false,
  logoSurface = false
}: {
  href: Route;
  active: boolean;
  children: ReactNode;
  fixedWidth?: boolean;
  logoSurface?: boolean;
}) {
  const stateClass = logoSurface
    ? active
      ? "border-forest-700 bg-white text-stone-900 ring-1 ring-forest-700"
      : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800"
    : active
      ? "border-forest-700 bg-forest-700 text-white"
      : "border-stone-200 bg-white text-stone-700 hover:border-forest-200 hover:bg-forest-50 hover:text-forest-800";

  return (
    <Link
      href={href}
      className={`inline-flex h-10 shrink-0 items-center justify-center rounded-lg border text-sm font-semibold leading-none transition ${
        fixedWidth ? "w-[7.75rem] px-2" : "px-3"
      } ${stateClass}`}
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
      className={`inline-flex h-10 items-center justify-center rounded-lg px-3 text-center leading-none transition ${
        active ? "bg-white text-ink shadow-sm" : "text-stone-500 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function buildFilteredGearHref(
  filters: GearFilters,
  patch: Partial<GearFilters & { brand?: string; category?: string }>,
  returnTo?: string | null
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
  return buildGearHref(query ? `/gear?${query}` : "/gear", returnTo);
}

function groupGearByCategory(gear: UserGear[]) {
  const categoryOrder = new Map<string, number>(
    MAJOR_GEAR_CATEGORIES.map((category, index) => [category.id, index])
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
    const retailCategory = getRetailGearCategory(item);
    const groupId = retailCategory?.id ?? item.category_id ?? "other";
    const current = groups.get(groupId) ?? {
      id: groupId,
      name: retailCategory?.label ?? item.gear_categories?.name_ja ?? "その他",
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
  return getGearDisplayWeightGrams(item) ?? 0;
}
