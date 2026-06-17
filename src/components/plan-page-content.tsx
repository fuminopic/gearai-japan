import { TripPlanningUI } from "@/components/trip-planning-ui";
import { getGearProducts, getOwnedGearForPlanning, requireUser } from "@/lib/data/gear";
import { getMountainFoundationProfiles } from "@/lib/data/mountain-foundation";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getRecommendationHistory } from "@/lib/data/recommendations";
import { getTripPlans } from "@/lib/data/trip-plans";
import { matchGearForRequirementSlot } from "@/lib/gear-matching/engine";
import type {
  GearMatchingResult,
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle,
  RequirementSlot,
  UserGear
} from "@/lib/types";

export type PlanPageContentProps = {
  searchParams: Promise<{
    id?: string;
    mountain?: string;
    season?: string;
    style?: string;
    date?: string;
    memo?: string;
    cash?: string;
    insurance?: string;
    error?: string;
  }>;
};

export async function PlanPageContent({ searchParams }: PlanPageContentProps) {
  const params = await searchParams;
  await requireUser();

  let error = params.error;
  let mountains: MountainFoundationProfile[] = [];
  const [mountainResult, planHistory, savedPlans] = await Promise.all([
    getMountainFoundationProfiles()
      .then((data) => ({ data, error: null }))
      .catch((caught: unknown) => ({ data: [], error: caught })),
    getRecommendationHistory(),
    getTripPlans()
  ]);

  if (mountainResult.error) {
    error =
      mountainResult.error instanceof Error
        ? mountainResult.error.message
        : "Mountain Foundation Dataset を読み込めませんでした。";
  } else {
    mountains = mountainResult.data;
  }

  const selectedSavedPlan =
    params.id && savedPlans.length > 0
      ? savedPlans.find((record) => record.id === params.id) ?? null
      : null;
  const hydratedMountainParam = params.mountain ?? selectedSavedPlan?.mountain_slug ?? undefined;
  const hydratedSeasonParam = params.season ?? selectedSavedPlan?.season;
  const hydratedStyleParam = params.style ?? selectedSavedPlan?.style;
  const selectedMountainSlug = getSelectedMountainSlug(hydratedMountainParam, mountains);
  const selectedMountain = getSelectedMountain(selectedMountainSlug, mountains);
  const selectedSeason = getSelectedSeason(hydratedSeasonParam, selectedMountain);
  const selectedStyle = getSelectedStyle(hydratedStyleParam, selectedMountain);
  const shouldGeneratePlan = Boolean(
    params.mountain ||
      params.season ||
      params.style ||
      selectedSavedPlan
  );
  let plan;
  let compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>> = {};
  let ownedGear: UserGear[] = [];

  if (shouldGeneratePlan && mountains.length > 0) {
    try {
      const [generatedPlan, databaseGear, planningOwnedGear] = await Promise.all([
        getPackRequirementPlan({
          mountainSlug: selectedMountainSlug,
          season: selectedSeason,
          style: selectedStyle
        }),
        getGearProducts(),
        getOwnedGearForPlanning()
      ]);

      plan = generatedPlan;
      ownedGear = planningOwnedGear;
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
      ownedGear={ownedGear}
      compatibilityBySlot={compatibilityBySlot}
      planHistory={planHistory}
      savedPlans={savedPlans}
      selectedPlanId={params.id ?? null}
      selectedSavedPlan={selectedSavedPlan}
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
