import { requireUser } from "@/lib/data/gear";
import type { AIRecommendationRecord, SavedTripPlan } from "@/lib/types";

type TripPlanRow = SavedTripPlan;
type LegacyRecommendationRow = AIRecommendationRecord;

const tripPlanSelect =
  "id, user_id, mountain_slug, mountain_name, season, style, image_url, progress, checked_slots, unchecked_packed_slots, planned_date, planned_end_date, trip_memo, bring_cash, has_mountain_insurance, water_volume_ml, trail_food_included, trail_food_weight_g, meal_count, meal_weight_g, created_at";
const legacyTripPlanSelect =
  "id, user_id, mountain_slug, mountain_name, season, style, image_url, progress, checked_slots, unchecked_packed_slots, planned_date, planned_end_date, trip_memo, bring_cash, has_mountain_insurance, created_at";

export async function getLatestTripPlan() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trip_plans")
    .select(tripPlanSelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error && isMissingPlanFoodWaterColumnError(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("trip_plans")
      .select(legacyTripPlanSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (!legacyError) {
      return legacyData?.[0] ? normalizeTripPlan(legacyData[0]) : null;
    }
  }

  if (error) {
    const fallback = await getLatestLegacyRecommendationPlan(supabase, user.id);
    return fallback;
  }

  return data?.[0] ? normalizeTripPlan(data[0]) : null;
}

export async function getTripPlans() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trip_plans")
    .select(tripPlanSelect)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error && isMissingPlanFoodWaterColumnError(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("trip_plans")
      .select(legacyTripPlanSelect)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!legacyError) {
      return (legacyData ?? []).map(normalizeTripPlan);
    }
  }

  if (error) {
    return [];
  }

  return (data ?? []).map(normalizeTripPlan);
}

// 計画詳細を開く初回表示では、履歴全件を待つ必要はない。選択中の 1 件だけ
// を読み、履歴一覧は下方の Suspense 境界で後から表示する。
export async function getTripPlanById(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trip_plans")
    .select(tripPlanSelect)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && isMissingPlanFoodWaterColumnError(error)) {
    const { data: legacyData, error: legacyError } = await supabase
      .from("trip_plans")
      .select(legacyTripPlanSelect)
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!legacyError) {
      return legacyData ? normalizeTripPlan(legacyData) : null;
    }
  }

  if (error) {
    throw new Error(error.message);
  }

  return data ? normalizeTripPlan(data) : null;
}

async function getLatestLegacyRecommendationPlan(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string
) {
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select(
      "id, user_id, mountain_id, input, output, owned_analysis, missing_analysis, model, prompt_tokens, completion_tokens, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.[0]) {
    return null;
  }

  return legacyRecommendationToTripPlan(data[0] as LegacyRecommendationRow);
}

function legacyRecommendationToTripPlan(record: AIRecommendationRecord): SavedTripPlan {
  return {
    id: record.id,
    user_id: record.user_id,
    mountain_slug: null,
    mountain_name: record.input.mountain_region || "山行",
    season: legacySeason(record.input.season),
    style: legacyStyle(record.input.accommodation_style),
    image_url: null,
    progress: 0,
    checked_slots: [],
    unchecked_packed_slots: [],
    planned_date: null,
    planned_end_date: null,
    trip_memo: null,
    bring_cash: false,
    has_mountain_insurance: false,
    water_volume_ml: 0,
    trail_food_included: false,
    trail_food_weight_g: 0,
    meal_count: 0,
    meal_weight_g: 0,
    created_at: record.created_at
  };
}

function normalizeTripPlan(row: Record<string, unknown>): TripPlanRow {
  return {
    ...row,
    water_volume_ml: numberOrZero(row.water_volume_ml),
    trail_food_included: row.trail_food_included === true,
    trail_food_weight_g: numberOrZero(row.trail_food_weight_g),
    meal_count: numberOrZero(row.meal_count),
    meal_weight_g: numberOrZero(row.meal_weight_g)
  } as TripPlanRow;
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function isMissingPlanFoodWaterColumnError(error: { message?: string; code?: string }) {
  return (
    error.code === "42703" ||
    /(water_volume_ml|trail_food_included|trail_food_weight_g|meal_count|meal_weight_g)/i.test(
      error.message ?? ""
    )
  );
}

function legacySeason(season: AIRecommendationRecord["input"]["season"]) {
  const seasons = {
    spring: "SPRING",
    summer: "SUMMER",
    autumn: "AUTUMN",
    winter: "WINTER"
  } as const;

  return seasons[season];
}

function legacyStyle(style: AIRecommendationRecord["input"]["accommodation_style"]) {
  const styles = {
    day_hike: "DAY_HIKE",
    hut: "OVERNIGHT_HUT",
    tent: "OVERNIGHT_TENT"
  } as const;

  return styles[style];
}
