"use client";

import {
  Axe,
  Backpack,
  Battery,
  Bean,
  Bed,
  Bell,
  BriefcaseMedical,
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  CloudRain,
  Compass,
  Cookie,
  CookingPot,
  Droplets,
  Footprints,
  Glasses,
  Hammer,
  Hand,
  HardHat,
  House,
  IdCard,
  Lamp,
  Map as MapIcon,
  Mountain,
  Navigation,
  Pencil,
  PlugZap,
  Shirt,
  ShieldAlert,
  Snowflake,
  Soup,
  Sparkles,
  Tent,
  Trash2,
  Toilet,
  Utensils,
  Volume2,
  Zap,
  type LucideIcon
} from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import { TripPlanningForm } from "@/components/trip-planning-form";
import { PlanFoodWaterSettings } from "@/components/plan-food-water-settings";
import { ConfirmSubmitButton } from "@/components/ui/confirm-dialog";
import {
  captureAnalyticsEvent,
  captureAnalyticsEventOnce,
  getAnalyticsPlatform
} from "@/lib/analytics";
import {
  clearTripPlans,
  deleteTripPlan,
  saveTripPlan,
  updateTripPlan
} from "@/lib/actions/trip-plans";
import {
  mountainFoundationSeasonLabels,
  mountainFoundationStyleLabels,
  requirementSlotLabels
} from "@/lib/i18n/labels";
import { mountainCurrentPlanStatusStaleMessage } from "@/lib/mountain-current-plan-status";
import {
  getPlanFoodWater,
  type PlanFoodWater
} from "@/lib/plan-food-water";
import {
  buildPlanChecklist,
  buildPlanNotNeededItems,
  buildPreDepartureSummary,
  calculateChecklistProgress,
  checklistPriorityLabels,
  filterCheckedSlotsForPlan,
  getPreDepartureItemActionStatus,
  isImportantPreDepartureItem,
  isSupportedChecklistOnlyId,
  isSupportedRequirementSlot,
  type ChecklistCategory,
  type ChecklistView,
  type ChecklistItemIcon,
  type ChecklistItem,
  type PlanNotNeededItem,
  type PreDepartureSummary
} from "@/lib/plan-checklist";
import { createClient } from "@/lib/supabase/client";
import {
  readTripPlanLocalMeta,
  writeTripPlanLocalMeta
} from "@/lib/trip-plan-local-meta";
import {
  readTripPlanCheckedSlots,
  readTripPlanChecklistOnlyIds,
  readTripPlanUncheckedPackedSlots,
  removeTripPlanCheckedSlots,
  removeTripPlanChecklistOnlyIds,
  writeTripPlanCheckedSlots,
  writeTripPlanChecklistOnlyIds,
  writeTripPlanUncheckedPackedSlots
} from "@/lib/trip-plan-storage";
import type {
  GearMatchingOwnedGearMatch,
  GearMatchingResult,
  AIRecommendationRecord,
  MountainCurrentPlanStatus,
  MountainFoundationProfile,
  MountainFoundationSeason,
  MountainFoundationStyle,
  PackRequirementPlan,
  PackRequirementSlotPlan,
  RequirementSlot,
  SavedTripPlan,
  UserGear
} from "@/lib/types";

type TripPlanningUIProps = {
  mountains: MountainFoundationProfile[];
  blockedMountainSlugs?: string[];
  selectedMountainSlug: string;
  selectedSeason: MountainFoundationSeason;
  selectedStyle: MountainFoundationStyle;
  planStatusNotice?: MountainCurrentPlanStatus;
  plan?: PackRequirementPlan;
  ownedGear?: UserGear[];
  packGearIds?: string[];
  compatibilityBySlot?: Partial<Record<RequirementSlot, GearMatchingResult>>;
  planHistory?: AIRecommendationRecord[];
  savedPlans?: SavedTripPlan[];
  selectedSavedPlan?: SavedTripPlan | null;
  error?: string;
};

type DisplayRequirementSlotPlan = PackRequirementSlotPlan & {
  displayKey: string;
  slots: RequirementSlot[];
  missingSlots: RequirementSlot[];
};

type DisplayGearMatchingResult = Omit<GearMatchingResult, "slot"> & {
  slot: RequirementSlot;
};

type ScopedRequirementSlots = {
  scopeKey: string;
  slots: RequirementSlot[] | null;
};

type ScopedChecklistOnlyIds = {
  scopeKey: string;
  ids: string[];
};

const emptyCheckedSlots: RequirementSlot[] = [];
const emptyUncheckedPackedSlots: RequirementSlot[] = [];
const emptyChecklistOnlyIds: string[] = [];
type ChecklistScanFilter = "ACTION" | "MISSING" | "CONFIRM" | "IMPORTANT" | "ALL";

