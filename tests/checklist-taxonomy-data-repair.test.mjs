import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/050_taxonomy_data_repair_checklist_addability.sql",
    import.meta.url
  ),
  "utf8"
);

test("checklist taxonomy repair adds the missing other subcategories", () => {
  assert.ok(
    migrationSource.includes("('other', 'アイゼン', 'crampons', 52)"),
    "other/crampons subcategory is missing"
  );
  assert.ok(
    migrationSource.includes("('other', '渡渉用シューズ', 'water_shoes', 55)"),
    "other/water_shoes subcategory is missing"
  );
  assert.match(migrationSource, /on conflict \(category_id, name_en\) do update/i);
});

test("checklist taxonomy repair moves only the known Black Diamond crampons", () => {
  for (const model of [
    "コンタクト ストラップ",
    "セラック ストラップ",
    "セラック クリップ",
    "セイバートゥース プロ",
    "サイボーグ プロ",
    "ネーベ プロ",
    "ネーベ ストラップ"
  ]) {
    assert.ok(migrationSource.includes(`'${model}'`), `${model} is not listed`);
  }

  assert.match(migrationSource, /where brand = 'Black Diamond'[\s\S]*and model in \(/);
  assert.match(migrationSource, /subcategory_id = crampons_sub_id/);
  assert.doesNotMatch(migrationSource, /'チェーンスパイク'/);
  assert.doesNotMatch(migrationSource, /'L\.W\.チェーンスパイク'/);
});

test("checklist taxonomy repair moves screen tap liners back to gloves", () => {
  for (const model of [
    "ライトウェイト スクリーンタップライナー",
    "ミッドウェイト スクリーンタップライナー",
    "ヘビーウェイト スクリーンタップライナー"
  ]) {
    assert.ok(migrationSource.includes(`'${model}'`), `${model} is not listed`);
  }

  assert.match(migrationSource, /subcategory_id = gloves_sub_id/);
  assert.match(migrationSource, /and category_id = sleep_id/);
  assert.match(migrationSource, /and subcategory_id = inner_sheet_sub_id/);
});

test("checklist taxonomy repair moves the pack liner out of inner sheets", () => {
  assert.match(migrationSource, /where brand = '山と道'/);
  assert.match(migrationSource, /and model = 'Pack Liner \(3pcs\.\)'/);
  assert.match(migrationSource, /subcategory_id = other_sub_id/);
  assert.match(migrationSource, /Required subcategory other\/other is missing/);
});

test("checklist taxonomy repair stays scoped to catalog taxonomy data", () => {
  assert.doesNotMatch(migrationSource, /user_gear/i);
  assert.doesNotMatch(migrationSource, /insert\s+into\s+public\.gear_products/i);
  assert.doesNotMatch(migrationSource, /gear_product_aliases/i);
  assert.doesNotMatch(migrationSource, /verification_status/i);
  assert.doesNotMatch(migrationSource, /create\s+table|alter\s+table|drop\s+table/i);
  assert.doesNotMatch(migrationSource, /policy|row level security|enable rls/i);
});
