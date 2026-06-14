import type {
  GearCompatibilityRule,
  GearMatchingDatabaseGearMatch,
  GearMatchingInput,
  GearMatchingOwnedGearMatch,
  GearMatchingResult,
  GearProduct,
  RequirementSlot,
  UserGear
} from "@/lib/types";

type NormalizedGearClassification = {
  category: string | null;
  subcategory: string | null;
  source: "gear" | "product";
};

const GEAR_COMPATIBILITY_RULES: Record<RequirementSlot, GearCompatibilityRule> = {
  WATER_STORAGE: {
    slot: "WATER_STORAGE",
    compatible_targets: [{ category: "other", subcategory: "bottle" }],
    confidence: "MEDIUM",
    ambiguous_cases: ["Hydration bladder and reservoir storage are not normalized yet."]
  },
  WATER_TREATMENT: {
    slot: "WATER_TREATMENT",
    compatible_targets: [{ category: "other", subcategory: "water_filter" }],
    confidence: "HIGH",
    ambiguous_cases: ["Chemical treatment is not normalized yet."]
  },
  TENT: {
    slot: "TENT",
    compatible_targets: [{ category: "shelter", subcategory: "tent" }],
    confidence: "HIGH",
    ambiguous_cases: ["Tarp-only shelter is not treated as tent coverage."]
  },
  SLEEP_INSULATION: {
    slot: "SLEEP_INSULATION",
    compatible_targets: [{ category: "sleep", subcategory: "sleeping_bag" }],
    confidence: "HIGH",
    ambiguous_cases: ["Quilt is not normalized separately yet."]
  },
  SLEEP_PAD: {
    slot: "SLEEP_PAD",
    compatible_targets: [{ category: "sleep", subcategory: "sleeping_pad" }],
    confidence: "HIGH",
    ambiguous_cases: []
  },
  STOVE: {
    slot: "STOVE",
    compatible_targets: [{ category: "cooking", subcategory: "stove" }],
    confidence: "HIGH",
    ambiguous_cases: []
  },
  FUEL: {
    slot: "FUEL",
    compatible_targets: [
      { category: "cooking", subcategory: "fuel" },
      { category: "cooking", subcategory: "gas_canister" }
    ],
    confidence: "HIGH",
    ambiguous_cases: ["Liquid fuel and alcohol fuel are not normalized separately yet."]
  },
  COOK_POT: {
    slot: "COOK_POT",
    compatible_targets: [{ category: "cooking", subcategory: "cookware" }],
    confidence: "HIGH",
    ambiguous_cases: ["Pot, pan, and kettle are grouped as cookware."]
  },
  TABLEWARE: {
    slot: "TABLEWARE",
    compatible_targets: [{ category: "cooking", subcategory: "tableware" }],
    confidence: "HIGH",
    ambiguous_cases: ["Mugs may be stored as cookware in older data."]
  },
  RAIN_JACKET: {
    slot: "RAIN_JACKET",
    compatible_targets: [{ category: "clothing", subcategory: "rain_jacket" }],
    confidence: "HIGH",
    ambiguous_cases: ["Generic rainwear does not prove jacket coverage."]
  },
  RAIN_PANTS: {
    slot: "RAIN_PANTS",
    compatible_targets: [{ category: "clothing", subcategory: "rain_pants" }],
    confidence: "HIGH",
    ambiguous_cases: ["Generic rainwear does not prove pants coverage."]
  },
  INSULATION_LAYER: {
    slot: "INSULATION_LAYER",
    compatible_targets: [
      { category: "clothing", subcategory: "insulation" },
      { category: "clothing", subcategory: "down_jacket" }
    ],
    confidence: "MEDIUM",
    ambiguous_cases: ["Fleece and synthetic insulation are not normalized separately yet."]
  },
  BASE_LAYER: {
    slot: "BASE_LAYER",
    compatible_targets: [{ category: "clothing", subcategory: "base_layer" }],
    confidence: "HIGH",
    ambiguous_cases: []
  },
  HELMET: {
    slot: "HELMET",
    compatible_targets: [{ category: "other", subcategory: "helmet" }],
    confidence: "HIGH",
    ambiguous_cases: ["Climbing and alpine helmets are grouped together for now."]
  },
  TRACTION_DEVICE: {
    slot: "TRACTION_DEVICE",
    compatible_targets: [{ category: "other", subcategory: "traction_device" }],
    confidence: "MEDIUM",
    ambiguous_cases: ["Crampons, microspikes, and chain spikes are grouped for V2."]
  },
  GPS_DEVICE: {
    slot: "GPS_DEVICE",
    compatible_targets: [{ category: "electronics", subcategory: "gps" }],
    confidence: "MEDIUM",
    ambiguous_cases: ["Map, compass, and phone navigation are not equivalent to GPS device coverage."]
  },
  POWER_BANK: {
    slot: "POWER_BANK",
    compatible_targets: [{ category: "electronics", subcategory: "power_bank" }],
    confidence: "HIGH",
    ambiguous_cases: []
  },
  FIRST_AID_KIT: {
    slot: "FIRST_AID_KIT",
    compatible_targets: [{ category: "first_aid", subcategory: "first_aid_kit" }],
    confidence: "HIGH",
    ambiguous_cases: ["Individual medical items are not kit coverage."]
  },
  HEADLAMP: {
    slot: "HEADLAMP",
    compatible_targets: [{ category: "electronics", subcategory: "headlamp" }],
    confidence: "HIGH",
    ambiguous_cases: ["Handheld flashlight is not normalized as headlamp coverage."]
  }
};