export function TripPlanningUI({
  mountains,
  blockedMountainSlugs = [],
  selectedMountainSlug,
  selectedSeason,
  selectedStyle,
  planStatusNotice,
  plan,
  ownedGear = [],
  packGearIds = [],
  compatibilityBySlot = {},
  planHistory = [],
  savedPlans = [],
  selectedSavedPlan,
  error
}: TripPlanningUIProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startDateTransition] = useTransition();
  // The URL is the canonical plan scope. During client navigation the previous
  // Server Component props can remain available for one render, so never use
  // them as a fallback for a missing query id.
  const planId = searchParams.get("id");
  const planView = searchParams.get("view");
  const shouldFocusChecklist = searchParams.get("focus") === "checklist";
  const shouldFocusPreDeparture = searchParams.get("focus") === "predeparture";
  const resultSectionRef = useRef<HTMLDivElement>(null);
  const generatedPlanKeyRef = useRef<string | null>(null);
  const initialSavedPlan = planId
    ? selectedSavedPlan?.id === planId
      ? selectedSavedPlan
      : savedPlans.find((record) => record.id === planId) ?? null
    : null;
  const [hydratedPlan, setHydratedPlan] = useState<SavedTripPlan | null>(
    initialSavedPlan
  );
  const [, setInteractiveProgress] = useState<number | null>(null);
  const [interactiveCheckedSlots, setInteractiveCheckedSlots] = useState<
    ScopedRequirementSlots | null
  >(null);
  const [interactiveUncheckedPackedSlots, setInteractiveUncheckedPackedSlots] =
    useState<ScopedRequirementSlots | null>(null);
  const [interactiveChecklistOnlyIds, setInteractiveChecklistOnlyIds] = useState<
    ScopedChecklistOnlyIds | null
  >(null);
  const [storedCheckedSlots, setStoredCheckedSlots] = useState<
    ScopedRequirementSlots | null
  >(null);
  const [storedUncheckedPackedSlots, setStoredUncheckedPackedSlots] = useState<
    ScopedRequirementSlots | null
  >(null);
  const [storedChecklistOnlyIds, setStoredChecklistOnlyIds] = useState<
    ScopedChecklistOnlyIds | null
  >(null);
  const [isDateEditorOpen, setIsDateEditorOpen] = useState(false);
  const [dateSaveState, setDateSaveState] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [isPreparationComplete, setIsPreparationComplete] = useState(false);
  const activeSavedPlan =
    hydratedPlan?.id === planId ? hydratedPlan : initialSavedPlan;
  const currentPlanUserId = activeSavedPlan?.user_id ?? null;
  const effectiveMountainSlug = activeSavedPlan?.mountain_slug ?? selectedMountainSlug;
  const effectiveSeason = activeSavedPlan?.season ?? selectedSeason;
  const effectiveStyle = activeSavedPlan?.style ?? selectedStyle;
  const localPlanMeta = planId
    ? readTripPlanLocalMeta(planId, { userId: currentPlanUserId })
    : null;
  const resolvedPlannedDate = planId
    ? activeSavedPlan?.planned_date ??
      sanitizeDateParam(searchParams.get("date")) ??
      localPlanMeta?.plannedDate ??
      ""
    : sanitizeDateParam(searchParams.get("date")) ?? "";
  const resolvedPlannedEndDate = normalizePlanEndDate(
    resolvedPlannedDate,
    planId
      ? activeSavedPlan?.planned_end_date ??
          sanitizeDateParam(searchParams.get("end_date")) ??
          localPlanMeta?.plannedEndDate ??
          ""
      : sanitizeDateParam(searchParams.get("end_date")) ?? "",
    effectiveStyle
  );
  const resolvedTripMemo =
    sanitizeMemoParam(searchParams.get("memo")) ?? activeSavedPlan?.trip_memo ?? "";
  const resolvedBringCash =
    parseBooleanParam(searchParams.get("cash")) ?? activeSavedPlan?.bring_cash ?? false;
  const resolvedHasMountainInsurance =
    parseBooleanParam(searchParams.get("insurance")) ??
    activeSavedPlan?.has_mountain_insurance ??
    false;
  const [planDetailsDraft, setPlanDetailsDraft] = useState({
    plannedDate: resolvedPlannedDate,
    plannedEndDate: resolvedPlannedEndDate,
    tripMemo: resolvedTripMemo,
    bringCash: resolvedBringCash,
    hasMountainInsurance: resolvedHasMountainInsurance
  });
  const savedFoodWater = useMemo(
    () => getPlanFoodWater(activeSavedPlan),
    [activeSavedPlan]
  );
  const [foodWaterDraft, setFoodWaterDraft] = useState<PlanFoodWater>(savedFoodWater);
  const selectedMountain =
    mountains.find((mountain) => mountain.slug === effectiveMountainSlug) ?? null;
  const planStateKey = plan
    ? `${plan.mountain.slug}:${plan.season}:${plan.style}`
    : "no-plan";
  const storedUncheckedPackedSlotsScopeKey = planId ? `saved:${planId}` : null;
  const uncheckedPackedSlotsScopeKey = planId
    ? `saved:${planId}:${planStateKey}`
    : `draft:${planStateKey}`;
  const savedCheckedSlots = getSavedPlanCheckedSlots(activeSavedPlan);
  const savedUncheckedPackedSlots = getSavedPlanUncheckedPackedSlots(activeSavedPlan);
  const storedCheckedSlotsForCurrentPlan =
    storedCheckedSlots?.scopeKey === storedUncheckedPackedSlotsScopeKey
      ? storedCheckedSlots.slots
      : null;
  const interactiveCheckedSlotsForCurrentPlan =
    interactiveCheckedSlots?.scopeKey === uncheckedPackedSlotsScopeKey
      ? interactiveCheckedSlots.slots
      : null;
  const restoredCheckedSlots = planId
    ? storedCheckedSlotsForCurrentPlan ?? savedCheckedSlots ?? []
    : [];
  const rawCurrentCheckedSlots =
    interactiveCheckedSlotsForCurrentPlan ?? restoredCheckedSlots;
  const currentCheckedSlots = plan
    ? filterCheckedSlotsForPlan(rawCurrentCheckedSlots, plan)
    : rawCurrentCheckedSlots;
  const storedUncheckedPackedSlotsForCurrentPlan =
    storedUncheckedPackedSlots?.scopeKey === storedUncheckedPackedSlotsScopeKey
      ? storedUncheckedPackedSlots.slots
      : null;
  const interactiveUncheckedPackedSlotsForCurrentPlan =
    interactiveUncheckedPackedSlots?.scopeKey === uncheckedPackedSlotsScopeKey
      ? interactiveUncheckedPackedSlots.slots
      : null;
  const restoredUncheckedPackedSlots = planId
    ? storedUncheckedPackedSlotsForCurrentPlan ?? savedUncheckedPackedSlots ?? []
    : [];
  const rawCurrentUncheckedPackedSlots =
    interactiveUncheckedPackedSlotsForCurrentPlan ?? restoredUncheckedPackedSlots;
  const currentUncheckedPackedSlots = plan
    ? filterCheckedSlotsForPlan(rawCurrentUncheckedPackedSlots, plan)
    : rawCurrentUncheckedPackedSlots;
  const interactiveChecklistOnlyIdsForCurrentPlan =
    interactiveChecklistOnlyIds?.scopeKey === uncheckedPackedSlotsScopeKey
      ? interactiveChecklistOnlyIds.ids
      : null;
  const storedChecklistOnlyIdsForCurrentPlan =
    storedChecklistOnlyIds?.scopeKey === storedUncheckedPackedSlotsScopeKey
      ? storedChecklistOnlyIds.ids
      : null;
  const currentChecklistOnlyIds =
    interactiveChecklistOnlyIdsForCurrentPlan ??
    (planId ? storedChecklistOnlyIdsForCurrentPlan ?? [] : []);
  const currentProgressValue = plan
    ? calculateChecklistProgress(
        plan,
        currentCheckedSlots,
        currentChecklistOnlyIds,
        ownedGear,
        packGearIds,
        currentUncheckedPackedSlots
      )
    : activeSavedPlan?.progress ?? 0;
  const isSavedPlanMode = Boolean(planId && plan);
  const isFullChecklistView = isSavedPlanMode && planView === "checklist";

  useEffect(() => {
    if (!plan || planId) {
      generatedPlanKeyRef.current = null;
      return;
    }

    const generatedPlanKey = `${plan.mountain.slug}:${plan.season}:${plan.style}`;

    if (generatedPlanKeyRef.current === generatedPlanKey) {
      return;
    }

    generatedPlanKeyRef.current = generatedPlanKey;
    captureAnalyticsEvent("plan_generate", {
      season: plan.season,
      style: plan.style,
      platform: getAnalyticsPlatform()
    });
  }, [plan, planId, planStateKey]);

  useEffect(() => {
    setInteractiveProgress(null);
    setInteractiveCheckedSlots(null);
    setInteractiveUncheckedPackedSlots(null);
    setInteractiveChecklistOnlyIds(null);
    setIsPreparationComplete(false);
    setStoredCheckedSlots(
      planId
        ? {
            scopeKey: `saved:${planId}`,
            slots: readStoredCheckedSlots(planId, currentPlanUserId)
          }
        : null
    );
    setStoredUncheckedPackedSlots(
      planId
        ? {
            scopeKey: `saved:${planId}`,
            slots: readStoredUncheckedPackedSlots(planId, currentPlanUserId)
          }
        : null
    );
    setStoredChecklistOnlyIds(
      planId
        ? {
            scopeKey: `saved:${planId}`,
            ids: readStoredChecklistOnlyIds(planId, currentPlanUserId)
          }
        : null
    );
  }, [
    currentPlanUserId,
    planId,
    planStateKey,
    storedUncheckedPackedSlotsScopeKey
  ]);

  useEffect(() => {
    setPlanDetailsDraft({
      plannedDate: resolvedPlannedDate,
      plannedEndDate: resolvedPlannedEndDate,
      tripMemo: resolvedTripMemo,
      bringCash: resolvedBringCash,
      hasMountainInsurance: resolvedHasMountainInsurance
    });
  }, [
    resolvedBringCash,
    resolvedHasMountainInsurance,
    resolvedPlannedEndDate,
    resolvedPlannedDate,
    resolvedTripMemo
  ]);

  useEffect(() => {
    setFoodWaterDraft(savedFoodWater);
  }, [savedFoodWater]);

  useEffect(() => {
    if (!planId) {
      setHydratedPlan(null);
      return;
    }

    let isActive = true;
    const localPlan = savedPlans.find((record) => record.id === planId) ?? null;

    if (localPlan) {
      setHydratedPlan(localPlan);
    }

    async function hydratePlanFromId() {
      const supabase = createClient();
      const { data, error: hydrateError } = await supabase
        .from("trip_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (!isActive) {
        return;
      }

      if (hydrateError) {
        console.error("Plan hydration failed:", hydrateError.message);
        return;
      }

      const nextPlan = data as SavedTripPlan;
      setHydratedPlan(nextPlan);

      if (!nextPlan.mountain_slug) {
        return;
      }

      if (
        nextPlan.mountain_slug !== selectedMountainSlug ||
        nextPlan.season !== selectedSeason ||
        nextPlan.style !== selectedStyle
      ) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("id", nextPlan.id);
        nextParams.set("mountain", nextPlan.mountain_slug);
        nextParams.set("season", nextPlan.season);
        nextParams.set("style", nextPlan.style);
        if (nextPlan.planned_date) {
          nextParams.set("date", nextPlan.planned_date);
        }
        if (nextPlan.planned_end_date) {
          nextParams.set("end_date", nextPlan.planned_end_date);
        }
        if (nextPlan.trip_memo) {
          nextParams.set("memo", nextPlan.trip_memo);
        }
        nextParams.set("cash", nextPlan.bring_cash ? "1" : "0");
        nextParams.set(
          "insurance",
          nextPlan.has_mountain_insurance ? "1" : "0"
        );
        router.replace(`/plan?${nextParams.toString()}`);
      }
    }

    hydratePlanFromId();

    return () => {
      isActive = false;
    };
  }, [
    planId,
    router,
    savedPlans,
    searchParams,
    selectedMountainSlug,
    selectedSeason,
    selectedStyle
  ]);

  useEffect(() => {
    if (!plan || (!shouldFocusChecklist && !shouldFocusPreDeparture)) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      resultSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 80);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [plan, planStateKey, shouldFocusChecklist, shouldFocusPreDeparture]);

  function handleSavedPlanDateChange(nextStartDate: string, nextEndDate: string) {
    const normalizedEndDate = normalizePlanEndDate(
      nextStartDate,
      nextEndDate,
      effectiveStyle
    );

    setPlanDetailsDraft((current) => ({
      ...current,
      plannedDate: nextStartDate,
      plannedEndDate: normalizedEndDate
    }));

    if (!planId || !selectedMountain) {
      return;
    }

    setDateSaveState("saving");

    const formData = new FormData();
    formData.set("id", planId);
    formData.set("mountain_slug", selectedMountain.slug);
    formData.set("mountain_name", selectedMountain.name_ja);
    formData.set("season", effectiveSeason);
    formData.set("style", effectiveStyle);
    formData.set("planned_date", nextStartDate);
    if (normalizedEndDate) {
      formData.set("planned_end_date", normalizedEndDate);
    }
    formData.set("trip_memo", planDetailsDraft.tripMemo);
    formData.set("bring_cash", planDetailsDraft.bringCash ? "1" : "0");
    formData.set(
      "has_mountain_insurance",
      planDetailsDraft.hasMountainInsurance ? "1" : "0"
    );
    formData.set("water_volume_ml", String(foodWaterDraft.waterVolumeMl));
    formData.set(
      "trail_food_included",
      foodWaterDraft.trailFoodIncluded ? "1" : "0"
    );
    formData.set("trail_food_weight_g", String(foodWaterDraft.trailFoodWeightG));
    formData.set("meal_count", String(foodWaterDraft.mealCount));
    formData.set("meal_weight_g", String(foodWaterDraft.mealWeightG));
    formData.set("progress", String(currentProgressValue));
    formData.set("checked_slots", JSON.stringify(currentCheckedSlots));
    formData.set(
      "unchecked_packed_slots",
      JSON.stringify(currentUncheckedPackedSlots)
    );

    startDateTransition(async () => {
      try {
        const result = await updateTripPlan(formData);
        const updatedPlanId = result?.id ?? planId;

        writeTripPlanLocalMeta(updatedPlanId, {
          plannedDate: nextStartDate,
          plannedEndDate: normalizedEndDate,
          tripMemo: planDetailsDraft.tripMemo
        }, { userId: currentPlanUserId });
        setHydratedPlan((current) =>
          current
            ? {
                ...current,
                planned_date: nextStartDate || null,
                planned_end_date: normalizedEndDate || null
              }
            : current
        );
        setDateSaveState("success");
        router.refresh();
      } catch (saveError) {
        console.error("Plan date update failed:", saveError);
        setDateSaveState("error");
      }
    });
  }

  return (
    <div className={`space-y-[11px] ${plan ? "pb-12" : ""}`}>
      {isSavedPlanMode && plan && !isFullChecklistView ? (
        <SavedPlanDetailHeader
          plan={plan}
          plannedDate={planDetailsDraft.plannedDate}
          plannedEndDate={planDetailsDraft.plannedEndDate}
          isEditorOpen={isDateEditorOpen}
          saveState={dateSaveState}
          onToggleEditor={() => setIsDateEditorOpen((isOpen) => !isOpen)}
          onDateChange={handleSavedPlanDateChange}
        />
      ) : null}

      {!plan && !isSavedPlanMode && !isFullChecklistView ? (
        <TripPlanningForm
          mountains={mountains}
          blockedMountainSlugs={blockedMountainSlugs}
          selectedMountainSlug={effectiveMountainSlug}
          selectedSeason={effectiveSeason}
          selectedStyle={effectiveStyle}
          selectedPlannedDate={planDetailsDraft.plannedDate}
          selectedPlannedEndDate={planDetailsDraft.plannedEndDate}
          selectedTripMemo={planDetailsDraft.tripMemo}
          onPlanDetailsChange={(details) =>
            setPlanDetailsDraft((current) => ({ ...current, ...details }))
          }
          planId={planId}
          error={error}
        />
      ) : null}

      {plan ? (
        isFullChecklistView && planId ? (
          <SavedPlanFullChecklistView
            plan={plan}
            plannedDate={planDetailsDraft.plannedDate}
            plannedEndDate={planDetailsDraft.plannedEndDate}
            checkedSlots={currentCheckedSlots}
            uncheckedPackedSlots={currentUncheckedPackedSlots}
            checklistOnlyIds={currentChecklistOnlyIds}
            ownedGear={ownedGear}
            packGearIds={packGearIds}
            planId={planId}
          />
        ) : (
        <>
          {!isSavedPlanMode ? (
            <PlanResultSummaryHeader
              plan={plan}
              plannedDate={planDetailsDraft.plannedDate}
              plannedEndDate={planDetailsDraft.plannedEndDate}
            />
          ) : null}
          <div ref={resultSectionRef} className="scroll-mt-24">
            {planStatusNotice ? (
              <MountainCurrentPlanStatusNotice status={planStatusNotice} />
            ) : null}
            <PlanFoodWaterSettings
              value={foodWaterDraft}
              onChange={setFoodWaterDraft}
            />
            <TripPlanningResult
              key={uncheckedPackedSlotsScopeKey}
              plan={plan}
              compatibilityBySlot={compatibilityBySlot}
              ownedGear={ownedGear}
              packGearIds={packGearIds}
              plannedDate={planDetailsDraft.plannedDate}
              plannedEndDate={planDetailsDraft.plannedEndDate}
              isSavedPlanDetail={isSavedPlanMode}
              initialCheckedSlots={currentCheckedSlots}
              initialUncheckedPackedSlots={currentUncheckedPackedSlots}
              initialChecklistOnlyIds={currentChecklistOnlyIds}
              onProgressChange={setInteractiveProgress}
              onPreparationCompletionChange={setIsPreparationComplete}
              onCheckedSlotsChange={(slots) =>
                setInteractiveCheckedSlots({
                  scopeKey: uncheckedPackedSlotsScopeKey,
                  slots
                })
              }
              onUncheckedPackedSlotsChange={(slots) =>
                setInteractiveUncheckedPackedSlots({
                  scopeKey: uncheckedPackedSlotsScopeKey,
                  slots
                })
              }
              onChecklistOnlyIdsChange={(ids) =>
                setInteractiveChecklistOnlyIds({
                  scopeKey: uncheckedPackedSlotsScopeKey,
                  ids
                })
              }
              planId={planId}
              userId={currentPlanUserId}
            />
          </div>
          {selectedMountain ? (
            <SavePlanButton
              mountainSlug={selectedMountain.slug}
              mountainName={selectedMountain.name_ja}
              season={effectiveSeason}
              style={effectiveStyle}
              plannedDate={planDetailsDraft.plannedDate}
              plannedEndDate={planDetailsDraft.plannedEndDate}
              tripMemo={planDetailsDraft.tripMemo}
              bringCash={planDetailsDraft.bringCash}
              hasMountainInsurance={planDetailsDraft.hasMountainInsurance}
              foodWater={foodWaterDraft}
              progress={currentProgressValue}
              checkedSlots={currentCheckedSlots}
              uncheckedPackedSlots={currentUncheckedPackedSlots}
              checklistOnlyIds={currentChecklistOnlyIds}
              isPreparationComplete={isPreparationComplete}
              planId={planId}
              userId={currentPlanUserId}
            />
          ) : null}
        </>
        )
      ) : null}

      {!isFullChecklistView ? (
        <PlanHistorySection plans={savedPlans} legacyPlans={planHistory} />
      ) : null}
    </div>
  );
}

