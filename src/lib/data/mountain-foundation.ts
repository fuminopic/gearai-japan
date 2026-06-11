import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { MountainFoundationProfile } from "@/lib/types";

const MOUNTAIN_FOUNDATION_BASE_COLUMNS = [
  "slug",
  "name_ja",
  "region",
  "elevation_m",
  "is_hyakumeizan",
  "supported_seasons",
  "supported_styles",
  "trip_profile",
  "typical_required_systems"
];

const MOUNTAIN_FOUNDATION_V2_COLUMNS = [
  "route_seriousness",
  "technical_terrain",
  "helmet_guidance",
  "water_availability",
  "hut_support",
  "tent_site_availability",
  "alpine_environment",
  "snow_or_ice_risk",
  "route_duration_band",
  "escape_options",
  "cell_signal_reliability",
  "bear_or_wildlife_risk",
  "volcanic_risk",
  "season_opening_window"
] as const;

const MOUNTAIN_FOUNDATION_BASE_SELECT = MOUNTAIN_FOUNDATION_BASE_COLUMNS.join(",");
const MOUNTAIN_FOUNDATION_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS
].join(",");

const MOUNTAIN_FOUNDATION_V2_DEFAULTS = {
  route_seriousness: "MODERATE",
  technical_terrain: "MAINTAINED_TRAIL",
  helmet_guidance: "NOT_NEEDED",
  water_availability: "NATURAL_RELIABLE",
  hut_support: "BASIC_NO_BEDDING",
  tent_site_availability: "UNKNOWN",
  alpine_environment: "LOWLAND_FOREST",
  snow_or_ice_risk: "LOW",
  route_duration_band: "FULL_DAY",
  escape_options: "MODERATE",
  cell_signal_reliability: "PARTIAL",
  bear_or_wildlife_risk: "LOW",
  volcanic_risk: "NONE",
  season_opening_window: "SNOW_FREE"
} satisfies Pick<MountainFoundationProfile, (typeof MOUNTAIN_FOUNDATION_V2_COLUMNS)[number]>;

export const getMountainFoundationProfiles = cache(
  async function getMountainFoundationProfiles() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mountain_foundation_profiles")
      .select(MOUNTAIN_FOUNDATION_SELECT)
      .returns<MountainFoundationProfile[]>()
      .order("name_ja", { ascending: true });

    if (error && isMissingMountainFoundationV2ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return ((fallbackData ?? []) as unknown as Partial<MountainFoundationProfile>[])
        .map(withMountainFoundationV2Defaults);
    }

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(withMountainFoundationV2Defaults);
  }
);

export const getMountainFoundationProfileBySlug = cache(
  async function getMountainFoundationProfileBySlug(slug: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mountain_foundation_profiles")
      .select(MOUNTAIN_FOUNDATION_SELECT)
      .eq("slug", slug)
      .returns<MountainFoundationProfile>()
      .maybeSingle();

    if (error && isMissingMountainFoundationV2ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return fallbackData
        ? withMountainFoundationV2Defaults(
            fallbackData as unknown as Partial<MountainFoundationProfile>
          )
        : null;
    }

    if (error) {
      throw new Error(error.message);
    }

    return data ? withMountainFoundationV2Defaults(data) : null;
  }
);

function withMountainFoundationV2Defaults(
  profile: Partial<MountainFoundationProfile>
) {
  return {
    ...MOUNTAIN_FOUNDATION_V2_DEFAULTS,
    ...profile
  } as MountainFoundationProfile;
}

function isMissingMountainFoundationV2ColumnError(error: { code?: string; message?: string }) {
  if (error.code === "42703") {
    return true;
  }

  return MOUNTAIN_FOUNDATION_V2_COLUMNS.some((column) => {
    return error.message?.includes(column);
  });
}