const SLOT_TEXT_HINTS: Partial<Record<RequirementSlot, readonly RegExp[]>> = {
  WATER_STORAGE: [
    /\b(nalgene|bottle|water bottle|wide mouth|hydration bladder|reservoir)\b/i,
    /ナルゲン|ボトル|水筒|ハイドレーション/
  ],
  WATER_TREATMENT: [
    /\b(filter|purifier|sawyer|katadyn|quickdraw)\b/i,
    /浄水|フィルター/
  ],
  TENT: [
    /\b(tent|mountain shot|stella ridge|x-mid)\b/i,
    /テント|マウンテンショット|ステラリッジ/
  ],
  SLEEP_INSULATION: [
    /\b(sleeping bag|sleepingbag|down hugger|seamless down hugger|quilt)\b/i,
    /寝袋|シュラフ|スリーピングバッグ|ダウンハガー/
  ],
  SLEEP_PAD: [
    /\b(sleeping pad|sleeping mat|tensor|z lite|foam pad)\b/i,
    /スリーピングパッド|マット/
  ],
  STOVE: [/\b(stove|burner|windmaster)\b/i, /ストーブ|バーナー|ウインドマスター/],
  FUEL: [/\b(fuel|gas canister|gas cartridge|cartridge)\b/i, /燃料|ガス缶|カートリッジ/],
  COOK_POT: [/\b(cook pot|cookware|pot|kettle|mug|cup)\b/i, /クッカー|コッヘル|鍋|カップ/],
  TABLEWARE: [/\b(spoon|fork|spork|chopsticks|bowl|plate)\b/i, /食器|箸|スプーン|フォーク|皿|ボウル/],
  RAIN_JACKET: [/\b(rain jacket|storm cruiser jacket|hard shell jacket)\b/i, /レインジャケット|ストームクルーザー.*ジャケット/],
  RAIN_PANTS: [/\b(rain pants|storm cruiser pants|hard shell pants)\b/i, /レインパンツ|ストームクルーザー.*パンツ/],
  INSULATION_LAYER: [/\b(down jacket|down parka|fleece|insulation layer)\b/i, /ダウン|保温着|フリース|パーカ/],
  BASE_LAYER: [/\b(base layer|baselayer|merino)\b/i, /ベースレイヤー|メリノ/],
  HELMET: [/\b(helmet|climbing helmet|alpine helmet)\b/i, /ヘルメット/],
  TRACTION_DEVICE: [
    /\b(microspikes|chain spikes|crampons|light crampons|traction)\b/i,
    /軽アイゼン|チェーンスパイク|アイゼン|スパイク/
  ],
  GPS_DEVICE: [/\b(gps|garmin|etrex|inreach|gpsmap)\b/i, /GPS/],
  POWER_BANK: [/\b(power bank|battery pack|portable battery)\b/i, /モバイルバッテリー/],
  FIRST_AID_KIT: [/\b(first aid|medical kit)\b/i, /ファーストエイド|救急/],
  HEADLAMP: [/\b(headlamp|head lamp|spot 400)\b/i, /ヘッドランプ|ヘッデン/]
};

const BROAD_FALLBACK_SUBCATEGORIES = new Set([
  "accessory",
  "other",
  "rainwear"
]);

export function getGearCompatibilityRule(slot: RequirementSlot): GearCompatibilityRule {
  return GEAR_COMPATIBILITY_RULES[slot];
}

