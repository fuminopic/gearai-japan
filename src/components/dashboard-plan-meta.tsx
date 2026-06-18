"use client";

import { useEffect, useState } from "react";

import { readTripPlanLocalMeta } from "@/lib/trip-plan-local-meta";

type DashboardPlanMetaProps = {
  planId: string;
  plannedDate: string | null;
  tripMemo: string | null;
  style?: string;
  variant?: "date" | "memo";
};

export function DashboardPlanMeta({
  planId,
  plannedDate,
  tripMemo,
  style,
  variant = "date"
}: DashboardPlanMetaProps) {
  const [localMeta, setLocalMeta] = useState<{
    plannedDate: string;
    tripMemo: string;
  } | null>(null);
  const displayDate = localMeta?.plannedDate || plannedDate || "";
  const displayMemo = localMeta?.tripMemo || tripMemo?.trim() || "";
  const plannedDateLabel = formatPlanDate(displayDate, style);

  useEffect(() => {
    setLocalMeta(readTripPlanLocalMeta(planId));
  }, [planId, plannedDate, tripMemo]);

  if (variant === "memo") {
    return displayMemo ? (
      <p className="mt-1 truncate text-[11px] font-medium text-stone-500">
        {displayMemo}
      </p>
    ) : null;
  }

  return plannedDateLabel ? (
    <span className="text-xs font-bold tracking-normal text-stone-900">
      {plannedDateLabel}
    </span>
  ) : null;
}

function formatPlanDate(value: string, style?: string) {
  if (!value) {
    return "";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  if (style === "DAY_HIKE") {
    return formatSingleDate(date, true);
  }

  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 1);

  return `${formatSingleDate(date, true)} → ${formatSingleDate(endDate, false)}`;
}

function formatSingleDate(date: Date, includeYear: boolean) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const prefix = includeYear ? `${date.getFullYear()}. ` : "";
  return (
    `${prefix}${date.getMonth() + 1}.${date.getDate()} ` + weekdays[date.getDay()]
  );
}
