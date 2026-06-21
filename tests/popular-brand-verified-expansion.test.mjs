import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/047_popular_brand_verified_catalog_expansion.sql", import.meta.url),
  "utf8"
);

const verifiedProductPattern =
  /\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*'([^']+)',\s*'([^']+)'\s*\)/g;

const verifiedRows = [...migrationSource.matchAll(verifiedProductPattern)].map((match) => ({
  brand: match[1].replaceAll("''", "'"),
  model: match[2].replaceAll("''", "'"),
  nameJa: match[3].replaceAll("''", "'"),
  category: match[4],
  subcategory: match[5],
  officialWeightGrams: Number(match[6]),
  msrpJpy: Number(match[7]),
  size: parseNullable(match[8]),
  volume: parseNullable(match[9]),
  capacity: parseNullable(match[10]),
  officialUrl: match[11],
  imageUrl: match[12]
}));

function parseNullable(value) {
  return value === "null" ? null : value.slice(1, -1).replaceAll("''", "'");
}

test("popular brand verified expansion adds the next clean official batch", () => {
  assert.deepEqual(
    verifiedRows.map((row) => `${row.brand} ${row.model}`),
    [
      "MILLET SAAS FEE NX 30+5",
      "MILLET KULA 30",
      "MILLET Drynamic Mesh NS",
      "MILLET Wanaka Stretch Pants",
      "Columbia Castle Rock 25L Backpack II"
    ]
  );

  for (const row of verifiedRows) {
    assert.ok(row.officialWeightGrams > 0, `${row.model} missing official weight`);
    assert.ok(row.msrpJpy > 0, `${row.model} missing official price`);
    assert.ok(row.officialUrl.startsWith("https://"), `${row.model} missing official URL`);
    assert.ok(row.imageUrl.startsWith("https://"), `${row.model} missing image URL`);
  }
});

test("popular brand verified expansion uses clean official image source domains", () => {
  const allowedDomains = new Set(["milletonline.itembox.cloud", "www.columbiasports.co.jp"]);
  const forbiddenPatterns = [
    /rakuten/i,
    /r10s/i,
    /amazon/i,
    /shopping\.c\.yimg/i,
    /thumbnail/i,
    /search/i,
    /banner/i,
    /promo/i,
    /coordinate/i,
    /lifestyle/i,
    /watermark/i,
    /collage/i,
    /sw=256/i,
    /w_380\.h_380/i
  ];

  for (const row of verifiedRows) {
    assert.ok(allowedDomains.has(new URL(row.imageUrl).host), `${row.model} image host not allowed`);
    for (const pattern of forbiddenPatterns) {
      assert.doesNotMatch(row.imageUrl, pattern, `${row.model} has low-quality image URL`);
    }
  }
});

test("popular brand verified expansion remains catalog-only", () => {
  assert.match(migrationSource, /insert into public\.gear_products/);
  assert.match(migrationSource, /insert into public\.gear_product_aliases/);
  assert.doesNotMatch(migrationSource, /requirement/i);
  assert.doesNotMatch(migrationSource, /recommendation/i);
  assert.doesNotMatch(migrationSource, /trip_plans/i);
  assert.doesNotMatch(migrationSource, /pack_requirement/i);
  assert.doesNotMatch(migrationSource, /delete from public\.gear_products/i);
  assert.doesNotMatch(migrationSource, /truncate/i);
});
