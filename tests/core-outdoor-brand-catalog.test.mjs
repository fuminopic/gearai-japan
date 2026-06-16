import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/033_core_outdoor_brand_products.sql", import.meta.url),
  "utf8"
);
const cleanupMigrationSource = readFileSync(
  new URL("../supabase/migrations/034_gear_catalog_search_and_image_cleanup.sql", import.meta.url),
  "utf8"
);
const qualityFollowupMigrationSource = readFileSync(
  new URL("../supabase/migrations/035_gear_catalog_quality_followup.sql", import.meta.url),
  "utf8"
);
const restoreTnfFootprintsMigrationSource = readFileSync(
  new URL("../supabase/migrations/036_restore_tnf_required_footprints.sql", import.meta.url),
  "utf8"
);
const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);

const productRows = [
  ...migrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (\d+), (null|\d+),/g
  )
].map((match) => ({
  brand: match[1].replaceAll("''", "'"),
  model: match[2].replaceAll("''", "'"),
  name_ja: match[3].replaceAll("''", "'"),
  category: match[4],
  subcategory: match[5],
  official_weight_grams: Number(match[6]),
  msrp_jpy: match[7] === "null" ? null : Number(match[7])
}));

const insertRows = productRows.filter((row) =>
  ["山と道", "finetrack", "Caravan", "Osprey", "Petzl"].includes(row.brand)
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
  .filter((row) =>
    ["山と道", "finetrack", "Caravan", "Osprey", "Petzl", "Garmin", "EVERNEW"].includes(row.brand)
  );

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

test("core outdoor brand catalog imports verified staple products by brand", () => {
  assert.equal(insertRows.length, 41);
  assert.equal(new Set(insertRows.map((row) => `${row.brand}/${row.model}`)).size, 41);
  assert.deepEqual(countBy(insertRows, "brand"), {
    "山と道": 12,
    finetrack: 10,
    Caravan: 5,
    Osprey: 8,
    Petzl: 6
  });
  assert.match(migrationSource, /date '2026-06-16'/);
  assert.match(migrationSource, /'verified'/);
});

test("core outdoor brand catalog keeps matching-compatible categories", () => {
  assert.deepEqual(countBy(insertRows, (row) => `${row.category}/${row.subcategory}`), {
    "backpack/backpack": 12,
    "other/other": 4,
    "clothing/base_layer": 1,
    "clothing/rain_jacket": 2,
    "clothing/insulation": 1,
    "shelter/tent": 5,
    "shelter/tarp": 5,
    "clothing/footwear": 5,
    "electronics/headlamp": 6
  });
  assert.ok(!migrationSource.includes("Mountain Shot 2"));
});

test("core outdoor catalog rows include official images and safe weights", () => {
  assert.equal(insertRows.filter((row) => row.official_weight_grams <= 0).length, 0);

  for (const expected of [
    "https://cdns3.yamatomichi.com/wp-content/uploads/2024/08/2026_MINI_Blue-Spruce.jpg",
    "https://www.finetrack.com/assets/img/products/kamina-dome/im-sec1-02.jpg?v2",
    "https://caravan.itembox.cloud/product/000/000000000007/000000000007-01.jpg",
    "https://www.lostarrow.co.jp/img/goods/S/OS50382002_S.webp",
    "https://www.petzl.com/sfc/servlet.shepherd/version/download/068Tx000006KwpEIAS"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("core outdoor backpack volumes are stored as volume instead of capacity", () => {
  for (const expected of [
    "'山と道', 'MINI2', 'MINI2', 'backpack', 'backpack', 413, 36000, null, '25-35L', null, null, null",
    "'Osprey', 'ケストレル48', 'ケストレル48', 'backpack', 'backpack', 2010, 37400, 'S/M=2.01kg', '46-48L', null, null, null",
    "'Osprey', 'テンペストベロシティ20', 'テンペストベロシティ20', 'backpack', 'backpack', 820, 30800, 'WXS/S', '18-20L', null, null, null"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("catalog cleanup migration fixes existing backpack volume and product images", () => {
  assert.match(cleanupMigrationSource, /backpack_volume_fixes/);
  assert.match(cleanupMigrationSource, /\('山と道', 'MINI2', '25-35L'\)/);
  assert.match(cleanupMigrationSource, /\('Osprey', 'ケストレル48', '46-48L'\)/);
  assert.match(cleanupMigrationSource, /capacity = null/);
  assert.match(cleanupMigrationSource, /soto_image_fixes/);
  assert.match(cleanupMigrationSource, /SOD-310_01-1-550x826\.jpg/);
  assert.match(cleanupMigrationSource, /ST-340_01-2-550x413\.jpg/);
});

test("catalog cleanup migration hides old active products without product images", () => {
  for (const expected of [
    "('Durston', 'X-Mid 1 Solid')",
    "('EVERNEW', 'Ti 570FD Cup')",
    "('Garmin', 'eTrex SE')",
    "('Hyperlite Mountain Gear', 'Southwest 55')",
    "('mont-bell', 'Alpine Down Parka')",
    "('mont-bell', 'Down Hugger 800 #3')",
    "('Nalgene', 'Wide Mouth 1.0L')",
    "('NEMO', 'Tensor Trail Regular')",
    "('YAMAP', 'Basic First Aid Kit')"
  ]) {
    assert.ok(cleanupMigrationSource.includes(expected), `${expected} missing`);
  }

  assert.match(cleanupMigrationSource, /discontinued = true/);
  assert.match(cleanupMigrationSource, /verification_status = 'needs_review'/);
  assert.match(cleanupMigrationSource, /nullif\(btrim\(p\.image_url\), ''\) is null/);
});

test("catalog quality follow-up normalizes remaining backpack liters and missing weights", () => {
  assert.match(qualityFollowupMigrationSource, /c\.name_en = 'backpack'/);
  assert.match(qualityFollowupMigrationSource, /set volume = coalesce\(p\.volume, p\.capacity\)/);
  assert.match(qualityFollowupMigrationSource, /and p\.capacity ~ '\[0-9\]\.\*L'/);
  assert.match(qualityFollowupMigrationSource, /model = 'レベル8 -13 オーロラテックス ライト'/);
  assert.match(qualityFollowupMigrationSource, /official_weight_grams = 1260/);
  assert.match(qualityFollowupMigrationSource, /missing_weight_catalog_cleanup/);
  assert.match(qualityFollowupMigrationSource, /'THE NORTH FACE', 'サミットAMKアサルト2'/);
  assert.doesNotMatch(qualityFollowupMigrationSource, /'THE NORTH FACE', 'フットプリント\/マウンテンショット1'/);
  assert.doesNotMatch(qualityFollowupMigrationSource, /'THE NORTH FACE', 'フットプリント\/マウンテンショット2'/);
  assert.match(qualityFollowupMigrationSource, /discontinued = true/);
  assert.match(qualityFollowupMigrationSource, /verification_status = 'needs_review'/);
});

test("TNF required footprints stay searchable even when official weight is unpublished", () => {
  assert.match(restoreTnfFootprintsMigrationSource, /discontinued = false/);
  assert.match(restoreTnfFootprintsMigrationSource, /verification_status = 'needs_review'/);
  assert.match(restoreTnfFootprintsMigrationSource, /フットプリント\/マウンテンショット1/);
  assert.match(restoreTnfFootprintsMigrationSource, /フットプリント\/マウンテンショット2/);
  assert.match(restoreTnfFootprintsMigrationSource, /image_url is not null/);
  assert.match(restoreTnfFootprintsMigrationSource, /official_url is not null/);
});

test("core outdoor catalog covers key Japanese, English, and model aliases", () => {
  assert.equal(new Set(aliasRows.map((row) => row.alias.toLocaleLowerCase())).size, aliasRows.length);

  for (const expected of [
    "Yamatomichi MINI2",
    "山道 MINI2",
    "KAMINA DOME 2",
    "FAG0312",
    "Pico Shelter",
    "C1_02S",
    "GRANDKING GK8X FFF",
    "Kestrel 48",
    "Talon Velocity 20",
    "アクティック コア",
    "ガーミン eTrex SE",
    "EBY274"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("product picker search includes core brand and family aliases", () => {
  for (const expected of [
    "ファイントラック",
    "Yamatomichi",
    "キャラバン",
    "オスプレー",
    "ペツル",
    "エバニュー",
    "アライテント",
    "エムエスアール",
    "ガーミン",
    "サロモン",
    "Kamina Dome",
    "Zelt",
    "GRANDKING GK85",
    "Kestrel",
    "ACTIK",
    "eTrex SE"
  ]) {
    assert.ok(gearFormSource.includes(expected), `${expected} missing`);
  }
});
