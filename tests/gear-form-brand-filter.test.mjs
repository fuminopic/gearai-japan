import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);
const gearDataSource = readFileSync(
  new URL("../src/lib/data/gear.ts", import.meta.url),
  "utf8"
);
const gearNewPageSource = readFileSync(
  new URL("../app/(app)/gear/new/page.tsx", import.meta.url),
  "utf8"
);
const gearEditPageSource = readFileSync(
  new URL("../app/(app)/gear/[id]/edit/page.tsx", import.meta.url),
  "utf8"
);
const gearActionSource = readFileSync(
  new URL("../src/lib/actions/gear.ts", import.meta.url),
  "utf8"
);
const gearDisplaySource = readFileSync(
  new URL("../src/lib/gear-display.ts", import.meta.url),
  "utf8"
);
const brandLogoSource = readFileSync(
  new URL("../src/components/brand-logo.tsx", import.meta.url),
  "utf8"
);
const gearImageStorageMigrationSource = readFileSync(
  new URL("../supabase/migrations/032_user_gear_private_image_storage.sql", import.meta.url),
  "utf8"
);
const photographyConsolidationMigrationSource = readFileSync(
  new URL("../supabase/migrations/20260722070723_consolidate_photography_under_other.sql", import.meta.url),
  "utf8"
);

