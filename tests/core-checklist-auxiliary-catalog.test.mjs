import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/041_core_checklist_auxiliary_catalog_followup.sql",
    import.meta.url
  ),
  "utf8"
);

test("auxiliary checklist catalog adds the remaining high-frequency checklist subcategories", () => {
  for (const expected of [
    "('clothing', '帽子', 'hat', 85)",
    "('clothing', 'サングラス', 'sunglasses', 88)",
    "('clothing', 'ゲイター', 'gaiters', 90)",
    "('electronics', '地図', 'map', 40)",
    "('electronics', 'コンパス', 'compass', 50)",
    "('electronics', '予備電池', 'spare_battery', 60)",
    "('first_aid', 'ホイッスル', 'whistle', 20)",
    "('first_aid', 'エマージェンシーシート', 'emergency_sheet', 30)",
    "('first_aid', '携帯トイレ', 'portable_toilet', 40)",
    "('shelter', 'ペグ', 'pegs', 40)",
    "('sleep', 'インナーシーツ', 'inner_sheet', 40)",
    "('other', '洗面用品', 'toiletries', 60)",
    "('other', '耳栓', 'earplugs', 70)"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("auxiliary checklist catalog repairs old product and user gear classification by user wording", () => {
  for (const expected of [
    "hat_sub_id",
    "sunglasses_sub_id",
    "gaiters_sub_id",
    "map_sub_id",
    "compass_sub_id",
    "spare_battery_sub_id",
    "whistle_sub_id",
    "emergency_sheet_sub_id",
    "portable_toilet_sub_id",
    "pegs_sub_id",
    "inner_sheet_sub_id",
    "toiletries_sub_id",
    "earplugs_sub_id"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }

  assert.match(migrationSource, /帽子\|キャップ\|ビーニー\|バラクラバ/);
  assert.match(migrationSource, /sunglasses\|sun glasses\|サングラス/);
  assert.match(migrationSource, /gaiter\|gaiters\|ゲイター\|スパッツ/);
  assert.match(migrationSource, /map\|compass\|地図\|山と高原地図\|コンパス/);
  assert.match(migrationSource, /spare battery\|battery set\|予備電池\|乾電池\|電池/);
  assert.match(migrationSource, /ホイッスル\|笛\|エマージェンシーシート\|サバイバルシート\|携帯トイレ/);
  assert.match(migrationSource, /peg\|stake\|ペグ/);
  assert.match(migrationSource, /inner sheet\|liner\|インナーシーツ\|シュラフシーツ\|ライナー/);
  assert.match(migrationSource, /toiletries\|toothbrush\|soap\|earplug\|洗面\|歯ブラシ\|石けん\|耳栓/);
});

test("auxiliary checklist catalog keeps the scope at data normalization only", () => {
  assert.doesNotMatch(migrationSource, /insert into public\.gear_products/i);
  assert.doesNotMatch(migrationSource, /purchase|shopping|recommend|openai|chat\.completions/i);
  assert.match(migrationSource, /date '2026-06-21'/);
});
