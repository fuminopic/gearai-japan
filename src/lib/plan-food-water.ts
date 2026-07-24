import type { SavedTripPlan } from "@/lib/types";

export type PlanFoodWater = {
  waterVolumeMl: number;
  trailFoodIncluded: boolean;
  trailFoodWeightG: number;
  mealCount: number;
  mealWeightG: number;
};

export const defaultPlanFoodWater: PlanFoodWater = {
  waterVolumeMl: 0,
  trailFoodIncluded: false,
  trailFoodWeightG: 0,
  mealCount: 0,
  mealWeightG: 0
};

const MAX_WEIGHT_G = 30000;
const MAX_WATER_ML = 30000;
const MAX_MEAL_COUNT = 99;

// 入力値は保存前・表示前の両方で正規化する。水は 0.5L 単位、食料重量は
// 表示コントロールと同じ 50g 単位にそろえ、古い/壊れた値が総重量を壊さないようにする。
export function normalizePlanFoodWater(
  value: Partial<PlanFoodWater> | null | undefined
): PlanFoodWater {
  const trailFoodIncluded = value?.trailFoodIncluded === true;

  return {
    waterVolumeMl: normalizeSteppedNumber(value?.waterVolumeMl, 500, MAX_WATER_ML),
    trailFoodIncluded,
    trailFoodWeightG: trailFoodIncluded
      ? normalizeSteppedNumber(value?.trailFoodWeightG, 50, MAX_WEIGHT_G)
      : 0,
    mealCount: normalizeSteppedNumber(value?.mealCount, 1, MAX_MEAL_COUNT),
    mealWeightG: normalizeSteppedNumber(value?.mealWeightG, 50, MAX_WEIGHT_G)
  };
}

export function getPlanFoodWater(plan: SavedTripPlan | null | undefined) {
  if (!plan) {
    return defaultPlanFoodWater;
  }

  return normalizePlanFoodWater({
    waterVolumeMl: plan.water_volume_ml,
    trailFoodIncluded: plan.trail_food_included,
    trailFoodWeightG: plan.trail_food_weight_g,
    mealCount: plan.meal_count,
    mealWeightG: plan.meal_weight_g
  });
}

export function getPlanFoodWaterWeightG(value: PlanFoodWater) {
  return value.waterVolumeMl + value.trailFoodWeightG + value.mealWeightG;
}

function normalizeSteppedNumber(value: unknown, step: number, max: number) {
  const numberValue = typeof value === "number" ? value : Number(value ?? 0);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.min(max, Math.max(0, Math.round(numberValue / step) * step));
}
