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
const v4ExpansionMigration = readFileSync(
  new URL(
    "../supabase/migrations/017_mountain_foundation_corrections_and_100_profiles.sql",
    import.meta.url
  ),
  "utf8"
);
const representativeSampleFixMigration = readFileSync(
  new URL(
    "../supabase/migrations/018_mountain_foundation_representative_sample_fixes.sql",
    import.meta.url
  ),
  "utf8"
);
const supplementaryMigration = readFileSync(
  new URL(
    "../supabase/migrations/019_mountain_foundation_supplementary_fields.sql",
    import.meta.url
  ),
  "utf8"
);
const ruleReviewFixMigration = readFileSync(
  new URL(
    "../supabase/migrations/020_mountain_foundation_rule_review_fixes.sql",
    import.meta.url
  ),
  "utf8"
);
const meizanListMigration = readFileSync(
  new URL(
    "../supabase/migrations/021_mountain_foundation_meizan_list.sql",
    import.meta.url
  ),
  "utf8"
);
const meizanFullCoverageMigration = readFileSync(
  new URL(
    "../supabase/migrations/022_mountain_foundation_meizan_full_coverage.sql",
    import.meta.url
  ),
  "utf8"
);
const meizan200ProfilesMigration = readFileSync(
  new URL(
    "../supabase/migrations/023_mountain_foundation_meizan_200_profiles.sql",
    import.meta.url
  ),
  "utf8"
);
const opus48StaticFixesMigration = readFileSync(
  new URL(
    "../supabase/migrations/024_mountain_foundation_opus48_static_fixes.sql",
    import.meta.url
  ),
  "utf8"
);
const tohokuRegionProfileCorrectionsMigration = readFileSync(
  new URL(
    "../supabase/migrations/051_tohoku_region_mountain_profile_corrections.sql",
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
const tripRequirementEngine = readFileSync(
  new URL("../src/lib/trip-requirements/engine.ts", import.meta.url),
  "utf8"
);
const packRequirementEngine = readFileSync(
  new URL("../src/lib/pack-requirements/engine.ts", import.meta.url),
  "utf8"
);
const gearMatchingEngine = readFileSync(
  new URL("../src/lib/gear-matching/engine.ts", import.meta.url),
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
    "HOKURIKU",
    "TOKAI",
    "KINKI",
    "FUJI",
    "YATSUGATAKE",
    "CENTRAL_ALPS",
    "SOUTHERN_ALPS",
    "NORTHERN_ALPS",
    "OKUCHICHIBU",
    "TANZAWA",
    "NIKKO",
    "JOSHU",
    "JAPAN_HYAKUMEIZAN",
    "JAPAN_NIHYAKUMEIZAN_EXTRA",
    "OTHER"
  ]) {
    assert.match(
      `${migration}\n${v2Migration}\n${v21Migration}\n${v3GeographyMigration}\n${v4ExpansionMigration}\n${meizanListMigration}`,
      new RegExp(`'${value}'`)
    );
    assert.match(types, new RegExp(`"${value}"`));
  }
});

