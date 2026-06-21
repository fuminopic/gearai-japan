import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/046_popular_brand_image_quality_repair.sql",
    import.meta.url
  ),
  "utf8"
);

const verifiedProductPattern =
  /\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*'([^']+)',\s*'([^']+)'\s*\)/g;

const verifiedRows = [...migrationSource.matchAll(verifiedProductPattern)].map(
  (match) => ({
    brand: unescapeSql(match[1]),
    model: unescapeSql(match[2]),
    nameJa: unescapeSql(match[3]),
    category: match[4],
    subcategory: match[5],
    officialWeightGrams: Number(match[6]),
    msrpJpy: Number(match[7]),
    size: parseSqlNullable(match[8]),
    volume: parseSqlNullable(match[9]),
    capacity: parseSqlNullable(match[10]),
    officialUrl: match[11],
    imageUrl: match[12]
  })
);

function unescapeSql(value) {
  return value.replaceAll("''", "'");
}

function parseSqlNullable(value) {
  return value === "null" ? null : unescapeSql(value.slice(1, -1));
}

function countByBrand(rows) {
  return rows.reduce((counts, row) => {
    counts[row.brand] = (counts[row.brand] ?? 0) + 1;
    return counts;
  }, {});
}

test("popular brand image repair first hides temporary low-quality catalog rows", () => {
  for (const brand of [
    "Columbia",
    "MILLET",
    "Arc''teryx",
    "patagonia",
    "GREGORY",
    "LA SPORTIVA",
    "Mammut"
  ]) {
    assert.match(migrationSource, new RegExp(`'${brand}'`));
  }

  assert.match(migrationSource, /discontinued = true/);
  assert.match(migrationSource, /verification_status = 'needs_review'/);
  assert.match(migrationSource, /image_url = null/);
  assert.doesNotMatch(migrationSource, /delete from public\.gear_products/i);
  assert.doesNotMatch(migrationSource, /truncate/i);
});

test("popular brand image repair only restores products with complete clean image data", () => {
  assert.equal(verifiedRows.length, 9);
  assert.deepEqual(countByBrand(verifiedRows), {
    Columbia: 2,
    MILLET: 1,
    patagonia: 2,
    GREGORY: 1,
    Mammut: 3
  });

  for (const row of verifiedRows) {
    assert.ok(row.officialUrl.startsWith("https://"), `${row.model} missing official URL`);
    assert.ok(row.imageUrl.startsWith("https://"), `${row.model} missing image URL`);
    assert.ok(row.officialWeightGrams > 0, `${row.model} missing official weight`);
    assert.ok(row.msrpJpy > 0, `${row.model} missing official price`);
  }
});

test("popular brand image repair uses only approved clean image source domains", () => {
  const allowedDomains = new Set([
    "www.columbiasports.co.jp",
    "milletonline.itembox.cloud",
    "edge.dis.commercecloud.salesforce.com",
    "www.gregory.jp",
    "mammt.store-image.jp"
  ]);

  for (const row of verifiedRows) {
    const host = new URL(row.imageUrl).host;
    assert.ok(allowedDomains.has(host), `${row.model} uses non-approved image host ${host}`);
  }
});

test("popular brand image repair blocks search thumbnails, promo assets, and tiny image variants", () => {
  const forbiddenUrlPatterns = [
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
    for (const pattern of forbiddenUrlPatterns) {
      assert.doesNotMatch(row.imageUrl, pattern, `${row.model} has low-quality image URL`);
    }
  }
});

test("popular brand image repair documents brands held back until clean official images exist", () => {
  assert.ok(!verifiedRows.some((row) => row.brand === "Arc'teryx"));
  assert.ok(!verifiedRows.some((row) => row.brand === "LA SPORTIVA"));
  assert.match(migrationSource, /Arc''teryx/);
  assert.match(migrationSource, /LA SPORTIVA/);
});
