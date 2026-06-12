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

const MOUNTAIN_FOUNDATION_V21_COLUMNS = [
  "primary_region",
  "mountain_range",
  "prefectures"
] as const;

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

const MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS = [
  "active_volcano_status",
  "jma_volcano_name",
  "jma_alert_url",
  "jma_constant_monitoring",
  "restriction_status_note",
  "snow_free_month_guide",
  "mandatory_gear_note",
  "supplementary_notes"
] as const;

const MOUNTAIN_FOUNDATION_BASE_SELECT = MOUNTAIN_FOUNDATION_BASE_COLUMNS.join(",");
const MOUNTAIN_FOUNDATION_V2_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS
].join(",");
const MOUNTAIN_FOUNDATION_CORE_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
].join(",");
const MOUNTAIN_FOUNDATION_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
  ...MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS
].join(",");

const MOUNTAIN_FOUNDATION_V21_DEFAULTS = {
  primary_region: "KANTO_TOKYO",
  mountain_range: "UNKNOWN",
  prefectures: ["UNKNOWN"]
} satisfies Pick<MountainFoundationProfile, (typeof MOUNTAIN_FOUNDATION_V21_COLUMNS)[number]>;

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

const MOUNTAIN_FOUNDATION_SUPPLEMENTARY_DEFAULTS = {
  active_volcano_status: "NONE",
  jma_volcano_name: null,
  jma_alert_url: null,
  jma_constant_monitoring: null,
  restriction_status_note: null,
  snow_free_month_guide: null,
  mandatory_gear_note: null,
  supplementary_notes: null
} satisfies Pick<
  MountainFoundationProfile,
  (typeof MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS)[number]
>;

export const getMountainFoundationProfiles = cache(
  async function getMountainFoundationProfiles() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mountain_foundation_profiles")
      .select(MOUNTAIN_FOUNDATION_SELECT)
      .returns<MountainFoundationProfile[]>()
      .order("name_ja", { ascending: true });

    if (error && isMissingMountainFoundationSupplementaryColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_CORE_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return ((fallbackData ?? []) as unknown as Partial<MountainFoundationProfile>[])
        .map(withMountainFoundationDefaults);
    }

    if (error && isMissingMountainFoundationV21ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_V2_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError && isMissingMountainFoundationV2ColumnError(fallbackError)) {
        const { data: baseFallbackData, error: baseFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
          .order("name_ja", { ascending: true });

        if (baseFallbackError) {
          throw new Error(baseFallbackError.message);
        }

        return ((baseFallbackData ?? []) as unknown as Partial<MountainFoundationProfile>[])
          .map(withMountainFoundationDefaults);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return ((fallbackData ?? []) as unknown as Partial<MountainFoundationProfile>[])
        .map(withMountainFoundationDefaults);
    }

    if (error && isMissingMountainFoundationV2ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return ((fallbackData ?? []) as unknown as Partial<MountainFoundationProfile>[])
        .map(withMountainFoundationDefaults);
    }

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map(withMountainFoundationDefaults);
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

    if (error && isMissingMountainFoundationSupplementaryColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_CORE_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return fallbackData
        ? withMountainFoundationDefaults(
            fallbackData as unknown as Partial<MountainFoundationProfile>
          )
        : null;
    }

    if (error && isMissingMountainFoundationV21ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_V2_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError && isMissingMountainFoundationV2ColumnError(fallbackError)) {
        const { data: baseFallbackData, error: baseFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (baseFallbackError) {
          throw new Error(baseFallbackError.message);
        }

        return baseFallbackData
          ? withMountainFoundationDefaults(
              baseFallbackData as unknown as Partial<MountainFoundationProfile>
            )
          : null;
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return fallbackData
        ? withMountainFoundationDefaults(
            fallbackData as unknown as Partial<MountainFoundationProfile>
          )
        : null;
    }

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
        ? withMountainFoundationDefaults(
            fallbackData as unknown as Partial<MountainFoundationProfile>
          )
        : null;
    }

    if (error) {
      throw new Error(error.message);
    }

    return data ? withMountainFoundationDefaults(data) : null;
  }
);

function withMountainFoundationDefaults(
  profile: Partial<MountainFoundationProfile>
) {
  return {
    ...MOUNTAIN_FOUNDATION_V21_DEFAULTS,
    ...MOUNTAIN_FOUNDATION_V2_DEFAULTS,
    ...MOUNTAIN_FOUNDATION_SUPPLEMENTARY_DEFAULTS,
    ...profile
  } as MountainFoundationProfile;
}

function isMissingMountainFoundationV21ColumnError(error: { code?: string; message?: string }) {
  if (error.code === "42703") {
    return MOUNTAIN_FOUNDATION_V21_COLUMNS.some((column) => {
      return error.message?.includes(column);
    });
  }

  return MOUNTAIN_FOUNDATION_V21_COLUMNS.some((column) => {
    return error.message?.includes(column);
  });
}

function isMissingMountainFoundationV2ColumnError(error: { code?: string; message?: string }) {
  if (error.code === "42703") {
    return true;
  }

  return MOUNTAIN_FOUNDATION_V2_COLUMNS.some((column) => {
    return error.message?.includes(column);
  });
}

function isMissingMountainFoundationSupplementaryColumnError(error: {
  code?: string;
  message?: string;
}) {
  return MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS.some((column) => {
    return error.message?.includes(column);
  });
}
