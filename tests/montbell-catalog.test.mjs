import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/025_montbell_official_100_products.sql", import.meta.url),
  "utf8"
);

const productRows = [
  ...migrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (\d+), (\d+),/g
  )
].map((match) => ({
  model: match[1].replaceAll("''", "'"),
  name_ja: match[2].replaceAll("''", "'"),
  category: match[3],
  subcategory: match[4],
  official_weight_grams: Number(match[5]),
  msrp_jpy: Number(match[6])
}));

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

test("mont-bell catalog migration imports 100 official verified products", () => {
  assert.equal(productRows.length, 100);
  assert.equal(new Set(productRows.map((row) => row.model)).size, 100);
  assert.deepEqual(countBy(productRows, "category"), {
    sleep: 23,
    backpack: 13,
    shelter: 12,
    clothing: 25,
    rainwear: 10,
    cooking: 10,
    electronics: 3,
    other: 4
  });
  assert.deepEqual(countBy(productRows, (row) => `${row.category}/${row.subcategory}`), {
    "sleep/sleeping_bag": 18,
    "sleep/sleeping_pad": 5,
    "backpack/backpack": 13,
    "shelter/tent": 10,
    "shelter/tarp": 2,
    "clothing/base_layer": 10,
    "clothing/down_jacket": 6,
    "clothing/insulation": 2,
    "clothing/footwear": 7,
    "rainwear/rain_jacket": 6,
    "rainwear/rain_pants": 4,
    "cooking/cookware": 8,
    "cooking/gas_canister": 2,
    "electronics/headlamp": 3,
    "other/traction_device": 2,
    "other/gloves": 1,
    "other/trekking_pole": 1
  });
  assert.ok(productRows.every((row) => row.official_weight_grams > 0));
  assert.ok(productRows.every((row) => row.msrp_jpy > 0));
  assert.match(migrationSource, /date '2026-06-15'/);
  assert.match(migrationSource, /'verified'/);
});

test("mont-bell catalog migration keeps official URLs and product images", () => {
  const officialUrls = migrationSource.match(
    /https:\/\/webshop\.montbell\.jp\/goods\/disp\.php\?product_id=\d+/g
  );
  const imageUrls = migrationSource.match(
    /https:\/\/webshop\.montbell\.jp\/common\/images\/product\/prod_s\/[^']+/g
  );

  assert.equal(new Set(officialUrls).size, 100);
  assert.equal(new Set(imageUrls).size, 100);
  assert.ok(productRows.some((row) => row.model === "シームレス ダウンハガー800 #0"));
  assert.ok(
    productRows.some((row) => row.model === "ストームクルーザー ジャケット Men's")
  );
  assert.ok(productRows.some((row) => row.model === "ジェットパワー100G"));
  assert.ok(productRows.some((row) => row.model === "アルパイン カーボンポール"));
});

test("mont-bell catalog migration adds required catalog subcategories only", () => {
  assert.match(migrationSource, /\('clothing', 'フットウェア', 'footwear', 70\)/);
  assert.match(migrationSource, /\('other', '手袋', 'gloves', 30\)/);
  assert.match(migrationSource, /\('other', 'トレッキングポール', 'trekking_pole', 40\)/);
  assert.match(
    migrationSource,
    /\('other', '軽アイゼン・チェーンスパイク', 'traction_device', 50\)/
  );
});

test("mont-bell catalog migration retires the old unverified sample product", () => {
  assert.match(migrationSource, /model = 'Storm Cruiser Jacket'/);
  assert.match(migrationSource, /discontinued = true/);
  assert.match(migrationSource, /verification_status = 'needs_review'/);
});
