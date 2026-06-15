import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);

test("gear add form exposes a product brand filter beside product search", () => {
  assert.match(gearFormSource, /brandFilter/);
  assert.match(gearFormSource, /ProductFilterChip/);
  assert.match(gearFormSource, /handleBrandFilter\("all"\)/);
  assert.match(gearFormSource, /公式カタログから選択/);
  assert.match(gearFormSource, /productsForBrand/);
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
