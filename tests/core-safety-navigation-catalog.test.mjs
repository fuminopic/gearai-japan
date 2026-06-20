import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/040_core_safety_navigation_catalog_followup.sql",
    import.meta.url
  ),
  "utf8"
);

test("safety and navigation follow-up preserves matching-critical categories", () => {
  for (const expected of [
    "('electronics', 'GPS', 'gps', 20)",
    "('electronics', 'モバイルバッテリー', 'power_bank', 30)",
    "('first_aid', 'ファーストエイドキット', 'first_aid_kit', 10)",
    "gps_sub_id",
    "power_bank_sub_id",
    "first_aid_sub_id"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }

  assert.match(migrationSource, /garmin\|etrex\|gpsmap\|inreach/);
  assert.match(migrationSource, /exists \(\s*select 1\s*from public\.gear_subcategories s\s*where s\.id = p\.subcategory_id\s*and s\.name_en = 'gps'/);
  assert.match(migrationSource, /exists \(\s*select 1\s*from public\.gear_subcategories s\s*where s\.id = g\.subcategory_id\s*and s\.name_en = 'gps'/);
  assert.doesNotMatch(migrationSource, /left join public\.gear_subcategories s on s\.id = [pg]\.subcategory_id/);
  assert.match(migrationSource, /power bank\|powercore\|battery pack\|mobile battery\|portable battery\|モバイルバッテリー\|携帯バッテリー\|バッテリーパック/);
  assert.match(migrationSource, /first aid\|medical kit\|ファーストエイド\|救急/);
});

test("safety and navigation follow-up restores Garmin eTrex SE as verified GPS", () => {
  assert.match(migrationSource, /'Garmin',\s*'eTrex SE'/);
  assert.match(migrationSource, /'electronics',\s*'gps'/);
  assert.match(migrationSource, /\b157\b/);
  assert.match(migrationSource, /2\.4" x 4\.0" x 1\.3"/);
  assert.match(migrationSource, /2 AA batteries/);
  assert.match(migrationSource, /https:\/\/www\.garmin\.com\/en-US\/p\/835742\/pn\/010-02734-00\//);
  assert.match(migrationSource, /https:\/\/res\.garmin\.com\/en\/products\/010-02734-00\/v\/cf-lg\.jpg/);
  assert.match(migrationSource, /discontinued = false/);
  assert.match(migrationSource, /verification_status = excluded\.verification_status/);
  assert.match(migrationSource, /date '2026-06-20'/);
});

test("safety and navigation follow-up adds user-search aliases without shopping drift", () => {
  for (const expected of [
    "ガーミン eTrex SE",
    "イートレックス SE",
    "010-02734-00",
    "eTrex SE GPS",
    "Garmin Explore"
  ]) {
    assert.ok(migrationSource.includes(expected), `${expected} missing`);
  }

  assert.doesNotMatch(migrationSource, /Anker|Nitecore|purchase|shopping|recommend/i);
});
