import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const gearMajorCategoriesSource = readFileSync(
  new URL("../src/lib/gear-major-categories.ts", import.meta.url),
  "utf8"
);

test("retail gear categories use shop-friendly labels and avoid sleeping bag clothing regressions", () => {
  for (const label of [
    "ウェア",
    "ザック",
    "シューズ",
    "テント・シュラフ",
    "クッキング",
    "安全・ナビ"
  ]) {
    assert.match(gearMajorCategoriesSource, new RegExp(label));
  }

  assert.match(gearMajorCategoriesSource, /subcategoryAliases:[\s\S]*"sleeping_bag"/);
  assert.match(gearMajorCategoriesSource, /for \(const category of MAJOR_GEAR_CATEGORIES\)[\s\S]*subcategoryAliases/);
  assert.match(gearMajorCategoriesSource, /for \(const category of MAJOR_GEAR_CATEGORIES\)[\s\S]*categoryAliases/);
  assert.match(gearMajorCategoriesSource, /for \(const category of MAJOR_GEAR_CATEGORIES\)[\s\S]*textHints/);
  assert.ok(
    gearMajorCategoriesSource.indexOf("subcategoryAliases") <
      gearMajorCategoriesSource.indexOf("textHints.some"),
    "subcategory matching must run before text hints so Down Hugger sleeping bags do not match clothing"
  );
});
