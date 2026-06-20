import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);
const dashboardPlanChecklistSummarySource = readFileSync(
  new URL("../src/components/dashboard-plan-checklist-summary.tsx", import.meta.url),
  "utf8"
);
const dashboardPlanMetaSource = readFileSync(
  new URL("../src/components/dashboard-plan-meta.tsx", import.meta.url),
  "utf8"
);
const appNavSource = readFileSync(
  new URL("../src/components/app-nav.tsx", import.meta.url),
  "utf8"
);
const appLogoSource = readFileSync(
  new URL("../src/components/app-logo.tsx", import.meta.url),
  "utf8"
);
const appBottomNavSource = readFileSync(
  new URL("../src/components/app-bottom-nav.tsx", import.meta.url),
  "utf8"
);
const tripPlansDataSource = readFileSync(
  new URL("../src/lib/data/trip-plans.ts", import.meta.url),
  "utf8"
);
const dashboardDataSource = readFileSync(
  new URL("../src/lib/data/dashboard.ts", import.meta.url),
  "utf8"
);
const supabaseMiddlewareSource = readFileSync(
  new URL("../src/lib/supabase/middleware.ts", import.meta.url),
  "utf8"
);
const tailwindConfigSource = readFileSync(
  new URL("../tailwind.config.ts", import.meta.url),
  "utf8"
);
const globalsSource = readFileSync(
  new URL("../app/globals.css", import.meta.url),
  "utf8"
);

test("home redesign keeps the required mobile-first section order", () => {
  const order = [
    "HeroCard",
    "GearSummaryCard",
    "RecentGearSection"
  ];
  const indexes = order.map((name) => dashboardSource.indexOf(`<${name}`));

  for (const index of indexes) {
    assert.ok(index > -1);
  }

  assert.deepEqual(
    [...indexes].sort((a, b) => a - b),
    indexes
  );
});

