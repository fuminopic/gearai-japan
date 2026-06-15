import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/031_sleep_system_official_products.sql",
    import.meta.url
  ),
  "utf8"
);
const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);

const productRows = [
  ...migrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (null|\d+), (null|\d+),/g
  )
].map((match) => ({
  brand: match[1].replaceAll("''", "'"),
  model: match[2].replaceAll("''", "'"),
  name_ja: match[3].replaceAll("''", "'"),
  category: match[4],
  subcategory: match[5],
  official_weight_grams: match[6] === "null" ? null : Number(match[6]),
  msrp_jpy: match[7] === "null" ? null : Number(match[7])
}));

const insertRows = productRows.filter((row) =>
  ["NANGA", "ISUKA", "NEMO", "Therm-a-Rest"].includes(row.brand)
);

const aliasRows = [
  ...migrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)'\)/g
  )
]
  .map((match) => ({
    brand: match[1].replaceAll("''", "'"),
    model: match[2].replaceAll("''", "'"),
    alias: match[3].replaceAll("''", "'")
  }))
  .filter((row) => ["NANGA", "ISUKA", "NEMO", "Therm-a-Rest"].includes(row.brand));

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

test("sleep system catalog imports verified staple products by brand", () => {
  assert.equal(insertRows.length, 45);
  assert.equal(new Set(insertRows.map((row) => `${row.brand}/${row.model}`)).size, 45);
  assert.deepEqual(countBy(insertRows, "brand"), {
    NANGA: 12,
    ISUKA: 12,
    NEMO: 12,
    "Therm-a-Rest": 9
  });
  assert.match(migrationSource, /date '2026-06-15'/);
  assert.match(migrationSource, /'verified'/);
});

test("sleep system catalog keeps matching-compatible categories", () => {
  assert.deepEqual(countBy(insertRows, (row) => `${row.category}/${row.subcategory}`), {
    "sleep/sleeping_bag": 24,
    "sleep/sleeping_pad": 13,
    "sleep/pillow": 3,
    "shelter/tent": 5
  });
  assert.ok(!migrationSource.includes("'sleeping_bag', 360"));
  assert.ok(!migrationSource.includes("シュラフカバー ウルトラライト', 'sleep'"));
});

test("official catalog rows include images and safe weights", () => {
  const shopifyImageCount = new Set(
    migrationSource.match(/https:\/\/cdn\.shopify\.com\/s\/files\/[^']+/g)
  ).size;
  const isukaImageCount = new Set(
    migrationSource.match(/https:\/\/www\.isuka\.co\.jp\/upload\/product\/main_image\d+\.png/g)
  ).size;

  assert.equal(shopifyImageCount, 33);
  assert.equal(isukaImageCount, 12);
  assert.equal(insertRows.filter((row) => row.official_weight_grams === null).length, 1);
  assert.equal(
    insertRows.filter((row) => row.brand === "Therm-a-Rest" && row.msrp_jpy === null).length,
    9
  );
});

test("sleep system catalog covers key Japanese, English, and model-code aliases", () => {
  assert.equal(new Set(aliasRows.map((row) => row.alias.toLocaleLowerCase())).size, aliasRows.length);

  for (const expected of [
    "AURORA TEX LIGHT 450DX",
    "UDD BAG 450DX",
    "NS2244-2A016018071",
    "Air Dryght 480",
    "Alpha Light NEO 300",
    "Tensor Trail",
    "テンサー トレイル",
    "Fillo Pillow",
    "Dragonfly OSMO 2P",
    "NeoAir XLite NXT",
    "Zライトソル",
    "14010"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("product picker search includes sleep system brand and family aliases", () => {
  for (const expected of [
    "ナンガ",
    "イスカ",
    "ニーモ",
    "サーマレスト",
    "Aurora Tex",
    "UDD BAG",
    "Air Dryght",
    "Tensor",
    "Fillo",
    "枕",
    "Dragonfly OSMO",
    "NeoAir",
    "RidgeRest"
  ]) {
    assert.ok(gearFormSource.includes(expected), `${expected} missing`);
  }
});
