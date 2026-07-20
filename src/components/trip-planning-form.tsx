"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { Check, ChevronsUpDown, ClipboardCheck, Mountain, Search } from "lucide-react";

import {
  mountainFoundationSeasonLabels,
  mountainFoundationStyleLabels
} from "@/lib/i18n/labels";
import type {
  MountainFoundationProfile,
  MountainFoundationPrimaryRegion,
  MountainFoundationSeason,
  MountainFoundationStyle
} from "@/lib/types";

type TripPlanningFormProps = {
  mountains: MountainFoundationProfile[];
  blockedMountainSlugs?: string[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  selectedPlannedDate?: string;
  selectedPlannedEndDate?: string;
  selectedTripMemo?: string;
  onPlanDetailsChange?: (details: Partial<PlanDetailsDraft>) => void;
  planId?: string | null;
  error?: string;
};

type PlanDetailsDraft = {
  plannedDate: string;
  plannedEndDate: string;
  tripMemo: string;
};

type MountainListFilter = "HYAKUMEIZAN" | "NIHYAKUMEIZAN_EXTRA" | "AREA" | "ALL";
type MountainAreaFilter = "ALL" | MountainFoundationPrimaryRegion;

const mountainListFilters: Array<{
  value: MountainListFilter;
  label: string;
  title: string;
}> = [
  {
    value: "HYAKUMEIZAN",
    label: "日本百名山",
    title: "日本百名山（標高順）"
  },
  {
    value: "NIHYAKUMEIZAN_EXTRA",
    label: "二百名山",
    title: "二百名山（百名山以外・標高順）"
  },
  {
    value: "AREA",
    label: "エリア",
    title: "エリア別"
  },
  {
    value: "ALL",
    label: "すべて",
    title: "登録山岳（標高順）"
  }
];

const mountainAreaOrder: readonly MountainFoundationPrimaryRegion[] = [
  "HOKKAIDO",
  "TOHOKU",
  "HOKUSHINETSU",
  "KANTO",
  "KANTO_TOKYO",
  "JOSHU",
  "NIKKO",
  "TANZAWA",
  "OKUCHICHIBU",
  "FUJI",
  "YATSUGATAKE",
  "NORTHERN_ALPS",
  "CENTRAL_ALPS",
  "SOUTHERN_ALPS",
  "HOKURIKU",
  "TOKAI",
  "KINKI",
  "CHUGOKU",
  "SHIKOKU",
  "KYUSHU",
  "YAKUSHIMA"
];

const mountainAreaLabels: Record<MountainFoundationPrimaryRegion, string> = {
  HOKKAIDO: "北海道",
  TOHOKU: "東北",
  HOKUSHINETSU: "北信越",
  KANTO: "関東",
  KANTO_TOKYO: "東京近郊",
  HOKURIKU: "北陸",
  TOKAI: "東海",
  KINKI: "近畿",
  FUJI: "富士山周辺",
  OKUCHICHIBU: "奥秩父",
  TANZAWA: "丹沢",
  NIKKO: "日光",
  YATSUGATAKE: "八ヶ岳",
  NORTHERN_ALPS: "北アルプス",
  CENTRAL_ALPS: "中央アルプス",
  SOUTHERN_ALPS: "南アルプス",
  CHUGOKU: "中国",
  SHIKOKU: "四国",
  KYUSHU: "九州",
  YAKUSHIMA: "屋久島",
  JOSHU: "上州"
};

export function TripPlanningForm({
  mountains,
  blockedMountainSlugs = [],
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  selectedPlannedDate = "",
  selectedPlannedEndDate = "",
  selectedTripMemo = "",
  onPlanDetailsChange,
  planId,
  error
}: TripPlanningFormProps) {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const selectableMountains = useMemo(() => getOfficialMeizanMountains(mountains), [mountains]);
  const blockedMountainSlugSet = useMemo(
    () => new Set(blockedMountainSlugs),
    [blockedMountainSlugs]
  );
  const initialMountainSlug = getAvailableMountainSlug(
    selectedMountainSlug,
    selectableMountains,
    blockedMountainSlugSet
  );
  const [mountainSlug, setMountainSlug] = useState(initialMountainSlug);
  const [mountainQuery, setMountainQuery] = useState("");
  const [mountainListFilter, setMountainListFilter] =
    useState<MountainListFilter>("HYAKUMEIZAN");
  const [selectedArea, setSelectedArea] = useState<MountainAreaFilter>("ALL");
  const [visibleMountainCount, setVisibleMountainCount] = useState(3);
  const selectedMountain = useMemo(() => {
    return (
      selectableMountains.find((mountain) => mountain.slug === mountainSlug) ??
      selectableMountains.find(
        (mountain) => !isPlanningBlockedMountain(mountain, blockedMountainSlugSet)
      )
    );
  }, [blockedMountainSlugSet, mountainSlug, selectableMountains]);
  const filteredMountains = useMemo(() => {
    return getFilteredMountains(
      selectableMountains,
      mountainListFilter,
      mountainQuery,
      selectedArea
    );
  }, [selectableMountains, mountainListFilter, mountainQuery, selectedArea]);
  const visibleMountains = filteredMountains.slice(0, visibleMountainCount);
  const mountainCounts = useMemo(
    () => getMountainListCounts(selectableMountains),
    [selectableMountains]
  );
  const mountainAreaOptions = useMemo(
    () => getMountainAreaOptions(selectableMountains),
    [selectableMountains]
  );
  const activeListTitle = mountainQuery.trim()
    ? "検索結果"
    : getMountainListFilterTitle(mountainListFilter, selectedArea);
  const seasonOptions = selectedMountain?.supported_seasons ?? [];
  const styleOptions = selectedMountain?.supported_styles ?? [];
  const plannedDateValue = selectedPlannedDate || getTodayDateValue();
  const effectiveSeason = seasonOptions.includes(selectedSeason)
    ? selectedSeason
    : seasonOptions[0];
  const effectiveStyle = styleOptions.includes(selectedStyle)
    ? selectedStyle
    : styleOptions[0];
  const [styleDraft, setStyleDraft] = useState<MountainFoundationStyle>(effectiveStyle);
  const currentStyle = styleOptions.includes(styleDraft) ? styleDraft : effectiveStyle;
  const usesDateRange = isOvernightStyle(currentStyle);
  const plannedEndDateValue = normalizeEndDateValue(
    plannedDateValue,
    selectedPlannedEndDate || plannedDateValue,
    currentStyle
  );
  const prefetchedPlanHref = useMemo(() => {
    if (!mountainSlug || !effectiveSeason || !currentStyle) {
      return null;
    }

    const params = new URLSearchParams();

    if (planId) {
      params.set("id", planId);
    }

    params.set("mountain", mountainSlug);
    params.set("season", effectiveSeason);
    params.set("style", currentStyle);

    return `/plan?${params.toString()}` as Route;
  }, [currentStyle, effectiveSeason, mountainSlug, planId]);

  useEffect(() => {
    const nextMountainSlug = getAvailableMountainSlug(
      selectedMountainSlug,
      selectableMountains,
      blockedMountainSlugSet
    );
    setMountainSlug(nextMountainSlug);
  }, [blockedMountainSlugSet, selectedMountainSlug, selectableMountains]);

  useEffect(() => {
    setVisibleMountainCount(3);
  }, [mountainListFilter, mountainQuery, selectedArea]);

  useEffect(() => {
    setStyleDraft(effectiveStyle);
  }, [effectiveStyle, mountainSlug]);

  useEffect(() => {
    if (!prefetchedPlanHref) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.prefetch(prefetchedPlanHref);
    }, 150);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [prefetchedPlanHref, router]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!mountainSlug || selectableMountains.length === 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ["id", "mountain", "season", "style", "date", "end_date", "memo"]) {
      const value = formData.get(key);

      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    }

    params.set("focus", "checklist");

    startTransition(() => {
      router.push(`/plan?${params.toString()}` as Route, { scroll: false });
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-[11px]">
      <section className="rounded-[20px] bg-white p-4 shadow-sm sm:p-5">
        {planId ? <input type="hidden" name="id" value={planId} /> : null}

        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <input type="hidden" name="mountain" value={mountainSlug} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
          <section>
            <h1 className="text-[18px] font-bold leading-tight tracking-normal text-ink sm:text-[20px]">
              次の山行、どこにする？
            </h1>
            {selectedMountain ? (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-forest-100 bg-forest-50/60 px-3 py-2">
                <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#14724e] text-white">
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold text-forest-800">
                    選択中
                  </span>
                  <span className="block truncate text-[13px] font-bold text-ink">
                    {selectedMountain.name_ja}
                    <span className="ml-1 font-semibold text-stone-600">
                      {selectedMountain.elevation_m.toLocaleString("ja-JP")}m
                    </span>
                  </span>
                  <span className="block truncate text-[10px] font-semibold text-stone-500">
                    {formatMountainArea(selectedMountain)}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    searchInputRef.current?.scrollIntoView({
                      behavior: "smooth",
                      block: "center"
                    });
                    searchInputRef.current?.focus();
                  }}
                  className="shrink-0 text-[11px] font-bold text-[#14724e]"
                >
                  変更
                </button>
              </div>
            ) : null}

            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                ref={searchInputRef}
                type="search"
                value={mountainQuery}
                onChange={(event) => setMountainQuery(event.target.value)}
                placeholder="山名・地域・ローマ字で検索"
                className="w-full rounded-lg border border-stone-200 bg-stone-50 px-10 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white sm:py-3"
              />
            </div>

            <div className="-mx-1 mt-3 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {mountainListFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => {
                    setMountainListFilter(filter.value);
                    if (filter.value === "AREA" && selectedMountain) {
                      setSelectedArea(selectedMountain.primary_region);
                    }
                  }}
                  className={`inline-flex h-9 shrink-0 items-center justify-center rounded-full px-3.5 text-xs font-bold leading-none transition ${
                    mountainListFilter === filter.value
                      ? "bg-[#14724e] text-white"
                      : "bg-forest-50 text-forest-800"
                  }`}
                >
                  {filter.label}
                  <span className="ml-1 opacity-75">
                    {getMountainListCount(mountainCounts, filter.value)}
                  </span>
                </button>
              ))}
            </div>

            {mountainListFilter === "AREA" && !mountainQuery.trim() ? (
              <div className="mt-3 flex max-h-28 flex-wrap gap-2 overflow-y-auto rounded-lg border border-stone-100 bg-stone-50 p-2">
                {mountainAreaOptions.map((area) => (
                  <button
                    key={area.value}
                    type="button"
                    onClick={() => setSelectedArea(area.value)}
                    className={`inline-flex h-7 items-center justify-center rounded-full px-2.5 text-xs font-bold leading-none transition ${
                      selectedArea === area.value
                        ? "bg-[#14724e] text-white"
                        : "bg-white text-stone-600"
                    }`}
                  >
                    {area.label}
                    <span className="ml-1 opacity-75">
                      {area.count.toLocaleString("ja-JP")}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

          </section>

          <section>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-stone-700">
                {activeListTitle}
              </h2>
              <span className="text-xs font-semibold text-stone-500">
                {filteredMountains.length.toLocaleString("ja-JP")} 座
              </span>
            </div>

            <div className="mt-2 space-y-2">
              {filteredMountains.length > 0 ? (
                visibleMountains.map((mountain) => {
                  const isBlockedMountain = isPlanningBlockedMountain(
                    mountain,
                    blockedMountainSlugSet
                  );

                  return (
                    <button
                      key={mountain.slug}
                      type="button"
                      onClick={() => setMountainSlug(mountain.slug)}
                      aria-pressed={mountain.slug === mountainSlug}
                      aria-disabled={isBlockedMountain}
                      disabled={isBlockedMountain}
                      className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition ${
                        mountain.slug === mountainSlug
                          ? "border-forest-200 bg-forest-50"
                          : "border-stone-100 bg-stone-50 [@media(hover:hover)]:hover:border-stone-200"
                      } ${isBlockedMountain ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#14724e]">
                        <Mountain className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-ink">
                            {mountain.name_ja}
                          </span>
                          <span className="text-xs font-semibold text-stone-500">
                            {mountain.elevation_m.toLocaleString("ja-JP")}m
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-stone-500">
                          <span>{formatMountainArea(mountain)}</span>
                          <MountainListBadge mountain={mountain} />
                        </span>
                      </span>
                      <span
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          mountain.slug === mountainSlug
                            ? "border-[#14724e] bg-[#14724e] text-white"
                            : "border-stone-300 bg-white"
                        }`}
                        aria-hidden="true"
                      >
                        {mountain.slug === mountainSlug ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : null}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-xl border border-stone-100 bg-stone-50 px-3 py-3 text-sm font-semibold text-stone-500">
                  該当する山がありません。
                </div>
              )}
            </div>

            {filteredMountains.length > visibleMountains.length || visibleMountainCount > 3 ? (
              <div className="mt-2 flex items-center gap-2">
                {filteredMountains.length > visibleMountains.length ? (
                  <button
                    type="button"
                    onClick={() => setVisibleMountainCount((count) => count + 30)}
                    className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-stone-200 bg-white text-sm font-bold text-[#14724e] transition active:scale-[0.99]"
                  >
                    もっと表示（残り
                    {(filteredMountains.length - visibleMountains.length).toLocaleString("ja-JP")}
                    座）
                  </button>
                ) : null}
                {visibleMountainCount > 3 ? (
                  <button
                    type="button"
                    onClick={() => setVisibleMountainCount(3)}
                    className="inline-flex h-9 shrink-0 items-center justify-center rounded-full bg-stone-100 px-3 text-xs font-bold text-stone-600 transition active:scale-[0.99]"
                  >
                    閉じる
                  </button>
                ) : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>

      <section className="rounded-[20px] bg-white p-4 shadow-sm sm:p-5">
        <h2 className="border-b border-[#EEEDE6] pb-3 text-base font-bold text-ink">
          山行の条件
        </h2>

        <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
          <label className="block min-w-0">
            <span className="text-xs font-bold text-stone-700">季節</span>
            <span className="relative mt-1.5 block">
              <select
                key={`${mountainSlug}-season`}
                name="season"
                defaultValue={effectiveSeason}
                required
                disabled={seasonOptions.length === 0}
                className="h-[42px] w-full min-w-0 appearance-none rounded-xl border border-stone-200 bg-stone-50 px-2 pr-7 text-left text-sm font-semibold leading-none text-ink outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:px-3 sm:pr-8"
              >
                {seasonOptions.map((season) => (
                  <option key={season} value={season}>
                    {mountainFoundationSeasonLabels[season]}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink sm:right-2.5"
              />
            </span>
          </label>

          <label className="block min-w-0">
            <span className="text-xs font-bold text-stone-700">スタイル</span>
            <span className="relative mt-1.5 block">
              <select
                key={`${mountainSlug}-style`}
                name="style"
                value={currentStyle}
                onChange={(event) => {
                  const nextStyle = event.target.value as MountainFoundationStyle;
                  setStyleDraft(nextStyle);
                  onPlanDetailsChange?.({
                    plannedDate: plannedDateValue,
                    plannedEndDate: normalizeEndDateValue(
                      plannedDateValue,
                      plannedEndDateValue,
                      nextStyle
                    )
                  });
                }}
                required
                disabled={styleOptions.length === 0}
                className="h-[42px] w-full min-w-0 appearance-none rounded-xl border border-stone-200 bg-stone-50 px-2 pr-7 text-left text-sm font-semibold leading-none text-ink outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:px-3 sm:pr-8"
              >
                {styleOptions.map((style) => (
                  <option key={style} value={style}>
                    {mountainFoundationStyleLabels[style]}
                  </option>
                ))}
              </select>
              <ChevronsUpDown
                aria-hidden="true"
                className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink sm:right-2.5"
              />
            </span>
          </label>

          <DateRangeField
            label={usesDateRange ? "予定期間" : "予定日"}
            startName="date"
            endName="end_date"
            startValue={plannedDateValue}
            endValue={plannedEndDateValue}
            usesDateRange={usesDateRange}
            onChange={(startValue, endValue) =>
              onPlanDetailsChange?.({
                plannedDate: startValue,
                plannedEndDate: usesDateRange
                  ? normalizeEndDateValue(startValue, endValue, currentStyle)
                  : ""
              })
            }
          />
        </div>

        <label className="mt-4 block">
          <span className="text-xs font-bold text-stone-700">メモ</span>
          <textarea
            name="memo"
            rows={2}
            value={selectedTripMemo}
            onChange={(event) =>
              onPlanDetailsChange?.({ tripMemo: event.target.value })
            }
            placeholder="集合時間、登山口、同行者など"
            className="mt-1.5 w-full resize-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-base outline-none focus:border-forest-500 focus:bg-white"
          />
        </label>

        <button
          disabled={!mountainSlug || selectableMountains.length === 0 || isPending}
          className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#14724e] px-5 text-base font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
        >
          <ClipboardCheck className="h-5 w-5 shrink-0" />
          <span className="truncate">
            {isPending
              ? "作成中..."
              : selectedMountain
                ? `${selectedMountain.name_ja}のパック計画を作成`
                : "パック計画を作成"}
          </span>
        </button>
      </section>
    </form>
  );
}

function getAvailableMountainSlug(
  slug: string,
  mountains: readonly MountainFoundationProfile[],
  blockedMountainSlugs: ReadonlySet<string>
) {
  if (
    mountains.some(
      (mountain) =>
        mountain.slug === slug && !isPlanningBlockedMountain(mountain, blockedMountainSlugs)
    )
  ) {
    return slug;
  }

  return (
    mountains.find((mountain) => !isPlanningBlockedMountain(mountain, blockedMountainSlugs))
      ?.slug ?? ""
  );
}

function isPlanningBlockedMountain(
  mountain: MountainFoundationProfile | null | undefined,
  blockedMountainSlugs: ReadonlySet<string>
) {
  return (
    mountain?.volcanic_risk === "ACTIVE_RESTRICTED" ||
    mountain?.planning_status === "NOT_STANDARD_ROUTE" ||
    (mountain ? blockedMountainSlugs.has(mountain.slug) : false)
  );
}

function getOfficialMeizanMountains(
  mountains: readonly MountainFoundationProfile[]
) {
  return mountains.filter((mountain) => {
    return (
      mountain.meizan_list === "JAPAN_HYAKUMEIZAN" ||
      mountain.meizan_list === "JAPAN_NIHYAKUMEIZAN_EXTRA"
    );
  });
}

function getFilteredMountains(
  mountains: readonly MountainFoundationProfile[],
  filter: MountainListFilter,
  query: string,
  selectedArea: MountainAreaFilter
) {
  const normalizedQuery = normalizeMountainQuery(query);
  const source = normalizedQuery
    ? mountains
    : mountains.filter((mountain) =>
        matchesMountainListFilter(mountain, filter, selectedArea)
      );

  return source
    .filter((mountain) => {
      if (!normalizedQuery) {
        return true;
      }

      return getMountainSearchFields(mountain).some((field) => {
        return normalizeMountainQuery(field).includes(normalizedQuery);
      });
    })
    .sort(sortMountainsByElevation);
}

function matchesMountainListFilter(
  mountain: MountainFoundationProfile,
  filter: MountainListFilter,
  selectedArea: MountainAreaFilter = "ALL"
) {
  if (filter === "HYAKUMEIZAN") {
    return mountain.meizan_list === "JAPAN_HYAKUMEIZAN";
  }

  if (filter === "NIHYAKUMEIZAN_EXTRA") {
    return mountain.meizan_list === "JAPAN_NIHYAKUMEIZAN_EXTRA";
  }

  if (filter === "AREA") {
    return selectedArea === "ALL" || mountain.primary_region === selectedArea;
  }

  return true;
}

function getMountainListCounts(mountains: readonly MountainFoundationProfile[]) {
  return {
    HYAKUMEIZAN: mountains.filter((mountain) =>
      matchesMountainListFilter(mountain, "HYAKUMEIZAN")
    ).length,
    NIHYAKE_EXTRA: mountains.filter((mountain) =>
      matchesMountainListFilter(mountain, "NIHYAKUMEIZAN_EXTRA")
    ).length,
    AREA: mountains.length,
    ALL: mountains.length
  };
}

function getMountainListCount(
  counts: ReturnType<typeof getMountainListCounts>,
  filter: MountainListFilter
) {
  if (filter === "NIHYAKUMEIZAN_EXTRA") {
    return counts.NIHYAKE_EXTRA.toLocaleString("ja-JP");
  }

  return counts[filter].toLocaleString("ja-JP");
}

function getMountainListFilterTitle(
  filter: MountainListFilter,
  selectedArea: MountainAreaFilter
) {
  if (filter === "AREA") {
    return `エリア別（${getMountainAreaLabel(selectedArea)}）`;
  }

  return mountainListFilters.find((item) => item.value === filter)?.title ?? "登録山岳";
}

function getMountainAreaOptions(mountains: readonly MountainFoundationProfile[]) {
  const counts = new Map<MountainFoundationPrimaryRegion, number>();

  for (const mountain of mountains) {
    counts.set(mountain.primary_region, (counts.get(mountain.primary_region) ?? 0) + 1);
  }

  const areas = [...counts.entries()]
    .map(([value, count]) => ({
      value,
      label: getMountainAreaLabel(value),
      count
    }))
    .sort((areaA, areaB) => {
      return getMountainAreaOrder(areaA.value) - getMountainAreaOrder(areaB.value);
    });

  return [
    {
      value: "ALL" as const,
      label: "すべて",
      count: mountains.length
    },
    ...areas
  ];
}

function getMountainAreaLabel(area: MountainAreaFilter) {
  if (area === "ALL") {
    return "すべて";
  }

  return mountainAreaLabels[area] ?? area;
}

function getMountainAreaOrder(area: MountainFoundationPrimaryRegion) {
  const index = mountainAreaOrder.indexOf(area);

  return index === -1 ? mountainAreaOrder.length : index;
}

function getMountainSearchFields(mountain: MountainFoundationProfile) {
  return [
    mountain.name_ja,
    mountain.slug,
    mountain.region,
    mountain.primary_region,
    mountain.mountain_range,
    ...mountain.prefectures
  ];
}

function normalizeMountainQuery(value: string) {
  return value.toLowerCase().replace(/\s+/g, "").trim();
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateDisplay(value: string) {
  return value.replaceAll("-", "/");
}

function DateRangeField({
  label,
  startName,
  endName,
  startValue,
  endValue,
  usesDateRange,
  onChange
}: {
  label: string;
  startName: string;
  endName: string;
  startValue: string;
  endValue: string;
  usesDateRange: boolean;
  onChange: (startValue: string, endValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const normalizedEndValue = normalizeEndDateValue(
    startValue,
    endValue || startValue,
    usesDateRange ? "OVERNIGHT_HUT" : "DAY_HIKE"
  );
  const displayValue = usesDateRange
    ? `${formatDateDisplay(startValue)} - ${formatDateDisplay(normalizedEndValue)}`
    : formatDateDisplay(startValue);

  return (
    <div className="relative block min-w-0">
      <span className="text-xs font-bold text-stone-700">{label}</span>
      <input type="hidden" name={startName} value={startValue} />
      <input type="hidden" name={endName} value={usesDateRange ? normalizedEndValue : ""} />
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative mt-1.5 flex h-[42px] w-full min-w-0 items-center rounded-lg border border-stone-200 bg-stone-50 px-2 pr-7 text-left text-sm font-semibold leading-none text-ink outline-none transition focus:border-forest-500 focus:bg-white sm:px-3 sm:pr-8"
        aria-expanded={isOpen}
      >
        <span className="block min-w-0 truncate">{displayValue}</span>
        <ChevronsUpDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-ink sm:right-2.5"
        />
      </button>
      {isOpen ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(82vw,320px)] rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
          <div className={usesDateRange ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
            <NativeDateInput
              label={usesDateRange ? "開始日" : "予定日"}
              value={startValue}
              onChange={(value) =>
                onChange(
                  value,
                  usesDateRange
                    ? normalizeEndDateValue(value, normalizedEndValue, "OVERNIGHT_HUT")
                    : ""
                )
              }
            />
            {usesDateRange ? (
              <NativeDateInput
                label="終了日"
                value={normalizedEndValue}
                min={startValue}
                onChange={(value) => onChange(startValue, value)}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-forest-700 text-xs font-bold text-white"
          >
            決定
          </button>
        </div>
      ) : null}
    </div>
  );
}

function NativeDateInput({
  label,
  value,
  min,
  onChange
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-bold text-stone-500">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-bold text-ink outline-none focus:border-forest-500 focus:bg-white"
      />
    </label>
  );
}

function isOvernightStyle(style: MountainFoundationStyle) {
  return style !== "DAY_HIKE";
}

function normalizeEndDateValue(
  startDate: string,
  endDate: string,
  style: MountainFoundationStyle
) {
  if (!isOvernightStyle(style)) {
    return "";
  }

  if (!startDate) {
    return endDate;
  }

  if (!endDate) {
    return startDate;
  }

  return endDate < startDate ? startDate : endDate;
}

function sortMountainsByElevation(
  mountainA: MountainFoundationProfile,
  mountainB: MountainFoundationProfile
) {
  return (
    mountainB.elevation_m - mountainA.elevation_m ||
    mountainA.name_ja.localeCompare(mountainB.name_ja, "ja")
  );
}

function formatMountainArea(mountain: MountainFoundationProfile) {
  return mountain.prefectures.length > 0
    ? mountain.prefectures.join("・")
    : mountain.mountain_range;
}

function MountainListBadge({ mountain }: { mountain: MountainFoundationProfile }) {
  const badge = getMountainListBadge(mountain);

  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${badge.className}`}>
      {badge.label}
    </span>
  );
}

function getMountainListBadge(mountain: MountainFoundationProfile) {
  if (mountain.meizan_list === "JAPAN_HYAKUMEIZAN") {
    return {
      label: "日本百名山",
      className: "bg-forest-100 text-forest-800"
    };
  }

  if (mountain.meizan_list === "JAPAN_NIHYAKUMEIZAN_EXTRA") {
    return {
      label: "二百名山（百名山以外）",
      className: "bg-trail-100 text-trail-800"
    };
  }

  return {
    label: "登録山岳",
    className: "bg-stone-100 text-stone-600"
  };
}
