import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/039_core_checklist_gear_catalog_followup.sql",
    import.meta.url
  ),
  "utf8"
);

test("core checklist gear follow-up preserves matching-critical subcategories", () => {
  for (const expected of [
    "('other', 'ボトル', 'bottle', 15)",
    "('other', '浄水フィルター', 'water_filter', 20)",
    "tableware_sub_id",
    "bottle_sub_id",
    "water_filter_sub_id"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }

  assert.match(migrationSource, /c\.name_en = 'hydration'/);
  assert.match(migrationSource, /exists \(\s*select 1\s*from public\.gear_subcategories s\s*where s\.id = p\.subcategory_id\s*and s\.name_en = 'bottle'/);
  assert.match(migrationSource, /exists \(\s*select 1\s*from public\.gear_subcategories s\s*where s\.id = g\.subcategory_id\s*and s\.name_en = 'bottle'/);
  assert.doesNotMatch(migrationSource, /left join public\.gear_subcategories s on s\.id = [pg]\.subcategory_id/);
  assert.match(migrationSource, /nalgene\|bottle\|ボトル\|水筒/);
  assert.match(migrationSource, /spork\|cutlery\|カトラリー\|スプーン\|フォーク\|箸\|食器/);
});

test("core checklist gear follow-up adds only small trusted catalog staples", () => {
  const productRows = [
    ...migrationSource.matchAll(
      /\('([^']+)', '([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+),/g
    )
  ].map((match) => ({
    brand: match[1],
    model: match[2],
    nameJa: match[3],
    category: match[4],
    subcategory: match[5],
    officialWeightGrams: Number(match[6])
  }));

  assert.deepEqual(productRows, [
    {
      brand: "Nalgene",
      model: "32oz Wide Mouth Bottle",
      nameJa: "32oz Wide Mouth Bottle",
      category: "other",
      subcategory: "bottle",
      officialWeightGrams: 177
    },
    {
      brand: "Sawyer",
      model: "Squeeze Water Filter System",
      nameJa: "Squeeze ウォーターフィルターシステム",
      category: "other",
      subcategory: "water_filter",
      officialWeightGrams: 232
    },
    {
      brand: "Snow Peak",
      model: "Titanium Spork",
      nameJa: "チタン先割れスプーン",
      category: "cooking",
      subcategory: "tableware",
      officialWeightGrams: 16
    }
  ]);

  assert.match(migrationSource, /https:\/\/nalgene\.com\/product\/32oz-wide-mouth-bottle\//);
  assert.match(migrationSource, /https:\/\/www\.sawyer\.com\/product\/squeeze-water-filter-system/);
  assert.match(migrationSource, /https:\/\/www\.snowpeak\.com\/products\/titanium-spork/);
  assert.match(migrationSource, /date '2026-06-20'/);
  assert.doesNotMatch(migrationSource, /purchase|shopping|recommend/i);
});

test("core checklist gear follow-up adds user-search aliases for Japanese entry", () => {
  for (const expected of [
    "ナルゲン 1L",
    "広口 1.0L ボトル",
    "Sawyer Squeeze",
    "ソーヤー スクィーズ",
    "浄水フィルター",
    "SCT-004",
    "チタンスポーク",
    "スノーピーク チタン先割れスプーン"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});