test("home rebuild exposes a master state component for the four home states", () => {
  assert.match(dashboardSource, /function HomePageContent/);
  assert.match(dashboardSource, /hasTrip: boolean/);
  assert.match(dashboardSource, /hasGear: boolean/);
  assert.match(dashboardSource, /<HeroCard hasTrip={hasTrip} trip={trip}/);
  assert.match(dashboardSource, /<main className="home-redesign min-h-screen bg-\[#FAFAFA\] pb-32/);
  assert.match(dashboardSource, /<div className="mt-6 space-y-6 px-4">/);
});

test("home redesign v2 uses shared bottom navigation", () => {
  assert.match(appNavSource, /AppBottomNav/);
  assert.match(appBottomNavSource, /usePathname/);
  assert.match(
    appBottomNavSource,
    /fixed inset-x-6 bottom-8 z-50 bg-white\/25 backdrop-blur-\[24px\] border border-white\/50 shadow-\[0_20px_40px_rgba\(0,0,0,0\.1\)\] rounded-full px-6 py-2\.5 flex justify-between items-center/
  );
  assert.match(appBottomNavSource, /rounded-full/);
  assert.match(appBottomNavSource, /px-6/);
  assert.match(appBottomNavSource, /py-2\.5/);
  assert.match(appBottomNavSource, /transition-all duration-150 ease-out/);
  assert.match(appBottomNavSource, /touch-manipulation/);
  assert.match(appBottomNavSource, /prefetch/);
  assert.match(appBottomNavSource, /scale-110 text-\[#14724e\]/);
  assert.match(appBottomNavSource, /text-\[#14724e\]/);
  assert.match(appBottomNavSource, /text-gray-400/);
  assert.match(appBottomNavSource, /h-5 w-5/);
  assert.match(appBottomNavSource, /text-\[10px\]/);
  assert.match(appNavSource, /ホーム/);
  assert.match(appNavSource, /装備/);
  assert.match(appNavSource, /計画/);
  assert.match(appNavSource, /マイページ/);
  assert.doesNotMatch(dashboardSource, /function BottomNavigation/);
  assert.doesNotMatch(dashboardSource, /bottomNavItems/);
});

test("app middleware keeps navigation lightweight", () => {
  assert.match(supabaseMiddlewareSource, /auth\.getSession\(\)/);
  assert.doesNotMatch(supabaseMiddlewareSource, /auth\.getUser\(\)/);
  assert.match(supabaseMiddlewareSource, /data loaders still verify users/);
});

test("home redesign uses the requested YAMAJITAKU header and trip states", () => {
  for (const copy of [
    "次回の山行",
    "出発前確認へ",
    "まだ計画はありません",
    "山行計画を作成"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
  assert.match(dashboardSource, /AppLogo/);
  assert.match(appNavSource, /AppLogo/);
  assert.match(appLogoSource, /\/yamajitaku-logo\.png/);
  assert.match(appLogoSource, /alt="山支度 YAMAJITAKU"/);
});

test("home redesign v2 removes hero secondary actions and replaces bell with menu", () => {
  assert.match(dashboardSource, /sticky top-0 z-50/);
  assert.match(dashboardSource, /pt-\[max\(env\(safe-area-inset-top\),20px\)\]/);
  assert.match(dashboardSource, /AppMenuDrawer/);
  assert.doesNotMatch(dashboardSource, /M4 6h16M4 12h16M4 18h16/);
  assert.doesNotMatch(dashboardSource, /Bell/);
  assert.doesNotMatch(dashboardSource, /<details/);
  assert.doesNotMatch(dashboardSource, /CalendarDays/);
  assert.doesNotMatch(dashboardSource, /formatTripDate/);
  assert.doesNotMatch(dashboardSource, /aria-label="計画を開く"/);
});

test("home hero shows the saved plan checklist summary over the static hills background", () => {
  assert.match(dashboardSource, /relative min-h-\[252px\] w-full overflow-hidden rounded-\[28px\]/);
  assert.match(dashboardSource, /absolute inset-0 z-0/);
  assert.match(dashboardSource, /src="\/generic-hills\.jpg"/);
  assert.match(dashboardSource, /object-cover object-bottom opacity-80/);
  assert.match(dashboardSource, /absolute inset-0 z-10 bg-gradient-to-t from-\[#E8F0E8\]\/40 via-white\/90 to-white/);
  assert.match(dashboardSource, /relative z-20 flex min-h-\[252px\] flex-col justify-between gap-3 p-5/);
  assert.match(dashboardSource, /font-maru text-\[45px\]/);
  assert.match(dashboardSource, /tracking-\[0\.04em\]/);
  assert.match(dashboardSource, /bg-\[#14724e\]/);
  assert.match(dashboardSource, /w-\[184px\].*rounded-2xl.*bg-\[#14724e\]/s);
  assert.match(dashboardSource, /DashboardPlanChecklistSummary/);
  assert.match(dashboardSource, /getPackRequirementPlan/);
  assert.match(dashboardSource, /buildPlanChecklist/);
  assert.match(dashboardPlanChecklistSummarySource, /getChecklistOnlyStorageKey/);
  assert.match(dashboardPlanChecklistSummarySource, /getCheckedSlotsStorageKey/);
  assert.match(dashboardPlanChecklistSummarySource, /applyChecklistStateToChecklist/);
  assert.match(dashboardPlanChecklistSummarySource, /PlanCategorySummary/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /buildPreDepartureSummary/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /重要確認/);
  assert.match(dashboardPlanChecklistSummarySource, /category\.progress\.percent/);
  assert.match(dashboardSource, /`\/plan\?id=\$\{trip\.id\}`/);
  assert.doesNotMatch(dashboardSource, /focus=predeparture/);
  assert.match(dashboardSource, /出発前確認へ/);
  assert.match(dashboardSource, /trip\.progress/);
  assert.match(dashboardSource, /trip\.mountain_name/);
  assert.doesNotMatch(dashboardSource, /getTripMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainHeroImage/);
});

test("home rebuild follows the requested recent gear image layout", () => {
  assert.match(dashboardSource, /<section>\s*<div className="mb-4 flex items-center justify-between">/);
  assert.match(dashboardSource, /hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4/);
  assert.match(dashboardSource, /w-\[100px\] flex-none snap-start flex-col/);
  assert.match(dashboardSource, /aspect-square w-full.*rounded-2xl.*border border-gray-100 bg-white p-3 shadow-sm/s);
  assert.match(dashboardSource, /truncate text-xs font-bold text-gray-800/);
  assert.match(dashboardSource, /text-\[10px\] font-medium text-gray-400/);
  assert.match(dashboardSource, /object-contain/);
  assert.doesNotMatch(dashboardSource, /relativeAddedDate/);
  assert.doesNotMatch(dashboardSource, /日前/);
  assert.doesNotMatch(dashboardSource, /gearFallbackGradient/);
});

test("home gear summary uses the retail category composition bar", () => {
  assert.match(dashboardSource, /GearComposition/);
  assert.match(dashboardSource, /buildGearComposition/);
  assert.match(dashboardSource, /MAJOR_GEAR_CATEGORIES/);
  assert.match(dashboardSource, /装備構成/);
  assert.match(dashboardSource, /flex h-3 overflow-hidden rounded-full bg-stone-100/);
  assert.match(dashboardSource, /grid grid-cols-2 gap-x-4 gap-y-2/);
  assert.match(dashboardSource, /MAJOR_GEAR_CATEGORIES\.map/);
  assert.doesNotMatch(dashboardSource, /topCategories/);
  assert.doesNotMatch(dashboardSource, /CategoryDistribution/);
  assert.doesNotMatch(dashboardSource, /DonutChart/);
  assert.doesNotMatch(dashboardSource, /カテゴリー分布/);
  assert.doesNotMatch(dashboardSource, /h-32 w-32/);
  assert.doesNotMatch(dashboardSource, /highway/i);
});

test("home redesign exposes only allowed gear summary metrics", () => {
  for (const copy of ["マイ装備", "所有装備数", "総重量", "主要カテゴリー"]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
  assert.match(dashboardDataSource, /getMajorGearCategoryCoverage/);
  assert.match(dashboardDataSource, /majorCategoryMissingLabels/);
  assert.doesNotMatch(dashboardSource, /majorCategoryMissingLabels/);

  for (const forbidden of [
    "私の装備",
    "総装備価値",
    "総購入額",
    "節約額",
    "節約率",
    "MSRP",
    "Pack Weight"
  ]) {
    assert.doesNotMatch(dashboardSource, new RegExp(forbidden));
  }
});

test("home redesign includes gear empty and category empty states", () => {
  for (const copy of [
    "まだ装備がありません",
    "最初の装備を追加して、",
    "装備を追加する"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
  assert.doesNotMatch(dashboardSource, /未登録:/);
  assert.doesNotMatch(dashboardSource, /主要カテゴリーは登録済みです/);
  assert.doesNotMatch(dashboardSource, /バランスの良い構成です！/);
  assert.doesNotMatch(dashboardSource, /装備を追加すると、分布とバランスを確認できます/);
});

test("home redesign syncs latest saved trip plan from Supabase", () => {
  assert.match(dashboardSource, /getDashboardSummary/);
  assert.match(dashboardDataSource, /DASHBOARD_GEAR_SELECT/);
  assert.doesNotMatch(dashboardDataSource, /getUserGear\(/);
  assert.match(dashboardSource, /async function fetchLatestPlan/);
  assert.match(dashboardSource, /getLatestTripPlan/);
  assert.match(tripPlansDataSource, /\.from\("trip_plans"\)/);
  assert.match(tripPlansDataSource, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(tripPlansDataSource, /\.limit\(1\)/);
  assert.doesNotMatch(tripPlansDataSource, /console\.log\("Latest Plan:/);
  assert.doesNotMatch(dashboardSource, /getRecommendationHistory\(1\)/);
  assert.doesNotMatch(dashboardSource, /谷川岳/);
});

test("home hero can display saved trip date and memo without price information", () => {
  assert.match(dashboardSource, /DashboardPlanMeta/);
  assert.match(dashboardSource, /plannedDate=\{trip\.planned_date\}/);
  assert.match(dashboardSource, /plannedEndDate=\{trip\.planned_end_date\}/);
  assert.match(dashboardSource, /tripMemo=\{trip\.trip_memo\}/);
  assert.match(dashboardSource, /style=\{trip\.style\}/);
  assert.match(dashboardSource, /variant="memo"/);
  assert.match(dashboardPlanMetaSource, /readTripPlanLocalMeta/);
  assert.match(dashboardPlanMetaSource, /plannedEndDate\?: string \| null/);
  assert.match(dashboardPlanMetaSource, /localMeta\?\.plannedEndDate/);
  assert.match(dashboardPlanMetaSource, /formatPlanDate\(displayDate, displayEndDate, style\)/);
  assert.match(dashboardPlanMetaSource, /function PlanDatePart/);
  assert.match(dashboardSource, /items-end gap-x-4 gap-y-3/);
  assert.match(dashboardSource, /pb-1 font-maru/);
  assert.match(dashboardSource, /flex items-end gap-2 overflow-hidden/);
  assert.match(dashboardPlanMetaSource, /text-\[18px\]/);
  assert.match(dashboardPlanMetaSource, /h-\[18px\] w-\[18px\]/);
  assert.match(dashboardPlanMetaSource, /style === "DAY_HIKE"/);
  assert.doesNotMatch(dashboardPlanMetaSource, /endDate\.setDate\(date\.getDate\(\) \+ 1\)/);
  assert.match(dashboardPlanMetaSource, /truncate text-\[11px\] font-medium text-stone-500/);
});

test("home typography and green palette follow the latest visual direction", () => {
  assert.match(globalsSource, /font-family: Helvetica, Arial/);
  assert.match(tailwindConfigSource, /700: "#14724e"/);
  assert.match(tailwindConfigSource, /fontFamily/);
  assert.match(tailwindConfigSource, /maru/);
  assert.match(dashboardSource, /font-sans text-\[#14724e\]/);
  assert.match(dashboardSource, /font-maru/);
  assert.doesNotMatch(dashboardSource, /#3B5B44|#3A5A40/);
  assert.doesNotMatch(appBottomNavSource, /#3B5B44|#3A5A40/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /#3B5B44|#3A5A40/);
});