test("manual gear entry offers photography only as an Other subcategory while legacy photography remains editable", () => {
  assert.match(gearDataSource, /const PRODUCT_CATEGORY_KEYS = \[[\s\S]*"other"/);
  assert.doesNotMatch(gearDataSource, /"photography"/);
  assert.match(gearDataSource, /from\("gear_subcategories"\)[\s\S]*order\("sort_order"/);
  assert.match(gearFormSource, /setSubcategoryId\(product\.subcategory_id \?\? ""\)/);
  assert.match(gearFormSource, /name="subcategory_id" value=\{subcategoryId\}/);
  assert.match(gearFormSource, /!gear\?\.gear_categories[\s\S]*categories\.some/);
  assert.match(photographyConsolidationMigrationSource, /where category\.name_en = 'other'/);
  assert.match(photographyConsolidationMigrationSource, /set is_default = false/);
});

test("gear add form exposes a product brand filter beside product search", () => {
  assert.match(gearFormSource, /brandFilter/);
  assert.match(gearFormSource, /ProductFilterChip/);
  assert.match(gearFormSource, /handleBrandFilter\("all"\)/);
  assert.match(gearFormSource, /公式カタログから選択/);
  assert.match(gearFormSource, /productsForBrand/);
});

test("gear picker serializes only fields used by the form while planning keeps the full catalog reader", () => {
  assert.match(gearDataSource, /const GEAR_PICKER_PRODUCT_SELECT/);
  assert.match(gearDataSource, /getGearProductsForPicker/);
  assert.match(gearDataSource, /\.select\(GEAR_PICKER_PRODUCT_SELECT\)/);
  assert.match(gearDataSource, /gear_product_aliases\(alias\)/);
  assert.doesNotMatch(
    gearDataSource.slice(
      gearDataSource.indexOf("const GEAR_PICKER_PRODUCT_SELECT"),
      gearDataSource.indexOf("export async function getUserGear")
    ),
    /measured_weight_grams|released_at|msrp_source_url|last_verified_at|verification_status|created_at/
  );
  assert.match(gearNewPageSource, /getGearProductsForPicker\(\)/);
  assert.match(gearEditPageSource, /getGearProductsForPicker\(\)/);
  assert.match(gearFormSource, /GearPickerProduct\[\]/);
});

test("gear add form supports explicit search, suggestions, and real brand logo chips", () => {
  assert.match(gearFormSource, /confirmProductSearch/);
  assert.match(gearFormSource, /productSuggestions/);
  assert.match(gearFormSource, /list="gear-product-suggestions"/);
  assert.match(gearFormSource, /<datalist id="gear-product-suggestions">/);
  assert.match(gearFormSource, />\s*検索\s*<\/button>/);
  assert.match(gearFormSource, /getProductDisplayTitle\(product\)/);
  assert.match(gearFormSource, /BrandLogo/);
  assert.match(gearFormSource, /<BrandLogo brand=\{item\} compact/);
  assert.match(brandLogoSource, /role="img"/);
  assert.match(brandLogoSource, /officialBrandLogos/);
  assert.match(brandLogoSource, /<img/);
  assert.doesNotMatch(brandLogoSource, /<svg/);
  assert.match(brandLogoSource, /thenorthface/);
  assert.match(brandLogoSource, /blackdiamond/);
  assert.match(brandLogoSource, /hyperlitemountaingear/);
  assert.match(gearFormSource, /ariaLabel=\{`\$\{item\}を選択`\}/);
});

test("gear add form replaces scanning shortcuts with manual registration and photo upload", () => {
  // 手入力の導線はカード内の一行をやめ、画面下に常駐させた。
  // カタログ442件に自分のギアが無い人が多いので、いつでも押せる所に置く。
  assert.match(gearFormSource, /GearPickerActionBar/);
  assert.match(gearFormSource, /自分で登録/);
  assert.match(gearFormSource, /manualEntryRef/);
  assert.match(gearFormSource, /scrollIntoView/);
  assert.match(gearFormSource, /SelectedProductConfirmCard/);
  assert.match(gearFormSource, /登録内容を確認/);
  assert.match(gearFormSource, /写真を追加/);
  assert.match(gearFormSource, /handleImageFile/);
  assert.match(gearFormSource, /gear-images/);
  assert.match(gearFormSource, /image_storage_path/);
  assert.match(gearFormSource, /accept="image\/\*"/);
  assert.doesNotMatch(gearFormSource, /写真も追加できます/);
  assert.doesNotMatch(gearFormSource, /バーコード/);
  assert.doesNotMatch(gearFormSource, /カメラ/);
});

test("manual gear form keeps only preparation fields and collapses notes and URL", () => {
  const manualFormSource = gearFormSource.slice(
    gearFormSource.indexOf("{manualMode ? ("),
    gearFormSource.indexOf("{shouldShowGearDetails ? (")
  );

  assert.match(gearFormSource, /その他の情報/);
  assert.match(gearFormSource, /name="memo"/);
  assert.match(gearFormSource, /name="official_url"/);
  assert.match(gearFormSource, /name="weight_type"/);
  assert.doesNotMatch(manualFormSource, />モデル</);
  assert.doesNotMatch(manualFormSource, />サブカテゴリー</);
  // 目录装备与既有手动装备的分类数据仍随隐藏字段提交，移除的是手动表单控件。
  assert.match(gearFormSource, /name="model" value=\{model\}/);
  assert.match(gearFormSource, /name="subcategory_id" value=\{subcategoryId\}/);
  assert.doesNotMatch(gearFormSource, /メーカー希望小売価格|name="status"|name="size"|name="volume"|name="capacity"|name="color"|name="material"/);
  assert.doesNotMatch(gearActionSource, /msrp_jpy:|purchase_price_jpy:|purchase_date:|size:|volume:|capacity:|color:|material:|status:/);
});

test("gear form removes measured weight from user-facing detail editing", () => {
  assert.doesNotMatch(gearFormSource, /実測重量/);
  assert.doesNotMatch(gearFormSource, /measuredWeightGrams/);
  assert.doesNotMatch(gearFormSource, /name="measured_weight_grams"/);
  assert.doesNotMatch(gearActionSource, /measured_weight_grams:/);
});

test("gear photo upload uses private storage paths instead of public gear photos", () => {
  assert.match(gearImageStorageMigrationSource, /add column if not exists image_storage_path/);
  assert.match(gearImageStorageMigrationSource, /'gear-images'/);
  assert.match(gearImageStorageMigrationSource, /false,/);
  assert.match(gearImageStorageMigrationSource, /gear_images_select_own/);
  assert.match(gearImageStorageMigrationSource, /auth\.uid\(\)::text/);
  assert.doesNotMatch(gearImageStorageMigrationSource, /gear_images_select_public/);
  assert.match(gearActionSource, /image_storage_path: optionalString/);
  assert.match(gearDataSource, /createSignedUrl/);
});

test("gear add form separates brand results by product category", () => {
  assert.match(gearFormSource, /productCategoryFilter/);
  assert.match(gearFormSource, /productCategoryOptions/);
  assert.match(gearFormSource, /categoryProductGroups/);
  assert.match(gearFormSource, /ProductResultCard/);
  assert.match(gearFormSource, /SelectedProductConfirmCard/);
  assert.match(gearFormSource, /compareProductPickerItems/);
  assert.match(gearFormSource, /のカテゴリー/);
  assert.match(gearFormSource, /カタログに見つかりませんでした/);
  assert.match(gearFormSource, /自分で登録する/);
});

test("catalog presentation keeps backpack liters separate from people capacity without writing either to user gear", () => {
  assert.match(gearDisplaySource, /function getProductVolume/);
  assert.match(gearDisplaySource, /function isBackpackProduct/);
  assert.match(gearDisplaySource, /`\$\{baseName\} \(\$\{productVolume\}\)`/);
  assert.match(gearFormSource, /isBackpackProduct\(product\) \? null : product\.capacity/);
  assert.doesNotMatch(gearFormSource, /setVolume\(|setCapacity\(/);
});

test("gear add form sorts product brand filters by visible product count", () => {
  assert.match(gearFormSource, /const brandOptions = useMemo/);
  assert.match(gearFormSource, /getProductBrandOptions\(products\)/);
  assert.match(gearFormSource, /const productCountByBrand = new Map<string, number>\(\)/);
  assert.match(gearFormSource, /if \(!product\.brand\)/);
  assert.match(gearFormSource, /productCountByBrand\.set/);
  assert.match(gearFormSource, /return countB - countA/);
  assert.match(gearFormSource, /brandCollator\.compare\(brandA, brandB\)/);
  assert.doesNotMatch(gearFormSource, /sort\(compareGearBrands\)/);
  assert.match(
    gearFormSource,
    /handleBrandFilter\("all"\)[\s\S]*>\s*すべて\s*<\/ProductFilterChip>[\s\S]*brandOptions\.map/
  );
});

test("gear actions canonicalize manually entered brand names without changing the form UI", () => {
  assert.match(gearActionSource, /canonicalizeBrandName/);
  assert.match(gearActionSource, /const brand = optionalString\(formData\.get\("brand"\)\)/);
  assert.match(gearActionSource, /brand: brand \? canonicalizeBrandName\(brand\) : null/);
  assert.match(gearFormSource, /value=\{brand\}/);
  assert.match(gearFormSource, /onChange=\{\(event\) => setBrand\(event\.target\.value\)\}/);
});

test("selecting a product answers where the finger is, not off-screen", () => {
  const source = readFileSync(
    new URL("../src/components/gear-form.tsx", import.meta.url),
    "utf8"
  );

  // 以前は確認カードが一覧の *上* にあり、下の方の行を押しても画面外で
  // 何も起きないように見えた。登録ボタンは画面下の常駐バーが持つ。
  assert.match(source, /function GearPickerActionBar/);
  assert.match(source, /fixed inset-x-4 bottom-\[104px\]/);
  assert.match(source, /登録する/);
  // 常駐バーは form の中。type="submit" と Server Action の経路は変えない。
  assert.match(source, /<GearPickerActionBar/);
  assert.doesNotMatch(source, /createPortal/);
  // 未選択時は右寄せのピル(マイパック条と同じ位置)
  assert.match(source, /fixed bottom-\[104px\] right-4/);
  // 手入力・編集中は自前の下部操作があるので常駐バーは出さない
  assert.match(source, /\{!shouldShowBottomActions \? \(/);

  // カテゴリーの11チップは既定で閉じる(6行占めていた)
  assert.match(source, /<details\s*\n\s*open=\{productCategoryFilter !== "all"\}/);
  assert.match(source, /activeFilterSummary/);

  // 行の分類チップは、すぐ上のグループ見出しと重複していたので外した
  assert.doesNotMatch(source, /rounded-full bg-forest-50 px-2 py-0\.5 font-bold text-forest-800/);
});

test("editing an existing gear goes straight to the manual form, no catalog picker", () => {
  const source = readFileSync(
    new URL("../src/components/gear-form.tsx", import.meta.url),
    "utf8"
  );
  // 既存ギアの編集(manualMode)や手入力に切り替えた時は、カタログ検索を
  // 出さない。以前は無条件で描かれ、編集時に検索窓が再び現れていた。
  assert.match(source, /\{!manualMode \? \(\n\s*<section className="overflow-hidden rounded-\[20px\]/);
  // 手入力フォームには写真の追加・変更・削除がある
  assert.match(source, /写真を追加/);
  assert.match(source, /写真を削除/);
});

test("the secondary page header sits above the overlapping card", () => {
  const shellSource = readFileSync(
    new URL("../src/components/ui/page-shell.tsx", import.meta.url),
    "utf8"
  );
  // 戻る/メニューの mt-[42px] はホーム(下にロゴだけ)由来。その下に見出しが
  // 続くここでは、見出しがカードの重なりゾーンに入るので付けない。
  assert.doesNotMatch(shellSource, /mt-\[42px\]/);
});
