import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const engineSource = readFileSync(
  new URL("../src/lib/pack-requirements/engine.ts", import.meta.url),
  "utf8"
);
const repositorySource = readFileSync(
  new URL("../src/lib/data/pack-requirements.ts", import.meta.url),
  "utf8"
);
const migrationSource = readFileSync(
  new URL("../supabase/migrations/010_pack_requirement_slots_v1.sql", import.meta.url),
  "utf8"
);
const typesSource = readFileSync(new URL("../src/lib/types.ts", import.meta.url), "utf8");
const gearMatchingSource = readFileSync(
  new URL("../src/lib/gear-matching/engine.ts", import.meta.url),
  "utf8"
);

const { outputText: gearMatchingOutputText } = ts.transpileModule(gearMatchingSource, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022
  }
});
const gearMatchingDataUrl = `data:text/javascript;base64,${Buffer.from(
  gearMatchingOutputText
).toString("base64")}`;

const { outputText } = ts.transpileModule(
  engineSource.replace(
    'from "@/lib/gear-matching/engine"',
    `from "${gearMatchingDataUrl}"`
  ),
  {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  }
);
const engineModule = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const { generatePackRequirementPlan, getRequirementSlotsForTrip } = engineModule;

const mountain = {
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

function gear({
  id,
  name,
  category,
  subcategory
}) {
  return {
    id,
    user_id: "user-1",
    product_id: null,
    category_id: `${category}-id`,
    subcategory_id: `${subcategory}-id`,
    name,
    brand: null,
    model: null,
    weight_grams: 1,
    official_weight_grams: null,
    measured_weight_grams: null,
    msrp_jpy: null,
    purchase_price_jpy: null,
    size: null,
    volume: null,
    color: null,
    material: null,
    capacity: null,
    official_url: null,
    image_url: null,
    purchase_date: null,
    status: "owned",
    weight_type: "base",
    memo: null,
    created_at: "2026-06-06T00:00:00.000Z",
    updated_at: "2026-06-06T00:00:00.000Z",
    gear_categories: {
      id: `${category}-id`,
      name_ja: category,
      name_en: category
    },
    gear_subcategories: {
      id: `${subcategory}-id`,
      name_ja: subcategory,
      name_en: subcategory
    }
  };
}

test("pack requirement generator activates slots from required systems and style", () => {
  assert.deepEqual(
    getRequirementSlotsForTrip(
      ["WATER_SYSTEM", "SHELTER_SYSTEM", "SLEEP_SYSTEM", "COOK_SYSTEM"],
      "OVERNIGHT_TENT"
    ),
    [
      "WATER_STORAGE",
      "WATER_TREATMENT",
      "TENT",
      "SLEEP_INSULATION",
      "SLEEP_PAD",
      "STOVE",
      "FUEL",
      "COOK_POT",
      "TABLEWARE"
    ]
  );

  assert.deepEqual(getRequirementSlotsForTrip(["SLEEP_SYSTEM"], "OVERNIGHT_HUT"), [
    "SLEEP_INSULATION"
  ]);

  assert.deepEqual(getRequirementSlotsForTrip(["SHELTER_SYSTEM"], "OVERNIGHT_HUT"), []);
});

test("pack requirement generator reports covered and missing slots from owned gear", () => {
  const plan = generatePackRequirementPlan({
    mountain,
    season: "SUMMER",
    style: "OVERNIGHT_TENT",
    requiredSystems: [
      "WATER_SYSTEM",
      "SHELTER_SYSTEM",
      "SLEEP_SYSTEM",
      "COOK_SYSTEM",
      "RAIN_SYSTEM",
      "NAVIGATION_SYSTEM",
      "EMERGENCY_SYSTEM"
    ],
    ownedGear: [
      gear({
        id: "tent-1",
        name: "Owned Tent",
        category: "shelter",
        subcategory: "tent"
      }),
      gear({
        id: "stove-1",
        name: "Owned Stove",
        category: "cooking",
        subcategory: "stove"
      }),
      gear({
        id: "headlamp-1",
        name: "Owned Headlamp",
        category: "electronics",
        subcategory: "headlamp"
      })
    ]
  });

  assert.deepEqual(
    plan.covered_slots.map((slot) => slot.slot),
    ["TENT", "STOVE", "HEADLAMP"]
  );
  assert.deepEqual(
    plan.missing_slots.map((slot) => slot.slot),
    [
      "WATER_STORAGE",
      "WATER_TREATMENT",
      "SLEEP_INSULATION",
      "SLEEP_PAD",
      "FUEL",
      "COOK_POT",
      "TABLEWARE",
      "RAIN_JACKET",
      "RAIN_PANTS",
      "GPS_DEVICE",
      "POWER_BANK",
      "FIRST_AID_KIT"
    ]
  );

  assert.equal(plan.required_slots.length, 15);
  assert.equal(plan.covered_slots[0].coverage_status, "COVERED");
  assert.equal(plan.covered_slots[0].matching_owned_gear[0].name, "Owned Tent");
  assert.equal(plan.missing_slots[0].coverage_status, "MISSING");
  assert.deepEqual(plan.missing_slots[0].matching_owned_gear, []);
});

test("pack requirement layer consumes trip requirements and owned gear only", () => {
  assert.match(repositorySource, /getRequiredSystemsForTrip/);
  assert.match(repositorySource, /getUserGear\(\{ status: "owned" \}\)/);
  assert.match(repositorySource, /generatePackRequirementPlan/);
  assert.match(engineSource, /matchGearForRequirementSlot/);
  assert.match(migrationSource, /'bottle'/);
  assert.match(typesSource, /PackRequirementPlan/);
  assert.match(typesSource, /RequirementSlot/);

  for (const source of [engineSource, repositorySource]) {
    assert.doesNotMatch(source, /\b(openai|ai recommendation|weather|route|risk)\b/i);
    assert.doesNotMatch(source, /\b(recommend|shopping|wishlist|upgrade|best gear)\b/i);
    assert.doesNotMatch(source, /\b(score|rank|priority)\b/i);
  }
});
