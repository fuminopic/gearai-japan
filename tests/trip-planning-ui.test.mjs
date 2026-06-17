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
const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
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
const navigationFeedbackSource = readFileSync(
  new URL("../src/components/navigation-feedback.tsx", import.meta.url),
  "utf8"
);
const appRoutePrefetcherSource = readFileSync(
  new URL("../src/components/app-route-prefetcher.tsx", import.meta.url),
  "utf8"
);
const appBottomNavSource = readFileSync(
  new URL("../src/components/app-bottom-nav.tsx", import.meta.url),
  "utf8"
);
const appLayoutSource = readFileSync(
  new URL("../app/(app)/layout.tsx", import.meta.url),
  "utf8"
);
const appLoadingSource = readFileSync(
  new URL("../app/(app)/loading.tsx", import.meta.url),
  "utf8"
);
const rootLoadingSource = readFileSync(
  new URL("../app/loading.tsx", import.meta.url),
  "utf8"
);
const planActionsSource = readFileSync(
  new URL("../src/lib/actions/trip-plans.ts", import.meta.url),
  "utf8"
);
const gearActionsSource = readFileSync(
  new URL("../src/lib/actions/gear.ts", import.meta.url),
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
const tripPlansCheckedSlotsMigrationSource = readFileSync(
  new URL("../supabase/migrations/013_trip_plans_checked_slots.sql", import.meta.url),
  "utf8"
);
const tripPlansDetailsMigrationSource = readFileSync(
  new URL("../supabase/migrations/037_trip_plan_details.sql", import.meta.url),
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
const dashboardPlanChecklistSummarySource = readFileSync(
  new URL("../src/components/dashboard-plan-checklist-summary.tsx", import.meta.url),
  "utf8"
);
const gearDataSource = readFileSync(
  new URL("../src/lib/data/gear.ts", import.meta.url),
  "utf8"
);
const mountainFoundationSource = readFileSync(
  new URL("../src/lib/data/mountain-foundation.ts", import.meta.url),
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

test("trip planning page always refreshes gear-derived pack coverage", () => {
  assert.match(planPageSource, /dynamic = "force-dynamic"/);
  assert.match(planPageSource, /revalidate = 0/);
  assert.match(gearActionsSource, /revalidatePath\("\/plan"\)/);
  assert.match(planPageContentSource, /const \[mountainResult, planHistory, savedPlans\] = await Promise\.all/);
  assert.match(planPageContentSource, /getRecommendationHistory\(\)/);
  assert.match(planPageContentSource, /getTripPlans\(\)/);
  assert.match(planPageContentSource, /getPackRequirementPlan\(\{/);
  assert.match(planPageContentSource, /plan = generatedPlan/);
  assert.match(planPageContentSource, /matchGearForRequirementSlot/);
});

test("app navigation responds immediately during dynamic route loading", () => {
  assert.match(appLayoutSource, /<Suspense fallback=\{<AppLoadingFallback \/>/);
  assert.match(appLayoutSource, /function AppLayout/);
  assert.match(appLayoutSource, /async function AuthGate/);
  assert.match(appLoadingSource, /animate-pulse/);
  assert.match(rootLoadingSource, /animate-pulse/);
  assert.match(appNavSource, /NavigationFeedback/);
  assert.match(appNavSource, /AppRoutePrefetcher/);
  assert.match(appRoutePrefetcherSource, /router\.prefetch/);
  assert.match(appRoutePrefetcherSource, /primaryPrefetchRoutes/);
  assert.match(appRoutePrefetcherSource, /"\/dashboard", "\/plan", "\/gear", "\/profile"/);
  assert.match(appRoutePrefetcherSource, /secondaryPrefetchRoutes/);
  assert.match(appRoutePrefetcherSource, /"\/gear\/new", "\/ai", "\/ai\/history"/);
  assert.match(appBottomNavSource, /touch-manipulation/);
  assert.match(appBottomNavSource, /active:scale-95/);
  assert.match(navigationFeedbackSource, /document\.addEventListener\("click"/);
  assert.match(navigationFeedbackSource, /usePathname/);
  assert.match(navigationFeedbackSource, /useSearchParams/);
  assert.match(navigationFeedbackSource, /link\.href === window\.location\.href/);
  assert.match(tripPlanningFormSource, /onSubmit=\{handleSubmit\}/);
  assert.match(tripPlanningFormSource, /router\.push\(`\/plan\?\$\{params\.toString\(\)\}` as Route\)/);
  assert.match(tripPlanningFormSource, /prefetchedPlanHref/);
  assert.match(tripPlanningFormSource, /router\.prefetch\(prefetchedPlanHref\)/);
  assert.match(tripPlanningFormSource, /作成中\.\.\./);
  assert.doesNotMatch(tripPlanningFormSource, /form action="\/plan"/);
  assert.match(planPageContentSource, /Promise\.all/);
  assert.match(planPageContentSource, /generatedPlan/);
  assert.match(gearDataSource, /cache\(async function requireUser/);
  assert.match(gearDataSource, /cache\(async function getGearProducts/);
  assert.match(mountainFoundationSource, /cache\(\s*async function getMountainFoundationProfiles/);
});

test("trip planning UI presents a professional gear checklist", () => {
  for (const copy of [
    "装備チェックリスト",
    "総完成度",
    "未完了",
    "装備庫との照合詳細",
    "確認メモ",
    "パック計画を作成",
    "計画履歴"
  ]) {
    assert.match(`${tripPlanningUiSource}\n${tripPlanningFormSource}`, new RegExp(copy));
  }

  for (const copy of [
    "衣類",
    "行動装備",
    "水・食料",
    "ナビ・電子機器",
    "安全・救急",
    "特殊装備",
    "宿泊装備",
    "必須",
    "推奨",
    "あると便利",
    "所持済み",
    "確認済み",
    "要確認",
    "登山地図アプリ（YAMAP・ヤマレコ等）",
    "紙地図・コンパス"
  ]) {
    assert.match(`${tripPlanningUiSource}\n${planChecklistSource}`, new RegExp(copy));
  }

  assert.doesNotMatch(tripPlanningUiSource, /Gear-backed/);
  assert.doesNotMatch(tripPlanningUiSource, /Checklist-only/);
  assert.doesNotMatch(planChecklistSource, /nav-smartphone/);
  assert.doesNotMatch(planChecklistSource, /label: "スマホ"/);
  assert.doesNotMatch(planChecklistSource, /GPS端末/);
  assert.doesNotMatch(planChecklistSource, /gpsDevice/);
  assert.doesNotMatch(tripPlanningUiSource, /未登録/);
  assert.match(tripPlanningUiSource, /buildPlanChecklist/);
  assert.match(tripPlanningUiSource, /calculateChecklistProgress\(/);
  assert.match(tripPlanningUiSource, /checklistItemIcons/);
  assert.match(tripPlanningUiSource, /type ChecklistItemIcon/);
  assert.match(tripPlanningUiSource, /matching_owned_gear/);
  assert.match(tripPlanningUiSource, /matching_database_gear/);
  assert.match(tripPlanningUiSource, /登録データ上の対応例/);
  assert.match(tripPlanningUiSource, /HeroReadinessCard/);
  assert.match(tripPlanningUiSource, /ChecklistCategoryCard/);
  assert.match(tripPlanningUiSource, /ChecklistItemRow/);
  assert.match(tripPlanningUiSource, /PlanHistorySection/);
  assert.match(tripPlanningUiSource, /SavePlanButton/);
  assert.match(tripPlanningUiSource, /<details/);
  assert.match(tripPlanningUiSource, /<summary/);
  assert.doesNotMatch(tripPlanningUiSource, /必要システム/);
  assert.doesNotMatch(tripPlanningUiSource, /不足装備/);
  assert.doesNotMatch(tripPlanningUiSource, /対応装備/);
  assert.doesNotMatch(tripPlanningUiSource, /山行サマリー/);
});

test("pack planning checklist prioritizes readiness before gear-backed details", () => {
  const heroIndex = tripPlanningUiSource.indexOf("HeroReadinessCard");
  const checklistIndex = tripPlanningUiSource.indexOf("装備チェックリスト");
  const matchingIndex = tripPlanningUiSource.indexOf("装備庫との照合詳細");

  assert.ok(heroIndex > -1);
  assert.ok(checklistIndex > heroIndex);
  assert.ok(matchingIndex > checklistIndex);

  for (const copy of [
    "山行準備",
    "本チェックリストは現在の",
    "準備確認",
    "完成",
    "完了",
    "未完了"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /sm:hidden/);
  assert.match(tripPlanningUiSource, /missingCount\.toLocaleString\("ja-JP"\)/);
});

test("pack planning checklist keeps special and overnight equipment dynamic", () => {
  for (const copy of [
    "ヘルメット",
    "チェーンスパイク",
    "アイゼン",
    "ピッケル",
    "熊対策装備",
    "渡渉用シューズ",
    "携帯トイレ",
    "インナーシーツ",
    "耳栓",
    "洗面用品",
    "テント",
    "シュラフ",
    "マット",
    "ペグ",
    "グランドシート"
  ]) {
    assert.match(planChecklistSource, new RegExp(copy));
  }

  assert.match(planChecklistSource, /if \(plan\.style === "DAY_HIKE"\)/);
  assert.match(planChecklistSource, /SPECIAL_GEAR/);
  assert.match(planChecklistSource, /OVERNIGHT_GEAR/);
  assert.match(planChecklistSource, /mountain\.helmet_guidance/);
  assert.match(planChecklistSource, /mountain\.snow_or_ice_risk/);
  assert.match(planChecklistSource, /mountain\.bear_or_wildlife_risk/);
});

test("pack planning checklist fixes first-round readiness issues", () => {
  assert.match(planPageContentSource, /getOwnedGearForPlanning/);
  assert.match(planPageContentSource, /ownedGear=\{ownedGear\}/);
  assert.match(dashboardPageSource, /getOwnedGearForPlanning/);
  assert.match(dashboardPageSource, /buildPlanChecklist\(\{/);
  assert.match(dashboardPageSource, /ownedGear/);
  assert.match(planChecklistSource, /ownedGearMatcher: "GROUNDSHEET"/);
  assert.match(
    planChecklistSource,
    /hasAnyRequiredSlot\(plan, \["STOVE", "COOK_POT", "FUEL"\]\)/
  );
  assert.match(planChecklistSource, /getHeadlampPriority/);
  assert.match(planChecklistSource, /getGlovesPriority/);
  assert.doesNotMatch(planChecklistSource, /shouldShowGpsDevice/);
  assert.match(planChecklistSource, /label: "保険証"/);
  assert.match(planChecklistSource, /priority: "ESSENTIAL"/);
  assert.match(dashboardPlanChecklistSummarySource, /getCheckedSlotsStorageKey/);
  assert.match(dashboardPlanChecklistSummarySource, /applyChecklistStateToChecklist/);
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
  assert.match(tripPlanningUiSource, /const \[checklistOnlyIds, setChecklistOnlyIds\]/);
  assert.match(tripPlanningUiSource, /type="checkbox"/);
  assert.match(tripPlanningUiSource, /handleToggleChecklistItem/);
  assert.match(tripPlanningUiSource, /handleToggleGearBackedItem/);
  assert.match(tripPlanningUiSource, /handleToggleChecklistOnlyItem/);
  assert.match(tripPlanningUiSource, /onProgressChange/);
  assert.match(planChecklistSource, /priorityWeights/);
  assert.match(planChecklistSource, /ESSENTIAL: 5/);
  assert.match(planChecklistSource, /SUGGESTED: 3/);
  assert.match(planChecklistSource, /OPTIONAL: 1/);
  assert.match(planChecklistSource, /source: ChecklistItemSource/);
  assert.match(planChecklistSource, /GEAR_BACKED/);
  assert.match(planChecklistSource, /CHECKLIST_ONLY/);
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
  assert.match(tripPlanningFormSource, /useTransition/);
  assert.match(tripPlanningFormSource, /onSubmit=\{handleSubmit\}/);
  assert.match(tripPlanningFormSource, /router\.push/);
  assert.doesNotMatch(tripPlanningFormSource, /action="\/plan"/);
  assert.match(tripPlanningFormSource, /name="id" value=\{planId\}/);
  assert.match(tripPlanningFormSource, /type="search"/);
  assert.match(tripPlanningFormSource, /山名・地域・ローマ字で検索/);
  assert.match(tripPlanningFormSource, /日本百名山（標高順）/);
  assert.match(tripPlanningFormSource, /二百名山（百名山以外・標高順）/);
  assert.match(tripPlanningFormSource, /label: "エリア"/);
  assert.match(tripPlanningFormSource, /エリア別/);
  assert.match(tripPlanningFormSource, /getMountainAreaOptions/);
  assert.match(tripPlanningFormSource, /mountainAreaLabels/);
  assert.match(tripPlanningFormSource, /primary_region/);
  assert.match(tripPlanningFormSource, /登録山岳（標高順）/);
  assert.match(tripPlanningFormSource, /MountainListBadge/);
  assert.match(tripPlanningFormSource, /meizan_list/);
  assert.match(tripPlanningFormSource, /JAPAN_NIHYAKUMEIZAN_EXTRA/);
  assert.match(tripPlanningFormSource, /getOfficialMeizanMountains/);
  assert.match(tripPlanningFormSource, /const selectableMountains/);
  assert.match(tripPlanningFormSource, /getMountainListCounts\(selectableMountains\)/);
  assert.match(tripPlanningFormSource, /getMountainAreaOptions\(selectableMountains\)/);
  assert.match(tripPlanningFormSource, /getFilteredMountains/);
  assert.doesNotMatch(tripPlanningFormSource, /<select\s+name="mountain"/);
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
  assert.match(tripPlanningUiSource, /name="checked_slots"/);
  assert.match(tripPlanningUiSource, /JSON\.stringify\(checkedSlots\)/);
  assert.match(tripPlanningUiSource, /writeStoredCheckedSlots/);
  assert.match(tripPlanningUiSource, /readStoredCheckedSlots/);
  assert.match(tripPlanningUiSource, /writeStoredChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /readStoredChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /initialCheckedSlots/);
  assert.match(planActionsSource, /mountain_name: mountainName/);
  assert.match(planActionsSource, /season,/);
  assert.match(planActionsSource, /style,/);
  assert.match(planActionsSource, /progress/);
  assert.match(planActionsSource, /checked_slots: checkedSlots/);
  assert.match(planActionsSource, /planned_date: plannedDate/);
  assert.match(planActionsSource, /trip_memo: tripMemo/);
  assert.match(planActionsSource, /bring_cash: bringCash/);
  assert.match(planActionsSource, /has_mountain_insurance: hasMountainInsurance/);
  assert.match(planActionsSource, /parseCheckedSlots/);
  assert.match(planActionsSource, /withoutOptionalPlanColumns/);
  assert.match(planActionsSource, /export async function updateTripPlan/);
  assert.match(planActionsSource, /\.update\(payload\)/);
  assert.match(tripPlansDataSource, /from\("trip_plans"\)/);
  assert.match(tripPlansMigrationSource, /create table if not exists public\.trip_plans/);
  assert.match(tripPlansMigrationSource, /image_url text/);
  assert.match(tripPlansMigrationSource, /progress integer not null default 0/);
  assert.match(tripPlansProgressMigrationSource, /add column if not exists progress integer not null default 0/);
  assert.match(tripPlansProgressMigrationSource, /trip_plans_update_own/);
  assert.match(tripPlansCheckedSlotsMigrationSource, /add column if not exists checked_slots text\[\]/);
  assert.match(tripPlansCheckedSlotsMigrationSource, /SLEEP_INSULATION/);
  assert.match(tripPlansDetailsMigrationSource, /add column if not exists planned_date date/);
  assert.match(tripPlansDetailsMigrationSource, /add column if not exists trip_memo text/);
  assert.match(tripPlansDetailsMigrationSource, /add column if not exists bring_cash boolean/);
  assert.match(tripPlansDetailsMigrationSource, /add column if not exists has_mountain_insurance boolean/);
});

test("trip planning form captures date, memo, cash, and insurance without touching the engine", () => {
  assert.match(tripPlanningFormSource, /name="date"/);
  assert.match(tripPlanningFormSource, /予定日/);
  assert.match(tripPlanningFormSource, /type="date"/);
  assert.match(tripPlanningFormSource, /name="memo"/);
  assert.match(tripPlanningFormSource, /集合時間、登山口、同行者など/);
  assert.match(tripPlanningFormSource, /現金を持参/);
  assert.match(tripPlanningFormSource, /山岳保険に加入済み/);
  assert.match(tripPlanningUiSource, /name="planned_date"/);
  assert.match(tripPlanningUiSource, /name="trip_memo"/);
  assert.match(tripPlanningUiSource, /name="bring_cash"/);
  assert.match(tripPlanningUiSource, /name="has_mountain_insurance"/);
  assert.doesNotMatch(planChecklistSource, /山岳保険に加入済み/);
  assert.doesNotMatch(planChecklistSource, /現金を持参/);
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
