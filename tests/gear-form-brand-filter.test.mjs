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

test("gear add form exposes a product brand filter beside product search", () => {
  assert.match(gearFormSource, /brandFilter/);
  assert.match(gearFormSource, /ProductFilterChip/);
  assert.match(gearFormSource, /handleBrandFilter\("all"\)/);
  assert.match(gearFormSource, /公式カタログから選択/);
  assert.match(gearFormSource, /productsForBrand/);
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

test("gear add form keeps official unit price but removes purchase tracking fields", () => {
  assert.match(gearFormSource, /メーカー希望小売価格/);
  assert.match(gearFormSource, /公式価格/);
  assert.doesNotMatch(gearFormSource, /購入価格/);
  assert.doesNotMatch(gearFormSource, /購入日/);
  assert.doesNotMatch(gearFormSource, /節約額/);
  assert.match(gearActionSource, /purchase_price_jpy: null/);
  assert.match(gearActionSource, /purchase_date: null/);
});

test("gear form removes measured weight from user-facing detail editing", () => {
  assert.doesNotMatch(gearFormSource, /実測重量/);
  assert.doesNotMatch(gearFormSource, /measuredWeightGrams/);
  assert.doesNotMatch(gearFormSource, /name="measured_weight_grams"/);
  assert.match(gearActionSource, /measured_weight_grams: null/);
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

test("gear add form treats backpack liters as volume, not people capacity", () => {
  assert.match(gearDisplaySource, /function getProductVolume/);
  assert.match(gearDisplaySource, /function isBackpackProduct/);
  assert.match(gearFormSource, /setVolume\(productVolume \?\? ""\)/);
  assert.match(gearFormSource, /setCapacity\(isBackpackProduct\(product\) \? "" : product\.capacity \?\? ""\)/);
  assert.match(gearDisplaySource, /`\$\{baseName\} \(\$\{productVolume\}\)`/);
  assert.match(gearFormSource, /isBackpackProduct\(product\) \? null : product\.capacity/);
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
