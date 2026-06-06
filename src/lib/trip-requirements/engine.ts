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
  OVERNIGHT_HUT: ["SHELTER_SYSTEM", "SLEEP_SYSTEM", "COOK_SYSTEM"],
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

  const mountainSystems = new Set(mountain.typical_required_systems);
  const contextSystems = new Set<PlanningSystem>([
    ...ALWAYS_REQUIRED_SYSTEMS,
    ...STYLE_REQUIRED_SYSTEMS[style],
    ...SEASON_REQUIRED_SYSTEMS[season]
  ]);

  return TRIP_REQUIREMENT_SYSTEM_ORDER.filter((system) => {
    return mountainSystems.has(system) && contextSystems.has(system);
  });
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
