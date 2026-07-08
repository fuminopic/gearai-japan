import type {
  MountainFoundationSeason,
  MountainFoundationStyle,
  PlanningSystem,
  TripRequirementInput
} from "@/lib/types";

const TRIP_REQUIREMENT_SYSTEM_ORDER: readonly PlanningSystem[] = [
  "WATER_SYSTEM",
  "SHELTER_SYSTEM",
  "SLEEP_SYSTEM",
  "COOK_SYSTEM",
  "RAIN_SYSTEM",
  "COLD_WEATHER_LAYER",
  "NAVIGATION_SYSTEM",
  "TECHNICAL_SAFETY_SYSTEM",
  "EMERGENCY_SYSTEM"
];

const ALWAYS_REQUIRED_SYSTEMS: readonly PlanningSystem[] = [
  "WATER_SYSTEM",
  "RAIN_SYSTEM",
  "NAVIGATION_SYSTEM",
  "EMERGENCY_SYSTEM"
];

const STYLE_REQUIRED_SYSTEMS: Record<MountainFoundationStyle, readonly PlanningSystem[]> = {
  DAY_HIKE: [],
  OVERNIGHT_HUT: ["SHELTER_SYSTEM"],
  OVERNIGHT_TENT: ["SHELTER_SYSTEM", "SLEEP_SYSTEM", "COOK_SYSTEM"],
  MULTI_DAY_TREK: ["SHELTER_SYSTEM", "SLEEP_SYSTEM", "COOK_SYSTEM"]
};

const SEASON_REQUIRED_SYSTEMS: Record<MountainFoundationSeason, readonly PlanningSystem[]> = {
  SPRING: [],
  SUMMER: [],
  AUTUMN: ["COLD_WEATHER_LAYER"],
  WINTER: ["COLD_WEATHER_LAYER"]
};

export function getRequiredSystemsForTrip({
  mountain,
  season,
  style
}: TripRequirementInput): PlanningSystem[] {
  assertSupportedTripContext({
    mountainName: mountain.name_ja,
    season,
    style,
    supportedSeasons: mountain.supported_seasons,
    supportedStyles: mountain.supported_styles
  });

  const styleSystems = getStyleRequiredSystems(mountain, style);
  const safetySystems = [
    ...SEASON_REQUIRED_SYSTEMS[season],
    ...getAttributeRequiredSystems(mountain, season)
  ];
  const contextSystems = new Set<PlanningSystem>([
    ...ALWAYS_REQUIRED_SYSTEMS,
    ...styleSystems,
    ...safetySystems,
    ...getApplicableMountainDefaultSystems(mountain, {
      styleSystems,
      safetySystems
    })
  ]);

  return TRIP_REQUIREMENT_SYSTEM_ORDER.filter((system) => {
    return contextSystems.has(system);
  });
}

function getApplicableMountainDefaultSystems(
  mountain: TripRequirementInput["mountain"],
  {
    styleSystems,
    safetySystems
  }: {
    styleSystems: readonly PlanningSystem[];
    safetySystems: readonly PlanningSystem[];
  }
) {
  const styleSystemSet = new Set(styleSystems);
  const safetySystemSet = new Set(safetySystems);

  return mountain.typical_required_systems.filter((system) => {
    if (system === "SHELTER_SYSTEM" || system === "SLEEP_SYSTEM" || system === "COOK_SYSTEM") {
      return styleSystemSet.has(system);
    }

    if (system === "COLD_WEATHER_LAYER" || system === "TECHNICAL_SAFETY_SYSTEM") {
      return safetySystemSet.has(system);
    }

    return true;
  });
}

function getStyleRequiredSystems(
  mountain: TripRequirementInput["mountain"],
  style: MountainFoundationStyle
): readonly PlanningSystem[] {
  if (style !== "OVERNIGHT_HUT") {
    return STYLE_REQUIRED_SYSTEMS[style];
  }

  return [
    ...STYLE_REQUIRED_SYSTEMS.OVERNIGHT_HUT,
    ...(requiresHutSleepInsulation(mountain) ? ["SLEEP_SYSTEM" as const] : []),
    ...(requiresHutCooking(mountain) ? ["COOK_SYSTEM" as const] : [])
  ];
}

function getAttributeRequiredSystems(
  mountain: TripRequirementInput["mountain"],
  season: MountainFoundationSeason
) {
  const systems = new Set<PlanningSystem>();

  if (requiresColdWeatherLayer(mountain, season)) {
    systems.add("COLD_WEATHER_LAYER");
  }

  if (requiresTechnicalSafety(mountain, season)) {
    systems.add("TECHNICAL_SAFETY_SYSTEM");
  }

  return systems;
}

function requiresHutSleepInsulation(mountain: TripRequirementInput["mountain"]) {
  return !["FULL_SERVICE", "BEDDING_ONLY"].includes(
    mountain.hut_support ?? "BASIC_NO_BEDDING"
  );
}

function requiresHutCooking(mountain: TripRequirementInput["mountain"]) {
  return false;
}

function requiresColdWeatherLayer(
  mountain: TripRequirementInput["mountain"],
  season: MountainFoundationSeason
) {
  if (season === "AUTUMN" || season === "WINTER") {
    return true;
  }

  if (mountain.route_seriousness === "EXTREME") {
    return true;
  }

  if (["ABOVE_TREELINE", "HIGH_ALPINE_EXPOSED"].includes(mountain.alpine_environment ?? "")) {
    return true;
  }

  return ["LIKELY", "WINTER_ALPINE"].includes(mountain.snow_or_ice_risk ?? "");
}

function requiresTechnicalSafety(
  mountain: TripRequirementInput["mountain"],
  season: MountainFoundationSeason
) {
  if (mountain.helmet_guidance === "RECOMMENDED" || mountain.helmet_guidance === "REQUIRED") {
    return true;
  }

  if (["CHAIN_LADDER", "EXPOSED_SCRAMBLE"].includes(mountain.technical_terrain ?? "")) {
    return true;
  }

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

function assertSupportedTripContext({
  mountainName,
  season,
  style,
  supportedSeasons,
  supportedStyles
}: {
  mountainName: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  supportedSeasons: readonly MountainFoundationSeason[];
  supportedStyles: readonly MountainFoundationStyle[];
}) {
  if (!supportedSeasons.includes(season)) {
    throw new Error(`Season ${season} is not supported for ${mountainName}.`);
  }

  if (!supportedStyles.includes(style)) {
    throw new Error(`Style ${style} is not supported for ${mountainName}.`);
  }
}