function MountainCurrentPlanStatusNotice({ status }: { status: MountainCurrentPlanStatus }) {
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 text-sm font-medium ${
        status.status === "BLOCKED"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-amber-200 bg-amber-50 text-amber-800"
      }`}
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
    </div>
  );
}

function PlanResultSummaryHeader({
  plan,
  plannedDate,
  plannedEndDate
}: {
  plan: PackRequirementPlan;
  plannedDate: string;
  plannedEndDate: string;
}) {
  return (
    <section className="rounded-[20px] bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
          <Mountain className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold tracking-normal text-ink">
            {plan.mountain.name_ja}
          </h1>
          <p className="mt-1 truncate text-xs font-semibold text-stone-500">
            {mountainFoundationSeasonLabels[plan.season]} / {mountainFoundationStyleLabels[plan.style]}
            {" ・ "}
            {formatPlanDateRange(plannedDate, plannedEndDate, plan.style)}
          </p>
        </div>
      </div>
    </section>
  );
}

function SavedPlanDetailHeader({
  plan,
  plannedDate,
  plannedEndDate,
  isEditorOpen,
  saveState,
  onToggleEditor,
  onDateChange
}: {
  plan: PackRequirementPlan;
  plannedDate: string;
  plannedEndDate: string;
  isEditorOpen: boolean;
  saveState: "idle" | "saving" | "success" | "error";
  onToggleEditor: () => void;
  onDateChange: (startDate: string, endDate: string) => void;
}) {
  const usesDateRange = isOvernightPlanStyle(plan.style);
  const displayDate = formatPlanDateRange(plannedDate, plannedEndDate, plan.style);
  const startInputValue = plannedDate || getTodayDateValue();
  const endInputValue = normalizePlanEndDate(
    startInputValue,
    plannedEndDate || startInputValue,
    plan.style
  );
  const saveStateLabel =
    saveState === "saving"
      ? "保存中..."
      : saveState === "success"
        ? "保存しました"
        : saveState === "error"
          ? "保存できませんでした"
          : null;

  return (
    <section className="rounded-[20px] bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[#14724e]">
          <Mountain className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold tracking-normal text-ink">
            {plan.mountain.name_ja}
          </h1>
          <button
            type="button"
            onClick={onToggleEditor}
            className="mt-1 block max-w-full truncate text-left text-xs font-semibold text-stone-500"
            aria-expanded={isEditorOpen}
          >
            {mountainFoundationSeasonLabels[plan.season]} / {mountainFoundationStyleLabels[plan.style]}
            {" ・ "}
            {displayDate}
          </button>
        </div>
        <button
          type="button"
          onClick={onToggleEditor}
          className={`inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 text-[11px] font-bold transition active:scale-95 ${
            isEditorOpen
              ? "border-forest-200 bg-forest-50 text-forest-800"
              : "border-forest-100 bg-white text-[#14724e]"
          }`}
          aria-expanded={isEditorOpen}
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          条件を編集
        </button>
      </div>
      {isEditorOpen ? (
        <div className="mt-3 rounded-xl bg-stone-50 p-3">
          <SavedPlanDateRangeField
            label={usesDateRange ? "予定期間" : "予定日"}
            startValue={startInputValue}
            endValue={endInputValue}
            usesDateRange={usesDateRange}
            onChange={(startValue, endValue) =>
              onDateChange(
                startValue,
                usesDateRange ? normalizePlanEndDate(startValue, endValue, plan.style) : ""
              )
            }
          />
          {saveStateLabel ? (
            <p
              className={`mt-2 text-xs font-bold ${
                saveState === "error" ? "text-red-700" : "text-forest-700"
              }`}
            >
              {saveStateLabel}
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-stone-500">
              日付を選ぶと自動で保存されます。
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

function SavedPlanDateRangeField({
  label,
  startValue,
  endValue,
  usesDateRange,
  onChange
}: {
  label: string;
  startValue: string;
  endValue: string;
  usesDateRange: boolean;
  onChange: (startValue: string, endValue: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const displayValue = usesDateRange
    ? `${formatPlanDateShort(startValue)} - ${formatPlanDateShort(endValue)}`
    : formatPlanDateShort(startValue);

  return (
    <div className="relative block max-w-[320px] min-w-0">
      <span className="text-xs font-bold text-stone-600">{label}</span>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative mt-1.5 flex h-[42px] w-full items-center rounded-lg border border-stone-200 bg-white px-3 pr-8 text-left text-sm font-semibold text-ink outline-none transition focus:border-forest-500"
        aria-expanded={isOpen}
      >
        <span className="block min-w-0 truncate">{displayValue}</span>
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink"
        />
      </button>
      {isOpen ? (
        <div className="absolute left-0 z-30 mt-2 w-[min(82vw,320px)] rounded-xl border border-stone-200 bg-white p-3 shadow-xl">
          <div className={usesDateRange ? "grid grid-cols-2 gap-2" : "grid gap-2"}>
            <SavedPlanNativeDateInput
              label={usesDateRange ? "開始日" : "予定日"}
              value={startValue}
              onChange={(value) =>
                onChange(
                  value,
                  usesDateRange
                    ? normalizePlanEndDate(value, endValue, "OVERNIGHT_HUT")
                    : ""
                )
              }
            />
            {usesDateRange ? (
              <SavedPlanNativeDateInput
                label="終了日"
                value={endValue}
                min={startValue}
                onChange={(value) => onChange(startValue, value)}
              />
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg bg-forest-700 text-xs font-bold text-white"
          >
            決定
          </button>
        </div>
      ) : null}
    </div>
  );
}

function SavedPlanNativeDateInput({
  label,
  value,
  min,
  onChange
}: {
  label: string;
  value: string;
  min?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="text-[11px] font-bold text-stone-500">{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 text-xs font-bold text-ink outline-none focus:border-forest-500 focus:bg-white"
      />
    </label>
  );
}

function SavePlanButton({
  planId,
  mountainSlug,
  mountainName,
  season,
  style,
  plannedDate,
  plannedEndDate,
  tripMemo,
  bringCash,
  hasMountainInsurance,
  foodWater,
  progress,
  checkedSlots,
  uncheckedPackedSlots,
  checklistOnlyIds,
  isPreparationComplete,
  userId
}: {
  planId: string | null;
  userId: string | null;
  mountainSlug: string;
  mountainName: string;
  season: MountainFoundationSeason;
  style: MountainFoundationStyle;
  plannedDate: string;
  plannedEndDate: string;
  tripMemo: string;
  bringCash: boolean;
  hasMountainInsurance: boolean;
  foodWater: PlanFoodWater;
  progress: number;
  checkedSlots: RequirementSlot[];
  uncheckedPackedSlots: RequirementSlot[];
  checklistOnlyIds: string[];
  isPreparationComplete: boolean;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSavePlan() {
    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);
    startTransition(async () => {
      let result: { id?: string; planCount?: number | null } | undefined;

      if (planId) {
        result = await updateTripPlan(formData);
      } else {
        result = await saveTripPlan(formData);
      }

      const savedPlanId = result?.id ?? planId;

      if (!planId && result?.id) {
        const analyticsProperties = {
          season,
          style,
          platform: getAnalyticsPlatform()
        };

        captureAnalyticsEventOnce({
          event: "plan_save",
          key: result.id,
          properties: analyticsProperties,
          scope: "persistent"
        });

        if (result.planCount === 2) {
          captureAnalyticsEventOnce({
            event: "second_plan_create",
            key: result.id,
            properties: analyticsProperties,
            scope: "persistent"
          });
        }

        if (isPreparationComplete) {
          captureAnalyticsEventOnce({
            event: "preparation_complete",
            key: result.id,
            properties: analyticsProperties,
            scope: "persistent"
          });
        }
      }

      if (savedPlanId) {
        writeStoredCheckedSlots(savedPlanId, checkedSlots, userId);
        writeStoredUncheckedPackedSlots(
          savedPlanId,
          uncheckedPackedSlots,
          userId
        );
        writeStoredChecklistOnlyIds(savedPlanId, checklistOnlyIds, userId);
        writeTripPlanLocalMeta(savedPlanId, {
          plannedDate,
          plannedEndDate,
          tripMemo
        }, { userId });
      }

      router.push("/dashboard");
    });
  }

  return (
    <form ref={formRef}>
      {planId ? <input type="hidden" name="id" value={planId} /> : null}
      <input type="hidden" name="mountain_slug" value={mountainSlug} />
      <input type="hidden" name="mountain_name" value={mountainName} />
      <input type="hidden" name="season" value={season} />
      <input type="hidden" name="style" value={style} />
      <input type="hidden" name="planned_date" value={plannedDate} />
      <input type="hidden" name="planned_end_date" value={plannedEndDate} />
      <input type="hidden" name="trip_memo" value={tripMemo} />
      <input type="hidden" name="bring_cash" value={bringCash ? "1" : "0"} />
      <input
        type="hidden"
        name="has_mountain_insurance"
        value={hasMountainInsurance ? "1" : "0"}
      />
      <input type="hidden" name="water_volume_ml" value={foodWater.waterVolumeMl} />
      <input
        type="hidden"
        name="trail_food_included"
        value={foodWater.trailFoodIncluded ? "1" : "0"}
      />
      <input
        type="hidden"
        name="trail_food_weight_g"
        value={foodWater.trailFoodWeightG}
      />
      <input type="hidden" name="meal_count" value={foodWater.mealCount} />
      <input type="hidden" name="meal_weight_g" value={foodWater.mealWeightG} />
      <input type="hidden" name="progress" value={progress} />
      <input
        type="hidden"
        name="checked_slots"
        value={JSON.stringify(checkedSlots)}
      />
      <input
        type="hidden"
        name="unchecked_packed_slots"
        value={JSON.stringify(uncheckedPackedSlots)}
      />
      <div className="fixed inset-x-4 bottom-[104px] z-40">
        {!planId ? (
          <p className="mb-2 text-center text-[11px] font-bold text-stone-500">
            保存するとホームの次回山行カードに反映されます。
          </p>
        ) : null}
        <button
          type="button"
          disabled={isPending}
          onClick={handleSavePlan}
          className="flex h-12 w-full items-center justify-center rounded-full bg-[#14724e] px-5 text-base font-bold text-white shadow-[0_10px_24px_rgba(20,114,78,0.3)] transition active:scale-[0.99] disabled:opacity-70"
        >
          {isPending ? "保存中..." : planId ? "変更を更新" : "計画を保存"}
        </button>
      </div>
    </form>
  );
}

function PlanHistorySection({
  plans,
  legacyPlans
}: {
  plans: SavedTripPlan[];
  legacyPlans: AIRecommendationRecord[];
}) {
  return (
    <section className="rounded-[20px] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-[#EEEDE6] pb-3">
        <h2 className="text-base font-bold text-ink">計画履歴</h2>
        {plans.length > 0 ? (
          <form action={clearTripPlans}>
            <ConfirmSubmitButton
              title="保存済みプランをすべて削除しますか？"
              description="削除すると元に戻せません。"
              confirmLabel="すべて削除する"
              pendingLabel="削除中..."
              className="rounded-full border border-red-100 px-3 py-1.5 text-[11px] font-bold text-red-700 transition active:scale-95 disabled:opacity-60"
            >
              すべて削除
            </ConfirmSubmitButton>
          </form>
        ) : null}
      </div>

      {plans.length > 0 ? (
        <div className="mt-4 space-y-3">
          {plans.map((record) => (
            <article
              key={record.id}
              className="rounded-xl border border-stone-100 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <Link
                  href={`/plan?id=${record.id}` as Route}
                  className="min-w-0 flex-1"
                >
                  <h3 className="truncate text-sm font-bold text-ink">
                    {record.mountain_name || "山行"}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-stone-500">
                    {formatSavedPlanMeta(record)}
                  </p>
                </Link>
                <form action={deleteTripPlan}>
                  <input type="hidden" name="id" value={record.id} />
                  <ConfirmSubmitButton
                    title="この計画を削除しますか？"
                    description={`${record.mountain_name || "山行"}の計画を削除します。削除すると元に戻せません。`}
                    confirmLabel="削除する"
                    pendingLabel="..."
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition active:scale-90 disabled:opacity-60"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">この計画を削除</span>
                  </ConfirmSubmitButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-stone-50 px-4 py-3 text-sm font-semibold text-stone-500">
          <p>まだ保存された計画はありません。</p>
          {legacyPlans.length > 0 ? (
            <p className="mt-2 text-xs">
              旧履歴は {legacyPlans.length.toLocaleString("ja-JP")} 件あります。
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}

function formatSavedPlanMeta(record: SavedTripPlan) {
  const parts = [
    mountainFoundationSeasonLabels[record.season],
    mountainFoundationStyleLabels[record.style],
    record.planned_date
      ? formatPlanDateRange(
          record.planned_date,
          record.planned_end_date ?? "",
          record.style
        )
      : new Date(record.created_at).toLocaleDateString("ja-JP")
  ];

  return parts.join(" / ");
}

function sanitizeDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function sanitizeMemoParam(value: string | null) {
  const trimmed = value?.trim() ?? "";

  return trimmed ? trimmed.slice(0, 200) : null;
}

function parseBooleanParam(value: string | null) {
  if (value === "1" || value === "true") {
    return true;
  }

  if (value === "0" || value === "false") {
    return false;
  }

  return null;
}

function formatPlanDate(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  }).format(date);
}

function formatPlanDateRange(
  startDate: string,
  endDate: string,
  style: MountainFoundationStyle
) {
  if (!startDate) {
    return "予定日未設定";
  }

  if (!isOvernightPlanStyle(style)) {
    return formatPlanDateShort(startDate);
  }

  return `${formatPlanDateShort(startDate)} - ${formatPlanDateShort(
    normalizePlanEndDate(startDate, endDate, style)
  )}`;
}

function normalizePlanEndDate(
  startDate: string,
  endDate: string | null | undefined,
  style: MountainFoundationStyle
) {
  if (!isOvernightPlanStyle(style) || !startDate) {
    return "";
  }

  if (!endDate) {
    return startDate;
  }

  return endDate < startDate ? startDate : endDate;
}

function isOvernightPlanStyle(style: MountainFoundationStyle) {
  return style !== "DAY_HIKE";
}

function getTodayDateValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getSavedPlanCheckedSlots(plan: SavedTripPlan | null) {
  if (!plan || !Array.isArray(plan.checked_slots)) {
    return null;
  }

  return uniqueRequirementSlots(plan.checked_slots);
}

function getSavedPlanUncheckedPackedSlots(plan: SavedTripPlan | null) {
  if (!plan || !Array.isArray(plan.unchecked_packed_slots)) {
    return null;
  }

  return uniqueRequirementSlots(plan.unchecked_packed_slots);
}

function readStoredCheckedSlots(planId: string, userId: string | null) {
  const result = readTripPlanCheckedSlots({ userId, planId });

  return result.status === "missing" ? null : uniqueRequirementSlots(result.value);
}

function writeStoredCheckedSlots(
  planId: string,
  checkedSlots: RequirementSlot[],
  userId: string | null
) {
  if (checkedSlots.length === 0) {
    removeTripPlanCheckedSlots({ userId, planId });
    return;
  }

  writeTripPlanCheckedSlots({ userId, planId, value: checkedSlots });
}

function readStoredUncheckedPackedSlots(planId: string, userId: string | null) {
  const result = readTripPlanUncheckedPackedSlots({ userId, planId });

  return result.status === "missing"
    ? null
    : uniqueRequirementSlots(result.value);
}

function writeStoredUncheckedPackedSlots(
  planId: string,
  uncheckedPackedSlots: RequirementSlot[],
  userId: string | null
) {
  writeTripPlanUncheckedPackedSlots({
    userId,
    planId,
    value: uncheckedPackedSlots
  });
}

function readStoredChecklistOnlyIds(planId: string, userId: string | null) {
  return uniqueChecklistOnlyIds(
    readTripPlanChecklistOnlyIds({ userId, planId }).value
  );
}

function writeStoredChecklistOnlyIds(
  planId: string,
  checklistOnlyIds: string[],
  userId: string | null
) {
  if (checklistOnlyIds.length === 0) {
    removeTripPlanChecklistOnlyIds({ userId, planId });
    return;
  }

  writeTripPlanChecklistOnlyIds({ userId, planId, value: checklistOnlyIds });
}

function TripPlanningResult({
  plan,
  compatibilityBySlot,
  ownedGear,
  packGearIds,
  plannedDate,
  plannedEndDate,
  isSavedPlanDetail,
  planId,
  userId,
  initialCheckedSlots = emptyCheckedSlots,
  initialUncheckedPackedSlots = emptyUncheckedPackedSlots,
  initialChecklistOnlyIds = emptyChecklistOnlyIds,
  onProgressChange,
  onPreparationCompletionChange,
  onCheckedSlotsChange,
  onUncheckedPackedSlotsChange,
  onChecklistOnlyIdsChange
}: {
  plan: PackRequirementPlan;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  ownedGear: UserGear[];
  packGearIds: string[];
  plannedDate: string;
  plannedEndDate: string;
  isSavedPlanDetail: boolean;
  planId: string | null;
  userId: string | null;
  initialCheckedSlots?: RequirementSlot[];
  initialUncheckedPackedSlots?: RequirementSlot[];
  initialChecklistOnlyIds?: string[];
  onProgressChange?: (progress: number) => void;
  onPreparationCompletionChange?: (isComplete: boolean) => void;
  onCheckedSlotsChange?: (checkedSlots: RequirementSlot[]) => void;
  onUncheckedPackedSlotsChange?: (uncheckedPackedSlots: RequirementSlot[]) => void;
  onChecklistOnlyIdsChange?: (checklistOnlyIds: string[]) => void;
}) {
  const [checkedSlots, setCheckedSlots] = useState<RequirementSlot[]>(() => {
    return filterCheckedSlotsForPlan(initialCheckedSlots, plan);
  });
  const [uncheckedPackedSlots, setUncheckedPackedSlots] = useState<
    RequirementSlot[]
  >(() => filterCheckedSlotsForPlan(initialUncheckedPackedSlots, plan));
  const [checklistOnlyIds, setChecklistOnlyIds] = useState<string[]>(() => {
    return uniqueChecklistOnlyIds(initialChecklistOnlyIds);
  });
  const initialCheckedSlotsKey = initialCheckedSlots.join("|");
  const initialUncheckedPackedSlotsKey = initialUncheckedPackedSlots.join("|");
  const initialChecklistOnlyIdsKey = initialChecklistOnlyIds.join("|");
  const checklist = buildPlanChecklist({
    plan,
    checkedSlots,
    uncheckedPackedSlots,
    checkedChecklistOnlyIds: checklistOnlyIds,
    ownedGear,
    packedGearIds: packGearIds
  });
  const preDepartureSummary = buildPreDepartureSummary(checklist);
  const notNeededItems = buildPlanNotNeededItems(plan);
  const [scanFilter, setScanFilter] = useState<ChecklistScanFilter>("ACTION");
  const hasViewedGapRef = useRef(false);
  const previousPreparationStateRef = useRef({
    planId,
    isComplete: preDepartureSummary.canComplete
  });
  const visibleCategories = filterChecklistCategoriesForScan(
    checklist.categories,
    scanFilter
  );
  const actionCategoryLabel = getChecklistScanFilterLabel(scanFilter);
  const displaySlots = dedupeDisplaySlots(plan.required_slots);

  // 「要対応」ビューでは確認済み項目を消さず、各カテゴリー下部の「確認済み」グループに
  // 残して出発前に見直せるようにする。表示のみの分割で、進捗率・保存・生成ロジックには
  // 一切手を入れない（confirmedItems は item.checked のみを対象にする）。
  const planCategoryCards: Array<{
    category: ChecklistCategory;
    confirmedItems: ChecklistItem[];
  }> =
    scanFilter === "ACTION"
      ? checklist.categories
          .map((fullCategory) => {
            const visible = visibleCategories.find(
              (candidate) => candidate.id === fullCategory.id
            );
            const confirmedItems = fullCategory.items.filter(
              (item) => item.checked
            );
            const category: ChecklistCategory =
              visible ?? { ...fullCategory, priorityGroups: [], items: [] };

            return { category, confirmedItems };
          })
          .filter(
            ({ category, confirmedItems }) =>
              category.items.length > 0 || confirmedItems.length > 0
          )
      : visibleCategories.map((category) => ({
          category,
          confirmedItems: [] as ChecklistItem[]
        }));

  useEffect(() => {
    const nextCheckedSlots = filterCheckedSlotsForPlan(initialCheckedSlots, plan);

    setCheckedSlots(nextCheckedSlots);
  }, [initialCheckedSlotsKey, plan]);

  useEffect(() => {
    const nextUncheckedPackedSlots = filterCheckedSlotsForPlan(
      initialUncheckedPackedSlots,
      plan
    );

    setUncheckedPackedSlots(nextUncheckedPackedSlots);
  }, [initialUncheckedPackedSlotsKey, plan]);

  useEffect(() => {
    const nextChecklistOnlyIds = uniqueChecklistOnlyIds(initialChecklistOnlyIds);

    setChecklistOnlyIds(nextChecklistOnlyIds);
  }, [initialChecklistOnlyIdsKey]);

  useEffect(() => {
    onProgressChange?.(checklist.summary.percent);
  }, [checklist.summary.percent, onProgressChange]);

  useEffect(() => {
    onPreparationCompletionChange?.(preDepartureSummary.canComplete);
  }, [onPreparationCompletionChange, preDepartureSummary.canComplete]);

  useEffect(() => {
    const previous = previousPreparationStateRef.current;

    if (previous.planId === planId) {
      if (planId && preDepartureSummary.canComplete && !previous.isComplete) {
        captureAnalyticsEventOnce({
          event: "preparation_complete",
          key: planId,
          properties: {
            season: plan.season,
            style: plan.style,
            platform: getAnalyticsPlatform()
          },
          scope: "persistent"
        });
      }
    }

    previousPreparationStateRef.current = {
      planId,
      isComplete: preDepartureSummary.canComplete
    };
  }, [plan, planId, preDepartureSummary.canComplete]);

  function handleToggleChecklistItem(item: ChecklistItem) {
    if (item.source === "GEAR_BACKED" && item.toggleSlots.length > 0) {
      handleToggleGearBackedItem(item);
      return;
    }

    handleToggleChecklistOnlyItem(item.id);
  }

  function handleScanFilterChange(filter: ChecklistScanFilter) {
    setScanFilter(filter);

    if (
      filter !== "MISSING" ||
      hasViewedGapRef.current ||
      preDepartureSummary.missingCount === 0
    ) {
      return;
    }

    hasViewedGapRef.current = true;
    captureAnalyticsEventOnce({
      event: "gap_view",
      key: planId ?? `${plan.season}:${plan.style}`,
      properties: {
        missing_count: preDepartureSummary.missingCount,
        season: plan.season,
        style: plan.style,
        platform: getAnalyticsPlatform()
      }
    });
  }

  function handleToggleGearBackedItem(item: ChecklistItem) {
    const slots = item.toggleSlots;

    if (slots.length === 0) {
      return;
    }

    const nextCheckedSlotSet = new Set(checkedSlots);
    const nextUncheckedPackedSlotSet = new Set(uncheckedPackedSlots);

    for (const coverage of item.slotCoverage) {
      if (item.checked) {
        nextCheckedSlotSet.delete(coverage.slot);

        if (coverage.status === "PACKED") {
          nextUncheckedPackedSlotSet.add(coverage.slot);
        }
      } else if (coverage.status === "PACKED") {
        nextUncheckedPackedSlotSet.delete(coverage.slot);
      } else {
        nextCheckedSlotSet.add(coverage.slot);
      }
    }

    const nextCheckedSlots = filterCheckedSlotsForPlan(
      Array.from(nextCheckedSlotSet),
      plan
    );
    const nextUncheckedPackedSlots = filterCheckedSlotsForPlan(
      Array.from(nextUncheckedPackedSlotSet),
      plan
    );

    setCheckedSlots(nextCheckedSlots);
    setUncheckedPackedSlots(nextUncheckedPackedSlots);

    if (planId) {
      writeStoredCheckedSlots(planId, nextCheckedSlots, userId);
      writeStoredUncheckedPackedSlots(planId, nextUncheckedPackedSlots, userId);
    }

    onCheckedSlotsChange?.(nextCheckedSlots);
    onUncheckedPackedSlotsChange?.(nextUncheckedPackedSlots);
  }

  function handleToggleChecklistOnlyItem(id: string) {
    setChecklistOnlyIds((currentIds) => {
      const nextIds = new Set(currentIds);

      if (nextIds.has(id)) {
        nextIds.delete(id);
      } else {
        nextIds.add(id);
      }

      const nextChecklistOnlyIds = uniqueChecklistOnlyIds(Array.from(nextIds));

      if (planId) {
        writeStoredChecklistOnlyIds(planId, nextChecklistOnlyIds, userId);
      }

      onChecklistOnlyIdsChange?.(nextChecklistOnlyIds);

      return nextChecklistOnlyIds;
    });
  }

  return (
    <div className="space-y-[11px]">
      <section className="space-y-[11px]">
        <div className="rounded-[20px] bg-white px-5 pt-4 pb-4 shadow-sm">
          <h2 className="border-b border-[#EEEDE6] pb-3 text-base font-bold text-ink">
            装備チェックリスト
          </h2>
          <div className="mt-4 flex">
            <ChecklistStat
              label="完成度"
              value={`${checklist.summary.percent}%`}
              divided
            />
            <ChecklistStat
              label="完了"
              value={checklist.summary.checkedCount.toLocaleString("ja-JP")}
              divided
            />
            <ChecklistStat
              label="未完了"
              value={checklist.summary.missingCount.toLocaleString("ja-JP")}
              tone="missing"
            />
          </div>
        </div>

        {/* 安全上の注意なので位置は動かさない。ただし常時展開だと
            チェックリスト本体が画面外まで押し下げられるため、既定は折りたたむ。 */}
        <details className="group rounded-[20px] bg-white px-5 py-4 shadow-sm">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="text-sm font-bold text-amber-900">
              この計画の注意事項
            </span>
            <ChevronDown className="h-5 w-5 shrink-0 text-stone-500 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-xs font-semibold leading-relaxed text-amber-900">
            このリストは山・季節・山行スタイルに基づく一般的な目安です。当日の天気予報、具体的なルート状況、入山規制の最新情報は反映されません。出発前に必ず気象情報、登山道情報、自治体・山小屋などの公式情報をご確認ください。
          </p>
        </details>

        <ChecklistScanControls
          activeFilter={scanFilter}
          summary={preDepartureSummary}
          includeAllFilter={!isSavedPlanDetail}
          onFilterChange={handleScanFilterChange}
        />

        <div className="grid gap-[11px] xl:grid-cols-[repeat(2,minmax(0,1fr))]">
          {planCategoryCards.length > 0 ? (
            planCategoryCards.map(({ category, confirmedItems }) => (
            <ChecklistCategoryCard
              key={category.id}
              category={category}
              confirmedItems={confirmedItems}
              compatibilityBySlot={compatibilityBySlot}
              onToggle={handleToggleChecklistItem}
            />
            ))
          ) : (
            <div className="rounded-[20px] bg-white p-5 text-sm font-semibold text-stone-500 shadow-sm xl:col-span-2">
              {actionCategoryLabel}の項目はありません。
            </div>
          )}
        </div>
      </section>

      {notNeededItems.length > 0 ? (
        <NotNeededItemsSection items={notNeededItems} />
      ) : null}

      {isSavedPlanDetail && planId ? (
        <AllItemsChecklistLink planId={planId} />
      ) : (
        <button
          type="button"
          onClick={() => setScanFilter("ALL")}
          className="flex w-full items-center justify-between rounded-[20px] bg-white px-5 py-4 text-left shadow-sm transition active:scale-[0.99]"
        >
          <span>
            <span className="block text-sm font-bold text-[#14724e]">
              すべての持ち物を確認
            </span>
            <span className="mt-1 block text-xs font-semibold text-stone-500">
              今回の持ち物と確認状態を一覧で見ます
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[#14724e]" aria-hidden="true" />
        </button>
      )}

      <details className="group rounded-[20px] bg-white p-5 shadow-sm">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">装備カバー状況</h2>
          <ChevronDown className="h-5 w-5 shrink-0 text-stone-500 transition group-open:rotate-180" />
        </summary>
        <PlanningNotes
          missingCount={
            preDepartureSummary.missingCount + preDepartureSummary.confirmationCount
          }
          displaySlots={displaySlots}
          compatibilityBySlot={compatibilityBySlot}
        />
      </details>
    </div>
  );
}

function SavedPlanFullChecklistView({
  plan,
  plannedDate,
  plannedEndDate,
  checkedSlots,
  uncheckedPackedSlots,
  checklistOnlyIds,
  ownedGear,
  packGearIds,
  planId
}: {
  plan: PackRequirementPlan;
  plannedDate: string;
  plannedEndDate: string;
  checkedSlots: RequirementSlot[];
  uncheckedPackedSlots: RequirementSlot[];
  checklistOnlyIds: string[];
  ownedGear: UserGear[];
  packGearIds: string[];
  planId: string;
}) {
  const checklist = buildPlanChecklist({
    plan,
    checkedSlots,
    uncheckedPackedSlots,
    checkedChecklistOnlyIds: checklistOnlyIds,
    ownedGear,
    packedGearIds: packGearIds
  });
  const summary = buildPreDepartureSummary(checklist);
  const counts = getFullChecklistCounts(checklist);

  return (
    <section className="space-y-[11px]">
      <Link
        href={`/plan?id=${planId}` as Route}
        className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#14724e] shadow-sm transition active:scale-[0.99]"
      >
        ← 計画詳細へ戻る
      </Link>

      <div className="rounded-[20px] bg-white p-5 shadow-sm">
        <p className="text-[11px] font-bold text-[#14724e]">すべての持ち物</p>
        <h1 className="mt-1 text-base font-bold tracking-normal text-ink">
          持ち物チェック表
        </h1>
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-stone-50 p-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-bold text-stone-500">
              {formatPlanDateRange(plannedDate, plannedEndDate, plan.style)}
            </p>
            <p className="mt-1 text-lg font-bold text-ink">
              {plan.mountain.name_ja}
            </p>
            <p className="mt-1 text-sm font-semibold text-stone-600">
              {mountainFoundationSeasonLabels[plan.season]} / {mountainFoundationStyleLabels[plan.style]}
            </p>
          </div>
          <span className="inline-flex w-fit rounded-full bg-forest-50 px-3 py-2 text-xs font-bold text-forest-800">
            {summary.statusLabel}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          <FullChecklistMetric label="不足" value={counts.missing} tone="missing" />
          <FullChecklistMetric label="確認する" value={counts.confirm} tone="confirm" />
          <FullChecklistMetric label="所持・パック" value={counts.covered} tone="covered" />
          <FullChecklistMetric label="確認済み" value={counts.checked} tone="checked" />
        </div>
      </div>

      <div className="space-y-[11px]">
        {checklist.categories.map((category) => (
          <FullChecklistCategory
            key={category.id}
            category={category}
          />
        ))}
      </div>

      <FullChecklistImageSaveButton
        plan={plan}
        plannedDate={plannedDate}
        plannedEndDate={plannedEndDate}
        checklist={checklist}
        summary={summary}
      />
    </section>
  );
}

function FullChecklistMetric({
  label,
  value,
  tone
}: {
  label: string;
  value: number;
  tone: "missing" | "confirm" | "covered" | "checked";
}) {
  const toneClass =
    tone === "missing"
      ? "bg-red-50 text-red-700"
      : tone === "confirm"
        ? "bg-amber-50 text-amber-800"
        : tone === "covered"
          ? "bg-forest-50 text-forest-800"
          : "bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-xl px-2 py-2.5 ${toneClass}`}>
      <p className="font-din text-lg font-bold leading-none">
        {value.toLocaleString("ja-JP")}
      </p>
      <p className="mt-1.5 text-[10px] font-bold leading-none">{label}</p>
    </div>
  );
}

