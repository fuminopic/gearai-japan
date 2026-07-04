import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/049_safety_essentials_catalog_candidates.sql",
    import.meta.url
  ),
  "utf8"
);

const expectedModels = [
  "アルミホイッスル S",
  "エマージェンシーシート",
  "トレッキングベル サイレント",
  "フロンティアーズマン マックス ベアスプレー234mL",
  "O.D.トイレキット"
];

const expectedSubcategories = [
  "whistle",
  "emergency_sheet",
  "bear_bell",
  "bear_spray",
  "portable_toilet"
];

const expectedAliases = [
  "ホイッスル",
  "笛",
  "whistle",
  "aluminum whistle",
  "エマージェンシーシート",
  "サバイバルシート",
  "emergency sheet",
  "emergency blanket",
  "survival sheet",
  "熊鈴",
  "クマ鈴",
  "トレッキングベル",
  "bear bell",
  "trekking bell",
  "熊スプレー",
  "クマよけスプレー",
  "熊よけスプレー",
  "bear spray",
  "Frontiersman Max Bear Spray",
  "携帯トイレ",
  "O.D.トイレキット",
  "portable toilet",
  "toilet kit"
];

test("safety essentials catalog candidates add the five requested product rows", () => {
  assert.match(migrationSource, /insert into public\.gear_products/);

  for (const model of expectedModels) {
    assert.ok(migrationSource.includes(model), `${model} missing`);
  }

  for (const subcategory of expectedSubcategories) {
    assert.ok(migrationSource.includes(`'${subcategory}'`), `${subcategory} missing`);
  }
});

test("safety essentials catalog candidates remain visible needs_review entries without images", () => {
  assert.doesNotMatch(migrationSource, /TODO_CONFIRM_OFFICIAL_IMAGE_URL/);
  assert.equal([...migrationSource.matchAll(/'needs_review'/g)].length, 5);
  assert.equal([...migrationSource.matchAll(/,\s*null,\s*'needs_review'\s*\)/g)].length, 5);
  assert.match(migrationSource, /v\.image_url/);
  assert.match(migrationSource, /image_url = excluded\.image_url/);
  assert.doesNotMatch(migrationSource, /verification_status\s*=\s*'verified'/);
});

test("safety essentials catalog candidates insert search aliases", () => {
  assert.match(migrationSource, /insert into public\.gear_product_aliases/);

  for (const alias of expectedAliases) {
    assert.ok(migrationSource.includes(`'${alias}'`), `${alias} missing`);
  }

  assert.match(migrationSource, /where not exists \(/);
  assert.match(migrationSource, /lower\(existing\.alias\) = lower\(v\.alias\)/);
});

test("safety essentials catalog candidates stay catalog-only", () => {
  assert.doesNotMatch(migrationSource, /\buser_gear\b/i);
  assert.doesNotMatch(migrationSource, /\balter table\b/i);
  assert.doesNotMatch(migrationSource, /\bcreate policy\b/i);
  assert.doesNotMatch(migrationSource, /\bdrop policy\b/i);
  assert.doesNotMatch(migrationSource, /\benable row level security\b/i);
  assert.doesNotMatch(migrationSource, /\bdelete from\b/i);
  assert.doesNotMatch(migrationSource, /\btruncate\b/i);
});
