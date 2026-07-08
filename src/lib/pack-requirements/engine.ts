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
  "HELMET",
  "TRACTION_DEVICE",
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
  TECHNICAL_SAFETY_SYSTEM: [],
  EMERGENCY_SYSTEM: ["FIRST_AID_KIT", "HEADLAMP"]
};

const STYLE_REQUIREMENT_SLOTS: Record<
  MountainFoundationStyle,
  readonly { system: PlanningSystem; slot: RequirementSlot }[]
> = {
  DAY_HIKE: [],
  OVERNIGHT_HUT: [
    { system: "SLEEP_SYSTEM", slot: "SLEEP_INSULATION" },
    { system: "SLEEP_SYSTEM", slot: "SLEEP_PAD" }
  ],
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
  const activeSlots = getRequirementSlotsForTrip(requiredSystems, style, {
    mountain,
    season
  });
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
  style: MountainFoundationStyle,
  context?: Pick<PackRequirementInput, "mountain" | "season">
): RequirementSlot[] {
  const activeSlots = new Set<RequirementSlot>();

  for (const system of requiredSystems) {
    for (const slot of SYSTEM_REQUIREMENT_SLOTS[system]) {
      if (shouldIncludeSystemSlot({ system, slot, style, context })) {
        activeSlots.add(slot);
      }
    }
  }

  for (const { system, slot } of STYLE_REQUIREMENT_SLOTS[style]) {
    if (
      requiredSystems.includes(system) &&
      shouldIncludeStyleSlot({ slot, style, context })
    ) {
      activeSlots.add(slot);
    }
  }

  if (requiredSystems.includes("TECHNICAL_SAFETY_SYSTEM")) {
    for (const slot of getTechnicalSafetySlots(context)) {
      activeSlots.add(slot);
    }
  }

  return REQUIREMENT_SLOT_ORDER.filter((slot) => activeSlots.has(slot));
}

function shouldIncludeSystemSlot({
  system,
  slot,
  style,
  context
}: {
  system: PlanningSystem;
  slot: RequirementSlot;
  style: MountainFoundationStyle;
  context?: Pick<PackRequirementInput, "mountain" | "season">;
}) {
  if (slot === "WATER_TREATMENT" && !requiresWaterTreatment(context?.mountain)) {
    return false;
  }

  if (
    system === "COOK_SYSTEM" &&
    style === "OVERNIGHT_HUT" &&
    !requiresHutCooking(context?.mountain)
  ) {
    return false;
  }

  return true;
}

function shouldIncludeStyleSlot({
  slot,
  style,
  context
}: {
  slot: RequirementSlot;
  style: MountainFoundationStyle;
  context?: Pick<PackRequirementInput, "mountain" | "season">;
}) {
  if (
    style === "OVERNIGHT_HUT" &&
    (slot === "SLEEP_INSULATION" || slot === "SLEEP_PAD") &&
    !requiresHutSleepInsulation(context?.mountain)
  ) {
    return false;
  }

  return true;
}

function getTechnicalSafetySlots(
  context?: Pick<PackRequirementInput, "mountain" | "season">
) {
  const slots: RequirementSlot[] = [];
  const mountain = context?.mountain;

  if (!mountain) {
    return slots;
  }

  if (
    mountain.helmet_guidance === "RECOMMENDED" ||
    mountain.helmet_guidance === "REQUIRED" ||
    ["CHAIN_LADDER", "EXPOSED_SCRAMBLE"].includes(mountain.technical_terrain ?? "")
  ) {
    slots.push("HELMET");
  }

  if (requiresTractionDevice(mountain, context.season)) {
    slots.push("TRACTION_DEVICE");
  }

  return slots;
}

function requiresWaterTreatment(mountain?: PackRequirementInput["mountain"]) {
  if (!mountain) {
    return true;
  }

  return ["NATURAL_RELIABLE", "LIMITED_OR_SEASONAL", "UNRELIABLE"].includes(
    mountain.water_availability ?? "NATURAL_RELIABLE"
  );
}

function requiresHutSleepInsulation(mountain?: PackRequirementInput["mountain"]) {
  return !["FULL_SERVICE", "BEDDING_ONLY"].includes(
    mountain?.hut_support ?? "BASIC_NO_BEDDING"
  );
}

function requiresHutCooking(mountain?: PackRequirementInput["mountain"]) {
  return false;
}

function requiresTractionDevice(
  mountain: PackRequirementInput["mountain"],
  season: PackRequirementInput["season"]
) {
  if (["LIKELY", "WINTER_ALPINE"].includes(mountain.snow_or_ice_risk ?? "")) {
    return true;
  }

  if (season === "WINTER") {
    return true;
  }

  return (
    mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
    (season === "SPRING" || season === "AUTUMN")
  );
}
