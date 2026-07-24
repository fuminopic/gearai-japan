import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/20260715132756_user_pack_items.sql", import.meta.url),
  "utf8"
);
const photographyMigrationSource = readFileSync(
  new URL("../supabase/migrations/20260722035016_add_photography_gear_category.sql", import.meta.url),
  "utf8"
);
const photographyConsolidationMigrationSource = readFileSync(
  new URL("../supabase/migrations/20260722070723_consolidate_photography_under_other.sql", import.meta.url),
  "utf8"
);
const packSummarySource = readFileSync(
  new URL("../src/lib/pack-summary.ts", import.meta.url),
  "utf8"
);
const majorCategoriesSource = readFileSync(
  new URL("../src/lib/gear-major-categories.ts", import.meta.url),
  "utf8"
);
const packDataSource = readFileSync(
  new URL("../src/lib/data/pack.ts", import.meta.url),
  "utf8"
);
const packActionsSource = readFileSync(
  new URL("../src/lib/actions/pack.ts", import.meta.url),
  "utf8"
);
const packPageSource = readFileSync(
  new URL("../app/(app)/pack/page.tsx", import.meta.url),
  "utf8"
);
const packSelectPageSource = readFileSync(
  new URL("../app/(app)/pack/select/page.tsx", import.meta.url),
  "utf8"
);
const selectorSource = readFileSync(
  new URL("../src/components/pack-gear-selector.tsx", import.meta.url),
  "utf8"
);
const removeButtonSource = readFileSync(
  new URL("../src/components/pack-remove-button.tsx", import.meta.url),
  "utf8"
);
const packContentsSource = readFileSync(
  new URL("../src/components/pack-contents.tsx", import.meta.url),
  "utf8"
);
const dashboardDataSource = readFileSync(
  new URL("../src/lib/data/dashboard.ts", import.meta.url),
  "utf8"
);
const dashboardPageSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);

const majorCategoriesDataUrl = await toTranspiledDataUrl(majorCategoriesSource);
const { buildPackSummary, getPackItemWeightGrams } = await importTranspiled(
  packSummarySource.replace(
    'from "@/lib/gear-major-categories"',
    `from "${majorCategoriesDataUrl}"`
  )
);

function gear(overrides = {}) {
  return {
    id: "gear-id",
    name: "テスト装備",
    brand: null,
    model: null,
    category_id: "backpack",
    subcategory_id: null,
    weight_grams: 0,
    official_weight_grams: null,
    gear_categories: { id: "backpack", name_ja: "ザック", name_en: "backpack" },
    gear_subcategories: null,
    ...overrides
  };
}

test("pack migration keeps a one-pack relation with cascade cleanup and RLS", () => {
  assert.match(migrationSource, /create table public\.user_pack_items/);
  assert.match(migrationSource, /primary key \(user_id, gear_id\)/);
  assert.match(migrationSource, /references public\.user_gear\(id\) on delete cascade/);
  assert.match(migrationSource, /alter table public\.user_pack_items enable row level security/);
  assert.match(migrationSource, /revoke all privileges\s+on table public\.user_pack_items\s+from anon, authenticated/);
  assert.match(migrationSource, /grant select, insert, delete on table public\.user_pack_items to authenticated/);
  assert.match(migrationSource, /user_pack_items_select_own/);
  assert.match(migrationSource, /user_pack_items_delete_own/);
  assert.match(migrationSource, /user_pack_items_insert_own_owned_gear/);
  assert.match(migrationSource, /user_gear\.user_id = user_pack_items\.user_id/);
  assert.match(migrationSource, /user_gear\.status = 'owned'/);
  assert.doesNotMatch(migrationSource, /plan_id|pack_name|template/i);
});

test("pack summary counts weight-less gear without adding it to known weight", () => {
  const unknown = gear({ id: "unknown" });
  const known = gear({
    id: "known",
    category_id: "clothing",
    weight_grams: 0,
    official_weight_grams: 350,
    gear_categories: { id: "clothing", name_ja: "ウェア", name_en: "clothing" }
  });
  const summary = buildPackSummary([unknown, known]);

  assert.equal(getPackItemWeightGrams(unknown), null);
  assert.equal(getPackItemWeightGrams(known), 350);
  assert.equal(summary.itemCount, 2);
  assert.equal(summary.knownWeightG, 350);
  assert.equal(summary.missingWeightCount, 1);
  assert.equal(summary.categoryWeights[0].weightG, 350);
});

