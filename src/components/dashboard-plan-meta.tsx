"use client";

import { useEffect, useState } from "react";

import { readTripPlanLocalMeta } from "@/lib/trip-plan-local-meta";

type DashboardPlanMetaProps = {
  planId: string;
  plannedDate: string | null;
  plannedEndDate?: string | null;
  tripMemo: string | null;
  style?: string;
  variant?: "date" | "memo";
};

export function DashboardPlanMeta({
  planId,
  plannedDate,
  plannedEndDate,
  tripMemo,
  style,
  variant = "date"
}: DashboardPlanMetaProps) {
  const [localMeta, setLocalMeta] = useState<{
    plannedDate: string;
    plannedEndDate: string;
    tripMemo: string;
  } | null>(null);
  const displayDate = localMeta?.plannedDate || plannedDate || "";
  const displayEndDate = localMeta?.plannedEndDate || plannedEndDate || "";
  const displayMemo = localMeta?.tripMemo || tripMemo?.trim() || "";
  const plannedDateRange = formatPlanDate(displayDate, displayEndDate, style);

  useEffect(() => {
    setLocalMeta(readTripPlanLocalMeta(planId));
  }, [planId, plannedDate, plannedEndDate, tripMemo]);

  if (variant === "memo") {
    return displayMemo ? (
      <p className="mt-1 truncate text-[11px] font-medium text-stone-500">
        {displayMemo}
      </p>
    ) : null;
  }

  return plannedDateRange ? (
    <span className="inline-flex items-end gap-1.5 font-sans leading-none text-stone-950">
      <PlanDatePart date={plannedDateRange.start} includeYear />
      {plannedDateRange.end ? (
        <>
          <span className="pb-[3px] px-0.5 text-[16px] font-bold leading-none">→</span>
          <PlanDatePart date={plannedDateRange.end} />
        </>
      ) : null}
    </span>
  ) : null;
}

function formatPlanDate(value: string, endValue: string, style?: string) {
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

  if (!endValue) {
    return { start: date, end: null };
  }

  const endDate = new Date(`${endValue}T00:00:00`);

  if (Number.isNaN(endDate.getTime())) {
    return { start: date, end: null };
  }

  return { start: date, end: endDate < date ? date : endDate };
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
        <span className="pb-[3px] text-[12px] font-bold tracking-[0.06em]">
          {date.getFullYear()}.
        </span>
      ) : null}
      <span className="text-[18px] font-bold tracking-[0.04em]">
        {date.getMonth() + 1}.{date.getDate()}
      </span>
      <span className="mb-[1px] inline-flex h-[18px] w-[18px] items-center justify-center rounded-full border border-stone-950 text-[11px] font-bold leading-none">
        {getWeekday(date)}
      </span>
    </span>
  );
}

function getWeekday(date: Date) {
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return weekdays[date.getDay()];
}
