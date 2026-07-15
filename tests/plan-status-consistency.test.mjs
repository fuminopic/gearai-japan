import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";

const planChecklistSource = readFileSync(
  new URL("../src/lib/plan-checklist.ts", import.meta.url),
  "utf8"
);
const checklistOwnedGearMatchersSource = readFileSync(
  new URL("../src/lib/checklist-owned-gear-matchers.ts", import.meta.url),
  "utf8"
);
const tripPlanningUiSource = readFileSync(
  new URL("../src/components/trip-planning-ui.tsx", import.meta.url),
  "utf8"
);
const planPageContentSource = readFileSync(
  new URL("../src/components/plan-page-content.tsx", import.meta.url),
  "utf8"
);
const packActionsSource = readFileSync(
  new URL("../src/lib/actions/pack.ts", import.meta.url),
  "utf8"
);
const heroGaugeSource = readFileSync(
  new URL("../src/components/hero-gauge.tsx", import.meta.url),
  "utf8"
);
const dashboardSource = readFileSync(
  new URL("../app/(app)/dashboard/page.tsx", import.meta.url),
  "utf8"
);
const tripPlanActionsSource = readFileSync(
  new URL("../src/lib/actions/trip-plans.ts", import.meta.url),
  "utf8"
);
const uncheckedPackedSlotsMigrationSource = readFileSync(
  new URL(
    "../supabase/migrations/20260715150031_trip_plans_unchecked_packed_slots.sql",
    import.meta.url
  ),
  "utf8"
);

const checklistOwnedGearMatchersDataUrl = await toTranspiledDataUrl(
  checklistOwnedGearMatchersSource
);
const {
  applyChecklistStateToChecklist,
  buildPlanChecklist,
  buildPreDepartureSummary,
  filterCheckedSlotsForPlan
} = await importTranspiled(
  planChecklistSource.replace(
    'from "@/lib/checklist-owned-gear-matchers"',
    `from "${checklistOwnedGearMatchersDataUrl}"`
  )
);

function planWithSlots(slots, coverageStatus = "MISSING") {
  return {
    required_slots: slots.map((slot) => ({
      slot,
      coverage_status: coverageStatus
    }))
  };
}

test("manual checked slots survive coverage changes but stale plan slots are removed", () => {
  const coveredSummerPlan = planWithSlots(["RAIN_JACKET", "HEADLAMP"], "COVERED");

  assert.deepEqual(
    filterCheckedSlotsForPlan(
      ["RAIN_JACKET", "RAIN_JACKET", "HEADLAMP", "NOT_A_SLOT"],
      coveredSummerPlan
    ),
    ["RAIN_JACKET", "HEADLAMP"]
  );

  const changedStylePlan = planWithSlots(["HEADLAMP"]);
  const staleUncheckedPackedSlots = ["RAIN_JACKET", "HEADLAMP"];
  assert.deepEqual(
    filterCheckedSlotsForPlan(staleUncheckedPackedSlots, changedStylePlan),
    ["HEADLAMP"]
  );
  assert.deepEqual(
    filterCheckedSlotsForPlan(["RAIN_JACKET", "HEADLAMP"], changedStylePlan),
    ["HEADLAMP"]
  );
});