test("mountain foundation V4 corrects confirmed profiles and expands to 100 mountains", () => {
  const expandedRows = v4ExpansionMigration.match(/\n  \('[a-z0-9-]+',/g) ?? [];

  assert.equal(expandedRows.length, 50);
  assert.match(v4ExpansionMigration, /where slug = 'tsubakuro-dake'/);
  assert.match(
    v4ExpansionMigration,
    /supported_styles = array\['DAY_HIKE', 'OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK'\]::text\[\]/
  );
  assert.match(v4ExpansionMigration, /where slug = 'jonen-dake'/);
  assert.match(v4ExpansionMigration, /where slug = 'cho-gatake'/);
  assert.match(v4ExpansionMigration, /hut_support = 'FULL_SERVICE'/);
  assert.match(v4ExpansionMigration, /tent_site_availability = 'DESIGNATED'/);
  assert.match(v4ExpansionMigration, /alpine_environment = 'HIGH_ALPINE_EXPOSED'/);
  assert.match(v4ExpansionMigration, /where slug = 'shirouma-dake'/);
  assert.match(v4ExpansionMigration, /snow_or_ice_risk = 'SEASONAL_PATCHES'/);

  for (const slug of [
    "tomuraushi-yama",
    "poroshiri-dake",
    "hakusan",
    "ontake-san",
    "goryu-dake",
    "aino-dake",
    "omine-san",
    "kusatsu-shirane-san"
  ]) {
    assert.match(v4ExpansionMigration, new RegExp(`'${slug}'`));
  }

  for (const region of ["HOKURIKU", "TOKAI", "KINKI"]) {
    assert.match(v4ExpansionMigration, new RegExp(`'${region}'`));
    assert.match(types, new RegExp(`"${region}"`));
  }

  assert.doesNotMatch(v4ExpansionMigration, /\bcreate table\b/i);
  assert.doesNotMatch(v4ExpansionMigration, /\btruth\b/i);
  assert.doesNotMatch(v4ExpansionMigration, /\bevidence\b/i);
  assert.doesNotMatch(v4ExpansionMigration, /\baudit\b/i);
});

test("mountain foundation representative sample fixes only obvious data issues", () => {
  assert.match(representativeSampleFixMigration, /where slug = 'tomuraushi-yama'/);
  assert.match(
    representativeSampleFixMigration,
    /supported_styles = array\['OVERNIGHT_HUT', 'OVERNIGHT_TENT', 'MULTI_DAY_TREK'\]::text\[\]/
  );
  assert.doesNotMatch(
    representativeSampleFixMigration,
    /tomuraushi-yama'[\s\S]*?DAY_HIKE/
  );

  assert.match(representativeSampleFixMigration, /where slug = 'tsukuba-san'/);
  assert.match(
    representativeSampleFixMigration,
    /supported_seasons = array\['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'\]::text\[\]/
  );

  assert.doesNotMatch(representativeSampleFixMigration, /\bcreate table\b/i);
  assert.doesNotMatch(representativeSampleFixMigration, /\balter table\b/i);
  assert.doesNotMatch(representativeSampleFixMigration, /\binsert into\b/i);
  assert.doesNotMatch(representativeSampleFixMigration, /\btruth\b/i);
  assert.doesNotMatch(representativeSampleFixMigration, /\bevidence\b/i);
  assert.doesNotMatch(representativeSampleFixMigration, /\baudit\b/i);
});

test("mountain foundation supplementary fields import 100 static rows without new systems", () => {
  for (const attribute of [
    "active_volcano_status",
    "jma_volcano_name",
    "jma_alert_url",
    "jma_constant_monitoring",
    "restriction_status_note",
    "snow_free_month_guide",
    "mandatory_gear_note",
    "supplementary_notes"
  ]) {
    assert.match(supplementaryMigration, new RegExp(`add column if not exists ${attribute}`));
    assert.match(repository, new RegExp(attribute));
    assert.match(types, new RegExp(attribute));
  }

  const importedRows = supplementaryMigration.match(/\n  \('[a-z0-9-]+',/g) ?? [];
  assert.equal(importedRows.length, 100);
  assert.match(supplementaryMigration, /where profile\.slug = source\.slug/);
  assert.match(supplementaryMigration, /'tomuraushi-yama', 'NONE'/);
  assert.match(supplementaryMigration, /'aso-san', 'ACTIVE', '阿蘇山'/);
  assert.match(supplementaryMigration, /'hiuchi-yama', 'ADJACENT'/);
  assert.match(supplementaryMigration, /'tsukuba-san', 'NONE'/);

  for (const value of ["NONE", "ACTIVE", "ADJACENT"]) {
    assert.match(supplementaryMigration, new RegExp(`'${value}'`));
    assert.match(types, new RegExp(`"${value}"`));
  }

  assert.match(repository, /MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS/);
  assert.match(repository, /MOUNTAIN_FOUNDATION_SUPPLEMENTARY_DEFAULTS/);
  assert.match(repository, /isMissingMountainFoundationSupplementaryColumnError/);

  assert.doesNotMatch(supplementaryMigration, /\bcreate table\b/i);
  assert.doesNotMatch(supplementaryMigration, /\binsert into\b/i);
  assert.doesNotMatch(supplementaryMigration, /\btruth\b/i);
  assert.doesNotMatch(supplementaryMigration, /\bevidence\b/i);
  assert.doesNotMatch(supplementaryMigration, /\baudit\b/i);
  assert.doesNotMatch(supplementaryMigration, /\blayer\b/i);
});

test("mountain foundation supplementary fields stay out of recommendation engines", () => {
  for (const source of [
    tripRequirementEngine,
    packRequirementEngine,
    gearMatchingEngine
  ]) {
    for (const attribute of [
      "active_volcano_status",
      "jma_volcano_name",
      "jma_alert_url",
      "jma_constant_monitoring",
      "restriction_status_note",
      "snow_free_month_guide",
      "mandatory_gear_note",
      "supplementary_notes"
    ]) {
      assert.doesNotMatch(source, new RegExp(attribute));
    }
  }
});

test("mountain foundation rule review fixes stay static and scoped", () => {
  assert.match(ruleReviewFixMigration, /where slug = 'meakan-dake'/);
  assert.match(ruleReviewFixMigration, /volcanic_risk = 'ACTIVE_RESTRICTED'/);
  assert.match(ruleReviewFixMigration, /噴火警戒レベル2（火口周辺規制）/);

  assert.match(ruleReviewFixMigration, /where slug = 'poroshiri-dake'/);
  assert.match(ruleReviewFixMigration, /渡渉装備/);
  assert.match(ruleReviewFixMigration, /携帯トイレ必携/);

  assert.doesNotMatch(ruleReviewFixMigration, /\bcreate table\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\balter table\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\binsert into\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\btruth\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\bevidence\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\baudit\b/i);
  assert.doesNotMatch(ruleReviewFixMigration, /\blayer\b/i);
});

test("mountain foundation meizan list separates hyakumeizan and nihyakumeizan extras", () => {
  assert.match(meizanListMigration, /add column if not exists meizan_list/);
  assert.match(meizanListMigration, /mountain_foundation_profiles_meizan_list_check/);
  assert.match(meizanListMigration, /when is_hyakumeizan then 'JAPAN_HYAKUMEIZAN'/);
  assert.match(meizanListMigration, /'kentoku-san'/);
  assert.match(meizanListMigration, /'tsubakuro-dake'/);
  assert.match(meizanListMigration, /'JAPAN_NIHYAKUMEIZAN_EXTRA'/);

  assert.match(repository, /meizan_list/);
  assert.match(repository, /JAPAN_NIHYAKUMEIZAN_EXTRA_SLUGS/);
  assert.match(repository, /JAPAN_NIHYAKUMEIZAN_EXTRA_NAMES/);
  assert.match(repository, /JAPAN_NIHYAKUMEIZAN_EXTRA_NAME_ALIASES/);
  assert.match(repository, /isMissingMountainFoundationMeizanColumnError/);
  assert.match(repository, /MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT/);
  assert.match(types, /MountainMeizanList/);

  for (const source of [
    tripRequirementEngine,
    packRequirementEngine,
    gearMatchingEngine
  ]) {
    assert.doesNotMatch(source, /meizan_list/);
  }

  assert.doesNotMatch(meizanListMigration, /\bcreate table\b/i);
  assert.doesNotMatch(meizanListMigration, /\binsert into\b/i);
  assert.doesNotMatch(meizanListMigration, /\btruth\b/i);
  assert.doesNotMatch(meizanListMigration, /\bevidence\b/i);
  assert.doesNotMatch(meizanListMigration, /\baudit\b/i);
  assert.doesNotMatch(meizanListMigration, /\blayer\b/i);
});

test("mountain foundation meizan full coverage classifies the 100 nihyakumeizan extras", () => {
  const nihyakumeizanExtraRows =
    meizanFullCoverageMigration.match(/\n    \('[^']+'\)/g) ?? [];

  assert.equal(nihyakumeizanExtraRows.length, 108);
  assert.match(meizanFullCoverageMigration, /with nihyakumeizan_extra_names/);
  assert.match(meizanFullCoverageMigration, /'天塩岳'/);
  assert.match(meizanFullCoverageMigration, /'燕岳'/);
  assert.match(meizanFullCoverageMigration, /'乾徳山'/);
  assert.match(meizanFullCoverageMigration, /'桜島'/);
  assert.match(meizanFullCoverageMigration, /nihyakumeizan_extra_aliases/);
  assert.match(meizanFullCoverageMigration, /when profile\.is_hyakumeizan then 'JAPAN_HYAKUMEIZAN'/);
  assert.match(meizanFullCoverageMigration, /profile\.name_ja/);
  assert.match(meizanFullCoverageMigration, /profile\.slug/);
  assert.match(repository, /isJapanNihyakumeizanExtraProfile/);

  for (const source of [
    tripRequirementEngine,
    packRequirementEngine,
    gearMatchingEngine
  ]) {
    assert.doesNotMatch(source, /JAPAN_NIHYAKUMEIZAN_EXTRA/);
    assert.doesNotMatch(source, /meizan_list/);
  }

  assert.doesNotMatch(meizanFullCoverageMigration, /\bcreate table\b/i);
  assert.doesNotMatch(meizanFullCoverageMigration, /\binsert into\b/i);
  assert.doesNotMatch(meizanFullCoverageMigration, /\btruth\b/i);
  assert.doesNotMatch(meizanFullCoverageMigration, /\bevidence\b/i);
  assert.doesNotMatch(meizanFullCoverageMigration, /\baudit\b/i);
  assert.doesNotMatch(meizanFullCoverageMigration, /\blayer\b/i);
});

test("mountain foundation meizan 200 migration upserts static profiles only", () => {
  const profileRows = meizan200ProfilesMigration.match(/\n  \('[a-z0-9-]+',/g) ?? [];
  const hyakumeizanRows =
    meizan200ProfilesMigration.match(/'JAPAN_HYAKUMEIZAN'/g) ?? [];
  const nihyakumeizanExtraRows =
    meizan200ProfilesMigration.match(/'JAPAN_NIHYAKUMEIZAN_EXTRA'/g) ?? [];

  assert.equal(profileRows.length, 200);
  assert.equal(hyakumeizanRows.length, 100);
  assert.equal(nihyakumeizanExtraRows.length, 100);

  for (const slug of [
    "rishiri-zan",
    "hachimantai",
    "iide-san",
    "tsurugi-dake",
    "fuji-san",
    "miyanoura-dake",
    "teshio-dake",
    "kentoku-san",
    "tsubakuro-dake",
    "sakurajima"
  ]) {
    assert.match(meizan200ProfilesMigration, new RegExp(`'${slug}'`));
  }

  for (const attribute of [
    "active_volcano_status",
    "jma_volcano_name",
    "restriction_status_note",
    "snow_free_month_guide",
    "mandatory_gear_note",
    "supplementary_notes"
  ]) {
    assert.match(meizan200ProfilesMigration, new RegExp(attribute));
    assert.doesNotMatch(
      meizan200ProfilesMigration,
      new RegExp(`${attribute} = excluded\\.${attribute}`)
    );
  }

  for (const source of [
    tripRequirementEngine,
    packRequirementEngine,
    gearMatchingEngine
  ]) {
    assert.doesNotMatch(source, /JAPAN_NIHYAKUMEIZAN_EXTRA/);
    assert.doesNotMatch(source, /meizan_list/);
  }

  assert.doesNotMatch(meizan200ProfilesMigration, /\bcreate table\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\bdelete\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\btruncate\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\btruth\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\bevidence\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\baudit\b/i);
  assert.doesNotMatch(meizan200ProfilesMigration, /\blayer\b/i);
});

test("mountain foundation Opus 4.8 reviewed fixes stay static and scoped", () => {
  for (const slug of [
    "rishiri-zan",
    "utsukushigahara",
    "kirigamine",
    "daibosatsu-rei",
    "tsurugi-san-shikoku"
  ]) {
    assert.match(opus48StaticFixesMigration, new RegExp(`where slug = '${slug}'`));
  }

  assert.match(opus48StaticFixesMigration, /bear_or_wildlife_risk = 'LOW'/);
  assert.match(opus48StaticFixesMigration, /route_seriousness = 'LOW'/);
  assert.match(opus48StaticFixesMigration, /route_seriousness = 'MODERATE'/);
  assert.match(opus48StaticFixesMigration, /technical_terrain = 'MAINTAINED_TRAIL'/);

  assert.doesNotMatch(opus48StaticFixesMigration, /\bcreate table\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\balter table\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\binsert into\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\bdelete\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\btruncate\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\btruth\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\bevidence\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\baudit\b/i);
  assert.doesNotMatch(opus48StaticFixesMigration, /\blayer\b/i);

  for (const source of [
    tripRequirementEngine,
    packRequirementEngine,
    gearMatchingEngine
  ]) {
    assert.doesNotMatch(source, /rishiri-zan/);
    assert.doesNotMatch(source, /utsukushigahara/);
    assert.doesNotMatch(source, /kirigamine/);
    assert.doesNotMatch(source, /daibosatsu-rei/);
    assert.doesNotMatch(source, /tsurugi-san-shikoku/);
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

test("mountain foundation Tohoku region correction stays scoped to two profiles", () => {
  assert.match(
    tohokuRegionProfileCorrectionsMigration,
    /update public\.mountain_foundation_profiles/i
  );
  assert.match(tohokuRegionProfileCorrectionsMigration, /region = 'TOHOKU'/);
  assert.match(tohokuRegionProfileCorrectionsMigration, /primary_region = 'TOHOKU'/);
  assert.match(
    tohokuRegionProfileCorrectionsMigration,
    /where slug in \('asahi-dake-tohoku', 'iide-san'\)/i
  );

  for (const slug of ["asahi-dake-tohoku", "iide-san"]) {
    assert.match(tohokuRegionProfileCorrectionsMigration, new RegExp(`'${slug}'`));
  }

  for (const untouchedSlug of [
    "taishaku-san",
    "oizuru-gatake",
    "hokkaido-komagatake",
    "kamuro-san",
    "shokanbetsu-dake"
  ]) {
    assert.doesNotMatch(
      tohokuRegionProfileCorrectionsMigration,
      new RegExp(`'${untouchedSlug}'`)
    );
  }

  for (const untouchedField of [
    "mandatory_gear_note",
    "supplementary_notes",
    "restriction_status_note",
    "mountain_range",
    "prefectures",
    "name_ja",
    "updated_at"
  ]) {
    assert.doesNotMatch(
      tohokuRegionProfileCorrectionsMigration,
      new RegExp(untouchedField)
    );
  }

  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\bcreate\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\balter\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\bdrop\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\binsert\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\bdelete\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\btruncate\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\buser_gear\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\bpolicy\b/i);
  assert.doesNotMatch(tohokuRegionProfileCorrectionsMigration, /\brls\b/i);
});
