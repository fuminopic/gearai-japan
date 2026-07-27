import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearListSource = readFileSync(
  new URL("../src/components/gear-list.tsx", import.meta.url),
  "utf8"
);
const gearPageSource = readFileSync(
  new URL("../app/(app)/gear/page.tsx", import.meta.url),
  "utf8"
);
const gearDataSource = readFileSync(
  new URL("../src/lib/data/gear.ts", import.meta.url),
  "utf8"
);
const gearActionSource = readFileSync(
  new URL("../src/lib/actions/gear.ts", import.meta.url),
  "utf8"
);
const gearDetailSource = readFileSync(
  new URL("../app/(app)/gear/[id]/page.tsx", import.meta.url),
  "utf8"
);
const gearDisplaySource = readFileSync(
  new URL("../src/lib/gear-display.ts", import.meta.url),
  "utf8"
);
const gearMajorCategoriesSource = readFileSync(
  new URL("../src/lib/gear-major-categories.ts", import.meta.url),
  "utf8"
);
const brandLogoSource = readFileSync(
  new URL("../src/components/brand-logo.tsx", import.meta.url),
  "utf8"
);
const gearTypesSource = readFileSync(
  new URL("../src/lib/types/gear.ts", import.meta.url),
  "utf8"
);

test("gear list supports brand filtering from the gear page query", () => {
  assert.match(gearTypesSource, /brand\?: string/);
  assert.match(gearPageSource, /brand\?: string/);
  assert.match(gearPageSource, /brand: params\.brand/);
  assert.match(gearDataSource, /filters\.brand/);
  assert.match(gearDataSource, /getBrandAliasesForQuery/);
  assert.match(gearDataSource, /\.in\("brand", brandAliases\)/);
  assert.match(gearDataSource, /getUserGearBrands/);
});

test("gear list normalizes brand filters and historical brand aliases in data layer", () => {
  assert.match(gearDataSource, /canonicalizeBrandName/);
  assert.match(gearDataSource, /normalizeBrandKey/);
  assert.match(gearDataSource, /canonicalizeUserGearBrands/);
  assert.match(gearDataSource, /new Map<string, string>/);
  assert.match(gearActionSource, /canonicalizeBrandName/);
  assert.match(gearActionSource, /brand \? canonicalizeBrandName\(brand\) : null/);
});

test("gear list exposes brand and category-oriented list controls", () => {
  assert.match(gearListSource, /name="brand"/);
  assert.match(gearListSource, /FilterChip/);
  assert.match(gearListSource, /StatusChip/);
  assert.match(gearListSource, /buildGearHref/);
  assert.match(gearListSource, /label="ブランド"/);
  assert.match(gearListSource, /のカテゴリー/);
  assert.match(gearListSource, /MAJOR_GEAR_CATEGORIES\.map/);
  for (const label of [
    "ウェア",
    "ザック",
    "テント・シュラフ",
    "クッキング",
    "安全・ナビ",
    "その他"
  ]) {
    assert.match(gearMajorCategoriesSource, new RegExp(label));
  }
  assert.match(gearListSource, /BrandLogo/);
  assert.match(gearListSource, /<BrandLogo brand=\{brand\} compact/);
  assert.match(brandLogoSource, /role="img"/);
  assert.match(brandLogoSource, /officialBrandLogos/);
  assert.match(brandLogoSource, /<img/);
  assert.doesNotMatch(brandLogoSource, /<svg/);
  assert.match(gearDisplaySource, /compareGearBrands/);
});

