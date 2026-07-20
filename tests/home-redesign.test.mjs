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
const rootLayoutSource = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
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
  assert.match(dashboardSource, /<main className="home-redesign min-h-screen bg-\[#E5EBE9\] pb-32/);
  assert.match(dashboardSource, /<div className="relative z-20 -mt-\[107px\] space-y-\[11px\] px-4">/);
});

test("home redesign v2 uses shared bottom navigation", () => {
  assert.match(appNavSource, /AppBottomNav/);
  assert.match(appBottomNavSource, /usePathname/);
  assert.match(
    appBottomNavSource,
    /fixed inset-x-6 bottom-8 z-50 overflow-hidden rounded-full border border-white\/40 px-2 py-2 shadow-\[0_20px_40px_rgba\(0,0,0,0\.1\)\] backdrop-blur-2xl/
  );
  assert.match(appBottomNavSource, /rounded-full/);
  assert.match(appBottomNavSource, /px-2/);
  assert.match(appBottomNavSource, /py-2/);
  assert.match(appBottomNavSource, /transition-colors duration-200/);
  assert.match(appBottomNavSource, /touch-manipulation/);
  assert.match(appBottomNavSource, /prefetch/);
  assert.match(appBottomNavSource, /active:scale-95/);
  assert.match(appBottomNavSource, /text-\[#14724e\]/);
  assert.match(appBottomNavSource, /text-gray-400/);
  assert.match(appBottomNavSource, /h-5 w-5/);
  assert.match(appBottomNavSource, /text-\[10px\]/);
  assert.match(appNavSource, /ホーム/);
  assert.match(appNavSource, /ギア/);
  assert.match(appNavSource, /計画/);
  assert.match(appNavSource, /マイページ/);
  assert.doesNotMatch(dashboardSource, /function BottomNavigation/);
  assert.doesNotMatch(dashboardSource, /bottomNavItems/);
});

test("app middleware keeps navigation lightweight", () => {
  assert.match(supabaseMiddlewareSource, /auth\.getSession\(\)/);
  assert.doesNotMatch(supabaseMiddlewareSource, /auth\.getUser\(\)/);
  assert.match(supabaseMiddlewareSource, /data loaders still verify users/);
  assert.match(supabaseMiddlewareSource, /classifyAuthUserError/);
  assert.match(supabaseMiddlewareSource, /clearSupabaseAuthCookiesAndRedirectToLogin/);
  assert.match(supabaseMiddlewareSource, /NextResponse\.redirect\(loginUrl\)/);
  assert.match(supabaseMiddlewareSource, /request\.cookies\.delete\(cookie\.name\)/);
  assert.match(supabaseMiddlewareSource, /response\.cookies\.set\(cookie\.name, "",/);
  assert.match(supabaseMiddlewareSource, /name\.startsWith\("sb-"\)/);
  assert.doesNotMatch(supabaseMiddlewareSource, /signOut/);
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
  assert.match(dashboardSource, /yamajitaku-wordmark-white\.png/);
  assert.match(dashboardSource, /alt="山支度 YAMAJITAKU"/);
  assert.match(appNavSource, /AppLogo/);
  assert.match(appLogoSource, /\/yamajitaku-logo\.png/);
  assert.match(appLogoSource, /alt="山支度 YAMAJITAKU"/);
});

test("home redesign v2 removes hero secondary actions and replaces bell with menu", () => {
  assert.match(dashboardSource, /relative z-10 flex w-full items-start justify-between bg-gradient-to-br/);
  assert.match(dashboardSource, /pt-\[max\(env\(safe-area-inset-top\),20px\)\]/);
  assert.match(dashboardSource, /AppMenuDrawer/);
  assert.match(dashboardSource, /yamajitaku-wordmark-white\.png/);
  assert.doesNotMatch(dashboardSource, /M4 6h16M4 12h16M4 18h16/);
  assert.doesNotMatch(dashboardSource, /Bell/);
  assert.doesNotMatch(dashboardSource, /<details/);
  assert.doesNotMatch(dashboardSource, /CalendarDays/);
  assert.doesNotMatch(dashboardSource, /formatTripDate/);
  assert.doesNotMatch(dashboardSource, /aria-label="計画を開く"/);
});

test("home background fills the iOS safe area during scroll", () => {
  assert.match(rootLayoutSource, /viewportFit: "cover"/);
  assert.match(rootLayoutSource, /themeColor: "#FAFAFA"/);
  assert.match(globalsSource, /html \{[\s\S]*background: #fafafa;/);
  assert.match(globalsSource, /body \{[\s\S]*background: #fafafa;/);
  assert.match(globalsSource, /body:has\(main\.home-redesign\) \{[\s\S]*background: #e5ebe9;/);
  assert.match(dashboardSource, /style=\{\{ minHeight: "calc\(max\(env\(safe-area-inset-top\), 20px\) \+ 206px\)" \}\}/);
  assert.doesNotMatch(globalsSource, /body:has\(main\.home-redesign\)::before/);
});

test("home hero streams the saved plan checklist gauge without blocking first paint", () => {
  assert.match(dashboardSource, /rounded-\[20px\] bg-white px-5 pt-5 pb-3 shadow-sm/);
  assert.match(dashboardSource, /Suspense fallback=\{<HeroGaugeSkeleton/);
  assert.match(dashboardSource, /HeroGaugeAsync/);
  assert.match(dashboardSource, /HeroGauge/);
  assert.match(dashboardSource, /getPackRequirementPlan/);
  assert.match(dashboardSource, /buildPlanChecklist/);
  assert.match(dashboardSource, /fallbackPercent/);
  assert.match(dashboardSource, /trip\.checked_slots/);
  assert.match(dashboardSource, /`\/plan\?id=\$\{trip\.id\}`/);
  assert.doesNotMatch(dashboardSource, /focus=predeparture/);
  assert.match(dashboardSource, /出発前確認へ/);
  assert.match(dashboardSource, /trip\.progress/);
  assert.match(dashboardSource, /trip\.mountain_name/);
  assert.match(dashboardSource, /userId=\{trip\.user_id\}/);
  assert.match(dashboardSource, /src="\/generic-hills\.jpg"/);
  assert.doesNotMatch(dashboardSource, /getTripMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainImageUrl/);
  assert.doesNotMatch(dashboardSource, /getMountainHeroImage/);
  assert.match(dashboardPlanChecklistSummarySource, /readTripPlanChecklistOnlyIds/);
});

test("home rebuild follows the requested recent gear image layout", () => {
  assert.match(dashboardSource, /hide-scrollbar flex snap-x snap-mandatory gap-\[11px\] overflow-x-auto pb-4/);
  assert.match(dashboardSource, /h-\[150px\] w-\[126px\] flex-none snap-start/);
  assert.match(dashboardSource, /rounded-2xl bg-white px-3 pt-\[17px\] pb-\[52px\] shadow-sm/);
  assert.match(dashboardSource, /bottom-\[27px\] truncate text-center text-\[12px\] font-bold/);
  assert.match(dashboardSource, /bottom-\[14px\] text-center font-din text-\[11px\]/);
  assert.match(dashboardSource, /object-contain/);
  assert.doesNotMatch(dashboardSource, /relativeAddedDate/);
  assert.doesNotMatch(dashboardSource, /日前/);
  assert.doesNotMatch(dashboardSource, /gearFallbackGradient/);
});

test("home gear summary uses the pack-only weight composition bar", () => {
  assert.match(dashboardSource, /GearComposition/);
  assert.match(dashboardSource, /buildGearComposition/);
  assert.match(dashboardSource, /MAJOR_GEAR_CATEGORIES/);
  assert.match(dashboardSource, /パック重量構成/);
  assert.match(dashboardSource, /flex h-3 overflow-hidden rounded-full bg-stone-100/);
  assert.match(dashboardSource, /grid grid-cols-3 gap-x-4 gap-y-3/);
  assert.match(dashboardSource, /MAJOR_GEAR_CATEGORIES\.map/);
  assert.doesNotMatch(dashboardSource, /topCategories/);
  assert.doesNotMatch(dashboardSource, /CategoryDistribution/);
  assert.doesNotMatch(dashboardSource, /DonutChart/);
  assert.doesNotMatch(dashboardSource, /カテゴリー分布/);
  assert.doesNotMatch(dashboardSource, /h-32 w-32/);
  assert.doesNotMatch(dashboardSource, /highway/i);
});

test("home redesign exposes pack-focused gear summary metrics", () => {
  for (const copy of ["マイギア", "マイパック", "パック内カテゴリー"]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
  assert.match(dashboardDataSource, /user_pack_items/);
  assert.match(dashboardDataSource, /buildPackSummary/);
  assert.match(dashboardSource, /packKnownWeightG/);
  assert.doesNotMatch(dashboardSource, /totalWeightG/);

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

test("home gear summary keeps metric values on one line and only reduces them on narrow screens", () => {
  assert.match(
    dashboardSource,
    /whitespace-nowrap font-din text-\[22px\] font-bold leading-none text-black max-\[374px\]:text-\[18px\]/
  );
});

test("home redesign includes gear empty and category empty states", () => {
  for (const copy of [
    "まだギアがありません",
    "最初のギアを追加して、",
    "ギアを追加する"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }
  assert.doesNotMatch(dashboardSource, /未登録:/);
  assert.doesNotMatch(dashboardSource, /主要カテゴリーは登録済みです/);
  assert.doesNotMatch(dashboardSource, /バランスの良い構成です！/);
  assert.doesNotMatch(dashboardSource, /ギアを追加すると、分布とバランスを確認できます/);
  assert.match(dashboardSource, /マイパックはまだ空です/);
  assert.match(dashboardSource, /マイパックを作る/);
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
  assert.match(dashboardPlanMetaSource, /readTripPlanLocalMeta/);
  assert.match(dashboardPlanMetaSource, /plannedEndDate\?: string \| null/);
  assert.match(dashboardPlanMetaSource, /localMeta\?\.plannedEndDate/);
  assert.match(dashboardPlanMetaSource, /formatPlanDate\(displayDate, displayEndDate, style\)/);
  assert.match(dashboardPlanMetaSource, /function PlanDatePart/);
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
  assert.match(dashboardSource, /font-din/);
  assert.match(dashboardSource, /from-\[#1F7950\] to-\[#81AB44\]/);
  assert.doesNotMatch(dashboardSource, /#3B5B44|#3A5A40/);
  assert.doesNotMatch(appBottomNavSource, /#3B5B44|#3A5A40/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /#3B5B44|#3A5A40/);
});
