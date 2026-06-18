import type { UserGear } from "@/lib/types";

export const MAJOR_GEAR_CATEGORIES = [
  {
    id: "clothing",
    label: "ウェア",
    color: "#2E7D32",
    categoryAliases: ["clothing", "rainwear"],
    subcategoryAliases: [
      "rainwear",
      "rain_jacket",
      "rain_pants",
      "insulation",
      "down_jacket",
      "base_layer",
      "trekking_pants",
      "gloves"
    ],
    textHints: [
      "ウェア",
      "レイン",
      "ジャケット",
      "フリース",
      "ダウン",
      "ベースレイヤー",
      "グローブ",
      "手袋",
      "帽子"
    ]
  },
  {
    id: "backpack",
    label: "ザック",
    color: "#1976D2",
    categoryAliases: ["backpack", "backpacking", "carry"],
    subcategoryAliases: ["backpack"],
    textHints: ["ザック", "バックパック", "パック", "ポーチ", "サコッシュ"]
  },
  {
    id: "shoes",
    label: "シューズ",
    color: "#F57C00",
    categoryAliases: [],
    subcategoryAliases: ["footwear", "gaiters", "socks", "insole"],
    textHints: [
      "登山靴",
      "シューズ",
      "ブーツ",
      "ゲイター",
      "靴下",
      "ソックス",
      "インソール"
    ]
  },
  {
    id: "tentSleep",
    label: "テント・シュラフ",
    color: "#7E57C2",
    categoryAliases: ["shelter", "sleep", "sleeping"],
    subcategoryAliases: [
      "tent",
      "groundsheet",
      "sleeping_bag",
      "sleeping_pad",
      "pillow",
      "sleeping_bag_cover"
    ],
    textHints: [
      "テント",
      "シェルター",
      "ツェルト",
      "シュラフ",
      "寝袋",
      "マット",
      "ピロー",
      "枕",
      "フットプリント",
      "グラウンドシート",
      "グランドシート"
    ]
  },
  {
    id: "cooking",
    label: "クッキング",
    color: "#FBC02D",
    categoryAliases: ["cooking", "hydration"],
    subcategoryAliases: [
      "stove",
      "fuel",
      "gas_canister",
      "cookware",
      "tableware",
      "bottle",
      "water_filter"
    ],
    textHints: [
      "バーナー",
      "ストーブ",
      "クッカー",
      "コッヘル",
      "燃料",
      "ガス",
      "カトラリー",
      "食器",
      "ボトル",
      "水筒",
      "浄水"
    ]
  },
  {
    id: "safetyNav",
    label: "安全・ナビ",
    color: "#0097A7",
    categoryAliases: ["electronics", "navigation", "first_aid", "safety", "bear_safety"],
    subcategoryAliases: [
      "gps",
      "power_bank",
      "headlamp",
      "first_aid_kit",
      "helmet",
      "traction_device",
      "ice_axe",
      "trekking_pole"
    ],
    textHints: [
      "ヘッドランプ",
      "コンパス",
      "地図",
      "gps",
      "ファーストエイド",
      "救急",
      "ホイッスル",
      "保険証",
      "熊鈴",
      "ヘルメット",
      "アイゼン",
      "チェーンスパイク",
      "ピッケル",
      "モバイルバッテリー"
    ]
  }
] as const;

export type MajorGearCategoryId = (typeof MAJOR_GEAR_CATEGORIES)[number]["id"];
const majorGearCategoryIds = new Set<string>(
  MAJOR_GEAR_CATEGORIES.map((category) => category.id)
);

export type MajorGearCategoryCoverage = {
  coveredIds: MajorGearCategoryId[];
  missingIds: MajorGearCategoryId[];
  coveredLabels: string[];
  missingLabels: string[];
  coveredCount: number;
  totalCount: number;
};

type GearCategoryLike = Pick<UserGear, "category_id"> & {
  gear_categories?: Pick<NonNullable<UserGear["gear_categories"]>, "name_en"> | null;
  subcategory_id?: string | null;
  gear_subcategories?: Pick<NonNullable<UserGear["gear_subcategories"]>, "name_en"> | null;
  name?: string | null;
  brand?: string | null;
  model?: string | null;
};

export function getMajorGearCategoryCoverage(
  gear: readonly GearCategoryLike[]
): MajorGearCategoryCoverage {
  const coveredIds = new Set<MajorGearCategoryId>();

  for (const item of gear) {
    const matched = getMajorGearCategoryId(item);

    if (matched) {
      coveredIds.add(matched);
    }
  }

  const covered = MAJOR_GEAR_CATEGORIES.filter((category) =>
    coveredIds.has(category.id)
  );
  const missing = MAJOR_GEAR_CATEGORIES.filter(
    (category) => !coveredIds.has(category.id)
  );

  return {
    coveredIds: covered.map((category) => category.id),
    missingIds: missing.map((category) => category.id),
    coveredLabels: covered.map((category) => category.label),
    missingLabels: missing.map((category) => category.label),
    coveredCount: covered.length,
    totalCount: MAJOR_GEAR_CATEGORIES.length
  };
}

function getMajorGearCategoryId(item: GearCategoryLike) {
  return getRetailGearCategory(item)?.id ?? null;
}

export function getRetailGearCategory(item: GearCategoryLike) {
  const categoryCandidates = [item.category_id, item.gear_categories?.name_en]
    .filter((value): value is string => Boolean(value))
    .map(normalizeCategoryKey);
  const subcategoryCandidates = [item.subcategory_id, item.gear_subcategories?.name_en]
    .filter((value): value is string => Boolean(value))
    .map(normalizeCategoryKey);
  const text = [item.name, item.brand, item.model]
    .filter(Boolean)
    .join(" ")
    .normalize("NFKC")
    .toLowerCase();

  for (const category of MAJOR_GEAR_CATEGORIES) {
    if (
      category.subcategoryAliases.some((alias) =>
        subcategoryCandidates.includes(normalizeCategoryKey(alias))
      )
    ) {
      return category;
    }
  }

  for (const category of MAJOR_GEAR_CATEGORIES) {
    if (
      category.categoryAliases.some((alias) =>
        categoryCandidates.includes(normalizeCategoryKey(alias))
      )
    ) {
      return category;
    }
  }

  for (const category of MAJOR_GEAR_CATEGORIES) {
    if (
      category.textHints.some((hint) =>
        text.includes(hint.normalize("NFKC").toLowerCase())
      )
    ) {
      return category;
    }
  }

  return null;
}

export function isRetailGearCategoryId(value: string | null | undefined) {
  return Boolean(value && majorGearCategoryIds.has(value));
}

function normalizeCategoryKey(value: string) {
  return value.toLowerCase().replace(/[\s_-]+/g, "");
}
