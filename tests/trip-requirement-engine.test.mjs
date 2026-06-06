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
    ["WATER_SYSTEM", "RAIN_SYSTEM", "NAVIGATION_SYSTEM", "EMERGENCY_SYSTEM"]
  );
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
