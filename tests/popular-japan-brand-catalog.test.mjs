import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/043_popular_japan_brand_catalog_p0.sql", import.meta.url),
  "utf8"
);
const gearFormSource = readFileSync(
  new URL("../src/components/gear-form.tsx", import.meta.url),
  "utf8"
);
const gearDisplaySource = readFileSync(
  new URL("../src/lib/gear-display.ts", import.meta.url),
  "utf8"
);

const productPattern =
  /\('([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']*(?:''[^']*)*)', '([^']+)', '([^']+)', (null|'[^']*'), '([^']+)'\)/g;

const productRows = [...migrationSource.matchAll(productPattern)].map((match) => ({
  brand: match[1].replaceAll("''", "'"),
  model: match[2].replaceAll("''", "'"),
  nameJa: match[3].replaceAll("''", "'"),
  category: match[4],
  subcategory: match[5],
  volume: parseSqlNullable(match[6]),
  officialUrl: match[7]
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

test("popular Japan brand catalog adds 70 P0 staple products", () => {
  assert.equal(productRows.length, 70);
  assert.equal(new Set(productRows.map((row) => `${row.brand}/${row.model}`)).size, 70);
  assert.deepEqual(countBy(productRows, "brand"), {
    Columbia: 10,
    MILLET: 10,
    "Arc'teryx": 10,
    patagonia: 10,
    GREGORY: 10,
    "LA SPORTIVA": 10,
    Mammut: 10
  });
});

test("popular Japan brand catalog focuses on registerable hiking equipment", () => {
  assert.deepEqual(countBy(productRows, (row) => `${row.category}/${row.subcategory}`), {
    "clothing/footwear": 16,
    "clothing/rain_jacket": 11,
    "clothing/insulation": 8,
    "backpack/backpack": 23,
    "clothing/rain_pants": 2,
    "clothing/base_layer": 8,
    "clothing/down_jacket": 2
  });

  assert.ok(productRows.every((row) => row.officialUrl.startsWith("https://")));
  assert.ok(productRows.some((row) => row.brand === "Columbia" && row.model === "Saber Five Mid Outdry"));
  assert.ok(productRows.some((row) => row.brand === "MILLET" && row.model === "SAAS FEE NX 30+5"));
  assert.ok(productRows.some((row) => row.brand === "Arc'teryx" && row.model === "Beta Jacket"));
  assert.ok(productRows.some((row) => row.brand === "patagonia" && row.model === "Torrentshell 3L Jacket"));
  assert.ok(productRows.some((row) => row.brand === "GREGORY" && row.model === "Baltoro 65"));
  assert.ok(productRows.some((row) => row.brand === "LA SPORTIVA" && row.model === "TX5 Evo GTX"));
  assert.ok(productRows.some((row) => row.brand === "Mammut" && row.model === "Lithium 30"));
});

test("popular Japan brand catalog is honest about verification quality", () => {
  assert.match(migrationSource, /date '2026-06-21'/);
  assert.match(migrationSource, /'needs_review'/);
  assert.doesNotMatch(migrationSource, /date '2026-06-21',\s*'verified'/);
  assert.doesNotMatch(migrationSource, /purchase|shopping|recommend/i);
  assert.match(migrationSource, /when public\.gear_products\.verification_status = 'verified'/);
});

test("popular Japan brand catalog adds search aliases and brand priority", () => {
  for (const expected of [
    "コロンビア",
    "ミレー",
    "アークテリクス",
    "パタゴニア",
    "グレゴリー",
    "ラスポルティバ",
    "マムート",
    "セイバー5ミッド",
    "サースフェー30+5",
    "ベータジャケット",
    "トレントシェルジャケット",
    "バルトロ65",
    "TX5 エボ GTX",
    "リチウム30"
  ]) {
    assert.ok(
      migrationSource.includes(expected) ||
        gearFormSource.includes(expected) ||
        gearDisplaySource.includes(expected),
      `${expected} missing`
    );
  }
}
);

test("product picker shows unverified catalog gaps as pending official confirmation", () => {
  assert.match(gearFormSource, /function ProductImageFallback/);
  assert.match(gearFormSource, /公式確認中/);
  assert.match(gearFormSource, /formatProductPrice/);
  assert.doesNotMatch(gearFormSource, /product\.msrp_jpy \? formatJpy\(product\.msrp_jpy\) : "-"/);
  assert.match(gearFormSource, /<ProductImageFallback brand=\{product\.brand\}/);
});
