import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  allowedCleanImageHosts,
  buildAuditRows,
  cleanImageUrlGrade,
  extractP0Candidates,
  extractVerifiedRows,
  forbiddenImagePatterns,
  targetBrands
} from "../scripts/audit-popular-brand-image-candidates.mjs";

const candidateSource = readFileSync(
  new URL("../supabase/migrations/043_popular_japan_brand_catalog_p0.sql", import.meta.url),
  "utf8"
);
const repairSource = readFileSync(
  new URL("../supabase/migrations/046_popular_brand_image_quality_repair.sql", import.meta.url),
  "utf8"
);

test("popular brand image audit covers the full seven-brand candidate inventory", () => {
  const candidates = extractP0Candidates(candidateSource);

  assert.equal(candidates.length, 70);
  assert.deepEqual(
    targetBrands.map((brand) => [brand, candidates.filter((row) => row.brand === brand).length]),
    [
      ["Columbia", 10],
      ["MILLET", 10],
      ["Arc'teryx", 10],
      ["patagonia", 10],
      ["GREGORY", 10],
      ["LA SPORTIVA", 10],
      ["Mammut", 10]
    ]
  );
});

test("popular brand image audit detects current verified rows as Grade A only", () => {
  const verifiedRows = extractVerifiedRows(repairSource);
  const auditRows = buildAuditRows({ candidateSource, repairSource, sourceCandidates: [] });

  assert.equal(verifiedRows.length, 9);
  assert.equal(auditRows.filter((row) => row.grade === "A").length, 9);
  assert.equal(auditRows.filter((row) => row.grade === "B").length, 0);
  assert.equal(auditRows.filter((row) => row.grade === "C").length, 63);

  for (const row of auditRows.filter((item) => item.grade === "A")) {
    assert.match(row.status, /^verified/);
    assert.equal(cleanImageUrlGrade(row.imageUrl).ok, true);
  }
});

test("popular brand image audit centralizes clean image source policy", () => {
  assert.ok(allowedCleanImageHosts.includes("www.columbiasports.co.jp"));
  assert.ok(allowedCleanImageHosts.includes("milletonline.itembox.cloud"));
  assert.ok(allowedCleanImageHosts.includes("edge.dis.commercecloud.salesforce.com"));
  assert.ok(allowedCleanImageHosts.includes("www.gregory.jp"));
  assert.ok(allowedCleanImageHosts.includes("mammt.store-image.jp"));

  assert.ok(forbiddenImagePatterns.some((pattern) => pattern.test("https://image.rakuten.co.jp/x.jpg")));
  assert.ok(forbiddenImagePatterns.some((pattern) => pattern.test("https://example.com/search/thumb.jpg")));
  assert.ok(forbiddenImagePatterns.some((pattern) => pattern.test("https://example.com/promo-banner.jpg")));
});

test("popular brand image audit rejects low-quality or untrusted candidate images", () => {
  assert.deepEqual(
    cleanImageUrlGrade("https://image.rakuten.co.jp/shop/cabinet/product.jpg").ok,
    false
  );
  assert.deepEqual(
    cleanImageUrlGrade("https://www.columbiasports.co.jp/img/goods/S/search_thumbnail.jpg").ok,
    false
  );
  assert.deepEqual(
    cleanImageUrlGrade("https://example.com/clean-product.jpg").ok,
    false
  );
});
