import {
  Backpack,
  ChevronRight,
  CircleDollarSign,
  Menu,
  Mountain,
  Package,
  WalletCards,
  Weight
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { getDashboardSummary } from "@/lib/data/dashboard";
import { getRecommendationHistory } from "@/lib/data/recommendations";
import type { AIRecommendationRecord, DashboardSummary, UserGear } from "@/lib/types";
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

export default async function DashboardPage() {
  const [summary, recommendations] = await Promise.all([
    getDashboardSummary(),
    getRecommendationHistory(1)
  ]);
  const nextTrip = recommendations[0] ?? null;

  return (
    <HomePageContent
      hasTrip={Boolean(nextTrip)}
      hasGear={summary.ownedCount > 0}
      trip={nextTrip}
      summary={summary}
    />
  );
}

function HomePageContent({
  hasTrip,
  hasGear,
  trip,
  summary
}: {
  hasTrip: boolean;
  hasGear: boolean;
  trip: AIRecommendationRecord | null;
  summary: DashboardSummary;
}) {
  return (
    <div className="home-redesign -mx-5 -mb-28 -mt-6 min-h-screen bg-[#f8f7f4] p-6 pb-28 text-ink md:-ml-24 md:-mt-8">
      <HomeShellCss />
      <div className="mx-auto flex max-w-[390px] flex-col gap-6">
        <HomeHeader />
        <HeroCard hasTrip={hasTrip} trip={trip} />
        <GearSummaryCard summary={summary} />
        <RecentGearSection gear={summary.recentGear} hasGear={hasGear} />
        <CategoryDistribution summary={summary} hasGear={hasGear} />
      </div>
    </div>
  );
}

function HomeShellCss() {
  return (
    <style>{`
      header:has(a[href="/dashboard"]),
      aside:has(a[href="/dashboard"]) {
        display: none;
      }
      main {
        max-width: none !important;
      }
      @media (min-width: 768px) {
        main {
          margin-left: 0 !important;
        }
      }
    `}</style>
  );
}

function HomeHeader() {
  return (
    <section className="flex items-center justify-between">
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold leading-none tracking-normal">山支度</h1>
        <p className="mt-2 text-xs font-medium leading-none text-gray-500">
          YAMAJITAKU
        </p>
      </div>
      <details className="group relative">
        <summary
          aria-label="メニュー"
          className="flex h-10 w-10 list-none items-center justify-center rounded-full bg-transparent text-ink marker:hidden [&::-webkit-details-marker]:hidden"
        >
          <Menu className="h-7 w-7 stroke-[1.8]" />
        </summary>
        <div className="absolute right-0 top-11 z-20 w-40 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-ink shadow-sm">
          メニュー
        </div>
      </details>
    </section>
  );
}

function HeroCard({
  hasTrip,
  trip
}: {
  hasTrip: boolean;
  trip: AIRecommendationRecord | null;
}) {
  if (!hasTrip || !trip) {
    return <EmptyTripHero />;
  }

  const coveragePercent = calculateCoveragePercent(trip);

  return (
    <section className="relative h-[180px] w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-gray-100 via-gray-50 to-[#e7ece7] shadow-sm">
      {getTripMountainImageUrl(trip) ? (
        <img
          src={getTripMountainImageUrl(trip) ?? ""}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-transparent" />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-5">
        <HeroTitle />

        <div>
          <h2 className="text-2xl font-bold leading-none tracking-normal">
            {trip.input.mountain_region || "山行"}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <TripTag>{seasonLabel(trip.input.season)}</TripTag>
            <TripTag>{styleLabel(trip.input.accommodation_style)}</TripTag>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3">
            <div className="h-1.5 w-2/3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#3B5B44]"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="text-xs font-medium">{coveragePercent}%</span>
          </div>
          <Link
            href="/ai"
            className="mt-3 inline-flex w-[200px] items-center justify-center rounded-xl bg-[#3B5B44] py-3 text-xs font-bold text-white shadow-sm"
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
    <section className="relative h-[180px] w-full overflow-hidden rounded-[28px] bg-gradient-to-br from-white to-[#EAF2ED] shadow-sm">
      <IllustratedMountains />
      <div className="relative z-10 flex h-full w-full flex-col justify-between p-5">
        <HeroTitle />

        <div>
          <h2 className="text-2xl font-bold leading-tight tracking-normal">
            まだ計画はありません
          </h2>
          <p className="mt-3 text-xs font-medium leading-6">
            次の登山に向けて
            <br />
            装備チェックを始めましょう
          </p>
        </div>

        <Link
          href="/ai"
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
    <section className="flex flex-col gap-4 rounded-[24px] bg-white p-6 shadow-sm">
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
  gear: UserGear[];
  hasGear: boolean;
}) {
  return (
    <section className="rounded-[24px] bg-white p-6 shadow-sm">
      <SectionHeader title="最近追加した装備" href="/gear" />
      {hasGear ? (
        <div className="mt-5 flex snap-x gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gear.slice(0, 8).map((item) => (
            <article key={item.id} className="w-[120px] flex-shrink-0 snap-start">
              <GearImage item={item} />
              <h3 className="mt-3 truncate text-sm font-bold">{item.name}</h3>
              <p className="mt-1 text-xs text-gray-500">{Number(item.weight_grams)} g</p>
              <p className="mt-2 text-xs text-gray-500">{relativeAddedDate(item.created_at)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-6 text-center">
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
    <section className="flex flex-col gap-6 rounded-[24px] bg-white p-6 shadow-sm">
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

function IllustratedMountains() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        aria-hidden
        className="absolute bottom-0 right-0 h-full w-[72%]"
        viewBox="0 0 280 320"
        preserveAspectRatio="none"
      >
        <path d="M0 230 C45 175 72 185 108 145 C137 112 158 146 180 124 C210 92 238 115 280 86 L280 320 L0 320 Z" fill="#e7efe7" />
        <path d="M0 265 C40 220 78 235 112 195 C145 156 177 185 208 148 C230 126 254 132 280 116 L280 320 L0 320 Z" fill="#d5e2d5" />
        <path d="M0 304 C42 275 80 288 120 250 C156 216 190 244 226 204 C246 187 264 184 280 178 L280 320 L0 320 Z" fill="#bed2be" />
        <path d="M222 238 C238 258 246 282 250 320" fill="none" stroke="#efe7dc" strokeWidth="10" strokeLinecap="round" />
      </svg>
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

function GearImage({ item }: { item: UserGear }) {
  return (
    <div className="flex h-[120px] w-[120px] items-center justify-center rounded-2xl bg-gray-50 p-2">
      {item.image_url ? (
        <img
          src={item.image_url}
          alt=""
          className="h-full w-full object-contain"
        />
      ) : (
        <Package className="h-10 w-10 text-gray-300" />
      )}
    </div>
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

function calculateCoveragePercent(trip: AIRecommendationRecord) {
  const owned = trip.owned_analysis?.owned_items.length ?? 0;
  const missing =
    (trip.missing_analysis?.missing_required_items.length ?? 0) +
    (trip.missing_analysis?.missing_recommended_items.length ?? 0) +
    (trip.missing_analysis?.missing_optional_items.length ?? 0);
  const total = owned + missing;

  if (total === 0) {
    return 0;
  }

  return Math.round((owned / total) * 100);
}

function seasonLabel(season: string) {
  const labels: Record<string, string> = {
    spring: "春山",
    summer: "夏山",
    autumn: "秋山",
    winter: "冬山"
  };

  return labels[season] ?? "山行";
}

function styleLabel(style: string) {
  const labels: Record<string, string> = {
    day_hike: "日帰り",
    hut: "小屋泊",
    tent: "テント泊"
  };

  return labels[style] ?? "山行";
}

function relativeAddedDate(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diffDays = Math.max(1, Math.round((Date.now() - created) / 86_400_000));

  return `${diffDays.toLocaleString("ja-JP")}日前`;
}

function formatKg(weightG: number) {
  return `${(weightG / 1000).toFixed(2)} kg`;
}

function getTripMountainImageUrl(trip: AIRecommendationRecord) {
  const record = trip as AIRecommendationRecord & {
    mountain?: { image_url?: string | null } | null;
    mountains?: { image_url?: string | null } | null;
    mountain_image_url?: string | null;
  };

  return (
    record.mountain_image_url ??
    record.mountain?.image_url ??
    record.mountains?.image_url ??
    null
  );
}
