"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/data/gear";
import type {
  MountainFoundationSeason,
  MountainFoundationStyle,
  RequirementSlot
} from "@/lib/types";

export async function saveTripPlan(formData: FormData) {
  const mountainSlug = String(formData.get("mountain_slug") ?? "").trim();
  const mountainName = String(formData.get("mountain_name") ?? "").trim();
  const season = parseSeason(formData.get("season"));
  const style = parseStyle(formData.get("style"));
  const progress = parseProgress(formData.get("progress"));
  const checkedSlots = parseCheckedSlots(formData.get("checked_slots"));
  const uncheckedPackedSlots = parseCheckedSlots(
    formData.get("unchecked_packed_slots")
  );
  const plannedDate = parsePlannedDate(formData.get("planned_date"));
  const plannedEndDate = normalizePlannedEndDate(
    plannedDate,
    parsePlannedDate(formData.get("planned_end_date")),
    style
  );
  const tripMemo = parseTripMemo(formData.get("trip_memo"));
  const bringCash = parseBoolean(formData.get("bring_cash"));
  const hasMountainInsurance = parseBoolean(formData.get("has_mountain_insurance"));
  const foodWater = parsePlanFoodWater(formData);

  if (!mountainSlug || !mountainName || !season || !style) {
    throw new Error("保存する山行計画の情報が不足しています。");
  }

  const { supabase, user } = await requireUser();
  const payload = {
    user_id: user.id,
    mountain_slug: mountainSlug,
    mountain_name: mountainName,
    season,
    style,
    planned_date: plannedDate,
    planned_end_date: plannedEndDate,
    trip_memo: tripMemo,
    bring_cash: bringCash,
    has_mountain_insurance: hasMountainInsurance,
    water_volume_ml: foodWater.waterVolumeMl,
    trail_food_included: foodWater.trailFoodIncluded,
    trail_food_weight_g: foodWater.trailFoodWeightG,
    meal_count: foodWater.mealCount,
    meal_weight_g: foodWater.mealWeightG,
    progress,
    checked_slots: checkedSlots,
    unchecked_packed_slots: uncheckedPackedSlots
  };
  const { data, error } = await supabase
    .from("trip_plans")
    .insert([payload])
    .select("id")
    .single();

  if (error) {
    if (!isMissingPlanColumnError(error)) {
      throw new Error(error.message);
    }

    const fallbackPayload = withoutOptionalPlanColumns(payload);
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("trip_plans")
      .insert([fallbackPayload])
      .select("id")
      .single();

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/plan");
    revalidatePath("/pack");

    return {
      id: fallbackData.id as string,
      planCount: await getTripPlanCount(supabase, user.id)
    };
  }

  revalidatePath("/dashboard");
  revalidatePath("/plan");
  revalidatePath("/pack");

  return {
    id: data.id as string,
    planCount: await getTripPlanCount(supabase, user.id)
  };
}

export async function updateTripPlan(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const mountainSlug = String(formData.get("mountain_slug") ?? "").trim();
  const mountainName = String(formData.get("mountain_name") ?? "").trim();
  const season = parseSeason(formData.get("season"));
  const style = parseStyle(formData.get("style"));
  const progress = parseProgress(formData.get("progress"));
  const checkedSlots = parseCheckedSlots(formData.get("checked_slots"));
  const uncheckedPackedSlots = parseCheckedSlots(
    formData.get("unchecked_packed_slots")
  );
  const plannedDate = parsePlannedDate(formData.get("planned_date"));
  const plannedEndDate = normalizePlannedEndDate(
    plannedDate,
    parsePlannedDate(formData.get("planned_end_date")),
    style
  );
  const tripMemo = parseTripMemo(formData.get("trip_memo"));
  const bringCash = parseBoolean(formData.get("bring_cash"));
  const hasMountainInsurance = parseBoolean(formData.get("has_mountain_insurance"));
  const foodWater = parsePlanFoodWater(formData);

  if (!id) {
    throw new Error("更新する計画IDが見つかりませんでした。");
  }

  if (!mountainSlug || !mountainName || !season || !style) {
    throw new Error("更新する山行計画の情報が不足しています。");
  }

  const { supabase, user } = await requireUser();
  const payload = {
    mountain_slug: mountainSlug,
    mountain_name: mountainName,
    season,
    style,
    planned_date: plannedDate,
    planned_end_date: plannedEndDate,
    trip_memo: tripMemo,
    bring_cash: bringCash,
    has_mountain_insurance: hasMountainInsurance,
    water_volume_ml: foodWater.waterVolumeMl,
    trail_food_included: foodWater.trailFoodIncluded,
    trail_food_weight_g: foodWater.trailFoodWeightG,
    meal_count: foodWater.mealCount,
    meal_weight_g: foodWater.mealWeightG,
    progress,
    checked_slots: checkedSlots,
    unchecked_packed_slots: uncheckedPackedSlots
  };
  const { error } = await supabase
    .from("trip_plans")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    if (!isMissingPlanColumnError(error)) {
      throw new Error(error.message);
    }

    const fallbackPayload = withoutOptionalPlanColumns(payload);
    const { error: fallbackError } = await supabase
      .from("trip_plans")
      .update(fallbackPayload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (fallbackError) {
      throw new Error(fallbackError.message);
    }

    revalidatePath("/dashboard");
    revalidatePath("/plan");
    revalidatePath("/pack");

    return { id };
  }

  revalidatePath("/dashboard");
  revalidatePath("/plan");
  revalidatePath("/pack");

  return { id };
}