function FullChecklistCategory({ category }: { category: ChecklistCategory }) {
  return (
    <section className="overflow-hidden rounded-[20px] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
        <h3 className="text-base font-bold text-ink">{category.label}</h3>
        <span className="text-xs font-bold text-stone-500">
          {category.items.length.toLocaleString("ja-JP")} 件
        </span>
      </div>
      <div className="divide-y divide-stone-100">
        {category.items.map((item) => (
          <FullChecklistRow
            key={`${category.id}-${item.id}`}
            item={item}
            categoryLabel={category.label}
          />
        ))}
      </div>
    </section>
  );
}

function FullChecklistRow({
  item,
  categoryLabel
}: {
  item: ChecklistItem;
  categoryLabel: string;
}) {
  const status = getFullChecklistItemStatus(item);

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-3">
      <span
        className={`flex h-5 w-5 items-center justify-center rounded border ${
          status.checked
            ? "border-[#14724e] bg-[#14724e] text-white"
            : "border-stone-300 bg-white text-stone-300"
        }`}
        aria-hidden="true"
      >
        {status.checked ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink">{item.label}</p>
        <p className="mt-0.5 text-[11px] font-semibold text-stone-500">
          {categoryLabel}
        </p>
      </div>
      <span className={`rounded px-2 py-1 text-[11px] font-bold ${status.className}`}>
        {status.label}
      </span>
    </div>
  );
}

