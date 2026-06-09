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
    ownedGear.filter((item) => matchesRule(item, rule)),
    slot
  );
  const matchingDatabaseGear = applySlotTextFilters(
    databaseGear.filter((item) => matchesRule(item, rule)),
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

function matchesRule(item: UserGear | GearProduct, rule: GearCompatibilityRule) {
  const category = item.gear_categories?.name_en;
  const subcategory = item.gear_subcategories?.name_en;

  return rule.compatible_targets.some((target) => {
    return target.category === category && target.subcategory === subcategory;
  });
}

function isTentAccessory(item: UserGear | GearProduct) {
  const text = getGearSearchText(item);

  return /foot\s*print/i.test(text) || /地布/.test(text) || /フットプリント/i.test(text);
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
