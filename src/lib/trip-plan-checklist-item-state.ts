export type TripPlanChecklistItemState = {
  checklist_item_id: string;
  is_checked: boolean;
};

export type ChecklistOnlyMigrationMerge = {
  checkedIds: string[];
  missingLocalIds: string[];
};

export function uniqueChecklistOnlyIds(values: readonly unknown[]) {
  const seen = new Set<string>();

  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const itemId = value.trim();

    if (itemId.length > 0 && itemId.length <= 80) {
      seen.add(itemId);
    }
  }

  return Array.from(seen);
}

/**
 * Server rows are authoritative when they already exist. A legacy local
 * confirmation can fill only a missing row; it must never turn a server-side
 * explicit unchecked value back to checked on another device.
 */
export function mergeLegacyChecklistOnlyIds({
  localIds,
  remoteStates
}: {
  localIds: readonly unknown[];
  remoteStates: readonly TripPlanChecklistItemState[];
}): ChecklistOnlyMigrationMerge {
  const stateByItemId = new Map<string, boolean>();

  for (const state of remoteStates) {
    const [itemId] = uniqueChecklistOnlyIds([state.checklist_item_id]);

    if (itemId) {
      stateByItemId.set(itemId, state.is_checked === true);
    }
  }

  const missingLocalIds: string[] = [];

  for (const itemId of uniqueChecklistOnlyIds(localIds)) {
    if (!stateByItemId.has(itemId)) {
      stateByItemId.set(itemId, true);
      missingLocalIds.push(itemId);
    }
  }

  return {
    checkedIds: Array.from(stateByItemId.entries())
      .filter(([, isChecked]) => isChecked)
      .map(([itemId]) => itemId),
    missingLocalIds
  };
}

export function applyChecklistOnlyItemState({
  checkedIds,
  itemId,
  isChecked
}: {
  checkedIds: readonly unknown[];
  itemId: string;
  isChecked: boolean;
}) {
  const nextIds = new Set(uniqueChecklistOnlyIds(checkedIds));

  if (isChecked) {
    nextIds.add(itemId);
  } else {
    nextIds.delete(itemId);
  }

  return Array.from(nextIds);
}
