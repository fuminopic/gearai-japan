import {
  Backpack,
  ChevronRight,
  CircleDollarSign,
  Mountain,
  Package,
  WalletCards,
  Weight
} from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { DashboardPlanChecklistSummary } from "@/components/dashboard-plan-checklist-summary";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { getLatestTripPlan } from "@/lib/data/trip-plans";
import { buildPlanChecklist } from "@/lib/plan-checklist";
import type { DashboardRecentGear, DashboardSummary, SavedTripPlan } from "@/lib/types";
import { formatJpy } from "@/lib/utils/format";

const categoryColors = [
  "#2f80ed",
  "#9b6be8",
  "#ff7a1a",
  "#f4b91f",
  "#72bf7b",
  "#c8c8c8"
];

const categoryLabels = [
  "背負うシステム",
  "睡眠システム",
  "シェルター",
  "クッキング",
  "電子機器",
  "その他"
];
const planRoute = "/plan" as Route;
type DashboardTripChecklist = ReturnType<typeof buildPlanChecklist>;

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
    const plan = await getPackRequirementPlan({
      mountainSlug: trip.mountain_slug,
      season: trip.season,
      style: trip.style
    });

    return buildPlanChecklist({
      plan,
      checkedSlots: trip.checked_slots
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

      <header className="sticky top-0 z-50 flex w-full items-end justify-between border-b border-gray-100/50 bg-[#FAFAFA]/90 px-4 pb-3 pt-[max(env(safe-area-inset-top),20px)] backdrop-blur-md">
        <div className="flex flex-col">
          <h1 className="text-[28px] font-bold leading-none tracking-tight text-gray-900">
            山支度
          </h1>
          <span className="mt-1 text-[10px] font-medium tracking-widest text-gray-400">
            YAMAJITAKU
          </span>
        </div>
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

        <section>
          <CategoryDistribution summary={summary} hasGear={hasGear} />
        </section>
      </div>
    </main>
  );
}

