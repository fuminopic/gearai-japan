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
  assert.match(brandLogoSource, /viewBox=/);
  assert.match(brandLogoSource, /thenorthface/);
  assert.match(brandLogoSource, /blackdiamond/);
  assert.match(brandLogoSource, /mont-bell/);
  assert.match(brandLogoSource, /hyperlitemountaingear/);
  assert.match(gearFormSource, /ariaLabel=\{`\$\{item\}を選択`\}/);
});

test("gear add form replaces scanning shortcuts with manual registration and photo upload", () => {
  assert.match(gearFormSource, /カタログにない装備を登録/);
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
  assert.match(gearFormSource, /該当する製品はありません/);
});

test("gear add form treats backpack liters as volume, not people capacity", () => {
  assert.match(gearDisplaySource, /function getProductVolume/);
  assert.match(gearDisplaySource, /function isBackpackProduct/);
  assert.match(gearFormSource, /setVolume\(productVolume \?\? ""\)/);
  assert.match(gearFormSource, /setCapacity\(isBackpackProduct\(product\) \? "" : product\.capacity \?\? ""\)/);
  assert.match(gearDisplaySource, /`\$\{baseName\} \(\$\{productVolume\}\)`/);
  assert.match(gearFormSource, /isBackpackProduct\(product\) \? null : product\.capacity/);
});

test("gear add form keeps common Japanese outdoor brands at the top", () => {
  for (const brand of [
    "mont-bell",
    "THE NORTH FACE",
    "Black Diamond",
    "NANGA",
    "ISUKA",
    "NEMO",
    "Therm-a-Rest",
    "SOTO"
  ]) {
    assert.match(gearDisplaySource, new RegExp(`"${brand}"`));
  }

  assert.match(gearDisplaySource, /compareGearBrands/);
});
