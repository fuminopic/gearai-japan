import type {
  MountainFoundationStyle,
  PackRequirementInput,
  PackRequirementOwnedGearMatch,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  PlanningSystem,
  RequirementSlot,
  UserGear
} from "@/lib/types";

const REQUIREMENT_SLOT_ORDER: readonly RequirementSlot[] = [
  "WATER_STORAGE",
  "WATER_TREATMENT",
  "TENT",
  "SLEEP_INSULATION",
  "SLEEP_PAD",
  "STOVE",
  "FUEL",
  "COOK_POT",
  "TABLEWARE",
  "RAIN_JACKET",
  "RAIN_PANTS",
  "INSULATION_LAYER",
  "BASE_LAYER",
  "GPS_DEVICE",
  "POWER_BANK",
  "FIRST_AID_KIT",
  "HEADLAMP"
];

const SYSTEM_REQUIREMENT_SLOTS: Record<PlanningSystem, readonly RequirementSlot[]> = {
  WATER_SYSTEM: ["WATER_STORAGE", "WATER_TREATMENT"],
  SHELTER_SYSTEM: [],
  SLEEP_SYSTEM: [],
  COOK_SYSTEM: ["STOVE", "FUEL", "COOK_POT", "TABLEWARE"],
  RAIN_SYSTEM: ["RAIN_JACKET", "RAIN_PANTS"],
  COLD_WEATHER_LAYER: ["INSULATION_LAYER", "BASE_LAYER"],
  NAVIGATION_SYSTEM: ["GPS_DEVICE", "POWER_BANK"],
  EMERGENCY_SYSTEM: ["FIRST_AID_KIT", "HEADLAMP"]
};

const STYLE_REQUIREMENT_SLOTS: Record<
  MountainFoundationStyle,
  readonly { system: PlanningSystem; slot: RequirementSlot }[]
> = {
  DAY_HIKE: [],
  OVERNIGHT_HUT: [{ system: "SLEEP_SYSTEM", slot: "SLEEP_INSULATION" }],
  OVERNIGHT_TENT: [
    { system: "SHELTER_SYSTEM", slot: "TENT" },
    { system: "SLEEP_SYSTEM", slot: "SLEEP_INSULATION" },
    { system: "SLEEP_SYSTEM", slot: "SLEEP_PAD" }
  ],
  MULTI_DAY_TREK: [
    { system: "SHELTER_SYSTEM", slot: "TENT" },
    { system: "SLEEP_SYSTEM", slot: "SLEEP_INSULATION" },
    { system: "SLEEP_SYSTEM", slot: "SLEEP_PAD" }
  ]
};

const SLOT_GEAR_MATCHERS: Record<
  RequirementSlot,
  readonly { category: string; subcategory: string }[]
> = {
  WATER_STORAGE: [{ category: "other", subcategory: "bottle" }],
  WATER_TREATMENT: [{ category: "other", subcategory: "water_filter" }],
  TENT: [{ category: "shelter", subcategory: "tent" }],
  SLEEP_INSULATION: [{ category: "sleep", subcategory: "sleeping_bag" }],
  SLEEP_PAD: [{ category: "sleep", subcategory: "sleeping_pad" }],
  STOVE: [{ category: "cooking", subcategory: "stove" }],
  FUEL: [
    { category: "cooking", subcategory: "fuel" },
    { category: "cooking", subcategory: "gas_canister" }
  ],
  COOK_POT: [{ category: "cooking", subcategory: "cookware" }],
  TABLEWARE: [{ category: "cooking", subcategory: "tableware" }],
  RAIN_JACKET: [{ category: "clothing", subcategory: "rain_jacket" }],
  RAIN_PANTS: [{ category: "clothing", subcategory: "rain_pants" }],
  INSULATION_LAYER: [
    { category: "clothing", subcategory: "insulation" },
    { category: "clothing", subcategory: "down_jacket" }
  ],
  BASE_LAYER: [{ category: "clothing", subcategory: "base_layer" }],
  GPS_DEVICE: [{ category: "electronics", subcategory: "gps" }],
  POWER_BANK: [{ category: "electronics", subcategory: "power_bank" }],
  FIRST_AID_KIT: [{ category: "first_aid", subcategory: "first_aid_kit" }],
  HEADLAMP: [{ category: "electronics", subcategory: "headlamp" }]
};

export function generatePackRequirementPlan({
  mountain,
  season,
  style,
  requiredSystems,
  ownedGear
}: PackRequirementInput): PackRequirementPlan {
  const activeSlots = getRequirementSlotsForTrip(requiredSystems, style);
  const requiredSlots = activeSlots.map((slot) => {
    const matches = findOwnedGearForSlot(slot, ownedGear);

    return {
      slot,
      coverage_status: matches.length > 0 ? "COVERED" : "MISSING",
      matching_owned_gear: matches
    } satisfies PackRequirementSlotPlan;
  });

  return {
    mountain,
    season,
    style,
    required_systems: requiredSystems,
    required_slots: requiredSlots,
    covered_slots: requiredSlots.filter((slot) => slot.coverage_status === "COVERED"),
    missing_slots: requiredSlots.filter((slot) => slot.coverage_status === "MISSING")
  };
}

export function getRequirementSlotsForTrip(
  requiredSystems: readonly PlanningSystem[],
  style: MountainFoundationStyle
): RequirementSlot[] {
  const activeSlots = new Set<RequirementSlot>();

  for (const system of requiredSystems) {
    for (const slot of SYSTEM_REQUIREMENT_SLOTS[system]) {
      activeSlots.add(slot);
    }
  }

  for (const { system, slot } of STYLE_REQUIREMENT_SLOTS[style]) {
    if (requiredSystems.includes(system)) {
      activeSlots.add(slot);
    }
  }

  return REQUIREMENT_SLOT_ORDER.filter((slot) => activeSlots.has(slot));
}

function findOwnedGearForSlot(
  slot: RequirementSlot,
  ownedGear: readonly UserGear[]
): PackRequirementOwnedGearMatch[] {
  const matchers = SLOT_GEAR_MATCHERS[slot];

  return ownedGear
    .filter((item) => {
      const category = item.gear_categories?.name_en;
      const subcategory = item.gear_subcategories?.name_en;

      return matchers.some((matcher) => {
        return matcher.category === category && matcher.subcategory === subcategory;
      });
    })
    .map(toOwnedGearMatch);
}

function toOwnedGearMatch(item: UserGear): PackRequirementOwnedGearMatch {
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
