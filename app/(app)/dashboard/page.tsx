import { Suspense } from "react";

import { Backpack, Mountain, Package, Plus } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { DashboardPlanMeta } from "@/components/dashboard-plan-meta";
import { HeroGauge } from "@/components/hero-gauge";
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
// 首页装備構成配色:规范 v1「米色系」6 色,按 id 覆盖 MAJOR_GEAR_CATEGORIES 旧色(仅首页用)
const categoryColorById = new Map<string, string>([
  ["clothing", "#C05A86"],
  ["shoes", "#8A7A66"],
  ["backpack", "#2F6FB0"],
  ["tentSleep", "#6A57C4"],
  ["cooking", "#C0763A"],
  ["safetyNav", "#1F9B8E"]
]);
// 图例顺序(按设计稿:ウェア/シューズ/ザック ・ クッキング/安全・ナビ/テント)
const LEGEND_ORDER = [
  "clothing",
  "shoes",
  "backpack",
  "cooking",
  "safetyNav",
  "tentSleep"
];

export default async function DashboardPage() {
  // 首屏只等这两个(并行);checklist 不再阻塞渲染,改为 Hero 内 Suspense 流式补上
  const [summary, nextTrip] = await Promise.all([
    getDashboardSummary(),
    fetchLatestPlan()
  ]);

  return (
    <HomePageContent
      hasTrip={Boolean(nextTrip)}
      hasGear={summary.ownedCount > 0}
      trip={nextTrip}
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
  summary
}: {
  hasTrip: boolean;
  hasGear: boolean;
  trip: SavedTripPlan | null;
  summary: DashboardSummary;
}) {
  return (
    <main className="home-redesign min-h-screen bg-[#E5EBE9] pb-32 text-ink">
      <HomeShellCss />

      <header
        className="relative z-10 flex w-full items-start justify-between bg-gradient-to-br from-[#1F7950] to-[#81AB44] px-4 pt-[max(env(safe-area-inset-top),20px)]"
        style={{ minHeight: "calc(max(env(safe-area-inset-top), 20px) + 206px)" }}
      >
        <img
          src="/yamajitaku-wordmark-white.png"
          alt="山支度 YAMAJITAKU"
          className="mt-[42px] h-10 w-auto select-none object-contain"
        />
        <AppMenuDrawer buttonClassName="-mr-2 mt-[42px] inline-flex h-10 w-10 items-center justify-center rounded-xl text-white transition-transform active:scale-95" />
      </header>

      <div className="relative z-20 -mt-[107px] space-y-[11px] px-4">
        <section>
          <HeroCard hasTrip={hasTrip} trip={trip} />
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
  trip
}: {
  hasTrip: boolean;
  trip: SavedTripPlan | null;
}) {
  if (!hasTrip || !trip) {
    return <EmptyTripHero />;
  }

  const fallbackPercent = getSavedProgressFallback(trip);
  const planHref = `/plan?id=${trip.id}` as Route;
  return (
    <section className="rounded-[20px] bg-white px-5 pt-5 pb-3 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-[#EEEDE6] pb-3">
        <span className="shrink-0 text-base font-bold text-ink">次回の山行</span>
        <div className="flex min-w-0 items-center gap-2">
          <DashboardPlanMeta
            planId={trip.id}
            plannedDate={trip.planned_date}
            plannedEndDate={trip.planned_end_date}
            tripMemo={trip.trip_memo}
            style={trip.style}
          />
          <span className="shrink-0 rounded-md border border-[#D9D9D9] px-2 py-1 text-[11px] font-medium leading-none text-[#818785]">
            {styleLabel(trip.style)}
          </span>
        </div>
      </div>

      {/* gauge 数据(checklist)流式加载,不阻塞首屏 */}
      <Suspense fallback={<HeroGaugeSkeleton mountainName={trip.mountain_name} />}>
        <HeroGaugeAsync trip={trip} fallbackPercent={fallbackPercent} />
      </Suspense>

      <div className="mt-[18px] flex justify-center">
        <Link
          href={planHref}
          className="inline-flex h-9 items-center justify-center rounded-full bg-[#4E914A] px-7 text-[13px] font-bold text-white shadow-sm transition active:scale-95"
        >
          出発前確認へ
        </Link>
      </div>
    </section>
  );
}

// 异步取 checklist 后渲染真正的 gauge(在 Suspense 内,不阻塞首屏)
async function HeroGaugeAsync({
  trip,
  fallbackPercent
}: {
  trip: SavedTripPlan;
  fallbackPercent: number;
}) {
  const checklist = await fetchLatestPlanChecklist(trip);
  return (
    <HeroGauge
      checklist={checklist}
      planId={trip.id}
      userId={trip.user_id}
      fallbackPercent={fallbackPercent}
      mountainName={trip.mountain_name}
      plannedDate={trip.planned_date}
    />
  );
}

