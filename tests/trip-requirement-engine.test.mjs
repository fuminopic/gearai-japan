import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const engineSource = readFileSync(
  new URL("../src/lib/trip-requirements/engine.ts", import.meta.url),
  "utf8"
);
const repositorySource = readFileSync(
  new URL("../src/lib/data/trip-requirements.ts", import.meta.url),
  "utf8"
);
const typesSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");

const { outputText } = ts.transpileModule(engineSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const engineModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const { getRequiredSystemsForTrip } = engineModule;

const alpineProfile = {
  slug: "tsubakuro-dake",
  name_ja: "Tsubakuro-dake",
  region: "NORTHERN_ALPS_NAGANO",
  elevation_m: 2763,
  is_hyakumeizan: false,
  supported_seasons: ["SUMMER", "AUTUMN"],
  supported_styles: ["OVERNIGHT_HUT", "OVERNIGHT_TENT", "MULTI_DAY_TREK"],
  trip_profile: "ALPINE_TREK",
  typical_required_systems: [
    "WATER_SYSTEM",
    "SHELTER_SYSTEM",
    "SLEEP_SYSTEM",
    "COOK_SYSTEM",
    "RAIN_SYSTEM",
    "COLD_WEATHER_LAYER",
    "NAVIGATION_SYSTEM",
    "EMERGENCY_SYSTEM"
  ]
};

const dayHikeProfile = {
  slug: "takao-san",
  name_ja: "Takao-san",
  region: "KANTO_TOKYO",
  elevation_m: 599,
  is_hyakumeizan: false,
  supported_seasons: ["SPRING", "SUMMER", "AUTUMN", "WINTER"],
  supported_styles: ["DAY_HIKE"],
  trip_profile: "FRONT_COUNTRY_DAY_HIKE",
  typical_required_systems: [
    "WATER_SYSTEM",
    "RAIN_SYSTEM",
    "NAVIGATION_SYSTEM",
    "EMERGENCY_SYSTEM"
  ]
};

const broadDefaultDayHikeProfile = {
  ...dayHikeProfile,
  typical_required_systems: [
    "WATER_SYSTEM",
    "SHELTER_SYSTEM",
    "SLEEP_SYSTEM",
    "COOK_SYSTEM",
    "RAIN_SYSTEM",
    "COLD_WEATHER_LAYER",
    "NAVIGATION_SYSTEM",
    "EMERGENCY_SYSTEM"
  ]
};

const alpineV2Profile = {
  ...alpineProfile,
  typical_required_systems: [
    ...alpineProfile.typical_required_systems,
    "TECHNICAL_SAFETY_SYSTEM"
  ],
  route_seriousness: "EXTREME",
  technical_terrain: "EXPOSED_SCRAMBLE",
  helmet_guidance: "RECOMMENDED",
  water_availability: "HUT_OR_SHOP_RELIABLE",
  hut_support: "FULL_SERVICE",
  tent_site_availability: "DESIGNATED",
  alpine_environment: "HIGH_ALPINE_EXPOSED",
  snow_or_ice_risk: "SEASONAL_PATCHES",
  route_duration_band: "MULTI_DAY",
  escape_options: "LIMITED",
  cell_signal_reliability: "POOR",
  bear_or_wildlife_risk: "MODERATE",
  volcanic_risk: "NONE",
  season_opening_window: "SUMMER_AUTUMN"
};

const alpineV2WithoutTechnicalDefault = {
  ...alpineV2Profile,
  typical_required_systems: alpineV2Profile.typical_required_systems.filter(
    (system) => system !== "TECHNICAL_SAFETY_SYSTEM"
  )
};

const tsubakuroV2Profile = {
  ...alpineV2Profile,
  slug: "tsubakuro-dake",
  name_ja: "燕岳",
  route_seriousness: "HIGH",
  technical_terrain: "STEEP_ROCKY",
  helmet_guidance: "NOT_NEEDED",
  escape_options: "MODERATE",
  cell_signal_reliability: "PARTIAL"
};

const yarigatakeV2Profile = {
  ...alpineV2Profile,
  slug: "yarigatake",
  name_ja: "槍ヶ岳"
};

const okuhotakadakeV2Profile = {
  ...alpineV2Profile,
  slug: "okuhotakadake",
  name_ja: "奥穂高岳"
};

test("trip requirement engine returns normalized systems for the requested trip context", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineProfile,
      season: "SUMMER",
      style: "OVERNIGHT_TENT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "SLEEP_SYSTEM",
      "COOK_SYSTEM",
      "RAIN_SYSTEM",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );
});