function HomeShellCss() {
  return (
    <style>{`
      header:has(a[href="/dashboard"]),
      aside:has(a[href="/dashboard"]) {
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

  const coveragePercent = tripChecklist?.summary.percent ?? calculateCoveragePercent(trip);
  const planHref = `/plan?id=${trip.id}` as Route;

  return (
    <section className="relative min-h-[300px] w-full overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 via-gray-50 to-[#e7ece7] shadow-sm">
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
      <div className="relative z-20 flex min-h-[300px] flex-col justify-between gap-5 p-5">
        <div>
          <HeroTitle />
          <div className="mt-3">
            <h2 className="text-2xl font-bold leading-none tracking-normal">
              {trip.mountain_name}
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <TripTag>{seasonLabel(trip.season)}</TripTag>
            <TripTag>{styleLabel(trip.style)}</TripTag>
          </div>
        </div>

        <div className="space-y-4">
          <DashboardPlanChecklistSummary
            planId={trip.id}
            checklist={tripChecklist}
            fallbackProgress={coveragePercent}
          />
          <Link
            href={planHref}
            className="inline-flex w-[200px] items-center justify-center rounded-lg bg-[#3B5B44] py-3 text-xs font-bold text-white shadow-sm"
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
          className="inline-flex w-[200px] items-center justify-center rounded-xl bg-[#3B5B44] py-3 text-xs font-bold text-white shadow-sm"
        >
          山行計画を作成
        </Link>
      </div>
    </section>
  );
}

function HeroTitle() {
  return (
    <div className="flex items-center gap-3">
      <Mountain className="h-4 w-4 fill-[#3B5B44] text-[#3B5B44]" />
      <span className="text-sm font-bold">次回の山行</span>
    </div>
  );
}

function GearSummaryCard({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">私の装備</h2>
        <Link
          href="/gear/new"
          className="inline-flex items-center gap-1 text-xs font-bold text-[#3B5B44]"
        >
          <PlusText />
          装備を追加
        </Link>
      </div>

      <div className="flex flex-row items-center justify-between">
        <SummaryMetric
          icon={WalletCards}
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
          icon={CircleDollarSign}
          value={formatJpy(summary.totalMsrpJpy)}
          label="総装備価値"
        />
      </div>
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
        <Link href="/gear" className="text-xs font-medium text-[#3A5A40]">
          すべて見る &gt;
        </Link>
      </div>
      {hasGear ? (
        <div className="-mx-4">
          <div className="hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4">
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
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[24px] bg-white px-5 py-6 text-center shadow-sm">
          <BackpackIllustration />
          <h3 className="mt-4 text-base font-bold">まだ装備がありません</h3>
          <p className="mt-3 text-xs leading-6 text-gray-600">
            最初の装備を追加して、
            <br />
            快適な山行の準備を始めましょう。
          </p>
          <Link
            href="/gear/new"
            className="mt-5 rounded-full border border-[#3B5B44] px-6 py-2 text-xs font-bold text-[#3B5B44]"
          >
            装備を追加する
          </Link>
        </div>
      )}
    </section>
  );
}

function CategoryDistribution({
  summary,
  hasGear
}: {
  summary: DashboardSummary;
  hasGear: boolean;
}) {
  const distribution = buildDistribution(summary, hasGear);

  return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-white p-5 shadow-sm">
      <SectionHeader title="カテゴリー分布" href="/gear" />
      <div className="flex flex-row items-center justify-between gap-4">
        <DonutChart distribution={distribution} hasGear={hasGear} />
        <div className="grid flex-1 grid-cols-2 gap-x-2 gap-y-3 text-[10px]">
          {distribution.map((item) => (
            <div key={item.label} className="grid grid-cols-[10px_1fr_auto] items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="w-16 max-w-[70px] truncate font-medium">{item.label}</span>
              <span className="font-bold">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl bg-[#F0F5F2] p-3 text-center text-xs font-medium text-[#3B5B44]">
        {hasGear
          ? "バランスの良い構成です！"
          : "装備を追加すると、分布とバランスを確認できます"}
      </div>
    </section>
  );
}

function SectionHeader({ title, href }: { title: string; href: Route }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-bold tracking-normal">{title}</h2>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-xs font-bold text-[#3B5B44]"
      >
        すべて見る
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function TripTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg bg-[#E8F1E8] px-2.5 py-1 text-[11px] font-bold text-[#3B5B44]">
      {children}
    </span>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label,
  divided = false
}: {
  icon: typeof WalletCards;
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
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E8F1E8] text-[#3B5B44]">
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

function DonutChart({
  distribution,
  hasGear
}: {
  distribution: Array<{ label: string; percent: number; color: string }>;
  hasGear: boolean;
}) {
  const background = hasGear
    ? `conic-gradient(${distribution
        .map((item, index) => {
          const start = distribution
            .slice(0, index)
            .reduce((total, current) => total + current.percent, 0);
          const end = start + item.percent;
          return `${item.color} ${start}% ${end}%`;
        })
        .join(", ")})`
    : "conic-gradient(#e5e7eb 0% 100%)";

  return (
    <div
      className="relative h-20 w-20 shrink-0 rounded-full"
      style={{ background }}
    >
      <div className="absolute inset-6 rounded-full bg-white" />
    </div>
  );
}

function buildDistribution(summary: DashboardSummary, hasGear: boolean) {
  if (!hasGear || summary.totalWeightG <= 0 || summary.categoryWeights.length === 0) {
    return categoryLabels.map((label, index) => ({
      label,
      percent: 0,
      color: index === categoryLabels.length - 1 ? "#d1d5db" : categoryColors[index]
    }));
  }

  const mapped = categoryLabels.map((label, index) => {
    const category = summary.categoryWeights.find((item) => item.nameJa === label);
    return {
      label,
      percent: category
        ? Math.round((category.weightG / Math.max(summary.totalWeightG, 1)) * 100)
        : 0,
      color: categoryColors[index]
    };
  });
  const otherWeight = summary.categoryWeights
    .filter((item) => !categoryLabels.includes(item.nameJa))
    .reduce((total, item) => total + item.weightG, 0);
  mapped[mapped.length - 1] = {
    label: "その他",
    percent: Math.round((otherWeight / Math.max(summary.totalWeightG, 1)) * 100),
    color: categoryColors[categoryColors.length - 1]
  };

  return mapped;
}

function calculateCoveragePercent(trip: SavedTripPlan) {
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
