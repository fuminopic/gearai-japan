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
const tripPlanLocalMetaSource = readFileSync(
  new URL("../src/lib/trip-plan-local-meta.ts", import.meta.url),
  "utf8"
);
const tripPlanStorageSource = readFileSync(
  new URL("../src/lib/trip-plan-storage.ts", import.meta.url),
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
const tripPlansDateRangeMigrationSource = readFileSync(
  new URL("../supabase/migrations/038_trip_plan_date_range.sql", import.meta.url),
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
const legacyRuleEngineSource = readFileSync(
  new URL("../src/lib/recommendations/rule-engine.ts", import.meta.url),
  "utf8"
);
const authFormSource = readFileSync(
  new URL("../src/components/auth-form.tsx", import.meta.url),
  "utf8"
);
const socialAuthButtonsSource = readFileSync(
  new URL("../src/components/social-auth-buttons.tsx", import.meta.url),
  "utf8"
);
const authActionsSource = readFileSync(
  new URL("../src/lib/actions/auth.ts", import.meta.url),
  "utf8"
);
const authCallbackSource = readFileSync(
  new URL("../app/auth/callback/route.ts", import.meta.url),
  "utf8"
);
const authMobileCallbackSource = readFileSync(
  new URL("../app/auth/mobile-callback/route.ts", import.meta.url),
  "utf8"
);
const authOAuthRouteSource = readFileSync(
  new URL("../app/auth/oauth/[provider]/route.ts", import.meta.url),
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
const mountainCurrentPlanStatusSource = readFileSync(
  new URL("../src/lib/mountain-current-plan-status.ts", import.meta.url),
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
  assert.match(
    planPageContentSource,
    /const \[mountainResult, currentPlanStatusResult, planHistory, savedPlans\] = await Promise\.all/
  );
  assert.match(planPageContentSource, /getRecommendationHistory\(\)/);
  assert.match(planPageContentSource, /getTripPlans\(\)/);
  assert.match(planPageContentSource, /getPackRequirementPlan\(\{/);
  assert.match(planPageContentSource, /plan = generatedPlan/);
  assert.match(planPageContentSource, /matchGearForRequirementSlot/);
});

test("mountain current status notice stays visible in generated plan results", () => {
  assert.match(planPageContentSource, /planStatusNotice=\{planStatusNotice\}/);
  assert.match(
    planPageContentSource,
    /!plan && planStatusNotice[\s\S]*<MountainCurrentPlanStatusNotice status=\{planStatusNotice\} \/>/
  );
  assert.match(tripPlanningUiSource, /planStatusNotice\?: MountainCurrentPlanStatus/);
  assert.match(
    tripPlanningUiSource,
    /<div ref=\{resultSectionRef\}[\s\S]*<MountainCurrentPlanStatusNotice status=\{planStatusNotice\} \/>[\s\S]*<TripPlanningResult/
  );
  assert.match(tripPlanningUiSource, /status\.status === "BLOCKED"[\s\S]*border-red-200[\s\S]*border-amber-200/);
});

test("trip planning blocks active restricted volcanoes before generating a plan", () => {
  assert.match(planPageContentSource, /resolveMountainPlanAccess/);
  assert.match(planPageContentSource, /getMountainPlanningBlockMessage/);
  assert.match(mountainCurrentPlanStatusSource, /restrictedVolcanoPlanningMessage/);
  assert.match(
    mountainCurrentPlanStatusSource,
    /この山は現在、火山活動または入山規制により通常の登山計画を作成できません。気象庁・自治体などの公式情報を確認してください。/
  );
  assert.match(
    mountainCurrentPlanStatusSource,
    /mountain\?\.volcanic_risk === "ACTIVE_RESTRICTED"/
  );
  assert.match(planPageContentSource, /planningBlockMessage/);
  assert.match(
    planPageContentSource,
    /if \(planningBlockMessage\) \{[\s\S]*error = planningBlockMessage;[\s\S]*\} else if \(!requestedPlanAccess\.isGenerationBlocked && shouldGeneratePlan && selectedMountain\)/
  );
  assert.match(planPageContentSource, /mountains=\{mountains\}/);
  assert.match(planPageContentSource, /getSelectedMountainSlug\(/);
  assert.match(
    planPageContentSource,
    /mountain\.slug === slug && !isPlanningBlockedMountain\(mountain, currentPlanStatuses\)/
  );
  assert.doesNotMatch(planPageContentSource, /plannableMountains/);
  assert.match(tripPlanningFormSource, /disabled=\{isBlockedMountain\}/);
  assert.match(tripPlanningFormSource, /aria-disabled=\{isBlockedMountain\}/);
  assert.match(tripPlanningFormSource, /getMountainListCounts\(selectableMountains\)/);
  assert.match(tripPlanningFormSource, /getMountainAreaOptions\(selectableMountains\)/);
  assert.doesNotMatch(planPageContentSource, /sakurajima/);
});

test("trip planning blocks non-standard route mountains without shrinking list counts", () => {
  assert.match(mountainCurrentPlanStatusSource, /nonStandardRoutePlanningMessage/);
  assert.match(
    mountainCurrentPlanStatusSource,
    /この山は通常の装備計画を作成する前に、登山道状況・入山可否・山行形態を公式情報で確認してください。/
  );
  assert.match(
    mountainCurrentPlanStatusSource,
    /mountain\?\.planning_status === "NOT_STANDARD_ROUTE"/
  );
  assert.match(
    planPageContentSource,
    /planningBlockMessage \? undefined : hydratedMountainParam/
  );
  assert.match(
    planPageContentSource,
    /if \(planningBlockMessage\) \{[\s\S]*error = planningBlockMessage;[\s\S]*\} else if \(!requestedPlanAccess\.isGenerationBlocked && shouldGeneratePlan && selectedMountain\)/
  );
  assert.match(
    tripPlanningFormSource,
    /mountain\?\.planning_status === "NOT_STANDARD_ROUTE"/
  );
  assert.match(tripPlanningFormSource, /disabled=\{isBlockedMountain\}/);
  assert.match(tripPlanningFormSource, /getMountainListCounts\(selectableMountains\)/);
  assert.doesNotMatch(`${planPageContentSource}\n${tripPlanningFormSource}`, /oizuru-gatake/);
});

test("app navigation responds immediately during dynamic route loading", () => {
  assert.match(appLayoutSource, /<Suspense fallback=\{<AppAuthLoading \/>/);
  assert.match(appLayoutSource, /function AppLayout/);
  assert.match(appLayoutSource, /async function AuthGate/);
  assert.match(appLoadingSource, /AppLoadingFallback/);
  assert.doesNotMatch(appLoadingSource, /animate-pulse/);
  assert.doesNotMatch(rootLoadingSource, /animate-pulse/);
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
  assert.match(
    tripPlanningFormSource,
    /router\.push\(`\/plan\?\$\{params\.toString\(\)\}` as Route, \{ scroll: false \}\)/
  );
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
    "未完了",
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
    "確認する",
    "不足",
    "臨行前スキャン",
    "すべての持ち物を確認",
    "今回不要なもの",
    "登山地図アプリ（YAMAP・ヤマレコ等）",
    "紙地図・コンパス",
    "このリストは山・季節・山行スタイルに基づく一般的な目安です",
    "当日の天気予報、具体的なルート状況、入山規制の最新情報は反映されません",
    "自治体・山小屋などの公式情報をご確認ください"
  ]) {
    assert.match(`${tripPlanningUiSource}\n${planChecklistSource}`, new RegExp(copy));
  }

  assert.doesNotMatch(tripPlanningUiSource, /Gear-backed/);
  assert.doesNotMatch(tripPlanningUiSource, /Checklist-only/);
  assert.doesNotMatch(planChecklistSource, /nav-smartphone/);
  assert.doesNotMatch(planChecklistSource, /label: "スマホ"/);
  assert.doesNotMatch(labelsSource, /GPS_DEVICE: "GPS デバイス"/);
  assert.doesNotMatch(planChecklistSource, /gpsDevice/);
  assert.doesNotMatch(tripPlanningUiSource, /未登録/);
  assert.match(tripPlanningUiSource, /buildPlanChecklist/);
  assert.match(tripPlanningUiSource, /calculateChecklistProgress\(/);
  assert.match(tripPlanningUiSource, /checklistItemIcons/);
  assert.match(tripPlanningUiSource, /type ChecklistItemIcon/);
  assert.match(tripPlanningUiSource, /matching_owned_gear/);
  assert.doesNotMatch(tripPlanningUiSource, /登録データ上の対応例/);
  assert.doesNotMatch(tripPlanningUiSource, /HeroReadinessCard/);
  assert.match(tripPlanningUiSource, /ChecklistCategoryCard/);
  assert.match(tripPlanningUiSource, /ChecklistItemRow/);
  assert.match(tripPlanningUiSource, /PlanHistorySection/);
  assert.match(tripPlanningUiSource, /SavePlanButton/);
  assert.match(tripPlanningUiSource, /item\.reason/);
  assert.match(tripPlanningUiSource, /カバーしています/);
  assert.match(tripPlanningUiSource, /分類が近いため候補にしています。出発前に用途を確認してください。/);
  assert.match(tripPlanningUiSource, /<details/);
  assert.match(tripPlanningUiSource, /<summary/);
  assert.doesNotMatch(`${tripPlanningUiSource}\n${planChecklistSource}`, /(^|[^重])要確認/);
  assert.doesNotMatch(tripPlanningUiSource, /装備庫との照合詳細/);
  assert.doesNotMatch(tripPlanningUiSource, /照合精度/);
  assert.doesNotMatch(tripPlanningUiSource, /判定の確かさ/);
  assert.doesNotMatch(tripPlanningUiSource, /登録装備との対応/);
  assert.doesNotMatch(tripPlanningUiSource, /必要システム/);
  assert.doesNotMatch(tripPlanningUiSource, /不足装備/);
  assert.doesNotMatch(tripPlanningUiSource, /対応装備/);
  assert.doesNotMatch(tripPlanningUiSource, /山行サマリー/);
});

test("pack planning checklist prioritizes readiness before gear-backed details", () => {
  const checklistIndex = tripPlanningUiSource.indexOf("装備チェックリスト");
  const scanIndex = tripPlanningUiSource.indexOf("臨行前スキャン");
  const notNeededIndex = tripPlanningUiSource.indexOf("今回不要なもの");

  assert.ok(checklistIndex > -1);
  assert.ok(scanIndex > checklistIndex);
  assert.ok(notNeededIndex > checklistIndex);
  assert.doesNotMatch(tripPlanningUiSource, /<HeroReadinessCard/);
  assert.doesNotMatch(tripPlanningUiSource, /<PreDepartureConfirmationPanel/);
  assert.doesNotMatch(tripPlanningUiSource, /登録装備との対応/);

  for (const copy of [
    "準備確認",
    "完成",
    "完了",
    "未完了"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /missingCount\.toLocaleString\("ja-JP"\)/);
});

test("M2 pre-departure confirmation reuses checklist-derived counts", () => {
  assert.match(planChecklistSource, /export function buildPreDepartureSummary/);
  assert.match(planChecklistSource, /getPreDepartureItemActionStatus/);
  assert.match(planChecklistSource, /isImportantPreDepartureItem/);
  assert.match(planChecklistSource, /NEEDS_ACTION/);
  assert.match(planChecklistSource, /ALMOST_READY/);
  assert.match(planChecklistSource, /CONFIRMED/);
  assert.match(planChecklistSource, /出発前確認が必要です/);
  assert.match(planChecklistSource, /準備はほぼ完了/);
  assert.match(planChecklistSource, /出発前確認済み/);
  assert.match(planChecklistSource, /missingItems\.length === 0/);
  assert.match(planChecklistSource, /importantConfirmationItems\.length === 0/);
  assert.match(planChecklistSource, /item\.source === "GEAR_BACKED" \? "MISSING" : "CONFIRM"/);

  assert.match(dashboardPageSource, /buildPlanChecklist/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /buildPreDepartureSummary/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /出発前確認/);
  assert.doesNotMatch(dashboardPlanChecklistSummarySource, /重要確認/);
  assert.match(dashboardPageSource, /`\/plan\?id=\$\{trip\.id\}`/);
  assert.doesNotMatch(dashboardPageSource, /focus=predeparture/);
  assert.match(dashboardPageSource, /出発前確認へ/);

  assert.doesNotMatch(tripPlanningUiSource, /PreDepartureConfirmationPanel/);
  assert.match(tripPlanningUiSource, /ChecklistScanControls/);
  assert.match(tripPlanningUiSource, /filterChecklistCategoriesForScan/);
  assert.match(tripPlanningUiSource, /SavedPlanDetailHeader/);
  assert.match(tripPlanningUiSource, /PlanResultSummaryHeader/);
  assert.match(tripPlanningUiSource, /!plan && !isSavedPlanMode && !isFullChecklistView/);
  assert.match(tripPlanningUiSource, /isSavedPlanMode/);
  assert.match(tripPlanningUiSource, /isFullChecklistView/);
  assert.match(tripPlanningUiSource, /SavedPlanFullChecklistView/);
  assert.match(tripPlanningUiSource, /formatPlanDateRange/);
  assert.match(tripPlanningUiSource, /SavedPlanDateRangeField/);
  assert.match(tripPlanningUiSource, /planned_end_date/);
  assert.match(tripPlanningUiSource, /normalizePlanEndDate/);
  assert.match(tripPlanningUiSource, /日付を選ぶと自動で保存されます。/);
  assert.match(tripPlanningUiSource, /計画条件を編集/);
  assert.match(tripPlanningUiSource, /臨行前スキャン/);
  assert.match(tripPlanningUiSource, /要対応/);
  assert.match(tripPlanningUiSource, /すべての持ち物を確認/);
  assert.match(tripPlanningUiSource, /view=checklist/);
  assert.match(tripPlanningUiSource, /持ち物チェック表/);
  assert.match(tripPlanningUiSource, /FullChecklistImageSaveButton/);
  assert.match(tripPlanningUiSource, /画像として保存/);
  assert.match(tripPlanningUiSource, /createChecklistImageBlob/);
  assert.match(tripPlanningUiSource, /navigator\.share/);
  assert.match(tripPlanningUiSource, /downloadChecklistImage/);
  assert.match(tripPlanningUiSource, /getFullChecklistCounts/);
  assert.match(tripPlanningUiSource, /確認する/);
  assert.match(tripPlanningUiSource, /予定日未設定/);
  assert.doesNotMatch(tripPlanningUiSource, /件を確認/);
  assert.doesNotMatch(tripPlanningUiSource, /出発前の最終確認/);
  assert.doesNotMatch(tripPlanningUiSource, /登録装備との対応/);
  assert.doesNotMatch(tripPlanningUiSource, /ChecklistSheetModal/);
  assert.doesNotMatch(tripPlanningUiSource, /すべての持ち物と確認状態を見られます/);
  assert.doesNotMatch(tripPlanningUiSource, /チェック表を見る/);
  assert.doesNotMatch(tripPlanningUiSource, /購入する/);
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
  assert.match(dashboardPlanChecklistSummarySource, /readTripPlanCheckedSlots/);
  assert.match(dashboardPlanChecklistSummarySource, /applyChecklistStateToChecklist/);
});

test("pack planning UI deduplicates merged slot labels and supports checklist progress", () => {
  assert.match(labelsSource, /WATER_STORAGE: "水（飲料水・容器・浄水）"/);
  assert.match(labelsSource, /WATER_TREATMENT: "水（飲料水・容器・浄水）"/);
  assert.match(labelsSource, /RAIN_JACKET: "雨具（レインギア）"/);
  assert.match(labelsSource, /RAIN_PANTS: "雨具（レインギア）"/);
  assert.match(labelsSource, /GPS_DEVICE: "専用GPS端末（必要に応じて）"/);

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

test("plan page keeps confirmed checklist items visible in a 確認済み group", () => {
  // 1) 確認した項目は消えず、確認済みグループのローとして描画される
  assert.match(tripPlanningUiSource, /function ConfirmedChecklistItemRow/);
  assert.match(tripPlanningUiSource, /<ConfirmedChecklistItemRow/);

  // 2) 各カテゴリーカードに確認済み項目を渡す prop があり、確認済み見出しが出る
  assert.match(tripPlanningUiSource, /confirmedItems\?: ChecklistItem\[\]/);
  assert.match(
    tripPlanningUiSource,
    /確認済み \{confirmedItems\.length\.toLocaleString\("ja-JP"\)\}/
  );

  // 3) 「要対応」ビューでのみ確認済みグループを作り、確認済みは item.checked から導く
  assert.match(tripPlanningUiSource, /const planCategoryCards/);
  assert.match(tripPlanningUiSource, /scanFilter === "ACTION"/);
  assert.match(tripPlanningUiSource, /\.items\.filter\(\s*\n?\s*\(item\) => item\.checked/);
  assert.match(
    tripPlanningUiSource,
    /planCategoryCards\.map\(\(\{ category, confirmedItems \}\)/
  );

  // 4) 確認済みローは同じ onToggle を使う＝再タップで確認を取り消して未確認へ戻せる
  const confirmedRow = tripPlanningUiSource.slice(
    tripPlanningUiSource.indexOf("function ConfirmedChecklistItemRow")
  );
  assert.match(confirmedRow, /checked=\{item\.checked\}/);
  assert.match(confirmedRow, /onChange=\{\(\) => onToggle\(item\)\}/);
  // 確認済みは弱めた（浅いグレー）表示
  assert.match(confirmedRow, /bg-stone-50/);
  assert.match(confirmedRow, /text-stone-400/);

  // 5) 「今回不要なもの」は別セクションのまま（確認済みと混在しない）
  assert.match(tripPlanningUiSource, /function NotNeededItemsSection/);
  assert.match(tripPlanningUiSource, /今回不要なもの/);
  assert.ok(
    tripPlanningUiSource.indexOf("今回不要なもの") !==
      tripPlanningUiSource.indexOf("確認済み")
  );

  // 6) 表示のみの変更：生成/マッチャ/保存の入口は従来どおり温存
  assert.match(tripPlanningUiSource, /buildPlanChecklist/);
  assert.match(tripPlanningUiSource, /filterChecklistCategoriesForScan/);
  assert.match(tripPlanningUiSource, /handleToggleChecklistItem/);
  // 進捗率ロジックは据え置き（summary.percent をそのまま利用）
  assert.match(tripPlanningUiSource, /checklist\.summary\.percent/);
});

test("missing gear-backed checklist items support quick owned-gear entry without clearing confirmations", () => {
  const quickAddOwnedGearSource = readFileSync(
    "src/components/checklist-quick-add-owned-gear.tsx",
    "utf8"
  );

  assert.match(tripPlanningUiSource, /ChecklistQuickAddOwnedGear/);
  assert.match(
    tripPlanningUiSource,
    /item\.source === "GEAR_BACKED" && item\.toggleSlots\.length > 0 && !item\.checked/
  );
  assert.match(quickAddOwnedGearSource, /matching_database_gear/);
  assert.match(quickAddOwnedGearSource, /getGearCompatibilityRule\(requirementSlots\[0\]\)/);
  assert.match(quickAddOwnedGearSource, /formData\.set\("status", "owned"\)/);
  assert.match(quickAddOwnedGearSource, /await createGear\(formData\)/);
  assert.match(quickAddOwnedGearSource, /router\.refresh\(\)/);
  assert.match(quickAddOwnedGearSource, /submissionInFlightRef/);
  assert.match(quickAddOwnedGearSource, /if \(!result\.ok\)/);
  assert.match(quickAddOwnedGearSource, /if \(!didSave\)/);
  assert.match(quickAddOwnedGearSource, /setIsOpen\(false\);\s*router\.refresh\(\)/);

  const checkedSlotFilter = tripPlanningUiSource.slice(
    tripPlanningUiSource.indexOf("function filterCheckedSlotsForPlan"),
    tripPlanningUiSource.indexOf("function uniqueRequirementSlots")
  );
  assert.match(checkedSlotFilter, /return uniqueRequirementSlots\(checkedSlots\);/);
  assert.doesNotMatch(checkedSlotFilter, /coverage_status/);
});

test("trip planning UI avoids recommendation and shopping language", () => {
  for (const source of [aiPageSource, tripPlanningUiSource, tripPlanningFormSource]) {
    assert.doesNotMatch(source, /推薦|購入|予算|価格|買う|wishlist/i);
    assert.doesNotMatch(source, /\b(recommend|shopping|upgrade|best|price)\b/i);
  }
});

test("legacy recommendation copy stays Japanese-only", () => {
  assert.match(legacyRuleEngineSource, /推定追加費用/);
  assert.doesNotMatch(legacyRuleEngineSource, /预计|金额|预算|购买|一键|删除/);
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
  assert.match(
    planPageContentSource,
    /getSelectedMountain\(\s*selectedMountainSlug,\s*mountains,\s*currentPlanStatuses\s*\)/
  );
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
  assert.match(tripPlanningUiSource, /削除/);
  assert.match(tripPlanningUiSource, /すべて削除/);
  assert.match(tripPlanningUiSource, /window\.confirm/);
  assert.doesNotMatch(tripPlanningUiSource, /Delete/);
  assert.doesNotMatch(tripPlanningUiSource, /一键删除/);
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
  assert.match(tripPlanningUiSource, /計画を保存/);
  assert.match(tripPlanningUiSource, /変更を更新/);
  assert.match(tripPlanningUiSource, /ホームの次回山行カードに反映/);
  assert.doesNotMatch(tripPlanningUiSource, /fixed bottom-24/);
  assert.match(tripPlanningUiSource, /name="progress" value=\{progress\}/);
  assert.match(tripPlanningUiSource, /name="checked_slots"/);
  assert.match(tripPlanningUiSource, /JSON\.stringify\(checkedSlots\)/);
  assert.match(tripPlanningUiSource, /writeStoredCheckedSlots/);
  assert.match(tripPlanningUiSource, /readStoredCheckedSlots/);
  assert.match(tripPlanningUiSource, /writeStoredChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /readStoredChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /writeTripPlanLocalMeta/);
  assert.match(tripPlanningUiSource, /plannedDate,/);
  assert.match(tripPlanningUiSource, /tripMemo/);
  assert.match(tripPlanLocalMetaSource, /readTripPlanMeta/);
  assert.match(tripPlanStorageSource, /yamajitaku:trip-plan-meta/);
  assert.match(tripPlanningUiSource, /initialCheckedSlots/);
  assert.match(planActionsSource, /mountain_name: mountainName/);
  assert.match(planActionsSource, /season,/);
  assert.match(planActionsSource, /style,/);
  assert.match(planActionsSource, /progress/);
  assert.match(planActionsSource, /checked_slots: checkedSlots/);
  assert.match(planActionsSource, /planned_date: plannedDate/);
  assert.match(planActionsSource, /planned_end_date: plannedEndDate/);
  assert.match(planActionsSource, /normalizePlannedEndDate/);
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
  assert.match(tripPlansDateRangeMigrationSource, /add column if not exists planned_end_date date/);
});

test("trip planning form captures date and memo while moving insurance out of the plan flow", () => {
  assert.match(tripPlanningFormSource, /startName="date"/);
  assert.match(tripPlanningFormSource, /予定日/);
  assert.match(tripPlanningFormSource, /type="date"/);
  assert.match(tripPlanningFormSource, /name="memo"/);
  assert.match(tripPlanningFormSource, /集合時間、登山口、同行者など/);
  assert.match(tripPlanningFormSource, /grid grid-cols-3/);
  assert.match(tripPlanningFormSource, /getTodayDateValue/);
  assert.match(tripPlanningFormSource, /formatDateDisplay/);
  assert.match(tripPlanningFormSource, /h-\[42px\]/);
  assert.match(tripPlanningFormSource, /ChevronsUpDown/);
  assert.match(tripPlanningFormSource, /DateRangeField/);
  assert.match(tripPlanningFormSource, /endName="end_date"/);
  assert.match(tripPlanningFormSource, /予定期間/);
  assert.match(tripPlanningFormSource, /開始日/);
  assert.match(tripPlanningFormSource, /終了日/);
  assert.doesNotMatch(tripPlanningFormSource, /出発日/);
  assert.doesNotMatch(tripPlanningFormSource, /帰着日/);
  assert.match(tripPlanningFormSource, /normalizeEndDateValue/);
  assert.doesNotMatch(tripPlanningFormSource, /山行オプション/);
  assert.doesNotMatch(tripPlanningFormSource, /現金を持参/);
  assert.doesNotMatch(tripPlanningFormSource, /山岳保険に加入済み/);
  assert.doesNotMatch(tripPlanningFormSource, /name="cash"/);
  assert.doesNotMatch(tripPlanningFormSource, /name="insurance"/);
  assert.match(tripPlanningUiSource, /name="planned_date"/);
  assert.match(tripPlanningUiSource, /name="planned_end_date"/);
  assert.match(tripPlanningUiSource, /name="trip_memo"/);
  assert.match(tripPlanningUiSource, /name="bring_cash"/);
  assert.match(tripPlanningUiSource, /name="has_mountain_insurance"/);
  assert.match(tripPlanningFormSource, /focus", "checklist"/);
  assert.match(tripPlanningFormSource, /scroll: false/);
  assert.match(tripPlanningUiSource, /resultSectionRef/);
  assert.match(tripPlanningUiSource, /scrollIntoView/);
  assert.doesNotMatch(planChecklistSource, /山岳保険に加入済み/);
  assert.doesNotMatch(planChecklistSource, /現金を持参/);
});

test("mountain picker starts from Japan Hyakumeizan and avoids a nested scroll trap", () => {
  assert.match(tripPlanningFormSource, /useState<MountainListFilter>\("HYAKUMEIZAN"\)/);
  assert.match(tripPlanningFormSource, /useState\(3\)/);
  assert.match(tripPlanningFormSource, /もっと表示/);
  assert.match(tripPlanningFormSource, /閉じる/);
  assert.match(tripPlanningFormSource, /setVisibleMountainCount\(\(count\) => count \+ 20\)/);
  assert.match(tripPlanningFormSource, /setVisibleMountainCount\(3\)/);
  assert.match(tripPlanningFormSource, /overflow-x-auto/);
  assert.match(tripPlanningFormSource, /次の山行、どこにする？/);
  assert.match(tripPlanningFormSource, /text-\[18px\]/);
  assert.match(tripPlanningFormSource, /<Check className=/);
  assert.doesNotMatch(tripPlanningFormSource, /ChevronRight/);
  assert.doesNotMatch(tripPlanningFormSource, /選択中/);
  assert.doesNotMatch(tripPlanningUiSource, /山行計画/);
  assert.doesNotMatch(tripPlanningUiSource, /パック計画/);
  assert.doesNotMatch(tripPlanningFormSource, /max-h-72/);
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
  assert.doesNotMatch(dashboardPageSource, /focus=predeparture/);
});

test("user-facing branding uses YAMAJITAKU hierarchy", () => {
  for (const source of [
    rootLayoutSource,
    authFormSource,
    appLogoSource
  ]) {
    assert.match(source, /山支度/);
    assert.match(source, /YAMAJITAKU/);
    assert.doesNotMatch(source, /GearAI/);
  }

  assert.match(appNavSource, /AppLogo/);
  assert.match(dashboardPageSource, /yamajitaku-wordmark-white\.png/);
  assert.match(dashboardPageSource, /alt="山支度 YAMAJITAKU"/);
  assert.match(appLogoSource, /\/yamajitaku-logo\.png/);
  assert.match(rootLayoutSource, /openGraph/);
  assert.match(rootLayoutSource, /siteName: "山支度"/);
  assert.match(authFormSource, /山へ行く前の/);
  assert.match(authFormSource, /不安をなくす。/);
  assert.match(authFormSource, /登山準備を、/);
  assert.match(authFormSource, /もっとシンプルに。/);
  assert.match(authFormSource, /auth-mountain-bg\.png/);
  assert.match(authFormSource, /auth-logo-white-cropped\.png/);
  assert.match(authFormSource, /showEmailForm/);
  assert.match(authFormSource, /\/login\?email=1/);
  assert.match(authFormSource, /\/signup\?email=1/);
  assert.doesNotMatch(authFormSource, /#email/);
  assert.doesNotMatch(authFormSource, /MVP/);
  assert.doesNotMatch(authFormSource, /10秒で/);
});

test("auth form shows submit progress for login and signup", () => {
  assert.match(authFormSource, /ログイン中\.\.\./);
  assert.match(authFormSource, /作成中\.\.\./);
});

test("auth landing social buttons start Supabase OAuth", () => {
  assert.match(authActionsSource, /signInWithGoogle/);
  assert.match(authActionsSource, /signInWithApple/);
  assert.match(authActionsSource, /signInWithOAuth/);
  assert.match(authActionsSource, /skipBrowserRedirect:\s*true/);
  assert.match(authActionsSource, /prompt:\s*"select_account"/);
  assert.match(authActionsSource, /provider: "google" \| "apple"/);
  assert.match(authActionsSource, /callbackUrl\.searchParams\.set\("next", "\/dashboard"\)/);
  assert.match(authActionsSource, /\/auth\/mobile-callback/);
  assert.match(authActionsSource, /YamajitakuApp/);
  assert.match(authCallbackSource, /exchangeCodeForSession/);
  assert.match(authCallbackSource, /getSafeNextPath/);
  assert.match(authOAuthRouteSource, /getOAuthSignInUrl/);
  assert.match(authOAuthRouteSource, /NextResponse\.redirect\(signInUrl\)/);
  assert.match(authMobileCallbackSource, /yamajitaku:\/\/auth\/callback/);
  assert.match(authMobileCallbackSource, /exchangeCodeForSession/);
  assert.match(authMobileCallbackSource, /access_token/);
  assert.match(authMobileCallbackSource, /refresh_token/);
  assert.match(authMobileCallbackSource, /window\.location\.replace/);
  assert.match(socialAuthButtonsSource, /Browser\.close\(\)\.catch/);
  assert.match(socialAuthButtonsSource, /setPendingProvider\(null\)/);
  assert.match(socialAuthButtonsSource, /openOAuth\("apple", appleHref\)/);
  assert.match(socialAuthButtonsSource, /openOAuth\("google", googleHref\)/);
  assert.doesNotMatch(authFormSource, /action=\{appleAction\}/);
  assert.doesNotMatch(authFormSource, /action=\{googleAction\}/);
  assert.match(authFormSource, /app=ios/);
  assert.doesNotMatch(authFormSource, /Appleで続ける[\s\S]{0,120}type="button"/);
  assert.doesNotMatch(authFormSource, /Googleで続ける[\s\S]{0,120}type="button"/);
});

test("email login guides OAuth-created accounts back to social login", () => {
  assert.match(authActionsSource, /getLoginErrorMessage/);
  assert.match(authActionsSource, /Invalid login credentials/i);
  assert.match(authActionsSource, /Google \/ Appleで登録した場合は/);
  assert.match(authFormSource, /Google \/ Appleで登録した方は/);
  assert.match(authFormSource, /Googleアカウントのパスワードはここでは使用できません/);
  assert.match(socialAuthButtonsSource, /function SocialAuthButtons/);
  assert.match(authFormSource, /variant="light"/);
  assert.match(authFormSource, /variant="dark"/);
});
