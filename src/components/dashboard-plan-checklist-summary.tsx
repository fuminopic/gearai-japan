"use client";

import { useEffect, useState } from "react";

import {
  applyChecklistStateToChecklist,
  getCheckedSlotsStorageKey,
  getChecklistOnlyStorageKey,
  isSupportedChecklistOnlyId,
  isSupportedRequirementSlot,
  type ChecklistCategory,
  type ChecklistView
} from "@/lib/plan-checklist";
import type { RequirementSlot } from "@/lib/types";

export function DashboardPlanChecklistSummary({
  planId,
  checklist,
  fallbackProgress
}: {
  planId: string;
  checklist: ChecklistView | null;
  fallbackProgress: number;
}) {
  const [hydratedChecklist, setHydratedChecklist] = useState(checklist);

  useEffect(() => {
    if (!checklist) {
      return;
    }

    const checkedSlots = readStoredCheckedSlots(planId);
    const checkedChecklistOnlyIds = readStoredChecklistOnlyIds(planId);

    if (!checkedSlots && !checkedChecklistOnlyIds) {
      setHydratedChecklist(checklist);
      return;
    }

    setHydratedChecklist(
      applyChecklistStateToChecklist({
        checklist,
        checkedSlots,
        checkedChecklistOnlyIds
      })
    );
  }, [checklist, planId]);

  const progress = hydratedChecklist?.summary.percent ?? fallbackProgress;
  const missingCount = hydratedChecklist?.summary.missingCount ?? null;

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
          {missingCount !== null ? (
            <span className="shrink-0 rounded bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">
              未完了 {missingCount.toLocaleString("ja-JP")}
            </span>
          ) : null}
        </div>
      </div>

      {hydratedChecklist ? (
        <PlanCategorySummary categories={hydratedChecklist.categories} />
      ) : null}
    </div>
  );
}

function readStoredCheckedSlots(planId: string): RequirementSlot[] | undefined {
  try {
    const storedValue = window.localStorage.getItem(getCheckedSlotsStorageKey(planId));

    if (!storedValue) {
      return undefined;
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSupportedRequirementSlot);
  } catch {
    return [];
  }
}

function readStoredChecklistOnlyIds(planId: string): string[] | undefined {
  try {
    const storedValue = window.localStorage.getItem(getChecklistOnlyStorageKey(planId));

    if (!storedValue) {
      return undefined;
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSupportedChecklistOnlyId);
  } catch {
    return [];
  }
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
