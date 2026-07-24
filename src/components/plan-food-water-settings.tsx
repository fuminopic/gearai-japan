"use client";

import { Minus, Plus } from "lucide-react";
import type { ReactNode } from "react";

import {
  getPlanFoodWaterWeightG,
  type PlanFoodWater
} from "@/lib/plan-food-water";
import { hapticSelection } from "@/lib/haptics";
import { formatWeight } from "@/lib/utils/format";

type PlanFoodWaterSettingsProps = {
  value: PlanFoodWater;
  onChange: (value: PlanFoodWater) => void;
};

export function PlanFoodWaterSettings({
  value,
  onChange
}: PlanFoodWaterSettingsProps) {
  const totalWeightG = getPlanFoodWaterWeightG(value);

  function update(next: Partial<PlanFoodWater>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="overflow-hidden rounded-xl border border-stone-100 bg-stone-50/70">
      <div className="divide-y divide-stone-100 bg-white px-3 sm:px-4">
        <FoodWaterRow
          title="飲み水"
          rule="必須"
          control={
            <QuantityStepper
              ariaLabel="飲み水の量"
              value={value.waterVolumeMl / 1000}
              unit="L"
              step={0.5}
              onChange={(next) => update({ waterVolumeMl: Math.round(next * 1000) })}
            />
          }
          weight={formatWeight(value.waterVolumeMl)}
        />

        <FoodWaterRow
          title="行動食"
          rule="必須"
          control={
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <div className="grid h-9 min-w-[76px] grid-cols-2 overflow-hidden rounded-lg border border-stone-200 text-[11px] font-bold">
                <button
                  type="button"
                  aria-pressed={value.trailFoodIncluded}
                  onClick={() => {
                    hapticSelection();
                    update({ trailFoodIncluded: true });
                  }}
                  className={value.trailFoodIncluded ? "bg-[#4E914A] text-white" : "bg-white text-stone-500"}
                >
                  あり
                </button>
                <button
                  type="button"
                  aria-pressed={!value.trailFoodIncluded}
                  onClick={() => {
                    hapticSelection();
                    update({ trailFoodIncluded: false, trailFoodWeightG: 0 });
                  }}
                  className={!value.trailFoodIncluded ? "bg-stone-100 text-stone-700" : "bg-white text-stone-500"}
                >
                  なし
                </button>
              </div>
              {value.trailFoodIncluded ? (
                <QuantityStepper
                  ariaLabel="行動食の合計重量"
                  value={value.trailFoodWeightG}
                  unit="g"
                  step={50}
                  onChange={(trailFoodWeightG) => update({ trailFoodWeightG })}
                />
              ) : null}
            </div>
          }
          weight={formatWeight(value.trailFoodWeightG)}
        />

        <FoodWaterRow
          title="食事・非常食"
          rule="推奨"
          control={
            <div className="flex min-w-0 flex-1 gap-1.5">
              <QuantityStepper
                ariaLabel="食事・非常食の食数"
                value={value.mealCount}
                unit="食"
                step={1}
                onChange={(mealCount) => update({ mealCount })}
              />
              <QuantityStepper
                ariaLabel="食事・非常食の合計重量"
                value={value.mealWeightG}
                unit="g"
                step={50}
                onChange={(mealWeightG) => update({ mealWeightG })}
              />
            </div>
          }
          weight={formatWeight(value.mealWeightG)}
        />
      </div>

      <div className="flex items-center justify-between gap-3 bg-forest-50 px-3 py-2.5 sm:px-4">
        <p className="text-xs font-bold text-forest-800">水・食料の合計重量</p>
        <p className="shrink-0 whitespace-nowrap font-din text-lg font-bold text-[#14724e]">
          {formatWeight(totalWeightG, { compact: true })}
        </p>
      </div>
    </div>
  );
}

function FoodWaterRow({
  title,
  rule,
  control,
  weight
}: {
  title: string;
  rule: string;
  control: ReactNode;
  weight: string;
}) {
  return (
    <article className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-center gap-2 py-2.5 sm:grid-cols-[88px_minmax(0,1fr)_auto]">
      <div className="min-w-0">
        <h3 className="text-xs font-bold leading-4 text-ink">{title}</h3>
        <span className="mt-0.5 inline-block rounded bg-stone-100 px-1 py-0.5 text-[9px] font-bold text-stone-600">
          {rule}
        </span>
      </div>
      {control}
      <p className="shrink-0 whitespace-nowrap text-xs font-bold text-[#14724e]">{weight}</p>
    </article>
  );
}

function QuantityStepper({
  ariaLabel,
  value,
  unit,
  step,
  onChange
}: {
  ariaLabel: string;
  value: number;
  unit: string;
  step: number;
  onChange: (value: number) => void;
}) {
  const maximum = unit === "食" ? 99 : unit === "L" ? 30 : 30000;
  const text = unit === "L" ? value.toFixed(value % 1 === 0 ? 0 : 1) : value.toLocaleString("ja-JP");

  return (
    <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        aria-label={`${ariaLabel}を減らす`}
        onClick={() => {
          hapticSelection();
          onChange(Math.max(0, value - step));
        }}
        className="flex h-full w-7 shrink-0 items-center justify-center text-stone-500 transition active:scale-90 sm:w-8"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-0 flex-1 whitespace-nowrap text-center font-din text-base font-bold text-ink">
        {text} <span className="text-[10px] text-stone-500">{unit}</span>
      </span>
      <button
        type="button"
        aria-label={`${ariaLabel}を増やす`}
        onClick={() => {
          hapticSelection();
          onChange(Math.min(maximum, value + step));
        }}
        className="flex h-full w-7 shrink-0 items-center justify-center text-stone-500 transition active:scale-90 sm:w-8"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