test("pack, owned, and missing status use actual matching gear IDs with packed defaults", () => {
  const ownedGear = {
    id: "owned-rain-jacket",
    name: "Rain Jacket",
    brand: null,
    model: null,
    category_id: "clothing-category",
    subcategory_id: "rain-jacket-subcategory",
    gear_categories: { id: "clothing-category", name_en: "clothing", name_ja: "衣類" },
    gear_subcategories: {
      id: "rain-jacket-subcategory",
      name_en: "rain_jacket",
      name_ja: "レインジャケット"
    },
    gear_products: null
  };
  const secondOwnedGear = {
    ...ownedGear,
    id: "owned-rain-jacket-second",
    name: "Second Rain Jacket"
  };
  const plan = {
    mountain: {
      helmet_guidance: "NOT_NEEDED",
      technical_terrain: "MAINTAINED_TRAIL",
      route_seriousness: "LOW",
      snow_or_ice_risk: "NONE",
      volcanic_risk: "NONE",
      bear_or_wildlife_risk: "LOW",
      tent_site_availability: "NONE",
      hut_support: "NONE"
    },
    season: "SUMMER",
    style: "DAY_HIKE",
    required_slots: [
      {
        slot: "RAIN_JACKET",
        coverage_status: "COVERED",
        matching_owned_gear: [ownedGear, secondOwnedGear]
      }
    ]
  };
  const unconfirmedChecklist = buildPlanChecklist({ plan, ownedGear: [ownedGear] });
  const unconfirmedItem = unconfirmedChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");
  const packedChecklist = buildPlanChecklist({
    plan,
    ownedGear: [ownedGear, secondOwnedGear],
    packedGearIds: [secondOwnedGear.id]
  });
  const packedItem = packedChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");
  const packedCancelledChecklist = buildPlanChecklist({
    plan,
    ownedGear: [ownedGear, secondOwnedGear],
    packedGearIds: [secondOwnedGear.id],
    uncheckedPackedSlots: ["RAIN_JACKET"]
  });
  const packedCancelledItem = packedCancelledChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");
  const explicitlyCheckedPackedChecklist = buildPlanChecklist({
    plan,
    checkedSlots: ["RAIN_JACKET"],
    ownedGear: [ownedGear, secondOwnedGear],
    packedGearIds: [secondOwnedGear.id],
    uncheckedPackedSlots: ["RAIN_JACKET"]
  });
  const unpackedChecklist = buildPlanChecklist({
    plan,
    ownedGear: [ownedGear, secondOwnedGear]
  });
  const unpackedItem = unpackedChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");
  const confirmedChecklist = buildPlanChecklist({
    plan,
    checkedSlots: ["RAIN_JACKET"],
    ownedGear: [ownedGear]
  });
  const confirmedItem = confirmedChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");

  assert.equal(unconfirmedItem?.checked, false);
  assert.equal(unconfirmedItem?.gearStatus, "OWNED");
  assert.equal(packedItem?.gearStatus, "PACKED");
  assert.equal(packedItem?.checked, true);
  assert.equal(packedItem?.slotCoverage[0]?.isConfirmed, true);
  assert.equal(packedItem?.slotCoverage[0]?.isExplicitlyChecked, false);
  assert.equal(unpackedItem?.gearStatus, "OWNED");
  assert.equal(unpackedItem?.checked, false);
  assert.ok(packedChecklist.summary.percent > unconfirmedChecklist.summary.percent);
  assert.equal(packedCancelledItem?.checked, false);
  assert.equal(packedCancelledItem?.slotCoverage[0]?.isPackedUnchecked, true);
  assert.equal(
    packedCancelledChecklist.summary.percent,
    unconfirmedChecklist.summary.percent
  );
  assert.equal(explicitlyCheckedPackedChecklist.summary.percent, packedChecklist.summary.percent);
  assert.deepEqual(unconfirmedItem?.toggleSlots, ["RAIN_JACKET"]);
  assert.equal(buildPreDepartureSummary(unconfirmedChecklist).confirmationCount > 0, true);
  assert.equal(confirmedItem?.checked, true);
  assert.equal(confirmedItem?.gearStatus, "OWNED");
  assert.ok(confirmedChecklist.summary.percent > unconfirmedChecklist.summary.percent);

  const dashboardChecklist = applyChecklistStateToChecklist({
    checklist: packedChecklist,
    uncheckedPackedSlots: ["RAIN_JACKET"]
  });
  assert.equal(
    dashboardChecklist.summary.percent,
    packedCancelledChecklist.summary.percent
  );

  const gearRemovedPlan = {
    ...plan,
    required_slots: [
      {
        slot: "RAIN_JACKET",
        coverage_status: "MISSING",
        matching_owned_gear: []
      }
    ]
  };
  const gearRemovedChecklist = buildPlanChecklist({
    plan: gearRemovedPlan,
    checkedSlots: ["RAIN_JACKET"]
  });
  const gearRemovedItem = gearRemovedChecklist.categories
    .flatMap((category) => category.items)
    .find((item) => item.id === "clothing-rainwear");
  assert.equal(gearRemovedItem?.matchingOwnedGear.length, 0);
  assert.equal(gearRemovedItem?.gearStatus, "MISSING");
  assert.equal(gearRemovedItem?.checked, true);
  assert.equal(buildPreDepartureSummary(gearRemovedChecklist).missingCount, 0);
  assert.equal(
    gearRemovedChecklist.summary.missingCount,
    unconfirmedChecklist.summary.missingCount - 1
  );
});