test("photography taxonomy keeps legacy rows compatible while grouping shoes and photography into six categories", () => {
  assert.match(photographyMigrationSource, /\('撮影機材', 'photography', 110, true\)/);
  for (const subcategory of [
    "camera",
    "lens",
    "tripod",
    "drone",
    "camera_battery",
    "camera_accessory"
  ]) {
    assert.match(photographyMigrationSource, new RegExp(`'${subcategory}'`));
  }
  assert.match(photographyMigrationSource, /on conflict \(name_en\) do update/);
  assert.match(photographyMigrationSource, /on conflict \(category_id, name_en\) do update/);
  assert.doesNotMatch(photographyMigrationSource, /update public\.(user_gear|gear_products)/i);
  assert.match(photographyConsolidationMigrationSource, /where category\.name_en = 'other'/);
  assert.match(photographyConsolidationMigrationSource, /'撮影機材', 'photography', 110/);
  assert.match(photographyConsolidationMigrationSource, /set is_default = false/);
  assert.match(photographyConsolidationMigrationSource, /on conflict \(category_id, name_en\) do update/);
  assert.doesNotMatch(photographyConsolidationMigrationSource, /update public\.(user_gear|gear_products|trip_plans)/i);

  const summary = buildPackSummary([
    gear({
      id: "legacy-camera",
      category_id: "photography",
      subcategory_id: "camera",
      weight_grams: 420,
      gear_categories: { id: "photography", name_ja: "撮影機材", name_en: "photography" },
      gear_subcategories: { id: "camera", name_ja: "カメラ本体", name_en: "camera" }
    }),
    gear({
      id: "new-camera",
      category_id: "other",
      subcategory_id: "photography",
      weight_grams: 120,
      gear_categories: { id: "other", name_ja: "その他", name_en: "other" },
      gear_subcategories: { id: "photography", name_ja: "撮影機材", name_en: "photography" }
    }),
    gear({
      id: "shoes",
      category_id: "clothing",
      subcategory_id: "footwear",
      weight_grams: 800,
      gear_categories: { id: "clothing", name_ja: "ウェア", name_en: "clothing" },
      gear_subcategories: { id: "footwear", name_ja: "フットウェア", name_en: "footwear" }
    })
  ]);

  assert.equal(summary.itemCount, 3);
  assert.equal(summary.knownWeightG, 1340);
  assert.equal(summary.majorCategoryTotalCount, 6);
  assert.deepEqual(summary.categoryWeights, [
    { categoryId: "other", nameJa: "その他", weightG: 540, count: 2 },
    { categoryId: "clothing", nameJa: "ウェア", weightG: 800, count: 1 }
  ]);
});

test("pack actions recheck owned ownership, deduplicate, and only remove the relation", () => {
  assert.match(packActionsSource, /\.eq\("user_id", user\.id\)/);
  assert.match(packActionsSource, /\.eq\("status", "owned"\)/);
  assert.match(packActionsSource, /\.in\("id", uniqueIds\)/);
  assert.match(packActionsSource, /new Set\(gearIds\.filter\(isUuid\)\)/);
  assert.match(packActionsSource, /onConflict: "user_id,gear_id", ignoreDuplicates: true/);
  assert.match(packActionsSource, /\.from\("user_pack_items"\)[\s\S]*\.delete\(\)/);
  const removeActionSource = packActionsSource.slice(
    packActionsSource.indexOf("export async function removePackItem")
  );
  assert.doesNotMatch(removeActionSource, /\.from\("user_gear"\)/);
  assert.match(packActionsSource, /revalidatePath\("\/plan"\)/);
  assert.match(packActionsSource, /revalidatePath\("\/dashboard"\)/);
});

