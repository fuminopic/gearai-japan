import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { MountainFoundationProfile } from "@/lib/types";

type MountainFoundationFallbackRow = Partial<MountainFoundationProfile>;

const MOUNTAIN_FOUNDATION_BASE_COLUMNS = [
  "slug",
  "name_ja",
  "region",
  "elevation_m",
  "is_hyakumeizan",
  "meizan_list",
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
const MOUNTAIN_FOUNDATION_PLANNING_STATUS_COLUMNS = ["planning_status"] as const;

const MOUNTAIN_FOUNDATION_BASE_SELECT = MOUNTAIN_FOUNDATION_BASE_COLUMNS.join(",");
const MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT = MOUNTAIN_FOUNDATION_BASE_COLUMNS
  .filter((column) => column !== "meizan_list")
  .join(",");
const MOUNTAIN_FOUNDATION_V2_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS
].join(",");
const MOUNTAIN_FOUNDATION_LEGACY_V2_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS.filter((column) => column !== "meizan_list"),
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS
].join(",");
const MOUNTAIN_FOUNDATION_CORE_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
].join(",");
const MOUNTAIN_FOUNDATION_LEGACY_CORE_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS.filter((column) => column !== "meizan_list"),
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
].join(",");
const MOUNTAIN_FOUNDATION_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
  ...MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS,
  ...MOUNTAIN_FOUNDATION_PLANNING_STATUS_COLUMNS
].join(",");
const MOUNTAIN_FOUNDATION_WITHOUT_PLANNING_STATUS_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V21_COLUMNS,
  ...MOUNTAIN_FOUNDATION_V2_COLUMNS,
  ...MOUNTAIN_FOUNDATION_SUPPLEMENTARY_COLUMNS
].join(",");
const MOUNTAIN_FOUNDATION_LEGACY_SELECT = [
  ...MOUNTAIN_FOUNDATION_BASE_COLUMNS.filter((column) => column !== "meizan_list"),
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
const MOUNTAIN_FOUNDATION_PLANNING_STATUS_DEFAULTS = {
  planning_status: "PLANNABLE"
} satisfies Pick<
  MountainFoundationProfile,
  (typeof MOUNTAIN_FOUNDATION_PLANNING_STATUS_COLUMNS)[number]
>;

const JAPAN_NIHYAKUMEIZAN_EXTRA_SLUGS = new Set([
  "kentoku-san",
  "tsubakuro-dake"
]);

const JAPAN_NIHYAKUMEIZAN_EXTRA_NAMES = new Set([
  "天塩岳",
  "石狩岳",
  "ニペソツ山",
  "カムイエクウチカウシ山",
  "ペテガリ岳",
  "芦別岳",
  "夕張岳",
  "暑寒別岳",
  "樽前山",
  "北海道駒ヶ岳",
  "白神岳",
  "姫神山",
  "秋田駒ヶ岳",
  "和賀岳",
  "焼石岳",
  "栗駒山",
  "神室山",
  "森吉山",
  "以東岳",
  "船形山",
  "杁差岳",
  "二王子岳",
  "御神楽岳",
  "守門岳",
  "中ノ岳",
  "八海山",
  "荒沢岳",
  "佐武流山",
  "鳥甲山",
  "帝釈山",
  "会津朝日岳",
  "女峰山",
  "仙ノ倉山",
  "白砂山",
  "岩菅山",
  "浅間隠山",
  "榛名山",
  "妙義山",
  "荒船山",
  "御座山",
  "武甲山",
  "和名倉山",
  "茅ヶ岳",
  "乾徳山",
  "大岳山",
  "三ツ峠山",
  "御正体山",
  "毛無山",
  "愛鷹山",
  "天狗岳",
  "黒姫山",
  "戸隠山",
  "飯縄山",
  "雪倉岳",
  "針ノ木岳",
  "烏帽子岳",
  "赤牛岳",
  "毛勝山",
  "奥大日岳",
  "有明山",
  "餓鬼岳",
  "燕岳",
  "大天井岳",
  "霞沢岳",
  "鋸岳",
  "農鳥岳",
  "上河内岳",
  "池口岳",
  "大無間山",
  "櫛形山",
  "笊ヶ岳",
  "七面山",
  "小秀山",
  "経ヶ岳",
  "南駒ヶ岳",
  "安平路山",
  "金剛堂山",
  "笈ヶ岳",
  "大日ヶ岳",
  "位山",
  "能郷白山",
  "御在所岳",
  "釈迦ヶ岳",
  "伯母子岳",
  "金剛山",
  "武奈ヶ岳",
  "氷ノ山",
  "上蒜山",
  "三瓶山",
  "三嶺",
  "東赤石山",
  "笹ヶ峰",
  "英彦山",
  "雲仙岳",
  "由布岳",
  "大崩山",
  "市房山",
  "尾鈴山",
  "高千穂峰",
  "桜島"
]);

const JAPAN_NIHYAKUMEIZAN_EXTRA_NAME_ALIASES = new Set([
  "駒ヶ岳",
  "白石山",
  "御在所山",
  "武奈岳",
  "笹峰",
  "桜島岳",
  "釈迦岳",
  "荒澤岳"
]);

export const getMountainFoundationProfiles = cache(
  async function getMountainFoundationProfiles() {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("mountain_foundation_profiles")
      .select(MOUNTAIN_FOUNDATION_SELECT)
      .returns<MountainFoundationProfile[]>()
      .order("name_ja", { ascending: true });

    if (error && isMissingMountainFoundationMeizanColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_LEGACY_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError && isMissingMountainFoundationSupplementaryColumnError(fallbackError)) {
        const { data: coreFallbackData, error: coreFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_CORE_SELECT)
          .order("name_ja", { ascending: true });

        if (coreFallbackError) {
          throw new Error(coreFallbackError.message);
        }

        return withMountainFoundationDefaultsForRows(coreFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForRows(fallbackData);
    }

    if (error && isMissingMountainFoundationSupplementaryColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_CORE_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_CORE_SELECT)
          .order("name_ja", { ascending: true });

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForRows(legacyFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForRows(fallbackData);
    }

    if (error && isMissingMountainFoundationPlanningStatusColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_WITHOUT_PLANNING_STATUS_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForRows(fallbackData);
    }

    if (error && isMissingMountainFoundationV21ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_V2_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_V2_SELECT)
          .order("name_ja", { ascending: true });

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForRows(legacyFallbackData);
      }

      if (fallbackError && isMissingMountainFoundationV2ColumnError(fallbackError)) {
        const { data: baseFallbackData, error: baseFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
          .order("name_ja", { ascending: true });

        if (baseFallbackError && isMissingMountainFoundationMeizanColumnError(baseFallbackError)) {
          const { data: legacyBaseData, error: legacyBaseError } = await supabase
            .from("mountain_foundation_profiles")
            .select(MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT)
            .order("name_ja", { ascending: true });

          if (legacyBaseError) {
            throw new Error(legacyBaseError.message);
          }

          return withMountainFoundationDefaultsForRows(legacyBaseData);
        }

        if (baseFallbackError) {
          throw new Error(baseFallbackError.message);
        }

        return withMountainFoundationDefaultsForRows(baseFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForRows(fallbackData);
    }

    if (error && isMissingMountainFoundationV2ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
        .order("name_ja", { ascending: true });

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT)
          .order("name_ja", { ascending: true });

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForRows(legacyFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForRows(fallbackData);
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

    if (error && isMissingMountainFoundationMeizanColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_LEGACY_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError && isMissingMountainFoundationSupplementaryColumnError(fallbackError)) {
        const { data: coreFallbackData, error: coreFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_CORE_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (coreFallbackError) {
          throw new Error(coreFallbackError.message);
        }

        return withMountainFoundationDefaultsForNullableRow(coreFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForNullableRow(fallbackData);
    }

    if (error && isMissingMountainFoundationSupplementaryColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_CORE_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_CORE_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForNullableRow(legacyFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForNullableRow(fallbackData);
    }

    if (error && isMissingMountainFoundationPlanningStatusColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_WITHOUT_PLANNING_STATUS_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForNullableRow(fallbackData);
    }

    if (error && isMissingMountainFoundationV21ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_V2_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_V2_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForNullableRow(legacyFallbackData);
      }

      if (fallbackError && isMissingMountainFoundationV2ColumnError(fallbackError)) {
        const { data: baseFallbackData, error: baseFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (baseFallbackError && isMissingMountainFoundationMeizanColumnError(baseFallbackError)) {
          const { data: legacyBaseData, error: legacyBaseError } = await supabase
            .from("mountain_foundation_profiles")
            .select(MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT)
            .eq("slug", slug)
            .maybeSingle();

          if (legacyBaseError) {
            throw new Error(legacyBaseError.message);
          }

          return withMountainFoundationDefaultsForNullableRow(legacyBaseData);
        }

        if (baseFallbackError) {
          throw new Error(baseFallbackError.message);
        }

        return withMountainFoundationDefaultsForNullableRow(baseFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForNullableRow(fallbackData);
    }

    if (error && isMissingMountainFoundationV2ColumnError(error)) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from("mountain_foundation_profiles")
        .select(MOUNTAIN_FOUNDATION_BASE_SELECT)
        .eq("slug", slug)
        .maybeSingle();

      if (fallbackError && isMissingMountainFoundationMeizanColumnError(fallbackError)) {
        const { data: legacyFallbackData, error: legacyFallbackError } = await supabase
          .from("mountain_foundation_profiles")
          .select(MOUNTAIN_FOUNDATION_LEGACY_BASE_SELECT)
          .eq("slug", slug)
          .maybeSingle();

        if (legacyFallbackError) {
          throw new Error(legacyFallbackError.message);
        }

        return withMountainFoundationDefaultsForNullableRow(legacyFallbackData);
      }

      if (fallbackError) {
        throw new Error(fallbackError.message);
      }

      return withMountainFoundationDefaultsForNullableRow(fallbackData);
    }

    if (error) {
      throw new Error(error.message);
    }

    return data ? withMountainFoundationDefaults(data) : null;
  }
);

function withMountainFoundationDefaultsForRows(
  rows: unknown[] | null | undefined
) {
  return ((rows ?? []) as MountainFoundationFallbackRow[]).map(
    withMountainFoundationDefaults
  );
}

function withMountainFoundationDefaultsForNullableRow(
  row: unknown | null
) {
  return row
    ? withMountainFoundationDefaults(row as MountainFoundationFallbackRow)
    : null;
}

function withMountainFoundationDefaults(
  profile: Partial<MountainFoundationProfile>
) {
  const meizanList = profile.meizan_list ?? resolveMeizanList(profile);

  return {
    ...MOUNTAIN_FOUNDATION_V21_DEFAULTS,
    ...MOUNTAIN_FOUNDATION_V2_DEFAULTS,
    ...MOUNTAIN_FOUNDATION_SUPPLEMENTARY_DEFAULTS,
    ...MOUNTAIN_FOUNDATION_PLANNING_STATUS_DEFAULTS,
    ...profile,
    meizan_list: meizanList
  } as MountainFoundationProfile;
}

function resolveMeizanList(profile: Partial<MountainFoundationProfile>) {
  if (profile.is_hyakumeizan) {
    return "JAPAN_HYAKUMEIZAN";
  }

  if (isJapanNihyakumeizanExtraProfile(profile)) {
    return "JAPAN_NIHYAKUMEIZAN_EXTRA";
  }

  return "OTHER";
}

function isJapanNihyakumeizanExtraProfile(
  profile: Partial<MountainFoundationProfile>
) {
  if (profile.slug && JAPAN_NIHYAKUMEIZAN_EXTRA_SLUGS.has(profile.slug)) {
    return true;
  }

  if (!profile.name_ja) {
    return false;
  }

  return (
    JAPAN_NIHYAKUMEIZAN_EXTRA_NAMES.has(profile.name_ja) ||
    JAPAN_NIHYAKUMEIZAN_EXTRA_NAME_ALIASES.has(profile.name_ja)
  );
}

function isMissingMountainFoundationMeizanColumnError(error: {
  code?: string;
  message?: string;
}) {
  if (error.code === "42703") {
    return error.message?.includes("meizan_list") ?? false;
  }

  return error.message?.includes("meizan_list") ?? false;
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

function isMissingMountainFoundationPlanningStatusColumnError(error: {
  code?: string;
  message?: string;
}) {
  if (error.code === "42703") {
    return error.message?.includes("planning_status") ?? false;
  }

  return error.message?.includes("planning_status") ?? false;
}
