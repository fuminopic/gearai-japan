import { ChevronRight, PackagePlus, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import {
  GearPackBar,
  GearPackProvider,
  GearPackToggle
} from "@/components/gear-pack-controls";
import { GearStepHint } from "@/components/gear-step-hint";
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
import { weightTypeLabels } from "@/lib/i18n/labels";
import { buildGearHref } from "@/lib/plan-return-to";
import type { GearFilters, UserGear } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

const packRoute = "/pack" as Route;

type GearListProps = {
  addHref: Route;
  packedGearIds: string[];
  packItemCount: number;
  packKnownWeightG: number;
  gear: UserGear[];
  summaryGear: UserGear[];
  brands: string[];
  filters: GearFilters;
  returnTo?: string | null;
};

export function GearList({
  addHref,
  packedGearIds,
  packItemCount,
  packKnownWeightG,
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
  const hasActiveFilters = Boolean(
    filters.q ||
      filters.brand ||
      filters.category
  );
  const visibleBrands = [
    ...new Set([selectedBrand, ...brands].filter((brand): brand is string => Boolean(brand)))
  ].sort(compareGearBrands);

  return (
    <GearPackProvider
      initialPackedIds={packedGearIds}
      initialItemCount={packItemCount}
      initialKnownWeightG={packKnownWeightG}
    >
    <div className="space-y-[11px]">
      {/* 概要カード: ホームのマイギアカードと同じ骨格(rounded-[20px] /
          font-din の数値 / metric-*.png のアイコン / #EEEDE6 の区切り線)。
          数値はホームと同じ 22px。3列に収めるため、アイコンは数値の左に
          置き、狭い画面では段階的に縮める(SummaryStat 内のコメント参照)。 */}
      <section className="rounded-[20px] bg-white px-5 pt-4 pb-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#EEEDE6] pb-3">
          <h2 className="text-base font-bold">マイギア</h2>
          <Link
            href={addHref}
            aria-label="ギアを追加"
            className="inline-flex h-8 items-center justify-center gap-1 rounded-xl bg-[#4E914A] px-4 text-[12px] font-bold leading-none text-white shadow-sm transition active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            追加
          </Link>
        </div>

        <div className="flex flex-row items-center justify-between pt-4">
          <SummaryStat
            iconSrc="/metric-count.png"
            value={`${summaryGear.length.toLocaleString("ja-JP")}点`}
            label="マイギア"
            divided
          />
          <SummaryStat
            iconSrc="/metric-weight.png"
            value={formatWeight(totalWeightGrams, { compact: true })}
            label="総重量"
            divided
          />
          {/* マイギア全体で登録済みの主要カテゴリー数。直下の「未登録: …」が
              数え方を補足する。3カラムに収まる長さにするため短いラベルにする。 */}
          <SummaryStat
            iconSrc="/metric-category.png"
            value={`${majorCategoryCoverage.coveredCount} / ${majorCategoryCoverage.totalCount}`}
            label="カテゴリー"
          />
        </div>

        <div className="mt-4 border-t border-[#EEEDE6] pt-3">
          {majorCategoryCoverage.missingLabels.length > 0 ? (
            <p className="text-[11px] font-medium leading-4 text-gray-400">
              未登録: {majorCategoryCoverage.missingLabels.join("、")}
            </p>
          ) : (
            <p className="text-[11px] font-medium leading-4 text-[#14724e]">
              主要カテゴリーは登録済みです
            </p>
          )}
        </div>
      </section>

      <GearStepHint hasGear={summaryGear.length > 0} hasPackItems={packItemCount > 0} />

      {/* 一覧より前に置くのは折りたたんだ絞り込みだけ。検索はこの中に入れて
          ファーストビューをギアに明け渡す(登録数が増えるまで検索は使わない)。
          絞り込み中は open で開いた状態になるので、フィルタが効いていることを
          見落とさない。折りたたみは素の <details>、フィルタは従来どおり
          URL 駆動の <Link> のまま(クライアント状態を増やさない)。 */}
      <details
        open={hasActiveFilters}
        className="group rounded-[20px] bg-white shadow-sm [&:not([open])]:w-fit [&_summary::-webkit-details-marker]:hidden"
      >
        {/* 閉じているときは幅も高さも約半分の控えめなボタン。開くと
            パネルとして全幅に戻る。 */}
        <summary className="flex h-8 cursor-pointer list-none items-center gap-1.5 px-4 group-open:h-auto group-open:justify-between group-open:py-3">
          <span className="whitespace-nowrap text-[12px] font-bold text-ink">
            {hasActiveFilters
              ? `絞り込み中 ・ ${gear.length.toLocaleString("ja-JP")}点`
              : "ブランド・カテゴリーで絞り込む"}
          </span>
          <ChevronRight
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 text-gray-300 transition-transform group-open:rotate-90"
          />
        </summary>

        <div className="border-t border-[#EEEDE6] p-5">
          {hasActiveFilters ? (
            <Link
              href={buildFilteredGearHref(filters, {}, returnTo)}
              className="mb-4 inline-flex h-8 items-center justify-center rounded-full bg-stone-100 px-3 text-xs font-semibold leading-none text-stone-600"
            >
              絞り込みを解除
            </Link>
          ) : null}

          <form className="flex items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2">
            <Search className="h-5 w-5 shrink-0 text-stone-400" />
            <input
              name="q"
              defaultValue={filters.q}
              className="min-w-0 flex-1 bg-transparent py-1 text-base outline-none"
              placeholder="ギア名・ブランドで検索"
            />
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

        <div className="mt-4">
          <form className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2 sm:ml-auto sm:w-fit">
            <input type="hidden" name="q" value={filters.q ?? ""} />
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
        </div>
      </details>

      {gear.length === 0 ? (
        <EmptyState
          className="rounded-2xl shadow-sm"
          title="まだギアがありません"
          description="まずはバックパック、レインウェア、ヘッドライトなどから登録してみましょう。"
          action={
            <Link
              href={buildGearHref("/gear/new", returnTo)}
              className="inline-flex rounded-xl bg-forest-700 px-5 py-3 text-sm font-semibold text-white"
            >
              ギアを追加
            </Link>
          }
        />
      ) : (
        <div className="space-y-[11px]">
          {/* ブランドを絞り込んでいるときだけ、解除できるチップを出す。
              「すべてのブランド」という情報量ゼロの見出しは置かない
              (件数も上の概要カードに出ている)。 */}
          {selectedBrand ? (
            <Link
              href={buildFilteredGearHref(filters, { brand: undefined }, returnTo)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#14724e] px-3 py-1.5 text-[11px] font-bold text-white"
            >
              {selectedBrand} {gear.length.toLocaleString("ja-JP")}点
              <X aria-hidden className="h-3 w-3" strokeWidth={3} />
            </Link>
          ) : null}

          {gearGroups.map((group) => (
            <section key={group.id} className="space-y-2">
              {/* 見出しはホームのセクション見出しと同じ 16px bold。件数と重量は
                  gray-400 の補足として同じ行に置き、縦を使わない。 */}
              <div className="flex items-baseline justify-between gap-3 px-1 pt-1">
                <h2 className="text-base font-bold text-ink">{group.name}</h2>
                <span className="whitespace-nowrap font-din text-[11px] font-medium text-gray-400">
                  {group.count.toLocaleString("ja-JP")}点 / {formatWeight(group.weightGrams)}
                </span>
              </div>

              <div className="grid gap-2">
                {group.items.map((item, index) => (
                  <GearCard
                    key={item.id}
                    item={item}
                    returnTo={returnTo}
                    deferRender={index >= 4}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <GearPackBar href={packRoute} />
    </div>
    </GearPackProvider>
  );
}

function GearCard({
  item,
  returnTo,
  deferRender = false
}: {
  item: UserGear;
  returnTo?: string | null;
  /** 各カテゴリの先頭 4 件だけを初期レイアウト対象にし、画面外のカードは
   * ブラウザに描画を譲る。データ・画像 URL を追加でキャッシュしない。 */
  deferRender?: boolean;
}) {
  const retailCategory = getRetailGearCategory(item);
  const categoryLabel =
    retailCategory?.label ?? item.gear_subcategories?.name_ja ?? item.gear_categories?.name_ja;
  const weightLabel = getGearDisplayWeightLabel(item);

  return (
    // hover の背景は付けない。bg-forest-50/30 は白を「30%の色」で置き換えるため、
    // タッチ端末で hover が残るとカードの白背景が抜けて見える(スクロールすると
    // 直るのは hover が外れるから)。枠線だけ、ポインタのある端末で変える。
    <article
      className="flex items-center overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition [@media(hover:hover)]:hover:border-forest-200"
      style={deferRender ? { contentVisibility: "auto", containIntrinsicSize: "0 104px" } : undefined}
    >
      <Link
        href={buildGearHref(`/gear/${item.id}`, returnTo)}
        className="grid min-w-0 flex-1 grid-cols-[4rem_minmax(0,1fr)] items-center gap-3 px-3 py-3 sm:px-4"
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
      </Link>

      {/* スイッチはリンクの外。行本体をタップ=詳細、スイッチ=パック出し入れ。 */}
      <div className="flex shrink-0 items-center pr-3 sm:pr-4">
        <GearPackToggle
          gearId={item.id}
          weightGrams={getGearWeightGrams(item)}
        />
      </div>
    </article>
  );
}

// ホームの SummaryMetric と同じ見た目(metric-*.png / font-din / gray-400)。
// 同じ「数値+ラベル」がアプリ内で二通りに見えないよう揃えている。
function SummaryStat({
  iconSrc,
  label,
  value,
  divided = false
}: {
  iconSrc: string;
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 px-1.5 pt-1 text-center max-[359px]:px-1 ${
        divided ? "border-r border-gray-100" : ""
      }`}
    >
      {/* アイコンは数値の左に置く。ホームは指標2つなので縦積みで余裕があるが、
          ここは3列。縦積みのままだとアイコンだけで1行(24px)使ってしまい、
          行間を保ったままカードを縮められないため、横並びにしている。 */}
      {/* 3カラムに「アイコン + 数値」を横並びで収める。最長は総重量の
          "4.87kg" で、幅が足りなくなる 390px 未満と 360px 未満で段階的に
          縮める(whitespace-nowrap なので、はみ出すと隣の区切り線に重なる)。 */}
      <div className="flex items-center gap-2 max-[389px]:gap-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          className="h-5 w-auto shrink-0 object-contain max-[389px]:h-4"
        />
        <p className="whitespace-nowrap font-din text-[22px] font-bold leading-none text-black max-[389px]:text-[19px] max-[359px]:text-[17px]">
          {value}
        </p>
      </div>
      <p className="whitespace-nowrap text-[11px] font-medium text-gray-400">{label}</p>
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
