import {
  Backpack,
  Mountain,
  Package,
  Weight,
  type LucideIcon
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppLogo } from "@/components/app-logo";
import { DashboardPlanMeta } from "@/components/dashboard-plan-meta";
import { DashboardPlanChecklistSummary } from "@/components/dashboard-plan-checklist-summary";
import { getOwnedGearForPlanning } from "@/lib/data/gear";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { getLatestTripPlan } from "@/lib/data/trip-plans";
import { MAJOR_GEAR_CATEGORIES } from "@/lib/gear-major-categories";
import { buildPlanChecklist } from "@/lib/plan-checklist";
import type { DashboardRecentGear, DashboardSummary, SavedTripPlan } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const planRoute = "/plan" as Route;
type DashboardTripChecklist = ReturnType<typeof buildPlanChecklist>;
const categoryColorById = new Map<string, string>(
  MAJOR_GEAR_CATEGORIES.map((category) => [category.id, category.color])
);

export default async function DashboardPage() {
  const [summary, nextTrip] = await Promise.all([
    getDashboardSummary(),
    fetchLatestPlan()
  ]);
  const tripChecklist = nextTrip ? await fetchLatestPlanChecklist(nextTrip) : null;

  return (
    <HomePageContent
      hasTrip={Boolean(nextTrip)}
      hasGear={summary.ownedCount > 0}
      trip={nextTrip}
      tripChecklist={tripChecklist}
      summary={summary}
    />
  );
}

async function fetchLatestPlan() {
  return getLatestTripPlan();
}

async function fetchLatestPlanChecklist(trip: SavedTripPlan) {
  if (!trip.mountain_slug) {
    return null;
  }

  try {
    const [plan, ownedGear] = await Promise.all([
      getPackRequirementPlan({
        mountainSlug: trip.mountain_slug,
        season: trip.season,
        style: trip.style
      }),
      getOwnedGearForPlanning()
    ]);

    return buildPlanChecklist({
      plan,
      checkedSlots: trip.checked_slots,
      ownedGear
    });
  } catch (caught) {
    console.error("Dashboard checklist summary failed:", caught);
    return null;
  }
}

