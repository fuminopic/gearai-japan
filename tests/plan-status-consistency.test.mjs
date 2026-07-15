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
const heroGaugeSource = readFileSync(
  new URL("../src/components/hero-gauge.tsx", import.meta.url),
  "utf8"
);

const checklistOwnedGearMatchersDataUrl = await toTranspiledDataUrl(
  checklistOwnedGearMatchersSource
);
const { filterCheckedSlotsForPlan } = await importTranspiled(
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
  assert.deepEqual(
    filterCheckedSlotsForPlan(["RAIN_JACKET", "HEADLAMP"], changedStylePlan),
    ["HEADLAMP"]
  );
});

test("completed rows prefer owned labels while retaining manual confirmation state", () => {
  assert.match(tripPlanningUiSource, /const confirmedItems = fullCategory\.items\.filter/);
  assert.match(tripPlanningUiSource, /const status = getChecklistItemStatus\(item\)/);
  assert.match(tripPlanningUiSource, /\{status\.label\}/);
  assert.match(tripPlanningUiSource, /matchingOwnedGear\.length > 0/);
  assert.match(tripPlanningUiSource, /label: "所持済み"/);
  assert.match(tripPlanningUiSource, /label: "確認済み"/);
});

test("dashboard uses fresh checklist progress whenever it is available", () => {
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
