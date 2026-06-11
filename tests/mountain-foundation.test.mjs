import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const migration = readFileSync(
  new URL("../supabase/migrations/009_mountain_foundation_dataset_v1.sql", import.meta.url),
  "utf8"
);
const v2Migration = readFileSync(
  new URL("../supabase/migrations/014_mountain_foundation_dataset_v2.sql", import.meta.url),
  "utf8"
);
const v21Migration = readFileSync(
  new URL("../supabase/migrations/015_mountain_foundation_region_model_v21.sql", import.meta.url),
  "utf8"
);
const v3GeographyMigration = readFileSync(
  new URL(
    "../supabase/migrations/016_mountain_foundation_geography_expansion_v3.sql",
    import.meta.url
  ),
  "utf8"
);
const repository = readFileSync(
  new URL("../src/lib/data/mountain-foundation.ts", import.meta.url),
  "utf8"
);
const types = readFileSync(
  new URL("../src/lib/types.ts", import.meta.url),
  "utf8"
);

const expectedSlugs = [
  "takao-san",
  "kumotori-yama",
  "tsubakuro-dake",
  "jonen-dake",
  "cho-gatake",
  "yarigatake",
  "okuhotakadake"
];

const expectedSystems = [
  "WATER_SYSTEM",
  "SHELTER_SYSTEM",
  "SLEEP_SYSTEM",
  "COOK_SYSTEM",
  "RAIN_SYSTEM",
  "COLD_WEATHER_LAYER",
  "NAVIGATION_SYSTEM",
  "TECHNICAL_SAFETY_SYSTEM",
  "EMERGENCY_SYSTEM"
];

