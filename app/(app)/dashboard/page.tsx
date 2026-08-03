import { Suspense } from "react";

import { Backpack, ChevronRight } from "lucide-react";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { AppMenuDrawer } from "@/components/app-menu-drawer";
import { HomeGearStrip } from "@/components/home-gear-strip";
import { DashboardPlanMeta } from "@/components/dashboard-plan-meta";
import { HeroGauge } from "@/components/hero-gauge";
import { getOwnedGearForPlanning } from "@/lib/data/gear";
import { getPackGearIds } from "@/lib/data/pack";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getDashboardSummary } from "@/lib/data/dashboard";
import { getLatestTripPlan } from "@/lib/data/trip-plans";
import { MAJOR_GEAR_CATEGORIES } from "@/lib/gear-major-categories";
import { buildPlanChecklist } from "@/lib/plan-checklist";
import { getPlanFoodWater } from "@/lib/plan-food-water";
import type { DashboardGear, DashboardSummary, SavedTripPlan } from "@/lib/types";
import { formatWeight } from "@/lib/utils/format";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const planRoute = "/plan" as Route;
const packRoute = "/pack" as Route;
const packSelectRoute = "/pack/select" as Route;
const gearRoute = "/gear" as Route;
// 首页装備構成配色:规范 v1「米色系」6 色,按 id 覆盖 MAJOR_GEAR_CATEGORIES 旧色(仅首页用)
const categoryColorById = new Map<string, string>([
  ["clothing", "#C05A86"],
  ["shoes", "#8A7A66"],
  ["backpack", "#2F6FB0"],
  ["tentSleep", "#6A57C4"],
  ["cooking", "#C0763A"],
  ["safetyNav", "#1F9B8E"]
]);
export default async function DashboardPage() {
  // 新規ユーザーのオンボーディング判定は (app)/layout.tsx の AuthGate が
  // App Shell 描画前に行う(ここで二重に判定しない)。
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
    const [plan, ownedGear, packedGearIds] = await Promise.all([
      getPackRequirementPlan({
        mountainSlug: trip.mountain_slug,
        season: trip.season,
        style: trip.style
      }),
      getOwnedGearForPlanning(),
      getPackGearIds()
    ]);

    return buildPlanChecklist({
      plan,
      checkedSlots: trip.checked_slots,
      uncheckedPackedSlots: trip.unchecked_packed_slots,
      foodWater: getPlanFoodWater(trip),
      ownedGear,
      packedGearIds
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
    <main className="home-redesign brand-shell min-h-screen bg-[#E5EBE9] pb-32 text-ink">
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

        <OwnedGearSection gear={summary.gearItems} hasGear={hasGear} />
      </div>
    </main>
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
    <section className="relative aspect-[319/152] w-full overflow-hidden rounded-[20px] bg-white shadow-sm">
      <Image
        src="/empty-trip-hero-design.png"
        alt=""
        fill
        priority
        className="pointer-events-none object-cover"
      />
      <h2 className="sr-only">まだ計画はありません</h2>
      <p className="sr-only">行きたい山は決まっていますか？ 計画を作成して、準備を進めましょう。</p>
      <Link
        href={planRoute}
        aria-label="山行計画を作成"
        className="absolute left-[4.1%] top-[73%] h-[17.5%] w-[37%] rounded-[14px] outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-black"
      />
    </section>
  );
}

function GearSummaryCard({ summary }: { summary: DashboardSummary }) {
  // このカードのタップ先は2つだけ(マイギア / マイパック)。以前は同じ見た目の
  // 指標が3つ並び、リンクなのは中央だけ、さらに小さな + が最深部の
  // /gear/new に飛んでいたため、初見では押す場所が読めなかった。
  return (
    <section className="flex flex-col gap-3 rounded-[20px] bg-white px-5 pt-3 pb-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">マイギア</h2>
      </div>

      <div className="flex flex-row items-center justify-between">
        <SummaryMetric
          iconSrc="/metric-count.png"
          value={`${summary.ownedCount.toLocaleString("ja-JP")}点`}
          label="マイギア"
          href={gearRoute}
          divided
        />
        <SummaryMetric
          iconSrc="/metric-weight.png"
          value={`${summary.packItemCount.toLocaleString("ja-JP")}点・${formatWeight(summary.packKnownWeightG, { compact: true })}`}
          label="マイパック"
          href={packRoute}
        />
      </div>
      <GearComposition summary={summary} />
    </section>
  );
}

function OwnedGearSection({
  gear,
  hasGear
}: {
  gear: DashboardGear[];
  hasGear: boolean;
}) {
  return (
    <section>
      {hasGear ? (
        <HomeGearStrip gear={gear} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[28px] bg-white px-5 py-6 text-center shadow-sm">
          <BackpackIllustration />
          <h3 className="mt-4 text-base font-bold">まだギアがありません</h3>
          <p className="mt-3 text-xs leading-6 text-gray-600">
            最初のギアを追加して、
            <br />
            快適な山行の準備を始めましょう。
          </p>
          <Link
            href="/gear/new"
            className="mt-5 rounded-full border border-[#14724e] px-6 py-2 text-xs font-bold text-[#14724e]"
          >
            ギアを追加する
          </Link>
        </div>
      )}
    </section>
  );
}

function GearComposition({ summary }: { summary: DashboardSummary }) {
  if (summary.packItemCount === 0) {
    return (
      <div className="border-t border-stone-100 pt-4">
        <p className="text-sm font-bold text-ink">マイパックはまだ空です</p>
        <p className="mt-2 text-xs leading-5 text-stone-500">
          マイギアからよく持っていくギアを追加すると、パック重量を確認できます。
        </p>
        <Link
          href={packSelectRoute}
          className="mt-4 inline-flex h-10 items-center justify-center rounded-lg bg-forest-700 px-4 text-xs font-bold text-white transition active:scale-95"
        >
          マイパックを作る &gt;
        </Link>
      </div>
    );
  }

  const distribution = buildGearComposition(summary);
  const activeDistribution = distribution.filter((item) => item.value > 0);

  return (
    <div className="border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-stone-500">パック重量構成（ギア）</p>
        <Link href={packRoute} className="text-xs font-bold text-[#14724e]">
          マイパック &gt;
        </Link>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-stone-100">
        {activeDistribution.length > 0 ? (
          activeDistribution.map((item) => (
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
        {distribution.map((item) => (
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
  href,
  divided = false
}: {
  iconSrc: string;
  value: string;
  label: string;
  href?: Route;
  divided?: boolean;
}) {
  const className = `flex flex-1 flex-col items-center gap-1.5 px-1 text-center ${
    divided ? "border-r border-gray-100" : ""
  }`;
  // リンクのときだけラベルに chevron を出す。指標の見た目が同じまま一部だけ
  // 遷移する状態を作らないための目印。
  const content = (
    <>
      <img src={iconSrc} alt="" className="h-4 w-auto object-contain" />
      <p className="whitespace-nowrap font-din text-[22px] font-bold leading-none text-black max-[374px]:text-[18px]">{value}</p>
      <p className="flex items-center justify-center gap-0.5 whitespace-nowrap text-xs font-medium text-gray-400">
        {label}
        {href ? <ChevronRight aria-hidden className="h-3.5 w-3.5 text-gray-300" /> : null}
      </p>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${className} transition active:scale-95`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className}>{content}</div>
  );
}

function BackpackIllustration() {
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-50 text-gray-300">
      <Backpack className="h-10 w-10 stroke-[1.6]" />
    </div>
  );
}

function buildGearComposition(summary: DashboardSummary) {
  const total = summary.packKnownWeightG;
  const weightsByCategory = new Map(
    summary.packCategoryWeights.map((item) => [item.categoryId, item])
  );

  return MAJOR_GEAR_CATEGORIES.map((category) => {
    const item = weightsByCategory.get(category.id);
    const value = item?.weightG ?? 0;
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
