import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import ts from "typescript";

const rootUrl = new URL("../", import.meta.url);

function readSource(relativePath) {
  return readFileSync(new URL(relativePath, rootUrl), "utf8");
}

async function importPureModule(relativePath) {
  const source = readSource(relativePath);
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022
    }
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const migrationSource = readSource(
  "supabase/migrations/20260812103621_trip_plan_checklist_item_states.sql"
);
const clientSource = readSource("src/lib/trip-plan-checklist-item-state-client.ts");

test("checklist-only state schema is relational, unique, plan-cascaded, and RLS protected", () => {
  assert.match(migrationSource, /create table if not exists public\.trip_plan_checklist_item_states/);
  assert.match(
    migrationSource,
    /plan_id uuid not null references public\.trip_plans\(id\) on delete cascade/
  );
  assert.match(
    migrationSource,
    /primary key \(user_id, plan_id, checklist_item_id\)/
  );
  assert.match(migrationSource, /create index if not exists trip_plan_checklist_item_states_plan_id_idx/);
  assert.match(migrationSource, /enable row level security/);
  assert.match(migrationSource, /for select/);
  assert.match(migrationSource, /for insert/);
  assert.match(migrationSource, /for update/);
  assert.match(migrationSource, /for delete/);
  assert.match(migrationSource, /trip_plans\.user_id = \(select auth\.uid\(\)\)/);
  assert.match(migrationSource, /set_trip_plan_checklist_item_states_updated_at/);
});

test("legacy local confirmations only fill missing server rows and cannot override an explicit uncheck", async () => {
  const { mergeLegacyChecklistOnlyIds, applyChecklistOnlyItemState } = await importPureModule(
    "src/lib/trip-plan-checklist-item-state.ts"
  );

  assert.deepEqual(
    mergeLegacyChecklistOnlyIds({
      localIds: ["map", "insurance"],
      remoteStates: [
        { checklist_item_id: "map", is_checked: false },
        { checklist_item_id: "insurance", is_checked: true }
      ]
    }),
    { checkedIds: ["insurance"], missingLocalIds: [] }
  );
  assert.deepEqual(
    mergeLegacyChecklistOnlyIds({
      localIds: ["map", "map", "insurance"],
      remoteStates: []
    }),
    { checkedIds: ["map", "insurance"], missingLocalIds: ["map", "insurance"] }
  );
  assert.deepEqual(
    applyChecklistOnlyItemState({
      checkedIds: ["map"],
      itemId: "map",
      isChecked: false
    }),
    []
  );
});

test("client writes a canonical checked or unchecked state without checklist snapshots", () => {
  assert.match(clientSource, /is_checked: isChecked/);
  assert.match(clientSource, /is_checked: true/);
  assert.doesNotMatch(clientSource, /checklist_snapshot|JSON\.stringify/);
});