export function matchGearForRequirementSlot({
  slot,
  ownedGear = [],
  databaseGear = []
}: GearMatchingInput): GearMatchingResult {
  const rule = getGearCompatibilityRule(slot);
  const matchingOwnedGear = applySlotTextFilters(
    ownedGear.filter((item) => matchesRule(item, rule, slot)),
    slot
  );
  const matchingDatabaseGear = applySlotTextFilters(
    databaseGear.filter((item) => matchesRule(item, rule, slot)),
    slot
  );

  return {
    slot,
    compatible_categories: unique(rule.compatible_targets.map((target) => target.category)),
    compatible_subcategories: unique(
      rule.compatible_targets.map((target) => target.subcategory)
    ),
    matching_owned_gear: matchingOwnedGear.map(toOwnedGearMatch),
    matching_database_gear: matchingDatabaseGear.map(toDatabaseGearMatch),
    confidence: rule.confidence,
    ambiguous_cases: rule.ambiguous_cases
  };
}

function applySlotTextFilters<T extends UserGear | GearProduct>(
  items: T[],
  slot: RequirementSlot
) {
  if (slot !== "TENT") {
    return items;
  }

  return items.filter((item) => !isTentAccessory(item));
}

function matchesRule(
  item: UserGear | GearProduct,
  rule: GearCompatibilityRule,
  slot: RequirementSlot
) {
  const classifications = getNormalizedClassifications(item);
  const gearClassification =
    classifications.find((classification) => classification.source === "gear") ?? null;

  if (matchesClassification(gearClassification, rule)) {
    return true;
  }

  if (
    canUseFallbackClassification(gearClassification, rule) &&
    classifications.some((classification) => {
      return classification.source === "product" && matchesClassification(classification, rule);
    })
  ) {
    return true;
  }

  return (
    canUseFallbackClassification(gearClassification, rule) &&
    matchesSlotTextHint(item, slot)
  );
}

function getNormalizedClassifications(
  item: UserGear | GearProduct
): NormalizedGearClassification[] {
  const classifications: NormalizedGearClassification[] = [
    {
      source: "gear",
      category: normalizeCategory(
        item.gear_categories?.name_en,
        item.gear_categories?.name_ja
      ),
      subcategory: normalizeSubcategory(
        item.gear_subcategories?.name_en,
        item.gear_subcategories?.name_ja
      )
    }
  ];

  if ("gear_products" in item && item.gear_products) {
    classifications.push({
      source: "product",
      category: normalizeCategory(
        item.gear_products.gear_categories?.name_en,
        item.gear_products.gear_categories?.name_ja
      ),
      subcategory: normalizeSubcategory(
        item.gear_products.gear_subcategories?.name_en,
        item.gear_products.gear_subcategories?.name_ja
      )
    });
  }

  return classifications;
}

function matchesClassification(
  classification: NormalizedGearClassification | null,
  rule: GearCompatibilityRule
) {
  if (!classification?.category || !classification.subcategory) {
    return false;
  }

  return rule.compatible_targets.some((target) => {
    return (
      target.category === classification.category &&
      target.subcategory === classification.subcategory
    );
  });
}

function canUseFallbackClassification(
  classification: NormalizedGearClassification | null,
  rule: GearCompatibilityRule
) {
  if (!classification?.category || classification.category === "other") {
    return true;
  }

  const categoryMatchesRule = rule.compatible_targets.some((target) => {
    return target.category === classification.category;
  });

  if (!categoryMatchesRule) {
    return false;
  }

  return (
    !classification.subcategory ||
    BROAD_FALLBACK_SUBCATEGORIES.has(classification.subcategory)
  );
}

function matchesSlotTextHint(item: UserGear | GearProduct, slot: RequirementSlot) {
  const patterns = SLOT_TEXT_HINTS[slot];

  if (!patterns) {
    return false;
  }

  if (slot === "TENT" && isTentAccessory(item)) {
    return false;
  }

  const text = getPrimaryGearSearchText(item);

  return patterns.some((pattern) => pattern.test(text));
}

function isTentAccessory(item: UserGear | GearProduct) {
  const text = getGearSearchText(item);

  return (
    /ground\s*sheet|groundsheet|foot\s*print|footprint/i.test(text) ||
    /グラウンドシート|グランドシート|地布|フットプリント/i.test(text)
  );
}

function normalizeCategory(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const token = normalizeToken(value);

    if (!token) {
      continue;
    }

    if (["backpack", "backpacking", "carry"].includes(token)) {
      return "backpack";
    }

    if (token.includes("shelter") || token.includes("tent") || token.includes("シェルター")) {
      return "shelter";
    }

    if (token === "sleeping" || token.includes("sleep") || token.includes("寝具")) {
      return "sleep";
    }

    if (token === "rainwear" || token.includes("clothing") || token.includes("ウェア")) {
      return "clothing";
    }

    if (token.includes("cooking") || token.includes("クッキング")) {
      return "cooking";
    }

    if (token === "navigation" || token.includes("electronics") || token.includes("電子")) {
      return "electronics";
    }

    if (token === "safety" || token.includes("first_aid") || token.includes("応急")) {
      return "first_aid";
    }

    if (token.includes("bear_safety") || token.includes("熊")) {
      return "bear_safety";
    }

    if (token === "hydration" || token.includes("other") || token.includes("その他")) {
      return "other";
    }

    return token;
  }

  return null;
}

