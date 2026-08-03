import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

const source = readFileSync(
  new URL("../src/lib/gear-picker-product.ts", import.meta.url),
  "utf8"
);
const compiled = transpileModule(source, {
  compilerOptions: {
    module: ModuleKind.ESNext,
    target: ScriptTarget.ES2022
  }
}).outputText;
const { getGearPickerCategoryLabel, normalizeGearPickerProduct } = await import(
  `data:text/javascript,${encodeURIComponent(compiled)}`
);

const category = { id: "backpack", name_ja: "ザック", name_en: "backpack" };
const subcategory = { id: "pack", name_ja: "バックパック", name_en: "pack" };

function productWithRelations(relations) {
  return {
    id: "product-1",
    brand: "Montbell",
    model: "sample",
    name_ja: "サンプル",
    category_id: "backpack",
    subcategory_id: "pack",
    weight_grams: null,
    official_weight_grams: null,
    msrp_jpy: null,
    size: null,
    volume: null,
    color: null,
    material: null,
    capacity: null,
    official_url: null,
    image_url: null,
    gear_product_aliases: [],
    ...relations
  };
}

test("picker preserves PostgREST's singular category and subcategory objects", () => {
  const product = normalizeGearPickerProduct(
    productWithRelations({
      gear_categories: category,
      gear_subcategories: subcategory
    })
  );

  assert.deepEqual(product.gear_categories, category);
  assert.deepEqual(product.gear_subcategories, subcategory);
});

test("picker keeps compatibility with an older array-shaped relation response", () => {
  const product = normalizeGearPickerProduct(
    productWithRelations({
      gear_categories: [category],
      gear_subcategories: [subcategory]
    })
  );

  assert.deepEqual(product.gear_categories, category);
  assert.deepEqual(product.gear_subcategories, subcategory);
});

test("picker preserves the Other fallback only for genuinely missing relations", () => {
  const product = normalizeGearPickerProduct(
    productWithRelations({
      gear_categories: null,
      gear_subcategories: null
    })
  );

  assert.equal(product.gear_categories, null);
  assert.equal(product.gear_subcategories, null);
  assert.equal(getGearPickerCategoryLabel(product), "その他");
});

test("picker exposes unique real category labels and counts after a brand switch", () => {
  const backpack = normalizeGearPickerProduct(
    productWithRelations({
      gear_categories: category,
      gear_subcategories: subcategory
    })
  );
  const clothing = normalizeGearPickerProduct({
    ...productWithRelations({
      gear_categories: {
        id: "clothing",
        name_ja: "ウェア",
        name_en: "clothing"
      },
      gear_subcategories: {
        id: "rainwear",
        name_ja: "レインウェア",
        name_en: "rainwear"
      }
    }),
    id: "product-2",
    brand: "Black Diamond",
    category_id: "clothing"
  });
  const products = [backpack, clothing];
  const categoryCounts = new Map();

  for (const product of products) {
    const label = getGearPickerCategoryLabel(product);
    categoryCounts.set(label, (categoryCounts.get(label) ?? 0) + 1);
  }

  assert.deepEqual([...categoryCounts.entries()], [
    ["ザック", 1],
    ["ウェア", 1]
  ]);
  assert.equal(getGearPickerCategoryLabel(backpack), "ザック");
});