test("mountain foundation migration seeds exactly the V1 mountains", () => {
  for (const slug of expectedSlugs) {
    assert.match(migration, new RegExp(`'${slug}'`));
  }

  const seededRows = migration.match(/\n  \(\n    '[a-z0-9-]+',/g) ?? [];
  assert.equal(seededRows.length, expectedSlugs.length);
});

test("mountain foundation classifications are normalized enum-style values", () => {
  for (const value of [
    "SPRING",
    "SUMMER",
    "AUTUMN",
    "WINTER",
    "DAY_HIKE",
    "OVERNIGHT_HUT",
    "OVERNIGHT_TENT",
    "MULTI_DAY_TREK",
    "FRONT_COUNTRY_DAY_HIKE",
    "BACKCOUNTRY_DAY_HIKE",
    "OVERNIGHT_BACKPACKING",
    "ALPINE_TREK",
    ...expectedSystems,
    "HOKKAIDO",
    "TOHOKU",
    "HOKUSHINETSU",
    "KANTO",
    "FUJI",
    "YATSUGATAKE",
    "CENTRAL_ALPS",
    "SOUTHERN_ALPS",
    "NORTHERN_ALPS",
    "OKUCHICHIBU",
    "TANZAWA",
    "NIKKO",
    "JOSHU"
  ]) {
    assert.match(
      `${migration}\n${v2Migration}\n${v21Migration}\n${v3GeographyMigration}`,
      new RegExp(`'${value}'`)
    );
    assert.match(types, new RegExp(`"${value}"`));
  }
});

test("mountain foundation V2 adds schema attributes without adding more mountains", () => {
  for (const attribute of [
    "route_seriousness",
    "technical_terrain",
    "helmet_guidance",
    "water_availability",
    "hut_support",
    "tent_site_availability",
    "alpine_environment",
    "snow_or_ice_risk",
    "route_duration_band",
    "escape_options",
    "cell_signal_reliability",
    "bear_or_wildlife_risk",
    "volcanic_risk",
    "season_opening_window"
  ]) {
    assert.match(v2Migration, new RegExp(`add column if not exists ${attribute}`));
    assert.match(repository, new RegExp(attribute));
  }

  assert.match(repository, /MOUNTAIN_FOUNDATION_V2_DEFAULTS/);
  assert.match(repository, /isMissingMountainFoundationV2ColumnError/);
  assert.match(repository, /MOUNTAIN_FOUNDATION_BASE_SELECT/);

  for (const slug of [
    "takao-san",
    "kumotori-yama",
    "tsubakuro-dake",
    "yarigatake",
    "okuhotakadake"
  ]) {
    assert.match(v2Migration, new RegExp(`where slug = '${slug}'`));
  }

  assert.doesNotMatch(v2Migration, /insert into public\.mountain_foundation_profiles/i);
  assert.match(v2Migration, /'helmet'/);
  assert.match(v2Migration, /'traction_device'/);
});

test("mountain foundation V2.1 expands geography without adding more mountains", () => {
  for (const attribute of [
    "primary_region",
    "mountain_range",
    "prefectures"
  ]) {
    assert.match(v21Migration, new RegExp(`add column if not exists ${attribute}`));
    assert.match(repository, new RegExp(attribute));
  }

  for (const region of [
    "FUJI",
    "YATSUGATAKE",
    "CENTRAL_ALPS",
    "SOUTHERN_ALPS",
    "NORTHERN_ALPS",
    "OKUCHICHIBU",
    "TANZAWA",
    "NIKKO",
    "JOSHU"
  ]) {
    assert.match(v21Migration, new RegExp(`'${region}'`));
    assert.match(types, new RegExp(`"${region}"`));
  }

  assert.match(v21Migration, /drop constraint if exists mountain_foundation_profiles_region_check/);
  assert.match(v21Migration, /add constraint mountain_foundation_profiles_region_check/);
  assert.match(v21Migration, /update public\.mountain_foundation_profiles/);
  for (const slug of expectedSlugs) {
    assert.match(v21Migration, new RegExp(`when '${slug}'`));
  }
  assert.doesNotMatch(v21Migration, /insert into public\.mountain_foundation_profiles/i);
  assert.doesNotMatch(v21Migration, /\bdrop table\b/i);
  assert.doesNotMatch(v21Migration, /\bdrop column\b/i);
  assert.doesNotMatch(v21Migration, /\bdelete\b/i);
  assert.doesNotMatch(v21Migration, /\btruncate\b/i);
});

test("mountain foundation V3 geography expands to national regions without adding mountains", () => {
  for (const region of [
    "HOKKAIDO",
    "TOHOKU",
    "HOKUSHINETSU",
    "KANTO",
    "FUJI",
    "OKUCHICHIBU",
    "TANZAWA",
    "NIKKO",
    "YATSUGATAKE",
    "NORTHERN_ALPS",
    "CENTRAL_ALPS",
    "SOUTHERN_ALPS",
    "CHUGOKU",
    "SHIKOKU",
    "KYUSHU",
    "YAKUSHIMA"
  ]) {
    assert.match(v3GeographyMigration, new RegExp(`'${region}'`));
    assert.match(types, new RegExp(`"${region}"`));
  }

  for (const legacyRegion of [
    "KANTO_TOKYO",
    "KANTO_TOKYO_SAITAMA_YAMANASHI",
    "NORTHERN_ALPS_NAGANO",
    "NORTHERN_ALPS_NAGANO_GIFU",
    "JOSHU"
  ]) {
    assert.match(v3GeographyMigration, new RegExp(`'${legacyRegion}'`));
  }

  assert.match(v3GeographyMigration, /drop constraint if exists mountain_foundation_profiles_region_check/);
  assert.match(v3GeographyMigration, /drop constraint if exists mountain_foundation_profiles_primary_region_check/);
  assert.match(v3GeographyMigration, /update public\.mountain_foundation_profiles/);
  assert.doesNotMatch(v3GeographyMigration, /insert into public\.mountain_foundation_profiles/i);
  assert.doesNotMatch(v3GeographyMigration, /\bdrop table\b/i);
  assert.doesNotMatch(v3GeographyMigration, /\bdrop column\b/i);
  assert.doesNotMatch(v3GeographyMigration, /\bdelete\b/i);
  assert.doesNotMatch(v3GeographyMigration, /\btruncate\b/i);
});

test("mountain foundation layer exposes planning profile and systems without pack-list logic", () => {
  assert.match(repository, /trip_profile/);
  assert.match(repository, /typical_required_systems/);
  assert.doesNotMatch(repository, /elevation_m\s*[<>]=?/);
  assert.doesNotMatch(repository, /pack\s*list/i);
  assert.doesNotMatch(
    migration,
    /\b(description|weather_integration|weather_source|hut_system|water_source|regulation|risk_assessment)\b/i
  );
});
