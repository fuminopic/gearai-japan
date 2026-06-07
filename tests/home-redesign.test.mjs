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

test("home redesign keeps the required mobile-first section order", () => {
  const order = [
    "HomeHeader",
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
});

test("home redesign v2 uses shared bottom navigation", () => {
  assert.match(appNavSource, /AppBottomNav/);
  assert.match(appBottomNavSource, /usePathname/);
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
  assert.match(dashboardSource, /Menu/);
  assert.match(dashboardSource, /aria-label="メニュー"/);
  assert.match(dashboardSource, /<details/);
  assert.doesNotMatch(dashboardSource, /Bell/);
  assert.doesNotMatch(dashboardSource, /CalendarDays/);
  assert.doesNotMatch(dashboardSource, /formatTripDate/);
  assert.doesNotMatch(dashboardSource, /aria-label="計画を開く"/);
});

test("home rebuild uses the required layered hero structure", () => {
  assert.match(dashboardSource, /relative h-\[320px\] w-full overflow-hidden rounded-\[28px\]/);
  assert.match(dashboardSource, /absolute inset-0 h-full w-full object-cover/);
  assert.match(dashboardSource, /absolute inset-0 bg-gradient-to-r from-white\/95 via-white\/80 to-transparent/);
  assert.match(dashboardSource, /relative z-10 flex h-full w-full flex-col justify-between p-6/);
  assert.match(dashboardSource, /w-\[200px\].*bg-\[#3B5B44\]/s);
  assert.match(dashboardSource, /w-2\/3/);
});

test("home rebuild follows the requested recent gear image layout", () => {
  assert.match(dashboardSource, /snap-x/);
  assert.match(dashboardSource, /w-\[120px\] flex-shrink-0 snap-start/);
  assert.match(dashboardSource, /h-\[120px\] w-\[120px\].*bg-gray-50 p-2/s);
  assert.match(dashboardSource, /object-contain/);
  assert.doesNotMatch(dashboardSource, /gearFallbackGradient/);
});

test("home redesign v2 restricts hero imagery to mountain images", () => {
  assert.match(dashboardSource, /getMountainHeroImage/);
  assert.match(dashboardSource, /谷川岳/);
  assert.match(dashboardSource, /燕岳/);
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

test("home redesign does not modify dashboard data sources", () => {
  assert.match(dashboardSource, /getDashboardSummary/);
  assert.match(dashboardSource, /getRecommendationHistory\(1\)/);
  assert.doesNotMatch(dashboardSource, /from\(/);
  assert.doesNotMatch(dashboardSource, /insert|update|delete/);
});
