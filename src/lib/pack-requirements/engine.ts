import type {
  MountainFoundationStyle,
  PackRequirementInput,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  PlanningSystem,
  RequirementSlot
} from "@/lib/types";
import { matchGearForRequirementSlot } from "@/lib/gear-matching/engine";

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

export function generatePackRequirementPlan({
  mountain,
  season,
  style,
  requiredSystems,
  ownedGear
}: PackRequirementInput): PackRequirementPlan {
  const activeSlots = getRequirementSlotsForTrip(requiredSystems, style);
  const requiredSlots = activeSlots.map((slot) => {
    const matches = matchGearForRequirementSlot({
      slot,
      ownedGear
    }).matching_owned_gear;

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
