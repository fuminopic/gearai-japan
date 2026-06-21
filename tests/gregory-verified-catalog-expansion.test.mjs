import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cleanImageUrlGrade } from "../scripts/audit-popular-brand-image-candidates.mjs";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/048_gregory_verified_catalog_expansion.sql", import.meta.url),
  "utf8"
);

const verifiedProductPattern =
  /\(\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']*(?:''[^']*)*)',\s*'([^']+)',\s*'([^']+)',\s*(\d+),\s*(\d+),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*'([^']+)',\s*'([^']+)'\s*\)/g;

function parseNullable(value) {
  return value === "null" ? null : value.slice(1, -1).replaceAll("''", "'");
}

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

test("GREGORY expansion restores a full Japanese classic backpack batch", () => {
  assert.equal(verifiedRows.length, 15);
  assert.deepEqual(
    verifiedRows.map((row) => row.model),
    [
      "Zulu 35",
      "Zulu 45",
      "Jade 28",
      "Jade 33",
      "Jade 43",
      "Stout 35",
      "Amber 34",
      "Citro 24",
      "Juno 24",
      "Miko 25",
      "Maya 20",
      "Maya 25",
      "Nano 18",
      "Arrio 24",
      "Arrio 28"
    ]
  );

  for (const row of verifiedRows) {
    assert.equal(row.brand, "GREGORY");
    assert.equal(row.category, "backpack");
    assert.equal(row.subcategory, "backpack");
    assert.ok(row.officialWeightGrams > 0, `${row.model} missing weight`);
    assert.ok(row.msrpJpy > 0, `${row.model} missing price`);
    assert.match(row.volume ?? "", /^\d+L$/);
    assert.match(row.capacity ?? "", /^\d+ L$/);
  }
});

test("GREGORY expansion uses only official shop product pages and clean product images", () => {
  for (const row of verifiedRows) {
    assert.ok(
      row.officialUrl.startsWith("https://item.rakuten.co.jp/gregory-japan/"),
      `${row.model} source is not the official GREGORY Rakuten shop`
    );
    assert.ok(
      row.imageUrl.startsWith("https://image.rakuten.co.jp/gregory-japan/cabinet/"),
      `${row.model} image is not an official GREGORY Rakuten product image`
    );
    assert.doesNotMatch(row.imageUrl, /thumbnail/i);
    assert.doesNotMatch(row.imageUrl, /@0_mall/i);
    assert.doesNotMatch(row.imageUrl, /search/i);
    assert.doesNotMatch(row.imageUrl, /banner|promo|coupon|campaign|ranking/i);
    assert.equal(cleanImageUrlGrade(row.imageUrl).ok, true, `${row.model} image failed quality gate`);
  }
});

test("GREGORY expansion remains static catalog data only", () => {
  assert.match(migrationSource, /insert into public\.gear_products/);
  assert.match(migrationSource, /insert into public\.gear_product_aliases/);
  assert.doesNotMatch(migrationSource, /requirement/i);
  assert.doesNotMatch(migrationSource, /recommendation/i);
  assert.doesNotMatch(migrationSource, /trip_plans/i);
  assert.doesNotMatch(migrationSource, /pack_requirement/i);
  assert.doesNotMatch(migrationSource, /delete from public\.gear_products/i);
  assert.doesNotMatch(migrationSource, /truncate/i);
});
