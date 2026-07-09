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
    focus?: string;
    error?: string;
  }>;
};

const restrictedVolcanoPlanningMessage =
  "この山は現在、火山活動または入山規制により通常の登山計画を作成できません。気象庁・自治体などの公式情報を確認してください。";
const nonStandardRoutePlanningMessage =
  "この山は通常の装備計画を作成する前に、登山道状況・入山可否・山行形態を公式情報で確認してください。";

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
  const requestedMountain = getRequestedMountain(hydratedMountainParam, mountains);
  const planningBlockMessage = getPlanningBlockMessage(requestedMountain);
  const selectedMountainSlug = getSelectedMountainSlug(
    planningBlockMessage ? undefined : hydratedMountainParam,
    mountains
  );
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

  if (planningBlockMessage) {
    error = planningBlockMessage;
  } else if (shouldGeneratePlan && selectedMountain) {
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

function getPlanningBlockMessage(
  mountain: MountainFoundationProfile | null | undefined
) {
  if (mountain?.volcanic_risk === "ACTIVE_RESTRICTED") {
    return restrictedVolcanoPlanningMessage;
  }

  if (mountain?.planning_status === "NOT_STANDARD_ROUTE") {
    return nonStandardRoutePlanningMessage;
  }

  return null;
}

function isPlanningBlockedMountain(
  mountain: MountainFoundationProfile | null | undefined
) {
  return Boolean(getPlanningBlockMessage(mountain));
}

function getRequestedMountain(
  slug: string | undefined,
  mountains: readonly MountainFoundationProfile[]
) {
  if (!slug) {
    return null;
  }

  return mountains.find((mountain) => mountain.slug === slug) ?? null;
}

function getSelectedMountainSlug(
  slug: string | undefined,
  mountains: readonly MountainFoundationProfile[]
) {
  if (
    slug &&
    mountains.some(
      (mountain) => mountain.slug === slug && !isPlanningBlockedMountain(mountain)
    )
  ) {
    return slug;
  }

  if (
    mountains.some(
      (mountain) => mountain.slug === "takao-san" && !isPlanningBlockedMountain(mountain)
    )
  ) {
    return "takao-san";
  }

  return mountains.find((mountain) => !isPlanningBlockedMountain(mountain))?.slug ?? "";
}

function getSelectedMountain(
  slug: string,
  mountains: readonly MountainFoundationProfile[]
) {
  return (
    mountains.find(
      (mountain) => mountain.slug === slug && !isPlanningBlockedMountain(mountain)
    ) ??
    mountains.find((mountain) => !isPlanningBlockedMountain(mountain)) ??
    null
  );
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
