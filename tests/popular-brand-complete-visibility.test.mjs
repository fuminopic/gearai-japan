import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const cleanupMigrationSource = readFileSync(
  new URL("../supabase/migrations/045_hide_incomplete_popular_brand_products.sql", import.meta.url),
  "utf8"
);

test("popular brand cleanup hides products missing complete official details", () => {
  for (const brand of [
    "Columbia",
    "MILLET",
    "Arc''teryx",
    "patagonia",
    "GREGORY",
    "LA SPORTIVA",
    "Mammut"
  ]) {
    assert.match(cleanupMigrationSource, new RegExp(`'${brand}'`));
  }

  assert.match(cleanupMigrationSource, /discontinued = true/);
  assert.match(cleanupMigrationSource, /verification_status = 'needs_review'/);
  assert.match(cleanupMigrationSource, /verification_status <> 'verified'/);
  assert.match(cleanupMigrationSource, /official_weight_grams is null/);
  assert.match(cleanupMigrationSource, /msrp_jpy is null/);
  assert.match(cleanupMigrationSource, /image_url is null/);
  assert.match(cleanupMigrationSource, /official_url is null/);
});

test("popular brand cleanup preserves already verified complete products", () => {
  assert.match(cleanupMigrationSource, /and discontinued = false/);
  assert.doesNotMatch(cleanupMigrationSource, /delete from public\.gear_products/i);
  assert.doesNotMatch(cleanupMigrationSource, /truncate/i);
});
