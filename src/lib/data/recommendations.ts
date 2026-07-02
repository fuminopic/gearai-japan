import { requireUser } from "@/lib/data/gear";
import type { AIRecommendationRecord, Mountain } from "@/lib/types";

type MountainRow = Mountain;
type RecommendationRow = AIRecommendationRecord;

export async function getMountains() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("mountains")
    .select(
      "id, name_ja, region, elevation_m, difficulty_level, best_season, camping_available, hut_available, snow_risk, seasonal_temperature, notes, created_at, updated_at"
    )
    .order("name_ja", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as MountainRow[];
}

export async function findMountainByName(name: string) {
  const { supabase } = await requireUser();
  const normalized = name.trim();

  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("mountains")
    .select(
      "id, name_ja, region, elevation_m, difficulty_level, best_season, camping_available, hut_available, snow_risk, seasonal_temperature, notes, created_at, updated_at"
    )
    .ilike("name_ja", `%${normalized}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MountainRow | null;
}

export async function getRecommendationHistory(limit = 20) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select(
      "id, user_id, mountain_id, input, output, owned_analysis, missing_analysis, model, prompt_tokens, completion_tokens, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as RecommendationRow[];
}

export async function getRecommendationById(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select(
      "id, user_id, mountain_id, input, output, owned_analysis, missing_analysis, model, prompt_tokens, completion_tokens, created_at"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RecommendationRow;
}
