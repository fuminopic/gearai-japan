import { requireUser } from "@/lib/data/gear";
import type { AIRecommendationRecord, Mountain } from "@/lib/types";

export async function getMountains() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("mountains")
    .select("*")
    .order("name_ja", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as Mountain[];
}

export async function findMountainByName(name: string) {
  const { supabase } = await requireUser();
  const normalized = name.trim();

  if (!normalized) {
    return null;
  }

  const { data, error } = await supabase
    .from("mountains")
    .select("*")
    .ilike("name_ja", `%${normalized}%`)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Mountain | null;
}

export async function getRecommendationHistory(limit = 20) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return data as AIRecommendationRecord[];
}

export async function getRecommendationById(id: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase
    .from("ai_recommendations")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as AIRecommendationRecord;
}

