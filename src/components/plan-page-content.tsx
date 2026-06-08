import { TripPlanningUI } from "@/components/trip-planning-ui";
import { getGearProducts, requireUser } from "@/lib/data/gear";
import { getMountainFoundationProfiles } from "@/lib/data/mountain-foundation";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getRecommendationHistory } from "@/lib/data/recommendations";
import { getTripPlans } from "@/lib/data/trip-plans";
import { matchGearForRequirementSlot } from "@/lib/gear-matching/engine";
import { getMountainImageUrl } from "@/lib/mountains/images";
import type {
  GearMatchingResult,
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle,
  RequirementSlot
} from "@/lib/types";

export type PlanPageContentProps = {
  searchParams: Promise<{
    mountain?: string;
    season?: string;
    style?: string;
    error?: string;
  }>;
};

export async function PlanPageContent({ searchParams }: PlanPageContentProps) {
  const params = await searchParams;
  await requireUser();

  let error = params.error;
  let mountains: MountainFoundationProfile[] = [];

  try {
    mountains = await getMountainFoundationProfiles();
  } catch (caught) {
    error =
      caught instanceof Error
        ? caught.message
        : "Mountain Foundation Dataset を読み込めませんでした。";
  }

  const selectedMountainSlug = getSelectedMountainSlug(params.mountain, mountains);
  const selectedMountain = getSelectedMountain(selectedMountainSlug, mountains);
  const selectedSeason = getSelectedSeason(params.season, selectedMountain);
  const selectedStyle = getSelectedStyle(params.style, selectedMountain);
  const shouldGeneratePlan = Boolean(params.mountain || params.season || params.style);
  let plan;
  const planHistory = await getRecommendationHistory();
  const savedPlans = await getTripPlans();
  let compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>> = {};

  if (shouldGeneratePlan && mountains.length > 0) {
    try {
      plan = await getPackRequirementPlan({
        mountainSlug: selectedMountainSlug,
        season: selectedSeason,
        style: selectedStyle
      });

      const databaseGear = await getGearProducts();
      compatibilityBySlot = Object.fromEntries(
        plan.required_slots.map((slotPlan) => {
          const match = matchGearForRequirementSlot({
            slot: slotPlan.slot,
            databaseGear
          });

          return [
            slotPlan.slot,
            {
              ...match,
              matching_owned_gear: slotPlan.matching_owned_gear
            }
          ];
        })
      );
    } catch (caught) {
      error =
        caught instanceof Error
          ? caught.message
          : "この山行条件では計画を作成できませんでした。";
    }
  }

  return (
    <TripPlanningUI
      mountains={mountains}
      selectedMountainSlug={selectedMountainSlug}
      selectedSeason={selectedSeason}
      selectedStyle={selectedStyle}
      plan={plan}
      compatibilityBySlot={compatibilityBySlot}
      planHistory={planHistory}
      savedPlans={savedPlans}
      selectedMountainImageUrl={getMountainImageUrl(selectedMountainSlug)}
      error={error}
    />
  );
}

function getSelectedMountainSlug(
  slug: string | undefined,
  mountains: Array<{ slug: string }>
) {
  if (slug && mountains.some((mountain) => mountain.slug === slug)) {
    return slug;
  }

  if (mountains.some((mountain) => mountain.slug === "takao-san")) {
    return "takao-san";
  }

  return mountains[0]?.slug ?? "";
}

function getSelectedMountain(
  slug: string,
  mountains: readonly MountainFoundationProfile[]
) {
  return mountains.find((mountain) => mountain.slug === slug) ?? mountains[0] ?? null;
}

function getSelectedSeason(
  value: string | undefined,
  mountain: MountainFoundationProfile | null
) {
  const season = parseSeason(value);

  if (season && mountain?.supported_seasons.includes(season)) {
    return season;
  }

  if (mountain?.supported_seasons.includes("SUMMER")) {
    return "SUMMER";
  }

  return mountain?.supported_seasons[0] ?? "SUMMER";
}

function getSelectedStyle(
  value: string | undefined,
  mountain: MountainFoundationProfile | null
) {
  const style = parseStyle(value);

  if (style && mountain?.supported_styles.includes(style)) {
    return style;
  }

  if (mountain?.supported_styles.includes("DAY_HIKE")) {
    return "DAY_HIKE";
  }

  return mountain?.supported_styles[0] ?? "DAY_HIKE";
}

function parseSeason(value: string | undefined): MountainFoundationSeason | null {
  if (
    value === "SPRING" ||
    value === "SUMMER" ||
    value === "AUTUMN" ||
    value === "WINTER"
  ) {
    return value;
  }

  return null;
}

function parseStyle(value: string | undefined): MountainFoundationStyle | null {
  if (
    value === "DAY_HIKE" ||
    value === "OVERNIGHT_HUT" ||
    value === "OVERNIGHT_TENT" ||
    value === "MULTI_DAY_TREK"
  ) {
    return value;
  }

  return null;
}