test("pack data filters pack membership through currently owned gear", () => {
  assert.match(packDataSource, /getUserGear\(\{ status: "owned" \}\)/);
  assert.match(packDataSource, /flatMap/);
  assert.match(packDataSource, /\.from\("user_pack_items"\)/);
  assert.match(packDataSource, /getLatestTripPlan/);
  assert.match(packDataSource, /foodWaterWeightG/);
});

test("pack pages provide grouped contents, accessible direct removal, and a multi-select add flow", () => {
  // 見出しと追加ボタンは、他画面と同じくカード内(PackContents)へ移動した。
  assert.match(packContentsSource, /マイパック/);
  assert.match(packContentsSource, /マイギアから追加/);
  assert.match(packPageSource, /PackContents/);
  assert.doesNotMatch(packPageSource, /重量未入力/);
  // 指標は2列のまま(マイギアの3列とは項目数が違うだけ)
  assert.match(packContentsSource, /PackStat/);
  assert.match(packContentsSource, /label="ギア数"/);
  assert.match(packContentsSource, /label="総重量"/);
  assert.match(packContentsSource, /PackWeightBreakdown/);
  assert.match(packContentsSource, /ギア重量/);
  assert.match(packContentsSource, /水・食料/);
  assert.doesNotMatch(packContentsSource, /包内装備|既知の総重量/);
  assert.doesNotMatch(packContentsSource, /重量未入力/);
  assert.match(packContentsSource, /weightG === null \? null/);
  assert.match(packContentsSource, /setItems\(\(current\) => current\.filter/);
  assert.match(packContentsSource, /removePackItem\(item\.id\)/);
  assert.match(packContentsSource, /restorePackItem/);
  assert.doesNotMatch(packContentsSource, /router\.refresh\(\)/);
  assert.match(packActionsSource, /revalidatePath\("\/pack"\)/);
  assert.match(packSelectPageSource, /PackGearSelector/);
  assert.match(selectorSource, /ギア名・ブランドで検索/);
  assert.match(selectorSource, /getCategories/);
  assert.match(selectorSource, /new Set\(packGearIds\)/);
  assert.match(selectorSource, /選択した\$\{selectedCount\}点を追加/);
  assert.match(selectorSource, /h-12 w-full/);
  assert.match(removeButtonSource, /aria-label="パックから外す"/);
  assert.match(removeButtonSource, /h-11 w-11/);
  assert.match(removeButtonSource, /h-6 w-6/);
  assert.match(removeButtonSource, /bg-stone-500/);
  assert.doesNotMatch(removeButtonSource, /bg-red-800/);
});

test("dashboard derives pack metrics and composition only from current owned pack gear", () => {
  assert.match(dashboardDataSource, /\.from\("user_pack_items"\)/);
  assert.match(dashboardDataSource, /gear\.filter\(\(item\) => item\.status === "owned"\)/);
  assert.match(dashboardDataSource, /buildPackSummary\(ownedGear\.filter/);
  assert.match(dashboardPageSource, /packItemCount/);
  assert.match(dashboardPageSource, /packKnownWeightG/);
  assert.match(dashboardPageSource, /パック重量構成/);
  assert.match(dashboardPageSource, /マイパック &gt;/);
  assert.match(dashboardPageSource, /whitespace-nowrap text-xs font-medium text-gray-400/);
  assert.doesNotMatch(dashboardPageSource, /重量未入力/);
  assert.match(dashboardPageSource, /マイパックはまだ空です/);
  assert.doesNotMatch(dashboardPageSource, /summary\.totalWeightG/);
});

async function importTranspiled(source) {
  return import(await toTranspiledDataUrl(source));
}

async function toTranspiledDataUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
     target: ts.ScriptTarget.ES2022
    }
  });

  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}