test("trip requirement engine applies generic season and style rules only within the foundation profile", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineProfile,
      season: "AUTUMN",
      style: "OVERNIGHT_HUT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "SLEEP_SYSTEM",
      "COOK_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );

  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: dayHikeProfile,
      season: "WINTER",
      style: "DAY_HIKE"
    }),
    [
      "WATER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );
});

test("trip requirement engine treats safety rules as additive over mountain defaults", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: dayHikeProfile,
      season: "WINTER",
      style: "DAY_HIKE"
    }),
    [
      "WATER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );

  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineV2WithoutTechnicalDefault,
      season: "SUMMER",
      style: "OVERNIGHT_HUT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "TECHNICAL_SAFETY_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );

  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: {
        ...alpineV2WithoutTechnicalDefault,
        helmet_guidance: "NOT_NEEDED",
        technical_terrain: "STEEP_ROCKY",
        snow_or_ice_risk: "SEASONAL_PATCHES"
      },
      season: "AUTUMN",
      style: "OVERNIGHT_TENT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "SLEEP_SYSTEM",
      "COOK_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "TECHNICAL_SAFETY_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );
});

test("trip requirement engine keeps mountain defaults from expanding incompatible styles", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: broadDefaultDayHikeProfile,
      season: "SUMMER",
      style: "DAY_HIKE"
    }),
    ["WATER_SYSTEM", "RAIN_SYSTEM", "NAVIGATION_SYSTEM", "EMERGENCY_SYSTEM"]
  );

  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineV2Profile,
      season: "SUMMER",
      style: "OVERNIGHT_HUT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "TECHNICAL_SAFETY_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );
});

test("trip requirement engine uses V2 attributes for equipment-relevant systems", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineV2Profile,
      season: "SUMMER",
      style: "OVERNIGHT_HUT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "TECHNICAL_SAFETY_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );

  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: alpineV2Profile,
      season: "AUTUMN",
      style: "OVERNIGHT_TENT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "SLEEP_SYSTEM",
      "COOK_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "TECHNICAL_SAFETY_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );
});

test("trip requirement engine preserves reasonable V2 output for alpine examples", () => {
  assert.deepEqual(
    getRequiredSystemsForTrip({
      mountain: tsubakuroV2Profile,
      season: "SUMMER",
      style: "OVERNIGHT_HUT"
    }),
    [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "RAIN_SYSTEM",
      "COLD_WEATHER_LAYER",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ]
  );

  for (const mountain of [yarigatakeV2Profile, okuhotakadakeV2Profile]) {
    assert.deepEqual(
      getRequiredSystemsForTrip({
        mountain,
        season: "SUMMER",
        style: "OVERNIGHT_HUT"
      }),
      [
        "WATER_SYSTEM",
        "SHELTER_SYSTEM",
        "RAIN_SYSTEM",
        "COLD_WEATHER_LAYER",
        "NAVIGATION_SYSTEM",
        "TECHNICAL_SAFETY_SYSTEM",
        "EMERGENCY_SYSTEM"
      ]
    );
  }
});

test("trip requirement engine rejects unsupported mountain foundation context", () => {
  assert.throws(
    () =>
      getRequiredSystemsForTrip({
        mountain: alpineProfile,
        season: "WINTER",
        style: "OVERNIGHT_TENT"
      }),
    /Season WINTER is not supported/
  );

  assert.throws(
    () =>
      getRequiredSystemsForTrip({
        mountain: dayHikeProfile,
        season: "SUMMER",
        style: "OVERNIGHT_TENT"
      }),
    /Style OVERNIGHT_TENT is not supported/
  );
});

test("trip requirement layer consumes foundation data and stays out of later planning stages", () => {
  assert.match(engineSource, /typical_required_systems/);
  assert.match(engineSource, /supported_seasons/);
  assert.match(engineSource, /supported_styles/);
  assert.match(repositorySource, /getMountainFoundationProfileBySlug/);
  assert.match(repositorySource, /getRequiredSystemsForTrip/);
  assert.match(typesSource, /TripRequirementInput/);
  assert.match(typesSource, /TripRequirementLookupInput/);
  assert.match(typesSource, /MountainRouteSeriousness/);
  assert.match(typesSource, /MountainHelmetGuidance/);

  for (const source of [engineSource, repositorySource]) {
    assert.doesNotMatch(source, /\b(UserGear|user_gear|gear_products|gear_categories)\b/);
    assert.doesNotMatch(source, /\b(openai|ai recommendation|pack list|packlist)\b/i);
  }

  for (const mountainSpecificValue of [
    "takao-san",
    "kumotori-yama",
    "tsubakuro-dake",
    "jonen-dake",
    "cho-gatake",
    "yarigatake",
    "okuhotakadake"
  ]) {
    assert.doesNotMatch(engineSource, new RegExp(mountainSpecificValue));
  }
});