// gauge 数据到位前的占位:只画灰色轨道 + 山名,无动画(避免数据到了再二次动画)
function HeroGaugeSkeleton({ mountainName }: { mountainName: string }) {
  return (
    <>
      <div className="relative mx-auto mt-2 w-full max-w-[324px]">
        <svg viewBox="0 12 240 116" className="w-full">
          <path
            d="M20 120 A100 100 0 0 1 220 120"
            fill="none"
            stroke="#D9D9D9"
            strokeWidth="9"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="max-w-[180px] truncate text-base font-bold text-ink">
            {mountainName}
          </span>
          <span className="font-din text-[52px] font-bold leading-[1.02] text-[#D9D9D9]">
            ··<span className="text-[28px]">%</span>
          </span>
        </div>
      </div>
      <div className="mt-5 h-[30px]" />
    </>
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
    <div className="flex items-end gap-2 overflow-hidden font-sans text-[#14724e]">
      <Mountain className="mb-0.5 h-5 w-5 fill-[#14724e] text-[#14724e]" />
      <span className="shrink-0 pb-[3px] text-sm font-bold leading-none">次回の山行</span>
      {trip ? (
        <DashboardPlanMeta
          planId={trip.id}
          plannedDate={trip.planned_date}
          plannedEndDate={trip.planned_end_date}
          tripMemo={trip.trip_memo}
          style={trip.style}
        />
      ) : null}
    </div>
  );
}

function GearSummaryCard({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-white px-5 pt-3 pb-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">マイ装備</h2>
        <Link
          href="/gear/new"
          aria-label="装備を追加"
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#4E914A] text-white opacity-70 shadow-sm transition active:scale-95"
        >
          <Plus className="h-3 w-3" strokeWidth={2.5} />
        </Link>
      </div>

      <div className="flex flex-row items-center justify-between">
        <SummaryMetric
          iconSrc="/metric-count.png"
          value={`${summary.ownedCount.toLocaleString("ja-JP")} 件`}
          label="所有装備数"
          divided
        />
        <SummaryMetric
          iconSrc="/metric-weight.png"
          value={formatKg(summary.totalWeightG)}
          label="総重量"
          divided
        />
        <SummaryMetric
          iconSrc="/metric-category.png"
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
      {hasGear ? (
        <div className="hide-scrollbar flex snap-x snap-mandatory gap-[11px] overflow-x-auto pb-4">
          {gear.slice(0, 8).map((item) => (
            <div
              key={item.id}
              className="relative flex h-[150px] w-[126px] flex-none snap-start flex-col items-center rounded-2xl bg-white px-3 pt-[17px] pb-[52px] shadow-sm"
            >
              <div className="flex w-full min-h-0 flex-1 items-center justify-center">
                <GearImage item={item} />
              </div>
              {/* 名字:锁定——绝对定位 + 固定 px 字号 + 固定行高 + 单行截断 */}
              <p className="absolute inset-x-3 bottom-[27px] truncate text-center text-[12px] font-bold leading-none text-gray-900">
                {item.name}
              </p>
              {/* 克重:锁死在卡底 14px,大小坐标固定,不随任何因素变 */}
              <p className="absolute inset-x-0 bottom-[14px] text-center font-din text-[11px] font-medium leading-none text-gray-400">
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
  const byId = new Map<string, (typeof distribution)[number]>(
    distribution.map((item) => [item.id, item])
  );
  const orderedLegend = LEGEND_ORDER.map((id) => byId.get(id)).filter(
    (item): item is (typeof distribution)[number] => Boolean(item)
  );

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
      <div className="mt-4 grid grid-cols-3 gap-x-4 gap-y-3">
        {orderedLegend.map((item) => (
          <div key={item.id} className="min-w-0">
            <span
              className="block h-[5px] w-5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <div className="mt-1.5 flex items-baseline gap-1 text-[11px]">
              <span className="truncate font-bold text-stone-700">{item.label}</span>
              <span className="shrink-0 font-din font-bold text-stone-500">
                {item.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryMetric({
  iconSrc,
  value,
  label,
  divided = false
}: {
  iconSrc: string;
  value: string;
  label: string;
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1.5 px-1 text-center ${
        divided ? "border-r border-gray-100" : ""
      }`}
    >
      <img src={iconSrc} alt="" className="h-4 w-auto object-contain" />
      <p className="font-din text-[22px] font-bold leading-none text-black">{value}</p>
      <p className="text-[10px] font-medium text-gray-400">{label}</p>
    </div>
  );
}

function BackpackIllustration() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
      <Backpack className="h-10 w-10 stroke-[1.6]" />
    </div>
  );
}

// displayScale 手动旋钮:按商品名给一个缩放系数(默认 1.0),让不同形状的商品在框内视觉大小一致。
// 设计逐个微调,值填这里即可,例:{ "サム 45": 1.1, "Fillo™": 0.9 }
const GEAR_DISPLAY_SCALE: Record<string, number> = {};

function GearImage({ item }: { item: DashboardRecentGear }) {
  const scale = GEAR_DISPLAY_SCALE[item.name] ?? 1;
  return (
    <>
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-full w-full object-contain mix-blend-multiply"
          style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
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

function styleLabel(style: string) {
  const labels: Record<string, string> = {
    DAY_HIKE: "日帰り",
    OVERNIGHT_HUT: "山小屋泊",
    OVERNIGHT_TENT: "テント泊",
    MULTI_DAY_TREK: "縦走",
    day_hike: "日帰り",
    hut: "山小屋泊",
    tent: "テント泊"
  };

  return labels[style] ?? "山行";
}

function formatKg(weightG: number) {
  return `${(weightG / 1000).toFixed(2)} kg`;
}