test("optimistic pack changes roll back even when the request never lands", () => {
  // Server Action が {ok:false} を返す場合だけ巻き戻していた。圏外だと
  // 呼び出し自体が reject するので result に到達せず、保存できていないのに
  // 画面だけ変わったままになっていた。山では圏外が普通なので必ず戻す。
  const controlsSource = readFileSync(
    new URL("../src/components/gear-pack-controls.tsx", import.meta.url),
    "utf8"
  );
  const contentsSource = readFileSync(
    new URL("../src/components/pack-contents.tsx", import.meta.url),
    "utf8"
  );

  for (const source of [controlsSource, contentsSource]) {
    assert.match(source, /try \{/);
    assert.match(source, /\} catch \(caught\) \{/);
    assert.match(source, /\} finally \{/);
    assert.match(source, /通信できませんでした/);
  }
});

test("gear images are signed in one request, not one per item", () => {
  // createSignedUrl(単数)を map で回すと、ギア1件につき Storage への
  // 往復が1回。ホーム・マイギア・計画のどれを開いても件数分走っていた。
  for (const relativePath of ["src/lib/data/gear.ts", "src/lib/data/dashboard.ts"]) {
    const source = readFileSync(
      new URL(`../${relativePath}`, import.meta.url),
      "utf8"
    );
    assert.match(source, /createSignedUrls\(paths, 60 \* 60\)/, relativePath);
    assert.doesNotMatch(source, /\.createSignedUrl\(/, relativePath);
    // 入力と同じ件数・同じ順序で返す
    assert.match(source, /return gear\.map\(\(item\) => \{/, relativePath);
  }
});

test("my pack can be saved as a magazine-style share image", () => {
  const imageSource = readFileSync(
    new URL("../src/lib/pack-share-image.ts", import.meta.url),
    "utf8"
  );
  const contentsSource = readFileSync(
    new URL("../src/components/pack-contents.tsx", import.meta.url),
    "utf8"
  );

  // 小紅書などの縦画像に合わせた 1242x1660、4列4行
  assert.match(imageSource, /PACK_SHARE_IMAGE_WIDTH = 1242/);
  assert.match(imageSource, /PACK_SHARE_IMAGE_HEIGHT = 1660/);
  assert.match(imageSource, /const COLUMNS = 4/);
  assert.match(imageSource, /const ROWS = 4/);
  // 多い時は重い順に16件(大物が上=分享の見栄え)
  assert.match(imageSource, /getPackItemWeightGrams\(b\) \?\? 0\) - \(getPackItemWeightGrams\(a\) \?\? 0\)/);
  assert.match(imageSource, /\.slice\(0, MAX_ITEMS\)/);
  // 署名URLを canvas に描くための crossOrigin。失敗しても null で
  // プレースホルダに落とし、1枚読めないだけで共有不能にしない。
  // カタログ商品画像は外部CDN(CORS無し)なので、自オリジンの画像プロキシを
  // 通す。同一オリジンになり canvas を汚染しない。
  assert.match(imageSource, /\/api\/gear-image\?url=/);
  assert.doesNotMatch(imageSource, /img\.crossOrigin = "anonymous"/);
  // プロキシは許可リスト方式で SSRF を防ぐ
  const proxySource = readFileSync(
    new URL("../app/api/gear-image/route.ts", import.meta.url),
    "utf8"
  );
  assert.match(proxySource, /ALLOWED_IMAGE_HOSTS/);
  assert.match(proxySource, /target\.protocol !== "https:"/);
  assert.match(proxySource, /host not allowed/);
  assert.match(proxySource, /content-type/);
  // ホームと同じ写真の見せ方(白背景を溶かす multiply)
  assert.match(imageSource, /globalCompositeOperation = "multiply"/);
  // 中央ロゴはホームの白ワードマークを使う
  assert.match(imageSource, /yamajitaku-wordmark-white\.png/);
  // 総重量は 総重量(小)+数値(大)+単位(小) を右揃えで積む
  assert.match(imageSource, /const numberPart =/);
  assert.match(imageSource, /const unitPart =/);
  // 端末の共有シート、無ければダウンロードに落とす
  assert.match(imageSource, /navigator\.share/);
  assert.match(imageSource, /function downloadPackImage/);

  // 中身が無い時はボタンを出さない
  assert.match(contentsSource, /items\.length > 0 \? \(/);
  assert.match(contentsSource, /画像で共有/);
  assert.match(contentsSource, /createPackShareImageBlob/);
});
