import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);
const appNavSource = readFileSync(
  new URL("../src/components/app-nav.tsx", import.meta.url),
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

test("home redesign keeps the required mobile-first section order", () => {
  const order = [
    "HeroCard",
    "GearSummaryCard",
    "RecentGearSection",
    "CategoryDistribution"
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
  assert.match(appBottomNavSource, /scale-110 text-\[#3A5A40\]/);
  assert.match(appBottomNavSource, /text-\[#3A5A40\]/);
  assert.match(appBottomNavSource, /text-gray-400/);
  assert.match(appBottomNavSource, /h-5 w-5/);
  assert.match(appBottomNavSource, /text-\[10px\]/);
  assert.match(appNavSource, /ホーム/);
  assert.match(appNavSource, /装備/);
  assert.match(appNavSource, /計画/);
  assert.match(appNavSource, /自分/);
  assert.doesNotMatch(dashboardSource, /function BottomNavigation/);
  assert.doesNotMatch(dashboardSource, /bottomNavItems/);
});

test("home redesign uses the requested YAMAJITAKU header and trip states", () => {
  for (const copy of [
    "山支度",
    "YAMAJITAKU",
    "次回の山行",
    "装備チェックを続ける",
    "まだ計画はありません",
    "山行計画を作成"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
});

test("home redesign v2 removes hero secondary actions and replaces bell with menu", () => {
  assert.match(dashboardSource, /sticky top-0 z-50/);
  assert.match(dashboardSource, /pt-\[max\(env\(safe-area-inset-top\),20px\)\]/);
  assert.match(dashboardSource, /aria-label="メニュー"/);
  assert.match(dashboardSource, /M4 6h16M4 12h16M4 18h16/);
  assert.doesNotMatch(dashboardSource, /Bell/);
  assert.doesNotMatch(dashboardSource, /<details/);
  assert.doesNotMatch(dashboardSource, /CalendarDays/);
  assert.doesNotMatch(dashboardSource, /formatTripDate/);
  assert.doesNotMatch(dashboardSource, /aria-label="計画を開く"/);
});

test("home hero is compact and uses the static premium hills background", () => {
  assert.match(dashboardSource, /relative h-48 w-full overflow-hidden rounded-\[28px\]/);
  assert.match(dashboardSource, /absolute inset-0 z-0/);
  assert.match(dashboardSource, /src="\/generic-hills\.jpg"/);
  assert.match(dashboardSource, /object-cover object-bottom opacity-80/);
  assert.match(dashboardSource, /absolute inset-0 z-10 bg-gradient-to-t from-\[#E8F0E8\]\/40 via-white\/90 to-white/);
  assert.match(dashboardSource, /relative z-20 flex flex-col justify-between p-5 h-full/);
  assert.match(dashboardSource, /mt-3/);
  assert.match(dashboardSource, /w-\[200px\].*bg-\[#3B5B44\]/s);
  assert.match(dashboardSource, /w-2\/3/);
  assert.match(dashboardSource, /`\/plan\?id=\$\{trip\.id\}`/);
  assert.match(dashboardSource, /trip\.progress/);
  assert.match(dashboardSource, /trip\.mountain_name/);
  assert.doesNotMatch(dashboardSource, /getTripMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainHeroImage/);
});

test("home rebuild follows the requested recent gear image layout", () => {
  assert.match(dashboardSource, /<section>\s*<div className="mb-4 flex items-center justify-between">/);
  assert.match(dashboardSource, /<div className="-mx-4">/);
  assert.match(dashboardSource, /hide-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-4/);
  assert.match(dashboardSource, /w-\[100px\] flex-none snap-start flex-col/);
  assert.match(dashboardSource, /aspect-square w-full.*rounded-2xl.*border border-gray-100 bg-white p-3 shadow-sm/s);
  assert.match(dashboardSource, /truncate text-xs font-bold text-gray-800/);
  assert.match(dashboardSource, /text-\[10px\] font-medium text-gray-400/);
  assert.match(dashboardSource, /object-contain/);
  assert.doesNotMatch(dashboardSource, /relativeAddedDate/);
  assert.doesNotMatch(dashboardSource, /日前/);
  assert.doesNotMatch(dashboardSource, /gearFallbackGradient/);
});

test("home category distribution prevents legend overflow", () => {
  assert.match(dashboardSource, /h-20 w-20/);
  assert.match(dashboardSource, /text-\[10px\]/);
  assert.match(dashboardSource, /w-16 max-w-\[70px\] truncate/);
  assert.match(dashboardSource, /grid-cols-\[10px_1fr_auto\]/);
  assert.doesNotMatch(dashboardSource, /text-xs">\s*\{distribution\.map/s);
  assert.doesNotMatch(dashboardSource, /highway/i);
});

test("home redesign exposes only allowed gear summary metrics", () => {
  for (const copy of ["所有装備数", "総重量", "総装備価値"]) {
    assert.match(dashboardSource, new RegExp(copy));
  }

  for (const forbidden of [
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
    "装備を追加する",
    "バランスの良い構成です！",
    "装備を追加すると、分布とバランスを確認できます"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
});

test("home redesign syncs latest saved trip plan from Supabase", () => {
  assert.match(dashboardSource, /getDashboardSummary/);
  assert.match(dashboardSource, /async function fetchLatestPlan/);
  assert.match(dashboardSource, /getLatestTripPlan/);
  assert.match(tripPlansDataSource, /\.from\("trip_plans"\)/);
  assert.match(tripPlansDataSource, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(tripPlansDataSource, /\.limit\(1\)/);
  assert.doesNotMatch(tripPlansDataSource, /console\.log\("Latest Plan:/);
  assert.doesNotMatch(dashboardSource, /getRecommendationHistory\(1\)/);
  assert.doesNotMatch(dashboardSource, /谷川岳/);
});
