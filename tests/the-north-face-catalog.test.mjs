import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/027_the_north_face_official_50_products.sql", import.meta.url),
  "utf8"
);

const productRows = [
  ...migrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (\d+),/g
  )
].map((match) => ({
  model: match[1].replaceAll("''", "'"),
  name_ja: match[2].replaceAll("''", "'"),
  category: match[3],
  subcategory: match[4],
  msrp_jpy: Number(match[5])
}));

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

test("THE NORTH FACE catalog migration imports 50 official verified products", () => {
  assert.equal(productRows.length, 50);
  assert.equal(new Set(productRows.map((row) => row.model)).size, 50);
  assert.deepEqual(countBy(productRows, "category"), {
    backpack: 22,
    shelter: 8,
    rainwear: 5,
    clothing: 15
  });
  assert.deepEqual(countBy(productRows, (row) => `${row.category}/${row.subcategory}`), {
    "backpack/backpack": 22,
    "shelter/tent": 6,
    "shelter/groundsheet": 2,
    "rainwear/rain_jacket": 5,
    "clothing/down_jacket": 1,
    "clothing/insulation": 2,
    "clothing/trekking_pants": 1,
    "clothing/footwear": 11
  });
  assert.ok(productRows.every((row) => row.msrp_jpy > 0));
  assert.match(migrationSource, /date '2026-06-15'/);
  assert.match(migrationSource, /'THE NORTH FACE'/);
  assert.match(migrationSource, /'verified'/);
});

test("THE NORTH FACE catalog keeps official URLs, product images, and required staples", () => {
  const officialUrls = migrationSource.match(
    /https:\/\/www\.goldwin\.co\.jp\/ap\/item\/i\/m\/[A-Z0-9]+/g
  );
  const imageUrls = migrationSource.match(
    /https:\/\/itemimg\.goldwin\.co\.jp\/itemimg\/GDW01\/[^']+?\.jpg/g
  );

  assert.equal(new Set(officialUrls).size, 50);
  assert.equal(new Set(imageUrls).size, 50);

  for (const model of [
    "サム 45",
    "サム 35",
    "テルス45",
    "テルス35",
    "サミットAMK55",
    "サミットAMK40",
    "アークティック48",
    "マウンテンショット1",
    "マウンテンショット2",
    "フットプリント/マウンテンショット1",
    "フットプリント/マウンテンショット2",
    "マウンテングローリー1",
    "サミットAMKスーパーライトー1"
  ]) {
    assert.ok(productRows.some((row) => row.model === model), `${model} missing`);
  }
});

test("THE NORTH FACE catalog adds only display subcategories needed by these products", () => {
  assert.match(migrationSource, /\('shelter', 'グラウンドシート', 'groundsheet', 30\)/);
  assert.match(migrationSource, /\('clothing', 'フットウェア', 'footwear', 70\)/);
  assert.match(
    migrationSource,
    /\('clothing', 'トレッキングパンツ', 'trekking_pants', 80\)/
  );
  assert.match(migrationSource, /\('rainwear', 'レインジャケット', 'rain_jacket', 10\)/);
});
