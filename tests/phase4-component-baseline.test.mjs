import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readSource("app/(app)/dashboard/page.tsx");
const appLoadingSource = readSource("app/(app)/loading.tsx");
const gearPageSource = readSource("app/(app)/gear/page.tsx");
const gearListSource = readSource("src/components/gear-list.tsx");
const gearFormSource = readSource("src/components/gear-form.tsx");
const tripPlanningUiSource = readSource("src/components/trip-planning-ui.tsx");
const tripPlanningFormSource = readSource("src/components/trip-planning-form.tsx");
const planChecklistSource = readSource("src/lib/plan-checklist.ts");
const authFormSource = readSource("src/components/auth-form.tsx");
const recommendationHistoryListSource = readSource(
  "src/components/recommendation-history-list.tsx"
);

function readSource(relativePath) {
  return readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8");
}

function lineCount(source) {
  return source.split("\n").length;
}

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

test("dashboard component baseline keeps the current hero, checklist, and gear sections", () => {
  for (const componentName of [
    "HomePageContent",
    "HeroCard",
    "HeroGaugeSkeleton",
    "EmptyTripHero",
    "GearSummaryCard",
    "RecentGearSection",
    "GearComposition"
  ]) {
    assert.match(dashboardSource, new RegExp(`function ${componentName}\\b`));
  }

  assert.match(dashboardSource, /Suspense fallback=\{<HeroGaugeSkeleton/);
  assert.match(dashboardSource, /<HeroGauge/);

  for (const copy of [
    "次回の山行",
    "出発前確認へ",
    "まだ計画はありません",
    "装備チェックを始めましょう",
    "マイ装備",
    "所有装備数",
    "装備構成",
    "まだ装備がありません",
    "装備を追加する"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }

  assert.match(appLoadingSource, /AppLoadingFallback/);
  assert.match(appLoadingSource, /animate-spin/);
});

test("gear list component baseline keeps filters, badges, cards, and feedback states", () => {
  for (const componentName of [
    "GearList",
    "GearCard",
    "InventoryStat",
    "FilterLabel",
    "FilterChip",
    "StatusChip"
  ]) {
    assert.match(gearListSource, new RegExp(`function ${componentName}\\b|export function ${componentName}\\b`));
  }

  for (const copy of [
    "装備名・ブランドで検索",
    "検索",
    "所有アイテム",
    "主要カテゴリー",
    "未登録:",
    "所有",
    "欲しい",
    "まだ装備がありません",
    "装備を追加",
    "装備庫"
  ]) {
    assert.match(gearListSource, new RegExp(copy));
  }

  assert.match(gearListSource, /statusLabels\[item\.status\]/);
  assert.match(gearListSource, /buildGearHref/);
  assert.match(gearPageSource, /params\.error/);
  assert.match(gearPageSource, /装備を登録しました/);
  assert.match(gearPageSource, /装備を更新しました/);
  assert.match(gearPageSource, /装備を削除しました/);
});

test("gear form component baseline keeps product picker, manual entry, image upload, and submit states", () => {
  for (const componentName of [
    "GearForm",
    "GearSubmitButton",
    "ProductFilterChip",
    "ProductResultCard",
    "SelectedProductConfirmCard",
    "ProductImageFallback"
  ]) {
    assert.match(gearFormSource, new RegExp(`function ${componentName}\\b|export function ${componentName}\\b`));
  }

  for (const copy of [
    "製品名・ブランド・型番で検索",
    "該当する製品はありません",
    "製品名",
    "装備写真",
    "写真を追加",
    "画像をアップロード中",
    "写真を削除",
    "キャンセル",
    "この装備を登録",
    "保存中...",
    "保存しました",
    "保存できませんでした",
    "画像をアップロードできませんでした"
  ]) {
    assert.match(gearFormSource, new RegExp(copy));
  }

  assert.match(gearFormSource, /startManualEntry/);
  assert.match(gearFormSource, /handleImageFile/);
  assert.match(gearFormSource, /imageUploadStatus/);
  assert.match(gearFormSource, /submitStatus/);
});

test("trip planning ui component baseline keeps save, checklist, history, and checklist-only boundaries", () => {
  for (const componentName of [
    "TripPlanningUI",
    "SavePlanButton",
    "PlanHistorySection",
    "SavedPlanFullChecklistView",
    "ChecklistScanControls",
    "NotNeededItemsSection",
    "AllItemsChecklistLink",
    "PlanningNotes"
  ]) {
    assert.match(
      tripPlanningUiSource,
      new RegExp(`function ${componentName}\\b|export function ${componentName}\\b`)
    );
  }

  for (const copy of [
    "計画を保存",
    "変更を更新",
    "保存中...",
    "保存しました",
    "保存済みプラン",
    "計画履歴",
    "まだ保存された計画はありません。",
    "装備チェックリスト",
    "すべての持ち物を確認",
    "今回の持ち物と確認状態を一覧で見ます",
    "出発前チェック",
    "持ち物チェック表",
    "山支度の持ち物チェック表"
  ]) {
    assert.match(tripPlanningUiSource, new RegExp(copy));
  }

  assert.match(tripPlanningUiSource, /readTripPlanCheckedSlots/);
  assert.match(tripPlanningUiSource, /writeTripPlanCheckedSlots/);
  assert.match(tripPlanningUiSource, /readTripPlanChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /writeTripPlanChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /checkedChecklistOnlyIds: checklistOnlyIds/);
});

test("phase 4 records current repeated ui patterns before extracting shared primitives", () => {
  const uiSources = [
    dashboardSource,
    gearListSource,
    gearFormSource,
    tripPlanningUiSource,
    tripPlanningFormSource,
    authFormSource,
    recommendationHistoryListSource
  ].join("\n");

  assert.ok(countMatches(uiSources, /rounded-(?:lg|xl|2xl|\[\d+px\])/g) > 40);
  assert.ok(countMatches(uiSources, /bg-white/g) > 30);
  assert.ok(countMatches(uiSources, /shadow-(?:sm|soft|\[)/g) > 15);
  assert.ok(countMatches(uiSources, /bg-red-50/g) >= 4);
  assert.ok(countMatches(uiSources, /bg-forest-50/g) >= 8);
  assert.ok(countMatches(uiSources, /disabled:opacity/g) >= 4);
  assert.ok(countMatches(uiSources, /statusLabels|StatusChip|ProductFilterChip|FilterChip/g) >= 5);

  for (const emptyStateCopy of [
    "まだ計画はありません",
    "まだ装備がありません",
    "該当する製品はありません",
    "過去の推薦履歴はまだありません"
  ]) {
    assert.match(uiSources, new RegExp(emptyStateCopy));
  }
});

test("phase 4 records high-risk files that should not be split before dedicated follow-up work", () => {
  assert.ok(lineCount(tripPlanningUiSource) > 2000);
  assert.ok(lineCount(gearFormSource) > 1500);
  assert.ok(lineCount(planChecklistSource) > 1200);

  assert.match(planChecklistSource, /export function buildPlanChecklist/);
  assert.match(planChecklistSource, /export function calculateChecklistProgress/);
  assert.match(planChecklistSource, /export function applyChecklistStateToChecklist/);
  assert.match(planChecklistSource, /export function getChecklistOnlyStorageKey/);
  assert.match(planChecklistSource, /export function getCheckedSlotsStorageKey/);
});
