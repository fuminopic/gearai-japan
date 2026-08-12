import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const rootUrl = new URL("../", import.meta.url);

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, rootUrl), "utf8");
}

const tripPlanStorageSource = readSource("src/lib/trip-plan-storage.ts");
const checklistStateClientSource = readSource(
  "src/lib/trip-plan-checklist-item-state-client.ts"
);
const checklistStateHookSource = readSource(
  "src/hooks/use-trip-plan-checklist-only-state.ts"
);
const tripPlanningUiSource = readSource("src/components/trip-planning-ui.tsx");
const heroGaugeSource = readSource("src/components/hero-gauge.tsx");
const dashboardChecklistSource = readSource(
  "src/components/dashboard-plan-checklist-summary.tsx"
);

test("legacy checklist-only storage is user and plan scoped migration input", () => {
  assert.match(tripPlanStorageSource, /buildTripPlanChecklistOnlyStorageKey/);
  assert.match(tripPlanStorageSource, /buildLegacyTripPlanChecklistOnlyStorageKey/);
  assert.match(
    tripPlanStorageSource,
    /buildTripPlanChecklistOnlySupabaseMigrationStorageKey/
  );
  assert.match(tripPlanStorageSource, /checklist-only-supabase-migrated/);
  assert.match(tripPlanStorageSource, /hasTripPlanChecklistOnlySupabaseMigration/);
  assert.match(
    tripPlanStorageSource,
    /markTripPlanChecklistOnlySupabaseMigrationComplete/
  );
});

test("saved plan checklist-only state uses Supabase while an unsaved draft stays local", () => {
  assert.match(tripPlanningUiSource, /useTripPlanChecklistOnlyState\(/);
  assert.match(
    tripPlanningUiSource,
    /const currentChecklistOnlyIds = planId[\s\S]*\? checklistOnlyState\.checkedIds[\s\S]*: interactiveChecklistOnlyIdsForCurrentPlan \?\? \[\]/
  );
  assert.match(tripPlanningUiSource, /onChecklistOnlyItemChange=/);
  assert.match(tripPlanningUiSource, /persistTripPlanChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /writeTripPlanChecklistOnlyIds/);
  assert.match(tripPlanningUiSource, /確認状態を保存できませんでした。/);
  assert.match(tripPlanningUiSource, /再試行/);
  assert.doesNotMatch(tripPlanningUiSource, /readStoredChecklistOnlyIds/);
});

test("server state is migrated idempotently and wins over an existing local value", () => {
  assert.match(checklistStateClientSource, /readTripPlanChecklistOnlyStates/);
  assert.match(checklistStateClientSource, /mergeLegacyChecklistOnlyIds/);
  assert.match(checklistStateClientSource, /ignoreDuplicates: true/);
  assert.match(checklistStateClientSource, /onConflict: "user_id,plan_id,checklist_item_id"/);
  assert.match(checklistStateClientSource, /markTripPlanChecklistOnlySupabaseMigrationComplete/);
  const canonicalReadIndex = checklistStateClientSource.indexOf(
    "? await readTripPlanChecklistOnlyStates"
  );
  const migrationMarkerIndex = checklistStateClientSource.lastIndexOf(
    "markTripPlanChecklistOnlySupabaseMigrationComplete"
  );
  assert.ok(canonicalReadIndex >= 0 && canonicalReadIndex < migrationMarkerIndex);
  assert.match(checklistStateClientSource, /is_checked: isChecked/);
});

test("a failed write keeps the local migration input and later attempts remain retryable", () => {
  assert.match(checklistStateHookSource, /readTripPlanChecklistOnlyIds/);
  assert.match(checklistStateHookSource, /setStatus\("error"\)/);
  assert.match(checklistStateHookSource, /const retry = useCallback/);
  assert.match(checklistStateHookSource, /retryNonce/);
  assert.match(checklistStateHookSource, /current\[checklistItemId\] !== isChecked/);
});

test("dashboard and hero hydrate checklist-only confirmations from Supabase", () => {
  for (const source of [heroGaugeSource, dashboardChecklistSource]) {
    assert.match(source, /readTripPlanChecklistOnlyStates/);
    assert.match(source, /checkedChecklistOnlyIds/);
    assert.match(source, /applyChecklistStateToChecklist/);
    assert.doesNotMatch(source, /readTripPlanChecklistOnlyIds/);
  }
});
