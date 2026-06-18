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
  const plannedDateRange = formatPlanDate(displayDate, style);

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

  return plannedDateRange ? (
    <span className="inline-flex items-center gap-1.5 font-sans leading-none text-stone-950">
      <PlanDatePart date={plannedDateRange.start} includeYear />
      {plannedDateRange.end ? (
        <>
          <span className="px-1 text-[28px] font-bold leading-none">→</span>
          <PlanDatePart date={plannedDateRange.end} />
        </>
      ) : null}
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
    return { start: date, end: null };
  }

  const endDate = new Date(date);
  endDate.setDate(date.getDate() + 1);

  return { start: date, end: endDate };
}

function PlanDatePart({
  date,
  includeYear = false
}: {
  date: Date;
  includeYear?: boolean;
}) {
  return (
    <span className="inline-flex items-end gap-1 leading-none">
      {includeYear ? (
        <span className="pb-1 text-sm font-bold tracking-[0.08em]">
          {date.getFullYear()}.
        </span>
      ) : null}
      <span className="text-[40px] font-bold tracking-[0.06em]">
        {date.getMonth() + 1}.{date.getDate()}
      </span>
      <span className="mb-1 inline-flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-stone-950 text-lg font-bold leading-none">
        {getWeekday(date)}
      </span>
    </span>
  );
}

function getWeekday(date: Date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}
