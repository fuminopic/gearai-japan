import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const dashboardSource = readSource("app/(app)/dashboard/page.tsx");
const rootLoadingSource = readSource("app/loading.tsx");
const appLoadingSource = readSource("app/(app)/loading.tsx");
const helpPageSource = readSource("app/(app)/help/page.tsx");
const aiHistoryPageSource = readSource("app/(app)/ai/history/page.tsx");
const gearPageSource = readSource("app/(app)/gear/page.tsx");
const gearListSource = readSource("src/components/gear-list.tsx");
const gearFormSource = readSource("src/components/gear-form.tsx");
const statCardSource = readSource("src/components/stat-card.tsx");
const tripPlanningUiSource = readSource("src/components/trip-planning-ui.tsx");
const tripPlanningFormSource = readSource("src/components/trip-planning-form.tsx");
const planChecklistSource = readSource("src/lib/plan-checklist.ts");
const authFormSource = readSource("src/components/auth-form.tsx");
const recommendationHistoryListSource = readSource(
  "src/components/recommendation-history-list.tsx"
);
const recommendationDetailSource = readSource("src/components/recommendation-detail.tsx");
const recommendationDeleteControlsSource = readSource(
  "src/components/recommendation-delete-controls.tsx"
);
const uiButtonSource = readSource("src/components/ui/button.tsx");
const uiCardSource = readSource("src/components/ui/card.tsx");
const uiNoticeSource = readSource("src/components/ui/notice.tsx");
const uiEmptyStateSource = readSource("src/components/ui/empty-state.tsx");
const uiLoadingBlockSource = readSource("src/components/ui/loading-block.tsx");
const uiBadgeSource = readSource("src/components/ui/badge.tsx");
const uiIndexSource = readSource("src/components/ui/index.ts");

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
    "OwnedGearSection",
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
    "マイギア",
    "マイギア",
    "マイパック",
    "パック重量構成",
    "まだギアがありません",
    "ギアを追加する"
  ]) {
    assert.match(dashboardSource, new RegExp(copy));
  }

  // AppLoadingFallback(中央のスピナー)は誰からも参照されなくなったので削除。
  // 二次画面もヘッダー型の骨組みを描く。
  assert.doesNotMatch(appLoadingSource, /AppLoadingFallback/);
  assert.match(appLoadingSource, /SecondaryPageSkeleton/);
  // LoadingBlock 自体は残す(ルート直下と認証待ちの起動時に使う)。
  assert.match(rootLoadingSource, /LoadingBlock/);
  assert.match(uiLoadingBlockSource, /animate-spin/);
});