export async function deleteTripPlan(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    throw new Error("計画IDが見つかりませんでした。");
  }

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("trip_plans")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
  revalidatePath("/pack");
}

export async function clearTripPlans() {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("trip_plans")
    .delete()
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/plan");
  revalidatePath("/dashboard");
  revalidatePath("/pack");
}

async function getTripPlanCount(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string
) {
  const { count, error } = await supabase
    .from("trip_plans")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return error ? null : count;
}

function parseSeason(value: FormDataEntryValue | null): MountainFoundationSeason | null {
  if (
    value === "SPRING" ||
    value === "SUMMER" ||
    value === "AUTUMN" ||
    value === "WINTER"
  ) {
    return value;
  }

  return null;
}

function parseStyle(value: FormDataEntryValue | null): MountainFoundationStyle | null {
  if (
    value === "DAY_HIKE" ||
    value === "OVERNIGHT_HUT" ||
    value === "OVERNIGHT_TENT" ||
    value === "MULTI_DAY_TREK"
  ) {
    return value;
  }

  return null;
}

function parseProgress(value: FormDataEntryValue | null) {
  const progress = Number(value ?? 0);

  if (!Number.isFinite(progress)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(progress)));
}

function parsePlannedDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function parseTripMemo(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed ? trimmed.slice(0, 200) : null;
}

function normalizePlannedEndDate(
  startDate: string | null,
  endDate: string | null,
  style: MountainFoundationStyle | null
) {
  if (!startDate || !style || style === "DAY_HIKE") {
    return null;
  }

  if (!endDate) {
    return startDate;
  }

  return endDate < startDate ? startDate : endDate;
}

function parseBoolean(value: FormDataEntryValue | null) {
  return value === "1" || value === "true" || value === "on";
}

function parsePlanFoodWater(formData: FormData) {
  const trailFoodIncluded = parseBoolean(formData.get("trail_food_included"));

  return {
    waterVolumeMl: parseSteppedNonNegativeInteger(
      formData.get("water_volume_ml"),
      500,
      30000
    ),
    trailFoodIncluded,
    trailFoodWeightG: trailFoodIncluded
      ? parseSteppedNonNegativeInteger(formData.get("trail_food_weight_g"), 50, 30000)
      : 0,
    mealCount: parseSteppedNonNegativeInteger(formData.get("meal_count"), 1, 99),
    mealWeightG: parseSteppedNonNegativeInteger(formData.get("meal_weight_g"), 50, 30000)
  };
}

function parseSteppedNonNegativeInteger(
  value: FormDataEntryValue | null,
  step: number,
  maximum: number
) {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.min(maximum, Math.max(0, Math.round(parsed / step) * step));
}

const requirementSlots = new Set<RequirementSlot>([
  "WATER_STORAGE",
  "WATER_TREATMENT",
  "TENT",
  "SLEEP_INSULATION",
  "SLEEP_PAD",
  "STOVE",
  "FUEL",
  "COOK_POT",
  "TABLEWARE",
  "RAIN_JACKET",
  "RAIN_PANTS",
  "INSULATION_LAYER",
  "BASE_LAYER",
  "HELMET",
  "TRACTION_DEVICE",
  "GPS_DEVICE",
  "POWER_BANK",
  "FIRST_AID_KIT",
  "HEADLAMP"
]);

function parseCheckedSlots(value: FormDataEntryValue | null): RequirementSlot[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return uniqueRequirementSlots(parsed);
  } catch {
    return [];
  }
}

function uniqueRequirementSlots(values: unknown[]) {
  const slots: RequirementSlot[] = [];

  for (const value of values) {
    if (
      typeof value === "string" &&
      requirementSlots.has(value as RequirementSlot) &&
      !slots.includes(value as RequirementSlot)
    ) {
      slots.push(value as RequirementSlot);
    }
  }

  return slots;
}

const optionalPlanColumns = [
  "checked_slots",
  "unchecked_packed_slots",
  "planned_date",
  "planned_end_date",
  "trip_memo",
  "bring_cash",
  "has_mountain_insurance",
  "water_volume_ml",
  "trail_food_included",
  "trail_food_weight_g",
  "meal_count",
  "meal_weight_g"
] as const;

function withoutOptionalPlanColumns<
  T extends {
    checked_slots: RequirementSlot[];
    unchecked_packed_slots?: RequirementSlot[];
    planned_date?: string | null;
    planned_end_date?: string | null;
    trip_memo?: string | null;
    bring_cash?: boolean;
    has_mountain_insurance?: boolean;
    water_volume_ml?: number;
    trail_food_included?: boolean;
    trail_food_weight_g?: number;
    meal_count?: number;
    meal_weight_g?: number;
  }
>(payload: T) {
  const fallbackPayload = { ...payload };

  for (const column of optionalPlanColumns) {
    delete (fallbackPayload as Record<string, unknown>)[column];
  }

  return fallbackPayload;
}

function isMissingPlanColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    /(checked_slots|unchecked_packed_slots|planned_date|planned_end_date|trip_memo|bring_cash|has_mountain_insurance|water_volume_ml|trail_food_included|trail_food_weight_g|meal_count|meal_weight_g)/i.test(
      error.message ?? ""
    )
  );
}
