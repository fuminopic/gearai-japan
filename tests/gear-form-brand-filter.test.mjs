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

test("gear add form replaces scanning shortcuts with manual registration and photo upload", () => {
  assert.match(gearFormSource, /手入力で登録/);
  assert.match(gearFormSource, /manualEntryRef/);
  assert.match(gearFormSource, /scrollIntoView/);
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
  assert.match(gearFormSource, /SelectedProductPreview/);
  assert.match(gearFormSource, /compareProductPickerItems/);
  assert.match(gearFormSource, /のカテゴリー/);
  assert.match(gearFormSource, /該当する製品はありません/);
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
    assert.match(gearFormSource, new RegExp(`"${brand}"`));
  }

  assert.match(gearFormSource, /compareProductBrands/);
});
