"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { ChevronRight, ClipboardCheck, Mountain, Search } from "lucide-react";

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
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  planId?: string | null;
  error?: string;
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
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  planId,
  error
}: TripPlanningFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const selectableMountains = useMemo(() => getOfficialMeizanMountains(mountains), [mountains]);
  const initialMountainSlug = getAvailableMountainSlug(
    selectedMountainSlug,
    selectableMountains
  );
  const [mountainSlug, setMountainSlug] = useState(initialMountainSlug);
  const [mountainQuery, setMountainQuery] = useState("");
  const [mountainListFilter, setMountainListFilter] =
    useState<MountainListFilter>(() =>
      getDefaultMountainListFilter(getMountainBySlug(initialMountainSlug, selectableMountains))
    );
  const [selectedArea, setSelectedArea] = useState<MountainAreaFilter>("ALL");
  const selectedMountain = useMemo(() => {
    return (
      selectableMountains.find((mountain) => mountain.slug === mountainSlug) ??
      selectableMountains[0]
    );
  }, [mountainSlug, selectableMountains]);
  const filteredMountains = useMemo(() => {
    return getFilteredMountains(
      selectableMountains,
      mountainListFilter,
      mountainQuery,
      selectedArea
    );
  }, [selectableMountains, mountainListFilter, mountainQuery, selectedArea]);
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
  const effectiveSeason = seasonOptions.includes(selectedSeason)
    ? selectedSeason
    : seasonOptions[0];
  const effectiveStyle = styleOptions.includes(selectedStyle)
    ? selectedStyle
    : styleOptions[0];
  const prefetchedPlanHref = useMemo(() => {
    if (!mountainSlug || !effectiveSeason || !effectiveStyle) {
      return null;
    }

    const params = new URLSearchParams();

    if (planId) {
      params.set("id", planId);
    }

    params.set("mountain", mountainSlug);
    params.set("season", effectiveSeason);
    params.set("style", effectiveStyle);

    return `/plan?${params.toString()}` as Route;
  }, [effectiveSeason, effectiveStyle, mountainSlug, planId]);

  useEffect(() => {
    const nextMountainSlug = getAvailableMountainSlug(
      selectedMountainSlug,
      selectableMountains
    );
    setMountainSlug(nextMountainSlug);
    setMountainListFilter(
      getDefaultMountainListFilter(getMountainBySlug(nextMountainSlug, selectableMountains))
    );
  }, [selectedMountainSlug, selectableMountains]);

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

    if (selectableMountains.length === 0) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    for (const key of ["id", "mountain", "season", "style"]) {
      const value = formData.get(key);

      if (typeof value === "string" && value.length > 0) {
        params.set(key, value);
      }
    }

    startTransition(() => {
      router.push(`/plan?${params.toString()}` as Route);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg bg-white p-4 shadow-soft sm:p-5"
    >
      {planId ? <input type="hidden" name="id" value={planId} /> : null}

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <input type="hidden" name="mountain" value={mountainSlug} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(300px,0.95fr)]">
        <section>
          <span className="text-sm font-medium text-stone-700">山</span>
          <div className="relative mt-1.5 sm:mt-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="search"
              value={mountainQuery}
              onChange={(event) => setMountainQuery(event.target.value)}
              placeholder="山名・地域・ローマ字で検索"
              className="w-full rounded-lg border border-stone-200 bg-stone-50 px-10 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white sm:py-3"
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
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
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mountainListFilter === filter.value
                    ? "bg-forest-700 text-white"
                    : "bg-forest-50 text-forest-800 hover:bg-forest-100"
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
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    selectedArea === area.value
                      ? "bg-forest-700 text-white"
                      : "bg-white text-stone-600 hover:bg-forest-50 hover:text-forest-800"
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

          {selectedMountain ? (
            <div className="mt-3 rounded-lg border border-forest-100 bg-forest-50 px-3 py-2">
              <p className="text-xs font-semibold text-forest-800">選択中</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="text-base font-semibold text-ink">
                  {selectedMountain.name_ja}
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  {selectedMountain.elevation_m.toLocaleString("ja-JP")}m
                </span>
                <MountainListBadge mountain={selectedMountain} />
              </div>
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

          <div className="mt-2 max-h-72 space-y-2 overflow-y-auto pr-1">
            {filteredMountains.length > 0 ? (
              filteredMountains.map((mountain) => (
                <button
                  key={mountain.slug}
                  type="button"
                  onClick={() => setMountainSlug(mountain.slug)}
                  aria-pressed={mountain.slug === mountainSlug}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    mountain.slug === mountainSlug
                      ? "border-forest-200 bg-forest-50"
                      : "border-stone-100 bg-stone-50 hover:border-stone-200 hover:bg-white"
                  }`}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-forest-700">
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
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                </button>
              ))
            ) : (
              <div className="rounded-lg border border-stone-100 bg-stone-50 px-3 py-3 text-sm font-medium text-stone-500">
                該当する山がありません。
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">季節</span>
          <select
            key={`${mountainSlug}-season`}
            name="season"
            defaultValue={effectiveSeason}
            required
            disabled={seasonOptions.length === 0}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:mt-2 sm:py-3"
          >
            {seasonOptions.map((season) => (
              <option key={season} value={season}>
                {mountainFoundationSeasonLabels[season]}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-stone-700">スタイル</span>
          <select
            key={`${mountainSlug}-style`}
            name="style"
            defaultValue={effectiveStyle}
            required
            disabled={styleOptions.length === 0}
            className="mt-1.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-4 py-2.5 text-base outline-none focus:border-forest-500 focus:bg-white disabled:opacity-60 sm:mt-2 sm:py-3"
          >
            {styleOptions.map((style) => (
              <option key={style} value={style}>
                {mountainFoundationStyleLabels[style]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        disabled={selectableMountains.length === 0 || isPending}
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-forest-700 px-5 py-3 text-base font-semibold text-white transition hover:bg-forest-900 disabled:opacity-60 sm:mt-4 sm:py-4"
      >
        <ClipboardCheck className="h-5 w-5" />
        {isPending ? "作成中..." : "パック計画を作成"}
      </button>
    </form>
  );
}

function getAvailableMountainSlug(
  slug: string,
  mountains: readonly MountainFoundationProfile[]
) {
  if (mountains.some((mountain) => mountain.slug === slug)) {
    return slug;
  }

  return mountains[0]?.slug ?? "";
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

function getMountainBySlug(
  slug: string,
  mountains: readonly MountainFoundationProfile[]
) {
  return mountains.find((mountain) => mountain.slug === slug) ?? null;
}

function getDefaultMountainListFilter(
  mountain: MountainFoundationProfile | null
): MountainListFilter {
  if (mountain?.meizan_list === "JAPAN_HYAKUMEIZAN") {
    return "HYAKUMEIZAN";
  }

  if (mountain?.meizan_list === "JAPAN_NIHYAKUMEIZAN_EXTRA") {
    return "NIHYAKUMEIZAN_EXTRA";
  }

  return "ALL";
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
