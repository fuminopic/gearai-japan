import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migrationSource = readFileSync(
  new URL("../supabase/migrations/052_high_confidence_mountain_notes.sql", import.meta.url),
  "utf8"
);

const allowedSlugs = [
  "aizu-asahi-dake",
  "asahi-dake-tohoku",
  "iide-san",
  "hokkaido-komagatake",
  "kamuro-san",
  "shokanbetsu-dake",
  "togakushi-yama"
];

const blockedSlugs = [
  "akaushi-dake",
  "daimugen-zan",
  "oizuru-gatake",
  "ikeguchi-dake",
  "mikagura-dake",
  "sumon-dake",
  "waga-dake",
  "zaru-gatake",
  "taishaku-san"
];

test("high-confidence mountain notes migration updates only allowed target slugs", () => {
  const updateStatements =
    migrationSource.match(/update public\.mountain_foundation_profiles/gi) ?? [];
  assert.equal(updateStatements.length, allowedSlugs.length);

  const targetSlugs = [
    ...migrationSource.matchAll(/where slug = '([^']+)'/g)
  ].map((match) => match[1]);
  assert.deepEqual(targetSlugs.sort(), [...allowedSlugs].sort());

  for (const slug of blockedSlugs) {
    assert.doesNotMatch(migrationSource, new RegExp(`'${slug}'`));
  }
});

test("high-confidence mountain notes migration stays notes-only", () => {
  for (const field of [
    "mandatory_gear_note",
    "supplementary_notes",
    "restriction_status_note"
  ]) {
    assert.match(migrationSource, new RegExp(`${field} =`));
  }

  for (const forbiddenField of [
    "region",
    "primary_region",
    "route_seriousness",
    "water_availability",
    "hut_support",
    "supported_styles",
    "supported_seasons",
    "volcanic_risk",
    "active_volcano_status",
    "updated_at"
  ]) {
    assert.doesNotMatch(migrationSource, new RegExp(`\\b${forbiddenField}\\b`));
  }

  assert.doesNotMatch(migrationSource, /\bcreate\b/i);
  assert.doesNotMatch(migrationSource, /\balter\b/i);
  assert.doesNotMatch(migrationSource, /\bdrop\b/i);
  assert.doesNotMatch(migrationSource, /\binsert\b/i);
  assert.doesNotMatch(migrationSource, /\bdelete\b/i);
  assert.doesNotMatch(migrationSource, /\btruncate\b/i);
  assert.doesNotMatch(migrationSource, /\buser_gear\b/i);
  assert.doesNotMatch(migrationSource, /\bpolicy\b/i);
  assert.doesNotMatch(migrationSource, /\brls\b/i);
});

test("high-confidence mountain notes migration avoids brittle or unverified facts", () => {
  assert.doesNotMatch(migrationSource, /2,000円|1,000円|100円/);
  assert.doesNotMatch(migrationSource, /円/);
  assert.doesNotMatch(migrationSource, /\d{1,2}月\d{1,2}日/);
  assert.doesNotMatch(migrationSource, /\d{1,2}時/);
  assert.doesNotMatch(migrationSource, /ヘルメット必携|渡渉装備必携|携帯トイレ必携/);
  assert.doesNotMatch(migrationSource, /必携/);
  assert.doesNotMatch(migrationSource, /例年6月1日|10月31日|固定開放|固定开放/);
});

test("high-confidence mountain notes migration keeps key conservative guidance", () => {
  assert.match(migrationSource, /火口周辺規制/);
  assert.match(migrationSource, /馬ノ背まで/);
  assert.match(migrationSource, /入山届/);
  assert.match(migrationSource, /最新公式情報確認/);
  assert.match(migrationSource, /ヘルメット等の頭部保護を推奨・確認/);
});
