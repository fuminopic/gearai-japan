import { createClient } from "@/lib/supabase/server";
import type { MountainFoundationProfile } from "@/lib/types";

const MOUNTAIN_FOUNDATION_SELECT = [
  "slug",
  "name_ja",
  "region",
  "elevation_m",
  "is_hyakumeizan",
  "supported_seasons",
  "supported_styles",
  "trip_profile",
  "typical_required_systems"
].join(",");

export async function getMountainFoundationProfiles() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mountain_foundation_profiles")
    .select(MOUNTAIN_FOUNDATION_SELECT)
    .returns<MountainFoundationProfile[]>()
    .order("name_ja", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return data as MountainFoundationProfile[];
}

export async function getMountainFoundationProfileBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("mountain_foundation_profiles")
    .select(MOUNTAIN_FOUNDATION_SELECT)
    .eq("slug", slug)
    .returns<MountainFoundationProfile>()
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as MountainFoundationProfile | null;
}
