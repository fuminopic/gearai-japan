"use client";

import { useEffect, useState } from "react";

import {
  applyChecklistStateToChecklist,
  isSupportedRequirementSlot,
  type ChecklistCategory,
  type ChecklistView
} from "@/lib/plan-checklist";
import { readTripPlanChecklistOnlyStates } from "@/lib/trip-plan-checklist-item-state-client";
import {
  readTripPlanCheckedSlots,
  readTripPlanUncheckedPackedSlots
} from "@/lib/trip-plan-storage";
import type { RequirementSlot } from "@/lib/types";

export function DashboardPlanChecklistSummary({
  planId,
  userId,
  checklist,
  fallbackProgress
}: {
  planId: string;
  userId?: string | null;
  checklist: ChecklistView | null;
  fallbackProgress: number;
}) {
  const [hydratedChecklist, setHydratedChecklist] = useState(checklist);

  useEffect(() => {
    const checklistToHydrate: ChecklistView | null = checklist;

    if (checklistToHydrate === null) {
      return;
    }

    const checklistForAsync = checklistToHydrate;
    const checkedSlots = readStoredCheckedSlots(planId, userId ?? null);
    const uncheckedPackedSlots = readStoredUncheckedPackedSlots(
      planId,
      userId ?? null
    );
    let active = true;

    async function hydrateChecklist() {
      let checkedChecklistOnlyIds: string[] | undefined;

      if (userId) {
        try {
          const states = await readTripPlanChecklistOnlyStates({ userId, planId });
          checkedChecklistOnlyIds = states
            .filter((state) => state.is_checked)
            .map((state) => state.checklist_item_id);
        } catch (error) {
          console.error("Checklist-only state read failed:", error);
          if (active) {
            setHydratedChecklist(checklistForAsync);
          }
          return;
        }
      }

      if (!active) {
        return;
      }

      if (!checkedSlots && !uncheckedPackedSlots && !checkedChecklistOnlyIds) {
        setHydratedChecklist(checklistForAsync);
        return;
      }

      setHydratedChecklist(
        applyChecklistStateToChecklist({
          checklist: checklistForAsync,
          checkedSlots,
          uncheckedPackedSlots,
          checkedChecklistOnlyIds
        })
      );
    }

    void hydrateChecklist();

    return () => {
      active = false;
    };
  }, [checklist, planId, userId]);

  const progress = hydratedChecklist?.summary.percent ?? fallbackProgress;
  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-1.5 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-[#14724e]"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-sm font-bold">{progress}%</span>
        </div>
      </div>

      {hydratedChecklist ? (
        <PlanCategorySummary categories={hydratedChecklist.categories} />
      ) : null}
    </div>
  );
}

function readStoredCheckedSlots(
  planId: string,
  userId: string | null
): RequirementSlot[] | undefined {
  const result = readTripPlanCheckedSlots({ userId, planId });

  if (result.status === "missing") {
    return undefined;
  }

  return result.value.filter(isSupportedRequirementSlot);
}

function readStoredUncheckedPackedSlots(
  planId: string,
  userId: string | null
): RequirementSlot[] | undefined {
  const result = readTripPlanUncheckedPackedSlots({ userId, planId });

  if (result.status === "missing") {
    return undefined;
  }

  return result.value.filter(isSupportedRequirementSlot);
}

function PlanCategorySummary({
  categories
}: {
  categories: ChecklistCategory[];
}) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px] sm:grid-cols-3">
      {categories.map((category) => (
        <div
          key={category.id}
          className="grid grid-cols-[1fr_auto] items-center gap-2 rounded bg-white/70 px-2 py-1.5"
        >
          <span className="truncate font-semibold text-gray-700">{category.label}</span>
          <span className="font-bold text-[#14724e]">
            {category.progress.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