function normalizeSubcategory(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const token = normalizeToken(value);

    if (!token) {
      continue;
    }

    if (token === "tent" || token.includes("テント")) {
      return "tent";
    }

    if (token === "bottle" || token.includes("ボトル") || token.includes("水筒")) {
      return "bottle";
    }

    if (token.includes("water_filter") || token.includes("浄水")) {
      return "water_filter";
    }

    if (token.includes("sleeping_bag") || token.includes("寝袋")) {
      return "sleeping_bag";
    }

    if (token.includes("sleeping_pad") || token.includes("マット")) {
      return "sleeping_pad";
    }

    if (token.includes("rain_jacket") || token.includes("レインジャケット")) {
      return "rain_jacket";
    }

    if (token.includes("rain_pants") || token.includes("レインパンツ")) {
      return "rain_pants";
    }

    if (token === "stove" || token.includes("ストーブ") || token.includes("バーナー")) {
      return "stove";
    }

    if (token === "fuel" || token.includes("燃料")) {
      return "fuel";
    }

    if (token.includes("gas_canister") || token.includes("ガス缶")) {
      return "gas_canister";
    }

    if (token === "cookware" || token.includes("クッカー")) {
      return "cookware";
    }

    if (token === "tableware" || token.includes("食器")) {
      return "tableware";
    }

    if (token === "rainwear" || token.includes("レインウェア")) {
      return "rainwear";
    }

    if (token === "insulation" || token.includes("保温")) {
      return "insulation";
    }

    if (token.includes("down_jacket") || token.includes("ダウンジャケット")) {
      return "down_jacket";
    }

    if (token.includes("base_layer") || token.includes("ベースレイヤー")) {
      return "base_layer";
    }

    if (token === "helmet" || token.includes("ヘルメット")) {
      return "helmet";
    }

    if (
      token.includes("traction_device") ||
      token.includes("microspikes") ||
      token.includes("chain_spikes") ||
      token.includes("crampons") ||
      token.includes("軽アイゼン") ||
      token.includes("チェーンスパイク") ||
      token.includes("アイゼン")
    ) {
      return "traction_device";
    }

    if (token === "gps") {
      return "gps";
    }

    if (token.includes("power_bank") || token.includes("モバイルバッテリー")) {
      return "power_bank";
    }

    if (token.includes("first_aid")) {
      return "first_aid_kit";
    }

    if (token === "headlamp" || token.includes("ヘッドランプ")) {
      return "headlamp";
    }

    return token;
  }

  return null;
}

function normalizeToken(value: string | null | undefined) {
  return value
    ?.normalize("NFKC")
    .toLowerCase()
    .replace(/[()（）]/g, " ")
    .replace(/[／/・-]/g, " ")
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_") ?? null;
}

function getPrimaryGearSearchText(item: UserGear | GearProduct) {
  const commonFields = [item.brand, item.model];

  if ("name" in item) {
    return [...commonFields, item.name].filter(Boolean).join(" ");
  }

  return [
    ...commonFields,
    item.name_ja,
    ...(item.gear_product_aliases?.map((alias) => alias.alias) ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

function getGearSearchText(item: UserGear | GearProduct) {
  const commonFields = [item.brand, item.model];

  if ("name" in item) {
    return [
      ...commonFields,
      item.name,
      item.gear_products?.brand,
      item.gear_products?.model,
      item.gear_products?.name_ja
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    ...commonFields,
    item.name_ja,
    ...(item.gear_product_aliases?.map((alias) => alias.alias) ?? [])
  ]
    .filter(Boolean)
    .join(" ");
}

function toOwnedGearMatch(item: UserGear): GearMatchingOwnedGearMatch {
  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    model: item.model,
    category_id: item.category_id,
    subcategory_id: item.subcategory_id,
    gear_categories: item.gear_categories ?? null,
    gear_subcategories: item.gear_subcategories ?? null
  };
}

function toDatabaseGearMatch(item: GearProduct): GearMatchingDatabaseGearMatch {
  return {
    id: item.id,
    brand: item.brand,
    model: item.model,
    name_ja: item.name_ja,
    category_id: item.category_id,
    subcategory_id: item.subcategory_id,
    gear_categories: item.gear_categories ?? null,
    gear_subcategories: item.gear_subcategories ?? null
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}
