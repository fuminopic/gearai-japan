"use client";

import { Cookie, Droplets, Minus, Plus, Soup } from "lucide-react";
import type { ReactNode } from "react";

import {
  getPlanFoodWaterWeightG,
  type PlanFoodWater
} from "@/lib/plan-food-water";
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
    <section className="rounded-[20px] bg-white p-5 shadow-sm">
      <div className="border-b border-[#EEEDE6] pb-3">
        <h2 className="text-base font-bold text-ink">水・食料</h2>
        <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
          この山行で持参する分を設定します。ボトル・水袋などの容器重量はギアとして別に計算されます。
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <FoodWaterRow
          icon={<Droplets className="h-5 w-5" aria-hidden="true" />}
          iconClassName="bg-sky-50 text-sky-700"
          title="飲み水"
          rule="必須"
          description="1L = 1kg として自動計算"
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
          icon={<Cookie className="h-5 w-5" aria-hidden="true" />}
          iconClassName="bg-amber-50 text-amber-700"
          title="行動食"
          rule="必須"
          description="ありの場合のみ合計重量を設定"
          control={
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
              <div className="grid h-10 grid-cols-2 overflow-hidden rounded-lg border border-stone-200 text-xs font-bold">
                <button
                  type="button"
                  aria-pressed={value.trailFoodIncluded}
                  onClick={() => update({ trailFoodIncluded: true })}
                  className={value.trailFoodIncluded ? "bg-[#4E914A] text-white" : "bg-white text-stone-500"}
                >
                  あり
                </button>
                <button
                  type="button"
                  aria-pressed={!value.trailFoodIncluded}
                  onClick={() => update({ trailFoodIncluded: false, trailFoodWeightG: 0 })}
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
          icon={<Soup className="h-5 w-5" aria-hidden="true" />}
          iconClassName="bg-orange-50 text-orange-700"
          title="食事・非常食"
          rule="推奨"
          description="食数と合計重量を設定"
          control={
            <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
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

      <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-forest-800">水・食料の合計重量</p>
          <p className="mt-1 text-xs font-semibold text-forest-700">マイパックの総重量に含まれます</p>
        </div>
        <p className="shrink-0 whitespace-nowrap font-din text-2xl font-bold text-[#14724e]">
          {formatWeight(totalWeightG, { compact: true })}
        </p>
      </div>
    </section>
  );
}

function FoodWaterRow({
  icon,
  iconClassName,
  title,
  rule,
  description,
  control,
  weight
}: {
  icon: ReactNode;
  iconClassName: string;
  title: string;
  rule: string;
  description: string;
  control: ReactNode;
  weight: string;
}) {
  return (
    <article className="rounded-xl border border-stone-100 px-3 py-3">
      <div className="flex items-start gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconClassName}`}>
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold text-ink">{title}</h3>
            <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-bold text-stone-600">
              {rule}
            </span>
          </div>
          <p className="mt-1 text-xs font-medium text-stone-500">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-3 pl-12">
        {control}
        <p className="ml-auto shrink-0 whitespace-nowrap text-sm font-bold text-[#14724e]">{weight}</p>
      </div>
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
    <div className="flex h-10 min-w-[132px] items-center rounded-lg border border-stone-200 bg-white">
      <button
        type="button"
        aria-label={`${ariaLabel}を減らす`}
        onClick={() => onChange(Math.max(0, value - step))}
        className="flex h-full w-9 shrink-0 items-center justify-center text-stone-500 transition active:scale-90"
      >
        <Minus className="h-4 w-4" aria-hidden="true" />
      </button>
      <span className="min-w-0 flex-1 whitespace-nowrap text-center font-din text-lg font-bold text-ink">
        {text} <span className="text-xs text-stone-500">{unit}</span>
      </span>
      <button
        type="button"
        aria-label={`${ariaLabel}を増やす`}
        onClick={() => onChange(Math.min(maximum, value + step))}
        className="flex h-full w-9 shrink-0 items-center justify-center text-stone-500 transition active:scale-90"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
