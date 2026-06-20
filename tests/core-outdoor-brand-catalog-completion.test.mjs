import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const baseMigrationSource = readFileSync(
  new URL("../supabase/migrations/033_core_outdoor_brand_products.sql", import.meta.url),
  "utf8"
);
const completionMigrationSource = readFileSync(
  new URL(
    "../supabase/migrations/042_core_outdoor_brand_catalog_completion.sql",
    import.meta.url
  ),
  "utf8"
);

const productPattern =
  /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (null|'[^']*'), (null|'[^']*'), (null|'[^']*'), '([^']+)'\)/g;

const baseProductRows = [
  ...baseMigrationSource.matchAll(
    /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (\d+), (null|\d+),/g
  )
]
  .map((match) => ({
    brand: match[1].replaceAll("''", "'"),
    model: match[2].replaceAll("''", "'"),
    category: match[4],
    subcategory: match[5]
  }))
  .filter((row) =>
    ["山と道", "finetrack", "Caravan", "Osprey", "Petzl"].includes(row.brand)
  );

const completionRows = [...completionMigrationSource.matchAll(productPattern)].map((match) => ({
  brand: match[1].replaceAll("''", "'"),
  model: match[2].replaceAll("''", "'"),
  nameJa: match[3].replaceAll("''", "'"),
  category: match[4],
  subcategory: match[5],
  size: parseSqlNullable(match[6]),
  volume: parseSqlNullable(match[7]),
  capacity: parseSqlNullable(match[8]),
  officialUrl: match[9]
}));

function parseSqlNullable(value) {
  if (value === "null") {
    return null;
  }

  return value.slice(1, -1).replaceAll("''", "'");
}

function countBy(rows, key) {
  return rows.reduce((counts, row) => {
    const value = typeof key === "function" ? key(row) : row[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

test("core outdoor brand completion brings the unfinished 41 item catalog above 100", () => {
  assert.equal(baseProductRows.length, 41);
  assert.equal(completionRows.length, 66);
  assert.equal(baseProductRows.length + completionRows.length, 107);
  assert.equal(
    new Set([...baseProductRows, ...completionRows].map((row) => `${row.brand}/${row.model}`)).size,
    107
  );
});

test("core outdoor brand completion fills the intended brand gaps", () => {
  assert.deepEqual(countBy(completionRows, "brand"), {
    "山と道": 15,
    finetrack: 15,
    Caravan: 12,
    Osprey: 14,
    Petzl: 10
  });

  assert.deepEqual(countBy([...baseProductRows, ...completionRows], "brand"), {
    "山と道": 27,
    finetrack: 25,
    Caravan: 17,
    Osprey: 22,
    Petzl: 16
  });
});

test("core outdoor brand completion stays focused on registerable mountain gear", () => {
  assert.deepEqual(countBy(completionRows, (row) => `${row.category}/${row.subcategory}`), {
    "clothing/base_layer": 13,
    "clothing/insulation": 5,
    "clothing/rain_pants": 3,
    "clothing/rain_jacket": 2,
    "other/other": 3,
    "clothing/hat": 1,
    "shelter/groundsheet": 2,
    "shelter/tarp": 1,
    "clothing/footwear": 12,
    "backpack/backpack": 14,
    "electronics/headlamp": 8,
    "other/helmet": 2
  });

  assert.ok(completionRows.every((row) => row.officialUrl.startsWith("https://")));
  assert.ok(completionRows.some((row) => row.model === "カミナドーム2 フットプリント"));
  assert.ok(completionRows.some((row) => row.model === "タロン22" && row.volume === "22L"));
  assert.ok(completionRows.some((row) => row.model === "METEOR" && row.subcategory === "helmet"));
});

test("core outdoor brand completion is honest about verification quality", () => {
  assert.match(completionMigrationSource, /date '2026-06-21'/);
  assert.match(completionMigrationSource, /'needs_review'/);
  assert.doesNotMatch(
    completionMigrationSource,
    /date '2026-06-21',\s*'verified'/
  );
  assert.doesNotMatch(completionMigrationSource, /purchase|shopping|recommend/i);
  assert.match(completionMigrationSource, /when public\.gear_products\.verification_status = 'verified'/);
});

test("core outdoor brand completion adds practical search aliases", () => {
  for (const expected of [
    "ライト5ポケットパンツ",
    "メリノフーディ",
    "Dry Layer Basic T",
    "Kamina Dome 2 Footprint",
    "GRANDKING GK83",
    "Talon 22",
    "Hikelite 26",
    "ナオ RL",
    "メテオ"
  ]) {
    assert.ok(completionMigrationSource.includes(expected), `${expected} missing`);
  }
}
);