test("gear filters collapse by default so the gear list reaches the first view", () => {
  // 折りたたみは素の <details>。フィルタ自体は従来どおり URL 駆動の <Link> の
  // ままで、クライアント状態は増やさない。
  assert.match(gearListSource, /<details/);
  assert.match(gearListSource, /open=\{hasActiveFilters\}/);
  assert.match(gearListSource, /<summary/);
  assert.match(gearListSource, /ブランド・カテゴリーで絞り込む/);
  assert.match(gearListSource, /絞り込み中 ・ \$\{gear\.length/);
  assert.match(gearListSource, /絞り込みを解除/);

  // 一覧より前に出るのは折りたたみだけ。検索を含む全コントロールがこの中。
  // (コメント中の <details> ではなく、実際の開閉制御の位置を境界にする)
  const detailsIndex = gearListSource.indexOf("open={hasActiveFilters}");
  assert.ok(detailsIndex > -1);

  for (const marker of [
    'placeholder="ギア名・ブランドで検索"',
    'label="ブランド"',
    "StatusChip",
    'htmlFor="gear-sort"'
  ]) {
    assert.ok(
      gearListSource.indexOf(marker) > detailsIndex,
      `${marker} must live inside the collapsed filters`
    );
  }
});

test("gear list groups registered gear by category without changing cards", () => {
  assert.match(gearListSource, /groupGearByCategory/);
  assert.match(gearListSource, /getRetailGearCategory\(item\)/);
  assert.match(gearListSource, /gearGroups\.map/);
  assert.match(gearListSource, /group\.items\.map/);
  assert.match(gearListSource, /GearCard/);
  assert.match(gearListSource, /formatWeight\(group\.weightGrams\)/);
  assert.match(gearListSource, /SummaryStat/);
  assert.match(gearListSource, /totalWeightGrams/);
  assert.match(gearListSource, /getMajorGearCategoryCoverage/);
  assert.match(gearListSource, /label="カテゴリー"/);
  assert.match(gearListSource, /未登録:/);
  assert.match(gearListSource, /未登録:/);
  assert.match(gearPageSource, /summaryGear/);
  assert.match(gearListSource, /マイギア/);
  assert.match(gearListSource, /grid gap-2/);
  assert.match(gearDataSource, /isRetailGearCategoryId/);
  assert.match(gearDataSource, /getRetailGearCategory\(item\)\?\.id === filters\.category/);
  // 無条件の二重 user_gear 読み込みは避ける。ただし表示一覧が部分集合なら
  // パック集計のために全 owned ギアを別途取る。
  assert.match(gearPageSource, /hasPartialGearFilters\(filters\)/);
  assert.match(gearPageSource, /needsSeparateOwnedSummary \? getUserGear\(\{ status: "owned" \}\) : Promise\.resolve\(null\)/);
  assert.match(gearPageSource, /separateOwnedGear \?\? gear\.filter\(\(item\) => item\.status === "owned"\)/);
  assert.match(gearPageSource, /filters\.status === "wishlist"/);
  assert.doesNotMatch(gearListSource, /総額/);
  assert.doesNotMatch(gearListSource, /高い順/);
  assert.doesNotMatch(gearListSource, /節約/);
});

test("gear list and actions provide clear post-save feedback", () => {
  assert.match(gearPageSource, /saved\?: string/);
  assert.match(gearPageSource, /getSavedMessage/);
  assert.match(gearPageSource, /ギアを登録しました/);
  assert.match(gearPageSource, /ギアを更新しました/);
  assert.match(gearPageSource, /ギアを削除しました/);
  assert.match(gearActionSource, /\/gear\?saved=created/);
  assert.match(gearActionSource, /\/gear\?saved=updated/);
  assert.match(gearActionSource, /\/gear\?saved=deleted/);
});

test("gear delete action is kept on the detail page instead of the dense list", () => {
  assert.doesNotMatch(gearListSource, /deleteGear/);
  assert.doesNotMatch(gearListSource, /このギアを削除/);
  assert.match(gearDetailSource, /ギアの管理/);
  assert.match(gearDetailSource, /deleteGear\.bind\(null, gear\.id\)/);
  // 取り消せない削除なので、計画の削除と同じく確認をはさむ。
  assert.match(gearDetailSource, /このギアを削除/);
  assert.match(gearDetailSource, /<ConfirmSubmitButton/);
  assert.match(gearDetailSource, /title="このギアを削除しますか？"/);
  assert.match(gearDetailSource, /削除すると元に戻せません。/);
});

test("gear detail page uses user-facing Japanese labels instead of internal field names", () => {
  assert.match(gearDetailSource, /データ確認/);
  assert.match(gearDetailSource, /データ区分/);
  assert.match(gearDetailSource, /製品カタログ/);
  assert.match(gearDetailSource, /自分で登録/);
  assert.match(gearDetailSource, /カタログ確認/);
  assert.match(gearDetailSource, /確認日/);
  assert.match(gearDetailSource, /参考情報/);
  assert.match(gearDetailSource, /価格確認ページ/);
  assert.match(gearDetailSource, /写真未登録/);
  assert.match(gearDetailSource, /価格情報は登録データの参考として表示しています。/);
  assert.doesNotMatch(gearDetailSource, /価格・公式情報/);
  assert.doesNotMatch(gearDetailSource, /<InfoCard title="公式情報"/);
  assert.doesNotMatch(gearDetailSource, /SummaryPill label="公式価格"/);
  assert.doesNotMatch(gearDetailSource, /価格ソース/);
  assert.doesNotMatch(gearDetailSource, /購入価格/);
  assert.doesNotMatch(gearDetailSource, /購入日/);
  assert.doesNotMatch(gearDetailSource, /節約額/);
  assert.doesNotMatch(gearDetailSource, /実測重量/);
  assert.doesNotMatch(gearDetailSource, />verification_status</);
  assert.doesNotMatch(gearDetailSource, />last_verified_at</);
  assert.doesNotMatch(gearDetailSource, />MSRP source</);
});

test("gear display helpers avoid showing unknown weights as zero grams", () => {
  assert.match(gearDisplaySource, /getGearDisplayWeightLabel/);
  assert.match(gearDisplaySource, /item\.weight_grams > 0/);
  assert.match(gearDisplaySource, /return typeof grams === "number" \? formatWeight\(grams\) : "-"/);
  assert.match(gearListSource, /getGearDisplayWeightLabel\(item\)/);
  assert.doesNotMatch(gearDisplaySource, /const measured/);
});

test("personal inventory screens say ギア, planning screens keep 装備", () => {
  // project-rules 3.2 のドメイン分割。自分の持ち物は「ギア」、
  // 計画側の要求スロットやチェックリストは「装備」のまま。
  const gearNewSource = readFileSync(
    new URL("../app/(app)/gear/new/page.tsx", import.meta.url),
    "utf8"
  );
  const gearEditSource = readFileSync(
    new URL("../app/(app)/gear/[id]/edit/page.tsx", import.meta.url),
    "utf8"
  );
  const packSelectSource = readFileSync(
    new URL("../app/(app)/pack/select/page.tsx", import.meta.url),
    "utf8"
  );

  for (const source of [
    gearNewSource,
    gearEditSource,
    gearDetailSource,
    packSelectSource
  ]) {
    assert.doesNotMatch(source, /装備/);
  }

  assert.match(gearNewSource, /ギアを追加/);
  assert.match(gearNewSource, /マイギアへ戻る/);
  assert.match(gearEditSource, /ギアを編集/);
  assert.match(gearDetailSource, /ギア詳細/);
  assert.match(gearDetailSource, /マイギアへ/);
  assert.match(packSelectSource, /所有しているギア/);

  // 計画ドメインはそのまま
  const tripPlanningUiSource = readFileSync(
    new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
    "utf8"
  );
  assert.match(tripPlanningUiSource, /装備チェックリスト/);
  assert.match(tripPlanningUiSource, /装備カバー状況/);
});

test("long forms warn before throwing the input away", () => {
  const guardSource = readFileSync(
    new URL("../src/components/ui/unsaved-changes-guard.tsx", import.meta.url),
    "utf8"
  );
  const gearFormSource = readFileSync(
    new URL("../src/components/gear-form.tsx", import.meta.url),
    "utf8"
  );
  const profileSettingsFormSource = readFileSync(
    new URL("../src/components/profile-settings-form.tsx", import.meta.url),
    "utf8"
  );
  const pageShellSource = readFileSync(
    new URL("../src/components/ui/page-shell.tsx", import.meta.url),
    "utf8"
  );

  // 囲っている <form> を自分で探すので、フォーム側の state には触れない。
  assert.match(guardSource, /closest\("form"\)/);
  assert.match(guardSource, /beforeunload/);
  // 止めるのは PageShell の戻るリンクだけ。他のリンクは素通しする。
  assert.match(guardSource, /a\[data-guarded-back\]/);
  assert.match(pageShellSource, /data-guarded-back=""/);

  assert.match(gearFormSource, /<UnsavedChangesGuard \/>/);
  assert.match(profileSettingsFormSource, /<UnsavedChangesGuard \/>/);

  // 数値入力はモバイルで数字キーを出す
  assert.match(gearFormSource, /inputMode="numeric"/);
});

test("the gear form uses the same tokens as the rest of the app", () => {
  // 統一済みの画面から「ギアを追加」に入ると、ここだけ旧スタイルだった。
  // 変更は className のみ。props・state・アップロード処理・カタログ照合・
  // 送信の挙動には触れていない(project-rules 7)。
  const source = readFileSync(
    new URL("../src/components/gear-form.tsx", import.meta.url),
    "utf8"
  );

  assert.doesNotMatch(source, /rounded-lg/);
  assert.doesNotMatch(source, /shadow-soft/);
  assert.doesNotMatch(source, /bg-forest-700/);
  assert.doesNotMatch(source, /text-forest-700/);
  assert.match(source, /rounded-full bg-\[#14724e\]/);
  assert.match(source, /rounded-xl border border-stone-200 bg-stone-50/);

  // 挙動側の目印。ここが消えていたら className 以外に手が入っている。
  assert.match(source, /onSubmit=\{handleSubmit\}/);
  assert.match(source, /createSignedUrl|from\("gear-images"\)|storage/);
  assert.match(source, /<UnsavedChangesGuard \/>/);
});

test("the catalog picker matches the rest of the app", () => {
  const source = readFileSync(
    new URL("../src/components/gear-form.tsx", import.meta.url),
    "utf8"
  );
  const layoutSource = readFileSync(
    new URL("../app/(app)/layout.tsx", import.meta.url),
    "utf8"
  );
  const navSource = readFileSync(
    new URL("../src/components/app-nav.tsx", import.meta.url),
    "utf8"
  );

  // タブ5画面は #E5EBE9、その1階層下だけ #FAFAFA で、深く入ると
  // 画面全体の色が変わっていた。上の白ヘッダーも合わせる。
  assert.match(layoutSource, /bg-\[#E5EBE9\]/);
  assert.doesNotMatch(layoutSource, /#FAFAFA/);
  assert.match(navSource, /bg-\[#E5EBE9\]\/90/);

  // 検索ボタンだけ黒だった。主操作の色はアプリで1つ。
  assert.doesNotMatch(source, /bg-ink/);
  // 白いカードは 20px
  assert.match(source, /rounded-\[20px\] bg-white/);
  // iOS では指を離しても hover が残るので、背景を変える hover は使わない
  assert.doesNotMatch(source, /hover:bg-forest/);
  assert.match(source, /\[@media\(hover:hover\)\]:hover:/);
});

test("user gear can add or change its photo in place on the detail page", () => {
  const detailSource = readFileSync(
    new URL("../app/(app)/gear/[id]/page.tsx", import.meta.url),
    "utf8"
  );
  const uploadSource = readFileSync(
    new URL("../src/components/gear-photo-upload.tsx", import.meta.url),
    "utf8"
  );
  const actionsSource = readFileSync(
    new URL("../src/lib/actions/gear.ts", import.meta.url),
    "utf8"
  );

  // 詳細ページ: 自分のギアは編集フォームに飛ばず、その場で写真を扱う。
  // カタログ品は読み取り専用のまま。
  assert.match(detailSource, /<GearPhotoUpload/);
  assert.match(detailSource, /isCatalog \?/);
  // 軽量の画像専用アクション(product_id null のみ)
  assert.match(actionsSource, /export async function updateGearImage/);
  assert.match(actionsSource, /\.is\("product_id", null\)/);
  // アップロード → 保存 → 再取得
  assert.match(uploadSource, /storage\n?\s*\.from\("gear-images"\)|from\("gear-images"\)/);
  assert.match(uploadSource, /updateGearImage/);
  assert.doesNotMatch(uploadSource, /router\.refresh\(\)/);
  assert.match(uploadSource, /写真を変更/);
  assert.match(uploadSource, /写真を削除/);
});
