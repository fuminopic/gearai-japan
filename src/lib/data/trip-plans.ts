import { requireUser } from "@/lib/data/gear";
import type { AIRecommendationRecord, SavedTripPlan } from "@/lib/types";

export async function getLatestTripPlan() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trip_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    const fallback = await getLatestLegacyRecommendationPlan(supabase, user.id);
    return fallback;
  }

  return (data?.[0] ?? null) as SavedTripPlan | null;
}

export async function getTripPlans() {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("trip_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return data as SavedTripPlan[];
}

async function getLatestLegacyRecommendationPlan(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string
) {
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.[0]) {
    return null;
  }

  return legacyRecommendationToTripPlan(data[0] as AIRecommendationRecord);
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
    planned_date: null,
    trip_memo: null,
    bring_cash: false,
    has_mountain_insurance: false,
    created_at: record.created_at
  };
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