test("shared ui primitives exist and keep className passthrough", () => {
  const primitiveSources = [
    ["Button", uiButtonSource],
    ["Card", uiCardSource],
    ["Notice", uiNoticeSource],
    ["EmptyState", uiEmptyStateSource],
    ["LoadingBlock", uiLoadingBlockSource],
    ["Badge", uiBadgeSource]
  ];

  for (const [componentName, source] of primitiveSources) {
    assert.match(source, new RegExp(`export function ${componentName}\\b`));
    assert.match(source, /\bclassName\b/);
    assert.match(source, /\bcn\(/);
  }

  assert.match(uiButtonSource, /ComponentPropsWithoutRef<"button">/);
  assert.match(uiCardSource, /ComponentPropsWithoutRef<"section">/);
  assert.match(uiNoticeSource, /ComponentPropsWithoutRef<"p">/);
  assert.match(uiEmptyStateSource, /title: ReactNode/);
  assert.match(uiLoadingBlockSource, /spinnerClassName/);
  assert.match(uiBadgeSource, /ComponentPropsWithoutRef<"span">/);

  for (const exportName of ["Badge", "Button", "Card", "EmptyState", "LoadingBlock", "Notice"]) {
    assert.match(uiIndexSource, new RegExp(`export \\{ ${exportName} \\}`));
  }
});

test("shared ui primitives are tried only in low-risk static components", () => {
  assert.match(statCardSource, /import \{ Card \} from "@\/components\/ui\/card"/);
  assert.match(statCardSource, /<Card className="p-5">/);
  assert.match(statCardSource, /text-sm font-medium text-stone-500/);
  assert.match(statCardSource, /text-3xl font-semibold tracking-normal text-ink/);
  assert.match(statCardSource, /rounded-lg bg-forest-50 p-3 text-forest-700/);

  // (app) の loading はスピナーをやめて、行き先と同じ形の骨組みを描く。
  // ルート直下の loading は起動時なので LoadingBlock のまま。
  assert.doesNotMatch(appLoadingSource, /LoadingBlock/);
  assert.match(appLoadingSource, /SecondaryPageSkeleton/);
  assert.match(appLoadingSource, /BrandShellSkeleton/);
  assert.match(rootLoadingSource, /import \{ LoadingBlock \} from "@\/components\/ui\/loading-block"/);
  assert.match(rootLoadingSource, /<LoadingBlock/);
  assert.match(rootLoadingSource, /aria-hidden="true"/);
  assert.match(rootLoadingSource, /className="flex min-h-\[100dvh\] items-center justify-center bg-\[#FAFAF8\]"/);
  assert.match(rootLoadingSource, /spinnerClassName="h-7 w-7 animate-spin rounded-full border-2/);
  assert.match(uiLoadingBlockSource, /flex min-h-\[100dvh\] items-center justify-center bg-\[#FAFAF8\]/);
  assert.match(uiLoadingBlockSource, /h-7 w-7 animate-spin rounded-full border-2/);

  assert.match(helpPageSource, /import \{ Card \} from "@\/components\/ui\/card"/);
  assert.match(helpPageSource, /<Card className="rounded-\[24px\] p-6 shadow-sm">/);
  assert.match(helpPageSource, /サポート/);
  assert.match(helpPageSource, /ヘルプ/);
  assert.match(helpPageSource, /山支度は、山行計画に合わせて装備の準備状況を確認するためのアプリです。/);
  assert.match(helpPageSource, /山・季節・スタイルを選んで計画を作成し、装備チェックリストで準備状況を確認してください。/);

  assert.match(aiHistoryPageSource, /import \{ Notice \} from "@\/components\/ui\/notice"/);
  assert.match(aiHistoryPageSource, /<Notice tone="error" className="border border-red-100">/);
  assert.match(aiHistoryPageSource, /過去の記録/);
  assert.match(aiHistoryPageSource, /過去の推薦履歴/);
  assert.match(aiHistoryPageSource, /href="\/plan"/);
  assert.match(aiHistoryPageSource, /山行計画を作成/);
  assert.match(aiHistoryPageSource, /getRecommendationHistory\(\)/);
  assert.match(aiHistoryPageSource, /<RecommendationHistoryList records=\{records\} \/>/);

  assert.match(recommendationHistoryListSource, /import \{ Card \} from "@\/components\/ui\/card"/);
  assert.match(recommendationHistoryListSource, /import \{ EmptyState \} from "@\/components\/ui\/empty-state"/);
  assert.match(recommendationHistoryListSource, /<EmptyState/);
  assert.match(recommendationHistoryListSource, /title="過去の推薦履歴はまだありません"/);
  assert.match(recommendationHistoryListSource, /description="現在は山行計画のチェックリストを主に利用してください。"/);
  assert.match(recommendationHistoryListSource, /<Card key=\{record\.id\} className="p-4">/);
  assert.match(recommendationHistoryListSource, /推定重量/);
  assert.match(recommendationHistoryListSource, /必須装備/);
  assert.match(recommendationHistoryListSource, /詳細/);
  assert.match(recommendationHistoryListSource, /RecommendationDeleteButton id=\{record\.id\}/);
  // phase 4 では共有プリミティブを高リスク側に持ち込まない境界を引いていた。
  // 破壊的操作の確認ダイアログだけは例外にする(window.confirm は iOS の
  // WebView でシステムのアラートになるため)。Card/Badge などへの
  // 一括の置き換えは引き続き入れない。
  assert.doesNotMatch(
    recommendationDeleteControlsSource,
    /@\/components\/ui\/(?!confirm-dialog)/
  );
  assert.match(recommendationDeleteControlsSource, /router\.refresh/);

  assert.match(recommendationDetailSource, /import \{ Badge \} from "@\/components\/ui\/badge"/);
  assert.match(recommendationDetailSource, /import \{ Card \} from "@\/components\/ui\/card"/);
  assert.match(recommendationDetailSource, /import \{ Notice \} from "@\/components\/ui\/notice"/);
  assert.match(recommendationDetailSource, /<Notice/);
  assert.match(recommendationDetailSource, /tone="success"/);
  assert.match(recommendationDetailSource, /<Card className="p-5">/);
  assert.match(recommendationDetailSource, /<Badge className="bg-stone-50 py-1">/);
  assert.match(recommendationDetailSource, /旧推薦の詳細/);
  assert.match(recommendationDetailSource, /当時の判断メモ/);
  assert.match(recommendationDetailSource, /当時の所持装備照合/);
  assert.match(recommendationDetailSource, /不足装備/);
  assert.match(recommendationDetailSource, /リスク注意/);

  assert.doesNotMatch(tripPlanningUiSource, /@\/components\/ui\/(?!confirm-dialog)/);
  assert.doesNotMatch(gearFormSource, /@\/components\/ui\//);
  assert.doesNotMatch(planChecklistSource, /@\/components\/ui\//);
});

test("gear list component baseline keeps filters, badges, cards, and feedback states", () => {
  for (const componentName of [
    "GearList",
    "GearCard",
    "SummaryStat",
    "FilterLabel",
    "FilterChip",
    "StatusChip"
  ]) {
    assert.match(gearListSource, new RegExp(`function ${componentName}\\b|export function ${componentName}\\b`));
  }

  for (const copy of [
    "ギア名・ブランドで検索",
    "検索",
    "マイギア",
    "カテゴリー",
    "未登録:",
    "所有",
    "欲しい",
    "まだギアがありません",
    "ギアを追加",
    "マイギア"
  ]) {
    assert.match(gearListSource, new RegExp(copy));
  }

  assert.match(gearListSource, /statusLabels\[item\.status\]/);
  assert.match(gearListSource, /buildGearHref/);
  assert.match(gearPageSource, /params\.error/);
  assert.match(gearPageSource, /ギアを登録しました/);
  assert.match(gearPageSource, /ギアを更新しました/);
  assert.match(gearPageSource, /ギアを削除しました/);
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
    "ギアの写真",
    "写真を追加",
    "画像をアップロード中",
    "写真を削除",
    "キャンセル",
    "このギアを登録",
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
    "装備カバー状況",
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
    aiHistoryPageSource,
    recommendationHistoryListSource,
    recommendationDetailSource
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
    "まだギアがありません",
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

test("destructive actions are confirmed in-app, never with window.confirm", () => {
  // iOS Deployment Target は 15.0。<dialog>.showModal() は Safari 15.4
  // からなので、確認ダイアログは素のオーバーレイで実装している。
  const confirmDialogSource = readFileSync(
    new URL("../src/components/ui/confirm-dialog.tsx", import.meta.url),
    "utf8"
  );

  assert.match(confirmDialogSource, /export function ConfirmSubmitButton/);
  assert.match(confirmDialogSource, /export function ConfirmActionButton/);
  assert.match(confirmDialogSource, /role="dialog"/);
  assert.match(confirmDialogSource, /aria-modal="true"/);
  // 素のオーバーレイであることを実装側の印で確かめる
  // (「showModal を使わない」を否定形で書くと、その説明コメント自体に
  // 引っかかるので正の印で見る)。
  assert.match(confirmDialogSource, /fixed inset-0 z-\[60\] flex/);
  // 送信側は type="submit" のまま。Server Action と useFormStatus の
  // 挙動を変えないため、ポータルには出さない。
  assert.match(confirmDialogSource, /type="submit"/);
  assert.doesNotMatch(confirmDialogSource, /createPortal/);

  for (const [name, source] of [
    ["trip-planning-ui", tripPlanningUiSource],
    ["recommendation-delete-controls", recommendationDeleteControlsSource]
  ]) {
    assert.doesNotMatch(source, /window\.confirm/, name);
  }
});
