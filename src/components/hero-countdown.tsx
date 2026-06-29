"use client";

import { useEffect, useState } from "react";

import { readTripPlanLocalMeta } from "@/lib/trip-plan-local-meta";

// 「あと N 日」。日付は DashboardPlanMeta と同じく localStorage 優先で読む
// (DB の planned_date が null でも、編集時に保存したローカル値で表示する)。
export function HeroCountdown({
  planId,
  plannedDate
}: {
  planId: string;
  plannedDate: string | null;
}) {
  const [localDate, setLocalDate] = useState<string | null>(null);

  useEffect(() => {
    const meta = readTripPlanLocalMeta(planId);
    setLocalDate(meta?.plannedDate || null);
  }, [planId, plannedDate]);

  const days = daysUntil(localDate || plannedDate || "");

  if (days == null || days < 0) {
    return null;
  }

  return (
    <span className="mt-0.5 text-sm text-[#818785]">
      あと<span className="font-din font-bold text-[#14724E]">{days}</span>日
    </span>
  );
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) {
    return null;
  }
  const target = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(target.getTime())) {
    return null;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}
