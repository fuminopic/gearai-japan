import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const foodWaterSource = readFileSync(
  new URL("../src/lib/plan-food-water.ts", import.meta.url),
  "utf8"
);
const migrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260724061551_add_trip_plan_food_water_weights.sql",
    import.meta.url
  ),
  "utf8"
);
const planActionsSource = readFileSync(
  new URL("../src/lib/actions/trip-plans.ts", import.meta.url),
  "utf8"
);
const tripPlansDataSource = readFileSync(
  new URL("../src/lib/data/trip-plans.ts", import.meta.url),
  "utf8"
);
const planUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const foodWaterSettingsSource = readFileSync(
  new URL("../src/components/plan-food-water-settings.tsx", import.meta.url),
  "utf8"
);
const packDataSource = readFileSync(
  new URL("../src/lib/data/pack.ts", import.meta.url),
  "utf8"
);
const packContentsSource = readFileSync(
  new URL("../src/components/pack-contents.tsx", import.meta.url),
  "utf8"
);
const dashboardSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);
const packShareImageSource = readFileSync(
  new URL("../src/lib/pack-share-image.ts", import.meta.url),
  "utf8"
);
const checklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);

const { normalizePlanFoodWater, getPlanFoodWaterWeightG } = await import(
  toDataUrl(foodWaterSource)
);

test("water and food weights are normalized per plan without creating virtual snack weight", () => {
  const value = normalizePlanFoodWater({
    waterVolumeMl: 1499,
    trailFoodIncluded: true,
    trailFoodWeightG: 275,
    mealCount: 2.4,
    mealWeightG: 726
  });

  assert.deepEqual(value, {
    waterVolumeMl: 1500,
    trailFoodIncluded: true,
    trailFoodWeightG: 300,
    mealCount: 2,
    mealWeightG: 750
  });
  assert.equal(getPlanFoodWaterWeightG(value), 2550);

  const noSnack = normalizePlanFoodWater({
    waterVolumeMl: 0,
    trailFoodIncluded: false,
    trailFoodWeightG: 600,
    mealCount: 0,
    mealWeightG: 0
  });
  assert.equal(noSnack.trailFoodWeightG, 0);
  assert.equal(getPlanFoodWaterWeightG(noSnack), 0);
});

test("trip plans add idempotent plan-only food and water columns with safe defaults", () => {
  for (const column of [
    "water_volume_ml integer not null default 0",
    "trail_food_included boolean not null default false",
    "trail_food_weight_g integer not null default 0",
    "meal_count integer not null default 0",
    "meal_weight_g integer not null default 0"
  ]) {
    assert.match(migrationSource, new RegExp(column));
  }
  assert.match(migrationSource, /add column if not exists/);
  assert.match(migrationSource, /trip_plans_water_volume_ml_range/);
  assert.match(migrationSource, /trip_plans_meal_weight_g_range/);
  assert.doesNotMatch(migrationSource, /public\.(user_gear|gear_products|user_pack_items)/i);
  assert.doesNotMatch(migrationSource, /update\s+public\./i);
});

test("plan persistence, edit flow, and read fallback keep food-water values scoped to the plan", () => {
  for (const field of [
    "water_volume_ml",
    "trail_food_included",
    "trail_food_weight_g",
    "meal_count",
    "meal_weight_g"
  ]) {
    assert.match(planActionsSource, new RegExp(`${field}: foodWater`));
    assert.match(planUiSource, new RegExp(`name="${field}"`));
    assert.match(tripPlansDataSource, new RegExp(field));
  }
  assert.match(planActionsSource, /parsePlanFoodWater/);
  assert.match(planActionsSource, /trailFoodIncluded[\s\S]*\? parseSteppedNonNegativeInteger[\s\S]*: 0/);
  assert.match(planActionsSource, /revalidatePath\("\/pack"\)/);
  assert.match(planUiSource, /<PlanFoodWaterSettings/);
  assert.match(planUiSource, /formData\.set\("water_volume_ml"/);
  assert.match(tripPlansDataSource, /legacyTripPlanSelect/);
  assert.match(tripPlansDataSource, /isMissingPlanFoodWaterColumnError/);
});

test("water and food stay as a separate pack weight layer while the home gear card stays compact", () => {
  for (const source of [packContentsSource]) {
    assert.match(source, /ギア重量/);
    assert.match(source, /水・食料/);
    assert.match(source, /総重量/);
  }
  assert.match(packDataSource, /getLatestTripPlan/);
  assert.match(packDataSource, /getPlanFoodWaterWeightG/);
  assert.match(packContentsSource, /totalWeightG = summary\.knownWeightG \+ foodWaterWeightG/);
  assert.match(packContentsSource, /totalWeightG,/);
  assert.match(packShareImageSource, /subtitle\?: string/);
  assert.match(foodWaterSettingsSource, /水・食料の合計重量/);
  assert.match(foodWaterSettingsSource, /grid-cols-\[76px_minmax\(0,1fr\)_auto\]/);
  assert.doesNotMatch(foodWaterSettingsSource, /この山行で持参する分を設定/);
  assert.doesNotMatch(dashboardSource, /function PackWeightBreakdown/);
  assert.doesNotMatch(dashboardSource, /ギア重量/);
  assert.doesNotMatch(dashboardSource, /水・食料/);
});

test("food-water settings keep the existing priorities and replace only their manual confirmation", () => {
  assert.match(checklistSource, /id: "food-water",[\s\S]*priority: "ESSENTIAL"/);
  assert.match(checklistSource, /id: "food-trail-snacks",[\s\S]*priority: "ESSENTIAL"/);
  assert.match(checklistSource, /id: "food-meals",[\s\S]*priority: "SUGGESTED"/);
  assert.match(checklistSource, /source: "PLAN_SETTING"/);
  assert.match(checklistSource, /getPlanFoodWaterChecklistItemChecked/);
  assert.match(planUiSource, /isPlanFoodWaterChecklistItem/);
});

function toDataUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });

  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