test("plan rows consistently display pack, owned, missing, and manual confirmation states", () => {
  assert.match(tripPlanningUiSource, /const confirmedItems = fullCategory\.items\.filter/);
  assert.match(tripPlanningUiSource, /const status = getChecklistItemStatus\(item\)/);
  assert.match(tripPlanningUiSource, /\{status\.label\}/);
  assert.match(tripPlanningUiSource, /item\.gearStatus === "PACKED"/);
  assert.match(tripPlanningUiSource, /item\.gearStatus === "OWNED"/);
  assert.match(tripPlanningUiSource, /item\.gearStatus === "MISSING" && !item\.checked/);
  assert.match(tripPlanningUiSource, /label: "パック済み"/);
  assert.match(tripPlanningUiSource, /label: "所持済み"/);
  assert.match(tripPlanningUiSource, /confirmationLabel: item\.checked \? "確認済み" : "未確認"/);
  assert.match(tripPlanningUiSource, /label: "確認済み"/);
  assert.match(tripPlanningUiSource, /label: "対応済み"/);
  assert.match(tripPlanningUiSource, /packedGearIds: packGearIds/);
  assert.equal(
    tripPlanningUiSource.match(/packedGearIds: packGearIds/g)?.length,
    2
  );
  assert.match(tripPlanningUiSource, /\["所持・パック", counts\.covered/);
  assert.match(
    tripPlanningUiSource,
    /getPreDepartureItemActionStatus\(item\) === "MISSING"/
  );
});

test("plan data loads pack IDs once and pack actions revalidate plan state", () => {
  assert.match(planPageContentSource, /import \{ getPackGearIds \} from "@\/lib\/data\/pack"/);
  assert.match(planPageContentSource, /getOwnedGearForPlanning\(\),\s*getPackGearIds\(\)/);
  assert.match(planPageContentSource, /packGearIds=\{packGearIds\}/);
  assert.doesNotMatch(planPageContentSource, /required_slots\.map[\s\S]{0,800}getPackGearIds/);
  assert.match(packActionsSource, /revalidatePath\("\/plan"\)/);
  assert.match(packActionsSource, /revalidatePath\("\/dashboard"\)/);
});

test("saved plans persist packed confirmation overrides and dashboard uses the same checklist state", () => {
  assert.match(
    uncheckedPackedSlotsMigrationSource,
    /add column if not exists unchecked_packed_slots text\[\] not null default '\{\}'::text\[\]/
  );
  assert.match(tripPlanActionsSource, /formData\.get\("unchecked_packed_slots"\)/);
  assert.match(tripPlanActionsSource, /unchecked_packed_slots: uncheckedPackedSlots/);
  assert.match(dashboardSource, /getPackGearIds\(\)/);
  assert.match(dashboardSource, /uncheckedPackedSlots: trip\.unchecked_packed_slots/);
  assert.match(dashboardSource, /packedGearIds/);
  assert.match(heroGaugeSource, /const percent = hydrated\?\.summary\.percent \?\? fallbackPercent/);
  assert.doesNotMatch(heroGaugeSource, /Math\.max\(fallbackPercent/);
});

async function importTranspiled(source) {
  return import(await toTranspiledDataUrl(source));
}

async function toTranspiledDataUrl(source) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022
    }
  });

  return `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`;
}