function FullChecklistImageSaveButton({
  plan,
  plannedDate,
  plannedEndDate,
  checklist,
  summary
}: {
  plan: PackRequirementPlan;
  plannedDate: string;
  plannedEndDate: string;
  checklist: ReturnType<typeof buildPlanChecklist>;
  summary: PreDepartureSummary;
}) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "success" | "error">(
    "idle"
  );
  const [message, setMessage] = useState<string | null>(null);

  async function handleSaveImage() {
    setSaveState("saving");
    setMessage("保存用画像を作成しています...");

    try {
      const blob = await createChecklistImageBlob({
        plan,
        plannedDate,
        plannedEndDate,
        checklist,
        summary
      });
      const fileName = `yamajitaku-${plan.mountain.slug}-checklist.png`;
      const didShare = await shareChecklistImageIfAvailable(blob, fileName, plan);

      if (!didShare) {
        downloadChecklistImage(blob, fileName);
      }

      setSaveState("success");
      setMessage(didShare ? "共有シートを開きました。" : "画像をダウンロードしました。");
    } catch (error) {
      console.error("Checklist image save failed:", error);
      setSaveState("error");
      setMessage("画像を保存できませんでした。時間をおいてもう一度お試しください。");
    }
  }

  return (
    <section className="rounded-[20px] bg-white p-5 shadow-sm">
      <button
        type="button"
        onClick={handleSaveImage}
        disabled={saveState === "saving"}
        className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-forest-700 px-5 text-sm font-bold text-white shadow-sm transition active:scale-[0.99] disabled:cursor-wait disabled:opacity-70"
      >
        {saveState === "saving" ? "画像を作成中..." : "画像として保存"}
      </button>
      {message ? (
        <p
          className={`mt-3 rounded-lg px-3 py-2 text-sm font-bold ${
            saveState === "error"
              ? "bg-red-50 text-red-700"
              : "bg-forest-50 text-forest-800"
          }`}
        >
          {message}
        </p>
      ) : null}
    </section>
  );
}

