import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/029_black_diamond_official_50_products.sql",
    import.meta.url
  ),
  "utf8"
);
const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);
const labelSource = readFileSync(
  new URL("../src/lib/i18n/labels.ts", import.meta.url),
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

test("Black Diamond catalog migration imports 50 official verified products", () => {
  assert.equal(productRows.length, 50);
  assert.equal(new Set(productRows.map((row) => row.model)).size, 50);
  assert.deepEqual(countBy(productRows, "category"), {
    electronics: 8,
    other: 34,
    backpack: 8
  });
  assert.deepEqual(countBy(productRows, (row) => `${row.category}/${row.subcategory}`), {
    "electronics/headlamp": 8,
    "other/trekking_pole": 8,
    "other/helmet": 6,
    "other/ice_axe": 5,
    "other/traction_device": 7,
    "other/gloves": 8,
    "backpack/backpack": 8
  });
  assert.ok(productRows.every((row) => row.official_weight_grams > 0));
  assert.ok(productRows.every((row) => row.msrp_jpy > 0));
  assert.match(migrationSource, /date '2026-06-15'/);
  assert.match(migrationSource, /'Black Diamond'/);
  assert.match(migrationSource, /'verified'/);
});

test("Black Diamond catalog keeps Lost Arrow official URLs, product images, and staples", () => {
  const officialUrls = migrationSource.match(
    /https:\/\/www\.lostarrow\.co\.jp\/store\/g\/gBD[0-9A-Z]+\//g
  );
  const imageUrls = migrationSource.match(
    /https:\/\/www\.lostarrow\.co\.jp\/img\/goods\/S\/BD[0-9A-Z]+_S\.webp/g
  );

  assert.equal(new Set(officialUrls).size, 50);
  assert.equal(new Set(imageUrls).size, 50);

  for (const model of [
    "スポット400",
    "ストーム500-R",
    "ディスタンスZ",
    "ベイパー",
    "ハーフドーム",
    "レイブン",
    "ベノム アッズ",
    "コンタクト ストラップ",
    "ネーベ プロ",
    "ソロイストグローブ",
    "ミッション55",
    "ブリッツ28"
  ]) {
    assert.ok(productRows.some((row) => row.model === model), `${model} missing`);
  }
});

test("Black Diamond migration preserves matching-compatible catalog categories", () => {
  assert.match(migrationSource, /\('other', 'ヘルメット', 'helmet', 35\)/);
  assert.match(migrationSource, /\('other', 'ピッケル', 'ice_axe', 45\)/);
  assert.match(
    migrationSource,
    /\('other', '軽アイゼン・チェーンスパイク', 'traction_device', 50\)/
  );
  assert.match(migrationSource, /set model = 'スポット400'/);
  assert.match(migrationSource, /where brand = 'Black Diamond'\s+and model = 'Spot 400'/);
});

test("product picker search covers Black Diamond brand, family, model code, and category terms", () => {
  for (const expected of [
    "BlackDiamond",
    "ブラックダイヤモンド",
    "BD",
    "Distance",
    "Spot",
    "Storm",
    "Trail Vista",
    "Half Dome",
    "Raven",
    "Venom",
    "Crampon",
    "Mission",
    "Blitz",
    "gearSubcategoryLabels"
  ]) {
    assert.ok(gearFormSource.includes(expected), `${expected} missing`);
  }

  assert.ok(migrationSource.includes("'BD81308001'"));
  assert.ok(migrationSource.includes("'BD33065'"));
  assert.match(labelSource, /ice_axe: "ピッケル"/);
});
