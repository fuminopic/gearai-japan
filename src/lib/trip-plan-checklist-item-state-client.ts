"use client";

import { createClient } from "@/lib/supabase/client";
import {
  mergeLegacyChecklistOnlyIds,
  type TripPlanChecklistItemState,
  uniqueChecklistOnlyIds
} from "@/lib/trip-plan-checklist-item-state";
import {
  hasTripPlanChecklistOnlySupabaseMigration,
  markTripPlanChecklistOnlySupabaseMigrationComplete,
  readTripPlanChecklistOnlyIds
} from "@/lib/trip-plan-storage";

const tableName = "trip_plan_checklist_item_states";

type ClientStateRow = TripPlanChecklistItemState & {
  user_id?: string;
  plan_id?: string;
};

function toStateRows(rows: readonly ClientStateRow[] | null | undefined) {
  return (rows ?? []).map(({ checklist_item_id, is_checked }) => ({
    checklist_item_id,
    is_checked: is_checked === true
  }));
}

export async function readTripPlanChecklistOnlyStates({
  userId,
  planId
}: {
  userId: string;
  planId: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(tableName)
    .select("checklist_item_id, is_checked")
    .eq("user_id", userId)
    .eq("plan_id", planId);

  if (error) {
    throw new Error(error.message);
  }

  return toStateRows(data as ClientStateRow[] | null | undefined);
}

export async function migrateTripPlanChecklistOnlyState({
  userId,
  planId
}: {
  userId: string;
  planId: string;
}) {
  const remoteStates = await readTripPlanChecklistOnlyStates({ userId, planId });

  if (hasTripPlanChecklistOnlySupabaseMigration({ userId, planId })) {
    return {
      states: remoteStates
    };
  }

  const localIds = readTripPlanChecklistOnlyIds({ userId, planId }).value;
  const merged = mergeLegacyChecklistOnlyIds({ localIds, remoteStates });

  if (merged.missingLocalIds.length > 0) {
    const supabase = createClient();
    const { error } = await supabase.from(tableName).upsert(
      merged.missingLocalIds.map((checklist_item_id) => ({
        user_id: userId,
        plan_id: planId,
        checklist_item_id,
        is_checked: true
      })),
      // A migration may run in another tab/device at the same time. Existing
      // server state wins; legacy local data may fill only an absent row.
      {
        onConflict: "user_id,plan_id,checklist_item_id",
        ignoreDuplicates: true
      }
    );

    if (error) {
      throw new Error(error.message);
    }
  }

  const canonicalStates =
    merged.missingLocalIds.length > 0
      ? await readTripPlanChecklistOnlyStates({ userId, planId })
      : remoteStates;

  markTripPlanChecklistOnlySupabaseMigrationComplete({ userId, planId });

  return {
    states: canonicalStates
  };
}

export async function writeTripPlanChecklistOnlyItemState({
  userId,
  planId,
  checklistItemId,
  isChecked
}: {
  userId: string;
  planId: string;
  checklistItemId: string;
  isChecked: boolean;
}) {
  const [normalizedItemId] = uniqueChecklistOnlyIds([checklistItemId]);

  if (!normalizedItemId) {
    throw new Error("確認項目が不正です。");
  }

  const supabase = createClient();
  const { error } = await supabase.from(tableName).upsert(
    {
      user_id: userId,
      plan_id: planId,
      checklist_item_id: normalizedItemId,
      is_checked: isChecked
    },
    { onConflict: "user_id,plan_id,checklist_item_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

/** Used after creating a plan that already has draft checklist-only checks. */
export async function persistTripPlanChecklistOnlyIds({
  userId,
  planId,
  checkedIds
}: {
  userId: string;
  planId: string;
  checkedIds: readonly unknown[];
}) {
  const ids = uniqueChecklistOnlyIds(checkedIds);

  if (ids.length === 0) {
    markTripPlanChecklistOnlySupabaseMigrationComplete({ userId, planId });
    return;
  }

  const supabase = createClient();
  const { error } = await supabase.from(tableName).upsert(
    ids.map((checklist_item_id) => ({
      user_id: userId,
      plan_id: planId,
      checklist_item_id,
      is_checked: true
    })),
    { onConflict: "user_id,plan_id,checklist_item_id" }
  );

  if (error) {
    throw new Error(error.message);
  }

  markTripPlanChecklistOnlySupabaseMigrationComplete({ userId, planId });
}