function getFullChecklistCounts(checklist: ReturnType<typeof buildPlanChecklist>) {
  const counts = {
    missing: 0,
    confirm: 0,
    covered: 0,
    checked: 0
  };

  for (const category of checklist.categories) {
    for (const item of category.items) {
      if (item.gearStatus === "PACKED" || item.gearStatus === "OWNED") {
        counts.covered += 1;
      } else if (item.gearStatus === "MISSING" && !item.checked) {
        counts.missing += 1;
      }

      if (item.checked) {
        counts.checked += 1;
      } else {
        counts.confirm += 1;
      }
    }
  }

  return counts;
}

function getFullChecklistItemStatus(item: ChecklistItem) {
  const status = getChecklistItemStatus(item);

  if (item.gearStatus === "PACKED") {
    return {
      kind: "PACKED" as const,
      label: status.confirmationLabel
        ? `${status.label}・${status.confirmationLabel}`
        : status.label,
      checked: item.checked,
      className: status.className
    };
  }

  if (item.gearStatus === "OWNED") {
    return {
      kind: "OWNED" as const,
      label: status.confirmationLabel
        ? `${status.label}・${status.confirmationLabel}`
        : status.label,
      checked: item.checked,
      className: status.className
    };
  }

  if (item.checked) {
    return {
      kind: "CHECKED" as const,
      label: status.confirmationLabel
        ? `${status.label}・${status.confirmationLabel}`
        : status.label,
      checked: true,
      className: "bg-blue-50 text-blue-700"
    };
  }

  const actionStatus = getPreDepartureItemActionStatus(item);

  if (actionStatus === "MISSING") {
    return {
      kind: "MISSING" as const,
      label: status.label,
      checked: false,
      className: "bg-red-50 text-red-700"
    };
  }

  return {
    kind: "CONFIRM" as const,
    label: status.confirmationLabel ?? status.label,
    checked: false,
    className: "bg-stone-100 text-stone-600"
  };
}

function formatPlanDateShort(value: string) {
  return value ? value.replaceAll("-", "/") : "予定日未設定";
}

async function createChecklistImageBlob({
  plan,
  plannedDate,
  plannedEndDate,
  checklist,
  summary
}: {
  plan: PackRequirementPlan;
  plannedDate: string;
  plannedEndDate: string;
  checklist: ReturnType<typeof buildPlanChecklist>;
  summary: PreDepartureSummary;
}) {
  const rows = checklist.categories.flatMap((category) =>
    category.items.map((item) => ({
      category: category.label,
      item,
      status: getFullChecklistItemStatus(item)
    }))
  );
  const width = 1200;
  const height = Math.max(
    900,
    360 + checklist.categories.length * 70 + rows.length * 58
  );
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas context is unavailable");
  }

  context.fillStyle = "#FAFAF8";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#14724e";
  context.font = '700 30px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  context.fillText("YAMAJITAKU", 72, 76);
  context.fillStyle = "#111827";
  context.font = '700 48px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  drawTruncatedCanvasText(context, plan.mountain.name_ja, 72, 145, 720);
  context.font = '600 28px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  context.fillStyle = "#57534E";
  context.fillText(
    `${mountainFoundationSeasonLabels[plan.season]} / ${mountainFoundationStyleLabels[plan.style]}  ${formatPlanDateRange(plannedDate, plannedEndDate, plan.style)}`,
    72,
    194
  );
  context.fillStyle = "#EAF4EE";
  roundRect(context, 72, 226, width - 144, 86, 24);
  context.fill();
  context.fillStyle = "#14724e";
  context.font = '700 28px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
  drawTruncatedCanvasText(context, summary.statusLabel, 104, 278, 900);

  const counts = getFullChecklistCounts(checklist);
  const metrics = [
    ["不足", counts.missing, "#B91C1C"],
    ["確認する", counts.confirm, "#92400E"],
    ["所持・パック", counts.covered, "#14724e"],
    ["確認済み", counts.checked, "#1D4ED8"]
  ] as const;
  const metricWidth = (width - 144 - 36) / 4;

  for (const [index, metric] of metrics.entries()) {
    const x = 72 + index * (metricWidth + 12);
    context.fillStyle = "#FFFFFF";
    roundRect(context, x, 338, metricWidth, 86, 18);
    context.fill();
    context.fillStyle = metric[2];
    context.font = '700 24px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    context.fillText(metric[0], x + 22, 372);
    context.font = '700 34px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    context.fillText(metric[1].toLocaleString("ja-JP"), x + 22, 410);
  }

  let y = 484;

  for (const category of checklist.categories) {
    context.fillStyle = "#111827";
    context.font = '700 30px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    context.fillText(category.label, 72, y);
    context.fillStyle = "#78716C";
    context.font = '600 22px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
    context.fillText(`${category.items.length.toLocaleString("ja-JP")} 件`, width - 170, y);
    y += 24;

    for (const item of category.items) {
      const status = getFullChecklistItemStatus(item);
      context.fillStyle = "#FFFFFF";
      roundRect(context, 72, y, width - 144, 50, 14);
      context.fill();
      context.strokeStyle = status.checked ? "#14724e" : "#D6D3D1";
      context.lineWidth = 3;
      context.strokeRect(96, y + 13, 24, 24);

      if (status.checked) {
        context.fillStyle = "#14724e";
        context.fillRect(96, y + 13, 24, 24);
        context.strokeStyle = "#FFFFFF";
        context.lineWidth = 4;
        context.beginPath();
        context.moveTo(101, y + 25);
        context.lineTo(107, y + 31);
        context.lineTo(118, y + 19);
        context.stroke();
      }

      context.fillStyle = "#111827";
      context.font = '700 22px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
      drawTruncatedCanvasText(context, item.label, 140, y + 32, 560);
      context.fillStyle = "#78716C";
      context.font = '600 18px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
      drawTruncatedCanvasText(context, category.label, 710, y + 31, 170);
      context.fillStyle = getChecklistStatusCanvasColor(status.kind);
      context.font = '700 18px -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
      drawTruncatedCanvasText(context, status.label, 910, y + 31, 170);
      y += 58;
    }

    y += 26;
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to create image"));
      }
    }, "image/png");
  });
}

