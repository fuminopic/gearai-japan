"use client";

import { useRef } from "react";

import { Package } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";

import { movedBeyondHomeGearTapThreshold } from "@/lib/home-gear-strip-interaction";
import type { DashboardGear } from "@/lib/types";

type PointerStart = { x: number; y: number } | null;

export function HomeGearStrip({ gear }: { gear: DashboardGear[] }) {
  const pointerStartRef = useRef<PointerStart>(null);
  const draggedRef = useRef(false);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary) {
      return;
    }

    pointerStartRef.current = { x: event.clientX, y: event.clientY };
    draggedRef.current = false;
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const pointerStart = pointerStartRef.current;

    if (!event.isPrimary || !pointerStart || draggedRef.current) {
      return;
    }

    draggedRef.current = movedBeyondHomeGearTapThreshold(
      pointerStart.x,
      pointerStart.y,
      event.clientX,
      event.clientY
    );
  }

  function handlePointerEnd() {
    pointerStartRef.current = null;
  }

  function handleClickCapture(event: React.MouseEvent<HTMLDivElement>) {
    if (!draggedRef.current) {
      return;
    }

    // Never interfere with the browser's touch scroll. We only cancel the
    // synthetic click that can follow a completed drag.
    event.preventDefault();
    event.stopPropagation();
    draggedRef.current = false;
  }

  return (
    <div
      className="hide-scrollbar flex snap-x snap-proximity gap-[11px] overflow-x-auto overscroll-x-contain touch-pan-x pb-4 [-webkit-overflow-scrolling:touch]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClickCapture={handleClickCapture}
    >
      {gear.map((item) => (
        <Link
          key={item.id}
          href={`/gear/${item.id}` as Route}
          aria-label={`${item.name}の詳細を見る`}
          className="relative flex h-[150px] w-[126px] flex-none snap-start flex-col items-center rounded-2xl bg-white px-3 pt-[17px] pb-[52px] shadow-sm"
        >
          <div className="flex w-full min-h-0 flex-1 items-center justify-center">
            <GearImage item={item} />
          </div>
          <p className="absolute inset-x-3 bottom-[27px] truncate text-center text-[12px] font-bold leading-none text-gray-900">
            {item.name}
          </p>
          <p className="absolute inset-x-0 bottom-[14px] text-center font-din text-[11px] font-medium leading-none text-gray-400">
            {Number(item.weight_grams)} g
          </p>
        </Link>
      ))}
    </div>
  );
}

function GearImage({ item }: { item: DashboardGear }) {
  const scale = GEAR_DISPLAY_SCALE[item.name] ?? 1;
  return item.image_url ? (
    <img
      src={item.image_url}
      alt=""
      loading="lazy"
      decoding="async"
      className="h-full w-full object-contain mix-blend-multiply"
      style={scale !== 1 ? { transform: `scale(${scale})` } : undefined}
    />
  ) : (
    <Package className="h-10 w-10 text-gray-300" />
  );
}

// displayScale 手动旋钮:按商品名给一个缩放系数(默认 1.0),让不同形状的商品在框内视觉大小一致。
// 设计逐个微调,值填这里即可,例:{ "サム 45": 1.1, "Fillo™": 0.9 }
const GEAR_DISPLAY_SCALE: Record<string, number> = {};
