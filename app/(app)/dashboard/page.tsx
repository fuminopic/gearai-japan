import {
  Backpack,
  Bell,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  CircleDollarSign,
  Home,
  Lightbulb,
  Mountain,
  Package,
  PieChart,
  Plus,
  UserRound,
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

const bottomNavItems = [
  { href: "/dashboard", label: "ホーム", icon: Home, active: true },
  { href: "/gear", label: "装備", icon: Backpack, active: false },
  { href: "/ai", label: "計画", icon: ClipboardCheck, active: false },
  { href: "/profile", label: "自分", icon: UserRound, active: false }
] as const;

export default async function DashboardPage() {
  const [summary, recommendations] = await Promise.all([
    getDashboardSummary(),
    getRecommendationHistory(1)
  ]);
  const nextTrip = recommendations[0] ?? null;
  const hasGear = summary.ownedCount > 0;

  return (
    <div className="home-redesign -mx-5 -mb-28 -mt-6 min-h-screen bg-[#fbfaf7] px-6 pb-28 pt-7 text-ink md:-ml-24 md:-mt-8 md:px-6 md:pt-7">
      <HomeShellCss />
      <div className="mx-auto max-w-[390px] space-y-6">
        <HomeHeader />
        <NextTripCard trip={nextTrip} />
        <GearSummaryCard summary={summary} />
        <RecentGearSection gear={summary.recentGear} hasGear={hasGear} />
        <CategoryDistribution summary={summary} hasGear={hasGear} />
      </div>
      <BottomNavigation />
    </div>
  );
}

function HomeShellCss() {
  return (
    <style>{`
      header:has(a[href="/dashboard"]),
      aside:has(a[href="/dashboard"]),
      body > div > nav:has(a[href="/dashboard"]) {
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
    <section className="flex items-start justify-between">
      <div>
        <h1 className="text-[40px] font-bold leading-none tracking-normal">山支度</h1>
        <p className="mt-2 text-base font-medium leading-none text-black/60">
          YAMAJITAKU
        </p>
      </div>
      <button
        aria-label="通知"
        className="mt-3 flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-ink"
      >
        <Bell className="h-7 w-7 stroke-[1.8]" />
      </button>
    </section>
  );
}

function NextTripCard({ trip }: { trip: AIRecommendationRecord | null }) {
  if (!trip) {
    return <EmptyTripCard />;
  }

  const coveragePercent = calculateCoveragePercent(trip);

  return (
    <section className="relative min-h-[320px] overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_18px_48px_rgba(23,26,23,0.08)]">
      <HeroMountainPhoto />
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-58% to-white/10" />
      <div className="relative z-10 flex min-h-[272px] max-w-[70%] flex-col">
        <SectionTitle icon={<Mountain className="h-5 w-5 fill-forest-700 text-forest-700" />}>
          次の山行
        </SectionTitle>
        <Link href="/ai" aria-label="計画を開く" className="absolute right-0 top-0">
          <ChevronRight className="h-7 w-7 stroke-[1.8]" />
        </Link>
        <h2 className="mt-7 text-[42px] font-bold leading-none tracking-normal">
          {trip.input.mountain_region || "山行"}
        </h2>
        <div className="mt-5 flex flex-wrap gap-3">
          <TripTag tone="season">{seasonLabel(trip.input.season)}</TripTag>
          <TripTag tone="style">{styleLabel(trip.input.accommodation_style)}</TripTag>
        </div>
        <div className="mt-7 flex items-center gap-3 text-base font-medium">
          <CalendarDays className="h-5 w-5" />
          <span>{formatTripDate(trip.created_at, trip.input.days)}</span>
        </div>
        <div className="mt-auto max-w-[205px]">
          <p className="text-base font-bold">装備チェックの進捗</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-200">
              <div
                className="h-full rounded-full bg-forest-700"
                style={{ width: `${coveragePercent}%` }}
              />
            </div>
            <span className="text-base font-medium">{coveragePercent}%</span>
          </div>
          <Link
            href="/ai"
            className="mt-8 inline-flex w-full items-center justify-center gap-3 whitespace-nowrap rounded-2xl bg-forest-700 px-5 py-5 text-base font-bold text-white shadow-[0_12px_28px_rgba(55,96,62,0.22)]"
          >
            装備チェックを続ける
            <ChevronRight className="h-6 w-6" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function EmptyTripCard() {
  return (
    <section className="relative min-h-[320px] overflow-hidden rounded-[28px] bg-white p-6 shadow-[0_18px_48px_rgba(23,26,23,0.08)]">
      <IllustratedMountains />
      <div className="relative z-10 flex min-h-[272px] max-w-[62%] flex-col">
        <SectionTitle icon={<Mountain className="h-5 w-5 fill-forest-700 text-forest-700" />}>
          次の山行
        </SectionTitle>
        <div className="mt-14">
          <h2 className="text-[32px] font-bold leading-tight tracking-normal">
            まだ計画はありません
          </h2>
          <p className="mt-7 text-lg font-medium leading-9">
            次の登山に向けて
            <br />
            装備チェックを始めましょう
          </p>
        </div>
        <Link
          href="/ai"
          className="mt-auto inline-flex w-full items-center justify-center gap-8 rounded-2xl bg-forest-700 px-6 py-5 text-lg font-bold text-white shadow-[0_12px_28px_rgba(55,96,62,0.22)]"
        >
          山行計画を作成
          <ChevronRight className="h-6 w-6" />
        </Link>
      </div>
    </section>
  );
}

function GearSummaryCard({ summary }: { summary: DashboardSummary }) {
  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_18px_48px_rgba(23,26,23,0.07)]">
      <div className="flex items-center justify-between">
        <SectionTitle icon={<Backpack className="h-6 w-6 text-forest-700" />}>
          私の装備
        </SectionTitle>
        <Link
          href="/gear/new"
          className="inline-flex items-center gap-2 text-base font-bold text-forest-700"
        >
          <Plus className="h-5 w-5" />
          装備を追加
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-3 divide-x divide-stone-200">
        <SummaryMetric
          icon={WalletCards}
          value={`${summary.ownedCount.toLocaleString("ja-JP")} 件`}
          label="所有装備数"
        />
        <SummaryMetric
          icon={Weight}
          value={formatKg(summary.totalWeightG)}
          label="総重量"
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
    <section className="rounded-[24px] bg-white p-6 shadow-[0_18px_48px_rgba(23,26,23,0.07)]">
      <SectionHeader title="最近追加した装備" href="/gear" />
      {hasGear ? (
        <div className="mt-6 flex gap-4 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {gear.slice(0, 8).map((item, index) => (
            <article key={item.id} className="w-[122px] shrink-0">
              <GearImage item={item} index={index} />
              <h3 className="mt-3 line-clamp-1 text-base font-semibold">{item.name}</h3>
              <p className="mt-2 text-base font-medium">{Number(item.weight_grams)} g</p>
              <p className="mt-3 text-sm text-stone-500">{relativeAddedDate(item.created_at)}</p>
            </article>
          ))}
        </div>
      ) : (
        <div className="flex min-h-[250px] items-center justify-center gap-7 py-5">
          <BackpackIllustration />
          <div className="max-w-[190px]">
            <h3 className="text-xl font-bold">まだ装備がありません</h3>
            <p className="mt-4 text-base font-medium leading-8">
              最初の装備を追加して、
              <br />
              快適な山行の準備を始めましょう。
            </p>
            <Link
              href="/gear/new"
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border-2 border-forest-700 px-6 py-3 text-base font-bold text-forest-700"
            >
              装備を追加する
            </Link>
          </div>
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
  const distribution = buildDistribution(summary);

  return (
    <section className="rounded-[24px] bg-white p-6 shadow-[0_18px_48px_rgba(23,26,23,0.07)]">
      <SectionHeader
        title="カテゴリー分布"
        href="/gear"
        icon={<PieChart className="h-6 w-6 fill-forest-700 text-forest-700" />}
      />
      <div className="mt-7 grid grid-cols-[108px_1fr] items-center gap-5">
        <DonutChart distribution={distribution} hasGear={hasGear} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {distribution.map((item, index) => (
            <div key={item.label} className="grid grid-cols-[12px_1fr] gap-x-2 gap-y-1">
              <span
                className="mt-1 h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="min-w-0 text-[13px] font-medium leading-snug">{item.label}</span>
              <span className="col-start-2 text-[13px] font-bold">{item.percent}%</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-7 flex items-center justify-center gap-3 rounded-xl bg-forest-50/80 px-4 py-3 text-sm font-medium text-forest-700">
        <Lightbulb className="h-6 w-6 shrink-0 stroke-[1.8]" />
        {hasGear
          ? "バランスの良い構成です！"
          : "装備を追加すると、分布とバランスを確認できます"}
      </div>
    </section>
  );
}

function SectionTitle({
  icon,
  children
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-2xl font-bold">
      {icon}
      <span>{children}</span>
    </div>
  );
}

function SectionHeader({
  title,
  href,
  icon
}: {
  title: string;
  href: Route;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon}
        <h2 className="whitespace-nowrap text-[22px] font-bold tracking-normal">{title}</h2>
      </div>
      <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-forest-700">
        すべて見る
        <ChevronRight className="h-5 w-5" />
      </Link>
    </div>
  );
}

function TripTag({
  tone,
  children
}: {
  tone: "season" | "style";
  children: React.ReactNode;
}) {
  return (
    <span
      className={
        tone === "season"
          ? "rounded-lg bg-forest-100 px-4 py-2 text-base font-bold text-forest-800"
          : "rounded-lg bg-[#f2dfbb] px-4 py-2 text-base font-bold text-[#5a4520]"
      }
    >
      {children}
    </span>
  );
}

function SummaryMetric({
  icon: Icon,
  value,
  label
}: {
  icon: typeof WalletCards;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-100 text-forest-700">
        <Icon className="h-7 w-7 stroke-[1.8]" />
      </div>
      <p className="mt-4 text-[23px] font-bold leading-tight tracking-normal">{value}</p>
      <p className="mt-2 text-sm font-medium">{label}</p>
    </div>
  );
}

function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-100 bg-white/95 px-8 pb-6 pt-4 shadow-[0_-8px_28px_rgba(23,26,23,0.06)] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-[390px] grid-cols-4">
        {bottomNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-2 text-base font-bold ${
                item.active ? "text-forest-700" : "text-ink"
              }`}
            >
              <Icon className={`h-7 w-7 ${item.active ? "fill-forest-700" : ""}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HeroMountainPhoto() {
  return (
    <div
      className="absolute inset-y-0 right-0 w-[45%] bg-cover bg-center"
      style={{
        backgroundImage:
          "linear-gradient(135deg, rgba(47,128,77,0.08), rgba(255,255,255,0.05)), url('https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85')"
      }}
    />
  );
}

function IllustratedMountains() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-white/5" />
      <svg
        aria-hidden
        className="absolute bottom-0 right-0 h-full w-[64%]"
        viewBox="0 0 260 320"
        preserveAspectRatio="none"
      >
        <path d="M0 230 C45 175 72 185 108 145 C137 112 158 146 180 124 C210 92 230 115 260 86 L260 320 L0 320 Z" fill="#dfe8dc" />
        <path d="M0 265 C40 220 78 235 112 195 C145 156 177 185 208 148 C228 126 244 132 260 116 L260 320 L0 320 Z" fill="#cfdccc" />
        <path d="M0 304 C42 275 80 288 120 250 C156 216 190 244 226 204 C242 187 252 184 260 178 L260 320 L0 320 Z" fill="#b9cdb8" />
        <path d="M210 238 C224 258 232 280 236 320" fill="none" stroke="#efe7dc" strokeWidth="10" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function BackpackIllustration() {
  return (
    <div className="relative h-28 w-28 shrink-0 opacity-35">
      <div className="absolute inset-x-8 top-1 h-8 rounded-t-2xl border-8 border-stone-300 border-b-0" />
      <div className="absolute inset-x-5 bottom-0 top-8 rounded-3xl bg-stone-300" />
      <div className="absolute left-1 top-16 h-10 w-5 rounded-full bg-stone-200" />
      <div className="absolute right-1 top-16 h-10 w-5 rounded-full bg-stone-200" />
      <div className="absolute inset-x-9 top-16 h-3 rounded-full bg-stone-400" />
    </div>
  );
}

function GearImage({ item, index }: { item: UserGear; index: number }) {
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt=""
        className="aspect-square w-full rounded-xl object-cover"
      />
    );
  }

  return (
    <div
      className="flex aspect-square w-full items-center justify-center rounded-xl bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.12), rgba(23,26,23,0.08)), ${gearFallbackGradient(index)}`
      }}
    >
      <Package className="h-12 w-12 text-white/90" />
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
    : "conic-gradient(#e7e7e7 0% 100%)";

  return (
    <div
      className="relative h-[108px] w-[108px] rounded-full"
      style={{ background }}
    >
      <div className="absolute inset-8 rounded-full bg-white" />
    </div>
  );
}

function buildDistribution(summary: DashboardSummary) {
  if (summary.totalWeightG <= 0 || summary.categoryWeights.length === 0) {
    return categoryLabels.map((label, index) => ({
      label,
      percent: 0,
      color: index === categoryLabels.length - 1 ? "#d9d9d9" : categoryColors[index]
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

function formatTripDate(createdAt: string, days: number) {
  const start = new Date(createdAt);
  const end = new Date(start);
  end.setDate(start.getDate() + Math.max(1, days) - 1);
  const formatter = new Intl.DateTimeFormat("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short"
  });

  if (days <= 1) {
    return formatter.format(start);
  }

  return `${formatter.format(start)} 〜${formatter.format(end)}`;
}

function relativeAddedDate(createdAt: string) {
  const created = new Date(createdAt).getTime();
  const diffDays = Math.max(1, Math.round((Date.now() - created) / 86_400_000));

  return `${diffDays.toLocaleString("ja-JP")}日前`;
}

function formatKg(weightG: number) {
  return `${(weightG / 1000).toFixed(2)} kg`;
}

function gearFallbackGradient(index: number) {
  const gradients = [
    "linear-gradient(135deg, #7ea582, #2b4e33)",
    "linear-gradient(135deg, #c9b78f, #7d6942)",
    "linear-gradient(135deg, #d8d2c6, #7f766a)",
    "linear-gradient(135deg, #b7c9d6, #263a45)"
  ];

  return gradients[index % gradients.length];
}
