import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/030_black_diamond_cosmo_headlamps.sql",
    import.meta.url
  ),
  "utf8"
);
const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);

const productRows = [
  ...migrationSource.matchAll(
    /\('([^']+)', '([^']+)', '([^']+)', '([^']+)', (\d+), (\d+),/g
  )
].map((match) => ({
  model: match[1],
  name_ja: match[2],
  category: match[3],
  subcategory: match[4],
  official_weight_grams: Number(match[5]),
  msrp_jpy: Number(match[6])
}));

test("Black Diamond Cosmo migration adds the rechargeable and battery Cosmo 350 headlamps", () => {
  assert.equal(productRows.length, 2);
  assert.deepEqual(
    productRows.map((row) => row.model).sort(),
    ["コズモ350", "コズモ350-R"]
  );
  assert.ok(
    productRows.every(
      (row) => row.category === "electronics" && row.subcategory === "headlamp"
    )
  );
  assert.deepEqual(
    Object.fromEntries(productRows.map((row) => [row.model, row.official_weight_grams])),
    {
      "コズモ350": 81,
      "コズモ350-R": 75
    }
  );
  assert.deepEqual(
    Object.fromEntries(productRows.map((row) => [row.model, row.msrp_jpy])),
    {
      "コズモ350": 5940,
      "コズモ350-R": 9350
    }
  );
  assert.match(migrationSource, /date '2026-06-15'/);
  assert.match(migrationSource, /'verified'/);
});

test("Black Diamond Cosmo migration keeps official Lost Arrow URLs, images, and aliases", () => {
  const officialUrls = migrationSource.match(
    /https:\/\/www\.lostarrow\.co\.jp\/store\/g\/gBD813(?:13|09)\d+\//g
  );
  const imageUrls = migrationSource.match(
    /https:\/\/www\.lostarrow\.co\.jp\/img\/goods\/S\/BD813(?:13|09)\d+_S\.webp/g
  );

  assert.equal(new Set(officialUrls).size, 2);
  assert.equal(new Set(imageUrls).size, 2);

  for (const expected of [
    "BD81313002",
    "BD81313003",
    "BD81309003",
    "BD81309004",
    "BD81309005",
    "Cosmo 350-R",
    "Cosmo350R",
    "Cosmo 350",
    "Cosmo350"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }
});

test("product picker search includes the Black Diamond Cosmo family", () => {
  for (const expected of ["Cosmo", "COSMO", "Cosmo 350", "Cosmo350", "コズモ"]) {
    assert.ok(gearFormSource.includes(expected), `${expected} missing`);
  }
});