async function shareChecklistImageIfAvailable(
  blob: Blob,
  fileName: string,
  plan: PackRequirementPlan
) {
  if (typeof File === "undefined" || !navigator.share) {
    return false;
  }

  const file = new File([blob], fileName, { type: "image/png" });
  const shareData = {
    files: [file],
    title: `${plan.mountain.name_ja} 持ち物チェック表`,
    text: "山支度の持ち物チェック表"
  };

  if (navigator.canShare && !navigator.canShare(shareData)) {
    return false;
  }

  await navigator.share(shareData);
  return true;
}

function downloadChecklistImage(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function drawTruncatedCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number
) {
  if (context.measureText(text).width <= maxWidth) {
    context.fillText(text, x, y);
    return;
  }

  let nextText = text;

  while (nextText.length > 1 && context.measureText(`${nextText}...`).width > maxWidth) {
    nextText = nextText.slice(0, -1);
  }

  context.fillText(`${nextText}...`, x, y);
}

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function getChecklistStatusCanvasColor(
  kind: ReturnType<typeof getFullChecklistItemStatus>["kind"]
) {
  if (kind === "MISSING") {
    return "#B91C1C";
  }

  if (kind === "CONFIRM") {
    return "#92400E";
  }

  if (kind === "OWNED") {
    return "#14724e";
  }

  if (kind === "PACKED") {
    return "#14724e";
  }

  return "#1D4ED8";
}

function uniqueRequirementSlots(values: readonly unknown[]) {
  const slots: RequirementSlot[] = [];

  for (const value of values) {
    if (
      isSupportedRequirementSlot(value) &&
      !slots.includes(value as RequirementSlot)
    ) {
      slots.push(value as RequirementSlot);
    }
  }

  return slots;
}

function uniqueChecklistOnlyIds(values: readonly unknown[]) {
  const ids: string[] = [];

  for (const value of values) {
    if (isSupportedChecklistOnlyId(value) && !ids.includes(value)) {
      ids.push(value);
    }
  }

  return ids;
}

function dedupeDisplaySlots(
  slots: readonly PackRequirementSlotPlan[]
): DisplayRequirementSlotPlan[] {
  const displaySlots = new Map<string, DisplayRequirementSlotPlan>();

  for (const slotPlan of slots) {
    const displayKey = getRequirementSlotDisplayKey(slotPlan.slot);
    const existingSlot = displaySlots.get(displayKey);

    if (existingSlot) {
      existingSlot.slots.push(slotPlan.slot);

      if (slotPlan.coverage_status === "MISSING") {
        existingSlot.missingSlots.push(slotPlan.slot);
      }

      existingSlot.coverage_status =
        existingSlot.coverage_status === "COVERED" &&
        slotPlan.coverage_status === "COVERED"
          ? "COVERED"
          : "MISSING";
      existingSlot.matching_owned_gear = uniqueGearMatches([
        ...existingSlot.matching_owned_gear,
        ...slotPlan.matching_owned_gear
      ]);
      continue;
    }

    displaySlots.set(displayKey, {
      ...slotPlan,
      displayKey,
      slots: [slotPlan.slot],
      missingSlots: slotPlan.coverage_status === "MISSING" ? [slotPlan.slot] : []
    });
  }

  return Array.from(displaySlots.values());
}

function getRequirementSlotDisplayKey(slot: RequirementSlot) {
  if (slot === "WATER_STORAGE" || slot === "WATER_TREATMENT") {
    return "WATER";
  }

  if (slot === "RAIN_JACKET" || slot === "RAIN_PANTS") {
    return "RAIN_GEAR";
  }

  return slot;
}

function uniqueGearMatches(matches: GearMatchingOwnedGearMatch[]) {
  const gearById = new Map<string, GearMatchingOwnedGearMatch>();

  for (const match of matches) {
    gearById.set(match.id, match);
  }

  return Array.from(gearById.values());
}

function mergeGearMatchingConfidence(matches: GearMatchingResult[]) {
  if (matches.some((match) => match.confidence === "LOW")) {
    return "LOW";
  }

  if (matches.some((match) => match.confidence === "MEDIUM")) {
    return "MEDIUM";
  }

  return "HIGH";
}

function AllItemsChecklistLink({ planId }: { planId: string }) {
  return (
    <Link
      href={`/plan?id=${planId}&view=checklist` as Route}
      className="flex items-center justify-between rounded-[20px] bg-white px-5 py-4 text-left shadow-sm transition active:scale-[0.99]"
    >
      <span>
        <span className="block text-sm font-bold text-[#14724e]">
          すべての持ち物を確認
        </span>
        <span className="mt-1 block text-xs font-semibold text-stone-500">
          今回の持ち物と確認状態を一覧で見ます
        </span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[#14724e]" aria-hidden="true" />
    </Link>
  );
}

function ChecklistScanControls({
  activeFilter,
  summary,
  includeAllFilter,
  onFilterChange
}: {
  activeFilter: ChecklistScanFilter;
  summary: PreDepartureSummary;
  includeAllFilter: boolean;
  onFilterChange: (filter: ChecklistScanFilter) => void;
}) {
  const filters: Array<{
    value: ChecklistScanFilter;
    label: string;
    count?: number;
  }> = [
    {
      value: "ACTION",
      label: "要対応",
      count: summary.missingCount + summary.confirmationCount
    },
    { value: "MISSING", label: "不足のみ", count: summary.missingCount },
    { value: "CONFIRM", label: "未確認のみ", count: summary.confirmationCount },
    {
      value: "IMPORTANT",
      label: "重要のみ",
      count: summary.importantConfirmationCount
    }
  ];
  // 「すべての持ち物」は、この直下に同じ役割の大きなボタンがあるため
  // チップからは外す(includeAllFilter は呼び出し側の互換のために残す)。
  void includeAllFilter;
  const visibleFilters = filters;

  return (
    <div className="rounded-[20px] bg-white p-3 shadow-sm">
      <div className="hide-scrollbar flex gap-2 overflow-x-auto">
        {visibleFilters.map((filter) => {
          const isActive = activeFilter === filter.value;

          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => onFilterChange(filter.value)}
              className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold transition ${
                isActive ? "bg-[#14724e] text-white" : "bg-stone-100 text-stone-700"
              }`}
            >
              {filter.label}
              {typeof filter.count === "number" ? (
                <span className="ml-1">{filter.count.toLocaleString("ja-JP")}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function filterChecklistCategoriesForScan(
  categories: ChecklistCategory[],
  filter: ChecklistScanFilter
): ChecklistCategory[] {
  if (filter === "ALL") {
    return categories;
  }

  return categories
    .map((category) => {
      const filteredItems = category.items.filter((item) => {
        const actionStatus = getPreDepartureItemActionStatus(item);
        const isImportant = isImportantPreDepartureItem(category, item);

        if (filter === "ACTION") {
          return actionStatus !== "DONE";
        }

        if (filter === "MISSING") {
          return actionStatus === "MISSING";
        }

        if (filter === "CONFIRM") {
          return actionStatus === "CONFIRM";
        }

        return isImportant && actionStatus !== "DONE";
      });

      return {
        ...category,
        priorityGroups: category.priorityGroups
          .map((group) => ({
            ...group,
            items: group.items.filter((item) => filteredItems.includes(item))
          }))
          .filter((group) => group.items.length > 0),
        items: filteredItems
      };
    })
    .filter((category) => category.items.length > 0);
}

function getChecklistScanFilterLabel(filter: ChecklistScanFilter) {
  const labels: Record<ChecklistScanFilter, string> = {
    ACTION: "要対応",
    MISSING: "不足",
    CONFIRM: "未確認",
    IMPORTANT: "重要",
    ALL: "すべての持ち物"
  };

  return labels[filter];
}

function NotNeededItemsSection({ items }: { items: PlanNotNeededItem[] }) {
  return (
    <section className="rounded-[20px] bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-forest-700" aria-hidden="true" />
        <h2 className="text-sm font-bold text-ink">今回不要なもの</h2>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-[repeat(2,minmax(0,1fr))]">
        {items.map((item) => (
          <div
            key={item.label}
            className="min-w-0 rounded-xl border border-stone-100 bg-stone-50 px-3 py-2"
          >
            <p className="text-sm font-bold text-ink">{item.label}</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-stone-500">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function buildMountainBrief(plan: PackRequirementPlan) {
  const { mountain } = plan;
  const lines = [
    `${formatMountainStatus(mountain.is_hyakumeizan)}標高${mountain.elevation_m.toLocaleString("ja-JP")}mの山です。`,
    getMountainConditionLine(plan),
    `本チェックリストは現在の${mountainFoundationStyleLabels[plan.style]}計画に基づいています。`
  ];

  return lines.filter(Boolean).slice(0, 4);
}

function formatMountainStatus(isHyakumeizan: boolean) {
  return isHyakumeizan ? "日本百名山の一座で、" : "";
}

function getMountainConditionLine(plan: PackRequirementPlan) {
  const { mountain, season } = plan;

  if (mountain.volcanic_risk === "ACTIVE_RESTRICTED") {
    return "火山情報と入山規制を確認し、行動判断を慎重に行う必要があります。";
  }

  if (mountain.alpine_environment === "HIGH_ALPINE_EXPOSED") {
    return "稜線や高所では天候変化が大きく、防寒と雨具の確認が重要です。";
  }

  if (mountain.alpine_environment === "ABOVE_TREELINE") {
    return "森林限界を越える区間では風雨と低温への備えが必要です。";
  }

  if (
    mountain.snow_or_ice_risk === "LIKELY" ||
    mountain.snow_or_ice_risk === "WINTER_ALPINE"
  ) {
    return "雪や凍結を前提に、足まわりと防寒装備を丁寧に確認してください。";
  }

  if (
    mountain.snow_or_ice_risk === "SEASONAL_PATCHES" &&
    (season === "SPRING" || season === "AUTUMN" || season === "WINTER")
  ) {
    return "季節により残雪や凍結が出るため、直前の登山道状況を確認してください。";
  }

  if (mountain.route_seriousness === "HIGH" || mountain.route_seriousness === "EXTREME") {
    return "行動時間とエスケープルートを確認し、余裕のある準備が必要です。";
  }

  return "天候変化と行動時間を確認し、基本装備を一つずつ準備してください。";
}

function ChecklistStat({
  label,
  value,
  tone = "neutral",
  divided = false
}: {
  label: string;
  value: string;
  tone?: "neutral" | "missing";
  divided?: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-2 px-1.5 pt-1 text-center max-[359px]:px-1 ${
        divided ? "border-r border-gray-100" : ""
      }`}
    >
      <p
        className={`whitespace-nowrap font-din text-[22px] font-bold leading-none max-[389px]:text-[19px] max-[359px]:text-[17px] ${
          tone === "missing" ? "text-red-700" : "text-black"
        }`}
      >
        {value}
      </p>
      <p className="text-[11px] font-bold leading-none text-[#8a8580]">{label}</p>
    </div>
  );
}

function ChecklistCategoryCard({
  category,
  confirmedItems = [],
  compatibilityBySlot,
  onToggle
}: {
  category: ChecklistCategory;
  confirmedItems?: ChecklistItem[];
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  onToggle: (item: ChecklistItem) => void;
}) {
  const missingCount = category.items.filter(
    (item) => getPreDepartureItemActionStatus(item) === "MISSING"
  ).length;

  return (
    <article className="min-w-0 rounded-[20px] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink">{category.label}</h3>
          <p className="mt-1 text-xs font-semibold text-stone-500">
            {category.progress.checkedCount.toLocaleString("ja-JP")} 完了
            {missingCount > 0 ? (
              <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-red-700">
                不足 {missingCount.toLocaleString("ja-JP")}
              </span>
            ) : (
              <span className="ml-2 rounded-full bg-forest-50 px-2 py-0.5 text-forest-800">
                不足なし
              </span>
            )}
          </p>
        </div>
        <div className="text-right">
          <p className="font-din text-lg font-bold leading-none text-[#14724e]">
            {category.progress.percent}%
          </p>
          <div className="mt-2 h-1.5 w-20 overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-[#4E914A]"
              style={{ width: `${category.progress.percent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {category.priorityGroups.map((group) => (
          <div key={group.priority}>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-stone-100" />
              <p className="text-xs font-semibold text-stone-500">
                {checklistPriorityLabels[group.priority]}
              </p>
              <span className="h-px flex-1 bg-stone-100" />
            </div>
            <div className="space-y-2">
              {group.items.map((item) => (
                <ChecklistItemRow
                  key={item.id}
                  item={item}
                  compatibilityBySlot={compatibilityBySlot}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ))}

        {confirmedItems.length > 0 ? (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px flex-1 bg-stone-100" />
              <p className="text-xs font-semibold text-stone-400">
                完了済み {confirmedItems.length.toLocaleString("ja-JP")}
              </p>
              <span className="h-px flex-1 bg-stone-100" />
            </div>
            <div className="space-y-2">
              {confirmedItems.map((item) => (
                <ConfirmedChecklistItemRow
                  key={item.id}
                  item={item}
                  onToggle={onToggle}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function ChecklistItemRow({
  item,
  compatibilityBySlot,
  onToggle
}: {
  item: ChecklistItem;
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
  onToggle: (item: ChecklistItem) => void;
}) {
  const canToggle = item.source === "CHECKLIST_ONLY" || item.source === "GEAR_BACKED";
  const ItemIcon = checklistItemIcons[item.icon];
  const status = getChecklistItemStatus(item);
  const matchingInsight = getChecklistItemMatchingInsight(item, compatibilityBySlot);

  return (
    <label
      className={`flex min-h-14 gap-3 rounded-xl border px-3 py-2.5 transition ${
        item.checked
          ? "border-forest-100 bg-forest-50/70"
          : "border-stone-100 bg-white [@media(hover:hover)]:hover:border-stone-200"
      } ${canToggle ? "cursor-pointer" : ""}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={item.checked}
        disabled={!canToggle}
        onChange={() => onToggle(item)}
      />
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-700">
        <ItemIcon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
          item.checked
            ? "border-[#14724e] bg-[#14724e] text-white"
            : "border-stone-300 bg-white text-stone-400"
        }`}
      >
        {item.checked ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <CircleDashed className="h-3.5 w-3.5" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-ink">{item.label}</span>
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>
            {status.label}
          </span>
          {status.confirmationLabel ? (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.confirmationClassName}`}
            >
              {status.confirmationLabel}
            </span>
          ) : null}
        </span>
        {item.matchingOwnedGear.length > 0 ? (
          <span className="mt-1 block truncate text-xs font-medium text-stone-500">
            {item.matchingOwnedGear.map(formatOwnedGearName).join(" / ")}
          </span>
        ) : null}
        {matchingInsight ? (
          <span className="mt-1 block text-xs font-medium leading-5 text-forest-800">
            {matchingInsight.coverage}
          </span>
        ) : null}
        {matchingInsight?.caution ? (
          <span className="mt-1 block rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-medium leading-5 text-amber-800">
            {matchingInsight.caution}
          </span>
        ) : null}
        <span className="mt-1 block text-xs font-medium leading-5 text-stone-500">
          {item.reason}
        </span>
      </span>
    </label>
  );
}

