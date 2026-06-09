import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const aiPageSource = readFileSync(
  new URL("../app/(app)/ai/page.tsx", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const planPageContentSource = readFileSync(
  new URL("../src/components/plan-page-content.tsx", import.meta.url),
  "utf8"
);
const tripPlanningFormSource = readFileSync(
  new URL("../src/components/trip-planning-form.tsx", import.meta.url),
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
const planActionsSource = readFileSync(
  new URL("../src/lib/actions/trip-plans.ts", import.meta.url),
  "utf8"
);
const tripPlansDataSource = readFileSync(
  new URL("../src/lib/data/trip-plans.ts", import.meta.url),
  "utf8"
);
const tripPlansMigrationSource = readFileSync(
  new URL("../supabase/migrations/011_trip_plans_saved_flow.sql", import.meta.url),
  "utf8"
);
const tripPlansProgressMigrationSource = readFileSync(
  new URL("../supabase/migrations/012_trip_plans_progress.sql", import.meta.url),
  "utf8"
);
const planPageSource = readFileSync(
  new URL("../app/(app)/plan/page.tsx", import.meta.url),
  "utf8"
);
const labelsSource = readFileSync(
  new URL("../src/lib/i18n/labels.ts", import.meta.url),
  "utf8"
);
const authFormSource = readFileSync(
  new URL("../src/components/auth-form.tsx", import.meta.url),
  "utf8"
);
const rootLayoutSource = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8"
);
const dashboardPageSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);

test("trip planning page exposes the pack planning architecture", () => {
  assert.match(aiPageSource, /PlanPageContent/);
  assert.match(planPageContentSource, /TripPlanningUI/);
  assert.match(planPageContentSource, /getMountainFoundationProfiles/);
  assert.match(planPageContentSource, /getPackRequirementPlan/);
  assert.match(planPageContentSource, /matchGearForRequirementSlot/);
  assert.match(planPageContentSource, /getGearProducts/);
  assert.match(planPageContentSource, /getRecommendationHistory/);
  assert.match(planPageContentSource, /getTripPlans/);
  assert.match(planPageContentSource, /requireUser/);
  assert.match(planPageSource, /PlanPageContent/);

  assert.doesNotMatch(`${aiPageSource}\n${planPageContentSource}`, /AIRecommendationForm/);
  assert.doesNotMatch(`${aiPageSource}\n${planPageContentSource}`, /createRecommendation/);
  assert.doesNotMatch(planPageContentSource, /getMountainImageUrl/);
});

test("trip planning UI emphasizes required systems, coverage, and missing gear", () => {
  for (const copy of [
    "必要システム",
    "装備完成度",
    "不足装備",
    "照合結果の詳細",
    "計画メモ",
    "パック計画を作成",
    "計画履歴"
  ]) {
    assert.match(`${tripPlanningUiSource}\n${tripPlanningFormSource}`, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /plan\.required_systems/);
  assert.match(tripPlanningUiSource, /coveredDisplaySlots/);
  assert.match(tripPlanningUiSource, /missingDisplaySlots/);
  assert.match(tripPlanningUiSource, /matching_owned_gear/);
  assert.match(tripPlanningUiSource, /matching_database_gear/);
  assert.match(tripPlanningUiSource, /coveragePercent/);
  assert.match(tripPlanningUiSource, /登録データ上の対応例/);
  assert.match(tripPlanningUiSource, /HeroReadinessCard/);
  assert.match(tripPlanningUiSource, /MissingGearCard/);
  assert.match(tripPlanningUiSource, /PlanHistorySection/);
  assert.match(tripPlanningUiSource, /SavePlanButton/);
  assert.match(tripPlanningUiSource, /<details/);
  assert.match(tripPlanningUiSource, /<summary/);
  assert.doesNotMatch(tripPlanningUiSource, /対応装備/);
  assert.doesNotMatch(tripPlanningUiSource, /山行サマリー/);
});

test("pack planning UX V2 prioritizes readiness and missing gear before coverage details", () => {
  const heroIndex = tripPlanningUiSource.indexOf("HeroReadinessCard");
  const missingIndex = tripPlanningUiSource.indexOf("不足装備");
  const coveredIndex = tripPlanningUiSource.indexOf("カバー済み装備");
  const matchingIndex = tripPlanningUiSource.indexOf("照合結果の詳細");

  assert.ok(heroIndex > -1);
  assert.ok(missingIndex > heroIndex);
  assert.ok(coveredIndex > missingIndex);
  assert.ok(matchingIndex > coveredIndex);

  for (const copy of [
    "山行準備",
    "カバー済み",
    "不足",
    "準備する",
    "次に準備する装備"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /sm:hidden/);
  assert.match(tripPlanningUiSource, /missingCount\.toLocaleString\("ja-JP"\)/);
});

test("pack planning UX V2 uses deterministic system icons for planning systems", () => {
  for (const icon of [
    "Droplets",
    "Tent",
    "Bed",
    "CookingPot",
    "CloudRain",
    "Shirt",
    "Compass",
    "Cross"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(icon));
  }

  assert.match(tripPlanningUiSource, /systemIcons: Record<PlanningSystem, LucideIcon>/);
  assert.match(tripPlanningUiSource, /slotSystems: Record<RequirementSlot, PlanningSystem>/);
});

test("pack planning UI deduplicates merged slot labels and supports checklist progress", () => {
  assert.match(labelsSource, /WATER_STORAGE: "水（飲料水・容器・浄水）"/);
  assert.match(labelsSource, /WATER_TREATMENT: "水（飲料水・容器・浄水）"/);
  assert.match(labelsSource, /RAIN_JACKET: "雨具（レインギア）"/);
  assert.match(labelsSource, /RAIN_PANTS: "雨具（レインギア）"/);

  assert.match(tripPlanningUiSource, /function dedupeDisplaySlots/);
  assert.match(tripPlanningUiSource, /getRequirementSlotDisplayKey/);
  assert.match(tripPlanningUiSource, /"WATER"/);
  assert.match(tripPlanningUiSource, /"RAIN_GEAR"/);
  assert.match(tripPlanningUiSource, /const \[checkedSlots, setCheckedSlots\]/);
  assert.match(tripPlanningUiSource, /type="checkbox"/);
  assert.match(tripPlanningUiSource, /handleToggleMissingSlot/);
  assert.match(tripPlanningUiSource, /onProgressChange/);
  assert.match(tripPlanningUiSource, /isDisplaySlotCovered/);
});

test("trip planning UI avoids recommendation and shopping language", () => {
  for (const source of [aiPageSource, tripPlanningUiSource, tripPlanningFormSource]) {
    assert.doesNotMatch(source, /推薦|購入|予算|価格|買う|wishlist/i);
    assert.doesNotMatch(source, /\b(recommend|shopping|upgrade|best|price)\b/i);
  }
});

test("trip planning form filters seasons and styles by selected mountain", () => {
  assert.match(tripPlanningFormSource, /"use client"/);
  assert.match(tripPlanningFormSource, /useState/);
  assert.match(tripPlanningFormSource, /useEffect/);
  assert.match(tripPlanningFormSource, /action="\/plan"/);
  assert.match(tripPlanningFormSource, /name="id" value=\{planId\}/);
  assert.match(tripPlanningFormSource, /supported_seasons/);
  assert.match(tripPlanningFormSource, /supported_styles/);
  assert.match(tripPlanningFormSource, /seasonOptions\.map/);
  assert.match(tripPlanningFormSource, /styleOptions\.map/);
  assert.doesNotMatch(tripPlanningFormSource, /SPRING",\s*"SUMMER",\s*"AUTUMN",\s*"WINTER/);
  assert.doesNotMatch(
    tripPlanningFormSource,
    /DAY_HIKE",\s*"OVERNIGHT_HUT",\s*"OVERNIGHT_TENT",\s*"MULTI_DAY_TREK/
  );
});

test("trip planning page normalizes direct URL parameters against the mountain", () => {
  assert.match(planPageContentSource, /getSelectedMountain\(selectedMountainSlug, mountains\)/);
  assert.match(planPageContentSource, /getSelectedSeason\(hydratedSeasonParam, selectedMountain\)/);
  assert.match(planPageContentSource, /getSelectedStyle\(hydratedStyleParam, selectedMountain\)/);
  assert.match(planPageContentSource, /supported_seasons\.includes\(season\)/);
  assert.match(planPageContentSource, /supported_styles\.includes\(style\)/);
  assert.doesNotMatch(planPageContentSource, /parseSeason\(params\.season\) \?\? "SUMMER"/);
  assert.doesNotMatch(planPageContentSource, /parseStyle\(params\.style\) \?\? "DAY_HIKE"/);
});

test("navigation and labels are Japanese-first planning copy", () => {
  assert.match(appNavSource, /label: "計画"/);
  assert.match(appNavSource, /href: "\/plan"/);
  assert.match(appBottomNavSource, /href: "\/plan"/);
  assert.doesNotMatch(appNavSource, /AI推薦/);

  assert.match(labelsSource, /WATER_SYSTEM: "水分補給"/);
  assert.match(labelsSource, /RAIN_SYSTEM: "雨対策"/);
  assert.match(labelsSource, /HEADLAMP: "ヘッドランプ"/);
});

test("plan history supports Supabase-backed delete and clear all actions", () => {
  assert.match(tripPlanningUiSource, /計画履歴/);
  assert.match(tripPlanningUiSource, /保存済みプラン/);
  assert.match(tripPlanningUiSource, /Delete/);
  assert.match(tripPlanningUiSource, /一键删除/);
  assert.match(tripPlanningUiSource, /action=\{deleteTripPlan\}/);
  assert.match(tripPlanningUiSource, /action=\{clearTripPlans\}/);
  assert.match(planActionsSource, /from\("trip_plans"\)/);
  assert.match(planActionsSource, /\.delete\(\)/);
  assert.match(planActionsSource, /revalidatePath\("\/plan"\)/);
  assert.match(planActionsSource, /revalidatePath\("\/dashboard"\)/);
});

test("saving and updating a plan writes progress payload and redirects home", () => {
  assert.match(tripPlanningUiSource, /function handleSavePlan/);
  assert.match(tripPlanningUiSource, /new FormData\(form\)/);
  assert.match(tripPlanningUiSource, /await saveTripPlan\(formData\)/);
  assert.match(tripPlanningUiSource, /await updateTripPlan\(formData\)/);
  assert.match(tripPlanningUiSource, /router\.push\("\/dashboard"\)/);
  assert.match(tripPlanningUiSource, /計画を保存！/);
  assert.match(tripPlanningUiSource, /変更を更新！/);
  assert.match(
    tripPlanningUiSource,
    /fixed bottom-24 left-1\/2 z-50 w-\[calc\(100%-2rem\)\] max-w-sm -translate-x-1\/2 rounded-2xl bg-\[#C62828\] py-3\.5/
  );
  assert.match(tripPlanningUiSource, /name="progress" value=\{progress\}/);
  assert.match(planActionsSource, /mountain_name: mountainName/);
  assert.match(planActionsSource, /season,/);
  assert.match(planActionsSource, /style,/);
  assert.match(planActionsSource, /progress/);
  assert.match(planActionsSource, /export async function updateTripPlan/);
  assert.match(planActionsSource, /\.update\(\{/);
  assert.match(tripPlansDataSource, /from\("trip_plans"\)/);
  assert.match(tripPlansMigrationSource, /create table if not exists public\.trip_plans/);
  assert.match(tripPlansMigrationSource, /image_url text/);
  assert.match(tripPlansMigrationSource, /progress integer not null default 0/);
  assert.match(tripPlansProgressMigrationSource, /add column if not exists progress integer not null default 0/);
  assert.match(tripPlansProgressMigrationSource, /trip_plans_update_own/);
});

test("plan id hydration links home and history to the exact saved plan", () => {
  assert.match(planPageContentSource, /id\?: string/);
  assert.match(planPageContentSource, /selectedSavedPlan/);
  assert.match(planPageContentSource, /params\.id/);
  assert.match(tripPlanningUiSource, /useSearchParams/);
  assert.match(tripPlanningUiSource, /useEffect/);
  assert.match(tripPlanningUiSource, /createClient/);
  assert.match(tripPlanningUiSource, /\.from\("trip_plans"\)/);
  assert.match(tripPlanningUiSource, /\.eq\("id", planId\)/);
  assert.match(tripPlanningUiSource, /\.single\(\)/);
  assert.match(tripPlanningUiSource, /router\.replace\(`\/plan\?\$\{nextParams\.toString\(\)\}`\)/);
  assert.match(tripPlanningUiSource, /href=\{`\/plan\?id=\$\{record\.id\}` as Route\}/);
  assert.match(dashboardPageSource, /`\/plan\?id=\$\{trip\.id\}`/);
});

test("user-facing branding uses YAMAJITAKU hierarchy", () => {
  for (const source of [
    rootLayoutSource,
    appNavSource,
    authFormSource,
    dashboardPageSource
  ]) {
    assert.match(source, /山支度/);
    assert.match(source, /YAMAJITAKU/);
    assert.doesNotMatch(source, /GearAI/);
  }

  assert.match(rootLayoutSource, /登山前の装備確認を10秒で。/);
  assert.match(rootLayoutSource, /openGraph/);
  assert.match(rootLayoutSource, /siteName: "山支度"/);
  assert.match(authFormSource, /登山前の装備確認を10秒で。/);
});

test("auth form shows submit progress for login and signup", () => {
  assert.match(authFormSource, /ログイン中\.\.\./);
  assert.match(authFormSource, /作成中\.\.\./);
});
