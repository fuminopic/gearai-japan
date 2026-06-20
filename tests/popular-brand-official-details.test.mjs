import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/044_popular_brand_catalog_official_details.sql", import.meta.url),
  "utf8"
);

const verifiedProductPattern =
  /\(\s*'Mammut',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)'\s*\)/g;

const verifiedRows = [...migrationSource.matchAll(verifiedProductPattern)].map((match) => ({
  model: match[1],
  nameJa: match[2],
  officialWeightGrams: Number(match[3]),
  msrpJpy: Number(match[4]),
  size: match[5],
  volume: match[6],
  capacity: match[7],
  officialUrl: match[8],
  imageUrl: match[9]
}));

test("popular brand official detail follow-up keeps the rain pants backfill repeatable", () => {
  assert.match(migrationSource, /'レインパンツ', 'rain_pants'/);
  assert.match(migrationSource, /'MILLET', 'TYPHON 50000 Stretch Pants'/);
  assert.match(migrationSource, /'patagonia', 'Torrentshell 3L Pants'/);
  assert.match(migrationSource, /on conflict \(category_id, name_en\) do update/);
});

test("popular brand official detail follow-up only verifies sourced Mammut Lithium rows", () => {
  assert.deepEqual(
    verifiedRows.map((row) => row.model),
    ["Lithium 20", "Lithium 25", "Lithium 30"]
  );

  assert.deepEqual(
    verifiedRows.map((row) => row.officialWeightGrams),
    [710, 840, 910]
  );

  assert.deepEqual(
    verifiedRows.map((row) => row.msrpJpy),
    [18700, 19800, 23100]
  );

  for (const row of verifiedRows) {
    assert.match(row.size, /^Women \/ \d+ L$/);
    assert.match(row.officialUrl, /^https:\/\/www\.mammut\.jp\/items\/2530-007/);
    assert.match(row.imageUrl, /^https:\/\/mammt\.store-image\.jp\/img01\/201\/2530-007/);
  }
});

test("popular brand official detail follow-up does not mark the whole P0 import as verified", () => {
  assert.equal(verifiedRows.length, 3);
  assert.match(migrationSource, /'needs_review'/);
  assert.match(migrationSource, /verification_status = 'verified'/);
  assert.match(migrationSource, /else excluded\.verification_status/);
});
