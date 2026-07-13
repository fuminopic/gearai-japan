import { TripPlanningUI } from "@/components/trip-planning-ui";
import { Notice } from "@/components/ui/notice";
import { getGearProducts, getOwnedGearForPlanning, requireUser } from "@/lib/data/gear";
import { getMountainCurrentPlanStatuses } from "@/lib/data/mountain-current-plan-status";
import { getMountainFoundationProfiles } from "@/lib/data/mountain-foundation";
import { getPackRequirementPlan } from "@/lib/data/pack-requirements";
import { getRecommendationHistory } from "@/lib/data/recommendations";
import { getTripPlans } from "@/lib/data/trip-plans";
import { matchGearForRequirementSlot } from "@/lib/gear-matching/engine";
import {
  getMountainPlanningBlockMessage,
  isMountainCurrentPlanStatusBlocked,
  mountainCurrentPlanStatusStaleMessage,
  resolveMountainPlanAccess
} from "@/lib/mountain-current-plan-status";
import type {
  GearMatchingResult,
  MountainCurrentPlanStatus,
  MountainCurrentPlanStatusBySlug,
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

export async function PlanPageContent({ searchParams }: PlanPageContentProps) {
  const params = await searchParams;
  await requireUser();

  let error = params.error;
  let mountains: MountainFoundationProfile[] = [];
  let currentPlanStatuses: MountainCurrentPlanStatusBySlug = {};
  let currentPlanStatusReadFailed = false;
  const [mountainResult, currentPlanStatusResult, planHistory, savedPlans] = await Promise.all([
    getMountainFoundationProfiles()
      .then((data) => ({ data, error: null }))
      .catch((caught: unknown) => ({ data: [], error: caught })),
    getMountainCurrentPlanStatuses()
      .then((data) => ({ data, error: null }))
      .catch((caught: unknown) => ({ data: {}, error: caught })),
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

  if (currentPlanStatusResult.error) {
    currentPlanStatusReadFailed = true;
    error = "現在の山岳安全情報を確認できないため、計画を作成できませんでした。";
  } else {
    currentPlanStatuses = currentPlanStatusResult.data;
  }

  const selectedSavedPlan =
    params.id && savedPlans.length > 0
      ? savedPlans.find((record) => record.id === params.id) ?? null
      : null;
  const hydratedMountainParam = params.mountain ?? selectedSavedPlan?.mountain_slug ?? undefined;
  const hydratedSeasonParam = params.season ?? selectedSavedPlan?.season;
  const hydratedStyleParam = params.style ?? selectedSavedPlan?.style;
  const requestedMountain = getRequestedMountain(hydratedMountainParam, mountains);
  const requestedCurrentPlanStatus = requestedMountain
    ? currentPlanStatuses[requestedMountain.slug]
    : undefined;
  const requestedPlanAccess = resolveMountainPlanAccess({
    mountain: requestedMountain,
    currentPlanStatus: requestedCurrentPlanStatus,
    currentPlanStatusReadFailed
  });
  const planningBlockMessage = requestedPlanAccess.planningBlockMessage;
  const selectedMountainSlug = getSelectedMountainSlug(
    planningBlockMessage ? undefined : hydratedMountainParam,
    mountains,
    currentPlanStatuses
  );
  const selectedMountain = getSelectedMountain(
    selectedMountainSlug,
    mountains,
    currentPlanStatuses
  );
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
    if (!isMountainCurrentPlanStatusBlocked(requestedCurrentPlanStatus)) {
      error = planningBlockMessage;
    }
  } else if (!requestedPlanAccess.isGenerationBlocked && shouldGeneratePlan && selectedMountain) {
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

  const planStatusNotice = requestedCurrentPlanStatus ?? currentPlanStatuses[selectedMountainSlug];
  const blockedMountainSlugs = Object.entries(currentPlanStatuses)
    .filter(([, status]) => status.status === "BLOCKED")
    .map(([slug]) => slug);

  return (
    <>
      {planStatusNotice ? <MountainCurrentPlanStatusNotice status={planStatusNotice} /> : null}
      <TripPlanningUI
        mountains={mountains}
        blockedMountainSlugs={blockedMountainSlugs}
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
    </>
  );
}

function isPlanningBlockedMountain(
  mountain: MountainFoundationProfile | null | undefined,
  currentPlanStatuses: MountainCurrentPlanStatusBySlug
) {
  return Boolean(
    getMountainPlanningBlockMessage(
      mountain,
      mountain ? currentPlanStatuses[mountain.slug] : undefined
    )
  );
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
  mountains: readonly MountainFoundationProfile[],
  currentPlanStatuses: MountainCurrentPlanStatusBySlug
) {
  if (
    slug &&
    mountains.some(
      (mountain) =>
        mountain.slug === slug && !isPlanningBlockedMountain(mountain, currentPlanStatuses)
    )
  ) {
    return slug;
  }

  if (
    mountains.some(
      (mountain) =>
        mountain.slug === "takao-san" && !isPlanningBlockedMountain(mountain, currentPlanStatuses)
    )
  ) {
    return "takao-san";
  }

  return (
    mountains.find((mountain) => !isPlanningBlockedMountain(mountain, currentPlanStatuses))?.slug ??
    ""
  );
}

function getSelectedMountain(
  slug: string,
  mountains: readonly MountainFoundationProfile[],
  currentPlanStatuses: MountainCurrentPlanStatusBySlug
) {
  return (
    mountains.find(
      (mountain) =>
        mountain.slug === slug && !isPlanningBlockedMountain(mountain, currentPlanStatuses)
    ) ??
    mountains.find((mountain) => !isPlanningBlockedMountain(mountain, currentPlanStatuses)) ??
    null
  );
}

function MountainCurrentPlanStatusNotice({ status }: { status: MountainCurrentPlanStatus }) {
  return (
    <Notice
      tone={status.status === "BLOCKED" ? "error" : "warning"}
      className={`mb-5 border ${status.status === "BLOCKED" ? "border-red-200" : "border-amber-200"}`}
    >
      <span className="block">{status.messageJa}</span>
      {status.isStale ? (
        <span className="mt-1 block">{mountainCurrentPlanStatusStaleMessage}</span>
      ) : null}
      <a
        href={status.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-1 inline-block underline underline-offset-2"
      >
        公式情報を確認
      </a>
    </Notice>
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
