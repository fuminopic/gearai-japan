"use client";

import { useEffect, useState } from "react";

import {
  applyChecklistStateToChecklist,
  isSupportedChecklistOnlyId,
  isSupportedRequirementSlot,
  type ChecklistCategoryId,
  type ChecklistView
} from "@/lib/plan-checklist";
import {
  readTripPlanCheckedSlots,
  readTripPlanChecklistOnlyIds,
  readTripPlanUncheckedPackedSlots
} from "@/lib/trip-plan-storage";
import type { RequirementSlot } from "@/lib/types";

import { HeroCountdown } from "./hero-countdown";

// 状態行(3 項)。色は状態色(規範 v1)。
const HERO_STATUS_ROWS: { id: ChecklistCategoryId; label: string; color: string }[] = [
  { id: "SAFETY_FIRST_AID", label: "安全・救急", color: "#DD0E01" },
  { id: "FOOD_WATER", label: "水・食料", color: "#FF751F" },
  { id: "ACTION_GEAR", label: "行動装備", color: "#FFDB00" }
];

// gauge の % と状態行の「残り N 項」は、計画ページと同じく localStorage の
// 勾選状態を hydrate して算出する(サーバ値=所有装備ベースだけだと手動チェックが反映されない)。
export function HeroGauge({
  checklist,
  planId,
  userId,
  fallbackPercent,
  mountainName,
  plannedDate
}: {
  checklist: ChecklistView | null;
  planId: string;
  userId?: string | null;
  fallbackPercent: number;
  mountainName: string;
  plannedDate: string | null;
}) {
  const [hydrated, setHydrated] = useState<ChecklistView | null>(checklist);

  useEffect(() => {
    if (!checklist) {
      setHydrated(null);
      return;
    }

    const checkedSlots = readStoredCheckedSlots(planId, userId ?? null);
    const uncheckedPackedSlots = readStoredUncheckedPackedSlots(
      planId,
      userId ?? null
    );
    const checkedChecklistOnlyIds = readStoredChecklistOnlyIds(
      planId,
      userId ?? null
    );

    if (!checkedSlots && !uncheckedPackedSlots && !checkedChecklistOnlyIds) {
      setHydrated(checklist);
      return;
    }

    setHydrated(
      applyChecklistStateToChecklist({
        checklist,
        checkedSlots,
        uncheckedPackedSlots,
        checkedChecklistOnlyIds
      })
    );
  }, [checklist, planId, userId]);

  // 清单可用时始终以当前装备与确认状态重算的进度为准；仅在清单不可用时回退保存值。
  const percent = hydrated?.summary.percent ?? fallbackPercent;
  const targetPercent = Math.min(100, Math.max(0, percent));
  const byId = new Map((hydrated?.categories ?? []).map((category) => [category.id, category]));

  const ARC = Math.PI * 100; // 半圆弧长 ≈ 314.16

  // 进入/切回首页(回前台、窗口聚焦)时让动画重播
  const [replayKey, setReplayKey] = useState(0);
  useEffect(() => {
    const replay = () => {
      if (document.visibilityState === "visible") {
        setReplayKey((key) => key + 1);
      }
    };
    document.addEventListener("visibilitychange", replay);
    window.addEventListener("focus", replay);
    return () => {
      document.removeEventListener("visibilitychange", replay);
      window.removeEventListener("focus", replay);
    };
  }, []);

  // 0 → targetPercent 的计数动画(弧 + 数字同步,≈1.1s,末端减速)
  // progress 0→1 同时驱动数字颜色(浅灰 → 黑)
  const [displayPercent, setDisplayPercent] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const reduceMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;
    if (reduceMotion) {
      setDisplayPercent(targetPercent);
      setProgress(1);
      return;
    }

    const duration = 1100;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // cubic ease-out
    let raf = 0;
    let startTs: number | null = null;
    setDisplayPercent(0);
    setProgress(0);
    const step = (ts: number) => {
      if (startTs === null) {
        startTs = ts;
      }
      const t = Math.min(1, (ts - startTs) / duration);
      setDisplayPercent(targetPercent * ease(t));
      setProgress(t); // 线性时间,供字色 ease-in 用(变黑推迟到末尾)
      if (t < 1) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [targetPercent, replayKey]);

  const offset = ARC * (1 - displayPercent / 100);
  // 数字颜色:浅灰(#E4E4E4)→ 黑;ease-in(progress^2.4)让变黑推迟到接近结束
  const numberGray = Math.round(228 * (1 - Math.pow(progress, 2.4)));
  const numberColor = `rgb(${numberGray}, ${numberGray}, ${numberGray})`;

  return (
    <>
      <div className="relative mx-auto mt-2 w-full max-w-[324px]">
        <svg viewBox="0 12 240 116" className="w-full">
          <defs>
            <linearGradient id="gaugeFill" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#1F7950" />
              <stop offset="100%" stopColor="#81AB44" />
            </linearGradient>
          </defs>
          <path
            d="M20 120 A100 100 0 0 1 220 120"
            fill="none"
            stroke="#D9D9D9"
            strokeWidth="9"
          />
          <path
            d="M20 120 A100 100 0 0 1 220 120"
            fill="none"
            stroke="url(#gaugeFill)"
            strokeWidth="9"
            strokeDasharray={ARC}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="max-w-[180px] truncate text-base font-bold text-ink">
            {mountainName}
          </span>
          <span
            className="font-din text-[52px] font-bold leading-[1.02]"
            style={{ color: numberColor }}
          >
            {Math.round(displayPercent)}
            <span className="text-[28px]">%</span>
          </span>
          <HeroCountdown planId={planId} plannedDate={plannedDate} />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between">
        {HERO_STATUS_ROWS.map((row) => {
          const missing = byId.get(row.id)?.progress.missingCount ?? 0;
          return (
            <div key={row.id} className="flex items-center gap-1.5">
              <span
                className="h-4 w-4 shrink-0 rounded-[4px]"
                style={{ backgroundColor: row.color }}
              />
              <div className="min-w-0">
                <div className="text-[12px] font-bold leading-tight text-ink">{row.label}</div>
                <div className="font-din text-[10px] leading-tight text-[#818785]">
                  残り{missing}項未完了
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
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

function readStoredChecklistOnlyIds(
  planId: string,
  userId: string | null
): string[] | undefined {
  const result = readTripPlanChecklistOnlyIds({ userId, planId });

  if (result.status === "missing") {
    return undefined;
  }

  return result.value.filter(isSupportedChecklistOnlyId);
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
