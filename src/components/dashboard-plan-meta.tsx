"use client";

import { useEffect, useState } from "react";

import { readTripPlanLocalMeta } from "@/lib/trip-plan-local-meta";

type DashboardPlanMetaProps = {
  planId: string;
  plannedDate: string | null;
  tripMemo: string | null;
  seasonLabel: string;
  styleLabel: string;
};

export function DashboardPlanMeta({
  planId,
  plannedDate,
  tripMemo,
  seasonLabel,
  styleLabel
}: DashboardPlanMetaProps) {
  const [localMeta, setLocalMeta] = useState<{
    plannedDate: string;
    tripMemo: string;
  } | null>(null);
  const displayDate = plannedDate || localMeta?.plannedDate || "";
  const displayMemo = tripMemo?.trim() || localMeta?.tripMemo || "";
  const plannedDateLabel = formatPlanDate(displayDate);

  useEffect(() => {
    if (plannedDate && tripMemo?.trim()) {
      return;
    }

    setLocalMeta(readTripPlanLocalMeta(planId));
  }, [planId, plannedDate, tripMemo]);

  return (
    <>
      <div className="mt-2 flex flex-wrap gap-2">
        {plannedDateLabel ? <PlanTag>{plannedDateLabel}</PlanTag> : null}
        <PlanTag>{seasonLabel}</PlanTag>
        <PlanTag>{styleLabel}</PlanTag>
      </div>
      {displayMemo ? (
        <p className="mt-2 truncate text-xs font-medium text-stone-500">
          {displayMemo}
        </p>
      ) : null}
    </>
  );
}

function PlanTag({ children }: { children: string }) {
  return (
    <span className="rounded-lg bg-[#E8F0E8] px-3 py-1.5 text-xs font-bold text-[#3B5B44]">
      {children}
    </span>
  );
}

function formatPlanDate(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);
}