// 完了済み項目の弱めた表示。所持済みと手動確認済みは表示上区別し、
// 中身は同じ onToggle を使うので、手動確認はタップで取り消せる。
function ConfirmedChecklistItemRow({
  item,
  onToggle
}: {
  item: ChecklistItem;
  onToggle: (item: ChecklistItem) => void;
}) {
  const canToggle = item.source === "CHECKLIST_ONLY" || item.source === "GEAR_BACKED";
  const status = getChecklistItemStatus(item);

  return (
    <label
      className={`flex items-center gap-2.5 rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 transition ${
        canToggle ? "cursor-pointer hover:border-stone-200" : ""
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={item.checked}
        disabled={!canToggle}
        onChange={() => onToggle(item)}
      />
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-stone-300 bg-stone-200 text-stone-500">
        <Check className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-stone-400">
        {item.label}
      </span>
      <span className="flex shrink-0 flex-wrap justify-end gap-1">
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.className}`}>
          {status.label}
        </span>
        {status.confirmationLabel ? (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${status.confirmationClassName}`}
          >
            {status.confirmationLabel}
          </span>
        ) : null}
      </span>
    </label>
  );
}

const checklistItemIcons: Record<ChecklistItemIcon, LucideIcon> = {
  baseLayer: Shirt,
  midLayer: Shirt,
  insulation: Snowflake,
  rainwear: CloudRain,
  hat: Sparkles,
  gloves: Hand,
  gaiters: Footprints,
  backpack: Backpack,
  trekkingPoles: Footprints,
  sunglasses: Glasses,
  water: Droplets,
  trailFood: Cookie,
  meal: Soup,
  stove: CookingPot,
  cookPot: Utensils,
  fuel: PlugZap,
  navigationApp: Navigation,
  mapCompass: Compass,
  headlamp: Lamp,
  battery: Battery,
  firstAid: BriefcaseMedical,
  insurance: IdCard,
  whistle: Volume2,
  emergencySheet: ShieldAlert,
  helmet: HardHat,
  traction: Zap,
  crampons: Snowflake,
  iceAxe: Axe,
  bearProtection: Bell,
  riverShoes: Footprints,
  portableToilet: Toilet,
  tent: Tent,
  sleepingBag: Bed,
  sleepingPad: Bed,
  pegs: Hammer,
  groundsheet: MapIcon,
  innerSheet: House,
  toiletries: Sparkles,
  earplugs: Bean
};

function getChecklistItemStatus(item: ChecklistItem) {
  if (item.gearStatus === "PACKED") {
    return {
      label: "パック済み",
      className: "bg-forest-100 text-forest-800",
      confirmationLabel: item.checked ? "確認済み" : "未確認",
      confirmationClassName: item.checked
        ? "bg-blue-50 text-blue-700"
        : "bg-stone-100 text-stone-600"
    };
  }

  if (item.gearStatus === "OWNED") {
    return {
      label: "所持済み",
      className: "bg-forest-50 text-forest-800",
      confirmationLabel: item.checked ? "確認済み" : "未確認",
      confirmationClassName: item.checked
        ? "bg-blue-50 text-blue-700"
        : "bg-stone-100 text-stone-600"
    };
  }

  if (item.source === "GEAR_BACKED" && item.checked) {
    return {
      label: "対応済み",
      className: "bg-blue-50 text-blue-700"
    };
  }

  if (item.source === "GEAR_BACKED") {
    return {
      label: "不足",
      className: "bg-red-50 text-red-700"
    };
  }

  if (item.checked) {
    return {
      label: "確認済み",
      className: "bg-blue-50 text-blue-700"
    };
  }

  return {
    label: "確認する",
    className: "bg-stone-100 text-stone-600"
  };
}

function getChecklistItemMatchingInsight(
  item: ChecklistItem,
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>
) {
  if (item.matchingOwnedGear.length === 0) {
    return null;
  }

  const matchedResults = item.slots
    .map((slot) => compatibilityBySlot[slot])
    .filter((match): match is GearMatchingResult => Boolean(match));
  const confidence =
    matchedResults.length > 0 ? mergeGearMatchingConfidence(matchedResults) : "HIGH";
  const firstGear = item.matchingOwnedGear[0];
  const classification =
    firstGear.gear_subcategories?.name_ja ??
    firstGear.gear_categories?.name_ja ??
    "登録ギア";
  const coverage =
    item.matchingOwnedGear.length > 1
      ? `${classification}など ${item.matchingOwnedGear.length.toLocaleString("ja-JP")} 点の登録ギアで、${item.label}をカバーしています。`
      : `${classification}として登録されているため、${item.label}をカバーしています。`;
  const hasAmbiguity = matchedResults.some((match) => match.ambiguous_cases.length > 0);
  const caution =
    confidence === "HIGH" && !hasAmbiguity
      ? null
      : "分類が近いため候補にしています。出発前に用途を確認してください。";

  return {
    coverage,
    caution
  };
}

function PlanningNotes({
  missingCount,
  displaySlots,
  compatibilityBySlot
}: {
  missingCount: number;
  displaySlots: DisplayRequirementSlotPlan[];
  compatibilityBySlot: Partial<Record<RequirementSlot, GearMatchingResult>>;
}) {
  const ambiguousSlots = displaySlots.filter((slotPlan) => {
    return slotPlan.slots.some((slot) => {
      return (compatibilityBySlot[slot]?.ambiguous_cases.length ?? 0) > 0;
    });
  });

  return (
    <div className="mt-4 space-y-2">
      {missingCount > 0 ? (
        <p className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-900">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>不足・未確認の項目を先に確認してください: {missingCount.toLocaleString("ja-JP")} 件</span>
        </p>
      ) : (
        <p className="flex items-start gap-2 rounded-lg bg-forest-50 px-3 py-2 text-sm font-medium text-forest-900">
          <Check className="mt-0.5 h-4 w-4 shrink-0" />
          <span>必要な装備スロットはすべてカバーされています。</span>
        </p>
      )}
      {ambiguousSlots.length > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
          確認が必要な分類: {ambiguousSlots.map((slot) => requirementSlotLabels[slot.slot]).join(" / ")}
        </p>
      ) : null}
    </div>
  );
}

function formatOwnedGearName(gear: GearMatchingOwnedGearMatch) {
  return formatDisplayGearName({
    brand: gear.brand,
    model: gear.model,
    name: gear.name
  });
}

function formatDisplayGearName({
  brand,
  model,
  name
}: {
  brand: string | null;
  model: string | null;
  name: string | null;
}) {
  const primaryName = [brand, model].filter(Boolean).join(" ").trim();

  if (primaryName && name && !primaryName.includes(name)) {
    return `${primaryName}（${name}）`;
  }

  return primaryName || name || "登録ギア";
}