function HomePageContent({
  hasTrip,
  hasGear,
  trip,
  tripChecklist,
  summary
}: {
  hasTrip: boolean;
  hasGear: boolean;
  trip: SavedTripPlan | null;
  tripChecklist: DashboardTripChecklist | null;
  summary: DashboardSummary;
}) {
  return (
    <main className="home-redesign min-h-screen bg-[#FAFAFA] pb-32 text-ink">
      <HomeShellCss />

      <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-gray-100/50 bg-[#FAFAFA]/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),20px)] backdrop-blur-md">
        <AppLogo className="h-12" />
        <button
          type="button"
          aria-label="メニュー"
          className="-mr-2 p-2 text-gray-700 transition-transform active:scale-95"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </header>

      <div className="mt-6 space-y-6 px-4">
        <section>
          <HeroCard hasTrip={hasTrip} trip={trip} tripChecklist={tripChecklist} />
        </section>

        <section>
          <GearSummaryCard summary={summary} />
        </section>

        <RecentGearSection gear={summary.recentGear} hasGear={hasGear} />
      </div>
    </main>
  );
}

function HomeShellCss() {
  return (
    <style>{`
      body:has(main.home-redesign) > div > header:has(a[href="/dashboard"]),
      body:has(main.home-redesign) > div > aside:has(a[href="/dashboard"]) {
        display: none;
      }
      main:has(> main.home-redesign) {
        margin: 0 !important;
        max-width: none !important;
        padding: 0 !important;
        width: 100% !important;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `}</style>
  );
}

function HeroCard({
  hasTrip,
  trip,
  tripChecklist
}: {
  hasTrip: boolean;
  trip: SavedTripPlan | null;
  tripChecklist: DashboardTripChecklist | null;
}) {
  if (!hasTrip || !trip) {
    return <EmptyTripHero />;
  }

  const coveragePercent = tripChecklist?.summary.percent ?? getSavedProgressFallback(trip);
  const planHref = `/plan?id=${trip.id}` as Route;
  return (
    <section className="relative min-h-[252px] w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-100 via-gray-50 to-[#e7ece7] shadow-sm">
      <div className="absolute inset-0 z-0">
        <Image
          src="/generic-hills.jpg"
          fill
          className="object-cover object-bottom opacity-80"
          alt="background"
          priority
        />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#E8F0E8]/40 via-white/90 to-white" />
      <div className="relative z-20 flex min-h-[252px] flex-col justify-between gap-3 p-5">
        <div>
          <HeroTitle trip={trip} />
          <div className="mt-5 flex flex-wrap items-end gap-x-4 gap-y-3">
            <h2 className="font-maru text-[45px] font-normal leading-none tracking-[0.04em] text-black">
              {trip.mountain_name}
            </h2>
            <div className="flex flex-wrap gap-2 pb-1 font-maru">
              <PlanPill>{seasonLabel(trip.season)}</PlanPill>
              <PlanPill>{styleLabel(trip.style)}</PlanPill>
            </div>
          </div>
          <DashboardPlanMeta
            planId={trip.id}
            plannedDate={trip.planned_date}
            tripMemo={trip.trip_memo}
            variant="memo"
          />
        </div>

        <div className="space-y-3">
          <DashboardPlanChecklistSummary
            planId={trip.id}
            checklist={tripChecklist}
            fallbackProgress={coveragePercent}
          />
          <Link
            href={planHref}
            className="inline-flex w-[184px] items-center justify-center rounded-2xl bg-[#14724e] py-3 text-xs font-bold text-white shadow-sm transition active:scale-95"
          >
            装備チェックを続ける
          </Link>
        </div>
      </div>
    </section>
  );
}

function EmptyTripHero() {
  return (
    <section className="relative h-48 w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-white to-[#EAF2ED] shadow-sm">
      <div className="absolute inset-0 z-0">
        <Image
          src="/generic-hills.jpg"
          fill
          className="object-cover object-bottom opacity-80"
          alt="background"
        />
      </div>
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#E8F0E8]/40 via-white/90 to-white" />
      <div className="relative z-20 flex flex-col justify-between p-5 h-full">
        <div>
          <HeroTitle />
          <h2 className="mt-3 text-2xl font-bold leading-tight tracking-normal">
            まだ計画はありません
          </h2>
          <p className="mt-2 text-xs font-medium leading-6">
            次の登山に向けて
            <br />
            装備チェックを始めましょう
          </p>
        </div>

        <Link
          href={planRoute}
          className="inline-flex w-[200px] items-center justify-center rounded-2xl bg-[#14724e] py-3 text-xs font-bold text-white shadow-sm transition active:scale-95"
        >
          山行計画を作成
        </Link>
      </div>
    </section>
  );
}

function HeroTitle({ trip }: { trip?: SavedTripPlan }) {
  return (
    <div className="flex flex-wrap items-end gap-x-3 gap-y-1 font-sans text-[#14724e]">
      <Mountain className="mb-0.5 h-5 w-5 fill-[#14724e] text-[#14724e]" />
      <span className="pb-0.5 text-sm font-bold leading-none">次回の山行</span>
      {trip ? (
        <DashboardPlanMeta
          planId={trip.id}
          plannedDate={trip.planned_date}
          tripMemo={trip.trip_memo}
          style={trip.style}
        />
      ) : null}
    </div>
  );
}

function PlanPill({ children }: { children: string }) {
  return (
    <span className="inline-flex min-w-[72px] items-center justify-center rounded-md bg-[#14724e] px-3 py-1 text-sm font-normal leading-none text-white">
      {children}
    </span>
  );
}

function GearSummaryCard({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="flex flex-col gap-4 rounded-[28px] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">マイ装備</h2>
        <Link
          href="/gear/new"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#14724e]"
        >
          <PlusText />
          装備を追加
        </Link>
      </div>

      <div className="flex flex-row items-center justify-between">
        <SummaryMetric
          icon={Backpack}
          value={`${summary.ownedCount.toLocaleString("ja-JP")} 件`}
          label="所有装備数"
          divided
        />
        <SummaryMetric
          icon={Weight}
          value={formatKg(summary.totalWeightG)}
          label="総重量"
          divided
        />
        <SummaryMetric
          icon={Package}
          value={`${summary.majorCategoryCoverageCount} / ${summary.majorCategoryTotalCount}`}
          label="主要カテゴリー"
        />
      </div>
      <GearComposition summary={summary} />
    </section>
  );
}

function RecentGearSection({
  gear,
  hasGear
}: {
  gear: DashboardRecentGear[];
  hasGear: boolean;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">最近追加した装備</h2>
        <Link href="/gear" className="text-xs font-medium text-[#14724e]">
          すべて見る &gt;
        </Link>
      </div>
      {hasGear ? (
        <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4">
          {gear.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="flex w-[100px] flex-none snap-start flex-col"
            >
              <div className="mb-2 flex aspect-square w-full items-center justify-center rounded-2xl border border-gray-100 bg-white p-3 shadow-sm">
                <GearImage item={item} />
              </div>
              <p className="truncate text-xs font-bold text-gray-800">
                {item.name}
              </p>
              <p className="mt-0.5 text-[10px] font-medium text-gray-400">
                {Number(item.weight_grams)} g
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[28px] bg-white px-5 py-6 text-center shadow-sm">
          <BackpackIllustration />
          <h3 className="mt-4 text-base font-bold">まだ装備がありません</h3>
          <p className="mt-3 text-xs leading-6 text-gray-600">
            最初の装備を追加して、
            <br />
            快適な山行の準備を始めましょう。
          </p>
          <Link
            href="/gear/new"
            className="mt-5 rounded-full border border-[#14724e] px-6 py-2 text-xs font-bold text-[#14724e]"
          >
            装備を追加する
          </Link>
        </div>
      )}
    </section>
  );
}

function GearComposition({ summary }: { summary: DashboardSummary }) {
  const distribution = buildGearComposition(summary);
  const activeDistribution = distribution.filter((item) => item.value > 0);

  return (
    <div className="border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-500">装備構成</p>
        <Link href="/gear" className="text-xs font-bold text-[#14724e]">
          すべて見る &gt;
        </Link>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-100">
        {activeDistribution.length > 0 ? (
          distribution
            .filter((item) => item.value > 0)
            .map((item) => (
              <span
                key={item.id}
                className="h-full"
                style={{
                  width: `${Math.max(item.percent, 3)}%`,
                  backgroundColor: item.color
                }}
              />
            ))
        ) : (
          <span className="h-full w-full bg-stone-200" />
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {distribution.map((item) => (
          <div
            key={item.id}
            className="flex min-w-0 items-center justify-between gap-2 text-[11px]"
          >
            <span className="flex min-w-0 items-center gap-1.5 text-stone-600">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate font-semibold">{item.label}</span>
            </span>
            <span className="shrink-0 font-bold text-stone-800">{item.percent}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label,
  divided = false
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 text-center ${
        divided ? "border-r border-gray-100" : ""
      }`}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F1E8] text-[#14724e]">
        <Icon className="h-5 w-5 stroke-[1.8]" />
      </div>
      <p className="text-lg font-bold leading-tight tracking-normal">{value}</p>
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
    </div>
  );
}

function PlusText() {
  return <span className="text-lg leading-none">＋</span>;
}

function BackpackIllustration() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
      <Backpack className="h-10 w-10 stroke-[1.6]" />
    </div>
  );
}

function GearImage({ item }: { item: DashboardRecentGear }) {
  return (
    <>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-full w-full object-contain"
        />
      ) : (
        <Package className="h-10 w-10 text-gray-300" />
      )}
    </>
  );
}

function buildGearComposition(summary: DashboardSummary) {
  const useWeight = summary.totalWeightG > 0;
  const total = summary.categoryWeights.reduce(
    (sum, item) => sum + (useWeight ? item.weightG : item.count),
    0
  );
  const weightsByCategory = new Map(
    summary.categoryWeights.map((item) => [item.categoryId, item])
  );

  return MAJOR_GEAR_CATEGORIES.map((category) => {
    const item = weightsByCategory.get(category.id);
    const value = item ? (useWeight ? item.weightG : item.count) : 0;
    return {
      id: category.id,
      label: category.label,
      value,
      percent: total > 0 ? Math.round((value / total) * 100) : 0,
      color: categoryColorById.get(category.id) ?? "#d1d5db"
    };
  });
}

function getSavedProgressFallback(trip: SavedTripPlan) {
  return clampProgress(trip.progress);
}

function clampProgress(progress: number | null | undefined) {
  const value = Number(progress ?? 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function seasonLabel(season: string) {
  const labels: Record<string, string> = {
    SPRING: "春山",
    SUMMER: "夏山",
    AUTUMN: "秋山",
    WINTER: "冬山",
    spring: "春山",
    summer: "夏山",
    autumn: "秋山",
    winter: "冬山"
  };

  return labels[season] ?? "山行";
}

function styleLabel(style: string) {
  const labels: Record<string, string> = {
    DAY_HIKE: "日帰り",
    OVERNIGHT_HUT: "小屋泊",
    OVERNIGHT_TENT: "テント泊",
    MULTI_DAY_TREK: "縦走",
    day_hike: "日帰り",
    hut: "小屋泊",
    tent: "テント泊"
  };

  return labels[style] ?? "山行";
}

function formatKg(weightG: number) {
  return `${(weightG / 1000).toFixed(2)} kg`;
}
